"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  SOCKET_EVENTS,
  type ChatNewMessagePayload,
  type ParticipantMediaState,
  type PresenceUserJoinedPayload,
  type PresenceUserLeftPayload,
  type RoomErrorPayload,
  type RoomParticipantsPayload,
  type RtcAnswerPayload,
  type RtcConnectionStatePayload,
  type RtcIceCandidatePayload,
  type RtcOfferPayload,
  type RtcPeerReadyPayload,
  type UserIdentity,
} from "@streamify/shared";
import { toast } from "sonner";

import { sendChatMessage } from "@/features/chat/services/chat-socket-service";
import {
  emitMediaState,
  emitScreenShare,
  joinRoomRequest,
  leaveRoomRequest,
} from "@/features/room/services/room-socket-service";
import { useRoomStore } from "@/features/room/store/room-store";
import { fetchRtcConfiguration } from "@/features/rtc/services/rtc-config-service";
import { LocalMediaManager } from "@/features/rtc/services/local-media-manager";
import { MeshPeerClient } from "@/features/rtc/services/mesh-peer-client";
import { ROUTES } from "@/shared/constants/routes";
import { clientEnv } from "@/shared/lib/env";
import { disconnectSocket, getSocket } from "@/shared/lib/socket";

interface UseRoomSessionResult {
  copyRoomLink: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}

export function useRoomSession(roomId: string, identity: UserIdentity): UseRoomSessionResult {
  const router = useRouter();
  const { state, dispatch } = useRoomStore();
  const socket = useMemo(() => getSocket(), []);
  const meshRef = useRef<MeshPeerClient | null>(null);
  const mediaManagerRef = useRef<LocalMediaManager | null>(null);
  const hasLeftRoomRef = useRef(false);

  const syncLocalMedia = useCallback(
    (mediaState: ParticipantMediaState) => {
      const mediaManager = mediaManagerRef.current;
      if (!mediaManager) {
        return;
      }

      const previewStream = mediaManager.getPreviewStream();
      const outgoingStream = mediaManager.getOutgoingStream();

      dispatch({
        type: "participants/set-stream",
        payload: {
          userId: identity.userId,
          stream: previewStream,
        },
      });
      dispatch({
        type: "participants/set-media",
        payload: {
          userId: identity.userId,
          media: mediaState,
        },
      });

      meshRef.current?.updateLocalStream(outgoingStream);

      if (socket.connected) {
        emitMediaState(socket, {
          roomId,
          userId: identity.userId,
          media: mediaState,
        });
      }
    },
    [dispatch, identity.userId, roomId, socket],
  );

  useEffect(() => {
    hasLeftRoomRef.current = false;
    dispatch({ type: "session/set-current-user", payload: identity });
    dispatch({ type: "session/set-status", payload: "preparing" });

    const mediaManager = new LocalMediaManager();
    mediaManagerRef.current = mediaManager;

    let disposed = false;

    const handleSocketConnect = () => {
      dispatch({ type: "session/set-socket-connected", payload: true });
    };
    const handleSocketDisconnect = () => {
      dispatch({ type: "session/set-socket-connected", payload: false });
    };
    const handleRoomError = (error: RoomErrorPayload) => {
      dispatch({ type: "session/set-room-error", payload: error });
      toast.error(error.message);
    };
    const handleParticipants = (payload: RoomParticipantsPayload) => {
      dispatch({ type: "participants/set", payload: payload.participants });
    };
    const handleUserJoined = (payload: PresenceUserJoinedPayload) => {
      dispatch({ type: "participants/upsert", payload: payload.participant });
      toast.success(`${payload.participant.displayName} joined the room.`);
    };
    const handleUserLeft = (payload: PresenceUserLeftPayload) => {
      meshRef.current?.removePeer(payload.userId);
      dispatch({ type: "participants/remove", payload: { userId: payload.userId } });
      toast.message(`${payload.displayName} left the room.`);
    };
    const handleChatMessage = (payload: ChatNewMessagePayload) => {
      dispatch({ type: "messages/add", payload: payload.message });
    };
    const handlePeerReady = async (payload: RtcPeerReadyPayload) => {
      if (payload.user.userId === identity.userId) {
        return;
      }

      await meshRef.current?.createOffer(payload.user.userId);
    };
    const handleOffer = (payload: RtcOfferPayload) => {
      if (payload.toUserId !== identity.userId) {
        return;
      }

      void meshRef.current?.handleOffer(payload);
    };
    const handleAnswer = (payload: RtcAnswerPayload) => {
      if (payload.toUserId !== identity.userId) {
        return;
      }

      void meshRef.current?.handleAnswer(payload);
    };
    const handleIceCandidate = (payload: RtcIceCandidatePayload) => {
      if (payload.toUserId !== identity.userId) {
        return;
      }

      void meshRef.current?.handleIceCandidate(payload);
    };
    const handleRemoteConnectionState = (payload: RtcConnectionStatePayload) => {
      if (payload.toUserId !== identity.userId) {
        return;
      }

      dispatch({
        type: "participants/set-connection-state",
        payload: {
          userId: payload.fromUserId,
          connectionState: payload.state,
        },
      });
    };

    const bootstrapRoom = async () => {
      try {
        const [rtcConfig, mediaBootstrap] = await Promise.all([
          fetchRtcConfiguration(),
          mediaManager.initialize(),
        ]);

        if (disposed) {
          return;
        }

        if (mediaBootstrap.error) {
          dispatch({ type: "session/set-media-error", payload: mediaBootstrap.error });
          toast.warning(mediaBootstrap.error);
        }

        dispatch({
          type: "participants/set-stream",
          payload: {
            userId: identity.userId,
            stream: mediaBootstrap.previewStream,
          },
        });

        meshRef.current = new MeshPeerClient({
          roomId,
          selfUserId: identity.userId,
          iceServers: rtcConfig.iceServers as RTCIceServer[],
          localStream: mediaBootstrap.outgoingStream,
          onRemoteStream: (userId, stream) => {
            dispatch({
              type: "participants/set-stream",
              payload: {
                userId,
                stream,
              },
            });
          },
          onConnectionStateChange: (userId, connectionState) => {
            dispatch({
              type: "participants/set-connection-state",
              payload: {
                userId,
                connectionState,
              },
            });

            if (socket.connected) {
              socket.emit(SOCKET_EVENTS.RTC.CONNECTION_STATE, {
                roomId,
                fromUserId: identity.userId,
                toUserId: userId,
                state: connectionState,
              });
            }
          },
          onSignalOffer: (payload) => socket.emit(SOCKET_EVENTS.RTC.OFFER, payload),
          onSignalAnswer: (payload) => socket.emit(SOCKET_EVENTS.RTC.ANSWER, payload),
          onIceCandidate: (payload) => socket.emit(SOCKET_EVENTS.RTC.ICE_CANDIDATE, payload),
        });

        mediaManager.onScreenShareEnded = () => {
          const nextState = mediaManager.getMediaState();
          syncLocalMedia(nextState);
          emitScreenShare(socket, false, {
            roomId,
            userId: identity.userId,
          });
        };

        socket.on("connect", handleSocketConnect);
        socket.on("disconnect", handleSocketDisconnect);
        socket.on(SOCKET_EVENTS.ROOM.ERROR, handleRoomError);
        socket.on(SOCKET_EVENTS.ROOM.PARTICIPANTS, handleParticipants);
        socket.on(SOCKET_EVENTS.PRESENCE.USER_JOINED, handleUserJoined);
        socket.on(SOCKET_EVENTS.PRESENCE.USER_LEFT, handleUserLeft);
        socket.on(SOCKET_EVENTS.CHAT.NEW_MESSAGE, handleChatMessage);
        socket.on(SOCKET_EVENTS.RTC.PEER_READY, handlePeerReady);
        socket.on(SOCKET_EVENTS.RTC.OFFER, handleOffer);
        socket.on(SOCKET_EVENTS.RTC.ANSWER, handleAnswer);
        socket.on(SOCKET_EVENTS.RTC.ICE_CANDIDATE, handleIceCandidate);
        socket.on(SOCKET_EVENTS.RTC.CONNECTION_STATE, handleRemoteConnectionState);

        dispatch({ type: "session/set-status", payload: "joining" });
        const joinedRoom = await joinRoomRequest(socket, {
          roomId,
          user: identity,
        });

        if (disposed) {
          return;
        }

        dispatch({ type: "participants/set", payload: joinedRoom.participants });
        dispatch({ type: "session/set-room-error", payload: null });
        dispatch({ type: "session/set-status", payload: "connected" });
        dispatch({ type: "session/set-socket-connected", payload: socket.connected });
        syncLocalMedia(mediaManager.getMediaState());

        socket.emit(SOCKET_EVENTS.RTC.PEER_READY, {
          roomId,
          user: identity,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to join the room.";
        dispatch({
          type: "session/set-room-error",
          payload: {
            code: "SERVER_ERROR",
            message,
          },
        });
        dispatch({ type: "session/set-status", payload: "error" });
        toast.error(message);
      }
    };

    void bootstrapRoom();

    return () => {
      disposed = true;
      socket.off("connect", handleSocketConnect);
      socket.off("disconnect", handleSocketDisconnect);
      socket.off(SOCKET_EVENTS.ROOM.ERROR, handleRoomError);
      socket.off(SOCKET_EVENTS.ROOM.PARTICIPANTS, handleParticipants);
      socket.off(SOCKET_EVENTS.PRESENCE.USER_JOINED, handleUserJoined);
      socket.off(SOCKET_EVENTS.PRESENCE.USER_LEFT, handleUserLeft);
      socket.off(SOCKET_EVENTS.CHAT.NEW_MESSAGE, handleChatMessage);
      socket.off(SOCKET_EVENTS.RTC.PEER_READY, handlePeerReady);
      socket.off(SOCKET_EVENTS.RTC.OFFER, handleOffer);
      socket.off(SOCKET_EVENTS.RTC.ANSWER, handleAnswer);
      socket.off(SOCKET_EVENTS.RTC.ICE_CANDIDATE, handleIceCandidate);
      socket.off(SOCKET_EVENTS.RTC.CONNECTION_STATE, handleRemoteConnectionState);
      meshRef.current?.destroy();
      meshRef.current = null;
      mediaManagerRef.current?.dispose();
      mediaManagerRef.current = null;
      disconnectSocket();
    };
  }, [dispatch, identity, roomId, socket, syncLocalMedia]);

  useEffect(() => {
    const activeScreenShare = Object.values(state.participants).find(
      (participant) => participant.media.screenSharing,
    );

    if (activeScreenShare && state.pinnedUserId !== activeScreenShare.userId) {
      dispatch({ type: "ui/set-pinned", payload: activeScreenShare.userId });
      return;
    }

    if (!activeScreenShare && state.pinnedUserId) {
      dispatch({ type: "ui/set-pinned", payload: null });
    }
  }, [dispatch, state.participants, state.pinnedUserId]);

  const copyRoomLink = useCallback(async () => {
    const inviteLink = `${clientEnv.NEXT_PUBLIC_APP_URL}${ROUTES.room(roomId)}`;
    await navigator.clipboard.writeText(inviteLink);
    toast.success("Room link copied to clipboard.");
  }, [roomId]);

  const leaveRoom = useCallback(async () => {
    if (hasLeftRoomRef.current) {
      return;
    }

    hasLeftRoomRef.current = true;

    try {
      await leaveRoomRequest(socket, {
        roomId,
        userId: identity.userId,
      });
    } catch {
      // Ignore explicit leave errors; disconnect cleanup still runs.
    }

    meshRef.current?.destroy();
    mediaManagerRef.current?.dispose();
    disconnectSocket();
    router.push(ROUTES.home);
  }, [identity.userId, roomId, router, socket]);

  const sendMessage = useCallback(
    async (text: string) => {
      await sendChatMessage(socket, {
        roomId,
        sender: identity,
        text,
      });
    },
    [identity, roomId, socket],
  );

  const toggleMicrophone = useCallback(async () => {
    const mediaManager = mediaManagerRef.current;
    if (!mediaManager) {
      return;
    }

    try {
      const mediaState = mediaManager.toggleMicrophone();
      syncLocalMedia(mediaState);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to toggle microphone.");
    }
  }, [syncLocalMedia]);

  const toggleCamera = useCallback(async () => {
    const mediaManager = mediaManagerRef.current;
    if (!mediaManager) {
      return;
    }

    try {
      const mediaState = mediaManager.toggleCamera();
      syncLocalMedia(mediaState);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to toggle camera.");
    }
  }, [syncLocalMedia]);

  const toggleScreenShare = useCallback(async () => {
    const mediaManager = mediaManagerRef.current;
    if (!mediaManager) {
      return;
    }

    try {
      const isSharing = mediaManager.getMediaState().screenSharing;
      const result = isSharing
        ? mediaManager.stopScreenShare()
        : await mediaManager.startScreenShare();

      syncLocalMedia(result.mediaState);
      emitScreenShare(socket, result.mediaState.screenSharing, {
        roomId,
        userId: identity.userId,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to share your screen.");
    }
  }, [identity.userId, roomId, socket, syncLocalMedia]);

  return {
    copyRoomLink,
    leaveRoom,
    sendMessage,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
  };
}

import {
  roomCreatePayloadSchema,
  roomJoinPayloadSchema,
  roomLeavePayloadSchema,
  joinRequestPayloadSchema,
  cancelJoinRequestPayloadSchema,
  joinResponsePayloadSchema,
  SOCKET_EVENTS,
} from "@streamify/shared";

import type { AppSocket, AppSocketServer } from "../common/types/socket";
import { getValidationMessage, safeParsePayload } from "../common/utils/schema";
import type { ChatService } from "../features/chat/services/chat-service";
import { registerChatHandlers } from "../features/chat/handlers/register-chat-handlers";
import { registerPresenceHandlers } from "../features/presence/handlers/register-presence-handlers";
import type { RoomService } from "../features/rooms/services/room-service";
import { toPublicRoomError } from "../features/rooms/services/room-service";
import { SignalRelayService } from "../features/signaling/services/signal-relay-service";
import { registerSignalingHandlers } from "../features/signaling/handlers/register-signaling-handlers";
import type { UserIdentityService } from "../features/users/services/user-identity-service";

interface RegisterSocketHandlersOptions {
  io: AppSocketServer;
  socket: AppSocket;
  roomService: RoomService;
  chatService: ChatService;
  userIdentityService: UserIdentityService;
}

export function registerSocketHandlers({
  io,
  socket,
  roomService,
  chatService,
  userIdentityService,
}: RegisterSocketHandlersOptions) {
  const relayService = new SignalRelayService(io, roomService);

  registerChatHandlers({
    io,
    socket,
    chatService,
  });

  registerPresenceHandlers({
    io,
    socket,
    roomService,
  });

  registerSignalingHandlers({
    socket,
    relayService,
    roomService,
  });

  socket.on(SOCKET_EVENTS.ROOM.CREATE, (payload, callback) => {
    const parsed = safeParsePayload(roomCreatePayloadSchema, payload);
    if (!parsed.success) {
      callback({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: getValidationMessage(parsed.error),
        },
      });
      return;
    }

    userIdentityService.normalize(parsed.data.user);
    const roomId = roomService.createRoom();
    callback({
      ok: true,
      data: {
        roomId,
      },
    });
  });

  socket.on(SOCKET_EVENTS.ROOM.JOIN, (payload, callback) => {
    const parsed = safeParsePayload(roomJoinPayloadSchema, payload);
    if (!parsed.success) {
      const error = {
        code: "VALIDATION_ERROR" as const,
        message: getValidationMessage(parsed.error),
      };

      socket.emit(SOCKET_EVENTS.ROOM.ERROR, error);
      callback({
        ok: false,
        error,
      });
      return;
    }

    try {
      const user = userIdentityService.normalize(parsed.data.user);
      const result = roomService.joinRoom({
        roomId: parsed.data.roomId,
        user,
        socketId: socket.id,
      });

      console.log(`[Room] User ${user.displayName} joined room ${parsed.data.roomId}, isHost: ${result.participant.isHost}, socketId: ${socket.id}`);

      socket.data.roomId = parsed.data.roomId;
      socket.data.userId = user.userId;
      socket.join(parsed.data.roomId);

      if (result.replacedSocketId) {
        const replacedSocket = io.sockets.sockets.get(result.replacedSocketId);
        replacedSocket?.leave(parsed.data.roomId);
        replacedSocket?.emit(SOCKET_EVENTS.ROOM.ERROR, {
          code: "INVALID_ROOM",
          message: "Your session was replaced by a new connection.",
        });
        replacedSocket?.disconnect(true);
      }

      socket.emit(SOCKET_EVENTS.ROOM.JOINED, result);
      io.to(parsed.data.roomId).emit(SOCKET_EVENTS.ROOM.PARTICIPANTS, {
        roomId: parsed.data.roomId,
        participants: result.participants,
      });
      socket.to(parsed.data.roomId).emit(SOCKET_EVENTS.PRESENCE.USER_JOINED, {
        roomId: parsed.data.roomId,
        participant: result.participant,
      });

      callback({
        ok: true,
        data: result,
      });
    } catch (error) {
      const roomError = toPublicRoomError(error);
      socket.emit(SOCKET_EVENTS.ROOM.ERROR, roomError);
      callback({
        ok: false,
        error: roomError,
      });
    }
  });

  /* ────── Waiting Room: Guest Join Request ────── */
  socket.on(SOCKET_EVENTS.ROOM.JOIN_REQUEST, (payload, callback) => {
    const parsed = safeParsePayload(joinRequestPayloadSchema, payload);
    if (!parsed.success) {
      callback({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: getValidationMessage(parsed.error),
        },
      });
      return;
    }

    try {
      const user = userIdentityService.normalize(parsed.data.user);
      const roomId = parsed.data.roomId;

      console.log(`[WaitingRoom] JOIN_REQUEST received from ${user.displayName} for room ${roomId}`);

      // Validate room exists
      if (!roomService.roomExists(roomId)) {
        console.log(`[WaitingRoom] Room ${roomId} does not exist`);
        callback({
          ok: false,
          error: { code: "ROOM_NOT_FOUND", message: "That room does not exist." },
        });
        return;
      }

      // Store the pending join request
      roomService.addJoinRequest(roomId, user, socket.id);

      // Notify the host about the join request
      const hostSocketId = roomService.getHostSocketId(roomId);
      console.log(`[WaitingRoom] Host socket ID for room ${roomId}: ${hostSocketId}`);
      if (hostSocketId) {
        const hostSocket = io.sockets.sockets.get(hostSocketId);
        console.log(`[WaitingRoom] Host socket found: ${!!hostSocket}, emitting JOIN_REQUEST_RECEIVED`);
        hostSocket?.emit(SOCKET_EVENTS.ROOM.JOIN_REQUEST_RECEIVED, {
          roomId,
          user,
        });
      } else {
        console.log(`[WaitingRoom] No host socket found for room ${roomId}`);
      }

      callback({
        ok: true,
        data: { queued: true },
      });
    } catch (error) {
      const roomError = toPublicRoomError(error);
      callback({
        ok: false,
        error: roomError,
      });
    }
  });

  /* ────── Waiting Room: Guest Cancel Request ────── */
  socket.on(SOCKET_EVENTS.ROOM.JOIN_REQUEST_CANCELLED, (payload, callback) => {
    const parsed = safeParsePayload(cancelJoinRequestPayloadSchema, payload);
    if (!parsed.success) {
      if (callback) {
        callback({
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: getValidationMessage(parsed.error),
          },
        });
      }
      return;
    }

    try {
      const { roomId, userId } = parsed.data;
      console.log(`[WaitingRoom] JOIN_REQUEST_CANCELLED received from ${userId} for room ${roomId}`);

      // Remove the pending request
      roomService.removePendingRequest(roomId, userId);

      // Notify the host so the UI can remove the person from the Waiting Room sidebar
      const hostSocketId = roomService.getHostSocketId(roomId);
      if (hostSocketId) {
        const hostSocket = io.sockets.sockets.get(hostSocketId);
        hostSocket?.emit(SOCKET_EVENTS.ROOM.JOIN_REQUEST_CANCELLED, {
          roomId,
          userId,
        });
      }

      if (callback) {
        callback({ ok: true, data: { ok: true } });
      }
    } catch (error) {
      const roomError = toPublicRoomError(error);
      if (callback) {
        callback({ ok: false, error: roomError });
      }
    }
  });

  /* ────── Waiting Room: Host Accept/Reject ────── */
  socket.on(SOCKET_EVENTS.ROOM.JOIN_RESPONSE, (payload, callback) => {
    const parsed = safeParsePayload(joinResponsePayloadSchema, payload);
    if (!parsed.success) {
      callback?.({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: getValidationMessage(parsed.error),
        },
      });
      return;
    }

    const { roomId, targetUserId, decision } = parsed.data;

    // Verify the sender is the host
    if (!socket.data.userId || !roomService.isRoomHost(roomId, socket.data.userId)) {
      callback?.({
        ok: false,
        error: { code: "INVALID_ROOM", message: "Only the host can accept or reject join requests." },
      });
      return;
    }

    // Remove the pending request
    const pendingReq = roomService.removePendingRequest(roomId, targetUserId);
    if (!pendingReq) {
      callback?.({
        ok: false,
        error: { code: "INVALID_ROOM", message: "No pending request found for that user." },
      });
      return;
    }

    const guestSocket = io.sockets.sockets.get(pendingReq.socketId);

    if (decision === "approved") {
      // Notify the guest they are approved
      guestSocket?.emit(SOCKET_EVENTS.ROOM.JOIN_REQUEST_APPROVED, {
        roomId,
      });
    } else {
      // Notify the guest they are rejected
      guestSocket?.emit(SOCKET_EVENTS.ROOM.JOIN_REQUEST_REJECTED, {
        roomId,
        message: "The host declined your request to join.",
      });
    }

    callback?.({
      ok: true,
      data: { ok: true },
    });
  });

  socket.on(SOCKET_EVENTS.ROOM.LEAVE, (payload, callback) => {
    const parsed = safeParsePayload(roomLeavePayloadSchema, payload);
    if (!parsed.success) {
      callback?.({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: getValidationMessage(parsed.error),
        },
      });
      return;
    }

    if (socket.data.roomId !== parsed.data.roomId || socket.data.userId !== parsed.data.userId) {
      callback?.({
        ok: false,
        error: {
          code: "INVALID_ROOM",
          message: "You are not connected to this room.",
        },
      });
      return;
    }

    const result = roomService.leaveRoom(parsed.data.roomId, parsed.data.userId);
    socket.leave(parsed.data.roomId);
    socket.data.roomId = undefined;
    socket.data.userId = undefined;

    if (result) {
      io.to(parsed.data.roomId).emit(SOCKET_EVENTS.PRESENCE.USER_LEFT, {
        roomId: parsed.data.roomId,
        userId: result.userId,
        displayName: result.displayName,
      });
      io.to(parsed.data.roomId).emit(SOCKET_EVENTS.ROOM.PARTICIPANTS, {
        roomId: parsed.data.roomId,
        participants: result.participants,
      });
    }

    callback?.({
      ok: true,
      data: {
        roomId: parsed.data.roomId,
        userId: parsed.data.userId,
      },
    });
  });

  socket.on("disconnect", () => {
    // Clean up pending join requests on disconnect
    const removedPending = roomService.removePendingBySocket(socket.id);
    if (removedPending) {
      const hostSocketId = roomService.getHostSocketId(removedPending.roomId);
      if (hostSocketId) {
        const hostSocket = io.sockets.sockets.get(hostSocketId);
        hostSocket?.emit(SOCKET_EVENTS.ROOM.JOIN_REQUEST_CANCELLED, {
          roomId: removedPending.roomId,
          userId: removedPending.userId,
        });
      }
    }

    const result = roomService.leaveBySocket(socket.id);
    if (!result) {
      return;
    }

    io.to(result.roomId).emit(SOCKET_EVENTS.PRESENCE.USER_LEFT, {
      roomId: result.roomId,
      userId: result.userId,
      displayName: result.displayName,
    });
    io.to(result.roomId).emit(SOCKET_EVENTS.ROOM.PARTICIPANTS, {
      roomId: result.roomId,
      participants: result.participants,
    });
  });
}

import {
  rtcAnswerPayloadSchema,
  rtcConnectionStatePayloadSchema,
  rtcIceCandidatePayloadSchema,
  rtcOfferPayloadSchema,
  rtcPeerReadyPayloadSchema,
  SOCKET_EVENTS,
} from "@streamify/shared";

import { logger } from "../../../common/logger/logger";
import type { AppSocket } from "../../../common/types/socket";
import { getValidationMessage, safeParsePayload } from "../../../common/utils/schema";
import type { RoomService } from "../../rooms/services/room-service";
import type { SignalRelayService } from "../services/signal-relay-service";

interface RegisterSignalingHandlersOptions {
  socket: AppSocket;
  relayService: SignalRelayService;
  roomService: RoomService;
}

export function registerSignalingHandlers({
  socket,
  relayService,
  roomService,
}: RegisterSignalingHandlersOptions) {
  const canRelayBetweenParticipants = (roomId: string, fromUserId: string, toUserId: string) => {
    if (socket.data.roomId !== roomId || socket.data.userId !== fromUserId) {
      return false;
    }

    if (fromUserId === toUserId) {
      return false;
    }

    return Boolean(
      roomService.getParticipant(roomId, fromUserId) &&
      roomService.getParticipant(roomId, toUserId),
    );
  };

  socket.on(SOCKET_EVENTS.RTC.PEER_READY, (payload) => {
    const parsed = safeParsePayload(rtcPeerReadyPayloadSchema, payload);
    if (!parsed.success) {
      socket.emit(SOCKET_EVENTS.ROOM.ERROR, {
        code: "VALIDATION_ERROR",
        message: getValidationMessage(parsed.error),
      });
      return;
    }

    if (
      socket.data.roomId !== parsed.data.roomId ||
      socket.data.userId !== parsed.data.user.userId ||
      !roomService.getParticipant(parsed.data.roomId, parsed.data.user.userId)
    ) {
      logger.debug("signaling.peer-ready.ignored", {
        roomId: parsed.data.roomId,
        userId: parsed.data.user.userId,
        socketId: socket.id,
      });
      return;
    }

    relayService.broadcastPeerReady(parsed.data.roomId, parsed.data, socket.id);
  });

  socket.on(SOCKET_EVENTS.RTC.OFFER, (payload) => {
    const parsed = safeParsePayload(rtcOfferPayloadSchema, payload);
    if (!parsed.success || !canRelayBetweenParticipants(
      parsed.data.roomId,
      parsed.data.fromUserId,
      parsed.data.toUserId,
    )) {
      return;
    }

    relayService.relayToParticipant(parsed.data.roomId, parsed.data.toUserId, SOCKET_EVENTS.RTC.OFFER, parsed.data);
  });

  socket.on(SOCKET_EVENTS.RTC.ANSWER, (payload) => {
    const parsed = safeParsePayload(rtcAnswerPayloadSchema, payload);
    if (!parsed.success || !canRelayBetweenParticipants(
      parsed.data.roomId,
      parsed.data.fromUserId,
      parsed.data.toUserId,
    )) {
      return;
    }

    relayService.relayToParticipant(
      parsed.data.roomId,
      parsed.data.toUserId,
      SOCKET_EVENTS.RTC.ANSWER,
      parsed.data,
    );
  });

  socket.on(SOCKET_EVENTS.RTC.ICE_CANDIDATE, (payload) => {
    const parsed = safeParsePayload(rtcIceCandidatePayloadSchema, payload);
    if (!parsed.success || !canRelayBetweenParticipants(
      parsed.data.roomId,
      parsed.data.fromUserId,
      parsed.data.toUserId,
    )) {
      return;
    }

    relayService.relayToParticipant(
      parsed.data.roomId,
      parsed.data.toUserId,
      SOCKET_EVENTS.RTC.ICE_CANDIDATE,
      parsed.data,
    );
  });

  socket.on(SOCKET_EVENTS.RTC.CONNECTION_STATE, (payload) => {
    const parsed = safeParsePayload(rtcConnectionStatePayloadSchema, payload);
    if (!parsed.success || !canRelayBetweenParticipants(
      parsed.data.roomId,
      parsed.data.fromUserId,
      parsed.data.toUserId,
    )) {
      return;
    }

    relayService.relayToParticipant(
      parsed.data.roomId,
      parsed.data.toUserId,
      SOCKET_EVENTS.RTC.CONNECTION_STATE,
      parsed.data,
    );
  });
}

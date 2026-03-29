import {
  presenceMediaStatePayloadSchema,
  screenSharePayloadSchema,
  SOCKET_EVENTS,
} from "@streamify/shared";

import type { AppSocket, AppSocketServer } from "../../../common/types/socket";
import { safeParsePayload } from "../../../common/utils/schema";
import type { RoomService } from "../../rooms/services/room-service";

interface RegisterPresenceHandlersOptions {
  io: AppSocketServer;
  socket: AppSocket;
  roomService: RoomService;
}

export function registerPresenceHandlers({
  io,
  socket,
  roomService,
}: RegisterPresenceHandlersOptions) {
  socket.on(SOCKET_EVENTS.PRESENCE.MEDIA_STATE, (payload) => {
    const parsed = safeParsePayload(presenceMediaStatePayloadSchema, payload);
    if (!parsed.success) {
      return;
    }

    if (socket.data.roomId !== parsed.data.roomId || socket.data.userId !== parsed.data.userId) {
      return;
    }

    const participants = roomService.updateMediaState(
      parsed.data.roomId,
      parsed.data.userId,
      parsed.data.media,
    );
    if (!participants) {
      return;
    }

    io.to(parsed.data.roomId).emit(SOCKET_EVENTS.PRESENCE.MEDIA_STATE, parsed.data);
    io.to(parsed.data.roomId).emit(SOCKET_EVENTS.ROOM.PARTICIPANTS, {
      roomId: parsed.data.roomId,
      participants,
    });
  });

  socket.on(SOCKET_EVENTS.SCREEN.START, (payload) => {
    const parsed = safeParsePayload(screenSharePayloadSchema, payload);
    if (!parsed.success) {
      return;
    }

    if (socket.data.roomId !== parsed.data.roomId || socket.data.userId !== parsed.data.userId) {
      return;
    }

    const participants = roomService.updateMediaState(parsed.data.roomId, parsed.data.userId, {
      screenSharing: true,
    });
    if (!participants) {
      return;
    }

    io.to(parsed.data.roomId).emit(SOCKET_EVENTS.SCREEN.START, parsed.data);
    io.to(parsed.data.roomId).emit(SOCKET_EVENTS.ROOM.PARTICIPANTS, {
      roomId: parsed.data.roomId,
      participants,
    });
  });

  socket.on(SOCKET_EVENTS.SCREEN.STOP, (payload) => {
    const parsed = safeParsePayload(screenSharePayloadSchema, payload);
    if (!parsed.success) {
      return;
    }

    if (socket.data.roomId !== parsed.data.roomId || socket.data.userId !== parsed.data.userId) {
      return;
    }

    const participants = roomService.updateMediaState(parsed.data.roomId, parsed.data.userId, {
      screenSharing: false,
    });
    if (!participants) {
      return;
    }

    io.to(parsed.data.roomId).emit(SOCKET_EVENTS.SCREEN.STOP, parsed.data);
    io.to(parsed.data.roomId).emit(SOCKET_EVENTS.ROOM.PARTICIPANTS, {
      roomId: parsed.data.roomId,
      participants,
    });
  });
}


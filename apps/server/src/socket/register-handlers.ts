import {
  roomCreatePayloadSchema,
  roomJoinPayloadSchema,
  roomLeavePayloadSchema,
  SOCKET_EVENTS,
} from "@streamify/shared";

import type { AppSocket, AppSocketServer } from "../common/types/socket";
import { getValidationMessage, safeParsePayload } from "../common/utils/schema";
import type { ChatService } from "../features/chat/services/chat-service";
import { registerChatHandlers } from "../features/chat/handlers/register-chat-handlers";
import { registerPresenceHandlers } from "../features/presence/handlers/register-presence-handlers";
import type { RoomService} from "../features/rooms/services/room-service";
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

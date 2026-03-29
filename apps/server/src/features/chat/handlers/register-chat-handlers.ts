import {
  chatSendPayloadSchema,
  SOCKET_EVENTS,
  type SocketAck,
} from "@streamify/shared";

import type { AppSocket, AppSocketServer } from "../../../common/types/socket";
import { getValidationMessage, safeParsePayload } from "../../../common/utils/schema";
import type { ChatService } from "../services/chat-service";

interface RegisterChatHandlersOptions {
  io: AppSocketServer;
  socket: AppSocket;
  chatService: ChatService;
}

export function registerChatHandlers({
  io,
  socket,
  chatService,
}: RegisterChatHandlersOptions) {
  socket.on(SOCKET_EVENTS.CHAT.SEND, (payload, callback?: (response: SocketAck<{ messageId: string }>) => void) => {
    const parsed = safeParsePayload(chatSendPayloadSchema, payload);
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

    if (socket.data.roomId !== parsed.data.roomId || socket.data.userId !== parsed.data.sender.userId) {
      callback?.({
        ok: false,
        error: {
          code: "INVALID_ROOM",
          message: "You are not connected to this room.",
        },
      });
      return;
    }

    const message = chatService.createMessage(parsed.data);
    io.to(parsed.data.roomId).emit(SOCKET_EVENTS.CHAT.NEW_MESSAGE, {
      roomId: parsed.data.roomId,
      message,
    });
    callback?.({
      ok: true,
      data: {
        messageId: message.id,
      },
    });
  });
}


"use client";

import { SOCKET_EVENTS, type ChatSendPayload } from "@streamify/shared";

import { emitWithAck } from "@/features/room/services/room-socket-service";
import type { StreamifySocket } from "@/shared/lib/socket";

export async function sendChatMessage(socket: StreamifySocket, payload: ChatSendPayload) {
  await emitWithAck<{ messageId: string }>(socket, SOCKET_EVENTS.CHAT.SEND, payload, {
    connect: false,
  });
}

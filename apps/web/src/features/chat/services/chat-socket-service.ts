"use client";

import { SOCKET_EVENTS, type ChatSendPayload } from "@streamify/shared";

import type { StreamifySocket } from "@/shared/lib/socket";

export async function sendChatMessage(socket: StreamifySocket, payload: ChatSendPayload) {
  return new Promise<void>((resolve, reject) => {
    socket.emit(SOCKET_EVENTS.CHAT.SEND, payload, (response) => {
      if (!response) {
        resolve();
        return;
      }

      if (!response.ok) {
        reject(new Error(response.error.message));
        return;
      }

      resolve();
    });
  });
}


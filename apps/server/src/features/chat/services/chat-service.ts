import type { ChatMessage, ChatSendPayload } from "@streamify/shared";

export class ChatService {
  createMessage(payload: ChatSendPayload): ChatMessage {
    return {
      id: crypto.randomUUID(),
      roomId: payload.roomId,
      text: payload.text.trim(),
      sender: payload.sender,
      timestamp: new Date().toISOString(),
    };
  }
}


import { ROOM_ID_LENGTH } from "@streamify/shared";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomId() {
  let roomId = "";

  while (roomId.length < ROOM_ID_LENGTH) {
    const index = Math.floor(Math.random() * ROOM_ALPHABET.length);
    roomId += ROOM_ALPHABET[index];
  }

  return roomId;
}


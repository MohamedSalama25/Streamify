export const APP_NAME = "Streamify";
export const MAX_ROOM_PARTICIPANTS = 4;
export const ROOM_ID_LENGTH = 6;
export const STORAGE_KEYS = {
  identity: "streamify.identity",
  roomAccess: "streamify.room-access",
  roomCreator: "streamify.room-creator",
} as const;
export const DEFAULT_STUN_SERVERS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
] as const;

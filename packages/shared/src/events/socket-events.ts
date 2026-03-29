export const SOCKET_EVENTS = {
  ROOM: {
    CREATE: "room:create",
    JOIN: "room:join",
    JOINED: "room:joined",
    ERROR: "room:error",
    LEAVE: "room:leave",
    PARTICIPANTS: "room:participants",
  },
  PRESENCE: {
    USER_JOINED: "presence:user-joined",
    USER_LEFT: "presence:user-left",
    MEDIA_STATE: "presence:media-state",
  },
  CHAT: {
    SEND: "chat:send",
    NEW_MESSAGE: "chat:new-message",
  },
  RTC: {
    OFFER: "rtc:offer",
    ANSWER: "rtc:answer",
    ICE_CANDIDATE: "rtc:ice-candidate",
    PEER_READY: "rtc:peer-ready",
    CONNECTION_STATE: "rtc:connection-state",
  },
  SCREEN: {
    START: "screen:start",
    STOP: "screen:stop",
  },
} as const;


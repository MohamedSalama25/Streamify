import type {
  ChatMessage,
  ParticipantMediaState,
  PeerConnectionState,
  RoomErrorPayload,
  RoomParticipant,
  RoomStatus,
  UserIdentity,
} from "@streamify/shared";

export interface ParticipantViewModel extends RoomParticipant {
  isLocal: boolean;
  stream: MediaStream | null;
  connectionState: PeerConnectionState;
}

export interface RoomState {
  roomId: string;
  status: RoomStatus;
  currentUser: UserIdentity | null;
  participants: Record<string, ParticipantViewModel>;
  messages: ChatMessage[];
  roomError: RoomErrorPayload | null;
  mediaError: string | null;
  socketConnected: boolean;
  pinnedUserId: string | null;
}

export type RoomAction =
  | { type: "session/reset"; payload: { roomId: string; currentUser: UserIdentity | null } }
  | { type: "session/set-status"; payload: RoomStatus }
  | { type: "session/set-current-user"; payload: UserIdentity | null }
  | { type: "session/set-room-error"; payload: RoomErrorPayload | null }
  | { type: "session/set-media-error"; payload: string | null }
  | { type: "session/set-socket-connected"; payload: boolean }
  | { type: "messages/add"; payload: ChatMessage }
  | { type: "participants/set"; payload: RoomParticipant[] }
  | { type: "participants/upsert"; payload: RoomParticipant }
  | { type: "participants/remove"; payload: { userId: string } }
  | { type: "participants/set-stream"; payload: { userId: string; stream: MediaStream | null } }
  | {
      type: "participants/set-media";
      payload: { userId: string; media: ParticipantMediaState };
    }
  | {
      type: "participants/set-connection-state";
      payload: { userId: string; connectionState: PeerConnectionState };
    }
  | { type: "ui/set-pinned"; payload: string | null };

export function createInitialRoomState(
  roomId: string,
  currentUser: UserIdentity | null = null,
): RoomState {
  return {
    roomId,
    status: "idle",
    currentUser,
    participants: {},
    messages: [],
    roomError: null,
    mediaError: null,
    socketConnected: false,
    pinnedUserId: null,
  };
}

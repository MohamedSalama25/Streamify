export type RoomErrorCode =
  | "INVALID_ROOM"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "JOIN_REJECTED";

export type RoomStatus = "idle" | "preparing" | "joining" | "connected" | "error";
export type PeerConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export interface UserIdentity {
  userId: string;
  displayName: string;
}

export interface ParticipantMediaState {
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
  screenSharing: boolean;
}

export interface RoomParticipant {
  userId: string;
  displayName: string;
  isHost: boolean;
  joinedAt: string;
  media: ParticipantMediaState;
}

export interface RoomErrorPayload {
  code: RoomErrorCode;
  message: string;
}

export interface AckSuccess<T> {
  ok: true;
  data: T;
}

export interface AckFailure {
  ok: false;
  error: RoomErrorPayload;
}

export type SocketAck<T> = AckSuccess<T> | AckFailure;

export interface RoomCreatePayload {
  user: UserIdentity;
}

export interface RoomCreateResponse {
  roomId: string;
}

export interface RoomJoinPayload {
  roomId: string;
  user: UserIdentity;
}

export interface RoomJoinedPayload {
  roomId: string;
  participant: RoomParticipant;
  participants: RoomParticipant[];
}

export interface RoomLeavePayload {
  roomId: string;
  userId: string;
}

export interface RoomLeaveResponse {
  roomId: string;
  userId: string;
}

export interface RoomParticipantsPayload {
  roomId: string;
  participants: RoomParticipant[];
}

export interface PresenceUserJoinedPayload {
  roomId: string;
  participant: RoomParticipant;
}

export interface PresenceUserLeftPayload {
  roomId: string;
  userId: string;
  displayName: string;
}

export interface PresenceMediaStatePayload {
  roomId: string;
  userId: string;
  media: Partial<ParticipantMediaState>;
}

export interface ChatSendPayload {
  roomId: string;
  sender: UserIdentity;
  text: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  text: string;
  sender: UserIdentity;
  timestamp: string;
}

export interface ChatNewMessagePayload {
  roomId: string;
  message: ChatMessage;
}

export type SessionDescriptionType = "offer" | "answer" | "pranswer" | "rollback";

export interface SessionDescriptionValue {
  type: SessionDescriptionType;
  sdp: string;
}

export interface IceCandidateValue {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment?: string | null;
}

export interface RtcSignalEnvelope {
  roomId: string;
  fromUserId: string;
  toUserId: string;
}

export interface RtcOfferPayload extends RtcSignalEnvelope {
  description: SessionDescriptionValue;
}

export interface RtcAnswerPayload extends RtcSignalEnvelope {
  description: SessionDescriptionValue;
}

export interface RtcIceCandidatePayload extends RtcSignalEnvelope {
  candidate: IceCandidateValue;
}

export interface RtcPeerReadyPayload {
  roomId: string;
  user: UserIdentity;
}

export interface RtcConnectionStatePayload extends RtcSignalEnvelope {
  state: PeerConnectionState;
}

export interface ScreenSharePayload {
  roomId: string;
  userId: string;
}

export interface JoinRequestPayload {
  roomId: string;
  user: UserIdentity;
}

export type JoinResponseDecision = "approved" | "rejected";

export interface JoinResponsePayload {
  roomId: string;
  targetUserId: string;
  decision: JoinResponseDecision;
}

export interface JoinRequestReceivedPayload {
  roomId: string;
  user: UserIdentity;
}

export interface JoinRequestApprovedPayload {
  roomId: string;
}

export interface JoinRequestRejectedPayload {
  roomId: string;
  message: string;
}

export interface CancelJoinRequestPayload {
  roomId: string;
  userId: string;
}

export interface IceServerConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface RtcConfigurationResponse {
  iceServers: IceServerConfig[];
}

export interface ClientToServerEvents {
  "room:create": (
    payload: RoomCreatePayload,
    callback: (response: SocketAck<RoomCreateResponse>) => void,
  ) => void;
  "room:join": (
    payload: RoomJoinPayload,
    callback: (response: SocketAck<RoomJoinedPayload>) => void,
  ) => void;
  "room:leave": (
    payload: RoomLeavePayload,
    callback?: (response: SocketAck<RoomLeaveResponse>) => void,
  ) => void;
  "room:join-request": (
    payload: JoinRequestPayload,
    callback: (response: SocketAck<{ queued: boolean }>) => void,
  ) => void;
  "room:join-request-cancelled": (
    payload: CancelJoinRequestPayload,
    callback?: (response: SocketAck<{ ok: boolean }>) => void,
  ) => void;
  "room:join-response": (
    payload: JoinResponsePayload,
    callback?: (response: SocketAck<{ ok: boolean }>) => void,
  ) => void;
  "presence:media-state": (payload: PresenceMediaStatePayload) => void;
  "chat:send": (
    payload: ChatSendPayload,
    callback?: (response: SocketAck<{ messageId: string }>) => void,
  ) => void;
  "rtc:offer": (payload: RtcOfferPayload) => void;
  "rtc:answer": (payload: RtcAnswerPayload) => void;
  "rtc:ice-candidate": (payload: RtcIceCandidatePayload) => void;
  "rtc:peer-ready": (payload: RtcPeerReadyPayload) => void;
  "rtc:connection-state": (payload: RtcConnectionStatePayload) => void;
  "screen:start": (payload: ScreenSharePayload) => void;
  "screen:stop": (payload: ScreenSharePayload) => void;
}

export interface ServerToClientEvents {
  "room:joined": (payload: RoomJoinedPayload) => void;
  "room:error": (payload: RoomErrorPayload) => void;
  "room:participants": (payload: RoomParticipantsPayload) => void;
  "room:join-request-received": (payload: JoinRequestReceivedPayload) => void;
  "room:join-request-approved": (payload: JoinRequestApprovedPayload) => void;
  "room:join-request-rejected": (payload: JoinRequestRejectedPayload) => void;
  "room:join-request-cancelled": (payload: CancelJoinRequestPayload) => void;
  "presence:user-joined": (payload: PresenceUserJoinedPayload) => void;
  "presence:user-left": (payload: PresenceUserLeftPayload) => void;
  "presence:media-state": (payload: PresenceMediaStatePayload) => void;
  "chat:new-message": (payload: ChatNewMessagePayload) => void;
  "rtc:offer": (payload: RtcOfferPayload) => void;
  "rtc:answer": (payload: RtcAnswerPayload) => void;
  "rtc:ice-candidate": (payload: RtcIceCandidatePayload) => void;
  "rtc:peer-ready": (payload: RtcPeerReadyPayload) => void;
  "rtc:connection-state": (payload: RtcConnectionStatePayload) => void;
  "screen:start": (payload: ScreenSharePayload) => void;
  "screen:stop": (payload: ScreenSharePayload) => void;
}

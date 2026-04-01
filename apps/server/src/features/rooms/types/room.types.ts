import type {
  ParticipantMediaState,
  RoomErrorCode,
  RoomErrorPayload,
  RoomCreateResponse,
  RoomJoinedPayload,
  RoomParticipant,
  UserIdentity,
} from "@streamify/shared";

export interface RoomParticipantRecord extends RoomParticipant {
  socketId: string;
  accessToken: string;
}

export interface RoomAccessGrant {
  userId: string;
  displayName: string;
  accessToken: string;
  issuedAt: string;
  claimedAt: string | null;
}

export interface PendingJoinRequest {
  userId: string;
  displayName: string;
  socketId: string;
  requestedAt: string;
  approvedAt: string | null;
  accessToken: string | null;
}

export interface RoomRecord {
  roomId: string;
  createdAt: string;
  hostReservation: RoomAccessGrant;
  participants: Map<string, RoomParticipantRecord>;
  pendingJoinRequests: Map<string, PendingJoinRequest>;
}

export interface JoinRoomParams {
  roomId: string;
  user: UserIdentity;
  socketId: string;
  accessToken: string;
}

export interface JoinRoomResult extends RoomJoinedPayload {
  replacedSocketId?: string;
}

export type CreateRoomResult = RoomCreateResponse;

export interface QueueJoinRequestResult {
  request: PendingJoinRequest;
  created: boolean;
}

export interface LeaveRoomResult {
  roomId: string;
  userId: string;
  displayName: string;
  participants: RoomParticipant[];
}

export interface RoomSocketLookup {
  roomId: string;
  userId: string;
}

export const createDefaultMediaState = (): ParticipantMediaState => ({
  microphoneEnabled: true,
  cameraEnabled: true,
  screenSharing: false,
});

export class RoomServiceError extends Error {
  constructor(
    public readonly code: RoomErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RoomServiceError";
  }
}

export function createRoomError(code: RoomErrorCode, message: string): RoomErrorPayload {
  return {
    code,
    message,
  };
}

export function normalizeRoomError(error: unknown): RoomErrorPayload {
  if (error instanceof RoomServiceError) {
    return createRoomError(error.code, error.message);
  }

  return createRoomError("SERVER_ERROR", "Something went wrong on the server.");
}

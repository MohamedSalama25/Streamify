import type {
  ParticipantMediaState,
  RoomErrorCode,
  RoomErrorPayload,
  RoomJoinedPayload,
  RoomParticipant,
  UserIdentity,
} from "@streamify/shared";

export interface RoomParticipantRecord extends RoomParticipant {
  socketId: string;
}

export interface RoomRecord {
  roomId: string;
  createdAt: string;
  participants: Map<string, RoomParticipantRecord>;
}

export interface JoinRoomParams {
  roomId: string;
  user: UserIdentity;
  socketId: string;
}

export interface JoinRoomResult extends RoomJoinedPayload {
  replacedSocketId?: string;
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


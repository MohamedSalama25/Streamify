import type { ParticipantMediaState, RoomParticipant, UserIdentity } from "@streamify/shared";
import { MAX_ROOM_PARTICIPANTS } from "@streamify/shared";

import type { InMemoryRoomStore } from "../store/in-memory-room-store";
import {
  createDefaultMediaState,
  type JoinRoomParams,
  type JoinRoomResult,
  type LeaveRoomResult,
  type PendingJoinRequest,
  type RoomParticipantRecord,
  normalizeRoomError,
  RoomServiceError,
} from "../types/room.types";
import { generateRoomId } from "../utils/generate-room-id";

export class RoomService {
  constructor(private readonly store: InMemoryRoomStore) { }

  createRoom() {
    let roomId = generateRoomId();

    while (this.store.hasRoom(roomId)) {
      roomId = generateRoomId();
    }

    this.store.createRoom(roomId);
    return roomId;
  }

  /** Check if a room exists */
  roomExists(roomId: string) {
    return this.store.hasRoom(roomId);
  }

  /** Check if a user is the host of a room */
  isRoomHost(roomId: string, userId: string) {
    const participant = this.store.findParticipant(roomId, userId);
    return participant?.isHost === true;
  }

  /** Get the host socket ID for a room */
  getHostSocketId(roomId: string): string | null {
    const room = this.store.getRoom(roomId);
    if (!room) return null;

    for (const p of room.participants.values()) {
      if (p.isHost) return p.socketId;
    }
    return null;
  }

  /** Add a pending join request (waiting room) */
  addJoinRequest(roomId: string, user: UserIdentity, socketId: string): PendingJoinRequest {
    const room = this.store.getRoom(roomId);
    if (!room) {
      throw new RoomServiceError("ROOM_NOT_FOUND", "That room does not exist.");
    }

    if (room.participants.size >= MAX_ROOM_PARTICIPANTS) {
      throw new RoomServiceError(
        "ROOM_FULL",
        `This room already has ${MAX_ROOM_PARTICIPANTS} participants.`,
      );
    }

    const request: PendingJoinRequest = {
      userId: user.userId,
      displayName: user.displayName,
      socketId,
      requestedAt: new Date().toISOString(),
    };

    this.store.addPendingJoinRequest(roomId, request);
    return request;
  }

  /** Remove a pending join request */
  removePendingRequest(roomId: string, userId: string) {
    return this.store.removePendingJoinRequest(roomId, userId);
  }

  /** Clean up pending request when socket disconnects */
  removePendingBySocket(socketId: string) {
    const lookup = this.store.findPendingBySocket(socketId);
    if (!lookup) return null;
    this.store.removePendingJoinRequest(lookup.roomId, lookup.userId);
    return lookup;
  }

  joinRoom({ roomId, user, socketId }: JoinRoomParams): JoinRoomResult {
    const room = this.store.getRoom(roomId);
    if (!room) {
      throw new RoomServiceError("ROOM_NOT_FOUND", "That room does not exist.");
    }

    const existingParticipant = this.store.findParticipant(roomId, user.userId);
    if (!existingParticipant && room.participants.size >= MAX_ROOM_PARTICIPANTS) {
      throw new RoomServiceError(
        "ROOM_FULL",
        `This room already has ${MAX_ROOM_PARTICIPANTS} participants.`,
      );
    }

    let replacedSocketId: string | undefined;
    let isHost = room.participants.size === 0;
    let media = createDefaultMediaState();

    if (existingParticipant) {
      replacedSocketId = existingParticipant.socketId;
      isHost = existingParticipant.isHost;
      media = existingParticipant.media;
      this.store.removeParticipant(roomId, user.userId);
    }

    // Clean up any pending request for this user
    this.store.removePendingJoinRequest(roomId, user.userId);

    const participant = this.store.saveParticipant(roomId, {
      userId: user.userId,
      displayName: user.displayName,
      socketId,
      isHost,
      joinedAt: new Date().toISOString(),
      media,
    });

    if (!participant) {
      throw new RoomServiceError("SERVER_ERROR", "Unable to join the room.");
    }

    this.ensureHost(roomId);

    return {
      roomId,
      participant: this.toPublicParticipant(participant),
      participants: this.store.listPublicParticipants(roomId),
      replacedSocketId,
    };
  }

  leaveBySocket(socketId: string): LeaveRoomResult | null {
    const lookup = this.store.findParticipantBySocket(socketId);
    if (!lookup) {
      return null;
    }

    return this.leaveRoom(lookup.roomId, lookup.participant.userId);
  }

  leaveRoom(roomId: string, userId: string): LeaveRoomResult | null {
    const removed = this.store.removeParticipant(roomId, userId);
    if (!removed) {
      return null;
    }

    const room = this.store.getRoom(roomId);
    if (!room || room.participants.size === 0) {
      this.store.deleteRoom(roomId);
      return {
        roomId,
        userId: removed.userId,
        displayName: removed.displayName,
        participants: [],
      };
    }

    this.ensureHost(roomId);

    return {
      roomId,
      userId: removed.userId,
      displayName: removed.displayName,
      participants: this.store.listPublicParticipants(roomId),
    };
  }

  listParticipants(roomId: string) {
    return this.store.listPublicParticipants(roomId);
  }

  updateMediaState(roomId: string, userId: string, partial: Partial<ParticipantMediaState>) {
    const participant = this.store.updateParticipant(roomId, userId, (current) => ({
      ...current,
      media: {
        ...current.media,
        ...partial,
      },
    }));

    if (!participant) {
      return null;
    }

    return this.store.listPublicParticipants(roomId);
  }

  getParticipantSocketId(roomId: string, userId: string) {
    return this.store.getSocketId(roomId, userId);
  }

  getParticipant(roomId: string, userId: string) {
    return this.store.findParticipant(roomId, userId);
  }

  private ensureHost(roomId: string) {
    const room = this.store.getRoom(roomId);
    if (!room) {
      return;
    }

    const participants = Array.from(room.participants.values()).sort((left, right) =>
      left.joinedAt.localeCompare(right.joinedAt),
    );
    const host = participants.find((participant) => participant.isHost);

    if (host) {
      return;
    }

    const nextHost = participants[0];
    if (!nextHost) {
      return;
    }

    this.store.updateParticipant(roomId, nextHost.userId, (participant) => ({
      ...participant,
      isHost: true,
    }));
  }

  private toPublicParticipant({
    socketId: _socketId,
    ...participant
  }: RoomParticipantRecord): RoomParticipant {
    return participant;
  }
}

export function toPublicRoomError(error: unknown) {
  return normalizeRoomError(error);
}

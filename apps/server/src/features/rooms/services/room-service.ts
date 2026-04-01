import { randomBytes } from "node:crypto";

import type { ParticipantMediaState, RoomParticipant, UserIdentity } from "@streamify/shared";
import { MAX_ROOM_PARTICIPANTS } from "@streamify/shared";

import type { InMemoryRoomStore } from "../store/in-memory-room-store";
import {
  type CreateRoomResult,
  createDefaultMediaState,
  type JoinRoomParams,
  type JoinRoomResult,
  type LeaveRoomResult,
  type PendingJoinRequest,
  type QueueJoinRequestResult,
  type RoomParticipantRecord,
  normalizeRoomError,
  RoomServiceError,
} from "../types/room.types";
import { generateRoomId } from "../utils/generate-room-id";

const EMPTY_ROOM_TTL_MS = 30 * 60 * 1000;
const PENDING_REQUEST_TTL_MS = 10 * 60 * 1000;
const APPROVED_REQUEST_TTL_MS = 10 * 60 * 1000;
const MAX_PENDING_JOIN_REQUESTS = Math.max(MAX_ROOM_PARTICIPANTS * 2, 8);

function generateAccessToken() {
  return randomBytes(24).toString("base64url");
}

function isExpired(timestamp: string, ttlMs: number, now = Date.now()) {
  return now - Date.parse(timestamp) > ttlMs;
}

export class RoomService {
  constructor(private readonly store: InMemoryRoomStore) { }

  createRoom(user: UserIdentity): CreateRoomResult {
    this.pruneStaleState();

    let roomId = generateRoomId();

    while (this.store.hasRoom(roomId)) {
      roomId = generateRoomId();
    }

    const accessToken = generateAccessToken();
    this.store.createRoom(roomId, {
      userId: user.userId,
      displayName: user.displayName,
      accessToken,
      issuedAt: new Date().toISOString(),
      claimedAt: null,
    });

    return {
      roomId,
      accessToken,
    };
  }

  /** Check if a room exists */
  roomExists(roomId: string) {
    this.pruneStaleState();
    return this.store.hasRoom(roomId);
  }

  /** Check if a user is the host of a room */
  isRoomHost(roomId: string, userId: string) {
    this.pruneStaleState();
    const participant = this.store.findParticipant(roomId, userId);
    return participant?.isHost === true;
  }

  /** Get the host socket ID for a room */
  getHostSocketId(roomId: string): string | null {
    this.pruneStaleState();
    const room = this.store.getRoom(roomId);
    if (!room) return null;

    for (const p of room.participants.values()) {
      if (p.isHost) return p.socketId;
    }
    return null;
  }

  /** Add a pending join request (waiting room) */
  addJoinRequest(roomId: string, user: UserIdentity, socketId: string): QueueJoinRequestResult {
    this.pruneStaleState();

    const room = this.store.getRoom(roomId);
    if (!room) {
      throw new RoomServiceError("ROOM_NOT_FOUND", "That room does not exist.");
    }

    if (this.store.findParticipant(roomId, user.userId)) {
      throw new RoomServiceError("INVALID_ROOM", "You are already connected to this room.");
    }

    const existingRequest = this.store.getPendingJoinRequest(roomId, user.userId);
    if (existingRequest?.approvedAt) {
      throw new RoomServiceError(
        "INVALID_ROOM",
        "Your join request was already approved. Please reconnect to the room.",
      );
    }

    if (existingRequest) {
      const refreshedRequest = this.store.updatePendingJoinRequest(roomId, user.userId, (current) => ({
        ...current,
        displayName: user.displayName,
        socketId,
        requestedAt: new Date().toISOString(),
      }));

      if (!refreshedRequest) {
        throw new RoomServiceError("SERVER_ERROR", "Unable to update your join request.");
      }

      return {
        request: refreshedRequest,
        created: false,
      };
    }

    if (room.participants.size >= MAX_ROOM_PARTICIPANTS) {
      throw new RoomServiceError(
        "ROOM_FULL",
        `This room already has ${MAX_ROOM_PARTICIPANTS} participants.`,
      );
    }

    if (room.pendingJoinRequests.size >= MAX_PENDING_JOIN_REQUESTS) {
      throw new RoomServiceError(
        "ROOM_FULL",
        "The waiting room is currently full. Please try again in a moment.",
      );
    }

    const request: PendingJoinRequest = {
      userId: user.userId,
      displayName: user.displayName,
      socketId,
      requestedAt: new Date().toISOString(),
      approvedAt: null,
      accessToken: null,
    };

    this.store.addPendingJoinRequest(roomId, request);
    return {
      request,
      created: true,
    };
  }

  /** Remove a pending join request */
  removePendingRequest(roomId: string, userId: string) {
    this.pruneStaleState();
    return this.store.removePendingJoinRequest(roomId, userId);
  }

  approveJoinRequest(roomId: string, userId: string) {
    this.pruneStaleState();

    const accessToken = generateAccessToken();
    return this.store.updatePendingJoinRequest(roomId, userId, (request) => ({
      ...request,
      approvedAt: new Date().toISOString(),
      accessToken,
    }));
  }

  /** Clean up pending request when socket disconnects */
  removePendingBySocket(socketId: string) {
    const lookup = this.store.findPendingBySocket(socketId);
    if (!lookup) return null;

    const request = this.store.getPendingJoinRequest(lookup.roomId, lookup.userId);
    if (!request || request.approvedAt) {
      return null;
    }

    this.store.removePendingJoinRequest(lookup.roomId, lookup.userId);
    return lookup;
  }

  joinRoom({ roomId, user, socketId, accessToken }: JoinRoomParams): JoinRoomResult {
    this.pruneStaleState();

    const room = this.store.getRoom(roomId);
    if (!room) {
      throw new RoomServiceError("ROOM_NOT_FOUND", "That room does not exist.");
    }

    const existingParticipant = this.store.findParticipant(roomId, user.userId);
    const pendingRequest = this.store.getPendingJoinRequest(roomId, user.userId);
    const hostReservation = room.hostReservation;
    const isReservedHost =
      hostReservation.userId === user.userId && hostReservation.accessToken === accessToken;
    const hasApprovedGuestGrant =
      pendingRequest?.approvedAt != null &&
      pendingRequest.accessToken === accessToken &&
      !isExpired(pendingRequest.approvedAt, APPROVED_REQUEST_TTL_MS);

    if (existingParticipant && existingParticipant.accessToken !== accessToken) {
      throw new RoomServiceError("INVALID_ROOM", "This session is no longer valid for that user.");
    }

    if (!existingParticipant && !isReservedHost && !hasApprovedGuestGrant) {
      throw new RoomServiceError(
        "INVALID_ROOM",
        "You are not authorized to join this room with the current session.",
      );
    }

    if (!existingParticipant && room.participants.size >= MAX_ROOM_PARTICIPANTS) {
      throw new RoomServiceError(
        "ROOM_FULL",
        `This room already has ${MAX_ROOM_PARTICIPANTS} participants.`,
      );
    }

    let replacedSocketId: string | undefined;
    let isHost = isReservedHost && room.participants.size === 0;
    let media = createDefaultMediaState();

    if (existingParticipant) {
      replacedSocketId = existingParticipant.socketId;
      isHost = existingParticipant.isHost;
      media = existingParticipant.media;
      this.store.removeParticipant(roomId, user.userId);
    }

    if (isReservedHost && !hostReservation.claimedAt) {
      hostReservation.claimedAt = new Date().toISOString();
    }

    if (hasApprovedGuestGrant) {
      this.store.removePendingJoinRequest(roomId, user.userId);
    }

    const participant = this.store.saveParticipant(roomId, {
      userId: user.userId,
      displayName: user.displayName,
      socketId,
      isHost,
      joinedAt: new Date().toISOString(),
      media,
      accessToken,
    });

    if (!participant) {
      throw new RoomServiceError("SERVER_ERROR", "Unable to join the room.");
    }

    this.ensureHost(roomId);

    return {
      roomId,
      participant: this.toPublicParticipant(participant),
      participants: this.store.listPublicParticipants(roomId),
      accessToken,
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
    this.pruneStaleState();
    return this.store.listPublicParticipants(roomId);
  }

  updateMediaState(roomId: string, userId: string, partial: Partial<ParticipantMediaState>) {
    this.pruneStaleState();
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
    this.pruneStaleState();
    return this.store.getSocketId(roomId, userId);
  }

  getParticipant(roomId: string, userId: string) {
    this.pruneStaleState();
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

  private pruneStaleState() {
    const now = Date.now();

    for (const room of this.store.listRooms()) {
      for (const request of Array.from(room.pendingJoinRequests.values())) {
        const approvedExpired =
          request.approvedAt != null && isExpired(request.approvedAt, APPROVED_REQUEST_TTL_MS, now);
        const pendingExpired =
          request.approvedAt == null && isExpired(request.requestedAt, PENDING_REQUEST_TTL_MS, now);

        if (approvedExpired || pendingExpired) {
          this.store.removePendingJoinRequest(room.roomId, request.userId);
        }
      }

      const shouldDeleteEmptyRoom =
        room.participants.size === 0 &&
        room.hostReservation.claimedAt == null &&
        room.pendingJoinRequests.size === 0 &&
        isExpired(room.createdAt, EMPTY_ROOM_TTL_MS, now);

      if (shouldDeleteEmptyRoom) {
        this.store.deleteRoom(room.roomId);
      }
    }
  }
}

export function toPublicRoomError(error: unknown) {
  return normalizeRoomError(error);
}

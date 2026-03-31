import type { RoomParticipant } from "@streamify/shared";

import type {
  PendingJoinRequest,
  RoomParticipantRecord,
  RoomRecord,
  RoomSocketLookup,
} from "../types/room.types";

export class InMemoryRoomStore {
  private readonly rooms = new Map<string, RoomRecord>();
  private readonly socketLookup = new Map<string, RoomSocketLookup>();

  createRoom(roomId: string) {
    const room: RoomRecord = {
      roomId,
      createdAt: new Date().toISOString(),
      participants: new Map(),
      pendingJoinRequests: new Map(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  hasRoom(roomId: string) {
    return this.rooms.has(roomId);
  }

  getRoom(roomId: string) {
    return this.rooms.get(roomId) ?? null;
  }

  deleteRoom(roomId: string) {
    this.rooms.delete(roomId);
  }

  listParticipants(roomId: string): RoomParticipantRecord[] {
    const room = this.getRoom(roomId);
    if (!room) {
      return [];
    }

    return Array.from(room.participants.values()).sort((left, right) => {
      if (left.isHost !== right.isHost) {
        return left.isHost ? -1 : 1;
      }

      return left.joinedAt.localeCompare(right.joinedAt);
    });
  }

  listPublicParticipants(roomId: string): RoomParticipant[] {
    return this.listParticipants(roomId).map(({ socketId: _socketId, ...participant }) => participant);
  }

  saveParticipant(roomId: string, participant: RoomParticipantRecord) {
    const room = this.getRoom(roomId);
    if (!room) {
      return null;
    }

    room.participants.set(participant.userId, participant);
    this.socketLookup.set(participant.socketId, {
      roomId,
      userId: participant.userId,
    });
    return participant;
  }

  findParticipant(roomId: string, userId: string) {
    return this.getRoom(roomId)?.participants.get(userId) ?? null;
  }

  findParticipantBySocket(socketId: string) {
    const lookup = this.socketLookup.get(socketId);
    if (!lookup) {
      return null;
    }

    const participant = this.findParticipant(lookup.roomId, lookup.userId);
    if (!participant) {
      this.socketLookup.delete(socketId);
      return null;
    }

    return {
      roomId: lookup.roomId,
      participant,
    };
  }

  removeParticipant(roomId: string, userId: string) {
    const room = this.getRoom(roomId);
    if (!room) {
      return null;
    }

    const participant = room.participants.get(userId) ?? null;
    if (!participant) {
      return null;
    }

    room.participants.delete(userId);
    this.socketLookup.delete(participant.socketId);
    return participant;
  }

  dissociateSocket(socketId: string) {
    this.socketLookup.delete(socketId);
  }

  updateParticipant(
    roomId: string,
    userId: string,
    updater: (participant: RoomParticipantRecord) => RoomParticipantRecord,
  ) {
    const room = this.getRoom(roomId);
    if (!room) {
      return null;
    }

    const current = room.participants.get(userId);
    if (!current) {
      return null;
    }

    const next = updater(current);
    room.participants.set(userId, next);
    return next;
  }

  getSocketId(roomId: string, userId: string) {
    return this.findParticipant(roomId, userId)?.socketId ?? null;
  }

  addPendingJoinRequest(roomId: string, request: PendingJoinRequest) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    room.pendingJoinRequests.set(request.userId, request);
    return request;
  }

  removePendingJoinRequest(roomId: string, userId: string) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    const req = room.pendingJoinRequests.get(userId) ?? null;
    room.pendingJoinRequests.delete(userId);
    return req;
  }

  getPendingJoinRequest(roomId: string, userId: string) {
    return this.getRoom(roomId)?.pendingJoinRequests.get(userId) ?? null;
  }

  findPendingBySocket(socketId: string): { roomId: string; userId: string } | null {
    for (const [roomId, room] of this.rooms) {
      for (const [userId, req] of room.pendingJoinRequests) {
        if (req.socketId === socketId) {
          return { roomId, userId };
        }
      }
    }
    return null;
  }
}

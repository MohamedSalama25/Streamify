import { SOCKET_EVENTS, type ServerToClientEvents } from "@streamify/shared";

import type { AppSocketServer } from "../../../common/types/socket";
import type { RoomService } from "../../rooms/services/room-service";

export class SignalRelayService {
  constructor(
    private readonly io: AppSocketServer,
    private readonly roomService: RoomService,
  ) {}

  relayToParticipant<TEvent extends keyof ServerToClientEvents>(
    roomId: string,
    targetUserId: string,
    event: TEvent,
    payload: Parameters<ServerToClientEvents[TEvent]>[0],
  ) {
    const socketId = this.roomService.getParticipantSocketId(roomId, targetUserId);
    if (!socketId) {
      return false;
    }

    (
      this.io.to(socketId).emit as (
        emittedEvent: TEvent,
        emittedPayload: Parameters<ServerToClientEvents[TEvent]>[0],
      ) => void
    )(event, payload);
    return true;
  }

  broadcastPeerReady(
    roomId: string,
    payload: Parameters<ServerToClientEvents[typeof SOCKET_EVENTS.RTC.PEER_READY]>[0],
    exceptSocketId: string,
  ) {
    this.io.to(roomId).except(exceptSocketId).emit(SOCKET_EVENTS.RTC.PEER_READY, payload);
  }
}

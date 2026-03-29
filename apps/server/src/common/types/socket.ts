import type { ClientToServerEvents, ServerToClientEvents } from "@streamify/shared";
import type { Server, Socket } from "socket.io";

export type InterServerEvents = Record<never, never>;

export interface SocketData {
  roomId?: string;
  userId?: string;
}

export type AppSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

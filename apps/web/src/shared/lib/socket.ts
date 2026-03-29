"use client";

import type { ClientToServerEvents, ServerToClientEvents } from "@streamify/shared";
import { io, type Socket } from "socket.io-client";

import { clientEnv } from "./env";

export type StreamifySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: StreamifySocket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(clientEnv.NEXT_PUBLIC_SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 8_000,
    });
  }

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
}


"use client";

import {
  SOCKET_EVENTS,
  type RoomCreatePayload,
  type RoomCreateResponse,
  type RoomJoinPayload,
  type RoomJoinedPayload,
  type RoomLeavePayload,
  type RoomLeaveResponse,
  type ServerToClientEvents,
  type ClientToServerEvents,
  type SocketAck,
  type UserIdentity,
} from "@streamify/shared";
import { io, type Socket } from "socket.io-client";

import { clientEnv } from "./env";

type StreamifySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const DEFAULT_KEEP_ALIVE_INTERVAL_MS = 12 * 60 * 1000;
const KEEP_ALIVE_CONNECT_TIMEOUT_MS = 15_000;
const KEEP_ALIVE_ACK_TIMEOUT_MS = 15_000;
const WARMUP_DISPLAY_NAME = "Warmup Bot";

let keepAliveIntervalId: number | null = null;
let keepAliveInFlight = false;

function generateUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function createWarmupIdentity(): UserIdentity {
  return {
    userId: generateUuid(),
    displayName: WARMUP_DISPLAY_NAME,
  };
}

function resolveAck<T>(response?: SocketAck<T>): T {
  if (!response) {
    throw new Error("The server did not acknowledge the request.");
  }

  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return response.data;
}

function connectSocket(socket: StreamifySocket, timeoutMs: number) {
  if (socket.connected) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Connection timeout."));
    }, timeoutMs);

    const handleConnect = () => {
      cleanup();
      resolve();
    };
    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);
    socket.connect();
  });
}

function emitWithAck<T>(
  socket: StreamifySocket,
  event: string,
  payload: unknown,
  timeoutMs: number,
) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Ack timeout."));
    }, timeoutMs);

    (socket.emit as (ev: string, data: unknown, callback: (res?: SocketAck<T>) => void) => void)(
      event,
      payload,
      (response?: SocketAck<T>) => {
        window.clearTimeout(timeoutId);
        try {
          resolve(resolveAck(response));
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

async function runWarmupCycle() {
  if (keepAliveInFlight) return;
  keepAliveInFlight = true;

  const socket: StreamifySocket = io(clientEnv.NEXT_PUBLIC_SOCKET_URL, {
    autoConnect: false,
    transports: ["polling", "websocket"],
    reconnection: false,
    timeout: KEEP_ALIVE_CONNECT_TIMEOUT_MS,
  });

  try {
    await connectSocket(socket, KEEP_ALIVE_CONNECT_TIMEOUT_MS);

    const user = createWarmupIdentity();
    const createPayload: RoomCreatePayload = { user };
    const { roomId, accessToken } = await emitWithAck<RoomCreateResponse>(
      socket,
      SOCKET_EVENTS.ROOM.CREATE,
      createPayload,
      KEEP_ALIVE_ACK_TIMEOUT_MS,
    );

    const joinPayload: RoomJoinPayload = { roomId, user, accessToken };
    await emitWithAck<RoomJoinedPayload>(
      socket,
      SOCKET_EVENTS.ROOM.JOIN,
      joinPayload,
      KEEP_ALIVE_ACK_TIMEOUT_MS,
    );

    const leavePayload: RoomLeavePayload = { roomId, userId: user.userId };
    await emitWithAck<RoomLeaveResponse>(
      socket,
      SOCKET_EVENTS.ROOM.LEAVE,
      leavePayload,
      KEEP_ALIVE_ACK_TIMEOUT_MS,
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.debug("Keep-alive warmup failed.", error);
    }
  } finally {
    socket.disconnect();
    keepAliveInFlight = false;
  }
}

export function startRoomKeepAlive() {
  if (keepAliveIntervalId != null) {
    return;
  }

  const intervalMs = clientEnv.NEXT_PUBLIC_KEEP_ALIVE_INTERVAL_MS ?? DEFAULT_KEEP_ALIVE_INTERVAL_MS;
  if (intervalMs <= 0) {
    return;
  }

  void runWarmupCycle();
  keepAliveIntervalId = window.setInterval(() => {
    void runWarmupCycle();
  }, intervalMs);
}

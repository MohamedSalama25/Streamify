"use client";

import {
  SOCKET_EVENTS,
  type CancelJoinRequestPayload,
  type JoinRequestPayload,
  type JoinResponsePayload,
  type PresenceMediaStatePayload,
  type RoomCreatePayload,
  type RoomCreateResponse,
  type RoomJoinedPayload,
  type RoomJoinPayload,
  type RoomLeavePayload,
  type RoomLeaveResponse,
  type ScreenSharePayload,
  type SocketAck,
} from "@streamify/shared";

import { ensureSignalingServerReady, type StreamifySocket } from "@/shared/lib/socket";

const SOCKET_CONNECT_TIMEOUT_MS = 25_000;
const SOCKET_ACK_TIMEOUT_MS = 15_000;

let pendingConnectPromise: Promise<void> | null = null;

function resolveAck<T>(response: SocketAck<T>) {
  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return response.data;
}

function createAckTimeoutError() {
  return new Error("The server took too long to respond. Please try again.");
}

async function connectSocket(socket: StreamifySocket) {
  if (socket.connected) {
    return;
  }

  if (!pendingConnectPromise) {
    pendingConnectPromise = (async () => {
      await ensureSignalingServerReady();

      await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          cleanup();
          reject(createAckTimeoutError());
        }, SOCKET_CONNECT_TIMEOUT_MS);

        const handleConnect = () => {
          cleanup();
          resolve();
        };
        const handleError = (error: Error) => {
          cleanup();
          reject(new Error(error.message || "Unable to connect to the signaling server."));
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
    })().finally(() => {
      pendingConnectPromise = null;
    });
  }

  await pendingConnectPromise;
}

interface EmitWithAckOptions<T> {
  connect?: boolean;
  allowMissingResponse?: boolean;
  missingResponseValue?: T;
}

export async function emitWithAck<T>(
  socket: StreamifySocket,
  event: string,
  payload: unknown,
  options: EmitWithAckOptions<T> = {},
) {
  const {
    connect = true,
    allowMissingResponse = false,
    missingResponseValue,
  } = options;

  if (connect) {
    await connectSocket(socket);
  } else if (!socket.connected) {
    throw new Error("Unable to send the request because the socket is disconnected.");
  }

  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(createAckTimeoutError());
    }, SOCKET_ACK_TIMEOUT_MS);

    const acknowledge = (response?: SocketAck<T>) => {
      window.clearTimeout(timeoutId);

      if (!response) {
        if (allowMissingResponse) {
          resolve(missingResponseValue as T);
          return;
        }

        reject(new Error("The server did not acknowledge the request."));
        return;
      }

      try {
        resolve(resolveAck(response));
      } catch (error) {
        reject(error);
      }
    };

    (socket.emit as (event: string, payload: unknown, callback: (response?: SocketAck<T>) => void) => void)(
      event,
      payload,
      acknowledge,
    );
  });
}

export async function createRoomRequest(socket: StreamifySocket, payload: RoomCreatePayload) {
  return emitWithAck<RoomCreateResponse>(socket, SOCKET_EVENTS.ROOM.CREATE, payload);
}

export async function joinRoomRequest(socket: StreamifySocket, payload: RoomJoinPayload) {
  return emitWithAck<RoomJoinedPayload>(socket, SOCKET_EVENTS.ROOM.JOIN, payload);
}

export async function leaveRoomRequest(socket: StreamifySocket, payload: RoomLeavePayload) {
  if (!socket.connected) {
    return null;
  }

  return emitWithAck<RoomLeaveResponse | null>(socket, SOCKET_EVENTS.ROOM.LEAVE, payload, {
    connect: false,
    allowMissingResponse: true,
    missingResponseValue: null,
  });
}

export async function sendJoinRequest(socket: StreamifySocket, payload: JoinRequestPayload) {
  return emitWithAck<{ queued: boolean }>(socket, SOCKET_EVENTS.ROOM.JOIN_REQUEST, payload);
}

export async function sendCancelJoinRequest(
  socket: StreamifySocket,
  payload: CancelJoinRequestPayload,
) {
  return emitWithAck<{ ok: boolean }>(
    socket,
    SOCKET_EVENTS.ROOM.JOIN_REQUEST_CANCELLED,
    payload,
  );
}

export async function sendJoinResponse(socket: StreamifySocket, payload: JoinResponsePayload) {
  return emitWithAck<{ ok: boolean }>(socket, SOCKET_EVENTS.ROOM.JOIN_RESPONSE, payload, {
    connect: false,
  });
}

export function emitMediaState(socket: StreamifySocket, payload: PresenceMediaStatePayload) {
  socket.emit(SOCKET_EVENTS.PRESENCE.MEDIA_STATE, payload);
}

export function emitScreenShare(socket: StreamifySocket, active: boolean, payload: ScreenSharePayload) {
  socket.emit(active ? SOCKET_EVENTS.SCREEN.START : SOCKET_EVENTS.SCREEN.STOP, payload);
}

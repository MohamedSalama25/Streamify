"use client";

import {
  SOCKET_EVENTS,
  type JoinRequestPayload,
  type CancelJoinRequestPayload,
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

import type { StreamifySocket } from "@/shared/lib/socket";

async function connectSocket(socket: StreamifySocket) {
  if (socket.connected) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const handleConnect = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Unable to connect to the signaling server."));
    };
    const cleanup = () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);
    socket.connect();
  });
}

function resolveAck<T>(response: SocketAck<T>) {
  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function createRoomRequest(socket: StreamifySocket, payload: RoomCreatePayload) {
  await connectSocket(socket);

  return new Promise<RoomCreateResponse>((resolve, reject) => {
    socket.emit(SOCKET_EVENTS.ROOM.CREATE, payload, (response) => {
      try {
        resolve(resolveAck(response));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function joinRoomRequest(socket: StreamifySocket, payload: RoomJoinPayload) {
  await connectSocket(socket);

  return new Promise<RoomJoinedPayload>((resolve, reject) => {
    socket.emit(SOCKET_EVENTS.ROOM.JOIN, payload, (response) => {
      try {
        resolve(resolveAck(response));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function leaveRoomRequest(socket: StreamifySocket, payload: RoomLeavePayload) {
  if (!socket.connected) {
    return null;
  }

  return new Promise<RoomLeaveResponse | null>((resolve, reject) => {
    socket.emit(SOCKET_EVENTS.ROOM.LEAVE, payload, (response) => {
      if (!response) {
        resolve(null);
        return;
      }

      try {
        resolve(resolveAck(response));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function sendJoinRequest(socket: StreamifySocket, payload: JoinRequestPayload) {
  await connectSocket(socket);

  return new Promise<{ queued: boolean }>((resolve, reject) => {
    socket.emit(SOCKET_EVENTS.ROOM.JOIN_REQUEST, payload, (response) => {
      try {
        resolve(resolveAck(response));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function sendCancelJoinRequest(socket: StreamifySocket, payload: CancelJoinRequestPayload) {
  await connectSocket(socket);

  return new Promise<{ ok: boolean }>((resolve, reject) => {
    socket.emit(SOCKET_EVENTS.ROOM.JOIN_REQUEST_CANCELLED, payload, (response) => {
      try {
        resolve(resolveAck(response));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export function sendJoinResponse(socket: StreamifySocket, payload: JoinResponsePayload) {
  socket.emit(SOCKET_EVENTS.ROOM.JOIN_RESPONSE, payload);
}

export function emitMediaState(socket: StreamifySocket, payload: PresenceMediaStatePayload) {
  socket.emit(SOCKET_EVENTS.PRESENCE.MEDIA_STATE, payload);
}

export function emitScreenShare(socket: StreamifySocket, active: boolean, payload: ScreenSharePayload) {
  socket.emit(active ? SOCKET_EVENTS.SCREEN.START : SOCKET_EVENTS.SCREEN.STOP, payload);
}


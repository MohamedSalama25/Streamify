"use client";

import type { ClientToServerEvents, ServerToClientEvents } from "@streamify/shared";
import { io, type Socket } from "socket.io-client";

import { clientEnv } from "./env";

export type StreamifySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: StreamifySocket | null = null;
let signalingWarmupPromise: Promise<void> | null = null;

const SIGNALING_HEALTH_TIMEOUT_MS = 30_000;
const SIGNALING_WARMUP_RETRY_DELAYS_MS = [0, 1_500] as const;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function pingSignalingHealth() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SIGNALING_HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${clientEnv.NEXT_PUBLIC_SOCKET_URL}/health`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}.`);
    }
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function ensureSignalingServerReady() {
  if (!signalingWarmupPromise) {
    signalingWarmupPromise = (async () => {
      let lastError: unknown;

      for (const delayMs of SIGNALING_WARMUP_RETRY_DELAYS_MS) {
        if (delayMs > 0) {
          await wait(delayMs);
        }

        try {
          await pingSignalingHealth();
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError instanceof Error && lastError.name === "AbortError") {
        throw new Error("The signaling server is waking up. Please try again in a few seconds.");
      }

      throw new Error("Unable to reach the signaling server.");
    })().finally(() => {
      signalingWarmupPromise = null;
    });
  }

  return signalingWarmupPromise;
}

export function getSocket() {
  if (!socket) {
    socket = io(clientEnv.NEXT_PUBLIC_SOCKET_URL, {
      autoConnect: false,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 20_000,
    });
  }

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

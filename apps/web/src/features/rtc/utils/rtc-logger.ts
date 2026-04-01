"use client";

export function logRtcEvent(event: string, metadata: Record<string, unknown>) {
  console.info(`[rtc] ${event}`, metadata);
}

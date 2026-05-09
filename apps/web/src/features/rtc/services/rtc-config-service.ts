"use client";

import { rtcConfigurationResponseSchema, type RtcConfigurationResponse } from "@streamify/shared";

import { fetchJson } from "@/shared/lib/api";
import { clientEnv } from "@/shared/lib/env";

export async function fetchRtcConfiguration(): Promise<RtcConfigurationResponse> {
  const payload = await fetchJson<RtcConfigurationResponse>(
    `${clientEnv.NEXT_PUBLIC_SOCKET_URL}/api/rtc-config`,
    {
      cache: "no-store",
    },
  );

  return rtcConfigurationResponseSchema.parse(payload);
}

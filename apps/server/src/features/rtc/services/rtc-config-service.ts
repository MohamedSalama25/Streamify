import { DEFAULT_STUN_SERVERS, type IceServerConfig } from "@streamify/shared";

import { env } from "../../../config/env";

function splitCsv(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export class RtcConfigService {
  getConfiguration() {
    const stunUrls = splitCsv(env.RTC_STUN_URLS);
    const turnUrls = splitCsv(env.RTC_TURN_URLS);

    const iceServers: IceServerConfig[] = [];
    const warnings: string[] = [];

    iceServers.push({
      urls: stunUrls.length > 0 ? stunUrls : [...DEFAULT_STUN_SERVERS],
    });

    const hasTurnUrls = turnUrls.length > 0;
    const hasTurnCredentials = Boolean(env.RTC_TURN_USERNAME && env.RTC_TURN_CREDENTIAL);

    if (hasTurnUrls && !hasTurnCredentials) {
      throw new Error("RTC_TURN_URLS is set but RTC_TURN_USERNAME/RTC_TURN_CREDENTIAL are missing.");
    }

    if (hasTurnUrls && hasTurnCredentials) {
      iceServers.push({
        urls: turnUrls,
        username: env.RTC_TURN_USERNAME,
        credential: env.RTC_TURN_CREDENTIAL,
      });
    } else {
      const requireTurn = env.RTC_REQUIRE_TURN ?? env.NODE_ENV === "production";
      if (requireTurn) {
        warnings.push(
          "TURN server is not configured. Calls may fail across different networks/NATs. Set RTC_TURN_URLS/RTC_TURN_USERNAME/RTC_TURN_CREDENTIAL.",
        );
      }
    }

    return {
      iceServers,
      iceTransportPolicy: env.RTC_ICE_TRANSPORT_POLICY,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

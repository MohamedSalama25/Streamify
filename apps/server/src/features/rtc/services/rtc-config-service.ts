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

    iceServers.push({
      urls: stunUrls.length > 0 ? stunUrls : [...DEFAULT_STUN_SERVERS],
    });

    if (turnUrls.length > 0 && env.RTC_TURN_USERNAME && env.RTC_TURN_CREDENTIAL) {
      iceServers.push({
        urls: turnUrls,
        username: env.RTC_TURN_USERNAME,
        credential: env.RTC_TURN_CREDENTIAL,
      });
    }

    return {
      iceServers,
    };
  }
}


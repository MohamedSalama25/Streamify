import type { RequestHandler } from "express";

import type { RtcConfigService } from "../services/rtc-config-service";

export function createRtcConfigController(rtcConfigService: RtcConfigService): RequestHandler {
  return (_request, response) => {
    response.json(rtcConfigService.getConfiguration());
  };
}


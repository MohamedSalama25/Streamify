import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { healthController } from "./features/health/health.controller";
import { createRtcConfigController } from "./features/rtc/controllers/rtc-config.controller";
import type { RtcConfigService } from "./features/rtc/services/rtc-config-service";

export function createApp(rtcConfigService: RtcConfigService) {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/health", healthController);
  app.get("/api/rtc-config", createRtcConfigController(rtcConfigService));

  return app;
}


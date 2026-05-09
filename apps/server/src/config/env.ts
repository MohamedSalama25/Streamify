import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  CLIENT_URLS: z.string().optional(),
  RTC_STUN_URLS: z.string().optional(),
  RTC_TURN_URLS: z.string().optional(),
  RTC_TURN_USERNAME: z.string().optional(),
  RTC_TURN_CREDENTIAL: z.string().optional(),
  RTC_REQUIRE_TURN: z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    return String(value).toLowerCase() === "true";
  }, z.boolean().optional()),
  RTC_ICE_TRANSPORT_POLICY: z.enum(["all", "relay"]).optional(),
});

export const env = envSchema.parse(process.env);

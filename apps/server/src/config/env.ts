import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  RTC_STUN_URLS: z.string().optional(),
  RTC_TURN_URLS: z.string().optional(),
  RTC_TURN_USERNAME: z.string().optional(),
  RTC_TURN_CREDENTIAL: z.string().optional(),
});

export const env = envSchema.parse(process.env);

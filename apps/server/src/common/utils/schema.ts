import type { ZodSchema } from "zod";

export function safeParsePayload<T>(schema: ZodSchema<T>, payload: unknown) {
  const result = schema.safeParse(payload);
  return result;
}

export function getValidationMessage(error: { issues?: Array<{ message?: string }> }) {
  return error.issues?.[0]?.message ?? "Invalid payload.";
}


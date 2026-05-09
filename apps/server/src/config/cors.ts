import { env } from "./env";

function splitCsv(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getAllowedOrigins() {
  const configured = splitCsv(env.CLIENT_URLS);
  const fallback = env.CLIENT_URL ? [env.CLIENT_URL] : [];
  return Array.from(new Set([...configured, ...fallback]));
}

export function createCorsOriginValidator() {
  const allowed = new Set(getAllowedOrigins());

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // Non-browser clients (or same-origin) may omit Origin.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowed.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin denied: ${origin}`));
  };
}


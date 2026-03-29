export const logger = {
  info(message: string, metadata?: Record<string, unknown>) {
    console.info(`[streamify] ${message}`, metadata ?? "");
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    console.warn(`[streamify] ${message}`, metadata ?? "");
  },
  error(message: string, metadata?: Record<string, unknown>) {
    console.error(`[streamify] ${message}`, metadata ?? "");
  },
};


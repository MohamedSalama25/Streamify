type LogLevel = "debug" | "info" | "warn" | "error";

function writeLog(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>,
) {
  const entry = JSON.stringify({
    app: "streamify",
    level,
    message,
    timestamp: new Date().toISOString(),
    metadata: metadata ?? {},
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  console.info(entry);
}

export const logger = {
  debug(message: string, metadata?: Record<string, unknown>) {
    writeLog("debug", message, metadata);
  },
  info(message: string, metadata?: Record<string, unknown>) {
    writeLog("info", message, metadata);
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    writeLog("warn", message, metadata);
  },
  error(message: string, metadata?: Record<string, unknown>) {
    writeLog("error", message, metadata);
  },
};

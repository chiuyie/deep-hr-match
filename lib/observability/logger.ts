export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

type ConsoleMethod = "debug" | "info" | "warn" | "error";

function safeSerialize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  return value;
}

function emit(level: LogLevel, event: string, context?: LogContext, error?: unknown) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(context
      ? Object.fromEntries(
          Object.entries(context).map(([key, value]) => [key, safeSerialize(value)])
        )
      : {}),
    ...(error !== undefined ? { error: safeSerialize(error) } : {}),
  };

  const method: ConsoleMethod =
    level === "debug" ? "debug" : level === "info" ? "info" : level === "warn" ? "warn" : "error";

  // Structured JSON so Vercel / container logs stay queryable.
  // eslint-disable-next-line no-console
  console[method](JSON.stringify(payload));

  return payload;
}

export const logger = {
  debug(event: string, context?: LogContext) {
    return emit("debug", event, context);
  },
  info(event: string, context?: LogContext) {
    return emit("info", event, context);
  },
  warn(event: string, context?: LogContext) {
    return emit("warn", event, context);
  },
  error(event: string, context?: LogContext, error?: unknown) {
    return emit("error", event, context, error);
  },
};

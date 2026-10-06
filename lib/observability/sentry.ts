import { logger } from "@/lib/observability/logger";

type CaptureContext = Record<string, unknown>;

function parseSentryDsn(dsn: string): {
  publicKey: string;
  host: string;
  projectId: string;
} | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, "");
    if (!publicKey || !projectId || !url.host) return null;
    return { publicKey, host: url.host, projectId };
  } catch {
    return null;
  }
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("Unknown error");
  }
}

let sentryArmedLogged = false;

function ensureSentryArmedLog() {
  if (sentryArmedLogged) return;
  if (!process.env.SENTRY_DSN?.trim()) return;
  sentryArmedLogged = true;
  logger.info("sentry.armed", {
    area: "observability",
    environment:
      process.env.SENTRY_ENVIRONMENT ??
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",
  });
}

/**
 * Best-effort Sentry store capture when SENTRY_DSN is set.
 * Never throws — unlock/payment paths must not fail because of logging.
 */
export async function captureException(
  error: unknown,
  context: CaptureContext = {}
): Promise<void> {
  const err = toError(error);
  ensureSentryArmedLog();
  logger.error("exception.captured", context, err);

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const parsed = parseSentryDsn(dsn);
  if (!parsed) {
    logger.warn("sentry.dsn_invalid");
    return;
  }

  const endpoint = `https://${parsed.host}/api/${parsed.projectId}/store/`;
  const eventId = crypto.randomUUID().replace(/-/g, "");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": [
          "Sentry sentry_version=7",
          "sentry_client=deep-hr-match/1.0",
          `sentry_key=${parsed.publicKey}`,
        ].join(", "),
      },
      body: JSON.stringify({
        event_id: eventId,
        timestamp: Math.floor(Date.now() / 1000),
        platform: "node",
        level: "error",
        logger: "deep-hr-match",
        server_name: process.env.VERCEL_URL ?? "local",
        environment:
          process.env.SENTRY_ENVIRONMENT ??
          process.env.VERCEL_ENV ??
          process.env.NODE_ENV ??
          "development",
        release: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
        message: err.message,
        exception: {
          values: [
            {
              type: err.name,
              value: err.message,
              stacktrace: err.stack
                ? {
                    frames: err.stack
                      .split("\n")
                      .slice(1)
                      .reverse()
                      .map((line) => ({ filename: line.trim() })),
                  }
                : undefined,
            },
          ],
        },
        tags: {
          area: typeof context.area === "string" ? context.area : "app",
          source: typeof context.source === "string" ? context.source : "unknown",
        },
        extra: context,
      }),
    });

    if (!response.ok) {
      logger.warn("sentry.send_rejected", {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (sendError) {
    logger.warn("sentry.send_failed", {
      message: sendError instanceof Error ? sendError.message : "send failed",
    });
  }
}

export async function captureMessage(
  message: string,
  context: CaptureContext = {},
  level: "warning" | "error" = "error"
): Promise<void> {
  if (level === "warning") {
    logger.warn(message, context);
  } else {
    logger.error(message, context);
  }

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  await captureException(new Error(message), { ...context, level, synthetic: true });
}

export function isSentryConfigured() {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

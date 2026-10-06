import { logger } from "@/lib/observability/logger";
import { captureException } from "@/lib/observability/sentry";

/**
 * Next.js instrumentation — runs once when the Node server starts.
 * Confirms observability is armed when SENTRY_DSN is present.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const hasSentry = Boolean(process.env.SENTRY_DSN?.trim());
  logger.info("observability.boot", {
    area: "observability",
    sentryEnabled: hasSentry,
    environment:
      process.env.SENTRY_ENVIRONMENT ??
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",
  });

  if (typeof process !== "undefined" && typeof process.on === "function") {
    process.on("unhandledRejection", (reason) => {
      void captureException(reason, {
        area: "observability",
        source: "unhandledRejection",
      });
    });
    process.on("uncaughtException", (error) => {
      void captureException(error, {
        area: "observability",
        source: "uncaughtException",
      });
    });
  }
}

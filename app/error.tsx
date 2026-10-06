"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toUserFacingMessage } from "@/lib/ui/readable-error";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured console payload for host log drains (Vercel / etc.).
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        event: "app.error_boundary",
        digest: error.digest ?? null,
        message: error.message,
        stack: error.stack,
      })
    );
  }, [error]);

  const message = toUserFacingMessage(error.message, {
    fallback: "We couldn’t complete that. Try again.",
  });

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 px-6 py-16">
      <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      {error.digest ? (
        <p className="font-mono text-xs text-slate-400">Ref: {error.digest}</p>
      ) : null}
      <Button type="button" className="rounded-xl" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}

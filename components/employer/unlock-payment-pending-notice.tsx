"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const MAX_AUTO_REFRESHES = 8;

/**
 * Soft refresh while Stripe webhook / fulfill is still catching up after checkout.
 * Stops after a few attempts so a broken webhook does not refresh forever.
 */
export function UnlockPaymentPendingNotice({
  active,
  message,
}: {
  active: boolean;
  message?: string;
}) {
  const router = useRouter();
  const [ticks, setTicks] = useState(0);
  const [pending, startTransition] = useTransition();
  const exhausted = ticks >= MAX_AUTO_REFRESHES;

  useEffect(() => {
    if (!active || exhausted) return;
    const timer = window.setInterval(() => {
      setTicks((value) => value + 1);
      startTransition(() => {
        router.refresh();
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [active, exhausted, router]);

  if (!active) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50 to-white shadow-sm">
      <div className="flex items-start gap-3 px-5 py-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
          <Loader2 className={`h-4 w-4 ${pending && !exhausted ? "animate-spin" : ""}`} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-sky-950">
            {exhausted ? "Still finishing unlock" : "Finishing unlock"}
          </p>
          <p className="mt-0.5 text-sm text-sky-900/80">
            {exhausted
              ? "Payment went through, but unlocks are taking longer than expected. Refresh this page, or return to matching and open View unlocked."
              : (message ??
                "Payment went through. Unlocking profiles now — this page refreshes automatically.")}
            {!exhausted && ticks > 0 ? ` (check ${ticks})` : null}
          </p>
        </div>
      </div>
      {!exhausted ? (
        <div className="h-1 bg-sky-100">
          <div
            className="h-full bg-sky-400/80 transition-all duration-500"
            style={{ width: `${Math.min(100, (ticks / MAX_AUTO_REFRESHES) * 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

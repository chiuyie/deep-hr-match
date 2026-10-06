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
    <div className="mb-6 overflow-hidden rounded-[1.35rem] border border-sky-200/80 bg-[linear-gradient(135deg,#f0f9ff,#ffffff)] shadow-[0_16px_36px_-28px_rgba(3,105,161,0.35)]">
      <div className="flex items-start gap-3.5 px-5 py-4">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Loader2 className={`h-4 w-4 ${pending && !exhausted ? "animate-spin" : ""}`} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold tracking-tight text-sky-950">
            {exhausted ? "Still finishing unlock" : "Finishing unlock"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-sky-900/80">
            {exhausted
              ? "Payment went through, but unlocks are taking longer than expected. Refresh this page, or return to matching and open View unlocked."
              : (message ??
                "Payment went through. Unlocking profiles now — this page refreshes automatically.")}
            {!exhausted && ticks > 0 ? ` (check ${ticks})` : null}
          </p>
        </div>
      </div>
      {!exhausted ? (
        <div className="h-1.5 bg-sky-100/80">
          <div
            className="h-full bg-[linear-gradient(90deg,#38bdf8,#0284c7)] transition-all duration-500"
            style={{ width: `${Math.min(100, (ticks / MAX_AUTO_REFRESHES) * 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

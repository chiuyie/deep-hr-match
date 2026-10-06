"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    <Alert className="mb-6 border-sky-200 bg-sky-50 text-sky-950">
      <Loader2 className={`h-4 w-4 ${pending && !exhausted ? "animate-spin" : ""}`} />
      <AlertTitle>{exhausted ? "Still finishing unlock" : "Finishing unlock"}</AlertTitle>
      <AlertDescription>
        {exhausted
          ? "Payment went through, but unlocks are taking longer than expected. Refresh this page, or return to matching and open View unlocked."
          : (message ??
            "Payment went through. Unlocking profiles now — this page refreshes automatically.")}
        {!exhausted && ticks > 0 ? ` (check ${ticks})` : null}
      </AlertDescription>
    </Alert>
  );
}

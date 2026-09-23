"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toUserFacingMessage } from "@/lib/ui/readable-error";

export function EmployerProfileForm({
  action,
  children,
}: {
  action: (formData: FormData) => Promise<{ error?: string }>;
  children: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await action(formData);
          if (result.error) {
            setSaved(false);
            setError(
              toUserFacingMessage(result.error, {
                fallback: "We couldn’t save your employer profile. Check the form and try again.",
              })
            );
            return;
          }
          setSaved(true);
        });
      }}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {saved && !error ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
          <AlertTitle>Employer profile saved</AlertTitle>
          <AlertDescription>Your employer details are up to date.</AlertDescription>
        </Alert>
      ) : null}
      {children}
      <Button type="submit" className="rounded-xl" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save employer profile
      </Button>
    </form>
  );
}

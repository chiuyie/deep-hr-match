"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { markCandidateReady } from "@/lib/candidate/actions";
import { cn } from "@/lib/utils";

const CONSENT_POINTS = [
  "The profile, CV, and matching answers I submitted are true and accurate.",
  "I agree to share this information with employers who unlock my profile.",
  "I’m okay with those employers contacting me if we match.",
] as const;

type CandidateReadyConsentProps = {
  enabled: boolean;
};

export function CandidateReadyConsent({ enabled }: CandidateReadyConsentProps) {
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-5">
        <Button type="button" disabled className="rounded-xl">
          Mark ready for matching
        </Button>
        <p className="mt-3 text-sm text-slate-500">
          Finish every checklist item above before you can go live for matching.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-emerald-50/40 shadow-sm">
      <div className="border-b border-sky-100/80 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Before you go live</h3>
            <p className="mt-1 text-sm text-slate-600">
              Marking ready means employers can find you in matching results.
            </p>
          </div>
        </div>
      </div>

      <form
        className="space-y-5 px-5 py-5 sm:px-6"
        action={(formData) => {
          startTransition(async () => {
            await markCandidateReady(formData);
          });
        }}
      >
        <input type="hidden" name="matching_consent" value={agreed ? "on" : ""} />

        <ul className="space-y-2.5 text-sm text-slate-700">
          {CONSENT_POINTS.map((point) => (
            <li key={point} className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 transition",
            agreed ? "border-sky-300 ring-2 ring-sky-100" : "border-slate-200 hover:border-slate-300"
          )}
        >
          <Checkbox
            checked={agreed}
            onCheckedChange={(value) => setAgreed(value === true)}
            className="mt-0.5"
            aria-required
          />
          <span className="text-sm leading-relaxed text-slate-800">
            I understand and agree to the points above.
          </span>
        </label>

        <Button
          type="submit"
          className="w-full rounded-xl sm:w-auto"
          disabled={!agreed || pending}
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Marking ready…
            </>
          ) : (
            "Agree and mark ready for matching"
          )}
        </Button>
      </form>
    </div>
  );
}

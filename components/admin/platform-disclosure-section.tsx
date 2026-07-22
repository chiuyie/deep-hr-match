"use client";

import { useMemo } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updatePlatformDisclosure } from "@/lib/admin/platform-disclosure-actions";
import type { EmployerDisclosureMode } from "@/lib/form-fields/types";
import type { PlatformDisclosureItem } from "@/lib/employer/platform-disclosure";

const CATEGORY_META: Record<
  PlatformDisclosureItem["category"],
  { title: string; hint: string }
> = {
  scores: {
    title: "Scores & ranking",
    hint: "What employers see on anonymized ranked lists.",
  },
  matrix: {
    title: "7^7 matching language",
    hint: "Candidate word choices and job comparison on the match report.",
  },
  report: {
    title: "Match report & documents",
    hint: "Narrative summary and CV after unlock.",
  },
};

function isShownAfterUnlock(mode: EmployerDisclosureMode) {
  return mode !== "admin_removed";
}

interface PlatformDisclosureSectionProps {
  items: PlatformDisclosureItem[];
  pending: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}

export function PlatformDisclosureSection({
  items,
  pending,
  onRunAction,
}: PlatformDisclosureSectionProps) {
  const grouped = useMemo(() => {
    const order: PlatformDisclosureItem["category"][] = ["scores", "matrix", "report"];
    return order.map((category) => ({
      category,
      ...CATEGORY_META[category],
      rows: items.filter((item) => item.category === category),
    }));
  }, [items]);

  const beforeCount = items.filter((item) => item.show_on_anonymous_match).length;
  const afterCount = items.filter((item) =>
    isShownAfterUnlock(item.employer_disclosure_mode)
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
            Platform data · before unlock
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{beforeCount}</p>
          <p className="mt-1 text-sm text-slate-600">scores, matrix teasers, etc.</p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800/80">
            Platform data · after unlock
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{afterCount}</p>
          <p className="mt-1 text-sm text-slate-600">7^7 answers, report, CV</p>
        </div>
      </div>

      {grouped.map((group) => (
        <details
          key={group.category}
          className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
          open={group.category !== "report"}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 marker:content-none">
            <div>
              <p className="text-sm font-semibold text-slate-800">{group.title}</p>
              <p className="text-xs text-slate-500">{group.hint}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="divide-y divide-slate-100">
            {group.rows.map((item) => {
              const shownAfter = isShownAfterUnlock(item.employer_disclosure_mode);
              return (
                <div
                  key={item.disclosure_key}
                  className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={item.show_on_anonymous_match ? "secondary" : "outline"}
                      className="h-9 w-full justify-start rounded-xl text-xs sm:w-auto"
                      disabled={pending}
                      onClick={() =>
                        onRunAction(
                          () =>
                            updatePlatformDisclosure(item.disclosure_key, {
                              show_on_anonymous_match: !item.show_on_anonymous_match,
                            }),
                          item.show_on_anonymous_match
                            ? "Hidden from anonymized rankings"
                            : "Shown on anonymized rankings"
                        )
                      }
                    >
                      {item.show_on_anonymous_match ? (
                        <>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          On rankings
                        </>
                      ) : (
                        <>
                          <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                          Off rankings
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        size="sm"
                        variant={shownAfter ? "secondary" : "outline"}
                        className="h-9 justify-start rounded-xl text-xs"
                        disabled={pending}
                        onClick={() => {
                          const nextMode: EmployerDisclosureMode = shownAfter
                            ? "admin_removed"
                            : "always_visible";
                          onRunAction(
                            () =>
                              updatePlatformDisclosure(item.disclosure_key, {
                                employer_disclosure_mode: nextMode,
                              }),
                            nextMode === "admin_removed"
                              ? "Kept private after unlock"
                              : "Shown after unlock"
                          );
                        }}
                      >
                        {shownAfter ? "Included after unlock" : "Private after unlock"}
                      </Button>
                      {shownAfter && item.employer_disclosure_mode === "candidate_optional" ? (
                        <Badge variant="outline" className="w-fit text-[10px]">
                          Only if available
                        </Badge>
                      ) : null}
                    </div>
                    {shownAfter && item.disclosure_key === "match_narrative" ? (
                      <select
                        value={item.employer_disclosure_mode}
                        disabled={pending}
                        onChange={(e) => {
                          const nextMode = e.target.value as EmployerDisclosureMode;
                          if (nextMode === "admin_removed") return;
                          onRunAction(
                            () =>
                              updatePlatformDisclosure(item.disclosure_key, {
                                employer_disclosure_mode: nextMode,
                              }),
                            "After-unlock visibility updated"
                          );
                        }}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs"
                        aria-label="Match narrative visibility"
                      >
                        <option value="always_visible">Always include</option>
                        <option value="candidate_optional">Only if generated</option>
                      </select>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}

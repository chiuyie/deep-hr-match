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
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Platform data · before unlock
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{beforeCount}</p>
          <p className="mt-1 text-sm text-slate-600">Scores, matrix teasers, and ranking data</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Platform data · after unlock
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{afterCount}</p>
          <p className="mt-1 text-sm text-slate-600">7^7 answers, match report, and CV</p>
        </div>
      </div>

      {grouped.map((group) => (
        <details
          key={group.category}
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          open={group.category !== "report"}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5 marker:content-none">
            <div>
              <p className="text-sm font-semibold text-slate-900">{group.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{group.hint}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
          </summary>
          <div className="divide-y divide-slate-200">
            {group.rows.map((item) => {
              const shownAfter = isShownAfterUnlock(item.employer_disclosure_mode);
              return (
                <div
                  key={item.disclosure_key}
                  className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={item.show_on_anonymous_match ? "secondary" : "outline"}
                      className="h-9 w-full justify-start rounded-xl text-sm sm:w-auto"
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
                    <Badge
                      variant="secondary"
                      className="border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700"
                    >
                      {item.show_on_anonymous_match ? "Visible before unlock" : "Hidden before unlock"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        size="sm"
                        variant={shownAfter ? "secondary" : "outline"}
                        className="h-9 justify-start rounded-xl text-sm"
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
                        {shownAfter ? (
                          <>
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Include after unlock
                          </>
                        ) : (
                          <>
                            <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                            Keep private
                          </>
                        )}
                      </Button>
                      {shownAfter && item.employer_disclosure_mode === "candidate_optional" ? (
                        <Badge
                          variant="outline"
                          className="w-fit border-slate-300 text-[11px] font-medium text-slate-700"
                        >
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
                        className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-800"
                        aria-label="Match narrative visibility"
                      >
                        <option value="always_visible">Always include</option>
                        <option value="candidate_optional">Only if generated</option>
                      </select>
                    ) : null}
                    <Badge
                      variant="secondary"
                      className="border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700"
                    >
                      {shownAfter ? "Visible after unlock" : "Private after unlock"}
                    </Badge>
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

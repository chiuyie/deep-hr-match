"use client";

import { Progress } from "@/components/ui/progress";
import { JOB_FORM_SECTIONS } from "@/lib/constants/job-form";
import { cn } from "@/lib/utils";

interface JobCreationProgressHeaderProps {
  sectionIndex: number;
  sectionFillPercent: number;
  sectionFilled: number;
  sectionTotal: number;
  sectionsCompleted: number;
  sectionCount: number;
  preferredPartLabel?: string;
}

export function JobCreationProgressHeader({
  sectionIndex,
  sectionFillPercent,
  sectionFilled,
  sectionTotal,
  sectionsCompleted,
  sectionCount,
  preferredPartLabel,
}: JobCreationProgressHeaderProps) {
  const section = JOB_FORM_SECTIONS[sectionIndex];
  const overallPercent = sectionCount
    ? Math.round((sectionsCompleted / sectionCount) * 100)
    : 0;

  return (
    <div
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      role="status"
      aria-live="polite"
      aria-label={`Job form step ${sectionIndex + 1} of ${sectionCount}, ${sectionsCompleted} steps complete`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Step {sectionIndex + 1} of {sectionCount}
          </p>
          <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">{section.title}</h1>
          {preferredPartLabel && (
            <p className="mt-1 text-sm font-medium text-slate-600">{preferredPartLabel}</p>
          )}
          <p className="mt-1 text-sm text-slate-500">
            {section.id === "job-identification" ||
            section.id === "background-information-questions" ||
            section.id === "preferred-selection-by-the-employer"
              ? "Complete the required fields on this step to continue."
              : section.id === "compensation"
                ? "Optional — budget and benefits for this role only."
                : `Optional fields filled: ${sectionFilled} of ${sectionTotal}${
                    sectionTotal > 0 ? ` (${sectionFillPercent}%)` : ""
                  }`}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-2 text-right">
          <p className="text-xs font-medium text-slate-500">Steps complete</p>
          <p className="text-2xl font-bold tabular-nums text-slate-900">
            {sectionsCompleted}/{sectionCount}
          </p>
          <p className="text-xs text-slate-500">{overallPercent}% of workflow</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
          <span>Posting progress (by step)</span>
          <span className="tabular-nums">{overallPercent}%</span>
        </div>
        <Progress value={overallPercent} className="h-2" />
      </div>

      <div className="mt-4 flex gap-1">
        {JOB_FORM_SECTIONS.map((item, index) => {
          const done = index < sectionIndex;
          const current = index === sectionIndex;
          return (
            <div
              key={item.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                done && "bg-emerald-500",
                current && "bg-primary",
                !done && !current && "bg-slate-200"
              )}
              title={item.title}
            />
          );
        })}
      </div>
    </div>
  );
}

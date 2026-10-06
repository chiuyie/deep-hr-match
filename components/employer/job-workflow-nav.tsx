"use client";

import Link from "next/link";
import { Briefcase, FileText, Grid3X3, Target, Unlock } from "lucide-react";
import { FRAMEWORK } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";

export type JobWorkflowStep = "view" | "edit" | "jd" | "matrix" | "matching" | "unlocked";

const steps: {
  id: JobWorkflowStep;
  label: string;
  shortLabel: string;
  icon: typeof Briefcase;
  gradient: string;
  path: (jobId: string) => string;
  editOnly?: boolean;
}[] = [
  {
    id: "edit",
    label: "Edit Job",
    shortLabel: "Edit",
    icon: Briefcase,
    gradient: "from-cyan-500 to-cyan-600",
    path: (jobId) => `/employer/jobs/${jobId}`,
    editOnly: true,
  },
  {
    id: "view",
    label: "View Job",
    shortLabel: "View",
    icon: Briefcase,
    gradient: "from-cyan-500 to-cyan-600",
    path: (jobId) => `/employer/jobs/${jobId}/view`,
  },
  {
    id: "jd",
    label: "JD Upload",
    shortLabel: "JD",
    icon: FileText,
    gradient: "from-blue-500 to-blue-600",
    path: (jobId) => `/employer/jobs/${jobId}/jd`,
  },
  {
    id: "matrix",
    label: `${FRAMEWORK} Form`,
    shortLabel: FRAMEWORK,
    icon: Grid3X3,
    gradient: "from-sky-500 to-blue-600",
    path: (jobId) => `/employer/jobs/${jobId}/matrix`,
  },
  {
    id: "matching",
    label: "Matching",
    shortLabel: "Match",
    icon: Target,
    gradient: "from-emerald-500 to-emerald-600",
    path: (jobId) => `/employer/jobs/${jobId}/matching`,
  },
  {
    id: "unlocked",
    label: "Unlocked",
    shortLabel: "Unlocked",
    icon: Unlock,
    gradient: "from-amber-500 to-amber-600",
    path: (jobId) => `/employer/jobs/${jobId}/unlocked`,
  },
];

export function JobWorkflowNav({
  jobId,
  currentStep,
  canEdit = true,
}: {
  jobId: string;
  currentStep: JobWorkflowStep;
  canEdit?: boolean;
}) {
  const visibleSteps = steps.filter((step) => canEdit || !step.editOnly);

  return (
    <nav
      className="relative mb-6 overflow-x-auto rounded-[1.35rem] border border-slate-200/70 bg-white p-2 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.35)] [-webkit-overflow-scrolling:touch]"
      aria-label="Job workflow"
    >
      <ul className="flex min-w-max snap-x snap-mandatory gap-1 sm:min-w-0 sm:flex-wrap sm:snap-none">
        {visibleSteps.map((step) => {
          const active = step.id === currentStep;
          const Icon = step.icon;

          return (
            <li key={step.id} className="snap-start sm:flex-1 sm:min-w-[9rem]">
              <Link
                href={step.path(jobId)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                    step.gradient,
                    active && "ring-2 ring-emerald-200/70 ring-offset-1"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-medium">
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

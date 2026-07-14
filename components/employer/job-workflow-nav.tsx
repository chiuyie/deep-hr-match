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
    gradient: "from-purple-500 to-purple-600",
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
      className="mb-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-lg"
      aria-label="Job workflow"
    >
      <ul className="flex min-w-max gap-1 sm:min-w-0 sm:flex-wrap">
        {visibleSteps.map((step) => {
          const active = step.id === currentStep;
          const Icon = step.icon;

          return (
            <li key={step.id} className="flex-1 sm:min-w-[9rem]">
              <Link
                href={step.path(jobId)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                    step.gradient,
                    active && "ring-2 ring-primary/20 ring-offset-1"
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

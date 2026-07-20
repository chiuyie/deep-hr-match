"use client";

import Link from "next/link";
import { Briefcase, Check, User } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: "profile",
    label: "Employer Profile",
    description: "Personalize your employer profile",
    icon: User,
    href: "/employer/company",
  },
  {
    id: "job",
    label: "Create Job",
    description: "Post a new job listing",
    icon: Briefcase,
    href: "/employer/jobs/new",
  },
] as const;

export function JobCreationStepNav({
  currentStep,
  jobFormProgress,
  warnBeforeLeave = false,
}: {
  currentStep: "profile" | "job";
  jobFormProgress?: number;
  warnBeforeLeave?: boolean;
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const macroProgress = Math.min(100, Math.max(0, (currentIndex / (steps.length - 1)) * 100));
  const progress =
    currentStep === "job" && jobFormProgress !== undefined ? jobFormProgress : macroProgress;

  const confirmLeave = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!warnBeforeLeave) return;
    const leave = window.confirm(
      "You have unsaved job form answers on this device. Leave this page anyway?"
    );
    if (!leave) {
      event.preventDefault();
    }
  };

  return (
    <div className="sticky top-0 z-40 -mx-4 mb-6 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-7xl py-2">
        <div className="relative">
          <div className="absolute left-0 right-0 top-[14.5px] px-[75px]" style={{ zIndex: 0 }}>
            <div className="relative h-[3px] w-full rounded-full bg-slate-200">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="relative z-10 flex justify-between">
            {steps.map((step, index) => {
              const completed = index < currentIndex;
              const active = index === currentIndex;
              const upcoming = index > currentIndex;
              const Icon = step.icon;

              return (
                <Link
                  key={step.id}
                  href={step.href}
                  onClick={step.id === "profile" && currentStep === "job" ? confirmLeave : undefined}
                  className="flex w-[150px] flex-col items-center"
                  style={{ flex: "0 0 auto" }}
                >
                  <div className="relative">
                    {active && (
                      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/40 opacity-40 blur-md" />
                    )}
                    <div
                      className={cn(
                        "relative z-20 flex h-8 w-8 items-center justify-center rounded-full border-[3px] transition-all duration-300",
                        completed &&
                          "border-green-400 bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-200",
                        active &&
                          "scale-110 border-primary/60 bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20",
                        upcoming && "border-slate-300 bg-white shadow-sm"
                      )}
                    >
                      {completed ? (
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      ) : (
                        <Icon
                          className={cn(
                            active ? "h-4 w-4 text-white" : "h-3.5 w-3.5 text-slate-400"
                          )}
                        />
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-center text-sm font-semibold text-slate-800">{step.label}</p>
                  <p className="mt-1 text-center text-xs text-slate-500">
                    {active && currentStep === "job" && jobFormProgress !== undefined
                      ? `${jobFormProgress}% of posting steps done`
                      : step.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

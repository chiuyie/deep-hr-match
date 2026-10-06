import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CheckCircle2, Eye, LockOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function MatchFlowHowItWorks({ priceLabel }: { priceLabel: string }) {
  const steps: Array<{ icon: LucideIcon; title: string; body: string }> = [
    {
      icon: Sparkles,
      title: "Review matches",
      body: "Candidates stay anonymous with rank, score, and shared preview fields.",
    },
    {
      icon: LockOpen,
      title: "Unlock who fits",
      body: `Select one or more profiles — ${priceLabel} each via PayNow or card.`,
    },
    {
      icon: Eye,
      title: "Open the report",
      body: "See name, contact, CV, and the full 7^7 match breakdown instantly.",
    },
  ];

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          How unlock works
        </p>
      </div>
      <ol className="grid gap-0 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className={cn(
                "relative flex gap-3 px-5 py-4 sm:px-6",
                index < steps.length - 1 && "sm:border-r sm:border-slate-100"
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/80">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  <span className="mr-1.5 text-slate-400">{index + 1}.</span>
                  {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function MatchFlowNotice({
  tone = "info",
  title,
  children,
  icon: Icon,
}: {
  tone?: "info" | "success" | "warning";
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
}) {
  const tones = {
    info: "border-sky-200/80 bg-sky-50/80 text-sky-950",
    success: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",
    warning: "border-amber-200/80 bg-amber-50/90 text-amber-950",
  };
  const iconTones = {
    info: "text-sky-600",
    success: "text-emerald-600",
    warning: "text-amber-700",
  };
  const ResolvedIcon = Icon ?? (tone === "success" ? CheckCircle2 : Sparkles);

  return (
    <div
      className={cn(
        "mb-6 flex items-start gap-3 rounded-2xl border px-5 py-4 shadow-sm",
        tones[tone]
      )}
    >
      <ResolvedIcon className={cn("mt-0.5 h-5 w-5 shrink-0", iconTones[tone])} />
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <div className="mt-0.5 text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}

export function MatchScoreRing({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const dims =
    size === "lg"
      ? { box: "h-16 w-16 text-lg", stroke: 5 }
      : size === "sm"
        ? { box: "h-10 w-10 text-xs", stroke: 4 }
        : { box: "h-12 w-12 text-sm", stroke: 4.5 };
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", dims.box)}>
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={dims.stroke}
          className="text-slate-100"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={dims.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-emerald-500 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="relative font-bold tabular-nums text-slate-800">{clamped}%</span>
    </div>
  );
}

export function CandidateAvatar({
  name,
  locked = false,
}: {
  name: string;
  locked?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm ring-1",
        locked
          ? "bg-slate-100 text-slate-500 ring-slate-200"
          : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-emerald-200/60"
      )}
      aria-hidden
    >
      {locked ? "••" : initials || "C"}
    </div>
  );
}

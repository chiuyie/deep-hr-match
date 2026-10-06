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
    <div className="mb-6 overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_42%,#ecfdf5_100%)] shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex flex-col gap-1 border-b border-slate-200/60 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
            How unlock works
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Matching is free. Unlock only the people you want to contact.
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          {priceLabel} <span className="text-slate-400">per profile</span>
        </p>
      </div>
      <ol className="grid gap-0 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className={cn(
                "relative flex gap-3.5 px-5 py-5 sm:px-6",
                index < steps.length - 1 &&
                  "border-b border-slate-200/60 sm:border-b-0 sm:border-r"
              )}
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                <Icon className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold tracking-tight text-slate-900">
                  {step.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{step.body}</p>
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
    info: "border-sky-200/70 bg-sky-50/70 text-sky-950",
    success: "border-emerald-200/80 bg-emerald-50/80 text-emerald-950",
    warning: "border-amber-200/80 bg-amber-50/80 text-amber-950",
  };
  const iconWrap = {
    info: "bg-sky-100 text-sky-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-800",
  };
  const ResolvedIcon = Icon ?? (tone === "success" ? CheckCircle2 : Sparkles);

  return (
    <div
      className={cn(
        "mb-6 flex items-start gap-3.5 rounded-2xl border px-4 py-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] sm:px-5",
        tones[tone]
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          iconWrap[tone]
        )}
      >
        <ResolvedIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold tracking-tight">{title}</p>
        <div className="mt-1 text-sm leading-relaxed opacity-90">{children}</div>
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
  const config =
    size === "lg"
      ? { box: "h-16 w-16", num: "text-[15px]", stroke: 4 }
      : size === "sm"
        ? { box: "h-10 w-10", num: "text-[10px]", stroke: 3 }
        : { box: "h-12 w-12", num: "text-[12px]", stroke: 3.5 };

  // Padded viewBox so the stroke never clips at the edges.
  const view = 48;
  const center = view / 2;
  const radius = center - config.stroke - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const strokeTone =
    clamped >= 80 ? "#10b981" : clamped >= 60 ? "#14b8a6" : "#94a3b8";

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        config.box
      )}
      aria-label={`Match score ${clamped}%`}
    >
      <svg
        viewBox={`0 0 ${view} ${view}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={config.stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeTone}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span
        className={cn(
          "relative z-[1] font-sans font-semibold tabular-nums leading-none tracking-tight text-slate-800 antialiased",
          config.num
        )}
      >
        {clamped}%
      </span>
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
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold tracking-wide shadow-sm ring-1",
        locked
          ? "bg-[linear-gradient(145deg,#f8fafc,#e2e8f0)] text-slate-400 ring-slate-200/80"
          : "bg-[linear-gradient(145deg,#10b981,#0f766e)] text-white ring-emerald-200/50"
      )}
      aria-hidden
    >
      {locked ? (
        <span className="tracking-[0.2em] text-slate-400">••</span>
      ) : (
        initials || "C"
      )}
    </div>
  );
}

export function MatchFlowStageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

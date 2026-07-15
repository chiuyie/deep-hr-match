import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmployerPageSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export function EmployerPageSection({
  title,
  description,
  icon,
  gradient = "from-primary to-primary/80",
  action,
  children,
  className,
  id,
}: EmployerPageSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl sm:p-8",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
          children != null && "mb-6 sm:mb-8"
        )}
      >
        <div className="flex items-start gap-4">
          {icon && (
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                gradient
              )}
            >
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

interface EmployerEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  gradient?: string;
}

export function EmployerEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  gradient = "from-slate-500 to-slate-600",
}: EmployerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center sm:py-16">
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
          gradient
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {actionLabel && actionHref && (
        <Button className="mt-6 rounded-xl" asChild>
          <Link href={actionHref}>
            {actionLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

interface EmployerActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
}

export function EmployerActionCard({
  title,
  description,
  href,
  icon: Icon,
  accent,
}: EmployerActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg",
        accent
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-black/5">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

interface EmployerStatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: string;
}

export function EmployerStatCard({
  label,
  value,
  icon: Icon,
  accent = "from-primary/10 to-primary/5 text-primary",
}: EmployerStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br",
              accent
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-800">{value}</p>
    </div>
  );
}

interface EmployerJobContextProps {
  jobTitle: string;
  jobId: string;
  description?: string;
}

export function EmployerJobContext({ jobTitle, jobId, description }: EmployerJobContextProps) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 shadow-sm">
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/employer/jobs" className="hover:text-primary">
              Jobs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/employer/jobs/${jobId}`} className="hover:text-primary">
              {jobTitle}
            </Link>
          </li>
        </ol>
      </nav>
      <h2 className="mt-1 text-lg font-semibold text-slate-800 sm:text-xl">{jobTitle}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

interface EmployerDetailFieldProps {
  label: string;
  value?: string | null;
}

export function EmployerDetailField({ label, value }: EmployerDetailFieldProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-slate-800">{value || "—"}</dd>
    </div>
  );
}

export const employerInputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export const employerLabelClassName = "mb-2 block text-sm font-semibold text-slate-700";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminIdCellClassName, adminIdLinkClassName } from "@/lib/admin/table-search";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

interface AdminPageSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminPageSection({
  title,
  description,
  icon,
  gradient = "from-violet-600 to-indigo-600",
  action,
  children,
  className,
}: AdminPageSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-100 bg-white p-6 shadow-lg sm:p-8",
        className
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
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

interface AdminStatCardProps {
  label: string;
  value: string | number;
  href?: string;
  icon?: LucideIcon;
  accent?: string;
}

export function AdminStatCard({
  label,
  value,
  href,
  icon: Icon,
  accent = "from-violet-500/15 to-indigo-500/10 text-violet-700",
}: AdminStatCardProps) {
  const inner = (
    <div
      className={cn(
        "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all",
        href && "cursor-pointer hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
      )}
    >
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
      {href && (
        <p className="mt-2 text-xs font-medium text-primary">View details →</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }

  return inner;
}

interface AdminActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
}

export function AdminActionCard({
  title,
  description,
  href,
  icon: Icon,
  accent,
}: AdminActionCardProps) {
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

interface AdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function AdminEmptyState({ icon, title, description }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

interface AdminTableToolbarProps {
  recordCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
}

export function AdminTableToolbar({
  recordCount,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search…",
}: AdminTableToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="shrink-0 text-sm text-slate-500">
        <span className="font-semibold text-slate-700">{recordCount}</span>{" "}
        {recordCount === 1 ? "record" : "records"}
      </p>
      <div className="relative w-full min-w-0 sm:min-w-[18rem] sm:max-w-xl lg:max-w-2xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          title={searchPlaceholder}
          className="w-full min-w-0 rounded-xl border-slate-200 pl-9"
          aria-label="Search table"
        />
      </div>
    </div>
  );
}

export function AdminCompletionBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex min-w-[7rem] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            clamped >= 80 ? "bg-emerald-500" : clamped >= 40 ? "bg-amber-500" : "bg-slate-300"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs font-medium text-slate-600">{clamped}%</span>
    </div>
  );
}

export function AdminScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80 ? "border-emerald-300 bg-emerald-50 text-emerald-800" : score >= 60 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <Badge variant="outline" className={cn("font-semibold tabular-nums", tone)}>
      {score}%
    </Badge>
  );
}

export function AdminMonoId({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn(adminIdCellClassName, className)}>
      {value}
    </span>
  );
}

export function AdminRecordIdLink({ id, href }: { id: string; href: string }) {
  return (
    <Link href={href} className={adminIdLinkClassName}>
      {id}
    </Link>
  );
}

export function AdminViewLink({ href, label = "View" }: { href: string; label?: string }) {
  return (
    <Button variant="outline" size="xs" className="rounded-lg" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export function AdminBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex cursor-pointer items-center text-sm font-medium text-primary hover:underline"
    >
      ← {label}
    </Link>
  );
}

interface AdminFileLinkProps {
  href: string;
  label: string;
}

export function AdminFileLink({ href, label }: AdminFileLinkProps) {
  return (
    <Button variant="link" className="h-auto p-0 text-sm font-medium" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    </Button>
  );
}

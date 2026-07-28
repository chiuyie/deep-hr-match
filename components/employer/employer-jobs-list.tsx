"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Briefcase,
  MapPin,
  Search,
  Target,
  Unlock,
  Users,
} from "lucide-react";
import { JobRowActions } from "@/components/employer/job-row-actions";
import { EmployerStatCard } from "@/components/employer/employer-ui";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JobLifecycleState } from "@/lib/employer/job-rules";
import {
  jobPrimaryHref,
  jobSearchText,
  statusFilterCounts,
  type EmployerJobListItem,
  type JobStatusFilter,
} from "@/lib/employer/job-list";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/profile";

interface EmployerJobsListProps {
  jobs: EmployerJobListItem[];
}

const STATUS_TABS: { value: JobStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Drafts" },
  { value: "closed", label: "Closed" },
];

function lifecycleFor(job: EmployerJobListItem): JobLifecycleState {
  return {
    status: job.status,
    hasMatches: job.matchCount > 0,
    hasUnlocks: job.unlockCount > 0,
  };
}

function jobStatusHint(job: EmployerJobListItem): string | null {
  if (job.status === "draft") return "Finish setup to publish";
  if (job.status === "active" && job.matchCount === 0) return "Ready to generate matches";
  if (job.status === "active" && job.unlockCount === 0 && job.matchCount > 0) {
    return "Review matches and unlock profiles";
  }
  if (job.status === "closed") return "Archived — past results still available";
  return null;
}

function JobMetaLine({ job }: { job: EmployerJobListItem }) {
  const parts = [job.location, job.department, job.employment_type].filter(Boolean);
  if (parts.length === 0) return <span className="text-slate-400">No location set</span>;
  return <span>{parts.join(" · ")}</span>;
}

function MatchUnlockStats({ job, compact = false }: { job: EmployerJobListItem; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact && "mt-3")}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          job.matchCount > 0
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
            : "bg-slate-100 text-slate-500"
        )}
      >
        <Target className="h-3 w-3" />
        {job.matchCount > 0 ? `${job.matchCount} matched` : "No matches"}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          job.unlockCount > 0
            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
            : "bg-slate-100 text-slate-500"
        )}
      >
        <Unlock className="h-3 w-3" />
        {job.unlockCount > 0 ? `${job.unlockCount} unlocked` : "None unlocked"}
      </span>
    </div>
  );
}

export function EmployerJobsList({ jobs }: EmployerJobsListProps) {
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");

  const counts = useMemo(() => statusFilterCounts(jobs), [jobs]);

  const summary = useMemo(
    () => ({
      activeJobs: counts.active,
      totalMatches: jobs.reduce((sum, job) => sum + job.matchCount, 0),
      totalUnlocks: jobs.reduce((sum, job) => sum + job.unlockCount, 0),
    }),
    [jobs, counts.active]
  );

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesSearch = query.length === 0 || jobSearchText(job).includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [jobs, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <EmployerStatCard
          label="Active postings"
          value={summary.activeJobs}
          icon={Briefcase}
          accent="from-emerald-500/10 to-emerald-600/5 text-emerald-600"
        />
        <EmployerStatCard
          label="Candidates matched"
          value={summary.totalMatches}
          icon={Users}
          accent="from-violet-500/10 to-violet-600/5 text-violet-600"
        />
        <EmployerStatCard
          label="Profiles unlocked"
          value={summary.totalUnlocks}
          icon={Unlock}
          accent="from-blue-500/10 to-blue-600/5 text-blue-600"
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as JobStatusFilter)}
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-slate-100 p-1 sm:w-auto">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg px-3 py-1.5 data-active:bg-white data-active:shadow-sm"
              >
                {tab.label}
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px] tabular-nums">
                  {counts[tab.value]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location, department…"
            className="rounded-xl border-slate-200 pl-9"
            aria-label="Search jobs"
          />
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">{filteredJobs.length}</span>{" "}
        {filteredJobs.length === 1 ? "job" : "jobs"}
        {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ""}
      </p>

      {filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
          <p className="font-medium text-slate-700">No jobs match your filters</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different status tab or clear your search.
          </p>
          {(statusFilter !== "active" || searchQuery) && (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-primary hover:underline"
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredJobs.map((job) => {
              const hint = jobStatusHint(job);
              return (
                <div
                  key={job.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm transition-colors hover:border-slate-200 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={jobPrimaryHref(job)}
                        className="font-semibold text-slate-800 hover:text-primary"
                      >
                        {job.title}
                      </Link>
                      <p className="mt-1 flex items-start gap-1 text-sm text-slate-500">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <JobMetaLine job={job} />
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <MatchUnlockStats job={job} compact />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>Posted {formatDate(job.created_at)}</span>
                    {hint && <span className="text-amber-700">{hint}</span>}
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <JobRowActions
                      jobId={job.id}
                      lifecycle={lifecycleFor(job)}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-slate-100 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="font-semibold text-slate-600">Job</TableHead>
                  <TableHead className="font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600">Matches</TableHead>
                  <TableHead className="font-semibold text-slate-600">Unlocked</TableHead>
                  <TableHead className="font-semibold text-slate-600">Posted</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => {
                  const hint = jobStatusHint(job);
                  return (
                    <TableRow
                      key={job.id}
                      className="group transition-colors hover:bg-slate-50/60"
                    >
                      <TableCell className="max-w-xs">
                        <Link
                          href={jobPrimaryHref(job)}
                          className="font-medium text-slate-800 hover:text-primary"
                        >
                          {job.title}
                        </Link>
                        <p className="mt-0.5 truncate text-sm text-slate-500">
                          <JobMetaLine job={job} />
                        </p>
                        {hint && (
                          <p className="mt-1 text-xs text-amber-700">{hint}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            job.matchCount > 0 ? "text-emerald-700" : "text-slate-400"
                          )}
                        >
                          {job.matchCount > 0 ? job.matchCount : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            job.unlockCount > 0 ? "text-blue-700" : "text-slate-400"
                          )}
                        >
                          {job.unlockCount > 0 ? job.unlockCount : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(job.created_at)}
                      </TableCell>
                      <TableCell>
                        <JobRowActions
                          jobId={job.id}
                          lifecycle={lifecycleFor(job)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Lock, Target, Unlock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmployerEmptyState,
  EmployerPageSection,
} from "@/components/employer/employer-ui";
import type { AnonymousCandidateMatch } from "@/types/database";

interface JobMatchPreviewProps {
  jobId: string;
  results: AnonymousCandidateMatch[];
}

export function JobMatchPreview({ jobId, results }: JobMatchPreviewProps) {
  return (
    <EmployerPageSection
      title="Top Matching Profiles"
      description="Employers can review ranked anonymous candidates here. Full profiles stay locked until you unlock them."
      icon={<Target className="h-6 w-6" />}
      gradient="from-indigo-500 to-indigo-600"
      action={
        <Button variant="outline" size="sm" className="rounded-lg" asChild>
          <Link href={`/employer/jobs/${jobId}/matching`}>Open Matching Results</Link>
        </Button>
      }
    >
      {!results.length ? (
        <EmployerEmptyState
          icon={Users}
          title="No matching profiles yet"
          description="Generate matches from the matching page to see the top anonymous candidates for this role."
          actionLabel="Go to Matching"
          actionHref={`/employer/jobs/${jobId}/matching`}
          gradient="from-indigo-500 to-indigo-600"
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Candidate identities, contact details, and downloadable CVs remain hidden until you
            unlock them from the matching results page.
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {results.map((candidate) => (
              <article
                key={candidate.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-700">
                      {candidate.anonymous_id}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-primary">
                      {candidate.overall_score}%
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">#{candidate.ranking_position}</Badge>
                    {candidate.is_unlocked ? (
                      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                        <Unlock className="h-3 w-3" />
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Experience
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {candidate.years_of_experience != null
                        ? `${candidate.years_of_experience} years`
                        : "Hidden"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Education
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {candidate.highest_education ?? "Hidden"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Skills Overview
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {candidate.skills_overview.slice(0, 3).join(", ") || "Hidden"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-lg" asChild>
                    <Link href={`/employer/jobs/${jobId}/matching`}>
                      {candidate.is_unlocked ? "View Unlocked Profile" : "Unlock to View Profile"}
                    </Link>
                  </Button>
                  {candidate.is_unlocked && (
                    <Button variant="ghost" size="sm" className="rounded-lg" asChild>
                      <Link href={`/employer/jobs/${jobId}/unlocked`}>Unlocked Candidates</Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </EmployerPageSection>
  );
}

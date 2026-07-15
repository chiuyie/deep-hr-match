"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Target, Unlock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { createUnlockCheckout } from "@/lib/employer/actions";
import { formatCurrency } from "@/lib/utils/profile";
import { UNLOCK_PRICE_CENTS } from "@/lib/matching/engine";
import type { AnonymousCandidateMatch } from "@/types/database";

interface MatchingResultsTableProps {
  jobId: string;
  results: AnonymousCandidateMatch[];
  displayLimit?: number;
  lastMatchedAt?: string | null;
}

export function MatchingResultsTable({
  jobId,
  results,
  displayLimit,
  lastMatchedAt,
}: MatchingResultsTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const total = selected.length * UNLOCK_PRICE_CENTS;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleUnlock() {
    setLoading(true);
    await createUnlockCheckout(jobId, selected);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
        All scores shown are <strong>DEMO / Placeholder</strong> only. Final matching
        algorithm pending confirmation.
      </div>

      <EmployerPageSection
        title="Ranked Candidates"
        description={
          displayLimit
            ? `Top ${displayLimit} anonymous matches from the last snapshot`
            : "Select candidates to unlock their full profiles"
        }
        icon={<Target className="h-6 w-6" />}
        gradient="from-emerald-500 to-emerald-600"
        action={
          selected.length > 0 ? (
            <Button
              className="rounded-xl"
              disabled={loading}
              onClick={handleUnlock}
            >
              Unlock {selected.length} ({formatCurrency(total)})
            </Button>
          ) : undefined
        }
      >
        {results.length === 0 ? (
          <EmployerEmptyState
            icon={Users}
            title="No matching results yet"
            description="Generate matches to see ranked anonymous candidates for this job."
            gradient="from-emerald-500 to-emerald-600"
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {results.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-800">
                        {row.anonymous_id}
                      </p>
                      <p className="mt-1 text-lg font-bold text-primary">{row.overall_score}%</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline">#{row.ranking_position}</Badge>
                      {row.is_unlocked ? (
                        <Badge className="gap-1 bg-emerald-600">
                          <Unlock className="h-3 w-3" /> Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" /> Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {row.years_of_experience != null ? `${row.years_of_experience} yrs` : "—"} ·{" "}
                    {row.highest_education ?? "—"}
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-500">
                    {row.skills_overview.slice(0, 3).join(", ") || "—"}
                  </p>
                  {!row.is_unlocked && (
                    <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onCheckedChange={() => toggle(row.id)}
                      />
                      Select to unlock
                    </label>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Candidate ID</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Education</TableHead>
                    <TableHead>Skills Overview</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {!row.is_unlocked && (
                          <Checkbox
                            checked={selected.includes(row.id)}
                            onCheckedChange={() => toggle(row.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>#{row.ranking_position}</TableCell>
                      <TableCell className="font-mono text-sm">{row.anonymous_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">{row.overall_score}%</span>
                          {row.is_placeholder && (
                            <Badge variant="outline" className="text-xs">
                              DEMO
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.years_of_experience != null
                          ? `${row.years_of_experience} yrs`
                          : "—"}
                      </TableCell>
                      <TableCell>{row.highest_education ?? "—"}</TableCell>
                      <TableCell className="max-w-xs whitespace-normal break-words">
                        {row.skills_overview.slice(0, 3).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        {row.is_unlocked ? (
                          <Badge className="gap-1 bg-emerald-600">
                            <Unlock className="h-3 w-3" /> Unlocked
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {displayLimit && results.length > 0 && (
              <p className="mt-4 text-xs text-slate-500">
                Showing top {results.length} match{results.length === 1 ? "" : "es"}
                {lastMatchedAt ? " from snapshot" : ""}. Matching generation is free; unlock
                profiles for {formatCurrency(UNLOCK_PRICE_CENTS)} each.
              </p>
            )}
          </>
        )}
      </EmployerPageSection>

      {results.some((r) => r.is_unlocked) && (
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href={`/employer/jobs/${jobId}/unlocked`}>View Unlocked Candidates</Link>
        </Button>
      )}
    </div>
  );
}

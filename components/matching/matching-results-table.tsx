"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Eye, Lock, LockOpen, Target, Unlock, Users } from "lucide-react";
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
  mockPayments?: boolean;
  showMatchScore?: boolean;
  showMatchRank?: boolean;
}

function PreviewFieldsList({
  fields,
}: {
  fields: AnonymousCandidateMatch["preview_fields"];
}) {
  if (!fields.length) {
    return <span className="text-slate-400">No shared details</span>;
  }

  return (
    <div className="space-y-1">
      {fields.map((field) => (
        <p key={field.key} className="text-sm text-slate-600">
          <span className="font-medium text-slate-700">{field.label}:</span>{" "}
          {field.value ?? "—"}
        </p>
      ))}
    </div>
  );
}

function ScoreBreakdown({
  match,
}: {
  match: AnonymousCandidateMatch;
}) {
  const [open, setOpen] = useState(false);

  if (!match.match_summary && !match.strengths?.length && !match.gaps?.length) {
    return null;
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-primary/80 hover:text-primary"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Hide details" : "Score details"}
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
          {match.match_summary && (
            <p className="leading-relaxed">{match.match_summary}</p>
          )}
          {match.strengths && match.strengths.length > 0 && (
            <div>
              <p className="font-medium text-emerald-700">Strengths</p>
              <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-emerald-600">
                {match.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {match.gaps && match.gaps.length > 0 && (
            <div>
              <p className="font-medium text-amber-700">Gaps</p>
              <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-amber-600">
                {match.gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MatchingResultsTable({
  jobId,
  results,
  displayLimit,
  lastMatchedAt,
  mockPayments = false,
  showMatchScore = true,
  showMatchRank = true,
}: MatchingResultsTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const total = selected.length * UNLOCK_PRICE_CENTS;
  const previewColumns = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of results) {
      for (const field of row.preview_fields) {
        if (!seen.has(field.key)) seen.set(field.key, field.label);
      }
    }
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  }, [results]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleUnlock() {
    setLoading(true);
    try {
      await createUnlockCheckout(jobId, selected);
    } finally {
      setLoading(false);
    }
  }

  const hasPlaceholderScores = results.some((row) => row.is_placeholder);

  return (
    <div className="space-y-6">
      {hasPlaceholderScores ? (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
          Some scores are <strong>DEMO / Placeholder</strong> because this job has no
          7^7 matching language answers yet. Complete the form and refresh matches.
        </div>
      ) : null}

      {mockPayments ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950 shadow-sm">
          <strong>Mock payments</strong> are on — unlock creates a paid payment + unlock rows
          instantly (no Stripe). Set <code className="rounded bg-sky-100 px-1">PAYMENTS_MODE=stripe</code>{" "}
          when you are ready for real Checkout.
        </div>
      ) : null}

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
          <div className="flex flex-wrap items-center gap-2">
            {results.some((r) => r.is_unlocked) && (
              <Button variant="outline" size="sm" className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800" asChild>
                <Link href={`/employer/jobs/${jobId}/unlocked`}>
                  <Unlock className="mr-1.5 h-3.5 w-3.5" />
                  View unlocked ({results.filter((r) => r.is_unlocked).length})
                </Link>
              </Button>
            )}
            {selected.length > 0 && (
              <Button
                size="lg"
                className="rounded-xl px-6 shadow-md"
                disabled={loading}
                onClick={handleUnlock}
              >
                <LockOpen className="mr-2 h-4 w-4" />
                {mockPayments
                  ? `Unlock ${selected.length} candidate${selected.length === 1 ? "" : "s"} (mock)`
                  : `Unlock ${selected.length} — ${formatCurrency(total)}`}
              </Button>
            )}
          </div>
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
                      {showMatchScore ? (
                        <p className="mt-1 text-lg font-bold text-primary">{row.overall_score}%</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {showMatchRank ? (
                        <Badge variant="outline">#{row.ranking_position}</Badge>
                      ) : null}
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
                  {showMatchScore && <ScoreBreakdown match={row} />}
                  <div className="mt-3">
                    <PreviewFieldsList fields={row.preview_fields} />
                  </div>
                  {row.is_unlocked ? (
                    <Button size="sm" className="mt-4 rounded-xl" asChild>
                      <Link href={`/employer/jobs/${jobId}/unlocked/${row.id}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View full profile
                      </Link>
                    </Button>
                  ) : (
                    <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/5">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onCheckedChange={() => toggle(row.id)}
                      />
                      Select to unlock ({formatCurrency(UNLOCK_PRICE_CENTS)})
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
                    {showMatchRank ? <TableHead>Rank</TableHead> : null}
                    <TableHead>Candidate ID</TableHead>
                    {showMatchScore ? <TableHead>Match Score</TableHead> : null}
                    {previewColumns.map((column) => (
                      <TableHead key={column.key}>{column.label}</TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row) => {
                    const previewByKey = Object.fromEntries(
                      row.preview_fields.map((field) => [field.key, field.value])
                    );
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          {!row.is_unlocked && (
                            <Checkbox
                              checked={selected.includes(row.id)}
                              onCheckedChange={() => toggle(row.id)}
                            />
                          )}
                        </TableCell>
                        {showMatchRank ? <TableCell>#{row.ranking_position}</TableCell> : null}
                        <TableCell className="font-mono text-sm">{row.anonymous_id}</TableCell>
                        {showMatchScore ? (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-primary">{row.overall_score}%</span>
                              {row.is_placeholder && (
                                <Badge variant="outline" className="text-xs">
                                  DEMO
                                </Badge>
                              )}
                            </div>
                            <ScoreBreakdown match={row} />
                          </TableCell>
                        ) : null}
                        {previewColumns.map((column) => (
                          <TableCell
                            key={column.key}
                            className="max-w-xs whitespace-normal break-words"
                          >
                            {previewByKey[column.key] ?? "—"}
                          </TableCell>
                        ))}
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
                        <TableCell className="text-right">
                          {row.is_unlocked ? (
                            <Button size="sm" className="rounded-xl" asChild>
                              <Link href={`/employer/jobs/${jobId}/unlocked/${row.id}`}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View full profile
                              </Link>
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <Lock className="h-3 w-3" />
                              Unlock to view
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {displayLimit && results.length > 0 && (
              <p className="mt-4 text-xs text-slate-500">
                Showing top {results.length} match{results.length === 1 ? "" : "es"}
                {lastMatchedAt ? " from snapshot" : ""}. Matching generation is free
                {mockPayments
                  ? "; unlocks use mock payments (no Stripe charge)."
                  : `; unlock profiles for ${formatCurrency(UNLOCK_PRICE_CENTS)} each.`}
              </p>
            )}
          </>
        )}
      </EmployerPageSection>

    </div>
  );
}

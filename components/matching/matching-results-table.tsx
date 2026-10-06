"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Lock,
  LockOpen,
  Target,
  Unlock,
  Users,
} from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import {
  CandidateAvatar,
  MatchFlowHowItWorks,
  MatchFlowNotice,
  MatchScoreRing,
} from "@/components/employer/match-flow-ui";
import { createUnlockCheckout } from "@/lib/employer/actions";
import { formatCurrency } from "@/lib/utils/profile";
import { UNLOCK_CURRENCY, UNLOCK_PRICE_CENTS } from "@/lib/matching/engine";
import { cn } from "@/lib/utils";
import type { AnonymousCandidateMatch } from "@/types/database";

interface MatchingResultsTableProps {
  jobId: string;
  results: AnonymousCandidateMatch[];
  displayLimit?: number;
  lastMatchedAt?: string | null;
  mockPayments?: boolean;
  showMatchScore?: boolean;
  showMatchRank?: boolean;
  showMatchNarrative?: boolean;
}

function candidateLabel(row: AnonymousCandidateMatch) {
  if (row.is_unlocked && row.display_name) return row.display_name;
  return row.anonymous_id;
}

function PreviewFieldsList({
  fields,
}: {
  fields: AnonymousCandidateMatch["preview_fields"];
}) {
  if (!fields.length) {
    return <span className="text-slate-400">No shared details yet</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {fields.map((field) => (
        <div
          key={field.key}
          className="rounded-lg bg-white/80 px-2.5 py-1.5 text-xs ring-1 ring-slate-200/80"
        >
          <span className="font-medium text-slate-500">{field.label}</span>
          <span className="ml-1.5 font-semibold text-slate-800">{field.value ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreBreakdown({ match }: { match: AnonymousCandidateMatch }) {
  const [open, setOpen] = useState(false);

  if (!match.match_summary && !match.strengths?.length && !match.gaps?.length) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Hide details" : "Score details"}
      </button>
      {open ? (
        <div className="mt-2 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700">
          {match.match_summary ? <p className="leading-relaxed">{match.match_summary}</p> : null}
          {match.strengths && match.strengths.length > 0 ? (
            <div>
              <p className="font-medium text-emerald-700">Strengths</p>
              <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-emerald-600">
                {match.strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {match.gaps && match.gaps.length > 0 ? (
            <div>
              <p className="font-medium text-amber-700">Gaps</p>
              <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-amber-600">
                {match.gaps.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
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
  showMatchNarrative = false,
}: MatchingResultsTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const total = selected.length * UNLOCK_PRICE_CENTS;
  const priceLabel = formatCurrency(UNLOCK_PRICE_CENTS, UNLOCK_CURRENCY);
  const unlockedCount = results.filter((row) => row.is_unlocked).length;
  const lockedCount = results.length - unlockedCount;

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
    setCheckoutError(null);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  }

  async function handleUnlock() {
    setLoading(true);
    setCheckoutError(null);
    try {
      const result = await createUnlockCheckout(jobId, selected);
      if (result?.error) {
        setCheckoutError(result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("NEXT_REDIRECT") && !message.includes("Redirect")) {
        setCheckoutError("We couldn’t start unlock checkout. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const hasPlaceholderScores = results.some((row) => row.is_placeholder);

  return (
    <div className="space-y-6">
      <MatchFlowHowItWorks priceLabel={priceLabel} />

      {hasPlaceholderScores ? (
        <MatchFlowNotice tone="warning" title="Some scores are demo placeholders">
          This job has no 7^7 matching language answers yet. Complete the form and refresh matches
          for real rankings.
        </MatchFlowNotice>
      ) : null}

      {mockPayments ? (
        <MatchFlowNotice tone="info" title="Mock payments are on">
          Unlock creates a paid payment + unlock rows instantly (no Stripe). Set{" "}
          <code className="rounded bg-sky-100/80 px-1.5 py-0.5 text-[0.8rem]">
            PAYMENTS_MODE=stripe
          </code>{" "}
          when you are ready for real Checkout with PayNow or card.
        </MatchFlowNotice>
      ) : null}

      {checkoutError ? (
        <Alert variant="destructive">
          <AlertTitle>Unlock failed</AlertTitle>
          <AlertDescription>{checkoutError}</AlertDescription>
        </Alert>
      ) : null}

      <EmployerPageSection
        title="Ranked Candidates"
        description={
          results.length
            ? `${results.length} anonymized ${results.length === 1 ? "match" : "matches"} · ${lockedCount} locked · ${unlockedCount} unlocked`
            : "Generate matches to see ranked anonymous candidates for this job"
        }
        icon={<Target className="h-6 w-6" />}
        gradient="from-emerald-500 to-emerald-600"
        action={
          unlockedCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              asChild
            >
              <Link href={`/employer/jobs/${jobId}/unlocked`}>
                <Unlock className="mr-1.5 h-3.5 w-3.5" />
                View unlocked ({unlockedCount})
              </Link>
            </Button>
          ) : null
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
            <div className="mb-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
              Select locked candidates below, then unlock to reveal names, contact details, CV, and
              the full match report. Matching stays free — unlocks are {priceLabel} each.
            </div>

            <div className="space-y-3 md:hidden">
              {results.map((row) => {
                const selectedRow = selected.includes(row.id);
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "rounded-2xl border p-4 shadow-sm transition-all",
                      row.is_unlocked
                        ? "border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40"
                        : selectedRow
                          ? "border-emerald-300 bg-emerald-50/40 ring-2 ring-emerald-200/70"
                          : "border-slate-100 bg-white"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <CandidateAvatar name={candidateLabel(row)} locked={!row.is_unlocked} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "truncate text-sm font-semibold text-slate-800",
                                !row.is_unlocked && "font-mono"
                              )}
                            >
                              {candidateLabel(row)}
                            </p>
                            {row.is_unlocked && row.display_name ? (
                              <p className="mt-0.5 font-mono text-xs text-slate-400">
                                {row.anonymous_id}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {showMatchRank ? (
                              <Badge variant="outline" className="rounded-lg">
                                #{row.ranking_position}
                              </Badge>
                            ) : null}
                            {row.is_unlocked ? (
                              <Badge className="gap-1 rounded-lg bg-emerald-600">
                                <Unlock className="h-3 w-3" /> Unlocked
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 rounded-lg">
                                <Lock className="h-3 w-3" /> Locked
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          {showMatchScore ? <MatchScoreRing score={row.overall_score} /> : null}
                          {row.is_placeholder ? (
                            <Badge variant="outline" className="text-[10px]">
                              DEMO
                            </Badge>
                          ) : null}
                        </div>

                        {showMatchScore && showMatchNarrative ? (
                          <ScoreBreakdown match={row} />
                        ) : null}

                        <div className="mt-3">
                          <PreviewFieldsList fields={row.preview_fields} />
                        </div>

                        {row.is_unlocked ? (
                          <Button size="sm" className="mt-4 w-full rounded-xl" asChild>
                            <Link href={`/employer/jobs/${jobId}/unlocked/${row.id}`}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              View full profile
                            </Link>
                          </Button>
                        ) : (
                          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50">
                            <Checkbox
                              checked={selectedRow}
                              onCheckedChange={() => toggle(row.id)}
                            />
                            <span>
                              Select to unlock{" "}
                              <span className="font-semibold text-slate-800">({priceLabel})</span>
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-slate-100 md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="w-12">Select</TableHead>
                    {showMatchRank ? <TableHead className="w-16">Rank</TableHead> : null}
                    <TableHead>Candidate</TableHead>
                    {showMatchScore ? <TableHead className="w-28">Match</TableHead> : null}
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
                    const selectedRow = selected.includes(row.id);
                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          "transition-colors",
                          row.is_unlocked && "bg-emerald-50/30",
                          selectedRow && "bg-emerald-50/60"
                        )}
                      >
                        <TableCell>
                          {!row.is_unlocked ? (
                            <Checkbox
                              checked={selectedRow}
                              onCheckedChange={() => toggle(row.id)}
                              aria-label={`Select ${row.anonymous_id}`}
                            />
                          ) : null}
                        </TableCell>
                        {showMatchRank ? (
                          <TableCell>
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-100 px-2 text-sm font-semibold text-slate-700">
                              #{row.ranking_position}
                            </span>
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <CandidateAvatar
                              name={candidateLabel(row)}
                              locked={!row.is_unlocked}
                            />
                            <div>
                              <p
                                className={cn(
                                  "text-sm font-medium text-slate-800",
                                  !row.is_unlocked && "font-mono"
                                )}
                              >
                                {candidateLabel(row)}
                              </p>
                              {row.is_unlocked && row.display_name ? (
                                <p className="font-mono text-xs text-slate-400">
                                  {row.anonymous_id}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400">Anonymous until unlock</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {showMatchScore ? (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MatchScoreRing score={row.overall_score} size="sm" />
                              {row.is_placeholder ? (
                                <Badge variant="outline" className="text-[10px]">
                                  DEMO
                                </Badge>
                              ) : null}
                            </div>
                            {showMatchNarrative ? <ScoreBreakdown match={row} /> : null}
                          </TableCell>
                        ) : null}
                        {previewColumns.map((column) => (
                          <TableCell
                            key={column.key}
                            className="max-w-xs whitespace-normal break-words text-sm text-slate-600"
                          >
                            {previewByKey[column.key] ?? "—"}
                          </TableCell>
                        ))}
                        <TableCell>
                          {row.is_unlocked ? (
                            <Badge className="gap-1 rounded-lg bg-emerald-600">
                              <Unlock className="h-3 w-3" /> Unlocked
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 rounded-lg">
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

            {displayLimit && results.length > 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                Showing top {results.length} match{results.length === 1 ? "" : "es"}
                {lastMatchedAt ? " from the latest snapshot" : ""}. Matching generation is free
                {mockPayments
                  ? "; unlocks use mock payments (no Stripe charge)."
                  : `; unlock profiles for ${priceLabel} each via PayNow or card.`}
              </p>
            ) : null}
          </>
        )}
      </EmployerPageSection>

      {selected.length > 0 ? (
        <div className="sticky bottom-4 z-20 mx-auto max-w-3xl">
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200/80 bg-white/95 p-4 shadow-xl shadow-emerald-900/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {selected.length} candidate{selected.length === 1 ? "" : "s"} selected
              </p>
              <p className="text-sm text-slate-500">
                Total {formatCurrency(total, UNLOCK_CURRENCY)}
                {mockPayments ? " · mock unlock (no charge)" : " · PayNow or card"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setSelected([])}
                disabled={loading}
              >
                Clear
              </Button>
              <Button
                size="lg"
                className="rounded-xl px-6 shadow-md"
                disabled={loading}
                onClick={handleUnlock}
              >
                <LockOpen className="mr-2 h-4 w-4" />
                {mockPayments
                  ? `Unlock ${selected.length} candidate${selected.length === 1 ? "" : "s"} (mock)`
                  : `Unlock ${selected.length} — ${formatCurrency(total, UNLOCK_CURRENCY)}`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

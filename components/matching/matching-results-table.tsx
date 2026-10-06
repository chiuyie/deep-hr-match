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
          className="rounded-xl bg-white/90 px-2.5 py-1.5 text-xs shadow-sm ring-1 ring-slate-200/70"
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
        <div className="mt-2 space-y-2 rounded-xl border border-slate-100 bg-slate-50/90 p-3 text-xs text-slate-700">
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

function StatusPill({ unlocked }: { unlocked: boolean }) {
  if (unlocked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
        <Unlock className="h-3 w-3" />
        Unlocked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/80">
      <Lock className="h-3 w-3" />
      Locked
    </span>
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
          <code className="rounded-md bg-sky-100/90 px-1.5 py-0.5 text-[0.8rem]">
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
        className="border-slate-200/70 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.45)]"
        action={
          unlockedCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100"
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
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-emerald-100/80 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%,#f8fafc_100%)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Select who to unlock</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Names, contact, CV, and the full match report stay hidden until unlock —{" "}
                  <span className="font-semibold text-slate-700">{priceLabel}</span> each.
                </p>
              </div>
              <p className="shrink-0 text-xs font-medium text-slate-500">
                Matching stays free
              </p>
            </div>

            <div className="space-y-3 md:hidden">
              {results.map((row) => {
                const selectedRow = selected.includes(row.id);
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "rounded-2xl border p-4 shadow-sm transition-all duration-200",
                      row.is_unlocked
                        ? "border-emerald-200/80 bg-[linear-gradient(160deg,#ffffff,#ecfdf5)]"
                        : selectedRow
                          ? "border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-200/80"
                          : "border-slate-200/80 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <CandidateAvatar name={candidateLabel(row)} locked={!row.is_unlocked} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "truncate text-sm font-semibold tracking-tight text-slate-900",
                                !row.is_unlocked && "font-mono"
                              )}
                            >
                              {candidateLabel(row)}
                            </p>
                            {row.is_unlocked && row.display_name ? (
                              <p className="mt-0.5 font-mono text-xs text-slate-400">
                                {row.anonymous_id}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-xs text-slate-400">Anonymous until unlock</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {showMatchRank ? (
                              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-bold text-slate-700">
                                #{row.ranking_position}
                              </span>
                            ) : null}
                            <StatusPill unlocked={row.is_unlocked} />
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
                          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/60">
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

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="w-12 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Select
                    </TableHead>
                    {showMatchRank ? (
                      <TableHead className="w-16 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Rank
                      </TableHead>
                    ) : null}
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Candidate
                    </TableHead>
                    {showMatchScore ? (
                      <TableHead className="w-28 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Match
                      </TableHead>
                    ) : null}
                    {previewColumns.map((column) => (
                      <TableHead
                        key={column.key}
                        className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {column.label}
                      </TableHead>
                    ))}
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </TableHead>
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
                          "border-slate-100 transition-colors",
                          row.is_unlocked && "bg-emerald-50/35",
                          selectedRow && "bg-emerald-50/70"
                        )}
                      >
                        <TableCell>
                          {!row.is_unlocked ? (
                            <Checkbox
                              checked={selectedRow}
                              onCheckedChange={() => toggle(row.id)}
                              aria-label={`Select ${row.anonymous_id}`}
                            />
                          ) : (
                            <span className="inline-flex h-4 w-4 items-center justify-center text-emerald-600">
                              <Unlock className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </TableCell>
                        {showMatchRank ? (
                          <TableCell>
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-100 px-2 text-sm font-bold text-slate-700">
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
                                  "text-sm font-semibold tracking-tight text-slate-900",
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
                          <StatusPill unlocked={row.is_unlocked} />
                        </TableCell>
                        <TableCell className="text-right">
                          {row.is_unlocked ? (
                            <Button size="sm" className="rounded-xl shadow-sm" asChild>
                              <Link href={`/employer/jobs/${jobId}/unlocked/${row.id}`}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View full profile
                              </Link>
                            </Button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggle(row.id)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors",
                                selectedRow
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                              )}
                            >
                              <Lock className="h-3 w-3" />
                              {selectedRow ? "Selected" : "Unlock to view"}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {displayLimit && results.length > 0 ? (
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
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
        <div className="sticky bottom-3 z-20 mx-auto max-w-3xl px-1 pb-safe sm:bottom-4">
          <div className="overflow-hidden rounded-[1.35rem] border border-emerald-200/80 bg-white/95 shadow-[0_24px_60px_-28px_rgba(6,78,59,0.45)] backdrop-blur-md">
            <div className="h-1 bg-[linear-gradient(90deg,#10b981,#14b8a6,#06b6d4)]" />
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-slate-900">
                  {selected.length} candidate{selected.length === 1 ? "" : "s"} selected
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Total {formatCurrency(total, UNLOCK_CURRENCY)}
                  {mockPayments ? " · mock unlock (no charge)" : " · PayNow or card"}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button
                  variant="outline"
                  className="w-full rounded-xl sm:w-auto"
                  onClick={() => setSelected([])}
                  disabled={loading}
                >
                  Clear
                </Button>
                <Button
                  size="lg"
                  className="w-full rounded-xl px-6 shadow-md sm:w-auto"
                  disabled={loading}
                  onClick={handleUnlock}
                >
                  <LockOpen className="mr-2 h-4 w-4" />
                  <span className="sm:hidden">
                    {mockPayments
                      ? `Unlock ${selected.length}`
                      : `Unlock · ${formatCurrency(total, UNLOCK_CURRENCY)}`}
                  </span>
                  <span className="hidden sm:inline">
                    {mockPayments
                      ? `Unlock ${selected.length} candidate${selected.length === 1 ? "" : "s"} (mock)`
                      : `Unlock ${selected.length} — ${formatCurrency(total, UNLOCK_CURRENCY)}`}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

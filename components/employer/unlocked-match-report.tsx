"use client";

import { Check, Minus, X } from "lucide-react";
import { MatchScoreRing } from "@/components/employer/match-flow-ui";
import {
  buildMatchInsightFromComparison,
  fitBandFromScore,
  fitCopy,
} from "@/lib/matching/match-narrative";
import { cn } from "@/lib/utils";
import type { MatrixAnswerStep, MatrixComparisonRow } from "@/lib/matching/candidate-matrix-summary";

interface UnlockedMatchReportSectionsProps {
  overallScore: number | null;
  rankingPosition?: number | null;
  showMatchScore: boolean;
  showMatchRank?: boolean;
  showMatchNarrative?: boolean;
  matchSummary?: string | null;
  strengths?: string[] | null;
  gaps?: string[] | null;
  showMatrixAnswers: boolean;
  showMatrixComparison: boolean;
  candidateSteps: MatrixAnswerStep[];
  comparisonRows: MatrixComparisonRow[];
}

function WordPath({ words }: { words: string[] }) {
  if (!words.length) {
    return <span className="text-slate-400">Not provided</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-flex items-center gap-1.5">
          {index > 0 && <span className="text-slate-300">→</span>}
          <span className="rounded-lg bg-white px-2 py-0.5 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-200/80">
            {word}
          </span>
        </span>
      ))}
    </div>
  );
}

function MatchStatus({ aligned, hasBoth }: { aligned: boolean; hasBoth: boolean }) {
  if (!hasBoth) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        <Minus className="h-3 w-3" />
        Incomplete
      </span>
    );
  }
  if (aligned) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
        <Check className="h-3 w-3" />
        Match
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
      <X className="h-3 w-3" />
      Different
    </span>
  );
}

function FactorComparisonCard({ row }: { row: MatrixComparisonRow }) {
  const hasBoth = row.jobWords.length > 0 && row.candidateWords.length > 0;
  return (
    <article
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        !hasBoth
          ? "border-slate-100 bg-slate-50/50"
          : row.aligned
            ? "border-emerald-100 bg-emerald-50/40"
            : "border-amber-100/80 bg-amber-50/30"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Factor {row.column}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-slate-900">{row.factorLabel}</h3>
        </div>
        <MatchStatus aligned={row.aligned} hasBoth={hasBoth} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/90 p-3.5 ring-1 ring-slate-100">
          <p className="mb-2 text-xs font-medium text-slate-500">Your job</p>
          <WordPath words={row.jobWords} />
        </div>
        <div className="rounded-xl bg-white/90 p-3.5 ring-1 ring-slate-100">
          <p className="mb-2 text-xs font-medium text-slate-500">Candidate</p>
          <WordPath words={row.candidateWords} />
        </div>
      </div>
    </article>
  );
}

function FitBadge({
  band,
  label,
}: {
  band: ReturnType<typeof fitBandFromScore>;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        band === "strong" && "bg-emerald-50 text-emerald-800 ring-emerald-100",
        band === "mixed" && "bg-amber-50 text-amber-900 ring-amber-100",
        band === "weak" && "bg-slate-100 text-slate-700 ring-slate-200",
        band === "unknown" && "bg-slate-50 text-slate-500 ring-slate-100"
      )}
    >
      {label}
    </span>
  );
}

export function UnlockedMatchReportSections({
  overallScore,
  rankingPosition = null,
  showMatchScore,
  showMatchRank = false,
  showMatchNarrative = false,
  matchSummary = null,
  strengths = null,
  gaps = null,
  showMatrixAnswers,
  showMatrixComparison,
  candidateSteps,
  comparisonRows,
}: UnlockedMatchReportSectionsProps) {
  const showComparison = showMatrixComparison && comparisonRows.length > 0;
  const showCandidateOnly =
    !showComparison && showMatrixAnswers && candidateSteps.length > 0;
  const showScoreBlock =
    (showMatchScore && overallScore != null) || (showMatchRank && rankingPosition != null);

  const insight = showComparison
    ? buildMatchInsightFromComparison(comparisonRows, overallScore)
    : null;

  const hasStoredNarrative = Boolean(
    matchSummary?.trim() || strengths?.length || gaps?.length
  );
  // Prefer live comparison insight; fall back to stored narrative when disclosure allows.
  const showStoredNarrative = showMatchNarrative && hasStoredNarrative && !insight;
  const showComparisonInsight = Boolean(insight);

  if (
    !showScoreBlock &&
    !showComparison &&
    !showCandidateOnly &&
    !showStoredNarrative
  ) {
    return null;
  }

  const scoreBand = fitBandFromScore(overallScore);
  const scoreFit = fitCopy(scoreBand);
  const alignedRows =
    insight != null
      ? comparisonRows.filter(
          (row) =>
            row.aligned && row.jobWords.length > 0 && row.candidateWords.length > 0
        )
      : [];
  const differRows =
    insight != null
      ? comparisonRows.filter(
          (row) =>
            !row.aligned && row.jobWords.length > 0 && row.candidateWords.length > 0
        )
      : [];
  const incompleteRows =
    insight != null
      ? comparisonRows.filter(
          (row) => row.jobWords.length === 0 || row.candidateWords.length === 0
        )
      : [];

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_22px_50px_-34px_rgba(15,23,42,0.4)]">
      <div className="h-1.5 bg-[linear-gradient(90deg,#10b981,#14b8a6,#06b6d4)]" />
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
              Match report
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">7^7 match</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
              How this candidate&apos;s matching language aligns with your job — and where it
              differs.
            </p>
          </div>
          {insight && insight.comparableCount > 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Factors aligned
              </p>
              <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
                {insight.matchedCount}
                <span className="text-slate-400"> / {insight.comparableCount}</span>
                {insight.alignmentPct != null ? (
                  <span className="ml-2 text-sm font-semibold text-emerald-700">
                    {insight.alignmentPct}%
                  </span>
                ) : null}
              </p>
            </div>
          ) : null}
        </div>

        {showScoreBlock ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {showMatchScore && overallScore != null ? (
              <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-[linear-gradient(145deg,#ecfdf5,#ffffff)] px-4 py-4">
                <MatchScoreRing score={overallScore} size="lg" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80">
                      Match score
                    </p>
                    <FitBadge band={insight?.fitBand ?? scoreBand} label={insight?.fitLabel ?? scoreFit.label} />
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-emerald-900/85">
                    {insight?.fitGuidance ?? scoreFit.guidance}
                  </p>
                </div>
              </div>
            ) : null}
            {showMatchRank && rankingPosition != null ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Rank for this job
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                  #{rankingPosition}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Position in the latest match snapshot
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {showComparisonInsight && insight ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">What this means</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{insight.summary}</p>
            </div>
            {(insight.alignedLabels.length > 0 || insight.differLabels.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {insight.alignedLabels.length > 0 ? (
                  <div className="rounded-xl bg-white p-4 ring-1 ring-emerald-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Where you align
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-emerald-900">
                      {insight.alignedLabels.map((label) => (
                        <li key={`align-${label}`} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {insight.differLabels.length > 0 ? (
                  <div className="rounded-xl bg-white p-4 ring-1 ring-amber-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                      Where you differ
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
                      {insight.differLabels.map((label) => (
                        <li key={`differ-${label}`} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {showStoredNarrative ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
            <h3 className="text-sm font-semibold text-slate-900">Match summary</h3>
            {matchSummary?.trim() ? (
              <p className="text-sm leading-relaxed text-slate-700">{matchSummary}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {strengths && strengths.length > 0 ? (
                <div className="rounded-xl bg-white p-4 ring-1 ring-emerald-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Strengths
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-emerald-900">
                    {strengths.map((item, index) => (
                      <li key={`strength-${index}`} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {gaps && gaps.length > 0 ? (
                <div className="rounded-xl bg-white p-4 ring-1 ring-amber-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Gaps
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
                    {gaps.map((item, index) => (
                      <li key={`gap-${index}`} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {showComparison ? (
          <div className="mt-6 space-y-6">
            {alignedRows.length > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Where you align</h3>
                <div className="space-y-3">
                  {alignedRows.map((row) => (
                    <FactorComparisonCard key={`aligned-${row.column}`} row={row} />
                  ))}
                </div>
              </div>
            ) : null}
            {differRows.length > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Where you differ</h3>
                <p className="mb-3 text-sm text-slate-500">
                  These are useful interview prompts — ask how the candidate approaches each
                  factor.
                </p>
                <div className="space-y-3">
                  {differRows.map((row) => (
                    <FactorComparisonCard key={`differ-${row.column}`} row={row} />
                  ))}
                </div>
              </div>
            ) : null}
            {incompleteRows.length > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Incomplete factors</h3>
                <div className="space-y-3">
                  {incompleteRows.map((row) => (
                    <FactorComparisonCard key={`incomplete-${row.column}`} row={row} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {showCandidateOnly ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">Candidate word choices</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {candidateSteps.map((step) => (
                <li
                  key={step.column}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Factor {step.column}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{step.factorLabel}</p>
                  <div className="mt-2">
                    <WordPath words={step.wordPath.length ? step.wordPath : [step.wordLabel]} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

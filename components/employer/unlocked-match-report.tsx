"use client";

import { Check, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatrixAnswerStep, MatrixComparisonRow } from "@/lib/matching/candidate-matrix-summary";

interface UnlockedMatchReportSectionsProps {
  overallScore: number | null;
  rankingPosition?: number | null;
  showMatchScore: boolean;
  showMatchRank?: boolean;
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
          <span className="rounded-md bg-white px-2 py-0.5 text-sm font-medium text-slate-800 ring-1 ring-slate-200">
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

export function UnlockedMatchReportSections({
  overallScore,
  rankingPosition = null,
  showMatchScore,
  showMatchRank = false,
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

  if (!showScoreBlock && !showComparison && !showCandidateOnly) {
    return null;
  }

  const matchedCount = comparisonRows.filter((row) => row.aligned).length;
  const comparableCount = comparisonRows.filter(
    (row) => row.jobWords.length > 0 && row.candidateWords.length > 0
  ).length;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg sm:p-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">7^7 match</h2>
          <p className="mt-1 text-sm text-slate-500">
            How this candidate&apos;s matching language aligns with your job
          </p>
        </div>
        {showComparison && comparableCount > 0 ? (
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{matchedCount}</span> of{" "}
            <span className="font-semibold text-slate-700">{comparableCount}</span> factors aligned
          </p>
        ) : null}
      </div>

      {showScoreBlock ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {showMatchScore && overallScore != null ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
                Match score
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-950">
                {overallScore}%
              </p>
            </div>
          ) : null}
          {showMatchRank && rankingPosition != null ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rank for this job
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-800">
                #{rankingPosition}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {showComparison ? (
        <div className="mt-6 space-y-3">
          {comparisonRows.map((row) => {
            const hasBoth = row.jobWords.length > 0 && row.candidateWords.length > 0;
            return (
              <article
                key={row.column}
                className={cn(
                  "rounded-xl border p-4",
                  row.aligned
                    ? "border-emerald-100 bg-emerald-50/30"
                    : "border-slate-100 bg-slate-50/50"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Factor {row.column}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-slate-800">
                      {row.factorLabel}
                    </h3>
                  </div>
                  <MatchStatus aligned={row.aligned} hasBoth={hasBoth} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-white/80 p-3 ring-1 ring-slate-100">
                    <p className="mb-2 text-xs font-medium text-slate-500">Your job</p>
                    <WordPath words={row.jobWords} />
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 ring-1 ring-slate-100">
                    <p className="mb-2 text-xs font-medium text-slate-500">Candidate</p>
                    <WordPath words={row.candidateWords} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {showCandidateOnly ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-800">Candidate word choices</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {candidateSteps.map((step) => (
              <li
                key={step.column}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Factor {step.column}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">{step.factorLabel}</p>
                <div className="mt-2">
                  <WordPath words={step.wordPath.length ? step.wordPath : [step.wordLabel]} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

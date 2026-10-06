import type { MatrixComparisonRow } from "@/lib/matching/candidate-matrix-summary";

export type FitBand = "strong" | "mixed" | "weak" | "unknown";

export type MatchInsight = {
  fitBand: FitBand;
  fitLabel: string;
  fitGuidance: string;
  summary: string;
  alignedLabels: string[];
  differLabels: string[];
  incompleteLabels: string[];
  matchedCount: number;
  comparableCount: number;
  alignmentPct: number | null;
};

function listLabels(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function fitBandFromScore(score: number | null | undefined): FitBand {
  if (score == null || Number.isNaN(score)) return "unknown";
  if (score >= 80) return "strong";
  if (score >= 50) return "mixed";
  return "weak";
}

export function fitCopy(band: FitBand): { label: string; guidance: string } {
  switch (band) {
    case "strong":
      return {
        label: "Strong fit",
        guidance: "Matching language is closely aligned — a strong shortlist candidate for this role.",
      };
    case "mixed":
      return {
        label: "Mixed fit",
        guidance: "Some factors align well; review the differences before deciding to interview.",
      };
    case "weak":
      return {
        label: "Weak fit",
        guidance: "Few factors align. Unlock still gives contact access — use the gaps to guide questions.",
      };
    default:
      return {
        label: "Fit unclear",
        guidance: "Complete 7^7 answers on both sides to score matching language.",
      };
  }
}

/**
 * Plain-English insight from job vs candidate comparison rows.
 * Prefer this over stored technical match_summary when comparison data exists.
 */
export function buildMatchInsightFromComparison(
  rows: MatrixComparisonRow[],
  overallScore?: number | null
): MatchInsight | null {
  if (!rows.length) return null;

  const aligned: MatrixComparisonRow[] = [];
  const differ: MatrixComparisonRow[] = [];
  const incomplete: MatrixComparisonRow[] = [];

  for (const row of rows) {
    const hasBoth = row.jobWords.length > 0 && row.candidateWords.length > 0;
    if (!hasBoth) {
      incomplete.push(row);
      continue;
    }
    if (row.aligned) aligned.push(row);
    else differ.push(row);
  }

  const matchedCount = aligned.length;
  const comparableCount = aligned.length + differ.length;
  const alignmentPct =
    comparableCount > 0 ? Math.round((matchedCount / comparableCount) * 100) : null;

  const scoreForBand =
    overallScore != null && !Number.isNaN(overallScore)
      ? overallScore
      : alignmentPct;
  const fitBand = fitBandFromScore(scoreForBand);
  const { label: fitLabel, guidance: fitGuidance } = fitCopy(fitBand);

  const alignedLabels = aligned.map((row) => row.factorLabel);
  const differLabels = differ.map((row) => row.factorLabel);
  const incompleteLabels = incomplete.map((row) => row.factorLabel);

  let summary: string;
  if (comparableCount === 0) {
    summary =
      "Not enough comparable 7^7 answers yet to judge fit. Complete the matching language form on both sides.";
  } else if (matchedCount === comparableCount) {
    summary = `Aligned on all ${comparableCount} comparable factor${comparableCount === 1 ? "" : "s"} (${alignmentPct}%). Strong agreement on ${listLabels(alignedLabels)}.`;
  } else if (matchedCount === 0) {
    summary = `No factors aligned of ${comparableCount} comparable (${alignmentPct}%). Differs on ${listLabels(differLabels)}.`;
  } else {
    const alignPart = `Aligned on ${matchedCount} of ${comparableCount} factors (${alignmentPct}%): ${listLabels(alignedLabels)}.`;
    const differPart = `Differs on ${listLabels(differLabels)}.`;
    summary = `${alignPart} ${differPart}`;
  }

  if (incompleteLabels.length > 0) {
    summary += ` Incomplete on ${listLabels(incompleteLabels)}.`;
  }

  return {
    fitBand,
    fitLabel,
    fitGuidance,
    summary,
    alignedLabels,
    differLabels,
    incompleteLabels,
    matchedCount,
    comparableCount,
    alignmentPct,
  };
}

/** Friendlier stored narrative when factor names are not available at score time. */
export function buildCountBasedMatchSummary(
  matrixScore: number,
  matchedCount: number,
  totalCount: number,
  columnCount: number
): { match_summary: string; strengths: string[]; gaps: string[] } {
  if (totalCount === 0) {
    return {
      match_summary:
        "No comparable 7^7 answers yet — complete the matching language form on the job and candidate profiles.",
      strengths: [],
      gaps: ["Matching language form incomplete"],
    };
  }

  const differCount = totalCount - matchedCount;
  const band = fitBandFromScore(matrixScore);
  const { label } = fitCopy(band);

  return {
    match_summary: `${label}: aligned on ${matchedCount} of ${totalCount} matching-language picks across ${columnCount} factor${columnCount === 1 ? "" : "s"} (${matrixScore}%).`,
    strengths:
      matchedCount > 0
        ? [
            `${matchedCount} factor${matchedCount === 1 ? "" : "s"} match the job’s preferred word`,
          ]
        : [],
    gaps:
      differCount > 0
        ? [
            `${differCount} factor${differCount === 1 ? "" : "s"} differ from the job’s preferred word`,
          ]
        : [],
  };
}

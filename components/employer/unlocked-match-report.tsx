import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployerPageSection } from "@/components/employer/employer-ui";
import { Sparkles } from "lucide-react";
import type { MatrixAnswerStep, MatrixComparisonRow } from "@/lib/matching/candidate-matrix-summary";

interface UnlockedMatchReportSectionsProps {
  candidateFirstName: string;
  overallScore: number | null;
  rankingPosition?: number | null;
  showMatchScore: boolean;
  showMatchRank?: boolean;
  showMatrixAnswers: boolean;
  showMatrixComparison: boolean;
  showNarrative: boolean;
  candidateSteps: MatrixAnswerStep[];
  comparisonRows: MatrixComparisonRow[];
}

export function UnlockedMatchReportSections({
  candidateFirstName,
  overallScore,
  rankingPosition = null,
  showMatchScore,
  showMatchRank = false,
  showMatrixAnswers,
  showMatrixComparison,
  showNarrative,
  candidateSteps,
  comparisonRows,
}: UnlockedMatchReportSectionsProps) {
  const hasMatrixContent =
    (showMatrixAnswers && candidateSteps.length > 0) ||
    (showMatrixComparison && comparisonRows.length > 0);

  if (!showMatchScore && !showMatchRank && !hasMatrixContent && !showNarrative) {
    return null;
  }

  return (
    <EmployerPageSection
      title="Match report"
      description="7^7 alignment and scoring — only sections your admin has enabled appear here."
      icon={<Sparkles className="h-6 w-6" />}
      gradient="from-violet-500 to-indigo-600"
    >
      {(showMatchScore && overallScore != null) || (showMatchRank && rankingPosition != null) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {showMatchScore && overallScore != null ? (
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-800/80">
                Overall match score
              </p>
              <p className="mt-1 text-2xl font-bold text-violet-950">{overallScore}%</p>
            </div>
          ) : null}
          {showMatchRank && rankingPosition != null ? (
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-800/80">
                Ranking position
              </p>
              <p className="mt-1 text-2xl font-bold text-violet-950">#{rankingPosition}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {showMatrixAnswers ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-800">Candidate 7^7 word choices</h3>
          {candidateSteps.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              This candidate has not completed the matching language form yet.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {candidateSteps.map((step) => (
                <li
                  key={step.questionId}
                  className="rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-sm"
                >
                  <span className="block text-xs text-slate-500">{step.factorLabel}</span>
                  <span className="font-medium text-slate-800">{step.wordLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {showMatrixComparison ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-800">Job vs candidate words</h3>
          {comparisonRows.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Add job and candidate matching language answers to see a comparison.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="w-28">Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonRows.map((row) => (
                    <TableRow key={`${row.factorLabel}-${row.jobWord}-${row.candidateWord}`}>
                      <TableCell className="font-medium text-slate-800">{row.factorLabel}</TableCell>
                      <TableCell>{row.jobWord}</TableCell>
                      <TableCell>{row.candidateWord}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            row.aligned
                              ? "bg-emerald-600 hover:bg-emerald-600"
                              : "bg-amber-500 hover:bg-amber-500"
                          }
                        >
                          {row.aligned ? "Aligned" : "Different"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : null}

      {showNarrative ? (
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Summary</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {candidateFirstName} shows a strong placeholder fit for this role across structure,
            communication, and pace. Detailed narrative from the matching engine will replace this
            demo text when it is connected.
          </p>
        </div>
      ) : null}
    </EmployerPageSection>
  );
}

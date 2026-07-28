import Link from "next/link";
import { Target } from "lucide-react";
import { AdminPageSection, AdminRecordIdLink, AdminScoreBadge } from "@/components/admin/admin-ui";
import { AdminSearchableTable } from "@/components/admin/admin-searchable-table";
import { loadAdminMatchingList } from "@/lib/admin/list-queries";
import { embedOne } from "@/lib/admin/embed";
import { adminRowSearchProps } from "@/lib/admin/table-search";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminMatchingPage() {
  const rows = await loadAdminMatchingList();

  return (
    <AdminPageSection
      title="Matching results"
      description="Ranked candidate scores generated for each job"
      icon={<Target className="h-6 w-6" />}
      gradient="from-violet-600 to-purple-600"
    >
      <AdminSearchableTable
        recordCount={rows.length}
        searchPlaceholder="Search matching…"
        emptyIcon={<Target className="h-7 w-7" />}
        emptyTitle="No match results"
        emptyDescription="Results appear after matching runs for a job with matrix answers."
        columns={["Job", "Candidate", "Rank", "Score", "Type", "Generated"]}
      >
        {rows.map((result) => {
          const jobTitle = embedOne(result.jobs)?.title ?? "";
          const candidate = embedOne(result.candidate_profiles);
          const candidateName = candidate?.full_name ?? "Unknown candidate";

          return (
            <TableRow
              key={result.id}
              {...adminRowSearchProps(
                `${jobTitle} ${candidateName} ${candidate?.email ?? ""} ${result.overall_score} ${result.is_placeholder ? "demo" : "final"}`
              )}
            >
              <TableCell className="whitespace-normal align-top">
                {jobTitle ? (
                  <Link
                    href={`/admin/jobs/${result.job_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {jobTitle}
                  </Link>
                ) : (
                  <AdminRecordIdLink id={result.job_id} href={`/admin/jobs/${result.job_id}`} />
                )}
              </TableCell>
              <TableCell>
                <div>
                  <Link
                    href={`/admin/candidates/${result.candidate_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {candidateName}
                  </Link>
                  {candidate?.email && (
                    <p className="text-xs text-slate-500">{candidate.email}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-slate-700">
                #{result.ranking_position}
              </TableCell>
              <TableCell>
                <AdminScoreBadge score={Number(result.overall_score)} />
              </TableCell>
              <TableCell>
                {result.is_placeholder ? (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                    DEMO
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600">Final</Badge>
                )}
              </TableCell>
              <TableCell className="text-slate-500">{formatDate(result.generated_at)}</TableCell>
            </TableRow>
          );
        })}
      </AdminSearchableTable>
    </AdminPageSection>
  );
}

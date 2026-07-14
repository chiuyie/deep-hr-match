import { Users } from "lucide-react";
import {
  AdminCompletionBar,
  AdminPageSection,
  AdminRecordIdLink,
  AdminStatusBadge,
  AdminViewLink,
} from "@/components/admin/admin-ui";
import { AdminSearchableTable } from "@/components/admin/admin-searchable-table";
import { adminRowSearchProps } from "@/lib/admin/table-search";
import { TableCell, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminCandidatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPageSection
      title="All candidates"
      description="Registered candidate profiles and onboarding completion"
      icon={<Users className="h-6 w-6" />}
      gradient="from-blue-600 to-indigo-600"
    >
      <AdminSearchableTable
        recordCount={rows.length}
        searchPlaceholder="Search candidates…"
        emptyIcon={<Users className="h-7 w-7" />}
        emptyTitle="No candidates yet"
        emptyDescription="Candidate profiles will appear here once users sign up."
        columns={["Candidate ID", "Name", "Email", "Status", "Completion", "Joined", ""]}
      >
        {rows.map((candidate) => (
          <TableRow
            key={candidate.id}
            {...adminRowSearchProps(
              `${candidate.id} ${candidate.full_name ?? ""} ${candidate.email ?? ""} ${candidate.status ?? ""}`
            )}
          >
            <TableCell className="whitespace-normal align-top">
              <AdminRecordIdLink
                id={candidate.id}
                href={`/admin/candidates/${candidate.id}`}
              />
            </TableCell>
            <TableCell className="font-medium text-slate-800">
              {candidate.full_name ?? "—"}
            </TableCell>
            <TableCell className="text-slate-600">{candidate.email ?? "—"}</TableCell>
            <TableCell>
              <AdminStatusBadge status={candidate.status ?? "unknown"} />
            </TableCell>
            <TableCell>
              <AdminCompletionBar value={candidate.completion_percentage ?? 0} />
            </TableCell>
            <TableCell className="text-slate-500">{formatDate(candidate.created_at)}</TableCell>
            <TableCell className="text-right">
              <AdminViewLink href={`/admin/candidates/${candidate.id}`} />
            </TableCell>
          </TableRow>
        ))}
      </AdminSearchableTable>
    </AdminPageSection>
  );
}

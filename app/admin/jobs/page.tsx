import { Briefcase } from "lucide-react";
import {
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

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*, employer_profiles(company_name)")
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPageSection
      title="All jobs"
      description="Job postings across every employer account"
      icon={<Briefcase className="h-6 w-6" />}
      gradient="from-emerald-600 to-teal-600"
    >
      <AdminSearchableTable
        recordCount={rows.length}
        searchPlaceholder="Search jobs…"
        emptyIcon={<Briefcase className="h-7 w-7" />}
        emptyTitle="No jobs posted"
        emptyDescription="Jobs will appear here when employers create postings."
        columns={["Job ID", "Title", "Employer", "Location", "Status", "Posted", ""]}
      >
        {rows.map((job) => {
          const company =
            (job.employer_profiles as { company_name: string } | null)?.company_name ?? "";

          return (
            <TableRow
              key={job.id}
              {...adminRowSearchProps(
                `${job.id} ${job.title} ${company} ${job.location ?? ""} ${job.status ?? ""}`
              )}
            >
              <TableCell className="whitespace-normal align-top">
                <AdminRecordIdLink id={job.id} href={`/admin/jobs/${job.id}`} />
              </TableCell>
              <TableCell className="font-medium text-slate-800">{job.title}</TableCell>
              <TableCell className="text-slate-600">{company || "—"}</TableCell>
              <TableCell className="text-slate-600">{job.location ?? "—"}</TableCell>
              <TableCell>
                <AdminStatusBadge status={job.status ?? "unknown"} />
              </TableCell>
              <TableCell className="text-slate-500">{formatDate(job.created_at)}</TableCell>
              <TableCell className="text-right">
                <AdminViewLink href={`/admin/jobs/${job.id}`} />
              </TableCell>
            </TableRow>
          );
        })}
      </AdminSearchableTable>
    </AdminPageSection>
  );
}

import { Building2 } from "lucide-react";
import {
  AdminPageSection,
  AdminRecordIdLink,
  AdminViewLink,
} from "@/components/admin/admin-ui";
import { AdminSearchableTable } from "@/components/admin/admin-searchable-table";
import { adminRowSearchProps } from "@/lib/admin/table-search";
import { TableCell, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminEmployersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employer_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPageSection
      title="All employers"
      description="Company profiles registered on the platform"
      icon={<Building2 className="h-6 w-6" />}
      gradient="from-cyan-600 to-blue-600"
    >
      <AdminSearchableTable
        recordCount={rows.length}
        searchPlaceholder="Search employers…"
        emptyIcon={<Building2 className="h-7 w-7" />}
        emptyTitle="No employers yet"
        emptyDescription="Employer accounts will appear here after registration."
        columns={["Employer ID", "Company", "Industry", "Contact email", "Joined", ""]}
      >
        {rows.map((employer) => (
          <TableRow
            key={employer.id}
            {...adminRowSearchProps(
              `${employer.id} ${employer.company_name ?? ""} ${employer.industry ?? ""} ${employer.contact_person_email ?? ""}`
            )}
          >
            <TableCell className="whitespace-normal align-top">
              <AdminRecordIdLink id={employer.id} href={`/admin/employers/${employer.id}`} />
            </TableCell>
            <TableCell className="font-medium text-slate-800">
              {employer.company_name ?? "—"}
            </TableCell>
            <TableCell className="text-slate-600">{employer.industry ?? "—"}</TableCell>
            <TableCell className="text-slate-600">
              {employer.contact_person_email ?? "—"}
            </TableCell>
            <TableCell className="text-slate-500">{formatDate(employer.created_at)}</TableCell>
            <TableCell className="text-right">
              <AdminViewLink href={`/admin/employers/${employer.id}`} />
            </TableCell>
          </TableRow>
        ))}
      </AdminSearchableTable>
    </AdminPageSection>
  );
}

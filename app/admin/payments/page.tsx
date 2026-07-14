import { CreditCard } from "lucide-react";
import { AdminPageSection, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminSearchableTable } from "@/components/admin/admin-searchable-table";
import { adminRowSearchProps } from "@/lib/admin/table-search";
import { TableCell, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils/profile";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*, jobs(title), employer_profiles(company_name)")
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const totalCents = rows.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const currency = rows[0]?.currency ?? "usd";

  return (
    <AdminPageSection
      title="Payments"
      description="Stripe checkout sessions for candidate unlocks"
      icon={<CreditCard className="h-6 w-6" />}
      gradient="from-amber-600 to-orange-600"
      action={
        rows.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-right">
            <p className="text-xs font-medium text-amber-800">Total recorded</p>
            <p className="text-lg font-bold text-amber-950">
              {formatCurrency(totalCents, currency)}
            </p>
          </div>
        ) : undefined
      }
    >
      <AdminSearchableTable
        recordCount={rows.length}
        searchPlaceholder="Search payments…"
        emptyIcon={<CreditCard className="h-7 w-7" />}
        emptyTitle="No payments yet"
        emptyDescription="Payment records appear when employers purchase candidate unlocks."
        columns={["Employer", "Job", "Amount", "Candidates", "Status", "Date"]}
      >
        {rows.map((payment) => {
          const company =
            (payment.employer_profiles as { company_name: string } | null)?.company_name ?? "";
          const jobTitle = (payment.jobs as { title: string } | null)?.title ?? "";

          return (
            <TableRow
              key={payment.id}
              {...adminRowSearchProps(
                `${company} ${jobTitle} ${payment.status ?? ""} ${payment.amount}`
              )}
            >
              <TableCell className="font-medium text-slate-800">{company || "—"}</TableCell>
              <TableCell className="text-slate-600">{jobTitle || "—"}</TableCell>
              <TableCell className="font-semibold text-slate-800">
                {formatCurrency(payment.amount, payment.currency)}
              </TableCell>
              <TableCell className="text-slate-600">
                {payment.selected_candidate_ids?.length ?? 0}
              </TableCell>
              <TableCell>
                <AdminStatusBadge status={payment.status ?? "unknown"} />
              </TableCell>
              <TableCell className="text-slate-500">{formatDate(payment.created_at)}</TableCell>
            </TableRow>
          );
        })}
      </AdminSearchableTable>
    </AdminPageSection>
  );
}

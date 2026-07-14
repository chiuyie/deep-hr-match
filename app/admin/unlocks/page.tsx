import { Unlock } from "lucide-react";
import { AdminMonoId, AdminPageSection } from "@/components/admin/admin-ui";
import { AdminSearchableTable } from "@/components/admin/admin-searchable-table";
import { adminRowSearchProps } from "@/lib/admin/table-search";
import { TableCell, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminUnlocksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("unlocks")
    .select(
      "*, jobs(title), employer_profiles(company_name), candidate_profiles(full_name, email), payments(stripe_session_id)"
    )
    .order("unlocked_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPageSection
      title="Unlock records"
      description="Candidate profiles unlocked after employer payment"
      icon={<Unlock className="h-6 w-6" />}
      gradient="from-rose-600 to-pink-600"
    >
      <AdminSearchableTable
        recordCount={rows.length}
        searchPlaceholder="Search unlocks…"
        emptyIcon={<Unlock className="h-7 w-7" />}
        emptyTitle="No unlocks yet"
        emptyDescription="Unlock records appear when employers purchase candidate profiles."
        columns={["Employer", "Job", "Candidate", "Payment ref", "Unlocked"]}
      >
        {rows.map((unlock) => {
          const company =
            (unlock.employer_profiles as { company_name: string } | null)?.company_name ?? "";
          const jobTitle = (unlock.jobs as { title: string } | null)?.title ?? "";
          const candidate = unlock.candidate_profiles as {
            full_name: string | null;
            email: string | null;
          } | null;
          const sessionId =
            (unlock.payments as { stripe_session_id: string } | null)?.stripe_session_id ?? "";

          return (
            <TableRow
              key={unlock.id}
              {...adminRowSearchProps(
                `${company} ${jobTitle} ${candidate?.full_name ?? ""} ${candidate?.email ?? ""} ${sessionId}`
              )}
            >
              <TableCell className="font-medium text-slate-800">{company || "—"}</TableCell>
              <TableCell className="text-slate-600">{jobTitle || "—"}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-800">
                    {candidate?.full_name ?? "Unknown"}
                  </p>
                  {candidate?.email && (
                    <p className="text-xs text-slate-500">{candidate.email}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                {sessionId ? <AdminMonoId value={sessionId} /> : "—"}
              </TableCell>              <TableCell className="text-slate-500">{formatDate(unlock.unlocked_at)}</TableCell>
            </TableRow>
          );
        })}
      </AdminSearchableTable>
    </AdminPageSection>
  );
}

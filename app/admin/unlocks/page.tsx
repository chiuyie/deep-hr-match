import { Unlock } from "lucide-react";
import { AdminMonoId, AdminPageSection } from "@/components/admin/admin-ui";
import { AdminSearchableTable } from "@/components/admin/admin-searchable-table";
import { loadAdminUnlocksList } from "@/lib/admin/list-queries";
import { embedOne } from "@/lib/admin/embed";
import { adminRowSearchProps } from "@/lib/admin/table-search";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminUnlocksPage() {
  const rows = await loadAdminUnlocksList();

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
          const employerName = embedOne(unlock.employer_profiles)?.company_name ?? "";
          const jobTitle = embedOne(unlock.jobs)?.title ?? "";
          const candidate = embedOne(unlock.candidate_profiles);
          const sessionId = embedOne(unlock.payments)?.stripe_session_id ?? "";

          return (
            <TableRow
              key={unlock.id}
              {...adminRowSearchProps(
                `${employerName} ${jobTitle} ${candidate?.full_name ?? ""} ${candidate?.email ?? ""} ${sessionId}`
              )}
            >
              <TableCell className="font-medium text-slate-800">{employerName || "—"}</TableCell>
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
              </TableCell>
              <TableCell className="text-slate-500">{formatDate(unlock.unlocked_at)}</TableCell>
            </TableRow>
          );
        })}
      </AdminSearchableTable>
    </AdminPageSection>
  );
}

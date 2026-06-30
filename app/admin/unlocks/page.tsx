import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminUnlocksPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("unlocks")
    .select("*, jobs(title), employer_profiles(company_name), payments(stripe_session_id)")
    .order("unlocked_at", { ascending: false });

  return (
    <DashboardShell role="admin" title="Unlocks" description="Candidate profile unlock records">
      <Card>
        <CardHeader><CardTitle>Unlock Records</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employer</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Candidate ID</TableHead>
                <TableHead>Payment Ref</TableHead>
                <TableHead>Unlocked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{(u.employer_profiles as { company_name: string } | null)?.company_name ?? "—"}</TableCell>
                  <TableCell>{(u.jobs as { title: string } | null)?.title ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{u.candidate_id.slice(0, 8)}…</TableCell>
                  <TableCell className="font-mono text-xs">
                    {(u.payments as { stripe_session_id: string } | null)?.stripe_session_id?.slice(0, 12) ?? "—"}…
                  </TableCell>
                  <TableCell>{formatDate(u.unlocked_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

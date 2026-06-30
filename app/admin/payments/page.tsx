import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatDate } from "@/lib/utils/profile";

export default async function AdminPaymentsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*, jobs(title), employer_profiles(company_name)")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell role="admin" title="Payments" description="Stripe payment records">
      <Card>
        <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employer</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Candidates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{(p.employer_profiles as { company_name: string } | null)?.company_name ?? "—"}</TableCell>
                  <TableCell>{(p.jobs as { title: string } | null)?.title ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(p.amount, p.currency)}</TableCell>
                  <TableCell>{p.selected_candidate_ids?.length ?? 0}</TableCell>
                  <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                  <TableCell>{formatDate(p.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

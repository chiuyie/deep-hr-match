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
import { formatDate, statusLabel } from "@/lib/utils/profile";

export default async function AdminJobsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*, employer_profiles(company_name)")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell role="admin" title="All Jobs" description="Job listings across employers">
      <Card>
        <CardHeader><CardTitle>Jobs</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{j.title}</TableCell>
                  <TableCell>{(j.employer_profiles as { company_name: string } | null)?.company_name ?? "—"}</TableCell>
                  <TableCell>{j.location ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{statusLabel(j.status)}</Badge></TableCell>
                  <TableCell>{formatDate(j.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

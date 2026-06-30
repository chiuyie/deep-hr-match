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

async function AdminTablePage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return (
    <DashboardShell role="admin" title={title} description={description}>
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </DashboardShell>
  );
}

export default async function AdminCandidatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminTablePage title="All Candidates" description="View and search candidate profiles">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Completion</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data ?? []).map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.full_name ?? "—"}</TableCell>
              <TableCell>{c.email ?? "—"}</TableCell>
              <TableCell><Badge variant="secondary">{statusLabel(c.status)}</Badge></TableCell>
              <TableCell>{c.completion_percentage}%</TableCell>
              <TableCell>{formatDate(c.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminTablePage>
  );
}

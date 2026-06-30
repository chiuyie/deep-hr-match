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

export default async function AdminEmployersPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("employer_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell role="admin" title="All Employers" description="Company profiles">
      <Card>
        <CardHeader><CardTitle>Employers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.company_name ?? "—"}</TableCell>
                  <TableCell>{e.industry ?? "—"}</TableCell>
                  <TableCell>{e.contact_person_email ?? "—"}</TableCell>
                  <TableCell>{formatDate(e.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

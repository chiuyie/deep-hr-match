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
import { formatDate } from "@/lib/utils/profile";

export default async function AdminMatchingPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_results")
    .select("*, jobs(title)")
    .order("generated_at", { ascending: false });

  return (
    <DashboardShell role="admin" title="Matching Results" description="All match result records">
      <Card>
        <CardHeader><CardTitle>Results</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Placeholder</TableHead>
                <TableHead>Generated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{(m.jobs as { title: string } | null)?.title ?? m.job_id.slice(0, 8)}</TableCell>
                  <TableCell>#{m.ranking_position}</TableCell>
                  <TableCell>{m.overall_score}%</TableCell>
                  <TableCell>
                    {m.is_placeholder ? (
                      <Badge variant="outline">DEMO</Badge>
                    ) : (
                      <Badge>Final</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(m.generated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

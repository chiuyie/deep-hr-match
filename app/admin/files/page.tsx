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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminFilesPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: cvs } = await supabase
    .from("candidate_cv_files")
    .select("*, candidate_profiles(full_name)")
    .order("uploaded_at", { ascending: false });

  const { data: jds } = await supabase
    .from("job_jd_files")
    .select("*, jobs(title)")
    .order("uploaded_at", { ascending: false });

  return (
    <DashboardShell role="admin" title="Uploaded Files" description="CV and JD file metadata">
      <Tabs defaultValue="cvs">
        <TabsList>
          <TabsTrigger value="cvs">CV Files ({cvs?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="jds">JD Files ({jds?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="cvs">
          <Card>
            <CardHeader><CardTitle>Candidate CVs</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cvs ?? []).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{f.file_name}</TableCell>
                      <TableCell>{(f.candidate_profiles as { full_name: string } | null)?.full_name ?? "—"}</TableCell>
                      <TableCell>{f.file_size ? `${Math.round(f.file_size / 1024)} KB` : "—"}</TableCell>
                      <TableCell>{formatDate(f.uploaded_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="jds">
          <Card>
            <CardHeader><CardTitle>Job Descriptions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(jds ?? []).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{f.file_name}</TableCell>
                      <TableCell>{(f.jobs as { title: string } | null)?.title ?? "—"}</TableCell>
                      <TableCell>{f.file_size ? `${Math.round(f.file_size / 1024)} KB` : "—"}</TableCell>
                      <TableCell>{formatDate(f.uploaded_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

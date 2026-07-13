import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { uploadJobJD } from "@/lib/employer/actions";
import { formatDate } from "@/lib/utils/profile";

export default async function JobJDPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("employer");
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("title")
    .eq("id", id)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job) notFound();

  const { data: files } = await supabase
    .from("job_jd_files")
    .select("*")
    .eq("job_id", id)
    .order("uploaded_at", { ascending: false });

  async function upload(formData: FormData) {
    "use server";
    await uploadJobJD(formData, id);
  }

  return (
    <DashboardShell
      role="employer"
      userName={user.name}
      title="JD Upload"
      description={`Job description file for ${job.title}`}
    >
      <Card>
        <CardHeader>
          <CardTitle>Upload Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upload} className="space-y-4">
            <input type="file" name="file" accept=".pdf,.doc,.docx" required className="block w-full text-sm" />
            <Button type="submit">Upload JD</Button>
          </form>
        </CardContent>
      </Card>
      {files && files.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Uploaded Files</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f.id} className="flex justify-between rounded border p-3 text-sm">
                  <span>{f.file_name}</span>
                  <span className="text-muted-foreground">{formatDate(f.uploaded_at)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}

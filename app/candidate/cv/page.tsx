import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { uploadCandidateCV } from "@/lib/candidate/actions";
import { formatDate } from "@/lib/utils/profile";

export default async function CandidateCVPage() {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: files } = await supabase
    .from("candidate_cv_files")
    .select("*")
    .eq("candidate_id", profile?.id ?? "")
    .order("uploaded_at", { ascending: false });

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title="CV Upload"
      description="Upload your resume (PDF or Word, max 10MB)"
    >
      <Card>
        <CardHeader>
          <CardTitle>Upload CV</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadCandidateCV} className="space-y-4">
            <input
              type="file"
              name="file"
              accept=".pdf,.doc,.docx"
              required
              className="block w-full text-sm"
            />
            <Button type="submit" className="bg-[#1e40af] hover:bg-[#1e3a8a]">
              Upload CV
            </Button>
          </form>
        </CardContent>
      </Card>

      {files && files.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
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

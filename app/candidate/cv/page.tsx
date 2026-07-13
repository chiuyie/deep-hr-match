import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { uploadCandidateCV } from "@/lib/candidate/actions";
import { formatDate } from "@/lib/utils/profile";
import { CheckCircle2 } from "lucide-react";

export default async function CandidateCVPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const params = await searchParams;

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
      <div className="space-y-4">
        {params.step === "profile-complete" && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle2 />
            <AlertTitle>Profile saved</AlertTitle>
            <AlertDescription>
              Great progress. Upload your CV below to continue onboarding.
            </AlertDescription>
          </Alert>
        )}

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
              <Button type="submit">Upload CV &amp; Continue</Button>
            </form>
          </CardContent>
        </Card>

        {files && files.length > 0 && (
          <Card>
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
      </div>
    </DashboardShell>
  );
}

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DynamicProfileFields } from "@/components/forms/dynamic-profile-fields";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadFormFields, ensureFormFieldsReady } from "@/lib/form-fields/queries";
import { saveDraft, submitProfile } from "./actions";
import { Sparkles, CircleAlert } from "lucide-react";

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; error?: string }>;
}) {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const params = await searchParams;

  await ensureFormFieldsReady();
  const fields = await loadFormFields({ audience: "candidate", formGroup: "profile" });

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const p = profile ?? {};

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title="Profile"
      description="Personal and professional information"
    >
      <div className="space-y-4">
        {params.welcome === "1" && (
          <Alert>
            <Sparkles />
            <AlertTitle>Welcome to Deep HR Match</AlertTitle>
            <AlertDescription>
              Start by completing your profile. After that, you'll upload your CV and complete
              the matching questionnaire.
            </AlertDescription>
          </Alert>
        )}

        {params.error === "profile-incomplete" && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Profile needs more detail</AlertTitle>
            <AlertDescription>
              Fill in more fields to reach at least 60% completion before continuing to CV upload.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Candidate Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <DynamicProfileFields fields={fields} values={p} variant="candidate" />
              <div className="flex flex-wrap gap-2">
                <Button formAction={saveDraft} variant="secondary">
                  Save Draft
                </Button>
                <Button formAction={submitProfile}>Save &amp; Continue to CV</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

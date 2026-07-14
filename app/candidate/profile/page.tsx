import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" name="full_name" defaultValue={p.full_name ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" defaultValue={p.email ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={p.phone ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" defaultValue={p.country ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue={p.city ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_job_title">Current Job Title</Label>
                  <Input
                    id="current_job_title"
                    name="current_job_title"
                    defaultValue={p.current_job_title ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    name="years_of_experience"
                    type="number"
                    min={0}
                    defaultValue={p.years_of_experience ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highest_education">Highest Education</Label>
                  <Input
                    id="highest_education"
                    name="highest_education"
                    defaultValue={p.highest_education ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Textarea id="skills" name="skills" defaultValue={p.skills?.join(", ") ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                <Input
                  id="certifications"
                  name="certifications"
                  defaultValue={p.certifications?.join(", ") ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input id="languages" name="languages" defaultValue={p.languages?.join(", ") ?? ""} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current_salary">Current Salary</Label>
                  <Input id="current_salary" name="current_salary" defaultValue={p.current_salary ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_salary">Expected Salary</Label>
                  <Input
                    id="expected_salary"
                    name="expected_salary"
                    defaultValue={p.expected_salary ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_type_preference">Employment Type Preference</Label>
                  <Input
                    id="employment_type_preference"
                    name="employment_type_preference"
                    defaultValue={p.employment_type_preference ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_arrangement_preference">Work Arrangement</Label>
                  <Input
                    id="work_arrangement_preference"
                    name="work_arrangement_preference"
                    defaultValue={p.work_arrangement_preference ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input id="availability" name="availability" defaultValue={p.availability ?? ""} />
              </div>
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

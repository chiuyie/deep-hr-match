import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK } from "@/lib/constants/branding";
import { saveJob } from "@/lib/employer/actions";

export default async function EditJobPage({
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
    .select("*")
    .eq("id", id)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job) notFound();

  async function updateJob(formData: FormData) {
    "use server";
    await saveJob(formData, id);
  }

  return (
    <DashboardShell
      role="employer"
      userName={user.name}
      title={`Edit: ${job.title}`}
      description="Update job details"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/employer/jobs/${id}/jd`}>JD Upload</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/employer/jobs/${id}/matrix`}>{FRAMEWORK} Form</Link>
          </Button>
          <Button className="bg-[#1e40af] hover:bg-[#1e3a8a]" asChild>
            <Link href={`/employer/jobs/${id}/matching`}>Matching Results</Link>
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateJob} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" name="title" defaultValue={job.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" defaultValue={job.department ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={job.location ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Input id="employment_type" name="employment_type" defaultValue={job.employment_type ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input id="salary_range" name="salary_range" defaultValue={job.salary_range ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_experience_required">Years Experience</Label>
                <Input id="years_experience_required" name="years_experience_required" type="number" defaultValue={job.years_experience_required ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education_required">Education</Label>
                <Input id="education_required" name="education_required" defaultValue={job.education_required ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue={job.status} className="flex h-9 w-full rounded-md border px-3 text-sm">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="required_skills">Required Skills</Label>
              <Input id="required_skills" name="required_skills" defaultValue={job.required_skills?.join(", ") ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_skills">Preferred Skills</Label>
              <Input id="preferred_skills" name="preferred_skills" defaultValue={job.preferred_skills?.join(", ") ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={job.description ?? ""} rows={5} />
            </div>
            <Button type="submit" className="bg-[#1e40af] hover:bg-[#1e3a8a]">Save Job</Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

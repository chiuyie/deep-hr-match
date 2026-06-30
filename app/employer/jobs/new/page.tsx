import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { saveJob } from "@/lib/employer/actions";

export default async function NewJobPage() {
  const user = await requireRole("employer");

  return (
    <DashboardShell
      role="employer"
      userName={user.name}
      title="Create Job"
      description="Post a new job for free"
    >
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveJob} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Input id="employment_type" name="employment_type" placeholder="Full-time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input id="salary_range" name="salary_range" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_experience_required">Years Experience Required</Label>
                <Input id="years_experience_required" name="years_experience_required" type="number" min={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education_required">Education Required</Label>
                <Input id="education_required" name="education_required" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue="active" className="flex h-9 w-full rounded-md border px-3 text-sm">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="required_skills">Required Skills (comma-separated)</Label>
              <Input id="required_skills" name="required_skills" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_skills">Preferred Skills (comma-separated)</Label>
              <Input id="preferred_skills" name="preferred_skills" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea id="description" name="description" rows={5} />
            </div>
            <Button type="submit" className="bg-[#1e40af] hover:bg-[#1e3a8a]">Create Job</Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

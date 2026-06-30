import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  await requireRole("admin");
  const supabase = await createClient();

  const counts = await Promise.all([
    supabase.from("candidate_profiles").select("*", { count: "exact", head: true }),
    supabase.from("employer_profiles").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("match_results").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("*", { count: "exact", head: true }),
    supabase.from("unlocks").select("*", { count: "exact", head: true }),
    supabase.from("candidate_cv_files").select("*", { count: "exact", head: true }),
    supabase.from("job_jd_files").select("*", { count: "exact", head: true }),
  ]);

  const labels = [
    "Total Candidates",
    "Total Employers",
    "Total Jobs",
    "Matching Results",
    "Payments",
    "Unlocks",
    "Uploaded CVs",
    "Uploaded JDs",
  ];

  return (
    <DashboardShell
      role="admin"
      title="Admin Dashboard"
      description="Platform overview and management"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {counts.map((c, i) => (
          <Card key={labels[i]}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {labels[i]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.count ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}

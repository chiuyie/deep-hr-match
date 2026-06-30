import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole, ensureEmployerProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function EmployerDashboard() {
  const user = await requireRole("employer");
  await ensureEmployerProfile(user.id);
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("employer_id", employer?.id ?? "");

  const { count: activeJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("employer_id", employer?.id ?? "")
    .eq("status", "active");

  const { data: jobIds } = await supabase
    .from("jobs")
    .select("id")
    .eq("employer_id", employer?.id ?? "");

  const ids = jobIds?.map((j) => j.id) ?? [];

  const { count: matchCount } = ids.length
    ? await supabase
        .from("match_results")
        .select("*", { count: "exact", head: true })
        .in("job_id", ids)
    : { count: 0 };

  const { count: unlockCount } = await supabase
    .from("unlocks")
    .select("*", { count: "exact", head: true })
    .eq("employer_id", employer?.id ?? "");

  const stats = [
    { label: "Total Jobs", value: totalJobs ?? 0 },
    { label: "Active Jobs", value: activeJobs ?? 0 },
    { label: "Matching Results", value: matchCount ?? 0 },
    { label: "Profiles Unlocked", value: unlockCount ?? 0 },
  ];

  return (
    <DashboardShell
      role="employer"
      userName={user.name}
      title="Employer Dashboard"
      description="Manage jobs, matching, and candidate unlocks"
      actions={
        <Button className="bg-[#1e40af] hover:bg-[#1e3a8a]" asChild>
          <Link href="/employer/jobs/new">Create Job</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}

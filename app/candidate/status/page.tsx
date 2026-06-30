import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { markCandidateReady } from "@/lib/candidate/actions";
import { statusLabel } from "@/lib/utils/profile";

export default async function CandidateStatusPage() {
  const user = await requireRole("candidate");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { count: cvCount } = await supabase
    .from("candidate_cv_files")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", profile?.id ?? "");

  const { count: matrixCount } = await supabase
    .from("candidate_matrix_answers")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", profile?.id ?? "");

  const checks = [
    { label: "Profile details", done: (profile?.completion_percentage ?? 0) >= 60 },
    { label: "CV uploaded", done: (cvCount ?? 0) > 0 },
    { label: "7×7 form completed", done: (matrixCount ?? 0) > 0 },
  ];

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title="Profile Status"
      description="Review your matching readiness checklist"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Current Status
            <Badge>{statusLabel(profile?.status ?? "draft")}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center justify-between rounded border p-3">
                <span>{c.label}</span>
                <Badge variant={c.done ? "default" : "secondary"}>
                  {c.done ? "Complete" : "Incomplete"}
                </Badge>
              </li>
            ))}
          </ul>
          {profile?.status !== "ready_for_matching" && (
            <form action={markCandidateReady}>
              <Button type="submit" className="bg-[#1e40af] hover:bg-[#1e3a8a]">
                Mark Ready For Matching
              </Button>
            </form>
          )}
          {profile?.status === "ready_for_matching" && (
            <p className="text-sm text-muted-foreground">
              Your profile is visible to employers for matching. You will be contacted outside
              the platform when an employer unlocks your profile.
            </p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

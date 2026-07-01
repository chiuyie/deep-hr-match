import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { requireRole, ensureCandidateProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate, statusLabel } from "@/lib/utils/profile";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { CheckCircle, Grid3X3, Upload, User } from "lucide-react";

export default async function CandidateDashboard() {
  const user = await requireRole("candidate");
  await ensureCandidateProfile(user.id);
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

  const hasCv = (cvCount ?? 0) > 0;
  const hasMatrix = (matrixCount ?? 0) > 0;
  const isReady = profile?.status === "ready_for_matching";

  const steps = [
    {
      label: "Complete your profile",
      done: (profile?.completion_percentage ?? 0) >= 60,
      href: "/candidate/profile",
      icon: User,
    },
    {
      label: "Upload your CV",
      done: hasCv,
      href: "/candidate/cv",
      icon: Upload,
    },
    {
      label: `Complete ${FRAMEWORK_MATCHING_LANGUAGE}`,
      done: hasMatrix,
      href: "/candidate/matrix",
      icon: Grid3X3,
    },
  ];

  return (
    <DashboardShell role="candidate" userName={user.name} title="Candidate Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Good Day</h2>
          <p className="mt-1 text-slate-500">
            Complete your profile to get matched with the right opportunities.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Profile Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {profile?.completion_percentage ?? 0}%
              </p>
              <Progress
                value={profile?.completion_percentage ?? 0}
                className="mt-3 h-2"
              />
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={isReady ? "bg-green-600" : "bg-slate-500"}
              >
                {statusLabel(profile?.status ?? "draft")}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-slate-900">
                {formatDate(profile?.updated_at)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Your Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.label}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <step.icon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-800">
                    {step.label}
                  </span>
                  {step.done && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={step.href}>{step.done ? "View" : "Start"}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {isReady && (
          <Card className="border-green-200 bg-green-50 shadow-sm">
            <CardContent className="py-4 text-sm text-green-800">
              Your profile is ready for matching. Employers who unlock your
              profile will contact you outside the platform.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

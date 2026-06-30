import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { requireRole, ensureCandidateProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate, statusLabel } from "@/lib/utils/profile";
import { Upload, User, Grid3X3, CheckCircle } from "lucide-react";

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

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title="Candidate Dashboard"
      description="Track your profile completion and matching readiness"
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profile Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{profile?.completion_percentage ?? 0}%</p>
            <Progress value={profile?.completion_percentage ?? 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isReady ? "default" : "secondary"} className="text-sm">
              {statusLabel(profile?.status ?? "draft")}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matching Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReady ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Ready</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Not ready</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{formatDate(profile?.updated_at)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <User className="h-5 w-5 text-[#1e40af]" />
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Complete personal and professional details
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/candidate/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Upload className="h-5 w-5 text-[#1e40af]" />
            <CardTitle className="text-base">CV Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={hasCv ? "default" : "secondary"} className="mb-4">
              {hasCv ? "Uploaded" : "Not uploaded"}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href="/candidate/cv">Manage CV</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Grid3X3 className="h-5 w-5 text-[#1e40af]" />
            <CardTitle className="text-base">7×7 Form</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={hasMatrix ? "default" : "secondary"} className="mb-4">
              {hasMatrix ? "In progress" : "Not started"}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href="/candidate/matrix">Complete Form</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

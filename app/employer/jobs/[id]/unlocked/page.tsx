import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getUnlockedCandidateDetails } from "@/lib/auth/unlock";
import { formatDate } from "@/lib/utils/profile";

export default async function JobUnlockedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id: jobId } = await params;
  const { session_id } = await searchParams;
  const user = await requireRole("employer");
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("title")
    .eq("id", jobId)
    .eq("employer_id", employer?.id ?? "")
    .single();

  const { data: unlocks } = await supabase
    .from("unlocks")
    .select("candidate_id, unlocked_at")
    .eq("employer_id", employer?.id ?? "")
    .eq("job_id", jobId)
    .order("unlocked_at", { ascending: false });

  const unlockedDetails = [];
  for (const u of unlocks ?? []) {
    try {
      const details = await getUnlockedCandidateDetails(
        employer!.id,
        jobId,
        u.candidate_id
      );
      unlockedDetails.push({ ...details, unlocked_at: u.unlocked_at });
    } catch {
      // skip if access denied
    }
  }

  return (
    <DashboardShell
      role="employer"
      userName={user.name}
      title="Unlocked Candidates"
      description={job ? `Unlocked profiles for ${job.title}` : "All unlocked candidates"}
    >
      {session_id && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="py-3 text-sm text-green-800">
            Payment successful. Candidate profiles are now unlocked.
          </CardContent>
        </Card>
      )}

      {!unlockedDetails.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No unlocked candidates yet. Generate matches and unlock profiles from the matching page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {unlockedDetails.map(({ profile, cvDownloadUrl, matchResult, unlocked_at }) => (
            <Card key={profile?.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {profile?.full_name}
                  <Badge variant="outline">Unlocked</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Email:</strong> {profile?.email}</p>
                <p><strong>Phone:</strong> {profile?.phone}</p>
                <p><strong>Title:</strong> {profile?.current_job_title}</p>
                <p><strong>Experience:</strong> {profile?.years_of_experience} years</p>
                <p><strong>Skills:</strong> {profile?.skills?.join(", ")}</p>
                {matchResult && (
                  <p>
                    <strong>Match Score:</strong> {matchResult.overall_score}%
                    {matchResult.is_placeholder && (
                      <Badge className="ml-2" variant="secondary">DEMO</Badge>
                    )}
                  </p>
                )}
                <p className="text-muted-foreground">Unlocked {formatDate(unlocked_at)}</p>
                {cvDownloadUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={cvDownloadUrl} target="_blank" rel="noopener noreferrer">
                      Download CV
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button variant="outline" className="mt-4" asChild>
        <Link href={`/employer/jobs/${jobId}/matching`}>Back to Matching Results</Link>
      </Button>
    </DashboardShell>
  );
}

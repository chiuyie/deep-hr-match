import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getUnlockedCandidateDetails } from "@/lib/auth/unlock";

export default async function EmployerUnlockedPage() {
  const user = await requireRole("employer");
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: unlocks } = await supabase
    .from("unlocks")
    .select("*, jobs(title)")
    .eq("employer_id", employer?.id ?? "")
    .order("unlocked_at", { ascending: false });

  const items = [];
  for (const u of unlocks ?? []) {
    let name = "Candidate";
    try {
      const d = await getUnlockedCandidateDetails(
        employer!.id,
        u.job_id,
        u.candidate_id
      );
      name = d.profile?.full_name ?? name;
    } catch {
      /* skip */
    }
    items.push({
      id: u.id,
      name,
      jobTitle: (u.jobs as { title: string } | null)?.title ?? "Job",
      jobId: u.job_id,
    });
  }

  return (
    <>
      {!items.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No unlocked candidates yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {item.name} — {item.jobTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/employer/jobs/${item.jobId}/unlocked`}
                  className="text-sm text-primary hover:underline"
                >
                  View details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

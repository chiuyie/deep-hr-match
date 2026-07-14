import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployerPageSection } from "@/components/employer/employer-ui";
import { formatDate } from "@/lib/utils/profile";

interface UnlockedCandidateCardProps {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  yearsOfExperience?: number | null;
  skills?: string[] | null;
  matchScore?: number | null;
  isPlaceholder?: boolean;
  unlockedAt?: string | null;
  cvDownloadUrl?: string | null;
  showJobTitle?: boolean;
  jobId?: string;
}

export function UnlockedCandidateCard({
  fullName,
  email,
  phone,
  jobTitle,
  yearsOfExperience,
  skills,
  matchScore,
  isPlaceholder,
  unlockedAt,
  cvDownloadUrl,
  showJobTitle = false,
  jobId,
}: UnlockedCandidateCardProps) {
  return (
    <EmployerPageSection
      title={fullName || "Candidate"}
      description={showJobTitle && jobTitle ? `Unlocked for ${jobTitle}` : undefined}
      action={<Badge className="bg-emerald-600 hover:bg-emerald-600">Unlocked</Badge>}
      className="!p-6"
    >
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        {email && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 font-medium text-slate-800">{email}</dd>
          </div>
        )}
        {phone && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</dt>
            <dd className="mt-1 font-medium text-slate-800">{phone}</dd>
          </div>
        )}
        {yearsOfExperience != null && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Experience
            </dt>
            <dd className="mt-1 font-medium text-slate-800">{yearsOfExperience} years</dd>
          </div>
        )}
        {matchScore != null && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Match Score
            </dt>
            <dd className="mt-1 flex items-center gap-2 font-medium text-slate-800">
              {matchScore}%
              {isPlaceholder && <Badge variant="secondary">DEMO</Badge>}
            </dd>
          </div>
        )}
        {skills && skills.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</dt>
            <dd className="mt-1 font-medium text-slate-800">{skills.join(", ")}</dd>
          </div>
        )}
        {unlockedAt && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unlocked</dt>
            <dd className="mt-1 text-slate-600">{formatDate(unlockedAt)}</dd>
          </div>
        )}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        {cvDownloadUrl && (
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <a href={cvDownloadUrl} target="_blank" rel="noopener noreferrer">
              Download CV
            </a>
          </Button>
        )}
        {jobId && (
          <Button variant="ghost" size="sm" className="rounded-lg" asChild>
            <Link href={`/employer/jobs/${jobId}/unlocked`}>View job unlocks</Link>
          </Button>
        )}
      </div>
    </EmployerPageSection>
  );
}

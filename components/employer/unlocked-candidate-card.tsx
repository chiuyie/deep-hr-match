import Link from "next/link";
import { Download, Eye, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CandidateAvatar, MatchScoreRing } from "@/components/employer/match-flow-ui";
import { formatDate } from "@/lib/utils/profile";

interface UnlockedCandidateCardProps {
  candidateId?: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  yearsOfExperience?: number | string | null;
  skills?: string[] | null;
  matchScore?: number | null;
  isPlaceholder?: boolean;
  unlockedAt?: string | null;
  cvDownloadUrl?: string | null;
  showJobTitle?: boolean;
  jobId?: string;
}

export function UnlockedCandidateCard({
  candidateId,
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
  const hasReportLink = Boolean(jobId && candidateId);
  const displayName = fullName || "Candidate";
  const experienceLabel =
    yearsOfExperience == null || yearsOfExperience === ""
      ? null
      : typeof yearsOfExperience === "number"
        ? Number.isFinite(yearsOfExperience)
          ? `${yearsOfExperience} yr${yearsOfExperience === 1 ? "" : "s"} exp`
          : null
        : `${String(yearsOfExperience).trim()} exp`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200/90 hover:shadow-[0_24px_50px_-28px_rgba(6,78,59,0.35)]">
      <div className="h-1.5 bg-[linear-gradient(90deg,#10b981,#14b8a6,#06b6d4)]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <CandidateAvatar name={displayName} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold tracking-tight text-slate-900">
              {displayName}
            </h3>
            {showJobTitle && jobTitle ? (
              <p className="mt-0.5 truncate text-xs text-slate-500">{jobTitle}</p>
            ) : (
              <p className="mt-0.5 text-xs font-medium text-emerald-700">Ready to contact</p>
            )}
          </div>
          {matchScore != null ? (
            <div className="flex flex-col items-end gap-1">
              <MatchScoreRing score={matchScore} size="sm" />
              {isPlaceholder ? (
                <Badge variant="outline" className="px-1 text-[10px]">
                  DEMO
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-2.5 rounded-2xl bg-slate-50/90 p-3.5 ring-1 ring-slate-100">
          {email ? (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2.5 text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200/80">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <span className="truncate font-medium">{email}</span>
            </a>
          ) : null}
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2.5 text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200/80">
                <Phone className="h-3.5 w-3.5" />
              </span>
              <span className="font-medium">{phone}</span>
            </a>
          ) : null}
          {!email && !phone ? (
            <p className="text-sm text-slate-400">Contact details hidden by disclosure settings</p>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {experienceLabel ? (
            <Badge variant="secondary" className="rounded-lg text-xs">
              {experienceLabel}
            </Badge>
          ) : null}
          {skills?.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="rounded-lg text-xs">
              {skill}
            </Badge>
          ))}
          {skills && skills.length > 3 ? (
            <Badge variant="outline" className="rounded-lg text-xs text-slate-400">
              +{skills.length - 3}
            </Badge>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          {unlockedAt ? (
            <p className="text-[11px] text-slate-400">Unlocked {formatDate(unlockedAt)}</p>
          ) : (
            <span />
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {cvDownloadUrl ? (
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0" asChild>
                <a
                  href={cvDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  title="Download CV"
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
            {hasReportLink ? (
              <Button size="sm" className="h-8 rounded-xl px-3 shadow-sm" asChild>
                <Link href={`/employer/jobs/${jobId}/unlocked/${candidateId}`}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Full report
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

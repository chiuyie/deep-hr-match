import Link from "next/link";
import { Download, Eye, Mail, Phone, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/profile";

interface UnlockedCandidateCardProps {
  candidateId?: string;
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

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-slate-800">
            {fullName || "Candidate"}
          </h3>
          {showJobTitle && jobTitle && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{jobTitle}</p>
          )}
        </div>
        {matchScore != null && (
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2 py-1">
            <Trophy className="h-3 w-3 text-primary" />
            <span className="text-sm font-bold text-primary">{matchScore}%</span>
            {isPlaceholder && (
              <Badge variant="outline" className="ml-1 px-1 text-[10px]">DEMO</Badge>
            )}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="mt-3 space-y-1.5">
        {email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{phone}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {yearsOfExperience != null && (
          <Badge variant="secondary" className="text-xs">
            {yearsOfExperience} yr{yearsOfExperience === 1 ? "" : "s"} exp
          </Badge>
        )}
        {skills && skills.slice(0, 3).map((skill) => (
          <Badge key={skill} variant="outline" className="text-xs">
            {skill}
          </Badge>
        ))}
        {skills && skills.length > 3 && (
          <Badge variant="outline" className="text-xs text-slate-400">
            +{skills.length - 3}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4" style={{ marginTop: "auto", paddingTop: "1rem" }}>
        {unlockedAt && (
          <p className="text-[11px] text-slate-400">{formatDate(unlockedAt)}</p>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {cvDownloadUrl && (
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0" asChild>
              <a href={cvDownloadUrl} target="_blank" rel="noopener noreferrer" download title="Download CV">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
          {hasReportLink && (
            <Button size="sm" className="h-8 rounded-xl px-3" asChild>
              <Link href={`/employer/jobs/${jobId}/unlocked/${candidateId}`}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Report
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

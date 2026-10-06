import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Unlock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { CandidateAvatar } from "@/components/employer/match-flow-ui";
import { requireEmployer } from "@/lib/auth/session";
import { isUnlockedContactFieldVisible } from "@/lib/employer/match-disclosure";
import { loadEmployerUnlockedList } from "@/lib/employer/list-queries";
import { loadFormFields } from "@/lib/form-fields/queries";

function UnlockedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[88px] w-full rounded-2xl" />
      ))}
    </div>
  );
}

async function UnlockedContent({ employerId }: { employerId: string }) {
  const [items, candidateFields] = await Promise.all([
    loadEmployerUnlockedList(employerId),
    loadFormFields({ audience: "candidate", formGroup: "profile", includeInactive: false }),
  ]);
  const showName = isUnlockedContactFieldVisible(candidateFields, "full_name");

  if (!items.length) {
    return (
      <EmployerEmptyState
        icon={Users}
        title="No unlocked candidates yet"
        description="Post a job, generate matches, and unlock candidate profiles to see them here."
        actionLabel="View your jobs"
        actionHref="/employer/jobs"
        gradient="from-emerald-500 to-teal-600"
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const name = showName ? item.name : "Candidate";
        return (
          <Link
            key={item.id}
            href={`/employer/jobs/${item.jobId}/unlocked/${item.candidateId}`}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50/80 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:px-5"
          >
            <CandidateAvatar name={name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-800">{name}</p>
              <p className="mt-1 truncate text-sm text-slate-500">{item.jobTitle}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition-transform group-hover:translate-x-0.5">
              Open report
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default async function EmployerUnlockedPage() {
  const { profile: employer } = await requireEmployer();

  return (
    <EmployerPageSection
      title="Unlocked Candidates"
      description="Every profile you have purchased across your jobs — open a report to contact and review"
      icon={<Unlock className="h-6 w-6" />}
      gradient="from-emerald-500 to-teal-600"
    >
      <Suspense fallback={<UnlockedSkeleton />}>
        <UnlockedContent employerId={employer?.id ?? ""} />
      </Suspense>
    </EmployerPageSection>
  );
}

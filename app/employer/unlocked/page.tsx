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
        <Skeleton key={i} className="h-[96px] w-full rounded-2xl" />
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
            className="group flex flex-col gap-3 overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_22px_40px_-28px_rgba(6,78,59,0.3)] sm:flex-row sm:items-center sm:gap-4 sm:px-5"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <CandidateAvatar name={name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold tracking-tight text-slate-900">{name}</p>
                <p className="mt-1 truncate text-sm text-slate-500">{item.jobTitle}</p>
              </div>
            </div>
            <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100 transition-transform group-hover:translate-x-0.5 sm:w-auto sm:justify-start sm:py-1.5">
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
      className="border-slate-200/70 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.45)]"
    >
      <Suspense fallback={<UnlockedSkeleton />}>
        <UnlockedContent employerId={employer?.id ?? ""} />
      </Suspense>
    </EmployerPageSection>
  );
}

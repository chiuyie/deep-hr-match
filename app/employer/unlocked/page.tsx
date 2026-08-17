import Link from "next/link";
import { Users } from "lucide-react";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { requireEmployer } from "@/lib/auth/session";
import { loadEmployerUnlockedList } from "@/lib/employer/list-queries";

export default async function EmployerUnlockedPage() {
  const { profile: employer } = await requireEmployer();
  const items = await loadEmployerUnlockedList(employer?.id ?? "");

  return (
    <EmployerPageSection
      title="Unlocked Candidates"
      description="All candidate profiles you have purchased across your jobs"
      icon={<Users className="h-6 w-6" />}
      gradient="from-blue-500 to-blue-600"
    >
      {!items.length ? (
        <EmployerEmptyState
          icon={Users}
          title="No unlocked candidates yet"
          description="Post a job, generate matches, and unlock candidate profiles to see them here."
          actionLabel="View your jobs"
          actionHref="/employer/jobs"
          gradient="from-blue-500 to-blue-600"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/employer/jobs/${item.jobId}/unlocked/${item.candidateId}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-md"
            >
              <div>
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.jobTitle}</p>
              </div>
              <span className="text-sm font-medium text-primary">View details →</span>
            </Link>
          ))}
        </div>
      )}
    </EmployerPageSection>
  );
}

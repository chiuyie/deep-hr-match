import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import {
  AdminBackLink,
  AdminCompletionBar,
  AdminPageSection,
} from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/status-badge";
import { EmployerDetailField } from "@/components/employer/employer-ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!candidate) notFound();

  const [{ count: matchCount }, { count: cvCount }] = await Promise.all([
    supabase
      .from("match_results")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", id),
    supabase
      .from("candidate_cv_files")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", id),
  ]);

  return (
    <div>
      <AdminBackLink href="/admin/candidates" label="Back to all candidates" />

      <AdminPageSection
        title={candidate.full_name ?? "Unnamed candidate"}
        description="Candidate record"
        icon={<Users className="h-6 w-6" />}
        gradient="from-blue-600 to-indigo-600"
      >
        <p className="mb-6 break-all font-mono text-xs leading-relaxed text-slate-500">{id}</p>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <StatusBadge status={candidate.status} />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Profile completion</span>
            <AdminCompletionBar value={candidate.completion_percentage ?? 0} />
          </div>
          <span className="text-sm text-slate-500">
            Joined {formatDate(candidate.created_at)}
          </span>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <EmployerDetailField label="Candidate ID" value={id} />
          <EmployerDetailField label="Email" value={candidate.email} />
          <EmployerDetailField label="Phone" value={candidate.phone} />
          <EmployerDetailField label="Country" value={candidate.country} />
          <EmployerDetailField label="City" value={candidate.city} />
          <EmployerDetailField label="Current job title" value={candidate.current_job_title} />
          <EmployerDetailField
            label="Years of experience"
            value={
              candidate.years_of_experience != null
                ? String(candidate.years_of_experience)
                : null
            }
          />
          <EmployerDetailField label="Highest education" value={candidate.highest_education} />
          <EmployerDetailField label="Skills" value={candidate.skills?.join(", ")} />
          <EmployerDetailField
            label="Certifications"
            value={candidate.certifications?.join(", ")}
          />
          <EmployerDetailField label="Languages" value={candidate.languages?.join(", ")} />
          <EmployerDetailField label="Current salary" value={candidate.current_salary} />
          <EmployerDetailField label="Expected salary" value={candidate.expected_salary} />
          <EmployerDetailField
            label="Employment preference"
            value={candidate.employment_type_preference}
          />
          <EmployerDetailField
            label="Work arrangement"
            value={candidate.work_arrangement_preference}
          />
          <EmployerDetailField label="Availability" value={candidate.availability} />
          <EmployerDetailField label="Match results" value={String(matchCount ?? 0)} />
          <EmployerDetailField label="CV uploads" value={String(cvCount ?? 0)} />
          <EmployerDetailField label="Last updated" value={formatDate(candidate.updated_at)} />
        </dl>

        {(cvCount ?? 0) > 0 && (
          <p className="mt-6 text-sm text-slate-600">
            CV files for this candidate are listed under{" "}
            <Link href="/admin/files" className="font-medium text-primary hover:underline">
              Admin → Files
            </Link>
            .
          </p>
        )}
      </AdminPageSection>
    </div>
  );
}

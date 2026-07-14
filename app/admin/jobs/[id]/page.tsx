import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, MapPin } from "lucide-react";
import {
  AdminBackLink,
  AdminPageSection,
} from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/status-badge";
import { EmployerDetailField } from "@/components/employer/employer-ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, employer_profiles(company_name, contact_person_email, industry)")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const employer = job.employer_profiles as {
    company_name: string | null;
    contact_person_email: string | null;
    industry: string | null;
  } | null;

  const [{ count: matchCount }, { count: unlockCount }] = await Promise.all([
    supabase.from("match_results").select("*", { count: "exact", head: true }).eq("job_id", id),
    supabase.from("unlocks").select("*", { count: "exact", head: true }).eq("job_id", id),
  ]);

  return (
    <div>
      <AdminBackLink href="/admin/jobs" label="Back to all jobs" />

      <AdminPageSection
        title={job.title}
        description="Job record"
        icon={<Briefcase className="h-6 w-6" />}
        gradient="from-emerald-600 to-teal-600"
      >
        <p className="mb-6 break-all font-mono text-xs leading-relaxed text-slate-500">{id}</p>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <StatusBadge status={job.status} />
          {job.location && (
            <span className="inline-flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
          )}
          <span className="text-sm text-slate-500">Created {formatDate(job.created_at)}</span>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <EmployerDetailField label="Job ID" value={id} />
          <EmployerDetailField label="Employer" value={employer?.company_name} />
          <EmployerDetailField label="Employer email" value={employer?.contact_person_email} />
          <EmployerDetailField label="Industry" value={employer?.industry} />
          <EmployerDetailField label="Department" value={job.department} />
          <EmployerDetailField label="Employment type" value={job.employment_type} />
          <EmployerDetailField label="Salary range" value={job.salary_range} />
          <EmployerDetailField
            label="Years of experience"
            value={
              job.years_experience_required != null
                ? String(job.years_experience_required)
                : null
            }
          />
          <EmployerDetailField label="Education required" value={job.education_required} />
          <EmployerDetailField
            label="Required skills"
            value={job.required_skills?.join(", ")}
          />
          <EmployerDetailField
            label="Preferred skills"
            value={job.preferred_skills?.join(", ")}
          />
          <EmployerDetailField label="Match results" value={String(matchCount ?? 0)} />
          <EmployerDetailField label="Unlocks" value={String(unlockCount ?? 0)} />
          <EmployerDetailField label="Last updated" value={formatDate(job.updated_at)} />
        </dl>

        {job.description && (
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <h3 className="text-sm font-semibold text-slate-700">Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{job.description}</p>
          </div>
        )}
      </AdminPageSection>
    </div>
  );
}

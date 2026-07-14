import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Building2 } from "lucide-react";
import { AdminBackLink, AdminPageSection } from "@/components/admin/admin-ui";
import { EmployerDetailField } from "@/components/employer/employer-ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminEmployerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!employer) notFound();

  const [{ count: jobCount }, { count: paymentCount }, { count: unlockCount }, { data: jobs }] =
    await Promise.all([
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("employer_id", id),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("employer_id", id),
      supabase.from("unlocks").select("*", { count: "exact", head: true }).eq("employer_id", id),
      supabase
        .from("jobs")
        .select("id, title, status, created_at")
        .eq("employer_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  return (
    <div>
      <AdminBackLink href="/admin/employers" label="Back to all employers" />

      <AdminPageSection
        title={employer.company_name ?? "Unnamed company"}
        description="Employer account record"
        icon={<Building2 className="h-6 w-6" />}
        gradient="from-cyan-600 to-blue-600"
      >
        <p className="mb-6 break-all font-mono text-xs leading-relaxed text-slate-500">{id}</p>

        <dl className="grid gap-4 sm:grid-cols-2">
          <EmployerDetailField label="Employer ID" value={id} />
          <EmployerDetailField label="Industry" value={employer.industry} />
          <EmployerDetailField label="Registration number" value={employer.registration_number} />
          <EmployerDetailField label="Company size" value={employer.company_size} />
          <EmployerDetailField label="Website" value={employer.website} />
          <EmployerDetailField label="Contact name" value={employer.contact_person_name} />
          <EmployerDetailField label="Contact email" value={employer.contact_person_email} />
          <EmployerDetailField label="Contact phone" value={employer.contact_person_phone} />
          <EmployerDetailField label="Jobs posted" value={String(jobCount ?? 0)} />
          <EmployerDetailField label="Payments" value={String(paymentCount ?? 0)} />
          <EmployerDetailField label="Unlocks" value={String(unlockCount ?? 0)} />
          <EmployerDetailField label="Joined" value={formatDate(employer.created_at)} />
          <EmployerDetailField label="Last updated" value={formatDate(employer.updated_at)} />
        </dl>

        {employer.company_description && (
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <h3 className="text-sm font-semibold text-slate-700">Company description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
              {employer.company_description}
            </p>
          </div>
        )}

        {(jobs?.length ?? 0) > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Briefcase className="h-4 w-4" />
              Recent jobs
            </h3>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {jobs!.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {job.title}
                  </Link>
                  <span className="text-xs text-slate-500">{formatDate(job.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AdminPageSection>
    </div>
  );
}

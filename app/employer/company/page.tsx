import { Building2 } from "lucide-react";
import { JobCreationStepNav } from "@/components/forms/job-creation/job-creation-step-nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  EmployerPageSection,
  employerInputClassName,
  employerLabelClassName,
} from "@/components/employer/employer-ui";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { saveEmployerProfile } from "@/lib/employer/actions";

export default async function EmployerCompanyPage() {
  const user = await requireRole("employer");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const p = profile ?? {};

  return (
    <div className="space-y-6">
      <JobCreationStepNav currentStep="profile" />
      <EmployerPageSection
        title="Employer Information"
        description="Company details used across your job postings and candidate interactions"
        icon={<Building2 className="h-6 w-6" />}
        gradient="from-cyan-500 to-cyan-600"
      >
        <form action={saveEmployerProfile} className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="company_name" className={employerLabelClassName}>
              Company Name *
            </label>
            <input
              id="company_name"
              name="company_name"
              defaultValue={p.company_name ?? ""}
              required
              className={employerInputClassName}
            />
          </div>
          <div>
            <label htmlFor="registration_number" className={employerLabelClassName}>
              UEN / Registration Number
            </label>
            <input
              id="registration_number"
              name="registration_number"
              defaultValue={p.registration_number ?? ""}
              className={employerInputClassName}
            />
          </div>
          <div>
            <label htmlFor="industry" className={employerLabelClassName}>
              Industry
            </label>
            <input
              id="industry"
              name="industry"
              defaultValue={p.industry ?? ""}
              className={employerInputClassName}
            />
          </div>
          <div>
            <label htmlFor="company_size" className={employerLabelClassName}>
              Company Size
            </label>
            <input
              id="company_size"
              name="company_size"
              defaultValue={p.company_size ?? ""}
              className={employerInputClassName}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="website" className={employerLabelClassName}>
              Website
            </label>
            <input
              id="website"
              name="website"
              defaultValue={p.website ?? ""}
              className={employerInputClassName}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="company_description" className={employerLabelClassName}>
              Description
            </label>
            <Textarea
              id="company_description"
              name="company_description"
              defaultValue={p.company_description ?? ""}
              className="min-h-28 rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="contact_person_name" className={employerLabelClassName}>
              Contact Person
            </label>
            <input
              id="contact_person_name"
              name="contact_person_name"
              defaultValue={p.contact_person_name ?? ""}
              className={employerInputClassName}
            />
          </div>
          <div>
            <label htmlFor="contact_person_email" className={employerLabelClassName}>
              Contact Email
            </label>
            <input
              id="contact_person_email"
              name="contact_person_email"
              type="email"
              defaultValue={p.contact_person_email ?? ""}
              className={employerInputClassName}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="contact_person_phone" className={employerLabelClassName}>
              Contact Phone
            </label>
            <input
              id="contact_person_phone"
              name="contact_person_phone"
              defaultValue={p.contact_person_phone ?? ""}
              className={employerInputClassName}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" className="rounded-xl px-6">
              Save Profile
            </Button>
          </div>
        </form>
      </EmployerPageSection>
    </div>
  );
}

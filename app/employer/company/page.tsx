import { Building2 } from "lucide-react";
import { JobCreationStepNav } from "@/components/forms/job-creation/job-creation-step-nav";
import { Button } from "@/components/ui/button";
import { DynamicProfileFields } from "@/components/forms/dynamic-profile-fields";
import {
  EmployerPageSection,
} from "@/components/employer/employer-ui";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadFormFields, ensureFormFieldsSeeded } from "@/lib/form-fields/queries";
import { saveEmployerProfile } from "@/lib/employer/actions";

export default async function EmployerCompanyPage() {
  const user = await requireRole("employer");
  const supabase = await createClient();

  await ensureFormFieldsSeeded();
  const fields = await loadFormFields({ audience: "employer", formGroup: "profile" });

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
        <form action={saveEmployerProfile} className="space-y-5">
          <DynamicProfileFields fields={fields} values={p} variant="employer" />
          <Button type="submit" className="rounded-xl">
            Save company profile
          </Button>
        </form>
      </EmployerPageSection>
    </div>
  );
}

import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicProfileFields } from "@/components/forms/dynamic-profile-fields";
import {
  EmployerPageSection,
} from "@/components/employer/employer-ui";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadFormFields, ensureFormFieldsReady } from "@/lib/form-fields/queries";
import { saveEmployerProfile } from "@/lib/employer/actions";

export default async function EmployerCompanyPage() {
  const user = await requireRole("employer");
  const supabase = await createClient();

  await ensureFormFieldsReady();
  const fields = await loadFormFields({ audience: "employer", formGroup: "profile" });

  const { data: profile } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const p = profile ?? {};

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">Company Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage the employer details used across your jobs and candidate interactions.
        </p>
      </div>
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

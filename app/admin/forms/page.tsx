import { FormFieldsComparisonEditor } from "@/components/admin/form-fields-comparison-editor";
import { loadComparisonFormFields } from "@/lib/form-fields/queries";
import { loadPlatformDisclosureItems } from "@/lib/employer/platform-disclosure";
import { createClient } from "@/lib/supabase/server";

async function checkEmployerDisclosureColumn() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("form_fields")
    .select("employer_disclosure_mode")
    .limit(1);
  if (!error) return { ok: true as const };
  return {
    ok: false as const,
    error: error.message,
  };
}

export default async function AdminFormsPage() {
  const [{ candidate, employerProfile, employerJob }, platformLoad, disclosureColumn] =
    await Promise.all([
      loadComparisonFormFields(true),
      loadPlatformDisclosureItems(),
      checkEmployerDisclosureColumn(),
    ]);

  const schemaWarnings: string[] = [];
  if (!disclosureColumn.ok) {
    schemaWarnings.push(
      "Migration 008 is missing: after-unlock profile disclosure cannot be saved until you apply supabase/migrations/008_form_field_disclosure.sql."
    );
  }
  if (!platformLoad.persisted) {
    schemaWarnings.push(
      platformLoad.error?.includes("011") || platformLoad.error?.includes("platform_disclosure")
        ? "Migration 011 is missing: platform disclosure (score, 7^7, CV) is showing temporary defaults and will not persist until you apply supabase/migrations/011_platform_disclosure.sql."
        : `Platform disclosure is not persisted yet${platformLoad.error ? `: ${platformLoad.error}` : ""}.`
    );
  }

  return (
    <FormFieldsComparisonEditor
      candidate={candidate}
      employerProfile={employerProfile}
      employerJob={employerJob}
      platformDisclosure={platformLoad.items}
      schemaWarnings={schemaWarnings}
    />
  );
}

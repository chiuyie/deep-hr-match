import { FormFieldsComparisonEditor } from "@/components/admin/form-fields-comparison-editor";
import { loadComparisonFormFields } from "@/lib/form-fields/queries";

export default async function AdminFormsPage() {
  const { candidate, employerProfile, employerJob } = await loadComparisonFormFields(true);

  return (
    <FormFieldsComparisonEditor
      candidate={candidate}
      employerProfile={employerProfile}
      employerJob={employerJob}
    />
  );
}

import { notFound } from "next/navigation";
import { Grid3X3 } from "lucide-react";
import { MatrixForm } from "@/components/forms/matrix-form";
import { EmployerJobContext } from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { requireEmployer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK, FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { saveJobMatrixAnswers } from "@/lib/employer/actions";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";
import { loadPrimaryMatrixCategoryTree } from "@/lib/matching/matrix-queries";

export default async function JobMatrixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile: employer } = await requireEmployer();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("title, status")
    .eq("id", id)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job) notFound();

  const [primaryCategory, { data: answers }] = await Promise.all([
    loadPrimaryMatrixCategoryTree(supabase),
    supabase
      .from("job_matrix_answers")
      .select("question_id, option_id, answer_text, matrix_column")
      .eq("job_id", id),
  ]);

  const filtered = filterSharedMatrixCategories(primaryCategory ? [primaryCategory] : []);

  const answerRows = (answers ?? []).map((a) => ({
    question_id: a.question_id,
    option_id: a.option_id ?? undefined,
    answer_text: a.answer_text ?? undefined,
    matrix_column: a.matrix_column ?? undefined,
  }));

  async function onSave(
    payload: {
      question_id: string;
      option_id?: string;
      answer_text?: string;
      matrix_column: number;
    }[],
    submit: boolean
  ) {
    "use server";
    return saveJobMatrixAnswers(id, payload, submit);
  }

  return (
    <>
      <EmployerJobContext
        jobTitle={job.title}
        jobId={id}
        description={`Shape the ideal candidate profile with the ${FRAMEWORK_MATCHING_LANGUAGE}`}
      />
      <JobWorkflowNav jobId={id} currentStep="matrix" canEdit={job.status === "draft"} />
      <MatrixForm
        categories={filtered}
        existingAnswers={answerRows}
        onSave={onSave}
        targetLabel={`Job ${FRAMEWORK_MATCHING_LANGUAGE}`}
        headerIcon={<Grid3X3 className="h-6 w-6" />}
        wizard={{
          badgeLabel: `${FRAMEWORK} · Role profile`,
          subtitle:
            "Pick one best-fit word per factor. Matching ranks candidates against this role profile.",
          instructionText:
            "Choose the one word that best describes the ideal candidate for this factor.",
        }}
      />
    </>
  );
}

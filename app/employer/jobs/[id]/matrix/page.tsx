import { notFound } from "next/navigation";
import { Grid3X3 } from "lucide-react";
import { MatrixForm } from "@/components/forms/matrix-form";
import { EmployerJobContext } from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { saveJobMatrixAnswers } from "@/lib/employer/actions";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";
import { MATRIX_CATEGORY_TREE_SELECT } from "@/lib/matching/matrix-queries";

export default async function JobMatrixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("employer");
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("title, status")
    .eq("id", id)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job) notFound();

  const { data: categories } = await supabase
    .from("matrix_categories")
    .select(MATRIX_CATEGORY_TREE_SELECT)
    .eq("is_active", true)
    .order("sort_order");

  const filtered = filterSharedMatrixCategories(categories ?? []);

  const { data: answers } = await supabase
    .from("job_matrix_answers")
    .select("question_id, option_id, answer_text, matrix_column")
    .eq("job_id", id);

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
        description={`Complete the ${FRAMEWORK_MATCHING_LANGUAGE} questionnaire for this role`}
      />
      <JobWorkflowNav jobId={id} currentStep="matrix" canEdit={job.status === "draft"} />
      <MatrixForm
        categories={filtered}
        existingAnswers={answerRows}
        onSave={onSave}
        targetLabel={`Job ${FRAMEWORK_MATCHING_LANGUAGE}`}
        headerIcon={<Grid3X3 className="h-6 w-6" />}
      />
    </>
  );
}

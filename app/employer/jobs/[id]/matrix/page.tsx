import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MatrixForm } from "@/components/forms/matrix-form";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { saveJobMatrixAnswers } from "@/lib/employer/actions";

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
    .select("title")
    .eq("id", id)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job) notFound();

  const { data: categories } = await supabase
    .from("matrix_categories")
    .select("*, matrix_questions(*, matrix_options(*))")
    .eq("is_active", true)
    .order("sort_order");

  const filtered = (categories ?? [])
    .map((cat) => ({
      ...cat,
      matrix_questions: (cat.matrix_questions ?? []).filter(
        (q: { target_role: string; is_active: boolean }) =>
          q.is_active && (q.target_role === "employer" || q.target_role === "both")
      ),
    }))
    .filter((cat) => cat.matrix_questions.length > 0);

  const { data: answers } = await supabase
    .from("job_matrix_answers")
    .select("*")
    .eq("job_id", id);

  const answerMap = Object.fromEntries(
    (answers ?? []).map((a) => [
      a.question_id,
      { option_id: a.option_id ?? undefined, answer_text: a.answer_text ?? undefined },
    ])
  );

  async function onSave(
    payload: { question_id: string; option_id?: string; answer_text?: string }[],
    submit: boolean
  ) {
    "use server";
    void submit;
    return saveJobMatrixAnswers(id, payload);
  }

  return (
    <DashboardShell
      role="employer"
      userName={user.name}
      title="Job 7×7 Form"
      description={`Matching language for ${job.title}`}
    >
      <MatrixForm
        categories={filtered}
        existingAnswers={answerMap}
        onSave={onSave}
        targetLabel="Job 7×7 Matching Language"
      />
    </DashboardShell>
  );
}

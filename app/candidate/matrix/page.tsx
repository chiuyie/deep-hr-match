import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MatrixForm } from "@/components/forms/matrix-form";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { saveCandidateMatrixAnswers } from "@/lib/candidate/actions";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";

export default async function CandidateMatrixPage() {
  const user = await requireRole("candidate");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: categories } = await supabase
    .from("matrix_categories")
    .select("*, matrix_questions(*, matrix_options(*))")
    .eq("is_active", true)
    .order("sort_order");

  const filtered = filterSharedMatrixCategories(categories ?? []);

  const { data: answers } = await supabase
    .from("candidate_matrix_answers")
    .select("*")
    .eq("candidate_id", profile?.id ?? "");

  const answerMap = Object.fromEntries(
    (answers ?? []).map((a) => [
      a.question_id,
      { option_id: a.option_id ?? undefined, answer_text: a.answer_text ?? undefined },
    ])
  );

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title={FRAMEWORK_MATCHING_LANGUAGE}
      description="Complete the matching language assessment"
    >
      <MatrixForm
        categories={filtered}
        existingAnswers={answerMap}
        onSave={saveCandidateMatrixAnswers}
      />
    </DashboardShell>
  );
}

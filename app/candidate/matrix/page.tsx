import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MatrixForm } from "@/components/forms/matrix-form";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { saveCandidateMatrixAnswers } from "@/lib/candidate/actions";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";
import { MATRIX_CATEGORY_TREE_SELECT } from "@/lib/matching/matrix-queries";
import { CheckCircle2 } from "lucide-react";

export default async function CandidateMatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const params = await searchParams;

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: categories } = await supabase
    .from("matrix_categories")
    .select(MATRIX_CATEGORY_TREE_SELECT)
    .eq("is_active", true)
    .order("sort_order");

  const filtered = filterSharedMatrixCategories(categories ?? []);

  const { data: answers } = await supabase
    .from("candidate_matrix_answers")
    .select("question_id, option_id, answer_text, matrix_column")
    .eq("candidate_id", profile?.id ?? "");

  const answerRows = (answers ?? []).map((a) => ({
    question_id: a.question_id,
    option_id: a.option_id ?? undefined,
    answer_text: a.answer_text ?? undefined,
    matrix_column: a.matrix_column ?? undefined,
  }));

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title={FRAMEWORK_MATCHING_LANGUAGE}
      description="Choose one best-fit word at each step to build your profile."
    >
      <div className="space-y-4">
        {params.step === "cv-complete" && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle2 />
            <AlertTitle>CV uploaded</AlertTitle>
            <AlertDescription>
              Great progress. Complete the {FRAMEWORK_MATCHING_LANGUAGE} form below to finish
              onboarding.
            </AlertDescription>
          </Alert>
        )}
        <MatrixForm
          categories={filtered}
          existingAnswers={answerRows}
          onSave={saveCandidateMatrixAnswers}
          wizard={{
            instructionText:
              "Only choose one word that you feel describes you the most.",
          }}
          hideFooterActions
        />
      </div>
    </DashboardShell>
  );
}

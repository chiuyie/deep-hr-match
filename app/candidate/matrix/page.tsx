import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MatrixForm } from "@/components/forms/matrix-form";
import { requireRole, getCandidateProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { MATRIX_CANDIDATE_MAX_FACTOR_WORD_SELECTIONS } from "@/lib/matching/matrix-constants";
import { saveCandidateMatrixAnswers } from "@/lib/candidate/actions";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";
import { loadPrimaryMatrixCategoryTree } from "@/lib/matching/matrix-queries";
import {
  fetchCandidateOnboardingState,
  getOnboardingPath,
  getOnboardingStep,
} from "@/lib/candidate/onboarding";
import { CheckCircle2 } from "lucide-react";

export default async function CandidateMatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const params = await searchParams;

  const profile = await getCandidateProfile(user.id);
  const [primaryCategory, { data: answers }, onboarding] = await Promise.all([
    loadPrimaryMatrixCategoryTree(supabase),
    supabase
      .from("candidate_matrix_answers")
      .select("question_id, option_id, answer_text, matrix_column")
      .eq("candidate_id", profile?.id ?? ""),
    fetchCandidateOnboardingState(supabase, user.id, profile),
  ]);

  const filtered = filterSharedMatrixCategories(primaryCategory ? [primaryCategory] : []);

  const answerRows = (answers ?? []).map((a) => ({
    question_id: a.question_id,
    option_id: a.option_id ?? undefined,
    answer_text: a.answer_text ?? undefined,
    matrix_column: a.matrix_column ?? undefined,
  }));

  const onboardingStep = getOnboardingStep(onboarding);
  const alreadySubmitted = onboarding.hasMatrix;
  const continueHref =
    onboardingStep === "done" ? "/candidate/status" : getOnboardingPath(onboardingStep);
  const continueLabel =
    onboardingStep === "done" || onboardingStep === "matrix"
      ? "Continue to matching status"
      : "Continue";

  return (
      <div className="space-y-4">
        {params.step === "cv-complete" && !alreadySubmitted ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle2 />
            <AlertTitle>CV uploaded</AlertTitle>
            <AlertDescription>
              Great progress. Complete the {FRAMEWORK_MATCHING_LANGUAGE} form below to finish
              onboarding.
            </AlertDescription>
          </Alert>
        ) : null}
        <MatrixForm
          categories={filtered}
          existingAnswers={answerRows}
          onSave={saveCandidateMatrixAnswers}
          maxFactorWordSelections={MATRIX_CANDIDATE_MAX_FACTOR_WORD_SELECTIONS}
          wizard={{
            instructionText: `Choose up to ${MATRIX_CANDIDATE_MAX_FACTOR_WORD_SELECTIONS} words that describe you best for each factor, then continue.`,
            alreadySubmitted,
            continueHref,
            continueLabel,
          }}
          hideFooterActions
        />
      </div>
  );
}

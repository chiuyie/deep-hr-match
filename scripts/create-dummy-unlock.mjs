import { createClient } from "@supabase/supabase-js";

const [
  ,
  ,
  employerIdArg,
  jobIdArg,
  candidateIdArg,
] = process.argv;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceRoleKey || serviceRoleKey === "your-service-role-key") {
  console.error(
    "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

if (!employerIdArg || !jobIdArg || !candidateIdArg) {
  console.error(
    "Usage: node --env-file=.env.local scripts/create-dummy-unlock.mjs <employer_id> <job_id> <candidate_id>"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const [{ data: employer }, { data: job }, { data: candidate }] = await Promise.all([
    supabase.from("employer_profiles").select("id, company_name").eq("id", employerIdArg).single(),
    supabase.from("jobs").select("id, employer_id, title").eq("id", jobIdArg).single(),
    supabase.from("candidate_profiles").select("id, full_name").eq("id", candidateIdArg).single(),
  ]);

  if (!employer) {
    throw new Error(`Employer not found: ${employerIdArg}`);
  }
  if (!job) {
    throw new Error(`Job not found: ${jobIdArg}`);
  }
  if (job.employer_id !== employer.id) {
    throw new Error("Job does not belong to the provided employer.");
  }
  if (!candidate) {
    throw new Error(`Candidate not found: ${candidateIdArg}`);
  }

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("employer_id", employer.id)
    .eq("job_id", job.id)
    .contains("selected_candidate_ids", [candidate.id])
    .limit(1)
    .maybeSingle();

  let paymentId = existingPayment?.id ?? null;

  if (!paymentId) {
    const { data: insertedPayment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        employer_id: employer.id,
        job_id: job.id,
        candidate_id: candidate.id,
        selected_candidate_ids: [candidate.id],
        amount: 0,
        currency: "usd",
        status: "paid",
        payment_type: "candidate_profile_unlock",
        stripe_session_id: `dummy-session-${Date.now()}`,
        paid_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (paymentError || !insertedPayment) {
      throw paymentError ?? new Error("Failed to create dummy payment.");
    }

    paymentId = insertedPayment.id;
  }

  const { data: unlock, error: unlockError } = await supabase
    .from("unlocks")
    .upsert(
      {
        employer_id: employer.id,
        job_id: job.id,
        candidate_id: candidate.id,
        payment_id: paymentId,
      },
      {
        onConflict: "employer_id,job_id,candidate_id",
        ignoreDuplicates: false,
      }
    )
    .select("id, employer_id, job_id, candidate_id, payment_id, unlocked_at")
    .single();

  if (unlockError || !unlock) {
    throw unlockError ?? new Error("Failed to create dummy unlock.");
  }

  console.log(
    JSON.stringify(
      {
        employer: {
          id: employer.id,
          company_name: employer.company_name,
        },
        job: {
          id: job.id,
          title: job.title,
        },
        candidate: {
          id: candidate.id,
          full_name: candidate.full_name,
        },
        paymentId,
        unlock,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceRoleKey || serviceRoleKey === "your-service-role-key") {
  console.error(
    "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function extractCandidateIds(payment) {
  const selected = Array.isArray(payment.selected_candidate_ids)
    ? payment.selected_candidate_ids.filter(Boolean)
    : [];

  if (selected.length) {
    return [...new Set(selected)];
  }

  return payment.candidate_id ? [payment.candidate_id] : [];
}

async function main() {
  const { data: payments, error } = await supabase
    .from("payments")
    .select("id, employer_id, job_id, candidate_id, selected_candidate_ids, status, paid_at")
    .eq("status", "paid")
    .order("paid_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  const unlockRecords = [];

  for (const payment of payments ?? []) {
    const candidateIds = extractCandidateIds(payment);

    for (const candidateId of candidateIds) {
      unlockRecords.push({
        employer_id: payment.employer_id,
        job_id: payment.job_id,
        candidate_id: candidateId,
        payment_id: payment.id,
      });
    }
  }

  if (!unlockRecords.length) {
    console.log(
      JSON.stringify(
        {
          dryRun,
          paidPayments: payments?.length ?? 0,
          derivedUnlockRecords: 0,
          inserted: 0,
          message: "No paid payments found. Nothing to backfill.",
        },
        null,
        2
      )
    );
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          paidPayments: payments?.length ?? 0,
          derivedUnlockRecords: unlockRecords.length,
          sample: unlockRecords.slice(0, 10),
        },
        null,
        2
      )
    );
    return;
  }

  const { data: inserted, error: upsertError } = await supabase
    .from("unlocks")
    .upsert(unlockRecords, {
      onConflict: "employer_id,job_id,candidate_id",
      ignoreDuplicates: true,
    })
    .select("id, employer_id, job_id, candidate_id, payment_id, unlocked_at");

  if (upsertError) {
    throw upsertError;
  }

  console.log(
    JSON.stringify(
      {
        dryRun: false,
        paidPayments: payments?.length ?? 0,
        derivedUnlockRecords: unlockRecords.length,
        inserted: inserted?.length ?? 0,
        sample: inserted?.slice(0, 10) ?? [],
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

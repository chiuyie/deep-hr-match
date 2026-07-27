/**
 * @deprecated Jobs require a complete 7^7 Matching Language form.
 * Create jobs through the employer UI instead of this seed script.
 *
 * To remove legacy jobs without matrix answers:
 *   npm run cleanup-jobs-without-matrix -- --dry-run
 *   npm run cleanup-jobs-without-matrix
 */

console.log(
  [
    "seed-employer-jobs is deprecated.",
    "",
    "Active jobs must include a complete 7^7 Matching Language form.",
    "Create jobs in the employer portal (/employer/jobs) instead.",
    "",
    "To remove old jobs missing 7^7 answers:",
    "  npm run cleanup-jobs-without-matrix -- --dry-run",
    "  npm run cleanup-jobs-without-matrix",
  ].join("\n")
);

process.exit(0);

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const employerEmail = process.env.EMPLOYER_EMAIL?.trim();

const placeholders = new Set([
  "https://your-project.supabase.co",
  "your-anon-key",
  "your-service-role-key",
]);

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!url || placeholders.has(url)) {
  fail("Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
}

if (!serviceRoleKey || placeholders.has(serviceRoleKey)) {
  fail("Set SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dummyJobs = [
  {
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "Singapore",
    employment_type: "Full-time",
    salary_range: "SGD 8,000 - 12,000",
    years_experience_required: 5,
    education_required: "Bachelor's in Computer Science or related field",
    required_skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    preferred_skills: ["Next.js", "Supabase", "AWS"],
    description:
      "Build and maintain our talent matching platform. Lead feature development, mentor junior engineers, and collaborate with product on employer hiring workflows.",
    status: "active",
  },
  {
    title: "HR Business Partner",
    department: "Human Resources",
    location: "Singapore (Hybrid)",
    employment_type: "Full-time",
    salary_range: "SGD 6,500 - 9,000",
    years_experience_required: 4,
    education_required: "Bachelor's in HR, Business, or Psychology",
    required_skills: ["Employee Relations", "Recruitment", "HR Policies"],
    preferred_skills: ["Workday", "Compensation Planning"],
    description:
      "Partner with business leaders to support hiring, onboarding, and employee engagement across regional teams.",
    status: "active",
  },
  {
    title: "Marketing Manager",
    department: "Marketing",
    location: "Remote (APAC)",
    employment_type: "Full-time",
    salary_range: "SGD 7,000 - 10,000",
    years_experience_required: 3,
    education_required: "Bachelor's in Marketing or Communications",
    required_skills: ["Digital Marketing", "Content Strategy", "Campaign Management"],
    preferred_skills: ["SEO", "Marketing Automation", "B2B SaaS"],
    description:
      "Own demand generation and brand campaigns for employer and candidate acquisition.",
    status: "draft",
  },
  {
    title: "Data Analyst",
    department: "Analytics",
    location: "Singapore",
    employment_type: "Full-time",
    salary_range: "SGD 5,500 - 7,500",
    years_experience_required: 2,
    education_required: "Bachelor's in Statistics, Economics, or Data Science",
    required_skills: ["SQL", "Excel", "Data Visualization"],
    preferred_skills: ["Python", "Tableau", "Looker"],
    description:
      "Analyze matching performance, hiring funnel metrics, and candidate quality signals to improve placement outcomes.",
    status: "active",
  },
  {
    title: "Customer Success Lead",
    department: "Operations",
    location: "Singapore",
    employment_type: "Full-time",
    salary_range: "SGD 6,000 - 8,500",
    years_experience_required: 4,
    education_required: "Bachelor's degree",
    required_skills: ["Account Management", "Client Onboarding", "Stakeholder Communication"],
    preferred_skills: ["HR Tech", "SaaS Customer Success"],
    description:
      "Guide employer clients through onboarding, job posting best practices, and candidate unlock workflows.",
    status: "closed",
  },
];

let employerQuery = supabase
  .from("employer_profiles")
  .select("id, user_id, company_name, users!inner(email, name)");

if (employerEmail) {
  employerQuery = employerQuery.eq("users.email", employerEmail);
}

const { data: employers, error: employerError } = await employerQuery.limit(1);

if (employerError) {
  fail(employerError.message);
}

const employer = employers?.[0];

if (!employer) {
  fail(
    employerEmail
      ? `No employer profile found for ${employerEmail}`
      : "No employer profiles found. Sign up as an employer first, or set EMPLOYER_EMAIL in .env.local"
  );
}

const employerUser = Array.isArray(employer.users) ? employer.users[0] : employer.users;
const label = employerUser?.email ?? employer.company_name ?? employer.id;

const { data: existingJobs } = await supabase
  .from("jobs")
  .select("title")
  .eq("employer_id", employer.id);

const existingTitles = new Set((existingJobs ?? []).map((job) => job.title));
const jobsToInsert = dummyJobs
  .filter((job) => !existingTitles.has(job.title))
  .map((job) => ({
    ...job,
    employer_id: employer.id,
  }));

if (!jobsToInsert.length) {
  console.log(`All dummy jobs already exist for ${label}. Nothing to insert.`);
  process.exit(0);
}

const { data: inserted, error: insertError } = await supabase
  .from("jobs")
  .insert(jobsToInsert)
  .select("id, title, status");

if (insertError) {
  fail(insertError.message);
}

console.log(`Seeded ${inserted.length} dummy job(s) for ${label}:`);
for (const job of inserted) {
  console.log(`  - ${job.title} (${job.status})`);
}

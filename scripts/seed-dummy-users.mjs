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
const password = process.env.DUMMY_USER_PASSWORD?.trim() || "DemoUser123!";

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

const dummyEmployers = [
  {
    email: "employer-demo-1@deephrmatch.test",
    name: "Sarah Chen",
    profile: {
      company_name: "NovaTech Solutions",
      registration_number: "201912345A",
      industry: "Technology",
      company_size: "51-200",
      website: "https://novatech.demo",
      company_description:
        "B2B SaaS company building HR and talent platforms for APAC enterprises.",
      contact_person_name: "Sarah Chen",
      contact_person_email: "employer-demo-1@deephrmatch.test",
      contact_person_phone: "+65 9123 4001",
    },
  },
  {
    email: "employer-demo-2@deephrmatch.test",
    name: "David Kumar",
    profile: {
      company_name: "GreenLeaf HR Consulting",
      registration_number: "201823456B",
      industry: "Human Resources",
      company_size: "11-50",
      website: "https://greenleafhr.demo",
      company_description:
        "Boutique HR consultancy specializing in workforce planning and executive search.",
      contact_person_name: "David Kumar",
      contact_person_email: "employer-demo-2@deephrmatch.test",
      contact_person_phone: "+65 9123 4002",
    },
  },
  {
    email: "employer-demo-3@deephrmatch.test",
    name: "Michelle Ong",
    profile: {
      company_name: "Apex Retail Group",
      registration_number: "201734567C",
      industry: "Retail",
      company_size: "201-500",
      website: "https://apexretail.demo",
      company_description:
        "Multi-brand retail operator with stores across Singapore and Malaysia.",
      contact_person_name: "Michelle Ong",
      contact_person_email: "employer-demo-3@deephrmatch.test",
      contact_person_phone: "+65 9123 4003",
    },
  },
  {
    email: "employer-demo-4@deephrmatch.test",
    name: "Robert Tan",
    profile: {
      company_name: "Horizon Finance",
      registration_number: "201645678D",
      industry: "Financial Services",
      company_size: "51-200",
      website: "https://horizonfinance.demo",
      company_description:
        "Regional fintech firm offering payments, lending, and treasury solutions.",
      contact_person_name: "Robert Tan",
      contact_person_email: "employer-demo-4@deephrmatch.test",
      contact_person_phone: "+65 9123 4004",
    },
  },
  {
    email: "employer-demo-5@deephrmatch.test",
    name: "Emily Foster",
    profile: {
      company_name: "BrightPath Education",
      registration_number: "201556789E",
      industry: "Education",
      company_size: "11-50",
      website: "https://brightpath.demo",
      company_description:
        "EdTech startup delivering online upskilling programs for working professionals.",
      contact_person_name: "Emily Foster",
      contact_person_email: "employer-demo-5@deephrmatch.test",
      contact_person_phone: "+65 9123 4005",
    },
  },
];

const dummyCandidates = [
  {
    email: "candidate-demo-1@deephrmatch.test",
    name: "Priya Sharma",
    profile: {
      full_name: "Priya Sharma",
      email: "candidate-demo-1@deephrmatch.test",
      phone: "+65 8234 5001",
      country: "Singapore",
      city: "Singapore",
      current_job_title: "Senior Software Engineer",
      years_of_experience: 6,
      highest_education: "Bachelor's in Computer Science",
      skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
      certifications: ["AWS Solutions Architect Associate"],
      languages: ["English", "Hindi"],
      current_salary: "SGD 9,500",
      expected_salary: "SGD 11,000 - 13,000",
      employment_type_preference: "Full-time",
      work_arrangement_preference: "Hybrid",
      availability: "1 month notice",
      completion_percentage: 100,
      status: "ready_for_matching",
    },
  },
  {
    email: "candidate-demo-2@deephrmatch.test",
    name: "Marcus Lee",
    profile: {
      full_name: "Marcus Lee",
      email: "candidate-demo-2@deephrmatch.test",
      phone: "+65 8234 5002",
      country: "Singapore",
      city: "Singapore",
      current_job_title: "HR Business Partner",
      years_of_experience: 5,
      highest_education: "Bachelor's in Human Resource Management",
      skills: ["Employee Relations", "Talent Acquisition", "HR Policies", "Workday"],
      certifications: ["SHRM-CP"],
      languages: ["English", "Mandarin"],
      current_salary: "SGD 7,200",
      expected_salary: "SGD 8,000 - 9,500",
      employment_type_preference: "Full-time",
      work_arrangement_preference: "On-site",
      availability: "Immediate",
      completion_percentage: 100,
      status: "ready_for_matching",
    },
  },
  {
    email: "candidate-demo-3@deephrmatch.test",
    name: "Elena Rodriguez",
    profile: {
      full_name: "Elena Rodriguez",
      email: "candidate-demo-3@deephrmatch.test",
      phone: "+65 8234 5003",
      country: "Singapore",
      city: "Singapore",
      current_job_title: "Marketing Manager",
      years_of_experience: 4,
      highest_education: "Bachelor's in Marketing",
      skills: ["Digital Marketing", "Content Strategy", "SEO", "Campaign Management"],
      certifications: ["Google Analytics Certification"],
      languages: ["English", "Spanish"],
      current_salary: "SGD 6,800",
      expected_salary: "SGD 7,500 - 9,000",
      employment_type_preference: "Full-time",
      work_arrangement_preference: "Remote",
      availability: "2 weeks notice",
      completion_percentage: 100,
      status: "ready_for_matching",
    },
  },
  {
    email: "candidate-demo-4@deephrmatch.test",
    name: "James Wong",
    profile: {
      full_name: "James Wong",
      email: "candidate-demo-4@deephrmatch.test",
      phone: "+65 8234 5004",
      country: "Singapore",
      city: "Singapore",
      current_job_title: "Data Analyst",
      years_of_experience: 3,
      highest_education: "Bachelor's in Statistics",
      skills: ["SQL", "Python", "Tableau", "Excel", "Data Visualization"],
      certifications: ["Tableau Desktop Specialist"],
      languages: ["English", "Cantonese"],
      current_salary: "SGD 5,500",
      expected_salary: "SGD 6,500 - 7,500",
      employment_type_preference: "Full-time",
      work_arrangement_preference: "Hybrid",
      availability: "1 month notice",
      completion_percentage: 100,
      status: "ready_for_matching",
    },
  },
  {
    email: "candidate-demo-5@deephrmatch.test",
    name: "Aisha Tan",
    profile: {
      full_name: "Aisha Tan",
      email: "candidate-demo-5@deephrmatch.test",
      phone: "+65 8234 5005",
      country: "Singapore",
      city: "Singapore",
      current_job_title: "Customer Success Lead",
      years_of_experience: 5,
      highest_education: "Bachelor's in Business Administration",
      skills: ["Account Management", "Client Onboarding", "SaaS", "Stakeholder Communication"],
      certifications: ["Certified Customer Success Manager"],
      languages: ["English", "Malay"],
      current_salary: "SGD 7,000",
      expected_salary: "SGD 8,000 - 9,000",
      employment_type_preference: "Full-time",
      work_arrangement_preference: "Hybrid",
      availability: "Immediate",
      completion_percentage: 100,
      status: "ready_for_matching",
    },
  },
];

async function findAuthUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );
    if (match) return match;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function ensureUser({ email, name, role }) {
  let authUser = await findAuthUserByEmail(email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? `Failed to create auth user for ${email}`);
    }

    authUser = data.user;
    console.log(`  Created auth user: ${email}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password,
      user_metadata: { name, role },
    });
    if (error) throw new Error(error.message);
    console.log(`  Updated auth user: ${email}`);
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (userError) throw new Error(userError.message);

  if (!appUser) {
    throw new Error(
      `No public.users row for ${email}. Ensure migration 006 (signup trigger) is applied.`
    );
  }

  if (appUser.role !== role) {
    const { error: roleError } = await supabase
      .from("users")
      .update({ role, name })
      .eq("id", appUser.id);
    if (roleError) throw new Error(roleError.message);
  }

  return appUser.id;
}

async function seedEmployer(entry) {
  const userId = await ensureUser({
    email: entry.email,
    name: entry.name,
    role: "employer",
  });

  const { error } = await supabase
    .from("employer_profiles")
    .update(entry.profile)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  console.log(`  Employer ready: ${entry.profile.company_name} (${entry.email})`);
}

async function seedCandidate(entry) {
  const userId = await ensureUser({
    email: entry.email,
    name: entry.name,
    role: "candidate",
  });

  const { error } = await supabase
    .from("candidate_profiles")
    .update(entry.profile)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  console.log(`  Candidate ready: ${entry.profile.full_name} (${entry.email})`);
}

console.log("Seeding dummy employers...");
for (const employer of dummyEmployers) {
  await seedEmployer(employer);
}

console.log("");
console.log("Seeding dummy candidates...");
for (const candidate of dummyCandidates) {
  await seedCandidate(candidate);
}

console.log("");
console.log("Done. All dummy users share this password:");
console.log(`  ${password}`);
console.log("");
console.log("Employer sign-in: /auth/employer/sign-in");
console.log("Candidate sign-in: /auth/candidate/sign-in");

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
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

if (!url || placeholders.has(url)) fail("Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
if (!serviceRoleKey || placeholders.has(serviceRoleKey)) {
  fail("Set SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const LANGUAGE_OPTIONS = [
  "English",
  "Mandarin Chinese",
  "Malay",
  "Tamil",
  "Hindi",
  "Cantonese",
  "Spanish",
  "Japanese",
  "French",
  "Vietnamese",
];

const PROFICIENCIES = ["Professional", "Fluent", "Native"];
const WORKING_HOURS_OPTIONS = [
  "Mon-Fri, standard office hours",
  "Mon-Fri, fixed daytime shift",
  "Mon-Fri, fixed evening/night shift",
  "Rotating shifts",
  "Weekend shifts required",
  "5.5-day work week",
  "6-day work week",
  "Part-time schedule",
  "Flexible hours",
  "Compressed work week",
  "On-call outside working hours",
  "Other (explain in additional notes)",
];
const TRAVEL_OPTIONS = [
  "None",
  "Occasional (< 25%)",
  "Regular domestic travel",
  "Frequent international travel",
];
const IMPORTANCE_OPTIONS = ["High", "Medium", "Low"];
const BENEFITS = [
  "Home Leave",
  "Travel Benefits",
  "Medical Insurance",
  "Dental Coverage",
  "Flexible Hours",
  "Gym Membership",
  "Transport Allowance",
  "Performance Bonus",
];
const NO_PREFERENCE = "No preference";
const DUMMY_EMAIL_RE = /@deephrmatch\.test$/i;
const MATRIX_COLUMNS = 7;

const employerSeeds = [
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

const candidateSeeds = [
  ["candidate-demo-1@deephrmatch.test", "Priya Sharma", "Senior Software Engineer", ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"]],
  ["candidate-demo-2@deephrmatch.test", "Marcus Lee", "HR Business Partner", ["Employee Relations", "Talent Acquisition", "HR Policies", "Workday"]],
  ["candidate-demo-3@deephrmatch.test", "Elena Rodriguez", "Marketing Manager", ["Digital Marketing", "Content Strategy", "SEO", "Campaign Management"]],
  ["candidate-demo-4@deephrmatch.test", "James Wong", "Data Analyst", ["SQL", "Python", "Tableau", "Excel", "Data Visualization"]],
  ["candidate-demo-5@deephrmatch.test", "Aisha Tan", "Customer Success Lead", ["Account Management", "Client Onboarding", "SaaS", "Stakeholder Communication"]],
  ["candidate-demo-6@deephrmatch.test", "Brandon Lim", "Full Stack Developer", ["TypeScript", "Node.js", "React", "Supabase", "PostgreSQL"]],
  ["candidate-demo-7@deephrmatch.test", "Cheryl Ong", "Product Manager", ["Product Strategy", "Roadmapping", "Stakeholder Management", "Analytics"]],
  ["candidate-demo-8@deephrmatch.test", "Farah Nordin", "Operations Manager", ["Operations", "Process Improvement", "Vendor Management", "Reporting"]],
  ["candidate-demo-9@deephrmatch.test", "Kevin Tan", "Finance Analyst", ["Excel", "Financial Modeling", "Forecasting", "SQL"]],
  ["candidate-demo-10@deephrmatch.test", "Nadia Ho", "Talent Acquisition Lead", ["Recruitment", "Interviewing", "Employer Branding", "Sourcing"]],
];

const jobTemplates = [
  {
    title: "Senior Software Engineer",
    department: "Engineering",
    employment_type: "Full-time",
    education_required: "Bachelor's in Computer Science or related field",
    required_skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    preferred_skills: ["Next.js", "Supabase", "AWS"],
    description:
      "Build and maintain customer-facing products, improve platform reliability, and mentor team members.",
    languageNeeds: ["English"],
  },
  {
    title: "HR Business Partner",
    department: "Human Resources",
    employment_type: "Full-time",
    education_required: "Bachelor's in HR, Business, or Psychology",
    required_skills: ["Employee Relations", "Recruitment", "HR Policies"],
    preferred_skills: ["Workday", "Compensation Planning"],
    description:
      "Partner with leaders on hiring, performance, workforce planning, and employee engagement.",
    languageNeeds: ["English", "Mandarin Chinese"],
  },
  {
    title: "Marketing Manager",
    department: "Marketing",
    employment_type: "Full-time",
    education_required: "Bachelor's in Marketing or Communications",
    required_skills: ["Digital Marketing", "Content Strategy", "Campaign Management"],
    preferred_skills: ["SEO", "Marketing Automation", "B2B SaaS"],
    description:
      "Own demand generation, campaign planning, and channel performance across APAC.",
    languageNeeds: ["English"],
  },
  {
    title: "Data Analyst",
    department: "Analytics",
    employment_type: "Full-time",
    education_required: "Bachelor's in Statistics, Economics, or Data Science",
    required_skills: ["SQL", "Excel", "Data Visualization"],
    preferred_skills: ["Python", "Tableau", "Looker"],
    description:
      "Analyze hiring funnel metrics and business data to guide decisions and process improvements.",
    languageNeeds: ["English"],
  },
  {
    title: "Customer Success Lead",
    department: "Operations",
    employment_type: "Full-time",
    education_required: "Bachelor's degree",
    required_skills: ["Account Management", "Client Onboarding", "Stakeholder Communication"],
    preferred_skills: ["HR Tech", "SaaS Customer Success"],
    description:
      "Lead customer onboarding, renewal support, and strategic employer success initiatives.",
    languageNeeds: ["English", "Malay"],
  },
];

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }
  return users;
}

async function cleanupExistingDemoData() {
  const authUsers = await listAllAuthUsers();
  const demoAuthUsers = authUsers.filter((user) => DUMMY_EMAIL_RE.test(user.email ?? ""));
  for (const user of demoAuthUsers) {
    await supabase.auth.admin.deleteUser(user.id);
  }

  await supabase.from("match_results").delete().like("match_summary", "%[DEMO]%");
  await supabase.from("jobs").delete().eq("title", "Demo Match Review Job");
}

async function waitForAppUser(authUserId, email) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data.id;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No public.users row for ${email}. Ensure signup trigger migrations are applied.`);
}

async function createAuthUser({ email, name, role }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error || !data.user) {
    throw new Error(error?.message ?? `Failed to create auth user for ${email}`);
  }
  return data.user;
}

function buildCandidateLanguages(index) {
  return [
    {
      language: LANGUAGE_OPTIONS[index % LANGUAGE_OPTIONS.length],
      proficiency: PROFICIENCIES[index % PROFICIENCIES.length],
    },
    {
      language: LANGUAGE_OPTIONS[(index + 3) % LANGUAGE_OPTIONS.length],
      proficiency: PROFICIENCIES[(index + 1) % PROFICIENCIES.length],
    },
  ];
}

function buildCandidateProfile([email, name, title, skills], index) {
  return {
    full_name: name,
    email,
    phone: `+65 8234 ${String(5001 + index).padStart(4, "0")}`,
    country: "Singapore",
    city: "Singapore",
    current_job_title: title,
    years_of_experience: 3 + (index % 6),
    highest_education: "Bachelor's degree",
    skills,
    certifications: [`Certification ${index + 1}`],
    languages: buildCandidateLanguages(index),
    current_salary: `SGD ${(5000 + index * 450).toLocaleString()}`,
    expected_salary: `SGD ${(6500 + index * 500).toLocaleString()} - ${(8000 + index * 550).toLocaleString()}`,
    employment_type_preference: "Full-time",
    work_arrangement_preference: ["Hybrid", "On-site", "Remote"][index % 3],
    availability: ["Immediate", "2 weeks notice", "1 month notice"][index % 3],
    status: "ready_for_matching",
    completion_percentage: 100,
  };
}

async function seedEmployer(seed, index) {
  const authUser = await createAuthUser({
    email: seed.email,
    name: seed.name,
    role: "employer",
  });
  const userId = await waitForAppUser(authUser.id, seed.email);

  const { data: profile, error } = await supabase
    .from("employer_profiles")
    .update(seed.profile)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error || !profile) throw error ?? new Error(`Failed to seed employer ${seed.email}`);

  return {
    id: profile.id,
    email: seed.email,
    name: seed.name,
    companyName: seed.profile.company_name,
    index,
  };
}

async function seedCandidate(seed, index) {
  const [email, name] = seed;
  const authUser = await createAuthUser({
    email,
    name,
    role: "candidate",
  });
  const userId = await waitForAppUser(authUser.id, email);
  const profile = buildCandidateProfile(seed, index);

  const { data: candidate, error } = await supabase
    .from("candidate_profiles")
    .update(profile)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error || !candidate) throw error ?? new Error(`Failed to seed candidate ${email}`);

  await ensureCandidateCv(candidate.id, name);

  return { id: candidate.id, email, name, index };
}

async function ensureCandidateCv(candidateId, candidateName) {
  const safe = candidateName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filePath = `${candidateId}/demo-${safe}.pdf`;
  const pdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xc3, 0xa2, 0xc3, 0xa3,
    0xc3, 0x8f, 0xc3, 0x93, 0x0a, 0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c,
    0x3c, 0x20, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c,
    0x6f, 0x67, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20,
    0x52, 0x20, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x32, 0x20,
    0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x20, 0x2f, 0x54, 0x79, 0x70, 0x65,
    0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x2f, 0x4b, 0x69, 0x64, 0x73, 0x20,
    0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x20, 0x2f, 0x43, 0x6f, 0x75, 0x6e, 0x74,
    0x20, 0x31, 0x20, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x33,
    0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x20, 0x2f, 0x54, 0x79, 0x70,
    0x65, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x72, 0x65, 0x6e,
    0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x20, 0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61,
    0x42, 0x6f, 0x78, 0x20, 0x5b, 0x30, 0x20, 0x30, 0x20, 0x33, 0x30, 0x30, 0x20, 0x31,
    0x34, 0x34, 0x5d, 0x20, 0x2f, 0x43, 0x6f, 0x6e, 0x74, 0x65, 0x6e, 0x74, 0x73, 0x20,
    0x34, 0x20, 0x30, 0x20, 0x52, 0x20, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62,
    0x6a, 0x0a, 0x34, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x20, 0x2f,
    0x4c, 0x65, 0x6e, 0x67, 0x74, 0x68, 0x20, 0x34, 0x34, 0x20, 0x3e, 0x3e, 0x0a, 0x73,
    0x74, 0x72, 0x65, 0x61, 0x6d, 0x0a, 0x42, 0x54, 0x0a, 0x2f, 0x46, 0x31, 0x20, 0x31,
    0x32, 0x20, 0x54, 0x66, 0x0a, 0x37, 0x32, 0x20, 0x31, 0x31, 0x30, 0x20, 0x54, 0x64,
    0x0a, 0x28, 0x44, 0x65, 0x6d, 0x6f, 0x20, 0x43, 0x56, 0x29, 0x20, 0x54, 0x6a, 0x0a,
    0x45, 0x54, 0x0a, 0x65, 0x6e, 0x64, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x0a, 0x65,
    0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x30, 0x20, 0x35,
    0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33,
    0x35, 0x20, 0x66, 0x20, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x39,
    0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, 0x30, 0x30, 0x30, 0x30,
    0x30, 0x30, 0x35, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a,
    0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x31, 0x35, 0x20, 0x30, 0x30, 0x30, 0x30,
    0x30, 0x20, 0x6e, 0x20, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x32,
    0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, 0x74, 0x72, 0x61, 0x69,
    0x6c, 0x65, 0x72, 0x0a, 0x3c, 0x3c, 0x20, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31,
    0x20, 0x30, 0x20, 0x52, 0x20, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x35, 0x20, 0x3e,
    0x3e, 0x0a, 0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x32, 0x38,
    0x37, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a,
  ]);
  const { error: uploadError } = await supabase.storage
    .from("candidate-cvs")
    .upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("candidate_cv_files").insert({
    candidate_id: candidateId,
    file_name: `${candidateName} Demo CV.pdf`,
    file_url: filePath,
    file_path: filePath,
    file_type: "application/pdf",
    file_size: pdfBytes.byteLength,
  });
  if (error && !String(error.message).includes("duplicate")) throw error;
}

function matrixOptionColumn(sortOrder) {
  return ((sortOrder - 1) % MATRIX_COLUMNS) + 1;
}

function activeOptions(options) {
  return (options ?? [])
    .filter((option) => option.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function optionsInColumn(options, column) {
  return activeOptions(options).filter((option) => matrixOptionColumn(option.sort_order) === column);
}

function getChildQuestion(questions, parentOptionId) {
  return [...questions]
    .filter((q) => q.is_active && q.parent_option_id === parentOptionId)
    .sort((a, b) => a.sort_order - b.sort_order)[0];
}

async function loadPrimaryMatrixCategory() {
  const { data: categories, error } = await supabase
    .from("matrix_categories")
    .select("*, matrix_questions(*, matrix_options!matrix_options_question_id_fkey(*))")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  const primary = [...(categories ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  if (!primary) throw new Error("No active matrix category found. Run npm run seed-matrix-77 first.");
  return primary;
}

function buildMatrixAnswers(category, seedOffset) {
  const questions = [...(category.matrix_questions ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const rootQuestions = questions.filter((q) => q.is_active && !q.parent_option_id);
  const level1 = rootQuestions[0];
  const wordRoots = rootQuestions.slice(1);
  if (!level1 || wordRoots.length === 0) {
    throw new Error("Matrix tree is missing root questions.");
  }

  const answers = [];

  for (let column = 1; column <= MATRIX_COLUMNS; column += 1) {
    const factorOption = optionsInColumn(level1.matrix_options, column)[0];
    const underFactor = factorOption ? getChildQuestion(questions, factorOption.id) : null;

    if (underFactor) {
      let currentQuestion = underFactor;
      let depth = 0;
      while (currentQuestion) {
        const options = activeOptions(currentQuestion.matrix_options);
        if (!options.length) break;
        const selected = options[(seedOffset + column + depth) % options.length];
        answers.push({
          question_id: currentQuestion.id,
          option_id: selected.id,
          matrix_column: column,
        });
        currentQuestion = getChildQuestion(questions, selected.id);
        depth += 1;
      }
      continue;
    }

    const choices = wordRoots
      .map((question) => ({ question, option: optionsInColumn(question.matrix_options, column)[0] }))
      .filter((row) => row.option);
    if (!choices.length) continue;

    const chosen = choices[(seedOffset + column - 1) % choices.length];
    answers.push({
      question_id: chosen.question.id,
      option_id: chosen.option.id,
      matrix_column: column,
    });

    let currentQuestion = getChildQuestion(questions, chosen.option.id);
    let depth = 0;
    while (currentQuestion) {
      const options = activeOptions(currentQuestion.matrix_options);
      if (!options.length) break;
      const selected = options[(seedOffset + column + depth) % options.length];
      answers.push({
        question_id: currentQuestion.id,
        option_id: selected.id,
        matrix_column: column,
      });
      currentQuestion = getChildQuestion(questions, selected.id);
      depth += 1;
    }
  }

  return answers;
}

function buildJobFormData(jobTemplate, employer, templateIndex) {
  return {
    job_id: `JOB-${2026}-${employer.index + 1}${templateIndex + 1}${100 + templateIndex}`,
    created_by_representative: employer.name,
    working_hours: WORKING_HOURS_OPTIONS[(employer.index + templateIndex) % WORKING_HOURS_OPTIONS.length],
    team_size: String(4 + employer.index + templateIndex),
    importance_level: IMPORTANCE_OPTIONS[templateIndex % IMPORTANCE_OPTIONS.length],
    travel_needs: TRAVEL_OPTIONS[(employer.index + templateIndex) % TRAVEL_OPTIONS.length],
    reporting_to: ["Engineering Manager", "HR Director", "Marketing Director", "Head of Analytics", "Customer Success Director"][templateIndex],
    additional_notes: `Demo job for ${employer.companyName}. Includes complete structured data for QA.`,
    desired_minimum_salary: String(4500 + templateIndex * 700 + employer.index * 150),
    desired_maximum_salary: String(7000 + templateIndex * 900 + employer.index * 200),
    benefits_package: BENEFITS.slice(0, 3 + (templateIndex % 3)),
    required_availability: ["Immediate", "1 week", "2 weeks", "1 Month"][templateIndex % 4],
    required_age: NO_PREFERENCE,
    required_employment_eligibility_visa: "Singapore citizen",
    required_ethnicity: NO_PREFERENCE,
    required_gender: NO_PREFERENCE,
    required_race: NO_PREFERENCE,
    required_religion: NO_PREFERENCE,
    required_birth_country: NO_PREFERENCE,
    required_current_country: "Singapore",
    required_current_city: "Singapore",
    required_months_in_current_country: "1-2 years",
    required_dialect: NO_PREFERENCE,
    required_height: NO_PREFERENCE,
    required_weight: NO_PREFERENCE,
    required_fitness_level: NO_PREFERENCE,
    required_nationality: NO_PREFERENCE,
    not_required_nationality: "Others",
    required_work_arrangement: ["Hybrid", "On-site", "Fully Remote"][templateIndex % 3],
    language_needs: jobTemplate.languageNeeds,
    faq_work_life_balance: templateIndex % 2 === 0,
    faq_driving_licence: templateIndex === 4,
    faq_car_ownership: false,
    faq_willing_overtime: templateIndex % 2 === 1,
    faq_need_disability_support: true,
    faq_willing_relocate: templateIndex === 2,
    faq_willing_background_check: true,
  };
}

async function seedJobsForEmployer(employer, category) {
  const jobs = [];
  for (let i = 0; i < jobTemplates.length; i += 1) {
    const template = jobTemplates[i];
    const formData = buildJobFormData(template, employer, i);
    const salaryMin = Number.parseInt(formData.desired_minimum_salary, 10);
    const salaryMax = Number.parseInt(formData.desired_maximum_salary, 10);
    const salaryRange = `SGD ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()} / month`;
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        employer_id: employer.id,
        title: `${template.title} - ${employer.companyName}`,
        department: template.department,
        location: "Singapore",
        employment_type: template.employment_type,
        salary_range: salaryRange,
        years_experience_required: 2 + i,
        education_required: template.education_required,
        required_skills: template.required_skills,
        preferred_skills: template.preferred_skills,
        description: template.description,
        status: "active",
        form_data: formData,
      })
      .select("id, title")
      .single();
    if (error || !job) throw error ?? new Error(`Failed to create job for ${employer.email}`);

    const answers = buildMatrixAnswers(category, employer.index * 2 + i);
    const rows = answers.map((answer) => ({
      job_id: job.id,
      question_id: answer.question_id,
      option_id: answer.option_id,
      answer_text: null,
      matrix_column: answer.matrix_column,
    }));
    if (rows.length) {
      const { error: matrixError } = await supabase.from("job_matrix_answers").insert(rows);
      if (matrixError) throw matrixError;
    }

    jobs.push(job);
  }
  return jobs;
}

async function seedCandidateMatrixAnswers(candidates, category) {
  for (const candidate of candidates) {
    const answers = buildMatrixAnswers(category, candidate.index);
    const rows = answers.map((answer) => ({
      candidate_id: candidate.id,
      question_id: answer.question_id,
      option_id: answer.option_id,
      answer_text: null,
      matrix_column: answer.matrix_column,
    }));
    const { error } = await supabase.from("candidate_matrix_answers").insert(rows);
    if (error) throw error;
  }
}

function scoreMatrixMatch(jobAnswers, candidateAnswers) {
  const byCell = (rows) => {
    const map = new Map();
    for (const row of rows) {
      if (!row.option_id) continue;
      map.set(`${row.question_id}__col${row.matrix_column}`, row.option_id);
    }
    return map;
  };

  const jobMap = byCell(jobAnswers);
  const candidateMap = byCell(candidateAnswers);
  const columnScores = [];
  let matchedCount = 0;
  let totalCount = 0;

  for (let column = 1; column <= MATRIX_COLUMNS; column += 1) {
    const keys = [...jobMap.keys()].filter((key) => key.endsWith(`__col${column}`));
    const comparable = keys.filter((key) => candidateMap.has(key));
    if (!comparable.length) continue;
    let columnMatched = 0;
    for (const key of comparable) {
      if (jobMap.get(key) === candidateMap.get(key)) columnMatched += 1;
    }
    matchedCount += columnMatched;
    totalCount += comparable.length;
    columnScores.push(Math.round((columnMatched / comparable.length) * 100));
  }

  if (!columnScores.length) {
    return { matrixScore: 0, matchedCount: 0, totalCount: 0, columnCount: 0 };
  }
  const matrixScore = Math.round(
    columnScores.reduce((sum, score) => sum + score, 0) / columnScores.length
  );
  return {
    matrixScore,
    matchedCount,
    totalCount,
    columnCount: columnScores.length,
  };
}

async function generateMatchesForJobs(jobs, candidates) {
  const candidateIds = candidates.map((c) => c.id);
  const jobIds = jobs.map((j) => j.id);
  const { data: jobAnswers, error: jobAnswerError } = await supabase
    .from("job_matrix_answers")
    .select("job_id, question_id, option_id, matrix_column")
    .in("job_id", jobIds);
  if (jobAnswerError) throw jobAnswerError;

  const { data: candidateAnswers, error: candidateAnswerError } = await supabase
    .from("candidate_matrix_answers")
    .select("candidate_id, question_id, option_id, matrix_column")
    .in("candidate_id", candidateIds);
  if (candidateAnswerError) throw candidateAnswerError;

  const jobMap = new Map();
  for (const row of jobAnswers ?? []) {
    const list = jobMap.get(row.job_id) ?? [];
    list.push(row);
    jobMap.set(row.job_id, list);
  }
  const candidateMap = new Map();
  for (const row of candidateAnswers ?? []) {
    const list = candidateMap.get(row.candidate_id) ?? [];
    list.push(row);
    candidateMap.set(row.candidate_id, list);
  }

  for (const job of jobs) {
    await supabase.from("match_results").delete().eq("job_id", job.id);
    const generatedAt = new Date().toISOString();
    const rows = candidates.map((candidate) => {
      const score = scoreMatrixMatch(jobMap.get(job.id) ?? [], candidateMap.get(candidate.id) ?? []);
      return {
        job_id: job.id,
        candidate_id: candidate.id,
        overall_score: score.matrixScore,
        matrix_score: score.matrixScore,
        profile_score: null,
        skills_score: null,
        experience_score: null,
        education_score: null,
        match_summary: `7^7 match (equal column weights): ${score.matchedCount}/${score.totalCount} word picks aligned across ${score.columnCount} factor${score.columnCount === 1 ? "" : "s"} (${score.matrixScore}%).`,
        strengths:
          score.matchedCount > 0
            ? [`${score.matchedCount} exact word match${score.matchedCount === 1 ? "" : "es"} at the same factor column and level`]
            : [],
        gaps:
          score.totalCount - score.matchedCount > 0
            ? [`${score.totalCount - score.matchedCount} word pick${score.totalCount - score.matchedCount === 1 ? "" : "s"} differ between job and candidate`]
            : [],
        ranking_position: 0,
        is_placeholder: false,
        generated_at: generatedAt,
      };
    });
    rows.sort((a, b) => b.overall_score - a.overall_score);
    rows.forEach((row, index) => {
      row.ranking_position = index + 1;
    });
    const { error } = await supabase.from("match_results").insert(rows);
    if (error) throw error;
  }
}

async function summarizeResults(jobs) {
  const sample = [];
  for (const job of jobs.slice(0, 5)) {
    const { data, error } = await supabase
      .from("match_results")
      .select("ranking_position, overall_score, candidate_profiles(full_name)")
      .eq("job_id", job.id)
      .order("ranking_position")
      .limit(3);
    if (error) throw error;
    sample.push({
      job: job.title,
      top3: (data ?? []).map((row) => ({
        rank: row.ranking_position,
        score: row.overall_score,
        candidate: Array.isArray(row.candidate_profiles)
          ? row.candidate_profiles[0]?.full_name
          : row.candidate_profiles?.full_name,
      })),
    });
  }

  const { count: totalMatchRows, error: countError } = await supabase
    .from("match_results")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;

  return { totalMatchRows: totalMatchRows ?? 0, sample };
}

async function main() {
  console.log("Cleaning old demo data...");
  await cleanupExistingDemoData();

  console.log("Loading matrix tree...");
  const category = await loadPrimaryMatrixCategory();

  console.log("Creating 5 employers...");
  const employers = [];
  for (let i = 0; i < employerSeeds.length; i += 1) {
    employers.push(await seedEmployer(employerSeeds[i], i));
  }

  console.log("Creating 10 candidates with complete profiles + CVs...");
  const candidates = [];
  for (let i = 0; i < candidateSeeds.length; i += 1) {
    candidates.push(await seedCandidate(candidateSeeds[i], i));
  }

  console.log("Seeding candidate 7^7 answers...");
  await seedCandidateMatrixAnswers(candidates, category);

  console.log("Creating 25 active jobs with complete 7^7 answers...");
  const jobs = [];
  for (const employer of employers) {
    const employerJobs = await seedJobsForEmployer(employer, category);
    jobs.push(...employerJobs);
  }

  console.log("Generating match snapshots...");
  await generateMatchesForJobs(jobs, candidates);

  console.log("Verifying results...");
  const summary = await summarizeResults(jobs);

  console.log(
    JSON.stringify(
      {
        employerCount: employers.length,
        jobCount: jobs.length,
        candidateCount: candidates.length,
        matchResultRows: summary.totalMatchRows,
        expectedMatchResultRows: jobs.length * candidates.length,
        employerLogins: employers.map((e) => ({ email: e.email, password })),
        candidateLogins: candidates.map((c) => ({ email: c.email, password })),
        sampleTopMatches: summary.sample,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});

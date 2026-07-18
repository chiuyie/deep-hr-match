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
const employerEmail = process.env.MATCH_DEMO_EMPLOYER_EMAIL?.trim() || "dennisx055@gmail.com";
const candidatePassword = process.env.MATCH_DEMO_PASSWORD?.trim() || "Password123!";
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

const demoJob = {
  title: "Demo Match Review Job",
  department: "Engineering",
  location: "Singapore",
  employment_type: "Full-time",
  salary_range: "SGD 8,500 - 11,500",
  years_experience_required: 4,
  education_required: "Bachelor's degree or equivalent experience",
  required_skills: ["React", "TypeScript", "Node.js", "Stakeholder Management"],
  preferred_skills: ["Next.js", "Supabase", "Product Thinking"],
  description:
    "Demo employer role used to validate anonymous top-match previews, unlock workflows, and CV downloads.",
  status: "active",
};

const demoCandidates = [
  {
    email: "dennis-match-candidate-1@deephrmatch.test",
    name: "Alyssa Tan",
    profile: {
      full_name: "Alyssa Tan",
      email: "dennis-match-candidate-1@deephrmatch.test",
      phone: "+65 8100 1001",
      country: "Singapore",
      city: "Singapore",
      current_job_title: "Frontend Engineer",
      years_of_experience: 6,
      highest_education: "Bachelor's in Computer Science",
      skills: ["React", "TypeScript", "Next.js", "Design Systems", "Node.js"],
      certifications: ["Professional Scrum Master I"],
      languages: ["English", "Mandarin"],
      current_salary: "SGD 8,800",
      expected_salary: "SGD 10,000 - 11,500",
      employment_type_preference: "Full-time",
      work_arrangement_preference: "Hybrid",
      availability: "Immediate",
      completion_percentage: 100,
      status: "ready_for_matching",
    },
    score: 94,
    summary: "[DEMO] Strong frontend and product collaboration match.",
    strengths: ["[DEMO] Deep React experience", "[DEMO] Strong stakeholder communication"],
    gaps: ["[DEMO] Limited backend architecture exposure"],
  },
  {
    email: "dennis-match-candidate-2@deephrmatch.test",
    name: "Brandon Lim",
    profile: {
      full_name: "Brandon Lim",
      email: "dennis-match-candidate-2@deephrmatch.test",
      phone: "+65 8100 1002",
      country: "Singapore",
      city: "Singapore",
      current_job_title: "Full Stack Developer",
      years_of_experience: 5,
      highest_education: "Bachelor's in Information Systems",
      skills: ["TypeScript", "Node.js", "PostgreSQL", "React", "Supabase"],
      certifications: ["AWS Developer Associate"],
      languages: ["English"],
      current_salary: "SGD 8,200",
      expected_salary: "SGD 9,500 - 10,800",
      employment_type_preference: "Full-time",
      work_arrangement_preference: "Hybrid",
      availability: "2 weeks notice",
      completion_percentage: 100,
      status: "ready_for_matching",
    },
    score: 89,
    summary: "[DEMO] Balanced front-end and back-end skill fit for the role.",
    strengths: ["[DEMO] Strong TypeScript stack", "[DEMO] Relevant database experience"],
    gaps: ["[DEMO] Less design system ownership"],
  },
  {
    email: "dennis-match-candidate-3@deephrmatch.test",
    name: "Cheryl Ong",
    profile: {
      full_name: "Cheryl Ong",
      email: "dennis-match-candidate-3@deephrmatch.test",
      phone: "+65 8100 1003",
      country: "Singapore",
      city: "Singapore",
      current_job_title: "Product Engineer",
      years_of_experience: 4,
      highest_education: "Bachelor's in Software Engineering",
      skills: ["React", "TypeScript", "Product Discovery", "UX Collaboration", "SQL"],
      certifications: [],
      languages: ["English", "Malay"],
      current_salary: "SGD 7,600",
      expected_salary: "SGD 8,500 - 9,800",
      employment_type_preference: "Full-time",
      work_arrangement_preference: "Remote",
      availability: "1 month notice",
      completion_percentage: 100,
      status: "ready_for_matching",
    },
    score: 84,
    summary: "[DEMO] Good product collaboration profile with solid technical breadth.",
    strengths: ["[DEMO] Strong cross-functional communication", "[DEMO] React experience"],
    gaps: ["[DEMO] Less backend depth than top candidates"],
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

async function ensureCandidateUser(entry) {
  let authUser = await findAuthUserByEmail(entry.email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: entry.email,
      password: candidatePassword,
      email_confirm: true,
      user_metadata: { name: entry.name, role: "candidate" },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? `Failed to create auth user for ${entry.email}`);
    }

    authUser = data.user;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: candidatePassword,
      user_metadata: { name: entry.name, role: "candidate" },
    });
    if (error) throw new Error(error.message);
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (userError || !appUser) {
    throw userError ?? new Error(`No public.users row for ${entry.email}`);
  }

  const { data: candidateProfile, error: profileError } = await supabase
    .from("candidate_profiles")
    .update(entry.profile)
    .eq("user_id", appUser.id)
    .select("id")
    .single();

  if (profileError || !candidateProfile) {
    throw profileError ?? new Error(`Failed to update candidate profile for ${entry.email}`);
  }

  return candidateProfile.id;
}

async function ensureEmployer() {
  const { data: employerRows, error } = await supabase
    .from("employer_profiles")
    .select("id, user_id, users!inner(email)")
    .eq("users.email", employerEmail)
    .limit(1);

  if (error) throw error;

  const employer = employerRows?.[0];
  if (!employer) {
    throw new Error(`No employer profile found for ${employerEmail}`);
  }

  return employer.id;
}

async function ensureDemoJob(employerId) {
  const { data: existing } = await supabase
    .from("jobs")
    .select("id")
    .eq("employer_id", employerId)
    .eq("title", demoJob.title)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("jobs")
      .update(demoJob)
      .eq("id", existing.id);

    if (error) throw error;
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from("jobs")
    .insert({ ...demoJob, employer_id: employerId })
    .select("id")
    .single();

  if (error || !inserted) throw error ?? new Error("Failed to create demo job");
  return inserted.id;
}

async function ensureCvRecord(candidateId, candidateName) {
  const fileName = `${candidateName} Demo CV.pdf`;
  const filePath = `${candidateId}/demo-${candidateName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;

  const { data: existing } = await supabase
    .from("candidate_cv_files")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("file_path", filePath)
    .maybeSingle();

  if (existing) return filePath;

  const pdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a,
    0x25, 0xc3, 0xa2, 0xc3, 0xa3, 0xc3, 0x8f, 0xc3, 0x93, 0x0a,
    0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x20,
    0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x43, 0x61, 0x74, 0x61,
    0x6c, 0x6f, 0x67, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20,
    0x32, 0x20, 0x30, 0x20, 0x52, 0x20, 0x3e, 0x3e, 0x0a, 0x65, 0x6e,
    0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x32, 0x20, 0x30, 0x20, 0x6f, 0x62,
    0x6a, 0x0a, 0x3c, 0x3c, 0x20, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20,
    0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x2f, 0x4b, 0x69, 0x64,
    0x73, 0x20, 0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x20, 0x2f,
    0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x31, 0x20, 0x3e, 0x3e, 0x0a,
    0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x33, 0x20, 0x30, 0x20,
    0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x20, 0x2f, 0x54, 0x79, 0x70,
    0x65, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x20, 0x2f, 0x50, 0x61,
    0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x20,
    0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61, 0x42, 0x6f, 0x78, 0x20, 0x5b,
    0x30, 0x20, 0x30, 0x20, 0x33, 0x30, 0x30, 0x20, 0x31, 0x34, 0x34,
    0x5d, 0x20, 0x2f, 0x43, 0x6f, 0x6e, 0x74, 0x65, 0x6e, 0x74, 0x73,
    0x20, 0x34, 0x20, 0x30, 0x20, 0x52, 0x20, 0x3e, 0x3e, 0x0a, 0x65,
    0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x34, 0x20, 0x30, 0x20, 0x6f,
    0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x20, 0x2f, 0x4c, 0x65, 0x6e, 0x67,
    0x74, 0x68, 0x20, 0x34, 0x34, 0x20, 0x3e, 0x3e, 0x0a, 0x73, 0x74,
    0x72, 0x65, 0x61, 0x6d, 0x0a, 0x42, 0x54, 0x0a, 0x2f, 0x46, 0x31,
    0x20, 0x31, 0x32, 0x20, 0x54, 0x66, 0x0a, 0x37, 0x32, 0x20, 0x31,
    0x31, 0x30, 0x20, 0x54, 0x64, 0x0a, 0x28, 0x44, 0x65, 0x6d, 0x6f,
    0x20, 0x43, 0x56, 0x29, 0x20, 0x54, 0x6a, 0x0a, 0x45, 0x54, 0x0a,
    0x65, 0x6e, 0x64, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x0a, 0x65,
    0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x78, 0x72, 0x65, 0x66, 0x0a,
    0x30, 0x20, 0x35, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30,
    0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x20,
    0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x39, 0x20,
    0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, 0x30, 0x30,
    0x30, 0x30, 0x30, 0x30, 0x30, 0x35, 0x38, 0x20, 0x30, 0x30, 0x30,
    0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30,
    0x30, 0x31, 0x31, 0x35, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20,
    0x6e, 0x20, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30,
    0x32, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a,
    0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a, 0x3c, 0x3c, 0x20,
    0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52,
    0x20, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x35, 0x20, 0x3e, 0x3e,
    0x0a, 0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a,
    0x32, 0x38, 0x37, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a,
  ]);

  const { error: uploadError } = await supabase.storage
    .from("candidate-cvs")
    .upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { error: dbError } = await supabase.from("candidate_cv_files").insert({
    candidate_id: candidateId,
    file_name: fileName,
    file_url: filePath,
    file_path: filePath,
    file_type: "application/pdf",
    file_size: pdfBytes.byteLength,
  });

  if (dbError) throw dbError;
  return filePath;
}

async function upsertMatches(jobId, candidateIds) {
  await supabase.from("match_results").delete().eq("job_id", jobId);

  const generatedAt = new Date().toISOString();
  const rows = candidateIds.map((candidateId, index) => {
    const demo = demoCandidates[index];
    return {
      job_id: jobId,
      candidate_id: candidateId,
      overall_score: demo.score,
      matrix_score: Math.max(0, demo.score - 2),
      profile_score: Math.max(0, demo.score - 4),
      skills_score: Math.max(0, demo.score - 1),
      experience_score: Math.max(0, demo.score - 3),
      education_score: Math.max(0, demo.score - 5),
      match_summary: demo.summary,
      strengths: demo.strengths,
      gaps: demo.gaps,
      ranking_position: index + 1,
      is_placeholder: true,
      generated_at: generatedAt,
    };
  });

  const { error } = await supabase.from("match_results").insert(rows);
  if (error) throw error;
}

async function main() {
  const employerId = await ensureEmployer();
  const jobId = await ensureDemoJob(employerId);

  const candidateIds = [];
  for (const entry of demoCandidates) {
    const candidateId = await ensureCandidateUser(entry);
    candidateIds.push(candidateId);
  }

  await ensureCvRecord(candidateIds[0], demoCandidates[0].name);
  await upsertMatches(jobId, candidateIds);

  console.log(JSON.stringify({
    employerEmail,
    employerId,
    jobId,
    jobTitle: demoJob.title,
    candidateIds,
    cvCandidateId: candidateIds[0],
    demoCandidateLogins: demoCandidates.map((candidate) => ({
      email: candidate.email,
      password: candidatePassword,
    })),
  }, null, 2));
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_USER_ID_HEADER, AUTH_SESSION_HEADER } from "@/lib/auth/forwarded-user";
import { parseForwardedSession } from "@/lib/auth/parse-forwarded-session";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthUser } from "@/lib/supabase/resolve-auth-user";
import type { User, UserRole } from "@/types/database";

async function loadCandidateProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

const EMPLOYER_PROFILE_SELECT =
  "id, user_id, company_name, registration_number, industry, company_size, website, company_description, contact_person_name, contact_person_email, contact_person_phone, created_at, updated_at";

const SESSION_USER_SELECT =
  "id, auth_user_id, role, name, email, created_at, updated_at";

type SessionRow = User;

function toUser(row: SessionRow): User {
  return {
    id: row.id,
    auth_user_id: row.auth_user_id,
    role: row.role,
    name: row.name,
    email: row.email,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function loadEmployerProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employer_profiles")
    .select(EMPLOYER_PROFILE_SELECT)
    .eq("user_id", userId)
    .single();
  return data;
}

export const getAuthUser = cache(async function getAuthUser() {
  const headerList = await headers();
  const forwardedId = headerList.get(AUTH_USER_ID_HEADER);
  // Middleware always sets this header ("" when logged out). Only trust non-empty
  // values that middleware wrote after JWT verification.
  if (forwardedId !== null) {
    if (!forwardedId) return null;
    return { id: forwardedId };
  }

  const supabase = await createClient();
  return resolveAuthUser(supabase);
});

const loadSessionRow = cache(async function loadSessionRow(): Promise<SessionRow | null> {
  const headerList = await headers();
  const forwardedAuthUserId = headerList.get(AUTH_USER_ID_HEADER);

  const forwarded = parseForwardedSession(
    headerList.get(AUTH_SESSION_HEADER),
    forwardedAuthUserId
  );
  if (forwarded) return forwarded;

  const authUser = await getAuthUser();
  if (!authUser) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(SESSION_USER_SELECT)
    .eq("auth_user_id", authUser.id)
    .single();

  if (!error && data) {
    return data as SessionRow;
  }

  const { data: fallback } = await supabase
    .from("users")
    .select("id, auth_user_id, role, name, email, created_at, updated_at")
    .eq("auth_user_id", authUser.id)
    .single();

  return (fallback as SessionRow | null) ?? null;
});

export const getCurrentUser = cache(async function getCurrentUser(): Promise<User | null> {
  const row = await loadSessionRow();
  return row ? toUser(row) : null;
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");
  return user;
}

export async function requireRole(role: UserRole | UserRole[]) {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    redirect(getDashboardPath(user.role));
  }
  return user;
}

/** Admin session (role check only — no extra profile table). */
export async function requireAdmin() {
  return requireRole("admin");
}

/** Employer session + cached profile (one profile query per request). */
export async function requireEmployer() {
  const user = await requireRole("employer");
  const profile = await getEmployerProfile(user.id);
  return { user, profile };
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "employer":
      return "/employer";
    case "candidate":
    default:
      return "/candidate";
  }
}

export const getCandidateProfile = cache(async function getCandidateProfile(userId: string) {
  // Always load from DB. Middleware only forwards identity (role/name/email) so
  // we never return a stale/partial embedded profile after account switches.
  return loadCandidateProfile(userId);
});

export const getEmployerProfile = cache(async function getEmployerProfile(userId: string) {
  return loadEmployerProfile(userId);
});

export async function ensureCandidateProfile(userId: string) {
  const existing = await loadCandidateProfile(userId);
  if (existing) return existing;

  const supabase = await createClient();
  const user = await supabase.from("users").select("email").eq("id", userId).single();
  const { data, error } = await supabase
    .from("candidate_profiles")
    .insert({ user_id: userId, email: user.data?.email })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function ensureEmployerProfile(userId: string) {
  const supabase = await createClient();
  const existing = await loadEmployerProfile(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("employer_profiles")
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function anonymizeCandidateId(candidateId: string): string {
  return `CAND-${candidateId.slice(0, 8).toUpperCase()}`;
}

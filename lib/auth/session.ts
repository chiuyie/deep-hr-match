import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User, UserRole } from "@/types/database";

async function loadCandidateProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

async function loadEmployerProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

export const getAuthUser = cache(async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  return authUser;
});

export const getCurrentUser = cache(async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .single();

  return data as User | null;
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
  return loadCandidateProfile(userId);
});

export const getEmployerProfile = cache(async function getEmployerProfile(userId: string) {
  return loadEmployerProfile(userId);
});

export async function ensureCandidateProfile(userId: string) {
  const supabase = await createClient();
  const existing = await loadCandidateProfile(userId);
  if (existing) return existing;

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

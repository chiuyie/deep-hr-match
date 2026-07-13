"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validations/schemas";
import { getDashboardPath } from "@/lib/auth/session";
import type { UserRole } from "@/types/database";

type PortalRole = "candidate" | "employer";

function parsePortalRole(value: FormDataEntryValue | null): PortalRole | null {
  return value === "candidate" || value === "employer" ? value : null;
}

function signUpRedirectPath(
  portalRole: PortalRole | null,
  error: string,
  extra?: Record<string, string>
) {
  const params = new URLSearchParams();
  if (portalRole) params.set("role", portalRole);
  params.set("error", error);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      params.set(key, value);
    }
  }
  redirect(`/auth/sign-up?${params.toString()}`);
}

function classifySignUpError(message: string, code?: string, status?: number): string {
  const normalized = message.toLowerCase();
  const normalizedCode = (code ?? "").toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already") ||
    normalizedCode === "user_already_exists"
  ) {
    return "email-exists";
  }

  if (
    normalized.includes("password") ||
    normalized.includes("weak") ||
    normalizedCode === "weak_password"
  ) {
    return "weak-password";
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "signup-disabled";
  }

  if (
    status === 500 ||
    normalized.includes("database error") ||
    normalized.includes("unexpected_failure") ||
    normalizedCode === "unexpected_failure"
  ) {
    return "database-setup";
  }

  return "signup-failed";
}

function signInRedirectPath(
  portalRole: PortalRole | null,
  error: string,
  extra?: Record<string, string>
) {
  const params = new URLSearchParams();
  if (portalRole) params.set("role", portalRole);
  params.set("error", error);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      params.set(key, value);
    }
  }
  redirect(`/auth/sign-in?${params.toString()}`);
}

async function provisionNewUser(
  authUserId: string,
  email: string,
  name: string,
  role: PortalRole
) {
  try {
    const service = await createServiceClient();
    const { error: userError } = await service
      .from("users")
      .update({ role, name })
      .eq("auth_user_id", authUserId);

    if (userError) throw userError;

    const { data: dbUser } = await service
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (!dbUser) throw new Error("User record not found after signup");

    if (role === "candidate") {
      const { data: existing } = await service
        .from("candidate_profiles")
        .select("id")
        .eq("user_id", dbUser.id)
        .maybeSingle();

      if (!existing) {
        const { error } = await service.from("candidate_profiles").insert({
          user_id: dbUser.id,
          email,
          full_name: name,
        });
        if (error) throw error;
      }
    } else {
      const { data: existing } = await service
        .from("employer_profiles")
        .select("id")
        .eq("user_id", dbUser.id)
        .maybeSingle();

      if (!existing) {
        const { error } = await service.from("employer_profiles").insert({
          user_id: dbUser.id,
        });
        if (error) throw error;
      }
    }
  } catch {
    const supabase = await createClient();
    const { error: userError } = await supabase
      .from("users")
      .update({ name })
      .eq("auth_user_id", authUserId);

    if (userError) {
      throw new Error("Account created but setup failed. Try signing in or contact support.");
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("auth_user_id", authUserId)
      .single();

    if (!dbUser || dbUser.role !== role) {
      throw new Error("Account created but setup failed. Try signing in or contact support.");
    }

    if (role === "employer") {
      const { data: existing } = await supabase
        .from("employer_profiles")
        .select("id")
        .eq("user_id", dbUser.id)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("employer_profiles").insert({
          user_id: dbUser.id,
        });
        if (error) {
          throw new Error("Account created but setup failed. Try signing in or contact support.");
        }
      }
    }
  }
}

export async function signUp(formData: FormData): Promise<void> {
  const portalRole = parsePortalRole(formData.get("portalRole"));
  const submittedRole = parsePortalRole(formData.get("role"));

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: submittedRole ?? "candidate",
  });

  if (!parsed.success) {
    signUpRedirectPath(portalRole, "invalid");
  }

  const { email, password, name, role } = parsed.data;

  if (portalRole && role !== portalRole) {
    signUpRedirectPath(portalRole, "invalid");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  if (error) {
    signUpRedirectPath(
      portalRole ?? role,
      classifySignUpError(error.message, error.code, error.status)
    );
  }

  if (!data.user || data.user.identities?.length === 0) {
    signUpRedirectPath(portalRole ?? role, "email-exists");
  }

  try {
    await provisionNewUser(data.user.id, email, name, role);
  } catch {
    signUpRedirectPath(portalRole ?? role, "setup-failed");
  }

  if (!data.session) {
    signInRedirectPath(role, "confirm-email");
  }

  if (role === "candidate") {
    redirect("/candidate/profile?welcome=1");
  }

  redirect(getDashboardPath(role));
}

export async function signIn(formData: FormData): Promise<void> {
  const expectedRole = parsePortalRole(formData.get("role"));

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    signInRedirectPath(expectedRole, "invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("email not confirmed")) {
      signInRedirectPath(expectedRole, "confirm-email");
    }
    signInRedirectPath(expectedRole, "invalid");
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", authUser?.id ?? "")
    .single();

  const actualRole = dbUser?.role as UserRole | undefined;

  if (actualRole === "admin") {
    await supabase.auth.signOut();
    redirect("/auth/admin/sign-in?error=use-admin-portal");
  }

  if (expectedRole && actualRole !== expectedRole) {
    const accountRole =
      actualRole === "candidate" || actualRole === "employer" ? actualRole : null;
    signInRedirectPath(
      expectedRole,
      "wrong-role",
      accountRole ? { account: accountRole } : undefined
    );
  }

  redirect(getDashboardPath(actualRole ?? "candidate"));
}

export async function signInAsAdmin(formData: FormData): Promise<void> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/auth/admin/sign-in?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect("/auth/admin/sign-in?error=invalid");
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", authUser?.id ?? "")
    .single();

  if (dbUser?.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/auth/admin/sign-in?error=not-admin");
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutToPortalSignIn(formData: FormData): Promise<void> {
  const portalRole = parsePortalRole(formData.get("role"));
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(portalRole ? `/auth/sign-in?role=${portalRole}` : "/auth/sign-in");
}

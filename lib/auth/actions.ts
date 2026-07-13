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

function signUpRedirectPath(portalRole: PortalRole | null, error: string) {
  const base = portalRole ? `/auth/sign-up?role=${portalRole}` : "/auth/sign-up";
  const separator = base.includes("?") ? "&" : "?";
  redirect(`${base}${separator}error=${error}`);
}

function signInRedirectPath(portalRole: PortalRole | null, error: string) {
  const base = portalRole ? `/auth/sign-in?role=${portalRole}` : "/auth/sign-in";
  const separator = base.includes("?") ? "&" : "?";
  redirect(`${base}${separator}error=${error}`);
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
      .update({ role, name })
      .eq("auth_user_id", authUserId);

    if (userError) {
      throw new Error("Account created but setup failed. Try signing in or contact support.");
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
    signUpRedirectPath(portalRole ?? role, "signup-failed");
  }

  if (!data.user) {
    signUpRedirectPath(portalRole ?? role, "signup-failed");
  }

  await provisionNewUser(data.user.id, email, name, role);

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
    await supabase.auth.signOut();
    signInRedirectPath(expectedRole, "wrong-role");
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

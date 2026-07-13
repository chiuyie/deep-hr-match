"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validations/schemas";
import { getDashboardPath } from "@/lib/auth/session";

export async function signUp(formData: FormData): Promise<void> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const supabase = await createClient();
  const { email, password, name, role } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  if (error) throw new Error(error.message);

  if (data.user) {
    await supabase
      .from("users")
      .update({ role, name })
      .eq("auth_user_id", data.user.id);

    if (role === "candidate") {
      await supabase.from("candidate_profiles").insert({
        user_id: (
          await supabase
            .from("users")
            .select("id")
            .eq("auth_user_id", data.user.id)
            .single()
        ).data?.id,
        email,
        full_name: name,
      });
    } else {
      await supabase.from("employer_profiles").insert({
        user_id: (
          await supabase
            .from("users")
            .select("id")
            .eq("auth_user_id", data.user.id)
            .single()
        ).data?.id,
      });
    }
  }

  if (role === "candidate") {
    redirect("/candidate/profile?welcome=1");
  }

  redirect(getDashboardPath(role));
}

export async function signIn(formData: FormData): Promise<void> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) throw new Error(error.message);

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq(
      "auth_user_id",
      (await supabase.auth.getUser()).data.user?.id ?? ""
    )
    .single();

  redirect(getDashboardPath(user?.role ?? "candidate"));
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

export async function updateUserRole(role: "candidate" | "employer") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!dbUser || dbUser.role === "admin") {
    return { error: "Cannot change role" };
  }

  await supabase.from("users").update({ role }).eq("id", dbUser.id);

  if (role === "candidate") {
    const { data: existing } = await supabase
      .from("candidate_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .maybeSingle();
    if (!existing) {
      await supabase.from("candidate_profiles").insert({
        user_id: dbUser.id,
        email: user.email,
      });
    }
  } else {
    const { data: existing } = await supabase
      .from("employer_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .maybeSingle();
    if (!existing) {
      await supabase.from("employer_profiles").insert({ user_id: dbUser.id });
    }
  }

  redirect(getDashboardPath(role));
}

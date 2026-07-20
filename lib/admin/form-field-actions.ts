"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { slugifyFieldKey } from "@/lib/form-fields/defaults";
import { createClient } from "@/lib/supabase/server";
import { formFieldSchema } from "@/lib/validations/schemas";
import type { EmployerDisclosureMode } from "@/lib/form-fields/types";

const FORM_FIELD_PATHS = [
  "/admin/forms",
  "/candidate/profile",
  "/employer/company",
  "/employer/jobs/new",
] as const;

function revalidateFormFieldPages() {
  for (const path of FORM_FIELD_PATHS) {
    revalidatePath(path, "layout");
  }
}

export async function saveFormField(formData: FormData, id?: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const raw = Object.fromEntries(formData);

  const parsed = formFieldSchema.safeParse({
    ...raw,
    is_required: raw.is_required === "on" || raw.is_required === "true",
    is_active: raw.is_active === "on" || raw.is_active === "true" || raw.is_active === undefined,
    is_custom: raw.is_custom === "on" || raw.is_custom === "true",
    employer_disclosure_mode:
      raw.employer_disclosure_mode ?? "candidate_optional",
    sort_order: raw.sort_order ?? 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid field data" };
  }

  if (id) {
    const { error } = await supabase.from("form_fields").update(parsed.data).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("form_fields").insert(parsed.data);
    if (error) return { error: error.message };
  }

  revalidateFormFieldPages();
  return { success: true };
}

export async function deleteFormField(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("form_fields").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateFormFieldPages();
  return { success: true };
}

export async function toggleFormFieldActive(id: string, is_active: boolean) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("form_fields").update({ is_active }).eq("id", id);
  if (error) return { error: error.message };
  revalidateFormFieldPages();
  return { success: true };
}

export async function updateEmployerDisclosureMode(
  id: string,
  employer_disclosure_mode: EmployerDisclosureMode
) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("form_fields")
    .update({ employer_disclosure_mode })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateFormFieldPages();
  return { success: true };
}

export async function createFormField(input: {
  audience: "candidate" | "employer";
  form_group: "profile" | "job";
  section: string;
  label: string;
  field_type?: string;
  is_required?: boolean;
}) {
  await requireRole("admin");
  const supabase = await createClient();

  const label = input.label.trim();
  if (!label) return { error: "Field label is required" };

  const field_key = slugifyFieldKey(label);
  if (!field_key) return { error: "Could not generate a field key from that label" };

  const { data: existing } = await supabase
    .from("form_fields")
    .select("sort_order")
    .eq("audience", input.audience)
    .eq("form_group", input.form_group)
    .eq("section", input.section);

  const nextSort =
    (existing ?? []).reduce((max, row) => Math.max(max, row.sort_order ?? 0), 0) + 1;

  const { error } = await supabase.from("form_fields").insert({
    audience: input.audience,
    form_group: input.form_group,
    section: input.section,
    field_key,
    label,
    field_type: input.field_type ?? "text",
    is_required: input.is_required ?? false,
    is_active: true,
    is_custom: true,
    employer_disclosure_mode: "candidate_optional",
    sort_order: nextSort,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A field with that key already exists in this section" };
    }
    return { error: error.message };
  }

  revalidateFormFieldPages();
  return { success: true };
}

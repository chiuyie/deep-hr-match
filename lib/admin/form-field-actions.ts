"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { slugifyFieldKey } from "@/lib/form-fields/defaults";
import { parseOptionsFromFormValue, normalizeSelectOptions } from "@/lib/form-fields/select-options";
import { createClient } from "@/lib/supabase/server";
import { formFieldSchema } from "@/lib/validations/schemas";
import type { EmployerDisclosureMode, FormFieldType } from "@/lib/form-fields/types";
import {
  defaultFallbackSection,
  isProtectedJobSectionTitle,
  normalizeSectionTitle,
} from "@/lib/form-fields/section-defaults";

const FORM_FIELD_PATHS = [
  "/admin/forms",
  "/candidate/profile",
  "/employer/company",
  "/employer/jobs/new",
  "/employer/jobs",
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
  const options = parseOptionsFromFormValue(formData.get("options"));

  const parsed = formFieldSchema.safeParse({
    ...raw,
    options:
      raw.field_type === "select" || String(raw.field_type ?? "") === "select"
        ? options
        : null,
    is_required: raw.is_required === "on" || raw.is_required === "true",
    is_active: raw.is_active === "on" || raw.is_active === "true" || raw.is_active === undefined,
    is_custom: raw.is_custom === "on" || raw.is_custom === "true",
    employer_disclosure_mode:
      raw.employer_disclosure_mode ?? "candidate_optional",
    show_on_anonymous_match:
      raw.show_on_anonymous_match === "on" || raw.show_on_anonymous_match === "true",
    sort_order: raw.sort_order ?? 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid field data" };
  }

  if (parsed.data.field_type === "select" && (!parsed.data.options || parsed.data.options.length === 0)) {
    return { error: "Add at least one dropdown option for select fields." };
  }

  const payload = {
    ...parsed.data,
    options: parsed.data.field_type === "select" ? parsed.data.options ?? null : null,
  };

  if (id) {
    const { error } = await supabase.from("form_fields").update(payload).eq("id", id);
    if (error) {
      if (error.message.toLowerCase().includes("options")) {
        return {
          error:
            "Could not save dropdown options. Apply migration 015_form_field_options.sql, then try again.",
        };
      }
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("form_fields").insert(payload);
    if (error) {
      if (error.message.toLowerCase().includes("options")) {
        return {
          error:
            "Could not save dropdown options. Apply migration 015_form_field_options.sql, then try again.",
        };
      }
      return { error: error.message };
    }
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
  const { data, error } = await supabase
    .from("form_fields")
    .update({ employer_disclosure_mode })
    .eq("id", id)
    .select("id");
  if (error) {
    if (error.message.toLowerCase().includes("employer_disclosure_mode")) {
      return {
        error:
          "Could not save after-unlock disclosure. Apply migration 008_form_field_disclosure.sql, then try again.",
      };
    }
    return { error: error.message };
  }
  if (!data?.length) return { error: "Field not found." };
  revalidateFormFieldPages();
  return { success: true };
}

export async function updateShowOnAnonymousMatch(id: string, show_on_anonymous_match: boolean) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("form_fields")
    .update({ show_on_anonymous_match })
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
  options?: string[] | null;
  is_required?: boolean;
}) {
  await requireRole("admin");
  const supabase = await createClient();

  const label = input.label.trim();
  if (!label) return { error: "Field label is required" };

  const field_key = slugifyFieldKey(label);
  if (!field_key) return { error: "Could not generate a field key from that label" };

  const allowedTypes = new Set([
    "text",
    "email",
    "number",
    "textarea",
    "tel",
    "url",
    "select",
    "checkbox",
    "file",
  ]);
  const field_type = (
    input.field_type && allowedTypes.has(input.field_type) ? input.field_type : "text"
  ) as FormFieldType;
  const options =
    field_type === "select" ? normalizeSelectOptions(input.options ?? null) : null;

  if (field_type === "select" && (!options || options.length === 0)) {
    return { error: "Add at least one dropdown option for select fields." };
  }

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
    field_type,
    options,
    is_required: input.is_required ?? false,
    is_active: true,
    is_custom: true,
    employer_disclosure_mode: "candidate_optional",
    show_on_anonymous_match: false,
    sort_order: nextSort,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A field with that key already exists for this audience and form" };
    }
    if (error.message.toLowerCase().includes("options")) {
      return {
        error:
          "Could not save dropdown options. Apply migration 015_form_field_options.sql, then try again.",
      };
    }
    return { error: error.message };
  }

  revalidateFormFieldPages();
  return { success: true };
}

export async function reorderFormFields(
  updates: Array<{ id: string; section: string; sort_order: number }>
) {
  await requireRole("admin");
  if (!updates.length) return { success: true };

  const supabase = await createClient();
  for (const update of updates) {
    if (!update.id || !update.section.trim()) {
      return { error: "Invalid field reorder payload" };
    }
    const { error } = await supabase
      .from("form_fields")
      .update({
        section: update.section.trim(),
        sort_order: update.sort_order,
      })
      .eq("id", update.id);
    if (error) return { error: error.message };
  }

  revalidateFormFieldPages();
  return { success: true };
}

function sectionTableMissing(message: string) {
  return message.toLowerCase().includes("form_sections");
}

export async function createFormSection(input: {
  audience: "candidate" | "employer";
  form_group: "profile" | "job";
  title: string;
}) {
  await requireRole("admin");
  const title = normalizeSectionTitle(input.title);
  if (!title) return { error: "Section name is required." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("form_sections")
    .select("sort_order")
    .eq("audience", input.audience)
    .eq("form_group", input.form_group);

  const nextSort =
    (existing ?? []).reduce((max, row) => Math.max(max, row.sort_order ?? 0), 0) + 1;

  const { error } = await supabase.from("form_sections").insert({
    audience: input.audience,
    form_group: input.form_group,
    title,
    sort_order: nextSort,
  });

  if (error) {
    if (sectionTableMissing(error.message)) {
      return {
        error: "Could not create section. Apply migration 016_form_sections.sql, then try again.",
      };
    }
    if (error.code === "23505") {
      return { error: "A section with that name already exists." };
    }
    return { error: error.message };
  }

  revalidateFormFieldPages();
  return { success: true };
}

export async function renameFormSection(input: {
  audience: "candidate" | "employer";
  form_group: "profile" | "job";
  from: string;
  to: string;
}) {
  await requireRole("admin");
  const from = normalizeSectionTitle(input.from);
  const to = normalizeSectionTitle(input.to);
  if (!from || !to) return { error: "Section name is required." };
  if (from === to) return { success: true };

  const supabase = await createClient();

  const { data: clash } = await supabase
    .from("form_sections")
    .select("id")
    .eq("audience", input.audience)
    .eq("form_group", input.form_group)
    .eq("title", to)
    .maybeSingle();

  if (clash) return { error: "A section with that name already exists." };

  const { data: updatedRows, error: sectionError } = await supabase
    .from("form_sections")
    .update({ title: to })
    .eq("audience", input.audience)
    .eq("form_group", input.form_group)
    .eq("title", from)
    .select("id");

  if (sectionError) {
    if (sectionTableMissing(sectionError.message)) {
      return {
        error: "Could not rename section. Apply migration 016_form_sections.sql, then try again.",
      };
    }
    return { error: sectionError.message };
  }

  if (!updatedRows?.length) {
    const { data: existing } = await supabase
      .from("form_sections")
      .select("sort_order")
      .eq("audience", input.audience)
      .eq("form_group", input.form_group);
    const nextSort =
      (existing ?? []).reduce((max, row) => Math.max(max, row.sort_order ?? 0), 0) + 1;
    const { error: insertError } = await supabase.from("form_sections").insert({
      audience: input.audience,
      form_group: input.form_group,
      title: to,
      sort_order: nextSort,
    });
    if (insertError && insertError.code !== "23505") {
      return { error: insertError.message };
    }
  }

  const { error: fieldsError } = await supabase
    .from("form_fields")
    .update({ section: to })
    .eq("audience", input.audience)
    .eq("form_group", input.form_group)
    .eq("section", from);

  if (fieldsError) return { error: fieldsError.message };

  revalidateFormFieldPages();
  return { success: true };
}

export async function deleteFormSection(input: {
  audience: "candidate" | "employer";
  form_group: "profile" | "job";
  title: string;
  moveTo?: string;
}) {
  await requireRole("admin");
  const title = normalizeSectionTitle(input.title);
  if (!title) return { error: "Section name is required." };

  const supabase = await createClient();

  if (input.form_group === "job") {
    const { data: builtIns } = await supabase
      .from("form_fields")
      .select("id")
      .eq("audience", input.audience)
      .eq("form_group", input.form_group)
      .eq("section", title)
      .eq("is_custom", false)
      .limit(1);
    if (builtIns && builtIns.length > 0) {
      return {
        error:
          "Built-in job form sections can’t be deleted while they still contain system fields. Move or hide those fields first.",
      };
    }
  }

  // Keep legacy title check as an extra guard when the section was never renamed.
  if (input.form_group === "job" && isProtectedJobSectionTitle(title)) {
    return {
      error:
        "Built-in job form sections can’t be deleted. Rename them or move custom fields out first.",
    };
  }

  const fallback =
    normalizeSectionTitle(input.moveTo ?? "") ||
    defaultFallbackSection(input.audience, input.form_group);

  if (fallback === title) {
    return { error: "Choose a different section to move fields into before deleting." };
  }

  const { count } = await supabase
    .from("form_fields")
    .select("id", { count: "exact", head: true })
    .eq("audience", input.audience)
    .eq("form_group", input.form_group)
    .eq("section", title);

  if ((count ?? 0) > 0) {
    const { data: dest } = await supabase
      .from("form_sections")
      .select("id")
      .eq("audience", input.audience)
      .eq("form_group", input.form_group)
      .eq("title", fallback)
      .maybeSingle();

    if (!dest) {
      const { data: existing } = await supabase
        .from("form_sections")
        .select("sort_order")
        .eq("audience", input.audience)
        .eq("form_group", input.form_group);
      const nextSort =
        (existing ?? []).reduce((max, row) => Math.max(max, row.sort_order ?? 0), 0) + 1;
      const { error: insertDestError } = await supabase.from("form_sections").insert({
        audience: input.audience,
        form_group: input.form_group,
        title: fallback,
        sort_order: nextSort,
      });
      if (insertDestError && insertDestError.code !== "23505") {
        if (sectionTableMissing(insertDestError.message)) {
          return {
            error:
              "Could not delete section. Apply migration 016_form_sections.sql, then try again.",
          };
        }
        return { error: insertDestError.message };
      }
    }

    const { error: moveError } = await supabase
      .from("form_fields")
      .update({ section: fallback })
      .eq("audience", input.audience)
      .eq("form_group", input.form_group)
      .eq("section", title);

    if (moveError) return { error: moveError.message };
  }

  const { error } = await supabase
    .from("form_sections")
    .delete()
    .eq("audience", input.audience)
    .eq("form_group", input.form_group)
    .eq("title", title);

  if (error) {
    if (sectionTableMissing(error.message)) {
      return {
        error: "Could not delete section. Apply migration 016_form_sections.sql, then try again.",
      };
    }
    return { error: error.message };
  }

  revalidateFormFieldPages();
  return { success: true };
}

export async function reorderFormSections(input: {
  audience: "candidate" | "employer";
  form_group: "profile" | "job";
  titles: string[];
}) {
  await requireRole("admin");
  const titles = input.titles.map(normalizeSectionTitle).filter(Boolean);
  if (!titles.length) return { error: "No sections to reorder." };
  if (new Set(titles).size !== titles.length) {
    return { error: "Duplicate section titles in reorder payload." };
  }

  const supabase = await createClient();
  for (let index = 0; index < titles.length; index += 1) {
    const title = titles[index]!;
    const { error } = await supabase
      .from("form_sections")
      .update({ sort_order: index + 1 })
      .eq("audience", input.audience)
      .eq("form_group", input.form_group)
      .eq("title", title);
    if (error) {
      if (sectionTableMissing(error.message)) {
        return {
          error:
            "Could not reorder sections. Apply migration 016_form_sections.sql, then try again.",
        };
      }
      return { error: error.message };
    }
  }

  revalidateFormFieldPages();
  return { success: true };
}

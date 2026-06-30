"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import {
  matrixCategorySchema,
  matrixQuestionSchema,
  matrixOptionSchema,
} from "@/lib/validations/schemas";

export async function saveMatrixCategory(formData: FormData, id?: string): Promise<void> {
  await requireRole("admin");
  const supabase = await createClient();

  const parsed = matrixCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  if (id) {
    await supabase.from("matrix_categories").update(parsed.data).eq("id", id);
  } else {
    await supabase.from("matrix_categories").insert(parsed.data);
  }

  revalidatePath("/admin/matrix");
}

export async function deleteMatrixCategory(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  await supabase.from("matrix_categories").delete().eq("id", id);
  revalidatePath("/admin/matrix");
  return { success: true };
}

export async function saveMatrixQuestion(formData: FormData, id?: string): Promise<void> {
  await requireRole("admin");
  const supabase = await createClient();

  const raw = Object.fromEntries(formData);
  const parsed = matrixQuestionSchema.safeParse({
    ...raw,
    is_required: raw.is_required === "on" || raw.is_required === "true",
    is_active: raw.is_active === "on" || raw.is_active === "true" || raw.is_active === undefined,
  });

  if (!parsed.success) return;

  if (id) {
    await supabase.from("matrix_questions").update(parsed.data).eq("id", id);
  } else {
    await supabase.from("matrix_questions").insert(parsed.data);
  }

  revalidatePath("/admin/matrix");
}

export async function saveMatrixOption(formData: FormData, id?: string): Promise<void> {
  await requireRole("admin");
  const supabase = await createClient();

  const raw = Object.fromEntries(formData);
  const parsed = matrixOptionSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "on" || raw.is_active === "true" || raw.is_active === undefined,
  });

  if (!parsed.success) return;

  if (id) {
    await supabase.from("matrix_options").update(parsed.data).eq("id", id);
  } else {
    await supabase.from("matrix_options").insert(parsed.data);
  }

  revalidatePath("/admin/matrix");
}

export async function toggleMatrixItem(
  table: "matrix_categories" | "matrix_questions" | "matrix_options",
  id: string,
  is_active: boolean
) {
  await requireRole("admin");
  const supabase = await createClient();
  await supabase.from(table).update({ is_active }).eq("id", id);
  revalidatePath("/admin/matrix");
  return { success: true };
}

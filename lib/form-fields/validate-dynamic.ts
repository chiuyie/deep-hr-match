import { z } from "zod";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import type { JobFormState } from "@/lib/utils/job-form";
import { isJobFormValueFilled } from "@/lib/utils/job-form-progress";

function baseStringField(field: FormFieldDefinition): z.ZodTypeAny {
  switch (field.field_type) {
    case "email":
      return field.is_required
        ? z.string().min(1).email()
        : z.string().email().optional().or(z.literal(""));
    case "url":
      return field.is_required
        ? z.string().url()
        : z.string().url().optional().or(z.literal(""));
    case "tel":
    case "textarea":
    case "text":
    case "select":
    case "checkbox":
    case "file":
    default:
      return field.is_required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();
  }
}

function baseNumberField(field: FormFieldDefinition): z.ZodTypeAny {
  return field.is_required
    ? z.coerce.number().min(0, `${field.label} is required`)
    : z.coerce.number().min(0).optional();
}

export function buildDynamicProfileSchema(fields: FormFieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (!field.is_active || field.is_custom) continue;
    shape[field.field_key] =
      field.field_type === "number" ? baseNumberField(field) : baseStringField(field);
  }

  return z.object(shape);
}

export function validateRequiredCustomFields(
  fields: FormFieldDefinition[],
  custom: Record<string, string>
): { ok: true } | { ok: false; message: string } {
  for (const field of fields) {
    if (!field.is_active || !field.is_custom || !field.is_required) continue;
    const value = custom[field.field_key];
    if (!value?.trim()) {
      return { ok: false, message: `${field.label} is required` };
    }
  }
  return { ok: true };
}

export function validateJobStateAgainstFormFields(
  values: JobFormState,
  fields: FormFieldDefinition[],
  custom: Record<string, string>
): { ok: true } | { ok: false; message: string; focusField?: string } {
  for (const field of fields) {
    if (!field.is_active || !field.is_custom || !field.is_required) continue;
    const value = custom[field.field_key] ?? values[field.field_key];
    if (!isJobFormValueFilled(value)) {
      return {
        ok: false,
        message: `${field.label} is required`,
        focusField: `custom_${field.field_key}`,
      };
    }
  }

  for (const field of fields) {
    if (!field.is_active || field.is_custom || !field.is_required) continue;
    if (field.field_key.startsWith("faq_")) continue;

    const value = values[field.field_key];
    if (!isJobFormValueFilled(value)) {
      return {
        ok: false,
        message: `${field.label} is required`,
        focusField: field.field_key,
      };
    }
  }

  return { ok: true };
}

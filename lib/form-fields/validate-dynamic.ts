import { z } from "zod";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import type { JobFormState } from "@/lib/utils/job-form";
import { isJobFormValueFilled } from "@/lib/utils/job-form-progress";
import {
  normalizePhoneToE164,
  parseSalaryValue,
} from "@/lib/constants/candidate-profile-options";
import {
  validateCandidateField,
  type ValidateFieldContext,
} from "@/lib/form-fields/candidate-field-validation";
import { validateYearsOfExperienceValue } from "@/lib/form-fields/years-of-experience";

export type DynamicProfileSchemaOptions = {
  /** When false (draft saves), empty required fields are allowed; filled values are still validated. */
  enforceRequired?: boolean;
  /**
   * When false (draft wizard saves), drop unknown list entries (e.g. legacy free-text
   * languages) instead of failing the whole save — so Next on page 1 is not blocked
   * by stale data on a later page.
   */
  softLists?: boolean;
};

function candidateFieldSchema(
  field: FormFieldDefinition,
  options: DynamicProfileSchemaOptions = {}
): z.ZodTypeAny {
  const enforceRequired = options.enforceRequired !== false;
  const softLists = options.softLists === true || options.enforceRequired === false;
  const required = enforceRequired && field.is_required;
  const key = field.field_key;

  if (key === "years_of_experience") {
    return z
      .union([z.string(), z.number(), z.undefined(), z.null()])
      .transform((value, ctx) => {
        const result = validateYearsOfExperienceValue(value ?? "", {
          required,
          label: field.label,
        });
        if (result.ok === false) {
          ctx.addIssue({ code: "custom", message: result.message });
          return z.NEVER;
        }
        return result.value;
      });
  }

  return z.string().optional().superRefine((value, ctx) => {
    const result = validateCandidateField({ ...field, is_required: required }, value ?? "", {
      softLists,
    });
    if (result.ok === true) return;
    if (!required && !(value ?? "").trim()) return;
    ctx.addIssue({
      code: "custom",
      message: result.message,
    });
  });
}

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

export function buildDynamicProfileSchema(
  fields: FormFieldDefinition[],
  options: DynamicProfileSchemaOptions = {}
) {
  const enforceRequired = options.enforceRequired !== false;
  const shape: Record<string, z.ZodTypeAny> = {};
  const isCandidate = fields.some((f) => f.audience === "candidate");
  const activeFields = fields.filter((f) => f.is_active && !f.is_custom);

  for (const field of activeFields) {
    shape[field.field_key] = isCandidate
      ? candidateFieldSchema(field, options)
      : field.field_type === "number"
        ? baseNumberField(field)
        : baseStringField(field);
  }

  const objectSchema = z.object(shape);

  if (isCandidate) {
    return objectSchema.superRefine((data, ctx) => {
      const values = data as Record<string, unknown>;
      const softLists = options.softLists === true || options.enforceRequired === false;
      const context: ValidateFieldContext = { values, softLists };

      for (const field of activeFields) {
        if (field.field_key === "years_of_experience") continue;
        const required = enforceRequired && field.is_required;
        const raw = values[field.field_key];
        const result = validateCandidateField(
          { ...field, is_required: required },
          raw,
          context
        );
        if (result.ok === false && (field.field_key === "city" || field.field_key === "country")) {
          const already = ctx.issues.some((i) => i.path[0] === field.field_key);
          if (!already) {
            ctx.addIssue({
              code: "custom",
              message: result.message,
              path: [field.field_key],
            });
          }
        }
      }
    });
  }

  return objectSchema;
}

export function validateRequiredCustomFields(
  fields: FormFieldDefinition[],
  custom: Record<string, string>,
  options: DynamicProfileSchemaOptions = {}
): { ok: true } | { ok: false; message: string } {
  const enforceRequired = options.enforceRequired !== false;
  for (const field of fields) {
    if (!field.is_active || !field.is_custom) continue;
    const required = enforceRequired && field.is_required;
    if (!required && !(custom[field.field_key] ?? "").trim()) continue;
    const value = custom[field.field_key];
    const result = validateCandidateField({ ...field, is_required: required }, value ?? "");
    if (result.ok === false) return { ok: false, message: result.message };
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

/** Normalize profile values with the same rules used for validation. */
export function normalizeCandidateProfilePayload(
  data: Record<string, unknown>,
  fields: FormFieldDefinition[] = []
): Record<string, unknown> {
  const next = { ...data };
  const context: ValidateFieldContext = { values: next };

  if (fields.length > 0) {
    for (const field of fields) {
      if (!field.is_active || field.is_custom) continue;
      if (!(field.field_key in next)) continue;
      const result = validateCandidateField(field, next[field.field_key], context);
      if (result.ok) {
        if (field.field_key === "years_of_experience") {
          const years = validateYearsOfExperienceValue(next[field.field_key], {
            required: field.is_required,
            label: field.label,
          });
          if (years.ok === true) {
            if (years.value === null) delete next.years_of_experience;
            else next.years_of_experience = years.value;
          }
        } else {
          next[field.field_key] = result.value;
        }
      }
    }
    return next;
  }

  // Legacy path when field defs are unavailable
  for (const key of ["current_salary", "expected_salary"] as const) {
    const raw = next[key];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const parsed = parseSalaryValue(raw);
    next[key] = parsed.amount ? `${parsed.currency} ${parsed.amount}` : "";
  }

  if (typeof next.years_of_experience === "string" || typeof next.years_of_experience === "number") {
    const years = validateYearsOfExperienceValue(next.years_of_experience, { required: false });
    if (years.ok === true) {
      if (years.value === null) delete next.years_of_experience;
      else next.years_of_experience = years.value;
    }
  }

  if (typeof next.phone === "string") {
    const normalized = normalizePhoneToE164(next.phone);
    next.phone = normalized ?? next.phone.trim();
  }

  return next;
}

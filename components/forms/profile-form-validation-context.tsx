"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import {
  validateCandidateField,
  validateCandidateSection,
} from "@/lib/form-fields/candidate-field-validation";

type ProfileFormValidationContextValue = {
  values: Record<string, string>;
  errors: Record<string, string>;
  /** Keys the user has edited, or that failed a Next-step check. */
  revealedErrors: Set<string>;
  forceShowErrors: boolean;
  setForceShowErrors: (next: boolean) => void;
  setFieldValue: (fieldKey: string, value: string, options?: { reveal?: boolean }) => void;
  getError: (fieldKey: string) => string | undefined;
  validateSection: (fields: FormFieldDefinition[]) => {
    ok: boolean;
    errors: Record<string, string>;
    firstInvalidKey?: string;
  };
  isSectionValid: (fields: FormFieldDefinition[]) => boolean;
};

const ProfileFormValidationContext = createContext<ProfileFormValidationContextValue | null>(
  null
);

function toStringMap(values: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) {
      out[key] = "";
      continue;
    }
    if (Array.isArray(value)) {
      out[key] = JSON.stringify(value);
      continue;
    }
    out[key] = String(value);
  }
  return out;
}

export function ProfileFormValidationProvider({
  fields,
  initialValues,
  children,
}: {
  fields: FormFieldDefinition[];
  initialValues: Record<string, unknown>;
  children: ReactNode;
}) {
  const fieldByKey = useMemo(() => {
    const map = new Map<string, FormFieldDefinition>();
    for (const field of fields) map.set(field.field_key, field);
    return map;
  }, [fields]);

  const [values, setValues] = useState<Record<string, string>>(() =>
    toStringMap(initialValues)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [revealedErrors, setRevealedErrors] = useState<Set<string>>(() => new Set());
  const [forceShowErrors, setForceShowErrors] = useState(false);

  const recomputeFieldError = useCallback(
    (fieldKey: string, nextValues: Record<string, string>, reveal: boolean) => {
      const field = fieldByKey.get(fieldKey);
      if (!field) return;

      const result = validateCandidateField(field, nextValues[fieldKey] ?? "", {
        values: nextValues,
      });

      setErrors((prev) => {
        const next = { ...prev };
        if (result.ok === true) delete next[fieldKey];
        else next[fieldKey] = result.message;
        return next;
      });

      if (reveal) {
        setRevealedErrors((prev) => {
          if (prev.has(fieldKey)) return prev;
          const next = new Set(prev);
          next.add(fieldKey);
          return next;
        });
      } else if (result.ok === true) {
        setRevealedErrors((prev) => {
          if (!prev.has(fieldKey)) return prev;
          const next = new Set(prev);
          next.delete(fieldKey);
          return next;
        });
      }
    },
    [fieldByKey]
  );

  const setFieldValue = useCallback(
    (fieldKey: string, value: string, options?: { reveal?: boolean }) => {
      setValues((prev) => {
        const nextValues = { ...prev, [fieldKey]: value };
        const reveal =
          options?.reveal === false
            ? false
            : options?.reveal === true ||
              forceShowErrors ||
              value.trim().length > 0 ||
              Boolean(prev[fieldKey]?.trim());
        // Defer error update so it runs after state commit with fresh values.
        queueMicrotask(() => recomputeFieldError(fieldKey, nextValues, reveal));
        return nextValues;
      });
    },
    [forceShowErrors, recomputeFieldError]
  );

  const getError = useCallback(
    (fieldKey: string) => {
      if (!errors[fieldKey]) return undefined;
      if (forceShowErrors || revealedErrors.has(fieldKey)) return errors[fieldKey];
      return undefined;
    },
    [errors, forceShowErrors, revealedErrors]
  );

  const validateSection = useCallback(
    (sectionFields: FormFieldDefinition[]) => {
      const result = validateCandidateSection(sectionFields, values);
      setForceShowErrors(true);
      setErrors((prev) => {
        const next = { ...prev };
        for (const field of sectionFields) {
          if (result.errors[field.field_key]) {
            next[field.field_key] = result.errors[field.field_key]!;
          } else {
            delete next[field.field_key];
          }
        }
        return next;
      });
      setRevealedErrors((prev) => {
        const next = new Set(prev);
        for (const key of Object.keys(result.errors)) next.add(key);
        return next;
      });
      return result;
    },
    [values]
  );

  const isSectionValid = useCallback(
    (sectionFields: FormFieldDefinition[]) =>
      validateCandidateSection(sectionFields, values).ok,
    [values]
  );

  const value = useMemo(
    () => ({
      values,
      errors,
      revealedErrors,
      forceShowErrors,
      setForceShowErrors,
      setFieldValue,
      getError,
      validateSection,
      isSectionValid,
    }),
    [
      values,
      errors,
      revealedErrors,
      forceShowErrors,
      setFieldValue,
      getError,
      validateSection,
      isSectionValid,
    ]
  );

  return (
    <ProfileFormValidationContext.Provider value={value}>
      {children}
    </ProfileFormValidationContext.Provider>
  );
}

export function useProfileFormValidation() {
  const ctx = useContext(ProfileFormValidationContext);
  if (!ctx) {
    throw new Error("useProfileFormValidation must be used within ProfileFormValidationProvider");
  }
  return ctx;
}

export function useProfileFormValidationOptional() {
  return useContext(ProfileFormValidationContext);
}

export function FieldInlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs leading-relaxed text-rose-600" role="alert">
      {message}
    </p>
  );
}

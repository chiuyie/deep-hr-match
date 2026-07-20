"use client";

import type { FormFieldDefinition } from "@/lib/form-fields/types";
import type { JobFormState } from "@/lib/utils/job-form";
import { JobTextField, JobTextareaField } from "./job-form-fields";

export function JobCustomFieldsBlock({
  fields,
  values,
  onChange,
}: {
  fields: FormFieldDefinition[];
  values: JobFormState;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
}) {
  if (fields.length === 0) return null;

  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">Additional fields</h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        {fields.map((field) => {
          const name = `custom_${field.field_key}`;
          const value = String(values[field.field_key] ?? "");
          if (field.field_type === "textarea") {
            return (
              <div key={field.id} className="md:col-span-2">
                <JobTextareaField
                  label={field.label}
                  name={name}
                  placeholder={field.placeholder ?? undefined}
                  value={value}
                  required={field.is_required}
                  onChange={onChange}
                />
              </div>
            );
          }
          return (
            <JobTextField
              key={field.id}
              label={field.label}
              name={name}
              placeholder={field.placeholder ?? undefined}
              value={value}
              required={field.is_required}
              onChange={onChange}
            />
          );
        })}
      </div>
    </div>
  );
}

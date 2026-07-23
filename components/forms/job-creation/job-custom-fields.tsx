"use client";

import type { FormFieldDefinition } from "@/lib/form-fields/types";
import { resolveSelectOptions } from "@/lib/form-fields/select-options";
import type { JobFormState } from "@/lib/utils/job-form";
import { JobSelectField, JobTextField, JobTextareaField } from "./job-form-fields";

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
          if (field.field_type === "select") {
            return (
              <JobSelectField
                key={field.id}
                label={field.label}
                name={name}
                placeholder={field.placeholder ?? "Select an option"}
                options={resolveSelectOptions(field)}
                value={value}
                required={field.is_required}
                onChange={onChange}
              />
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
              type={
                field.field_type === "date"
                  ? "date"
                  : field.field_type === "email"
                    ? "email"
                    : field.field_type === "tel"
                      ? "tel"
                      : field.field_type === "url"
                        ? "url"
                        : field.field_type === "number"
                          ? "number"
                          : "text"
              }
              onChange={onChange}
            />
          );
        })}
      </div>
    </div>
  );
}

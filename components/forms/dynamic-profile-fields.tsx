import { Textarea } from "@/components/ui/textarea";
import { employerInputClassName, employerLabelClassName } from "@/components/employer/employer-ui";
import {
  CandidateCountryCityPair,
  CandidateProfileField,
} from "@/components/forms/candidate-profile-field";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import { resolveSelectOptions } from "@/lib/form-fields/select-options";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ProfileValues = Record<string, unknown>;

export type ProfileFieldSection = {
  title: string;
  description?: string;
  fields: FormFieldDefinition[];
};

function getDefaultValue(field: FormFieldDefinition, values: ProfileValues): string {
  const raw = field.is_custom
    ? (values.custom_fields as Record<string, unknown> | undefined)?.[field.field_key]
    : values[field.field_key];

  if (Array.isArray(raw)) return JSON.stringify(raw);
  if (raw === null || raw === undefined) return "";
  return String(raw);
}

function renderEmployerInput(field: FormFieldDefinition, defaultValue: string) {
  const common = {
    id: field.field_key,
    name: field.is_custom ? `custom_${field.field_key}` : field.field_key,
    defaultValue,
    required: field.is_required,
    placeholder: field.placeholder ?? undefined,
  };

  if (field.field_type === "textarea") {
    return (
      <Textarea
        {...common}
        className="min-h-28 rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20"
      />
    );
  }

  if (field.field_type === "select") {
    const options = resolveSelectOptions(field);
    return (
      <select
        id={common.id}
        name={common.name}
        defaultValue={defaultValue}
        required={field.is_required}
        className={employerInputClassName}
      >
        <option value="">{field.placeholder ?? "Select an option"}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      {...common}
      type={field.field_type === "email" ? "email" : field.field_type === "number" ? "number" : "text"}
      className={employerInputClassName}
    />
  );
}

function EmployerFieldBlock({
  field,
  values,
}: {
  field: FormFieldDefinition;
  values: ProfileValues;
}) {
  return (
    <div className="space-y-0">
      <label htmlFor={field.field_key} className={employerLabelClassName}>
        {field.label}
        {field.is_required && " *"}
      </label>
      {renderEmployerInput(field, getDefaultValue(field, values))}
    </div>
  );
}

function isWideCandidateField(field: FormFieldDefinition): boolean {
  return (
    field.field_type === "textarea" ||
    field.field_key === "skills" ||
    field.field_key === "certifications" ||
    field.field_key === "languages"
  );
}

function CandidateFieldsGrid({
  fields,
  values,
}: {
  fields: FormFieldDefinition[];
  values: ProfileValues;
}) {
  const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order);
  const nodes: ReactNode[] = [];
  let index = 0;

  const flushNarrowRun = (run: FormFieldDefinition[]) => {
    if (run.length === 0) return;
    nodes.push(
      <div key={run.map((f) => f.id).join("-")} className="grid gap-4 md:grid-cols-2">
        {run.map((field) => (
          <CandidateProfileField
            key={field.id}
            field={field}
            defaultValue={getDefaultValue(field, values)}
          />
        ))}
      </div>
    );
  };

  let narrowRun: FormFieldDefinition[] = [];

  while (index < sorted.length) {
    const field = sorted[index]!;
    const next = sorted[index + 1];

    if (field.field_key === "country" && next?.field_key === "city") {
      flushNarrowRun(narrowRun);
      narrowRun = [];
      nodes.push(
        <div key={`${field.id}-${next.id}`} className="grid gap-4 md:grid-cols-2">
          <CandidateCountryCityPair
            countryField={field}
            cityField={next}
            countryDefault={getDefaultValue(field, values)}
            cityDefault={getDefaultValue(next, values)}
          />
        </div>
      );
      index += 2;
      continue;
    }

    if (isWideCandidateField(field)) {
      flushNarrowRun(narrowRun);
      narrowRun = [];
      nodes.push(
        <CandidateProfileField
          key={field.id}
          field={field}
          defaultValue={getDefaultValue(field, values)}
        />
      );
      index += 1;
      continue;
    }

    narrowRun.push(field);
    index += 1;
  }

  flushNarrowRun(narrowRun);

  return <div className="space-y-5">{nodes}</div>;
}

function EmployerFieldsGrid({
  fields,
  values,
}: {
  fields: FormFieldDefinition[];
  values: ProfileValues;
}) {
  const textareaFields = fields.filter((f) => f.field_type === "textarea");
  const gridFields = fields.filter((f) => f.field_type !== "textarea");

  return (
    <>
      {gridFields.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {gridFields.map((field) => (
            <EmployerFieldBlock key={field.id} field={field} values={values} />
          ))}
        </div>
      )}
      {textareaFields.map((field) => (
        <EmployerFieldBlock key={field.id} field={field} values={values} />
      ))}
    </>
  );
}

export function DynamicProfileFields({
  fields = [],
  values,
  variant = "candidate",
  className,
  sections,
  flat = false,
}: {
  fields?: FormFieldDefinition[];
  values: ProfileValues;
  variant?: "candidate" | "employer";
  className?: string;
  sections?: ProfileFieldSection[];
  flat?: boolean;
}) {
  if (sections?.length) {
    if (flat) {
      return (
        <div className={cn("space-y-5", className)}>
          {sections.map((section) =>
            variant === "candidate" ? (
              <CandidateFieldsGrid
                key={section.title}
                fields={section.fields}
                values={values}
              />
            ) : (
              <EmployerFieldsGrid
                key={section.title}
                fields={section.fields}
                values={values}
              />
            )
          )}
        </div>
      );
    }

    return (
      <div className={cn("space-y-8", className)}>
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5"
          >
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              {section.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
              ) : null}
            </div>
            <div className="space-y-4">
              {variant === "candidate" ? (
                <CandidateFieldsGrid fields={section.fields} values={values} />
              ) : (
                <EmployerFieldsGrid fields={section.fields} values={values} />
              )}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (variant === "candidate") {
    return (
      <div className={cn("space-y-5", className)}>
        <CandidateFieldsGrid fields={fields} values={values} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <EmployerFieldsGrid fields={fields} values={values} />
    </div>
  );
}

import { Textarea } from "@/components/ui/textarea";
import { employerInputClassName, employerLabelClassName } from "@/components/employer/employer-ui";
import {
  CandidateCountryCityPair,
  CandidateProfileField,
  CandidateRoleRequirementsList,
} from "@/components/forms/candidate-profile-field";
import { SgPostalAddressFields } from "@/components/forms/sg-postal-address-fields";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import { resolveSelectOptions } from "@/lib/form-fields/select-options";
import {
  CANDIDATE_CUSTOM_STORED_FIELD_KEYS,
  CANDIDATE_ROLE_REQUIREMENT_FIELD_KEYS,
} from "@/lib/constants/job-form";
import { isCandidateIdentityFieldLocked } from "@/lib/candidate/lock-identity-fields";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ProfileValues = Record<string, unknown>;

export type ProfileFieldSection = {
  title: string;
  description?: string;
  fields: FormFieldDefinition[];
};

function getDefaultValue(field: FormFieldDefinition, values: ProfileValues): string {
  const customFields =
    (values.custom_fields as Record<string, unknown> | undefined) ?? undefined;
  const raw =
    field.is_custom || CANDIDATE_CUSTOM_STORED_FIELD_KEYS.has(field.field_key)
      ? customFields?.[field.field_key] ?? values[field.field_key]
      : values[field.field_key];

  if (Array.isArray(raw)) return JSON.stringify(raw);
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  if (raw === null || raw === undefined) return "";
  if (field.field_key === "date_of_birth") {
    const match = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
    return match?.[1] ?? "";
  }
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
      type={
        field.field_type === "email"
          ? "email"
          : field.field_type === "number"
            ? "number"
            : field.field_type === "date"
              ? "date"
              : field.field_type === "tel"
                ? "tel"
                : field.field_type === "url"
                  ? "url"
                  : "text"
      }
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
    field.field_key === "languages" ||
    field.field_key === "work_experience" ||
    field.field_key === "education_history" ||
    field.field_key === "volunteer_experience" ||
    field.field_key === "desired_job_titles" ||
    field.field_key === "preferred_locations" ||
    field.field_key === "home_address" ||
    field.field_key === "employment_eligibility_visa"
  );
}

function CandidateFieldsGrid({
  fields,
  values,
}: {
  fields: FormFieldDefinition[];
  values: ProfileValues;
}) {
  // Keep the section order from field grouping. Sorting by sort_order
  // pulled older fields such as languages and certifications above the timelines.
  const ordered = fields;
  const nodes: ReactNode[] = [];
  const consumed = new Set<string>();
  let index = 0;

  const flushNarrowRun = (run: FormFieldDefinition[]) => {
    if (run.length === 0) return;
    nodes.push(
      <div key={run.map((f) => f.id).join("-")} className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        {run.map((field) => (
          <div key={field.id} className="min-w-0">
            <CandidateProfileField
              field={field}
              defaultValue={getDefaultValue(field, values)}
              locked={isCandidateIdentityFieldLocked(field.field_key, values)}
            />
          </div>
        ))}
      </div>
    );
  };

  let narrowRun: FormFieldDefinition[] = [];

  while (index < ordered.length) {
    const field = ordered[index]!;
    const next = ordered[index + 1];

    if (consumed.has(field.field_key)) {
      index += 1;
      continue;
    }

    if (field.field_key === "postal_code" || field.field_key === "home_address") {
      const postalField = ordered.find((item) => item.field_key === "postal_code");
      const addressField = ordered.find((item) => item.field_key === "home_address");
      if (postalField && addressField) {
        flushNarrowRun(narrowRun);
        narrowRun = [];
        consumed.add("postal_code");
        consumed.add("home_address");
        nodes.push(
          <SgPostalAddressFields
            key={`${postalField.id}-${addressField.id}`}
            postalField={postalField}
            addressField={addressField}
            postalDefault={getDefaultValue(postalField, values)}
            addressDefault={getDefaultValue(addressField, values)}
          />
        );
        index += 1;
        continue;
      }
    }

    if (field.field_key === "country" && next?.field_key === "city") {
      flushNarrowRun(narrowRun);
      narrowRun = [];
      nodes.push(
        <div key={`${field.id}-${next.id}`} className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
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

    if (CANDIDATE_ROLE_REQUIREMENT_FIELD_KEYS.has(field.field_key)) {
      flushNarrowRun(narrowRun);
      narrowRun = [];
      const roleFields: FormFieldDefinition[] = [];
      while (
        index < ordered.length &&
        CANDIDATE_ROLE_REQUIREMENT_FIELD_KEYS.has(ordered[index]!.field_key)
      ) {
        roleFields.push(ordered[index]!);
        index += 1;
      }
      const roleValues: Record<string, string> = {};
      for (const roleField of roleFields) {
        roleValues[roleField.field_key] = getDefaultValue(roleField, values);
      }
      nodes.push(
        <CandidateRoleRequirementsList
          key={roleFields.map((f) => f.id).join("-")}
          fields={roleFields}
          values={roleValues}
        />
      );
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
          locked={isCandidateIdentityFieldLocked(field.field_key, values)}
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

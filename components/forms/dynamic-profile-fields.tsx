import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { employerInputClassName, employerLabelClassName } from "@/components/employer/employer-ui";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import { cn } from "@/lib/utils";

type ProfileValues = Record<string, unknown>;

function getDefaultValue(field: FormFieldDefinition, values: ProfileValues): string {
  const raw = field.is_custom
    ? (values.custom_fields as Record<string, unknown> | undefined)?.[field.field_key]
    : values[field.field_key];

  if (Array.isArray(raw)) return raw.join(", ");
  if (raw === null || raw === undefined) return "";
  return String(raw);
}

function renderInput(
  field: FormFieldDefinition,
  defaultValue: string,
  variant: "candidate" | "employer"
) {
  const common = {
    id: field.field_key,
    name: field.is_custom ? `custom_${field.field_key}` : field.field_key,
    defaultValue,
    required: field.is_required,
    placeholder: field.placeholder ?? undefined,
  };

  if (variant === "employer") {
    if (field.field_type === "textarea") {
      return (
        <Textarea
          {...common}
          className="min-h-28 rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20"
        />
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

  if (field.field_type === "textarea") {
    return <Textarea {...common} />;
  }

  return (
    <Input
      {...common}
      type={
        field.field_type === "email"
          ? "email"
          : field.field_type === "number"
            ? "number"
            : field.field_type === "tel"
              ? "tel"
              : "text"
      }
      min={field.field_type === "number" ? 0 : undefined}
    />
  );
}

export function DynamicProfileFields({
  fields,
  values,
  variant = "candidate",
  className,
}: {
  fields: FormFieldDefinition[];
  values: ProfileValues;
  variant?: "candidate" | "employer";
  className?: string;
}) {
  const textareaFields = fields.filter((f) => f.field_type === "textarea");
  const gridFields = fields.filter((f) => f.field_type !== "textarea");

  return (
    <div className={cn("space-y-6", className)}>
      {gridFields.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {gridFields.map((field) => (
            <div
              key={field.id}
              className={cn("space-y-2", variant === "employer" && "space-y-0")}
            >
              {variant === "candidate" ? (
                <Label htmlFor={field.field_key}>
                  {field.label}
                  {field.is_required && " *"}
                </Label>
              ) : (
                <label htmlFor={field.field_key} className={employerLabelClassName}>
                  {field.label}
                  {field.is_required && " *"}
                </label>
              )}
              {renderInput(field, getDefaultValue(field, values), variant)}
            </div>
          ))}
        </div>
      )}
      {textareaFields.map((field) => (
        <div key={field.id} className={cn("space-y-2", variant === "employer" && "md:col-span-2")}>
          {variant === "candidate" ? (
            <Label htmlFor={field.field_key}>
              {field.label}
              {field.is_required && " *"}
            </Label>
          ) : (
            <label htmlFor={field.field_key} className={employerLabelClassName}>
              {field.label}
              {field.is_required && " *"}
            </label>
          )}
          {renderInput(field, getDefaultValue(field, values), variant)}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createFormField,
  deleteFormField,
  saveFormField,
  toggleFormFieldActive,
} from "@/lib/admin/form-field-actions";
import type { FormFieldDefinition, FormFieldSectionGroup } from "@/lib/form-fields/types";
import { cn } from "@/lib/utils";

interface FormFieldsComparisonEditorProps {
  candidate: FormFieldSectionGroup[];
  employerProfile: FormFieldSectionGroup[];
  employerJob: FormFieldSectionGroup[];
}

function buildFormData(field: FormFieldDefinition, overrides: Partial<FormFieldDefinition> = {}) {
  const merged = { ...field, ...overrides };
  const formData = new FormData();
  formData.set("audience", merged.audience);
  formData.set("form_group", merged.form_group);
  formData.set("section", merged.section);
  formData.set("field_key", merged.field_key);
  formData.set("label", merged.label);
  formData.set("field_type", merged.field_type);
  formData.set("placeholder", merged.placeholder ?? "");
  formData.set("sort_order", String(merged.sort_order));
  formData.set("is_required", String(merged.is_required));
  formData.set("is_active", String(merged.is_active));
  formData.set("is_custom", String(merged.is_custom));
  return formData;
}

export function FormFieldsComparisonEditor({
  candidate,
  employerProfile,
  employerJob,
}: FormFieldsComparisonEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  function runAction(
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMsg);
      refresh();
    });
  }

  const candidateCount = candidate.reduce((n, s) => n + s.fields.length, 0);
  const employerCount =
    employerProfile.reduce((n, s) => n + s.fields.length, 0) +
    employerJob.reduce((n, s) => n + s.fields.length, 0);

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-3 pt-5">
          <h2 className="text-xl font-bold tracking-tight text-slate-800">
            Form Fields Comparison
          </h2>
          <p className="text-sm text-muted-foreground">
            Compare candidate and employer input fields side by side. Click{" "}
            <strong className="text-slate-700">Edit</strong> to rename a field, toggle required /
            visibility, or <strong className="text-slate-700">Add field</strong> to create new ones.
            Changes apply to the live onboarding forms.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{candidateCount} candidate fields</Badge>
            <Badge variant="outline">{employerCount} employer fields</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="gap-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="profile" className="rounded-lg px-3 py-2 text-sm">
            Profile forms (side by side)
          </TabsTrigger>
          <TabsTrigger value="job" className="rounded-lg px-3 py-2 text-sm">
            Employer job form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <SideBySideColumns
            pending={pending}
            leftTitle="Candidate"
            rightTitle="Employer"
            leftSections={candidate}
            rightSections={employerProfile}
            onRunAction={runAction}
          />
        </TabsContent>

        <TabsContent value="job" className="mt-0">
          <SingleColumnPanel
            title="Employer job creation form"
            description="Fields employers fill when creating or editing a job posting."
            sections={employerJob}
            pending={pending}
            audience="employer"
            formGroup="job"
            onRunAction={runAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SideBySideColumns({
  pending,
  leftTitle,
  rightTitle,
  leftSections,
  rightSections,
  onRunAction,
}: {
  pending: boolean;
  leftTitle: string;
  rightTitle: string;
  leftSections: FormFieldSectionGroup[];
  rightSections: FormFieldSectionGroup[];
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const sectionNames = [
    ...new Set([
      ...leftSections.map((s) => s.section),
      ...rightSections.map((s) => s.section),
    ]),
  ];

  const leftMap = Object.fromEntries(leftSections.map((s) => [s.section, s.fields]));
  const rightMap = Object.fromEntries(rightSections.map((s) => [s.section, s.fields]));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50">
        <div className="px-4 py-3 text-sm font-semibold text-blue-800">{leftTitle}</div>
        <div className="px-4 py-3 text-sm font-semibold text-cyan-800">{rightTitle}</div>
      </div>

      {sectionNames.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">No fields configured yet.</p>
      ) : (
        sectionNames.map((section) => (
          <div key={section} className="border-b border-slate-100 last:border-b-0">
            <div className="grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/80">
              <p className="col-span-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {section}
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <FieldListColumn
                fields={leftMap[section] ?? []}
                pending={pending}
                audience="candidate"
                formGroup="profile"
                section={section}
                onRunAction={onRunAction}
              />
              <FieldListColumn
                fields={rightMap[section] ?? []}
                pending={pending}
                audience="employer"
                formGroup="profile"
                section={section}
                onRunAction={onRunAction}
              />
            </div>
          </div>
        ))
      )}

      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-200 bg-slate-50/50 p-3">
        <AddFieldButton
          pending={pending}
          audience="candidate"
          formGroup="profile"
          section="Candidate Profile"
          onRunAction={onRunAction}
        />
        <AddFieldButton
          pending={pending}
          audience="employer"
          formGroup="profile"
          section="Company Profile"
          onRunAction={onRunAction}
        />
      </div>
    </div>
  );
}

function SingleColumnPanel({
  title,
  description,
  sections,
  pending,
  audience,
  formGroup,
  onRunAction,
}: {
  title: string;
  description: string;
  sections: FormFieldSectionGroup[];
  pending: boolean;
  audience: "candidate" | "employer";
  formGroup: "profile" | "job";
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {sections.map((group) => (
        <div key={group.section} className="border-b border-slate-100 last:border-b-0">
          <p className="bg-slate-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {group.section}
          </p>
          <div className="px-3 py-2">
            <FieldListColumn
              fields={group.fields}
              pending={pending}
              audience={audience}
              formGroup={formGroup}
              section={group.section}
              onRunAction={onRunAction}
            />
          </div>
        </div>
      ))}
      <div className="border-t border-slate-200 bg-slate-50/50 p-3">
        <AddFieldButton
          pending={pending}
          audience={audience}
          formGroup={formGroup}
          section={sections[0]?.section ?? "Job Fields"}
          onRunAction={onRunAction}
          pickSection={sections.map((s) => s.section)}
        />
      </div>
    </div>
  );
}

function FieldListColumn({
  fields,
  pending,
  audience,
  formGroup,
  section,
  onRunAction,
}: {
  fields: FormFieldDefinition[];
  pending: boolean;
  audience: "candidate" | "employer";
  formGroup: "profile" | "job";
  section: string;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  if (fields.length === 0) {
    return (
      <p className="px-3 py-4 text-xs italic text-muted-foreground">No fields in this section.</p>
    );
  }

  return (
    <div className="space-y-2 px-3 py-2">
      {fields.map((field) => (
        <FieldRow
          key={field.id}
          field={field}
          pending={pending}
          onRunAction={onRunAction}
        />
      ))}
    </div>
  );
}

function FieldRow({
  field,
  pending,
  onRunAction,
}: {
  field: FormFieldDefinition;
  pending: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(field.label);
  const [isRequired, setIsRequired] = useState(field.is_required);

  function cancel() {
    setLabel(field.label);
    setIsRequired(field.is_required);
    setEditing(false);
  }

  function save() {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Label cannot be empty.");
      return;
    }
    onRunAction(
      () =>
        saveFormField(
          buildFormData(field, { label: trimmed, is_required: isRequired }),
          field.id
        ),
      "Field updated"
    );
    setEditing(false);
  }

  if (!field.is_active && !editing) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 opacity-60">
        <span className="text-xs text-slate-500 line-through">{field.label}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-1.5 text-[10px]"
          disabled={pending}
          onClick={() =>
            onRunAction(() => toggleFormFieldActive(field.id, true), "Field shown")
          }
        >
          <Eye className="mr-0.5 h-3 w-3" />
          Show
        </Button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-primary/30 bg-white p-2 ring-1 ring-primary/10">
        <Input
          value={label}
          disabled={pending}
          onChange={(e) => setLabel(e.target.value)}
          className="mb-2 h-8 text-sm"
          autoFocus
        />
        <label className="mb-2 flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            disabled={pending}
          />
          Required field
        </label>
        <div className="flex gap-1">
          <Button size="sm" className="h-7 flex-1 text-xs" disabled={pending} onClick={save}>
            <Check className="mr-1 h-3 w-3" />
            Save
          </Button>
          <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" disabled={pending} onClick={cancel}>
            <X className="mr-1 h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white px-2 py-1.5",
        !field.is_active && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">
            {field.label}
            {field.is_required && <span className="text-destructive"> *</span>}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {field.field_key} · {field.field_type}
            {field.is_custom && " · custom"}
          </p>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-1.5 text-[10px]"
          disabled={pending}
          onClick={() => setEditing(true)}
        >
          <Pencil className="mr-0.5 h-2.5 w-2.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-1.5 text-[10px]"
          disabled={pending}
          onClick={() =>
            onRunAction(
              () => toggleFormFieldActive(field.id, !field.is_active),
              field.is_active ? "Field hidden" : "Field shown"
            )
          }
        >
          {field.is_active ? (
            <>
              <EyeOff className="mr-0.5 h-2.5 w-2.5" />
              Hide
            </>
          ) : (
            <>
              <Eye className="mr-0.5 h-2.5 w-2.5" />
              Show
            </>
          )}
        </Button>
        {field.is_custom && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-1.5 text-[10px] text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete "${field.label}"?`)) return;
              onRunAction(() => deleteFormField(field.id), "Field deleted");
            }}
          >
            <Trash2 className="mr-0.5 h-2.5 w-2.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

function AddFieldButton({
  pending,
  audience,
  formGroup,
  section,
  onRunAction,
  pickSection,
}: {
  pending: boolean;
  audience: "candidate" | "employer";
  formGroup: "profile" | "job";
  section: string;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
  pickSection?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [targetSection, setTargetSection] = useState(section);
  const [isRequired, setIsRequired] = useState(false);

  function add() {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Enter a field label first.");
      return;
    }
    onRunAction(
      () =>
        createFormField({
          audience,
          form_group: formGroup,
          section: targetSection,
          label: trimmed,
          is_required: isRequired,
        }),
      "Field added"
    );
    setLabel("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add field
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-2">
      {pickSection && pickSection.length > 1 && (
        <select
          value={targetSection}
          onChange={(e) => setTargetSection(e.target.value)}
          className="mb-2 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
        >
          {pickSection.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
      <Input
        value={label}
        disabled={pending}
        placeholder="New field label…"
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        className="mb-2 h-8 text-sm"
        autoFocus
      />
      <label className="mb-2 flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
        />
        Required
      </label>
      <div className="flex gap-1">
        <Button size="sm" className="h-7 flex-1 text-xs" disabled={pending} onClick={add}>
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 flex-1 text-xs"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setLabel("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

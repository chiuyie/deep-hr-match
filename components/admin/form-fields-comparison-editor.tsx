"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  ListTree,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminStatCard } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createFormField,
  deleteFormField,
  saveFormField,
  toggleFormFieldActive,
} from "@/lib/admin/form-field-actions";
import {
  buildPairedFieldRows,
  countSectionFields,
  flattenSectionFields,
} from "@/lib/form-fields/grouping";
import type { FormFieldDefinition, FormFieldSectionGroup } from "@/lib/form-fields/types";
import { cn } from "@/lib/utils";

interface FormFieldsComparisonEditorProps {
  candidate: FormFieldSectionGroup[];
  employerProfile: FormFieldSectionGroup[];
  employerJob: FormFieldSectionGroup[];
}

const FIELD_TYPE_STYLES: Record<string, string> = {
  text: "border-slate-200 bg-slate-50 text-slate-600",
  email: "border-blue-200 bg-blue-50 text-blue-700",
  tel: "border-teal-200 bg-teal-50 text-teal-700",
  url: "border-indigo-200 bg-indigo-50 text-indigo-700",
  number: "border-amber-200 bg-amber-50 text-amber-700",
  textarea: "border-violet-200 bg-violet-50 text-violet-700",
  select: "border-cyan-200 bg-cyan-50 text-cyan-700",
  checkbox: "border-emerald-200 bg-emerald-50 text-emerald-700",
  file: "border-rose-200 bg-rose-50 text-rose-700",
};

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

function fieldMatchesSearch(field: FormFieldDefinition | undefined, query: string) {
  if (!field) return false;
  const haystack = `${field.label} ${field.field_key} ${field.field_type} ${field.section}`.toLowerCase();
  return haystack.includes(query);
}

export function FormFieldsComparisonEditor({
  candidate,
  employerProfile,
  employerJob,
}: FormFieldsComparisonEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [profileSearch, setProfileSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [showHidden, setShowHidden] = useState(true);

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

  const candidateCount = countSectionFields(candidate);
  const employerProfileCount = countSectionFields(employerProfile);
  const employerJobCount = countSectionFields(employerJob);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 via-white to-cyan-50/80 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
                <ListTree className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                  Form Fields Comparison
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Compare candidate and employer inputs side by side, edit labels, toggle required
                  fields, and add custom fields. Changes apply to live onboarding forms immediately.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={showHidden ? "secondary" : "outline"}
                className="rounded-lg"
                onClick={() => setShowHidden((value) => !value)}
              >
                {showHidden ? <Eye className="mr-1.5 h-3.5 w-3.5" /> : <EyeOff className="mr-1.5 h-3.5 w-3.5" />}
                {showHidden ? "Showing hidden" : "Hidden fields off"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          <AdminStatCard
            label="Candidate profile"
            value={candidateCount}
            icon={User}
            accent="from-blue-500/15 to-blue-500/5 text-blue-700"
          />
          <AdminStatCard
            label="Employer profile"
            value={employerProfileCount}
            icon={Building2}
            accent="from-cyan-500/15 to-cyan-500/5 text-cyan-700"
          />
          <AdminStatCard
            label="Employer job form"
            value={employerJobCount}
            icon={Briefcase}
            accent="from-violet-500/15 to-indigo-500/10 text-violet-700"
          />
        </div>
      </section>

      <Tabs defaultValue="profile" className="gap-5">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
          <TabsTrigger
            value="profile"
            className="rounded-xl px-4 py-2.5 text-sm data-active:bg-blue-50 data-active:text-blue-800"
          >
            <User className="mr-2 h-4 w-4" />
            Profile comparison
            <Badge variant="secondary" className="ml-2 text-[10px]">
              {candidateCount} / {employerProfileCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="job"
            className="rounded-xl px-4 py-2.5 text-sm data-active:bg-violet-50 data-active:text-violet-800"
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Job form
            <Badge variant="secondary" className="ml-2 text-[10px]">
              {employerJobCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 space-y-4">
          <Toolbar
            search={profileSearch}
            onSearchChange={setProfileSearch}
            placeholder="Search candidate or employer profile fields…"
            pending={pending}
          />
          <SideBySideColumns
            pending={pending}
            search={profileSearch.trim().toLowerCase()}
            showHidden={showHidden}
            leftTitle="Candidate profile"
            rightTitle="Employer profile"
            leftSections={candidate}
            rightSections={employerProfile}
            onRunAction={runAction}
          />
        </TabsContent>

        <TabsContent value="job" className="mt-0 space-y-4">
          <Toolbar
            search={jobSearch}
            onSearchChange={setJobSearch}
            placeholder="Search job form fields…"
            pending={pending}
          />
          <SingleColumnPanel
            title="Employer job creation form"
            description="Fields employers complete when posting or editing a job."
            sections={employerJob}
            pending={pending}
            search={jobSearch.trim().toLowerCase()}
            showHidden={showHidden}
            audience="employer"
            formGroup="job"
            onRunAction={runAction}
          />
        </TabsContent>
      </Tabs>

      {pending && (
        <div className="pointer-events-none fixed inset-x-0 top-14 z-40 flex justify-center px-4">
          <div className="rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur">
            Saving changes…
          </div>
        </div>
      )}
    </div>
  );
}

function Toolbar({
  search,
  onSearchChange,
  placeholder,
  pending,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          disabled={pending}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 rounded-xl border-slate-200 pl-9"
          aria-label="Search fields"
        />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <LegendItem color="bg-blue-100 text-blue-700" label="Candidate" />
        <LegendItem color="bg-cyan-100 text-cyan-700" label="Employer" />
        <LegendItem color="bg-amber-100 text-amber-700" label="Custom field" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1">
      <span className={cn("h-2 w-2 rounded-full", color.split(" ")[0])} />
      {label}
    </span>
  );
}

function SideBySideColumns({
  pending,
  search,
  showHidden,
  leftTitle,
  rightTitle,
  leftSections,
  rightSections,
  onRunAction,
}: {
  pending: boolean;
  search: string;
  showHidden: boolean;
  leftTitle: string;
  rightTitle: string;
  leftSections: FormFieldSectionGroup[];
  rightSections: FormFieldSectionGroup[];
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const pairedRows = useMemo(() => {
    const filterField = (field: FormFieldDefinition) => {
      if (!showHidden && !field.is_active) return false;
      if (search && !fieldMatchesSearch(field, search)) return false;
      return true;
    };

    const leftFields = flattenSectionFields(leftSections).filter(filterField);
    const rightFields = flattenSectionFields(rightSections).filter(filterField);

    if (!search) {
      return buildPairedFieldRows(leftSections, rightSections).filter((row) => {
        const leftOk = !row.left || filterField(row.left);
        const rightOk = !row.right || filterField(row.right);
        if (!showHidden) {
          return (row.left && row.left.is_active) || (row.right && row.right.is_active);
        }
        return leftOk || rightOk;
      });
    }

    const rowCount = Math.max(leftFields.length, rightFields.length);
    return Array.from({ length: rowCount }, (_, index) => ({
      left: leftFields[index],
      right: rightFields[index],
    }));
  }, [leftSections, rightSections, search, showHidden]);

  const leftSection = leftSections[0]?.section ?? "Candidate Profile";
  const rightSection = rightSections[0]?.section ?? "Company Profile";
  const leftCount = flattenSectionFields(leftSections).filter((f) => showHidden || f.is_active).length;
  const rightCount = flattenSectionFields(rightSections).filter((f) => showHidden || f.is_active).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="hidden border-b border-slate-200 bg-slate-50/90 md:grid md:grid-cols-[3rem_1fr_auto_1fr] md:divide-x md:divide-slate-200">
        <div className="flex items-center justify-center px-2 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          #
        </div>
        <ColumnHeader
          title={leftTitle}
          count={leftCount}
          icon={User}
          accent="from-blue-500 to-blue-600"
          badgeClass="bg-blue-100 text-blue-700"
        />
        <div className="flex w-10 items-center justify-center bg-white px-1">
          <Sparkles className="h-4 w-4 text-slate-300" aria-hidden />
        </div>
        <ColumnHeader
          title={rightTitle}
          count={rightCount}
          icon={Building2}
          accent="from-cyan-500 to-cyan-600"
          badgeClass="bg-cyan-100 text-cyan-700"
        />
      </div>

      {pairedRows.length === 0 ? (
        <EmptyState
          title="No matching fields"
          description={
            search
              ? "Try a different search term or clear the filter."
              : "No fields configured yet. Add fields using the buttons below."
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            {pairedRows.map((row, index) => (
              <ComparisonRow
                key={`desktop-${index}`}
                index={index}
                row={row}
                pending={pending}
                onRunAction={onRunAction}
              />
            ))}
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {pairedRows.map((row, index) => (
              <MobileComparisonCard
                key={`mobile-${index}`}
                index={index}
                row={row}
                pending={pending}
                onRunAction={onRunAction}
              />
            ))}
          </div>
        </>
      )}

      <div className="grid gap-3 border-t border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
        <AddFieldButton
          pending={pending}
          audience="candidate"
          formGroup="profile"
          section={leftSection}
          accent="border-blue-200 bg-blue-50/50 hover:bg-blue-50"
          onRunAction={onRunAction}
        />
        <AddFieldButton
          pending={pending}
          audience="employer"
          formGroup="profile"
          section={rightSection}
          accent="border-cyan-200 bg-cyan-50/50 hover:bg-cyan-50"
          onRunAction={onRunAction}
        />
      </div>
    </div>
  );
}

function ColumnHeader({
  title,
  count,
  icon: Icon,
  accent,
  badgeClass,
}: {
  title: string;
  count: number;
  icon: typeof User;
  accent: string;
  badgeClass: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
          accent
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{count} fields</p>
      </div>
      <Badge className={cn("shrink-0 border-0", badgeClass)}>{count}</Badge>
    </div>
  );
}

function ComparisonRow({
  index,
  row,
  pending,
  onRunAction,
}: {
  index: number;
  row: { left?: FormFieldDefinition; right?: FormFieldDefinition };
  pending: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[3rem_1fr_auto_1fr] border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/70",
        index % 2 === 1 && "bg-slate-50/30"
      )}
    >
      <div className="flex items-start justify-center px-2 py-4 text-xs font-semibold tabular-nums text-slate-400">
        {index + 1}
      </div>
      <PairedFieldCell field={row.left} pending={pending} side="candidate" onRunAction={onRunAction} />
      <div className="flex w-10 items-stretch justify-center bg-gradient-to-b from-transparent via-slate-100/80 to-transparent">
        <div className="w-px bg-slate-200" />
      </div>
      <PairedFieldCell field={row.right} pending={pending} side="employer" onRunAction={onRunAction} />
    </div>
  );
}

function MobileComparisonCard({
  index,
  row,
  pending,
  onRunAction,
}: {
  index: number;
  row: { left?: FormFieldDefinition; right?: FormFieldDefinition };
  pending: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
        Row {index + 1}
      </div>
      <div className="space-y-3 p-3">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            Candidate
          </p>
          <PairedFieldCell field={row.left} pending={pending} side="candidate" onRunAction={onRunAction} mobile />
        </div>
        <div className="border-t border-dashed border-slate-200 pt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
            Employer
          </p>
          <PairedFieldCell field={row.right} pending={pending} side="employer" onRunAction={onRunAction} mobile />
        </div>
      </div>
    </div>
  );
}

function PairedFieldCell({
  field,
  pending,
  side,
  mobile = false,
  onRunAction,
}: {
  field?: FormFieldDefinition;
  pending: boolean;
  side: "candidate" | "employer";
  mobile?: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  if (!field) {
    return (
      <div
        className={cn(
          "flex min-h-[4rem] items-center justify-center",
          mobile ? "rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-4" : "px-4 py-4"
        )}
      >
        <span className="text-xs font-medium text-slate-300">No matching field</span>
      </div>
    );
  }

  return (
    <div className={cn("px-3 py-3", !mobile && "md:px-4")}>
      <FieldRow
        field={field}
        pending={pending}
        compact
        side={side}
        onRunAction={onRunAction}
      />
    </div>
  );
}

function SingleColumnPanel({
  title,
  description,
  sections,
  pending,
  search,
  showHidden,
  audience,
  formGroup,
  onRunAction,
}: {
  title: string;
  description: string;
  sections: FormFieldSectionGroup[];
  pending: boolean;
  search: string;
  showHidden: boolean;
  audience: "candidate" | "employer";
  formGroup: "profile" | "job";
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const filteredSections = useMemo(() => {
    return sections
      .map((group) => ({
        ...group,
        fields: group.fields.filter((field) => {
          if (!showHidden && !field.is_active) return false;
          if (search && !fieldMatchesSearch(field, search)) return false;
          return true;
        }),
      }))
      .filter((group) => group.fields.length > 0);
  }, [sections, search, showHidden]);

  const totalVisible = filteredSections.reduce((n, group) => n + group.fields.length, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50/70 to-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-800">{title}</p>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          </div>
          <Badge variant="secondary">{totalVisible} fields shown</Badge>
        </div>
      </div>

      {filteredSections.length === 0 ? (
        <EmptyState
          title="No matching job fields"
          description={
            search
              ? "Try another search or switch to showing hidden fields."
              : "No job form fields found in this section."
          }
        />
      ) : (
        filteredSections.map((group) => (
          <JobSectionGroup
            key={group.section}
            group={group}
            pending={pending}
            audience={audience}
            formGroup={formGroup}
            onRunAction={onRunAction}
          />
        ))
      )}

      <div className="border-t border-slate-200 bg-slate-50/70 p-4">
        <AddFieldButton
          pending={pending}
          audience={audience}
          formGroup={formGroup}
          section={sections[0]?.section ?? "Job Fields"}
          accent="border-violet-200 bg-violet-50/50 hover:bg-violet-50"
          onRunAction={onRunAction}
          pickSection={sections.map((s) => s.section)}
        />
      </div>
    </div>
  );
}

function JobSectionGroup({
  group,
  pending,
  audience,
  formGroup,
  onRunAction,
}: {
  group: FormFieldSectionGroup;
  pending: boolean;
  audience: "candidate" | "employer";
  formGroup: "profile" | "job";
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 bg-slate-50/80 px-5 py-3 text-left transition-colors hover:bg-slate-100/80 sm:px-6"
      >
        <div>
          <p className="text-sm font-semibold text-slate-700">{group.section}</p>
          <p className="text-xs text-slate-500">{group.fields.length} fields</p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {group.fields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              pending={pending}
              side="employer"
              onRunAction={onRunAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Search className="h-5 w-5" />
      </div>
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

function FieldTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border px-1.5 py-0 text-[10px] font-medium", FIELD_TYPE_STYLES[type] ?? FIELD_TYPE_STYLES.text)}
    >
      {type}
    </Badge>
  );
}

function FieldRow({
  field,
  pending,
  compact = false,
  side = "candidate",
  onRunAction,
}: {
  field: FormFieldDefinition;
  pending: boolean;
  compact?: boolean;
  side?: "candidate" | "employer";
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(field.label);
  const [isRequired, setIsRequired] = useState(field.is_required);

  const sideAccent =
    side === "candidate"
      ? "border-l-blue-400 hover:border-blue-200"
      : "border-l-cyan-400 hover:border-cyan-200";

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
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 opacity-70",
          compact && "border-l-4",
          compact && sideAccent
        )}
      >
        <div className="min-w-0">
          <p className="break-words text-sm text-slate-500 line-through">{field.label}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Hidden from form</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 rounded-lg px-2 text-[10px]"
          disabled={pending}
          onClick={() => onRunAction(() => toggleFormFieldActive(field.id, true), "Field shown")}
        >
          <Eye className="mr-1 h-3 w-3" />
          Show
        </Button>
      </div>
    );
  }

  if (editing) {
    return (
      <div
        className={cn(
          "rounded-xl border border-primary/30 bg-white p-3 shadow-sm ring-2 ring-primary/10",
          compact && "border-l-4",
          compact && sideAccent
        )}
      >
        <Input
          value={label}
          disabled={pending}
          onChange={(e) => setLabel(e.target.value)}
          className="mb-3 h-9 rounded-lg text-sm"
          autoFocus
        />
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            disabled={pending}
            className="rounded border-slate-300"
          />
          Required on form
        </label>
        <div className="flex gap-2">
          <Button size="sm" className="h-8 flex-1 rounded-lg text-xs" disabled={pending} onClick={save}>
            <Check className="mr-1 h-3.5 w-3.5" />
            Save
          </Button>
          <Button size="sm" variant="outline" className="h-8 flex-1 rounded-lg text-xs" disabled={pending} onClick={cancel}>
            <X className="mr-1 h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          "group rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-all hover:-translate-y-px hover:shadow-md",
          "border-l-4",
          sideAccent,
          !field.is_active && "opacity-60"
        )}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="break-words text-sm font-semibold leading-snug text-slate-800">
                {field.label}
              </p>
              {field.is_required && (
                <Badge className="h-4 border-0 bg-rose-100 px-1.5 text-[10px] text-rose-700 hover:bg-rose-100">
                  Required
                </Badge>
              )}
              {field.is_custom && (
                <Badge className="h-4 border-0 bg-amber-100 px-1.5 text-[10px] text-amber-700 hover:bg-amber-100">
                  Custom
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <FieldTypeBadge type={field.field_type} />
              <span className="font-mono text-[10px] text-slate-400">{field.field_key}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
            <IconActionButton
              pending={pending}
              title="Edit label"
              onClick={() => setEditing(true)}
              icon={Pencil}
            />
            <IconActionButton
              pending={pending}
              title={field.is_active ? "Hide from form" : "Show on form"}
              onClick={() =>
                onRunAction(
                  () => toggleFormFieldActive(field.id, !field.is_active),
                  field.is_active ? "Field hidden" : "Field shown"
                )
              }
              icon={field.is_active ? EyeOff : Eye}
            />
            {field.is_custom && (
              <IconActionButton
                pending={pending}
                title="Delete field"
                destructive
                onClick={() => {
                  if (!window.confirm(`Delete "${field.label}"?`)) return;
                  onRunAction(() => deleteFormField(field.id), "Field deleted");
                }}
                icon={Trash2}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-px hover:shadow-md",
        !field.is_active && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-800">{field.label}</p>
            {field.is_required && (
              <Badge className="h-4 border-0 bg-rose-100 px-1.5 text-[10px] text-rose-700 hover:bg-rose-100">
                Required
              </Badge>
            )}
            {field.is_custom && (
              <Badge className="h-4 border-0 bg-amber-100 px-1.5 text-[10px] text-amber-700 hover:bg-amber-100">
                Custom
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <FieldTypeBadge type={field.field_type} />
            <span className="font-mono text-[10px] text-slate-400">{field.field_key}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" className="h-7 rounded-lg px-2 text-[10px]" disabled={pending} onClick={() => setEditing(true)}>
          <Pencil className="mr-1 h-3 w-3" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 rounded-lg px-2 text-[10px]"
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
              <EyeOff className="mr-1 h-3 w-3" />
              Hide
            </>
          ) : (
            <>
              <Eye className="mr-1 h-3 w-3" />
              Show
            </>
          )}
        </Button>
        {field.is_custom && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-lg px-2 text-[10px] text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete "${field.label}"?`)) return;
              onRunAction(() => deleteFormField(field.id), "Field deleted");
            }}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

function IconActionButton({
  pending,
  title,
  onClick,
  icon: Icon,
  destructive = false,
}: {
  pending: boolean;
  title: string;
  onClick: () => void;
  icon: typeof Pencil;
  destructive?: boolean;
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className={cn("h-7 w-7 rounded-lg p-0", destructive && "text-destructive hover:text-destructive")}
      disabled={pending}
      title={title}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}

function AddFieldButton({
  pending,
  audience,
  formGroup,
  section,
  accent,
  onRunAction,
  pickSection,
}: {
  pending: boolean;
  audience: "candidate" | "employer";
  formGroup: "profile" | "job";
  section: string;
  accent: string;
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
        className={cn("h-10 w-full justify-center rounded-xl border-dashed text-sm", accent)}
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add field
      </Button>
    );
  }

  return (
    <div className={cn("rounded-xl border border-dashed p-4", accent)}>
      <p className="mb-3 text-sm font-semibold text-slate-700">New custom field</p>
      {pickSection && pickSection.length > 1 && (
        <select
          value={targetSection}
          onChange={(e) => setTargetSection(e.target.value)}
          className="mb-3 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
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
        placeholder="Field label, e.g. Portfolio URL"
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        className="mb-3 h-9 rounded-lg text-sm"
        autoFocus
      />
      <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
          className="rounded border-slate-300"
        />
        Required on form
      </label>
      <div className="flex gap-2">
        <Button size="sm" className="h-8 flex-1 rounded-lg" disabled={pending} onClick={add}>
          Add field
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 flex-1 rounded-lg"
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

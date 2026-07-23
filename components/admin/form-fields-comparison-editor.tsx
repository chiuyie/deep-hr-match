"use client";

import { useMemo, useState, useTransition, type HTMLAttributes, type ReactNode } from "react";
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
  Target,
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
  createFormSection,
  deleteFormField,
  deleteFormSection,
  reorderFormFields,
  reorderFormSections,
  renameFormSection,
  saveFormField,
  toggleFormFieldActive,
  updateEmployerDisclosureMode,
  updateShowOnAnonymousMatch,
} from "@/lib/admin/form-field-actions";
import { isProtectedJobSectionTitle } from "@/lib/form-fields/section-defaults";
import {
  FieldDragHandle,
  SortableFormFieldSections,
  formFieldGroupsSignature,
} from "@/components/admin/sortable-form-fields";
import {
  countSectionFields,
  flattenSectionFields,
} from "@/lib/form-fields/grouping";
import type {
  EmployerDisclosureMode,
  FormFieldDefinition,
  FormFieldSectionGroup,
  FormFieldType,
} from "@/lib/form-fields/types";
import { optionsToText, parseOptionsText, resolveSelectOptions } from "@/lib/form-fields/select-options";
import { Textarea } from "@/components/ui/textarea";
import type { PlatformDisclosureItem } from "@/lib/employer/platform-disclosure";
import { PlatformDisclosureSection } from "@/components/admin/platform-disclosure-section";
import { cn } from "@/lib/utils";

interface FormFieldsComparisonEditorProps {
  candidate: FormFieldSectionGroup[];
  employerProfile: FormFieldSectionGroup[];
  employerJob: FormFieldSectionGroup[];
  platformDisclosure: PlatformDisclosureItem[];
  schemaWarnings?: string[];
}

const FIELD_TYPE_STYLES: Record<string, string> = {
  text: "border-slate-300 bg-white text-slate-700",
  email: "border-slate-300 bg-white text-slate-700",
  tel: "border-slate-300 bg-white text-slate-700",
  url: "border-slate-300 bg-white text-slate-700",
  number: "border-slate-300 bg-white text-slate-700",
  textarea: "border-slate-300 bg-white text-slate-700",
  select: "border-slate-300 bg-white text-slate-700",
  checkbox: "border-slate-300 bg-white text-slate-700",
  file: "border-slate-300 bg-white text-slate-700",
};

const FORM_FIELD_TYPE_OPTIONS: Array<{ value: FormFieldType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Select / dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File" },
];

const FORM_TAB_TRIGGER_CLASS =
  "inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-transparent px-3 py-0 text-sm font-medium text-slate-600 shadow-none after:hidden " +
  "hover:bg-white/80 hover:text-slate-900 " +
  "focus-visible:border-sky-300 focus-visible:ring-2 focus-visible:ring-sky-500/25 focus-visible:outline-none " +
  "data-active:border-slate-200 data-active:bg-white data-active:font-semibold data-active:text-slate-900 data-active:shadow-none " +
  "group-data-[variant=default]/tabs-list:data-active:shadow-none";

const FORM_TAB_BADGE_CLASS =
  "h-5 min-w-5 shrink-0 justify-center rounded-md border border-slate-200 bg-white px-1.5 text-[11px] font-medium tabular-nums leading-none text-slate-600";

const FORM_TAB_LIST_CLASS =
  "flex !h-auto min-h-0 w-full flex-nowrap items-center justify-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-100 p-0.5 shadow-none";

const DISCLOSURE_MODE_OPTIONS: Array<{
  value: EmployerDisclosureMode;
  label: string;
  hint: string;
}> = [
  {
    value: "always_visible",
    label: "Show after unlock",
    hint: "Employers see this field on the unlocked candidate profile and match report.",
  },
  {
    value: "candidate_optional",
    label: "Show if candidate filled it in",
    hint: "Employers see the field after unlock only when the candidate provided a value.",
  },
  {
    value: "admin_removed",
    label: "Keep private after unlock",
    hint: "Employers never see this field, even after paying to unlock the candidate.",
  },
];

function isShownAfterUnlock(mode: EmployerDisclosureMode) {
  return mode !== "admin_removed";
}

function unlockedVisibilityCopy(mode: EmployerDisclosureMode) {
  if (mode === "admin_removed") {
    return {
      badge: "Private after unlock",
      button: "Keep private",
      helper: "Hidden from the paid profile and match report.",
    };
  }
  if (mode === "always_visible") {
    return {
      badge: "Shown after unlock",
      button: "Show after unlock",
      helper: "Included on the unlocked profile and match report.",
    };
  }
  return {
    badge: "Shown if filled in",
    button: "Show if filled in",
    helper: "Included after unlock when the candidate has provided a value.",
  };
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
  formData.set(
    "options",
    merged.field_type === "select" ? JSON.stringify(merged.options ?? []) : ""
  );
  formData.set("sort_order", String(merged.sort_order));
  formData.set("is_required", String(merged.is_required));
  formData.set("is_active", String(merged.is_active));
  formData.set("is_custom", String(merged.is_custom));
  formData.set("employer_disclosure_mode", merged.employer_disclosure_mode);
  formData.set("show_on_anonymous_match", String(Boolean(merged.show_on_anonymous_match)));
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
  platformDisclosure,
  schemaWarnings = [],
}: FormFieldsComparisonEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [profileSearch, setProfileSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [matchSearch, setMatchSearch] = useState("");
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
      {schemaWarnings.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p className="font-semibold">Database migrations required</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {schemaWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800/90">
            Or run <code className="rounded bg-amber-100 px-1">node scripts/apply-disclosure-migrations.mjs</code>{" "}
            after setting <code className="rounded bg-amber-100 px-1">SUPABASE_DB_URL</code>.
          </p>
        </div>
      ) : null}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
                <ListTree className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Form Fields &amp; Match Disclosure
                </h2>
                <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">
                  Manage fields on the <strong className="font-semibold text-slate-800">candidate profile</strong>,{" "}
                  <strong className="font-semibold text-slate-800">employer profile</strong>, and{" "}
                  <strong className="font-semibold text-slate-800">create-job</strong> forms. Candidate fields also
                  control what employers see on anonymized rankings and unlocked profiles.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={showHidden ? "default" : "outline"}
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
            accent="from-sky-500 to-sky-600 text-white"
          />
          <AdminStatCard
            label="Employer profile"
            value={employerProfileCount}
            icon={Building2}
            accent="from-teal-500 to-teal-600 text-white"
          />
          <AdminStatCard
            label="Employer job form"
            value={employerJobCount}
            icon={Briefcase}
            accent="from-indigo-500 to-indigo-600 text-white"
          />
        </div>
      </section>

      <Tabs defaultValue="profile" className="min-w-0 gap-4">
        <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className={FORM_TAB_LIST_CLASS}>
            <TabsTrigger value="profile" className={FORM_TAB_TRIGGER_CLASS}>
              <User className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Profile forms</span>
              <Badge variant="secondary" className={FORM_TAB_BADGE_CLASS}>
                {candidateCount} / {employerProfileCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="job" className={FORM_TAB_TRIGGER_CLASS}>
              <Briefcase className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Create job form</span>
              <Badge variant="secondary" className={FORM_TAB_BADGE_CLASS}>
                {employerJobCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="match" className={FORM_TAB_TRIGGER_CLASS}>
              <Target className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Match results disclosure</span>
              <Badge variant="secondary" className={FORM_TAB_BADGE_CLASS}>
                {candidateCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-0 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Edit fields on the <strong className="font-semibold text-slate-900">candidate</strong> and{" "}
            <strong className="font-semibold text-slate-900">employer profile</strong> pages, using the
            same sections those users see. Rename, delete, or drag sections to reorder; drag fields
            to reorder or move between sections; and choose an input type when adding a field.
            Candidate visibility settings also feed unlocked match reports.
          </div>
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
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Edit fields employers fill when creating or editing a job. These can also filter
            candidate–job matches. You can rename sections and add custom ones; built-in job
            sections can’t be deleted while they still hold system fields.
          </div>
          <Toolbar
            search={jobSearch}
            onSearchChange={setJobSearch}
            placeholder="Search job form fields…"
            pending={pending}
          />
          <SingleColumnPanel
            title="Employer create-job form"
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

        <TabsContent value="match" className="mt-0 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Control what employers see before and after unlock.</p>
            <p className="mt-1.5 text-slate-600">
              Start with <strong className="font-semibold text-slate-800">scores, 7^7 answers, and CV</strong>,
              then expand profile fields when you need finer control. Keep sensitive contact fields off
              anonymized rankings.
            </p>
          </div>
          <PlatformDisclosureSection
            items={platformDisclosure}
            pending={pending}
            onRunAction={runAction}
          />
          <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5 marker:content-none">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Candidate profile fields ({candidateCount})
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Per-field control for profile data the candidate submitted.
                </p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
            </summary>
            <div className="space-y-4 p-4">
              <Toolbar
                search={matchSearch}
                onSearchChange={setMatchSearch}
                placeholder="Search profile fields…"
                pending={pending}
              />
              <MatchDisclosurePanel
                sections={candidate}
                pending={pending}
                search={matchSearch.trim().toLowerCase()}
                showHidden={showHidden}
                onRunAction={runAction}
                compactSummary
              />
            </div>
          </details>
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
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          disabled={pending}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 rounded-xl border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-400"
          aria-label="Search fields"
        />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <LegendItem color="bg-sky-600" label="Candidate" />
        <LegendItem color="bg-teal-600" label="Employer" />
        <LegendItem color="bg-amber-500" label="Custom field" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function MatchDisclosurePanel({
  sections,
  pending,
  search,
  showHidden,
  onRunAction,
  compactSummary = false,
}: {
  sections: FormFieldSectionGroup[];
  pending: boolean;
  search: string;
  showHidden: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
  compactSummary?: boolean;
}) {
  const fields = useMemo(
    () =>
      flattenSectionFields(sections).filter((field) => {
        if (!showHidden && !field.is_active) return false;
        if (!search) return true;
        return fieldMatchesSearch(field, search);
      }),
    [sections, search, showHidden]
  );

  const beforeUnlockCount = fields.filter((field) => field.show_on_anonymous_match).length;
  const afterUnlockCount = fields.filter((field) =>
    isShownAfterUnlock(field.employer_disclosure_mode)
  ).length;

  if (!fields.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        No candidate fields match this search.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compactSummary ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Before unlock
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{beforeUnlockCount}</p>
            <p className="mt-1 text-sm text-slate-500">
              summary field{beforeUnlockCount === 1 ? "" : "s"} shown on anonymized rankings
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              After unlock
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{afterUnlockCount}</p>
            <p className="mt-1 text-sm text-slate-500">
              field{afterUnlockCount === 1 ? "" : "s"} included on the paid profile / match report
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          {beforeUnlockCount} on rankings · {afterUnlockCount} after unlock
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
          <span>Candidate field</span>
          <span>Before unlock</span>
          <span>After unlock</span>
        </div>
        <div className="divide-y divide-slate-100">
          {fields.map((field) => {
            const unlockedCopy = unlockedVisibilityCopy(field.employer_disclosure_mode);
            const shownAfterUnlock = isShownAfterUnlock(field.employer_disclosure_mode);
            const isSensitiveContact = ["full_name", "email", "phone"].includes(field.field_key);

            return (
              <div
                key={field.id}
                className={cn(
                  "grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start",
                  !field.is_active && "bg-slate-50"
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-900">{field.label}</p>
                    {!field.is_active && (
                      <Badge className="h-5 border border-slate-300 bg-white px-1.5 text-[11px] font-medium text-slate-700 hover:bg-white">
                        Hidden from form
                      </Badge>
                    )}
                    {isSensitiveContact && (
                      <Badge className="h-5 border border-rose-300 bg-rose-50 px-1.5 text-[11px] font-medium text-rose-800 hover:bg-rose-50">
                        Sensitive
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {isSensitiveContact
                      ? "Usually keep this private until an employer unlocks the candidate."
                      : "Choose whether employers can use this detail when reviewing matches."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={field.show_on_anonymous_match ? "secondary" : "outline"}
                    className="h-9 w-full justify-start rounded-xl text-sm sm:w-auto"
                    disabled={pending}
                    onClick={() =>
                      onRunAction(
                        () =>
                          updateShowOnAnonymousMatch(field.id, !field.show_on_anonymous_match),
                        field.show_on_anonymous_match
                          ? "Hidden from anonymized rankings"
                          : "Shown on anonymized rankings"
                      )
                    }
                  >
                    {field.show_on_anonymous_match ? (
                      <>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Show on rankings
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                        Hide from rankings
                      </>
                    )}
                  </Button>
                  <p className="text-sm leading-5 text-slate-600">
                    {field.show_on_anonymous_match
                      ? "Visible next to the anonymous candidate ID and match score."
                      : "Not shown while the candidate is still locked."}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant={shownAfterUnlock ? "secondary" : "outline"}
                      className="h-9 justify-start rounded-xl text-sm"
                      disabled={pending}
                      onClick={() => {
                        const nextMode: EmployerDisclosureMode = shownAfterUnlock
                          ? "admin_removed"
                          : "always_visible";
                        onRunAction(
                          () => updateEmployerDisclosureMode(field.id, nextMode),
                          nextMode === "admin_removed"
                            ? "Kept private after unlock"
                            : "Shown after unlock"
                        );
                      }}
                    >
                      {shownAfterUnlock ? (
                        <>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Include after unlock
                        </>
                      ) : (
                        <>
                          <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                          Keep private
                        </>
                      )}
                    </Button>
                    {shownAfterUnlock ? (
                      <select
                        value={field.employer_disclosure_mode}
                        disabled={pending}
                        onChange={(e) => {
                          const nextMode = e.target.value as EmployerDisclosureMode;
                          if (nextMode === "admin_removed") return;
                          onRunAction(
                            () => updateEmployerDisclosureMode(field.id, nextMode),
                            "After-unlock visibility updated"
                          );
                        }}
                        className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-800"
                        aria-label={`How to show ${field.label} after unlock`}
                      >
                        <option value="always_visible">Always include</option>
                        <option value="candidate_optional">Only if filled in</option>
                      </select>
                    ) : null}
                  </div>
                  <p className="text-sm leading-5 text-slate-600">{unlockedCopy.helper}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
  const leftGroups = useMemo(
    () =>
      leftSections
        .map((group) => ({
          ...group,
          fields: group.fields.filter((field) => {
            if (!showHidden && !field.is_active) return false;
            if (search && !fieldMatchesSearch(field, search)) return false;
            return true;
          }),
        }))
        .filter((group) => group.fields.length > 0 || !search),
    [leftSections, search, showHidden]
  );
  const rightGroups = useMemo(
    () =>
      rightSections
        .map((group) => ({
          ...group,
          fields: group.fields.filter((field) => {
            if (!showHidden && !field.is_active) return false;
            if (search && !fieldMatchesSearch(field, search)) return false;
            return true;
          }),
        }))
        .filter((group) => group.fields.length > 0 || !search),
    [rightSections, search, showHidden]
  );

  const leftCount = leftGroups.reduce((sum, group) => sum + group.fields.length, 0);
  const rightCount = rightGroups.reduce((sum, group) => sum + group.fields.length, 0);
  const leftSectionOptions = leftSections.map((group) => group.section);
  const rightSectionOptions = rightSections.map((group) => group.section);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="grid gap-0 border-b border-slate-200 md:grid-cols-2 md:divide-x md:divide-slate-200">
        <ColumnHeader
          title={leftTitle}
          count={leftCount}
          icon={User}
          accent="bg-sky-600"
          badgeClass="border border-sky-200 bg-sky-50 text-sky-800"
        />
        <ColumnHeader
          title={rightTitle}
          count={rightCount}
          icon={Building2}
          accent="bg-teal-600"
          badgeClass="border border-teal-200 bg-teal-50 text-teal-800"
        />
      </div>

      <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-slate-200">
        <ProfileSectionColumn
          audience="candidate"
          groups={leftGroups}
          sectionOptions={leftSectionOptions}
          pending={pending}
          searchActive={Boolean(search)}
          onRunAction={onRunAction}
          emptyTitle="No candidate fields"
          emptyDescription={
            search
              ? "Try a different search term or clear the filter."
              : "Add fields into the sections candidates see on their profile."
          }
        />
        <ProfileSectionColumn
          audience="employer"
          groups={rightGroups}
          sectionOptions={rightSectionOptions}
          pending={pending}
          searchActive={Boolean(search)}
          onRunAction={onRunAction}
          emptyTitle="No employer fields"
          emptyDescription={
            search
              ? "Try a different search term or clear the filter."
              : "Add fields into the sections employers see on company profile."
          }
        />
      </div>
    </div>
  );
}

function ProfileSectionColumn({
  audience,
  groups,
  sectionOptions,
  pending,
  searchActive,
  onRunAction,
  emptyTitle,
  emptyDescription,
}: {
  audience: "candidate" | "employer";
  groups: FormFieldSectionGroup[];
  sectionOptions: string[];
  pending: boolean;
  searchActive: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const hasAnyFields = groups.some((group) => group.fields.length > 0);
  const dragDisabled = pending || searchActive;

  return (
    <div className="min-w-0 border-b border-slate-200 md:border-b-0">
      {!hasAnyFields ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}
      {searchActive ? (
        <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Clear search to drag sections or fields.
        </p>
      ) : null}
      <SortableFormFieldSections
        key={formFieldGroupsSignature(groups)}
        groups={groups}
        disabled={dragDisabled}
        onReorder={(updates) =>
          onRunAction(() => reorderFormFields(updates), "Field order saved")
        }
        onSectionReorder={(titles) =>
          onRunAction(
            () =>
              reorderFormSections({
                audience,
                form_group: "profile",
                titles,
              }),
            "Section order saved"
          )
        }
        renderSectionChrome={({ section, fieldCount, children, sectionDragHandle }) => (
          <CollapsibleSectionShell
            key={`${audience}-${section}`}
            title={section}
            fieldCount={fieldCount}
            pending={pending}
            sectionDragHandle={sectionDragHandle}
            dragDisabled={dragDisabled}
            canDelete
            onRename={(nextTitle) =>
              onRunAction(
                () =>
                  renameFormSection({
                    audience,
                    form_group: "profile",
                    from: section,
                    to: nextTitle,
                  }),
                "Section renamed"
              )
            }
            onDelete={() => {
              const moveTo =
                sectionOptions.find((name) => name !== section) ?? "Additional information";
              if (
                !window.confirm(
                  fieldCount > 0
                    ? `Delete section "${section}"? Its ${fieldCount} field(s) will move to "${moveTo}".`
                    : `Delete section "${section}"?`
                )
              ) {
                return;
              }
              onRunAction(
                () =>
                  deleteFormSection({
                    audience,
                    form_group: "profile",
                    title: section,
                    moveTo,
                  }),
                "Section deleted"
              );
            }}
            footer={
              <AddFieldButton
                pending={pending}
                audience={audience}
                formGroup="profile"
                section={section}
                accent="border-slate-300 bg-white hover:bg-slate-50"
                onRunAction={onRunAction}
                pickSection={sectionOptions}
              />
            }
          >
            {children}
          </CollapsibleSectionShell>
        )}
        renderField={(field, { dragHandleProps, isDragging }) => (
          <FieldRow
            field={field}
            pending={pending}
            side={audience}
            isDragging={isDragging}
            dragHandle={
              <FieldDragHandle {...dragHandleProps} disabled={dragDisabled} />
            }
            onRunAction={onRunAction}
          />
        )}
      />
      <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-4">
        <AddSectionButton
          pending={pending}
          audience={audience}
          formGroup="profile"
          onRunAction={onRunAction}
        />
        <AddFieldButton
          pending={pending}
          audience={audience}
          formGroup="profile"
          section={sectionOptions[0] ?? "Additional information"}
          accent="border-slate-300 bg-white hover:bg-slate-50"
          onRunAction={onRunAction}
          pickSection={sectionOptions}
        />
      </div>
    </div>
  );
}

function CollapsibleSectionShell({
  title,
  fieldCount,
  children,
  footer,
  pending = false,
  canDelete = true,
  deleteDisabledReason,
  sectionDragHandle,
  dragDisabled = false,
  onRename,
  onDelete,
}: {
  title: string;
  fieldCount: number;
  children: ReactNode;
  footer?: ReactNode;
  pending?: boolean;
  canDelete?: boolean;
  deleteDisabledReason?: string;
  sectionDragHandle?: HTMLAttributes<HTMLButtonElement>;
  dragDisabled?: boolean;
  onRename?: (nextTitle: string) => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  function cancelEdit() {
    setDraftTitle(title);
    setEditing(false);
  }

  function saveEdit() {
    const next = draftTitle.trim();
    if (!next) {
      toast.error("Section name cannot be empty.");
      return;
    }
    if (next === title) {
      setEditing(false);
      return;
    }
    onRename?.(next);
    setEditing(false);
  }

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex items-start gap-2 bg-slate-50/80 px-4 py-3 sm:px-5">
        {sectionDragHandle ? (
          <FieldDragHandle
            {...sectionDragHandle}
            disabled={dragDisabled || pending}
            className="mt-0.5"
            title="Drag to reorder section"
          />
        ) : null}
        {editing ? (
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={draftTitle}
              disabled={pending}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
              className="h-9 rounded-lg text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 rounded-lg px-2 text-xs"
                disabled={pending}
                onClick={saveEdit}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 rounded-lg px-2 text-xs"
                disabled={pending}
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="min-w-0 flex-1 text-left transition-colors hover:opacity-90"
          >
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-slate-600">{fieldCount} fields</p>
          </button>
        )}
        <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
          {onRename ? (
            <IconActionButton
              pending={pending}
              title="Rename section"
              onClick={() => {
                setDraftTitle(title);
                setEditing(true);
                setOpen(true);
              }}
              icon={Pencil}
            />
          ) : null}
          {onDelete ? (
            <IconActionButton
              pending={pending || !canDelete}
              title={canDelete ? "Delete section" : deleteDisabledReason || "Cannot delete section"}
              destructive
              onClick={onDelete}
              icon={Trash2}
            />
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70"
            title={open ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>
      </div>
      {open ? (
        <div className="space-y-3 p-4">
          {children}
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function AddSectionButton({
  pending,
  audience,
  formGroup,
  onRunAction,
}: {
  pending: boolean;
  audience: "candidate" | "employer";
  formGroup: "profile" | "job";
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  function add() {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Enter a section name.");
      return;
    }
    onRunAction(
      () =>
        createFormSection({
          audience,
          form_group: formGroup,
          title: trimmed,
        }),
      "Section added"
    );
    setTitle("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-10 w-full justify-center rounded-xl border-dashed text-sm"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add section
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">New section</p>
      <Input
        value={title}
        disabled={pending}
        placeholder="Section name, e.g. Licenses"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        className="mb-3 h-9 rounded-lg text-sm"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" className="h-8 flex-1 rounded-lg" disabled={pending} onClick={add}>
          Add section
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 rounded-lg"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
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
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white",
          accent
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-600">{count} fields</p>
      </div>
      <Badge className={cn("shrink-0", badgeClass)}>{count}</Badge>
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
      .filter((group) => group.fields.length > 0 || !search);
  }, [sections, search, showHidden]);

  const totalVisible = filteredSections.reduce((n, group) => n + group.fields.length, 0);
  const dragDisabled = pending || Boolean(search);
  const sectionOptions = sections.map((group) => group.section);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="mt-0.5 text-sm text-slate-600">{description}</p>
          </div>
          <Badge variant="secondary" className="border border-slate-200 bg-slate-50 text-slate-800">
            {totalVisible} fields shown
          </Badge>
        </div>
      </div>

      {search ? (
        <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Clear search to drag sections or fields.
        </p>
      ) : null}

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
        <SortableFormFieldSections
          key={formFieldGroupsSignature(filteredSections)}
          groups={filteredSections}
          disabled={dragDisabled}
          onReorder={(updates) =>
            onRunAction(() => reorderFormFields(updates), "Field order saved")
          }
          onSectionReorder={(titles) =>
            onRunAction(
              () =>
                reorderFormSections({
                  audience,
                  form_group: formGroup,
                  titles,
                }),
              "Section order saved"
            )
          }
          renderSectionChrome={({ section, fieldCount, children, sectionDragHandle }) => {
            const hasBuiltIn = sections
              .find((group) => group.section === section)
              ?.fields.some((field) => !field.is_custom);
            const protectedJob = formGroup === "job" && (isProtectedJobSectionTitle(section) || hasBuiltIn);
            return (
              <CollapsibleSectionShell
                key={section}
                title={section}
                fieldCount={fieldCount}
                pending={pending}
                sectionDragHandle={sectionDragHandle}
                dragDisabled={dragDisabled}
                canDelete={!protectedJob}
                deleteDisabledReason={
                  protectedJob
                    ? "Built-in job sections can’t be deleted"
                    : undefined
                }
                onRename={(nextTitle) =>
                  onRunAction(
                    () =>
                      renameFormSection({
                        audience,
                        form_group: formGroup,
                        from: section,
                        to: nextTitle,
                      }),
                    "Section renamed"
                  )
                }
                onDelete={
                  protectedJob
                    ? undefined
                    : () => {
                        const moveTo =
                          sectionOptions.find((name) => name !== section) ??
                          sectionOptions[0] ??
                          "Additional fields";
                        if (
                          !window.confirm(
                            fieldCount > 0
                              ? `Delete section "${section}"? Its ${fieldCount} field(s) will move to "${moveTo}".`
                              : `Delete section "${section}"?`
                          )
                        ) {
                          return;
                        }
                        onRunAction(
                          () =>
                            deleteFormSection({
                              audience,
                              form_group: formGroup,
                              title: section,
                              moveTo,
                            }),
                          "Section deleted"
                        );
                      }
                }
                footer={
                  <AddFieldButton
                    pending={pending}
                    audience={audience}
                    formGroup={formGroup}
                    section={section}
                    accent="border-slate-300 bg-white hover:bg-slate-50"
                    onRunAction={onRunAction}
                    pickSection={sectionOptions}
                  />
                }
              >
                {children}
              </CollapsibleSectionShell>
            );
          }}
          renderField={(field, { dragHandleProps, isDragging }) => (
            <FieldRow
              field={field}
              pending={pending}
              side={audience}
              isDragging={isDragging}
              dragHandle={<FieldDragHandle {...dragHandleProps} disabled={dragDisabled} />}
              onRunAction={onRunAction}
            />
          )}
        />
      )}

      <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
        <AddSectionButton
          pending={pending}
          audience={audience}
          formGroup={formGroup}
          onRunAction={onRunAction}
        />
        <AddFieldButton
          pending={pending}
          audience={audience}
          formGroup={formGroup}
          section={sections[0]?.section ?? "Job Fields"}
          accent="border-slate-300 bg-white hover:bg-slate-50"
          onRunAction={onRunAction}
          pickSection={sectionOptions}
        />
      </div>
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
      className={cn("border px-1.5 py-0 text-[11px] font-medium", FIELD_TYPE_STYLES[type] ?? FIELD_TYPE_STYLES.text)}
    >
      {type}
    </Badge>
  );
}

function DropdownOptionsPreview({ field }: { field: FormFieldDefinition }) {
  const options = resolveSelectOptions(field);
  const [expanded, setExpanded] = useState(false);

  if (field.field_type !== "select") return null;

  if (options.length === 0) {
    return (
      <p className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
        No dropdown options set yet. Edit this field to add them.
      </p>
    );
  }

  const visible = expanded ? options : options.slice(0, 6);
  const hiddenCount = options.length - visible.length;

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
      <p className="mb-1.5 text-[11px] font-medium text-slate-600">
        Dropdown options ({options.length})
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {visible.map((option) => (
          <li
            key={option}
            className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-700"
          >
            {option}
          </li>
        ))}
      </ul>
      {options.length > 6 ? (
        <button
          type="button"
          className="mt-1.5 text-[11px] font-medium text-sky-700 hover:text-sky-900"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show fewer" : `Show all ${options.length} options`}
          {!expanded && hiddenCount > 0 ? ` (+${hiddenCount})` : ""}
        </button>
      ) : null}
    </div>
  );
}

function FieldRow({
  field,
  pending,
  compact = false,
  side = "candidate",
  className,
  dragHandle,
  isDragging = false,
  onRunAction,
}: {
  field: FormFieldDefinition;
  pending: boolean;
  compact?: boolean;
  side?: "candidate" | "employer";
  className?: string;
  dragHandle?: ReactNode;
  isDragging?: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(field.label);
  const [fieldType, setFieldType] = useState<FormFieldType>(field.field_type);
  const [optionsText, setOptionsText] = useState(
    optionsToText(resolveSelectOptions(field))
  );
  const [isRequired, setIsRequired] = useState(field.is_required);
  const [employerDisclosureMode, setEmployerDisclosureMode] = useState(
    field.employer_disclosure_mode
  );

  const sideAccent =
    side === "candidate"
      ? "border-l-sky-500 hover:border-sky-300"
      : "border-l-teal-500 hover:border-teal-300";

  function cancel() {
    setLabel(field.label);
    setFieldType(field.field_type);
    setOptionsText(optionsToText(resolveSelectOptions(field)));
    setIsRequired(field.is_required);
    setEmployerDisclosureMode(field.employer_disclosure_mode);
    setEditing(false);
  }

  function save() {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Label cannot be empty.");
      return;
    }
    const options = fieldType === "select" ? parseOptionsText(optionsText) : null;
    if (fieldType === "select" && options.length === 0) {
      toast.error("Add at least one dropdown option (one per line).");
      return;
    }
    onRunAction(
      () =>
        saveFormField(
          buildFormData(field, {
            label: trimmed,
            field_type: fieldType,
            options,
            is_required: isRequired,
            employer_disclosure_mode: employerDisclosureMode,
          }),
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
          "flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5",
          compact && "border-l-4",
          compact && sideAccent,
          isDragging && "opacity-60"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {dragHandle}
          <div className="min-w-0">
            <p className="break-words text-sm font-medium text-slate-700">{field.label}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">Hidden from form</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 rounded-lg px-2.5 text-xs"
          disabled={pending}
          onClick={() => onRunAction(() => toggleFormFieldActive(field.id, true), "Field shown")}
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
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
        <label className="mb-3 block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Label</span>
          <Input
            value={label}
            disabled={pending}
            onChange={(e) => setLabel(e.target.value)}
            className="h-9 rounded-lg text-sm"
            autoFocus
          />
        </label>
        <label className="mb-3 block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Input type</span>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as FormFieldType)}
            disabled={pending}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            {FORM_FIELD_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {fieldType === "select" && (
          <label className="mb-3 block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">
              Dropdown options (one per line)
            </span>
            <Textarea
              value={optionsText}
              disabled={pending}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={5}
              placeholder={"Option A\nOption B\nOption C"}
              className="rounded-lg text-sm"
            />
          </label>
        )}
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
        {side === "candidate" && (
          <label className="mb-3 block text-sm text-slate-600">
            <span className="mb-1.5 block font-medium text-slate-700">
              After unlock (paid profile / report)
            </span>
            <select
              value={employerDisclosureMode}
              onChange={(e) =>
                setEmployerDisclosureMode(e.target.value as EmployerDisclosureMode)
              }
              disabled={pending}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {DISCLOSURE_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-xs text-slate-500">
              {DISCLOSURE_MODE_OPTIONS.find((option) => option.value === employerDisclosureMode)
                ?.hint}
            </span>
          </label>
        )}
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
          !field.is_active && "border-dashed bg-slate-50",
          isDragging && "opacity-60",
          className
        )}
      >
        <div className="flex items-start gap-2">
          {dragHandle}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="break-words text-sm font-semibold leading-snug text-slate-900">
                {field.label}
              </p>
              {field.is_required && (
                <Badge className="h-5 border border-rose-300 bg-rose-50 px-1.5 text-[11px] font-medium text-rose-800 hover:bg-rose-50">
                  Required
                </Badge>
              )}
              {field.is_custom && (
                <Badge className="h-5 border border-amber-300 bg-amber-50 px-1.5 text-[11px] font-medium text-amber-900 hover:bg-amber-50">
                  Custom
                </Badge>
              )}
              {side === "candidate" && (
                <Badge
                  className={cn(
                    "h-5 border px-1.5 text-[11px] font-medium",
                    field.employer_disclosure_mode === "admin_removed"
                      ? "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-50"
                      : field.employer_disclosure_mode === "always_visible"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-50"
                        : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-50"
                  )}
                >
                  {unlockedVisibilityCopy(field.employer_disclosure_mode).badge}
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <FieldTypeBadge type={field.field_type} />
              {field.field_type === "select" && (
                <span className="text-[11px] text-slate-500">
                  {resolveSelectOptions(field).length} options
                </span>
              )}
              <span className="font-mono text-[11px] text-slate-500">{field.field_key}</span>
            </div>
            <DropdownOptionsPreview field={field} />
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconActionButton
              pending={pending}
              title="Edit field"
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
            {side === "candidate" && (
              <IconActionButton
                pending={pending}
                title={
                  field.employer_disclosure_mode === "admin_removed"
                    ? "Show after unlock"
                    : "Keep private after unlock"
                }
                onClick={() => {
                  const nextMode: EmployerDisclosureMode =
                    field.employer_disclosure_mode === "admin_removed"
                      ? "always_visible"
                      : "admin_removed";
                  onRunAction(
                    () => updateEmployerDisclosureMode(field.id, nextMode),
                    nextMode === "admin_removed"
                      ? "Kept private after unlock"
                      : "Shown after unlock"
                  );
                }}
                icon={field.employer_disclosure_mode === "admin_removed" ? Eye : EyeOff}
              />
            )}
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
        !field.is_active && "border-dashed bg-slate-50",
        isDragging && "opacity-60",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {dragHandle}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-900">{field.label}</p>
              {field.is_required && (
                <Badge className="h-5 border border-rose-300 bg-rose-50 px-1.5 text-[11px] font-medium text-rose-800 hover:bg-rose-50">
                  Required
                </Badge>
              )}
              {field.is_custom && (
                <Badge className="h-5 border border-amber-300 bg-amber-50 px-1.5 text-[11px] font-medium text-amber-900 hover:bg-amber-50">
                  Custom
                </Badge>
              )}
              {side === "candidate" && (
                <Badge
                  className={cn(
                    "h-5 border px-1.5 text-[11px] font-medium",
                    field.employer_disclosure_mode === "admin_removed"
                      ? "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-50"
                      : field.employer_disclosure_mode === "always_visible"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-50"
                        : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-50"
                  )}
                >
                  {unlockedVisibilityCopy(field.employer_disclosure_mode).badge}
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <FieldTypeBadge type={field.field_type} />
              {field.field_type === "select" && (
                <span className="text-[11px] text-slate-500">
                  {resolveSelectOptions(field).length} options
                </span>
              )}
              <span className="font-mono text-[11px] text-slate-500">{field.field_key}</span>
            </div>
            <DropdownOptionsPreview field={field} />
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
        {side === "candidate" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-lg px-2 text-[10px]"
            disabled={pending}
            onClick={() => {
              const nextMode: EmployerDisclosureMode =
                field.employer_disclosure_mode === "admin_removed"
                  ? "always_visible"
                  : "admin_removed";
              onRunAction(
                () => updateEmployerDisclosureMode(field.id, nextMode),
                nextMode === "admin_removed"
                  ? "Kept private after unlock"
                  : "Shown after unlock"
              );
            }}
          >
            {field.employer_disclosure_mode === "admin_removed" ? (
              <>
                <Eye className="mr-1 h-3 w-3" />
                Show after unlock
              </>
            ) : (
              <>
                <EyeOff className="mr-1 h-3 w-3" />
                Keep private
              </>
            )}
          </Button>
        )}
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
  const [fieldType, setFieldType] = useState<FormFieldType>("text");
  const [optionsText, setOptionsText] = useState("");
  const [isRequired, setIsRequired] = useState(false);

  function add() {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Enter a field label first.");
      return;
    }
    const options = fieldType === "select" ? parseOptionsText(optionsText) : null;
    if (fieldType === "select" && options.length === 0) {
      toast.error("Add at least one dropdown option (one per line).");
      return;
    }
    onRunAction(
      () =>
        createFormField({
          audience,
          form_group: formGroup,
          section: targetSection,
          label: trimmed,
          field_type: fieldType,
          options,
          is_required: isRequired,
        }),
      "Field added"
    );
    setLabel("");
    setFieldType("text");
    setOptionsText("");
    setIsRequired(false);
    setTargetSection(section);
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={cn("h-10 min-h-10 w-full flex-1 justify-center rounded-xl border-dashed text-sm", accent)}
        disabled={pending}
        onClick={() => {
          setTargetSection(section);
          setOpen(true);
        }}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add field
      </Button>
    );
  }

  return (
    <div className={cn("flex w-full flex-col rounded-xl border border-dashed p-4", accent)}>
      <p className="mb-3 text-sm font-semibold text-slate-700">New custom field</p>
      {pickSection && pickSection.length > 1 && (
        <label className="mb-3 block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Section</span>
          <select
            value={targetSection}
            onChange={(e) => setTargetSection(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            {pickSection.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="mb-3 block space-y-1.5">
        <span className="text-xs font-medium text-slate-600">Label</span>
        <Input
          value={label}
          disabled={pending}
          placeholder="Field label, e.g. Portfolio URL"
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="h-9 rounded-lg text-sm"
          autoFocus
        />
      </label>
      <label className="mb-3 block space-y-1.5">
        <span className="text-xs font-medium text-slate-600">Input type</span>
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as FormFieldType)}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
        >
          {FORM_FIELD_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {fieldType === "select" && (
        <label className="mb-3 block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">
            Dropdown options (one per line)
          </span>
          <Textarea
            value={optionsText}
            disabled={pending}
            onChange={(e) => setOptionsText(e.target.value)}
            rows={4}
            placeholder={"Option A\nOption B\nOption C"}
            className="rounded-lg text-sm"
          />
        </label>
      )}
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
          variant="ghost"
          className="h-8 rounded-lg"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

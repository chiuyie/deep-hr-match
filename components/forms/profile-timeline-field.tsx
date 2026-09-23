"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TagInput } from "@/components/forms/tag-input";
import { HIGHEST_EDUCATION_OPTIONS } from "@/lib/constants/candidate-profile-options";
import { SKILL_MAX_LENGTH, SKILL_SUGGESTIONS } from "@/lib/constants/profile-tags";
import { cn } from "@/lib/utils";
import type {
  EducationHistoryEntry,
  VolunteerExperienceEntry,
  WorkExperienceEntry,
} from "@/lib/constants/profile-history";
import {
  EMPTY_EDUCATION,
  EMPTY_VOLUNTEER,
  EMPTY_WORK_EXPERIENCE,
  EDUCATION_HISTORY_MAX_COUNT,
  HISTORY_COMPANY_MAX_LENGTH,
  HISTORY_DESCRIPTION_MAX_LENGTH,
  HISTORY_ORG_MAX_LENGTH,
  HISTORY_SCHOOL_MAX_LENGTH,
  HISTORY_TITLE_MAX_LENGTH,
  ENTRY_SKILLS_MAX_COUNT,
  OTHER_EXPERIENCE_KINDS,
  VOLUNTEER_EXPERIENCE_MAX_COUNT,
  WORK_EXPERIENCE_MAX_COUNT,
  otherExperienceFieldLabels,
  otherExperienceKindLabel,
} from "@/lib/constants/profile-history";

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-sky-500/20";

const DATE_MONTHS = [
  ["01", "January"],
  ["02", "February"],
  ["03", "March"],
  ["04", "April"],
  ["05", "May"],
  ["06", "June"],
  ["07", "July"],
  ["08", "August"],
  ["09", "September"],
  ["10", "October"],
  ["11", "November"],
  ["12", "December"],
] as const;

const DATE_YEARS = Array.from({ length: 72 }, (_, index) => String(new Date().getFullYear() + 1 - index));

function splitYearMonth(value: string): { year: string; month: string } {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return match ? { year: match[1] ?? "", month: match[2] ?? "" } : { year: "", month: "" };
}

function YearMonthControl({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const parsed = splitYearMonth(value);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    const next = splitYearMonth(value);
    setMonth(next.month);
    setYear(next.year);
  }, [value]);

  const partial = (month && !year) || (!month && year);

  function update(nextMonth: string, nextYear: string) {
    setMonth(nextMonth);
    setYear(nextYear);
    onChange(nextMonth && nextYear ? `${nextYear}-${nextMonth}` : "");
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label={`${label} month`}
          value={month}
          disabled={disabled}
          onChange={(event) => update(event.target.value, year)}
          className={cn(inputClass, "w-full px-3 text-sm")}
        >
          <option value="">Month</option>
          {DATE_MONTHS.map(([month, name]) => (
            <option key={month} value={month}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} year`}
          value={year}
          disabled={disabled}
          onChange={(event) => update(month, event.target.value)}
          className={cn(inputClass, "w-full px-3 text-sm")}
        >
          <option value="">Year</option>
          {DATE_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      {partial ? <p className="text-xs text-slate-500">Choose both a month and a year.</p> : null}
    </div>
  );
}

function EntrySkills({
  id,
  values,
  onChange,
  disabled,
}: {
  id: string;
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-600">Skills from this experience</Label>
      <TagInput
        id={id}
        name={id}
        label="Skills"
        values={values}
        suggestions={SKILL_SUGGESTIONS}
        allowCustom
        maxItems={ENTRY_SKILLS_MAX_COUNT}
        maxItemLength={SKILL_MAX_LENGTH}
        placeholder="Add a skill and press Enter"
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

type WorkProps = {
  id?: string;
  name: string;
  label: string;
  values: WorkExperienceEntry[];
  onChange: (next: WorkExperienceEntry[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
};

type EducationProps = {
  id?: string;
  name: string;
  label: string;
  values: EducationHistoryEntry[];
  onChange: (next: EducationHistoryEntry[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
};

type VolunteerProps = {
  id?: string;
  name: string;
  label: string;
  values: VolunteerExperienceEntry[];
  onChange: (next: VolunteerExperienceEntry[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
};

function MonthFields({
  start,
  end,
  isCurrent,
  onStart,
  onEnd,
  onCurrent,
  disabled,
  currentLabel = "I currently do this",
}: {
  start: string;
  end: string;
  isCurrent: boolean;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onCurrent: (v: boolean) => void;
  disabled?: boolean;
  currentLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <YearMonthControl
          label="Started"
          value={start}
          disabled={disabled}
          onChange={(next) => {
            onStart(next);
            if (!isCurrent && end && next && end < next) onEnd("");
          }}
        />
        {isCurrent ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Ended</Label>
            <p className="flex h-10 items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
              Present
            </p>
          </div>
        ) : (
          <YearMonthControl label="Ended" value={end} disabled={disabled} onChange={onEnd} />
        )}
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <Checkbox
          checked={isCurrent}
          disabled={disabled}
          onCheckedChange={(checked) => onCurrent(checked === true)}
        />
        {currentLabel}
      </label>
    </div>
  );
}

export function WorkExperienceField({
  id,
  name,
  label,
  values,
  onChange,
  disabled,
  invalid,
  required,
}: WorkProps) {
  function update(index: number, patch: Partial<WorkExperienceEntry>) {
    onChange(values.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3" aria-invalid={invalid || undefined} aria-required={required || undefined}>
      <input type="hidden" id={id} name={name} value={JSON.stringify(values)} aria-label={label} />
      {values.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
          No roles added yet. Add your work history so employers can see your career path.
        </p>
      ) : null}
      {values.map((row, index) => (
        <div
          key={index}
          className={cn(
            "space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
            invalid && "border-rose-300"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Role {index + 1}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Company</Label>
              <Input
                value={row.company}
                disabled={disabled}
                maxLength={HISTORY_COMPANY_MAX_LENGTH}
                onChange={(e) => update(index, { company: e.target.value })}
                className={inputClass}
                placeholder="Organisation name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Job title</Label>
              <Input
                value={row.title}
                disabled={disabled}
                maxLength={HISTORY_TITLE_MAX_LENGTH}
                onChange={(e) => update(index, { title: e.target.value })}
                className={inputClass}
                placeholder="Your title"
              />
            </div>
          </div>
          <MonthFields
            start={row.start_date}
            end={row.end_date}
            isCurrent={row.is_current}
            disabled={disabled}
            currentLabel="I currently work here"
            onStart={(start_date) => update(index, { start_date })}
            onEnd={(end_date) => update(index, { end_date })}
            onCurrent={(is_current) =>
              update(index, { is_current, end_date: is_current ? "" : row.end_date })
            }
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Description</Label>
            <Textarea
              value={row.description}
              disabled={disabled}
              maxLength={HISTORY_DESCRIPTION_MAX_LENGTH}
              onChange={(e) => update(index, { description: e.target.value })}
              className="min-h-[72px] resize-y rounded-xl border-slate-200 bg-white shadow-sm"
              placeholder="Key responsibilities and achievements"
            />
          </div>
          <EntrySkills
            id={`work-skills-${index}`}
            values={row.skills}
            disabled={disabled}
            onChange={(skills) => update(index, { skills })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={disabled || values.length >= WORK_EXPERIENCE_MAX_COUNT}
        className="rounded-xl"
        onClick={() => onChange([...values, { ...EMPTY_WORK_EXPERIENCE }])}
      >
        <Plus className="size-4" />
        Add work experience
      </Button>
    </div>
  );
}

export function EducationHistoryField({
  id,
  name,
  label,
  values,
  onChange,
  disabled,
  invalid,
  required,
}: EducationProps) {
  function update(index: number, patch: Partial<EducationHistoryEntry>) {
    onChange(values.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3" aria-invalid={invalid || undefined} aria-required={required || undefined}>
      <input type="hidden" id={id} name={name} value={JSON.stringify(values)} aria-label={label} />
      {values.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
          No schools added yet. Add degrees or programmes you’ve completed (or are completing).
        </p>
      ) : null}
      {values.map((row, index) => (
        <div
          key={index}
          className={cn(
            "space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
            invalid && "border-rose-300"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Education {index + 1}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">School / institution</Label>
            <Input
              value={row.school}
              disabled={disabled}
              maxLength={HISTORY_SCHOOL_MAX_LENGTH}
              onChange={(e) => update(index, { school: e.target.value })}
              className={inputClass}
              placeholder="University, polytechnic, school…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Degree / qualification</Label>
              <select
                value={row.degree}
                disabled={disabled}
                onChange={(e) =>
                  update(index, {
                    degree: e.target.value,
                    degree_other: e.target.value === "Other" ? row.degree_other : "",
                  })
                }
                className={cn(inputClass, "w-full px-3 text-sm")}
              >
                <option value="">Choose a qualification</option>
                {HIGHEST_EDUCATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {row.degree === "Other" ? (
                <Input
                  value={row.degree_other}
                  disabled={disabled}
                  maxLength={HISTORY_TITLE_MAX_LENGTH}
                  onChange={(e) => update(index, { degree_other: e.target.value })}
                  className={cn(inputClass, "mt-2")}
                  placeholder="Type the qualification"
                />
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Field of study</Label>
              <Input
                value={row.field_of_study}
                disabled={disabled}
                maxLength={HISTORY_TITLE_MAX_LENGTH}
                onChange={(e) => update(index, { field_of_study: e.target.value })}
                className={inputClass}
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>
          <MonthFields
            start={row.start_date}
            end={row.end_date}
            isCurrent={row.is_current}
            disabled={disabled}
            currentLabel="I currently study here"
            onStart={(start_date) => update(index, { start_date })}
            onEnd={(end_date) => update(index, { end_date })}
            onCurrent={(is_current) =>
              update(index, { is_current, end_date: is_current ? "" : row.end_date })
            }
          />
          <EntrySkills
            id={`education-skills-${index}`}
            values={row.skills}
            disabled={disabled}
            onChange={(skills) => update(index, { skills })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={disabled || values.length >= EDUCATION_HISTORY_MAX_COUNT}
        className="rounded-xl"
        onClick={() => onChange([...values, { ...EMPTY_EDUCATION }])}
      >
        <Plus className="size-4" />
        Add education experience
      </Button>
    </div>
  );
}

export function VolunteerExperienceField({
  id,
  name,
  label,
  values,
  onChange,
  disabled,
  invalid,
  required,
}: VolunteerProps) {
  function update(index: number, patch: Partial<VolunteerExperienceEntry>) {
    onChange(values.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3" aria-invalid={invalid || undefined} aria-required={required || undefined}>
      <input type="hidden" id={id} name={name} value={JSON.stringify(values)} aria-label={label} />
      {values.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
          Optional. Add volunteering, projects, clubs, or anything else outside jobs and study.
        </p>
      ) : null}
      {values.map((row, index) => {
        const labels = otherExperienceFieldLabels(row.kind);
        return (
        <div
          key={index}
          className={cn(
            "space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
            invalid && "border-rose-300"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {otherExperienceKindLabel(row.kind)} {index + 1}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Type</Label>
            <select
              value={row.kind}
              disabled={disabled}
              onChange={(e) =>
                update(index, {
                  kind: e.target.value as VolunteerExperienceEntry["kind"],
                })
              }
              className={cn(inputClass, "w-full px-3 text-sm")}
            >
              {OTHER_EXPERIENCE_KINDS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">{labels.name}</Label>
              <Input
                value={row.organization}
                disabled={disabled}
                maxLength={HISTORY_ORG_MAX_LENGTH}
                placeholder={labels.namePlaceholder}
                onChange={(e) => update(index, { organization: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">{labels.role}</Label>
              <Input
                value={row.role}
                disabled={disabled}
                maxLength={HISTORY_TITLE_MAX_LENGTH}
                onChange={(e) => update(index, { role: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <MonthFields
            start={row.start_date}
            end={row.end_date}
            isCurrent={row.is_current}
            disabled={disabled}
            currentLabel={labels.current}
            onStart={(start_date) => update(index, { start_date })}
            onEnd={(end_date) => update(index, { end_date })}
            onCurrent={(is_current) =>
              update(index, { is_current, end_date: is_current ? "" : row.end_date })
            }
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Description</Label>
            <Textarea
              value={row.description}
              disabled={disabled}
              maxLength={HISTORY_DESCRIPTION_MAX_LENGTH}
              onChange={(e) => update(index, { description: e.target.value })}
              className="min-h-[72px] resize-y rounded-xl border-slate-200 bg-white shadow-sm"
            />
          </div>
          <EntrySkills
            id={`other-skills-${index}`}
            values={row.skills}
            disabled={disabled}
            onChange={(skills) => update(index, { skills })}
          />
        </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        disabled={disabled || values.length >= VOLUNTEER_EXPERIENCE_MAX_COUNT}
        className="rounded-xl"
        onClick={() => onChange([...values, { ...EMPTY_VOLUNTEER }])}
      >
        <Plus className="size-4" />
        Add volunteering, project, or other experience
      </Button>
    </div>
  );
}

"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  VOLUNTEER_EXPERIENCE_MAX_COUNT,
  WORK_EXPERIENCE_MAX_COUNT,
} from "@/lib/constants/profile-history";

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-sky-500/20";

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
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Start (month)</Label>
          <Input
            type="month"
            value={start}
            disabled={disabled}
            onChange={(e) => onStart(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">End (month)</Label>
          <Input
            type="month"
            value={isCurrent ? "" : end}
            disabled={disabled || isCurrent}
            onChange={(e) => onEnd(e.target.value)}
            className={inputClass}
          />
        </div>
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
              onChange={(e) => update(index, { description: e.target.value })}
              className="min-h-[72px] resize-y rounded-xl border-slate-200 bg-white shadow-sm"
              placeholder="Key responsibilities and achievements"
            />
          </div>
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
              onChange={(e) => update(index, { school: e.target.value })}
              className={inputClass}
              placeholder="University, polytechnic, school…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Degree / qualification</Label>
              <Input
                value={row.degree}
                disabled={disabled}
                onChange={(e) => update(index, { degree: e.target.value })}
                className={inputClass}
                placeholder="e.g. Bachelor's, Diploma"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Field of study</Label>
              <Input
                value={row.field_of_study}
                disabled={disabled}
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
        Add education
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
          Optional — add volunteer, club, or extracurricular roles.
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
            <p className="text-sm font-semibold text-slate-900">Activity {index + 1}</p>
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
              <Label className="text-xs text-slate-600">Organisation</Label>
              <Input
                value={row.organization}
                disabled={disabled}
                onChange={(e) => update(index, { organization: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Role</Label>
              <Input
                value={row.role}
                disabled={disabled}
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
            currentLabel="I currently do this"
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
              onChange={(e) => update(index, { description: e.target.value })}
              className="min-h-[72px] resize-y rounded-xl border-slate-200 bg-white shadow-sm"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={disabled || values.length >= VOLUNTEER_EXPERIENCE_MAX_COUNT}
        className="rounded-xl"
        onClick={() => onChange([...values, { ...EMPTY_VOLUNTEER }])}
      >
        <Plus className="size-4" />
        Add volunteer / extracurricular
      </Button>
    </div>
  );
}

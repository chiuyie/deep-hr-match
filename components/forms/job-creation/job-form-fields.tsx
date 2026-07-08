"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface JobFormSectionProps {
  id: string;
  title: string;
  description?: string;
  icon: ReactNode;
  gradient: string;
  children: ReactNode;
  className?: string;
}

export function JobFormSection({
  id,
  title,
  description,
  icon,
  gradient,
  children,
  className,
}: JobFormSectionProps) {
  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-24 mb-8 rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl",
        className
      )}
    >
      <div className="mb-8 flex items-start gap-4">
        <div className={cn("rounded-xl bg-gradient-to-br p-3 shadow-lg", gradient)}>{icon}</div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

interface JobTextFieldProps {
  label: string;
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  icon?: ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function JobTextField({
  label,
  name,
  value,
  placeholder,
  required,
  icon,
  onChange,
}: JobTextFieldProps) {
  return (
    <div className="group">
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 transition-colors group-focus-within:text-blue-500">
            {icon}
          </div>
        )}
        <input
          type="text"
          id={name}
          name={name}
          value={value ?? ""}
          placeholder={placeholder}
          required={required}
          onChange={onChange}
          className={cn(
            "mt-1 block w-full rounded-xl border border-slate-200 bg-white py-2.5 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm",
            icon ? "pl-10 pr-3" : "px-4"
          )}
        />
      </div>
    </div>
  );
}

interface JobTextareaFieldProps {
  label: string;
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function JobTextareaField({
  label,
  name,
  value,
  placeholder,
  required,
  onChange,
}: JobTextareaFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value ?? ""}
        placeholder={placeholder}
        required={required}
        rows={4}
        onChange={onChange}
        className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
      />
    </div>
  );
}

interface JobSelectFieldProps {
  label: string;
  name: string;
  value?: string;
  placeholder: string;
  options: readonly string[];
  required?: boolean;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function JobSelectField({
  label,
  name,
  value,
  placeholder,
  options,
  required,
  onChange,
}: JobSelectFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value ?? ""}
        required={required}
        onChange={onChange}
        className="mt-1 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

interface JobYesNoFieldProps {
  label: string;
  name: string;
  value?: boolean;
  icon?: ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function JobYesNoField({ label, name, value, icon, onChange }: JobYesNoFieldProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-slate-400">{icon}</div>}
          <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-4">
          {(["true", "false"] as const).map((option) => (
            <label key={option} className="group flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name={name}
                value={option}
                checked={value === (option === "true")}
                onChange={onChange}
                className="h-4 w-4 cursor-pointer rounded-full border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 transition-colors group-hover:text-slate-800">
                {option === "true" ? "Yes" : "No"}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

interface JobSearchSelectFieldProps {
  label: string;
  name: string;
  value?: string;
  options: string[];
  onChange: (event: { target: { name: string; value: string } }) => void;
}

export function JobSearchSelectField({
  label,
  name,
  value,
  options,
  onChange,
}: JobSearchSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const filtered = options.filter((option) => option.toLowerCase().includes(query.toLowerCase()));

  const selectOption = (option: string) => {
    onChange({ target: { name, value: option } });
    setOpen(false);
    setQuery("");
    setHighlightIndex(-1);
  };

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="mt-1 block min-h-[42px] w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        >
          <span className={cn("block break-words whitespace-normal", value ? "text-slate-900" : "text-slate-400")}>
            {value || "Search and select..."}
          </span>
        </button>
        {open && (
          <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 bg-slate-50 p-3">
              <input
                type="text"
                value={query}
                autoFocus
                placeholder="Search across all levels..."
                onChange={(event) => {
                  setQuery(event.target.value);
                  setHighlightIndex(-1);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setHighlightIndex((current) => Math.min(current + 1, filtered.length - 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setHighlightIndex((current) => Math.max(current - 1, -1));
                  } else if (event.key === "Enter" && highlightIndex >= 0) {
                    event.preventDefault();
                    selectOption(filtered[highlightIndex]);
                  } else if (event.key === "Escape") {
                    setOpen(false);
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length > 0 ? (
                filtered.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setHighlightIndex(index)}
                    className={cn(
                      "block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50",
                      (highlightIndex === index || value === option) && "bg-blue-50"
                    )}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-sm text-slate-500">No options found</div>
              )}
            </div>
          </div>
        )}
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/forms/searchable-select";
import {
  FieldInlineError,
  useProfileFormValidationOptional,
} from "@/components/forms/profile-form-validation-context";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import { WORLD_COUNTRY_BY_NAME } from "@/lib/constants/geo/world-countries.generated";
import { TagInput } from "@/components/forms/tag-input";
import { LanguageProficiencyField } from "@/components/forms/language-proficiency-field";
import {
  CERTIFICATION_MAX_LENGTH,
  CERTIFICATIONS_MAX_COUNT,
  CERTIFICATION_SUGGESTIONS,
  SKILL_MAX_LENGTH,
  SKILL_SUGGESTIONS,
  SKILLS_MAX_COUNT,
  type CandidateLanguageEntry,
} from "@/lib/constants/profile-tags";
import {
  parseLanguageEntriesInput,
  parseStringArrayInput,
  validateLanguagesList,
} from "@/lib/form-fields/profile-tags";
import { matchListedOption } from "@/lib/form-fields/candidate-field-validation";
import { resolveSelectOptions } from "@/lib/form-fields/select-options";
import {
  YEARS_OF_EXPERIENCE_MAX,
  YEARS_OF_EXPERIENCE_MIN,
  YEARS_OF_EXPERIENCE_STEP,
  formatYearsOfExperienceForInput,
  validateYearsOfExperienceValue,
} from "@/lib/form-fields/years-of-experience";
import { cn } from "@/lib/utils";
import {
  CANDIDATE_COUNTRIES,
  SALARY_CURRENCY_OPTIONS,
  countrySelectOptions,
  dialCodeForCountry,
  fetchCitiesForCountry,
  formatPhoneValue,
  formatSalaryValue,
  parsePhoneOptionValue,
  parseSalaryValue,
  parseStoredPhone,
  phoneDialSelectOptions,
  phoneOptionValueForIso,
  resolvePhoneInput,
} from "@/lib/constants/candidate-profile-options";

const countrySearchOptions = countrySelectOptions();
const phoneDialSearchOptions = phoneDialSelectOptions();

const selectClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const inputClassName =
  "h-11 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-sky-500/20";

const invalidInputClassName = "border-rose-400 focus-visible:ring-rose-500/20";

type Props = {
  field: FormFieldDefinition;
  defaultValue: string;
};

function useFieldTracking(fieldKey: string) {
  const validation = useProfileFormValidationOptional();
  const error = validation?.getError(fieldKey);
  const report = (value: string, options?: { reveal?: boolean }) => {
    validation?.setFieldValue(fieldKey, value, options);
  };
  return { error, report, invalid: Boolean(error) };
}

function FieldLabel({ field }: { field: FormFieldDefinition }) {
  return (
    <Label htmlFor={field.field_key} className="text-sm font-medium text-slate-700">
      {field.label}
      {field.is_required ? <span className="text-rose-500"> *</span> : null}
    </Label>
  );
}

function NativeSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  allowEmpty = true,
  invalid,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
  placeholder: string;
  required?: boolean;
  allowEmpty?: boolean;
  invalid?: boolean;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalid || undefined}
      className={cn(selectClassName, invalid && "border-rose-400 focus:ring-rose-500/20")}
    >
      {allowEmpty ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function PhoneField({ field, defaultValue }: Props) {
  const initial = parseStoredPhone(defaultValue);
  const [optionValue, setOptionValue] = useState(phoneOptionValueForIso(initial.isoCode));
  const [national, setNational] = useState(initial.national);
  const { error, report, invalid } = useFieldTracking(field.field_key);

  const selected = parsePhoneOptionValue(optionValue);
  const selectedIso = selected.isoCode ?? "SG";
  const resolved = resolvePhoneInput(national, selectedIso);
  const submitValue = resolved.valid
    ? resolved.e164
    : national.trim()
      ? formatPhoneValue(selected.dialCode, national)
      : "";

  useEffect(() => {
    report(submitValue, { reveal: Boolean(national.trim()) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync submit value only
  }, [submitValue]);

  const applyResolved = (nextNational: string, iso: typeof selectedIso) => {
    const next = resolvePhoneInput(nextNational, iso);
    if (next.isoCode !== iso) {
      setOptionValue(phoneOptionValueForIso(next.isoCode));
    }
    if (/^\+|00\d/.test(nextNational.trim().replace(/[\s()-]/g, ""))) {
      setNational(next.nationalDisplay || nextNational);
    } else {
      setNational(nextNational);
    }
  };

  const syncValidity = (el: HTMLInputElement, nextNational: string, iso: typeof selectedIso) => {
    if (field.is_required && !nextNational.trim()) {
      el.setCustomValidity("Phone number is required.");
      return;
    }
    if (!nextNational.trim()) {
      el.setCustomValidity("");
      return;
    }
    const result = resolvePhoneInput(nextNational, iso);
    el.setCustomValidity(result.valid ? "" : result.error ?? "Enter a valid phone number.");
  };

  return (
    <div className="space-y-2" data-field-key={field.field_key}>
      <FieldLabel field={field} />
      <input type="hidden" name={field.field_key} value={submitValue} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
        <SearchableSelect
          value={optionValue}
          onChange={(next) => {
            const parsed = parsePhoneOptionValue(next);
            const iso = parsed.isoCode ?? "SG";
            setOptionValue(next);
            applyResolved(national.replace(/[^\d\s+\-()]/g, ""), iso);
          }}
          options={phoneDialSearchOptions}
          placeholder="Country code"
          maxVisibleOptions={8}
        />
        <Input
          id={field.field_key}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          onChange={(e) => {
            applyResolved(e.target.value, selectedIso);
            syncValidity(e.target, e.target.value, selectedIso);
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (!pasted.trim()) return;
            e.preventDefault();
            const result = resolvePhoneInput(pasted, selectedIso);
            setOptionValue(phoneOptionValueForIso(result.isoCode));
            setNational(result.nationalDisplay || pasted.trim());
            const input = e.currentTarget;
            requestAnimationFrame(() => {
              syncValidity(input, result.nationalDisplay || pasted.trim(), result.isoCode);
            });
          }}
          onBlur={(e) => {
            const result = resolvePhoneInput(national, selectedIso);
            if (result.valid) {
              setNational(result.nationalDisplay);
              setOptionValue(phoneOptionValueForIso(result.isoCode));
            }
            syncValidity(e.target, national, selectedIso);
            report(
              result.valid ? result.e164 : national.trim() ? submitValue : "",
              { reveal: true }
            );
          }}
          placeholder="Phone number"
          className={cn(inputClassName, invalid && invalidInputClassName)}
          required={field.is_required}
          aria-invalid={invalid || undefined}
        />
      </div>
      <FieldInlineError message={error} />
      {!error ? (
        <p className="text-xs leading-relaxed text-slate-500">
          Pick a country (e.g. Singapore +65), then enter or paste your number.
        </p>
      ) : null}
    </div>
  );
}

function CountryCityFields({
  countryField,
  cityField,
  countryDefault,
  cityDefault,
}: {
  countryField: FormFieldDefinition;
  cityField: FormFieldDefinition;
  countryDefault: string;
  cityDefault: string;
}) {
  const countryTrack = useFieldTracking(countryField.field_key);
  const cityTrack = useFieldTracking(cityField.field_key);

  const countryIsListed = WORLD_COUNTRY_BY_NAME.has(countryDefault);
  const [country, setCountry] = useState(
    countryIsListed ? countryDefault : countryDefault ? "Other" : ""
  );
  const [countryOther, setCountryOther] = useState(countryIsListed ? "" : countryDefault);
  const countrySubmitValue = country === "Other" ? countryOther.trim() : country;

  const [cityOptions, setCityOptions] = useState<string[]>(["Other"]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [city, setCity] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [cityHydrated, setCityHydrated] = useState(false);
  const citySubmitValue = city === "Other" ? cityOther.trim() : city;

  function applyCountrySelection(nextCountry: string) {
    setCountry(nextCountry);
    if (nextCountry !== "Other") setCountryOther("");
    setCityHydrated(false);

    // Singapore city is always Singapore — set immediately (don't wait for the cities API).
    if (nextCountry === "Singapore") {
      setCityOptions(["Singapore"]);
      setCity("Singapore");
      setCityOther("");
      cityTrack.report("Singapore", { reveal: true });
    } else {
      setCity("");
      setCityOther("");
      cityTrack.report("", { reveal: false });
    }

    countryTrack.report(nextCountry === "Other" ? "" : nextCountry, { reveal: true });
  }

  useEffect(() => {
    countryTrack.report(countrySubmitValue, { reveal: Boolean(countrySubmitValue) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countrySubmitValue]);

  useEffect(() => {
    cityTrack.report(citySubmitValue, { reveal: Boolean(citySubmitValue) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySubmitValue]);

  useEffect(() => {
    const name = countrySubmitValue;
    if (!name) {
      setCityOptions(["Other"]);
      return;
    }
    // Already handled synchronously for Singapore.
    if (name === "Singapore") {
      setCityOptions(["Singapore"]);
      setCity((prev) => (prev === "Singapore" ? prev : "Singapore"));
      setCityOther("");
      setCitiesLoading(false);
      return;
    }

    let cancelled = false;
    setCitiesLoading(true);
    fetchCitiesForCountry(name)
      .then((cities) => {
        if (cancelled) return;
        setCityOptions(cities);
        if (cities.length === 1 && cities[0]) {
          setCity(cities[0]);
          setCityOther("");
        }
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countrySubmitValue]);

  useEffect(() => {
    if (cityHydrated || citiesLoading) return;
    if (countrySubmitValue === "Singapore") {
      setCity("Singapore");
      setCityOther("");
      setCityHydrated(true);
      return;
    }
    if (cityDefault && cityOptions.includes(cityDefault)) {
      setCity(cityDefault);
      setCityOther("");
    } else if (cityDefault) {
      setCity("Other");
      setCityOther(cityDefault);
    }
    setCityHydrated(true);
  }, [cityDefault, cityHydrated, cityOptions, citiesLoading, countrySubmitValue]);

  const citySearchOptions = useMemo(
    () => cityOptions.map((name) => ({ value: name, label: name })),
    [cityOptions]
  );

  return (
    <>
      <div className="space-y-2" data-field-key={countryField.field_key}>
        <FieldLabel field={countryField} />
        <input type="hidden" name={countryField.field_key} value={countrySubmitValue} />
        <SearchableSelect
          id={countryField.field_key}
          value={country}
          onChange={(next) => applyCountrySelection(next)}
          options={countrySearchOptions}
          placeholder="Search country"
          required={countryField.is_required}
          maxVisibleOptions={8}
        />
        {country === "Other" ? (
          <Input
            value={countryOther}
            onChange={(e) => {
              setCountryOther(e.target.value);
              countryTrack.report(e.target.value, { reveal: true });
            }}
            onBlur={() => {
              const listed = matchListedOption(countryOther, CANDIDATE_COUNTRIES);
              if (listed) {
                applyCountrySelection(listed);
                return;
              }
              countryTrack.report(countryOther, { reveal: true });
            }}
            placeholder="Type your country"
            className={cn(inputClassName, "mt-2", countryTrack.invalid && invalidInputClassName)}
            required={countryField.is_required}
            aria-invalid={countryTrack.invalid || undefined}
          />
        ) : null}
        <FieldInlineError message={countryTrack.error} />
      </div>
      <div className="space-y-2" data-field-key={cityField.field_key}>
        <FieldLabel field={cityField} />
        <input type="hidden" name={cityField.field_key} value={citySubmitValue} />
        <SearchableSelect
          id={cityField.field_key}
          value={city}
          onChange={(next) => {
            setCity(next);
            if (next !== "Other") setCityOther("");
            cityTrack.report(next === "Other" ? "" : next, { reveal: true });
          }}
          options={citySearchOptions}
          placeholder={
            citiesLoading
              ? "Loading cities…"
              : countrySubmitValue
                ? "Search city"
                : "Select country first"
          }
          required={cityField.is_required}
          disabled={!countrySubmitValue || citiesLoading}
          emptyMessage={citiesLoading ? "Loading…" : "No matches — choose Other"}
          maxVisibleOptions={8}
        />
        {city === "Other" ? (
          <Input
            value={cityOther}
            onChange={(e) => {
              setCityOther(e.target.value);
              cityTrack.report(e.target.value, { reveal: true });
            }}
            onBlur={() => {
              const listed = matchListedOption(cityOther, cityOptions);
              if (listed) {
                setCity(listed);
                setCityOther("");
                cityTrack.report(listed, { reveal: true });
                return;
              }
              cityTrack.report(cityOther, { reveal: true });
            }}
            placeholder="Type your city"
            className={cn(inputClassName, "mt-2", cityTrack.invalid && invalidInputClassName)}
            required={cityField.is_required}
            aria-invalid={cityTrack.invalid || undefined}
          />
        ) : null}
        <FieldInlineError message={cityTrack.error} />
        {!cityTrack.error && countrySubmitValue && !citiesLoading && cityOptions.length > 1 ? (
          <p className="text-xs leading-relaxed text-slate-500">
            {cityOptions.includes("Other") ? cityOptions.length - 1 : cityOptions.length} locations
            — search or pick Other to type your own.
          </p>
        ) : null}
      </div>
    </>
  );
}

function CountrySearchField({ field, defaultValue }: Props) {
  const countryIsListed = WORLD_COUNTRY_BY_NAME.has(defaultValue);
  const [country, setCountry] = useState(
    countryIsListed ? defaultValue : defaultValue ? "Other" : ""
  );
  const [countryOther, setCountryOther] = useState(countryIsListed ? "" : defaultValue);
  const submitValue = country === "Other" ? countryOther.trim() : country;
  const { error, report, invalid } = useFieldTracking(field.field_key);

  useEffect(() => {
    report(submitValue, { reveal: Boolean(submitValue) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitValue]);

  return (
    <div className="space-y-2" data-field-key={field.field_key}>
      <FieldLabel field={field} />
      <input type="hidden" name={field.field_key} value={submitValue} />
      <SearchableSelect
        id={field.field_key}
        value={country}
        onChange={(next) => {
          setCountry(next);
          if (next !== "Other") setCountryOther("");
          report(next === "Other" ? "" : next, { reveal: true });
        }}
        options={countrySearchOptions}
        placeholder="Search country"
        required={field.is_required}
        maxVisibleOptions={8}
      />
      {country === "Other" ? (
        <Input
          value={countryOther}
          onChange={(e) => {
            setCountryOther(e.target.value);
            report(e.target.value, { reveal: true });
          }}
          onBlur={() => {
            const listed = matchListedOption(countryOther, CANDIDATE_COUNTRIES);
            if (listed) {
              setCountry(listed);
              setCountryOther("");
              report(listed, { reveal: true });
              return;
            }
            report(countryOther, { reveal: true });
          }}
          placeholder="Type your country"
          className={cn(inputClassName, "mt-2", invalid && invalidInputClassName)}
          required={field.is_required}
          aria-invalid={invalid || undefined}
        />
      ) : null}
      <FieldInlineError message={error} />
    </div>
  );
}

function YearsOfExperienceField({ field, defaultValue }: Props) {
  const [text, setText] = useState(formatYearsOfExperienceForInput(defaultValue));
  const { error, report, invalid } = useFieldTracking(field.field_key);

  const parsed = validateYearsOfExperienceValue(text, {
    required: field.is_required,
    label: field.label,
  });
  const submitValue =
    parsed.ok === true && parsed.value !== null ? String(parsed.value) : text.trim();

  useEffect(() => {
    report(submitValue, { reveal: Boolean(text.trim()) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitValue]);

  function sanitizeTyping(next: string): string {
    // Allow only digits and a single dot while typing; block e/E/+/-/,/letters/emoji.
    let cleaned = next.replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
      cleaned =
        cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
      // Only one decimal digit, and only 0 or 5 once complete-ish
      const [whole, frac = ""] = cleaned.split(".");
      cleaned = `${whole}.${frac.slice(0, 1)}`;
    }
    // Prevent absurd length while typing
    if (cleaned.replace(".", "").length > 4) {
      return text;
    }
    return cleaned;
  }

  return (
    <div className="space-y-2" data-field-key={field.field_key}>
      <FieldLabel field={field} />
      <input type="hidden" name={field.field_key} value={submitValue} />
      <Input
        id={field.field_key}
        type="number"
        inputMode="decimal"
        min={YEARS_OF_EXPERIENCE_MIN}
        max={YEARS_OF_EXPERIENCE_MAX}
        step={YEARS_OF_EXPERIENCE_STEP}
        autoComplete="off"
        spellCheck={false}
        value={text}
        placeholder={`e.g. 3 or 3.5 (${YEARS_OF_EXPERIENCE_MIN}–${YEARS_OF_EXPERIENCE_MAX})`}
        required={field.is_required}
        aria-invalid={invalid || undefined}
        className={cn(inputClassName, invalid && invalidInputClassName)}
        onChange={(e) => {
          const next = sanitizeTyping(e.target.value);
          setText(next);
          const result = validateYearsOfExperienceValue(next, {
            required: field.is_required,
            label: field.label,
          });
          report(
            result.ok === true && result.value !== null ? String(result.value) : next.trim(),
            { reveal: true }
          );
          e.target.setCustomValidity(
            result.ok === false && next.trim()
              ? result.message
              : field.is_required && !next.trim()
                ? `${field.label} is required.`
                : ""
          );
        }}
        onKeyDown={(e) => {
          if (["e", "E", "+", "-", ","].includes(e.key)) {
            e.preventDefault();
          }
        }}
        onPaste={(e) => {
          e.preventDefault();
          const pasted = sanitizeTyping(e.clipboardData.getData("text"));
          setText(pasted);
          const result = validateYearsOfExperienceValue(pasted, {
            required: field.is_required,
            label: field.label,
          });
          report(
            result.ok === true && result.value !== null ? String(result.value) : pasted.trim(),
            { reveal: true }
          );
        }}
        onBlur={() => {
          const result = validateYearsOfExperienceValue(text, {
            required: field.is_required,
            label: field.label,
          });
          if (result.ok === true && result.value !== null) {
            setText(String(result.value));
            report(String(result.value), { reveal: true });
          } else {
            report(text.trim(), { reveal: true });
          }
        }}
      />
      <FieldInlineError message={error} />
      {!error ? (
        <p className="text-xs leading-relaxed text-slate-500">
          Enter a number from {YEARS_OF_EXPERIENCE_MIN} to {YEARS_OF_EXPERIENCE_MAX}, in steps of{" "}
          {YEARS_OF_EXPERIENCE_STEP} (e.g. 0, 0.5, 1, 2.5).
        </p>
      ) : null}
    </div>
  );
}

function SalaryField({ field, defaultValue }: Props) {
  const initial = parseSalaryValue(defaultValue);
  const [currency, setCurrency] = useState(initial.currency);
  const [amount, setAmount] = useState(initial.amount);
  const combined = formatSalaryValue(currency, amount);
  const { error, report, invalid } = useFieldTracking(field.field_key);

  useEffect(() => {
    report(combined, { reveal: Boolean(amount.trim()) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combined]);

  return (
    <div className="space-y-2" data-field-key={field.field_key}>
      <FieldLabel field={field} />
      <input type="hidden" name={field.field_key} value={combined} />
      <div className="grid gap-2 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
        <select
          aria-label={`${field.label} currency`}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className={selectClassName}
        >
          {SALARY_CURRENCY_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <Input
          id={field.field_key}
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          onBlur={() => report(combined, { reveal: true })}
          placeholder="e.g. 5500"
          className={cn(inputClassName, invalid && invalidInputClassName)}
          required={field.is_required}
          aria-invalid={invalid || undefined}
        />
      </div>
      <FieldInlineError message={error} />
      {!error ? (
        <p className="text-xs leading-relaxed text-slate-500">
          Monthly amount in numbers only (no commas or symbols).
        </p>
      ) : null}
    </div>
  );
}

function SimpleSelectField({
  field,
  defaultValue,
  options,
  placeholder,
  helper,
}: Props & { options: readonly string[]; placeholder: string; helper?: string }) {
  const [value, setValue] = useState(
    options.includes(defaultValue) ? defaultValue : defaultValue ? "Other" : ""
  );
  const [other, setOther] = useState(options.includes(defaultValue) ? "" : defaultValue);
  const hasOther = options.includes("Other");
  const submitValue = value === "Other" && hasOther ? other.trim() : value;
  const { error, report, invalid } = useFieldTracking(field.field_key);

  useEffect(() => {
    report(submitValue, { reveal: Boolean(submitValue) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitValue]);

  return (
    <div className="space-y-2" data-field-key={field.field_key}>
      <FieldLabel field={field} />
      {hasOther ? <input type="hidden" name={field.field_key} value={submitValue} /> : null}
      <NativeSelect
        id={field.field_key}
        name={hasOther ? `${field.field_key}__choice` : field.field_key}
        value={value}
        required={field.is_required}
        placeholder={placeholder}
        options={options}
        invalid={invalid}
        onChange={(next) => {
          setValue(next);
          if (next !== "Other") setOther("");
          report(next === "Other" ? "" : next, { reveal: true });
        }}
      />
      {hasOther && value === "Other" ? (
        <Input
          value={other}
          onChange={(e) => {
            setOther(e.target.value);
            report(e.target.value, { reveal: true });
          }}
          onBlur={() => {
            const listed = matchListedOption(other, options);
            if (listed) {
              setValue(listed);
              setOther("");
              report(listed, { reveal: true });
              return;
            }
            report(other, { reveal: true });
          }}
          placeholder="Please specify"
          className={cn(inputClassName, "mt-2", invalid && invalidInputClassName)}
          required={field.is_required}
          aria-invalid={invalid || undefined}
        />
      ) : null}
      <FieldInlineError message={error} />
      {!error && helper ? (
        <p className="text-xs leading-relaxed text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function SkillsTagField({ field, defaultValue }: Props) {
  const [tags, setTags] = useState(() => parseStringArrayInput(defaultValue));
  const { error, report, invalid } = useFieldTracking(field.field_key);

  useEffect(() => {
    report(JSON.stringify(tags), { reveal: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2" data-field-key={field.field_key}>
      <FieldLabel field={field} />
      <TagInput
        id={field.field_key}
        name={field.field_key}
        label={field.label}
        values={tags}
        suggestions={SKILL_SUGGESTIONS}
        allowCustom
        maxItems={SKILLS_MAX_COUNT}
        maxItemLength={SKILL_MAX_LENGTH}
        required={field.is_required}
        invalid={invalid}
        placeholder="Search skills or type a custom skill…"
        onChange={(next) => {
          setTags(next);
          report(JSON.stringify(next), { reveal: true });
        }}
      />
      <FieldInlineError message={error} />
    </div>
  );
}

function CertificationsTagField({ field, defaultValue }: Props) {
  const [tags, setTags] = useState(() => parseStringArrayInput(defaultValue));
  const { error, report, invalid } = useFieldTracking(field.field_key);

  useEffect(() => {
    report(JSON.stringify(tags), { reveal: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2" data-field-key={field.field_key}>
      <FieldLabel field={field} />
      <TagInput
        id={field.field_key}
        name={field.field_key}
        label={field.label}
        values={tags}
        suggestions={CERTIFICATION_SUGGESTIONS}
        allowCustom
        maxItems={CERTIFICATIONS_MAX_COUNT}
        maxItemLength={CERTIFICATION_MAX_LENGTH}
        required={field.is_required}
        invalid={invalid}
        placeholder="Search certifications or type your own…"
        onChange={(next) => {
          setTags(next);
          report(JSON.stringify(next), { reveal: true });
        }}
      />
      <FieldInlineError message={error} />
    </div>
  );
}

function LanguagesField({ field, defaultValue }: Props) {
  const [entries, setEntries] = useState<CandidateLanguageEntry[]>(() => {
    const parsed = parseLanguageEntriesInput(defaultValue);
    const normalized = validateLanguagesList(parsed, { dropUnknown: true });
    return normalized.ok === true ? normalized.value : [];
  });
  const { error, report, invalid } = useFieldTracking(field.field_key);

  useEffect(() => {
    report(JSON.stringify(entries), { reveal: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2" data-field-key={field.field_key}>
      <FieldLabel field={field} />
      <LanguageProficiencyField
        id={field.field_key}
        name={field.field_key}
        label={field.label}
        values={entries}
        required={field.is_required}
        invalid={invalid}
        onChange={(next) => {
          setEntries(next);
          report(JSON.stringify(next), { reveal: true });
        }}
      />
      <FieldInlineError message={error} />
    </div>
  );
}

function TrackedTextField({
  field,
  defaultValue,
  multiline = false,
}: Props & { multiline?: boolean }) {
  const name = field.is_custom ? `custom_${field.field_key}` : field.field_key;
  const [value, setValue] = useState(defaultValue);
  const { error, report, invalid } = useFieldTracking(field.field_key);

  useEffect(() => {
    report(value, { reveal: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shared = {
    id: field.field_key,
    name,
    value,
    required: field.is_required,
    "aria-invalid": invalid || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.target.value);
      report(e.target.value, { reveal: true });
    },
    onBlur: () => report(value, { reveal: true }),
    placeholder: field.placeholder ?? undefined,
  };

  return (
    <div className="space-y-2" data-field-key={field.field_key}>
      <FieldLabel field={field} />
      {multiline ? (
        <Textarea
          {...shared}
          className={cn(
            "min-h-[96px] resize-y rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-sky-500/20",
            invalid && invalidInputClassName
          )}
        />
      ) : (
        <Input
          {...shared}
          type={
            field.field_type === "email"
              ? "email"
              : field.field_type === "number"
                ? "number"
                : field.field_type === "tel"
                  ? "tel"
                  : field.field_type === "date"
                    ? "date"
                    : field.field_type === "url"
                      ? "url"
                      : "text"
          }
          min={field.field_type === "number" ? 0 : undefined}
          autoComplete={
            field.field_key === "email"
              ? "email"
              : field.field_key === "full_name"
                ? "name"
                : field.field_key === "current_job_title"
                  ? "organization-title"
                  : undefined
          }
          className={cn(inputClassName, invalid && invalidInputClassName)}
        />
      )}
      <FieldInlineError message={error} />
      {!error && field.field_key === "email" ? (
        <p className="text-xs leading-relaxed text-slate-500">
          Used if an employer contacts you after unlocking your profile.
        </p>
      ) : null}
    </div>
  );
}

export function CandidateProfileField({ field, defaultValue }: Props) {
  if (field.field_key === "phone") {
    return <PhoneField field={field} defaultValue={defaultValue} />;
  }
  if (field.field_key === "country") {
    return <CountrySearchField field={field} defaultValue={defaultValue} />;
  }
  if (field.field_key === "city") {
    return <TrackedTextField field={field} defaultValue={defaultValue} />;
  }
  if (field.field_key === "skills") {
    return <SkillsTagField field={field} defaultValue={defaultValue} />;
  }
  if (field.field_key === "certifications") {
    return <CertificationsTagField field={field} defaultValue={defaultValue} />;
  }
  if (field.field_key === "languages") {
    return <LanguagesField field={field} defaultValue={defaultValue} />;
  }
  if (field.field_key === "highest_education" && field.field_type === "select") {
    return (
      <SimpleSelectField
        field={field}
        defaultValue={defaultValue}
        options={resolveSelectOptions(field)}
        placeholder="Select education level"
      />
    );
  }
  if (field.field_key === "employment_type_preference" && field.field_type === "select") {
    return (
      <SimpleSelectField
        field={field}
        defaultValue={defaultValue}
        options={resolveSelectOptions(field)}
        placeholder="Select employment type"
      />
    );
  }
  if (field.field_key === "work_arrangement_preference" && field.field_type === "select") {
    return (
      <SimpleSelectField
        field={field}
        defaultValue={defaultValue}
        options={resolveSelectOptions(field)}
        placeholder="Select work arrangement"
      />
    );
  }
  if (field.field_key === "availability" && field.field_type === "select") {
    return (
      <SimpleSelectField
        field={field}
        defaultValue={defaultValue}
        options={resolveSelectOptions(field)}
        placeholder="Select availability"
      />
    );
  }
  if (field.field_key === "years_of_experience") {
    return <YearsOfExperienceField field={field} defaultValue={defaultValue} />;
  }
  if (field.field_key === "current_salary" || field.field_key === "expected_salary") {
    return <SalaryField field={field} defaultValue={defaultValue} />;
  }

  if (field.field_type === "select") {
    return (
      <SimpleSelectField
        field={field}
        defaultValue={defaultValue}
        options={resolveSelectOptions(field)}
        placeholder={field.placeholder ?? "Select an option"}
      />
    );
  }

  const useTextarea = field.field_type === "textarea";
  return (
    <TrackedTextField field={field} defaultValue={defaultValue} multiline={useTextarea} />
  );
}

export function CandidateCountryCityPair({
  countryField,
  cityField,
  countryDefault,
  cityDefault,
}: {
  countryField: FormFieldDefinition;
  cityField: FormFieldDefinition;
  countryDefault: string;
  cityDefault: string;
}) {
  return (
    <CountryCityFields
      countryField={countryField}
      cityField={cityField}
      countryDefault={countryDefault}
      cityDefault={cityDefault}
    />
  );
}

export function syncDialCodeHint(country: string) {
  return dialCodeForCountry(country);
}

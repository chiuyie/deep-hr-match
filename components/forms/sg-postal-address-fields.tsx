"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FieldInlineError,
  useProfileFormValidationOptional,
} from "@/components/forms/profile-form-validation-context";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import { HOME_ADDRESS_MAX_LENGTH, POSTAL_CODE_MAX_LENGTH } from "@/lib/constants/profile-history";
import { isSingaporeCountry, isSingaporePostalCode } from "@/lib/geo/sg-postal";
import { cn } from "@/lib/utils";

const inputClassName =
  "h-11 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-sky-500/20";

function normalizePostalInput(raw: string, singapore: boolean): string {
  if (singapore) return raw.replace(/\D/g, "").slice(0, 6);
  return raw.replace(/[^A-Za-z0-9 -]/g, "").slice(0, POSTAL_CODE_MAX_LENGTH);
}

type Props = {
  postalField: FormFieldDefinition;
  addressField: FormFieldDefinition;
  postalDefault: string;
  addressDefault: string;
};

export function SgPostalAddressFields({
  postalField,
  addressField,
  postalDefault,
  addressDefault,
}: Props) {
  const validation = useProfileFormValidationOptional();
  const country = validation?.values.country ?? "";
  const postalError = validation?.getError(postalField.field_key);
  const addressError = validation?.getError(addressField.field_key);

  const [postal, setPostal] = useState(postalDefault);
  const [address, setAddress] = useState(addressDefault);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const lastFilledPostal = useRef("");
  const skipInitialLookup = useRef(Boolean(addressDefault.trim()));

  function report(fieldKey: string, value: string, reveal: boolean) {
    validation?.setFieldValue(fieldKey, value, { reveal });
  }

  useEffect(() => {
    report(postalField.field_key, postal, false);
    report(addressField.field_key, address, false);
    // Initial sync only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const singapore = isSingaporeCountry(country);
    const normalized = normalizePostalInput(postal, singapore);
    if (normalized !== postal) {
      setPostal(normalized);
      report(postalField.field_key, normalized, normalized.length > 0);
      return;
    }
    if (postal.trim()) {
      report(postalField.field_key, postal, true);
    }
    // Re-check the code when the country changes (Singapore is 6 digits; other countries are not).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  useEffect(() => {
    const code = postal.trim();
    if (!isSingaporePostalCode(code) || !isSingaporeCountry(country)) {
      setLookingUp(false);
      if (!isSingaporeCountry(country)) setLookupMessage("");
      return;
    }
    if (skipInitialLookup.current && code === postalDefault.trim()) {
      return;
    }
    if (lastFilledPostal.current === code) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLookingUp(true);
      setLookupMessage("");
      fetch(`/api/geo/sg-postal?code=${encodeURIComponent(code)}`, { signal: controller.signal })
        .then(async (response) => {
          const data = (await response.json()) as { address?: string | null; error?: string };
          if (controller.signal.aborted) return;
          if (!isSingaporeCountry(country)) {
            setLookupMessage("");
            return;
          }
          if (data.address) {
            setAddress(data.address);
            report(addressField.field_key, data.address, true);
            lastFilledPostal.current = code;
            setLookupMessage(
              "Street address filled in. Add your unit number if you have one."
            );
          } else if (data.error) {
            setLookupMessage("Address lookup is unavailable right now. You can still type the address.");
          } else {
            setLookupMessage(
              "No address found for this postal code. Type your street address below."
            );
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setLookupMessage("Address lookup is unavailable right now. You can still type the address.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLookingUp(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // report identity is stable enough for this lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postal, country]);

  const singaporeLookup = isSingaporeCountry(country);

  return (
    <div className="space-y-5">
      <div className="space-y-2" data-field-key={postalField.field_key}>
        <label htmlFor={postalField.field_key} className="block text-sm font-medium text-slate-700">
          {postalField.label}
          {postalField.is_required ? <span className="text-rose-500"> *</span> : null}
        </label>
        <Input
          id={postalField.field_key}
          name={postalField.field_key}
          value={postal}
          inputMode={singaporeLookup ? "numeric" : "text"}
          autoComplete="postal-code"
          maxLength={singaporeLookup ? 6 : POSTAL_CODE_MAX_LENGTH}
          aria-invalid={Boolean(postalError) || undefined}
          placeholder={singaporeLookup ? "123456" : "Postal code"}
          className={cn(inputClassName, "w-32", postalError && "border-rose-400")}
          onChange={(event) => {
            skipInitialLookup.current = false;
            const next = normalizePostalInput(event.target.value, singaporeLookup);
            setPostal(next);
            if (next.trim() !== lastFilledPostal.current) lastFilledPostal.current = "";
            const complete = singaporeLookup ? next.length === 6 : next.trim().length >= 3;
            report(postalField.field_key, next, complete);
          }}
          onBlur={() => report(postalField.field_key, postal, true)}
        />
        <FieldInlineError message={postalError} />
        {!postalError && lookingUp ? (
          <p className="text-xs text-slate-500">Looking up address…</p>
        ) : null}
        {!postalError && !lookingUp && singaporeLookup ? (
          <p className="text-xs leading-relaxed text-slate-500">
            6 digits. We’ll fill the street address below.
          </p>
        ) : null}
        {!postalError && !lookingUp && !singaporeLookup ? (
          <p className="text-xs leading-relaxed text-slate-500">
            Postal or ZIP code for your country.
          </p>
        ) : null}
      </div>

      <div className="space-y-2" data-field-key={addressField.field_key}>
        <label htmlFor={addressField.field_key} className="block text-sm font-medium text-slate-700">
          {addressField.label}
          {addressField.is_required ? <span className="text-rose-500"> *</span> : null}
        </label>
        <Textarea
          id={addressField.field_key}
          name={addressField.field_key}
          value={address}
          autoComplete="street-address"
          maxLength={HOME_ADDRESS_MAX_LENGTH}
          aria-invalid={Boolean(addressError) || undefined}
          placeholder="Street, building, and unit"
          className={cn(
            "min-h-[96px] resize-y rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-sky-500/20",
            addressError && "border-rose-400"
          )}
          onChange={(event) => {
            setAddress(event.target.value);
            report(addressField.field_key, event.target.value, true);
          }}
        />
        <FieldInlineError message={addressError} />
        {!addressError && lookupMessage ? (
          <p className="text-xs leading-relaxed text-slate-500">{lookupMessage}</p>
        ) : null}
        {!addressError && !lookupMessage && singaporeLookup ? (
          <p className="text-xs leading-relaxed text-slate-500">
            Add your unit number after the street address appears.
          </p>
        ) : null}
      </div>
    </div>
  );
}

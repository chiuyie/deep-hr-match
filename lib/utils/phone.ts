import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js";

export type { CountryCode };

const SUPPORTED_ISO = new Set<string>(getCountries());

export function isSupportedPhoneCountry(iso: string | null | undefined): iso is CountryCode {
  return Boolean(iso && SUPPORTED_ISO.has(iso));
}

export function dialCodeForIso(iso: CountryCode): string {
  return `+${getCountryCallingCode(iso)}`;
}

/** Option value format: `SG:+65` (ISO + dial code). */
export function phoneOptionValue(iso: CountryCode): string {
  return `${iso}:${dialCodeForIso(iso)}`;
}

export function parsePhoneOptionValue(value: string): {
  isoCode: CountryCode | null;
  dialCode: string;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isoCode: "SG", dialCode: "+65" };
  }
  const idx = trimmed.indexOf(":");
  if (idx === -1) {
    if (isSupportedPhoneCountry(trimmed)) {
      return { isoCode: trimmed, dialCode: dialCodeForIso(trimmed) };
    }
    return {
      isoCode: null,
      dialCode: trimmed.startsWith("+") ? trimmed : `+${trimmed}`,
    };
  }
  const iso = trimmed.slice(0, idx);
  const dial = trimmed.slice(idx + 1);
  if (isSupportedPhoneCountry(iso)) {
    return { isoCode: iso, dialCode: dialCodeForIso(iso) };
  }
  return { isoCode: null, dialCode: dial || "+65" };
}

/**
 * Strip a leading international prefix that duplicates the selected country
 * calling code (e.g. user typed/pasted "+65" or "65" into the national field
 * while Singapore is selected).
 */
export function stripDuplicateCallingCode(
  raw: string,
  iso: CountryCode
): string {
  let text = raw.trim();
  if (!text) return "";

  const calling = getCountryCallingCode(iso);
  const patterns = [
    new RegExp(`^\\+${calling}[\\s-]*`),
    new RegExp(`^00${calling}[\\s-]*`),
    new RegExp(`^011${calling}[\\s-]*`),
  ];

  // Strip repeatedly so "+65 +65 9123…" collapses cleanly before we reject leftovers.
  let guard = 0;
  while (guard++ < 3) {
    let stripped = false;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        text = text.replace(pattern, "").trim();
        stripped = true;
        break;
      }
    }
    if (!stripped) break;
  }

  return text;
}

/** True when the same calling code appears more than once as an intl prefix. */
export function hasDuplicatedCallingCode(raw: string, iso: CountryCode): boolean {
  const calling = getCountryCallingCode(iso);
  const compact = raw.replace(/[\s()-]/g, "");
  const prefixes = [`+${calling}`, `00${calling}`, `011${calling}`];
  let count = 0;
  for (const prefix of prefixes) {
    let idx = 0;
    while ((idx = compact.indexOf(prefix, idx)) !== -1) {
      count += 1;
      idx += prefix.length;
    }
  }
  return count >= 2;
}

export type PhoneParseResult = {
  /** ISO country for the UI selector (may follow a pasted international number). */
  isoCode: CountryCode;
  /** National digits/spaces for the local input (no country calling code). */
  nationalDisplay: string;
  /** E.164 when valid; otherwise empty. */
  e164: string;
  valid: boolean;
  error: string | null;
};

function lengthErrorMessage(lengthResult: ReturnType<typeof validatePhoneNumberLength>): string | null {
  switch (lengthResult) {
    case "TOO_SHORT":
      return "Phone number is too short for the selected country.";
    case "TOO_LONG":
      return "Phone number is too long for the selected country.";
    case "INVALID_LENGTH":
      return "Phone number has an invalid length for the selected country.";
    case "NOT_A_NUMBER":
      return "Enter digits only for the phone number.";
    default:
      return null;
  }
}

/**
 * Resolve UI input (selected country + national/pasted text) into a validated
 * phone result. Pasted international numbers update the country when valid.
 */
export function resolvePhoneInput(
  nationalOrPasted: string,
  selectedIso: CountryCode
): PhoneParseResult {
  const raw = nationalOrPasted.trim();
  if (!raw) {
    return {
      isoCode: selectedIso,
      nationalDisplay: "",
      e164: "",
      valid: false,
      error: null,
    };
  }

  const looksInternational = /^\+|00\d|011\d/.test(raw.replace(/[\s()-]/g, ""));

  if (hasDuplicatedCallingCode(raw, selectedIso)) {
    return {
      isoCode: selectedIso,
      nationalDisplay: stripDuplicateCallingCode(raw, selectedIso),
      e164: "",
      valid: false,
      error: "Remove the duplicated country code and enter the local number only.",
    };
  }

  // Prefer parsing as international when the user pasted a full number.
  if (looksInternational) {
    const intl = parsePhoneNumberFromString(raw);
    if (intl?.isValid() && intl.country && isSupportedPhoneCountry(intl.country)) {
      return {
        isoCode: intl.country,
        nationalDisplay: intl.formatNational(),
        e164: intl.format("E.164"),
        valid: true,
        error: null,
      };
    }
    if (intl && !intl.isValid()) {
      const lenMsg = lengthErrorMessage(validatePhoneNumberLength(raw));
      return {
        isoCode: intl.country && isSupportedPhoneCountry(intl.country) ? intl.country : selectedIso,
        nationalDisplay: intl.nationalNumber || stripDuplicateCallingCode(raw, selectedIso),
        e164: "",
        valid: false,
        error:
          lenMsg ??
          "This phone number is invalid. Check the country code and digits.",
      };
    }
    // e.g. "+65+6591…" — not a parseable international number.
    // Fall through only after stripping a single leading IDD for the selected country.
  }

  const cleaned = stripDuplicateCallingCode(raw, selectedIso);
  if (!cleaned) {
    return {
      isoCode: selectedIso,
      nationalDisplay: "",
      e164: "",
      valid: false,
      error: "Enter your local phone number without repeating the country code.",
    };
  }

  const lengthResult = validatePhoneNumberLength(cleaned, selectedIso);
  const lenMsg = lengthErrorMessage(lengthResult);
  if (lenMsg) {
    return {
      isoCode: selectedIso,
      nationalDisplay: cleaned,
      e164: "",
      valid: false,
      error: lenMsg,
    };
  }

  const parsed = parsePhoneNumberFromString(cleaned, selectedIso);
  if (!parsed) {
    return {
      isoCode: selectedIso,
      nationalDisplay: cleaned,
      e164: "",
      valid: false,
      error: "Enter a valid phone number for the selected country.",
    };
  }

  // Reject numbers that parse to a different calling country than selected
  // (except NANP regions that share +1, where calling codes match).
  if (parsed.country && parsed.country !== selectedIso) {
    const selectedCalling = getCountryCallingCode(selectedIso);
    const parsedCalling = getCountryCallingCode(parsed.country);
    if (selectedCalling !== parsedCalling) {
      return {
        isoCode: selectedIso,
        nationalDisplay: cleaned,
        e164: "",
        valid: false,
        error: `This number belongs to ${parsed.country}, not the selected country. Change the country code or the number.`,
      };
    }
  }

  if (!parsed.isValid()) {
    return {
      isoCode: selectedIso,
      nationalDisplay: cleaned,
      e164: "",
      valid: false,
      error: parsed.isPossible()
        ? "This phone number is not valid for the selected country."
        : "This phone number is not possible for the selected country.",
    };
  }

  return {
    isoCode: selectedIso,
    nationalDisplay: parsed.formatNational(),
    e164: parsed.format("E.164"),
    valid: true,
    error: null,
  };
}

/** Split a stored E.164 (or legacy) value for the phone UI. */
export function parseStoredPhone(value: string | null | undefined): {
  isoCode: CountryCode;
  dialCode: string;
  national: string;
} {
  const raw = (value ?? "").trim();
  if (!raw) {
    return { isoCode: "SG", dialCode: "+65", national: "" };
  }

  const parsed = parsePhoneNumberFromString(raw);
  if (parsed?.country && isSupportedPhoneCountry(parsed.country)) {
    return {
      isoCode: parsed.country,
      dialCode: dialCodeForIso(parsed.country),
      national: parsed.formatNational(),
    };
  }

  // Legacy: "+65 91234567" style that failed country detection
  const match = raw.match(/^\+(\d{1,4})\s*(.*)$/);
  if (match) {
    const calling = match[1]!;
    const rest = match[2] ?? "";
    const iso =
      getCountries().find((c) => getCountryCallingCode(c) === calling) ?? "SG";
    return {
      isoCode: iso,
      dialCode: `+${calling}`,
      national: rest,
    };
  }

  return { isoCode: "SG", dialCode: "+65", national: raw };
}

/**
 * Normalize any accepted phone string to E.164.
 * Returns null when empty; throws nothing — invalid returns null.
 */
export function normalizePhoneToE164(
  value: string | null | undefined,
  defaultCountry: CountryCode = "SG"
): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const intl = parsePhoneNumberFromString(raw);
  if (intl?.isValid()) return intl.format("E.164");

  const local = parsePhoneNumberFromString(raw, defaultCountry);
  if (local?.isValid()) return local.format("E.164");

  const resolved = resolvePhoneInput(raw, defaultCountry);
  return resolved.valid ? resolved.e164 : null;
}

/** Empty is valid (optional field). Non-empty must be a real number. */
export function isValidPhoneNumber(
  value: string | null | undefined,
  defaultCountry: CountryCode = "SG"
): boolean {
  const raw = (value ?? "").trim();
  if (!raw) return true;
  return normalizePhoneToE164(raw, defaultCountry) !== null;
}

export function phoneValidationMessage(
  value: string | null | undefined,
  selectedIso: CountryCode = "SG",
  options: { required?: boolean } = {}
): string | null {
  const raw = (value ?? "").trim();
  if (!raw) {
    return options.required ? "Phone number is required." : null;
  }

  // If already E.164 / international, validate directly.
  const asIntl = parsePhoneNumberFromString(raw);
  if (asIntl?.isValid()) return null;

  const resolved = resolvePhoneInput(raw, selectedIso);
  if (resolved.valid) return null;
  return resolved.error ?? "Enter a valid phone number with country code.";
}

/**
 * Validate a submitted phone field value (typically E.164 from the form).
 * Same rules on frontend and backend.
 */
export function validateSubmittedPhone(
  value: string | null | undefined,
  options: { required?: boolean; defaultCountry?: CountryCode } = {}
): { ok: true; e164: string | null } | { ok: false; message: string } {
  const raw = (value ?? "").trim();
  if (!raw) {
    if (options.required) return { ok: false, message: "Phone number is required." };
    return { ok: true, e164: null };
  }

  const e164 = normalizePhoneToE164(raw, options.defaultCountry ?? "SG");
  if (!e164) {
    return {
      ok: false,
      message:
        phoneValidationMessage(raw, options.defaultCountry ?? "SG") ??
        "Enter a valid phone number with country code.",
    };
  }
  return { ok: true, e164 };
}

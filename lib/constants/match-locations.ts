/** Location vocabulary shared by employer filters and candidate country/city. */
export const MATCH_OTHERS = "Others" as const;

export const MATCH_COUNTRY_OPTIONS = [
  "Singapore",
  "Malaysia",
  "China",
  "India",
  "Indonesia",
  "Philippines",
  "Thailand",
  "Vietnam",
  MATCH_OTHERS,
] as const;

export const MATCH_CITY_OPTIONS = [
  "Singapore",
  "Kuala Lumpur",
  "Penang",
  "Johor Bahru",
  "Jakarta",
  "Bangkok",
  "Manila",
  "Ho Chi Minh",
  MATCH_OTHERS,
] as const;

const MATCH_CITIES_BY_COUNTRY: Record<string, readonly string[]> = {
  Singapore: ["Singapore", MATCH_OTHERS],
  Malaysia: ["Kuala Lumpur", "Penang", "Johor Bahru", MATCH_OTHERS],
  Indonesia: ["Jakarta", MATCH_OTHERS],
  Thailand: ["Bangkok", MATCH_OTHERS],
  Philippines: ["Manila", MATCH_OTHERS],
  Vietnam: ["Ho Chi Minh", MATCH_OTHERS],
  China: [MATCH_OTHERS],
  India: [MATCH_OTHERS],
  [MATCH_OTHERS]: [MATCH_OTHERS],
};

const LOCATION_ALIASES: Record<string, string> = {
  other: MATCH_OTHERS,
  others: MATCH_OTHERS,
  "republic of singapore": "Singapore",
  sg: "Singapore",
  "people's republic of china": "China",
  prc: "China",
  "viet nam": "Vietnam",
  "republic of the philippines": "Philippines",
  "ho chi minh city": "Ho Chi Minh",
  hcmc: "Ho Chi Minh",
  saigon: "Ho Chi Minh",
  kl: "Kuala Lumpur",
  "george town": "Penang",
  georgetown: "Penang",
};

function normalizeLocation(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function namedOptions(options: readonly string[]): string[] {
  return options.filter((option) => option !== MATCH_OTHERS);
}

/** Map a stored place onto the shared list. Anything outside that list is Others. */
export function canonicalizeMatchLocation(
  value: unknown,
  options: readonly string[]
): string | null {
  const key = normalizeLocation(value);
  if (!key) return null;

  const alias = LOCATION_ALIASES[key];
  if (alias && options.includes(alias)) return alias;

  const listed = namedOptions(options).find((option) => option.toLowerCase() === key);
  if (listed) return listed;

  if (options.includes(MATCH_OTHERS)) return MATCH_OTHERS;
  return null;
}

export function citiesForMatchCountry(country: string | null | undefined): readonly string[] {
  const canonical = canonicalizeMatchLocation(country, MATCH_COUNTRY_OPTIONS);
  if (!canonical) return [MATCH_OTHERS];
  return MATCH_CITIES_BY_COUNTRY[canonical] ?? [MATCH_OTHERS];
}

/** Split a stored value into a list choice plus optional free text for Others. */
export function splitStoredMatchLocation(
  stored: string | null | undefined,
  options: readonly string[]
): { choice: string; specify: string } {
  const text = String(stored ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!text) return { choice: "", specify: "" };

  const canonical = canonicalizeMatchLocation(text, options);
  if (canonical && canonical !== MATCH_OTHERS) return { choice: canonical, specify: "" };
  if (text.toLowerCase() === "other" || text.toLowerCase() === "others") {
    return { choice: MATCH_OTHERS, specify: "" };
  }
  return { choice: MATCH_OTHERS, specify: text };
}

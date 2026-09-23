/** Singapore postal codes are exactly 6 digits. */
export const SG_POSTAL_PATTERN = /^\d{6}$/;

export type SgPostalLookup = {
  postalCode: string;
  address: string;
  block: string;
  road: string;
  building: string;
};

type OneMapResult = {
  BLK_NO?: string;
  ROAD_NAME?: string;
  BUILDING?: string;
  ADDRESS?: string;
  POSTAL?: string;
};

export function isSingaporePostalCode(value: string): boolean {
  return SG_POSTAL_PATTERN.test(value.trim());
}

/** True only when the candidate has chosen Singapore. A blank country is not Singapore. */
export function isSingaporeCountry(country: string | null | undefined): boolean {
  const value = (country ?? "").trim().toLowerCase();
  return value === "singapore" || value === "sg";
}

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** Street line from OneMap, without the trailing "SINGAPORE 123456". */
export function formatSgStreetAddress(result: OneMapResult): string {
  const block = clean(result.BLK_NO);
  const road = clean(result.ROAD_NAME);
  const building = clean(result.BUILDING);
  const street = [block, road].filter(Boolean).join(" ");
  const showBuilding = building.length > 0 && building.toUpperCase() !== "NIL";

  if (street && showBuilding) return `${street}, ${building}`;
  if (street) return street;

  return clean(result.ADDRESS).replace(/\s+SINGAPORE\s+\d{6}\s*$/i, "");
}

export function parseOneMapSearch(payload: unknown, postalCode: string): SgPostalLookup | null {
  if (!payload || typeof payload !== "object") return null;
  const results = (payload as { results?: unknown }).results;
  if (!Array.isArray(results) || results.length === 0) return null;

  const match =
    results.find((row) => {
      if (!row || typeof row !== "object") return false;
      return clean((row as OneMapResult).POSTAL) === postalCode;
    }) ?? results[0];

  if (!match || typeof match !== "object") return null;
  const row = match as OneMapResult;
  const address = formatSgStreetAddress(row);
  if (!address) return null;

  return {
    postalCode,
    address,
    block: clean(row.BLK_NO),
    road: clean(row.ROAD_NAME),
    building: clean(row.BUILDING).toUpperCase() === "NIL" ? "" : clean(row.BUILDING),
  };
}

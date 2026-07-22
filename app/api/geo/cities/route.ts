import { City, Country } from "country-state-city";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Countries where the city list should be a fixed short set (not the full geo dump). */
const CITY_OVERRIDES_BY_ISO: Record<string, readonly string[]> = {
  SG: ["Singapore"],
};

function resolveIsoCode(country: string | null, iso: string | null): string | null {
  if (iso?.trim()) return iso.trim().toUpperCase();
  if (!country?.trim()) return null;
  const trimmed = country.trim();
  if (trimmed === "Other") return null;
  const match = Country.getAllCountries().find(
    (c) => c.name === trimmed || c.isoCode === trimmed.toUpperCase()
  );
  return match?.isoCode ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isoCode = resolveIsoCode(
    searchParams.get("country"),
    searchParams.get("iso")
  );

  if (!isoCode) {
    return NextResponse.json({ cities: ["Other"] as const });
  }

  const override = CITY_OVERRIDES_BY_ISO[isoCode];
  if (override) {
    return NextResponse.json({ cities: [...override], isoCode });
  }

  const cities = City.getCitiesOfCountry(isoCode)
    .map((c) => c.name.trim())
    .filter(Boolean);

  const unique = [...new Set(cities)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  if (unique.length === 0) {
    const countryName = Country.getCountryByCode(isoCode)?.name;
    if (countryName) unique.push(countryName);
  }

  if (!unique.includes("Other")) {
    unique.push("Other");
  }

  return NextResponse.json({ cities: unique, isoCode });
}

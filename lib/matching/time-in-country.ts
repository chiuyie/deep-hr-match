import { normalizeDateOfBirthInput } from "@/lib/form-fields/profile-history";

/** Same bands as the employer "minimum time in current country" filter. */
const TIME_IN_COUNTRY_BANDS = [
  { label: "10+ years", minDays: 3650 },
  { label: "5-10 years", minDays: 1825 },
  { label: "3-5 years", minDays: 1095 },
  { label: "2-3 years", minDays: 730 },
  { label: "1-2 years", minDays: 365 },
  { label: "6-12 months", minDays: 180 },
  { label: "0-6 months", minDays: 0 },
] as const;

/** Band for how long someone has lived in their current country, from the day they started. */
export function timeInCountryBand(raw: unknown, today = new Date()): string | null {
  const iso = normalizeDateOfBirthInput(raw);
  if (!iso) return null;

  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;

  const start = new Date(year, month - 1, day);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((todayDate.getTime() - start.getTime()) / 86_400_000);
  if (days < 0 || Number.isNaN(days)) return null;

  for (const band of TIME_IN_COUNTRY_BANDS) {
    if (days >= band.minDays) return band.label;
  }
  return "0-6 months";
}

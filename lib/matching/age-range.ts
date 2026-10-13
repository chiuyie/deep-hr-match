import { normalizeDateOfBirthInput } from "@/lib/form-fields/profile-history";

/** Same bands as the employer required-age filter. */
export function ageRangeFromDateOfBirth(raw: unknown, today = new Date()): string | null {
  const iso = normalizeDateOfBirthInput(raw);
  if (!iso) return null;

  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;

  let age = today.getFullYear() - year;
  const monthDelta = today.getMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < day)) age -= 1;

  if (age < 18 || age > 120) return null;
  if (age <= 25) return "18-25";
  if (age <= 30) return "26-30";
  if (age <= 35) return "31-35";
  if (age <= 40) return "36-40";
  if (age <= 45) return "41-45";
  if (age <= 50) return "46-50";
  if (age <= 55) return "51-55";
  if (age <= 60) return "56-60";
  return "60+";
}

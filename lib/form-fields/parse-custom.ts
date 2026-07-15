export function extractCustomFields(formData: FormData): Record<string, string> {
  const custom: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("custom_") || typeof value !== "string") continue;
    const fieldKey = key.slice("custom_".length);
    if (value.trim()) custom[fieldKey] = value.trim();
  }
  return custom;
}

export function stripCustomEntries(raw: Record<string, FormDataEntryValue>) {
  const cleaned: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!key.startsWith("custom_")) cleaned[key] = value;
  }
  return cleaned;
}

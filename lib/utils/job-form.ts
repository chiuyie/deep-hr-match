export function flattenMultilevelOptions(data: unknown): string[] {
  const results: string[] = [];

  const walk = (node: unknown, path: string[] = []) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        results.push([...path, String(item)].join(" | "));
      }
      return;
    }

    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        walk(value, [...path, key]);
      }
    }
  };

  walk(data);
  return results;
}

export type JobFormState = Record<string, string | boolean | string[] | undefined>;

export function parseJobFormState(formData: FormData): JobFormState {
  const state: JobFormState = {};
  const benefits: string[] = [];

  for (const [key, value] of formData.entries()) {
    if (key === "benefits_package") {
      benefits.push(String(value));
      continue;
    }

    if (typeof value !== "string") continue;

    if (key.startsWith("faq_")) {
      if (value === "true") state[key] = true;
      else if (value === "false") state[key] = false;
      continue;
    }

    state[key] = value;
  }

  if (benefits.length) {
    state.benefits_package = benefits;
  }

  return state;
}

export function jobRecordToFormState(job: {
  title: string;
  description: string | null;
  form_data: Record<string, unknown> | null;
}): JobFormState {
  const formData = (job.form_data ?? {}) as JobFormState;
  return {
    ...formData,
    job_title: job.title,
    job_description: job.description ?? "",
  };
}

export function formStateToJobPayload(state: JobFormState) {
  const { job_title, job_description, ...rest } = state;

  return {
    title: String(job_title ?? "").trim(),
    description: String(job_description ?? "").trim() || null,
    form_data: rest,
  };
}

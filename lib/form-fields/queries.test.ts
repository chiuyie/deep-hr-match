import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ensureFormFieldsReady,
  ensureFormFieldsSeeded,
  getProfileFieldKeys,
  loadComparisonFormFields,
  loadFormFields,
} from "@/lib/form-fields/queries";
import { getDefaultFormFields } from "@/lib/form-fields/defaults";
import { makeFormField } from "@/lib/form-fields/test-fixtures";

const mockFrom = vi.fn();
const mockCreateClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

type QueryResult = { data?: unknown; count?: number | null; error?: null };

function createAwaitableChain(result: QueryResult) {
  const chain: {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    then: Promise<QueryResult>["then"];
  } = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    then: (onFulfilled, onRejected) =>
      Promise.resolve({ data: result.data ?? [], error: result.error ?? null }).then(
        onFulfilled,
        onRejected
      ),
  };

  chain.select.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.insert.mockResolvedValue({ error: null });

  return chain;
}

describe("form field queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({ from: mockFrom });
  });

  it("seeds defaults when form_fields table is empty", async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const countChain = createAwaitableChain({ count: 0 });
    countChain.insert = insert;

    mockFrom.mockReturnValue({
      select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return Promise.resolve({ count: 0, data: null, error: null });
        }
        return countChain;
      }),
      insert,
    });

    await ensureFormFieldsSeeded();

    expect(insert).toHaveBeenCalledTimes(1);
    const payload = (insert.mock.calls as unknown[][])[0]?.[0] as unknown[];
    expect(payload.length).toBe(getDefaultFormFields().length);
  });

  it("does not seed when rows already exist", async () => {
    const insert = vi.fn();
    mockFrom.mockReturnValue({
      select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) return Promise.resolve({ count: 10, data: null, error: null });
        return createAwaitableChain({ data: [] });
      }),
      insert,
    });

    await ensureFormFieldsSeeded();
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts missing default keys when table already has rows", async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const chain = createAwaitableChain({
      data: [{ audience: "candidate", form_group: "profile", field_key: "full_name" }],
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "form_sections") {
        return createAwaitableChain({ data: [] });
      }
      return {
        select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) return Promise.resolve({ count: 5, data: null, error: null });
          return chain;
        }),
        insert,
        update: chain.update,
      };
    });

    await ensureFormFieldsReady();
    expect(insert).toHaveBeenCalled();
    const payload = insert.mock.calls
      .map((call) => call[0])
      .find((arg) => Array.isArray(arg) && arg[0] && "field_key" in (arg[0] as object)) as
      | { field_key: string }[]
      | undefined;
    expect(payload).toBeTruthy();
    expect(payload!.every((row) => row.field_key !== "full_name")).toBe(true);
  });

  it("loads active fields filtered by audience and form group", async () => {
    const activeCandidateField = makeFormField({ field_key: "full_name", label: "Full Name" });
    const chain = createAwaitableChain({ data: [activeCandidateField] });
    mockFrom.mockReturnValue(chain);

    const fields = await loadFormFields({
      audience: "candidate",
      formGroup: "profile",
      includeInactive: false,
    });

    expect(fields).toHaveLength(1);
    expect(chain.eq).toHaveBeenCalledWith("audience", "candidate");
    expect(chain.eq).toHaveBeenCalledWith("form_group", "profile");
    expect(chain.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("loads comparison groups for candidate, employer profile, and employer job", async () => {
    const candidateField = makeFormField({
      field_key: "full_name",
      label: "Full Name",
      section: "About you",
    });
    const employerField = makeFormField({
      audience: "employer",
      section: "Company details",
      field_key: "company_name",
      label: "Company Name",
    });
    const jobField = makeFormField({
      audience: "employer",
      form_group: "job",
      section: "Role basics",
      field_key: "job_title",
      label: "Job Title",
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "form_sections") {
        const sectionChain = createAwaitableChain({
          data: [
            { title: "About you", sort_order: 1 },
            { title: "Company details", sort_order: 1 },
            { title: "Role basics", sort_order: 1 },
          ],
        });
        return sectionChain;
      }

      let audience: string | null = null;
      let formGroup: string | null = null;
      const chain = createAwaitableChain({ data: [] });
      chain.eq.mockImplementation((col: string, value: string) => {
        if (col === "audience") audience = value;
        if (col === "form_group") formGroup = value;
        return chain;
      });
      chain.then = (onFulfilled, onRejected) => {
        let data: unknown[] = [];
        if (audience === "candidate" && formGroup === "profile") data = [candidateField];
        else if (audience === "employer" && formGroup === "profile") data = [employerField];
        else if (audience === "employer" && formGroup === "job") data = [jobField];
        else if (!audience && !formGroup) data = [candidateField, employerField, jobField];
        return Promise.resolve({ data, error: null }).then(onFulfilled, onRejected);
      };

      return {
        select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) return Promise.resolve({ count: 3, data: null, error: null });
          return chain;
        }),
        insert: vi.fn(async () => ({ error: null })),
        update: chain.update,
        eq: chain.eq,
        order: chain.order,
        in: chain.in,
      };
    });

    const result = await loadComparisonFormFields(true);
    expect(result.candidate.some((g) => g.fields.some((f) => f.field_key === "full_name"))).toBe(
      true
    );
    expect(
      result.employerProfile.some((g) => g.fields.some((f) => f.field_key === "company_name"))
    ).toBe(true);
    expect(result.employerJob.some((g) => g.fields.some((f) => f.field_key === "job_title"))).toBe(
      true
    );
  });

  it("returns active non-custom profile keys", () => {
    const keys = getProfileFieldKeys([
      makeFormField({ field_key: "full_name", label: "Full Name", is_custom: false }),
      makeFormField({ field_key: "custom_a", label: "Custom A", is_custom: true }),
      makeFormField({ field_key: "phone", label: "Phone", is_active: false }),
    ]);

    expect(keys).toEqual(["full_name"]);
  });
});

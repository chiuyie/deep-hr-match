import { beforeEach, describe, expect, it, vi } from "vitest";
import {
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
    insert: ReturnType<typeof vi.fn>;
    then: Promise<QueryResult>["then"];
  } = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
    then: (onFulfilled, onRejected) =>
      Promise.resolve({ data: result.data ?? [], error: result.error ?? null }).then(
        onFulfilled,
        onRejected
      ),
  };

  chain.select.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);

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
    const candidateField = makeFormField({ field_key: "full_name", label: "Full Name" });
    const employerField = makeFormField({
      audience: "employer",
      section: "Company Profile",
      field_key: "company_name",
      label: "Company Name",
    });
    const jobField = makeFormField({
      audience: "employer",
      form_group: "job",
      section: "Job Identification",
      field_key: "job_title",
      label: "Job Title",
    });

    let call = 0;
    mockFrom.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return {
          select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) return Promise.resolve({ count: 3, data: null, error: null });
            return createAwaitableChain({ data: [] });
          }),
        };
      }
      if (call === 2) return createAwaitableChain({ data: [candidateField] });
      if (call === 3) return createAwaitableChain({ data: [employerField] });
      return createAwaitableChain({ data: [jobField] });
    });

    const result = await loadComparisonFormFields(true);
    expect(result.candidate[0].fields[0].field_key).toBe("full_name");
    expect(result.employerProfile[0].fields[0].field_key).toBe("company_name");
    expect(result.employerJob[0].fields[0].field_key).toBe("job_title");
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

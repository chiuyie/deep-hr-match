import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFormField,
  deleteFormField,
  saveFormField,
  toggleFormFieldActive,
  updateEmployerDisclosureMode,
} from "@/lib/admin/form-field-actions";
import { makeFormField } from "@/lib/form-fields/test-fixtures";

const requireRole = vi.fn();
const revalidatePath = vi.fn();
const mockFrom = vi.fn();
const mockCreateClient = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

function buildUpdateChain(error: { message: string } | null = null) {
  return {
    update: vi.fn(() => ({
      eq: vi.fn(async () => ({ error })),
    })),
  };
}

function buildDeleteChain(error: { message: string } | null = null) {
  return {
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({ error })),
    })),
  };
}

describe("form-field-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ id: "admin-user" });
    mockCreateClient.mockResolvedValue({ from: mockFrom });
  });

  describe("saveFormField", () => {
    it("requires admin role and updates an existing field", async () => {
      mockFrom.mockReturnValue(buildUpdateChain());

      const field = makeFormField({ field_key: "full_name", label: "Full Name" });
      const formData = new FormData();
      formData.set("audience", field.audience);
      formData.set("form_group", field.form_group);
      formData.set("section", field.section);
      formData.set("field_key", field.field_key);
      formData.set("label", "Legal Name");
      formData.set("field_type", field.field_type);
      formData.set("sort_order", String(field.sort_order));
      formData.set("is_required", "true");
      formData.set("is_active", "true");
      formData.set("is_custom", "false");
      formData.set("employer_disclosure_mode", "admin_removed");

      const result = await saveFormField(formData, field.id);
      expect(requireRole).toHaveBeenCalledWith("admin");
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/admin/forms", "layout");
    });

    it("returns validation errors for invalid payloads", async () => {
      const formData = new FormData();
      formData.set("audience", "candidate");
      formData.set("form_group", "profile");
      formData.set("section", "Candidate Profile");
      formData.set("field_key", "");
      formData.set("label", "");
      formData.set("field_type", "text");

      const result = await saveFormField(formData, "field-id");
      expect(result.error).toBeTruthy();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe("deleteFormField", () => {
    it("deletes a custom field by id", async () => {
      mockFrom.mockReturnValue(buildDeleteChain());
      const result = await deleteFormField("custom-field-id");
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/candidate/profile", "layout");
    });
  });

  describe("toggleFormFieldActive", () => {
    it("updates is_active flag", async () => {
      const chain = buildUpdateChain();
      mockFrom.mockReturnValue(chain);

      const result = await toggleFormFieldActive("field-id", false);
      expect(result).toEqual({ success: true });
      expect(chain.update).toHaveBeenCalledWith({ is_active: false });
    });
  });

  describe("updateEmployerDisclosureMode", () => {
    it("updates employer_disclosure_mode", async () => {
      const chain = buildUpdateChain();
      mockFrom.mockReturnValue(chain);

      const result = await updateEmployerDisclosureMode("field-id", "admin_removed");
      expect(result).toEqual({ success: true });
      expect(chain.update).toHaveBeenCalledWith({ employer_disclosure_mode: "admin_removed" });
    });
  });

  describe("createFormField", () => {
    it("creates a custom field with generated key and next sort order", async () => {
      const insert = vi.fn(async () => ({ error: null }));
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(async () => ({
                data: [{ sort_order: 16 }],
                error: null,
              })),
            })),
          })),
        })),
        insert,
      });

      const result = await createFormField({
        audience: "candidate",
        form_group: "profile",
        section: "Candidate Profile",
        label: "Portfolio URL",
        is_required: true,
      });

      expect(result).toEqual({ success: true });
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          audience: "candidate",
          form_group: "profile",
          section: "Candidate Profile",
          field_key: "portfolio_url",
          label: "Portfolio URL",
          is_required: true,
          is_custom: true,
          is_active: true,
          employer_disclosure_mode: "candidate_optional",
          sort_order: 17,
        })
      );
    });

    it("rejects empty labels", async () => {
      const result = await createFormField({
        audience: "employer",
        form_group: "profile",
        section: "Company Profile",
        label: "   ",
      });
      expect(result).toEqual({ error: "Field label is required" });
    });

    it("returns a friendly duplicate key error", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: [], error: null })),
            })),
          })),
        })),
        insert: vi.fn(async () => ({ error: { code: "23505", message: "duplicate" } })),
      });

      const result = await createFormField({
        audience: "employer",
        form_group: "profile",
        section: "Company Profile",
        label: "Company Name",
      });

      expect(result.error).toBe("A field with that key already exists in this section");
    });
  });
});

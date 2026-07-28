import { describe, expect, it } from "vitest";
import {
  PLATFORM_DISCLOSURE_DEFAULTS,
  isShownOnAnonymous,
  shouldShowUnlockedPlatformItem,
  type PlatformDisclosureMap,
} from "@/lib/employer/platform-disclosure";

function buildMap(
  overrides: Partial<PlatformDisclosureMap> = {}
): PlatformDisclosureMap {
  const map = {} as PlatformDisclosureMap;
  for (const item of PLATFORM_DISCLOSURE_DEFAULTS) {
    map[item.disclosure_key] = item;
  }
  return { ...map, ...overrides };
}

describe("platform disclosure helpers", () => {
  it("reads anonymous visibility from the map", () => {
    const map = buildMap({
      match_score: {
        ...PLATFORM_DISCLOSURE_DEFAULTS[0],
        show_on_anonymous_match: false,
      },
    });
    expect(isShownOnAnonymous(map, "match_score")).toBe(false);
    expect(isShownOnAnonymous(map, "match_rank")).toBe(true);
  });

  it("hides admin_removed items on unlocked surfaces", () => {
    const map = buildMap({
      candidate_cv: {
        ...PLATFORM_DISCLOSURE_DEFAULTS.find((item) => item.disclosure_key === "candidate_cv")!,
        employer_disclosure_mode: "admin_removed",
      },
    });
    expect(shouldShowUnlockedPlatformItem(map, "candidate_cv")).toBe(false);
  });

  it("shows always_visible items regardless of content", () => {
    const map = buildMap();
    expect(shouldShowUnlockedPlatformItem(map, "match_score", false)).toBe(true);
  });

  it("shows candidate_optional items only when content exists", () => {
    const map = buildMap();
    expect(shouldShowUnlockedPlatformItem(map, "match_narrative", false)).toBe(false);
    expect(shouldShowUnlockedPlatformItem(map, "match_narrative", true)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  placeholderRootWordLabel,
  placeholderSubLevelWordLabel,
} from "@/lib/matching/matrix-constants";

describe("matrix placeholder labels", () => {
  it("names level 1 root columns factor1–factor7", () => {
    expect(placeholderRootWordLabel(0, 1)).toBe("factor1");
    expect(placeholderRootWordLabel(0, 7)).toBe("factor7");
  });

  it("names deeper root rows LevelNWordM", () => {
    expect(placeholderRootWordLabel(1, 3)).toBe("Level1Word3");
    expect(placeholderRootWordLabel(2, 5)).toBe("Level2Word5");
  });

  it("names sub-level branches", () => {
    expect(placeholderSubLevelWordLabel(0, 1, 2)).toBe("Level1SubLevel1Word2");
    expect(placeholderSubLevelWordLabel(1, 4, 7)).toBe("Level2SubLevel4Word7");
  });
});

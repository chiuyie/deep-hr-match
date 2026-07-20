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

  it("names deeper root rows LevelNWordM (Level 2+)", () => {
    expect(placeholderRootWordLabel(1, 3)).toBe("Level2Word3");
    expect(placeholderRootWordLabel(2, 5)).toBe("Level3Word5");
    expect(placeholderRootWordLabel(6, 1)).toBe("Level7Word1");
  });

  it("names sub-level branches under Level 2+", () => {
    expect(placeholderSubLevelWordLabel(2, 1, 2)).toBe("Level2SubLevel1Word2");
    expect(placeholderSubLevelWordLabel(3, 2, 7)).toBe("Level3SubLevel2Word7");
  });
});

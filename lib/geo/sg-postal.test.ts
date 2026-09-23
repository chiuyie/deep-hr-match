import { describe, expect, it } from "vitest";
import {
  formatSgStreetAddress,
  isSingaporeCountry,
  isSingaporePostalCode,
  parseOneMapSearch,
} from "@/lib/geo/sg-postal";

describe("Singapore postal lookup", () => {
  it("treats only Singapore as a Singapore country", () => {
    expect(isSingaporeCountry("Singapore")).toBe(true);
    expect(isSingaporeCountry("sg")).toBe(true);
    expect(isSingaporeCountry("")).toBe(false);
    expect(isSingaporeCountry("Malaysia")).toBe(false);
  });

  it("accepts only 6-digit codes", () => {
    expect(isSingaporePostalCode("238801")).toBe(true);
    expect(isSingaporePostalCode("23880")).toBe(false);
    expect(isSingaporePostalCode("SW1A 1AA")).toBe(false);
  });

  it("formats block, road, and building", () => {
    expect(
      formatSgStreetAddress({
        BLK_NO: "2",
        ROAD_NAME: "ORCHARD TURN",
        BUILDING: "ION ORCHARD",
        ADDRESS: "2 ORCHARD TURN ION ORCHARD SINGAPORE 238801",
      })
    ).toBe("2 ORCHARD TURN, ION ORCHARD");
  });

  it("parses a OneMap search payload", () => {
    const lookup = parseOneMapSearch(
      {
        error: "Authentication token missing.",
        found: 1,
        results: [
          {
            BLK_NO: "640",
            ROAD_NAME: "ROWELL ROAD",
            BUILDING: "NIL",
            ADDRESS: "640 ROWELL ROAD SINGAPORE 200640",
            POSTAL: "200640",
          },
        ],
      },
      "200640"
    );
    expect(lookup?.address).toBe("640 ROWELL ROAD");
  });
});

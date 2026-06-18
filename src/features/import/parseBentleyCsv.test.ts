import { describe, expect, it } from "vitest";

import { parseBentleyRow, normalizeEndpoints } from "./bentleyRow";

describe("parseBentleyRow", () => {
  it("parses a standard row with OS tag", () => {
    const line =
      "HUB_2-17,6 DROP (TSC): 3500 S & GARDEN GATE RD,   1,BL,BL,<->,144-SMF 3500 S DIST,  11,BL,RO,HUB_2-17,CH 2724";
    const parsed = parseBentleyRow(line);
    expect(parsed).not.toBeNull();
    expect(parsed!.endpointA.fiberNumber).toBe(1);
    expect(parsed!.endpointB.fiberNumber).toBe(11);
    expect(parsed!.endpointB.osTag).toBe("CH 2724");
  });

  it("derives a blank To fiber number from tube+color (BL/RO = #11)", () => {
    const line =
      "HUB_2-17,6 DROP (TSC): 3500 S & GARDEN GATE RD,   3,BL,GR,<->,144-SMF 3500 S DIST, ,BL,RO,HUB_2-17,CH 2724";
    const parsed = parseBentleyRow(line);
    expect(parsed!.endpointB.fiberNumber).toBe(11);
  });

  it("parses bracket ATMS OS tag on To side", () => {
    const line =
      "HUB2-6(CALIFORNIA_AVE),288-SMF I-215 DIST: 500 S - I-80,  24,OR,AQ,<->,288-SMF I-215 DIST: SR-201 - N TEMPLE NB, ,OR,BL, ,[ATMS BB] 2-06 - 2-18";
    const parsed = parseBentleyRow(line);
    expect(parsed).not.toBeNull();
    expect(parsed!.endpointB.osTag).toContain("[ATMS BB]");
  });

  it("parses duplicate CH OS fields on To side", () => {
    const line =
      "HUB2-6(CALIFORNIA_AVE),18 DROP (CCTV): I-215 NB & I-80 (NE CORNER),   1,BL,BL,<->,48-SMF I-80 DIST: I-215 - REDWOOD RD, ,BL,BL, ,CH 2305,CH 2305";
    const parsed = parseBentleyRow(line);
    expect(parsed).not.toBeNull();
    expect(parsed!.endpointB.osTag).toBe("CH 2305");
  });

  it("derives blank To fiber number (BL/BL = #1) without persisting device", () => {
    const from = {
      device: "DEV",
      cableName: "288-SMF DIST I-215: COMPLEX - STATE OFFICE",
      fiberNumber: 5,
      tubeColor: "BL",
      fiberColor: "SL",
    };
    const to = {
      device: "",
      cableName: "6 DROP: I-215 SB MP 16.10",
      fiberNumber: 0,
      tubeColor: "BL",
      fiberColor: "BL",
    };
    const { endpointA, endpointB } = normalizeEndpoints(from, to);
    expect(endpointB.fiberNumber).toBe(1);
    expect(endpointA.device).toBeUndefined();
    expect(endpointB.device).toBeUndefined();
  });
});

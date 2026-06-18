import { describe, expect, it } from "vitest";

import { buildSnapshotFromExample, emptySnapshot } from "../buildSnapshot";
import { runRule } from "../runRules";
import { snapshotWith, validNormalizedImport } from "../testFixtures";
import { isError } from "../types";

import { sdcData001 } from "./ruleModule";

describe("sdc-data-001", () => {
  it("passes a valid hierarchy", () => {
    expect(runRule(sdcData001, snapshotWith(validNormalizedImport()))).toEqual([]);
  });

  it("returns [] when no normalized import is present", () => {
    expect(runRule(sdcData001, emptySnapshot())).toEqual([]);
  });

  it("errors when a fiber has no parent buffer tube", () => {
    const normalized = validNormalizedImport();
    normalized.fiberStrands[0]!.tubeId = "missing-tube";
    const violations = runRule(sdcData001, snapshotWith(normalized));
    expect(violations.filter(isError).length).toBeGreaterThan(0);
  });

  it("errors when a buffer tube has no fibers", () => {
    const normalized = validNormalizedImport();
    normalized.bufferTubes.push({
      tubeId: "A#from::OR",
      cableId: "A#from",
      tubeColor: "OR",
      fibersPerTube: 12,
      sourceRows: [99],
    });
    const violations = runRule(sdcData001, snapshotWith(normalized));
    expect(violations.filter(isError).length).toBeGreaterThan(0);
  });

  it("reference passes Example #1 with no errors", async () => {
    const snapshot = await buildSnapshotFromExample(1);
    expect(runRule(sdcData001, snapshot).filter(isError)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import { buildSnapshotFromExample, emptySnapshot } from "../buildSnapshot";
import { runRule } from "../runRules";
import { snapshotWith, validNormalizedImport } from "../testFixtures";
import { isError } from "../types";

import { sdcData002 } from "./ruleModule";

describe("sdc-data-002", () => {
  it("passes valid absolute numbers and inferred count", () => {
    expect(runRule(sdcData002, snapshotWith(validNormalizedImport()))).toEqual([]);
  });

  it("returns [] when no normalized import is present", () => {
    expect(runRule(sdcData002, emptySnapshot())).toEqual([]);
  });

  it("errors on a non-positive absolute fiber number", () => {
    const normalized = validNormalizedImport();
    normalized.fiberStrands[0]!.absoluteFiberNumber = 0;
    const violations = runRule(sdcData002, snapshotWith(normalized));
    expect(violations.filter(isError).length).toBeGreaterThan(0);
  });

  it("forwards a low-confidence inference as a non-blocking warning", () => {
    const normalized = validNormalizedImport();
    normalized.warnings.push({
      ruleId: "SDC-DATA-002",
      severity: "warning",
      message: "Buffer tube count inferred with low confidence.",
      objectIds: ["A#from"],
    });
    const violations = runRule(sdcData002, snapshotWith(normalized));
    expect(violations.filter(isError)).toEqual([]);
    expect(violations.some((v) => v.severity === "warning")).toBe(true);
  });

  it("reference passes Example #1 with no errors", async () => {
    const snapshot = await buildSnapshotFromExample(1);
    expect(runRule(sdcData002, snapshot).filter(isError)).toEqual([]);
  });
});

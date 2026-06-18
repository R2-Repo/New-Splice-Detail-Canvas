import { describe, expect, it } from "vitest";

import { buildSnapshotFromExample, emptySnapshot } from "../buildSnapshot";
import { runRule } from "../runRules";
import { snapshotWith, validNormalizedImport } from "../testFixtures";
import { isError } from "../types";

import { sdcConnect001 } from "./ruleModule";

describe("sdc-connect-001", () => {
  it("passes one dot per pair with resolvable endpoints", () => {
    expect(runRule(sdcConnect001, snapshotWith(validNormalizedImport()))).toEqual([]);
  });

  it("returns [] when no normalized import is present", () => {
    expect(runRule(sdcConnect001, emptySnapshot())).toEqual([]);
  });

  it("errors when an endpoint references an unknown fiber", () => {
    const normalized = validNormalizedImport();
    normalized.connectionPairs[0]!.endpointA.fiberId = "ghost-fiber";
    const violations = runRule(sdcConnect001, snapshotWith(normalized));
    expect(violations.filter(isError).length).toBeGreaterThan(0);
  });

  it("errors when dot count does not match pair count", () => {
    const normalized = validNormalizedImport();
    normalized.fusionSpliceDots = [];
    const violations = runRule(sdcConnect001, snapshotWith(normalized));
    expect(violations.filter(isError).length).toBeGreaterThan(0);
  });

  it("forwards a normalization error (identical endpoints)", () => {
    const normalized = validNormalizedImport();
    normalized.errors.push({
      ruleId: "SDC-CONNECT-001",
      severity: "error",
      message: "Connection pair-1 has identical endpoints.",
      objectIds: ["pair-1"],
    });
    const violations = runRule(sdcConnect001, snapshotWith(normalized));
    expect(violations.filter(isError).length).toBeGreaterThan(0);
  });

  it("reference passes Example #1 with no errors", async () => {
    const snapshot = await buildSnapshotFromExample(1);
    expect(runRule(sdcConnect001, snapshot).filter(isError)).toEqual([]);
  });
});

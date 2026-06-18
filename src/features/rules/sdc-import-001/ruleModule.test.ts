import { describe, expect, it } from "vitest";

import { buildSnapshotFromExample, emptySnapshot } from "../buildSnapshot";
import { runRule } from "../runRules";
import { snapshotWith, validNormalizedImport } from "../testFixtures";
import { isError } from "../types";

import { sdcImport001 } from "./ruleModule";

describe("sdc-import-001", () => {
  it("passes a valid normalized import", () => {
    expect(runRule(sdcImport001, snapshotWith(validNormalizedImport()))).toEqual([]);
  });

  it("returns [] when no normalized import is present", () => {
    expect(runRule(sdcImport001, emptySnapshot())).toEqual([]);
  });

  it("errors when the parse gap is non-zero", () => {
    const normalized = validNormalizedImport();
    normalized.source.parseGap = 2;
    const violations = runRule(sdcImport001, snapshotWith(normalized));
    expect(violations.filter(isError)).toHaveLength(1);
  });

  it("errors when a connection pair loses its source rows", () => {
    const normalized = validNormalizedImport();
    normalized.connectionPairs[0]!.sourceRows = [];
    const violations = runRule(sdcImport001, snapshotWith(normalized));
    expect(violations.filter(isError).length).toBeGreaterThan(0);
  });

  it("reference passes Example #1 with no errors", async () => {
    const snapshot = await buildSnapshotFromExample(1);
    expect(runRule(sdcImport001, snapshot).filter(isError)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import {
  buildSnapshotFromExample,
  buildSnapshotFromSp3254,
  emptySnapshot,
} from "./buildSnapshot";
import { REFERENCE_EXAMPLE_IDS } from "./referenceExamples";
import { listRules } from "./registry";
import { runRules } from "./runRules";

describe("rules system", () => {
  it("registers the data-stage rule modules", () => {
    expect(listRules().length).toBeGreaterThan(0);
  });

  it("registered rules pass on an empty snapshot (no normalized import)", () => {
    const result = runRules(emptySnapshot());
    expect(result.passed).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("rules system reference", () => {
  it.each(REFERENCE_EXAMPLE_IDS)(
    "all registered rules pass (no errors) on Example #%i horizontal",
    async (exampleId) => {
      const snapshot = await buildSnapshotFromExample(exampleId);
      const result = runRules(snapshot);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
    },
  );

  it("all registered rules pass (no errors) on SP-3254.5", async () => {
    const snapshot = await buildSnapshotFromSp3254();
    const result = runRules(snapshot);
    expect(result.errors).toEqual([]);
    expect(result.passed).toBe(true);
  });
});

describe("buildSnapshot reference", () => {
  it.each(REFERENCE_EXAMPLE_IDS)(
    "builds snapshot from Example #%i",
    async (exampleId) => {
      const snapshot = await buildSnapshotFromExample(exampleId);
      expect(snapshot.connectionGraph.connections.length).toBeGreaterThan(0);
      expect(snapshot.normalizedImport?.connectionPairs.length).toBeGreaterThan(0);
      expect(snapshot.layout.placements.length).toBeGreaterThan(0);
      expect(snapshot.routing.routes.length).toBeGreaterThan(0);
      expect(snapshot.reactFlow.nodes.length).toBeGreaterThan(0);
    },
  );
});

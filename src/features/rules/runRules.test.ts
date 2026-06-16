import { describe, expect, it } from "vitest";

import { buildSnapshotFromExample, emptySnapshot } from "./buildSnapshot";
import { REFERENCE_EXAMPLE_IDS } from "./referenceExamples";
import { listRules } from "./registry";
import { runRules } from "./runRules";

describe("rules system", () => {
  it("passes when no rules are registered", () => {
    expect(listRules()).toHaveLength(0);
    const result = runRules(emptySnapshot());
    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });
});

describe("rules system reference", () => {
  it.each(REFERENCE_EXAMPLE_IDS)(
    "all registered rules pass on Example #%i horizontal",
    async (exampleId) => {
      const snapshot = await buildSnapshotFromExample(exampleId);
      const result = runRules(snapshot);
      expect(result.violations).toEqual([]);
    },
  );
});

describe("buildSnapshot reference", () => {
  it.each(REFERENCE_EXAMPLE_IDS)(
    "builds snapshot from Example #%i",
    async (exampleId) => {
      const snapshot = await buildSnapshotFromExample(exampleId);
      expect(snapshot.connectionGraph.connections.length).toBeGreaterThan(0);
      expect(snapshot.layout.placements.length).toBeGreaterThan(0);
      expect(snapshot.routing.routes.length).toBeGreaterThan(0);
      expect(snapshot.reactFlow.nodes.length).toBeGreaterThan(0);
    },
  );
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "@/features/diagram/buildConnectionGraph";
import { enrichParsedCsv, parseBentleyCsv } from "@/features/import/parseBentleyCsv";
import { generateSp3254Candidates } from "@/features/rules/placement/generateCandidates";
import { compareLayoutModes, pickBestLayout } from "@/features/rules/placement/pickBestLayout";
import { scoreRouting } from "@/features/routing/scoreRouting";

import { buildSnapshotFromSp3254 } from "@/features/rules/buildSnapshot";

const CSV_PATH = join(process.cwd(), "docs/reference/examples/Left-SP-3254.5.csv");

function loadGraph() {
  const parsed = enrichParsedCsv(parseBentleyCsv(readFileSync(CSV_PATH, "utf8"), "Left-SP-3254.5.csv"));
  return buildConnectionGraph(parsed);
}

/** Gross-regression ceiling — update only when routing/scoring logic intentionally changes. */
const SP3254_HORIZONTAL_SCORE_BASELINE = 30_000;

describe("SP-3254.5 layout optimization", () => {
  it("generates multiple horizontal placement candidates", () => {
    const graph = loadGraph();
    const candidates = generateSp3254Candidates(graph);
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates.map((c) => c.id)).toContain("default");
    expect(candidates.map((c) => c.id)).toContain("mirror-sides");
  });

  it("pickBestLayout returns finite route score for horizontal mode", async () => {
    const graph = loadGraph();
    const result = await pickBestLayout(graph, "horizontal");
    expect(result.plan.id).toBeTruthy();
    expect(result.breakdown.score).toBeGreaterThan(0);
    expect(result.routing.routes.length).toBe(10);
  });

  it("optimized import score stays within regression baseline", async () => {
    const snapshot = await buildSnapshotFromSp3254({ layoutMode: "horizontal" });
    const breakdown = scoreRouting(snapshot);
    expect(breakdown.rejected).toBe(false);
    expect(breakdown.score).toBeLessThan(SP3254_HORIZONTAL_SCORE_BASELINE);
    expect(breakdown.bends).toBeGreaterThan(0);
  });

  it("compares horizontal vs quad scores for SP-3254.5", async () => {
    const graph = loadGraph();
    const { horizontal, quad } = await compareLayoutModes(graph);
    expect(horizontal.breakdown.score).toBeGreaterThan(0);
    expect(quad.breakdown.score).toBeGreaterThan(0);
    expect(typeof horizontal.breakdown.crossings).toBe("number");
    expect(typeof quad.breakdown.crossings).toBe("number");
  });

  it("SP-3254.5 produces a finite scored fanned layout (two-sided)", async () => {
    const graph = loadGraph();
    const { horizontal, quad } = await compareLayoutModes(graph);
    expect(horizontal.plan.id).toBeTruthy();
    expect(Number.isFinite(horizontal.breakdown.score)).toBe(true);
    expect(horizontal.breakdown.score).toBeGreaterThan(0);
    // Two-sided routing resolves every leg (no route errors); fanned legs bend.
    expect(horizontal.breakdown.routeErrors).toBe(0);
    expect(horizontal.breakdown.bends).toBeGreaterThan(0);
    expect(typeof quad.breakdown.crossings).toBe("number");
  });
});

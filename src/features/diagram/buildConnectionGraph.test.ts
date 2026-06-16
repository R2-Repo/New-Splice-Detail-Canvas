import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "./buildConnectionGraph";
import { parseBentleyCsv, enrichParsedCsv } from "@/features/import/parseBentleyCsv";

describe("buildConnectionGraph", () => {
  it("builds legs, fibers, and connections from example #1", () => {
    const csv = readFileSync(
      join(process.cwd(), "docs/reference/examples/old csv examples/CSV Splice Detail Example #1.csv"),
      "utf8",
    );
    const graph = buildConnectionGraph(enrichParsedCsv(parseBentleyCsv(csv, "ex1.csv")));

    expect(graph.connections.length).toBe(4);
    expect(graph.fibers.length).toBeGreaterThan(0);
    expect(graph.legs.length).toBeGreaterThanOrEqual(2);
  });
});

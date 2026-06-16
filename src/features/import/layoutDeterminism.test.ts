import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { runImport } from "./runImport";

describe("layoutDeterminism", () => {
  it("produces identical node positions for same CSV twice", async () => {
    const csv = readFileSync(
      join(process.cwd(), "docs/reference/examples/old csv examples/CSV Splice Detail Example #1.csv"),
      "utf8",
    );

    const a = await runImport(csv, "ex1.csv", { layoutMode: "horizontal" });
    const b = await runImport(csv, "ex1.csv", { layoutMode: "horizontal" });

    expect(a.error).toBeUndefined();
    expect(b.error).toBeUndefined();
    expect(a.nodes.length).toBe(b.nodes.length);
    expect(a.edges.length).toBe(b.edges.length);

    const posA = a.nodes.map((n) => `${n.id}:${n.position.x},${n.position.y}`).sort();
    const posB = b.nodes.map((n) => `${n.id}:${n.position.x},${n.position.y}`).sort();
    expect(posA).toEqual(posB);
  });
});

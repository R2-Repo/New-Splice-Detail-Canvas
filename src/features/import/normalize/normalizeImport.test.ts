import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { enrichParsedCsv, parseBentleyCsv } from "../parseBentleyCsv";
import { normalizeImport } from "./normalizeImport";

const SP3254_CSV = join(process.cwd(), "docs/reference/examples/Left-SP-3254.5.csv");

describe("normalizeImport (SP-3254.5)", () => {
  const parsed = enrichParsedCsv(parseBentleyCsv(readFileSync(SP3254_CSV, "utf8"), "Left-SP-3254.5.csv"));
  const normalized = normalizeImport(parsed);

  it("preserves all 20 connection pairs with source rows", () => {
    expect(normalized.connectionPairs).toHaveLength(20);
    expect(normalized.connectionPairs.every((pair) => pair.sourceRows.length > 0)).toBe(true);
  });

  it("creates exactly one fusion splice dot per connection pair", () => {
    expect(normalized.fusionSpliceDots).toHaveLength(normalized.connectionPairs.length);
  });

  it("builds the cable -> buffer tube -> fiber hierarchy", () => {
    expect(normalized.cables.length).toBeGreaterThan(0);
    expect(normalized.bufferTubes.length).toBeGreaterThan(0);
    expect(normalized.fiberStrands.length).toBeGreaterThan(0);
  });

  it("preserves positive absolute fiber numbers", () => {
    expect(normalized.fiberStrands.every((fiber) => fiber.absoluteFiberNumber > 0)).toBe(true);
  });

  it("produces no structural errors", () => {
    expect(normalized.errors).toEqual([]);
  });

  it("gives every fiber a parent tube and cable", () => {
    const cableIds = new Set(normalized.cables.map((cable) => cable.cableId));
    const tubeIds = new Set(normalized.bufferTubes.map((tube) => tube.tubeId));
    for (const fiber of normalized.fiberStrands) {
      expect(cableIds.has(fiber.cableId)).toBe(true);
      expect(tubeIds.has(fiber.tubeId)).toBe(true);
    }
  });
});

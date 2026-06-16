import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseBentleyCsv } from "./parseBentleyCsv";

const examplesDir = join(process.cwd(), "docs/reference/examples");
const oldExamplesDir = join(examplesDir, "old csv examples");

function loadCsv(relativePath: string): string {
  return readFileSync(join(examplesDir, relativePath), "utf8");
}

function loadOldCsv(name: string): string {
  return readFileSync(join(oldExamplesDir, name), "utf8");
}

describe("referenceCsvParse", () => {
  it("parses Left-STATE_OFFICE.csv with gap 0 and 104 pairs", () => {
    const parsed = parseBentleyCsv(loadCsv("Left-STATE_OFFICE.csv"), "Left-STATE_OFFICE.csv");
    expect(parsed.parseGap).toBe(0);
    expect(parsed.pairs.length).toBe(104);
    expect(parsed.header.spliceName).toBe("STATE_OFFICE");
  });

  it("parses Left-SPI-215_I-80.csv with gap 0 and 136 pairs", () => {
    const parsed = parseBentleyCsv(loadCsv("Left-SPI-215_I-80.csv"), "Left-SPI-215_I-80.csv");
    expect(parsed.parseGap).toBe(0);
    expect(parsed.pairs.length).toBe(136);
  });

  it("parses Left-SP-3254.5.csv with gap 0 and 20 pairs", () => {
    const parsed = parseBentleyCsv(loadCsv("Left-SP-3254.5.csv"), "Left-SP-3254.5.csv");
    expect(parsed.parseGap).toBe(0);
    expect(parsed.pairs.length).toBe(20);
  });

  it("parses CSV Splice Detail Examples #1–#3", () => {
    const one = parseBentleyCsv(loadOldCsv("CSV Splice Detail Example #1.csv"), "ex1.csv");
    const two = parseBentleyCsv(loadOldCsv("CSV Splice Detail Example #2.csv"), "ex2.csv");
    const three = parseBentleyCsv(loadOldCsv("CSV Splice Detail Example #3.csv"), "ex3.csv");

    expect(one.parseGap).toBe(0);
    expect(one.pairs.length).toBe(4);
    expect(two.parseGap).toBe(0);
    expect(two.pairs.length).toBe(6);
    expect(three.parseGap).toBe(0);
    expect(three.pairs.length).toBe(28);
  });
});

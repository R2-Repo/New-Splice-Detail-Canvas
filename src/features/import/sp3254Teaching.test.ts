import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "@/features/diagram/buildConnectionGraph";
import { assignCableSides } from "@/features/layout/assignCableSides";

import { cableLegIdentityFromParsed } from "./cableLegIdentity";
import { parseBentleyRow } from "./bentleyRow";
import { enrichParsedCsv, parseBentleyCsv } from "./parseBentleyCsv";

const CSV_PATH = join(process.cwd(), "docs/reference/examples/Left-SP-3254.5.csv");

function loadParsed() {
  return enrichParsedCsv(parseBentleyCsv(readFileSync(CSV_PATH, "utf8"), "Left-SP-3254.5.csv"));
}

describe("SP-3254.5 teaching CSV", () => {
  it("parses row 14 field-by-field as documented", () => {
    const line =
      "CENTRAL_UTAH_911_(VIA_HUB_3-07),72-SMF 4800 S DIST: MAIN ST - I-15,   1,BL,BL,<->,144-SMF I-15 DIST: MP 258.96 - 4800 S, ,VI,YL, ,[ATMS] CENTRAL UTAH 911";
    const row = parseBentleyRow(line);
    expect(row).not.toBeNull();

    expect(row!.endpointA).toMatchObject({
      cableName: "72-SMF 4800 S DIST: MAIN ST - I-15",
      fiberNumber: 1,
      tubeColor: "BL",
      fiberColor: "BL",
      csvColumn: "from",
    });
    expect(row!.endpointA.device).toBeUndefined();

    // Blank "To" fiber number is derived from tube+color (VI/YL = #117), not copied.
    expect(row!.endpointB).toMatchObject({
      cableName: "144-SMF I-15 DIST: MP 258.96 - 4800 S",
      fiberNumber: 117,
      tubeColor: "VI",
      fiberColor: "YL",
      osTag: "[ATMS] CENTRAL UTAH 911",
      csvColumn: "to",
    });
    expect(row!.endpointB.device).toBeUndefined();
  });

  it("dedupes bidirectional listings to 10 physical splices", () => {
    const parsed = loadParsed();
    expect(parsed.parseGap).toBe(0);
    // 20 CSV rows = 10 physical splices listed in both directions.
    expect(parsed.pairs.length).toBe(10);

    const legs = cableLegIdentityFromParsed(parsed);
    const byLegId = new Map(legs.map((l) => [l.legId, l]));

    // 72-SMF appears only as a source after dedupe -> single leg.
    expect(byLegId.get("72-SMF 4800 S DIST: MAIN ST - I-15#leg")).toMatchObject({
      fromCount: 8,
      toCount: 0,
    });
    // 144 (258.96) is the only through cable (both source and dest).
    expect(byLegId.get("144-SMF I-15 DIST: MP 258.96 - 4800 S#from")).toMatchObject({
      fromCount: 2,
      toCount: 0,
    });
    expect(byLegId.get("144-SMF I-15 DIST: MP 258.96 - 4800 S#to")).toMatchObject({
      fromCount: 0,
      toCount: 2,
    });
    expect(byLegId.get("144-SMF I-15 DIST: 4800 S - MP 259.46#leg")).toMatchObject({
      fromCount: 0,
      toCount: 4,
    });
    expect(byLegId.get("6 DROP (TSC): I-15 NB & 1600 S#leg")).toMatchObject({
      fromCount: 0,
      toCount: 4,
    });
  });

  it("assigns source and destination legs to opposite sides", () => {
    const graph = buildConnectionGraph(loadParsed());
    const sides = assignCableSides(graph, "horizontal");

    expect(sides.get("72-SMF 4800 S DIST: MAIN ST - I-15#leg")).toBe("left");
    expect(sides.get("6 DROP (TSC): I-15 NB & 1600 S#leg")).toBe("right");
    expect(sides.get("144-SMF I-15 DIST: MP 258.96 - 4800 S#from")).toBe("left");
    expect(sides.get("144-SMF I-15 DIST: MP 258.96 - 4800 S#to")).toBe("right");
  });
});

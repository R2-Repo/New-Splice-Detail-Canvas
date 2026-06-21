import { describe, expect, it } from "vitest";

import { parseSdcJson, serializeSdcJson, SDC_JSON_VERSION, type SdcJsonDocument } from "./parseSdcJson";

describe("parseSdcJson", () => {
  it("parses valid v1 document", () => {
    const doc = {
      version: SDC_JSON_VERSION,
      spliceName: "TEST_SPLICE",
      layoutMode: "horizontal" as const,
      sourceCsv: "Left ---\n",
    };
    const result = parseSdcJson(JSON.stringify(doc));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.spliceName).toBe("TEST_SPLICE");
    }
  });

  it("rejects unsupported version", () => {
    const result = parseSdcJson(JSON.stringify({ version: 99, spliceName: "x" }));
    expect(result.ok).toBe(false);
  });

  it("round-trips serialize with manual locks", () => {
    const doc: SdcJsonDocument = {
      version: SDC_JSON_VERSION,
      spliceName: "A",
      layoutMode: "horizontal",
      manualLocks: [
        {
          lockId: "cable:leg-a",
          objectType: "cable",
          objectId: "leg-a",
          lockedGeometry: { col: 2, row: 10, side: "left" },
          createdAt: "2026-06-21T00:00:00.000Z",
        },
      ],
    };
    const parsed = parseSdcJson(serializeSdcJson(doc));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.document.manualLocks?.length).toBe(1);
    }
  });
});

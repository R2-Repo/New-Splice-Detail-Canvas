import { describe, expect, it } from "vitest";

import { detectImportFormat } from "./detectImportFormat";

describe("detectImportFormat", () => {
  it("detects csv by extension", () => {
    expect(detectImportFormat("Left ---\n", "file.csv")).toBe("csv");
  });

  it("detects sdc-json", () => {
    expect(detectImportFormat('{"version":1}', "diagram.sdc.json")).toBe("sdc-json");
  });
});

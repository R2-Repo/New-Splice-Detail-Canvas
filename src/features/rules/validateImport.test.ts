import { describe, expect, it } from "vitest";

import { runImport } from "@/features/import/runImport";

import { readReferenceExampleCsv, referenceExampleFileName } from "./referenceExamples";
import { formatValidation, validateImportResult } from "./validateImport";

describe("validateImportResult", () => {
  it("passes (no errors) on Example #1", async () => {
    const result = await runImport(readReferenceExampleCsv(1), referenceExampleFileName(1), {
      layoutMode: "horizontal",
    });
    const validation = validateImportResult(result);
    expect(validation.errors).toEqual([]);
    expect(validation.passed).toBe(true);
  });

  it("formats a clean pass message", async () => {
    const result = await runImport(readReferenceExampleCsv(2), referenceExampleFileName(2), {
      layoutMode: "horizontal",
    });
    const validation = validateImportResult(result);
    if (validation.warnings.length === 0) {
      expect(formatValidation(validation)).toContain("all checks passed");
    } else {
      expect(formatValidation(validation)).toContain("warning(s)");
    }
  });
});

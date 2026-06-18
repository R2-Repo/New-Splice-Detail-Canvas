import { messagesForRule } from "../sdcValidation";
import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";

/**
 * SDC-IMPORT-001 — normalized import model integrity.
 * Checks the normalized model is parseable, complete, and source-traceable.
 */
export const sdcImport001: RuleModule = {
  id: ruleId("sdc-import-001"),
  title: "CSV Import, Normalization, and Bentley Compatibility",
  stage: "data",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const normalized = snapshot.normalizedImport;
    if (!normalized) return [];

    const violations: RuleViolation[] = [];

    if (normalized.source.parseGap > 0) {
      violations.push({
        ruleId: ruleId("SDC-IMPORT-001"),
        severity: "error",
        message: `Parse gap is ${normalized.source.parseGap}; some left rows did not produce splice pairs.`,
        objectType: "importFile",
        objectIds: [normalized.source.fileName],
        suggestedFix: "Open the connection inspector and resolve the unparsed rows before layout.",
      });
    }

    for (const pair of normalized.connectionPairs) {
      if (pair.sourceRows.length === 0) {
        violations.push({
          ruleId: ruleId("SDC-IMPORT-001"),
          severity: "error",
          message: `Connection ${pair.connectionId} lost its source row reference.`,
          objectType: "connectionPair",
          objectIds: [pair.connectionId],
          suggestedFix: "Source rows must be preserved through normalization.",
        });
      }
    }

    violations.push(
      ...messagesForRule([...normalized.errors, ...normalized.warnings], "SDC-IMPORT-001"),
    );

    return violations;
  },
};

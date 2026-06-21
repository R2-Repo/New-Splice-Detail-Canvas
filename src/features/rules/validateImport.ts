import type { ImportResult } from "@/features/import/runImport";

import { runRules } from "./runRules";
import type { DiagramSnapshot, RunRulesResult } from "./types";

/** Assemble a rule snapshot from a finished import result (no re-import). */
export function snapshotFromImportResult(result: ImportResult): DiagramSnapshot {
  return {
    layoutMode: result.layoutMode,
    connectionGraph: result.connectionGraph,
    normalizedImport: result.normalizedImport,
    layout: result.layout,
    routing: result.routing,
    manualLocks: result.manualLocks,
    reactFlow: {
      nodes: result.nodes,
      edges: result.edges,
      zoneLayout: result.zoneLayout,
      zoneMode: result.zoneMode,
      laneBook: result.laneBook,
    },
  };
}

/** Run all registered SDC rules against an import result. */
export function validateImportResult(result: ImportResult): RunRulesResult {
  return runRules(snapshotFromImportResult(result));
}

/** Human-readable validation summary for the inspector overlay. */
export function formatValidation(result: RunRulesResult): string {
  if (result.errors.length === 0 && result.warnings.length === 0) {
    return "Validation: all checks passed.";
  }

  const lines = [
    `Validation: ${result.errors.length} error(s), ${result.warnings.length} warning(s).`,
    "",
  ];

  for (const violation of [...result.errors, ...result.warnings]) {
    const severity = (violation.severity ?? "error").toUpperCase();
    const rows = violation.sourceRows?.length ? ` (rows ${violation.sourceRows.join(", ")})` : "";
    lines.push(`  [${severity}] ${violation.ruleId}: ${violation.message}${rows}`);
    if (violation.suggestedFix) {
      lines.push(`      fix: ${violation.suggestedFix}`);
    }
  }

  return lines.join("\n");
}

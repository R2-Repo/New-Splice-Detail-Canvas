# Validation Messages and Severity Levels

Rule ID: SDC-VALIDATE-001
Related Rules: SDC-CORE-001, SDC-IMPORT-001, SDC-DATA-001, SDC-DATA-002, SDC-ORDER-001, SDC-ORDER-002, SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-LAYOUT-003, SDC-LABEL-001, SDC-CONNECT-001, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-ROUTE-004, SDC-SCORE-001, SDC-UX-001, SDC-EXPORT-001, SDC-VISUAL-001
Reference Example Images/Docs: Import errors, route validation results, export warnings, AI agent debugging output
Rule Type: Validation output standard
Status: Active

## Purpose
Define a standard validation message format so every rule failure, warning, and informational note can be understood by the user, UI, AI agent, and export process.

Every validation message should identify the rule that produced it, the affected object, the severity, the reason, and the suggested fix.

## Core Principle
The app should never produce vague validation output like "layout failed" or "CSV corrupted" without actionable detail. Every validation result must be connected to a rule ID and object identity.

## Severity Levels
The app should use three primary severity levels:

```text
error = must be fixed or accepted through a specific override before final output
warning = layout/export may continue, but user should review
info = useful state, diagnostic detail, or non-blocking note
```

## Recommended Validation Object
Every validation result SHOULD use this structure:

```json
{
  "id": "validation-result-id",
  "ruleId": "SDC-ROUTE-003",
  "severity": "error",
  "objectType": "fiberRoute",
  "objectIds": ["route-123"],
  "sourceRows": [42],
  "message": "Fiber route overlaps another route for 120px.",
  "details": "Route route-123 shares grid lane x=420,y=300-420 with route route-099.",
  "suggestedFix": "Retry layout, move the splice dot, or unlock nearby locked route segments.",
  "blocksExport": true,
  "autoFixAvailable": true,
  "createdAtStage": "route-validation"
}
```

## Required Fields
Each validation result MUST include:

- `ruleId`.
- `severity`.
- `objectType`.
- `objectIds`.
- `message`.
- `blocksExport`.

Each validation result SHOULD include when available:

- Source row number [SDC-IMPORT-001].
- Source column name.
- Affected grid lane or route segment [SDC-GRID-001].
- Related rule IDs.
- Suggested fix.
- Whether auto-fix is available.
- Validation stage.

## Validation Stages
Validation should run at multiple stages.

Recommended stages:

1. Import validation [SDC-IMPORT-001].
2. Hierarchy validation [SDC-DATA-001].
3. Buffer tube count validation [SDC-DATA-002].
4. Color order validation [SDC-ORDER-001], [SDC-ORDER-002].
5. Connection pairing validation [SDC-CONNECT-001].
6. Layout mode and side assignment validation [SDC-LAYOUT-003].
7. Fanout and label validation [SDC-LAYOUT-002], [SDC-LABEL-001].
8. Routing zone and grid validation [SDC-ROUTE-001], [SDC-GRID-001].
9. Route geometry validation [SDC-ROUTE-004].
10. Overlap, crossing, collision, and spacing validation [SDC-ROUTE-003], [SDC-LAYOUT-001].
11. Manual lock validation [SDC-UX-001].
12. Scoring and retry summary validation [SDC-SCORE-001].
13. Export validation [SDC-EXPORT-001].

## Error Severity
Use `error` when the diagram is structurally wrong, impossible to route correctly, or not safe to export as a trusted splice detail.

Examples:

- CSV cannot be parsed [SDC-IMPORT-001].
- Required cable hierarchy is missing [SDC-DATA-001].
- Absolute strand number is invalid [SDC-DATA-002].
- Connection endpoint cannot be found [SDC-CONNECT-001].
- Route leaves the routing zone [SDC-ROUTE-001].
- Route overlaps another route [SDC-ROUTE-003].
- Required label is unreadable [SDC-LABEL-001].
- Locked item was moved by auto layout [SDC-UX-001].
- Export would clip required diagram content [SDC-EXPORT-001].

## Warning Severity
Use `warning` when the diagram is usable but may need user review.

Examples:

- Buffer tube count was inferred with low confidence [SDC-DATA-002].
- CSV contains optional blank labels [SDC-IMPORT-001].
- Controlled crossing is allowed but visible [SDC-ROUTE-003].
- Route bend count exceeds preferred count but stays under hard maximum [SDC-ROUTE-004].
- OS label was truncated visually [SDC-LABEL-001].
- Manual lock prevents a cleaner route [SDC-UX-001].
- PDF includes optional embedded config data [SDC-EXPORT-001].

## Info Severity
Use `info` for non-blocking diagnostics or helpful status.

Examples:

- Import completed with 144 strands.
- Cable was assigned to the left side by auto layout [SDC-LAYOUT-003].
- Retry Layout selected candidate 4 of 12 [SDC-SCORE-001].
- Full OS label is available in object metadata [SDC-LABEL-001].

## Export Blocking
The `blocksExport` value should be true when the validation result makes the PDF or config output unreliable.

Recommended export blocking behavior:

- Errors block normal export.
- Warnings do not block export by default.
- Info messages do not block export.
- The app may allow an intentional "export with warnings" flow, but not an export with unresolved errors unless the project explicitly supports that override.

## Source Row Traceability
For import-related objects, validation results should include source row numbers [SDC-IMPORT-001].

This applies to:

- Cable records.
- Buffer tube records.
- Fiber strand records.
- Connection pairs.
- OS circuit labels.
- Ambiguous or duplicate rows.

## Object IDs
Validation should reference stable object IDs.

Recommended object types:

```text
importFile
sourceRow
fiberCable
bufferTube
fiberStrand
fanout
fanoutExitPoint
connectionPair
fusionSpliceDot
fiberRoute
routeSegment
gridLane
label
layoutCandidate
manualLock
exportDocument
```

## Suggested Fix Text
Every error and warning SHOULD include a suggested fix.

Suggested fixes should be practical, such as:

- "Check CSV header mapping."
- "Retry layout."
- "Unlock the locked splice dot and rerun layout."
- "Increase fanout spacing."
- "Move cable to another side."
- "Review source row 42 for missing endpoint data."

## AI Agent Debugging Output
Validation output should be structured enough for an AI coding agent to debug the app.

The app SHOULD include:

- Rule ID.
- Failed object ID.
- Validation stage.
- Expected condition.
- Actual observed condition.
- Coordinates or grid lanes when relevant.
- Source row references when relevant.

## Required Behavior
The validation system MUST:

1. Use standardized severities.
2. Include rule IDs in every validation result.
3. Include affected object IDs.
4. Include source rows when available.
5. Explain what failed.
6. Provide suggested fixes for errors and warnings.
7. Clearly mark whether export is blocked.
8. Preserve validation results for the UI and AI agent.
9. Run before export.

## Invalid Patterns
The app should treat these as invalid validation behavior:

- Message has no rule ID.
- Message has no affected object.
- Error only says "failed" without reason.
- CSV import error does not identify the missing header or row.
- Route error does not identify route IDs or grid segments.
- Export proceeds despite unresolved blocking errors.
- Warnings are hidden from the user.

## Relationship to the modular rule framework
This rule's `RuleViolation`-style output is the human/spec contract. The code framework (`src/features/rules/`) already returns `RuleViolation[]` per module; future rule modules SHOULD emit results compatible with the fields above (rule ID, severity, object IDs, suggested fix, blocksExport).

## Summary
Validation messages are the communication layer for the rule system. Every rule failure must produce a clear, structured, actionable result with a rule ID, severity, object IDs, optional source rows, suggested fix, and export-blocking status. This makes the app easier to debug, safer to export, and easier for an AI agent to improve.

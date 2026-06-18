# Persistence, Config, PDF Export, and Reimport

Rule ID: SDC-EXPORT-001
Related Rules: SDC-IMPORT-001, SDC-DATA-001, SDC-DATA-002, SDC-CONNECT-001, SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-LAYOUT-003, SDC-LABEL-001, SDC-ROUTE-001, SDC-ROUTE-003, SDC-ROUTE-004, SDC-UX-001, SDC-SCORE-001, SDC-VALIDATE-001, SDC-VISUAL-001
Reference Example Images/Docs: Saved JSON configs; exported PDFs; optional PDF-embedded config; reimported diagrams
Rule Type: Persistence and export
Status: Active

## Purpose
Define how the app saves diagram state, exports PDF output, exports JSON config, optionally embeds rebuild data in a PDF, and reimports a saved diagram without losing layout, locks, validation state, or imported splice meaning.

## Core Principle
The PDF is the visual output. The JSON config is the source of truth for rebuilding the editable canvas. If PDF-embedded data is supported, it must contain the same safe config data and must not rely on extracting geometry from the PDF drawing.

## Required Saved State
A saved diagram config SHOULD include:

```text
DiagramConfig
  -> schemaVersion
  -> appVersion
  -> rulePackVersion
  -> sourceImportMetadata
  -> normalizedImportModel
  -> cableHierarchy
  -> connectionPairs
  -> layoutMode
  -> sideAssignments
  -> cablePositions
  -> bufferTubePositions
  -> fanoutGeometry
  -> labelGeometry
  -> fusionSpliceDotPositions
  -> routeGeometry
  -> gridReservations
  -> manualLocks
  -> visualSettings
  -> validationResults
  -> exportSettings
```

## Schema Versioning
Every saved config MUST include a schema version.

Schema versioning is required because rule logic and data structure will change over time.

Recommended fields:

```json
{
  "schemaVersion": "1.0.0",
  "appVersion": "0.1.0",
  "rulePackVersion": "SDC-RULES-2026-06"
}
```

The app SHOULD include migration logic for old config versions.

## Source Import Metadata
The config SHOULD preserve source import metadata [SDC-IMPORT-001].

Recommended metadata:

- Original file name.
- Import timestamp.
- File hash.
- Detected encoding.
- Header map used.
- Row count.
- Import warnings.
- Source row references.

The app does not need to store the full original CSV if the normalized model is sufficient, but storing raw row snapshots can help with diagnostics.

## Normalized Model Persistence
The saved config MUST preserve the normalized data model that the layout was built from [SDC-IMPORT-001].

It MUST preserve:

- Cable IDs.
- Buffer tube IDs.
- Absolute fiber strand numbers.
- Fiber strand colors.
- OS circuit names.
- Connection pair IDs.
- Source row references.

The config MUST NOT depend on current screen geometry to reconstruct imported data.

## Layout State Persistence
The saved config MUST preserve accepted layout geometry.

Required geometry:

- Layout mode [SDC-LAYOUT-003].
- Cable side assignments.
- Cable positions.
- Buffer tube positions.
- Fanout exit points [SDC-LAYOUT-002].
- Label bounding boxes [SDC-LABEL-001].
- Fusion splice dot positions [SDC-CONNECT-001].
- Route points and segments [SDC-ROUTE-004].
- Grid lane reservations [SDC-GRID-001].

## Manual Lock Persistence
Manual locks MUST survive save, reload, PDF export, and config export [SDC-UX-001].

Saved manual lock data SHOULD include:

```text
ManualLock
  -> lockId
  -> objectType
  -> objectId
  -> lockedGeometry
  -> lockReason
  -> createdByUser
  -> createdAt
```

The app MUST NOT reload a diagram and lose locked positions.

## JSON Config Export
The JSON config export should be the primary editable persistence format.

JSON config export MUST:

- Preserve all normalized data.
- Preserve accepted layout geometry.
- Preserve manual locks.
- Preserve validation results.
- Preserve visual settings.
- Include schema version.
- Be reimportable by the app.

## PDF Export
PDF export should create a clean static splice detail that can be shared, printed, or archived.

PDF export MUST:

- Use the accepted layout state.
- Preserve visible cable, buffer tube, fanout, strand, dot, and label geometry.
- Keep labels legible [SDC-LABEL-001].
- Keep colors and line weights readable [SDC-VISUAL-001].
- Avoid clipping diagram content.
- Include relevant warnings only if the app supports visible warning output.
- Run export validation before generating the final file [SDC-VALIDATE-001].

PDF export MUST NOT:

- Re-run layout and produce a different geometry without user action.
- Drop locked manual changes.
- Reconstruct routes from scratch unless the user explicitly reruns layout.
- Export an unresolved error state as if it were valid.

## Optional PDF-Embedded Config
The app may support embedding JSON config inside a PDF.

If supported, embedded config SHOULD:

- Be plain JSON or safely compressed JSON.
- Match the exported JSON config schema.
- Be versioned.
- Avoid executable content.
- Avoid PDF JavaScript.
- Avoid macros.
- Avoid external network references.
- Include a clear metadata marker that the PDF contains app rebuild data.

Security-conscious default:

- Keep JSON config export as the primary persistence file.
- Treat PDF-embedded config as optional.
- Allow project settings to disable embedded config.

## PDF Reimport
If the app supports PDF reimport, it should only rebuild the editable canvas from embedded config data, not from visual PDF geometry.

PDF reimport SHOULD:

1. Check whether the PDF contains supported embedded config.
2. Validate the embedded config schema version.
3. Load normalized data and layout state.
4. Restore manual locks.
5. Restore route geometry and labels.
6. Run validation.
7. Warn if the embedded config version requires migration.

PDF reimport SHOULD NOT:

- Attempt to infer all fiber routes from rendered PDF lines.
- Treat a PDF with no embedded config as fully editable source data.
- Silently rebuild a different diagram.

## Config Reimport
When a JSON config is reimported, the app MUST:

- Validate schema version.
- Restore normalized data.
- Restore layout geometry.
- Restore manual locks.
- Restore visual settings.
- Run validation.
- Report migration warnings when needed [SDC-VALIDATE-001].

## Export Validation
Before export, the app MUST run validation [SDC-VALIDATE-001].

Export should be blocked when:

- Required data is missing.
- Route geometry has unresolved hard errors.
- Required labels are clipped or unreadable.
- Manual lock state is inconsistent.
- The PDF page bounds cannot fit the diagram.
- The config cannot be serialized.

Export may proceed with warnings when the project allows it.

## File Naming
Recommended file naming:

```text
<project-or-location>_splice-detail_<date>.pdf
<project-or-location>_splice-detail_<date>.json
```

The app should sanitize file names to avoid invalid filesystem characters.

## Required Behavior
The app MUST:

1. Save normalized import data.
2. Save layout geometry.
3. Save manual locks.
4. Save validation results.
5. Export a PDF from the accepted layout.
6. Export a reimportable JSON config.
7. Include schema version in saved config.
8. Validate before export.
9. Restore saved diagrams without changing data or geometry.
10. Clearly warn when PDF-embedded config is unsupported, missing, or invalid.

## Invalid Patterns
The app should treat these as invalid:

- PDF export reroutes the diagram differently from the accepted canvas.
- Manual locks disappear after reload.
- Reimport changes connection pairings.
- Saved config omits absolute strand numbers.
- PDF reimport tries to infer editable state from vector line geometry only.
- Embedded PDF data includes executable scripts or external references.
- Export completes despite blocking validation errors.

## Implementation gap (current code)
The current persistence format is the minimal `.sdc.json` v1 (`src/features/import/parseSdcJson.ts`): `version`, `spliceName`, `layoutMode`, optional `sourceCsv`, `connectionGraph`, `layoutOverrides`, `nodePositions`. This rule defines a richer `DiagramConfig` (schemaVersion, rulePackVersion, normalizedImportModel, manualLocks, routeGeometry, validationResults, etc.). Treat `DiagramConfig` as the target and provide migration from v1. PDF export and PDF-embedded config are not yet implemented.

## Summary
Persistence and export must keep the app trustworthy. JSON config is the primary editable save format. PDF is the visual deliverable. Optional embedded PDF config can support rebuilds only if it safely stores the same versioned JSON data. Reimport must restore normalized data, layout geometry, manual locks, validation state, and visual settings without silently changing the splice detail.

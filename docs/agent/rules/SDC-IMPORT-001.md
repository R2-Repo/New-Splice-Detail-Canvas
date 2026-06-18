# CSV Import, Normalization, and Bentley Compatibility

Rule ID: SDC-IMPORT-001
Related Rules: SDC-DATA-001, SDC-DATA-002, SDC-ORDER-001, SDC-ORDER-002, SDC-CONNECT-001, SDC-LAYOUT-003, SDC-SCORE-001, SDC-VALIDATE-001, SDC-EXPORT-001
Reference Example Images/Docs: Bentley OpenComms Designer CSV exports; project CSV samples (`docs/reference/examples/`); saved diagram config files
Rule Type: Data import and normalization
Status: Active

## Purpose
Define how the app imports a Bentley OpenComms Designer CSV, normalizes it into a stable internal data model, validates required fields, and protects the routing engine from malformed or spreadsheet-modified CSV files.

This rule runs before cable hierarchy, buffer tube count inference, color ordering, connection pairing, layout, routing, validation, and export [SDC-DATA-001], [SDC-DATA-002], [SDC-CONNECT-001].

## Core Principle
The CSV import step must create a clean normalized model once. Layout and routing may rearrange visual geometry, but they must not change imported cable identity, buffer tube identity, fiber strand number, strand color, OS circuit name, or splice connection meaning [SDC-DATA-001], [SDC-CONNECT-001].

## Import Pipeline
The import module MUST process a CSV in this order:

1. Read the file bytes.
2. Detect encoding and line ending style.
3. Parse CSV rows using a real CSV parser.
4. Normalize headers.
5. Normalize cell values.
6. Remove fully empty rows.
7. Ignore extra fully empty trailing columns.
8. Map source columns to internal fields.
9. Preserve original source row numbers.
10. Build a normalized row model.
11. Build cable, buffer tube, strand, and connection candidate records.
12. Run import validation [SDC-VALIDATE-001].
13. Pass the accepted normalized model to hierarchy validation [SDC-DATA-001].

## CSV Parser Requirements
The app MUST support:

- UTF-8.
- UTF-8 with BOM.
- Windows-style CRLF line endings.
- Unix-style LF line endings.
- Quoted fields.
- Commas inside quoted fields.
- Empty cells.
- Extra whitespace around unquoted values.
- Spreadsheet-resaved CSV files when the required semantic columns remain present.

The app MUST NOT:

- Parse CSV by splitting each line on commas manually.
- Depend on exact column order when headers can be matched safely.
- Treat a trailing empty row as a corrupted file.
- Treat a UTF-8 BOM as part of the first header name.
- Silently discard rows that contain required splice data.

## Header Normalization
Header matching SHOULD be case-insensitive and whitespace-insensitive.

Header normalization SHOULD:

- Trim leading and trailing whitespace.
- Collapse repeated internal whitespace.
- Remove BOM characters.
- Normalize common punctuation differences.
- Support known Bentley header aliases.
- Preserve the original header text for debugging.

Example normalization:

```text
" Fiber Strand " -> "fiber strand"
"OS Name" -> "os name"
"OS Circuit Name" -> "os circuit name"
```

## Cell Normalization
Cell normalization SHOULD:

- Trim leading and trailing whitespace.
- Preserve meaningful internal spaces in labels and OS names.
- Normalize empty strings to null.
- Normalize color names to the standard color vocabulary [SDC-ORDER-001], [SDC-ORDER-002].
- Normalize fiber strand numbers to integers when safe.
- Preserve raw string values for diagnostics and re-export [SDC-EXPORT-001].

The app MUST NOT renumber fiber strands during normalization [SDC-DATA-002].

## Required Normalized Objects
A successful import MUST produce these object types when data exists:

```text
NormalizedImport
  -> SourceMetadata
  -> NormalizedRows
  -> CableRecords
  -> BufferTubeRecords
  -> FiberStrandRecords
  -> ConnectionCandidateRecords
  -> ImportWarnings
  -> ImportErrors
```

Each normalized row SHOULD keep:

- Source row number.
- Original raw row values.
- Normalized field values.
- Imported cable identity.
- Buffer tube identity or buffer tube color.
- Absolute fiber strand number.
- Fiber strand color.
- OS circuit name, when available.
- Connection or splice pairing fields, when available.

## Required Internal Field Meaning
The app SHOULD map the CSV to these internal concepts:

- Cable ID or cable name.
- Cable side or inferred side, when available.
- Cable fiber count, when available.
- Buffer tube color or buffer tube index.
- Fiber strand number.
- Fiber strand color.
- OS circuit name or service label.
- Connection endpoint A.
- Connection endpoint B.
- Splice relationship or connection key.

Exact Bentley column names may vary. The import module should support aliases through a configurable header map.

## Bentley Compatibility Behavior
Bentley CSV exports may be edited by spreadsheet tools. Spreadsheet tools may change line endings, add BOM characters, remove invisible formatting, alter quotes, or add empty trailing rows.

The app SHOULD accept a modified CSV when:

- Required headers are still present or can be mapped.
- Required splice values are still present.
- Connection pairings can still be inferred or read.
- Fiber strand numbers remain valid.
- Cable and buffer tube grouping can still be constructed.

The app SHOULD reject or warn when:

- Required headers are missing.
- Required endpoint fields are empty.
- Fiber strand numbers are missing or invalid.
- Duplicate rows create ambiguous connection pairs.
- Required cable identity cannot be determined.
- Required connection pairing cannot be determined [SDC-CONNECT-001].

## Bentley Splice Report Appendix (folded from prior IMPORT spec)
The reference Bentley "Splice Report" export has a specific shape. The following concrete behaviors were proven against the example CSVs and MUST be honored by the parser (they refine, not replace, the generic rules above):

- The report has a **Left section and a Right section** separated by `---` markers. The **Left section is authoritative** for connection pairing.
- One `<->` row represents **one splice pair**. Trailing/leading commas around `<->` are stripped.
- A **blank "To fiber #"** copies the "From fiber #".
- The To-side fixed tail is: `fiber#`, tube, fiber color, device [, OS...].
- **Terminating Device** is parsed structurally (the field before the cable on the From side; the device slot on the To side) but is **not stored or used** in the connection graph or layout. It is metadata only.
- The Right `---` section is **hints only** and is never paired.
- The parse gap (unmatched/leftover rows) MUST be `0` before layout runs (see `inspectBentleyCsv`).

When the header map or section markers cannot be found, fall back to alias-based header mapping and emit actionable validation messages [SDC-VALIDATE-001].

## Import Confidence
The import module SHOULD assign confidence levels when values are inferred.

Recommended confidence values:

```text
high = value was explicitly provided and validated
medium = value was inferred from strong row patterns
low = value was inferred from incomplete data
unknown = value could not be determined
```

Low-confidence inference should create a warning but should not always block layout [SDC-VALIDATE-001].

## Error Handling
Import errors MUST be specific and actionable.

Each import error SHOULD include:

- Rule ID: SDC-IMPORT-001.
- Severity.
- Source row number, when applicable.
- Source column name, when applicable.
- The invalid value.
- Expected value or expected format.
- Suggested fix.

Generic messages like "CSV corrupted" SHOULD be avoided. The app should explain what failed.

## Relationship to Cable Hierarchy
After import, the normalized model MUST be passed to the hierarchy rule [SDC-DATA-001].

The import rule creates candidate records. The hierarchy rule confirms that:

- Each fiber cable exists.
- Each buffer tube belongs to exactly one cable.
- Each fiber strand belongs to exactly one buffer tube.
- No strand exists directly under a cable without a buffer tube.

## Relationship to Buffer Tube Count
The import rule may read cable count and observed strand patterns, but buffer tube count inference belongs to [SDC-DATA-002].

The import rule MUST preserve enough source data for [SDC-DATA-002] to determine whether the cable is using 6-count or 12-count buffer tubes.

## Relationship to Connection Pairing
The import rule SHOULD extract connection candidate rows, but final connection pair validation belongs to [SDC-CONNECT-001].

The import rule MUST preserve endpoint identity and source row numbers so connection errors can be traced back to the CSV [SDC-VALIDATE-001].

## Required Behavior
The import module MUST:

1. Use a real CSV parser.
2. Normalize headers and cell values safely.
3. Preserve raw source data for diagnostics.
4. Preserve source row numbers.
5. Preserve absolute fiber strand numbers.
6. Preserve OS circuit names without unwanted truncation.
7. Create deterministic normalized IDs.
8. Identify missing required fields.
9. Emit actionable validation messages.
10. Pass a stable normalized model to downstream rules.

## Invalid Import Patterns
The app should treat these as invalid:

- CSV parsed by naive comma splitting.
- Header names fail because of BOM or extra spaces.
- Spreadsheet-resaved CSV fails only because line endings changed.
- Empty trailing rows create fake cable records.
- Required splice rows are silently dropped.
- Source row numbers are lost.
- Absolute strand numbers are changed.
- Connection pairings are guessed without warning.
- Import succeeds with no cable hierarchy available.

## Validation
The import should fail this rule if:

- The file cannot be parsed as CSV.
- Required headers cannot be mapped.
- Required row values are missing.
- Cable identity cannot be determined.
- Fiber strand numbers are invalid.
- Connection candidates cannot be extracted when connection data is required.
- The normalized model cannot support [SDC-DATA-001] and [SDC-CONNECT-001].

The import should warn if:

- Optional labels are missing.
- Buffer tube count must be inferred with low confidence [SDC-DATA-002].
- Cable side assignment must be inferred [SDC-LAYOUT-003].
- Duplicate optional labels exist but do not break connection identity.

## Implementation gap (current code)
- The current parser (`src/features/import/parseBentleyCsv.ts`, `inspectBentleyCsv.ts`, `runImport.ts`) implements the Bentley appendix above but predates the generic normalized-model contract (`NormalizedImport`, confidence levels, header alias map). Treat this rule as the target during the import rebuild.
- The current parser also accepts `.sdc.json` (`parseSdcJson.ts`); persistence/reimport is owned by [SDC-EXPORT-001].

## Summary
The CSV import rule protects the rest of the app. It turns Bentley CSV data into a stable normalized model, supports common spreadsheet-resaved CSV changes, preserves absolute fiber identity, keeps source diagnostics, and produces actionable errors before hierarchy, connection pairing, layout, routing, scoring, and export run.

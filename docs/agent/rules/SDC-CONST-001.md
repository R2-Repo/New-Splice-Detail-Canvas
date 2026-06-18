# Layout Constants and Defaults

Rule ID: SDC-CONST-001
Related Rules: SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-ROUTE-001, SDC-ROUTE-004, SDC-CONNECT-001, SDC-VISUAL-001
Reference Example Images/Docs: Existing grid constants (`src/features/grid/constants.ts`); SDC spacing/route/visual rules
Rule Type: Configuration / shared defaults
Status: Active

## Purpose
Pin the concrete numeric defaults the rest of the rules reference but do not fix. Several rules say a value is "configurable" without giving a number (fanout min/max spacing, strand spacing buffer, fusion dot radius, page padding). This rule is the single source of truth for those defaults so layout, routing, scoring, and rendering stay consistent.

This is a configuration rule, not a per-diagram validator. There is no rule module; the canonical values are exported in code as `SDC_DEFAULTS` (`src/features/layout/sdcDefaults.ts`).

## Core Principle
All layout/routing/visual code MUST read these defaults from one place. No feature should hardcode its own pitch, spacing, dot radius, or stroke width. Values SHOULD be overridable per diagram later (config/settings), but the defaults live here.

## Default values

### Grid
- `grid.pitchPx = 24` — fundamental layout pitch; fiber rows and lane separation [SDC-GRID-001]. (Matches existing `GRID_PITCH`.)
- `grid.tubeGroupGapPx = 8` — gap between buffer tube groups. (Matches existing `TUBE_GROUP_GAP`.)

### Spacing
- `spacing.minBendClearancePx = 60` — minimum travel into the routing zone before the first bend [SDC-ROUTE-001], [SDC-ROUTE-004].
- `spacing.fanoutStrandPx = 24` — default vertical/horizontal spacing between fanout strand exit points [SDC-LAYOUT-002] (one grid pitch).
- `spacing.fanoutStrandMinPx = 16` — minimum fanout strand spacing [SDC-LAYOUT-001].
- `spacing.fanoutStrandMaxPx = 48` — maximum preferred fanout strand spacing before a layout is penalized [SDC-LAYOUT-001], [SDC-SCORE-001].
- `spacing.cableGroupSeparationPx = 48` — extra separation between different cable groups [SDC-LAYOUT-001].
- `spacing.strandBufferPx = 12` — minimum clear buffer around each routed strand in all directions [SDC-LAYOUT-001], [SDC-ROUTE-003].

### Fusion splice dot
- `dot.radiusPx = 5` — within the 4-6px range [SDC-VISUAL-001], [SDC-CONNECT-001].

### Stroke widths
- `stroke.fiberStrandPx = 2` [SDC-VISUAL-001]
- `stroke.selectedFiberStrandPx = 4`
- `stroke.bufferTubePx = 4`
- `stroke.cableBodyPx = 2`

### Bend limits
- `bends.preferredMaxTwoSided = 4` [SDC-ROUTE-004]
- `bends.preferredMaxFourSided = 6`
- `bends.hardMax = 10` — exceeding this fails route validation [SDC-ROUTE-004], [SDC-VALIDATE-001].

### Page
- `page.paddingPx = 48` — outer margin reserved around the diagram for export/print [SDC-EXPORT-001].

## Internal Consistency
The defaults MUST satisfy:
- `minBendClearancePx > grid.pitchPx`.
- `fanoutStrandMinPx <= fanoutStrandPx <= fanoutStrandMaxPx`.
- `dot.radiusPx` in `[4, 6]`.
- `bends.preferredMaxTwoSided <= bends.preferredMaxFourSided <= bends.hardMax`.
- `stroke.selectedFiberStrandPx > stroke.fiberStrandPx`.

These invariants are covered by `src/features/layout/sdcDefaults.test.ts`.

## Validation
This rule has no per-diagram validator. It "fails" only if code hardcodes a competing value instead of reading `SDC_DEFAULTS`, or if the invariants above are violated (caught by the unit test).

## Standard Interpretation
- MUST means required behavior.
- SHOULD means preferred behavior unless a higher-priority rule prevents it.
- MAY means optional behavior.

## Inline Rule Citation Format
Use inline citations by rule ID when implementing or explaining behavior, for example: [SDC-CONST-001].

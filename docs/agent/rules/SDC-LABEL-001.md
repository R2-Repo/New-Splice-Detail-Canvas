# Label Placement and Text Collision

Rule ID: SDC-LABEL-001
Related Rules: SDC-CORE-001, SDC-DATA-001, SDC-ORDER-001, SDC-ORDER-002, SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-LAYOUT-003, SDC-ROUTE-001, SDC-ROUTE-003, SDC-UX-001, SDC-EXPORT-001, SDC-VISUAL-001
Reference Example Images/Docs: Fanout labels, OS circuit name labels, cable labels, buffer tube labels, PDF exports
Rule Type: Label layout and collision prevention
Status: Active

## Purpose
Define how text labels are placed, reserved, truncated, validated, and protected from collision with fiber strands, fanouts, cables, buffer tubes, splice dots, and other labels.

Labels are not decorative only. They consume layout space and must be included in routing zone, grid occupancy, spacing, validation, and PDF export calculations [SDC-GRID-001], [SDC-ROUTE-001].

## Label Types
The app may render these label types:

1. Cable label.
2. Buffer tube color label.
3. Fiber strand color abbreviation label.
4. OS circuit name label.
5. Absolute fiber strand number label, when enabled.
6. Fusion splice dot label, when enabled.
7. Warning or validation marker label.
8. Legend labels [SDC-VISUAL-001].

## Core Principle
Every visible label must have a measured bounding box. The bounding box must reserve space on the canvas grid so routes do not pass through text and other labels do not overlap it [SDC-GRID-001], [SDC-ROUTE-001].

## Label Bounding Boxes
Each label MUST produce a bounding box with:

```text
LabelBox
  -> labelId
  -> labelType
  -> ownerObjectId
  -> text
  -> anchorPoint
  -> width
  -> height
  -> padding
  -> side
  -> reservedGridArea
  -> collisionState
```

The reserved area SHOULD include padding around the measured text.

## Required Label Ownership
Each label MUST belong to one diagram object.

Examples:

- A cable label belongs to a fiber cable [SDC-DATA-001].
- A buffer tube label belongs to a buffer tube.
- A fiber abbreviation label belongs to an individual fiber strand fanout row [SDC-LAYOUT-002].
- An OS circuit name label belongs to an individual fiber strand or connection endpoint.
- A fusion splice dot label belongs to a fusion splice dot [SDC-CONNECT-001].

## Side-Based Placement
Label placement depends on the parent cable side [SDC-LAYOUT-003].

### Left-Side Fanouts
- Fiber abbreviation labels should align with each strand row.
- OS labels should align with each strand row.
- Labels should remain outside the center routing zone.
- Labels should not overlap fanout exit points [SDC-LAYOUT-002].

### Right-Side Fanouts
- Fiber abbreviation labels should align with each strand row.
- OS labels should align with each strand row.
- Labels should remain outside the center routing zone.
- Labels should not overlap fanout exit points.

### Top-Side Fanouts
- Fiber abbreviation labels should align with each strand column.
- OS labels should align with each strand column.
- Labels should remain outside the center routing zone.
- Labels should not overlap downward fanout exits.

### Bottom-Side Fanouts
- Fiber abbreviation labels should align with each strand column.
- OS labels should align with each strand column.
- Labels should remain outside the center routing zone.
- Labels should not overlap upward fanout exits.

## Label Reserved Areas
Reserved label areas are blocked geometry.

The routing engine MUST NOT route fiber strands through:

- Label text.
- Label padding.
- Label background, if rendered.
- Reserved label areas.

Label reserved areas should be marked blocked in the grid model [SDC-GRID-001].

## OS Circuit Name Labels
OS circuit name labels can be long and may create spacing pressure.

The app SHOULD:

- Preserve the full OS circuit name in data [SDC-IMPORT-001].
- Display as much of the OS name as the available space allows.
- Truncate visually when needed without changing the stored value.
- Provide full text in object data, tooltip, inspector panel, or export metadata [SDC-EXPORT-001].
- Prefer layout expansion before truncating when enough canvas space exists [SDC-SCORE-001].

## Fiber Color Abbreviation Labels
Fiber abbreviation labels must use the standard abbreviations from the color order rules [SDC-ORDER-001], [SDC-ORDER-002].

Examples:

```text
Blue -> BL
Orange -> OR
Green -> GR
Brown -> BR
Slate -> SL
White -> WH
Red -> RD
Black -> BK
Yellow -> YL
Violet -> VI
Rose -> RS
Aqua -> AQ
Blue Striped -> BL/S
```

Abbreviation labels should remain close to their strand fanout row or column [SDC-LAYOUT-002].

## Text Collision Detection
A label collision occurs when:

- Two label bounding boxes overlap.
- A label overlaps a fiber route.
- A label overlaps a fanout line.
- A label overlaps a cable or buffer tube body.
- A label overlaps a fusion splice dot.
- A label enters the routing zone when it should be outside.
- A label overlaps the canvas boundary or PDF export crop area.

## Label Collision Resolution
The app should resolve label collisions in this order:

1. Shift label within its allowed label band.
2. Increase fanout spacing within allowed limits [SDC-LAYOUT-001].
3. Increase cable or buffer tube spacing naturally through layout [SDC-LAYOUT-001].
4. Move unlocked fanout groups [SDC-LAYOUT-002].
5. Move unlocked cables or side assignments when allowed [SDC-LAYOUT-003].
6. Truncate long labels while preserving full stored value.
7. Report a warning if collision cannot be solved [SDC-VALIDATE-001].

The app MUST NOT move locked items to solve label collisions unless the user unlocks them [SDC-UX-001].

## Label Truncation
Truncation is allowed only for display, not data.

Truncation behavior SHOULD:

- Use a consistent ellipsis strategy.
- Preserve the full value in the saved config [SDC-EXPORT-001].
- Preserve the full value in object metadata.
- Avoid truncating fiber color abbreviations unless absolutely necessary.
- Prefer truncating long OS labels before moving routes through reserved areas.

## PDF Export Legibility
PDF export must keep required labels readable [SDC-EXPORT-001].

PDF export SHOULD:

- Use a minimum configured font size.
- Preserve vector text when possible.
- Avoid clipping labels at page boundaries.
- Include full labels when enough space exists.
- Respect visual truncation state if the canvas layout accepted truncation.

## Relationship to Routing Zone
The routing zone boundary must be calculated after label placement or after label reserved areas are known [SDC-ROUTE-001].

The routing zone must exclude:

- Fanout label bands.
- OS label bands.
- Cable label areas.
- Buffer tube label areas.
- Any other required text areas.

## Relationship to Manual Locks
If a user manually moves or locks a label, the label becomes a fixed reserved object [SDC-UX-001].

The auto layout engine must:

- Preserve the locked label position.
- Treat the locked label as blocked space.
- Route unlocked strands around it.
- Warn if the locked label causes invalid routing or export clipping [SDC-VALIDATE-001].

## Required Behavior
The app MUST:

1. Measure every visible label.
2. Reserve label bounding boxes on the grid.
3. Keep labels outside the routing zone unless explicitly allowed.
4. Prevent routes from passing through labels.
5. Prevent required labels from overlapping each other.
6. Preserve full label data even when display text is truncated.
7. Include label collisions in validation.
8. Preserve locked label positions.
9. Ensure PDF export remains legible.

## Invalid Patterns
The app should treat these as invalid:

- Fiber routes pass through OS labels.
- Color abbreviation labels overlap strand lines.
- Label areas are not included in routing zone calculation.
- Two required labels overlap and are unreadable.
- Truncated text overwrites the saved full OS name.
- PDF export clips labels.
- Locked labels are moved silently.

## Validation
A label should fail this rule if:

- A required label cannot be placed or measured.
- A required label overlaps a route, cable, fanout, or other required label.
- A route passes through the label bounding box.
- A label enters the routing zone and blocks valid routing.
- A label is clipped during PDF export.

A label should warn if:

- A long OS label must be truncated.
- A locked label causes a crowded route.
- Label spacing is readable but near the minimum threshold.

## Summary
Labels must be treated as real layout objects. Every visible label needs a measured bounding box, reserved grid space, side-aware placement, collision detection, truncation rules, export legibility, and manual lock behavior. Fiber routes must not pass through labels or use label space as routing space.

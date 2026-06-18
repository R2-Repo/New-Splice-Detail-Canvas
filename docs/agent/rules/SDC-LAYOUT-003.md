# Layout Modes, Side Assignment, and Cable Placement

Rule ID: SDC-LAYOUT-003
Related Rules: SDC-CORE-001, SDC-IMPORT-001, SDC-DATA-001, SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-LABEL-001, SDC-CONNECT-001, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-ROUTE-004, SDC-SCORE-001, SDC-UX-001
Reference Example Images/Docs: Two-sided diagrams; four-sided diagrams; imported cable lists; side-move/manual-lock examples
Rule Type: Canvas layout mode and cable placement
Status: Active

## Purpose
Define how the app chooses two-sided or four-sided layout mode, assigns cables to left/right/top/bottom sides, orders cables on each side, and places cable objects before fanout and route generation.

The glossary and grid rules allow both two-sided and four-sided diagrams. This rule makes side assignment explicit for implementation [SDC-CORE-001], [SDC-GRID-001].

## Core Principle
Cable side assignment is a visual layout decision unless the imported data explicitly defines a required side. Visual side assignment may change the diagram geometry, but it must not change imported cable identity, buffer tube identity, strand number, or connection pairing [SDC-IMPORT-001], [SDC-DATA-001], [SDC-CONNECT-001].

## Diagram Modes
The app supports two primary diagram modes:

```text
two-sided mode = left and right cable zones
four-sided mode = left, right, top, and bottom cable zones
```

> Vocabulary note: "four-sided mode" is the canonical name for what older code called "quad layout" [SDC-CORE-001].

## Two-Sided Mode
Two-sided mode is the default for simple diagrams.

Use two-sided mode when:

- Imported data naturally fits left/right flow.
- The number of cables and routes can be displayed without major congestion.
- Top and bottom cable placement is not needed.
- The user has not enabled four-sided layout.

Expected zones:

```text
Left cable zone
Center routing zone
Right cable zone
```

## Four-Sided Mode
Four-sided mode should be used when it improves readability or when the user chooses it.

Use four-sided mode when:

- There are too many cables for clean left/right placement.
- Center routing congestion is high [SDC-SCORE-001].
- Many connections naturally route between top/bottom and side positions.
- The user explicitly enables four-sided layout.
- Retry layout finds a cleaner valid result using top or bottom sides.

Expected zones:

```text
Top cable zone
Left cable zone
Center routing grid
Right cable zone
Bottom cable zone
```

## Side Assignment Inputs
Side assignment may use:

- Explicit side from imported data, when available [SDC-IMPORT-001].
- User-selected cable side.
- Existing saved config [SDC-EXPORT-001].
- Manual cable locks [SDC-UX-001].
- Connection density between cables [SDC-CONNECT-001].
- Expected route length.
- Expected crossings.
- Fanout spacing needs [SDC-LAYOUT-001].
- Routing zone congestion [SDC-ROUTE-001].
- Four-sided quadrant availability [SDC-GRID-001].

## Side Assignment Rules
The app SHOULD:

1. Preserve explicit user or saved side assignments when valid.
2. Preserve locked cable positions [SDC-UX-001].
3. Keep connected cable groups positioned to reduce unnecessary crossings.
4. Prefer side assignments that create shorter, cleaner routes.
5. Prefer side assignments that preserve buffer tube and strand nesting [SDC-ROUTE-002].
6. Use top and bottom sides when they reduce congestion in four-sided mode.
7. Reject side assignments that force routes outside the routing zone [SDC-ROUTE-001].

## Cable Orientation
Every cable must face inward toward the splice center.

Expected orientation:

- Left-side cables fan out toward the right.
- Right-side cables fan out toward the left.
- Top-side cables fan out downward.
- Bottom-side cables fan out upward.

Cable orientation affects buffer tube direction, fanout direction, label placement, route start points, and grid reservation [SDC-LAYOUT-002], [SDC-LABEL-001].

## Cable Ordering on Each Side
Cables on the same side should be ordered deterministically.

Recommended order inputs:

1. User locked position [SDC-UX-001].
2. Saved config order [SDC-EXPORT-001].
3. Imported cable order [SDC-IMPORT-001].
4. Cable name or ID.
5. Connection group relationship [SDC-CONNECT-001].
6. Expected routing lane band [SDC-ROUTE-002].

Side-specific ordering:

- Left and right sides: order cables vertically from top to bottom.
- Top and bottom sides: order cables horizontally from left to right.

## Cable Spacing
Cable spacing itself does not require a strict fixed minimum. It should be naturally driven by buffer tube count, fanout spacing, label space, and routing requirements [SDC-LAYOUT-001].

Cable placement must not cause:

- Cable overlap.
- Buffer tube overlap.
- Fanout overlap.
- Label overlap [SDC-LABEL-001].
- Routing zone compression [SDC-ROUTE-001].
- Immediate strand collision after fanout [SDC-ROUTE-003].

## Reserved Side Zones
Each side zone should reserve enough room for:

- Cable body.
- Cable label.
- Buffer tubes.
- Buffer tube labels.
- Fiber strand fanouts.
- Fiber abbreviation labels.
- OS circuit labels.
- Fanout exit points.
- Minimum bend clearance before routing begins [SDC-ROUTE-001].

The center routing zone should be calculated after side zones and label reservations are known [SDC-ROUTE-001].

## Side Move Behavior
Dragging a cable across the center into another side zone is a structural side-change event, not a simple coordinate move [SDC-UX-001].

When a cable changes side, the app MUST:

1. Update the visual side.
2. Mirror cable geometry inward.
3. Mirror attached buffer tubes, fanouts, labels, and handles.
4. Preserve fiber connection data.
5. Reroute affected unlocked strands.
6. Pin the cable at the user-selected side position.
7. Validate the new layout.

## Relationship to Retry Layout
Retry Layout may test alternate side assignments when cables are not locked [SDC-SCORE-001].

Retry Layout may not:

- Move locked cables.
- Change imported connection meaning.
- Use four-sided mode to hide invalid data.
- Place cables outside approved side zones.

## Required Behavior
The layout engine MUST:

1. Select two-sided or four-sided mode.
2. Assign each cable to an approved side.
3. Orient every cable inward.
4. Order cables deterministically on each side.
5. Reserve enough side space for cable, tube, fanout, and label geometry.
6. Preserve locked cable positions.
7. Treat side moves as mirror/side-change events.
8. Recalculate routing zone boundaries after side placement.
9. Pass side assignment to fanout, routing, labels, and scoring.

## Invalid Patterns
The app should treat these as invalid:

- A cable faces away from the splice center.
- A left/right cable fans out vertically instead of toward the center.
- A top/bottom cable fans out horizontally away from the center.
- Side assignment changes imported splice data.
- Locked cable side or position is changed silently.
- Cable placement causes fanout or label overlap.
- Four-sided mode places routes through reserved side zones.

## Validation
A layout should fail this rule if:

- A cable has no valid side assignment.
- A cable is outside all approved side zones.
- A cable orientation does not face inward.
- A side assignment causes unavoidable invalid routing.
- A locked cable is moved without unlock.
- Cable placement leaves no valid routing zone.

A layout should warn if:

- Two-sided mode is valid but congested.
- Four-sided mode creates a cleaner candidate layout.
- Cable spacing is valid but visually crowded.
- User-locked side assignment prevents a cleaner layout.

## Implementation gap (current code)
The current layout code (`src/features/layout/assignCableSides.ts`, `runLayoutEngine.ts`, horizontal + quad engines, ELK builders) implements side assignment and a two-mode (`horizontal` / `quad`) system. Align its mode names and zone vocabulary with this rule (`two-sided` / `four-sided`, `Left/Right/Top/Bottom cable zone`) during the layout/routing rebuild.

## Summary
Layout mode and side assignment define where cable groups live before routing begins. The app should choose two-sided or four-sided mode, assign cables to left/right/top/bottom sides, orient all cables inward, reserve side zones for fanouts and labels, preserve locks, and let scoring compare alternate valid side assignments.

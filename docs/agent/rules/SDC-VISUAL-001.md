# Visual Color Rendering and Legend

Rule ID: SDC-VISUAL-001
Related Rules: SDC-CORE-001, SDC-ORDER-001, SDC-ORDER-002, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-LABEL-001, SDC-ROUTE-003, SDC-ROUTE-004, SDC-UX-001, SDC-EXPORT-001
Reference Example Images/Docs: Fiber color order rules; exported PDF examples; selected/hover route examples
Rule Type: Visual rendering
Status: Active

## Purpose
Define how fiber strands, buffer tubes, labels, splice dots, route crossings, selection state, and legends should be visually rendered so the splice detail is readable on canvas and in PDF export.

Color order rules define the sequence and abbreviations. This rule defines how those colors and visual styles are rendered [SDC-ORDER-001], [SDC-ORDER-002].

## Core Principle
Visual rendering must support traceability. Colors, stroke widths, layer order, labels, selected state, and legend output should make it easy to follow each fiber strand from fanout exit point to fusion splice dot without changing the underlying data.

## Default Fiber Colors
Default color tokens SHOULD be configurable, but the app should start with a consistent color map.

Recommended defaults:

| Fiber Color | Abbreviation | Suggested Hex |
|---|---:|---:|
| Blue | BL | #0070C0 |
| Orange | OR | #F4A000 |
| Green | GR | #00A651 |
| Brown | BR | #8B5A2B |
| Slate | SL | #808080 |
| White | WH | #FFFFFF |
| Red | RD | #D71920 |
| Black | BK | #111111 |
| Yellow | YL | #FFD200 |
| Violet | VI | #8E44AD |
| Rose | RS | #F06292 |
| Aqua | AQ | #00B7C3 |

White strands should use a contrasting outline or background when needed so they remain visible.

## Striped Buffer Tube Rendering
Striped buffer tubes represent the repeated buffer tube color sequence above the first 12 buffer tubes [SDC-ORDER-001].

Striped tubes SHOULD:

- Use the base color as the primary color.
- Include a visible stripe pattern.
- Use the `/S` abbreviation in labels.
- Remain distinguishable in PDF export [SDC-EXPORT-001].

Examples:

```text
Blue Striped -> BL/S
Orange Striped -> OR/S
Green Striped -> GR/S
```

## Stroke Widths
Stroke widths should be consistent and configurable.

Recommended defaults:

```text
fiberStrandStroke = 2px
selectedFiberStrandStroke = 4px
bufferTubeStroke = 4px
cableBodyStroke = 2px
fusionSpliceDotRadius = 4px to 6px
crossingHighlightStroke = configurable
```

PDF export may use adjusted stroke widths for print legibility [SDC-EXPORT-001].

## Layer Order
The app should render diagram elements in a stable layer order.

Recommended layer order from back to front:

1. Canvas background.
2. Optional grid debug overlay.
3. Cable bodies.
4. Buffer tube stems.
5. Fanout lines.
6. Normal fiber route segments.
7. Controlled crossing upper segments [SDC-ROUTE-003].
8. Fusion splice dots.
9. Labels [SDC-LABEL-001].
10. Selection highlights.
11. Validation markers.
12. Drag handles and interactive controls.

Layering must not change connection meaning.

## Controlled Crossing Rendering
When a controlled crossing is allowed by [SDC-ROUTE-003], the crossing should be visually clear.

Controlled crossing rendering SHOULD:

- Keep the crossing short.
- Render the crossing route above the route being crossed.
- Avoid making the two strands look merged.
- Optionally add a small bridge/gap visual if supported.
- Preserve color identity of both strands.

## Selection and Hover State
Selection and hover states should help manual cleanup without changing saved data until an edit is made [SDC-UX-001].

Recommended behavior:

- Hovering a strand highlights the full route from fanout to splice dot.
- Selecting a strand highlights its fanout row, route, splice dot, and paired endpoint.
- Selecting a buffer tube highlights all child strands [SDC-ROUTE-002].
- Selecting a cable highlights all child buffer tubes and strands [SDC-DATA-001].
- Locked items should show a clear lock indicator [SDC-UX-001].
- Validation errors should show a clear marker without hiding route color [SDC-VALIDATE-001].

## Label Visuals
Labels should be readable on screen and in PDF [SDC-LABEL-001], [SDC-EXPORT-001].

Recommended behavior:

- Use consistent font family and size.
- Keep text horizontal unless a future rule allows rotation.
- Use enough contrast against the canvas background.
- Use optional label background only when needed for readability.
- Never let label styling hide route geometry.

## Legend Behavior
A legend may be shown on canvas or included in PDF export.

The legend SHOULD include:

- Fiber color names.
- Fiber abbreviations.
- Striped buffer tube meaning.
- Controlled crossing visual, if used.
- Locked item marker, if visible.
- Warning/error marker meanings, if visible.

The legend SHOULD NOT consume routing zone space unless it is intentionally placed and reserved as a blocked area [SDC-GRID-001], [SDC-LABEL-001].

## Print and PDF Requirements
PDF output should preserve visual clarity [SDC-EXPORT-001].

PDF rendering SHOULD:

- Keep strand colors distinguishable.
- Keep white strands visible with outline or contrast.
- Keep text legible.
- Keep stripe patterns visible.
- Preserve layer order.
- Avoid clipping highlights, labels, or dots.
- Include legend only when enabled.

## Accessibility and Contrast
The app should not rely only on color when possible.

Recommended support:

- Fiber abbreviations near fanout labels [SDC-LAYOUT-002].
- Legend abbreviations.
- Hover/selection trace highlighting.
- Distinct striped tube pattern.
- Warning/error markers with shapes or icons, not color only.

## Required Behavior
The renderer MUST:

1. Use standard color names and abbreviations.
2. Render strand colors consistently.
3. Render striped tubes distinctly.
4. Keep white strands visible.
5. Preserve stable layer order.
6. Make controlled crossings visually clear.
7. Support selection and hover tracing.
8. Show locked state when helpful.
9. Preserve visual clarity in PDF export.
10. Avoid visual styling that changes data meaning.

## Invalid Patterns
The app should treat these as invalid visual behavior:

- White strands disappear against the background.
- Striped tubes look identical to base tubes.
- Controlled crossings visually merge into overlap.
- Selection highlight hides strand color and traceability.
- Labels become unreadable in PDF export.
- Legend overlaps routing without reserved space.
- Visual render order makes a route appear connected to the wrong dot.

## Validation
Visual output should fail this rule if:

- Required strand colors cannot be resolved.
- Labels or routes are not legible in export.
- Stripe styling is missing for striped tubes.
- Layer order creates visual ambiguity.

Visual output should warn if:

- A color is close to the background and needs contrast support.
- A selected/highlighted state may obscure labels.
- Legend placement reduces available routing space.

## Implementation gap (current code)
The current code defines TIA colors (`src/features/diagram/tiaColors.ts`) used by node/edge rendering. Reconcile its palette and stroke widths with the recommended defaults above (treat as configurable). The neumorphic app chrome is unaffected and must not change without user approval.

## Summary
Visual rendering must make the splice detail readable and traceable. The renderer should use stable fiber colors, visible stripe styling, clear stroke widths, correct layer order, controlled crossing visuals, readable labels, selection/hover tracing, lock indicators, and PDF-safe output without changing the underlying splice data.

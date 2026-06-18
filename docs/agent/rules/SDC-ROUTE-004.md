# Orthogonal Path Geometry and Bend Limits

Rule ID: SDC-ROUTE-004
Related Rules: SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-LABEL-001, SDC-CONNECT-001, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-SCORE-001, SDC-UX-001, SDC-VISUAL-001
Reference Example Images/Docs: Routed fiber strand paths; grid lane diagrams; splice detail reference images
Rule Type: Route geometry
Status: Active

## Purpose
Define the exact allowed shape of fiber strand routes between fanout exit points and fusion splice dots.

The grid rule defines lanes, intersections, and occupancy. This rule defines how a fiber path may be built from those grid elements [SDC-GRID-001].

## Core Principle
Fiber strand routes must be orthogonal. A route is built only from horizontal and vertical segments connected by approved bends at grid intersections.

The app should not draw random freehand, diagonal, curved, or unstructured routes unless a future rule explicitly allows that geometry.

## Required Route Model
Each fiber strand route SHOULD be stored as ordered points and segments.

```text
FiberRoute
  -> routeId
  -> strandId
  -> connectionId
  -> startPort
  -> endPort
  -> points[]
  -> segments[]
  -> bendPoints[]
  -> occupiedGridSegments[]
  -> crossingEvents[]
  -> validationState
```

Each segment SHOULD be one of:

```text
horizontal
vertical
```

## Route Start Point
A fiber route MUST start at the fanout exit point for the specific strand [SDC-LAYOUT-002].

The route MUST NOT start from:

- The cable body.
- The buffer tube body.
- Label text.
- The middle of the fanout.
- Another fiber strand route.
- A guessed point not assigned to the strand.

## Route End Point
A connected fiber route MUST end at the assigned fusion splice dot [SDC-CONNECT-001].

The route MUST NOT end at:

- The wrong splice dot.
- An unassigned dot.
- A label.
- Another strand route.
- An approximate point near the dot without a defined connection.

## Dot Ports
A fusion splice dot may expose side-specific route ports.

Recommended ports:

```text
leftPort
rightPort
topPort
bottomPort
```

Expected behavior:

- Left-side strand routes should usually enter a dot from the left.
- Right-side strand routes should usually enter a dot from the right.
- Top-side strand routes should usually enter a dot from above.
- Bottom-side strand routes should usually enter a dot from below.
- The scoring engine may choose another valid port if it reduces hard routing problems [SDC-SCORE-001].

## Approved Segment Geometry
A route segment is valid when:

- It is horizontal or vertical.
- It lies on an approved grid lane [SDC-GRID-001].
- It stays inside the routing zone [SDC-ROUTE-001].
- It does not pass through blocked grid areas.
- It maintains required spacing [SDC-LAYOUT-001].
- It does not overlap or collide with another route [SDC-ROUTE-003].

## Approved Bend Geometry
A bend is valid when:

- It occurs at an approved grid intersection [SDC-GRID-001].
- It connects one horizontal segment and one vertical segment.
- It does not occur inside a label, fanout, cable body, or blocked area [SDC-LABEL-001].
- It respects minimum bend clearance from fanouts and routing zone edges [SDC-ROUTE-001].
- It does not create avoidable overlap, collision, or illegal crossing [SDC-ROUTE-003].

## Minimum Bend Clearance
Routes must respect the routing zone minimum bend clearance [SDC-ROUTE-001].

Default minimum bend clearance:

```text
60px
```

Meaning:

- Left-side and right-side strands should travel at least 60px into the routing zone before their first vertical bend.
- Top-side and bottom-side strands should travel at least 60px into the routing zone before their first horizontal bend.

## Bend Count Limits
Bend count should be minimized but should not override hard validity rules.

Recommended defaults:

```text
preferredMaxBendsTwoSided = 4
preferredMaxBendsFourSided = 6
hardMaxBends = configurable
```

If a route exceeds the preferred bend count but remains valid, it should receive a scoring penalty [SDC-SCORE-001].

If a route exceeds the configured hard maximum, it should fail validation [SDC-VALIDATE-001].

## Segment Simplification
After a route is generated, the app SHOULD simplify it.

Simplification SHOULD:

- Remove duplicate adjacent points.
- Remove zero-length segments.
- Merge consecutive collinear segments.
- Remove unnecessary detours when doing so does not create a rule violation.
- Keep required bend clearance and spacing intact.
- Preserve locked route segments [SDC-UX-001].

## Lane Reservation
Every accepted route segment MUST reserve its grid lane segment [SDC-GRID-001].

Reserved segment states:

```text
reserved = temporarily held during candidate routing
occupied = accepted route segment
blocked = unavailable area
manual-locked = fixed manually adjusted segment
```

Unrelated strands must not share the same occupied lane segment unless a specific bundled-routing rule allows it in the future.

## Controlled Crossing Geometry
Controlled crossings are allowed only under the crossing exception defined by [SDC-ROUTE-003].

A controlled crossing SHOULD:

- Occur at a known crossing point.
- Be short and visually clear.
- Avoid running along another strand.
- Maintain spacing wherever possible.
- Record which route visually passes above the other route [SDC-VISUAL-001].
- Add a crossing penalty in route scoring [SDC-SCORE-001].

## Four-Sided Route Geometry
Four-sided diagrams may require more turns than two-sided diagrams [SDC-LAYOUT-003].

Four-sided routes MUST still:

- Use only horizontal and vertical segments.
- Bend only at approved grid intersections.
- Move between quadrants only through approved transition lanes [SDC-GRID-001].
- Avoid cable, fanout, label, and blocked areas [SDC-LABEL-001], [SDC-ROUTE-001].

## Manual Route Segment Locks
If the user manually adjusts a route leg or lane segment, that segment becomes locked [SDC-UX-001].

Locked segment behavior:

- The locked segment must remain fixed.
- The route must remain connected to its start and end anchors.
- Auto layout may reroute unlocked adjacent segments around the locked segment.
- The locked segment remains occupied or manual-locked in the grid [SDC-GRID-001].
- Validation should warn if the locked segment causes poor geometry [SDC-VALIDATE-001].

## Required Behavior
The routing engine MUST:

1. Route only from fanout exit points to assigned splice dots.
2. Use horizontal and vertical segments only.
3. Bend only at approved grid intersections.
4. Reserve every occupied lane segment.
5. Respect minimum bend clearance.
6. Stay inside the routing zone.
7. Avoid labels, fanouts, cable bodies, and blocked grid areas.
8. Avoid overlap, illegal crossing, collision, and shared lanes.
9. Simplify routes after generation.
10. Preserve locked route segments.

## Invalid Patterns
The app should treat these as invalid:

- Diagonal fiber routes.
- Curved or freehand routes without a defined rule.
- Bends inside the fanout area.
- Bends on top of labels.
- Routes starting from a cable body instead of fanout exit point.
- Routes ending near but not at the assigned splice dot.
- Consecutive duplicate points.
- Zero-length route segments.
- Shared lane segments between unrelated strands.
- Excessive bends used to hide a collision problem.

## Validation
A route should fail this rule if:

- It has a diagonal or freehand segment.
- It has a bend outside an approved grid intersection.
- It starts or ends at the wrong anchor.
- It routes outside the routing zone.
- It passes through blocked space.
- It violates hard bend count limits.
- It shares an occupied lane with an unrelated route.

A route should warn if:

- It exceeds the preferred bend count.
- It has an allowed but costly controlled crossing.
- It is valid but unusually long.
- It is valid only because of a locked manual segment.

## Implementation gap (current code)
The current orthogonal router (`src/features/grid/routeOrthogonal.ts`, `src/features/routing/routeConnections.ts`) routes horizontal splice legs through a center midX column with `LaneBook` reservation. It predates the explicit route model (`FiberRoute`, dot ports, simplification, bend-count limits) in this rule. Reconcile during the routing rebuild.

## Summary
Fiber routes must be orthogonal, grid-based, and anchor-accurate. Each route starts at one fanout exit point, ends at the assigned fusion splice dot, uses only horizontal and vertical segments, bends only at approved grid intersections, reserves occupied lanes, respects bend clearance, and simplifies unnecessary geometry after routing.

# Fusion Splice Dot and Connection Pairing

Rule ID: SDC-CONNECT-001
Related Rules: SDC-IMPORT-001, SDC-DATA-001, SDC-DATA-002, SDC-LAYOUT-001, SDC-LAYOUT-003, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-ROUTE-004, SDC-UX-001, SDC-VALIDATE-001
Reference Example Images/Docs: Imported Bentley connection rows; splice detail reference images; normalized CSV model
Rule Type: Connection model and splice dot placement
Status: Active

## Purpose
Define how imported connection records create fusion splice dots and how each fiber strand endpoint maps to those dots.

A fusion splice dot is the visual center anchor where two fiber strands meet to represent a physical splice. Routing depends on accurate dot creation, endpoint mapping, dot ordering, and dot placement [SDC-ROUTE-001], [SDC-ROUTE-004].

## Core Principle
Each physical splice pair should create exactly one fusion splice dot. Each routed strand leg should connect from its fanout exit point to the correct fusion splice dot without changing the imported connection meaning [SDC-IMPORT-001], [SDC-DATA-001].

## Required Connection Model
A valid connection should contain:

```text
ConnectionPair
  -> connectionId
  -> endpointA
  -> endpointB
  -> fusionSpliceDot
  -> sourceRows
  -> validationState
```

Each endpoint should contain:

```text
Endpoint
  -> cableId
  -> bufferTubeId or bufferTubeColor
  -> absoluteFiberStrandNumber
  -> fiberStrandColor
  -> osCircuitName, when available
  -> sideAssignment, when available or inferred
  -> fanoutExitPoint, after layout
```

## Connection Pair Creation
The app MUST create connection pairs from the normalized import model [SDC-IMPORT-001].

Connection pair creation MUST:

1. Identify endpoint A.
2. Identify endpoint B.
3. Confirm both endpoints map to known fiber strands [SDC-DATA-001].
4. Preserve both endpoints' absolute strand numbers [SDC-DATA-002].
5. Create a deterministic connection ID.
6. Create exactly one fusion splice dot for the pair.
7. Preserve all source row references.
8. Emit warnings for incomplete or one-sided data [SDC-VALIDATE-001].

## Fusion Splice Dot Definition
A fusion splice dot represents one physical splice pair.

A fusion splice dot MUST:

- Belong to exactly one connection pair.
- Have one anchor point for endpoint A route entry.
- Have one anchor point for endpoint B route entry.
- Be placed inside the valid routing zone [SDC-ROUTE-001].
- Align to the canvas grid [SDC-GRID-001].
- Preserve locked position when manually adjusted [SDC-UX-001].
- Remain visually traceable from both fanout exit points [SDC-ROUTE-003].

## Dot Identity
Fusion splice dot IDs MUST be deterministic.

A recommended dot ID can be based on normalized endpoint identity:

```text
splice:<endpointA.cableId>:<endpointA.strandNumber>--<endpointB.cableId>:<endpointB.strandNumber>
```

The ID should not depend on screen coordinates. Moving a dot should not change its identity [SDC-UX-001], [SDC-EXPORT-001].

## Endpoint Rules
Each connected fiber strand SHOULD connect to one fusion splice dot.

The app should warn or fail when:

- One strand is assigned to multiple splice dots without an explicit supported reason.
- A connection pair references a missing cable.
- A connection pair references a missing buffer tube.
- A connection pair references a missing fiber strand.
- Endpoint A and endpoint B are identical.
- A duplicate connection pair appears in the import.

## Unconnected and One-Sided Strands
A CSV may include fiber strands that are not spliced.

Unconnected strand behavior:

- The strand should still appear in its parent cable, buffer tube, and fanout when the imported data includes it [SDC-LAYOUT-002].
- The strand should not create a fusion splice dot unless a valid connection exists.
- The app may render the strand as parked, capped, or unused if that visual state is supported [SDC-VISUAL-001].
- The validation system should report unconnected strands as info or warning depending on project settings [SDC-VALIDATE-001].

One-sided connection behavior:

- A one-sided endpoint should not be auto-paired with another strand without clear source data.
- The app may create a placeholder connection warning if the source row indicates an incomplete splice.
- PDF export should make incomplete connections visually clear [SDC-EXPORT-001].

## Dot Placement Order
Fusion splice dots should be placed in a deterministic order.

Recommended ordering inputs:

1. Imported connection row order.
2. Cable group order [SDC-LAYOUT-003].
3. Buffer tube color order [SDC-ORDER-001].
4. Absolute fiber strand number [SDC-DATA-002].
5. OS circuit name as a final tie-breaker.

The app MUST NOT reorder dots in a way that changes connection meaning.

## Dot Spacing
Fusion splice dots must maintain enough spacing to keep route endpoints traceable.

Dot spacing MUST account for:

- Individual fiber strand spacing [SDC-LAYOUT-001].
- Route bend clearance [SDC-ROUTE-004].
- Nearby controlled crossings [SDC-ROUTE-003].
- Label clearance, when dot labels are rendered [SDC-LABEL-001].
- Locked dot positions [SDC-UX-001].

## Two-Sided Behavior
In two-sided mode, dots usually form a center column or center band between left and right fanouts [SDC-LAYOUT-003].

Expected behavior:

- Left-side strand route enters the dot from the left.
- Right-side strand route enters the dot from the right.
- Dot placement should reduce unnecessary crossing and center congestion [SDC-SCORE-001].

## Four-Sided Behavior
In four-sided mode, dots may serve connections between any combination of left, right, top, and bottom cable sides [SDC-LAYOUT-003].

Expected behavior:

- Dot placement should use the center routing zone without violating quadrant transition rules [SDC-GRID-001].
- Top/bottom routes should enter dots from approved vertical or horizontal ports [SDC-ROUTE-004].
- Dots should be distributed to avoid compressing every connection into one small center area [SDC-ROUTE-001].

## Dot Lock Behavior
If a user drags a fusion splice dot, the dot becomes locked [SDC-UX-001].

Locked dot behavior:

- Auto layout must not move the locked dot.
- Connected unlocked strand routes should reroute to the locked dot.
- The locked dot remains an occupied grid object [SDC-GRID-001].
- Export and reimport must preserve the locked dot position [SDC-EXPORT-001].
- If the locked position causes invalid routing, the app should warn instead of silently moving the dot [SDC-VALIDATE-001].

## Relationship to Routing
The connection rule creates dot anchors. The route geometry rule defines how strands connect to those anchors [SDC-ROUTE-004].

The routing engine MUST:

- Start each connected strand route at the fanout exit point [SDC-LAYOUT-002].
- End each connected strand route at the assigned fusion splice dot.
- Keep each route inside the routing zone [SDC-ROUTE-001].
- Avoid overlap, illegal crossing, collision, and shared lanes [SDC-ROUTE-003].

## Required Behavior
The app MUST:

1. Create one connection pair per physical splice.
2. Create one fusion splice dot per connection pair.
3. Preserve endpoint identity.
4. Preserve source row traceability.
5. Detect duplicate or ambiguous connection rows.
6. Keep fusion splice dots inside the routing zone.
7. Respect locked dot positions.
8. Route only to the correct assigned dot.
9. Report incomplete connection data clearly.

## Invalid Patterns
The app should treat these as invalid:

- Two unrelated splice pairs share the same fusion splice dot.
- A strand is visually routed to the wrong dot.
- A dot is placed outside the routing zone.
- A dot overlaps a fanout, cable body, or label.
- A locked dot is silently moved by auto layout.
- Duplicate rows create duplicate dots for the same physical splice.
- Missing endpoint data is silently guessed.

## Validation
A connection should fail this rule if:

- Either endpoint cannot be matched to a known fiber strand.
- The connection pair is ambiguous.
- The same physical splice creates multiple dots.
- Multiple physical splices are merged into one dot.
- Dot placement violates the routing zone [SDC-ROUTE-001].
- Dot placement creates unavoidable route collision [SDC-ROUTE-003].

A connection should warn if:

- One endpoint is missing but the row appears to represent an incomplete splice.
- A dot is locked in a poor position.
- Dot spacing is valid but visually crowded.
- Route scoring finds a cleaner alternate dot order [SDC-SCORE-001].

## Missing detail (flagged)
This rule defines dot identity, ordering, and spacing but not the exact center-band geometry. The precise 2-sided center-column coordinates and 4-sided distribution math should be pinned in the layout-constants follow-up rule (see the gaps list in the rules index).

## Summary
Fusion splice dots are the connection anchors for the splice detail. The app must create exactly one dot per valid physical splice pair, preserve endpoint identity, keep dots deterministic and grid-aligned, respect manual locks, and route each fiber strand to its assigned dot without changing imported splice meaning.

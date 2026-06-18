# Route Scoring, Retry Layout, and Rule Priority

Rule ID: SDC-SCORE-001
Related Rules: SDC-IMPORT-001, SDC-DATA-001, SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-LAYOUT-003, SDC-LABEL-001, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-ROUTE-004, SDC-UX-001, SDC-VALIDATE-001
Reference Example Images/Docs: Candidate routed layouts; validation reports; manual lock state
Rule Type: Layout optimization and retry control
Status: Active

## Purpose
Define how the app scores candidate layouts, rejects invalid layouts, retries layout attempts, and chooses the cleanest result in a deterministic way.

Many rules define what a clean diagram should avoid: overlap, collision, spacing violations, label collisions, routing outside the zone, too many bends, broken nesting, and congestion. This rule defines how the app chooses between competing valid layouts.

## Core Principle
The app should reject layouts that break hard rules. Among layouts that pass hard rules, the app should choose the lowest-penalty layout using deterministic scoring.

Scoring must optimize the visual layout only. It must not change imported data, connection pairings, absolute strand numbers, or locked manual overrides [SDC-IMPORT-001], [SDC-DATA-001], [SDC-DATA-002], [SDC-UX-001].

## Hard Failures
A candidate layout MUST be rejected if it has any hard failure.

Hard failures include:

- Imported cable, strand, or connection identity changed [SDC-IMPORT-001].
- Absolute strand numbers changed [SDC-DATA-002].
- A locked manual item was moved without user unlock [SDC-UX-001].
- A connected strand cannot reach its assigned fusion splice dot [SDC-CONNECT-001].
- A route starts somewhere other than its fanout exit point [SDC-LAYOUT-002].
- A route ends at the wrong fusion splice dot [SDC-CONNECT-001].
- A route leaves the routing zone [SDC-ROUTE-001].
- A route uses an unapproved grid lane or bend point [SDC-GRID-001], [SDC-ROUTE-004].
- A route overlaps another route for a meaningful distance [SDC-ROUTE-003].
- A route collides with a cable, buffer tube, fanout, label, or reserved area [SDC-LABEL-001], [SDC-ROUTE-001].
- A label collision makes required text unreadable [SDC-LABEL-001].

## Soft Penalties
A candidate layout may still be valid but receive penalty points.

Soft penalties include:

- Controlled crossings that are allowed but not ideal [SDC-ROUTE-003].
- Extra bends beyond the preferred count [SDC-ROUTE-004].
- Longer route path length.
- Center routing congestion [SDC-ROUTE-001].
- Broken or weakened nesting [SDC-ROUTE-002].
- Excessive fanout spacing [SDC-LAYOUT-001].
- Fanout compression close to the minimum spacing [SDC-LAYOUT-001].
- Dot placement that is valid but crowded [SDC-CONNECT-001].
- Labels that require truncation [SDC-LABEL-001].
- Routes that pass near locked objects but remain valid [SDC-UX-001].

## Recommended Score Categories
A candidate layout SHOULD be scored using these categories:

| Category | Meaning | Higher Penalty When |
|---|---|---|
| Data integrity | Imported structure and connection data are preserved | Any visual step attempts to alter data |
| Lock preservation | Manual locks remain fixed | A candidate requires moving locked items |
| Route validity | Routes stay in valid zones and lanes | Routes approach invalid geometry |
| Collision quality | No overlaps, collisions, or illegal shared lanes | Routes crowd or nearly collide |
| Crossing quality | Crossings are minimized and controlled | Crossings are unnecessary or clustered |
| Spacing quality | Strand, group, fanout, and label spacing are readable | Layout is compressed or crowded |
| Nesting quality | Related strands stay grouped | Related buffer tube groups scatter |
| Bend quality | Bend count and bend placement are clean | Routes bend too often or too close together |
| Path length | Routes are not unnecessarily long | Routes take indirect paths |
| Routing zone utilization | Center area is used efficiently | Routes collapse into one congested band |
| Label quality | Labels remain readable | Text truncates or crowds other labels |
| Visual compactness | Diagram avoids excessive empty space | Fanouts or dots spread too far apart |

## Suggested Penalty Weights
Exact weights may be tuned, but the relative priority should remain stable.

Recommended starting weights:

```text
Hard failure: reject candidate
Illegal overlap or collision: reject candidate
Route outside routing zone: reject candidate
Moved locked item: reject candidate
Unnecessary crossing: +100
Allowed controlled crossing: +25
Shared lane near miss: +80
Minimum spacing near miss: +40
Extra bend above preferred count: +15 per bend
Long path: +1 per grid segment above baseline
Nesting break: +30 per affected group
Label truncation: +10 per label
Crowded dot band: +20 per dot cluster
Excess fanout spacing: +10 per spacing band above target
```

The app may tune values, but hard failures must not be treated as minor penalties.

## Retry Layout Inputs
Retry Layout should test different visual strategies without reimporting the CSV.

Allowed retry changes:

- Cable side assignment when not locked [SDC-LAYOUT-003].
- Cable ordering on each side when not locked.
- Fanout spacing within min/max limits [SDC-LAYOUT-001].
- Routing lane bands [SDC-GRID-001], [SDC-ROUTE-002].
- Bend columns and rows [SDC-ROUTE-004].
- Fusion splice dot ordering when not locked [SDC-CONNECT-001].
- Quadrant transition points [SDC-GRID-001].
- Label side/offset when allowed [SDC-LABEL-001].

Retry Layout MUST NOT:

- Reimport the CSV.
- Change source row identity.
- Change cable hierarchy.
- Renumber fiber strands.
- Change connection pairs.
- Move locked manual items.
- Delete strands to make routing easier.

## Deterministic Output Requirement
The same imported data, same user locks, same settings, and same app version SHOULD produce the same accepted layout.

If randomness is used internally, it MUST use a deterministic seed derived from stable input values.

Recommended deterministic seed inputs:

- Import file hash.
- Normalized connection IDs.
- Rule pack version.
- Layout settings.
- Manual lock state.

## Retry Limit
The app should limit retry attempts to keep the UI responsive.

Recommended behavior:

- Try a fast default layout first.
- Try a bounded number of alternate side assignments, lane bands, dot orders, and bend plans.
- Stop early when a candidate reaches an acceptable score threshold.
- Return the best candidate with validation messages if no perfect layout exists [SDC-VALIDATE-001].

## Tie-Breaking
When two valid layouts have the same score, choose the layout using this tie order:

1. Fewer hard-rule near misses.
2. Fewer controlled crossings.
3. Fewer bends.
4. Better nesting preservation.
5. Shorter total route length.
6. Less label truncation.
7. More compact canvas bounds.
8. Original imported cable order.
9. Stable lexical ID order.

## Relationship to Manual Locks
Manual locks are fixed constraints [SDC-UX-001].

Scoring must:

- Treat locked items as obstacles.
- Reject candidates that move locked items.
- Penalize layouts that route too tightly around locked items.
- Warn when locked items prevent a clean layout [SDC-VALIDATE-001].

## Relationship to Validation
Scoring chooses the best candidate. Validation explains the result [SDC-VALIDATE-001].

The accepted layout should produce a validation summary containing:

- Candidate score.
- Hard failures, if no valid candidate exists.
- Soft warnings.
- Rule IDs for each issue.
- Suggested cleanup actions.

## Required Behavior
The scoring engine MUST:

1. Reject candidates with hard failures.
2. Score valid candidates consistently.
3. Respect imported data and manual locks.
4. Prefer no overlap, no collision, and no illegal crossing.
5. Prefer readable spacing and clean labels.
6. Prefer nested group routing when possible.
7. Prefer fewer bends and shorter paths only after validity is satisfied.
8. Produce deterministic output.
9. Provide validation messages explaining the chosen result.

## Invalid Patterns
The app should treat these as invalid:

- Choosing a layout with overlap because it has fewer bends.
- Moving a locked object to improve score.
- Changing connection pairs during retry.
- Producing different layouts for the same unchanged input without a user action.
- Allowing retry layout to hide rule failures without reporting them.
- Treating manual lock conflicts as silent auto-fixes.

## Implementation gap (current code)
The current scorer (`src/features/routing/scoreRouting.ts`) uses an additive formula `crossings*1000 + loopBacks*500 + bends*100 + verticalSpread` and `pickBestLayout()` (`src/features/rules/placement/pickBestLayout.ts`) enumerates a small set of SP-3254 placement candidates. This rule replaces that model with a reject-on-hard-failure + weighted-penalty + deterministic-retry approach. Reconcile during the routing rebuild.

## Summary
Route scoring is the decision layer for auto layout and retry layout. Hard rule failures reject a candidate. Valid candidates are scored by crossings, spacing, nesting, bends, path length, labels, congestion, and compactness. The app should choose the lowest-penalty deterministic layout while preserving imported data and locked manual overrides.

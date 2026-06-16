# SP-3254.5 placement rules (scaffold)

> **Status:** Candidate generator in place; awaiting user refinement from PDF oracle review.

## Module location

- [`generateCandidates.ts`](../../../src/features/rules/placement/generateCandidates.ts) — `generateSp3254Candidates()`
- [`pickBestLayout.ts`](../../../src/features/rules/placement/pickBestLayout.ts) — scores candidates, picks lowest

## Current candidates (horizontal)

| ID | Description |
|----|-------------|
| `default` | `#from` → left, `#to` → right; volume stack order |
| `mirror-sides` | Swap left/right for all legs |
| `swap-144-left` | Swap 144 segment A/B stack on left side |
| `drop-from-right` | Move 6-drop `#from` leg to right |

## What we need from you

Compare the three PDF oracles ([`CSV_SP-3254.5.md`](../CSV_SP-3254.5.md) § Oracle variants) and specify:

1. **Cable side assignment** — which of 8 legs belong on left vs right (may differ from `#from`/`#to`)
2. **Stack order** — top-to-bottom on each side
3. **Tube/fiber row order** — TIA order within each cable
4. **Preferred variant** — which PDF (1, 2, or 3) is cleanest

When confirmed, add a dedicated rule module under `src/features/rules/sp3254-side-stack/` and extend `generateSp3254Candidates()`.

## Scoring

Route quality uses [`scoreRouting.ts`](../../../src/features/routing/scoreRouting.ts):

```text
score = crossings×1000 + loopBacks×500 + bends×100 + verticalSpread
```

Lower is better. Import runs `pickBestLayout()` by default.

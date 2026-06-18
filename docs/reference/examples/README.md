# Reference CSVs

Sample Bentley splice reports for import/parser contract tests and manual QA.

## Primary example CSV

| File | Splice | Left pairs | Rule |
|------|--------|------------|------|
| **`Left-SP-3254.5.csv`** | SP-3254.5 | 20 | [`SDC-IMPORT-001`](../../agent/rules/SDC-IMPORT-001.md) |

Use this file first for Bentley format walkthroughs (20 rows, 4 cable types, empty Right section). The import format and Bentley appendix are defined in [`SDC-IMPORT-001`](../../agent/rules/SDC-IMPORT-001.md).

## Layout oracles (SP-3254.5)

Three manual horizontal layouts from the prior app — same CSV, different cable side/stack choices. Visual reference only for the layout/routing rebuild (not pixel tests).

| Variant | File | Mode |
|---------|------|------|
| 1 | `Left-SP-3254.5 (From old App 1).pdf` | Two-sided (left/right) |
| 2 | `Left-SP-3254.5 (From old App 2).pdf` | Two-sided (left/right) |
| 3 | `Left-SP-3254.5 (From old App 3).pdf` | Two-sided (left/right) |

**Optimization goal:** see [`SDC-SCORE-001`](../../agent/rules/SDC-SCORE-001.md) (minimize crossings, collisions, bends; prefer readable spacing and nesting).

## Canonical test files

| File | Splice | Left pairs (contract) |
|------|--------|----------------------|
| `Left-STATE_OFFICE.csv` | STATE_OFFICE | 104 |
| `Left-SPI-215_I-80.csv` | SPI-215 & I-80 | 136 |
| `Left-SP-3254.5.csv` | SP-3254.5 | 20 |

Import via **Import file** in the app (`npm run dev`). Parse gap must be 0.

Automated: `referenceCsvParse.test.ts`, `sp3254Teaching.test.ts`

## Example matrix (#1–#3)

| File | Left pairs |
|------|------------|
| `old csv examples/CSV Splice Detail Example #1.csv` | 4 |
| `old csv examples/CSV Splice Detail Example #2.csv` | 6 |
| `old csv examples/CSV Splice Detail Example #3.csv` | 28 |

## Other examples

`old csv examples/` — additional Bentley exports for manual QA.

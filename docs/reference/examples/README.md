# Reference CSVs

Sample Bentley splice reports for import/parser contract tests and manual QA.

## Canonical test files

| File | Splice | Left pairs (contract) |
|------|--------|----------------------|
| `Left-STATE_OFFICE.csv` | STATE_OFFICE | 104 |
| `Left-SPI-215_I-80.csv` | SPI-215 & I-80 | 136 |
| `Left-SP-3254.5.csv` | SP-3254.5 | 20 |

Import via **Import file** in the app (`npm run dev`). Parse gap must be 0.

## Example matrix (#1–#3)

| File | Left pairs |
|------|------------|
| `old csv examples/CSV Splice Detail Example #1.csv` | 4 |
| `old csv examples/CSV Splice Detail Example #2.csv` | 6 |
| `old csv examples/CSV Splice Detail Example #3.csv` | 28 |

Automated: `src/features/import/referenceCsvParse.test.ts`

## Other examples

`old csv examples/` — additional Bentley exports for manual QA.

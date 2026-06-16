# CSV teaching reference — SP-3254.5

> **Primary teaching CSV** for Bentley import format and layout planning.  
> Source: [`docs/reference/examples/Left-SP-3254.5.csv`](../reference/examples/Left-SP-3254.5.csv)  
> Contract test: [`sp3254Teaching.test.ts`](../../src/features/import/sp3254Teaching.test.ts)

## Splice metadata

| Field | Value |
|-------|-------|
| Splice name | SP-3254.5 |
| Location | 40.145101 -111.646422 |
| Left rows | 20 |
| Right rows | 0 (empty section) |
| Parsed pairs | 20 |
| Parse gap | 0 |

---

## File shape

Bentley exports are **not** one-header-per-column spreadsheets.

```text
Lines 1–8    Report header (splice name, location, date)
Lines 10–11  Multi-line pseudo-headers (labels only)
Line 12      Left ---
Lines 14–33  One splice pair per row (split on <->)
Line 36      Right --- (empty — ignored for pairing)
```

---

## Row anatomy

Each data row:

```text
FromDevice, FromCable, FromFiber#, FromTube, FromFiberColor, <->, ToCable, ToFiber#, ToTube, ToFiberColor, ToDevice, OS
```

**Terminating Device** (first From field / To device slot): parsed structurally so cable names stay aligned — **not stored or used** in graph, layout, or rules.

Parser rules ([`bentleyRow.ts`](../../src/features/import/bentleyRow.ts)):

- Split on `<->`, not commas (cable names contain colons).
- **From side:** skip device field, then cable + last three fields = fiber#, tube, fiber color.
- **To side:** fixed tail from end = fiber#, tube, fiber color, device [, OS…]; device discarded.
- Blank **To fiber #** → copy From fiber #.
- Trailing commas around `<->` and after device are preserved in parsing logic.

---

## Row 14 walkthrough (reference row)

**Raw CSV line 14:**

```text
CENTRAL_UTAH_911_(VIA_HUB_3-07),72-SMF 4800 S DIST: MAIN ST - I-15,   1,BL,BL,<->,144-SMF I-15 DIST: MP 258.96 - 4800 S, ,VI,YL, ,[ATMS] CENTRAL UTAH 911
```

| Field | From (left of `<->`) | To (right of `<->`) |
|-------|----------------------|---------------------|
| Device | CENTRAL_UTAH_911_(VIA_HUB_3-07) *(ignored)* | *(blank — ignored)* |
| Cable | 72-SMF 4800 S DIST: MAIN ST - I-15 | 144-SMF I-15 DIST: MP 258.96 - 4800 S |
| Fiber # | 1 | *(blank → copy → 1)* |
| Buffer tube | BL | VI |
| Fiber color | BL | YL |
| OS | — | [ATMS] CENTRAL UTAH 911 |

**Parsed result (verified in tests):** cross-tube splice — BL tube on 72-SMF to VI tube on 144 segment A. OS is circuit metadata only (not layout).

---

## All 20 Left rows (annotated)

| # | Line | From cable → To cable | From f/t/fc | To f/t/fc | OS | Notes |
|---|------|----------------------|-------------|-----------|-----|-------|
| 1 | 14 | 72-SMF → 144 (258.96) | 1 BL BL | 1 VI YL | [ATMS] | Row 14 reference |
| 2 | 15 | 72-SMF → 144 (258.96) | 2 BL OR | 2 VI VI | [ATMS] | |
| 3 | 16 | 72-SMF → 144 (259.46) | 3 BL GR | 3 VI YL | [ATMS] | Segment B |
| 4 | 17 | 72-SMF → 144 (259.46) | 4 BL BR | 4 VI VI | [ATMS] | |
| 5 | 18 | 72-SMF → 6 DROP | 5 BL SL | 5 BL GR | CH 3254 | Drop on To |
| 6 | 19 | 72-SMF → 6 DROP | 6 BL WH | 6 BL BR | CH 3254 | |
| 7 | 20 | 72-SMF → 144 (259.46) | 7 BL RD | 7 GR SL | CH 3254 | Cross-tube |
| 8 | 21 | 72-SMF → 144 (259.46) | 8 BL BK | 8 GR WH | CH 3254 | |
| 9 | 22 | 144 (258.96) → 6 DROP | 29 GR SL | 29 BL BL | CH 3254 | |
| 10 | 23 | 144 (258.96) → 6 DROP | 30 GR WH | 30 BL OR | CH 3254 | |
| 11 | 24 | 144 (258.96) → 72-SMF | 117 VI YL | 117 BL BL | [ATMS] | Through pair |
| 12 | 25 | 144 (258.96) → 72-SMF | 118 VI VI | 118 BL OR | [ATMS] | Through pair |
| 13 | 26 | 6 DROP → 144 (258.96) | 1 BL BL | 1 GR SL | CH 3254 | Drop as From |
| 14 | 27 | 6 DROP → 144 (258.96) | 2 BL OR | 2 GR WH | CH 3254 | |
| 15 | 28 | 6 DROP → 72-SMF | 3 BL GR | 3 BL SL | CH 3254 | |
| 16 | 29 | 6 DROP → 72-SMF | 4 BL BR | 4 BL WH | CH 3254 | |
| 17 | 30 | 144 (259.46) → 72-SMF | 29 GR SL | 29 BL RD | CH 3254 | |
| 18 | 31 | 144 (259.46) → 72-SMF | 30 GR WH | 30 BL BK | CH 3254 | |
| 19 | 32 | 144 (259.46) → 72-SMF | 117 VI YL | 117 BL GR | [ATMS] | |
| 20 | 33 | 144 (259.46) → 72-SMF | 118 VI VI | 118 BL BR | [ATMS] | |

Abbreviations: **f** = fiber #, **t** = tube color, **fc** = fiber color.  
144 (258.96) = `144-SMF I-15 DIST: MP 258.96 - 4800 S`  
144 (259.46) = `144-SMF I-15 DIST: 4800 S - MP 259.46`

---

## Cable legs

Same **cable name** can appear as **From** and **To** in different rows → two diagram **legs** (`#from` / `#to`).

| Leg ID | Cable name | From count | To count | Role |
|--------|------------|------------|----------|------|
| `72-SMF …#from` | 72-SMF 4800 S DIST: MAIN ST - I-15 | 8 | 0 | Through — outbound |
| `72-SMF …#to` | 72-SMF 4800 S DIST: MAIN ST - I-15 | 0 | 8 | Through — inbound |
| `144 …258.96#from` | 144-SMF I-15 DIST: MP 258.96 - 4800 S | 4 | 0 | Segment A outbound |
| `144 …258.96#to` | 144-SMF I-15 DIST: MP 258.96 - 4800 S | 0 | 4 | Segment A inbound |
| `144 …259.46#from` | 144-SMF I-15 DIST: 4800 S - MP 259.46 | 4 | 0 | Segment B outbound |
| `144 …259.46#to` | 144-SMF I-15 DIST: 4800 S - MP 259.46 | 0 | 4 | Segment B inbound |
| `6 DROP …#from` | 6 DROP (TSC): I-15 NB & 1600 S | 4 | 0 | Drop outbound |
| `6 DROP …#to` | 6 DROP (TSC): I-15 NB & 1600 S | 0 | 4 | Drop inbound |

**144 segment names:** Two distinct Bentley cable names for adjacent 144-SMF sections — treat as **two separate legs**, not one continuous sheath.

---

## Resolved format rules (from this file)

| Rule | Status |
|------|--------|
| Left `---` only for pairing | Confirmed — Right empty |
| Blank To fiber # → copy From | Confirmed — all 20 rows |
| Terminating Device | **Ignored** — structural parse only |
| Cross-tube splices (BL→VI, etc.) | Expected |
| `[ATMS] …` and `CH ####` OS tags | Metadata only |
| Duplicate trailing OS fields | Not present in this file |
| Same cable name, both From and To | Two legs — `#from` / `#to` |

---

## Layout oracles (horizontal PDFs)

Three manual layouts from the prior app — same CSV, different side/stack choices. **Two-sided (left/right) only** — not quad.

| Variant | File |
|---------|------|
| 1 | [`Left-SP-3254.5 (From old App 1).pdf`](../reference/examples/Left-SP-3254.5%20(From%20old%20App%201).pdf) |
| 2 | [`Left-SP-3254.5 (From old App 2).pdf`](../reference/examples/Left-SP-3254.5%20(From%20old%20App%202).pdf) |
| 3 | [`Left-SP-3254.5 (From old App 3).pdf`](../reference/examples/Left-SP-3254.5%20(From%20old%20App%203).pdf) |

**Optimization goal:** minimize bends, crossovers, and loop-backs. Auto-import scores placement candidates and picks the lowest score ([`scoreRouting.ts`](../../src/features/routing/scoreRouting.ts)). Quad mode is experimental but may beat any horizontal variant.

### Oracle variants (annotation)

Fill in after side-by-side visual QA with PDFs. Columns record differences from current auto `#from`/`#to` heuristic.

| Aspect | Auto (default) | PDF 1 | PDF 2 | PDF 3 |
|--------|----------------|-------|-------|-------|
| 72-SMF sides | #from left / #to right | TBD | TBD | TBD |
| 144 (258.96) sides | #from left / #to right | TBD | TBD | TBD |
| 144 (259.46) sides | #from left / #to right | TBD | TBD | TBD |
| 6-drop sides | #from left / #to right | TBD | TBD | TBD |
| Left stack order (top→bottom) | volume sort | TBD | TBD | TBD |
| Right stack order (top→bottom) | volume sort | TBD | TBD | TBD |
| Crossovers (approx) | — | TBD | TBD | TBD |
| Loop-backs (approx) | — | TBD | TBD | TBD |

Refine candidates in [`sp3254-placement.md`](./rules/sp3254-placement.md) when PDF review is done.

---

## Layout expectations (horizontal auto)

Default diagram topology from graph + placement optimizer ([`pickBestLayout.ts`](../../src/features/rules/placement/pickBestLayout.ts)):

| Diagram side | Legs (default candidate) |
|--------------|--------------------------|
| **Left** | All `#from` legs |
| **Right** | All `#to` legs |

Concrete assignment (default candidate):

| Left | Right |
|------|-------|
| 72-SMF #from | 72-SMF #to |
| 144 (258.96) #from | 144 (258.96) #to |
| 144 (259.46) #from | 144 (259.46) #to |
| 6 DROP #from | 6 DROP #to |

**Dominant pair:** 72-SMF #from ↔ 72-SMF #to (rows 11–12, 15–16, 17–18, 19–20).

**Rules-driven (not CSV-driven):**

- Stack order of four left / four right cables
- Tube order within each cable (TIA BL→AQ)
- Center lane grouping for ATMS vs CH pairs
- Whether 144 segments A/B stack adjacent on same side

---

## Auto layout QA (vs PDF oracles)

```bash
npm run dev
# Import → Left-SP-3254.5.csv
# Compare canvas to PDF variants in docs/reference/examples/
npm run test:ci -- src/features/import/sp3254Optimization.test.ts
```

After import, `runImport()` returns `placementPlanId` and `routeScore` (crossings, loop-backs, bends, vertical spread). Record scores here when comparing to PDFs:

| Mode | Plan ID | Score | Crossings | Loop-backs | Bends | Notes |
|------|---------|-------|-----------|------------|-------|-------|
| Horizontal (auto) | `mirror-sides` | 2024 | 0 | 0 | 20 | Best of 4 candidates (2026-06-15) |
| Quad (auto) | *(varies)* | >200000 | 0 | 0 | 0 | 20 route errors — quad routing not ready; score penalized |

---

## How to validate

```bash
npm run dev
# Import → Left-SP-3254.5.csv
# Toolbar → Open connection inspector (parse report)
npm run test:ci -- src/features/import/sp3254Teaching.test.ts
npm run test:ci -- src/features/import/sp3254Optimization.test.ts
```

---

## Resolved decisions

| Question | Answer |
|----------|--------|
| 144 segments (258.96 vs 259.46) | **Two separate cable nodes** |
| Drop cable side | **Rules module** — not fixed per CSV |
| Stack order | **Rules module** — not fixed per CSV |
| Terminating Device | **Ignored** |
| Layout reference | Three horizontal PDF oracles + auto scorer |

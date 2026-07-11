# Golden Company 2 — Hand-Computation Worksheet

ORACLE independence artifact (blueprint §10 risk row: "Golden Company 2 authored from
app output"). Every declared total in `spec2.yaml` was computed here BY HAND first, then
the calculator's `deriveSaleTotals()` reproduces them. The app never sourced these numbers.

Rounding: half-up at 2 decimals, applied at line level then summed (matches
`deriveSaleTotals`). Sales tax rate 8.25%.

## TXN-SAL-G2-001 — 2.5 kg coffee @ $20.00, 0% disc, WH-WEST

- gross = 2.5 × 20.00 = 50.00
- discount = 50.00 × 0% = 0.00 → net = 50.00
- tax = 50.00 × 8.25% = 4.125 → **4.13** (half-up)
- invoice = 50.00 + 4.13 = **54.13**
- COGS (FIFO): 2.5 kg from BATCH-COF-WEST-A @ $12.00 = **30.00**

## TXN-SAL-G2-002 — 60 kg coffee @ $22.00, 10% disc, credit, WH-WEST

- gross = 60 × 22.00 = 1320.00
- discount = 1320.00 × 10% = 132.00 → net = **1188.00**
- tax = 1188.00 × 8.25% = 98.01 → **98.01**
- invoice = 1188.00 + 98.01 = **1286.01**
- COGS (FIFO): batch A had 100 − 2.5 (G2-001) = 97.5 kg left; take 60 kg @ $12.00 = **720.00**
  (batch B @ $15.00 untouched — FIFO consumes oldest first)

## TXN-SAL-G2-003 — 5 mugs @ $9.00, 0% disc, fiscal boundary, WH-EAST

- gross = 5 × 9.00 = 45.00
- discount = 0.00 → net = **45.00**
- tax = 45.00 × 8.25% = 3.7125 → **3.71** (half-up on 3.7125 → 3.71; the third decimal is 2, rounds down)
- invoice = 45.00 + 3.71 = **48.71**
- COGS: 5 mugs from BATCH-MUG-EAST-A @ $3.00 = **15.00**

## Fiscal-boundary note (G2-003)

Local time 2025-12-31 23:30 America/Los_Angeles = 2026-01-01 07:30 UTC. The sale belongs
to FY2025 by the tenant's local clock. The timezone suite asserts the sale lands in the
2025 period despite being 2026 in UTC — the DST/period-boundary correctness the dataset
was built to prove.

## Verification

`deriveSaleTotals()` (calculator.php) reproduces every bold value above and FAILS
generation on any mismatch. Confirmed: 12/12 values match (see Phase C migration log).

# Sweep Labeling — Consistency vs Truth (blueprint Phase G.1, F-22/FC-4)

The 154-route Ledger sweep has, historically, been called a "Truth Sweep." That overstated
it: its control values came from `FinancialReportingService` — the SAME service that powers
the pages it checks. Comparing a page to the service that renders it is a CONSISTENCY check,
not a TRUTH check. A bug in that shared service hides from both sides.

Phase G separates the two layers explicitly so the dashboard never overstates:

## Consistency Sweep (T2) — `audit:ledger-truth`
- Scans discovered GET routes; compares on-page financial props against
  FinancialReportingService.
- Catches DRIFT between a page and the service. Does NOT catch a bug IN the service.
- Labeled T2 on the dashboard. Strict mode now enforces: NON_JSON and ALL_ZEROS FAIL
  (no auto-pass), per-metric verification only on an actual comparison, tolerance ±0.01,
  and scan floors (routes scanned ≥ discovered; compared metrics ≥ LEDGER-DERIVED count).

## Truth Sweep (T1) — Golden-Audit tenant vs the MANIFEST
- For the Golden Audit tenant, control values come from the hand-derived Golden manifest
  (independent oracle), NOT from the service under test.
- This is the layer that catches a bug in FinancialReportingService itself.
- Labeled T1. This is the honest "truth" anchor Phase G adds.

## Why both
Consistency is cheap and broad (every route); truth is deep and narrow (the Golden tenant).
Reporting them under one "Truth Sweep" banner was the overstatement (FC-4). They are now
named for what they are.

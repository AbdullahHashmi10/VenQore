# Plan: Get Every Page Actually Checked Against the Ledger

## The gap, stated precisely

`LedgerTruthAuditCommand` (`audit:ledger-truth`) already does the hard infrastructure work correctly: it discovers all 260 GET routes, boots a real tenant, sends real authenticated HTTP requests, and writes a report. That part does not need to be rebuilt.

What it does *not* do is compare most pages to the Ledger. It only performs a real comparison (`deepCheck()`) for 11 routes hardcoded into a `DEEP_CHECKS` array. For the other 249 routes it only asks "is every financial-looking number exactly zero" — which is why `store.reports.purchases` could show Rs 3.25M and still be marked ✅ PASS while the Ledger says purchases YTD are Rs 0.00. "PASS" currently means "not obviously broken," not "matches the Ledger." Those are very different guarantees, and only the second one is the one you actually asked for.

Separately, `verification/number_registry.yaml` already lists 51 metrics, each with the route, the controller, the ledger-backed service method that should be its source of truth, and a `verified: false` flag — but nothing currently reads this file to drive the audit. This plan's core move is: stop hand-writing `DEEP_CHECKS` entries one at a time, and instead make the registry itself the generator of every check.

## Step 1 — Finish the registry as the single source of what to check

The registry has 51 entries today; the Phase 0 report said the app has ~228 financial-looking pages. Before automating checks off the registry, the registry itself needs to be complete, or the automation will only be as complete as it is today (51/228).

Extend `verify:map` (the existing Phase 0 command) to walk all 260 discovered routes from `LedgerTruthAuditCommand`'s own route discovery logic, and for every route not yet in the registry, auto-generate a draft entry: route name, controller/method, and a best-guess classification (LEDGER-DERIVED / TRANSACTION-DERIVED / HYBRID / UNKNOWN) based on whether the controller method calls `FinancialReportingService`/`AccountingService` versus `Sale::`/`DB::table('sales')`/etc. — the same static-analysis pattern already used manually to find the `SaleController` bug. UNKNOWN entries get a human review pass once, not per-audit-run. This step alone gives you a complete map before anything else is built on top of it.

## Step 2 — Generate deep checks from the registry instead of hand-writing them

For every registry entry classified LEDGER-DERIVED with a recorded `service` method (e.g. `FinancialReportingService@getPurchasesReport`), `LedgerTruthAuditCommand` should auto-derive a deep check: call that exact service method itself to get the control value, then extract the matching value from the page's JSON props (using the metric's recorded prop path, or falling back to the existing keyword-based `extractFinancialProps` scan if no explicit path is recorded yet), and compare. This turns `DEEP_CHECKS` from a hand-maintained array of 11 into a generated array covering every registry entry that has enough metadata to support it — which, since `FinancialReportingService` already exposes `getPurchasesReport`, `getCogsReport`, `getInventoryValuationReport`, `getAgedReceivables`, `getAgedPayables`, `getSalesReport`, and more, means most of the 51 registered metrics can get a real check immediately, not eventually.

Each registry entry gets its `verified: false` flipped to `true` only when its deep check has actually run and passed — not when a human believes it should pass. This makes the registry's verified-count a real, live coverage number instead of a static document.

## Step 3 — Resolve the purchases discrepancy first, as the proof case

Before scaling this to all 260 routes, use the one concrete finding already in hand: `store.reports.purchases` shows Rs 3.25M from the raw `purchases` table while the Ledger's `getPurchasesReport()`/control value says Rs 0.00 YTD. This is either (a) purchases genuinely aren't being journalized — a Ledger-writing bug in the purchase-posting path, which would also cast doubt on COGS and inventory valuation since those depend on purchase cost data — or (b) the Purchases Report reads the raw table instead of the Ledger, the same class of bug as the original `SaleController` case. Trace which one it is (check whether posted purchases in the Golden/audit seed actually produced `journal_entries`), fix the real cause, and use this as the first entry added to `DEEP_CHECKS`/registry-driven checks, so the system that's supposed to catch this class of bug demonstrably catches this specific instance before being trusted on the rest.

## Step 4 — Turn the two ambiguous buckets into a real verdict, not a shrug

**The 61 ALL_ZEROS pages** currently get lumped together as "probably fine." They need to be split by hand once into two lists: pages that are legitimately non-financial (settings, forms, activity logs — confirmed by a human, then reclassified NON-FINANCIAL in the registry so future runs don't re-flag them) versus pages that should have shown real numbers and didn't (a genuine bug, same severity as a mismatch). `store.reports.cash-flow` showing all-zero despite the report having non-zero `cash_inflow_ytd`/`cash_outflow_ytd` control values is a specific example that needs this triage now, not later.

**The 28 HTTP Errors** need the same triage: separate intentionally-stubbed 501s and genuinely-deprecated V2 routes (acceptable, should be excluded from the sweep via `SKIP_NAMES` once confirmed, with a comment saying why) from routes that are supposed to work today and are silently broken (real bugs, fix them). Nothing stays in "errors" as an unexamined bucket — every one of the 28 gets classified as one or the other.

## Step 5 — Make the coverage number itself the pass/fail gate

Add a `--strict` mode to `audit:ledger-truth` that fails (exit code 1) if: any registry entry classified LEDGER-DERIVED still has `verified: false`, any route is discovered that isn't in the registry at all, or the MISMATCH count is above zero. Wire this into CI. This is what prevents the exact failure mode already seen twice in this project — a report that says "0 mismatches" while most of the surface area was never actually compared to anything. Once this gate is green, "0 mismatches" will mean what it says.

## Order of work

1. Extend `verify:map` to auto-populate the registry from all 260 discovered routes (draft classification, human review pass once).
2. Wire `LedgerTruthAuditCommand` to generate deep checks from registry entries that have a recorded service method, replacing the hand-maintained 11-route array.
3. Resolve the Rs 3.25M vs Rs 0.00 purchases discrepancy as the first proof case; confirm the new generated check catches it.
4. Triage all 61 ALL_ZEROS and all 28 HTTP_ERROR rows individually into confirmed-safe or confirmed-bug; fix the bugs; reclassify the safe ones in the registry so they don't need re-triage every run.
5. Add `--strict` mode and wire it into CI so incomplete coverage or any real mismatch blocks deployment going forward, not just this one audit.

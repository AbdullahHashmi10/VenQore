# Ledger Truth Sweep — Implementation Plan
## Full-Coverage "Every Page Must Agree With The Ledger" Verification System

**Purpose of this document:** a concrete, buildable plan — not the abstract engine blueprint from before — for the specific system you asked for: one that walks every one of VenQore's 181 controllers / 228 pages, deliberately creates a sale whose cash register total and Ledger total are made to disagree, asks every surface "how much did we make," and prints a report in exactly this shape:

```
Expected (Ledger):          Rs 7,000
Dashboard Card:             Rs 7,000 ✓
Sales Report:               Rs 7,500 ✗
Sales List:                 Rs 7,500 ✗
Executive Dashboard:        Rs 7,000 ✓
API Response:               Rs 7,000 ✓

Conclusion
Two pages disagree with the Ledger.

Root Cause Candidate: SalesReportService.php
Reason: Uses Sales table instead of Ledger totals.
Confidence: 98%

Affected Pages:
• Sales Report
• Sales List
```

This plan reuses everything already built (the Golden Company, the 258 passing tests, the claim logger, the 10 engine classes sitting in `Tester/tests/Feature/Golden/Verification/Engines/`) rather than starting over. Those engines are not wasted — they are unwired, and this plan wires them.

---

## 0. What Already Happened, and Why It Wasn't Enough

Your 258 tests verify that the **math** is correct and that the **core financial surfaces** (Dashboard, Reports, Exports) read from the Ledger. They do this by comparing a small, known set of surfaces against the Golden Company manifest.

They never had a mechanism to **discover** surfaces they didn't already know about. `SaleController`'s "Sell Command Center" metrics were never compared to anything, not because the test suite is broken, but because nobody told it that page existed. The grep above shows this same gap in at least six more controllers.

The fix is not "write one more test for `SaleController`." The fix is a system that finds every controller automatically, forces a known disagreement, and reports who noticed and who didn't — so this class of bug can never again hide simply by not having been thought of yet.

---

## 1. The Core Mechanism: "Poisoned Transaction" Sweep

This is Idea #1 from your message, generalized into the actual mechanism the whole system runs on.

**Step 1 — Create a deliberately mismatched transaction.** In the Golden Company (or a dedicated sweep tenant), post one sale through the real `SaleService`/Ledger path for Rs 7,000, so the Ledger, `journal_entries`, and `journal_items` all say 7,000. Then, using direct DB manipulation (bypassing the service layer on purpose, as an adversarial step), inject an additional Rs 500 directly into the `sales`/`sale_items` raw tables only — never touching the Ledger. Now the "true" answer (per the Ledger) is 7,000, and the "raw table" answer is 7,500. This is the seed of every mismatch the system will detect.

**Step 2 — Ask every surface the same question.** "What was today's/this month's sales total?" — asked via real HTTP requests (not direct service calls) against every discovered financial surface (see Section 2), exactly as the existing Golden tests already do for the surfaces they know about.

**Step 3 — Record every answer as a claim.** Reuse the existing `VerificationClaim` / `ClaimLogger` infrastructure exactly as-is — it already supports `expected_value`, `actual_value`, `ledger_value`, `surface`. Nothing new needs to be invented here; this part of your system already works.

**Step 4 — Run the engines that already exist.** `LedgerComparisonEngine` marks each claim AGREE/DISAGREE against the Ledger value (7,000). `ConsistencyEngine` groups all "Sales Total" claims and flags that some agree and some don't. `ContradictionEngine` produces the plain-English verdict. `RootCauseEngine` + `TraceabilityEngine` trace the disagreeing surfaces back to the specific controller/service file. `EvidencePackGenerator` assembles the final report. All five of these classes exist today, in your repo, unused. This plan's job is to point them at real data.

This single mechanism, run repeatedly across every discovered surface, *is* the entire system. Everything below is either "how do we find every surface" (Section 2) or "how do we make the report readable" (Section 4).

---

## 2. Total Discovery: Finding All 181 Controllers / 228 Pages

You cannot verify a page nobody told the system about. This is the actual Phase 0 work the IDE admitted skipping, and it must happen before any sweep is meaningful.

**2.1 — Route enumeration.** A script (or artisan command, `verify:discover-surfaces`) parses `routes/web.php` and `routes/api.php` (757 + 27 routes per your own `PHASE0_REPORT.md`) and lists every route, its controller, its method, and its Inertia component (231 pages).

**2.2 — Financial-surface classification.** For each controller method, statically scan the method body for anything that looks like it returns a number that could be money or a count tied to money: `sum(`, `SUM(`, `count()` combined with a money-named variable, `selectRaw` with aggregate functions, any reference to `net_sales`, `total`, `revenue`, `amount`, `balance`. This does not need to be perfect — false positives (flagging a non-financial number) are cheap to dismiss by a human reviewer; false negatives (missing a real financial number) are the actual risk, so the scan should be deliberately generous/over-inclusive.

**2.3 — Registry expansion.** Every flagged method becomes an entry in the existing `verification/number_registry.yaml` (already built in Phase 0 for 28 metrics — this expands it toward the full 181-controller sweep). Each entry records: controller, method, route, data source used (`Sale::` / `DB::table('sales')` / `FinancialReportingService::` / other), and a first-pass classification (LEDGER-DERIVED / TRANSACTION-DERIVED / HYBRID / UNKNOWN), exactly matching the categories your own Phase 0 report already established.

**2.4 — The CI gate that prevents this from ever regressing.** `verify:discover-surfaces --strict` fails the build if any route touching a financial-looking query is not present in the registry. This is what makes "we forgot a page" structurally impossible going forward — not just this one sweep, but every future controller anyone ever writes.

**2.5 — Immediate output of this phase.** Even before any test runs, this discovery pass alone will produce a list that should look very similar to (and larger than) the grep result above — every controller currently querying `Sale`/`sales`/`Purchase`/`purchases`/`Transaction` directly. This list is itself actionable and should be delivered to you as the first artifact, before the full sweep is even built.

---

## 3. Running The Sweep Against Every Discovered Surface

Once Section 2's registry exists, the Poisoned Transaction mechanism (Section 1) runs once per registry entry, not once per hand-picked page.

**3.1 — HTTP-level, not unit-level.** Every check must go through the real route (as the existing `InputVerificationTestCase`/`OutputVerificationTestCase` already do), with real middleware, real tenant resolution — never a direct service call — because the bug you found lives in the controller's own query, and a direct service call would skip right past it.

**3.2 — Filter matrix per surface.** For surfaces that accept filters (date range, party, branch), repeat the check across the existing filter matrix categories (today/MTD/QTD/YTD/custom, per the original blueprint's Phase 5) — a surface can agree with the Ledger for "today" and disagree for "this month" if its bug is date-range-specific, so a single check per surface is not sufficient.

**3.3 — Multiple clock positions.** Reuse the existing four clock positions (Q1-end, mid-year, post-payment, year-end) already implemented in `ClockPositionConsistencyTest` — a surface can be correct at year-end (when everything has settled) and wrong mid-month (per the timezone-rollover class of bug already found once in this project).

**3.4 — Batch execution and runtime budget.** With ~181 controllers × several filter states × 4 clock positions, this is a large number of HTTP calls. Structure this as its own PHPUnit test suite (`--testsuite LedgerTruthSweep`), separate from the existing Golden suite, so it can run on its own schedule (nightly, or pre-launch) without slowing down every-commit CI. Fast local dev should still be able to run it scoped to one controller at a time (`--filter=SaleController`) for iteration speed while fixing findings.

---

## 4. The Report Format You Asked For

This is the direct implementation target — the exact block you pasted is the literal rendering spec for `EvidencePackGenerator`'s output, extended slightly to show all agreeing/disagreeing surfaces together per metric rather than one at a time.

**4.1 — One block per Consistency Group, not per test.** `ConsistencyEngine` already groups claims by metric (e.g., all "Monthly Sales Revenue" claims across every surface, however many there are). The renderer's job is: print the Ledger's value once at the top, then list every surface that made a claim about that metric, in the format `<Surface Name>: Rs <value> <✓ or ✗>`, where ✓ means the claim's `LedgerComparisonEngine` status was AGREE and ✗ means DISAGREE.

**4.2 — Conclusion line.** Generated directly from the count of ✗ entries: "Zero pages disagree with the Ledger" / "One page disagrees with the Ledger" / "N pages disagree with the Ledger" — never a canned sentence, always computed from the actual count in that specific report, consistent with the "explanations generated from structure, not templates" principle from the engine blueprint.

**4.3 — Root Cause Candidate + Reason.** This is `RootCauseEngine` + `TraceabilityEngine` output: for each disagreeing surface, trace back (via the registry entry from Section 2, which already recorded "this controller uses `Sale::where(...)`") to the specific file and the specific reason ("Uses Sales table instead of Ledger totals"). Where two disagreeing surfaces trace to the same underlying file/service (as will likely happen — `SalesReportService` powering both "Sales Report" and "Sales List" is exactly the kind of shared-root-cause case Section 8 of the earlier blueprint was designed for), collapse them into one Root Cause Candidate line, exactly as shown in your example.

**4.4 — Confidence.** Computed, not asserted: if the disagreeing surface's actual value exactly equals the raw-table "poisoned" value (7,500) rather than some other wrong number, that is very strong (high-confidence) evidence the specific mechanism is "reads raw table instead of Ledger," because an unrelated bug would be unlikely to produce exactly the poisoned figure. If the disagreeing value is some third number (neither 7,000 nor 7,500), confidence must be lower and the report must say so explicitly, per the "never manufacture false certainty" principle — a canned 98% for every finding would defeat the purpose of having a confidence score at all.

**4.5 — Affected Pages.** Pulled directly from `BlastRadiusEngine`, already built, listing every route/page that depends on the same offending service/controller — this is what turns "SalesReportService is wrong" into "and therefore these two pages are wrong."

---

## 5. Concrete Task List / Timeline

This is the order of work, sequenced so each step produces a usable result on its own rather than requiring the whole system to be finished before anything is useful.

**Task 1 — Total Controller/Route Discovery (Section 2.1–2.3).** Build `verify:discover-surfaces`. Deliverable: a complete, reviewed `number_registry.yaml` covering all 181 controllers, each classified LEDGER-DERIVED / TRANSACTION-DERIVED / HYBRID / UNKNOWN. This alone — even before any sweep runs — hands you a definitive list of every suspect file, similar in kind to the grep list above but complete and permanent.

**Task 2 — CI Discovery Gate (Section 2.4).** Wire `--strict` mode into CI so no new controller can be merged without being classified. This locks in the gain from Task 1 immediately, before the rest of the system exists.

**Task 3 — Wire the Poisoned Transaction fixture (Section 1, Steps 1–2).** One reusable test helper (`PoisonedTransactionFixture`) that creates the Rs 7,000/Rs 7,500 mismatch scenario in the Golden Company or a dedicated sweep tenant. Deliverable: one working example sweep test against `SaleController`'s known-bad Sell Command Center metric, producing a real, non-illustrative version of the exact report format in Section 4 for this one already-confirmed bug.

**Task 4 — Wire `verify:engines` into the standard run (already-built engines).** Connect `RunEnginesCommand` (already exists) to run automatically after the sweep test suite, reading the real claims log, and render output using the format from Section 4 rather than its current raw debug-style printout. Deliverable: the exact report format you specified, generated from real data, for the first time.

**Task 5 — Scale the sweep to every registry entry from Task 1.** Generate one sweep test per registry entry (or a data-provider-driven single test class iterating the whole registry, to avoid 181 near-duplicate files) — covering filters and clock positions per Section 3.2–3.3. Deliverable: full-coverage sweep, runtime-budgeted as its own test suite.

**Task 6 — Fix findings, starting with `SaleController`.** Using the Task 3 finding as the first confirmed case, apply the same fix pattern (swap raw `Sale::where(...)` queries for `FinancialReportingService`/Ledger-backed equivalents) to every TRANSACTION-DERIVED entry the sweep confirms, in Root-Cause-ranked order (highest blast radius / most affected pages first, per Section 4.5) — not file-by-file in arbitrary order.

**Task 7 — Lock down every fixed file.** For each file fixed in Task 6, add it to `ArchitecturalEnforcementTest.php`'s scanned-file list (exactly as you and the IDE already discussed for `SaleController`), so no future edit can reintroduce a raw query without instantly failing CI.

**Task 8 — Re-run full Launch Readiness.** Only after Tasks 1–7 are complete does "199/258/however-many tests passing" become equivalent to "every page agrees with the Ledger" — which is the actual guarantee you're after, not a proxy for it.

---

## 6. Why This Plan Won't Repeat The Original Mistake

The original problem was narrow test-fixing that made specific tests green without confirming the broader guarantee still held. This plan is structured so that guarantee — "every page shown to a user has been compared to the Ledger" — is the literal, measurable output of Task 1's registry (a completion percentage: entries verified / 181 controllers), not an assumption. Launch readiness in Task 8 should refuse to say "ready" while that percentage is below 100% for anything classified LEDGER-DERIVED-required, exactly mirroring the coverage-gate principle from the engine blueprint's Launch Readiness System.

# VenQore Test Ecosystem — Forensic Verification Audit (Phase 1)

**Scope:** `Tester/` — 139 PHP test files, Golden verification system, route sweeps, guardrails, audit commands, verification engines, and their supporting infrastructure (`verification/`, `database/seeders/GoldenCompanySeeder.php`, `app/Console/Commands/LedgerTruthAuditCommand.php`).
**Method:** Read-only forensic review. Every claim below cites a file and, where relevant, a line. Nothing was modified.
**Date:** 2026-07-10

---

## 0. Executive Summary

**Question asked:** *Can I genuinely trust this test suite to protect VenQore in production, or is it giving me a dangerous false sense of security?*

**Answer: Partial trust, with three disqualifying problems that must be resolved before this suite can be called a verification system for a financial ERP.**

1. **The premise "every single test currently passes" is contradicted by the suite's own evidence.** `Tester/.phpunit.result.cache` (written 2026-07-10 07:04, the morning of this audit) records the most recent PHPUnit run of the Golden suite as: **37 FAILURES, 109 ERRORS, 54 RISKY, 3 SKIPPED** across 204 tests — including nearly the entire financial core (`FinancialCoreVerificationTest` F02–F20, `GoldenCompanyTest`, `FifoBatchVerificationTest`, `AdversarialCorruptionTest` — 10/10 errored). Status codes verified against `vendor/phpunit/phpunit/src/Framework/TestStatus/*` (7=Failure, 8=Error, 5=Risky, 1=Skipped). Either the last run hit a broken environment (most likely, given the error cascade pattern) or the suite is red. Either way, a verification system whose latest recorded state is 146 failing/erroring tests is not currently verifying anything.

2. **The two write paths production actually uses are the two paths with documented critical bugs — and the tests that "cover" them are aimed elsewhere.** The live POS terminal posts to legacy `SaleController@store` (`resources/js/Pages/Pos.jsx:1039` → `store.sales.store`), which the project's own registry flags as *"CRITICAL — COGS fabrication bug on FIFO failure"* (`verification/number_registry.yaml`, POS-003). The live WooCommerce webhook calls `InventoryService::processSale` with **no journal entry at all** (`app/Http/Controllers/WooCommerceController.php:110`; registry WOO-001: *"WooCommerce sales invisible to ALL financial reports"*). Meanwhile the Golden input tests verify the V3 `SaleService` — a different code path — and `test_E10_woocommerce_sale_creates_identical_journal_to_normal_sale` passes by tagging a V3 sale `source='woocommerce'`, never touching the webhook. The suite is strongest exactly where production is not.

3. **The launch gate that is supposed to block shipping with critical issues is vacuous.** `LaunchGateTest::test_G03_number_registry_has_zero_critical_issues` counts occurrences of `severity: CRITICAL` in the registry. The registry uses the key `risk: 'CRITICAL — …'` instead. Verified counts: `severity: CRITICAL` = **0**, `risk: CRITICAL` = **2**. G-03 therefore passes with two open critical financial bugs, while `ArchitecturalEnforcementTest` A-12 simultaneously asserts those same bugs *remain* tracked. The launch gate is green because it greps for a key that does not exist.

**What deserves respect:** the Golden Company design (hand-authored `spec.yaml` → dependency-free `calculator.php` → `manifest.json` → real-service seeding → HTTP-level output comparison) is a genuinely serious verification architecture; `AdversarialCorruptionTest` and `SaleInputVerificationTest` E-12 are real sensitivity proofs (they verify the invariants *can* detect corruption); `FinancialCoreVerificationTest` F-04 (balance sheet must balance on all 365 days) and the control-account tie tests are exactly what an ERP auditor wants to see. The skeleton is excellent. The failure is in the connective tissue: dead code, duplicated suites, string-grep guardrails, circular sweeps, and tests that mirror the very bugs they should catch.

**Overall trust score: 4.5 / 10 — "capable design, unproven state."** Detail in §11.

---

## 1. Inventory and What Actually Runs

| Claimed | Found | Notes |
|---|---|---|
| ~701 core tests | 139 test files under `Tester/tests/`; ~460 PHPUnit-style + ~500 Pest-style test functions | Counts inflated by stubs (see F-14) |
| 258 Golden tests | Two copies: `Tester/tests/Feature/Golden/` (runs) and `Tester/Golden/tests/` (**does not run**) | 8 of 20 duplicated files have **diverged** (diff confirmed: `VenQoreTestCase`, `FinancialCoreVerificationTest`, `GoldenCompanyTest`, `CrossSurfaceConsistencyTest`, `ClockPositionConsistencyTest`, `InputVerificationTestCase`, `OutputVerificationTestCase`) |
| 154 route sweep | `audit:ledger-truth` artisan command (`LedgerTruthAuditCommand.php`, 1,376 lines), wrapped by `GoldenAuditTestsTest` | It is a consistency sweep, not a truth sweep (§6) |

Infrastructure findings:

- **F-01 (High) — A dead, divergent copy of the entire Golden suite.** `Tester/Golden/tests/` appears in no testsuite in `Tester/phpunit.xml`; the Golden dashboard (`Golden/dashboard/server.js`) points at `Tester/tests/Feature/Golden/` instead. Anyone reading or editing `Tester/Golden/tests/` is working on files that never execute. Divergence means the two copies will silently disagree.
- **F-02 (High) — A class-collision makes part of the claims instrumentation dead code.** `Tester/tests/Feature/Golden/VenQoreTestCase.php:3` declares `namespace Tests\Feature;` — the same FQCN as `Tester/tests/Feature/VenQoreTestCase.php`. Composer PSR-4 (`"Tests\\": "Tester/tests/"`, verified in `composer.json`) can only ever autoload the latter. The Golden copy — the one that logs `VerificationClaim`s from `assertJournalEntry()`/`assertMoneyEquals()` — is unreachable. Consequence: the ClaimLogger→Engines pipeline (ConfidenceEngine, ContradictionEngine, etc., consumed by `verification:run-engines`) operates on a systematically incomplete claims dataset while appearing to work.
- **F-03 (Medium) — `Tester/bootstrap.php` (which seeds GoldenCompany) is not wired into `phpunit.xml`** (`bootstrap="../vendor/autoload.php"`). Golden seeding instead happens via in-test `DB::commit(); Artisan::call(seed); DB::beginTransaction();` hacks inside `setUp()` (`OutputVerificationTestCase.php:97-110`, `FinancialCoreVerificationTest.php:114-122`). Manually committing and reopening transactions inside `RefreshDatabase`+`DatabaseTransactions` tests is fragile transaction-nesting surgery, and is the most plausible root cause of the 109 cascading ERRORs in the cached run.
- **F-04 (Low) — Trait double-stacking.** `OutputVerificationTestCase` adds `DatabaseTransactions` on top of the inherited `RefreshDatabase`. Redundant at best, order-dependent at worst.
- **F-05 (Low) — Namespace hygiene.** Several files declare non-PSR-4 namespaces (`Tester\tests\Feature\Money`, `Tester\Tests\Feature\Core`). They run only because PHPUnit loads test files by path.
- **F-06 (Low) — `.env.testing` declares `APP_ENV=local`** (overridden by phpunit.xml's `testing`, but a footgun for anyone running artisan with `--env=testing`).

---

## 2. The Golden Verification System (the flagship)

### 2.1 What is genuinely independent — and what is not

The doctrine (calculator "shares ZERO code with the Laravel application") is **true at the code level and only half-true at the logic level**:

- `verification/golden_company/calculator.php` has its own YAML parser, its own Ledger/FIFO/PartyLedger classes, no Laravel imports. Aggregation (trial balance, P&L, balance sheet, AR/AP roll-ups) *is* independently computed. Good.
- But per-transaction amounts are **transcribed, not derived**. For sales, the calculator reads `net_sales`, `total_tax`, `invoice_total`, `cogs` directly from `spec.yaml` (calculator.php, `case 'sale'`: `$netSales = $txn['net_sales']; … $cogs = $txn['cogs'];`). FIFO consumption is fed the exact batch IDs and quantities from the spec (`$fifo->deduct('', $batch['qty_taken'], [$batch['batch_id']])`). The calculator even hard-codes dataset-specific behavior (`$fifo->restore('BATCH-PHN-001', 3); // In the spec, SAL-002 consumed 3…`).
- **Implication:** the Golden system verifies that the app agrees with *hand-authored numbers*, which is correct auditing practice — provided the spec numbers were computed by hand and not copied from app output. There is no way to prove provenance from the code. The FIFO *ordering rule* itself is never independently recomputed anywhere in the manifest chain; it is asserted by the spec and separately spot-checked in `FifoBatchVerificationTest`/`SaleInputVerificationTest` E-08 with hand-built two-batch scenarios. Acceptable, but the "math verified twice" claim is overstated for FIFO and tax derivation.
- The seeder (`GoldenCompanySeeder`) posts sales through the **real V3 `SaleService`** (verified: `$saleService->post($data)` at seeder line ~948). This makes the output tests a real write-path→read-path end-to-end check **for the V3 path**.

### 2.2 Input verification (`SaleInputVerificationTest`, etc.) — strong tests, wrong doorway

Genuinely good: expected values computed inline from first principles (`round(2*1500*1.17, 2)`), balanced-entry checks, batch-remaining checks, invariant re-checks after every event, an idempotency test (E-11), and E-12 — a *sensitivity self-test* proving the GL-1100-vs-FIFO invariant actually fires when stock is tampered with. This is mutation-testing thinking, and it is rare and commendable.

Weaknesses:

- **F-07 (Critical, systemic) — They test `SaleService::post()` directly, not the HTTP endpoint.** The class docblock claims *"Every business event is executed through the REAL HTTP endpoint"* (`InputVerificationTestCase.php:20-22`); the tests call the service. Controller validation, request mapping, middleware, and permissions on the actual sale-creation route are untested here. Combined with the fact that production POS uses the *legacy* controller (§0.2), the strongest financial tests in the suite exercise a path production does not take.
- **F-08 (High) — `v3Post()` converts every 302 into a fabricated 200** (`InputVerificationTestCase.php:226-231`). A redirect-to-login or validation-failure redirect becomes "Success Redirect". Any test that treats a v3Post response as success without independently asserting DB effects can pass while the POST did nothing.
- **F-09 (Medium) — Existence-style journal assertions tolerate extra garbage.** `assertJournalLine()` asserts a matching line *exists*; `assertJournalBalanced()` sums all lines. A double-posted revenue line, or a spurious balanced DR/CR pair (e.g., DR 9999/CR 9999 to junk accounts), passes every assertion in most E-tests. Only E-10/E-11 assert entry *counts*. No test asserts "exactly N lines, and nothing else."
- **F-10 (Medium) — E-07's fallback accepts almost anything.** If the overpayment isn't found in GL 2100/2050, the test accepts *any* credit line to *any* account other than 4000/2100 — without checking the amount (`SaleInputVerificationTest.php:421-432`). Posting the Rs.490 excess to AR (wrong) or Rs.1 to anything (wrong) passes.
- **F-11 (Low) — `assertFifoConsumedInOrder()` is under-constrained** (`VenQoreTestCase.php:304-318`): it filters `whereIn($expectedBatchIds)` (extra consumed batches invisible), orders by `created_at` (same-second ties are nondeterministic), and has no sale scoping.
- Tolerances: ±0.02 per money assertion, ±0.10 in the route sweep, ×12 accumulation allowances in F-14. Defensible individually; collectively they define a systemic blind spot of a few paise per metric — fine for retail POS, would not satisfy a bank.

### 2.3 Output verification (`ReportOutputTest`, `DashboardOutputTest`, `FinancialCoreVerificationTest`)

The best category in the suite. F-01→F-20 include the 365-day balance-sheet sweep (F-04), three-way inventory tie (F-07), AR/AP control-account ties against per-party `LedgerService` sums (F-08/F-09), monthly-sums-to-annual rounding property (F-14), quarterly composition (F-20), and cash-flow-vs-balance-movement (F-18). These are property-based, auditor-grade checks.

Caveats:

- **F-12 (Medium) — `M(...) ?? 0` manifest fallbacks.** If a manifest key path rots, expected becomes 0.0. Normally the live value ≠ 0 fails loudly; but a page that breaks to all-zeros *plus* a rotten manifest key passes silently. The `ALL_ZEROS` result class in the route sweep (§6) shows all-zero pages are a real, tolerated state.
- **F-13 (Low) — `findKey()` recursive first-match** (`OutputVerificationTestCase.php:184-194`) can bind an assertion to the wrong same-named key anywhere in the props tree after a UI refactor.
- `CrossSurfaceConsistencyTest` compares surfaces largely against `FinancialReportingService` itself — by design a consistency layer, not a truth layer. Fine *only because* the manifest anchor exists in the sibling tests; anyone deleting the manifest tests would leave a fully circular shell.

### 2.4 Meta-tests that verify the test system

`LaunchGateTest` G-01/G-02/G-04 count test files and test-method counts; G-05/G-06 assert command source contains strings. These protect against deletion, not against dilution — a gutted test that keeps its method name still counts. And G-03 is the vacuous critical-issue gate (§0.3), which together with A-12 produces the absurd equilibrium: *the registry must keep saying there are critical bugs (A-12 passes) while the launch gate says there are none (G-03 passes).*

---

## 3. Adversarial & corruption testing — the strongest idea, currently erroring

`AdversarialCorruptionTest` V-01…V-10 injects orphaned sales, unbalanced entries, tampered batch quantities, cross-tenant items, duplicates, and backdates, then asserts detection or graceful handling. This is the correct paradigm and V-01 directly guards the "reports read raw tables" bypass class.

- **F-14a (High) — All 10 attack vectors ERRORED in the last cached run.** The corruption-detection suite is exactly the one you cannot afford to have silently broken.
- **F-15 (Medium) — Detection ≠ alerting.** The suite proves `is_balanced` flags *would* show false. Nothing verifies that production *runs* any of these checks on a schedule (`verify:ledger` is asserted to exist as a file in G-05 — never executed against corrupted data in any test).

---

## 4. Guardrails and architecture tests — string-grep fences

`ArchitecturalEnforcementTest` (A-01…A-13), `SingleWriterGuardTest`, `NoSecondCalculatorTest`, `MassAssignmentGuardTest`, `PermissionBypassGuardTest`.

- **F-16 (High) — The "single writer" guard bans only two spellings.** `SingleWriterGuardTest` flags `JournalItem::create(`/`JournalEntry::create(` and nothing else. `DB::table('journal_items')->insert(...)`, `JournalItem::insert()`, `new JournalItem + save()`, `updateOrCreate`, and query-builder writes all pass. The entire `app/Console/Commands/` tree plus `DataImportService` are allow-listed. A developer can bypass the ledger's single-writer rule with the most obvious alternative syntax and no test will notice.
- **F-17 (High) — Raw-SQL bans are aliasable and scoped to two V3 controllers.** A-01/A-02 string-match `DB::table(` etc. in `V3/ReportController` and `V3/DashboardController` only. `use ...DB as Database;` defeats them. A-08 (no controller touches `journal_items`) covers only `app/Http/Controllers/V3` and carries a **7-controller allowlist including `PurchaseController`** — i.e., accepted standing violations. Legacy and Admin controllers (where POS-003 lives) are outside every architectural fence.
- **F-18 (Critical) — The permission guard grandfathers 257 unprotected write routes.** `PermissionBypassGuardTest` is a ratchet against *new* holes; its baseline (`baselines/unprotected_write_routes.json`, 257 entries, verified) permanently accepts `DELETE s/{slug}/sales/{sale}`, `DELETE purchases/{purchase}`, `DELETE customers/{customer}`, v3 products/parties/warehouses, and more, with no `permission:` middleware. Worse, if the baseline file is deleted, the test *re-seeds it from current state and passes* (`PermissionBypassGuardTest.php:58-70`) — the ratchet resets itself silently.
- A-12 (known issues must stay tracked) is genuinely good governance. A-04/A-05 (no float money columns/casts) are meaningful precision fences.
- `NoSecondCalculatorTest` checks only that controllers don't import `V3\ReportService` — one class, one import spelling.

**Answering the mandate's question directly:** *Can developers still accidentally bypass the Ledger?* Yes — via raw inserts (F-16), via any non-V3 controller (F-17), via console commands (allow-listed), and via the two already-existing production bypasses (POS-003 fallback, WOO-001). The guardrails would not stop a determined mistake, only a careless one that happens to use the banned spelling in the watched files.

---

## 5. The Sentinel isolation trap — right idea, unverifiable sweep

`SentinelAuditTest` seeds a Rs.9,999 sale/purchase/expense with no journal entries, then scans LEDGER-DERIVED routes for the amount. Sound concept; four holes:

- **F-19 (High) — Silent skips with no floor.** Unresolvable routes are skipped (`resolveRouteUrl` → null) and **any non-200 response is skipped** (`SentinelAuditTest.php:60-62`). There is no assertion on how many routes were actually scanned. If route names rot or auth breaks, the sentinel passes having scanned nothing.
- **F-20 (High) — Blind to aggregation leaks.** Detection is literal-value matching (`scanPayload`, 9999 or "9,999"). A report that wrongly `SUM()`s raw tables absorbs the 9,999 into a larger total and is invisible. Aggregation is precisely how a raw-table bypass would manifest on financial reports.
- **F-21 (Medium) — Substring false-positive latent bug:** `str_contains($string, '9999')` matches the Golden tenant id `999991` if any payload echoes it as a string; the test currently passes, which mostly indicates how little payload is being scanned.
- The failure of routes to respond 200 is itself never reported — a 500 on a financial page passes the sentinel.

---

## 6. The "154-route Ledger Truth Sweep" — consistency dressed as truth

`GoldenAuditTestsTest` wraps `audit:ledger-truth --strict`. Forensic reading of `LedgerTruthAuditCommand.php`:

- **F-22 (Critical, conceptual) — Control values come from `FinancialReportingService` itself** (lines 418-475). Every page is compared against FRS output. Pages that render FRS numbers agree with FRS by construction. The sweep detects *dual-calculator drift and bypass pages* (valuable — this is the "one brain" enforcement) but **cannot detect FRS being wrong**. The name "Ledger Truth" and the dashboard's "✅ verified" language claim more than the mechanism delivers. Truth grounding exists only in the Golden manifest tests — which errored in the last recorded run.
- **F-23 (High) — Non-JSON responses auto-PASS and mark all the route's metrics verified** (`recordResult(... 'NON_JSON' ...); $this->cntPass++; $this->markMetricsForRouteAsVerified($name);`). A financial page that degrades to raw HTML is counted as verified without a single number checked.
- **F-24 (High) — Route-level bulk verification defeats strict mode.** `deepCheck()` silently `continue`s when a control key or prop path can't be resolved (stale `prop_path` ⇒ `$pageVal === null`), after which the PASS branch marks *all* metrics for the route verified. Strict mode's "0 unverified LEDGER-DERIVED metrics" guarantee is therefore satisfiable with zero values actually compared on a route.
- **F-25 (Medium) — `ALL_ZEROS` is a warning, not a failure.** A page showing all zeros — the classic symptom of broken data binding — passes strict mode (`cntAllZeros`, then `markMetricsForRouteAsVerified`).
- **F-26 (Medium) — Scope:** only `store.*` GET routes; ~60 named skips including all exports, prints, and sync APIs; SuperAdmin/platform financials excluded entirely. Fallback prop matching is keyword-fuzzy (`str_contains` on prop names), tolerance ±0.10.
- `LedgerTruthSweepTest.php` (the Pest file) is fully circular: expected dashboard revenue is obtained by calling FRS (`$this->frs->getProfitAndLoss(...)`) — the same service the dashboard controller calls. Title *"main dashboard has correct ledger values"* claims correctness; the test proves wiring.

---

## 7. Mirror-logic hunt — tests that replicate production bugs

- **F-27 (Critical) — `ReportReconciliationTest` re-implements the COGS-fabrication bug in its expected values.** Lines 197-199: `if ($fifoCogs == 0) { $fifoCogs = $item->cost_price * $item->quantity; … }` — the test's "independent DB aggregate" falls back to `cost_price × qty` exactly as the flagged POS-003 production behavior does. If FIFO silently fails and COGS is fabricated, the report and the test's expectation fabricate identically → green. This file is also one of the few that exercises the *legacy* `POST /sales` path, i.e., the one place the real POS path is financially tested is the place where the oracle mirrors the bug.
- **F-28 (High)** — The Heart suite (`OneCoreReconciliationGateTest`) and `CalculatorParityTest` compare FRS to direct `journal_items` SQL ("referee"). Legitimate as *read-faithfulness* checks (do reports read the ledger correctly), but they share the journal as source: a wrong *write* passes both sides. Fine in-layer; must never be counted as correctness coverage.
- `DashboardConsistencyTest`, `test_dashboard_controller_revenue_matches_frs` — same family, same caveat.

---

## 8. Module, smoke, and page-health sweeps

- `InertiaPageRenderTest` (15 routes) asserts component names + key props presence — above-average smoke quality. `PageHealthTest` (35 routes) is honest about being 200/non-500 checks. `ProductionSmokeTest` (45 Pest tests) mixes real checks (config, DB flags) with `expect(true)->toBeTrue()` placeholders (×2).
- Module01–21: mixed quality. `Module05/FinancialEngineTest` uses real journal assertions (`assertJournalEntry` ×4, `assertMoneyEquals` ×9, `assertTrialBalanceZero` ×2). `Module12/ReportsTest` leans on `assertOk()` ×15 with 11 value equalities. Many module tests verify HTTP 200 + prop presence rather than values — inventory-grade, not audit-grade.
- **F-29 (Medium) — `ScenarioStubsTest` inflates counts:** 54 `markTestIncomplete` stubs (honest) + **12 `assertTrue(true)` "covered elsewhere" tests that pass while verifying nothing** — and whose cross-references (e.g., *"Covered: FifoServiceTest::it_deducts_from_oldest_batch_first"*) are not machine-checked, so the pointed-at test can be deleted without s001 failing.
- `FifoDeterminismTest` (5 identical runs must produce COGS exactly 800.00) is a good flakiness/determinism probe. Note it accepts bare `assertStatus(302)` on writes without asserting redirect target.

---

## 9. Coverage analysis — what is NOT covered

Verified absent or out of scope (by grep across `Tester/`):

1. **True concurrency.** `EdgeCasesTimeConcurrencyTest` E-10 is a *static string check* that `FifoService` contains `lockForUpdate()`; E-11 is sequential simulation, acknowledged in comments ("PHPUnit is single-threaded"). No parallel-process race test exists anywhere. Lock effectiveness, deadlock behavior, and lost-update scenarios are unverified.
2. **The real POS checkout path's journal correctness** (POS-003) — only tested via a mirror-logic oracle (F-27).
3. **The WooCommerce webhook's financial behavior** (WOO-001) — untested; the similarly-named E-10 tests a different path.
4. **Export content.** PDF/Excel/CSV exports are skipped by the sweep and asserted nowhere for numeric content; registry EXP-001 notes exports "mirror ReportController" — unverified.
5. **Queues, Horizon, scheduled jobs** (`woocommerce:sync-stock` scheduler) — no tests.
6. **Cache invalidation** (settings cache is cleared manually in tests; no test proves stale-cache behavior).
7. **The MySQL trigger layer.** CLAUDE.md warns the PaymentAllocation→JournalEntry trigger must hold; no test exercises the trigger firing/rejecting.
8. **Backdated/historical corrections beyond V-06; fiscal-year close; period locking.**
9. **Multi-currency, FX** (single-currency dataset).
10. **Batch expiry consumption rules, serial-tracked sale financials, composite Mode A vs B journals** (manufacturing service tests exist but not composite-COGS-vs-GL ties per mode).
11. **Negative-stock accounting effects** (negative batches asserted *absent* in Golden data; behavior when allowed is untested).
12. **Permission depth:** role-matrix tests exist (`GranularPermissionTest`, 4 tests) but 257 write routes have no permission middleware at all (F-18) — no test asserts what a cashier can DELETE.
13. **Timezone:** exactly 2 tests (`TenantTimezoneTest`); DST boundaries, cross-midnight sales vs report bucketing under non-UTC tenants largely unexercised (ClockPosition tests freeze one clock).
14. **SuperAdmin/platform financial surfaces** — excluded from every sweep.
15. **Offline sync conflicts** — idempotent replay is tested (E-11, `OfflineSyncIdempotencyGuardTest`); conflicting concurrent offline edits are not.

Covered well, for the record: leap-day boundaries (E-01…E-04), PHP-vs-MySQL rounding agreement (E-06), large-decimal storage (E-07), inverted date ranges (E-09), tenant isolation (multiple layers, including manifest-anchored F-16), plan gating (`PlanTruthFailClosedTest` — fail-closed posture), mass-assignment drift ratchet, Ziggy route integrity.

---

## 10. False-confidence register (consolidated)

| # | Where | Mechanism | Severity |
|---|---|---|---|
| FC-1 | `LaunchGateTest` G-03 | Greps `severity: CRITICAL`; registry uses `risk:` — gate passes with 2 open criticals | **Critical** |
| FC-2 | `SaleInputVerificationTest` E-10 name | "woocommerce sale creates identical journal" — tests V3 tag, not the journal-less webhook | **Critical** |
| FC-3 | `ReportReconciliationTest:197-199` | Expected-value oracle replicates POS-003 COGS fallback | **Critical** |
| FC-4 | `LedgerTruthAuditCommand` | FRS-vs-FRS circularity + NON_JSON auto-pass + route-level bulk "verified" + ALL_ZEROS tolerated | **Critical** |
| FC-5 | `.phpunit.result.cache` | "All tests pass" narrative vs 146 failed/errored in last recorded run | **Critical** |
| FC-6 | `PermissionBypassGuardTest` | 257 grandfathered unprotected write routes; self-reseeding baseline | High |
| FC-7 | `SingleWriterGuardTest` | Two-spelling ban; commands + import service allow-listed | High |
| FC-8 | `SentinelAuditTest` | Silent skips, no scan-count floor, aggregation-blind | High |
| FC-9 | `InputVerificationTestCase::v3Post` | 302 → fabricated 200 | High |
| FC-10 | Golden duplicate suite + dead `VenQoreTestCase` | Divergent dead copies; ClaimLogger partially dead → engines under-fed | High |
| FC-11 | `ScenarioStubsTest` | 12 passing no-op tests; unchecked cross-references | Medium |
| FC-12 | `assertJournalLine` family | Existence-only; extra/duplicate lines invisible | Medium |
| FC-13 | Manifest `?? 0` + all-zero pages | Compound-rot double-zero pass | Medium |
| FC-14 | `LedgerTruthSweepTest` (Pest) | Dashboard "correct" proven by asking the same service | Medium |

---

## 11. Trust scores (brutal, evidence-weighted)

| Dimension | Score /10 | One-line justification |
|---|---|---|
| Financial correctness confidence | **4** | Manifest architecture is real, but transcribed spec values, V3-only doorway, and a red last run cap it |
| Ledger protection (single source of truth) | **4** | Sweep enforces consistency not truth; single-writer guard is two greps; two known production bypasses open |
| Architecture enforcement | **4** | String fences, V3-only scope, allowlists including `PurchaseController` |
| Coverage breadth | **5** | Wide surface, but the deepest gaps (real POS path, webhook, concurrency, exports) are the money paths |
| Business-rule verification | **5** | E/X/P input tests encode rules independently and well — for one of two write engines |
| Regression resistance | **5** | Good ratchets and A-12 governance; undermined by self-reseeding baselines, dead duplicates, meta-tests that count rather than weigh |
| Dashboard verification | **5** | Manifest-anchored D-01…D-07 solid; sweep layer circular |
| Report verification | **5** | R-01…R-15 manifest-anchored; exports/prints unverified |
| API verification | **3** | Sync/webhook/API endpoints skipped by sweeps; thin module coverage |
| Corruption/integrity detection | **6*** | Best-designed category (V-01…V-10, E-12 sensitivity proofs) — *starred because all 10 errored in the last recorded run and nothing schedules the checks in production |
| **Overall trust** | **4.5** | **Not yet trustworthy for an enterprise financial ERP. Trustworthy skeleton.** |

Would Stripe/SAP/Oracle/a banking regulator accept this? No — a regulator's first three questions are fatal today: (1) show me the latest green run (cache says red), (2) show me the tests on the production money paths (POS-003/WOO-001 open, mirror-logic oracle), (3) show me that your launch gate can actually fail (G-03 cannot).

---

## 12. Verdict

The VenQore test ecosystem contains roughly a **top-decile verification design** — independent manifest, adversarial corruption probes, invariant sensitivity self-tests, 365-day property sweeps, control-account ties, known-issue governance — **operating at roughly median-quality execution**: dead and divergent suite copies, a namespace collision silently disabling instrumentation, grep-based guardrails with allowlists where the risk lives, circular "truth" sweeps, a launch gate that cannot see the two documented critical bugs, an oracle that reproduces the very bug it should catch, and a result cache showing the flagship suite failed or errored en masse the morning of this audit.

**Trust it as a consistency net and a regression tripwire for the V3 path. Do not yet trust it as proof of financial correctness for production**, because production's money flows through the legacy POS controller and the WooCommerce webhook — the two doors this suite guards least.

*(Phase 1 ends here. No fixes, reorganizations, or new tests were made, per mandate.)*

---

### Appendix A — Key evidence index

| Claim | Evidence |
|---|---|
| Last run red | `Tester/.phpunit.result.cache` (mtime 2026-07-10 07:04): status distribution `{5:54, 7:37, 8:109, 1:3}`; mapping from `vendor/phpunit/.../TestStatus/{Failure,Error,Risky,Skipped}.php` = 7/8/5/1 |
| Golden dead copy | `Tester/phpunit.xml` testsuites (no `Golden/` dir); `diff` shows 8/20 files differ |
| Dead base class | `Tester/tests/Feature/Golden/VenQoreTestCase.php:3` (`namespace Tests\Feature`) vs composer PSR-4 `Tests\ → Tester/tests/` |
| POS path | `resources/js/Pages/Pos.jsx:1039`; `routes/web.php:171` comment; registry POS-003 (`risk: CRITICAL — COGS fabrication`) |
| Woo bypass | `app/Http/Controllers/WooCommerceController.php:110` (`inventoryService->processSale`); registry WOO-001 |
| G-03 vacuous | `LaunchGateTest.php:194-243`; `grep -c "severity: CRITICAL"` = 0, `risk: CRITICAL` = 2 in `verification/number_registry.yaml` |
| Calculator transcription | `verification/golden_company/calculator.php`, `case 'sale'` block; `$fifo->restore('BATCH-PHN-001', 3)` |
| 302→200 | `Tester/tests/Feature/Golden/InputVerificationTestCase.php:226-231` |
| Mirror-logic COGS | `Tester/tests/Feature/Money/ReportReconciliationTest.php:197-199` |
| Sweep circularity / NON_JSON pass / bulk verify | `app/Console/Commands/LedgerTruthAuditCommand.php:418-475, ~640-650, deepCheck()` |
| 257 grandfathered routes | `Tester/tests/Feature/Guardrails/baselines/unprotected_write_routes.json` (count verified) |
| Single-writer gaps | `Tester/tests/Feature/Core/SingleWriterGuardTest.php:33` |
| Sentinel skips | `Tester/tests/Feature/Golden/SentinelAuditTest.php:50-62`; `SentinelTestCase::scanPayload` |
| Stub inflation | `ScenarioStubsTest`: 54 × `markTestIncomplete`, 12 × `assertTrue(true)` |
| Concurrency simulated | `EdgeCasesTimeConcurrencyTest.php:484-557` |

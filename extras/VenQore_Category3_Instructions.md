# VenQore — Category 3 to 100%: Step-by-Step IDE Instructions

**Purpose:** finish Category 3 (one calculator on every screen) from ~75% to 100%. Paste each PART to your IDE in order. After each PART goes green, **commit immediately** (Golden Rule). Do not start the next PART until the current one is committed.

**Where we are:** the engine (`FinancialReportingService`) is anointed and complete; the Dashboard and the AI assistant already read it. **What's left:** retire the second calculator (`V3\ReportService`) from 6 controllers, kill any remaining raw `Sale::sum` revenue on Admin screens, and prove every report reads the one engine.

**The north-star check (must hold after every PART):** golden transaction = buy 10@50 + 10@100, sell 15@200 on credit, return 2 → revenue 2600, **COGS 800, gross profit 1800**, AR 2600, AP 1500, inventory 700, trial balance zero.

**Run tests with:** `E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Core Tester/tests/Feature/Money`

---

## PART 0 — Lock in what's already done (do this FIRST)

```
TASK: commit the uncommitted reconcile follow-ups before any new work.
1. Run: E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Core Tester/tests/Feature/Money
2. If ALL green, run:
   git add -A
   git commit -m "reconcile follow-ups: getTenantId refactor, FIFO determinism, dashboard timezone"
3. Run: git status   → must show a clean tree (nothing uncommitted).
REPORT: the test summary line and the new commit hash. If anything is RED, stop and report which test.
```

---

## PART 1 — Inventory the screens that still read the old calculator (read-only, no code change)

```
TASK: produce a map of every place that still reads V3\ReportService or a raw Sale::sum for money.
Do NOT change any code. Just report.

1. Grep the whole app/ for: "V3\ReportService", "ReportService::class", "new ReportService".
2. Grep app/Http/Controllers for raw revenue sums: "sum('total')", "sum('final_total')",
   "sum('net_sales')", "Sale::where(" used to compute a money figure.
3. For each hit, report: file:line, the method it's in, and what number it produces (revenue? profit?
   inventory? a list?).

KNOWN starting list to confirm (V3\ReportService callers):
 - AdminController:31
 - FinanceController:191
 - InventoryController:18 / 29 / 230
 - V3/DashboardController:7
 - V3/ReportController:7
 - V3/ReportExportController:6

REPORT: the full table (file:line | method | what it computes | current source). This is the checklist
we will tick off in PART 2 and PART 3.
```

---

## PART 2 — Port any missing engine methods, with reconciliation tests (no screen changes yet)

```
TASK: before repointing any screen, make sure FinancialReportingService has a correct method for
every number the 6 controllers need. Move logic from V3\ReportService into FinancialReportingService;
do NOT rewrite from scratch. Each ported method gets a reconciliation test in the same commit.

STANDING RULE: no test weakened; a failing reconciliation is a real finding — report + stop.

1. From the PART 1 map, list every V3\ReportService method those 6 controllers call
   (e.g. trialBalance, balanceSheet, agedReceivables, agedPayables, salesReport, purchasesReport,
   cogsReport, inventoryValuation, inventoryMovement, cashFlow, partyLedger, grossProfit, taxReport).
2. For each one NOT already on FinancialReportingService: add an equivalent method to
   FinancialReportingService that reads from journal_items (is_reversed=0, tenant-scoped) and/or the
   FIFO batch tables, and NETS returns wherever revenue/qty/COGS is involved.
3. For EACH ported method, add a test in Tester/tests/Feature/Core/ (e.g. PortedMethodsReconcileTest)
   that runs the golden transaction and asserts the ported method == a direct-DB aggregate written
   inline in the test, to the cent.
4. CRITICAL: also assert that V3\ReportService's version of the SAME method, for the SAME data, equals
   the new engine method — UNLESS it differs because RS has a bug (e.g. doesn't net returns), in which
   case REPORT the difference (that difference is the justification for retiring RS).

ACCEPTANCE: every ported method has a passing reconciliation test; Core + Money suites stay green.
REPORT: the list of ported methods, the reconciliation test output, and any RS-vs-engine differences found.
DO NOT touch any controller yet.
COMMIT: git commit -m "C3.3a: port remaining report methods into the single engine + reconciliation tests"
```

---

## PART 3 — Repoint the 6 controllers to the single engine (one controller per commit)

```
TASK: repoint each controller from V3\ReportService to FinancialReportingService. Do them ONE AT A TIME,
test, and COMMIT after each, so a mistake is isolated to one small commit.

For EACH of: AdminController, FinanceController, InventoryController, V3/DashboardController,
              V3/ReportController, V3/ReportExportController

  a. Replace every app(\App\Services\V3\ReportService::class) / resolve(ReportService::class) /
     "use App\Services\V3\ReportService" with the FinancialReportingService equivalent method
     (mapped in PART 2).
  b. Map the return-array keys carefully (RS and the engine may name keys differently, e.g.
     total_revenue vs revenue). Read both method signatures; do not guess.
  c. Run: E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Core Tester/tests/Feature/Money
  d. If green: git add -A && git commit -m "C3.3b: repoint <ControllerName> to single engine"
  e. If red: fix or report; do NOT proceed to the next controller until green.

REPORT after EACH controller: the diff + test summary + commit hash.
```

---

## PART 4 — Delete the second calculator and add a permanent guard

```
TASK: once NO controller references V3\ReportService, retire it and add a guard so it can never come back.

1. Grep app/ for "V3\ReportService" — must be ZERO (outside the file itself). If any remain, list them and STOP.
2. Delete it: git rm app/Services/V3/ReportService.php   (or leave a thin class that throws
   "retired — use FinancialReportingService" if other code references the type).
3. Add Tester/tests/Feature/Core/NoSecondCalculatorTest.php: a static scan asserting that no file under
   app/Http/Controllers references "V3\ReportService". Prove it bites: temporarily add a reference to a
   throwaway controller, confirm the test FAILS naming that file, then remove it (report you did this).
4. Run Core + Money suites → all green.
COMMIT: git commit -m "C3.3c: retire V3\ReportService; add NoSecondCalculatorTest guard"
REPORT: the zero-reference grep result, the negative-check result, and the commit hash.
```

---

## PART 5 — Full reconciliation sweep: every report reads the one engine (C3.4)

```
TASK: prove that EVERY money report and screen reads only the engine and reconciles to direct DB.

1. List all report routes (grep routes/web.php for "reports."). For EACH report, identify its
   controller method and confirm it calls FinancialReportingService (not a raw query, not RS).
   Report any that don't — those get fixed.
2. Add Tester/tests/Feature/Core/FullReportReconciliationTest.php: for each major report
   (P&L, balance sheet, trial balance, item-wise profit, bill-wise, party-wise, category-wise,
   tax, inventory valuation, aged AR, aged AP, cash flow, day book, sales register, purchase register),
   run a seeded scenario INCLUDING a partial return, and assert the report's headline number ==
   a direct-DB aggregate written inline, to the cent.
3. Check the 4 edge cases on at least the top 6 reports: timezone (tenant-local date), soft-delete
   (deleting a record must NOT change a closed-period report), null values (no crash), returns (netted).
4. Run Core + Money suites → all green.
COMMIT: git commit -m "C3.4: full report reconciliation suite — every report reads the one engine"
REPORT: the per-report source table (report | source | reconciles? Y/N) and the test output.
```

---

## PART 6 — Sign-off: Category 3 = 100

```
TASK: final confirmation that Category 3 is complete.
1. Confirm ALL of these tests are present and green:
   Core/SingleWriterGuardTest, Core/BalanceConsistencyTest, Core/CalculatorParityTest,
   Core/FifoDeterminismTest, Core/DashboardConsistencyTest, Core/NoSecondCalculatorTest,
   Core/FullReportReconciliationTest, and the whole Money suite.
2. Confirm zero references to V3\ReportService in app/Http/Controllers.
3. Confirm the golden transaction reconciles everywhere: COGS 800, gross profit 1800.
COMMIT (if not already): ensure git status is clean.
REPORT: the full green test summary + clean git status. Category 3 is then 100%.
```

---

## After Category 3 = 100

Next is **Category 4** (pages render + per-page correctness) and **Category 5** (the one `OneCoreReconciliationGate` test that proves the entire chain reconciles — the capstone). Those are in `VenQore_HANDOFF.md` Section 4. Then the manual launch checklist (Section 6 of the handoff).

**Remember after every PART: run the tests, and if green, COMMIT before moving on. That one habit is what keeps your work safe.**

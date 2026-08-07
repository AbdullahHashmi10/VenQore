# IDE MASTER INSTRUCTION — Complete Category 3 (One Read-Engine) End-to-End

**TO THE IDE / AI AGENT: This is one continuous job. Execute every PART below in order, top to bottom. After each PART, run the tests and `git commit` exactly as written BEFORE starting the next PART. Do not skip the commits — they are what keep the work safe. Do not stop until PART 7 is committed, unless a test goes RED for a reason you cannot fix, in which case STOP and report exactly which test and why.**

---

## CONTEXT YOU NEED (read once, then begin)

- This is VenQore, a Laravel 12 + Inertia + MySQL multi-tenant POS/ERP.
- We are making all money numbers come from ONE calculator: `App\Services\FinancialReportingService` (the "engine").
- A second, older calculator `App\Services\V3\ReportService` still feeds ~6 controllers. Your job is to retire it: port any methods it has that the engine lacks, repoint every controller to the engine, delete `V3\ReportService`, and prove every report reads the engine.
- The engine, the Dashboard, and the AI assistant ALREADY read the engine — do not break those.

## THE LAWS (never break these)

1. **NEVER weaken a test to make it pass.** If a test is red, fix the code, or prove the test was wrong and report it. Changing an expected number to match buggy output is forbidden.
2. **COMMIT after every PART that goes green.** One commit per PART, message as specified.
3. **The golden transaction is the north star.** Buy 10@50 + 10@100, sell 15@200 on credit, return 2 → revenue **2600**, COGS **800**, gross profit **1800**, AR **2600**, AP **1500**, inventory **700**, trial balance **zero**. Any report/screen that disagrees is wrong.
4. **Run money on MySQL** (`amd_pos_test`), never SQLite.

## TEST + COMMIT COMMANDS (use these literally)

- Run tests: `E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Core Tester/tests/Feature/Money`
- Run one file: `E:\Software\Xampp\php\php.exe artisan test <path-to-test-file>`
- Commit: `git add -A` then `git commit -m "<message>"`
- Check clean: `git status` (must show nothing uncommitted before starting the next PART)

## GUARD TESTS THAT MUST STAY GREEN THE WHOLE TIME

`Tester/tests/Feature/Core/`: `SingleWriterGuardTest`, `BalanceConsistencyTest`, `CalculatorParityTest`, `FifoDeterminismTest`, `DashboardConsistencyTest`. If any of these disappears or goes red at any point, STOP — something regressed.

---

# PART 0 — SECURE EVERYTHING FIRST (commit the current uncommitted work)

There are uncommitted changes in the working tree right now. Lock them in before doing anything new.

1. Run the full suite: `E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Core Tester/tests/Feature/Money`
2. If ALL green:
   - `git add -A`
   - `git commit -m "chore: secure reconcile follow-ups (getTenantId, FIFO determinism, dashboard tz) before C3"`
3. `git status` → must be clean.
4. If anything is RED: STOP. Report which test and the failure lines. Do not proceed.

**REPORT:** the test summary line, the new commit hash, and confirmation `git status` is clean.

---

# PART 1 — MAP every screen still on the old calculator (READ-ONLY, no code changes)

Do not change any code in this PART. Only investigate and report.

1. Grep `app/` for: `V3\ReportService`, `ReportService::class`, `new ReportService`. List every hit as `file:line`.
2. Grep `app/Http/Controllers` for raw money sums: `sum('total')`, `sum('final_total')`, `sum('net_sales')`, and any `Sale::where(...)` used to compute a revenue/profit figure. List each hit.
3. For each hit, state: which controller method it is in, and what number it produces (revenue? profit? a list of accounts? inventory value?).
4. Confirm or correct this known starting list of `V3\ReportService` callers:
   `AdminController:31`, `FinanceController:191`, `InventoryController:18/29/230`, `V3/DashboardController:7`, `V3/ReportController:7`, `V3/ReportExportController:6`.
5. For EACH `V3\ReportService` method those controllers call, check whether `FinancialReportingService` already has an equivalent method. Produce a table: `RS method | controller(s) using it | engine equivalent exists? (yes/no)`.

**REPORT:** the full hit list + the `RS method → engine equivalent` table. This is the checklist for PART 2 and PART 3. Do NOT commit (no code changed).

---

# PART 2 — PORT the missing engine methods (+ reconciliation tests). Still no controller changes.

For every `V3\ReportService` method the controllers need that the engine LACKS (from the PART 1 table), add it to `FinancialReportingService` by MOVING the logic over (do not rewrite from scratch). Likely list: `trialBalance`, `balanceSheet`, `agedReceivables`, `agedPayables`, `salesReport`, `purchasesReport`, `cogsReport`, `inventoryValuation`, `inventoryMovement`, `cashFlow`, `partyLedger`, `grossProfit`, `taxReport`.

Rules for each ported method:
- Read from `journal_items` (filter `is_reversed = 0`, tenant-scoped) and/or the FIFO batch tables.
- NET returns wherever revenue, quantity, or COGS is involved (use the same returns-netting the engine already uses).
- If the engine already has a near-equivalent, REUSE it — do not duplicate.

Then add a test file `Tester/tests/Feature/Core/PortedMethodsReconcileTest.php`:
- Seed the golden transaction (buy 10@50 + 10@100, sell 15@200 credit, return 2).
- For each ported method, assert its output == a direct-DB aggregate written inline in the test, to the cent.
- ALSO compare each ported engine method against the OLD `V3\ReportService` method on the same data. If they differ, that difference is almost certainly an RS bug (e.g. RS does not net returns) — REPORT the difference in your summary; it justifies retiring RS. Do NOT change the engine to match RS.

Acceptance: `PortedMethodsReconcileTest` green; full Core + Money suites stay green. Do NOT touch any controller in this PART.

Commit: `git add -A` then `git commit -m "C3.3a: port report methods into single engine + reconciliation tests"`

**REPORT:** ported method list, the reconciliation test output, every RS-vs-engine difference found, and the commit hash.

---

# PART 3 — REPOINT the 6 controllers to the engine, ONE AT A TIME (commit after each)

Do these one controller at a time. After each: run tests, and if green, commit. Then the next. This isolates any mistake to one tiny commit.

Order: `AdminController` → `FinanceController` → `InventoryController` → `V3/DashboardController` → `V3/ReportController` → `V3/ReportExportController`.

For EACH controller:
- a. Replace every `app(\App\Services\V3\ReportService::class)`, `resolve(ReportService::class)`, and `use App\Services\V3\ReportService;` with the `FinancialReportingService` equivalent method (mapped in PART 1/2).
- b. CAREFULLY map return-array keys: RS and the engine may name keys differently (e.g. RS `total_revenue` vs engine `revenue`; RS `total_cogs` vs engine `cogs`). READ both method bodies — do not guess the key names.
- c. Run: `E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Core Tester/tests/Feature/Money`
- d. If green: `git add -A` then `git commit -m "C3.3b: repoint <ControllerName> to single engine"`
- e. If red: fix it (or report and STOP). Do NOT move to the next controller until this one is green and committed.

**REPORT after EACH controller:** the diff, the test summary, and the commit hash.

---

# PART 4 — DELETE the second calculator + add a permanent guard

1. Grep `app/` for `V3\ReportService` — there must be ZERO references outside the file itself. If any remain, list them and STOP (PART 3 missed one).
2. Retire it: `git rm app/Services/V3/ReportService.php`. (If some non-controller code still references the TYPE, instead replace the class body with a stub whose every method throws `\RuntimeException('V3\ReportService retired — use FinancialReportingService')`, and report why.)
3. Create `Tester/tests/Feature/Core/NoSecondCalculatorTest.php`: a static source scan asserting NO file under `app/Http/Controllers` contains the string `V3\ReportService`. Implement it like the existing `SingleWriterGuardTest` (recursively read files, regex, assert empty violations list).
4. Prove the guard bites: temporarily add `app(\App\Services\V3\ReportService::class);` to any throwaway controller, run `NoSecondCalculatorTest`, confirm it FAILS naming that file, then remove the line and confirm it passes again. Report that you did this.
5. Run Core + Money suites → all green.

Commit: `git add -A` then `git commit -m "C3.3c: retire V3\ReportService; add NoSecondCalculatorTest guard"`

**REPORT:** the zero-reference grep result, the negative-check result (test failing then passing), and the commit hash.

---

# PART 5 — FULL report reconciliation: prove EVERY report reads the engine

1. List every report route: grep `routes/web.php` for `reports.`. For each, find its controller method and confirm it calls `FinancialReportingService` (not a raw query, not RS). Report any that don't — fix those to use the engine and note it.
2. Create `Tester/tests/Feature/Core/FullReportReconciliationTest.php`. Seed a scenario that INCLUDES a partial return, then for each of these reports assert the headline number == a direct-DB aggregate written inline, to the cent:
   P&L, Balance Sheet, Trial Balance, Item-wise Profit, Bill-wise Profit, Party-wise Profit, Category-wise Profit, Tax, Inventory Valuation, Aged Receivables, Aged Payables, Cash Flow, Day Book, Sales Register, Purchase Register.
3. For the top 6 reports, also check the 4 edge cases:
   - Timezone: a sale at the tenant's local 11pm counts on the tenant-local date.
   - Soft-delete: deleting a record does NOT change a prior (closed) period's report total.
   - Nulls: a product with null cost / a deleted FK target does not crash the report.
   - Returns: the report nets the returned units (no ghost revenue).
4. Run Core + Money suites → all green.

Commit: `git add -A` then `git commit -m "C3.4: full report reconciliation suite — every report reads the one engine"`

**REPORT:** a table `report | data source | reconciles? (Y/N)` for every report, and the test output.

---

# PART 6 — SIGN-OFF: confirm Category 3 = 100%

1. Confirm ALL of these exist and are GREEN:
   `Core/SingleWriterGuardTest`, `Core/BalanceConsistencyTest`, `Core/CalculatorParityTest`, `Core/FifoDeterminismTest`, `Core/DashboardConsistencyTest`, `Core/PortedMethodsReconcileTest`, `Core/NoSecondCalculatorTest`, `Core/FullReportReconciliationTest`, and the entire `Money` suite.
2. Confirm ZERO references to `V3\ReportService` anywhere in `app/Http/Controllers`.
3. Confirm the golden transaction reconciles across the engine: COGS 800, gross profit 1800, revenue 2600.
4. `git status` must be clean (everything committed).

**REPORT:** the full green test summary, the zero-reference confirmation, and a clean `git status`. When all three hold, Category 3 is 100% complete.

---

# PART 7 — FINAL SAFETY COMMIT + LOG

1. Append a short section to `VenQore_Build_Log.md` recording: "Category 3 COMPLETE (100%) — V3\ReportService retired, all reports read FinancialReportingService, reconciliation suite green," with the date and the final commit hash.
2. `git add -A` then `git commit -m "docs: log Category 3 complete (one read-engine, reconciliation suite green)"`
3. `git log --oneline -10` → confirm the C3 commits are all present in history.

**REPORT:** the final commit hash and the last 10 commit lines. STOP here — Category 3 is done and saved.

---

## IF ANYTHING GOES WRONG AT ANY POINT

- A guard test goes red or disappears → STOP, report it; do not "fix" it by editing the test.
- A reconciliation number won't match → that is a REAL bug; report the exact numbers (expected vs actual) and STOP. Do not change the expected number.
- Confused about a key name or method → READ the actual method body in both services; never guess.
- `git status` shows a big uncommitted pile → commit the current PART's work before continuing.

**The whole point of this instruction is: small steps, a test after each, a commit after each. Done this way, Category 3 reaches 100% and nothing can be lost.**

# VenQore POS — Pre-Launch Fix Instructions

Source: Run `20260710_233750_13380` (Tester/VerificationCenter/runs/20260710_233750_13380/),
992 tests executed, 919 passed, 10 failed, 4 errored, 3 skipped, 1 risky, 55 incomplete.

## Ground rule — read this before touching anything

**Do not edit, weaken, delete, or add `markTestSkipped()` / `markTestIncomplete()` to any test
file to make it pass.** Every item below is a real code/data problem. Fix the application code,
the seeder, the migration, or the test environment setup (seeding, fixtures) — never the
assertion itself. If you believe a test's expected value is actually wrong (e.g. a count that's
stale), you must prove it by tracing the business requirement first (see Item 1), not just
change the number because it's inconvenient.

If after investigating you find a test's expectation is provably outdated (not just failing),
say so explicitly in your summary with the evidence — don't silently edit it.

---

## Item 1 — Chart of accounts seeds 25 accounts, test expects 24

**File:** `database/seeders/TenantDefaultSeeder.php`
**Failing test:** `Tester/tests/Feature/Module02/StoreCreationAndProvisioningTest.php:88`
(`test('store creation seeds default data')`)
**Error:** `Failed asserting that 25 matches expected 24.`

`TenantDefaultSeeder.php` currently defines 25 GL accounts (codes 1000–7000, 4000–4900,
5000–6000). The test asserts exactly 24. This seeder was last touched in commit `5024783`
("complete ledger truth sweep and data integrity audits").

**Do this:**
1. List all 25 account codes currently seeded (`1000, 1010, 1100, 1200, 1300, 1500, 2000, 2050,
   2100, 2200, 2300, 3000, 3100, 3999, 7000, 4000, 4100, 4900, 5000, 5100, 5200, 5300, 5400,
   5900, 6000`).
2. Check `git log -p` / `git blame` on `TenantDefaultSeeder.php` around commit `5024783` to see
   which account was added and why (search the commit for "ledger truth" / "data integrity"
   context).
3. Check whether that added account (likely candidates: something in the 6xxx range used by
   `ScenarioStubsTest` scenarios `s102_stock_writeoff_posts_to_6300` or
   `s105_stock_adjustment_gain_posts_to_4200` — note codes 6300 and 4200 do NOT currently exist
   in the seeder list above) is actually wired into `AccountingService`, `FifoService`, or any
   report. If it's referenced by real code paths (stock write-off, stock adjustment gain, etc.)
   but missing from the seeder, that's the bug — the seeder is incomplete, not over-complete.
4. Fix root cause: either (a) the seeder is missing account(s) that production code needs and
   the count should legitimately be higher than 24 — in which case leave the seeder as-is /
   complete it correctly, or (b) there's a genuinely duplicate/stray account that shouldn't be
   there — remove that one specific account from the seeder.
5. Only after code is correct, if the true intended count differs from 24, note it — I'll decide
   whether the test's expected number needs updating (that's a business-rule decision, not
   yours to make silently).

---

## Item 2 — Dashboard/reports attribute revenue to created_at instead of posted_at

**Files:** likely `app/Services/FinancialReportingService.php`, dashboard/report controllers
under `app/Http/Controllers/V3/`
**Failing tests:**
- `Tester/tests/Feature/Module13/DashboardTest.php:83`
  (`'attributes revenue and COGS to posted_at date range instead of created_at date range'`)
  — `Failed asserting that 0.0 is identical to 1200.0.`
- `Tester/tests/Feature/Core/NumberLineageCompletenessTest.php`
  (`ledger_derived_metrics_trace_to_a_service_and_accounts`) — flags these dashboard/report
  metrics as having no traceable `ledger_accounts`: `M-AUTO-034` (Dashboard V1),
  `M-AUTO-053` (Reports Index), `M-AUTO-054` (Reports Daily Sales), `M-AUTO-055` (Reports Day
  Book), `M-AUTO-056` (Reports Party Statement), `M-AUTO-057` (Reports Transactions).

**Root cause to find:** somewhere revenue/COGS date filtering uses `created_at` on the
transaction/journal query instead of `posted_at`. A sale created on one date but posted
(backdated or async-posted) on another date is being bucketed into the wrong reporting period.

**Do this:**
1. Search `app/Services/FinancialReportingService.php` and any V3 report/dashboard controller
   for `whereBetween('created_at'` or `->created_at` used in revenue/COGS date-range filtering.
2. Change the date column used for period filtering to `posted_at` (the field the accounting
   engine actually uses to timestamp when a journal entry took effect), consistent with how
   Golden test manifests expect period attribution to work.
3. Cross-check this doesn't break `Tester/tests/Feature/Golden/ClockPositionConsistencyTest.php`
   (already passing) — re-run it after the fix to confirm it still passes.
4. Separately, register the six metrics listed above (`M-AUTO-034/053/054/055/056/057`) in
   `verification/number_registry.yaml` with correct `ledger_accounts` lineage so
   `NumberLineageCompletenessTest` can trace them. Look at how existing entries in that YAML
   are structured and follow the same pattern — every number displayed on a page must map to
   the GL account(s) it's derived from.

---

## Item 3 — Journal writes bypass the single-writer service

**File:** `app/Console/Commands/MigrateOpeningBalances.php`
**Failing test:** `Tester/tests/Feature/Guardrails/AstSingleWriterGuardTest.php`
(`no_journal_writes_outside_the_approved_writer`)
**Error:**
```
AST single-writer guard: journal writes found OUTSIDE app/Services/V3/AccountingService.php:
app/Console/Commands/MigrateOpeningBalances.php:178  DB::table(journal_*)->insertOrIgnore()
app/Console/Commands/MigrateOpeningBalances.php:181  DB::table(journal_*)->insert()
app/Console/Commands/MigrateOpeningBalances.php:236  DB::table(journal_*)->delete()
```

This is an architecture rule: all ledger/journal writes must go through
`app/Services/V3/AccountingService.php` so double-entry balancing, tenant scoping, and audit
logging are guaranteed. `MigrateOpeningBalances.php` writes directly to `journal_entries` /
`journal_items` tables at lines 178, 181, and 236, bypassing that.

**Do this:**
1. Open `app/Console/Commands/MigrateOpeningBalances.php` and look at lines ~170–240.
2. Replace the direct `DB::table('journal_entries'/'journal_items')->insert/insertOrIgnore/delete`
   calls with calls into `AccountingService` (it should already expose a method for creating a
   balanced journal entry, and likely a reversal/delete path — check its public API first rather
   than inventing a new one).
3. If `AccountingService` genuinely has no supported way to do a bulk opening-balance import
   (e.g. no batch insert method), add one there — the fix belongs in the service, not by
   re-permitting a bypass.
4. Re-run the affected opening-balance migration test(s) to confirm balances still post
   correctly after the refactor.

---

## Item 4 — Three guardrail tests error because no Tenant exists in the test DB

**Files:**
- `Tester/tests/Feature/Guardrails/FifoConcurrencyRaceTest.php:38`
- `Tester/tests/Feature/Guardrails/LedgerCorruptionAlertTest.php`
- `Tester/tests/Feature/Guardrails/PaymentAllocationTriggerTest.php`

**Error (all three, identical):** `No query results for model [App\Models\Tenant].` — each
calls `Tenant::query()->firstOrFail()` and finds zero rows.

**Related skips (same root cause, different files):**
- `Tester/tests/Feature/Golden/FifoBatchVerificationTest.php:408` (`B07`)
- `Tester/tests/Feature/Golden/FinancialCoreVerificationTest.php:103` (skips citing
  "Tenant 2 not seeded. Run GoldenCompanySeeder first.")
- `Tester/tests/Feature/Golden/LaunchGateTest.php:515` (`I-05`, "No TXN-* sales found —
  GoldenCompanySeeder may not have run")

**This is a test-environment/fixture problem, not application code** — these tests assume the
Golden Company dataset (`database/seeders/GoldenCompanySeeder.php`) has already been seeded into
`amd_pos_test` before the suite runs. When run in isolation or after a DB reset without that
seeder, they correctly fail rather than silently passing.

**Do this:**
1. Confirm `GoldenCompanySeeder` is meant to run once per fresh `amd_pos_test` DB before the
   full suite — check `Tester/phpunit.xml` bootstrap and `Tester/tests/Feature/VenQoreTestCase.php`
   (the shared base class) for whether it's supposed to auto-seed, and whether that logic
   silently no-ops if data already exists vs. genuinely never ran.
2. If the intent is "seed once, tests assume it's already there": make sure your local/CI test
   run procedure always does `php artisan db:seed --class=GoldenCompanySeeder --env=testing`
   (against `amd_pos_test`, per this project's DB policy — never SQLite, never `venqore_pos`)
   before running PHPUnit. Document this as a required pre-step if it isn't already documented
   in `Tester/RUN_INSTRUCTIONS.md`.
3. If the intent is "each test should be self-sufficient": add a tenant-seeding guard in
   `VenQoreTestCase::setUp()` (or a trait) that seeds a minimal Tenant + Golden Company dataset
   if none exists yet, so tests don't depend on run order or a separate manual step.
4. Either way, do NOT add `markTestSkipped` fallbacks to route around a missing seed — fix the
   setup so the seed is reliably present, since these guardrails (FIFO concurrency races, ledger
   corruption alerting, payment over-allocation) are load-bearing for a financial system and
   need to actually execute before launch.

---

## Item 5 — verify:ledger command exits non-zero (Golden ledger truth audit failing)

**Failing test:** `Tester/tests/Feature/Golden/GoldenAuditTestsTest.php` (`test_ledger_truth_audit`)
**Error:** `Expected status code 0 but received 1.`

**Do this:**
1. Run `php artisan audit:ledger-truth` manually against `amd_pos_test` (with Golden Company
   seeded per Item 4) and read its actual output — it will report which invariant it's flagging
   (see `app/Console/Commands/VerifyLedgerCommand.php`).
2. This is likely the SAME underlying issue as Item 6 below (sale-return / batch reversal not
   correctly updating ledger state) — check whether fixing Item 6 also clears this one before
   investigating further in isolation.

---

## Item 6 — Sale returns don't correctly restore inventory batches, and this cascades into COGS/gross-profit reports

**Files:** likely `app/Services/V3/SaleService.php` (return/reversal logic),
`app/Models/SaleItemBatch.php`
**Failing tests:**
- `Tester/tests/Feature/Golden/GoldenCompanyTest.php`
  (`test_sale_return_restores_inventory_batch`) — `After SR-001, sale_item_batches for SAL-002
  should be marked is_reversed=true. Failed asserting that 0 is greater than 0.`
- `Tester/tests/Feature/Golden/ReportOutputTest.php` (`test_R06_cogs_endpoint_reconciled...`) —
  `[R-06] COGS report: reconciled must be true (FIFO vs GL 5000 must agree). Failed asserting
  that false is true.`
- `Tester/tests/Feature/Golden/ReportOutputTest.php`
  (`test_R07_gross_profit_by_product_sums_to_manifest`) — expected gross profit
  Rs.423,430.00, got **Rs.-5,679,370.00** (a ~6-million-rupee swing — this is a serious bug,
  not a rounding issue).

**Do this:**
1. Find where a sale return processes batch reversal — search for `is_reversed` on
   `sale_item_batches` and trace the return/reversal code path in `SaleService` (or wherever
   `SaleReversalService` referenced in CLAUDE.md lives — check
   `app/Services/SaleReversalService.php` if it exists).
2. Confirm that when a sale return is posted, every `sale_item_batches` row tied to the
   original sale's returned quantity gets `is_reversed = true` set (currently it's staying 0).
3. Trace forward: since COGS (GL 5000) is computed from batch consumption, and gross profit
   report sums COGS per product, a batch that never gets marked reversed will keep counting as
   "sold" (cost) even after the return credited revenue back — this fully explains why R07's
   gross profit is now deeply negative instead of matching the manifest. Fixing the
   `is_reversed` flag correctly should fix R06 and R07 as a consequence — verify this by
   re-running all three tests together after the fix, don't fix them independently.
4. Also re-run `Tester/tests/Feature/Golden/GoldenAuditTestsTest.php` after this fix (see Item 5
   — likely resolves together).

---

## Item 7 — Sales export total diverges from ledger revenue by more than 1%

**File:** likely `app/Exports/` (maatwebsite Excel export class for sales)
**Failing test:** `Tester/tests/Feature/Production/ExportContentVerificationTest.php`
(`export_sales_total_matches_ledger_revenue`)
**Error:** `EXP-001: Sales export total diverges from ledger revenue by more than 1% —
export=1982390.1 ledger=1578430.0` (export is ~25% higher than the ledger figure — likely
including something the ledger excludes, e.g. tax, discounts, or returned sales that should
have been netted out).

**Do this:**
1. Find the sales export class (search `app/Exports/` for a Sales-related export).
2. Compare its total calculation against `FinancialReportingService`'s revenue calculation
   (the ledger source of truth). Check specifically whether the export is summing
   `invoice_total` (gross, includes tax) while the ledger reports net revenue, or whether it's
   including reversed/returned sales that the ledger correctly excludes.
3. Fix the export to compute its total the same way the ledger does — reuse
   `FinancialReportingService` if possible rather than re-deriving the number independently
   (this project already has a "single source of truth" rule per `Core\NoSecondCalculatorTest`,
   which is currently passing — don't create a second calculator here either).

---

## Item 8 — SentinelDeltaDetectionTest errors on a foreign key violation (likely test fixture, not app code)

**File:** `Tester/tests/Feature/Golden/SentinelDeltaDetectionTest.php`
(`aggregation_leak_moves_the_total_and_is_detected`)
**Error:** `SQLSTATE[23000]: ... Cannot add or update a child row: a foreign key constraint
fails (sales_user_id_foreign) ... insert into sales (...user_id...)`

**Do this:**
1. Read the test's setup — it's deliberately inserting a synthetic/tampered sale row to prove
   the sentinel detects aggregation leaks. It's inserting with a `user_id` that doesn't exist
   in `users` for the current tenant context.
2. Fix the test's fixture setup to create/reference a valid `User` row first (this is test
   *setup* code, not a test *assertion* — adjusting how the fixture seeds its data is fine and
   is not the same as weakening an assertion). Do not change what the test is checking.
3. If this depends on the Item 4 tenant-seeding fix, re-test after that lands first.

---

## After all fixes — re-run and report back

Run the full suite the same way as the run analyzed here:
```
php artisan db:seed --class=GoldenCompanySeeder   (against amd_pos_test, if not already present)
vendor/bin/pest --configuration Tester/phpunit.xml --no-coverage
```
or trigger it via `Tester/VerificationCenter/launch-command-center.bat` → DEPLOY ANALYZER.

Do not touch `Tester/tests/Feature/V3/Scenarios/ScenarioStubsTest.php` — its 55
`markTestIncomplete()` stubs are intentional placeholders, not bugs, and are out of scope here.

When done, tell me exactly which files you changed (paths + summary of each change) so I can
diff them against the failing assertions above and confirm each root cause was actually fixed
in application/seed/fixture code — not by editing what the tests check.

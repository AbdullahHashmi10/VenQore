# VenQore POS — IDE Fix Instructions (V2)

**Generated:** 2026-07-11
**Source run:** `Tester/VerificationCenter/runs/20260711_011424_8432` (git sha `db45000`)
**Current state:** `4 failed, 1 risky, 55 incomplete, 3 skipped, 929 passed` (992 executed) — **on MySQL `amd_pos_test`**

---

## ⚠️ GROUND RULES FOR THE IDE (read first)

1. **MySQL only. SQLite is banned** by project policy (`CLAUDE.md` → Database Policy). One task below is specifically to remove a SQLite violation. Do **not** introduce, configure, or "fall back to" SQLite anywhere — not in `.env`, not in `config/database.php`, not in CI.
2. **Do NOT edit test files to force them green.** Fix the underlying application code or seed data. The only permitted test edits are the two explicitly authorized below (Item 1 = a stale duplicate file; Item 5 = a genuine fixture data bug). If any other test needs an assertion changed, STOP and report why instead of changing it.
3. **After each fix, re-run only the affected suite on MySQL** (`amd_pos_test`), never SQLite. Do not mark an item done on a green checkmark alone — confirm the number it produces is correct.
4. **Regenerate Ziggy** (`php artisan ziggy:generate`) only if you touch routes. None of these fixes should touch routes.

---

## SUMMARY OF WHAT'S ACTUALLY FAILING

| # | Test | Real cause | Severity |
|---|------|-----------|----------|
| 1 | `[SMOKE-20]` no critical errors in log | **Stale duplicate test file** — fix already exists in `tests/` copy, but the copy that runs (`Tester/tests/`) was never updated | Low (false positive) |
| 2 | `GoldenCompanyTest::sale return restores inventory batch` | Golden Company seed: SAL-002's `sale_item_batches` not marked `is_reversed=1` | **High** |
| 3 | `ReportOutputTest::R-06` COGS reconciled | Same root cause as #2 — reversed COGS still counted | **High** |
| 4 | `ReportOutputTest::R-07` gross profit by product (−5.6M) | Same root cause as #2 | **High** |
| — | `SQLite in CI` | `.github/workflows/venqore-tests.yml` runs tests on SQLite, violating MySQL-only policy | **High (policy)** |
| — | 3 skipped + 1 risky | Same root cause as #2 (they skip when the reversal seed data is absent) | resolves with #2 |
| — | 55 incomplete | Deliberate unwritten stub tests — **not bugs, leave alone** (see bottom) | none |

**Items 2, 3, 4 and the 3 skips + 1 risky are ONE bug.** Fix the reversal-marking in the Golden Company seed path and all six clear together.

---

## ITEM 1 — `[SMOKE-20]` is failing on a stale duplicate file (authorized test fix)

**What's happening.** There are two copies of this test:
- `tests/Feature/Smoke/ProductionSmokeTest.php` — **already fixed** last session (scopes to `production.CRITICAL`)
- `Tester/tests/Feature/Smoke/ProductionSmokeTest.php` — **still has the old broken check** and this is the copy the runner actually executes.

The old check matches **any** `.CRITICAL` / `.EMERGENCY` line, including `testing.CRITICAL` entries that `AdversarialCorruptionTest` writes **on purpose** (it injects ledger corruption to prove `verify:ledger` catches it). Those are proof the guard works, not deployment failures — so the smoke test false-positives whenever the adversarial suite ran just before it.

**Fix.** In **`Tester/tests/Feature/Smoke/ProductionSmokeTest.php`**, around lines 320–325, change the three `str_contains` checks to scope to the production channel only, exactly matching the already-fixed `tests/` copy:

```php
// BEFORE
if (
    str_contains($line, '.CRITICAL') ||
    str_contains($line, '.EMERGENCY') ||
    str_contains($line, 'production.ERROR')
) {

// AFTER
if (
    str_contains($line, 'production.CRITICAL') ||
    str_contains($line, 'production.EMERGENCY') ||
    str_contains($line, 'production.ERROR')
) {
```

**Also decide on the duplication itself** (report, don't guess): there are 3+ live copies of this file (`tests/`, `Tester/tests/`, plus archived copies under `AMD_POS_Update_v4.2.7/` and `_VERIFICATION_BASELINE_2026-07-10/`). The archived ones don't run and can be ignored. But having both `tests/` and `Tester/tests/` diverge is the reason this bug reappeared. Confirm which tree is authoritative (the runner uses `Tester/tests/`) and consider whether `tests/` should even exist, or should be kept byte-identical.

**Verify:** `vendor/bin/pest Tester/tests/Feature/Smoke/ProductionSmokeTest.php --filter="SMOKE-20"` → passes.

---

## ITEM 2+3+4 — Sale-return reversal not reflected in COGS (ONE bug, highest priority)

This is the serious one for launch — it produces a **−Rs.5,679,370 gross profit** where **+Rs.423,430** is expected.

### The chain
1. `FinancialReportingService` computes COGS as `SUM(sale_item_batches.total_cogs) WHERE is_reversed = 0` (see `app/Services/FinancialReportingService.php` ~lines 266–282, 360–366, 420–476).
2. Golden Company seed posts SAL-002 (3 phones), then **TXN-SR-001 fully reverses it** via `App\Services\V3\SaleService::reverse()` (`database/seeders/GoldenCompanySeeder.php` line 614).
3. `GoldenCompanyTest::test_sale_return_restores_inventory_batch` asserts SAL-002's `sale_item_batches` rows end up `is_reversed = 1`. **They are still 0.**
4. Because they're still 0, the reversed sale's COGS is still counted → R-06 reconciliation fails and R-07 gross profit collapses to −5.6M.

### Where to look — the code path *looks* correct, so diagnose before editing
The intended-correct path exists:
- `App\Services\V3\SaleService::reverse()` (line ~452) loops sale items and calls `$this->fifo->restoreStock($saleItem->id)`.
- `App\Services\V3\FifoService::restoreStock()` (line 147) restores `inventory_batches.remaining_qty` **and** sets `sale_item_batches.is_reversed = 1` (line ~165) — correctly.

Since the code that marks `is_reversed` exists, the bug is that **it isn't executing for SAL-002's rows** at seed time. Diagnose in this order and fix the real cause:

1. **Tenant-context / scope mismatch.** `FifoService::restoreStock()` filters every query on `->where('tenant_id', $this->getTenantId())`. If the tenant bound during the seeder's reverse() call differs from the tenant that owns SAL-002's `sale_item_batches`, the `->where('sale_item_id', …)->where('is_reversed', 0)` SELECT returns **zero rows**, so nothing gets marked — silently. **Check that `$this->getTenantId()` inside the injected `V3\FifoService` matches SAL-002's `sale_item_batches.tenant_id` at the moment TXN-SR-001 runs.** This is the most likely culprit given the seeder switches `Carbon::setTestNow()` and posts across tenants.

2. **Wrong `sale_item_id` linkage.** Confirm `sale_item_batches.sale_item_id` for SAL-002 actually matches the `sale_items.id` the reverse loop iterates. If SAL-002 was seeded with pre-computed IDs but the batch rows point at a different `sale_item_id`, the restore SELECT misses them.

3. **`restoreStock` never reached.** Add a temporary assertion/log inside the seeder right after line 618 to dump `SELECT is_reversed, count(*) FROM sale_item_batches WHERE sale_item_id IN (SAL-002 items)`. If it's still 0 immediately after `reverse()` returns, step into `reverse()` → `restoreStock()` and confirm the loop body runs.

**Do not** "fix" this by making the test query `is_reversed IN (0,1)` or by patching the seeder to `UPDATE ... SET is_reversed=1` directly — that hides a real production bug where **a live sale return in a multi-tenant request would also fail to mark batches**, permanently inflating COGS on every reversed sale. Fix the tenant-context / linkage cause so the real `reverse()` path marks the rows.

### Verify (all three must pass together, on MySQL)
```
vendor/bin/pest Tester/tests/Feature/Golden/GoldenCompanyTest.php --filter="restores inventory batch"
vendor/bin/pest Tester/tests/Feature/Golden/ReportOutputTest.php --filter="R-06"
vendor/bin/pest Tester/tests/Feature/Golden/ReportOutputTest.php --filter="R-07"
```
After the fix, R-07 gross profit must equal **Rs.423,430.00** (not −5.6M). Re-derive this number, don't just accept green: `gross_profit = annual_revenue − SUM(sale_item_batches.total_cogs WHERE is_reversed=0)`.

### These clear automatically with the fix (confirm, don't touch)
- `FifoBatchVerificationTest` skip ("No sale_item_batches found for the reversed sale") + its risky no-assertion warning
- `FinancialCoreVerificationTest` skip ("No reversed entries found in Golden Company")
- `LaunchGateTest [I-05]` skip ("No TXN-* sales found") — this one specifically means the whole GoldenCompanySeeder may not have run in that context; if it's still skipped after the reversal fix, investigate seeder execution separately.

---

## ITEM 5 — Remove the SQLite policy violation in CI (this is where SQLite came from)

**You asked where SQLite came in — here it is.** It is **not** in the test run (that correctly uses MySQL `amd_pos_test`). It is in the **GitHub Actions CI workflow**, which was authored to run the suite on SQLite in-memory. Your own `FINAL_LAUNCH_READINESS_AUDIT.md` (Finding 11) already flagged this.

**File:** `.github/workflows/venqore-tests.yml`

**The offending lines (50–61):**
```yaml
- name: Copy .env.testing
  run: |
    cp .env.example .env.testing
    # Override for SQLite in-memory (same as local test runner)
    echo "APP_ENV=testing"              >> .env.testing
    echo "DB_CONNECTION=sqlite"         >> .env.testing
    echo "DB_DATABASE=:memory:"         >> .env.testing
    ...
```

**Why it's dangerous, not just cosmetic.** Several financial invariants in this system are enforced by **real MySQL triggers and CHECK constraints** (payment over-allocation trigger, negative-stock CHECK). SQLite doesn't run those, so CI on SQLite gives **false-green on exactly the tests meant to protect money correctness.**

**Fix.** Rewrite the workflow to run against a **MySQL 8 service container** and database `amd_pos_test`, matching local/policy. Replace the SQLite override block with MySQL env, and add a MySQL service:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: ''
          MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'
          MYSQL_DATABASE: amd_pos_test
        ports: ['3306:3306']
        options: >-
          --health-cmd="mysqladmin ping -h 127.0.0.1"
          --health-interval=10s --health-timeout=5s --health-retries=10
    steps:
      # ... checkout + PHP setup (you can drop pdo_sqlite/sqlite3 from the extensions list) ...
      - name: Copy .env.testing
        run: |
          cp .env.example .env.testing
          echo "APP_ENV=testing"                >> .env.testing
          echo "DB_CONNECTION=mysql"            >> .env.testing
          echo "DB_HOST=127.0.0.1"              >> .env.testing
          echo "DB_PORT=3306"                   >> .env.testing
          echo "DB_DATABASE=amd_pos_test"       >> .env.testing
          echo "DB_USERNAME=root"               >> .env.testing
          echo "DB_PASSWORD="                   >> .env.testing
          echo "CACHE_DRIVER=array"             >> .env.testing
          echo "QUEUE_CONNECTION=sync"          >> .env.testing
          echo "SESSION_DRIVER=array"           >> .env.testing
          echo "MAIL_MAILER=array"              >> .env.testing
      - name: Migrate test DB
        run: php artisan migrate --env=testing --force
      # ... then run pest exactly as before ...
```

Also update the stale comment `# Override for SQLite in-memory (same as local test runner)` — the local runner uses MySQL, so that comment was never accurate.

**Note for the IDE:** the many other `sqlite` references in the codebase (`DataImportService`, `MigrationController`, `InstallerController`, the `check_*.php` scripts) are **legitimate** — they read customers' Vyapar `.vyp`/`.vyb` backup files, which are SQLite databases. Those are an *import source format*, not the app's own database. **Leave all of those alone.** The only violation is the CI workflow's own test database.

---

## THE 55 "INCOMPLETE" — NOT BUGS, DO NOT TOUCH

All 55 come from three deliberate stub files:
- `Tester/tests/Feature/V3/Scenarios/ScenarioStubsTest.php` (the bulk)
- `Tester/tests/Feature/Production/LegacyPosCogsPinningTest.php`
- `Tester/tests/Feature/Production/WooWebhookJournalPinningTest.php`

They call `markTestIncomplete()` as placeholders for scenarios not yet written. They are **tracked technical debt, not failures.** Do not "implement" them as part of this pass and do not delete them. If you want them written, that's a separate, scoped decision — flag it, don't fold it into this fix.

---

## DEFINITION OF DONE

- `[SMOKE-20]` passes (Item 1).
- `GoldenCompanyTest` "restores inventory batch" passes, and R-06 + R-07 pass with **gross profit = Rs.423,430.00** (Items 2–4).
- The 3 skips + 1 risky in the Golden suite are gone (fall out of the reversal fix).
- CI workflow runs on **MySQL**, no `DB_CONNECTION=sqlite` anywhere (Item 5).
- 55 incomplete remain as-is (expected).
- Final full run on `amd_pos_test` (MySQL): **0 failed, 0 risky, 0 skipped**, 55 incomplete acceptable.
- No test assertions weakened except the two authorized edits. No routes touched (no Ziggy regen needed).

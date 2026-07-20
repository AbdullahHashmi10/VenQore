# VenQore POS — Fixes Completed (2026-07-13)

All 12 findings from the reports-suite audit and updater/demo-store investigation are now fixed in code. This document lists what changed per finding, and the exact commands you need to run on your machine to finish deployment (I have no access to your local MySQL/PHP from this sandbox, so nothing here has been executed against your live `venqore_pos` database).

---

## Reports suite (F1–F4)

### F1 — Cross-tenant leak in `pointInTimeInventoryDetails()`
**Fixed.** Added `tenant_id` filter to the `stock_movements` query at `app/Http/Controllers/ReportController.php`.

### F2 — Cross-tenant leak in `FinancialReportingService::getPointInTimeInventory()`
**Fixed.** Added `tenant_id` filters to both the `stock_movements` and `products` queries at `app/Services/FinancialReportingService.php`.

### F3 — Missing tenant filter on `saleAging()` journal queries
**Fixed** (defense-in-depth — wasn't a live leak, but now consistent with every other report in the file). `app/Http/Controllers/ReportController.php`.

### F4 — `graphAnalytics()` revenue KPI disagreed with its own chart
**Fixed.** The "Total Revenue" stat card now uses the same ledger-reconciled `FinancialReportingService::getProfitAndLoss()` figure the trend chart already used, computed over the correct date window for whichever range (`today`/`year`/`custom`/`7_days`/default) is selected. `app/Http/Controllers/ReportController.php`.

**Tests:** `Tester/tests/Feature/Reports/CrossTenantReportLeakTest.php` — three tests proving F1/F2/F3 no longer leak across tenants, calling the actual fixed methods directly (not a generic model-scope check, since the bugs were in raw `DB::table()` queries).

---

## Updater / demo store (F5–F12)

### F5 — Uncaught decrypt crash (root cause of the demo store breaking)
**Fixed.** `Tenant::getGoogleConnectedAttribute()` now catches `DecryptException` and returns `false` instead of throwing uncaught out of middleware. `app/Models/Tenant.php`. (Audited every other model for the same `encrypted`-cast pattern — `Tenant` was the only one affected.)

### F6 — Schema-drift SQL errors (the other root cause)
**Turned out to be a different, more precise bug than originally diagnosed** — not a missing/skipped migration, but two wrong column references in application code:
- `app/Console/Commands/SendPaymentReminders.php` was querying `sales.invoice_no`, a column that has never existed (the real column is `sales.reference_number`). This is what generated the exact `Unknown column 'invoice_no'` error in your logs, and it runs daily at 10:00 via the scheduler.
- `app/Http/Controllers/ReportController.php`'s `supplierInsightsDetails()` had the alias backwards (`invoices.reference_number as invoice_number`) — `invoices` has no `reference_number` column, only `invoice_number`.

Both fixed directly. **No migration was needed.** I also hardened `UpdaterController::handleMigrate()` regardless, since its migration-skip heuristic was a real structural risk even though it wasn't the actual cause here: it now always runs `artisan migrate` unconditionally (previously it could skip entirely based on an unreliable pending-count heuristic), and added a post-migrate schema validation gate (`assertCriticalSchema()`) that checks a small set of load-bearing columns exist before letting the update proceed — if they don't, the update halts loudly instead of reporting silent success.

### F7 — Demo tenant resolved via unguarded lookup
**Fixed.** Found **8 call sites** (not 5 as originally estimated) using `Tenant::where('is_demo', true)` to find "the" demo tenant, when multiple tenants can have `is_demo=true` simultaneously (the Golden Master plus every live visitor's temporary clone). All 8 now use `Tenant::where('is_golden_master', true)`:
- `app/Console/Commands/DemoRestore.php`
- `app/Console/Commands/DemoSnapshot.php`
- `app/Console/Commands/FullDemoDeployCommand.php`
- `app/Console/Commands/ResetDemoStore.php`
- `app/Http/Controllers/DemoController.php`
- `app/Http/Controllers/Admin/DemoStoreController.php` (2 sites)
- `app/Http/Controllers/UpdaterController.php`

Also added an application-level guard on `Tenant` (`app/Models/Tenant.php`) that rejects saving a second `is_golden_master=true` row — MySQL can't do a filtered unique index on a plain boolean, so this is enforced at save time instead.

**Test:** `Tester/tests/Feature/DemoStore/GoldenMasterResolutionTest.php` — seeds one Golden Master plus multiple visitor clones and confirms the fixed query always resolves to the master; also confirms the new save-guard rejects a second master.

### F8 — Update-lock timing mismatch (15 min vs 30 min)
**Fixed.** Both thresholds now read from one shared constant (`UpdaterController::LOCK_MAX_AGE_MINUTES = 30`), referenced by both `UpdaterController.php` and `PreventAccessDuringUpdate.php`. Also added periodic lock-file touching during `handleExtract()` (every 500 files) so a genuinely long-running extract never gets treated as abandoned mid-operation.

### F9 — Misleading maintenance-mode comment
**Fixed.** Comment in `UpdaterController::handleVersionBump()` now accurately describes the actual protection mechanism (custom lock file + middleware allow-list), not Laravel's native maintenance mode which was never actually engaged.

### F10 — No Ziggy regeneration or frontend build validation
**Fixed.** `handleCacheClear()` now calls `Artisan::call('ziggy:generate')`. `handleExtract()` now validates `public/build/manifest.json` exists post-extraction and fails loudly (before cache-clear/version-bump) if it's missing, rather than silently completing and leaving a white-screen app.

### F11 — `demo:cleanup` never scheduled
**Fixed.** Added to `routes/console.php`, running hourly.

### F12 — Chunked upload theoretical stale-chunk risk
**Fixed.** `handleUpload()` now records the expected `total_chunks` on first chunk and rejects a retry that reuses the same `upload_id` with a different chunk count, instead of silently mixing chunks from two different attempts.

---

## Verification done

- All 15 edited/new PHP files passed `php -l` syntax linting (via a subagent with its own PHP binary, since this sandbox has none and can't reach your local MySQL).
- All fixes were checked against directly-read, current source — not assumed from the earlier audit's findings — and one finding (F6) was substantially revised after checking real migration files, catching that the original "missing migration" diagnosis was wrong and the real bug was a wrong column name in a scheduled command.
- I could **not** run the tests myself (no PHP/MySQL access from this sandbox). Commands to run them are below.

---

## Commands to run on your machine

Run these in order. All are safe for your live `venqore_pos` database — none wipe or reset data.

### 1. Clear caches so the code changes take effect
```bash
php artisan optimize:clear
```

### 2. Regenerate Ziggy routes (routes/console.php changed)
```bash
php artisan ziggy:generate
```

### 3. Run the new regression tests
```bash
# Reports cross-tenant leak tests (F1/F2/F3)
php artisan test Tester/tests/Feature/Reports/CrossTenantReportLeakTest.php

# Demo tenant resolution tests (F7)
php artisan test Tester/tests/Feature/DemoStore/GoldenMasterResolutionTest.php
```
These run against `amd_pos_test`, not your production `venqore_pos` — per CLAUDE.md policy, no risk to real data.

### 4. Run the full test suite to check for regressions
```bash
php artisan test
```
or
```bash
./vendor/bin/phpunit
```

### 5. Verify your current demo tenant setup
Open `php artisan tinker` and run:
```php
\App\Models\Tenant::where('is_demo', true)->orderBy('id')->get(['id', 'slug', 'is_demo', 'is_golden_master', 'demo_expires_at']);
```
Confirm exactly one row has `is_golden_master = true`. If none do (e.g. your existing demo tenant was created before this flag existed), set it:
```php
\App\Models\Tenant::where('is_demo', true)->whereNull('demo_expires_at')->first()?->update(['is_golden_master' => true]);
```
Adjust the `where` clause if that doesn't correctly identify your actual demo store — the Golden Master is the one that should never expire (`demo_expires_at` is `null`), as opposed to visitor clones which have a 2-hour expiry.

### 6. Confirm the demo store now loads cleanly
Visit your demo store's dashboard and a few other pages. If you still see errors, check the log:
```bash
tail -100 storage/logs/laravel.log
```

### 7. Schedule verification
Confirm the new `demo:cleanup` schedule registered correctly:
```bash
php artisan schedule:list
```
You should see `demo:cleanup` running hourly alongside the existing `demo:reset` (daily 04:00) and `demo:full-deploy` (weekly).

---

## Not done / needs your input

- **F4's product decision** was made per your earlier answer (align to ledger figure) — already implemented, no further input needed.
- The stray `VenQore_Implementation_Plan.docx` from the earlier version of this work is still sitting in your project folder — I can't delete files there without asking first. Let me know if you'd like it removed now that markdown is the default going forward.

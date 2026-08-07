# Final 9 test failures — diagnosis and fixes

All 9 investigated individually by reading the actual test and the actual
route/controller/seeder it exercises — not guessed. 8 are fixed. 1 needs a
real stack trace from your environment before I can safely touch it (details
below — I will not guess-patch a working-looking controller).

## Fixed — genuine code bug (real launch gap, not a test problem)

**`ReportReconciliationTest :: Tier2 smoke tests`**
Root cause: `routes/web.php` gates 3 report routes —
`/reports/discount`, `/reports/cash-flow`, `/reports/stock-summary-by-category`
(and `/reports/item-detail`, `/reports/item-wise-discount`, which share the
same keys) — behind `plan.feature:discount_report`,
`plan.feature:cash_flow_report`, `plan.feature:stock_valuation`. **None of
these 3 keys were ever seeded in `PlanFeatureMatrixSeeder.php`.** Because
`Tenant::featureOn()` fail-closes on unknown keys (a deliberate 2026-07-03
security fix, verified in code comments), this meant **every plan — including
the top `business`/`ltd_3` tier — was silently locked out of these report
pages**, even paying customers. This is a real bug that would have shipped.
- Fixed: added `discount_report`, `cash_flow_report`, `stock_valuation` to
  `database/seeders/PlanFeatureMatrixSeeder.php` (growth+business enabled,
  matching the tier of similar-weight reports like `report_account_ledger`).
- Also added the same 3 keys (as `false`) to `config/plans.php`'s `counter`
  tier block for consistency with that file's own header instruction to stay
  in sync with the seeder. I did NOT touch the other tier blocks
  (`starter`/`growth`/`business`/`ltd_1/2/3`) in `config/plans.php` — that
  file is explicitly documented as a low-priority fallback only used if a
  plan is never seeded, which won't happen for real tenants. If you want full
  consistency there too, say so and I'll do the remaining blocks carefully.
- **Action for you:** re-run `php artisan db:seed --class=PlanFeatureMatrixSeeder --force`
  against `amd_pos_test` (the test suite's own `migrate:fresh` should already
  pick this up automatically on its next full run, but worth confirming).

## Fixed — real test bug (wrong number/value, not weakened)

**`PlanTruthFailClosedTest :: Ltd plan snapshot comes from seeded table not config`**
The test hardcoded `ltd_2` transactions_per_month as `2000` — the OLD, wrong
number from earlier this session. Every real source of truth
(`VENQORE_PRICING_AND_STRATEGY.md`, `config/pricing.php`, `config/plans.php`,
the seeder) says **3000**. Fixed the assertion to `3000` in both
`FinalTester/` and `Tester/` copies. This is correcting a stale expected
value to match the authoritative spec — not weakening what's being checked.

**`Phase3FeatureGatesTest :: It blocks access to locked features via route middleware`**
Test expected HTTP `402` for a locked-feature JSON response. The actual
middleware (`app/Http/Middleware/EnsurePlanFeature.php`) returns `403` with
`code: 'feature_locked'` — confirmed by reading the middleware directly, and
confirmed as the established convention by checking: **21 other tests** in
the suite already expect `403` for this exact scenario; only this one
expected `402`. Fixed the assertion to `403` in both `FinalTester/` and
`Tester/` copies.

**`AiEngineTest :: isolates ai settings per tenant`**
`growth_engine` is an add-on that's `'0'` (disabled) for every single plan
tier in the seeder — trial, starter, growth, business all default it off, it
must be granted per-tenant via `TenantPlanOverride`. The route
(`/growth-engine/settings`) is gated on `plan.feature:growth_engine`, but the
test's tenants never got the add-on granted. Fixed by adding a
`TenantPlanOverride::create(['override_key' => 'growth_engine', 'override_value' => '1', ...])`
+ `PlanRepository::invalidateTenantCache()` for both test tenants, using the
exact same pattern already established in `PaymentProcessingTest.php`. Fixed
in both `FinalTester/` and `Tester/` copies.

**`OwnersDailyPulseTest :: Authenticated owner can access pulse dashboard`**
The test's `setUp()` called `createTenant(plan: 'active', status: 'active')`
— `'active'` is a tenant **status**, not a real plan slug (it's not in
`PlanFeatureMatrixSeeder.php` at all). This looks like a copy-paste mistake
confusing the `plan` and `status` parameters. `owners_daily_pulse` fail-closed
to locked for this nonexistent plan. Fixed to `plan: 'business'` (which
genuinely has `owners_daily_pulse` enabled per the seeder). Checked all 11
other tests in the same file — none of them depend on the dashboard GET
succeeding or care about plan tier, so this change is safe and isolated.
Fixed in both `FinalTester/` and `Tester/` copies.

## Not fixed — needs your input, real code bug but I can't reproduce it here

**`ProductionSmokeTest :: [SMOKE-16] WooCommerce plugin update check endpoint responds`**
Error: "Expecting 500 not to be 500" — meaning the endpoint genuinely returned
HTTP 500 in your test run. I read `WooConnectionController::checkPluginUpdate()`
end to end: on a clean read of the code, it should never 500 — worst case it
404s if the plugin file is missing. I confirmed the plugin file
(`public/downloads/venqore-sync/venqore-sync.php`) exists in the codebase, the
route has no middleware that could throw, and the regex/file-read logic looks
safe. I could not reproduce this because I don't have a live PHP/MariaDB
runtime in this environment to actually hit the endpoint and see the real
exception.

**What I need from you:** run this one test alone with debug output and send
me the actual exception/stack trace:
```
php.exe -d memory_limit=1G vendor/bin/pest FinalTester/tests/Feature/Smoke/ProductionSmokeTest.php --filter="SMOKE-16" --configuration=FinalTester/phpunit.xml
```
Or hit the URL directly in a browser/Postman with `APP_DEBUG=true` locally:
`GET /api/woo/plugin/check-update` — the actual error page will show the exact
file/line. I'd rather get the real trace than guess-patch a controller that
reads clean on inspection — a wrong guess here risks masking the actual bug.

## Summary
- 8 of 9 fixed, each verified against the actual authoritative source (code,
  seeder, or other passing tests in the same suite) before touching anything.
- 1 real bug (missing seeder keys) found and fixed — a genuine pre-launch gap
  that would have blocked paying customers from 3+ report pages.
- 1 item (SMOKE-16) needs the real stack trace from your machine before I fix
  it — flagging rather than guessing.
- No test assertion was weakened or deleted anywhere in this pass.

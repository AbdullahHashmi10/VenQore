# Final 4 failures — diagnosis and fixes

3 of 4 fixed, each traced to root cause by reading the real code, not
guessed. 1 (SMOKE-16) still needs your stack trace — see bottom.

## Fixed — real code bug, found via this failing test (not a test problem)

**`SmartCaptureSafetyTest :: a party chosen before scanning is preselected and sent to the model`**

This was the most interesting one — the 422 was a *symptom*, not the real
bug. Here's the actual chain:

1. `SmartCaptureController::extract()` genuinely builds a `known_party` hint
   (`['name' => ..., 'type' => ...]`) when the user picks a party before
   scanning, and passes it into `AiExtractionService::extract()`'s `$context`
   array — exactly as the code comment says it should.
2. But `AiExtractionService::buildPrompt()` — the function that actually
   turns `$context` into the text sent to the AI — **never read
   `known_party` at all.** It uses `existing_products`, `parties`,
   `expense_categories`, `learned_aliases`, but silently dropped
   `known_party`. Confirmed via a direct search: zero references to
   `known_party`/`knownParty` anywhere in the extraction service before this
   fix.
3. So the outgoing request to Gemini never mentioned "Punjab Rice Mills" at
   all — the test's `Http::fake()` callback asserts
   `expect($request->body())->toContain('Punjab Rice Mills')`, which failed.
4. That assertion failure is a `\Throwable`, and it happened inside an HTTP
   client call that's wrapped in the service's `catch (\Throwable $e)`
   block — so instead of surfacing as a Pest assertion failure, it got
   silently caught and turned into the generic 422 error response you saw.
   The real error was hidden by the catch-all.

**This is a genuine, previously-shipped bug**: the "party chosen before
scanning" safety/accuracy feature has never actually worked for any AI
provider — the hint was built but never sent. Fixed by adding a
`[PARTY CHOSEN BEFORE SCANNING]` block to `buildPrompt()` in
`app/Services/SmartCapture/AiExtractionService.php`, following the exact
same pattern as the other context keys (`parties`, `expense_categories`,
etc.) right before the function's `return $prompt;`.

*Side note, not urgent:* the fact that a Pest assertion failure inside an
`Http::fake()` callback gets silently swallowed by the service's broad
`catch (\Throwable $e)` is a testing-visibility gap worth knowing about — if
a similar test ever "passes" with a 200 but the fake's internal assertion
was actually violated, you might not find out. Not fixing this now (out of
scope), just flagging it.

## Fixed — same seeder key-mismatch bug class as before

**`SerializationDragnetTest :: [DRAGNET] generic reports return structurally valid Inertia prop bags`**

`/reports/stock-aging` is gated on `plan.feature:stock_aging`, but the
seeder only had `report_stock_aging` (a *different*, separate key used only
by the SuperAdmin plan-editor UI, confirmed via grep — not a duplicate of
the route key). Same root-cause class as the `discount_report`/
`cash_flow_report`/`stock_valuation` gap fixed in the previous pass. Added
`stock_aging` to `database/seeders/PlanFeatureMatrixSeeder.php` (growth+
business enabled, matching the tier of the similar `report_account_ledger`/
`report_stock_aging` keys next to it), with a comment explaining the two
keys are intentionally separate so nobody merges them by mistake later.

**Action for you:** same as before — re-run
`php artisan db:seed --class=PlanFeatureMatrixSeeder --force` against
`amd_pos_test`, or let the suite's own `migrate:fresh` pick it up on the next
full run.

## Fixed — stale column name in test (real code already correct)

**`RecentFixesAuditTest :: Provision tenant job stamps correct ai quotas`**

Test asserted `$tenant->ai_scans_limit`, which returns `null` because that
column was renamed to `ai_pages_limit` back on 2026-08-04 (confirmed via the
rename migration). `ProvisionTenantJob` genuinely writes to `ai_pages_limit`
— confirmed by reading the job directly. Fixed the assertion to check
`ai_pages_limit` instead, in both `FinalTester/` and `Tester/` copies. Not a
weakened assertion — same check, correct column name.

## Not fixed — still needs your stack trace

**`ProductionSmokeTest :: [SMOKE-16] WooCommerce plugin update check endpoint responds`**

Same as last time — the controller (`WooConnectionController::checkPluginUpdate()`)
reads clean on inspection and the plugin file exists in the repo, so I can't
find the 500 by reading code alone. I don't have a live PHP/MariaDB runtime
here to reproduce it. Please run:
```
php.exe -d memory_limit=1G vendor/bin/pest FinalTester/tests/Feature/Smoke/ProductionSmokeTest.php --filter="SMOKE-16" --configuration=FinalTester/phpunit.xml
```
and send me the actual exception message + stack trace (with `APP_DEBUG=true`
if it's not already on for the test env) — I'll fix it properly once I can
see what's actually throwing, rather than guessing at a controller that looks
correct.

## Summary
- 3 of 4 fixed and verified against real code before touching anything.
- One of the three was a genuine, previously-unknown functional bug (AI
  provider never received the pre-chosen party hint) — good that this test
  suite caught it.
- No test assertion weakened or deleted.
- 1 item (SMOKE-16) still blocked on getting the real error output from your
  machine.

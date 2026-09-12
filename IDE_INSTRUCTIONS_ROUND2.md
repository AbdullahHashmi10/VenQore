# Round 2 — fixing the 28 real failures

The same rules of engagement from `IDE_INSTRUCTIONS_PRELAUNCH.md` apply. In particular:
**do not edit a test to make it pass** unless a step below explicitly tells you to,
and paste raw output.

The 28 failures come from 8 root causes, not 28 problems. Fix them in this order.

---

## Fix 1 — Store creation is broken (12 failures, and it is broken in production too)

`app/Services/StoreProvisioner.php` line 175, added by the R19 retry-idempotency work:

```php
->whereHas('users', fn($q) => $q->where('users.id', $user->id)->where('role', 'owner'))
```

`users.id` is qualified; `role` is not. Both `users` and `tenant_users` carry a `role`
column, so MariaDB raises `1052 Column 'role' in where clause is ambiguous` and every
call to `StoreProvisioner::create()` throws. **This is not a test-only problem — POST
/new-store returns 500 for real users. Signup is dead on this branch.**

Change it to:

```php
->whereHas('users', fn($q) => $q->where('users.id', $user->id)->where('tenant_users.role', 'owner'))
```

This alone should clear 12 failures:
`DataPreservationInvariantTest` (×4), `Module02\StoreCreationAndProvisioningTest` (×5),
`StoreUniqueNameTest`, `AppSumo\CodeStackingTest`, `Module\PresetSmokeTest`.

After the edit, run only these to confirm, and paste raw output:

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage tests/tests/Feature/Module02 tests/tests/Feature/Module/DataPreservationInvariantTest.php tests/tests/Feature/StoreUniqueNameTest.php
```

---

## Fix 2 — Solo plan was given `multi_branch` (8 failures) — DECISION NEEDED, do not guess

`database/migrations/2026_08_16_000300_include_every_module_on_every_plan.php` has
`multi_branch` and `owners_daily_pulse` in its `NOW_FREE` array, and `up()` writes `'1'`
for **every** plan. But `config/plans.php` still declares:

```php
'multi_branch' => false, // Fence 1
'locations'    => 1,
'location_limit' => 1,
```

So a Solo tenant is now allowed multi-branch while being limited to one location. The
database wins over the config file, which is why `PlanGate::check('multi_branch', $solo)`
returns true and eight tests fail.

The Solo-parity change was meant to stop selling *modules* back to customers. It
overshot into *capacity fences*, which are a different thing: `multi_branch` is what
separates Solo from paid tiers.

**Do not change the tests.** Report this section back to Abdullah and wait for his
decision between:

- **(A) Recommended — multi_branch and owners_daily_pulse are NOT free.** Remove both
  keys from the `NOW_FREE` array, and add a corrective migration that sets them back to
  `'0'` for `solo` and `starter` (and `multi_branch` to `'0'` for `ltd_1`). Tests then
  pass unchanged.
- **(B) They are free on every plan.** Then `config/plans.php`, `PlanFeatureMatrixSeeder`,
  `location_limit`, and the pricing page all have to change to match, and the eight
  tests must be rewritten deliberately with a comment saying why.

State which one he picks in your reply before implementing it.

---

## Fix 3 — Regenerate Ziggy (2 failures, plus real runtime breakage)

The new named API routes were added without regenerating the frontend route table, so
`route('api.pos.search')` and 22 others throw "route is not in the route list" in the
browser. There is also one malformed stale entry named literally `store.`

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" artisan ziggy:generate
npm run build
```

Then find and fix the malformed route: something inside the `store.` group is registered
with an empty name suffix (`->name('')` or a group with no name). Locate it and report
the file and line before changing it.

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" artisan route:list --json | Select-String '"name":"store\."'
```

---

## Fix 4 — Stale backup-route tests (2 failures) — EDIT THE TESTS, deliberately

`RouteParameterRegressionTest` and `ZiggyRouteIntegrityTest` both require
`store.backups.delete` to exist. That route was **deliberately removed** during the
BL-01 security remediation, because it exposed an unscoped file-delete by filename.
The route is correct to be gone; the tests are stale.

Remove `store.backups.delete` (and any other deleted backup route these two tests
require) from their expectation lists, and add this comment above each removal:

```php
// store.backups.delete was removed in the BL-01 remediation (unscoped file delete by
// filename). Do not restore it — the encrypted, tenant-scoped export replaced it.
```

This is the one place you are authorised to change a test. Show the diff.

---

## Fix 5 — Permission ratchet breached, 119 vs ceiling 118 (1 failure)

A write route added this round has no `permission:` middleware. **Do not raise the
ceiling** — the ratchet may only ever decrease.

Identify the new one (the likely candidate is `api.sync.orders.batch`, POST, which has
`auth:sanctum` + `store.member` + throttle but no `permission:`):

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage tests/tests/Feature/Guardrails/PermissionBypassGuardTest.php
```

Report the full list of 119 the test prints, say which one is new versus the recorded
118, add the appropriate `permission:` middleware to it, and re-run. Paste both lists.

---

## Fix 6 — Unknown module key: fail open or fail closed? (1 failure) — DECISION NEEDED

`Tests\Feature\Module\EnsureModuleTest > an unknown module key is never denied` asserts:

```php
$this->assertTrue(ModuleService::enabled($tenant, 'teleportation'));
```

That was the original deliberate design — the route gate must not block a route whose
owner it does not recognise. The R10 remediation changed `enabled()` to return `false`
for unregistered keys, so the code and the test now contradict each other.

Evidence for fail-closed: `SendPaymentReminders` was guarding on the key `'invoices'`,
which is not a real module, so the guard silently passed and the command ran for
tenants that had it switched off. Fail-open turns every typo into a silent hole.

Evidence for fail-open: a typo in `config/modules.php` would lock customers out of a
working route rather than merely leaking one.

**Recommended: keep fail-closed, and update the test deliberately** — rename it to
`an_unknown_module_key_is_denied`, invert the two assertions, and add a comment
pointing at the `SendPaymentReminders` bug as the reason. `ModuleRegistryIntegrityTest`
already prevents unknown keys reaching the gate from config, so the lock-out risk is
covered elsewhere.

Do not implement this until Abdullah confirms. Report it and wait.

---

## Fix 7 — Stale system manifest (1 failure)

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" artisan manifest:generate
```

---

## Fix 8 — `/api/dashboards` returns 500 (1 failure)

`Tests\Unit\Reckoner\DashboardApiTest > get dashboards index returns list or auto
creates default` gets a 500. This is most likely a consequence of the R08
`DashboardController` change (card eager-loading) or the `ApiTenantResolver` change.

**Investigate, do not patch blind.** Run it and paste the actual exception:

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage tests/tests/Unit/Reckoner/DashboardApiTest.php
Get-Content storage/logs/laravel.log -Tail 60
```

Report the stack trace before proposing a fix.

---

## Also — 8 files are still uncommitted

The Step 2 commit used `git add -A app config routes database resources`, which left
these out:

- 6 files under `docs/prelaunch-audit-2026-09-12/` (probe output, CSVs, inventory.json)
- `tests/tests/Feature/Billing/RefundWebhookTest.php`
- `tests/tests/Feature/Billing/SubscriptionStatusMappingTest.php`

Those two test files were edited in an earlier session to make failing billing tests
pass. Before committing them, show the diff for both so the assertion changes can be
reviewed:

```bash
git diff -- tests/tests/Feature/Billing/RefundWebhookTest.php tests/tests/Feature/Billing/SubscriptionStatusMappingTest.php
```

---

## Finally — re-run and report

After fixes 1, 3, 4, 5, 7 (and 2, 6, 8 once decisions are made):

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-round2.xml
```

Report the summary line and every remaining failure, raw. One more thing to pin down:
the first run had 28 failures / 2663 passed and the second had 27 / 2664, and nothing
in the `ModuleService` change obviously accounts for the difference. Identify which
test flipped. An unexplained flip between two runs of the same code usually means a
flaky test, and a flaky test in a launch suite is its own problem.

No readiness score, no percentage, no verdict.

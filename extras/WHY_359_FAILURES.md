# Why the full run showed 359 failures (up from 80) — diagnosis

## Short answer
**This is not new damage from the fixes.** It's a full-suite database migration
race that corrupted the schema partway through the one giant run, and every
test after that point failed with "table not found" as a side effect. The
individual file runs the IDE did right before the full run (`PosTerminalTest`,
`FinancialEngineTest`, `ZiggyRouteIntegrityTest`) all passed 100% clean — which
only happens if the underlying fixes are actually correct. It's the *one big
process* run that broke, not the code.

## The mechanism, confirmed from your own test harness code

`FinalTester/tests/Feature/VenQoreTestCase.php:63-70`:

```php
protected function refreshTestDatabase()
{
    if (! RefreshDatabaseState::$migrated) {
        $this->artisan('migrate:fresh', $this->migrateFreshUsing());
        $this->app[Kernel::class]->setArtisan(null);
        RefreshDatabaseState::$migrated = true;   // <-- set unconditionally
    }
    ...
}
```

`RefreshDatabaseState::$migrated` is a **static flag, shared across the whole
PHP process**. When you run one test file at a time (which is what almost
every command in this session did), each file is its own process, so
`migrate:fresh` runs fresh and clean every time — that's why every
individually-run file passed.

When you run the **whole suite in one process**
(`vendor/bin/pest FinalTester/tests/Feature --configuration=FinalTester/phpunit.xml`),
`migrate:fresh` only runs ONCE, on the very first test. The flag flips to
`true` right after `$this->artisan('migrate:fresh', ...)` is called —
**regardless of whether the migration actually succeeded.** `$this->artisan()`
does not throw on failure here; nothing checks its exit code.

## What actually broke it

The same full-suite log already contains direct proof the database was under
real write contention during this run:

```
Illuminate\Database\DeadlockException: SQLSTATE[40001]: Serialization failure:
1213 Deadlock found when trying to get lock; try restarting transaction
(SQL: insert into `expense_categories` ...)
```

A `migrate:fresh` running under the same kind of load (or interrupted by a
timeout, or hitting the `-d memory_limit=1G` ceiling that was added for this
specific run) can fail partway through — leaving some tables created and
others (like `plans`) missing — while `RefreshDatabaseState::$migrated` still
gets set to `true` because the call itself didn't throw. Every test after that
point in the same process inherits the half-built schema and fails with
`Table 'amd_pos_test.plans' doesn't exist`, which is exactly the error in 73
of the 100 new failures shown in your log.

## Why this isn't "the fixes broke it"

- The three files individually re-tested right before the full run
  (`PosTerminalTest` 12/12, `FinancialEngineTest` 22/22, `ZiggyRouteIntegrityTest`
  7/7) all passed cleanly, each in its own clean process with its own working
  `migrate:fresh`.
- The failure signature (`Base table or view not found`) is a schema/connection
  problem, not an assertion problem — it fires before any of the actual test
  logic (or any of today's edits) even runs.
- The remaining ~27 failures that are NOT "table not found" (assertion
  failures, 402s, 422s, the deadlock-driven ones, the 3 `PartnersPageTest`
  500s) are a separate, smaller list and need their own look — see below.

## What to fix — instructions for the IDE

1. **Make `migrate:fresh` failure fatal instead of silent**, in
   `VenQoreTestCase.php`:
   ```php
   protected function refreshTestDatabase()
   {
       if (! RefreshDatabaseState::$migrated) {
           $exitCode = $this->artisan('migrate:fresh', $this->migrateFreshUsing())->run();
           if ($exitCode !== 0) {
               throw new \RuntimeException(
                   "migrate:fresh failed with exit code {$exitCode} — refusing to mark the test DB as migrated. Re-run the suite; if this recurs, check MariaDB for lock contention or run 'php artisan migrate:fresh' manually against amd_pos_test to see the real error."
               );
           }
           $this->app[Kernel::class]->setArtisan(null);
           RefreshDatabaseState::$migrated = true;
       }
       ...
   }
   ```
   This turns a silent half-migration into a loud, immediate, first-test
   failure instead of 73 confusing downstream failures — much easier to
   diagnose next time this happens.

2. **Just re-run the full suite once, cleanly, and see what's left.** Given
   the root cause is almost certainly a one-off migration race (not a code
   regression), the expected outcome is the 73 "table not found" failures
   disappearing entirely on a clean re-run. Command:
   ```
   php.exe -d memory_limit=1G vendor/bin/pest FinalTester/tests/Feature --configuration=FinalTester/phpunit.xml
   ```
   Do this only after nothing else is hitting `amd_pos_test` concurrently
   (close any other terminal/process that might be running tests or queries
   against it at the same time — concurrent access is the most likely trigger
   for the deadlock seen in the log).

3. **After the re-run, only the two other buckets matter** — don't touch
   test assertions to force these green, diagnose each:
   - **11 "PRODUCT - assertion failure"** entries (e.g.
     `NumberLineageCompletenessTest`, `PlanTruthFailClosedTest`,
     `DocumentConversionTest`, `FrontendSyntaxIntegrityTest`,
     `ReportOutputTest::R15`, `CascadeDeleteAuditTest` x2, `GatingTest`,
     `PartnersPageTest`) — these are real functional gaps or genuinely stale
     guardrail baselines and need individual diagnosis the same way Category
     8 was described in the earlier report (read exactly what each one says
     is missing/wrong, confirm it's a legitimate new item, then fix the
     underlying code or the baseline file — never the assertion).
   - **6 "PRODUCT - HTTP 4xx"** and **4 "PRODUCT - unexpected HTTP status"** —
     mix of 402s (plan gating on a feature the test tenant doesn't have —
     same fix pattern as before: seed the right plan tier in that test's
     `setUp()`) and 422s (validation failures — read the actual response body
     to see what's failing validation before assuming anything).
   - **3 "PRODUCT - HTTP 500"** on `PartnersPageTest` — a real 500 is always
     worth checking first: run that one test file alone with
     `APP_DEBUG=true` and read the actual exception/stack trace before
     deciding whether it's code or environment.

4. **Do not re-run everything file-by-file again as a workaround.** That
   masks this class of bug rather than fixing it (each individual process
   gets a clean migration, so you'd never see this deadlock/race again even
   though it's still a real risk on every full-suite run, including the ones
   that matter most — CI, pre-launch). Fix `refreshTestDatabase()` per step 1
   so this fails loud and immediately next time instead of silently
   cascading into 350+ confusing failures.

## Bottom line
Nothing in the actual application code needs reverting. This was the test
database's schema getting half-built during one large concurrent run, silently
accepted as "migrated" by the harness, and then every subsequent test failing
on missing tables as a result. Fix the harness to fail loud (step 1), re-run
clean (step 2), then triage the much smaller real list (step 3).

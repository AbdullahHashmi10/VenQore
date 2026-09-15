# Troubleshooting

Symptoms first. Find yours, apply the fix.

---

## The run refuses to start

### `PREFLIGHT FAILED`

Working as designed. Preflight stops runs that cannot produce a trustworthy
result. Read the numbered problems — each carries its own fix. The common ones:

| Message | Fix |
|---|---|
| Cannot connect to MySQL | Start MySQL (XAMPP / Local / service) |
| Database `amd_pos_test` does not exist | `mysql -u root -e "CREATE DATABASE amd_pos_test;"` |
| Missing core tables | `php artisan migrate:fresh --env=testing` |
| Migration drift: N files, only M run | `php artisan migrate --env=testing` |
| Composer dependencies not installed | `composer install` |

Override with `RUN_ALL_TESTS.bat /force` — but understand that you are choosing
to read results the system has told you are unreliable.

### `[ERROR] Could not find php.exe`

Either add PHP to your PATH, or edit `FinalTester\Scripts\run.bat` and set
`PHP_BIN` directly. It already probes PATH, the Local by Flywheel bundled PHP,
and three XAMPP locations.

### `FATAL: DB_DATABASE is set to 'venqore_pos'`

The guard did its job. The suite runs `migrate:fresh` and would have destroyed
production data. Something in your environment is overriding the config — check
for a stray `.env`, a shell `export`, or a CI variable.

### `FATAL: DB_CONNECTION is 'sqlite'`

Project policy is MySQL only, enforced at bootstrap. The suite asserts on MySQL
trigger, decimal and isolation semantics; SQLite results would be confidently
wrong. Point it at MySQL.

---

## The numbers look wrong

### Executed is lower than expected

This is the signal the whole system exists to give you. Causes, in order of
likelihood:

1. **A fatal error killed the process.** Scroll up, or read
   `FinalTester\logs\last-run.log`.
2. **A test class failed to load** — namespace/path mismatch. PHPUnit counts it
   in discovery and then cannot instantiate it.
3. **A filter or `stopOnFailure` was left on.** Check any `%EXTRA%` you passed.
4. **The run was interrupted.**

`Scripts/report.php` prints this list whenever it detects a shortfall.

### Expected count changed unexpectedly

```bash
php FinalTester/Scripts/expected.php
```

then diff `reports/expected.json`. It contains per-class counts, so a diff shows
exactly which class gained or lost tests.

### Dashboard and BAT file disagree

The BAT file is right. It reports from `reports/junit.xml`, written by PHPUnit
after every result is reconciled. The dashboard's live numbers come from the
event stream, which can drop events if the process is killed — which is why the
dashboard re-reads JUnit on close and logs any correction.

### Percentage shows `—`

Discovery failed, so there is no denominator. The UI refuses to invent one. Run
`php FinalTester/Scripts/expected.php` directly to see the underlying error.

---

## Mass failures

### Hundreds of `Call to undefined method ...::createTenant()`

or `Target class [config] does not exist`, or class names that look like
`FinalTester\tests\Feature\Billing\GeoPricingTest` instead of
`Tests\Feature\Billing\GeoPricingTest`.

**Cause: the `--test-directory` flag is missing.**

Pest does *not* derive its test directory from `--configuration`. `bin/pest`
reads it as `getParameterOption('--test-directory', 'tests')` and
`Bootstrappers\BootFiles` then loads `<root>/<test-directory>/Pest.php`.

Without the flag, Pest loads the **legacy `tests/Pest.php`**, whose
`pest()->extend(VenQoreTestCase::class)->in(...)` calls register paths under
`tests/` and `Tester/tests/` — never `FinalTester/tests/`. Every Pest
closure-style file then runs with no base class and no booted Laravel app.

The path-derived class name is the tell: when Pest has no namespace binding for
a file it invents one from the file path.

Fix — every invocation must carry it:

```
--test-directory=FinalTester/tests
```

`Scripts/run.bat`, `Scripts/expected.php` and `dashboard/server.js` all pass it.
If you run Pest by hand against FinalTester, you must too.

This caused 352 of 438 failures in the 2026-08-02 07:14 run.

### The dashboard finished, then all the numbers collapsed

You saw something like 1169 executed during the run, then 73/1358 and
"1285 tests never executed" the instant it finished.

**Cause: JUnit was being trusted as the source of truth, and it is not
reliable for this project.**

When a test errors during *construction*, PHPUnit never writes a `<testcase>`
element for it — it only increments the parent testsuite's `errors` attribute.
In that run, 192 of 206 leaf suites carried `tests="0"` while reporting 355
errors between them, and the root element said
`tests="73" errors="355" failures="83" time="36.67"` against a real duration of
305 seconds.

The runner now takes its final numbers from **Pest's own summary line**:

```
Tests:  438 failed, 1 risky, 55 incomplete, 6 skipped, 858 passed (4535 assertions)
```

which accounts for every test. JUnit is kept as a cross-check and can no longer
reduce a count on its own.

### Hundreds of `Table 'amd_pos_test.X' doesn't exist`

The test database is not migrated. This produced 133 bogus errors in the
2026-08-02 run and made the product look broken when it was not.

```bash
php artisan migrate:fresh --env=testing
```

Preflight now catches this before you waste an evening on it.

### Hundreds of `Unknown column 'X' in 'field list'`

Same family: migrations partially applied.

```bash
php artisan migrate --env=testing
```

### Many `Expected response status code [200] but received 500`

Almost always downstream of the two above — fix the database first and re-run
before reading these as product defects. If they persist on a clean database,
they are real: check `storage/logs/laravel.log`.

### Many `received 409`

409 is the plan/limit conflict response. Usually the Golden seed did not
complete, so the tenant has no valid plan. Re-seed:

```bash
php artisan db:seed --class=GoldenAuditSeeder --env=testing
```

---

## Route sweep failures

### `Routes exist in Laravel but are missing from ziggy.js`

The classic. You added a route and did not regenerate:

```bash
php artisan ziggy:generate
npm run build
```

### `ziggy.js contains route names that no longer exist`

A route was renamed or deleted; `ziggy.js` is stale. Same fix.

### `Controllers render Inertia pages that do not exist`

The named `.jsx` is missing from `resources/js/Pages/`. Either create it or fix
the `Inertia::render()` string. This is a guaranteed white screen in production.

### `New top-level route namespaces appeared with no declared sweep story`

Working as designed — a whole area of the app shipped with no coverage
decision. Add it to `KNOWN_NAMESPACES` in `FullRouteSweepTest` with a truthful
note about how it is covered, and make that note true.

---

## Dashboard

### Blank page or "disconnected"

The Node server is not running. Use `RUN_DASHBOARD.bat`, and keep the console
window open — closing it stops the server.

### `Missing dependency "ws"`

```bash
cd FinalTester\dashboard
npm install
```

`RUN_DASHBOARD.bat` does this automatically on first run.

### Port 7830 already in use

The launcher kills stale listeners automatically. If it persists:

```bat
netstat -aon | find ":7830"
taskkill /f /pid <pid>
```

7830 was chosen to avoid the three legacy dashboards on 7821, 7822 and 7823, so
they can coexist during migration.

### `Could not start PHP`

Set `phpBin` to the full `php.exe` path in
`FinalTester\config\finaltester.json`.

---

## Suite behaviour

### A test passes alone but fails in the full run

State leaking between tests. Usual suspects: a static cache, a container
singleton, a `putenv()` that is never restored, or data committed outside the
per-test transaction. `Feature/Core/SuiteIntegrityTest.php` exists to catch some
of this.

### A test is slow

The `Fast` lane (`RUN_FAST.bat`) skips everything that needs a database. If a
test in `Feature/Tools/` is slow, it is probably hitting the DB when it does not
need to.

### Every count is inflated

You ran `config/phpunit.categories.xml` without `--testsuite`. Those lanes
overlap by design; a bare run executes shared tests several times. Always pass
a testsuite with that config, or use `phpunit.xml` for a full run.

---

## When a test genuinely fails

Fix the application code, not the test.

Change the test only when it is provably wrong — and say why in the commit
message. A test edited to make a build green is worse than no test: it still
looks like coverage.

If a defect must ship unfixed, use the existing quarantine lane
(`Feature/Production/`), which is waiver-gated and visible, rather than deleting
or skipping the test.

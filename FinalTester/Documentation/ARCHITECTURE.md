# FinalTester — Architecture

How the testing ecosystem is put together, why each decision was made, and what
you need to know to keep it working.

---

## 1. The problem this replaces

Before consolidation there were three dashboards on three ports, two PHPUnit
configurations pointing at different directories, and two copies of the test
suite. The consequences were not cosmetic:

| Symptom | Root cause |
|---|---|
| Progress bar started at ~2% | Progress measured completed *module names* against a hand-written array, not tests against tests |
| Progress bar exceeded 100% | Modules discovered at runtime were added to the numerator but not the denominator |
| Half the suite never ran | Dashboard passed a positional `tests` argument that overrode the config and pointed at the stale legacy folder |
| Red runs told you nothing | An unmigrated test database produced 133 `table doesn't exist` errors indistinguishable from product defects |
| Nobody knew the test count | No component asked PHPUnit; every number was a guess |

Each of these is fixed structurally below, not patched.

---

## 2. Test discovery

There is exactly one authoritative source for "how many tests exist": PHPUnit's
own collector.

```
vendor/bin/pest --configuration FinalTester/phpunit.xml --list-tests-xml <file>
```

This performs full discovery — Pest `it()`/`test()` closures, PHPUnit
`test_*` methods, `@test`-annotated methods, and every data-provider row — and
executes nothing. `Scripts/expected.php` wraps it, writes
`reports/expected.json`, and prints the count as the last line of stdout so a
BAT file can capture it with a plain `for /f` loop.

The count is confirmed a second time at run start by the
`##teamcity[testCount count='N']` service message, which comes from the same
collector inside the process that is actually running. If the two disagree, the
runtime one wins.

> The current estate has **no data providers and no Pest datasets** (verified:
> zero `@dataProvider`, zero `#[DataProvider]`, zero `->with(`), so the static
> method count and the collector count agree exactly at 1358. If datasets are
> introduced later, the collector count will rise and the static count will not
> — trust the collector.

---

## 3. Suite definitions

Two configuration files, with a strict division of responsibility.

**`phpunit.xml` — canonical.** Four suites: `Unit`, `Feature`, `Routes`,
`Performance`. Their union is the entire estate and they do not overlap, so a
bare run executes every test exactly once. This is what makes
`executed / expected` meaningful.

> If you add an overlapping testsuite to this file, you break every number the
> dashboard reports. Category lanes belong in the other file.

**`config/phpunit.categories.xml` — category lanes.** `Financial`, `Ledger`,
`POS`, `Inventory`, `Reports`, `Security`, `Permissions`, `TenantIsolation`,
`Routes`, `Guardrails`, `API`, `VenSynQ`, `AI`, `OfflineSync`, `Database`,
`Regression`, `Performance`, `Smoke`, `Fast`.

These overlap deliberately — a guardrail can be both `Guardrails` and
`Security`. Because they overlap, this file **must always be run with an
explicit `--testsuite`**. Every BAT launcher passes one.

---

## 4. Execution flow

Every launcher is a three-line wrapper around `Scripts/run.bat`, so there is
exactly one execution path to audit.

```
RUN_*.bat
   └─ Scripts/run.bat
        1. locate php.exe        PATH, then Local, then XAMPP
        2. preflight.php         refuse to run against a broken environment
        3. sync.php              refresh FinalTester/tests from source
        4. expected.php          discover the denominator (nothing executed)
        5. print header          shows EXPECTED TESTS before running
        6. pest --log-junit      execute
        7. report.php            reconcile executed vs expected, print results
```

Step 4 happening *before* step 6 is the point. You are told how many tests
should run before they run, so a shortfall at the end is visible rather than
invisible.

---

## 5. Progress maths

This is the part that was broken. The rule is one line:

```
progress = executed / expected,   clamped to [0, 100]
```

with three properties that follow from it:

- **Starts at exactly 0.** `executed` is 0 before the first test finishes.
- **Monotonic.** `executed` only ever increments.
- **Cannot exceed 100.** Numerator and denominator both count tests, from the
  same collector, and the result is clamped anyway.

### Where the numerator comes from

The runner consumes `--teamcity`, a machine-readable event stream. Nothing is
scraped from human-readable console output.

Pest emits, per test:

```
##teamcity[testStarted  name='...' locationHint='pest_qn://...']
##teamcity[testFailed   name='...' message='...' details='...']   (only if it failed)
##teamcity[testIgnored  name='...' message='...']                 (only if skipped/risky)
##teamcity[testFinished name='...' duration='12']                 (ALWAYS)
```

`testFailed` and `testIgnored` are guarded by `whenFirstEventForTest`, so at
most one arrives per test. `testFinished` is emitted unconditionally for every
test. Therefore **`testFinished` is the single terminal event** and is the only
place `executed` is incremented. One test, one increment — the numerator cannot
drift.

`server.js` holds any verdict seen since the last `testStarted` in
`pendingOutcome` and applies it when `testFinished` arrives.

Skipped and risky both arrive as `testIgnored`. They are told apart by message:
a genuine skip always reads exactly `This test was ignored.`; a risky test
carries PHPUnit's own explanation.

### Bar segments

Each coloured segment is a share of **expected**, never of executed:

```
passed/expected + failed/expected + risky/expected + skipped/expected
```

They sum to exactly the completion percentage and cannot overflow the track.

### When the denominator is unknown

If discovery fails, `expected` is `null` and the UI shows `—` instead of a
percentage, with the label *"Test count unknown — discovery did not complete."*
It does not invent a number.

### Final reconciliation

Three sources, ranked by trustworthiness:

1. **Pest's own summary line** — authoritative. Accounts for every test,
   including ones that error before PHPUnit can record them.
   ```
   Tests:  438 failed, 1 risky, 55 incomplete, 6 skipped, 858 passed (4535 assertions)
   ```
2. **The live TeamCity stream** — accurate for tests that started; misses
   file-level errors.
3. **The JUnit log** — cross-check only.

> **JUnit is not the source of truth here, and an earlier version of this file
> claimed it was.** When a test errors during construction, PHPUnit writes no
> `<testcase>` element — it only increments the parent suite's `errors`
> attribute. On the 2026-08-02 07:14 run that made JUnit report `tests="73"`
> for 1358 executed tests, and the dashboard collapsed from 1169 to 73 the
> moment the run finished. Nothing is now allowed to silently reduce a count;
> disagreements between the three sources are reported instead.

### Pest's test directory is independent of the config

`bin/pest` line 142: `$input->getParameterOption('--test-directory', 'tests')`.
`Bootstrappers\BootFiles` then loads `<root>/<test-directory>/Pest.php`.

`--configuration` has no influence on this. Every FinalTester invocation must
therefore pass:

```
--test-directory=FinalTester/tests
```

Omit it and Pest loads the legacy `tests/Pest.php`, no `->in()` binding matches
`FinalTester/tests/`, and every Pest closure-style test runs with no base class
and no booted Laravel app.

### Incomplete runs

If the process dies with `executed < expected`, `aborted` is set and the UI says
so explicitly, naming how many tests never ran. A half-finished run is never
allowed to look like a completed one.

---

## 6. TeamCity message parsing

Escaping (see `Pest\Logging\TeamCity\ServiceMessage::escapeServiceMessage`):

| Raw | Escaped |
|---|---|
| `|` | `||` |
| `'` | `|'` |
| newline | `|n` |
| carriage return | `|r` |
| `]` | `|]` |
| `[` | `|[` |

Unescaping is a **single left-to-right pass**. A naive sequence of
`String.replace` calls would turn `||n` (an escaped pipe followed by the letter
n) into a newline. `unescapeTeamCity()` in `server.js` walks the string once.

---

## 7. Namespaces and autoloading

`composer.json` maps `Tests\` to `Tester/tests/`. That is untouched.

`FinalTester/bootstrap.php` calls:

```php
$autoload->addPsr4('Tests\\', __DIR__ . '/tests/', true);   // prepend
```

at runtime, so FinalTester's copies resolve first during a FinalTester run.
Because `composer.json` is not modified there is no ambiguous-class warning, the
classmap is unchanged, IDE navigation still points at `Tester/tests/`, and
running the legacy `Tester/phpunit.xml` behaves exactly as before.

PHPUnit includes test files by path, so the class is declared from whichever
copy the active suite names. Only one copy is ever in a given suite, so no
class is declared twice in one process.

---

## 8. Adding a new test

1. Write it in **`Tester/tests/`** — the live suite. Not in `FinalTester/tests/`.
2. Put it in the directory that matches its area (`Feature/Money/` for
   financial, `Feature/Guardrails/` for invariants, and so on).
3. Namespace mirrors the path: `Tester/tests/Feature/Money/FooTest.php` is
   `Tests\Feature\Money\FooTest`.
4. Filename must end in `Test.php` or PHPUnit will not collect it.
5. Extend `Tests\Feature\VenQoreTestCase` for anything touching the database.
   Pest applies it automatically to `Feature/*` subdirectories except `Smoke`
   and `DemoStore`, which declare their own `uses()`.
6. Run it. Sync picks it up automatically; the expected count goes up by one.

To surface it in a category lane, add it to `config/phpunit.categories.xml`. To
give it a dashboard section, add the mapping in **both** `Scripts/expected.php`
(`areaFor()`) and `dashboard/server.js` (`AREA_RULES`) — they must agree.

---

## 9. Conventions

- Filenames end `Test.php`; classes end `Test`.
- One concern per file; the filename says what it protects.
- A docblock at the top of each guardrail explaining *what breaks in production
  if this test is deleted*. The existing guardrail suite does this well and it
  is worth keeping.
- Never assert on a hardcoded database ID.
- Never point a test at `venqore_pos`.

---

## 10. Maintenance

| When | Do |
|---|---|
| A route is added or renamed | `php artisan ziggy:generate`, then `RUN_ROUTE_SWEEP.bat` |
| A new top-level route namespace appears | Add it to `KNOWN_NAMESPACES` in `FullRouteSweepTest` with a note on how it is covered |
| A new dashboard area is wanted | Update `areaFor()` **and** `AREA_RULES` |
| Migrations change | `php artisan migrate --env=testing` before the next run |
| The expected count jumps unexpectedly | `php FinalTester/Scripts/expected.php` and diff `reports/expected.json` |
| A test is quarantined | Put it in `Feature/Production/` — the existing waiver-gated lane |

# FinalTester — VenQore Testing Command Center

This folder is the single place from which the VenQore test estate is run,
measured and understood. If you want to know whether the product works, you
come here.

Nothing outside this folder was moved, renamed or deleted to create it.

---

## Start here

| I want to… | Do this |
|---|---|
| Run everything | Double-click `RUN_ALL_TESTS.bat` |
| Watch it live in a browser | Double-click `RUN_DASHBOARD.bat` |
| Run one area | `RUN_FINANCIAL_TESTS.bat`, `RUN_SECURITY_TESTS.bat`, … |
| Check every route and page | `RUN_ROUTE_SWEEP.bat` |
| Quick check while coding | `RUN_FAST.bat` (seconds, no database) |
| Understand the numbers | `Documentation/ARCHITECTURE.md` |
| See what was found in the audit | `FINAL_AUDIT_REPORT.md` |

**Before your first run**, make sure MySQL is running and the test database is
migrated. Every launcher checks this for you and stops with instructions if it
is not — see *Preflight* below.

---

## The two things you should know

### 1. There are 1358 tests, not 1583

`1583` does not match any recorded run in the repository. The run ledger under
`Tester/VerificationCenter/runs/` shows every correctly-configured full run
reporting **1322** tests, which matches the live suite exactly. FinalTester adds
36 more (30 rescued orphans + 6 new route-sweep tests), giving **1358**.

You never have to take that number on faith. Every launcher prints the expected
count *before* running, and it comes from PHPUnit's own collector:

```
php FinalTester\Scripts\expected.php
```

### 2. Roughly half the estate was not being executed

The dashboard was launching:

```
vendor/bin/pest tests --configuration Tester/phpunit.xml
```

That positional `tests` argument overrides the config's paths and points at the
**stale legacy `tests/` folder**, not the live `Tester/tests/`. The run ledger
confirms it: dashboard runs report `total: 642`; correctly-configured runs
report `total: 1322`.

716 tests — 53% of the estate — were never running. FinalTester fixes this by
construction: there is one execution path (`Scripts\run.bat`) and it never
passes a positional path argument.

---

## Layout

```
FinalTester/
  README.md                     you are here
  FINAL_AUDIT_REPORT.md         what the audit found, with scores
  phpunit.xml                   canonical suite — every test exactly once
  bootstrap.php                 autoload + MySQL/production guards
  .env.testing                  test environment

  RUN_ALL_TESTS.bat             everything
  RUN_FULL.bat                  alias of the above
  RUN_FAST.bat                  unit + tools, no database
  RUN_DASHBOARD.bat             live browser dashboard (port 7830)
  RUN_ROUTE_SWEEP.bat           static route integrity + live ledger sweep
  RUN_FINANCIAL_TESTS.bat       financial engine
  RUN_LEDGER.bat                double-entry / accounting
  RUN_SECURITY_TESTS.bat        IDOR, permissions, tenant isolation
  RUN_GUARDRAILS.bat            the invariants that must never break
  RUN_REGRESSION.bat            pinned historical defects
  RUN_SMOKE.bat                 smoke + demo store
  RUN_COVERAGE.bat              full run with HTML coverage
  RUN_POS.bat  RUN_INVENTORY.bat  RUN_REPORTS.bat
  RUN_TENANT_ISOLATION.bat  RUN_VENSYNQ.bat  RUN_PERFORMANCE.bat

  config/
    phpunit.categories.xml      overlapping category lanes
    finaltester.json            php path + config paths

  Scripts/
    run.bat                     the ONE execution path
    preflight.php               environment sanity check
    sync.php                    refresh tests/ from the source suites
    expected.php                authoritative expected-test count
    report.php                  JUnit -> summary + console block

  dashboard/
    index.html                  UI
    server.js                   runner + correct progress maths
    package.json

  tests/                        synced copy of the estate (see below)
  reports/                      expected.json, summary.json, junit.xml, …
  logs/                         last-run.log
  Documentation/
    ARCHITECTURE.md  TEST_INVENTORY.md  ROUTE_SWEEP.md  TROUBLESHOOTING.md
```

---

## `FinalTester/tests/` is a copy — and that is deliberate

The live suite lives at `Tester/tests/`. Composer maps `Tests\` there and that
has not changed.

`FinalTester/tests/` is a **materialised view** of it, not a fork:

- `Scripts/sync.php` runs automatically at the start of every launcher, so the
  copy is never more than seconds old.
- It only ever writes inside `FinalTester/tests`. It never touches
  `Tester/tests` or `tests/`.
- Two files are FinalTester-owned and are never overwritten by sync:
  `tests/Pest.php` (has FinalTester path registrations appended) and
  `tests/Routes/FullRouteSweepTest.php` (new, no upstream copy).

**Edit tests in `Tester/tests/`.** The next run picks the change up. Do not
edit inside `FinalTester/tests/` — sync will overwrite it.

`bootstrap.php` prepends a runtime PSR-4 mapping so FinalTester's copies resolve
first during a FinalTester run. `composer.json` is not modified, and running the
old `Tester/phpunit.xml` still behaves exactly as it did.

---

## Preflight

Every launcher runs `Scripts/preflight.php` first. It refuses to start when the
environment cannot produce a trustworthy result:

- Composer dependencies missing
- MySQL not reachable
- `amd_pos_test` missing, or missing core tables
- More migration files on disk than recorded as run
- (advisory) `routes/web.php` newer than `resources/js/ziggy.js`

This exists because of a real incident. The 2026-08-02 full run showed 332
non-passing tests, and 133 of them were `Table 'amd_pos_test.plans' doesn't
exist` — an unmigrated database, not a broken product. Nothing in the output
said so.

Skip it with `/force` if you know what you are doing:

```
RUN_ALL_TESTS.bat /force
```

---

## Database policy

MySQL only. This is enforced, not merely documented:

- `phpunit.xml` pins `DB_CONNECTION=mysql`, `DB_DATABASE=amd_pos_test`
- `bootstrap.php` aborts if `DB_CONNECTION` is anything but `mysql`
- `bootstrap.php` aborts if `DB_DATABASE` is `venqore_pos`
- `preflight.php` aborts on the production database before connecting

There is no SQLite anywhere in this folder, and adding it would fail at
bootstrap. The suite asserts on MySQL trigger, decimal and isolation semantics;
results from another engine would be confidently wrong.

---

## Command lines

If you prefer the terminal to the BAT files, run these from the project root:

```bash
# everything
vendor/bin/pest --configuration FinalTester/phpunit.xml

# one canonical suite
vendor/bin/pest --configuration FinalTester/phpunit.xml --testsuite Unit

# one category lane (ALWAYS pass --testsuite with this config)
vendor/bin/pest --configuration FinalTester/config/phpunit.categories.xml --testsuite Security

# expected count, without running anything
php FinalTester/Scripts/expected.php

# environment check
php FinalTester/Scripts/preflight.php
```

`config/phpunit.categories.xml` must always be given a `--testsuite`. Its lanes
overlap on purpose, so a bare run would execute shared tests several times and
inflate every count.

---

## When something fails

The project rule, and it is the right one: **fix the application code, not the
test.** Only change a test when the test itself is provably wrong — and say so
in the commit message.

Start with `Documentation/TROUBLESHOOTING.md`.

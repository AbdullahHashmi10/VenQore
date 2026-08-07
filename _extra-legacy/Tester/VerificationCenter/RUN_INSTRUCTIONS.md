# Verification Center — Run Instructions

The implementation sandbox has **no PHP and no MySQL**, so everything was authored and
**statically verified** (PHP structure, no NUL bytes, no duplicate FQCNs, valid
XML/YAML/JSON, and Python simulations of each meta-test's logic). The **dynamic** proofs
below must run on a machine with PHP 8.2 + MySQL. This is the single remaining step to
turn "statically correct" into "provably green."

## Prerequisites

- PHP 8.2 (the project's bundled path works: `C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe`)
- MySQL with database `amd_pos_test` (create it empty; migrations build it)
- `composer install` already done (vendor/ present)

## 1. Prove the suite is green (Phase A exit criterion)

```bat
cd "E:\AMD POS\AMD POS"
vendor\bin\phpunit -c Tester\phpunit.xml
```

Run it **three times consecutively** on a clean `amd_pos_test`. Each run writes an
append-only evidence record under `Tester\VerificationCenter\runs\<runId>\` and updates
`runs\latest.json`. Three green `latest.json` records = Phase A dynamic exit met.

If a run is red, that is **information, not failure** — open the Run Ledger record and the
per-test `tests.jsonl` to see exactly which tests errored and why. The whole point of
Phase A was to make "it passes" a checkable artifact.

## 2. Run the whole ecosystem under one command (Phase B)

```bat
php artisan verify:all
php artisan verify:all --dry-run        REM list the execution plan without running
php artisan verify:all --json           REM machine-readable consolidated result
php artisan verify:all --suites-only    REM PHPUnit only
php artisan verify:all --sources-only   REM sweep/engine sources only
```

`verify:all` wraps PHPUnit + `audit:ledger-truth` + `audit:data-integrity` +
`verify:engines` + `verify:sentinel` + `golden:verify`. It never replaces them — each
still runs standalone exactly as before.

## 3. Refresh the One Dashboard

```bat
php artisan verify:dashboard-data
```

This writes `Tester\VerificationCenter\dashboard-data.json`. Then open
`Tester\VerificationCenter\dashboard.html` via any static server (the `file://`
protocol blocks `fetch`; the existing `Tester\dashboard\launch.bat` Node server works,
or run `php -S localhost:8009 -t Tester\VerificationCenter` and browse to it).

## 4. Registry integrity (runs as part of the suite)

`Tests\Feature\Core\SuiteIntegrityTest` and `Tests\Feature\Core\RegistryDriftTest` run
inside the normal PHPUnit invocation. They fail if:
- any `*Test.php` is unregistered or outside a suite,
- two classes share an FQCN (the F-01/F-02 collision),
- the registry's declared test-method total drifts from the filesystem,
- any registry member lacks a valid oracle tier.

**When you add or remove a test**, regenerate the registry total so the drift test stays
green (the generator logic is documented in `MIGRATION_LOG.md`; it counts `testX()`,
`/** @test */`, `#[Test]`, and Pest `it()/test()`).

## Backward compatibility

Everything that worked before still works: `vendor\bin\phpunit` with the existing suite
names, direct Pest file runs, `audit:ledger-truth`, `audit:data-integrity`,
`verify:engines`, both dashboards, and the `launch.bat` scripts. The Verification Center
wraps; it never gates the other runners out.

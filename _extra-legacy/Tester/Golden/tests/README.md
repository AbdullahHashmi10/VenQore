# This directory intentionally holds NO test files

The PHP test files that used to live here were a **dead, divergent duplicate**
of the canonical Golden suite. They were never on the PHPUnit test path
(`Tester/phpunit.xml` runs `tests/Feature/Golden/...`), so they never executed.

**Archived:** 2026-07-11 (Phase A, audit finding F-01 / FC-10)
**Moved to:** `Tester/_archive/2026-07_Golden-legacy-copy/`
**Divergence report:** `Tester/_archive/2026-07_Golden-legacy-copy/DIVERGENCE_REPORT.md`

The live, executing Golden suite is at:

    Tester/tests/Feature/Golden/

A coverage-loss check confirmed every `test*` method here also exists in the
canonical suite before these files were moved. Nothing of value was lost.

Do not recreate test files in this directory — the SuiteIntegrity meta-test
(`tests/Feature/Core/SuiteIntegrityTest.php`) fails if any `*Test.php` file
exists outside a registered suite.

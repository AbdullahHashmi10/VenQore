# Divergence Report — Dead Golden Test Copy

**Archived:** 2026-07-11 (Phase A, audit finding F-01 / FC-10)
**Source (dead):** `Tester/Golden/tests/`
**Canonical (live):** `Tester/tests/Feature/Golden/`

## Why archived

`Tester/Golden/tests/` was a divergent, non-executing duplicate of the canonical
Golden suite. It was not referenced by `Tester/phpunit.xml` (which points at
`tests/Feature/...`), so its assertions never ran — the classic "dead divergent copy"
failure mode. Keeping it invited silent drift: an engineer could "fix" a test here and
believe the suite was strengthened when nothing executed.

## Coverage-loss check (performed before archiving)

Every `test*` method present in the dead copy was verified to also exist in the
canonical suite. **Zero test methods are lost by archiving.**

The ONLY methods unique to the dead copy were the deprecated in-test seeding helpers
(`ensureSeeded`, `ensureGoldenCompanySeeded`, `ensureGoldenCompanyExists`) — i.e. the
`DB::commit()/beginTransaction()` surgery that Phase A deliberately REMOVED and replaced
with `Tests\Support\GoldenSeedManager`. These are not test coverage; they are the
very anti-pattern the audit (F-03/FC-5) told us to delete. Nothing of value was ported.

## Per-file divergence summary

| File | Methods only in dead copy | Verdict |
|---|---|---|
| AdversarialCorruptionTest.php | ensureSeeded  | superseded |
| ArchitecturalEnforcementTest.php | — | superseded |
| ClockPositionConsistencyTest.php | ensureSeeded  | superseded |
| CogsReconciliationTest.php | ensureSeeded  | superseded |
| CrossSurfaceConsistencyTest.php | ensureSeeded  | superseded |
| DashboardOutputTest.php | — | superseded |
| EdgeCasesTimeConcurrencyTest.php | ensureSeeded  | superseded |
| ExpensePaymentInputVerificationTest.php | — | superseded |
| FifoBatchVerificationTest.php | ensureSeeded  | superseded |
| FilterMatrixTest.php | — | superseded |
| FinancialCoreVerificationTest.php | ensureGoldenCompanySeeded  | superseded |
| FormattingConsistencyTest.php | ensureSeeded  | superseded |
| GoldenCompanyTest.php | ensureGoldenCompanyExists  | superseded |
| InputVerificationTestCase.php | — | superseded |
| LaunchGateTest.php | ensureSeeded  | superseded |
| OutputVerificationTestCase.php | ensureSeeded  | superseded |
| PurchaseInputVerificationTest.php | — | superseded |
| ReportOutputTest.php | — | superseded |
| SaleInputVerificationTest.php | — | superseded |
| VenQoreTestCase.php | — | superseded |

## Rollback

The full pre-migration state is in `_VERIFICATION_BASELINE_2026-07-10/Tester/Golden/tests/`.
This archived copy is a second, in-tree historical reference. Neither is on the test path.

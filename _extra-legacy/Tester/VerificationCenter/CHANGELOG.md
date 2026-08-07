# Verification Platform — Change Log (Phase 2)

All changes are ADDITIVE or IN-PLACE upgrades. Nothing was deleted; two objectively-dead
artifacts were moved to `Tester/_archive/` with provenance. Rollback path: git history +
`_VERIFICATION_BASELINE_2026-07-10/`.

## New files

### Verification Center (`Tester/VerificationCenter/`)
- `registry/suites.yaml` — self-validating suite registry (1,044 methods, oracle-tiered)
- `registry/ORACLE_REGISTRY.md` — T1/T2/T3 definitions + honest baseline
- `registry/trust_model.yaml` — 10 weighted dimensions, floors, gate conditions
- `registry/quarantine.yaml` — honest-red waivers (POS-003, WOO-001)
- `registry/permission_ratchet.yaml` — 257-route debt, checksum-locked, ceiling
- `registry/SWEEP_LABELING.md` — Consistency vs Truth sweep
- `dashboard.html` + `dashboard-data.json` — the One Dashboard
- `bin/generate_registry.py` — registry regenerator
- `MIGRATION_LOG.md`, `RUN_INSTRUCTIONS.md`, `TRUST_SCORE_REPORT.md`,
  `COVERAGE_REPORT.md`, `KNOWN_LIMITATIONS.md`, `FINAL_VERIFICATION_REPORT.md`, this file
- `runs/`, `reports/`, `mutation/` — evidence directories

### Artisan commands (`app/Console/Commands/Verification/`)
- `VerifyAllCommand.php` (`verify:all`) — orchestrator
- `VerifyDashboardDataCommand.php` (`verify:dashboard-data`) — dashboard payload
- `GenerateReportsCommand.php` (`verify:reports`) — business+technical report pairs
- `LaunchGateCommand.php` (`verify:launch-gate`) — launch decision

### Tests
- `Core/SuiteIntegrityTest.php`, `Core/RegistryDriftTest.php`, `Core/NumberLineageCompletenessTest.php`
- `Support/Quarantine.php`, `Support/concurrency/fifo_deduct_worker.php`
- `Feature/Production/` — LegacyPosCogsPinning, WooWebhookJournalPinning, ExportContentVerification, ImportJournalBalance
- `Guardrails/AstSingleWriterGuardTest.php`, `Guardrails/PaymentAllocationTriggerTest.php`, `Guardrails/FifoConcurrencyRaceTest.php`, `Guardrails/LedgerCorruptionAlertTest.php`
- `Golden/SentinelDeltaDetectionTest.php`, `Golden/LaunchGateSelfTest.php`

### Other
- `infection.json5` — mutation-testing config (financial core, MSI floors)
- `verification/golden_company/spec2.yaml` + `spec2_worksheet.md` — Golden Company 2

## Modified in place

- `Tester/tests/Feature/VenQoreTestCase.php` — **repaired truncation**; ClaimLogger merge
  completed; `assertJournalLinesExactly` + `manifestValue` added
- `Tester/phpunit.xml` — **repaired truncation**; Run Ledger extension; Quarantine testsuite
- `Tester/.env.testing` — APP_ENV testing
- `Tester/tests/Feature/Golden/SaleInputVerificationTest.php` — **repaired truncation**; E-10 renamed
- `Tester/tests/Feature/Golden/AdversarialCorruptionTest.php` — V-11…V-13 added
- `Tester/tests/Feature/Golden/LaunchGateTest.php` — G-03 rebuilt on YAML parsing
- `Tester/tests/Feature/Money/ReportReconciliationTest.php` — mirror-logic oracle purged
- `Tester/tests/Feature/Guardrails/PermissionBypassGuardTest.php` — no-reseed + ratchet
- `app/Console/Commands/LedgerTruthAuditCommand.php` — strictness + scan floors
- `app/Console/Commands/VerifySentinelCommand.php` — collision-proof markers
- `verification/golden_company/calculator.php` — derives + self-checks; derived reversal
- 25 test files — namespaces normalized to PSR-4

## Moved to archive (not deleted)

- `Tester/_archive/2026-07_Golden-legacy-copy/` — 20 dead divergent Golden files + divergence report
- `Tester/_archive/2026-07_dead-base-class/` — duplicate VenQoreTestCase + README

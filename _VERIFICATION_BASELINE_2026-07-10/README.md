# VenQore Verification Platform — Immutable Baseline (Phase 0)

**Created:** 2026-07-10
**Purpose:** Permanent historical baseline and rollback point for the verification ecosystem, captured BEFORE any Phase 2 (Master Blueprint) implementation work began.

## What this is

An exact, bit-identical copy of the entire verification platform as it existed on 2026-07-10, the state audited by `TEST_ECOSYSTEM_FORENSIC_AUDIT.md` (trust score 4.5/10). It is the "historical reference implementation" required by Phase 0 of the implementation mandate.

## Contents

| Path | What | Files |
|---|---|---|
| `Tester/` | All 139 test files, 3 dashboards, phpunit.xml, bootstrap.php, dead Golden copy (`Tester/Golden/tests/`, 20 files), `.phpunit.result.cache` (the red-run evidence, mtime 2026-07-10 07:04) | full tree |
| `verification/` | Golden Company spec/calculator/manifest, `number_registry.yaml` | full tree |
| `tests/` | Root-level test tree (Feature/Unit/Performance/Pest) | full tree |
| `app/Console/Commands/` | All artisan commands incl. `LedgerTruthAuditCommand`, `DataIntegrityAuditCommand`, `VerifyLedgerCommand`, `VerifySentinelCommand`, `GoldenVerifyCommand`, `Verification/` engines runner | full tree |
| `database/seeders/` | `GoldenCompanySeeder.php`, `GoldenAuditSeeder.php` | 2 |
| `phpunit.xml.dist`, `composer.json` | Root config as of baseline (autoload reference: `Tests\` → `Tester/tests/`) | 2 |
| `run_production_smoke_tests.*`, `triple-run.bat` | Verification launcher scripts | 3 |
| `CHECKSUMS.sha256` | SHA-256 of every file in this baseline (418 files) | 1 |

Total: 418 files, ~7.5 MB.

## Integrity verification (performed at creation)

- `diff -rq` of every copied tree against the live originals: **0 differences**.
- `sha256sum -c CHECKSUMS.sha256`: **418/418 OK**.
- No original file was modified, moved, or deleted during Phase 0. Original executability is therefore unchanged by construction.

To re-verify this baseline at any time:

```bash
cd _VERIFICATION_BASELINE_2026-07-10 && sha256sum -c CHECKSUMS.sha256 | grep -v ": OK$"
```

(No output = intact.)

## Rules (from the implementation mandate)

1. **READ-ONLY.** Never edit, run CI against, or autoload from this folder. It is not registered in composer autoload and appears in no phpunit testsuite — by design.
2. **Never delete.** This is the rollback point and the audit's evidentiary record.
3. All implementation work happens on the live tree (`Tester/`, `verification/`, `app/`) — in-place upgrades per the Master Blueprint §9, with git history + this baseline as the recovery path.
4. Comparisons: to see exactly what Phase 2 changed in any file, diff the live file against its copy here.

## Why the live tree (not this copy) hosts the new platform

Composer PSR-4 (`Tests\` → `Tester/tests/`), phpunit.xml paths, both dashboards, and all artisan commands point at the live tree. Duplicating 139 test classes into a second autoloaded location would create the exact FQCN-collision failure mode the audit condemned (F-02). The Blueprint's core rule — "unify by reference, not by copy" — therefore governs the live tree; THIS copy exists solely as the frozen historical reference demanded by Phase 0. The two mandates compose: preserve by copy (here), improve by reference (live tree).

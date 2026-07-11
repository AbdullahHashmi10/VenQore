# Repository Integrity — L001 / L037 Findings

_Generated as part of Track A launch-readiness work._

## Canonical working copy

- **Canonical path:** the repository root (this directory).
- **Active branch at time of audit:** `session2-fixes`.
- `git worktree list` shows one real tree at the repo root. A stale
  `landing-3d-redesign` worktree entry exists under
  `.claude/worktrees/` and is marked *prunable*; `git worktree prune` should be
  run from an environment with permission to delete it (the sandbox here was
  denied the delete, so it remains listed).

## Duplicate codebase copies (action required — not auto-deleted)

Two **tracked** full/partial duplicate copies of the codebase exist inside the
repo and pollute test discovery and "which file is canonical" reasoning:

- `VenQore_Local/`
- `_VERIFICATION_BASELINE_2026-07-10/`

These were **not** deleted automatically because removing tracked directories is
a git-history decision for a human to make deliberately. They are now added to
`.gitignore` so no *new* copies get committed. Recommended cleanup:

```bash
git rm -r --cached VenQore_Local _VERIFICATION_BASELINE_2026-07-10
git commit -m "chore(L001): remove duplicate codebase snapshots from VCS"
```

## Test-suite location (L037)

The authoritative PHPUnit config is the root **`phpunit.xml.dist`**, whose
`Feature` suite runs **`./Tester/tests/Feature`**. CI (`venqore-tests.yml`)
independently enumerates `Tester/tests/Feature/Module01..20`.

The 7 tests L037 flagged as "misplaced in `tests/Feature/`" already exist in the
canonical `Tester/tests/Feature/` tree and therefore already run:

| Concern            | Canonical location                                        |
|--------------------|-----------------------------------------------------------|
| DebitNote          | `Tester/tests/Feature/DebitNoteTest.php`                  |
| PaymentAllocation  | `Tester/tests/Feature/PaymentAllocationTest.php`          |
| PurchasesImport    | `Tester/tests/Feature/PurchasesImportTest.php`            |
| Migration          | `Tester/tests/Feature/MigrationTest.php`                  |
| SmartFulfillment   | `Tester/tests/Feature/SmartFulfillmentTest.php`           |
| V3 SalesOrder      | `Tester/tests/Feature/V3/SalesOrderTest.php`              |
| AppSumo import     | `Tester/tests/Feature/AppSumo/ImportAppSumoCodesTest.php` |

The **root `tests/` directory is not referenced by the authoritative config or
CI** and contains an older, parallel set of tests. It should be reconciled
(kept intentionally or removed) in the same cleanup commit as the duplicate
dirs, so there is exactly one place tests live.

**Conclusion:** L037's substance (the 7 tests actually executing in the real
suite) is satisfied. What remains is housekeeping — collapsing the stray root
`tests/` copies and the two duplicate snapshot directories — which is left as an
explicit, reviewable git operation rather than an automated deletion.

# Release record: 6.1.4

- Built: 2026-10-01
- Artifact: `AMD_POS_Update_v6.1.4.zip`
- Size: 61,037,128 bytes (58.21 MiB)
- SHA-256: `17E7BE777B59694C3177BBFC63573202C425A81050364E956AAEF0FD8F1F8BE5`
- Source revision: `dba9f8cf36c1acb4b75c7e7810be4c46161f868c`
- Source state: dirty (uncommitted worktree build for v6.1.4)
- Build command: `bundle_for_update.ps1 -Version "6.1.4" -AllowDirty`
- Classification: `ARTIFACT VALIDATED FOR STAGING`

## Validation results

- Production Composer install from lock: passed (`dev: false`)
- Laravel package discovery and Ziggy generation: passed
- Design-system and Ziggy route audits: passed
- Browser Vite build: passed, 650 manifest entries verified
- SSR Vite build: passed
- Isolated packaged Composer autoload boot: passed
- Eager Composer autoload files: 121/121 present
- Compiled CSS Tailwind check: passed
- Runtime-only package audit: passed, zero forbidden entries (.env, SQLite, dev tools, executables)
- Upload size gate: passed (61.04 MB / limit 120.00 MB)
- Version marker: `6.1.4`, released `2026-10-01`, type `update_package`

## Release decision

This package is validated for staging deployment.

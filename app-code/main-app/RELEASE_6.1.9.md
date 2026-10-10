# Release record: 6.1.9

- Built: 2026-10-09
- Artifact: `AMD_POS_Update_v6.1.9.zip`
- Size: 62,872,363 bytes (59.96 MiB)
- SHA-256: `92EFADC60FBDF10ECA611EAE2EA283654B825CF9040C83E70C18CE3E1930BF74`
- Source revision: `dba9f8cf36c1acb4b75c7e7810be4c46161f868c`
- Source state: dirty (uncommitted worktree build for v6.1.9)
- Build command: `bundle_for_update.ps1 -Version "6.1.9" -AllowDirty`
- Classification: `ARTIFACT VALIDATED FOR STAGING`

## Validation results

- Production Composer install from lock: passed (`dev: false`)
- Laravel package discovery and Ziggy generation: passed
- Design-system and Ziggy route audits: passed
- Browser Vite build: passed, 714 manifest entries verified
- SSR Vite build: passed
- Isolated packaged Composer autoload boot: passed
- Eager Composer autoload files: 121/121 present
- Compiled CSS Tailwind check: passed
- Runtime-only package audit: passed, zero forbidden entries (.env, SQLite, dev tools, executables)
- Upload size gate: passed (59.96 MB / limit 120.00 MB)
- Version marker: `6.1.9`, released `2026-10-09`, type `update_package`

## Release decision

This package is validated for staging deployment.

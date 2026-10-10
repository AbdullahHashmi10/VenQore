# Release record: 6.1.8

- Built: 2026-10-07
- Artifact: `AMD_POS_Update_v6.1.8.zip`
- Size: 62,760,856 bytes (59.85 MiB)
- SHA-256: `6CA261C407EB476021EA168629C845C487564801924A9BA374A9891DC77EF0E6`
- Source revision: `dba9f8cf36c1acb4b75c7e7810be4c46161f868c`
- Source state: dirty (uncommitted worktree build for v6.1.8)
- Build command: `bundle_for_update.ps1 -Version "6.1.8" -AllowDirty`
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
- Upload size gate: passed (59.85 MB / limit 120.00 MB)
- Version marker: `6.1.8`, released `2026-10-07`, type `update_package`

## Release decision

This package is validated for staging deployment.

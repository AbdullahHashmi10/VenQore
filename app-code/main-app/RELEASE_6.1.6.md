# Release record: 6.1.6

- Built: 2026-10-07
- Artifact: `AMD_POS_Update_v6.1.6.zip`
- Size: 62,748,111 bytes (59.84 MiB)
- SHA-256: `185CEB69F2A5D89ABEAF5CC914F7CF60191A3EEDFBE0C72F5EFC5B20ACF2E610`
- Source revision: `dba9f8cf36c1acb4b75c7e7810be4c46161f868c`
- Source state: dirty (uncommitted worktree build for v6.1.6)
- Build command: `bundle_for_update.ps1 -Version "6.1.6" -AllowDirty`
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
- Upload size gate: passed (59.84 MB / limit 120.00 MB)
- Version marker: `6.1.6`, released `2026-10-07`, type `update_package`

## Release decision

This package is validated for staging deployment.

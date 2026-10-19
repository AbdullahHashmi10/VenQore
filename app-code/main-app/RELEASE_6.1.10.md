# Release record: 6.1.10

- Built: 2026-10-10
- Artifact: `AMD_POS_Update_v6.1.10.zip`
- Size: 63,600,022 bytes (60.65 MiB)
- SHA-256: `A9659BB36AFCD18B06F13A64CE17C98E5CBFAB3EBC9DCBB0D98E7A1113775887`
- Source revision: `dba9f8cf36c1acb4b75c7e7810be4c46161f868c`
- Source state: dirty (uncommitted worktree build for v6.1.10)
- Build command: `bundle_for_update.ps1 -Version "6.1.10" -AllowDirty`
- Classification: `ARTIFACT VALIDATED FOR STAGING`

## Validation results

- Production Composer install from lock: passed (`dev: false`)
- Laravel package discovery and Ziggy generation: passed
- Design-system and Ziggy route audits: passed
- Browser Vite build: passed, 741 manifest entries verified
- SSR Vite build: passed
- Isolated packaged Composer autoload boot: passed
- Eager Composer autoload files: 121/121 present
- Compiled CSS Tailwind check: passed
- Runtime-only package audit: passed, zero forbidden entries (.env, SQLite, dev tools, executables)
- Upload size gate: passed (60.65 MB / limit 120.00 MB)
- Version marker: `6.1.10`, released `2026-10-10`, type `update_package`

## Release decision

This package is validated for staging deployment.

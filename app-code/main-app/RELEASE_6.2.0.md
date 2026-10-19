# Release record: 6.2.0

- Built: 2026-10-13
- Artifact: `AMD_POS_Update_v6.2.0.zip`
- Size: 63,759,901 bytes (60.81 MiB)
- SHA-256: `043AA01C1EDF07B29C5FF38F377C6458671ABD8ECD02DB7DB37F9E8BB02606B8`
- Source revision: `5fdc843099ef1bffe52c14d829b1f5deea4fa43f`
- Source state: dirty (uncommitted worktree build for v6.2.0)
- Build command: `bundle_for_update.ps1 -Version "6.2.0" -AllowDirty`
- Classification: `ARTIFACT VALIDATED FOR STAGING`

## Validation results

- Production Composer install from lock: passed (`dev: false`)
- Laravel package discovery and Ziggy generation: passed
- Design-system and Ziggy route audits: passed
- Browser Vite build: passed, 737 manifest entries verified
- SSR Vite build: passed
- Isolated packaged Composer autoload boot: passed
- Eager Composer autoload files: 121/121 present
- Compiled CSS Tailwind check: passed
- Runtime-only package audit: passed, zero forbidden entries (.env, SQLite, dev tools, executables)
- Upload size gate: passed (60.81 MB / limit 120.00 MB)
- Version marker: `6.2.0`, released `2026-10-13`, type `update_package`

## Release decision

This package is validated for staging deployment.

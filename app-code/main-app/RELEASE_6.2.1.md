# Release record: 6.2.1

- Built: 2026-10-18
- Artifact: `AMD_POS_Update_v6.2.1.zip`
- Size: 64,656,022 bytes (61.66 MiB)
- SHA-256: `2D8C48005B0CADBE81803F1A63A28E079A213498CCB6273C92C2D92E45DEF818`
- Source revision: `5fdc843099ef1bffe52c14d829b1f5deea4fa43f`
- Source state: dirty (uncommitted worktree build for v6.2.1)
- Build command: `bundle_for_update.ps1 -Version "6.2.1" -AllowDirty`
- Classification: `ARTIFACT VALIDATED FOR STAGING`

## Validation results

- Production Composer install from lock: passed (`dev: false`)
- Laravel package discovery and Ziggy generation: passed
- Design-system and Ziggy route audits: passed
- Browser Vite build: passed, 745 manifest entries verified
- SSR Vite build: passed
- Isolated packaged Composer autoload boot: passed
- Eager Composer autoload files: 121/121 present
- Compiled CSS Tailwind check: passed
- Runtime-only package audit: passed, zero forbidden entries (.env, SQLite, dev tools, executables)
- Upload size gate: passed (61.66 MB / limit 120.00 MB)
- Version marker: `6.2.1`, released `2026-10-18`, type `update_package`

## Release decision

This package is validated for staging deployment.

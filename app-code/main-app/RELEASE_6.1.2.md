# Release record: 6.1.2

- Built: 2026-10-01
- Artifact: `AMD_POS_Update_v6.1.2.zip`
- Size: 61,031,438 bytes (58.20 MiB)
- SHA-256: `F1F0117632CDC18ACE9577C5F1DF741BEF58D18E77EE5F3BDBD375EAE86CA3F5`
- Source revision: `dba9f8cf36c1acb4b75c7e7810be4c46161f868c`
- Source state: dirty (uncommitted worktree build for v6.1.2)
- Build command: `bundle_for_update.ps1 -Version "6.1.2" -AllowDirty`
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
- Upload size gate: passed (61.03 MB / limit 120.00 MB)
- Version marker: `6.1.2`, released `2026-10-01`, type `update_package`

## Changes included

- Included all user thermal printer settings updates and routing enhancements.
- Ensured contract test alignment between frontend settings map and server controller (`strict_party_roles` added to `customers_suppliers` section map).

## Release decision

This package is validated for staging deployment.

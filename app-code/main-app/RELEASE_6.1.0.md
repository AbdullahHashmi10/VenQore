# Release record: 6.1.0

> Superseded before installation by 6.1.1. Do not deploy this artifact. The
> multi-chunk updater token handshake was corrected in 6.1.1.

- Built: 2026-10-01
- Artifact: `AMD_POS_Update_v6.1.0.zip`
- Size: 61,030,327 bytes (58.20 MiB)
- SHA-256: `C78FDAA0DE4E532CFEE53DD824FA61B355A7BB036F0052C3713FC86408845F7E`
- Source revision: `dba9f8cf36c1acb4b75c7e7810be4c46161f868c`
- Source state: dirty, 1,609 paths reported by the builder
- Build command: `bundle_for_update.ps1 -Version "6.1.0" -AllowDirty -Force`
- Classification: `ARTIFACT VALIDATED FOR STAGING`

## Validation results

- Production Composer install from lock: passed (`dev: false`)
- Laravel package discovery and Ziggy generation: passed
- Design-system and Ziggy route audits: passed
- Browser Vite build: passed, 652 manifest entries verified
- SSR Vite build: passed
- Isolated packaged Composer autoload boot: passed
- Eager Composer autoload files: 121/121 present
- Compiled CSS Tailwind check: passed
- Runtime-only package audit: passed, 17,890 entries and zero forbidden entries
- Upload size gate: passed
- Version marker: `6.1.0`, released `2026-10-01`, type `update_package`

The package boundary was strengthened during this release to remove dependency
test suites, Symfony Tester helpers, design-reference HTML, and the Windows-only
Symfony hidden-input executable. Windows Station installers remain external.

## Migration delta from 6.0.10

One migration was added and none were removed:

- `2026_10_01_000001_add_metadata_to_staff_invitations_table.php`

The updater or manual deployment must run `php artisan migrate --force`.

## Non-fatal build warnings

- PostCSS reported mixed support for `align-content: start`.
- `/images/noise.svg` remains a runtime-resolved URL.
- Rollup reported Recharts circular chunk relationships.
- SSR reported several unused icon/chart imports.

These warnings did not fail the build gates. They should be handled as normal
technical cleanup and rechecked in future builds.

## Release decision

This file is ready for a staging updater test. Production use requires the
staging updater flow and application smoke tests in
`UPDATE_PACKAGE_BUILD_RUNBOOK.md` to pass.

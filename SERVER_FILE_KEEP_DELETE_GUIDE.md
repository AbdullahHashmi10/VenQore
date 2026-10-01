# Clean deployment and server file retention

This is a source-repository guide, not a file to upload to production. It applies to future VenQore builds. Two Hostinger screenshots show the app directories directly under `public_html`; server file contents, symlinks, active webroot and cron/service configuration have not been inspected.

## Exact names shown in the Hostinger screenshots

Back up first. This table applies to the names shown at the top level of `public_html`, not similarly named directories inside vendor packages.

| Decision | Names in screenshots |
|---|---|
| KEEP | `app`, `bootstrap`, `config`, `database`, `public`, `resources`, `routes`, `storage`, `vendor`, `.env`, `.htaccess`, `index.php`, `artisan`, `composer.json`, `composer.lock`, `AMD_POS_VERSION.txt` |
| KEEP for now: Node SSR/build dependency metadata | `package.json`, `package-lock.json`. Optional SSR can require the package module type and Node dependencies. |
| REMOVE from live app after backup: editor/build configuration and design notes | `.editorconfig`, `.eslintrc.json`, `.gitattributes`, `.gitignore`, `.mcp.json`, `.oxlintrc.json`, `components.json`, `DESIGN-RULES.md`, `jsconfig.json`, `jsrepo.config.json`, `jsrepo.config.ts`, `phpunit.xml.dist`, `postcss.config.cjs`, `tailwind.config.js`, `vite.config.js`, `vite.pos.config.js`, `race1.err`, `race2.err`. Builds/tests must then run from the development checkout. |
| MOVE outside public_html: deployment/build tooling | `build_clean_release.ps1`, `deploy.sh`, `deploy_production.sh`, `deploy`, `scripts`. Check cron/automation first and update any paths; retain them in the source repository. |
| REMOVE after backup if these contain the same development/reference material as this checkout | `extras`, `tests`. Inspect their contents for server-only uploads first. |
| CONDITIONAL: remove only when retiring development diagnostics on production | `Tester`. Admin SmokeTestController and DemoStoreController and verification CLI commands refer to it. Core POS does not require the test suite, but those diagnostics do. |
| INSPECT first | `staging`: recently modified and unknown contents. It could be an active test release, recovery copy, or upload workspace. Verify no running operation, subdomain or symlink uses it, then archive it outside the webroot or remove. |
| REMOVE from public_html after keeping a local/private copy and confirming no update is processing it | `AMD_POS_Update_v6.0.7.zip`. This is the blocked archive; do not extract it over the live app. |

Preserve hidden hosting files not visible in these screenshots. A smaller updater ZIP will not automatically remove the existing extras listed above.

## Can all domain files except .env be deleted?

No. Keeping MySQL preserves database rows, but files stored on disk are separate. This application stores private/public uploads, backup archives, local R2 fallback objects and installation state on disk. Partner support also writes directly to `public/uploads/attachments`. Deleting those files cannot be repaired by keeping MySQL or .env.

A clean replacement of application code during maintenance is possible after preserving the items below and preparing a complete deployment layout. Existing tenant accounts and records remain in the same MySQL database; the same APP_KEY must be retained for encrypted data. Cookies/sessions and offline clients still require upgrade testing. Do not run the installer or `migrate:fresh`, reset or demo seed commands against the existing database.

The updater ZIP is rooted at the Laravel application directory (the directory with `artisan`). It does not contain the domain-root `index.php` and `.htaccess` wrappers. In this checkout the domain wrapper can point at `app-code/main-app/public`, while a standalone deployment uses `public`. Bootstrap uses the app's `.env`, so preserving an unrelated domain-root `.env` alone is insufficient. Do not assume extracting this ZIP directly into an empty `public_html` recreates the hosting layout.

## Preserve before replacing code

Paths below are relative to the actual Laravel app root unless marked otherwise.

| Item | Action and reason |
|---|---|
| Actual app `.env`, APP_KEY, any server-managed secrets/keys | Preserve exactly; do not generate a new key. |
| Entire `storage/` directory | Preserve during this first cleanup, including `app/private`, `app/public`, `app/r2`, backups, sessions and `storage/installed`. Selective cache cleanup can happen later. |
| `public/uploads/` | Preserve; contains partner support attachments. |
| `public/storage` | Inspect whether it is a symlink or real directory. Preserve any actual data and recreate its link to preserved `storage/app/public`. |
| `public/downloads/*.exe` | Keep the current installer separately. Upload manually only when changed, or restore it during a clean deployment. |
| Domain-root `index.php`, `.htaccess`, host configuration, `.user.ini`, `.well-known`, verification files and custom mappings | Back up and adapt to the chosen new layout; do not assume the update ZIP replaces them. |
| MySQL database and a restorable backup | Keep the existing database. Review/rehearse pending migrations; code rollback alone cannot undo database changes. |
| Queue/scheduler/Reverb/SSR service configuration | Preserve and repoint/restart as needed for the new application path. |

## Runtime code/assets to retain or replace from the verified release

Keep `app`, `bootstrap` (including SSR output if enabled), `config`, database migrations and required seed/content resources, `routes`, production `vendor`, `artisan`, Composer metadata and release metadata. Keep `resources/views`, `resources/data`, `resources/docs`, and content read by application code. Keep `public/index.php`, `public/.htaccess`, `public/build`, images/fonts/scripts/styles, service workers and other required public assets.

`public/v6/assets/` IS used by current React pages: site header/footer load its logo, and the homepage and marketing pages load its scripts, CSS and fonts. Keep it. Current routes render React pages, so the old `public/v6/*.html`, `public/v6/_ds` and `public/v6/support.js` are excluded from new packages. A dormant V6PageController still refers to old HTML, but no current route/caller uses it; reintroducing it requires revisiting the packaging rule.

`public/downloads/venqore-sync/` is a required WooCommerce plugin download. It stays in the updater ZIP. Do not remove the whole downloads directory just because Windows EXEs are delivered separately.

## Confirmed package exclusions / server cleanup candidates

The updated builder removes these from staging and checks the final extracted ZIP. For existing servers, remove only matching paths after a full backup and confirmation that the deployed version uses the current React routes:

- `public/v6/*.html`, `public/v6/_ds/`, `public/v6/support.js` (keep `public/v6/assets/`).
- `public/animated/`, `public/_ds/`, old `public/index.html`, old `public/support.js`.
- `public/images/icons/README.md`, `public/images/logo_original_backup.png`, `public/venqore_dashboard_mockup_1776055918038.png`.
- `resources/js/tests/`, root `Tester/`, `tests/`, `extras/`, development `docs/`, IDE/Git metadata. The development coverage-reporting command and admin smoke/demo test tools need the source checkout; do not use them as production health checks after removing tests. Node dependencies are excluded from the web ZIP; preserve/install the required Node runtime dependencies separately if SSR is enabled.
- Local `database/*.sqlite*` files: never packaged. Delete a server copy only after confirming active configuration uses MySQL and it is not an external application's database.
- Old release ZIPs, source exports, spreadsheets, mockups and repository archives: move off the webroot after backup and individual identification. Do not blindly delete unfamiliar directories or another application's files.

`resources/docs` and `database/seeders/blog-articles` contain Markdown read by live docs/blog functionality. Preserve them. Keep dependency runtime data and license notices; blanket deletion by `.md`, `.xlsx`, `.json`, or a `Tester` substring can break content or vendor classes. The builder preserves production Composer dependencies as installed.

## One-time clean deployment sequence

1. Identify the current domain document root, actual app root, active .env and storage paths, symlinks and worker configuration. Inventory actual server files before any deletion.
2. Back up all current files outside the served directory and create/verify a MySQL backup. Prepare and test the new release beside the existing one with a staging database copy.
3. Establish a maintenance response that remains available while application files change. Pause/drain jobs and scheduled writes; take a final consistent data backup/sync.
4. Attach the preserved .env, storage, direct public uploads and separate installer to the new release. Configure the correct webroot (prefer the app's `public` directory), links, ownership and writable paths. Keep private app files inaccessible over HTTP.
5. Run reviewed pending migrations against the existing MySQL database, rebuild appropriate caches and restart the enabled workers. Do not reinstall or reseed tenants.
6. Switch the domain to the prepared release, verify login, representative tenants, sales, uploads, marketing pages, downloads and background jobs, then reopen traffic.
7. Retain the previous release and backups until verification is complete. Remove identified non-runtime artifacts afterward. A failed migration may require database recovery, not merely switching code back.

The current in-app updater overwrites files and does not delete old extras. Omitting a directory from future ZIPs will not clean its existing server copy. Use the controlled cleanup above for the first clean baseline; use the updater only after its exact live-to-new upgrade and recovery have been rehearsed. A smaller ZIP alone does not establish deployment safety.

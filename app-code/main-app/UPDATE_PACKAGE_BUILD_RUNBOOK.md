# VenQore update package build runbook

This is the required process for every web update ZIP. It creates the same kind
of runtime-only overlay package as version 6.1.0.

## Source of truth

- Run the canonical builder: `bundle_for_update.ps1`.
- Package boundaries are enforced by `release-package-boundary.ps1`.
- Follow `RELEASE_AND_DEPLOYMENT_POLICY.md` and
  `SERVER_FILE_KEEP_DELETE_GUIDE.md`.
- The version inside the ZIP is authoritative. A legacy version file elsewhere
  in the repository must not be used to name or validate the package.

## Required package boundary

The ZIP contains the Laravel runtime, production Composer dependencies,
compiled browser assets, SSR output, migrations, routes, storage directory
scaffolding, `AMD_POS_VERSION.txt`, and `release-manifest.json`.

It must not contain:

- `.env` or any server secret;
- SQLite databases, journals, or local database files;
- tests, Tester helpers, design references, mockups, extras, or source docs;
- `node_modules`, Git data, IDE files, logs, caches, sessions, uploads, or locks;
- build scripts and frontend configuration files;
- Windows `.exe` files. The Windows Station installer is released separately
  and is listed as an external asset in `release-manifest.json`.

The ZIP must be smaller than 120,000,000 bytes. The builder must fail if a
boundary or size rule is broken.

## Preconditions

1. Work from `app-code/main-app`.
2. Use the intended source revision and review `git status --short`.
3. Prefer a clean worktree. Do not use `-AllowDirty` automatically.
4. Confirm PHP, Composer, Node.js, npm, and PowerShell are available.
5. Run the relevant automated tests for the changes being released.
6. Choose a new semantic version that has never been published.
7. Confirm no ZIP with that version already exists.

## Build command

From PowerShell:

```powershell
cd "E:\AMD POS\AMD POS\app-code\main-app"
powershell -NoProfile -ExecutionPolicy Bypass -File .\bundle_for_update.ps1 -Version "X.Y.Z"
```

If the owner explicitly wants the current uncommitted workspace snapshot, use:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\bundle_for_update.ps1 -Version "X.Y.Z" -AllowDirty
```

`-Force` is only for replacing an unpublished artifact during the same build
session after a failed validation or packaging correction. Never overwrite a
version that has been uploaded or installed.

## What the builder must do

1. Read and record the Git revision and dirty state.
2. Create a fresh isolated temporary staging directory.
3. Copy the approved application source into staging.
4. Install Composer dependencies from `composer.lock` with `--no-dev` and an
   optimized autoloader.
5. Run Laravel package discovery and generate Ziggy routes.
6. Compile the browser and SSR bundles from source with `npm run build`.
7. Verify every Vite manifest target exists.
8. remove secrets, runtime state, SQLite files, uploads, tests, Tester helpers,
   design references, mockups, developer tools, and every `.exe`.
9. Preserve required runtime and marketing assets.
10. Write the exact version marker and `release-manifest.json`.
11. Create the candidate ZIP and enforce the 120,000,000 byte limit.
12. Extract the ZIP into a second clean directory.
13. Boot the packaged Composer autoloader in a fresh PHP process.
14. Verify compiled CSS has no raw Tailwind directives.
15. Verify all eager Composer autoload files exist and Composer metadata has
    `dev: false`.
16. Recheck the package boundary after extraction.
17. Publish the ZIP only after every gate passes, then print its size and
    SHA-256 checksum.

## Required release record

For every version, record:

- version and build date;
- ZIP path, byte size, and SHA-256;
- source Git revision and whether the source was dirty;
- test and build results;
- migrations added since the previous released ZIP;
- build warnings;
- external assets excluded from the ZIP;
- classification: `ARTIFACT VALIDATED FOR STAGING`.

## Staging updater test

The builder proves archive integrity; it does not prove the web updater or the
production environment. Test every new package on a staging copy first.

1. Use a staging application and production-like MySQL schema.
2. Preserve staging `.env`, storage uploads, and database.
3. Upload the ZIP through the updater.
4. Confirm upload, checksum/token validation, extraction, migrations, cache
   rebuild, version recording, lock cleanup, and maintenance-mode exit.
5. Confirm `AMD_POS_VERSION.txt` reports the new version.
6. Confirm `php artisan migrate:status` shows no pending migration.
7. Test login, dashboard, POS sale, receipt printing, customer PDF download,
   public assets, queues, scheduled work, and error logs.
8. Confirm the updater lock is absent after success.

If the updater fails, do not repeatedly retry on production. Capture its error
and lock state, correct the updater, and repeat the staging test.

## Controlled SSH/manual installation fallback

Use this only after a backup exists and the package has passed staging. The ZIP
is an overlay: extract it over the application root. Do not delete `.env`,
storage uploads, hosting entrypoints, installer state, or the database.

```bash
cd ~/domains/venqore.com/public_html
php artisan down
# Extract the validated ZIP over this directory using the hosting file manager
# or a reviewed unzip command.
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan view:cache
php artisan event:cache
php artisan up
php artisan migrate:status | grep Pending
```

An empty final command output means no migration remains pending. Then verify
the version marker, login, POS, printing, PDFs, and logs.

## Rollback triggers

Stop and roll back application files if there are repeated HTTP 500 responses,
broken authentication, missing compiled assets, unusable POS checkout, broken
printing/PDF output, a stuck updater lock, or a failed migration. Restoring code
does not reverse database migrations; use the matching database backup when a
migration changed data or schema.

## Copy-paste instruction for the IDE

> Create the next VenQore web updater package by following
> `app-code/main-app/UPDATE_PACKAGE_BUILD_RUNBOOK.md` exactly. Use
> `bundle_for_update.ps1` and `release-package-boundary.ps1`; do not create an
> ad hoc ZIP. Start from a reviewed clean worktree unless the owner explicitly
> authorizes `-AllowDirty`. Run relevant tests, build in isolated staging,
> enforce the runtime-only boundary and 120,000,000-byte limit, extract and
> validate the candidate, calculate SHA-256, and create a release record. Do
> not include `.env`, SQLite, tests, Tester helpers, design/mock files, uploads,
> caches, developer tooling, or any `.exe`. Classify the result as `ARTIFACT
> VALIDATED FOR STAGING`; do not call it production-ready until the updater and
> application smoke tests pass on staging.

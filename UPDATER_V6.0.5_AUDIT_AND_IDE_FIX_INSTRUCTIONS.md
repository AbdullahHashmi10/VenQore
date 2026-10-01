# Version 6.0.5 updater and release builder audit

Audit date: 2026-09-30. **Release decision: DO NOT UPLOAD the current 6.0.5 ZIP to production.**

The packaged Composer autoloader fails in an isolated PHP 8.2.23 process. The browser updater also has recovery and concurrency defects. Fixing the package alone does not establish a safe live upgrade. The current updater deliberately serves HTTP 503 during the upload and deployment, so it cannot satisfy a strict requirement for no visible downtime.

This document is the implementation handoff requested by the owner. Application source and the existing ZIP were not modified during this audit. Audit scripts and evidence were added under `scratch/updater-audit-2026-09-30/`. No production deployment, production database access, or migration execution was performed.

## Package examined and verification results

File: `app-code/main-app/AMD_POS_Update_v6.0.5.zip`

SHA-256: `C220DB4F93625BB5537C0EB39A572740652FB35E1413BAAD6EA98912BFF694E4`

| Check | Observed result |
|---|---|
| ZIP version marker | 6.0.5, released 2026-09-30 |
| Compressed size | 64,806,317 bytes |
| Uncompressed entry size total | 202,910,448 bytes; this is not a safe free-space requirement including staging, backups, and runtime headroom |
| Archive entries | 19,683 |
| Read/decompress every entry | Passed; not a signature/authenticity check |
| Duplicate entry names | None |
| Vite manifest | 626 entries; all declared file, CSS, asset, import, and dynamic-import references resolve within the package |
| Built frontend files | 633 entries under `public/build/assets/` |
| Root `.env`, `public/hot`, runtime `storage/` | Not included |
| Cached PHP files in `bootstrap/cache/` | Not included |
| Composer eager autoload files | **8 referenced files missing** |
| Composer installed metadata | Still declares `dev: true`; 33 listed package directories are absent |
| Actual isolated autoload execution | **FAILED**, missing `vendor/myclabs/deep-copy/src/DeepCopy/deep_copy.php` |
| Database migration files | 384 |
| Comparison with available root 6.0.3 ZIP | 14 new migration files and 13 modified historical migration files |

The packaged controller, Composer lock, and frontend manifest were hash-compared with their current source counterparts and matched. This does not prove that every frontend source file was compiled into the assets, or that the live server matches the local source or the available 6.0.3 archive.

Evidence: `scratch/updater-audit-2026-09-30/package-evidence.json`, `boot-evidence.json`, and `migrations-v6.0.3-to-v6.0.5.txt`. The live version, PHP/database versions, hosting controls, migration history, and production environment settings remain unverified.

## Confirmed findings

### 1. Critical: the builder creates an incomplete dependency package

`app-code/main-app/bundle_for_update.ps1:140` removes development dependency directories after copying the developer's existing `vendor/`, but retains the Composer autoload files and installed metadata generated for those dependencies. It does not rebuild the production dependency installation.

The eight missing files include deep-copy, PHPUnit, Pest, and Mockery bootstrap files. `vendor/composer/autoload_real.php:41` requires these automatically. Loading the packaged `vendor/autoload.php` failed before Laravel bootstrap, with no environment file or database involved.

On a production installation that does not retain these old development dependencies, subsequent web and Artisan requests can fail immediately after extraction. An existing server that happens to contain leftover files might mask this defect; that is not a release guarantee.

### 2. Critical: failure can reopen a partially updated application

`UpdaterController.php:636` writes individual files directly into the active application. There is no complete release staging, atomic activation, or automatic restoration of the prior release.

`UpdaterController.php:217–226` catches failures, disables maintenance, and releases the lock. A migration failure or a late extraction failure therefore allows traffic to reach new files with an incomplete schema or a mixed file set. The comments promising a held lock after a schema failure do not match this catch block.

`PreventAccessDuringUpdate.php:45–66` also removes an old lock without verifying a successful deployment or rollback. `resetLock()` unconditionally unlocks. These mechanisms restore access, not correctness.

### 3. High: extraction can succeed with missing or unwritten files

`UpdaterController.php:622–640` catches individual write failures and increments an error counter. `File::put()` return values are not verified. At lines 696–719 the controller returns HTTP success even when errors occurred, and the browser advances to migration, cache, and version steps.

The post-extraction manifest check only tests whether a manifest exists on the target. An old manifest can satisfy that check even if the new package lacks a usable frontend. Archive validation before writes only requires `artisan` and `composer.json`. The ZIP is deleted before the application is proven healthy.

### 4. High: the concurrency lock does not protect the whole deployment

`UpdaterController.php:249–291` uses a check-then-write lock and clears any lock whose stored step is `uploading_chunks`, or which is at least five minutes old. The controller writes `uploading_chunks` once and never advances that state during extraction or migrations. A second upload can therefore replace an active operation's lock and shared ZIP.

The global exception handler can also release another operation's lock after rejecting a competing request. Middleware uses a different 30-minute age rule. Lock ownership and operation transitions are not enforced.

### 5. High: 6.0.3-to-6.0.5 can disable the updater between requests

The available 6.0.3 ZIP has `env('VQ_WEB_UPDATER', true)` in `config/venqore.php`; 6.0.5 changes the default to `false` at line 75. `UpdaterLock.php:16` rejects requests before checking the operation token when the feature is disabled.

If the live environment lacks an explicit setting and currently relies on the old default, extraction and cache deletion can make the next migration request return 404. This is conditional on the real live configuration; it has not been inspected. Preserve the secure disabled default and resolve this through an explicit, restricted deployment configuration or a deployment mechanism independent of the running application.

The advertised session-independent recovery also has a gap: `routes/web.php:1118–1123` puts `auth` before `UpdaterLock`, so a valid operation token cannot rescue a request rejected by session authentication. Other web middleware also runs before the route handler. Do not remove authentication broadly to fix this.

### 6. High: every update invokes unrelated accounting migration and demo rebuild work

`UpdaterController.php:766` invokes `migrate:v3-ledger` on every deployment, before checking the schema migration exit code. Its return value is ignored. `MigrateV3Ledger.php` reads data across tenants, falls back to accounts without a tenant filter, changes the authenticated user via `loginUsingId`, and inserts journal entries/items without supplying `tenant_id`. It catches per-record failures and can finish with exit code zero. These are concrete code concerns; no financial data was changed or database outcome tested during this audit.

The updater also invokes `demo:restore --force` whenever there are pending migrations, with `demo:full-deploy` as a fallback. That command wipes and seeds demo data and may run for a long time. Its execution is coupled to the customer deployment request. The frontend stops waiting after 180 seconds while the PHP request may continue. Automatic retries can overlap an operation still running on the server.

### 7. High: no server-enforced completion or health gate

The `run()` endpoint accepts any named step, with no persisted prerequisite checks. The version step trusts `new_version` from the browser instead of a validated package manifest and can release the lock without proof of extraction, migrations, or health. Several Artisan cache/discovery commands ignore nonzero exit codes. A returned HTTP success is therefore insufficient evidence of a successful release.

The updater has no worker drain/restart step. Queued jobs and scheduled processes can continue using old code or operate during schema changes. A web maintenance middleware does not stop them or requests already in flight. The middleware also explicitly exempts attendance routes.

### 8. High: the current design creates downtime, even on a successful run

The first upload chunk creates `storage/update.lock`. The global middleware returns 503 for ordinary application requests while it exists, including the whole upload, extraction, migration, demo work, and cache rebuild interval. The browser must stay open to issue each next step.

The application framework and Composer autoloader initialize before this custom middleware can protect a request, so overwriting active dependencies is especially risky. A stale-lock timeout cannot fix a broken boot path.

### 9. Builder validation is incomplete

`bundle_for_update.ps1:26–28` comments out the preflight execution. The script copies existing frontend output rather than proving a fresh build. It checks only that `public/build` exists, ignores robocopy failure exit codes, does not pin paths to `$PSScriptRoot`, and does not validate the supplied version before using it in staging/output paths. It has no clean-package boot gate or complete artifact inventory.

`publish_release.ps1` and `deploy.sh` generate Ziggy after the frontend build. If generated route data is compiled into assets, regeneration after building cannot update those assets. The updater's own `ziggy:generate` similarly cannot rebuild already compiled JavaScript. Generate required frontend inputs before compilation and verify the actual route-consumption mechanism.

Do not substitute `build_clean_release.ps1` or `build_release.ps1` as a quick fix. They have different packaging contracts; the former excludes vendor and the latter is an older full-install builder with environment/storage handling. The existing `deploy.sh` also mutates the running checkout and restores availability on failure without automatic release rollback. It is not an audited zero-downtime alternative.

## Instructions for the IDE

Implement the following as release-blocking work. Preserve other in-progress source changes. Do not deploy, run migrations against production, regenerate the live application key, or overwrite live environment/runtime data as part of this task.

### A. Replace dependency pruning with a clean production build

1. Make `bundle_for_update.ps1` the explicit update-package entry point or replace it with one documented equivalent. Resolve paths from the script location, validate semantic version input, create an isolated staging directory, and validate all cleanup targets are inside that staging directory. Use terminating errors and check every external process exit code; robocopy codes 8 and above are failures.
2. Assemble the runtime source into staging. Install dependencies there from the committed `composer.lock` using `composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader`. Do not copy and manually prune the developer's vendor directory. Ensure Composer hooks run only against a controlled build environment; if scripts are deferred, explicitly execute and verify the required discovery steps before validation. Do not run database-changing setup scripts.
3. Build frontend assets from locked dependencies and the same source snapshot. Generate required route inputs before `npm run build`. Use a clean output directory and fail if asset generation or reference validation fails. Record the source revision plus any intentionally included uncommitted changes, tool versions, lockfile hashes, and build commands in release metadata.
4. Keep `.env*` secrets, application keys, database files, logs, uploads, sessions, runtime caches, `public/hot`, server storage links, and workstation artifacts out of the update archive. Preserve any intentional safe example files through an explicit allowlist. Preserve required webserver dotfiles. Include server-rendering output if the deployed configuration uses it, and document its runtime/restart requirements.
5. Create a release manifest with version, supported upgrade range, runtime requirements, file sizes and SHA-256 hashes, and migration inventory. Reject missing or extra files relative to the release contract. Validate ZIP paths and size limits before extraction.
6. Extract the finished ZIP into an empty directory and run `require vendor/autoload.php`, platform requirement checks, and a fresh Laravel boot with disposable configuration. Do not validate only the source tree. Fail the build if eager autoload or installed metadata references absent dependencies, package discovery fails, or frontend references are missing. Use a build runtime matching production, including Linux case sensitivity where applicable.
7. Publish the final ZIP only after validation passes; use a temporary output filename until then. Produce a checksum and test report. Use a new patch version, such as 6.0.6 if available, so the rejected artifact cannot be confused with the repaired one.

### B. Make update execution recoverable and enforce its state on the server

1. Use a persisted deployment record with an operation ID, package hash, trusted version, owner, heartbeat, explicit phase, failure details, and previous release. Make acquisition atomic. Reject another upload/deployment with 409 and never release another operation's lock.
2. Separate upload and validation from activation: uploading a package must not put customers into maintenance. Validate all entries, runtime compatibility, disk space, permissions, complete dependency boot, and frontend references in staging before changing active files.
3. Run deployment in a supervised server process independent of browser requests. The browser starts the operation and polls durable status; closing it, losing the session, a 504, or polling again must not restart or duplicate work. Use scoped operation credentials with appropriate expiration/authorization; keep platform authentication, MFA, and CSRF protections intact.
4. Prefer immutable release directories with a single atomic activation pointer, shared protected runtime state, and a retained prior release. Ensure old in-flight requests resolve consistently to the old release. If the host cannot support that deployment model, implement a verified maintenance deployment with file rollback and clearly state its measured downtime; it does not meet the owner's strict no-downtime requirement.
5. Once any live mutation begins, keep the deployment in a failed/recovery state on errors. Restore a known-good release and pass health checks before reopening traffic. An expired lock or 'Force Unlock' must not expose a mixed release. Remove automatic deletion of unrelated native maintenance state. Provide recovery outside the application boot path.
6. Treat failed file reads/writes, hash mismatches, failed required Artisan commands, and schema/health failures as hard failures. Preserve the package, previous release, and operation logs for recovery. Never show success solely because the endpoint returned 200.
7. Enforce legal phase order on the server. Derive the installed version from verified release metadata only after migrations, activation, fresh-process health checks, and worker checks pass. Reject direct version/cache/migrate calls that do not belong to the active authorized operation.
8. Add handling for worker drain/restart, scheduler coordination, in-flight web requests, OPcache, and any Horizon/Reverb/SSR processes actually enabled on the host. Do not restart optional services blindly. Keep previous hashed assets available long enough for open browser sessions, while defining deliberate cleanup of obsolete application code within immutable releases.
9. If PclZip remains supported, test it. The current controller calls `$zip->close()` unconditionally even on the PclZip branch. Use the correct cleanup per backend or make ZipArchive an explicit preflight requirement.

### C. Remove unrelated data work from normal updates

1. Remove unconditional `migrate:v3-ledger`, demo restore, full demo deployment, and snapshot generation from the generic release transaction. Do not execute any backfill after `migrate` has failed.
2. If a specific version really needs an accounting backfill, implement a separately reviewed, tenant-scoped, checkpointed, idempotent operation with transactions, accurate failure exit codes, reconciled before/after results, and an explicit version guard. Use the canonical ledger services. Do not switch the operator's session or use another tenant's accounts as a fallback.
3. Refresh demo data through a separate controlled operation after application readiness, with tenant isolation and failure reporting. Customer availability must not depend on generating years of demonstration data.

### D. Prove database upgrade compatibility and rollback

1. Obtain the actual live version/build hash, migration ledger, schema, database engine/version, PHP version/extensions, deployment topology, `VQ_WEB_UPDATER` state, queue/scheduler setup, and session/cache configuration. Do not infer these from local version markers.
2. Compare all changed historical migrations listed in the evidence file. Already-applied migrations will not run again. Classify each modification; where the new code needs a schema/data correction, create a new forward migration rather than relying on edits to an old file.
3. Rehearse from a protected staging copy of the actual live schema/data, with payment, email, webhook, and other external side effects disabled or redirected to sandboxes. A fresh empty database is insufficient.
4. Check duplicate non-null `(tenant_id, idempotency_key)` values before adding `sales_tenant_idempotency_unique`; stop and report conflicts without deleting transactions. Test the `tenant_users` column alterations and new tables against production types and data sizes. Measure migration lock times.
5. For deployment without visible downtime, use additive/compatible migrations first, keep both application versions compatible during activation, and postpone destructive/schema-contract changes. A symlink switch alone does not make blocking database operations safe.
6. Verify backups can actually be restored. Define code rollback separately from database rollback. Do not assume `migrate:rollback` reverses all changes: some migrations deliberately have no-op `down()` methods, and others delete newly created tables. Restoring an old database after traffic resumes can lose new transactions, so it cannot be the routine automatic rollback strategy.

### E. Release acceptance tests

The repaired build is not approved until the following tests pass with saved evidence:

| Scenario | Required outcome |
|---|---|
| Fresh extraction of the final ZIP | Composer autoload, platform checks, package discovery, Laravel boot, and frontend references pass without leftover files |
| Exact live-version upgrade on staging | Migrations, platform login/MFA, tenant login, dashboard, POS sale/payment, receipt, stock, ledger, reports, approvals, and enabled new features pass |
| Data preservation | Customer/business counts and reconciliation totals are unchanged except documented migrations and deliberate smoke-test transactions; uploads, sessions, `.env`, APP_KEY and installed state are preserved |
| Browser/session loss or 504 during deployment | Server operation continues safely; polling reconnects to the same operation; no duplicate extraction or migrations |
| Two concurrent uploads/deployments | One owner; second operation rejected; first operation's package/token/lock remains intact |
| Missing asset, corrupted file, incompatible PHP, insufficient disk, permission failure | Rejected before activation; old application remains usable |
| Forced file-copy failure | No green success; no partially updated application exposed |
| Migration failure or killed deployment process | Durable failed state and proven recovery/rollback; no timeout-based blind unlock |
| Direct out-of-order step or version call | Rejected; installed version and active release do not change |
| Upgrade from old updater with absent `VQ_WEB_UPDATER` | No mid-deployment 404; migration path/bootstrap procedure validated without weakening security defaults |
| Workers and open customer sessions | Jobs use the intended release; no duplicate posting; old tabs and assets remain usable across activation |
| Rollback after failed readiness | Previous release operates correctly with the current database; no lost customer writes |
| Availability under representative load | Measure errors, request latency, and migration lock time through deployment; meet the owner's explicitly agreed downtime target |

For the first repaired deployment, account for the OLD updater that executes the initial upload/extraction. Putting fixes inside a new ZIP does not make the old extraction request safe. Use a separately validated deployment mechanism or a narrowly scoped, tested bootstrap/hotfix procedure with recovery outside Laravel. Do not send the repaired ZIP through the old production updater and assume the new safeguards were active from the start.

Deliver back: changed files, new release version/checksum, clean-artifact test logs, actual staging upgrade results, failure-injection results, measured availability, and a verified rollback procedure. Until those exist, the release remains blocked.

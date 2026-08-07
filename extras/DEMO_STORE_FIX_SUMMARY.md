# Demo Store — Fix Summary & Next Steps

All code changes below are done and saved in the repo. Two things still require running commands on an actual PHP/MySQL machine (your XAMPP box or the server) — this sandbox has no PHP runtime to execute them. Instructions are at the bottom.

## What was actually wrong (revised from the earlier diagnosis)

Digging into the seeders during the fix, one part of my original diagnosis was wrong and is corrected here: `DemoSalesSeeder` does NOT bypass accounting — it goes through the real `SaleService` → `AccountingService`, which creates proper balanced `journal_entries` + `journal_items` per sale. The seeder itself was fine all along.

The actual bug was narrower and worse in a different way: `DemoSnapshot`/`DemoRestore`'s hand-maintained table lists never included `journal_items`, `sales`, `sale_items`, `purchases`, `stocks`, `expenses`, or `transactions` at all. So every snapshot silently discarded most of what the seeder correctly built, and every restore replayed a hollow subset. Combined with `demo:restore` creating a brand-new unflagged tenant every time no Golden Master existed (because the snapshot's `is_golden_master` field was serialized as `false`), repeated failed updates produced a pile of duplicate, unflagged "demo" tenants — which is why `/demo` 404'd on the server and why updates made it worse.

## Code changes made

**New files:**
- `app/Services/DemoStoreService.php` — single source of truth for resolving/bootstrapping the Golden Master tenant (`goldenMaster()`), the complete list of tenant-scoped tables (`TENANT_DATA_TABLES`), and a `healthCheck()` that verifies sales exist and every `journal_entry` has matching `journal_items`.
- `app/Console/Commands/DemoCleanupDuplicates.php` — one-off repair command (`demo:cleanup-duplicates`) that finds and merges duplicate demo tenants left behind by the old bug, including soft-deleted ones (`withTrashed()`), and flags exactly one as Golden Master.
- `app/Jobs/DeployDemoStoreJob.php` — runs `demo:full-deploy` / `demo:restore` as a queued job instead of a `Symfony\Process` subprocess. Writes to the same log-file/cache contract the existing dashboard terminal widget already polls, so no frontend changes were needed for that part.
- `app/Jobs/QueueHeartbeatJob.php` — dispatched every minute by the scheduler; its cache write is the signal `DemoStoreController` uses to detect whether a queue worker is actually running.
- `deploy/venqore-queue-worker.supervisor.conf` — supervisor config (plus a cron-only fallback in comments) for actually running `php artisan queue:work` continuously on the server.

**Modified:**
- `app/Console/Commands/DemoSnapshot.php` — uses the shared table list, refuses to snapshot an unhealthy tenant (loud error instead of baking in a broken baseline).
- `app/Console/Commands/DemoRestore.php` — uses the shared table list; force-flags `is_golden_master=true` on the tenant regardless of snapshot payload; never creates a duplicate if one already exists; applies a date offset so restored data looks recent; verifies health after restoring.
- `app/Console/Commands/FullDemoDeployCommand.php` — delegates tenant resolution to `DemoStoreService::goldenMaster()`; fixed the wipe table list (was missing `transactions`, `transaction_allocations`, `payment_allocations`, `stock_movements`, `sale_item_batches`, and referenced four tables that don't exist); runs a health check at the end and fails loudly if unhealthy.
- `app/Console/Commands/ResetDemoStore.php` — now calls `demo:restore` (fast snapshot replay) instead of always forcing a full 5-year reseed; self-heals instead of erroring when no tenant exists yet.
- `app/Http/Controllers/DemoController.php` — `login()` self-heals the tenant row instead of `firstOrFail()`'ing into a 404; sends visitors to a friendly "being prepared" message if the store has no seeded data yet instead of crashing.
- `app/Http/Controllers/Admin/DemoStoreController.php` — `deploy()`/`reset()` dispatch `DeployDemoStoreJob` instead of spawning a subprocess (this is the actual fix for "can't seed on the server", since `proc_open` is commonly blocked there); falls back to running the job inline if no queue worker heartbeat is detected, so the button never just hangs; `runTests()` (Page Health) now checks `file_exists(vendor/bin/pest)` first and returns a clear 501 instead of spawning a doomed process.
- `app/Http/Controllers/UpdaterController.php` — auto-restore hook now verifies the restore actually produced a healthy tenant and surfaces a warning in the JSON response (not just the log file) if not; `storage/demo-snapshots/` added to the updater's protected-paths list so an update package can never clobber the live snapshot.
- `resources/js/Pages/Updater/Index.jsx` — displays the new `demo_warning` field from the migrations step, with a distinct amber "warning" log color.
- `resources/js/Components/SuperAdmin/DemoStoreTab.jsx` — disables/labels the "Run Page Tests" button when the backend reports `pest_available: false`; properly detects the 501 response instead of polling a job that was never created.
- `routes/console.php` — nightly job changed from `demo:reset` (full generative reseed) to `demo:restore` (fast snapshot replay); weekly `demo:full-deploy` now followed by `demo:snapshot` 20 minutes later so the freshly generated data becomes the new baseline every week; added the `QueueHeartbeatJob` schedule.

## What still needs to run on your real machine

I don't have a PHP/MySQL runtime in this environment — only file access. Run these on your XAMPP box (matches the earlier session's `E:\Software\xampp\php\php.exe`) or the server, in this order:

```bash
# 1. Repair any duplicate demo tenants left behind by the old bug (safe to run even if there's only one — it just flags it)
php artisan demo:cleanup-duplicates --dry-run   # look first
php artisan demo:cleanup-duplicates --force     # then actually do it

# 2. Regenerate a correct, complete 5-year dataset with the fixed seeder/wipe logic
php artisan demo:full-deploy

# 3. Snapshot it as the new Golden Master baseline (this is what nightly demo:restore will replay from now on)
php artisan demo:snapshot

# 4. Sanity-check the result
php artisan tinker --execute="dd(\App\Services\DemoStoreService::healthCheck(\App\Models\Tenant::where('is_golden_master', true)->first()->id))"

# 5. Try a restore end-to-end to make sure it round-trips correctly
php artisan demo:restore
```

Then on the actual server (venqore.com), also:

1. Set up a queue worker — either install the supervisor config at `deploy/venqore-queue-worker.supervisor.conf`, or add the cron-only fallback documented in its comments. Without this, deploy/reset will keep working (via the inline fallback) but won't get the non-blocking benefit, and the dashboard will show `queue_worker_ok: false`.
2. Confirm `* * * * * php artisan schedule:run` is in the server's crontab — without it, nothing scheduled in `routes/console.php` (nightly restore, weekly reseed+snapshot, heartbeat) ever fires.
3. `git pull` + `npm run build` to actually deploy this code.
4. Visit `/VenQore?view=demo` and use "Create & Deploy Demo Store" if no Golden Master exists yet, or "Quick Reset" otherwise.

## Note on scope

I did not change `TenantCloner` (used for per-visitor ephemeral demo sandboxes, not the shared Golden Master) even though it has a similar incomplete table list — it wasn't part of what you reported broken, but it's worth a follow-up pass if per-visitor sandbox sessions ever look incomplete.

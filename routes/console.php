<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// â”€â”€ Existing schedules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
\Illuminate\Support\Facades\Schedule::command('amd:sync-stock')
    ->everyFiveMinutes()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));
\Illuminate\Support\Facades\Schedule::command('parked-sales:cleanup')->hourly();
\Illuminate\Support\Facades\Schedule::command('staff:generate-daily-summaries')->dailyAt('00:05');
\Illuminate\Support\Facades\Schedule::command('growth:analyze')->dailyAt('09:00');

// Free Tools program — prunes generated artifacts older than 24h (plan §4.6)
\Illuminate\Support\Facades\Schedule::command('tools:prune-artifacts')->daily();
\Illuminate\Support\Facades\Schedule::command('finance:audit')
    ->hourly()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// â”€â”€ Phase 2.4: Tenant Lifecycle Automation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sends day-7 and day-2 reminder emails to tenants still on trial
\Illuminate\Support\Facades\Schedule::command('tenants:send-trial-reminders')
    ->dailyAt('09:00')
    ->withoutOverlapping()
    ->onOneServer();

// â”€â”€ Gift Access Links / Subscription Expiry Reminders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sends day-7 and day-2 reminder emails before subscription_ends_at lapses
// (real subscriptions AND gift-granted access alike). Mail-only â€” never
// locks anything; the actual lock is on-demand in TenantMiddleware.
\Illuminate\Support\Facades\Schedule::command('tenants:send-subscription-expiry-reminders')
    ->dailyAt('09:15')
    ->withoutOverlapping()
    ->onOneServer();

// Suspends trials that ended in the past hour and sends expiry emails
\Illuminate\Support\Facades\Schedule::command('tenants:process-expired-trials')
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// â”€â”€ Phase 2.5: Dead Account Cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Permanently deletes data for tenants cancelled/suspended 60+ days ago
// Runs at 03:00 on the 1st of every month (low-traffic window)
\Illuminate\Support\Facades\Schedule::command('tenants:cleanup-dead-accounts', ['--no-interaction' => true])
    ->monthlyOn(1, '03:00')
    ->withoutOverlapping()
    ->onOneServer();

// â”€â”€ Phase 6.2: Demo Tenant Nightly Reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Resets demo.venqore.com to a clean state every night at 04:00.
// Demo credentials: demo@venqore.com / demo1234
//
// Changed from `demo:reset` (which called demo:full-deploy, a generative
// 5-year reseed) to `demo:restore` (fast snapshot replay). Nightly full
// reseeds were slow, and — because the old wipe list in
// FullDemoDeployCommand didn't cover every tenant-scoped table — each run
// left orphan rows behind, so the demo drifted further from a clean state
// over time instead of actually resetting. demo:restore wipes using the
// complete, schema-verified table list (DemoStoreService::TENANT_DATA_TABLES)
// and replays a known-good snapshot, so every night starts from the exact
// same baseline.
\Illuminate\Support\Facades\Schedule::command('demo:restore')
    ->dailyAt('04:00')
    ->withoutOverlapping()
    ->onOneServer();

// â”€â”€ Phase 6.3: Demo Full Deploy â€” Weekly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Every Sunday at 03:00 AM â€” full nuclear re-seed with 5-year data,
// immediately followed by demo:snapshot so the freshly generated data
// (with today's date as the new "most recent" anchor) becomes the new
// Golden Master baseline that the nightly demo:restore above replays all
// week. This is the ONLY place the heavy generative seed still runs
// automatically; every other reset/restore is a fast snapshot replay.
\Illuminate\Support\Facades\Schedule::command('demo:full-deploy')
    ->weeklyOn(0, '03:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

\Illuminate\Support\Facades\Schedule::command('demo:snapshot')
    ->weeklyOn(0, '03:20') // 20 min after full-deploy kicks off — should be done by then
    ->withoutOverlapping()
    ->onOneServer()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// â”€â”€ Queue Worker Heartbeat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Dispatches a trivial queued job every minute so DemoStoreController can
// tell whether a queue worker (php artisan queue:work / Horizon) is
// actually running on this server. If no worker is configured, the
// heartbeat cache key goes stale and demo deploy/reset falls back to
// running inline instead of hanging forever waiting on a queue nobody is
// draining. See app/Jobs/QueueHeartbeatJob.php.
\Illuminate\Support\Facades\Schedule::job(new \App\Jobs\QueueHeartbeatJob())
    ->everyMinute();

// â”€â”€ Phase 6.4: Expired Demo Session Cleanup â€” Hourly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sweeps ephemeral per-visitor demo tenant clones (is_demo=true,
// is_golden_master=false) whose demo_expires_at has passed. Without this,
// expired clones accumulated indefinitely — CleanExpiredDemoSessions existed
// as a command but was never scheduled, which also increased the odds of
// Tenant::where('is_demo', true)->first() (elsewhere in the codebase, now
// fixed to use is_golden_master) resolving to a stale expired clone instead
// of the real Golden Master.
\Illuminate\Support\Facades\Schedule::command('demo:cleanup')
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer();


// â”€â”€ WooCommerce Sync â€” Scheduler (Safety Net) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Runs every 15 minutes to catch anything webhooks missed.
// Each active connection gets its own SchedulerPollingJob dispatched.
\Illuminate\Support\Facades\Schedule::command('woo:sync-all')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->onOneServer()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// â”€â”€ Recurring Invoice Generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
\Illuminate\Support\Facades\Schedule::command('recurring-invoices:generate')
    ->dailyAt('00:01')
    ->withoutOverlapping()
    ->onOneServer()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// â”€â”€ Close Inactive Chat Sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
\Illuminate\Support\Facades\Schedule::command('chat:close-inactive')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();

// â”€â”€ Automated Google Drive backups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
\Illuminate\Support\Facades\Schedule::command('backup:google-drive')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// â”€â”€ Daily Sales Summary Mailing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
\Illuminate\Support\Facades\Schedule::command('sales:send-daily-summary')
    ->dailyAt('00:10')
    ->withoutOverlapping()
    ->onOneServer();

// â”€â”€ Daily Low Stock Alerts Mailing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
\Illuminate\Support\Facades\Schedule::command('inventory:send-low-stock-alerts')
    ->dailyAt('09:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// â”€â”€ Weekly Business Summary Mailing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
\Illuminate\Support\Facades\Schedule::command('sales:send-weekly-summary')
    ->weeklyOn(1, '08:00')
    ->withoutOverlapping()
    ->onOneServer();

// â”€â”€ Payment Reminder Mailing â€” Daily â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sends payment reminder emails to customers with outstanding invoices
// older than the payment_reminder_days setting (default: 7 days).
\Illuminate\Support\Facades\Schedule::command('invoices:send-payment-reminders')
    ->dailyAt('10:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// â”€â”€ Service Reminders â€” Daily â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Checks each tenant's service_reminders list and fires email for any
// reminder whose interval has elapsed since it was last sent.
\Illuminate\Support\Facades\Schedule::command('services:send-reminders')
    ->dailyAt('08:30')
    ->withoutOverlapping()
    ->onOneServer();



// -- Phase 11: Nightly Ledger Integrity Monitor ------------------------------
// Runs verify:ledger every night at 02:30 across ALL active tenants.
// Checks 8 invariants: TB balance, unbalanced JEs, orphaned sales,
// backdated entries, duplicate references, negative batches, inventory
// three-way tie, and cross-tenant contamination.
\Illuminate\Support\Facades\Schedule::command('verify:ledger', ['--silent' => true])
    ->dailyAt('02:30')
    ->withoutOverlapping()
    ->onOneServer()
    ->name('verify-ledger-nightly')
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// ── L007: Inventory-vs-GL Reconciliation ────────────────────────────────────
// Nightly backstop for the "balanced-but-wrong ledger" failure class.
// Compares physical inventory value against the GL Inventory Asset (1100)
// balance per tenant and alerts on any drift beyond tolerance.
\Illuminate\Support\Facades\Schedule::command('inventory:reconcile-gl')
    ->dailyAt('02:45')
    ->withoutOverlapping()
    ->onOneServer()
    ->name('inventory-gl-reconcile-nightly')
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

// ── L019: Platform database backups + restore verification ──────────────────
// Daily full backup (vq:backup) and weekly restore-verification (backup:verify).
// The google-drive sync above pushes the resulting artifacts offsite.
// emailOutputOnFailure ensures a silent scheduler gap can't recur unnoticed.
\Illuminate\Support\Facades\Schedule::command('vq:backup')
    ->dailyAt('01:30')
    ->withoutOverlapping()
    ->onOneServer()
    ->name('platform-backup-daily')
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));

\Illuminate\Support\Facades\Schedule::command('backup:verify')
    ->weeklyOn(0, '05:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->name('platform-backup-verify-weekly')
    ->emailOutputOnFailure(config('mail.from.address', 'admin@venqore.com'));


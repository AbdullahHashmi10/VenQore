<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Existing schedules ─────────────────────────────────────────────────────
\Illuminate\Support\Facades\Schedule::command('amd:sync-stock')->everyFiveMinutes();
\Illuminate\Support\Facades\Schedule::command('parked-sales:cleanup')->hourly();
\Illuminate\Support\Facades\Schedule::command('staff:generate-daily-summaries')->dailyAt('00:05');
\Illuminate\Support\Facades\Schedule::command('growth:analyze')->dailyAt('09:00');
\Illuminate\Support\Facades\Schedule::command('finance:audit')->hourly();

// ── Phase 2.4: Tenant Lifecycle Automation ────────────────────────────────
// Sends day-7 and day-2 reminder emails to tenants still on trial
\Illuminate\Support\Facades\Schedule::command('tenants:send-trial-reminders')
    ->dailyAt('09:00')
    ->withoutOverlapping()
    ->onOneServer();

// Suspends trials that ended in the past hour and sends expiry emails
\Illuminate\Support\Facades\Schedule::command('tenants:process-expired-trials')
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer();

// ── Phase 2.5: Dead Account Cleanup ──────────────────────────────────────
// Permanently deletes data for tenants cancelled/suspended 60+ days ago
// Runs at 03:00 on the 1st of every month (low-traffic window)
\Illuminate\Support\Facades\Schedule::command('tenants:cleanup-dead-accounts', ['--no-interaction' => true])
    ->monthlyOn(1, '03:00')
    ->withoutOverlapping()
    ->onOneServer();

// ── Phase 6.2: Demo Tenant Nightly Reset ─────────────────────────────────
// Resets demo.venqore.com to a clean state every night at 04:00.
// Demo credentials: demo@venqore.com / demo1234
\Illuminate\Support\Facades\Schedule::command('demo:reset', ['--force' => true])
    ->dailyAt('04:00')
    ->withoutOverlapping()
    ->onOneServer();




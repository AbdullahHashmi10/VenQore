<?php

namespace App\Console\Commands;

use App\Mail\SubscriptionExpiryReminderMail;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * SendSubscriptionExpiryReminders — Gift Access Links / subscription expiry
 *
 * Scheduled daily. Sends reminder emails to tenants with 7 or 2 days left
 * before subscription_ends_at — the same date used by both real
 * subscriptions (Lemon Squeezy) and Gift Access Links.
 *
 * IMPORTANT — this command only ever sends mail. It never locks, suspends,
 * or otherwise changes access. The actual lock is on-demand in
 * TenantMiddleware (checked the moment the tenant is next used, at zero
 * added server cost) — deliberately NOT here, so this stays a cheap, simple
 * daily mail job instead of doing double duty as an enforcement sweep.
 *
 * Mirrors SendTrialReminders exactly (same reminder-day pattern, same
 * per-tenant admin-user lookup) for a subscription/gift date instead of a
 * trial date.
 *
 * Usage: php artisan tenants:send-subscription-expiry-reminders
 */
class SendSubscriptionExpiryReminders extends Command
{
    protected $signature   = 'tenants:send-subscription-expiry-reminders';
    protected $description = 'Send reminder emails to tenants with 7 or 2 days left before subscription/gift access ends';

    public function handle(): void
    {
        $reminderDays = [7, 2];

        foreach ($reminderDays as $daysLeft) {
            // Only trial/active tenants with a real subscription_ends_at date —
            // matches exactly the condition TenantMiddleware locks on, so a
            // reminder is only ever sent for a date that will actually be
            // enforced. Excludes tenants already in view-only (they already
            // got their lock; no point warning them again).
            $tenants = Tenant::withoutTenantScope()
                ->whereIn('status', ['trial', 'active'])
                ->whereNull('view_only_since')
                ->whereNotNull('subscription_ends_at')
                ->whereDate('subscription_ends_at', now()->addDays($daysLeft)->toDateString())
                ->get();

            foreach ($tenants as $tenant) {
                $adminUser = \App\Models\User::withoutTenantScope()
                    ->where('tenant_id', $tenant->id)
                    ->where('role', 'platform_admin')
                    ->first();

                if (!$adminUser) {
                    $this->warn("No admin user for tenant {$tenant->subdomain} — skipping");
                    continue;
                }

                try {
                    Mail::to($adminUser->email)
                        ->send(new SubscriptionExpiryReminderMail($tenant, $adminUser, $daysLeft));

                    $this->info("✓ Reminder sent to {$adminUser->email} ({$daysLeft} days left)");
                    Log::info("Subscription/gift expiry reminder sent", [
                        'tenant'    => $tenant->subdomain,
                        'email'     => $adminUser->email,
                        'days_left' => $daysLeft,
                    ]);
                } catch (\Throwable $e) {
                    $this->error("✗ Failed to send to {$adminUser->email}: " . $e->getMessage());
                    Log::error("Subscription/gift expiry reminder failed", ['error' => $e->getMessage()]);
                }
            }

            $this->line("Processed {$tenants->count()} tenant(s) with {$daysLeft} day(s) remaining.");
        }
    }
}

<?php

namespace App\Console\Commands;

use App\Mail\TrialReminderMail;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * SendTrialReminders — Phase 2.4
 *
 * Scheduled daily at 09:00 UTC.
 * Sends reminder emails to tenants with 7 or 2 days left in their trial.
 *
 * Usage: php artisan tenants:send-trial-reminders
 */
class SendTrialReminders extends Command
{
    protected $signature   = 'tenants:send-trial-reminders';
    protected $description = 'Send trial reminder emails to tenants with 7 or 2 days remaining';

    public function handle(): void
    {
        // Days at which we send reminders
        $reminderDays = [7, 2];

        foreach ($reminderDays as $daysLeft) {
            // Find tenants whose trial ends exactly N days from now (within that calendar day)
            $tenants = Tenant::withoutTenantScope()
                ->where('status', 'trial')
                ->whereDate('trial_ends_at', now()->addDays($daysLeft)->toDateString())
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
                        ->send(new TrialReminderMail($tenant, $adminUser, $daysLeft));

                    $this->info("✓ Reminder sent to {$adminUser->email} ({$daysLeft} days left)");
                    Log::info("Trial reminder sent", [
                        'tenant'   => $tenant->subdomain,
                        'email'    => $adminUser->email,
                        'days_left'=> $daysLeft,
                    ]);
                } catch (\Throwable $e) {
                    $this->error("✗ Failed to send to {$adminUser->email}: " . $e->getMessage());
                    Log::error("Trial reminder failed", ['error' => $e->getMessage()]);
                }
            }

            $this->line("Processed {$tenants->count()} tenant(s) with {$daysLeft} day(s) remaining.");
        }
    }
}

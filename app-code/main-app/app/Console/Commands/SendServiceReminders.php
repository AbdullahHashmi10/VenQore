<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Mail\ServiceReminderMail;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendServiceReminders extends Command
{
    protected $signature = 'services:send-reminders {--tenant= : Run for a specific tenant ID only}';
    protected $description = 'Sends service reminder emails to store owners based on service_reminders setting intervals.';

    public function handle()
    {
        $this->info('Starting Service Reminders mailing...');

        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);
        if ($this->option('tenant')) {
            $tenantQuery->where('id', $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();
        $now = Carbon::now();

        foreach ($tenants as $tenant) {
            $this->info("🏪 Checking Tenant [{$tenant->id}] — {$tenant->name}");

            app()->instance('current.tenant', $tenant);
            SettingsHelper::clearCache();

            $email = $tenant->ownerEmail();
            if (!$email) {
                $this->line("   Skipped: No owner email.");
                continue;
            }

            // Load service_reminders JSON from settings
            $raw = SettingsHelper::get('service_reminders', null);
            if (!$raw) {
                $this->line("   Skipped: No service reminders configured.");
                continue;
            }

            $reminders = is_string($raw) ? json_decode($raw, true) : $raw;
            if (!is_array($reminders) || empty($reminders)) {
                $this->line("   Skipped: Empty service reminders list.");
                continue;
            }

            $due = [];
            $updated = false;

            foreach ($reminders as &$reminder) {
                $interval = (int) ($reminder['interval'] ?? 1);
                $unit     = $reminder['unit'] ?? 'days'; // days | months | years
                $lastSent = isset($reminder['last_sent']) ? Carbon::parse($reminder['last_sent']) : null;

                // Compute the "next due" date
                $nextDue = $lastSent
                    ? $lastSent->copy()->add($interval, $unit)
                    : $now->copy()->subSecond(); // Never sent → immediately due

                if ($now->greaterThanOrEqualTo($nextDue)) {
                    $due[] = [
                        'name'      => $reminder['name'] ?? 'Service',
                        'interval'  => $interval,
                        'unit'      => $unit,
                        'last_sent' => $lastSent ? $lastSent->toDateString() : null,
                    ];
                    // Update last_sent timestamp
                    $reminder['last_sent'] = $now->toDateTimeString();
                    $updated = true;
                }
            }
            unset($reminder);

            if (empty($due)) {
                $this->line("   No service reminders are due today.");
                continue;
            }

            try {
                Mail::to($email)->send(new ServiceReminderMail($tenant, $due));
                $this->line("   ✅ Service reminder sent to {$email} (" . count($due) . " reminders due).");

                // Persist the updated last_sent timestamps back to settings
                if ($updated) {
                    \App\Models\Setting::where('tenant_id', $tenant->id)
                        ->where('key', 'service_reminders')
                        ->update(['value' => json_encode($reminders)]);
                    $this->line("   📝 Updated last_sent timestamps in settings.");
                }
            } catch (\Exception $e) {
                $this->error("   ❌ Failed to send service reminder to {$email}: " . $e->getMessage());
            }
        }

        $this->info('Service Reminders mailing complete.');
        return 0;
    }
}

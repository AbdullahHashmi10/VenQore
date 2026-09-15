<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\DailySnapshot;
use App\Services\OwnerDailyPulseService;
use App\Mail\DailySalesSummaryMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendDailySalesSummaries extends Command
{
    protected $signature = 'sales:send-daily-summary {--date= : The date to send summary for, Y-m-d format (defaults to yesterday)} {--tenant= : Run for a specific tenant ID only}';
    protected $description = 'Sends the daily sales/performance summary email to store owners if enabled.';

    public function handle()
    {
        $dateInput = $this->option('date');
        $targetDate = $dateInput ? Carbon::parse($dateInput) : Carbon::yesterday();
        $dateString = $targetDate->toDateString();

        $this->info("Starting Daily Sales Summary mailing for date: {$dateString}");

        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $tenantQuery->where('id', $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();
        $pulseService = new OwnerDailyPulseService();

        foreach ($tenants as $tenant) {
            $this->info("🏪 Checking Tenant [{$tenant->id}] — {$tenant->name}");
            
            // Bind tenant context
            app()->instance('current.tenant', $tenant);
            \App\Helpers\SettingsHelper::clearCache();

            if (!\App\Helpers\SettingsHelper::isEnabled('daily_sales_summary')) {
                $this->line("   Skipped: 'daily_sales_summary' setting is disabled.");
                continue;
            }

            $email = $tenant->ownerEmail();
            if (!$email) {
                $this->error("   ❌ Error: No owner email found for tenant [{$tenant->id}]");
                continue;
            }

            try {
                // Get or capture the snapshot for the target date
                $snapshot = DailySnapshot::where('tenant_id', $tenant->id)
                    ->where('date', $dateString)
                    ->first();

                if (!$snapshot) {
                    $snapshot = $pulseService->captureSnapshot($tenant, $targetDate);
                }

                Mail::to($email)->send(new DailySalesSummaryMail($tenant, $snapshot, $dateString));
                $this->line("   ✅ Email successfully sent to owner: {$email}");

            } catch (\Exception $e) {
                $this->error("   ❌ Error sending summary for tenant [{$tenant->id}]: " . $e->getMessage());
            }
        }

        $this->info("Completed Daily Sales Summary mailing.");
        return 0;
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Services\OwnerDailyPulseService;
use Carbon\Carbon;

class CreateDailySnapshots extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'owner:create-daily-snapshots {--date= : The date to create snapshot for, Y-m-d format (defaults to today)} {--tenant= : Run for a specific tenant ID only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculates and records the daily health metrics snapshot for store owners.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dateInput = $this->option('date');
        $targetDate = $dateInput ? Carbon::parse($dateInput) : now();

        $this->info("Starting Daily Snapshot capture for date: {$targetDate->toDateString()}");

        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $tenantQuery->where('id', (int) $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();
        $pulseService = new OwnerDailyPulseService();

        foreach ($tenants as $tenant) {
            $this->info("🏪 Processing Tenant [{$tenant->id}] — {$tenant->name}");
            try {
                $snapshot = $pulseService->captureSnapshot($tenant, $targetDate);
                $this->line("   ✅ Snapshot saved (Sales: {$snapshot->sales_value}, Expenses: {$snapshot->expense_value}, Cash: {$snapshot->cash_value})");
            } catch (\Exception $e) {
                $this->error("   ❌ Error processing tenant [{$tenant->id}]: " . $e->getMessage());
            }
        }

        $this->info("Completed Daily Snapshot capture.");
        return 0;
    }
}

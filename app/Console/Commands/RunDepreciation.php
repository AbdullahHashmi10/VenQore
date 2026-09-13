<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RunDepreciation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'finance:depreciate {--tenant= : Run for a specific tenant ID only} {--date= : Custom date for depreciation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculate and post daily depreciation for fixed assets';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $date = $this->option('date') ? Carbon::parse($this->option('date')) : Carbon::now();

        $tenantQuery = \App\Models\Tenant::whereIn('status', ['active', 'trial']);
        if ($this->option('tenant')) {
            $tenantQuery->where('id', $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();

        foreach ($tenants as $tenant) {
            app()->instance('current.tenant', $tenant);

            if (!\App\Services\ModuleService::enabled($tenant, 'fixed_assets')) {
                $this->line("   Skipping Tenant [{$tenant->id}] — 'fixed_assets' module disabled.");
                continue;
            }

            $this->info("Processing Tenant [{$tenant->id}] — {$tenant->name}");

            // 1. Find Depreciation Expense Account
            $expenseAccount = Account::firstOrCreate(
                ['name' => 'Depreciation Expense', 'type' => 'expense'],
                ['code' => '6000-DEP', 'is_active' => true, 'balance' => 0]
            );

            // 2. Find Fixed Assets with > 0 balance and rate > 0
            $assets = Account::where('type', 'asset')
                ->where('depreciation_rate', '>', 0)
                ->where('balance', '>', 0)
                ->get();

            if ($assets->isEmpty()) {
                $this->info("   No depreciable assets found for Tenant [{$tenant->id}].");
                continue;
            }

            DB::beginTransaction();
            try {
                $totalDepreciation = 0;
                $journalLines = [];

                foreach ($assets as $asset) {
                    $annualDepreciation = $asset->balance * ($asset->depreciation_rate / 100);
                    $dailyDepreciation = round($annualDepreciation / 365, 2);

                    if ($dailyDepreciation <= 0) {
                        continue;
                    }

                    $journalLines[] = [
                        'account_id' => $asset->id,
                        'debit'      => 0,
                        'credit'     => $dailyDepreciation,
                    ];

                    $asset->decrement('balance', $dailyDepreciation);
                    $totalDepreciation += $dailyDepreciation;
                }

                if ($totalDepreciation > 0) {
                    $journalLines[] = [
                        'account_id' => $expenseAccount->id,
                        'debit'      => $totalDepreciation,
                        'credit'     => 0,
                    ];

                    app(\App\Engines\AccountingService::class)->createEntry([
                        'date'           => $date->toDateString(),
                        'reference_type' => 'manual',
                        'reference'      => 'DEP-' . $date->format('Ymd'),
                        'description'    => 'Daily Depreciation Run',
                    ], $journalLines);

                    $expenseAccount->increment('balance', $totalDepreciation);

                    DB::commit();
                    $this->info("   Posted depreciation of " . number_format($totalDepreciation, 2));
                } else {
                    DB::rollBack();
                    $this->info("   Depreciation amount too small to post.");
                }
            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("   Failed for Tenant [{$tenant->id}]: " . $e->getMessage());
            }
        }
    }
}

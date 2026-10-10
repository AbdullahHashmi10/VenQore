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
     * One day's depreciation in paisa: balance × rate% ÷ 365, worked out on
     * the exact stored decimals and rounded half-up to the paisa once.
     */
    public static function dailyMinor($balance, $ratePercent): int
    {
        $b = \App\Support\Money::parse($balance, 'balance', false);
        $r = \App\Support\Money::parse($ratePercent, 'rate', false);
        // paisa = balance × 100 × rate / 100 / 365 = balance × rate / 365
        return $b->multipliedBy($r)->dividedBy(365, 0, \Brick\Math\RoundingMode::HALF_UP)->toInt();
    }

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

            // One run per tenant per day: a scheduler retry or a second manual
            // run must not depreciate the same day twice.
            $reference = 'DEP-' . $date->format('Ymd');
            if (DB::table('journal_entries')->where('tenant_id', $tenant->id)->where('reference', $reference)->exists()) {
                $this->info("   Depreciation for {$date->toDateString()} is already posted ({$reference}).");
                continue;
            }

            DB::beginTransaction();
            try {
                $totalDepreciation = 0;
                $totalDepreciationM = 0;
                $journalLines = [];

                foreach ($assets as $asset) {
                    $dailyM = self::dailyMinor($asset->balance ?? 0, $asset->depreciation_rate ?? 0);
                    $dailyDepreciation = \App\Support\Money::toFloat($dailyM);

                    if ($dailyDepreciation <= 0) {
                        continue;
                    }

                    $journalLines[] = [
                        'account_id' => $asset->id,
                        'debit'      => 0,
                        'credit'     => $dailyDepreciation,
                    ];

                    $asset->decrement('balance', $dailyDepreciation);
                    $totalDepreciationM += $dailyM;
                    $totalDepreciation = \App\Support\Money::toFloat($totalDepreciationM);
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
                        'reference'      => $reference,
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

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
    protected $signature = 'finance:depreciate {--date= : Custom date for depreciation}';

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
        $endOfYear = $date->copy()->endOfYear();

        // We assume this runs daily or we calculate per run.
        // For simplicity: Annual Rate / 365 = Daily Rate
        // Logic: Debit "Depreciation Expense", Credit "Accumulated Depreciation" (or the Asset itself directly if simplified)

        // 1. Find Depreciation Expense Account
        $expenseAccount = Account::firstOrCreate(
            ['name' => 'Depreciation Expense', 'type' => 'expense'],
            ['code' => '6000-DEP', 'is_active' => true, 'balance' => 0]
        );

        // 2. Find Fixed Assets with > 0 balance and rate > 0
        $assets = Account::where('type', 'asset') // Ideally 'fixed_asset' type if available
            ->where('depreciation_rate', '>', 0)
            ->where('balance', '>', 0)
            ->get();

        if ($assets->isEmpty()) {
            $this->info('No depreciable assets found.');
            return;
        }

        DB::beginTransaction();
        try {
            $totalDepreciation = 0;
            $journalItems = [];

            // Master Journal Entry
            $entry = JournalEntry::create([
                'date' => $date,
                'reference' => 'DEP-' . $date->format('Ymd'),
                'description' => 'Daily Depreciation Run',
                'amount' => 0 // Will update
            ]);

            foreach ($assets as $asset) {
                // Annual Depreciation Amount = Balance * (Rate / 100)
                // Daily Depreciation = Annual / 365
                $annualDepreciation = $asset->balance * ($asset->depreciation_rate / 100);
                $dailyDepreciation = round($annualDepreciation / 365, 2);

                if ($dailyDepreciation <= 0)
                    continue;

                // Credit Asset (Value goes down)
                $journalItems[] = [
                    'journal_entry_id' => $entry->id,
                    'account_id' => $asset->id,
                    'debit' => 0,
                    'credit' => $dailyDepreciation,
                    'description' => "Depreciation for {$asset->name}",
                    'created_at' => now(),
                    'updated_at' => now()
                ];

                // Update Asset Balance
                $asset->decrement('balance', $dailyDepreciation);

                $totalDepreciation += $dailyDepreciation;
            }

            if ($totalDepreciation > 0) {
                // Debit Expense
                $journalItems[] = new JournalItem([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $expenseAccount->id,
                    'debit' => $totalDepreciation,
                    'credit' => 0,
                    'description' => 'Total Daily Depreciation',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // Bulk insert items (except the object one, JournalItem::insert doesn't work with object mix easily, better loop)
                foreach ($journalItems as $item) {
                    if (is_array($item)) {
                        JournalItem::create($item);
                    } else {
                        $item->save();
                    }
                }

                $entry->update(['amount' => $totalDepreciation]);

                // Update Expense Balance
                $expenseAccount->increment('balance', $totalDepreciation);

                DB::commit();
                $this->info("Posted depreciation of " . number_format($totalDepreciation, 2));
            } else {
                DB::rollBack();
                $this->info("Depreciation amount too small to post.");
            }

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Failed: " . $e->getMessage());
        }
    }
}

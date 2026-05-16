<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RunShadowMigration extends Command
{
    protected $signature = 'migrate:shadow';
    protected $description = 'Runs strict mathematical validation on all legacy sales and dumps anomalies into Account 3999';

    public function handle()
    {
        $this->info("Starting Shadow Migration...");

        // Note: Account 3999 creation shifted inside the loop to be per-tenant

        $logFile = storage_path('logs/migration_anomalies.txt');
        file_put_contents($logFile, "=== Start Shadow Migration ===\n");
        
        $errorCount = 0;
        $varianceCount = 0;
        $processed = 0;
        $totalVarianceAmount = 0;

        $systemUser = DB::table('users')->first();

        DB::table('sales')->orderBy('id')->chunk(500, function ($sales) use (&$errorCount, &$varianceCount, &$processed, &$totalVarianceAmount, $logFile, $systemUser) {
            foreach ($sales as $sale) {
                try {
                    $tenantId = $sale->tenant_id;

                    // Ensure Account 3999 exists for this specific tenant
                    $varianceAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '3999')->first();
                    if (!$varianceAccount) {
                        DB::table('accounts')->insert([
                            'id' => Str::uuid()->toString(),
                            'tenant_id' => $tenantId,
                            'name' => 'Historical Migration Variance',
                            'code' => '3999',
                            'type' => 'equity',
                            'balance' => 0,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $varianceAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '3999')->first();
                    }

                    // 1. Math check on line items
                    $items = DB::table('sale_items')->where('sale_id', $sale->id)->get();
                    $calculatedSubtotal = 0;
                    
                    foreach ($items as $item) {
                        $calculatedSubtotal += (float)$item->line_total;
                        
                        // Let's also verify if line_total == gross - discount
                        $mathLineTotal = round((float)$item->gross_amount - (float)$item->discount_amount, 4);
                        if (abs($mathLineTotal - (float)$item->line_total) > 0.001) {
                            file_put_contents($logFile, "Item ID {$item->id} math failure: Gross - Discount ({$mathLineTotal}) != Line Total ({$item->line_total})\n", FILE_APPEND);
                        }
                    }

                    // 2. Strict Mathematical Constraint Check
                    // Expected gross is the sum of line totals
                    // Expected net is gross - global_discount
                    $mathNetSales = max(0, $calculatedSubtotal - (float)$sale->global_discount);
                    // Expected invoice total
                    $mathTotal = $mathNetSales + (float)$sale->total_tax + (float)$sale->shipping_charges;

                    // The historical total on record
                    $historicalTotal = (float)$sale->invoice_total;

                    // Variance is what the legacy system charged vs what the strict math says.
                    // If Variance > 0, it means legacy system overcharged.
                    $variance = round($historicalTotal - $mathTotal, 4);

                    if (abs($variance) > 0.001) {
                        $varianceCount++;
                        $totalVarianceAmount += abs($variance);
                        $msg = "Sale {$sale->id} (Ref: {$sale->reference_number}) Variance: Historical Total = {$historicalTotal}, Math Total = {$mathTotal}, Diff = {$variance}\n";
                        file_put_contents($logFile, $msg, FILE_APPEND);

                        // If variance is positive, we need a Credit to Account 3999.
                        // If variance is negative, we need a Debit to Account 3999.
                        // Only insert if not already there.
                        $exists = DB::table('journal_entries')
                            ->where('tenant_id', $tenantId)
                            ->where('source_id', $sale->id)
                            ->where('source_type', 'sale_variance_dump')
                            ->exists();
                        if (!$exists) {
                            $jeId = Str::uuid()->toString();
                            DB::table('journal_entries')->insert([
                                'id' => $jeId,
                                'tenant_id' => $tenantId,
                                'date' => $sale->created_at ?? now(),
                                'reference' => $sale->reference_number ?? 'MIG-VAR',
                                'description' => "Migration Variance Dump for Sale {$sale->id}",
                                'source_type' => 'sale_variance_dump',
                                'source_id' => $sale->id,
                                'user_id' => $systemUser ? $systemUser->id : null,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            
                            $absVar = abs($variance);
                            if ($variance > 0) {
                                // Missing credit to balance
                                DB::table('journal_items')->insert([
                                    ['id' => Str::uuid()->toString(), 'tenant_id' => $tenantId, 'journal_entry_id' => $jeId, 'account_id' => $varianceAccount->id, 'debit' => 0, 'credit' => $absVar, 'description' => 'Historical Variance (Positive)', 'created_at' => now(), 'updated_at'=>now()],
                                ]);
                            } else {
                                // Missing debit to balance
                                DB::table('journal_items')->insert([
                                    ['id' => Str::uuid()->toString(), 'tenant_id' => $tenantId, 'journal_entry_id' => $jeId, 'account_id' => $varianceAccount->id, 'debit' => $absVar, 'credit' => 0, 'description' => 'Historical Variance (Negative)', 'created_at' => now(), 'updated_at'=>now()],
                                ]);
                            }
                        }
                    }

                    $processed++;

                } catch (\Exception $e) {
                    $errorCount++;
                    $msg = "Exception on Sale ID: {$sale->id}. Error: " . $e->getMessage() . "\n";
                    file_put_contents($logFile, $msg, FILE_APPEND);
                }
            }
        });

        $this->info("Shadow Migration completed.");
        $summary = "Summary:
- Total Sales Processed: {$processed}
- Total Anomalies/Variances: {$varianceCount} (Total Value: Rs. {$totalVarianceAmount})
- Total Orphan Exceptions: {$errorCount}\n";
        
        $this->info($summary);
        file_put_contents(storage_path('logs/migration_summary.txt'), $summary);
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // We will process sales that haven't been migrated yet.
        // Get the default account IDs
        $arAccount = DB::table('accounts')->where('code', '1200')->first();
        $revAccount = DB::table('accounts')->where('code', '4000')->first();
        $varianceAccount = DB::table('accounts')->where('code', '3999')->first();

        // ─── Anomaly Logger ─────────────────────────────────
        $logFile = storage_path('logs/migration_anomalies.txt');
        file_put_contents($logFile, "=== Start Migration Phase 1.1 ===\n", FILE_APPEND);
        
        $errorCount = 0;
        $varianceCount = 0;
        $processed = 0;

        DB::table('sales')->where('net_sales', 0)->orderBy('id')->chunk(500, function ($sales) use (&$errorCount, &$varianceCount, &$processed, $logFile, $arAccount, $revAccount, $varianceAccount) {
            foreach ($sales as $sale) {
                DB::beginTransaction();
                try {
                    // Step 1: Backfill sale_items
                    $items = DB::table('sale_items')->where('sale_id', $sale->id)->get();
                    $calculatedSubtotal = 0;
                    
                    foreach ($items as $item) {
                        $qty = $item->quantity + ($item->free_quantity ?? 0);
                        $grossStr = bcmul((string)$item->unit_price, (string)$qty, 4);
                        $grossAmt = (float)$grossStr;
                        
                        $oldSubtotal = (float)$item->subtotal;
                        
                        // New derived values
                        $netAmount = $oldSubtotal > 0 ? $oldSubtotal : bcmul((string)$item->unit_price, (string)$item->quantity, 4);
                        $netAmount = (float)$netAmount;
                        
                        $discountAmt = max(0, $grossAmt - $netAmount);
                        
                        DB::table('sale_items')->where('id', $item->id)->update([
                            'gross_amount'    => $grossAmt,
                            'discount_amount' => $discountAmt,
                            'net_amount'      => $netAmount,
                            'tax_rate'        => 0,
                            'tax_amount'      => 0,
                            'line_total'      => $netAmount
                        ]);
                        
                        $calculatedSubtotal += $netAmount;
                    }

                    // Step 2: Calculate Header
                    $oldTotal = (float)$sale->total;
                    $oldSub = (float)$sale->subtotal;
                    $globalDiscount = (float)$sale->discount;
                    $tax = (float)$sale->tax;

                    // Theoretical Net Sales based purely on items
                    $mathNetSales = max(0, $calculatedSubtotal - $globalDiscount);
                    
                    // Theoretical Total based on math
                    $mathTotal = $mathNetSales + $tax;

                    // Variance computation
                    $variance = round($oldTotal - $mathTotal, 4);

                    // Update Sale Header WITHOUT altering historical total
                    DB::table('sales')->where('id', $sale->id)->update([
                        'subtotal_gross'       => $calculatedSubtotal,
                        'total_item_discounts' => 0,
                        'global_discount'      => $globalDiscount,
                        'net_sales'            => $mathNetSales,
                        'total_tax'            => $tax,
                        'shipping_charges'     => 0,
                        'invoice_total'        => $oldTotal // Preserving historical total per client's request
                    ]);

                    // Step 3: Handle Mathematical Variance
                    if (abs($variance) > 0.001) {
                        $varianceCount++;
                        $msg = "Variance found on Sale ID: {$sale->id}. Math: {$mathTotal}, Historical: {$oldTotal}, Variance: {$variance}\n";
                        file_put_contents($logFile, $msg, FILE_APPEND);

                        // Dump into Account 3999.
                        // If variance > 0 (Old Total > Math Total), we need a Credit to balance the extra AR debit.
                        // Since new system logic assumes Revenue = MathNetSales, we post the variance difference 
                        // so that (Revenue + Variance) = AR
                        if ($varianceAccount) {
                            $jeId = Str::uuid()->toString();
                            DB::table('journal_entries')->insert([
                                'id' => $jeId,
                                'date' => $sale->created_at ?? now(),
                                'reference' => $sale->reference_number ?? 'MIG-VAR',
                                'description' => "Migration Variance Dump for Sale {$sale->id}",
                                'source_type' => 'sale_variance',
                                'source_id' => $sale->id,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            
                            $absVar = abs($variance);
                            if ($variance > 0) {
                                // Missing credit to balance
                                DB::table('journal_items')->insert([
                                    ['id' => Str::uuid()->toString(), 'journal_entry_id' => $jeId, 'account_id' => $varianceAccount->id, 'debit' => 0, 'credit' => $absVar, 'description' => 'Historical Variance (Positive)'],
                                ]);
                            } else {
                                // Missing debit to balance
                                DB::table('journal_items')->insert([
                                    ['id' => Str::uuid()->toString(), 'journal_entry_id' => $jeId, 'account_id' => $varianceAccount->id, 'debit' => $absVar, 'credit' => 0, 'description' => 'Historical Variance (Negative)'],
                                ]);
                            }
                        }
                    }

                    $processed++;
                    DB::commit();

                } catch (\Exception $e) {
                    DB::rollBack();
                    $errorCount++;
                    $msg = "Exception on Sale ID: {$sale->id}. Error: " . $e->getMessage() . "\n";
                    file_put_contents($logFile, $msg, FILE_APPEND);
                }
            }
        });

        // Store result for reading later
        $summary = "Migration finished. Processed: {$processed}. Errors: {$errorCount}. Variances: {$varianceCount}.\n";
        file_put_contents(storage_path('logs/migration_summary.txt'), $summary);
    }

    public function down(): void
    {
        // Reversal
        DB::table('sale_items')->update([
            'gross_amount' => 0, 'discount_amount' => 0, 'net_amount' => 0,
            'tax_rate' => 0, 'tax_amount' => 0, 'line_total' => 0
        ]);

        DB::table('sales')->update([
            'subtotal_gross' => 0, 'total_item_discounts' => 0, 'global_discount' => 0,
            'net_sales' => 0, 'total_tax' => 0, 'shipping_charges' => 0, 'invoice_total' => 0
        ]);
        
        DB::table('journal_entries')->where('source_type', 'sale_variance')->delete();
    }
};

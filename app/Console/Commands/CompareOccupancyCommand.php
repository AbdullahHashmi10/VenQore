<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Position;
use App\Models\Occupancy;

class CompareOccupancyCommand extends Command
{
    protected $signature = 'vq:compare-occupancy';
    protected $description = 'Perform shadow audit comparing legacy tables/parked sales to unified positions/occupancies';

    public function handle(): int
    {
        $this->info("Starting Occupancy Shadow Comparison...");

        $mismatches = [];
        $tablesChecked = 0;
        $salesChecked = 0;

        // 1. Audit Restaurant Tables -> Positions/Occupancies
        if (DB::connection()->getSchemaBuilder()->hasTable('restaurant_tables')) {
            $tables = DB::table('restaurant_tables')->get();
            foreach ($tables as $table) {
                $tablesChecked++;
                $pos = Position::where('tenant_id', $table->tenant_id)
                    ->where('source_type', 'restaurant_table')
                    ->where('source_id', $table->id)
                    ->first();

                if (!$pos) {
                    $mismatches[] = "Table #{$table->id} (No. {$table->table_number}) has no corresponding Position record.";
                    continue;
                }

                // Check active occupancy
                $activeOcc = Occupancy::where('tenant_id', $table->tenant_id)
                    ->where('position_id', $pos->id)
                    ->whereNull('closed_at')
                    ->first();

                if ($table->status === 'occupied' && !$activeOcc) {
                    $mismatches[] = "Table #{$table->id} status is 'occupied' but Position #{$pos->id} has no active occupancy.";
                } elseif ($table->status !== 'occupied' && $activeOcc) {
                    $mismatches[] = "Table #{$table->id} status is '{$table->status}' but Position #{$pos->id} has active occupancy ID #{$activeOcc->id}.";
                }
            }
        }

        // 2. Audit Parked Sales -> Occupancies
        if (DB::connection()->getSchemaBuilder()->hasTable('parked_sales')) {
            $sales = DB::table('parked_sales')
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
                })
                ->get();

            foreach ($sales as $sale) {
                $salesChecked++;
                $occ = Occupancy::where('tenant_id', $sale->tenant_id)
                    ->where('source_type', 'parked_sale')
                    ->where('source_id', $sale->id)
                    ->first();

                if (!$occ) {
                    $mismatches[] = "Parked Sale #{$sale->id} has no corresponding Occupancy record.";
                    continue;
                }

                // Compare customer name
                $expectedLabel = $sale->customer_name ?? 'Parked Cart';
                if ($occ->label !== $expectedLabel) {
                    $mismatches[] = "Parked Sale #{$sale->id} customer name '{$expectedLabel}' does not match Occupancy label '{$occ->label}'.";
                }
            }
        }

        $this->info("Audited {$tablesChecked} restaurant tables and {$salesChecked} parked sales.");

        if (empty($mismatches)) {
            $this->info("SUCCESS: Shadow comparison passed with 0 mismatches!");
            return 0;
        }

        $this->error("FAILED: Found " . count($mismatches) . " mismatches:");
        foreach ($mismatches as $err) {
            $this->line("- {$err}");
        }

        return 1;
    }
}

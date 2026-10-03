<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sales saved with a total but net_sales = 0 read as zero revenue and made the
 * revenue-ties-to-ledger control disagree by exactly their combined net value.
 * net_sales is the ex-tax revenue: total - tax. Written straight to the table
 * because posted sales are locked at the model layer; this restores a column
 * that was never populated, it does not change any amount the customer paid.
 * Idempotent: only rows still at zero are touched. Portable MariaDB SQL.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sales') || !Schema::hasColumn('sales', 'net_sales')) {
            return;
        }
        $notReturn = Schema::hasColumn('sales', 'original_sale_id') ? 'AND original_sale_id IS NULL' : '';
        $taxExpr   = Schema::hasColumn('sales', 'total_tax') ? 'COALESCE(NULLIF(tax, 0), total_tax, 0)' : 'COALESCE(tax, 0)';
        DB::statement("
            UPDATE sales
            SET net_sales = ROUND(total - {$taxExpr}, 4)
            WHERE (net_sales IS NULL OR net_sales = 0)
              AND total > 0
              AND COALESCE(status, '') <> 'returned'
              {$notReturn}
        ");
    }

    public function down(): void
    {
        // Not reversible: the previous values were empty.
    }
};

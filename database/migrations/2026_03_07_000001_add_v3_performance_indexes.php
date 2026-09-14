<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // journal_items — the most queried table in the system
        Schema::table('journal_items', function (Blueprint $table) {
            // Used by AccountingService::getBalance() and all report queries
            $table->index(['account_id', 'journal_entry_id'],
                          'idx_ji_account_entry');
            // Used by party ledger and snapshot rebuild
            $table->index(['party_id'],
                          'idx_ji_party');
        });

        // journal_entries — date range queries in every report
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->index(['date', 'is_reversed'],
                          'idx_je_date_reversed');
            $table->index(['reference_type', 'reference'],
                          'idx_je_reference');
            $table->index(['party_id', 'date'],
                          'idx_je_party_date');
        });

        // inventory_batches — FIFO ordering is always product+warehouse+date
        Schema::table('inventory_batches', function (Blueprint $table) {
            $table->index(
                ['product_id', 'warehouse_id', 'remaining_qty', 'created_at'],
                'idx_ib_fifo'
            );
        });

        // payment_allocations — badge rebuild and over-allocation checks
        Schema::table('payment_allocations', function (Blueprint $table) {
            $table->index(['sale_id', 'status'],     'idx_pa_sale_status');
            $table->index(['purchase_id', 'status'], 'idx_pa_purchase_status');
        });

        // sales — payment status queries and date range reports
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['party_id', 'payment_status'], 'idx_sales_party_status');
            $table->index(['created_at', 'status'],       'idx_sales_date_status');
        });

        // sale_item_batches — COGS reconciliation query
        Schema::table('sale_item_batches', function (Blueprint $table) {
            $table->index(['inventory_batch_id', 'is_reversed'],
                          'idx_sib_batch_reversed');
        });
    }

    public function down(): void
    {
        Schema::table('journal_items',      fn($t) => $t->dropIndex('idx_ji_account_entry'));
        Schema::table('journal_items',      fn($t) => $t->dropIndex('idx_ji_party'));
        Schema::table('journal_entries',    fn($t) => $t->dropIndex('idx_je_date_reversed'));
        Schema::table('journal_entries',    fn($t) => $t->dropIndex('idx_je_reference'));
        Schema::table('journal_entries',    fn($t) => $t->dropIndex('idx_je_party_date'));
        Schema::table('inventory_batches',  fn($t) => $t->dropIndex('idx_ib_fifo'));
        Schema::table('payment_allocations',fn($t) => $t->dropIndex('idx_pa_sale_status'));
        Schema::table('payment_allocations',fn($t) => $t->dropIndex('idx_pa_purchase_status'));
        Schema::table('sales',              fn($t) => $t->dropIndex('idx_sales_party_status'));
        Schema::table('sales',              fn($t) => $t->dropIndex('idx_sales_date_status'));
        Schema::table('sale_item_batches',  fn($t) => $t->dropIndex('idx_sib_batch_reversed'));
    }
};

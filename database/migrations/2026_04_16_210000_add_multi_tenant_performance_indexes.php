<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * T2.1 Performance Optimization — Multi-Tenant Composite Indexes.
 * 
 * Adding composite indexes for (tenant_id, ...) on frequently queried tables.
 * Without these, MySQL does sequential table scans for every tenant-scoped query,
 * causing the slowness observed in the POS and Dashboard.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Products search and listing
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index(['tenant_id', 'deleted_at'], 'idx_products_tenant_scope');
                $table->index(['tenant_id', 'category_id', 'deleted_at'], 'idx_products_tenant_cat');
            });
        }

        // 2. Sales history and reporting
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->index(['tenant_id', 'status', 'posted_at', 'deleted_at'], 'idx_sales_tenant_posted');
                $table->index(['tenant_id', 'party_id', 'deleted_at'], 'idx_sales_tenant_party');
            });
        }

        // 3. Journal Entry lookups
        if (Schema::hasTable('journal_entries')) {
            Schema::table('journal_entries', function (Blueprint $table) {
                $table->index(['tenant_id', 'reference', 'reference_type'], 'idx_journal_entries_ref');
            });
        }

        // 4. Journal Item line lookup
        if (Schema::hasTable('journal_items')) {
            Schema::table('journal_items', function (Blueprint $table) {
                $table->index(['tenant_id', 'journal_entry_id'], 'idx_journal_items_entry');
                $table->index(['tenant_id', 'account_id', 'party_id'], 'idx_journal_items_acc_party');
            });
        }

        // 5. FIFO Batch filtering (CRITICAL for POS speed)
        if (Schema::hasTable('inventory_batches')) {
            Schema::table('inventory_batches', function (Blueprint $table) {
                $table->index(['tenant_id', 'product_id', 'warehouse_id', 'remaining_qty'], 'idx_inv_batches_fifo');
            });
        }

        // 6. Party/Customer lookup
        if (Schema::hasTable('parties')) {
            Schema::table('parties', function (Blueprint $table) {
                $table->index(['tenant_id', 'type', 'deleted_at'], 'idx_parties_tenant_type');
            });
        }

        // 7. Account resolution
        if (Schema::hasTable('accounts')) {
            Schema::table('accounts', function (Blueprint $table) {
                $table->index(['tenant_id', 'code', 'deleted_at'], 'idx_accounts_tenant_code');
            });
        }

        // 8. Payments and Sale Items
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->index(['tenant_id', 'sale_id'], 'idx_payments_tenant_sale');
            });
        }
        if (Schema::hasTable('sale_items')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->index(['tenant_id', 'sale_id'], 'idx_sale_items_tenant_sale');
            });
        }

        // 9. Stock status
        if (Schema::hasTable('stocks')) {
            Schema::table('stocks', function (Blueprint $table) {
                $table->index(['tenant_id', 'product_id', 'warehouse_id'], 'idx_stocks_tenant_lookup');
            });
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) { $table->dropIndex('idx_products_tenant_scope'); $table->dropIndex('idx_products_tenant_cat'); });
        Schema::table('sales', function (Blueprint $table) { $table->dropIndex('idx_sales_tenant_posted'); $table->dropIndex('idx_sales_tenant_party'); });
        Schema::table('journal_entries', function (Blueprint $table) { $table->dropIndex('idx_journal_entries_ref'); });
        Schema::table('journal_items', function (Blueprint $table) { $table->dropIndex('idx_journal_items_entry'); $table->dropIndex('idx_journal_items_acc_party'); });
        Schema::table('inventory_batches', function (Blueprint $table) { $table->dropIndex('idx_inv_batches_fifo'); });
        Schema::table('parties', function (Blueprint $table) { $table->dropIndex('idx_parties_tenant_type'); });
        Schema::table('accounts', function (Blueprint $table) { $table->dropIndex('idx_accounts_tenant_code'); });
        Schema::table('payments', function (Blueprint $table) { $table->dropIndex('idx_payments_tenant_sale'); });
        Schema::table('sale_items', function (Blueprint $table) { $table->dropIndex('idx_sale_items_tenant_sale'); });
        Schema::table('stocks', function (Blueprint $table) { $table->dropIndex('idx_stocks_tenant_lookup'); });
    }
};

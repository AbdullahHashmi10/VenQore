<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Final Tenant Isolation — Phase 2
 *
 * Adds tenant_id to every remaining tenant-scoped table that was missed
 * in prior migrations. All additions are idempotent (if-not-exists guards).
 *
 * Tables covered:
 *   - debit_notes, debit_note_items
 *   - fund_transactions
 *   - manufacturing_ingredients, manufacturing_logs
 *   - purchase_orders, purchase_order_items
 *   - recipe_media
 *   - production_log_ingredients
 *   - stock_takes, stock_take_items
 *   - stock_transfers, stock_transfer_items
 *   - transaction_allocations
 *   - payment_allocations (if not already added)
 *   - batches (product batch tracking)
 */
return new class extends Migration
{
    private const TABLES = [
        'debit_notes',
        'debit_note_items',
        'fund_transactions',
        'manufacturing_ingredients',
        'manufacturing_logs',
        'purchase_orders',
        'purchase_order_items',
        'recipe_media',
        'production_log_ingredients',
        'stock_takes',
        'stock_take_items',
        'stock_transfers',
        'stock_transfer_items',
        'transaction_allocations',
        'payment_allocations',
        'batches',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (Schema::hasColumn($table, 'tenant_id')) continue;

            Schema::table($table, function (Blueprint $t) use ($table) {
                $t->uuid('tenant_id')->nullable()->after('id')->index();
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (!Schema::hasColumn($table, 'tenant_id')) continue;

            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('tenant_id');
            });
        }
    }
};

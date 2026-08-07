<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1.2 — Add tenant_id to all core tables with composite indexes
 *
 * CRITICAL ORDER OF OPERATIONS:
 *   1. Run this migration     (adds nullable tenant_id columns)
 *   2. Run TenantZeroSeeder   (fills AMD Outlets as Tenant 1, backfills rows)
 *   3. Then manually set FK constraints if desired (not done here to avoid
 *      blocking existing data from old installs)
 *
 * The columns are intentionally nullable at first so existing rows
 * are not broken before the seeder runs. The seeder will fill them.
 * After validation, a follow-up migration can make them NOT NULL.
 *
 * Composite indexes: Every report query in a multi-tenant system
 * filters by tenant_id first. Without these, query time degrades
 * linearly with number of tenants.
 */
return new class extends Migration
{
    /**
     * Tables and their index strategy.
     * Format: 'table' => ['column_to_index_with_tenant_id', ...]
     */
    private const TENANT_TABLES = [
        'products'             => ['created_at', 'id'],
        'sales'                => ['created_at', 'id'],
        'sale_items'           => ['sale_id'],
        'purchase_items'       => ['created_at'],
        'parties'              => ['created_at', 'id'],
        'accounts'             => ['type'],
        'journal_entries'      => ['created_at'],
        'journal_entry_lines'  => ['journal_entry_id'],
        'categories'           => ['id'],
        'warehouses'           => ['id'],
        'stocks'               => ['product_id'],
        'stock_movements'      => ['created_at'],
        'invoices'             => ['created_at', 'id'],
        'invoice_items'        => ['invoice_id'],
        'expenses'             => ['created_at'],
        'payments'             => ['created_at'],
        'users'                => ['email'],
        'settings'             => ['key'],
    ];

    public function up(): void
    {
        foreach (self::TENANT_TABLES as $table => $indexColumns) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            if (Schema::hasColumn($table, 'tenant_id')) {
                continue;  // idempotent — skip if already added
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table, $indexColumns) {
                if (DB::connection()->getDriverName() === 'sqlite') {
                    $blueprint->unsignedBigInteger('tenant_id')->nullable()->after('id')->index();
                } else {
                    $blueprint->uuid('tenant_id')->nullable()->after('id')->index();
                }

                // Composite indexes for multi-tenant query performance
                foreach ($indexColumns as $col) {
                    if (Schema::hasColumn($table, $col)) {
                        $indexName = "idx_{$table}_tenant_{$col}";
                        // Truncate index names longer than 64 chars (MySQL limit)
                        $indexName = substr($indexName, 0, 64);
                        $blueprint->index(['tenant_id', $col], $indexName);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        foreach (self::TENANT_TABLES as $table => $indexColumns) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            if (!Schema::hasColumn($table, 'tenant_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table, $indexColumns) {
                // Drop composite indexes first
                foreach ($indexColumns as $col) {
                    try {
                        $indexName = substr("idx_{$table}_tenant_{$col}", 0, 64);
                        $blueprint->dropIndex($indexName);
                    } catch (\Exception $e) {
                        // Index may not exist — continue
                    }
                }

                $blueprint->dropColumn('tenant_id');
            });
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 6A + Wound 3 — Schema completions required by code changes above.
 *
 * 1. Add deleted_at (SoftDeletes) to parties, accounts, categories, warehouses
 *    (products already has it).
 *
 * 2. Add tenant_id to ai_recommendations and customer_analytics
 *    so the Growth Engine can stamp and scope them.
 *
 * 3. Add tenant_id to journal_entries if missing (guard against duplicate).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. SoftDeletes columns ────────────────────────────────────────────
        $softDeleteTables = ['parties', 'accounts', 'categories', 'warehouses'];

        foreach ($softDeleteTables as $table) {
            if (!Schema::hasTable($table)) continue;
            if (Schema::hasColumn($table, 'deleted_at')) continue;

            Schema::table($table, function (Blueprint $t) {
                $t->softDeletes(); // Adds deleted_at TIMESTAMP NULL
            });
        }

        // ── 2. ai_recommendations — add tenant_id ─────────────────────────────
        if (Schema::hasTable('ai_recommendations') && !Schema::hasColumn('ai_recommendations', 'tenant_id')) {
            Schema::table('ai_recommendations', function (Blueprint $t) {
                $t->unsignedBigInteger('tenant_id')->nullable()->after('id')->index();
                $t->index(['tenant_id', 'type'],     'idx_ai_rec_tenant_type');
                $t->index(['tenant_id', 'party_id'], 'idx_ai_rec_tenant_party');
            });
        }

        // ── 3. customer_analytics — add tenant_id ─────────────────────────────
        if (Schema::hasTable('customer_analytics') && !Schema::hasColumn('customer_analytics', 'tenant_id')) {
            Schema::table('customer_analytics', function (Blueprint $t) {
                $t->unsignedBigInteger('tenant_id')->nullable()->after('id')->index();
                $t->index(['tenant_id', 'party_id'],  'idx_cust_analytics_tenant_party');
                $t->index(['tenant_id', 'status'],    'idx_cust_analytics_tenant_status');
            });
        }

        // ── 4. journal_entries.tenant_id composite index (idempotent) ─────────
        // The column was added in a previous migration; add the composite index
        // on (tenant_id, party_id) if missing for recovery alert queries.
        if (Schema::hasTable('journal_entries') && Schema::hasColumn('journal_entries', 'tenant_id')) {
            try {
                Schema::table('journal_entries', function (Blueprint $t) {
                    $t->index(['tenant_id', 'party_id'],    'idx_je_tenant_party');
                    $t->index(['tenant_id', 'is_reversed'], 'idx_je_tenant_reversed');
                });
            } catch (\Throwable $e) {
                // Indexes may already exist — ignore silently
            }
        }
    }

    public function down(): void
    {
        // Remove SoftDeletes columns
        foreach (['parties', 'accounts', 'categories', 'warehouses'] as $table) {
            if (!Schema::hasTable($table)) continue;
            if (!Schema::hasColumn($table, 'deleted_at')) continue;
            Schema::table($table, fn (Blueprint $t) => $t->dropSoftDeletes());
        }

        // Remove tenant_id from analytics tables
        if (Schema::hasTable('ai_recommendations') && Schema::hasColumn('ai_recommendations', 'tenant_id')) {
            Schema::table('ai_recommendations', function (Blueprint $t) {
                try { $t->dropIndex('idx_ai_rec_tenant_type');  } catch (\Throwable $e) {}
                try { $t->dropIndex('idx_ai_rec_tenant_party'); } catch (\Throwable $e) {}
                $t->dropColumn('tenant_id');
            });
        }

        if (Schema::hasTable('customer_analytics') && Schema::hasColumn('customer_analytics', 'tenant_id')) {
            Schema::table('customer_analytics', function (Blueprint $t) {
                try { $t->dropIndex('idx_cust_analytics_tenant_party');  } catch (\Throwable $e) {}
                try { $t->dropIndex('idx_cust_analytics_tenant_status'); } catch (\Throwable $e) {}
                $t->dropColumn('tenant_id');
            });
        }
    }
};

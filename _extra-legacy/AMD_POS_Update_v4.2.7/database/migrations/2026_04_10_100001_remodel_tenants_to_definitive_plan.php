<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Definitive Plan Migration — Tenants Table Remodel
 *
 * Changes from old schema:
 *  - PK: uuid → unsignedBigInteger (auto-increment). The numeric ID becomes
 *    the URL segment: venqore.com/s/{id}/dashboard
 *  - Drop: subdomain (replaced by slug for display only)
 *  - Add: slug (unique, display only — NOT used in routing)
 *  - Add: join_code "VQ-A3F9" (for staff joining without email invite)
 *  - Add: appsumo_code (tracks which AppSumo code created this store)
 *  - Add: country_code, language_code
 *  - Add: feature_variants, feature_serials, feature_batches, feature_manufacturing
 *  - Plan enum: add 'ltd' for lifetime AppSumo users
 *  - Status enum: add 'trial' as a plan value too (status already has it)
 *
 * IMPORTANT: Because we change PK type from string (uuid) to bigint,
 * we must first drop FK constraints referencing tenants.id, then recreate.
 * Run AFTER TenantZeroSeeder has assigned all rows.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }
        // ── Step A: Drop all FKs that reference tenants.id ────────────────
        // These were added by the add_tenant_id migration.
        // We collect all tenant_id FK columns and drop their constraints.
        $tablesToUpdate = [
            'products', 'sales', 'sale_items', 'purchases', 'purchase_items',
            'parties', 'accounts', 'journal_entries', 'journal_entry_lines',
            'categories', 'warehouses', 'stocks', 'stock_movements',
            'invoices', 'invoice_items', 'expenses', 'payments', 'settings',
        ];

        foreach ($tablesToUpdate as $table) {
            if (!Schema::hasTable($table)) continue;
            if (!Schema::hasColumn($table, 'tenant_id')) continue;

            // Attempt to drop FK — name varies, so try both conventions
            try {
                Schema::table($table, function (Blueprint $t) use ($table) {
                    $t->dropForeign("{$table}_tenant_id_foreign");
                });
            } catch (\Throwable) {
                // FK may not exist or name differs — continue
            }
        }

        // Drop users FK too (users.tenant_id → tenants.id in old schema)
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'tenant_id')) {
            try {
                Schema::table('users', function (Blueprint $t) {
                    $t->dropForeign('users_tenant_id_foreign');
                });
            } catch (\Throwable) {}
        }

        // ── Step B: Migrate tenants table to new schema ─────────────────
        Schema::table('tenants', function (Blueprint $table) {
            // Remove old UUID primary key constraints before adding new column
            $table->dropColumn('id');
        });

        // Add new auto-increment PK (must be done separately from alter)
        Schema::table('tenants', function (Blueprint $table) {
            $table->id()->first(); // unsignedBigInteger auto-increment
        });

        Schema::table('tenants', function (Blueprint $table) {
            // Replace subdomain (routing) with slug (display only)
            if (Schema::hasColumn('tenants', 'subdomain')) {
                $table->dropUnique(['subdomain']);
                $table->renameColumn('subdomain', 'slug');
            } else {
                $table->string('slug')->unique()->after('name');
            }

            // Plan: add 'ltd' tier
            // MySQL doesn't support modifying ENUMs inline cleanly, use raw
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tenants MODIFY COLUMN `plan` ENUM('trial','starter','growth','business','ltd') NOT NULL DEFAULT 'trial'");
            DB::statement("ALTER TABLE tenants MODIFY COLUMN `status` ENUM('trial','active','suspended','cancelled') NOT NULL DEFAULT 'trial'");
        }

        Schema::table('tenants', function (Blueprint $table) {
            // New fields from definitive plan
            $table->string('slug')->unique()->nullable()->change(); // make nullable during transition
            $table->string('join_code', 8)->unique()->nullable()->after('slug');    // "VQ-A3F9"
            $table->string('appsumo_code')->nullable()->index()->after('lemon_squeezy_subscription_id');
            $table->string('country_code', 2)->nullable()->after('currency_symbol');
            $table->string('language_code', 5)->default('en')->after('country_code');

            // Feature flags per industry (set during onboarding wizard)
            $table->boolean('feature_variants')->default(false)->after('industry');
            $table->boolean('feature_serials')->default(false)->after('feature_variants');
            $table->boolean('feature_batches')->default(false)->after('feature_serials');
            $table->boolean('feature_manufacturing')->default(false)->after('feature_batches');

            // Performance indexes
            $table->index(['status', 'trial_ends_at']);
            $table->index('plan');
        });

        // ── Step C: Update tenant_id columns in all data tables ──────────
        // Old tenant_id was UUID string. New is bigint.
        // Since we just changed the PK, we need to update the column types.
        // However: the data still matches (AMD Outlets = tenant 1).
        foreach ($tablesToUpdate as $table) {
            if (!Schema::hasTable($table)) continue;
            if (!Schema::hasColumn($table, 'tenant_id')) continue;

            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE `{$table}` MODIFY COLUMN `tenant_id` BIGINT UNSIGNED NULL");
            }
        }

        // ── Step D: Update users.tenant_id column ───────────────────────
        // Per new plan, users gets last_store_id instead of tenant_id.
        // We keep tenant_id on users for now — STEP 2 migration removes it.
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'tenant_id')) {
            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE `users` MODIFY COLUMN `tenant_id` BIGINT UNSIGNED NULL");
            }
        }
    }

    public function down(): void
    {
        // Reverting this migration is complex due to PK type change.
        // Manual rollback required if needed.
        throw new \RuntimeException('This migration cannot be automatically reversed. Restore from backup.');
    }
};

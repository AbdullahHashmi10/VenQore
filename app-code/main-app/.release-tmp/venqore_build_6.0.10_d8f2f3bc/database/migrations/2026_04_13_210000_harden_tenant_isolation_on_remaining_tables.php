<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Final Hardening — Add tenant_id to ALL remaining tables that were missed
     * in previous V3 and Multi-Tenant migrations.
     */
    private const HARDEN_TABLES = [
        'sales_orders',
        'sales_order_items',
        'quotations',
        'quotation_items',
        'discount_limits',
        'payment_allocations',
        'party_snapshots',
        'disaster_claims',
        'employees',
        'bill_of_materials',
        'bom_items',
        'disassembly_boms',
        'disassembly_bom_items',
        'system_settings',
        'production_run_materials',
    ];

    public function up(): void
    {
        foreach (self::HARDEN_TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (Schema::hasColumn($table, 'tenant_id')) continue;

            Schema::table($table, function (Blueprint $t) use ($table) {
                // Add tenant_id as a UUID column linked to tenants.id
                // (Note: older tables use unsignedBigInteger for tenant_id, 
                // but definitive plan use UUID for Tenants, but some migrations use foreignId which defaults to bigint)
                // Let's check what Tenants.id actually is.
                // According to 2026_04_10_000001_create_tenants_table.php: $table->id(); (BigInt)
                // According to 2026_04_10_100001_remodel_tenants_to_definitive_plan.php: $table->uuid('id')->primary(); (UUID)
                
                $t->uuid('tenant_id')->nullable()->after('id')->index();
            });
        }

        // Special case: fix unique indexes that include tenant_id
        if (Schema::hasTable('discount_limits')) {
            try {
                Schema::table('discount_limits', function (Blueprint $table) {
                    $table->dropUnique('discount_limits_role_unique');
                    $table->unique(['tenant_id', 'role']);
                });
            } catch (\Exception $e) {}
        }
        
        if (Schema::hasTable('system_settings')) {
            try {
                Schema::table('system_settings', function (Blueprint $table) {
                    $table->dropUnique('system_settings_key_unique');
                    $table->unique(['tenant_id', 'key']);
                });
            } catch (\Exception $e) {}
        }

        if (Schema::hasTable('party_snapshots')) {
            try {
                Schema::table('party_snapshots', function (Blueprint $table) {
                    $table->dropUnique('ps_party_account_unique');
                    $table->unique(['tenant_id', 'party_id', 'account_code'], 'ps_tenant_party_acc_unique');
                });
            } catch (\Exception $e) {}
        }
    }

    public function down(): void
    {
        foreach (self::HARDEN_TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (!Schema::hasColumn($table, 'tenant_id')) continue;

            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('tenant_id');
            });
        }
    }
};

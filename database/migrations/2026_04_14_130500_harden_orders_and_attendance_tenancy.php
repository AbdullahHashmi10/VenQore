<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Data Breach Fix Phase 2 — Multi-tenant hardening for Proposals, Orders, and Attendance.
     * 
     * This migration ensures that all operational tables used in the store context
     * have a tenant_id column for strict data isolation.
     */
    public function up(): void
    {
        $tables = [
            'proposals',
            'proposal_items',
            'purchase_proposals',
            'purchase_proposal_items',
            'sales_orders',
            'sales_order_items',
            'staff_attendances',
            'staff_activity_gaps',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'tenant_id')) {
                Schema::table($table, function (Blueprint $t) use ($table) {
                    $t->uuid('tenant_id')->nullable()->after('id')->index();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'proposals',
            'proposal_items',
            'purchase_proposals',
            'purchase_proposal_items',
            'sales_orders',
            'sales_order_items',
            'staff_attendances',
            'staff_activity_gaps',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'tenant_id')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropColumn('tenant_id');
                });
            }
        }
    }
};

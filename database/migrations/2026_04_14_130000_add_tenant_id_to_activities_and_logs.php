<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Data Breach Fix — Harden multi-tenant isolation for Activity and Logging tables.
     * 
     * This migration adds the missing tenant_id columns to the operational activity
     * tables used by the public-facing dashboards.
     */
    public function up(): void
    {
        // 1. activities table (used by Home Dashboard)
        if (Schema::hasTable('activities') && !Schema::hasColumn('activities', 'tenant_id')) {
            Schema::table('activities', function (Blueprint $table) {
                // Using UUID to match the Definitive Plan for tenant IDs
                $table->uuid('tenant_id')->nullable()->after('id')->index();
            });
        }

        // 2. activity_logs table (used by Admin/Staff logs)
        if (Schema::hasTable('activity_logs') && !Schema::hasColumn('activity_logs', 'tenant_id')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->after('id')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('activities') && Schema::hasColumn('activities', 'tenant_id')) {
            Schema::table('activities', function (Blueprint $table) {
                $table->dropColumn('tenant_id');
            });
        }

        if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'tenant_id')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->dropColumn('tenant_id');
            });
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix the settings table unique constraint for multi-tenancy.
     * The original migration had a global unique index on 'key',
     * which prevents multiple tenants from having the same setting key.
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            // 1. Drop the existing global unique key if it exists
            try {
                Schema::table('settings', function (Blueprint $table) {
                    $table->dropUnique('settings_key_unique');
                });
            } catch (\Exception $e) {
                try {
                    DB::statement('ALTER TABLE settings DROP INDEX settings_key_unique');
                } catch (\Exception $e2) {}
            }

            // 2. Add the multi-tenant unique constraint (tenant_id, key)
            try {
                Schema::table('settings', function (Blueprint $table) {
                    $table->unique(['tenant_id', 'key'], 'idx_settings_tenant_key_unique');
                });
            } catch (\Exception $e) {
                try {
                    DB::statement('ALTER TABLE settings ADD UNIQUE INDEX idx_settings_tenant_key_unique (tenant_id, `key`)');
                } catch (\Exception $e2) {}
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('settings')) {
            try {
                Schema::table('settings', function (Blueprint $table) {
                    $table->dropUnique('idx_settings_tenant_key_unique');
                });
            } catch (\Exception $e) {
                try {
                    DB::statement('ALTER TABLE settings DROP INDEX idx_settings_tenant_key_unique');
                } catch (\Exception $e2) {}
            }

            // Restore global uniqueness (might fail if data is already multi-tenant)
            try {
                Schema::table('settings', function (Blueprint $table) {
                    $table->unique('key', 'settings_key_unique');
                });
            } catch (\Exception $e) {
                try {
                    DB::statement('ALTER TABLE settings ADD UNIQUE INDEX settings_key_unique (`key`)');
                } catch (\Exception $e2) {}
            }
        }
    }
};

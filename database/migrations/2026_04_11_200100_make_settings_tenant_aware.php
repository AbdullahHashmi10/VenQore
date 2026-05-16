<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            // 1. Add tenant_id if missing
            if (!Schema::hasColumn('settings', 'tenant_id')) {
                Schema::table('settings', function (Blueprint $table) {
                    $table->unsignedBigInteger('tenant_id')->nullable()->after('id')->index();
                });
            }

            // 2. Safely drop existing unique index on 'key' using DB statement so we can catch exceptions at execution
            try {
                DB::statement('ALTER TABLE settings DROP INDEX settings_key_unique');
            } catch (\Exception $e) {
                // Index might not exist, ignore
            }

            // 3. Add composite unique index using raw SQL to allow catching duplicates/errors easily
            try {
                DB::statement('ALTER TABLE settings ADD UNIQUE INDEX idx_settings_tenant_key_unique (tenant_id, `key`)');
            } catch (\Exception $e) {
                // might already exist
            }
            
            // 4. Backfill existing settings to the first tenant if any exist
            $firstTenantId = DB::table('tenants')->value('id');
            if ($firstTenantId) {
                try {
                    // Update what we can without triggering duplicate key errors
                    DB::statement('UPDATE IGNORE settings SET tenant_id = ? WHERE tenant_id IS NULL', [$firstTenantId]);
                    // Delete any remaining orphaned settings that conflicted
                    DB::table('settings')->whereNull('tenant_id')->delete();
                } catch (\Exception $e) {
                    // Ignore strictly if DB doesn't support IGNORE well
                    DB::table('settings')->whereNull('tenant_id')->delete();
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('settings')) {
            try {
                DB::statement('ALTER TABLE settings DROP INDEX idx_settings_tenant_key_unique');
            } catch (\Exception $e) {}

            try {
                DB::statement('ALTER TABLE settings ADD UNIQUE INDEX settings_key_unique (`key`)');
            } catch (\Exception $e) {}
            
            if (Schema::hasColumn('settings', 'tenant_id')) {
                Schema::table('settings', function (Blueprint $table) {
                    // Try to drop the index added by column definition before dropping
                    try { DB::statement('ALTER TABLE settings DROP INDEX settings_tenant_id_index'); } catch (\Exception $e) {}
                    $table->dropColumn('tenant_id');
                });
            }
        }
    }
};

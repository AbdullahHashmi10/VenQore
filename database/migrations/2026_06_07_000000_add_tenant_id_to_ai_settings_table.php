<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop foreign key if it exists
        try {
            Schema::table('ai_settings', function (Blueprint $table) {
                $table->dropForeign(['tenant_id']);
            });
        } catch (\Throwable $e) {}

        // Drop unique constraints if they exist
        try {
            Schema::table('ai_settings', function (Blueprint $table) {
                $table->dropUnique('ai_settings_key_unique');
            });
        } catch (\Throwable $e) {}
        
        try {
            Schema::table('ai_settings', function (Blueprint $table) {
                $table->dropUnique(['tenant_id', 'key']);
            });
        } catch (\Throwable $e) {}

        // Drop the tenant_id column if it exists so we can recreate it with the correct type
        if (Schema::hasColumn('ai_settings', 'tenant_id')) {
            Schema::table('ai_settings', function (Blueprint $table) {
                $table->dropColumn('tenant_id');
            });
        }

        // Now recreate it with correct type BIGINT UNSIGNED and constraint
        Schema::table('ai_settings', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'key']);
        });

        // Seed default settings for all existing tenants
        $tenants = DB::table('tenants')->get();
        foreach ($tenants as $tenant) {
            $defaults = [
                ['id' => Str::uuid()->toString(), 'tenant_id' => $tenant->id, 'key' => 'regular_customer_min_orders', 'value' => '3', 'created_at' => now(), 'updated_at' => now()],
                ['id' => Str::uuid()->toString(), 'tenant_id' => $tenant->id, 'key' => 'regular_customer_period_days', 'value' => '60', 'created_at' => now(), 'updated_at' => now()],
                ['id' => Str::uuid()->toString(), 'tenant_id' => $tenant->id, 'key' => 'min_order_value_filter', 'value' => '5000', 'created_at' => now(), 'updated_at' => now()],
                ['id' => Str::uuid()->toString(), 'tenant_id' => $tenant->id, 'key' => 'lookahead_days', 'value' => '7', 'created_at' => now(), 'updated_at' => now()],
                ['id' => Str::uuid()->toString(), 'tenant_id' => $tenant->id, 'key' => 'loyalty_points_per_amount', 'value' => '100', 'created_at' => now(), 'updated_at' => now()],
                ['id' => Str::uuid()->toString(), 'tenant_id' => $tenant->id, 'key' => 'loyalty_points_earned_per_unit', 'value' => '1', 'created_at' => now(), 'updated_at' => now()],
                ['id' => Str::uuid()->toString(), 'tenant_id' => $tenant->id, 'key' => 'loyalty_redemption_rate', 'value' => '10', 'created_at' => now(), 'updated_at' => now()],
            ];
            
            foreach ($defaults as $default) {
                DB::table('ai_settings')->updateOrInsert(
                    ['tenant_id' => $default['tenant_id'], 'key' => $default['key']],
                    ['id' => $default['id'], 'value' => $default['value'], 'created_at' => $default['created_at'], 'updated_at' => $default['updated_at']]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_settings', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'key']);
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
            $table->unique('key');
        });
    }
};

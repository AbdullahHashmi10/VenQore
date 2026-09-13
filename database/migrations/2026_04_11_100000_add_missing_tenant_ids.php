<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * More tables that need multi-tenant scoping for V1 launch.
     */
    private const REMAINING_TABLES = [
        'bank_accounts',
        'expense_categories',
        'units',
        'suppliers',
        'customers',
        'brands',
        'product_attributes',
        'product_variants',
        'variant_attributes',
        'product_batches',
        'product_serials',
        'product_barcodes',
        'product_images',
        'product_price_tiers',
        'product_units',
        'staff_attendances',
        'staff_activity_gaps',
        'staff_daily_summaries',
        'loyalty_points',
        'loyalty_balances',
        'gift_cards',
        'custom_charges',
        'parked_sales',
        'store_credits',
        'store_credit_balances',
        'terminals',
        'recipes',
        'recipe_ingredients',
        'manufacturing_rules',
        'production_runs',
        'production_logs',
    ];

    public function up(): void
    {
        foreach (self::REMAINING_TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (Schema::hasColumn($table, 'tenant_id')) continue;

            Schema::table($table, function (Blueprint $t) {
                // Using foreignId for consistency with newer migrations
                $t->foreignId('tenant_id')->nullable()->after('id')->index()->constrained('tenants')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (self::REMAINING_TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (!Schema::hasColumn($table, 'tenant_id')) continue;

            Schema::table($table, function (Blueprint $t) use ($table) {
                try {
                    $t->dropForeign([$table . '_tenant_id_foreign']);
                    $t->dropColumn('tenant_id');
                } catch (\Exception $e) {
                    // Fallback for cases where foreign key name doesn't match
                }
            });
        }
    }
};

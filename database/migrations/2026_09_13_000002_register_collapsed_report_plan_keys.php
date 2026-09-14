<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Register collapsed analytical report plan feature keys in plan_limits.
     */
    public function up(): void
    {
        // Re-run the matrix seeder first to ensure baseline consistency
        (new \Database\Seeders\PlanFeatureMatrixSeeder)->run();

        if (!Schema::hasTable('plan_limits') || !Schema::hasTable('plans')) {
            return;
        }

        $allReportKeys = [
            'report_profit_loss',
            'report_trial_balance',
            'cash_flow_report',
            'stock_valuation',
            'point_in_time_inventory',
            'stock_aging',
            'report_sales_aging',
            'customer_insights',
            'supplier_insights',
            'discount_report',
            'report_profitability_analysis',
            'report_sales_analysis',
            'report_expense_analysis',
            'report_export',
        ];

        $plans = DB::table('plans')->get();

        foreach ($plans as $plan) {
            $isSolo = in_array(strtolower(trim($plan->slug)), ['solo', 'counter'], true);
            $val = $isSolo ? '0' : '1';

            foreach ($allReportKeys as $key) {
                DB::table('plan_limits')->updateOrInsert(
                    ['plan_id' => $plan->id, 'key' => $key],
                    [
                        'value'        => $val,
                        'reset_period' => 'never',
                        'updated_at'   => now(),
                    ]
                );
            }

            \App\Services\PlanRepository::invalidatePlanCache($plan->slug);
        }
    }

    public function down(): void
    {
        // Non-destructive down migration
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Restore capacity fences and analytical report fences in plan_limits.
     */
    public function up(): void
    {
        // Re-run the matrix seeder first to ensure baseline consistency
        (new \Database\Seeders\PlanFeatureMatrixSeeder)->run();

        if (!Schema::hasTable('plan_limits') || !Schema::hasTable('plans')) {
            return;
        }

        $planIds = DB::table('plans')->pluck('id', 'slug');

        // multi_branch -> '0' for solo, starter, ltd_1
        $multiBranchPlans = collect(['solo', 'starter', 'ltd_1'])
            ->map(fn ($slug) => $planIds[$slug] ?? null)
            ->filter();

        if ($multiBranchPlans->isNotEmpty()) {
            DB::table('plan_limits')
                ->whereIn('plan_id', $multiBranchPlans)
                ->where('key', 'multi_branch')
                ->update(['value' => '0', 'updated_at' => now()]);
        }

        // owners_daily_pulse -> '0' for solo, starter
        $pulsePlans = collect(['solo', 'starter'])
            ->map(fn ($slug) => $planIds[$slug] ?? null)
            ->filter();

        if ($pulsePlans->isNotEmpty()) {
            DB::table('plan_limits')
                ->whereIn('plan_id', $pulsePlans)
                ->where('key', 'owners_daily_pulse')
                ->update(['value' => '0', 'updated_at' => now()]);
        }

        // Solo analytical reports gating
        $soloId = $planIds['solo'] ?? null;
        if ($soloId) {
            $analyticalReports = [
                'reports'                     => 'basic',
                'report_profit_loss'          => '0',
                'report_trial_balance'        => '0',
                'report_cash_flow'            => '0',
                'report_stock_valuation'      => '0',
                'report_sales_aging'          => '0',
                'cash_flow_report'            => '0',
                'stock_valuation'             => '0',
                'discount_report'             => '0',
                'point_in_time_inventory'     => '0',
                'customer_insights'           => '0',
                'supplier_insights'           => '0',
                'stock_aging'                 => '0',
                'report_item_profit'          => '0',
                'report_bill_profitability'   => '0',
                'report_graph_analytics'      => '0',
                'report_party_profitability'  => '0',
                'report_expense_by_item'      => '0',
                'report_category_pl'          => '0',
                'report_item_discounting'     => '0',
                'report_sales_party_group'    => '0',
                'report_item_by_party'        => '0',
                'report_party_by_item'        => '0',
                'report_account_ledger'       => '0',
                'report_sales_by_party'       => '0',
            ];

            foreach ($analyticalReports as $key => $val) {
                DB::table('plan_limits')->updateOrInsert(
                    ['plan_id' => $soloId, 'key' => $key],
                    ['value' => $val, 'updated_at' => now()]
                );
            }
        }

        $this->flushPlanCaches($planIds->keys()->all());
    }

    public function down(): void
    {
        // Re-seeding handles reversal
        (new \Database\Seeders\PlanFeatureMatrixSeeder)->run();
    }

    private function flushPlanCaches(array $slugs): void
    {
        try {
            foreach ($slugs as $slug) {
                \App\Services\PlanRepository::invalidatePlanCache($slug);
            }

            \Illuminate\Support\Facades\Cache::forget('all_canonical_feature_keys');
            \Illuminate\Support\Facades\Cache::forget('all_capability_registry_keys');

            if (Schema::hasTable('tenants')) {
                foreach (DB::table('tenants')->pluck('id') as $tenantId) {
                    \App\Services\PlanRepository::invalidateTenantCache($tenantId);
                }
            }
        } catch (\Throwable) {
        }
    }
};

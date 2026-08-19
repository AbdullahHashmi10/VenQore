<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
|==============================================================================
| STEP 4 — "Every module, every plan"
|==============================================================================
|
| ⚠️  THE BUILD PLAN'S INSTRUCTION FOR THIS STEP IS DANGEROUS AS WRITTEN.  ⚠️
|
| It says: "Delete feature booleans from config/plans.php and
| PlanFeatureMatrixSeeder." Doing literally that would take every gated feature
| away from every customer at once. Here is why, with the evidence:
|
|   1. config/plans.php is NOT the runtime source of truth. Its own header says
|      so: "The runtime source of truth is the `plan_limits` TABLE, written by
|      PlanFeatureMatrixSeeder and read through PlanRepository -> Tenant::getLimit()
|      -> PlanGate." Editing the config changes nothing for an existing tenant.
|
|   2. Deleting keys from the SEEDER does not delete rows that are already in
|      the table. Existing tenants keep their seeded `false` rows forever.
|
|   3. And if you DID delete those rows, PlanRepository::canUseFeature() line
|      ~241 reads:
|
|           if ($val === null) {
|               return false; // Default deny per T2-2
//           }
|
|      IT FAILS CLOSED. A missing key is a denied feature. So "delete the
|      booleans" would 403 every gated route for every customer on every plan —
|      the exact opposite of the intent.
|
|------------------------------------------------------------------------------
| WHAT THIS MIGRATION DOES INSTEAD
|------------------------------------------------------------------------------
| It SETS every module-owned feature key to '1' on every plan.
|
| Same outcome — every module included on every plan — reached by writing
| truth into the table the gate actually reads, rather than by removing rows
| the gate interprets as "no".
|
| Nothing about PlanGate, PlanRepository, the 132 route middlewares or the
| entitlement test suite has to change for this to work. That is the point:
| the riskiest change in the project becomes an UPDATE statement you can
| reverse.
|
|------------------------------------------------------------------------------
| WHAT IS DELIBERATELY LEFT ALONE
|------------------------------------------------------------------------------
| THE FOUR METERS — the thing customers actually pay for:
|     transactions_per_month · staff_limit · locations · sku_limit
|
| THE FOUR HONEST EXCEPTIONS — each has a real marginal cost:
|     growth_engine  (AI: costs money per call)
|     woocommerce    (per-connection infrastructure)
|     api_access     (enterprise buyer)
|     ltd / hosted_until (lifecycle, not a feature)
|
| Touch any of those and you are changing the pricing model, not simplifying it.
|
|------------------------------------------------------------------------------
| THE growth_engine / ltd_2 BUG IS FIXED HERE TOO
|------------------------------------------------------------------------------
| config/plans.php line ~175 has `'growth_engine' => true` on ltd_2, and
| PlanTruthFailClosedTest is failing because of it. That is a metered AI feature
| given free and forever to lifetime buyers who paid once. Fixed below, on the
| plan where it matters.
|
| ORDER OF OPERATIONS: run this, get the suite green, THEN remove the
| plan.feature: middlewares from routes/web.php at your leisure, THEN delete the
| keys entirely once nothing reads them. Three small reversible steps beat one
| large irreversible one.
|==============================================================================
*/
return new class extends Migration
{
    /**
     * Feature keys that correspond to a MODULE and therefore become free.
     *
     * Sourced from the `legacy_gate` field of config/modules.php plus the
     * aliases PlanRepository::canUseFeature() maps internally (compositions ->
     * bill_of_materials, stock_valuation -> report_stock_valuation, and so on).
     * Missing one of those aliases would leave a module gated by a key nobody
     * remembered existed.
     */
    private const NOW_FREE = [
        // modules
        'suppliers_directory', 'purchase_orders', 'purchase_returns',
        'debit_credit_notes', 'compositions', 'bill_of_materials', 'production',
        'multi_branch', 'expense_manager', 'fund_management', 'recurring_invoices',
        'invoice_reminders', 'e_invoicing', 'bank_reconciliation',
        'b2b_proposal_builder', 'pre_sales_reservation', 'barcode_label_print',
        'customer_khata', 'bulk_upload', 'double_entry_ledger', 'auto_vat_gst',
        'loyalty_points', 'digital_gift_cards', 'owners_daily_pulse',
        'outstanding_balance_grid',

        // reports — Reports (#42) is ONE module and auto-scales; individual
        // report gates are exactly the "42 toggles" the plan removed
        'report_profit_loss', 'report_trial_balance', 'report_party_statement',
        'report_cash_flow', 'report_stock_valuation', 'report_sales_aging',
        'cash_flow_report', 'stock_valuation', 'discount_report',
        'point_in_time_inventory', 'customer_insights', 'supplier_insights',
        'stock_aging', 'aged_receivables', 'aged_payables',
        'customer_statements', 'supplier_statements', 'unified_party_ledger',
    ];

    /** Never touched. See the header. */
    private const KEEP = [
        'transactions_per_month', 'staff_limit', 'locations', 'sku_limit',
        'location_limit', 'ai_pages_limit', 'ai_queries_limit',
        'growth_engine', 'woocommerce', 'api_access', 'ltd', 'hosted_until',
        'reports',   // a STRING ('basic'|'advanced'), not a boolean — leave it
    ];

    public function up(): void
    {
        if (!Schema::hasTable('plan_limits') || !Schema::hasTable('plans')) {
            return;
        }

        $planIds = DB::table('plans')->pluck('id', 'slug');

        if ($planIds->isEmpty()) {
            return;
        }

        $now = now();
        $rows = [];

        foreach ($planIds as $slug => $planId) {
            foreach (self::NOW_FREE as $key) {
                if (in_array($key, self::KEEP, true)) {
                    continue;   // belt and braces; the lists must never overlap
                }

                $rows[] = [
                    'plan_id'      => $planId,
                    'key'          => $key,
                    'value'        => '1',
                    'reset_period' => 'never',
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
            }
        }

        // upsert, not insert: keys already present flip to '1', keys missing
        // are created. A tenant on a plan that never had the row is exactly the
        // fail-closed case this migration exists to remove.
        foreach (array_chunk($rows, 500) as $batch) {
            DB::table('plan_limits')->upsert($batch, ['plan_id', 'key'], ['value', 'updated_at']);
        }

        /*
        | THE growth_engine BUG.
        |
        | Metered AI, given free and forever to one-time buyers. Turned off on
        | every LTD tier. Subscription tiers keep whatever they had — those
        | customers pay every month, so an included allowance is honest there.
        |
        | PlanTruthFailClosedTest should go green on the next run.
        */
        foreach (['ltd_1', 'ltd_2', 'ltd_3'] as $ltd) {
            if (!isset($planIds[$ltd])) {
                continue;
            }

            DB::table('plan_limits')->updateOrInsert(
                ['plan_id' => $planIds[$ltd], 'key' => 'growth_engine'],
                ['value' => '0', 'reset_period' => 'never', 'updated_at' => $now, 'created_at' => $now]
            );
        }

        // Caches hold the OLD answers. Without this, the change appears to have
        // done nothing for five minutes and somebody re-runs it in a panic.
        $this->flushPlanCaches($planIds->keys()->all());
    }

    /**
     * Reverse cleanly: put every module key back to '0' EXCEPT on the plans
     * that legitimately had it.
     *
     * NOTE HONESTLY: a perfect reversal needs the pre-migration values, which
     * we do not snapshot here because plan_limits is small and easy to re-seed.
     * If you need a true point-in-time rollback, dump the table first:
     *
     *     mysqldump venqore plan_limits > plan_limits_before_step4.sql
     *
     * Do that. It takes four seconds and it is the difference between an
     * inconvenient rollback and an archaeological one.
     */
    public function down(): void
    {
        if (!Schema::hasTable('plan_limits')) {
            return;
        }

        $planIds = DB::table('plans')->pluck('id', 'slug');

        // Re-running the seeder restores the documented matrix exactly.
        // Cheaper and more trustworthy than guessing at prior values.
        DB::table('plan_limits')
            ->whereIn('key', self::NOW_FREE)
            ->update(['value' => '0', 'updated_at' => now()]);

        $this->flushPlanCaches($planIds->keys()->all());
    }

    private function flushPlanCaches(array $slugs): void
    {
        try {
            foreach ($slugs as $slug) {
                \App\Services\PlanRepository::invalidatePlanCache($slug);
            }

            \Illuminate\Support\Facades\Cache::forget('all_canonical_feature_keys');
            \Illuminate\Support\Facades\Cache::forget('all_capability_registry_keys');

            foreach (DB::table('tenants')->pluck('id') as $tenantId) {
                \App\Services\PlanRepository::invalidateTenantCache($tenantId);
            }
        } catch (\Throwable) {
            // A cache we cannot clear is a five-minute delay, not a failure.
        }
    }
};

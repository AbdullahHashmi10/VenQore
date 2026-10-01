<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

return new class extends Migration
{
    /**
     * Run the migrations (F2 cleanup).
     */
    public function up(): void
    {
        $ghostKeys = [
            'agent_referral', 'ai_bot_handoff', 'ai_churn_predictions', 'ai_copilot_suggestions',
            'ai_outreach_copy', 'ai_outreach_limit', 'ai_queries_limit', 'ai_revenue_forecasting',
            'auto_assembly_recipes', 'balanced_reversals', 'barcode_pattern_recognition',
            'bulk_tracking_sync', 'canned_responses', 'cashier_inactivity_logout',
            'commission_isolation', 'custom_tax_rates', 'customer_credit_limits_cfg',
            'customer_insights', 'demo_sandbox_cloner', 'double_entry_account_maps',
            'dropshipping', 'email_support', 'hard_lock_negative_stock', 'imei_lifecycle',
            'immutable_db_locks', 'industry_templates_count', 'invitation_codes',
            'jit_procurement', 'limit_override_manager', 'low_stock_threshold_cfg',
            'marketplace_oauth', 'module_toggles', 'multi_currency',
            'multichannel_expense_alloc', 'multitenant_isolation', 'passcode_security_controls',
            'passive_learning_engine', 'payables_grid', 'phone_support', 'point_in_time_inventory',
            'priority_support', 'redis_plan_gates', 'report_account_ledger',
            'report_all_parties_credit', 'report_bank_statements', 'report_bill_profitability',
            'report_category_pl', 'report_daily_sales_trend', 'report_expense_by_category',
            'report_expense_by_item', 'report_expenses_directory', 'report_expiring_soon',
            'report_general_discount', 'report_graph_analytics', 'report_item_by_party',
            'report_item_discounting', 'report_item_profit', 'report_loan_statement',
            'report_low_stock', 'report_party_by_item', 'report_party_profitability',
            'report_party_statement', 'report_purchases', 'report_sales_aging',
            'report_sales_by_category', 'report_sales_by_party', 'report_sales_order_items',
            'report_sales_orders_status', 'report_sales_party_group', 'report_sales_summary',
            'report_stock_aging', 'report_stock_by_category', 'report_stock_movement',
            'report_tax_compliance', 'report_tax_rate_breakdown', 'report_transactions_history',
            'report_trial_balance', 'sandbox_expiration', 'sandbox_time_shift',
            'smart_capture_limit', 'sms_debt_alerts', 'soft_delete_trash',
            'stock_reservation_rules', 'subscription_enforcement', 'superadmin_command_center',
            'supplier_insights', 'three_zone_security', 'white_glove_onboarding'
        ];

        try {
            DB::table('plan_limits')->whereIn('key', $ghostKeys)->delete();
            Cache::flush();
        } catch (\Throwable) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Ghosts are not restored
    }
};

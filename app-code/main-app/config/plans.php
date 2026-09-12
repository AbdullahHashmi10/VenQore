<?php

/**
 * Plan Limits & Feature Registry — Reference & Last-Resort Fallback
 *
 * The canonical source of truth for all plans and the 8 capability fences (V6 Spec).
 * Written to the database by database/seeders/PlanFeatureMatrixSeeder.php.
 */

return [

    'solo' => [
        // Limits
        'transactions_per_month'   => null, // Unlimited
        'locations'                => 1,
        'location_limit'           => 1,
        'sku_limit'                => 500,
        'staff_limit'              => 1, // Full seats
        'registers'                => 1,
        'devices_per_seat'         => 2,
        'till_logins'              => null, // Unlimited & free
        'visible_history_days'          => 30,
        'history_retention_days'   => 90,
        'ai_credits_monthly'       => 30,
        'ai_scans_monthly'         => 10,

        // Capability Fences (Denied on Solo)
        'multi_branch'             => false, // Fence 1
        'production'               => false, // Fence 2
        'bill_of_materials'        => false, // Fence 2
        'ai_system_builder'        => false, // Fence 3
        'growth_engine'            => false, // Fence 4
        'owners_daily_pulse'       => false, // Fence 4
        'loyalty_points'           => false, // Fence 5
        'digital_gift_cards'       => false, // Fence 5
        'marketing_campaigns'      => false, // Fence 5
        'recurring_invoices'       => true, // Included module
        'bank_reconciliation'      => true, // Included module
        'e_invoicing'              => true, // Included module
        'fund_management'          => true, // Included module
        'invoice_reminders'        => true, // Included module
        'fiscal_year_closing'      => true, // Included module
        'fixed_asset_depreciation' => true, // Included module
        'api_access'               => false, // Fence 7
        'white_label'              => false, // Fence 7
        'security_activity_log'    => false, // Fence 8
        'custom_roles'             => false, // Fence 8
        'imei_scanner'             => false, // Fence 8
        'serial_tracking'          => false, // Fence 8
        'woocommerce'              => false,

        // Explicitly Enabled on Solo (Full operational core)
        // Reports: Solo gets cards only (0 report screens, every report locked)
        'reports'                       => 'basic',
        // Starter (10 keys)
        'report_sales_records'          => false,
        'report_purchase_records'       => false,
        'report_stock_records'          => false,
        'report_stock_valuation'        => false,
        'report_profit_loss'            => false,
        'report_cash_flow'              => false,
        'report_expenses'               => false,
        'report_tax'                    => false,
        'report_day_book'               => false,
        'report_party_records'          => false,
        // Core (8 keys)
        'report_sales_analytics'        => false,
        'report_profitability'          => false,
        'report_discounts'              => false,
        'report_aging'                  => false,
        'report_balance_sheet'          => false,
        'report_expense_analysis'       => false,
        'report_party_insights'         => false,
        // Scale (5 keys)
        'report_ledger'                 => false,
        'report_point_in_time'          => false,
        'report_cross_party'            => false,
        'report_loans'                  => false,
        'report_export'                 => false,
        'outstanding_balance_grid' => true,
        'live_chat_widget'         => true,
        'bulk_upload'              => true,
        'senior_mode'              => true,
        'barcode_scanner'          => true,
        'keyboard_hotkeys'         => true,
        'profit_peek'              => true,
        'park_recall'              => true,
        'split_payments'           => true,
        'daily_cash_audit'         => true,
        'customer_khata'           => true,
        'supplier_khata'           => true,
        'purchase_orders'          => true,
        'double_entry_ledger'      => true,
        'batch_tracking'           => true,
        'batch_expiry'             => true,
        'smart_capture'            => true,
        'ai_assistant'             => true,
        'hypersearch_byok'         => true,
    ],

    'starter' => [
        // Limits
        'transactions_per_month'   => null, // Unlimited
        'locations'                => 1,
        'location_limit'           => 1,
        'sku_limit'                => 10000,
        'staff_limit'              => 1, // Full seats
        'registers'                => 2,
        'devices_per_seat'         => 3,
        'till_logins'              => null, // Unlimited & free
        'visible_history_days'          => null,
        'history_retention_days'   => null,
        'ai_credits_monthly'       => 1500,

        // Capability Fences (Denied on Starter)
        'multi_branch'             => false, // Fence 1
        'production'               => false, // Fence 2
        'bill_of_materials'        => false, // Fence 2
        'ai_system_builder'        => false, // Fence 3 (AI rebuild after onboarding)
        'growth_engine'            => false, // Fence 4
        'owners_daily_pulse'       => false, // Fence 4
        'loyalty_points'           => false, // Fence 5
        'digital_gift_cards'       => false, // Fence 5
        'marketing_campaigns'      => false, // Fence 5
        'recurring_invoices'       => false, // Fence 6
        'bank_reconciliation'      => false, // Fence 6
        'e_invoicing'              => false, // Fence 6
        'fund_management'          => false, // Fence 6
        'invoice_reminders'        => false, // Fence 6
        'fiscal_year_closing'      => false, // Fence 6
        'fixed_asset_depreciation' => false, // Fence 6
        'api_access'               => false, // Fence 7
        'white_label'              => false, // Fence 7
        'security_activity_log'    => false, // Fence 8
        'custom_roles'             => false, // Fence 8
        'imei_scanner'             => false, // Fence 8
        'serial_tracking'          => false, // Fence 8
        'woocommerce'              => false,

        // Explicitly Enabled on Starter
        // Starter ($49): 10 keys (19 reports)
        'reports'                       => 'advanced',
        'report_sales_records'          => true,
        'report_purchase_records'       => true,
        'report_stock_records'          => true,
        'report_stock_valuation'        => true,
        'report_profit_loss'            => true,
        'report_cash_flow'              => true,
        'report_expenses'               => true,
        'report_tax'                    => true,
        'report_day_book'               => true,
        'report_party_records'          => true,
        // Core (8 keys) - Denied on Starter
        'report_sales_analytics'        => false,
        'report_profitability'          => false,
        'report_discounts'              => false,
        'report_aging'                  => false,
        'report_balance_sheet'          => false,
        'report_expense_analysis'       => false,
        'report_party_insights'         => false,
        // Scale (5 keys) - Denied on Starter
        'report_ledger'                 => false,
        'report_point_in_time'          => false,
        'report_cross_party'            => false,
        'report_loans'                  => false,
        'report_export'                 => false,
        'outstanding_balance_grid' => true,
        'live_chat_widget'         => true,
        'bulk_upload'              => true,
        'senior_mode'              => true,
        'barcode_scanner'          => true,
        'keyboard_hotkeys'         => true,
        'profit_peek'              => true,
        'park_recall'              => true,
        'split_payments'           => true,
        'daily_cash_audit'         => true,
        'customer_khata'           => true,
        'supplier_khata'           => true,
        'purchase_orders'          => true,
        'double_entry_ledger'      => true,
        'batch_tracking'           => true,
        'batch_expiry'             => true,
        'smart_capture'            => true,
        'ai_assistant'             => true,
        'hypersearch_byok'         => true,
    ],

    'growth' => [
        // Limits
        'transactions_per_month'   => null, // Unlimited
        'locations'                => 3,
        'location_limit'           => 3,
        'sku_limit'                => 50000,
        'staff_limit'              => 3,
        'registers'                => 6,
        'devices_per_seat'         => 3,
        'till_logins'              => null,
        'visible_history_days'          => null,
        'history_retention_days'   => null,
        'ai_credits_monthly'       => 4000,

        // Capability Fences (Enabled on Growth: Fences 1–6)
        'multi_branch'             => true, // Fence 1
        'production'               => true, // Fence 2
        'bill_of_materials'        => true, // Fence 2
        'ai_system_builder'        => true, // Fence 3
        'growth_engine'            => true, // Fence 4
        'owners_daily_pulse'       => true, // Fence 4
        'loyalty_points'           => true, // Fence 5
        'digital_gift_cards'       => true, // Fence 5
        'marketing_campaigns'      => true, // Fence 5
        'recurring_invoices'       => true, // Fence 6
        'bank_reconciliation'      => true, // Fence 6
        'e_invoicing'              => true, // Fence 6
        'fund_management'          => true, // Fence 6
        'invoice_reminders'        => true, // Fence 6
        'fiscal_year_closing'      => true, // Fence 6
        'fixed_asset_depreciation' => true, // Fence 6

        // Fences 7 & 8 (Scale only)
        'api_access'               => false, // Fence 7
        'white_label'              => false, // Fence 7
        'security_activity_log'    => false, // Fence 8
        'custom_roles'             => false, // Fence 8
        'imei_scanner'             => false, // Fence 8
        'serial_tracking'          => false, // Fence 8
        'woocommerce'              => false,

        // Enabled
        // Core ($99): Starter (10 keys) + Core (8 keys)
        'reports'                       => 'advanced',
        'report_sales_records'          => true,
        'report_purchase_records'       => true,
        'report_stock_records'          => true,
        'report_stock_valuation'        => true,
        'report_profit_loss'            => true,
        'report_cash_flow'              => true,
        'report_expenses'               => true,
        'report_tax'                    => true,
        'report_day_book'               => true,
        'report_party_records'          => true,
        'report_sales_analytics'        => true,
        'report_profitability'          => true,
        'report_discounts'              => true,
        'report_aging'                  => true,
        'report_balance_sheet'          => true,
        'report_expense_analysis'       => true,
        'report_party_insights'         => true,
        // Scale (5 keys) - Denied on Core
        'report_ledger'                 => false,
        'report_point_in_time'          => false,
        'report_cross_party'            => false,
        'report_loans'                  => false,
        'report_export'                 => false,
        'live_chat_widget'              => true,
        'bulk_upload'                   => true,
        'senior_mode'                   => true,
        'smart_capture'                 => true,
        'ai_assistant'                  => true,
        'hypersearch_byok'              => true,
    ],

    // Alias for Core (V11 Plan nomenclature)
    'core' => [
        // Limits
        'transactions_per_month'   => null,
        'locations'                => 3,
        'location_limit'           => 3,
        'sku_limit'                => 50000,
        'staff_limit'              => 3,
        'registers'                => 6,
        'devices_per_seat'         => 3,
        'till_logins'              => null,
        'visible_history_days'     => null,
        'history_retention_days'   => null,
        'ai_credits_monthly'       => 4000,

        // Capability Fences
        'multi_branch'             => true,
        'production'               => true,
        'bill_of_materials'        => true,
        'ai_system_builder'        => true,
        'growth_engine'            => true,
        'owners_daily_pulse'       => true,
        'loyalty_points'           => true,
        'digital_gift_cards'       => true,
        'marketing_campaigns'      => true,
        'recurring_invoices'       => true,
        'bank_reconciliation'      => true,
        'e_invoicing'              => true,
        'fund_management'          => true,
        'invoice_reminders'        => true,
        'fiscal_year_closing'      => true,
        'fixed_asset_depreciation' => true,
        'api_access'               => false,
        'white_label'              => false,
        'security_activity_log'    => false,
        'custom_roles'             => false,
        'imei_scanner'             => false,
        'serial_tracking'          => false,
        'woocommerce'              => false,

        // Core ($99): Starter (10 keys) + Core (8 keys)
        'reports'                       => 'advanced',
        'report_sales_records'          => true,
        'report_purchase_records'       => true,
        'report_stock_records'          => true,
        'report_stock_valuation'        => true,
        'report_profit_loss'            => true,
        'report_cash_flow'              => true,
        'report_expenses'               => true,
        'report_tax'                    => true,
        'report_day_book'               => true,
        'report_party_records'          => true,
        'report_sales_analytics'        => true,
        'report_profitability'          => true,
        'report_discounts'              => true,
        'report_aging'                  => true,
        'report_balance_sheet'          => true,
        'report_expense_analysis'       => true,
        'report_party_insights'         => true,
        // Scale (5 keys) - Denied on Core
        'report_ledger'                 => false,
        'report_point_in_time'          => false,
        'report_cross_party'            => false,
        'report_loans'                  => false,
        'report_export'                 => false,
        'live_chat_widget'              => true,
        'bulk_upload'                   => true,
        'senior_mode'                   => true,
        'smart_capture'                 => true,
        'ai_assistant'                  => true,
        'hypersearch_byok'              => true,
    ],

    'business' => [
        // Limits
        'transactions_per_month'   => null, // Unlimited
        'locations'                => 10,
        'location_limit'           => 10,
        'sku_limit'                => 250000,
        'staff_limit'              => 10,
        'registers'                => 20,
        'devices_per_seat'         => 5,
        'till_logins'              => null,
        'visible_history_days'          => null,
        'history_retention_days'   => null,
        'ai_credits_monthly'       => 9000,

        // All 8 Capability Fences Enabled on Scale
        'multi_branch'             => true, // Fence 1
        'production'               => true, // Fence 2
        'bill_of_materials'        => true, // Fence 2
        'ai_system_builder'        => true, // Fence 3
        'growth_engine'            => true, // Fence 4
        'owners_daily_pulse'       => true, // Fence 4
        'loyalty_points'           => true, // Fence 5
        'digital_gift_cards'       => true, // Fence 5
        'marketing_campaigns'      => true, // Fence 5
        'recurring_invoices'       => true, // Fence 6
        'bank_reconciliation'      => true, // Fence 6
        'e_invoicing'              => true, // Fence 6
        'fund_management'          => true, // Fence 6
        'invoice_reminders'        => true, // Fence 6
        'fiscal_year_closing'      => true, // Fence 6
        'fixed_asset_depreciation' => true, // Fence 6
        'api_access'               => true, // Fence 7
        'white_label'              => true, // Fence 7
        'security_activity_log'    => true, // Fence 8
        'custom_roles'             => true, // Fence 8
        'imei_scanner'             => true, // Fence 8
        'serial_tracking'          => true, // Fence 8
        'woocommerce'              => true,

        // Enabled
        // Scale ($299): All 23 keys enabled
        'reports'                       => 'advanced',
        'report_sales_records'          => true,
        'report_purchase_records'       => true,
        'report_stock_records'          => true,
        'report_stock_valuation'        => true,
        'report_profit_loss'            => true,
        'report_cash_flow'              => true,
        'report_expenses'               => true,
        'report_tax'                    => true,
        'report_day_book'               => true,
        'report_party_records'          => true,
        'report_sales_analytics'        => true,
        'report_profitability'          => true,
        'report_discounts'              => true,
        'report_aging'                  => true,
        'report_balance_sheet'          => true,
        'report_expense_analysis'       => true,
        'report_party_insights'         => true,
        'owners_daily_pulse'            => true,
        'report_ledger'                 => true,
        'report_point_in_time'          => true,
        'report_cross_party'            => true,
        'report_loans'                  => true,
        'report_export'                 => true,
        'live_chat_widget'              => true,
        'bulk_upload'                   => true,
        'senior_mode'                   => true,
        'smart_capture'                 => true,
        'ai_assistant'                  => true,
        'hypersearch_byok'              => true,
    ],

    // Alias for Scale (V11 Plan nomenclature)
    'scale' => [
        // Limits
        'transactions_per_month'   => null,
        'locations'                => 10,
        'location_limit'           => 10,
        'sku_limit'                => 250000,
        'staff_limit'              => 10,
        'registers'                => 20,
        'devices_per_seat'         => 5,
        'till_logins'              => null,
        'visible_history_days'     => null,
        'history_retention_days'   => null,
        'ai_credits_monthly'       => 9000,

        // Capability Fences
        'multi_branch'             => true,
        'production'               => true,
        'bill_of_materials'        => true,
        'ai_system_builder'        => true,
        'growth_engine'            => true,
        'owners_daily_pulse'       => true,
        'loyalty_points'           => true,
        'digital_gift_cards'       => true,
        'marketing_campaigns'      => true,
        'recurring_invoices'       => true,
        'bank_reconciliation'      => true,
        'e_invoicing'              => true,
        'fund_management'          => true,
        'invoice_reminders'        => true,
        'fiscal_year_closing'      => true,
        'fixed_asset_depreciation' => true,
        'api_access'               => true,
        'white_label'              => true,
        'security_activity_log'    => true,
        'custom_roles'             => true,
        'imei_scanner'             => true,
        'serial_tracking'          => true,
        'woocommerce'              => true,

        // Scale ($299): All 23 keys enabled
        'reports'                       => 'advanced',
        'report_sales_records'          => true,
        'report_purchase_records'       => true,
        'report_stock_records'          => true,
        'report_stock_valuation'        => true,
        'report_profit_loss'            => true,
        'report_cash_flow'              => true,
        'report_expenses'               => true,
        'report_tax'                    => true,
        'report_day_book'               => true,
        'report_party_records'          => true,
        'report_sales_analytics'        => true,
        'report_profitability'          => true,
        'report_discounts'              => true,
        'report_aging'                  => true,
        'report_balance_sheet'          => true,
        'report_expense_analysis'       => true,
        'report_party_insights'         => true,
        'owners_daily_pulse'            => true,
        'report_ledger'                 => true,
        'report_point_in_time'          => true,
        'report_cross_party'            => true,
        'report_loans'                  => true,
        'report_export'                 => true,
        'live_chat_widget'              => true,
        'bulk_upload'                   => true,
        'senior_mode'                   => true,
        'smart_capture'                 => true,
        'ai_assistant'                  => true,
        'hypersearch_byok'              => true,
    ],

    // ── AppSumo LTD Plans (LTD tx caps removed: set to null) ──

    'ltd_1' => [
        'transactions_per_month'   => null, // Unlimited (tx cap removed per V6 spec §5.1)
        'locations'                => 1,
        'location_limit'           => 1,
        'sku_limit'                => 5000,
        'staff_limit'              => 1,
        'registers'                => 2,
        'devices_per_seat'         => 3,
        'till_logins'              => null,
        'visible_history_days'     => null,
        'history_retention_days'   => null,
        'ai_credits_annual'        => 12000,
        'multi_branch'             => false,
        'production'               => false,
        'bill_of_materials'        => false,
        'ai_system_builder'        => false,
        'growth_engine'            => false,
        'owners_daily_pulse'       => false,
        'loyalty_points'           => false,
        'digital_gift_cards'       => false,
        'marketing_campaigns'      => false,
        'recurring_invoices'       => false,
        'bank_reconciliation'      => false,
        'e_invoicing'              => false,
        'fund_management'          => false,
        'invoice_reminders'        => false,
        'fiscal_year_closing'      => false,
        'fixed_asset_depreciation' => false,
        'api_access'               => false,
        'white_label'              => false,
        'security_activity_log'    => false,
        'custom_roles'             => false,
        'imei_scanner'             => false,
        'serial_tracking'          => false,
        'woocommerce'              => false,
        // ltd_1 gets Starter set (10 keys true, rest false)
        'reports'                       => 'advanced',
        'report_sales_records'          => true,
        'report_purchase_records'       => true,
        'report_stock_records'          => true,
        'report_stock_valuation'        => true,
        'report_profit_loss'            => true,
        'report_cash_flow'              => true,
        'report_expenses'               => true,
        'report_tax'                    => true,
        'report_day_book'               => true,
        'report_party_records'          => true,
        'report_sales_analytics'        => false,
        'report_profitability'          => false,
        'report_discounts'              => false,
        'report_aging'                  => false,
        'report_balance_sheet'          => false,
        'report_expense_analysis'       => false,
        'report_party_insights'         => false,
        'report_ledger'                 => false,
        'report_point_in_time'          => false,
        'report_cross_party'            => false,
        'report_loans'                  => false,
        'report_export'                 => false,
        'live_chat_widget'         => true,
        'ltd'                      => true,
    ],

    'ltd_2' => [
        'transactions_per_month'   => null, // Unlimited
        'locations'                => 2,
        'location_limit'           => 2,
        'sku_limit'                => 25000,
        'staff_limit'              => 2,
        'registers'                => 4,
        'devices_per_seat'         => 3,
        'till_logins'              => null,
        'visible_history_days'     => null,
        'history_retention_days'   => null,
        'ai_credits_annual'        => 30000,
        'multi_branch'             => true,
        'production'               => true,
        'bill_of_materials'        => true,
        'ai_system_builder'        => true,
        'growth_engine'            => false,
        'owners_daily_pulse'       => true,
        'loyalty_points'           => true,
        'digital_gift_cards'       => true,
        'marketing_campaigns'      => true,
        'recurring_invoices'       => true,
        'bank_reconciliation'      => true,
        'e_invoicing'              => true,
        'fund_management'          => true,
        'invoice_reminders'        => true,
        'fiscal_year_closing'      => true,
        'fixed_asset_depreciation' => true,
        'api_access'               => false,
        'white_label'              => false,
        'security_activity_log'    => false,
        'custom_roles'             => false,
        'imei_scanner'             => false,
        'serial_tracking'          => false,
        'woocommerce'              => false,
        // ltd_2 gets Core set (Starter + Core keys true, Scale false)
        'reports'                       => 'advanced',
        'report_sales_records'          => true,
        'report_purchase_records'       => true,
        'report_stock_records'          => true,
        'report_stock_valuation'        => true,
        'report_profit_loss'            => true,
        'report_cash_flow'              => true,
        'report_expenses'               => true,
        'report_tax'                    => true,
        'report_day_book'               => true,
        'report_party_records'          => true,
        'report_sales_analytics'        => true,
        'report_profitability'          => true,
        'report_discounts'              => true,
        'report_aging'                  => true,
        'report_balance_sheet'          => true,
        'report_expense_analysis'       => true,
        'report_party_insights'         => true,
        'report_ledger'                 => false,
        'report_point_in_time'          => false,
        'report_cross_party'            => false,
        'report_loans'                  => false,
        'report_export'                 => false,
        'live_chat_widget'         => true,
        'ltd'                      => true,
    ],

    'ltd_3' => [
        'transactions_per_month'   => null, // Unlimited
        'locations'                => 3,
        'location_limit'           => 3,
        'sku_limit'                => 50000,
        'staff_limit'              => 3,
        'registers'                => 6,
        'devices_per_seat'         => 3,
        'till_logins'              => null,
        'visible_history_days'     => null,
        'history_retention_days'   => null,
        'ai_credits_annual'        => 60000,
        'multi_branch'             => true,
        'production'               => true,
        'bill_of_materials'        => true,
        'ai_system_builder'        => true,
        'growth_engine'            => false,
        'owners_daily_pulse'       => true,
        'loyalty_points'           => true,
        'digital_gift_cards'       => true,
        'marketing_campaigns'      => true,
        'recurring_invoices'       => true,
        'bank_reconciliation'      => true,
        'e_invoicing'              => true,
        'fund_management'          => true,
        'invoice_reminders'        => true,
        'fiscal_year_closing'      => true,
        'fixed_asset_depreciation' => true,
        'api_access'               => false,
        'white_label'              => false,
        'security_activity_log'    => false,
        'custom_roles'             => false,
        'imei_scanner'             => false,
        'serial_tracking'          => false,
        'woocommerce'              => false,
        // ltd_3 gets Scale set (all 23 keys true)
        'reports'                       => 'advanced',
        'report_sales_records'          => true,
        'report_purchase_records'       => true,
        'report_stock_records'          => true,
        'report_stock_valuation'        => true,
        'report_profit_loss'            => true,
        'report_cash_flow'              => true,
        'report_expenses'               => true,
        'report_tax'                    => true,
        'report_day_book'               => true,
        'report_party_records'          => true,
        'report_sales_analytics'        => true,
        'report_profitability'          => true,
        'report_discounts'              => true,
        'report_aging'                  => true,
        'report_balance_sheet'          => true,
        'report_expense_analysis'       => true,
        'report_party_insights'         => true,
        'owners_daily_pulse'            => true,
        'report_ledger'                 => true,
        'report_point_in_time'          => true,
        'report_cross_party'            => true,
        'report_loans'                  => true,
        'report_export'                 => true,
        'live_chat_widget'         => true,
        'ltd'                      => true,
    ],
];

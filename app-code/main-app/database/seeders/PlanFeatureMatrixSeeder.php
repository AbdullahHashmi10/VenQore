<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanFeatureMatrixSeeder extends Seeder
{
    public function run(): void
    {
        $planSlugs = ['trial', 'counter', 'starter', 'growth', 'business', 'ltd_1', 'ltd_2', 'ltd_3'];
        $pricingConfig = config('pricing.plans', []);
        
        $websiteId = DB::table('platforms')->where('slug', 'website')->value('id') ?? 1;
        $appsumoId = DB::table('platforms')->where('slug', 'appsumo')->value('id') ?? 2;

        $planIds = [];
        foreach ($planSlugs as $slug) {
            $planInfo = $pricingConfig[$slug] ?? null;
            $name = $planInfo['name'] ?? ucfirst($slug);
            $priceMonthly = $planInfo['price_monthly'] ?? 0;
            $priceAnnual = $planInfo['price_annual'] ?? 0;
            $isVisible = !str_starts_with($slug, 'ltd_');
            $platformId = str_starts_with($slug, 'ltd_') ? $appsumoId : $websiteId;

            DB::table('plans')->updateOrInsert(
                ['slug' => $slug],
                [
                    'platform_id'         => $platformId,
                    'name'                => $name,
                    'price_monthly'       => $priceMonthly,
                    'price_annual'        => $priceAnnual,
                    'is_visible'          => $isVisible,
                    'updated_at'          => now(),
                ]
            );

            $planIds[$slug] = DB::table('plans')->where('slug', $slug)->value('id');
        }

        // Define feature matrix default mappings
        $matrix = [
            // Group 1 — Onboarding & First Impression
            'demo_store'              => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'free_trial_days'         => ['trial' => '14', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'instant_store_creator'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'industry_seeding'        => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'dark_theme'              => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'light_theme'             => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'multi_store_hub'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'multi_store_roles'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'cashier_pin_login'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'device_adaptive'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'pwa_install'             => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'guided_setup_tour'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'coupon_stacking'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'platform_status_badge'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'system_cache_refresher'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'owner_profile_card'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'one_click_system_wipe'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'smtp_mail'               => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'sms_gateway'             => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'security_activity_log'   => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],

            // Group 2 — POS & Supercharged Checkout
            'barcode_scanner'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'imei_scanner'               => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'keyboard_hotkeys'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'senior_mode'                => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'high_contrast_colors'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'profit_peek'                => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'cart_tabs_limit'            => ['trial' => '3', 'starter' => '3', 'growth' => '10', 'business' => '50'],
            'park_recall'                => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'inflight_product_creation'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'cart_session_protection'    => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'contextual_qty_modifiers'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'auto_customer_discounts'    => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'fuzzy_product_finder'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'auto_cash_rounding'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'split_payments'             => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'daily_cash_audit'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'silent_webusb_printing'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'receipt_cutline_padding'    => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'custom_thermal_widths'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'dynamic_accent_colors'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'invoice_column_toggles'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'amount_to_words'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'receipt_qr_code'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'branded_receipt_sync'       => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'auto_assembly_checkout'     => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'pos_negative_stock_alert'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'negative_stock_lock'        => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'service_fee_additions'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'auto_vat_gst'               => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'custom_charge_toggle'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'fuzzy_customer_lookup'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'recent_invoices_panel'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'cashier_change_helper'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'barcode_label_print'        => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'label_qr_codes'             => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],

            // Group 3 — Invoicing, Customer Khata & Receivables
            'customer_khata'             => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'customer_payments_log'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'customer_statements'        => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'aged_receivables'           => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'whatsapp_reminders'         => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'sms_debt_alerts'            => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'credit_limit_rules'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'multi_payment_invoices'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'customer_payment_alloc'     => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'anniversary_tracker'        => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'customer_ltv_score'         => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'customer_wallet'            => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'loyalty_points'             => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'digital_gift_cards'         => ['trial' => '1', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'wholesale_pricing'          => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'b2b_proposal_builder'       => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'quotation_conversion'       => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'inflight_session_recovery'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'tax_inclusive_exclusive'    => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'b2b_margin_displayer'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'sales_return_vouchers'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'b2b_invoice_designer'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'pre_sales_reservation'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'refund_reason_analysis'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'tax_exempt_customers'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'customer_address_book'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'a4_invoice_pdf'             => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'letter_size_invoice'        => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'outstanding_balance_grid'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'payment_due_dates'          => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'overdue_highlights'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'lump_sum_payments'          => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'partial_payment_indicator'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'unified_party_ledger'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],

            // Group 4 — Procurement & Suppliers
            'supplier_khata'             => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'delayed_supplier_payments'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'supplier_statements'        => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'aged_payables'              => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'installment_payments'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'purchase_orders'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'partial_shipments'          => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'supplier_debit_notes'       => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'auto_cost_adjuster'         => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'cost_price_fluctuator'      => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'supplier_lead_time'         => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'landing_costs'              => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'suppliers_directory'        => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'supplier_sku_mapping'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'inbound_expiry_tracking'    => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'purchase_returns'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'auto_po_generation'         => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'bulk_supplier_payments'     => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'purchase_pdf_upload'        => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'reconciled_bank_payments'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'tax_inclusive_procurement'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'supplier_outstanding_alerts'=> ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'supplier_refund_tracker'    => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'custom_payment_terms'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],

            // Group 5 — Inventory & Multi-Warehouse
            'locations'                  => ['trial' => '1', 'starter' => '1', 'growth' => '3', 'business' => '10'],
            'stock_transfer'             => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'product_variants'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'fifo_costing'               => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'barcode_label_factory'      => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'batch_tracking'             => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'batch_expiry'               => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'stock_take_audit'           => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'disaster_claim'             => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'bill_of_materials'          => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'auto_assembly_logic'        => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'production_simulator'       => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'recipe_history_archival'    => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'product_history_timeline'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'category_management'        => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'stock_levels_view'          => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'low_stock_alerts'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'imei_lifecycle'             => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'uom_converter'              => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'sku_limit'                  => ['trial' => '20000', 'starter' => '5000', 'growth' => '20000', 'business' => '50000'],

            // Group 6 — E-Commerce & VenSynQ
            'vensync_command'            => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'marketplace_oauth'          => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'commission_isolation'       => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'dropshipping'               => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'jit_procurement'            => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'bulk_tracking_sync'         => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'multichannel_expense_alloc' => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            // 2026-07-04 decision (owner): WooCommerce is NOT included in any plan —
            // it stays off until sold separately. Entitlement, when granted, goes
            // through tenant_plan_overrides (per-tenant), never a plan default.
            'woocommerce'                => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'woocommerce_customer_reg'   => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'woocommerce_stock_sync'     => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'woocommerce_orders_bridge'  => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'web_catalog_toggles'        => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],

            // Group 7 — Double-Entry Accounting & Finance
            'double_entry_ledger'        => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'cash_account_reconciliation'=> ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'fixed_asset_depreciation'   => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'loan_ledger'                => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'inter_register_transfers'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'advance_allocation'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'fiscal_year_closing'        => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'debit_credit_notes'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'bank_reconciliation'        => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'production'                 => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'e_invoicing'                => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'marketing_campaigns'        => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'invoice_reminders'          => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'recurring_invoices'         => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'fund_management'            => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'tax_summary_engine'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'expense_manager'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'charity_engine'             => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'petty_cash'                 => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],

            // Group 8 — Report Factory (40 Reports)
            'reports'                    => ['trial' => 'advanced', 'starter' => 'advanced', 'growth' => 'advanced', 'business' => 'advanced'],
            'report_sales_summary'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_low_stock'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_expenses_directory'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_party_statement'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_cash_flow'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_stock_valuation'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_purchases'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_daily_sales_trend'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_day_book'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_tax_compliance'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_general_discount'    => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_bank_statements'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_account_ledger'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_stock_aging'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_expiring_soon'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_profit_loss'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_trial_balance'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            // Launch gap found 2026-08-07: these 3 keys are used by routes/web.php
            // (plan.feature:discount_report / cash_flow_report / stock_valuation)
            // but were never seeded here, so featureOn()'s fail-closed default
            // locked them for EVERY plan including business/ltd_3. Tiered to match
            // similar-weight report keys above (report_account_ledger/report_stock_aging).
            'discount_report'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'cash_flow_report'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'stock_valuation'            => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'point_in_time_inventory'    => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'customer_insights'          => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'supplier_insights'          => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            // 'stock_aging' (no 'report_' prefix) is the actual key routes/web.php
            // gates /reports/stock-aging on. 'report_stock_aging' above is a
            // DIFFERENT, separate SuperAdmin-only toggle (see featureGroups.js)
            // with no route wired to it — not a duplicate, don't merge these.
            'stock_aging'                => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'report_transactions_history'=> ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_item_profit'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_bill_profitability'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_graph_analytics'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_loan_statement'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_sales_aging'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_sales_orders_status' => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_party_profitability' => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_expense_by_category' => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_expense_by_item'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_stock_by_category'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_sales_by_party'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_sales_by_category'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_category_pl'         => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_item_discounting'    => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_sales_order_items'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_sales_party_group'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_item_by_party'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_party_by_item'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'report_tax_rate_breakdown'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],

            // Group 9 — Platform HQ & Infrastructure
            'ai_assistant'               => ['trial' => '1', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'superadmin_command_center'   => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'redis_plan_gates'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'limit_override_manager'      => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'invitation_codes'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'demo_sandbox_cloner'         => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'sandbox_time_shift'          => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'sandbox_expiration'          => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'soft_delete_trash'           => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'custom_tax_rates'            => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'customer_credit_limits_cfg'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'low_stock_threshold_cfg'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'cashier_inactivity_logout'   => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'passcode_security_controls'  => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'stock_reservation_rules'     => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'barcode_pattern_recognition' => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'auto_assembly_recipes'       => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'multi_currency'              => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'module_toggles'              => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'hard_lock_negative_stock'    => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'transactions_per_month'      => ['trial' => null, 'starter' => null, 'growth' => null, 'business' => null, 'ltd_1' => '1000', 'ltd_2' => '3000', 'ltd_3' => '8000'],
            'staff_limit'                 => ['trial' => '2', 'starter' => '3', 'growth' => '10', 'business' => '50'],
            'multi_branch'                => ['trial' => '0', 'starter' => '0', 'growth' => '3', 'business' => '10'],
            'api_access'                  => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],

            // Group 10 — AI & Automation Extras
            'hypersearch_byok'           => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            // 2026-07-04 decision (owner, per Pricing.jsx): Smart Capture is part of
            // the AI add-on (managed AI Core/Lite/Pro/Ultimate, or $5 one-time BYOK
            // unlock) — purchasable with ANY base plan, included in NONE. Plan default
            // is therefore '0' everywhere; the add-on purchase / BYOK activation must
            // write a tenant_plan_overrides row (smart_capture='1') for that tenant.
            'smart_capture'              => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'smart_capture_limit'        => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'ai_pages_limit'             => ['trial' => '60', 'starter' => '20', 'growth' => '60', 'business' => '150'],
            'growth_engine'              => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'], // Enabled on Growth & Business (Phase 1 change - 2026-08-08)
            'ai_churn_predictions'       => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'ai_revenue_forecasting'     => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'ai_outreach_copy'           => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'ai_queries_limit'           => ['trial' => '400', 'starter' => '100', 'growth' => '400', 'business' => '1000'],
            'ai_outreach_limit'          => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'owners_daily_pulse'         => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'bulk_upload'                => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],

            // Group 11 — Live Chat & Customer Engagement
            'live_chat_widget'           => ['trial' => '1', 'counter' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'ai_bot_handoff'             => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'canned_responses'           => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'ai_copilot_suggestions'     => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'passive_learning_engine'    => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],
            'agent_referral'             => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0'],

            // Group 12 — Support & Onboarding Perks
            'dedicated_account_manager'  => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'white_glove_onboarding'     => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'white_label'                => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'industry_templates_count'   => ['trial' => '16', 'starter' => '16', 'growth' => '16', 'business' => '16'],
            'priority_support'           => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],
            'email_support'              => ['trial' => '1', 'starter' => '1', 'growth' => '1', 'business' => '1'],
            'chat_support'               => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'phone_support'              => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '1'],

            // Group 13 — V3 Modular Building Blocks Conversion
            'optical_prescription'       => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'tailor_measurements'        => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'jewelry_metal_rates'        => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'work_orders'                => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
            'service_contracts'          => ['trial' => '0', 'starter' => '0', 'growth' => '1', 'business' => '1'],
        ];

        // Seed/Update limits for all 7 plans (incorporating LTD equivalents) in a single transaction
        DB::transaction(function () use ($matrix, $planSlugs, $planIds) {
            foreach ($matrix as $key => $values) {
                foreach ($planSlugs as $slug) {
                    $pid = $planIds[$slug] ?? null;
                    if (!$pid) continue;

                    // Resolve values for LTD plans from their equivalents:
                    // ltd_1 = starter, ltd_2 = growth, ltd_3 = business
                    $baseSlug = $slug;
                    // The pricing page sells the trial as "14 days, the full
                    // product". Resolving it to Growth makes that true; the
                    // 'trial' column left in the matrix above is now unused.
                    if ($slug === 'trial')  $baseSlug = 'growth';
                    if ($slug === 'ltd_1') $baseSlug = 'starter';
                    if ($slug === 'ltd_2') $baseSlug = 'growth';
                    if ($slug === 'ltd_3') $baseSlug = 'business';

                    // We also keep some standard overrides specifically as in migrations:
                    $val = array_key_exists($baseSlug, $values)
                        ? $values[$baseSlug]
                        : (array_key_exists('starter', $values) ? $values['starter'] : '0');

                    // Specific Counter plan overrides
                    if ($slug === 'counter') {
                        // Mirrors the "no" cells of the public pricing table exactly.
                        // Counter is deliberately NOT a crippled edition: the ledger,
                        // every financial report, purchasing, suppliers, expenses and
                        // the party khata are all included, because the page promises
                        // them and the whole positioning rests on it. Counter differs
                        // by seats, branches, AI allowance and these five rows only.
                        $counterDisabledKeys = [
                            'multi_branch',
                            'production', 'bill_of_materials',
                            'loyalty_points', 'digital_gift_cards', 'marketing_campaigns',
                            'api_access', 'white_label',
                            'woocommerce',
                            // Not advertised at any tier below Growth.
                            'recurring_invoices', 'fund_management', 'bank_reconciliation',
                            'e_invoicing',
                        ];

                        if (in_array($key, $counterDisabledKeys, true)) {
                            $val = '0';
                        }
                        if ($key === 'sku_limit') $val = '2000';
                        if ($key === 'staff_limit') $val = '2';
                        if ($key === 'location_limit' || $key === 'locations') $val = '1';
                        if ($key === 'ai_pages_limit') $val = '10';
                        if ($key === 'ai_queries_limit') $val = '50';
                    }

                    // Specific AppSumo customizations to preserve V4 build plan specs (single source of truth: 1000 / 3000 / 8000):
                    if ($slug === 'ltd_1' && $key === 'transactions_per_month') $val = '1000';
                    if ($slug === 'ltd_2' && $key === 'transactions_per_month') $val = '3000';
                    if ($slug === 'ltd_3' && $key === 'transactions_per_month') $val = '8000';
                    if ($slug === 'ltd_2' && str_starts_with($key, 'woocommerce')) $val = '0';
                    if ($slug === 'ltd_3' && str_starts_with($key, 'woocommerce')) $val = '0';

                    // Launch Readiness §1.3: LTD plans receive bounded managed AI (50 pages / 250 queries) with BYOK beyond
                    if (str_starts_with($slug, 'ltd_') && $key === 'ai_pages_limit') $val = '50';
                    if (str_starts_with($slug, 'ltd_') && $key === 'ai_queries_limit') $val = '250';

                    // Write/Update using updateOrInsert to prevent duplicate constraints
                    DB::table('plan_limits')->updateOrInsert(
                        ['plan_id' => $pid, 'key' => $key],
                        [
                            'value' => $val !== null ? (string)$val : null,
                            'reset_period' => ($key === 'transactions_per_month') ? 'monthly' : 'never',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                }
            }
        });
    }
}

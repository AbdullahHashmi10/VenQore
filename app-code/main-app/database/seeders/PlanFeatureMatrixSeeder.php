<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanFeatureMatrixSeeder extends Seeder
{
    public function run(): void
    {
        $planSlugs = ['trial', 'solo', 'starter', 'core', 'scale', 'custom', 'growth', 'business', 'ltd_1', 'ltd_2', 'ltd_3'];
        $pricingConfig = config('pricing.plans', []);
        
        $websiteId = DB::table('platforms')->where('slug', 'website')->value('id') ?? 1;
        $appsumoId = DB::table('platforms')->where('slug', 'appsumo')->value('id') ?? 2;

        $planIds = [];
        foreach ($planSlugs as $slug) {
            $configKey = match ($slug) {
                'growth' => 'core',
                'business' => 'scale',
                default => $slug,
            };

            $planInfo = $pricingConfig[$configKey] ?? null;
            $name = match ($slug) {
                'growth' => 'Core (Legacy Growth)',
                'business' => 'Scale (Legacy Business)',
                default => ($planInfo['name'] ?? ucfirst($slug)),
            };

            $priceMonthly = $planInfo['price_monthly'] ?? 0;
            $priceAnnual = $planInfo['price_annual'] ?? 0;
            $isVisible = !str_starts_with($slug, 'ltd_') && !in_array($slug, ['growth', 'business'], true);
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

        // Define feature matrix default mappings across tiers according to V11 Spec §1
        $matrix = [
            // Group 1 — Onboarding & System Setup (Universal)
            'demo_store'                 => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'free_trial_days'            => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '0'],
            'instant_store_creator'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'industry_seeding'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'dark_theme'                 => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'light_theme'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'multi_store_hub'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'multi_store_roles'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'cashier_pin_login'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'], // Till logins free & unlimited on paid; 2 on Solo
            'device_adaptive'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'pwa_install'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'guided_setup_tour'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'coupon_stacking'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'platform_status_badge'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'system_cache_refresher'     => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'owner_profile_card'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'one_click_system_wipe'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'smtp_mail'                  => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'sms_gateway'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Scale Fences — Security, Audit & Custom Roles (V11 §1.3: Core & Scale included, $39 add-on on Starter)
            'security_activity_log'      => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'audit_trail'                => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'custom_roles'               => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],

            // Group 2 — POS & Checkout (Universal — ON for Solo too)
            'pos'                        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'barcode_scanner'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'imei_scanner'               => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'], // Universal in V11
            'serial_tracking'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'], // Universal in V11
            'keyboard_hotkeys'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'senior_mode'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'high_contrast_colors'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'profit_peek'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'cart_tabs_limit'            => ['solo' => '5', 'starter' => '10', 'core' => '25', 'scale' => '50'],
            'park_recall'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'inflight_product_creation'  => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'cart_session_protection'    => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'contextual_qty_modifiers'   => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'auto_customer_discounts'    => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'fuzzy_product_finder'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'auto_cash_rounding'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'split_payments'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'daily_cash_audit'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'silent_webusb_printing'     => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'receipt_cutline_padding'    => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'custom_thermal_widths'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'dynamic_accent_colors'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'invoice_column_toggles'     => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'amount_to_words'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'receipt_qr_code'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'branded_receipt_sync'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'pos_negative_stock_alert'   => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'negative_stock_lock'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'service_fee_additions'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'auto_vat_gst'               => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'custom_charge_toggle'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'fuzzy_customer_lookup'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'recent_invoices_panel'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'cashier_change_helper'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'barcode_label_print'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'label_qr_codes'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'barcode_label_factory'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Group 3 — Invoicing, Customer Khata & Receivables
            'customer_khata'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'customer_payments_log'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'customer_statements'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'aged_receivables'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'credit_limit_rules'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'multi_payment_invoices'     => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'customer_payment_alloc'     => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'anniversary_tracker'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'customer_ltv_score'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'customer_wallet'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'loyalty_points'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'], // Universal in V11
            'digital_gift_cards'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'], // Universal in V11
            'marketing_campaigns'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'], // Universal in V11
            'wholesale_pricing'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'b2b_proposal_builder'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'quotation_conversion'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'inflight_session_recovery'  => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'tax_inclusive_exclusive'    => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'b2b_margin_displayer'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'sales_return_vouchers'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'b2b_invoice_designer'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'pre_sales_reservation'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'refund_reason_analysis'     => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'tax_exempt_customers'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'customer_address_book'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'a4_invoice_pdf'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'letter_size_invoice'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'outstanding_balance_grid'   => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'payment_due_dates'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'overdue_highlights'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'lump_sum_payments'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'partial_payment_indicator'  => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'unified_party_ledger'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Invoicing schedule & reminders (Included for Solo)
            'recurring_invoices'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'invoice_reminders'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Group 4 — Procurement & Suppliers (Universal)
            'supplier_khata'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'delayed_supplier_payments'  => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'supplier_statements'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'aged_payables'              => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'installment_payments'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'purchase_orders'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'partial_shipments'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'supplier_debit_notes'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'auto_cost_adjuster'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'cost_price_fluctuator'      => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'supplier_lead_time'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'landing_costs'              => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'suppliers_directory'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'supplier_sku_mapping'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'inbound_expiry_tracking'    => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'purchase_returns'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'auto_po_generation'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'bulk_supplier_payments'     => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'purchase_pdf_upload'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'reconciled_bank_payments'   => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'tax_inclusive_procurement'  => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'supplier_outstanding_alerts'=> ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'supplier_refund_tracker'    => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'custom_payment_terms'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Group 5 — Inventory, Production & Scale Fences
            'locations'                  => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '10'],
            'location_limit'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '10'],
            'stock_transfer'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'product_variants'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'fifo_costing'               => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'batch_tracking'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'batch_expiry'               => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'stock_take_audit'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'disaster_claim'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Manufacturing & BOM (Universal in V11 §1.1 — ON for Solo too)
            'bill_of_materials'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'production'                 => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'manufacturing'              => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'auto_assembly_logic'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'auto_assembly_checkout'     => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'production_simulator'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'recipe_history_archival'    => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'product_history_timeline'   => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'category_management'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'stock_levels_view'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'low_stock_alerts'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'uom_converter'              => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Core Limits (V11 §1 Table)
            'sku_limit'                  => ['solo' => '500', 'starter' => '5000', 'core' => '25000', 'scale' => '250000'],
            'staff_limit'                => ['solo' => '1', 'starter' => '1', 'core' => '5', 'scale' => '25'],
            'till_logins'                => ['solo' => '2', 'starter' => null, 'core' => null, 'scale' => null],
            'registers'                  => ['solo' => '1', 'starter' => '2', 'core' => '6', 'scale' => '20'],
            'devices_per_seat'           => ['solo' => '2', 'starter' => '3', 'core' => '3', 'scale' => '5'],
            'visible_history_days'       => ['solo' => '30', 'starter' => null, 'core' => null, 'scale' => null],
            'transactions_per_month'     => ['solo' => '100', 'starter' => null, 'core' => null, 'scale' => null],
            'service_jobs_per_month'     => ['solo' => '20', 'starter' => null, 'core' => null, 'scale' => null],

            // Scale Fence 1 — Multi-branch (V11 §1.3: Scale included, Starter & Core activate with 2nd location)
            'multi_branch'               => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],

            // Scale Fences — E-Commerce & Channels
            'woocommerce'                => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'amazon_sync'                => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'ebay_sync'                  => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'tiktok_sync'                => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'woocommerce_customer_reg'   => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'woocommerce_stock_sync'     => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'woocommerce_orders_bridge'  => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'web_catalog_toggles'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Scale Fences — API & Webhooks (V11 §1.3: Core & Scale included, $29 add-on on Starter)
            'api_access'                 => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'webhooks'                   => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'api_webhooks'               => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],

            // Scale Fence — White Label (V11 §1.3: Scale included, $49 add-on on Core)
            'white_label'                => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],

            // Scale Fence — Network Unlimited & Consolidated Reporting (V11 §1.3)
            'network_basic'              => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'network_unlimited'          => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'consolidated_reporting'     => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],

            // Group 7 — Double-Entry Accounting & Finance (Universal vs Paid-only)
            'double_entry_ledger'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'cash_account_reconciliation'=> ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'loan_ledger'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'inter_register_transfers'   => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'advance_allocation'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'debit_credit_notes'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'tax_summary_engine'         => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'expense_manager'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'charity_engine'             => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'petty_cash'                 => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Finance & Compliance modules (Included on Solo)
            'fixed_asset_depreciation'   => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'fiscal_year_closing'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'bank_reconciliation'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'e_invoicing'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'fund_management'            => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'google_drive_backup'        => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'adviser_seat'               => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Group 8 — Reports (SPEC_REPORTING_TIERS_FINAL)
            'reports'                    => ['solo' => 'basic', 'starter' => 'advanced', 'core' => 'advanced', 'scale' => 'advanced'],
            'visible_history_days'       => ['solo' => '30', 'starter' => null, 'core' => null, 'scale' => null],
            // Starter (10 keys)
            'report_sales_records'       => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'report_purchase_records'    => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'report_stock_records'       => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'report_stock_valuation'     => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'report_profit_loss'         => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'report_cash_flow'           => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'report_expenses'            => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'report_tax'                 => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'report_day_book'            => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'report_party_records'       => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            // Core (8 keys)
            'report_sales_analytics'     => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'report_profitability'       => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'report_discounts'           => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'report_aging'               => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'report_balance_sheet'       => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'report_expense_analysis'    => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'report_party_insights'      => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'owners_daily_pulse'         => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1', 'ltd_1' => '0', 'ltd_2' => '1', 'ltd_3' => '1'],
            // Scale (5 keys)
            'report_ledger'              => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'report_point_in_time'       => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'report_cross_party'         => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'report_loans'               => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'report_export'              => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],

            // Group 9 — AI, Signals & Builder
            'ai_assistant'               => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'smart_capture'              => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'hypersearch_byok'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'ai_credits_monthly'         => ['solo' => '100', 'starter' => '500', 'core' => '2000', 'scale' => '10000'],
            'ai_scans_monthly'           => ['solo' => '10', 'starter' => null, 'core' => null, 'scale' => null],
            'ai_system_builder'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'growth_engine'              => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1', 'ltd_1' => '0', 'ltd_2' => '0', 'ltd_3' => '0'],
            'growth_signals'             => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1', 'ltd_1' => '0', 'ltd_2' => '0', 'ltd_3' => '0'],
            'bulk_upload'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'live_chat_widget'           => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            // Group 10 — Building Blocks, Services & Industry Features (Universal in V11 §1.1)
            'services'                   => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'service_jobs'               => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'service_contracts'          => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'optical_prescription'       => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'tailor_measurements'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'jewelry_metal_rates'        => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'work_orders'                => ['solo' => '1', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            'chat_support' => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],
            'dedicated_account_manager' => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '1'],
            'recurring_invoicing' => ['solo' => '1', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'vensync_command' => ['solo' => '0', 'starter' => '0', 'core' => '1', 'scale' => '1'],
            'whatsapp_reminders' => ['solo' => '0', 'starter' => '1', 'core' => '1', 'scale' => '1'],

            'ltd'                        => ['solo' => '0', 'starter' => '0', 'core' => '0', 'scale' => '0', 'ltd_1' => '1', 'ltd_2' => '1', 'ltd_3' => '1'],
        ];

        // Seed/Update limits for all plans (including LTD equivalents) in a single transaction
        DB::transaction(function () use ($matrix, $planSlugs, $planIds) {
            foreach ($matrix as $key => $values) {
                foreach ($planSlugs as $slug) {
                    $pid = $planIds[$slug] ?? null;
                    if (!$pid) continue;

                    // Resolve values for LTD, trial, and alias plans from their base equivalents:
                    // trial = core, growth = core, business = scale, ltd_1 = starter, ltd_2 = core, ltd_3 = scale
                    $baseSlug = match ($slug) {
                        'trial', 'growth' => 'core',
                        'custom', 'business' => 'scale',
                        'ltd_1'           => 'starter',
                        'ltd_2'           => 'core',
                        'ltd_3'           => 'scale',
                        default           => $slug,
                    };

                    $val = array_key_exists($slug, $values)
                        ? $values[$slug]
                        : (array_key_exists($baseSlug, $values)
                            ? $values[$baseSlug]
                            : (array_key_exists('starter', $values) ? $values['starter'] : '0'));

                    // For trial and custom, reporting keys get Scale set (all 23 reports accessible per SPEC_REPORTING_TIERS_FINAL Part C)
                    if (($slug === 'trial' || $slug === 'custom') && (str_starts_with($key, 'report_') || $key === 'owners_daily_pulse')) {
                        $val = $values['scale'] ?? '1';
                    }

                    // LTD Specific overrides per V11 Spec §7
                    if (str_starts_with($slug, 'ltd_')) {
                        // Fences always off on LTD tiers (except multi-branch on ltd_2/ltd_3 and channel sync on ltd_3)
                        $ltdFencesOff = [
                            'api_access', 'webhooks', 'api_webhooks', 'white_label',
                            'security_activity_log', 'audit_trail', 'custom_roles',
                            'consolidated_reporting', 'network_unlimited',
                        ];
                        if (in_array($key, $ltdFencesOff, true)) {
                            $val = '0';
                        }
                    }

                    if ($slug === 'ltd_1') {
                        if ($key === 'sku_limit') $val = '5000';
                        if ($key === 'staff_limit') $val = '1';
                        if ($key === 'locations' || $key === 'location_limit') $val = '1';
                        if ($key === 'registers') $val = '2';
                        if ($key === 'devices_per_seat') $val = '3';
                        if ($key === 'ai_credits_annual') $val = '12000';
                        if ($key === 'multi_branch') $val = '0';
                        if ($key === 'woocommerce' || $key === 'amazon_sync' || $key === 'ebay_sync' || $key === 'tiktok_sync') $val = '0';
                    } elseif ($slug === 'ltd_2') {
                        if ($key === 'sku_limit') $val = '25000';
                        if ($key === 'staff_limit') $val = '2';
                        if ($key === 'locations' || $key === 'location_limit') $val = '2';
                        if ($key === 'registers') $val = '4';
                        if ($key === 'devices_per_seat') $val = '3';
                        if ($key === 'ai_credits_annual') $val = '30000';
                        if ($key === 'multi_branch') $val = '1';
                        if ($key === 'woocommerce' || $key === 'amazon_sync' || $key === 'ebay_sync' || $key === 'tiktok_sync') $val = '0';
                    } elseif ($slug === 'ltd_3') {
                        if ($key === 'sku_limit') $val = '50000';
                        if ($key === 'staff_limit') $val = '5';
                        if ($key === 'locations' || $key === 'location_limit') $val = '5';
                        if ($key === 'registers') $val = '10';
                        if ($key === 'devices_per_seat') $val = '3';
                        if ($key === 'ai_credits_annual') $val = '60000';
                        if ($key === 'multi_branch') $val = '1';
                        if ($key === 'woocommerce') $val = '1'; // 1 channel sync included
                    }

                    // Monthly transaction allowances: 100 for Solo; unlimited (null) for ltd_1, ltd_2, ltd_3 and standard subscription plans
                    if ($key === 'transactions_per_month') {
                        $val = ($slug === 'solo') ? '100' : null;
                    }

                    // Service jobs unlimited across all paid & LTD plans; 20 for Solo
                    if ($key === 'service_jobs_per_month') {
                        $val = ($slug === 'solo') ? '20' : null;
                    }

                    // Write/Update using updateOrInsert to prevent duplicate constraints
                    DB::table('plan_limits')->updateOrInsert(
                        ['plan_id' => $pid, 'key' => $key],
                        [
                            'value' => $val !== null ? (string)$val : null,
                            'reset_period' => in_array($key, ['transactions_per_month', 'service_jobs_per_month', 'ai_credits_monthly'], true) ? 'monthly' : 'never',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                }
            }
        });

        // Invalidate all plan limit caches
        foreach ($planSlugs as $slug) {
            \App\Services\PlanRepository::invalidatePlanCache($slug);
        }
    }
}

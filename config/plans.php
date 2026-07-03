<?php

/**
 * Plan Limits — REFERENCE COPY + LAST-RESORT FALLBACK ONLY
 *
 * ⚠️ THIS FILE IS **NOT** THE RUNTIME SOURCE OF TRUTH. (Header corrected 2026-07-03.)
 *
 * The runtime source of truth is the `plan_limits` TABLE, written by
 * `database/seeders/PlanFeatureMatrixSeeder.php` and read through
 * `App\Services\PlanRepository` → `Tenant::getLimit()` → `PlanGate`.
 *
 * This file is consulted in exactly ONE case: `PlanRepository::getLimits()`
 * falls back here when a plan slug has never been seeded into the DB
 * (fresh install mid-migration). Nothing else reads it — as of 2026-07-03
 * `Tenant::setPlanAttribute()` and `AppSumoController` snapshot LTD limits
 * from the table, not from this file.
 *
 * KEEP THIS FILE IN SYNC WITH THE SEEDER. Reconciled line-by-line on
 * 2026-07-03 (audit findings A1/A2/VNQ-011/VNQ-012):
 *   - transactions_per_month for subscription plans = null (UNLIMITED — decided:
 *     subscriptions are uncapped; only AppSumo LTD tiers carry caps 500/2000/6000).
 *   - growth sku_limit 10000; business staff_limit 50, locations 10 (seeder caps).
 *   - owners_daily_pulse: Growth+ (matches seeder).
 *   - dedicated keys: recurring_invoices, fund_management, loyalty_points,
 *     digital_gift_cards.
 *
 * null  = unlimited · false = disabled · int = numeric cap
 *
 * AppSumo LTD stacking:
 *   1 code  → ltd_1 (starter-equivalent) · 2 codes → ltd_2 (growth-equivalent)
 *   3 codes → ltd_3 (business-equivalent). LTD never expires; hosting included
 *   2 years, then $9/month to stay hosted.
 */

return [

    'starter' => [
        'transactions_per_month' => null,   // unlimited (subscriptions uncapped — 2026-07-03 decision)
        'locations'    => 1,
        'sku_limit'    => 1000,
        'staff_limit'  => 3,
        'woocommerce'  => false,
        'api_access'   => false,
        'reports'      => 'basic',
        'growth_engine'=> false,
        'multi_branch' => false,
        'owners_daily_pulse' => false,      // Growth+ (matches seeder)
        'production'         => false,
        'e_invoicing'        => false,
        'bank_reconciliation'=> false,
        'marketing_campaigns'=> false,
        'invoice_reminders'  => false,
        'recurring_invoices' => false,
        'fund_management'    => false,
        'loyalty_points'     => false,
        'digital_gift_cards' => false,
        'report_profit_loss' => true,       // Starter includes P&L (2026-07-03 — the activation hook)
    ],

    'growth' => [
        'transactions_per_month' => null,   // unlimited
        'locations'    => 3,
        'sku_limit'    => 10000,            // matches seeder (was wrongly null/unlimited)
        'staff_limit'  => 10,
        'woocommerce'  => false,
        'api_access'   => false,
        'reports'      => 'advanced',
        'growth_engine'=> false,            // AI add-on key — off by default on all plans (matches seeder)
        'multi_branch' => true,
        'owners_daily_pulse' => true,
        'production'         => true,
        'e_invoicing'        => true,
        'bank_reconciliation'=> true,
        'marketing_campaigns'=> true,
        'invoice_reminders'  => true,
        'recurring_invoices' => true,
        'fund_management'    => true,
        'loyalty_points'     => false,
        'digital_gift_cards' => false,
        'report_profit_loss' => true,
    ],

    'business' => [
        'transactions_per_month' => null,   // unlimited
        'locations'    => 10,               // matches seeder (was wrongly null/unlimited)
        'sku_limit'    => 50000,            // matches seeder
        'staff_limit'  => 50,               // matches seeder (was wrongly null/unlimited)
        'woocommerce'  => false,
        'api_access'   => true,
        'reports'      => 'advanced',
        'growth_engine'=> false,            // AI add-on key — off by default (matches seeder)
        'multi_branch' => true,
        'owners_daily_pulse' => true,
        'production'         => true,
        'e_invoicing'        => true,
        'bank_reconciliation'=> true,
        'marketing_campaigns'=> true,
        'invoice_reminders'  => true,
        'recurring_invoices' => true,
        'fund_management'    => true,
        'loyalty_points'     => true,
        'digital_gift_cards' => true,
        'report_profit_loss' => true,
    ],

    // ── AppSumo LTD Plans (Phase 7) — mirror seeder: ltd_1=starter, ltd_2=growth,
    //    ltd_3=business equivalents, plus the tx caps from the AppSumo listing. ──

    'ltd_1' => [
        'transactions_per_month' => 500,
        'locations'    => 1,
        'sku_limit'    => 1000,
        'staff_limit'  => 3,
        'woocommerce'  => false,
        'api_access'   => false,
        'reports'      => 'basic',
        'growth_engine'=> false,
        'multi_branch' => false,
        'owners_daily_pulse' => false,
        'production'         => false,
        'e_invoicing'        => false,
        'bank_reconciliation'=> false,
        'marketing_campaigns'=> false,
        'invoice_reminders'  => false,
        'recurring_invoices' => false,
        'fund_management'    => false,
        'loyalty_points'     => false,
        'digital_gift_cards' => false,
        'report_profit_loss' => true,
        'bill_of_materials'  => false,
        'ltd'          => true,
        'hosted_until' => '+2 years',
    ],

    'ltd_2' => [
        'transactions_per_month' => 2000,
        'locations'    => 3,
        'sku_limit'    => 10000,            // growth-equivalent (matches seeder)
        'staff_limit'  => 10,
        'woocommerce'  => false,
        'api_access'   => false,
        'reports'      => 'advanced',
        'growth_engine'=> false,
        'multi_branch' => true,
        'owners_daily_pulse' => true,
        'production'         => true,
        'e_invoicing'        => true,
        'bank_reconciliation'=> true,
        'marketing_campaigns'=> true,
        'invoice_reminders'  => true,
        'recurring_invoices' => true,
        'fund_management'    => true,
        'loyalty_points'     => false,
        'digital_gift_cards' => false,
        'report_profit_loss' => true,
        'bill_of_materials'  => true,
        'ltd'          => true,
        'hosted_until' => '+2 years',
    ],

    'ltd_3' => [
        'transactions_per_month' => 6000,
        'locations'    => 10,               // business-equivalent (matches seeder)
        'sku_limit'    => 50000,
        'staff_limit'  => 50,
        'woocommerce'  => false,
        'api_access'   => true,
        'reports'      => 'advanced',
        'growth_engine'=> false,
        'multi_branch' => true,
        'owners_daily_pulse' => true,
        'production'         => true,
        'e_invoicing'        => true,
        'bank_reconciliation'=> true,
        'marketing_campaigns'=> true,
        'invoice_reminders'  => true,
        'recurring_invoices' => true,
        'fund_management'    => true,
        'loyalty_points'     => true,
        'digital_gift_cards' => true,
        'report_profit_loss' => true,
        'bill_of_materials'  => true,
        'ltd'          => true,
        'hosted_until' => '+2 years',
    ],
];

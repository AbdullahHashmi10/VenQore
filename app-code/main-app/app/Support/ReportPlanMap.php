<?php

namespace App\Support;

use App\Models\Tenant;
use App\Services\PlanGate;

/**
 * ReportPlanMap — Gating analytical reports by subscription plan tier.
 *
 * Operational reports are free across all plans (Solo and up).
 * Analytical reports (profit & loss, balance sheet, valuation, etc.) require
 * Starter plan and up.
 */
class ReportPlanMap
{
    /**
     * Map of report route suffix -> required plan feature key.
     * Suffix is the portion after 'store.reports.' or 'store.v3.reports.'.
     */
    public const REQUIRED_PLAN_FEATURES = [
        // ── Profit & Loss Family ───────────────────────────────────────────
        'profit-loss'                      => 'report_profit_loss',
        'gross-profit'                     => 'report_profit_loss',
        'cogs'                             => 'report_profit_loss',
        'balance-sheet'                    => 'report_profit_loss',
        'refund-reasons'                   => 'report_profit_loss',

        // ── Trial Balance & General Ledger ─────────────────────────────────
        'trial-balance'                    => 'report_trial_balance',
        'account-ledger'                   => 'report_trial_balance',

        // ── Cash Flow ──────────────────────────────────────────────────────
        'cash-flow'                        => 'cash_flow_report',

        // ── Stock Valuation ────────────────────────────────────────────────
        'stock-valuation'                  => 'stock_valuation',
        'inventory-valuation'              => 'stock_valuation',

        // ── Point In Time Inventory ────────────────────────────────────────
        'point-in-time-inventory'          => 'point_in_time_inventory',
        'point-in-time-inventory.details'  => 'point_in_time_inventory',

        // ── Stock Aging ────────────────────────────────────────────────────
        'stock-aging'                      => 'stock_aging',

        // ── Sales Aging ────────────────────────────────────────────────────
        'sale-aging'                       => 'report_sales_aging',

        // ── Customer & Supplier Insights ───────────────────────────────────
        'customer-insights'                => 'customer_insights',
        'customer-insights.details'        => 'customer_insights',
        'supplier-insights'                => 'supplier_insights',
        'supplier-insights.details'        => 'supplier_insights',

        // ── Discount Analytics ─────────────────────────────────────────────
        'discount'                         => 'discount_report',
        'discount-report'                  => 'discount_report',
        'item-wise-discount'               => 'discount_report',

        // ── Profitability Analysis ─────────────────────────────────────────
        'party-wise-profit-loss'           => 'report_profitability_analysis',
        'item-wise-profit'                 => 'report_profitability_analysis',
        'item-category-wise-profit-loss'   => 'report_profitability_analysis',
        'bill-wise-profit'                 => 'report_profitability_analysis',

        // ── Sales Analysis ─────────────────────────────────────────────────
        'sale-purchase-by-party'           => 'report_sales_analysis',
        'sale-purchase-by-party-group'     => 'report_sales_analysis',
        'sale-purchase-by-item-category'   => 'report_sales_analysis',
        'item-report-by-party'             => 'report_sales_analysis',
        'party-report-by-item'             => 'report_sales_analysis',
        'analytics'                        => 'report_sales_analysis',

        // ── Expense Analysis ───────────────────────────────────────────────
        'expense-by-item'                  => 'report_expense_analysis',

        // ── Export ─────────────────────────────────────────────────────────
        'export'                           => 'report_export',
    ];

    /**
     * Alias constant for tests / map consumers.
     */
    public const MAP = self::REQUIRED_PLAN_FEATURES;

    /**
     * Get the required plan feature for a report suffix, or null if free.
     */
    public static function requiresPlanFeature(string $suffix): ?string
    {
        return self::REQUIRED_PLAN_FEATURES[$suffix] ?? null;
    }

    /**
     * Check if a report is visible / entitled under the tenant's plan.
     */
    public static function visible(?Tenant $tenant, string $suffix): bool
    {
        $featureKey = self::requiresPlanFeature($suffix);

        // If not mapped, the report is free / operational
        if ($featureKey === null) {
            return true;
        }

        if (!$tenant) {
            return true;
        }

        return PlanGate::check($featureKey, $tenant);
    }

    /**
     * Human-readable label for the feature.
     */
    public static function labelFor(string $featureKey): string
    {
        return match ($featureKey) {
            'report_profit_loss'            => 'Profit & Loss Reporting',
            'report_trial_balance'          => 'Trial Balance',
            'cash_flow_report'              => 'Cash Flow Statement',
            'stock_valuation'               => 'Stock Valuation',
            'point_in_time_inventory'       => 'Point-in-time Inventory',
            'stock_aging'                   => 'Stock Aging',
            'report_sales_aging'            => 'Sales Aging',
            'customer_insights'             => 'Customer Insights',
            'supplier_insights'             => 'Supplier Insights',
            'discount_report'               => 'Discount Analytics',
            'report_profitability_analysis' => 'Profitability Analysis',
            'report_sales_analysis'         => 'Sales Analysis',
            'report_expense_analysis'        => 'Expense Analysis',
            'report_export'                 => 'Report Data Export',
            default                         => 'Analytical Reports',
        };
    }
}

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
        // ── Analytical Reports (Paid from Starter and up) ────────────────────
        'profit-loss'                      => 'report_profit_loss',
        'gross-profit'                     => 'report_profit_loss',
        'cogs'                             => 'report_profit_loss',
        'balance-sheet'                    => 'report_profit_loss',
        'trial-balance'                    => 'report_trial_balance',
        'cash-flow'                        => 'cash_flow_report',
        'account-ledger'                   => 'report_account_ledger',
        'stock-valuation'                  => 'stock_valuation',
        'inventory-valuation'              => 'stock_valuation',
        'point-in-time-inventory'          => 'point_in_time_inventory',
        'point-in-time-inventory.details'  => 'point_in_time_inventory',
        'stock-aging'                      => 'stock_aging',
        'sale-aging'                       => 'report_sales_aging',
        'customer-insights'                => 'customer_insights',
        'customer-insights.details'        => 'customer_insights',
        'supplier-insights'                => 'supplier_insights',
        'supplier-insights.details'        => 'supplier_insights',
        'party-wise-profit-loss'           => 'report_party_profitability',
        'sale-purchase-by-party'           => 'report_sales_by_party',
        'sale-purchase-by-party-group'     => 'report_sales_party_group',
        'sale-purchase-by-item-category'   => 'report_sales_by_party',
        'item-report-by-party'             => 'report_item_by_party',
        'party-report-by-item'             => 'report_party_by_item',
        'item-wise-profit'                 => 'report_item_profit',
        'item-category-wise-profit-loss'   => 'report_category_pl',
        'bill-wise-profit'                 => 'report_bill_profitability',
        'analytics'                        => 'report_graph_analytics',
        'discount'                         => 'discount_report',
        'discount-report'                  => 'discount_report',
        'item-wise-discount'               => 'report_item_discounting',
        'refund-reasons'                   => 'report_profit_loss',
        'expense-by-item'                  => 'report_expense_by_item',
        'export'                           => 'report_profit_loss',
    ];

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
            'report_profit_loss'         => 'Profit & Loss Reporting',
            'cash_flow_report'           => 'Cash Flow Statement',
            'stock_valuation'            => 'Stock Valuation',
            'discount_report'            => 'Discount Analytics',
            'customer_insights'          => 'Customer Insights',
            'supplier_insights'          => 'Supplier Insights',
            'stock_aging'                => 'Stock Aging',
            'report_sales_aging'         => 'Sales Aging',
            'report_trial_balance'       => 'Trial Balance',
            'report_account_ledger'      => 'Account Ledger',
            'report_party_profitability' => 'Party Profitability',
            'report_item_profit'         => 'Item Profitability',
            'report_bill_profitability'  => 'Bill Profitability',
            'report_graph_analytics'     => 'Visual Analytics',
            'report_category_pl'         => 'Category P&L',
            'report_item_discounting'    => 'Item Discounting Report',
            'report_expense_by_item'     => 'Expense by Item',
            'point_in_time_inventory'    => 'Point-in-time Inventory',
            default                      => 'Analytical Reports',
        };
    }
}

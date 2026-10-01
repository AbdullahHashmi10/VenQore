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
        // ── Starter (10 keys, 19 reports) ──────────────────────────────────
        'sales'                            => 'report_sales_records',
        'sale-orders'                      => 'report_sales_records',
        'sale-order-items'                 => 'report_sales_records',
        'daily-sales'                      => 'report_sales_records',
        'purchases'                        => 'report_purchase_records',
        'purchase-returns'                 => 'report_purchase_records',
        'low-stock'                        => 'report_stock_records',
        'movement-history'                 => 'report_stock_records',
        'inventory-movement'               => 'report_stock_records',
        'stock-summary-by-category'        => 'report_stock_records',
        'item-detail'                      => 'report_stock_records',
        'expiry'                           => 'report_stock_records',
        'stock-valuation'                  => 'report_stock_valuation',
        'inventory-valuation'              => 'report_stock_valuation',
        'profit-loss'                      => 'report_profit_loss',
        'gross-profit'                     => 'report_profit_loss',
        'cogs'                             => 'report_profit_loss',
        'refund-reasons'                   => 'report_profit_loss',
        'cash-flow'                        => 'report_cash_flow',
        'bank-statement'                   => 'report_cash_flow',
        'expenses'                         => 'report_expenses',
        'tax'                              => 'report_tax',
        'tax-rate'                         => 'report_tax',
        'day-book'                         => 'report_day_book',
        'all-parties'                      => 'report_party_records',
        'party-statement'                  => 'report_party_records',
        'party-ledger'                     => 'report_party_records',

        // ── Core (8 keys, 12 reports) ──────────────────────────────────────
        'analytics'                        => 'report_sales_analytics',
        'item-wise-profit'                 => 'report_profitability',
        'item-category-wise-profit-loss'   => 'report_profitability',
        'bill-wise-profit'                 => 'report_profitability',
        'party-wise-profit-loss'           => 'report_profitability',
        'discount'                         => 'report_discounts',
        'discount-report'                  => 'report_discounts',
        'item-wise-discount'               => 'report_discounts',
        'sale-aging'                       => 'report_aging',
        'aged-receivables'                 => 'report_aging',
        'aged-payables'                    => 'report_aging',
        'stock-aging'                      => 'report_aging',
        'balance-sheet'                    => 'report_balance_sheet',
        'expense-by-category'              => 'report_expense_analysis',
        'expense-by-item'                  => 'report_expense_analysis',
        'customer-insights'                => 'report_party_insights',
        'customer-insights.details'        => 'report_party_insights',
        'supplier-insights'                => 'report_party_insights',
        'supplier-insights.details'        => 'report_party_insights',
        'owner-daily-pulse'                => 'owners_daily_pulse',
        'owner-daily-pulse.verify'         => 'owners_daily_pulse',
        'owner-daily-pulse.setup'          => 'owners_daily_pulse',
        'owner-daily-pulse.lock'           => 'owners_daily_pulse',
        'owner-daily-pulse.note'           => 'owners_daily_pulse',

        // ── Scale (5 keys, 9 reports) ──────────────────────────────────────
        'trial-balance'                    => 'report_ledger',
        'account-ledger'                   => 'report_ledger',
        'transactions'                     => 'report_ledger',
        'point-in-time-inventory'          => 'report_point_in_time',
        'point-in-time-inventory.details'  => 'report_point_in_time',
        'sale-purchase-by-party'           => 'report_cross_party',
        'sale-purchase-by-party-group'     => 'report_cross_party',
        'sale-purchase-by-item-category'   => 'report_cross_party',
        'item-report-by-party'             => 'report_cross_party',
        'party-report-by-item'             => 'report_cross_party',
        'loan-statement'                   => 'report_loans',
        'export'                           => 'report_export',
    ];

    /**
     * Alias constant for tests / map consumers.
     */
    public const MAP = self::REQUIRED_PLAN_FEATURES;

    /**
     * Tier mapping for each feature key.
     */
    public const FEATURE_TIERS = [
        'report_sales_records'    => 'Starter',
        'report_purchase_records' => 'Starter',
        'report_stock_records'    => 'Starter',
        'report_stock_valuation'  => 'Starter',
        'report_profit_loss'      => 'Starter',
        'report_cash_flow'        => 'Starter',
        'report_expenses'         => 'Starter',
        'report_tax'              => 'Starter',
        'report_day_book'         => 'Starter',
        'report_party_records'    => 'Starter',

        'report_sales_analytics'  => 'Core',
        'report_profitability'    => 'Core',
        'report_discounts'        => 'Core',
        'report_aging'            => 'Core',
        'report_balance_sheet'    => 'Core',
        'report_expense_analysis' => 'Core',
        'report_party_insights'   => 'Core',
        'owners_daily_pulse'      => 'Core',

        'report_ledger'           => 'Scale',
        'report_point_in_time'    => 'Scale',
        'report_cross_party'      => 'Scale',
        'report_loans'            => 'Scale',
        'report_export'           => 'Scale',
    ];

    /**
     * Action-oriented upgrade messages naming the decision.
     */
    public const REPORT_DECISION_MESSAGES = [
        'report_sales_records'    => 'Access detailed sales order and item breakdown — Starter',
        'report_purchase_records' => 'Track vendor purchases and returns history — Starter',
        'report_stock_records'    => 'Manage batch tracking, movement and expiry alerts — Starter',
        'report_stock_valuation'  => 'Calculate inventory value at cost and retail — Starter',
        'report_profit_loss'      => 'View detailed statement of profit and loss — Starter',
        'report_cash_flow'        => 'Review operating cash flows and bank statements — Starter',
        'report_expenses'         => 'Review comprehensive operational expenses — Starter',
        'report_tax'              => 'File accurate tax returns with rate breakdowns — Starter',
        'report_day_book'         => 'Inspect daily financial activity and chronologies — Starter',
        'report_party_records'    => 'Review customer and supplier statements — Starter',

        'report_sales_analytics'  => 'Analyze sales velocity, channels and trends — Core',
        'report_profitability'    => 'See which products are losing you money — Core',
        'report_discounts'        => 'Audit discounts and promotional margins — Core',
        'report_aging'            => 'Track overdue receivables and aging inventory — Core',
        'report_balance_sheet'    => 'Examine assets, liabilities and equity health — Core',
        'report_expense_analysis' => 'Break down expenses by category and item — Core',
        'report_party_insights'   => 'Identify top customers, dormant accounts and buying trends — Core',
        'owners_daily_pulse'      => 'Daily executive briefing and margin alerts — Core',

        'report_ledger'           => 'Double-entry trial balance and chart of accounts — Scale',
        'report_point_in_time'    => 'Reconstruct inventory levels at any date in the past — Scale',
        'report_cross_party'      => 'Multi-dimensional party and item matrix analysis — Scale',
        'report_loans'            => 'Audit debt schedules, principal and interest statements — Scale',
        'report_export'           => 'Export financial data to CSV, Excel and BI tools — Scale',
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
     * Human-readable tier name for a feature key.
     */
    public static function tierFor(string $featureKey): string
    {
        return self::FEATURE_TIERS[$featureKey] ?? 'Starter';
    }

    /**
     * Decision-oriented message for upgrading.
     */
    public static function decisionFor(string $featureKey): string
    {
        return self::REPORT_DECISION_MESSAGES[$featureKey] ?? 'Upgrade to unlock full report';
    }

    /**
     * Human-readable label for the feature.
     */
    public static function labelFor(string $featureKey): string
    {
        return match ($featureKey) {
            'report_sales_records'    => 'Sales Records & Orders',
            'report_purchase_records' => 'Purchase Records & Returns',
            'report_stock_records'    => 'Stock & Inventory Movement',
            'report_stock_valuation'  => 'Stock Valuation',
            'report_profit_loss'      => 'Profit & Loss Reporting',
            'report_cash_flow'        => 'Cash Flow Statement',
            'report_expenses'         => 'Expense Reporting',
            'report_tax'              => 'Tax & Rate Reporting',
            'report_day_book'         => 'Day Book Chronology',
            'report_party_records'    => 'Party Statements & Records',
            'report_sales_analytics'  => 'Sales Analytics & Trends',
            'report_profitability'    => 'Profitability & Margin Analysis',
            'report_discounts'        => 'Discount Analytics',
            'report_aging'            => 'Receivables & Stock Aging',
            'report_balance_sheet'    => 'Balance Sheet',
            'report_expense_analysis' => 'Expense Category Analysis',
            'report_party_insights'   => 'Customer & Supplier Insights',
            'owners_daily_pulse'      => "Owner's Daily Pulse",
            'report_ledger'           => 'Trial Balance & Ledgers',
            'report_point_in_time'    => 'Point-in-time Inventory',
            'report_cross_party'      => 'Cross-Party & Item Matrix',
            'report_loans'            => 'Loan & Debt Statements',
            'report_export'           => 'Report Data Export',
            default                   => 'Analytical Reports',
        };
    }
}

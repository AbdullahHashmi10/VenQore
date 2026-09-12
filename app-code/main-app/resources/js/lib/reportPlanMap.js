/**
 * Canonical report route -> required plan feature key mapping.
 * Matches App\Support\ReportPlanMap on the backend.
 */
export const REPORT_PLAN_FEATURES = {
    // ── Profit & Loss Family ───────────────────────────────────────────
    'store.reports.profit-loss': 'report_profit_loss',
    'store.reports.gross-profit': 'report_profit_loss',
    'store.v3.reports.gross-profit': 'report_profit_loss',
    'store.reports.cogs': 'report_profit_loss',
    'store.v3.reports.cogs': 'report_profit_loss',
    'store.reports.balance-sheet': 'report_profit_loss',
    'store.reports.refund-reasons': 'report_profit_loss',

    // ── Trial Balance & General Ledger ─────────────────────────────────
    'store.reports.trial-balance': 'report_trial_balance',
    'store.reports.account-ledger': 'report_trial_balance',

    // ── Cash Flow ──────────────────────────────────────────────────────
    'store.reports.cash-flow': 'cash_flow_report',

    // ── Stock Valuation ────────────────────────────────────────────────
    'store.reports.stock-valuation': 'stock_valuation',
    'store.reports.inventory-valuation': 'stock_valuation',

    // ── Point In Time Inventory ────────────────────────────────────────
    'store.reports.point-in-time-inventory': 'point_in_time_inventory',
    'store.reports.point-in-time-inventory.details': 'point_in_time_inventory',

    // ── Stock Aging ────────────────────────────────────────────────────
    'store.reports.stock-aging': 'stock_aging',

    // ── Sales Aging ────────────────────────────────────────────────────
    'store.reports.sale-aging': 'report_sales_aging',

    // ── Customer & Supplier Insights ───────────────────────────────────
    'store.reports.customer-insights': 'customer_insights',
    'store.reports.customer-insights.details': 'customer_insights',
    'store.reports.supplier-insights': 'supplier_insights',
    'store.reports.supplier-insights.details': 'supplier_insights',

    // ── Discount Analytics ─────────────────────────────────────────────
    'store.reports.discount': 'discount_report',
    'store.reports.discount-report': 'discount_report',
    'store.reports.item-wise-discount': 'discount_report',

    // ── Profitability Analysis ─────────────────────────────────────────
    'store.reports.party-wise-profit-loss': 'report_profitability_analysis',
    'store.reports.item-wise-profit': 'report_profitability_analysis',
    'store.reports.item-category-wise-profit-loss': 'report_profitability_analysis',
    'store.reports.bill-wise-profit': 'report_profitability_analysis',

    // ── Sales Analysis ─────────────────────────────────────────────────
    'store.reports.sale-purchase-by-party': 'report_sales_analysis',
    'store.reports.sale-purchase-by-party-group': 'report_sales_analysis',
    'store.reports.sale-purchase-by-item-category': 'report_sales_analysis',
    'store.reports.item-report-by-party': 'report_sales_analysis',
    'store.reports.party-report-by-item': 'report_sales_analysis',
    'store.reports.analytics': 'report_sales_analysis',

    // ── Expense Analysis ───────────────────────────────────────────────
    'store.reports.expense-by-item': 'report_expense_analysis',

    // ── Export ─────────────────────────────────────────────────────────
    'store.reports.export': 'report_export',
    'store.v3.reports.export': 'report_export',
};

/**
 * Check if a report route is locked based on shared planFeatures prop.
 *
 * If the route requires a plan feature that is false in planFeatures, returns true (locked).
 * If the route is not in the map (e.g. operational reports) or feature is true, returns false (unlocked).
 */
export function isReportLocked(routeName, planFeatures) {
    if (!routeName || !planFeatures || typeof planFeatures !== 'object') {
        return false;
    }
    const requiredFeature = REPORT_PLAN_FEATURES[routeName];
    if (!requiredFeature) {
        return false;
    }
    return planFeatures[requiredFeature] === false;
}
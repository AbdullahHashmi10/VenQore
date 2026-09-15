/**
 * Canonical report route -> required plan feature key mapping.
 * Matches App\Support\ReportPlanMap on the backend.
 */
export const REPORT_PLAN_FEATURES = {
    // ── Starter (10 keys, 19 reports) ──────────────────────────────────
    'store.reports.sales': 'report_sales_records',
    'store.v3.reports.sales': 'report_sales_records',
    'store.reports.sale-orders': 'report_sales_records',
    'store.reports.sale-order-items': 'report_sales_records',
    'store.reports.daily-sales': 'report_sales_records',

    'store.reports.purchases': 'report_purchase_records',
    'store.v3.reports.purchases': 'report_purchase_records',
    'store.reports.purchase-returns': 'report_purchase_records',

    'store.reports.low-stock': 'report_stock_records',
    'store.reports.movement-history': 'report_stock_records',
    'store.v3.reports.inventory-movement': 'report_stock_records',
    'store.reports.stock-summary-by-category': 'report_stock_records',
    'store.reports.item-detail': 'report_stock_records',
    'store.reports.expiry': 'report_stock_records',

    'store.reports.stock-valuation': 'report_stock_valuation',
    'store.reports.inventory-valuation': 'report_stock_valuation',
    'store.v3.reports.inventory-valuation': 'report_stock_valuation',

    'store.reports.profit-loss': 'report_profit_loss',
    'store.v3.reports.profit-loss': 'report_profit_loss',
    'store.reports.gross-profit': 'report_profit_loss',
    'store.v3.reports.gross-profit': 'report_profit_loss',
    'store.reports.cogs': 'report_profit_loss',
    'store.v3.reports.cogs': 'report_profit_loss',
    'store.reports.refund-reasons': 'report_profit_loss',

    'store.reports.cash-flow': 'report_cash_flow',
    'store.v3.reports.cash-flow': 'report_cash_flow',
    'store.reports.bank-statement': 'report_cash_flow',

    'store.reports.expenses': 'report_expenses',

    'store.reports.tax': 'report_tax',
    'store.v3.reports.tax': 'report_tax',
    'store.reports.tax-rate': 'report_tax',

    'store.reports.day-book': 'report_day_book',

    'store.reports.all-parties': 'report_party_records',
    'store.reports.party-statement': 'report_party_records',
    'store.v3.reports.party-ledger': 'report_party_records',

    // ── Core (8 keys, 12 reports) ──────────────────────────────────────
    'store.reports.analytics': 'report_sales_analytics',

    'store.reports.item-wise-profit': 'report_profitability',
    'store.reports.item-category-wise-profit-loss': 'report_profitability',
    'store.reports.bill-wise-profit': 'report_profitability',
    'store.reports.party-wise-profit-loss': 'report_profitability',

    'store.reports.discount': 'report_discounts',
    'store.reports.discount-report': 'report_discounts',
    'store.reports.item-wise-discount': 'report_discounts',

    'store.reports.sale-aging': 'report_aging',
    'store.v3.reports.aged-receivables': 'report_aging',
    'store.v3.reports.aged-payables': 'report_aging',
    'store.reports.stock-aging': 'report_aging',

    'store.reports.balance-sheet': 'report_balance_sheet',
    'store.v3.reports.balance-sheet': 'report_balance_sheet',

    'store.reports.expense-by-category': 'report_expense_analysis',
    'store.reports.expense-by-item': 'report_expense_analysis',

    'store.reports.customer-insights': 'report_party_insights',
    'store.reports.customer-insights.details': 'report_party_insights',
    'store.reports.supplier-insights': 'report_party_insights',
    'store.reports.supplier-insights.details': 'report_party_insights',

    'store.reports.owner-daily-pulse': 'owners_daily_pulse',
    'store.reports.owner-daily-pulse.verify': 'owners_daily_pulse',
    'store.reports.owner-daily-pulse.setup': 'owners_daily_pulse',
    'store.reports.owner-daily-pulse.lock': 'owners_daily_pulse',
    'store.reports.owner-daily-pulse.note': 'owners_daily_pulse',

    // ── Scale (5 keys, 9 reports) ──────────────────────────────────────
    'store.reports.trial-balance': 'report_ledger',
    'store.v3.reports.trial-balance': 'report_ledger',
    'store.reports.account-ledger': 'report_ledger',
    'store.reports.transactions': 'report_ledger',

    'store.reports.point-in-time-inventory': 'report_point_in_time',
    'store.reports.point-in-time-inventory.details': 'report_point_in_time',

    'store.reports.sale-purchase-by-party': 'report_cross_party',
    'store.reports.sale-purchase-by-party-group': 'report_cross_party',
    'store.reports.sale-purchase-by-item-category': 'report_cross_party',
    'store.reports.item-report-by-party': 'report_cross_party',
    'store.reports.party-report-by-item': 'report_cross_party',

    'store.reports.loan-statement': 'report_loans',

    'store.reports.export': 'report_export',
    'store.v3.reports.export': 'report_export',
};

/**
 * Tier names corresponding to each plan feature key.
 */
export const REPORT_FEATURE_TIERS = {
    "report_sales_records": "Starter",
    "report_purchase_records": "Starter",
    "report_stock_records": "Starter",
    "report_stock_valuation": "Starter",
    "report_profit_loss": "Starter",
    "report_cash_flow": "Starter",
    "report_expenses": "Starter",
    "report_tax": "Starter",
    "report_day_book": "Starter",
    "report_party_records": "Starter",

    "report_sales_analytics": "Core",
    "report_profitability": "Core",
    "report_discounts": "Core",
    "report_aging": "Core",
    "report_balance_sheet": "Core",
    "report_expense_analysis": "Core",
    "report_party_insights": "Core",
    "owners_daily_pulse": "Core",

    "report_ledger": "Scale",
    "report_point_in_time": "Scale",
    "report_cross_party": "Scale",
    "report_loans": "Scale",
    "report_export": "Scale",
};

/**
 * Decision-driven upgrade copy per feature key.
 */
export const REPORT_DECISION_MESSAGES = {
    "report_sales_records": "Access detailed sales order and item breakdown — Starter",
    "report_purchase_records": "Track vendor purchases and returns history — Starter",
    "report_stock_records": "Manage batch tracking, movement and expiry alerts — Starter",
    "report_stock_valuation": "Calculate inventory value at cost and retail — Starter",
    "report_profit_loss": "View detailed statement of profit and loss — Starter",
    "report_cash_flow": "Review operating cash flows and bank statements — Starter",
    "report_expenses": "Review comprehensive operational expenses — Starter",
    "report_tax": "File accurate tax returns with rate breakdowns — Starter",
    "report_day_book": "Inspect daily financial activity and chronologies — Starter",
    "report_party_records": "Review customer and supplier statements — Starter",

    "report_sales_analytics": "Analyze sales velocity, channels and trends — Core",
    "report_profitability": "See which products are losing you money — Core",
    "report_discounts": "Audit discounts and promotional margins — Core",
    "report_aging": "Track overdue receivables and aging inventory — Core",
    "report_balance_sheet": "Examine assets, liabilities and equity health — Core",
    "report_expense_analysis": "Break down expenses by category and item — Core",
    "report_party_insights": "Identify top customers, dormant accounts and buying trends — Core",
    "owners_daily_pulse": "Daily executive briefing and margin alerts — Core",

    "report_ledger": "Double-entry trial balance and chart of accounts — Scale",
    "report_point_in_time": "Reconstruct inventory levels at any date in the past — Scale",
    "report_cross_party": "Multi-dimensional party and item matrix analysis — Scale",
    "report_loans": "Audit debt schedules, principal and interest statements — Scale",
    "report_export": "Export financial data to CSV, Excel and BI tools — Scale",
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

/**
 * Get the tier badge string ("Starter", "Core", "Scale") for a route.
 */
export function getReportTier(routeName) {
    const requiredFeature = REPORT_PLAN_FEATURES[routeName];
    if (!requiredFeature) return null;
    return REPORT_FEATURE_TIERS[requiredFeature] || 'Starter';
}

/**
 * Get the decision-driven upgrade text for a route.
 */
export function getReportDecisionMessage(routeName) {
    const requiredFeature = REPORT_PLAN_FEATURES[routeName];
    if (!requiredFeature) return 'Upgrade your plan to unlock full report';
    return REPORT_DECISION_MESSAGES[requiredFeature] || 'Upgrade your plan to unlock full report';
}
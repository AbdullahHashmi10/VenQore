import {
    Activity, AlertTriangle, ArrowLeftRight, BarChart2, BarChart3, BookOpen, Box, Calendar,
    CreditCard, FileText, Gauge, Hash, History, Hourglass, Landmark, Layers, Package,
    PackageMinus, PackageSearch, Percent, PieChart, RefreshCw, Scale, ShoppingBag,
    ShoppingCart, Gift, TrendingUp, UserPlus, Users, Users2, Wallet, Clock, Receipt, Coins,
} from 'lucide-react';
import { isReportLocked } from '@/lib/reportPlanMap';

/**
 * The one list of reports. The Reports hub, the report toolbar menu and the
 * Insights menu all read from here, so a report is added or moved in one place.
 *
 * `key` is the id the server uses in `hiddenReports` (module switched off).
 * `route` is the Laravel route name (takes { store_slug }).
 */
export const REPORT_CATEGORIES = [
    {
        id: 'overview',
        title: 'Overview & Trends',
        description: 'The business at a glance, and how it is moving',
        icon: Gauge,
        tone: 'brand',
        reports: [
            { key: 'owner-daily-pulse', title: "Owner's Daily Pulse", description: 'Seven vital numbers for today, protected by your passcode', route: 'store.reports.owner-daily-pulse', icon: Activity },
            { key: 'analytics', title: 'Sales Analytics', description: 'Revenue trends, peak hours and top performers in charts', route: 'store.reports.analytics', icon: BarChart3 },
            { key: 'day-book', title: 'Day Book', description: 'Everything that happened, day by day', route: 'store.reports.day-book', icon: Calendar },
        ],
    },
    {
        id: 'sales',
        title: 'Sales & Revenue',
        description: 'What you sold, to whom, and how much you gave away',
        icon: TrendingUp,
        tone: 'emerald',
        reports: [
            { key: 'sales', title: 'Sales Report', description: 'Every sale with filters by date, customer and status', route: 'store.reports.sales', icon: TrendingUp },
            { key: 'sale-orders', title: 'Sales Orders', description: 'Orders placed, confirmed and fulfilled', route: 'store.reports.sale-orders', icon: ShoppingBag },
            { key: 'sale-order-items', title: 'Sale Order Items', description: 'Item-level detail of every order', route: 'store.reports.sale-order-items', icon: Package },
            { key: 'discount', title: 'Discount Report', description: 'Where price concessions are going', route: 'store.reports.discount', icon: Percent },
        ],
    },
    {
        id: 'profit',
        title: 'Profit & Margins',
        description: 'What you actually keep, by business, item, category, bill and customer',
        icon: Coins,
        tone: 'emerald',
        reports: [
            { key: 'profit-loss', title: 'Profit & Loss', description: 'Income minus costs for any period', route: 'store.reports.profit-loss', icon: BarChart2 },
            { key: 'item-wise-profit', title: 'Item-wise Profit', description: 'Profit and margin per product', route: 'store.reports.item-wise-profit', icon: TrendingUp },
            { key: 'item-category-wise-profit-loss', title: 'Category Profitability', description: 'Which categories earn and which cost you', route: 'store.reports.item-category-wise-profit-loss', icon: PieChart },
            { key: 'bill-wise-profit', title: 'Bill-wise Profit', description: 'Profit on each invoice', route: 'store.reports.bill-wise-profit', icon: FileText },
            { key: 'party-wise-profit-loss', title: 'Customer Profitability', description: 'Profit earned from each customer', route: 'store.reports.party-wise-profit-loss', icon: Users },
        ],
    },
    {
        id: 'customers',
        title: 'Customers & Credit',
        description: 'Who buys, who owes you, and how they behave',
        icon: Users,
        tone: 'sky',
        reports: [
            { key: 'customer-insights', title: 'Customer Insights', description: 'Buying patterns, repeat customers and top spenders', route: 'store.reports.customer-insights', icon: Users2 },
            { key: 'loyalty', title: 'Loyalty Points', description: 'Who holds points, what was earned and redeemed, and the current rates', route: 'store.loyalty.index', icon: Gift },
            { key: 'sale-aging', title: 'Receivables Aging', description: 'Who owes you money and for how long', route: 'store.reports.sale-aging', icon: Clock },
            { key: 'party-statement', title: 'Party Statement', description: 'Full ledger for one customer or supplier', route: 'store.reports.party-statement', icon: Receipt },
            { key: 'item-report-by-party', title: 'What Each Customer Buys', description: 'Items bought by a chosen customer', route: 'store.reports.item-report-by-party', icon: UserPlus },
            { key: 'party-report-by-item', title: 'Who Buys Each Item', description: 'Customers behind a chosen product', route: 'store.reports.party-report-by-item', icon: PackageSearch },
            { key: 'all-parties', title: 'All Parties', description: 'Customers and suppliers with their balances', route: 'store.reports.all-parties', icon: Users },
            { key: 'loan-statement', title: 'Loan Statement', description: 'Loans taken and given', route: 'store.reports.loan-statement', icon: Landmark },
        ],
    },
    {
        id: 'purchases',
        title: 'Purchases & Suppliers',
        description: 'What you bought, from whom, and what went back',
        icon: ShoppingCart,
        tone: 'amber',
        reports: [
            { key: 'purchases', title: 'Purchase Report', description: 'Every purchase with filters', route: 'store.reports.purchases', icon: ShoppingCart },
            { key: 'purchase-returns', title: 'Purchase Returns', description: 'Debit notes and goods sent back', route: 'store.reports.purchase-returns', icon: PackageMinus },
            { key: 'supplier-insights', title: 'Supplier Insights', description: 'Spend, reliability and top suppliers', route: 'store.reports.supplier-insights', icon: Landmark },
            { key: 'sale-purchase-by-party', title: 'Party Volume', description: 'Sales and purchases by party', route: 'store.reports.sale-purchase-by-party', icon: ArrowLeftRight },
        ],
    },
    {
        id: 'inventory',
        title: 'Inventory & Stock',
        description: 'What is on the shelf, what it is worth, and where it moved',
        icon: Package,
        tone: 'violet',
        reports: [
            { key: 'stock-valuation', title: 'Stock Valuation', description: 'Current value of your inventory', route: 'store.reports.stock-valuation', icon: Wallet },
            { key: 'stock-summary-by-category', title: 'Stock Summary', description: 'Quantity and value by category', route: 'store.reports.stock-summary-by-category', icon: Layers },
            { key: 'movement-history', title: 'Stock Movement', description: 'Audit trail of every stock change', route: 'store.reports.movement-history', icon: History },
            { key: 'point-in-time-inventory', title: 'Inventory on a Past Date', description: 'What you held on any day', route: 'store.reports.point-in-time-inventory', icon: History },
            { key: 'item-detail', title: 'Item Details', description: 'Everything about one product', route: 'store.reports.item-detail', icon: Box },
        ],
    },
    {
        id: 'alerts',
        title: 'Stock Alerts & Ageing',
        description: 'Things that need action: running out, going bad, sitting too long',
        icon: AlertTriangle,
        tone: 'rose',
        reports: [
            { key: 'low-stock', title: 'Low Stock', description: 'Items below their reorder level', route: 'store.reports.low-stock', icon: AlertTriangle },
            { key: 'expiry', title: 'Expiry Report', description: 'Batches expiring soon or already expired', route: 'store.reports.expiry', icon: Hourglass },
            { key: 'stock-aging', title: 'Stock Aging', description: 'How long stock has been sitting', route: 'store.reports.stock-aging', icon: Clock },
        ],
    },
    {
        id: 'expenses',
        title: 'Expenses & Tax',
        description: 'Where the money goes, and what you owe the taxman',
        icon: CreditCard,
        tone: 'rose',
        reports: [
            { key: 'expenses', title: 'Expense Report', description: 'Every expense in the period', route: 'store.reports.expenses', icon: CreditCard },
            { key: 'expense-by-category', title: 'Expense by Category', description: 'Spending split by cost centre', route: 'store.reports.expense-by-category', icon: PieChart },
            { key: 'tax', title: 'Tax Report', description: 'Input versus output tax', route: 'store.reports.tax', icon: Landmark },
            { key: 'tax-rate', title: 'Tax by Rate', description: 'Taxable amounts grouped by rate', route: 'store.reports.tax-rate', icon: Hash },
        ],
    },
    {
        id: 'accounts',
        title: 'Accounts & Books',
        description: 'Financial statements, ledgers and cash',
        icon: BookOpen,
        tone: 'blue',
        reports: [
            { key: 'balance-sheet', title: 'Balance Sheet', description: 'Assets, liabilities and equity', route: 'store.reports.balance-sheet', icon: Scale },
            { key: 'trial-balance', title: 'Trial Balance', description: 'Debit and credit totals per account', route: 'store.reports.trial-balance', icon: Scale },
            { key: 'cash-flow', title: 'Cash Flow', description: 'Cash in, cash out, and what is left', route: 'store.reports.cash-flow', icon: RefreshCw },
            { key: 'bank-statement', title: 'Bank Statement', description: 'Bank transactions for reconciliation', route: 'store.reports.bank-statement', icon: Landmark },
            { key: 'account-ledger', title: 'Journal Entries', description: 'The general ledger, account by account', route: 'store.reports.account-ledger', icon: BookOpen },
            { key: 'transactions', title: 'All Transactions', description: 'Every transaction in one list', route: 'store.reports.transactions', icon: Activity },
            { key: 'chart-of-accounts', title: 'Chart of Accounts', description: 'Your account structure', route: 'store.accounting.index', icon: FileText },
        ],
    },
];

const hrefFor = (name, slug) => {
    try {
        // eslint-disable-next-line no-undef
        return route(name, { store_slug: slug });
    } catch (e) {
        return '#';
    }
};

/** Categories with resolved links, hidden (module off) reports removed, empty categories dropped. */
export function buildReportCatalog({ slug, hiddenReports = [], planFeatures = {} } = {}) {
    return REPORT_CATEGORIES
        .map((cat) => ({
            ...cat,
            reports: cat.reports
                .filter((r) => !hiddenReports.includes(r.key))
                .map((r) => ({
                    ...r,
                    locked: isReportLocked(r.route, planFeatures),
                    href: hrefFor(r.route, slug),
                })),
        }))
        .filter((cat) => cat.reports.length > 0);
}

/** Same catalogue shaped for the NavTitle dropdown (groups -> items). */
export function reportNavGroups(catalog, billingHref) {
    return catalog.map((cat) => ({
        id: cat.id,
        label: cat.title,
        items: cat.reports.map((r) => ({
            id: r.key,
            label: r.title,
            href: r.locked && billingHref ? billingHref : r.href,
            icon: r.icon,
        })),
    }));
}

/** Which report is open, found by comparing route names with the current URL. */
export function currentReportKey(catalog) {
    for (const cat of catalog) {
        for (const r of cat.reports) {
            try {
                // eslint-disable-next-line no-undef
                if (route().current(r.route)) return r.key;
            } catch (e) { /* route() not ready */ }
        }
    }
    return null;
}

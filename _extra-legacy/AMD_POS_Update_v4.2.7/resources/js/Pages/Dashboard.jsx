import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import DualStatCard from '@/Components/DualStatCard';
import ChartSection from '@/Components/ChartSection';
import RightPanel from '@/Components/RightPanel';
import {
    TrendingUp,
    CreditCard,
    Wallet,
    MoreHorizontal,
    Activity,
    ChevronDown,
    ChevronLeft
} from 'lucide-react';
import PremiumDropdown from '@/Components/PremiumDropdown';
import TodaysOpportunities from '@/Components/TodaysOpportunities';
import WelcomeTourModal from '@/Components/WelcomeTourModal';
import DashboardTourGuide from '@/Components/DashboardTourGuide';

export default function Dashboard({
    performance,
    outstanding,
    netProfit,
    salesData,
    topSellingItems,
    lowStockItems,
    recentPurchases = [],
    recentTransactions,
    plSummary,
    bankAccounts,
    cashAccounts,
    cashData,
    inventoryValue
}) {
    const { auth, store } = usePage().props;
    const isAdmin = auth?.user?.role === 'platform_admin' || auth?.user?.role === 'admin' || auth?.user?.role === 'owner';

    const userPerms = auth?.user?.permissions || [];
    const hasPerm = (...keys) => keys.some(k => userPerms.some(p => p === k || p.startsWith(k + '.')));
    const canSales = isAdmin || hasPerm('sales', 'reports');
    const canFinance = isAdmin || hasPerm('finance');
    const canInventory = isAdmin || hasPerm('inventory');
    const canReports = isAdmin || hasPerm('reports');
    const canPurchases = isAdmin || hasPerm('purchases');

    // Dynamic grid spans for the bottom row cards
    let topProductsSpan = "col-span-12 md:col-span-8 lg:col-span-6";
    let lowStockSpan = "col-span-12 md:col-span-4 lg:col-span-3";
    let purchasesSpan = "col-span-12 md:col-span-4 lg:col-span-3";

    if (canSales && canInventory && canPurchases) {
        topProductsSpan = "col-span-12 md:col-span-4 lg:col-span-3";
        lowStockSpan = "col-span-12 md:col-span-4 lg:col-span-3";
        purchasesSpan = "col-span-12 md:col-span-4 lg:col-span-3";
    } else if (canSales && canPurchases) {
        topProductsSpan = "col-span-12 md:col-span-8 lg:col-span-6";
        purchasesSpan = "col-span-12 md:col-span-4 lg:col-span-3";
    } else if (canInventory && canPurchases) {
        lowStockSpan = "col-span-12 md:col-span-6 lg:col-span-5";
        purchasesSpan = "col-span-12 md:col-span-6 lg:col-span-4";
    } else if (canPurchases) {
        purchasesSpan = "col-span-12 lg:col-span-9";
    }

    const [profitView, setProfitView] = useState('Month');
    const [performancePeriod, setPerformancePeriod] = useState('Today');
    const [outstandingPeriod, setOutstandingPeriod] = useState('Month');
    const [netProfitPeriod, setNetProfitPeriod] = useState('Month');
    const [purchasesPeriod, setPurchasesPeriod] = useState('Month');
    const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);

    const currentProfit = plSummary[profitView] || { income: 0, expense: 0, profit: 0, status: 'good' };
    const purchasesList = Array.isArray(recentPurchases) ? recentPurchases : (recentPurchases[purchasesPeriod] || []);

    return (
        <OneGlanceLayout activeMenu="Dashboard">
            <Head title="Dashboard" />

            <style>{`
                @keyframes nudge-left {
                    0%, 100% { transform: translateY(-50%) translateX(0); }
                    50% { transform: translateY(-50%) translateX(-3px); }
                }
                .animate-nudge-left {
                    animation: nudge-left 2.5s ease-in-out infinite;
                }
            `}</style>

            {/* Mobile Right Panel Drawer (Rendered outside overflow clipping container) */}
            {(isAdmin || auth?.user?.role === 'manager' || auth?.user?.role === 'accountant') && (
                <div className="lg:hidden">
                    {mobileRightPanelOpen && (
                        <div className="fixed inset-0 bg-black/50 z-[90]" onClick={() => setMobileRightPanelOpen(false)} />
                    )}
                    <div
                        className={`
                            fixed top-0 right-0 h-[100vh] z-[100]
                            transition-transform duration-300 ease-in-out transform
                            ${mobileRightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
                            w-[320px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 p-4 flex flex-col h-full
                        `}
                    >
                        {/* Custom curved sideline overlay notch on the left edge of the sidebar */}
                        <button
                            onClick={() => setMobileRightPanelOpen(!mobileRightPanelOpen)}
                            className={`absolute left-[-24px] top-1/2 -translate-y-1/2 z-[110] lg:hidden w-6 h-32 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition-colors pointer-events-auto ${!mobileRightPanelOpen ? 'animate-nudge-left' : ''}`}
                            style={{ filter: 'drop-shadow(-4px 4px 6px rgba(0, 0, 0, 0.04))' }}
                        >
                            <svg
                                className="absolute inset-0 w-full h-full text-white dark:text-slate-900 pointer-events-none"
                                viewBox="0 0 24 128"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M 24 0 C 24 20, 0 35, 0 64 C 0 93, 24 108, 24 128 Z"
                                    fill="currentColor"
                                />
                                <path
                                    d="M 24 0 C 24 20, 0 35, 0 64 C 0 93, 24 108, 24 128"
                                    fill="none"
                                    className="stroke-slate-100 dark:stroke-slate-800"
                                    strokeWidth="1"
                                />
                            </svg>
                            <ChevronLeft size={14} className={`relative z-10 transition-transform duration-300 ${mobileRightPanelOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <RightPanel
                                recentTransactions={recentTransactions}
                                bankAccounts={bankAccounts}
                                cashAccounts={cashAccounts}
                                cashData={cashData}
                                inventoryValue={inventoryValue}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 lg:grid-rows-6 gap-6 lg:h-[calc(100vh-5rem)] h-auto w-full animate-in fade-in duration-500 pt-2 pb-2 pr-2">

                {/* --- Row 1: High Level Stats (Top Left) --- */}
                {canSales && (
                <div id="tour-performance" className="col-span-12 md:col-span-6 lg:col-span-3 lg:row-span-1">
                    <DualStatCard
                        title="Performance"
                        leftLabel="Sales" leftValue={formatCurrency(parseFloat(performance[performancePeriod]?.sales || 0), store)}
                        rightLabel="Gross Profit" rightValue={formatCurrency(parseFloat(performance[performancePeriod]?.gross_profit || 0), store)}
                        icon={TrendingUp}
                        colorClass="bg-indigo-500"
                        delay={0}
                        period={performancePeriod}
                        onPeriodChange={setPerformancePeriod}
                        onLeftClick={() => router.visit(route('store.sales.index', { store_slug: store?.slug }))}
                        onRightClick={() => router.visit(route('store.reports.dashboard', { store_slug: store?.slug }))}
                    />
                </div>
                )}
                {canFinance && (
                <div id="tour-outstanding" className="col-span-12 md:col-span-6 lg:col-span-3 lg:row-span-1">
                    <DualStatCard
                        title="Outstanding"
                        leftLabel="To Receive" leftValue={formatCurrency(parseFloat(outstanding[outstandingPeriod]?.receivables || 0), store)}
                        rightLabel="To Pay" rightValue={formatCurrency(parseFloat(outstanding[outstandingPeriod]?.payables || 0), store)}
                        icon={CreditCard}
                        colorClass="bg-orange-500"
                        delay={100}
                        period={outstandingPeriod}
                        onPeriodChange={setOutstandingPeriod}
                        onLeftClick={() => router.visit(route('store.finance.receivables', { store_slug: store?.slug }))}
                        onRightClick={() => router.visit(route('store.finance.payables', { store_slug: store?.slug }))}
                    />
                </div>
                )}
                {canFinance && (
                <div id="tour-net-profit" className="col-span-12 md:col-span-6 lg:col-span-3 lg:row-span-1">
                    {/* Quick Profit Check */}
                    <div
                        onClick={() => router.visit(route('store.reports.profit-loss', { store_slug: store?.slug }))}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col justify-center gap-2 h-full relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300 cursor-pointer"
                    >
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>

                        <div className="flex items-center gap-3 relative z-10 shrink-0">
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                                <Wallet size={18} />
                            </div>
                            <h3 className="font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Net Profit</h3>
                            <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                                <PremiumDropdown
                                    options={[
                                        { value: 'Today', label: 'Today' },
                                        { value: 'Month', label: 'Month' },
                                        { value: 'Year', label: 'Year' },
                                        { value: 'All Time', label: 'All Time' }
                                    ]}
                                    value={netProfitPeriod}
                                    onChange={setNetProfitPeriod}
                                />
                            </div>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="grid grid-cols-2 gap-3 relative z-10 grow items-center">
                            {/* Vertical Divider */}
                            <div className="absolute left-1/2 top-1 bottom-1 w-px bg-slate-100 dark:bg-slate-800 -translate-x-1/2"></div>

                            <div className="text-center min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider truncate">Current Status</p>
                                <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">{netProfit[netProfitPeriod]?.status || 'N/A'}</h2>
                            </div>
                            <div className="text-center min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider truncate">
                                    {formatCurrency(parseFloat(netProfit[netProfitPeriod]?.value || 0), store)}
                                </p>
                                <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-center mt-1 text-[9px] font-medium opacity-80 leading-none">
                                    <span className="text-emerald-600 dark:text-emerald-400 whitespace-nowrap" title="Income">In: {formatCurrency(netProfit[netProfitPeriod]?.income || 0, store)}</span>
                                    <span className="text-red-500 whitespace-nowrap" title="Expense">Ex: {formatCurrency(netProfit[netProfitPeriod]?.expense || 0, store)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* --- RIGHT PANEL (Desktop Only) --- */}
                {(isAdmin || auth?.user?.role === 'manager' || auth?.user?.role === 'accountant') && (
                    <div id="tour-right-panel" className="hidden lg:block col-span-3 lg:row-span-6 h-full">
                        <RightPanel
                            recentTransactions={recentTransactions}
                            bankAccounts={bankAccounts}
                            cashAccounts={cashAccounts}
                            cashData={cashData}
                            inventoryValue={inventoryValue}
                        />
                    </div>
                )}

                {/* --- MIDDLE: Sales Chart & Opportunities --- */}
                {canSales && (
                <div id="tour-sales-chart" className={`col-span-12 ${isAdmin ? 'lg:col-span-6' : 'lg:col-span-9'} lg:row-span-3 min-h-[300px]`}>
                    <ChartSection salesData={salesData} />
                </div>
                )}

                {isAdmin && (
                    <div id="tour-opportunities" className="col-span-12 lg:col-span-3 lg:row-span-3 h-full min-h-0 flex flex-col">
                        <TodaysOpportunities className="flex-1" />
                    </div>
                )}

                {/* --- BOTTOM: Tables (Bottom Left) --- */}

                {/* Top Selling Items */}
                {canSales && (
                <div id="tour-top-products" className={`${topProductsSpan} lg:row-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0 group`}>
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                            Top Products
                        </h3>
                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"><MoreHorizontal size={18} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    <th className="pb-3 pl-2">Product</th>
                                    <th className="pb-3 text-center">Volume</th>
                                    <th className="pb-3 text-right pr-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topSellingItems.map((item, i) => (
                                    <tr key={i} className="group/row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default rounded-xl">
                                        <td className="py-3 pl-2 border-b border-slate-50 dark:border-slate-800/50 group-last/row:border-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm border border-slate-200 dark:border-slate-700 group-hover/row:scale-110 transition-transform">
                                                    {item.image}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{item.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-sm text-center font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-50 dark:border-slate-800/50 group-last/row:border-none">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs">{item.sold}</span>
                                        </td>
                                        <td className="py-3 pr-2 text-sm text-right font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-800/50 group-last/row:border-none">
                                            {item.revenue}
                                        </td>
                                    </tr>
                                ))}
                                {topSellingItems.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="py-8 text-center text-slate-400 text-sm">No sales data yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}

                {/* LOW STOCK ITEMS */}
                {canInventory && (
                <div id="tour-low-stock" className={`${lowStockSpan} lg:row-span-2 h-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0`}>
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-red-500 rounded-full"></div>
                            Low Stock Alerts
                        </h3>
                        <button className="text-xs text-indigo-600 font-medium hover:underline">View All</button>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar space-y-3">
                        {lowStockItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-32">{item.name}</p>
                                    <p className="text-[10px] text-red-500 font-bold">Stock: {formatNumber(item.stock)} / {formatNumber(item.alert)}</p>
                                </div>
                                {/* PROBLEM 7 FIX: Order button only for roles with purchases permission */}
                                {(auth?.user?.role === 'owner' || auth?.user?.role === 'admin' || auth?.user?.role === 'manager' || auth?.user?.role === 'purchasing_officer' || auth?.user?.permissions?.includes('purchases')) && (
                                <button
                                    onClick={() => router.visit(route('store.purchases.create', { store_slug: store?.slug, product_id: item.id }))}
                                    className="px-2 py-1 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:text-indigo-600"
                                >
                                    Order
                                </button>
                                )}
                            </div>
                        ))}
                        {lowStockItems.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <span className="text-2xl">✅</span>
                                <p className="text-xs mt-2">Stock levels are healthy</p>
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* PURCHASES */}
                {canPurchases && (
                <div id="tour-purchases" className={`${purchasesSpan} lg:row-span-2 h-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0`}>
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Recent Purchases</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div onClick={(e) => e.stopPropagation()}>
                                <PremiumDropdown
                                    options={[
                                        { value: 'Today', label: 'Today' },
                                        { value: 'Month', label: 'Month' },
                                        { value: 'Year', label: 'Year' },
                                        { value: 'All Time', label: 'All Time' }
                                    ]}
                                    value={purchasesPeriod}
                                    onChange={setPurchasesPeriod}
                                />
                            </div>
                            <button
                                onClick={() => router.visit(route('store.purchases.index', { store_slug: store?.slug }))}
                                className="text-xs text-indigo-600 font-medium hover:underline"
                            >
                                View All
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar space-y-3">
                        {purchasesList.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => router.visit(route('store.purchases.show', { store_slug: store?.slug, purchase: item.id }))}
                                className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/10 rounded-xl border border-orange-100 dark:border-orange-900/20 hover:scale-[1.01] transition-transform cursor-pointer"
                            >
                                <div className="min-w-0 flex-1 pr-2">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.supplier_name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{item.total_amount}</span>
                                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400 leading-none mt-0.5">{item.status}</p>
                                </div>
                            </div>
                        ))}
                        {purchasesList.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                                <span className="text-2xl">📦</span>
                                <p className="text-xs mt-2">No purchases recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>
                )}

            </div>

            {(store?.onboarding_step === 'welcome' || 
              store?.onboarding_step === 'purchase_tour_start' || 
              store?.onboarding_step === 'purchase_tour_sidebar' ||
              store?.onboarding_step === 'invoice_tour_start' ||
              store?.onboarding_step === 'pos_tour_start' ||
              store?.onboarding_step === 'expense_tour_start') && (
                <WelcomeTourModal store={store} />
            )}
            
            {store?.onboarding_step === 'dashboard_tour' && (
                <DashboardTourGuide store={store} />
            )}
        </OneGlanceLayout>
    );
}

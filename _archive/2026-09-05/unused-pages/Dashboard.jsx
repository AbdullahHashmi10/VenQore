import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ChartSection from '@/Components/ChartSection';
import RightPanel from '@/Components/RightPanel';
import {
 TrendingUp,
 CreditCard,
 Wallet,
 MoreHorizontal,
 Activity,
 ChevronDown,
 ChevronLeft,
 ArrowDownLeft,
 ArrowUpRight,
 DollarSign,
 Percent,
 ShieldCheck,
 Sparkles,
 Package,
 AlertTriangle
} from 'lucide-react';
import PremiumDropdown from '@/Components/PremiumDropdown';
import TodaysOpportunities from '@/Components/TodaysOpportunities';
import WelcomeTourModal from '@/Components/WelcomeTourModal';
import DashboardTourGuide from '@/Components/DashboardTourGuide';
import { usePermission } from '@/Hooks/usePermission';

export default function Dashboard({
 performance = {},
 outstanding = {},
 netProfit = {},
 salesData,
 topSellingItems = [],
 lowStockItems = [],
 recentPurchases = [],
 recentTransactions = [],
 plSummary = {},
 bankAccounts = [],
 cashAccounts = [],
 cashData = {},
 inventoryValue
}) {
 const { auth, store } = usePage().props;
 const { hasPerm, isAdmin } = usePermission();

 const canSales = hasPerm('sales', 'reports');
 const canFinance = hasPerm('finance');
 const canInventory = hasPerm('inventory');
 const canReports = hasPerm('reports');
 const canPurchases = hasPerm('purchases');

 const showRightPanel = isAdmin || auth?.user?.role === 'manager' || auth?.user?.role === 'accountant';

 const [performancePeriod, setPerformancePeriod] = useState('Today');
 const [grossProfitPeriod, setGrossProfitPeriod] = useState('Today');
 const [toReceivePeriod, setToReceivePeriod] = useState('Month');
 const [toPayPeriod, setToPayPeriod] = useState('Month');
 const [netProfitPeriod, setNetProfitPeriod] = useState('Month');
 const [purchasesPeriod, setPurchasesPeriod] = useState('Month');
 const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
 const [desktopSidePanelVisible, setDesktopSidePanelVisible] = useState(true);

 useEffect(() => {
  const handleTogglePanel = () => {
   setMobileRightPanelOpen(prev => !prev);
   setDesktopSidePanelVisible(prev => !prev);
  };
  window.addEventListener('vq:toggle-side-panel', handleTogglePanel);
  return () => window.removeEventListener('vq:toggle-side-panel', handleTogglePanel);
 }, []);

 const timeframeOptions = [
        { value: 'Today', label: 'Today' },
        { value: 'Month', label: 'Month' },
        { value: 'Year', label: 'Year' },
        { value: 'All Time', label: 'All Time' }
    ];

 const purchasesList = Array.isArray(recentPurchases) ? recentPurchases : (recentPurchases[purchasesPeriod] || []);

    // Performance & Gross Profit Values
 const totalRevVal = parseFloat(performance[performancePeriod]?.sales || 0);
 const grossProfitVal = parseFloat(performance[grossProfitPeriod]?.gross_profit || 0);
 const grossProfitRev = parseFloat(performance[grossProfitPeriod]?.sales || 0);
 const grossMarginPct = grossProfitRev > 0 ? ((grossProfitVal / grossProfitRev) * 100).toFixed(1) : '0.0';

    // Outstanding Values
 const toReceiveVal = parseFloat(outstanding[toReceivePeriod]?.receivables || 0);
 const toPayVal = parseFloat(outstanding[toPayPeriod]?.payables || 0);

    // Net Profit Values
 const netProfitData = netProfit[netProfitPeriod] || {};
 const netProfitVal = parseFloat(netProfitData.value || 0);
 const netProfitIncome = parseFloat(netProfitData.income || 0);
 const netProfitExpense = parseFloat(netProfitData.expense || 0);
 const healthStatus = netProfitData.status || (netProfitVal >= 0 ? 'Good' : 'Needs Attention');

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

            {/* Mobile Right Panel Drawer */}
            {showRightPanel && (
                <div className="lg:hidden">
                    {mobileRightPanelOpen && (
                        <div className="fixed inset-0 bg-black/50 z-drawer lg:hidden" onClick={() => setMobileRightPanelOpen(false)} />
                    )}
                    <div
 className={`
 fixed top-0 right-0 h-[100vh] z-drawer
 transition-transform duration-slow ease-in-out transform
                            ${mobileRightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
 w-[320px] bg-surface border-l border-line p-4 flex flex-col h-full
 `}
                    >
                        <button
 onClick={() => setMobileRightPanelOpen(!mobileRightPanelOpen)}
 className={`absolute left-[-24px] top-1/2 -translate-y-1/2 z-modal lg:hidden w-6 h-32 flex items-center justify-center text-ink-muted hover:text-brand-500 transition-colors pointer-events-auto ${!mobileRightPanelOpen ? 'animate-nudge-left' : ''}`}
 style={{ filter: 'drop-shadow(-4px 4px 6px rgba(0, 0, 0, 0.04))' }}
                        >
                            <svg
 className="absolute inset-0 w-full h-full text-white dark:text-ink pointer-events-none"
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
 className="stroke-chart-grid"
 strokeWidth="1"
                                />
                            </svg>
                            <ChevronLeft size={14} className={`relative z-10 transition-transform duration-slow ${mobileRightPanelOpen ? 'rotate-180' : ''}`} />
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

            {/* Main Content Layout Container (Strictly Zero Horizontal Scroll) */}
            <div className="w-full max-w-full py-2 px-1 sm:px-2">
                <div className="grid grid-cols-12 gap-5 sm:gap-6 w-full animate-in fade-in duration-slower">

                    {/* --- Left Side Content --- */}
                    <div className={`col-span-12 ${showRightPanel && desktopSidePanelVisible ? 'xl:col-span-9' : 'col-span-12'} flex flex-col gap-6 min-w-0`}>
                        
                        {/* ═══ 6 INDEPENDENT TOP METRIC CARDS ═══ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-4.5 w-full">
                            
                            {/* Card 1: Total Revenue */}
                            {canSales && (
                                <div
 id="tour-stat-revenue"
 onClick={() => router.visit(route('store.sales.index', { store_slug: store?.slug }))}
 className="bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]"
                                >
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" />
                                    
                                    <div className="flex items-center justify-between gap-2 relative z-10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                                <TrendingUp size={15} />
                                            </div>
                                            <h3 className="font-bold text-ink-muted text-3xs uppercase tracking-wider truncate">Revenue</h3>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                            <PremiumDropdown
 options={timeframeOptions}
 value={performancePeriod}
 onChange={setPerformancePeriod}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2.5 relative z-10 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight truncate leading-tight">
                                            {formatCurrency(totalRevVal, store)}
                                        </h2>
                                        <p className="text-3xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 truncate">
 Gross: {formatCurrency(parseFloat(performance[performancePeriod]?.gross_profit || 0), store)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Card 2: Gross Profit */}
                            {canSales && (
                                <div
 id="tour-stat-profit"
 onClick={() => router.visit(route('store.reports.dashboard', { store_slug: store?.slug }))}
 className="bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]"
                                >
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" />
                                    
                                    <div className="flex items-center justify-between gap-2 relative z-10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
                                                <Percent size={15} />
                                            </div>
                                            <h3 className="font-bold text-ink-muted text-3xs uppercase tracking-wider truncate">Gross Profit</h3>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                            <PremiumDropdown
 options={timeframeOptions}
 value={grossProfitPeriod}
 onChange={setGrossProfitPeriod}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2.5 relative z-10 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight truncate leading-tight">
                                            {formatCurrency(grossProfitVal, store)}
                                        </h2>
                                        <p className="text-3xs text-brand-600 dark:text-brand-400 font-semibold mt-1 truncate">
 Margin: {grossMarginPct}%
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Card 3: To Receive (Receivables) */}
                            {canFinance && (
                                <div
 id="tour-stat-receivables"
 onClick={() => router.visit(route('store.finance.receivables', { store_slug: store?.slug }))}
 className="bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]"
                                >
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" />
                                    
                                    <div className="flex items-center justify-between gap-2 relative z-10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                                                <ArrowDownLeft size={15} />
                                            </div>
                                            <h3 className="font-bold text-ink-muted text-3xs uppercase tracking-wider truncate">To Receive</h3>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                            <PremiumDropdown
 options={timeframeOptions}
 value={toReceivePeriod}
 onChange={setToReceivePeriod}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2.5 relative z-10 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight truncate leading-tight">
                                            {formatCurrency(toReceiveVal, store)}
                                        </h2>
                                        <p className="text-3xs text-ink-muted font-medium mt-1 truncate">
 Customer receivables
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Card 4: To Pay (Payables) */}
                            {canFinance && (
                                <div
 id="tour-stat-payables"
 onClick={() => router.visit(route('store.finance.payables', { store_slug: store?.slug }))}
 className="bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]"
                                >
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" />
                                    
                                    <div className="flex items-center justify-between gap-2 relative z-10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                                <ArrowUpRight size={15} />
                                            </div>
                                            <h3 className="font-bold text-ink-muted text-3xs uppercase tracking-wider truncate">To Pay</h3>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                            <PremiumDropdown
 options={timeframeOptions}
 value={toPayPeriod}
 onChange={setToPayPeriod}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2.5 relative z-10 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight truncate leading-tight">
                                            {formatCurrency(toPayVal, store)}
                                        </h2>
                                        <p className="text-3xs text-ink-muted font-medium mt-1 truncate">
 Supplier payables
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Card 5: Net Profit */}
                            {canFinance && (
                                <div
 id="tour-stat-netprofit"
 onClick={() => router.visit(route('store.reports.profit-loss', { store_slug: store?.slug }))}
 className="bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]"
                                >
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-teal-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" />
                                    
                                    <div className="flex items-center justify-between gap-2 relative z-10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
                                                <Wallet size={15} />
                                            </div>
                                            <h3 className="font-bold text-ink-muted text-3xs uppercase tracking-wider truncate">Net Profit</h3>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                            <PremiumDropdown
 options={timeframeOptions}
 value={netProfitPeriod}
 onChange={setNetProfitPeriod}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2.5 relative z-10 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-teal-600 dark:text-teal-400 tracking-tight truncate leading-tight">
                                            {formatCurrency(netProfitVal, store)}
                                        </h2>
                                        <div className="flex items-center gap-1.5 mt-1 text-3xs text-ink-muted font-medium truncate">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">+{formatCurrency(netProfitIncome, store)}</span>
                                            <span>·</span>
                                            <span className="text-rose-500 font-semibold truncate">-{formatCurrency(netProfitExpense, store)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Card 6: Financial Status / Health */}
                            {canFinance && (
                                <div
 id="tour-stat-health"
 onClick={() => router.visit(route('store.reports.dashboard', { store_slug: store?.slug }))}
 className="bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]"
                                >
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" />
                                    
                                    <div className="flex items-center justify-between gap-2 relative z-10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                                <Activity size={15} />
                                            </div>
                                            <h3 className="font-bold text-ink-muted text-3xs uppercase tracking-wider truncate">Store Health</h3>
                                        </div>
                                        <span className="flex h-2 w-2 relative shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                    </div>

                                    <div className="mt-2.5 relative z-10 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-2 py-0.5 text-2xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                                                {healthStatus}
                                            </span>
                                        </div>
                                        <p className="text-3xs text-ink-muted font-medium mt-1.5 truncate">
 Books balanced & active
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* ═══ ROW 2: SALES CHART & TODAY'S OPPORTUNITIES ═══ */}
                        <div className="grid grid-cols-12 gap-5 sm:gap-6 w-full min-w-0">
                            {canSales && (
                                <div
 id="tour-sales-chart"
 className={`${isAdmin && store?.features?.growth_engine == 1 ? 'col-span-12 xl:col-span-8' : 'col-span-12'} min-h-[340px] min-w-0`}
                                >
                                    <ChartSection salesData={salesData} />
                                </div>
                            )}
                            {isAdmin && store?.features?.growth_engine == 1 && (
                                <div id="tour-opportunities" className="col-span-12 xl:col-span-4 min-w-0 flex flex-col min-h-[340px]">
                                    <TodaysOpportunities className="flex-1" />
                                </div>
                            )}
                        </div>

                        {/* ═══ ROW 3: TOP PRODUCTS, LOW STOCK, PURCHASES ═══ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 w-full min-w-0">
                            
                            {/* Top Selling Items */}
                            {canSales && (
                                <div id="tour-top-products" className="bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-line flex flex-col min-h-[340px] group min-w-0">
                                    <div className="flex justify-between items-center mb-4 shrink-0">
                                        <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
 Top Products
                                        </h3>
                                        <button className="p-1.5 hover:bg-interactive-hover rounded-lg transition-colors text-ink-muted hover:text-brand-600">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1 min-h-0 pr-1">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-3xs font-bold uppercase tracking-wider text-ink-muted border-b border-line">
                                                    <th className="pb-2.5 pl-1">Product</th>
                                                    <th className="pb-2.5 text-center">Qty</th>
                                                    <th className="pb-2.5 text-right pr-1">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topSellingItems.map((item, i) => (
                                                    <tr key={i} className="group/row hover:bg-interactive-hover transition-colors cursor-default rounded-xl">
                                                        <td className="py-2.5 pl-1 border-b border-line group-last/row:border-none">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded-lg bg-sunken flex items-center justify-center text-sm shadow-2xs border border-line shrink-0 group-hover/row:scale-105 transition-transform">
                                                                    {item.image}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-ink-secondary dark:text-ink-faint truncate">{item.name}</p>
                                                                    <p className="text-3xs text-ink-muted font-medium truncate">{item.category}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 text-xs text-center font-bold text-ink-secondary border-b border-line group-last/row:border-none">
                                                            <span className="bg-sunken px-2 py-0.5 rounded-md text-3xs font-semibold">{item.sold}</span>
                                                        </td>
                                                        <td className="py-2.5 pr-1 text-xs text-right font-bold text-emerald-600 dark:text-emerald-400 border-b border-line group-last/row:border-none whitespace-nowrap">
                                                            {item.revenue}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {topSellingItems.length === 0 && (
                                                    <tr>
                                                        <td colSpan="3" className="py-8 text-center text-ink-muted text-xs">No sales data recorded yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Low Stock Items */}
                            {canInventory && (
                                <div id="tour-low-stock" className="bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-line flex flex-col min-h-[340px] min-w-0">
                                    <div className="flex justify-between items-center mb-4 shrink-0">
                                        <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
 Low Stock Alerts
                                        </h3>
                                        <button
 onClick={() => router.visit(route('store.inventory.index', { store_slug: store?.slug }))}
 className="text-3xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
                                        >
 View Inventory
                                        </button>
                                    </div>

                                    <div className="flex-1 min-h-0 pr-1 space-y-2.5">
                                        {lowStockItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-2.5 bg-rose-50/70 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-ink-secondary dark:text-ink-faint truncate">{item.name}</p>
                                                    <p className="text-3xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">Stock: {formatNumber(item.stock)} / Min: {formatNumber(item.alert)}</p>
                                                </div>
                                                {canPurchases && (
                                                    <button
 onClick={() => router.visit(route('store.purchases.create', { store_slug: store?.slug, product_id: item.id }))}
 className="px-2.5 py-1 bg-surface text-3xs font-bold text-ink-secondary dark:text-ink-faint rounded-lg shadow-2xs border border-line hover:text-brand-600 dark:hover:text-brand-400 shrink-0 transition-colors"
                                                    >
 Order
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {lowStockItems.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-full text-ink-muted py-8">
                                                <ShieldCheck size={28} className="text-emerald-500 mb-1" />
                                                <p className="text-xs font-semibold text-ink-secondary">All Stock Healthy</p>
                                                <p className="text-3xs text-ink-muted mt-0.5">No products below alert threshold</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Recent Purchases */}
                            {canPurchases && (
                                <div id="tour-purchases" className="bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-line flex flex-col min-h-[340px] min-w-0">
                                    <div className="flex justify-between items-center mb-4 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                                            <h3 className="font-bold text-ink text-sm">Recent Purchases</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <PremiumDropdown
 options={timeframeOptions}
 value={purchasesPeriod}
 onChange={setPurchasesPeriod}
                                                />
                                            </div>
                                            <button
 onClick={() => router.visit(route('store.purchases.index', { store_slug: store?.slug }))}
 className="text-3xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
                                            >
 View All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-0 pr-1 space-y-2.5">
                                        {purchasesList.map((item) => (
                                            <div
 key={item.id}
 onClick={() => router.visit(route('store.purchases.show', { store_slug: store?.slug, purchase: item.id }))}
 className="flex items-center justify-between p-2.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-800 transition-colors cursor-pointer gap-2"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-ink-secondary dark:text-ink-faint truncate">{item.supplier_name}</p>
                                                    <p className="text-3xs text-ink-muted font-medium">{item.date}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{item.total_amount}</span>
                                                    <p className="text-3xs uppercase tracking-wider font-bold text-ink-muted leading-none mt-0.5">{item.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {purchasesList.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-full text-ink-muted py-8">
                                                <Package size={28} className="text-ink-faint dark:text-ink-secondary mb-1" />
                                                <p className="text-xs font-semibold text-ink-secondary">No Purchases</p>
                                                <p className="text-3xs text-ink-muted mt-0.5">No recent purchases for this period</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>

                    {/* --- RIGHT PANEL (Desktop Only) --- */}
                    {showRightPanel && desktopSidePanelVisible && (
                        <div id="tour-right-panel" className="hidden xl:block xl:col-span-3 min-w-0 self-start sticky top-0">
                            <RightPanel
 recentTransactions={recentTransactions}
 bankAccounts={bankAccounts}
 cashAccounts={cashAccounts}
 cashData={cashData}
 inventoryValue={inventoryValue}
                            />
                        </div>
                    )}

                </div>
            </div>

            {!store?.is_demo && !store?.onboarding_completed && (
 store?.onboarding_step === 'welcome' || 
 store?.onboarding_step === 'purchase_tour_start' || 
 store?.onboarding_step === 'purchase_tour_sidebar' ||
 store?.onboarding_step === 'invoice_tour_start' ||
 store?.onboarding_step === 'pos_tour_start' ||
 store?.onboarding_step === 'expense_tour_start'
            ) && (
                <WelcomeTourModal store={store} />
            )}
            
            {!store?.is_demo && !store?.onboarding_completed && store?.onboarding_step === 'dashboard_tour' && (
                <DashboardTourGuide store={store} />
            )}
        </OneGlanceLayout>
    );
}

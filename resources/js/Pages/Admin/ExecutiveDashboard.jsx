import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Package,
    AlertCircle,
    Clock,
    FileText,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    ClipboardList,
    UserCheck,
    Receipt,
    ArrowRight,
    MoreHorizontal,
    Wallet,
    Settings,
    Shield,
    Plus,
    Search,
    Monitor,
    ShoppingCart,
    LayoutGrid,
    Minus
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from 'recharts';

export default function AdminDashboard({
    stats = { net_profit: 0, total_revenue: 0, total_expenses: 0, active_staff: 0, total_staff: 0 },
    profitData = [],
    staffPerformance = [],
    recentActivity = [],
    inventoryHealth = { healthy: 0, lowStock: 0, outOfStock: 0, deadStock: 0 },
    topProducts = [],
    expenseData = [],
    paymentMethods = [],
    currencySymbol = '$'
}) {
    const {
        store
    } = usePage().props;

    // Guard: Prevent rendering until store context is derived
    if (!store?.slug) return null;

    // Shortcuts Configuration
    const shortcuts = [
        { name: 'POS', icon: Monitor, route: 'store.pos', color: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
        { name: 'Stock', icon: Package, route: 'store.inventory.dashboard', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
        { name: 'Sales', icon: ShoppingCart, route: 'store.sales.dashboard', color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
        { name: 'Money', icon: DollarSign, route: 'store.finance.index', color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
        { name: 'Contacts', icon: Users, route: 'store.parties.index', color: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
        { name: 'Reports', icon: TrendingUp, route: 'store.reports.index', color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
    ];

    // Process Expense Data: Calculate percentages using real data
    const totalExpenseValue = expenseData.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
    const hasExpenses = totalExpenseValue > 0;

    const finalExpenseData = hasExpenses ? expenseData.map(item => ({
        ...item,
        percentage: Math.round((item.value / totalExpenseValue) * 100)
    })) : [
        { name: 'No Data', value: 1, color: '#334155', percentage: 0 } // Placeholder if empty
    ];

    // Inventory pie data - Fix 0 || value bug by using explicit null updates or relying on passed 0s
    // Also ensuring it uses the props passed from controller which are already percentages
    const pieData = [
        { name: 'Healthy', value: inventoryHealth.healthy ?? 0, color: '#10b981' },
        { name: 'Low', value: inventoryHealth.lowStock ?? 0, color: '#f59e0b' },
        { name: 'Out', value: inventoryHealth.outOfStock ?? 0, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const activeInventoryStatus =
        inventoryHealth.outOfStock > 0 ? { label: 'Action Needed', color: 'text-red-500' } :
            inventoryHealth.lowStock > 0 ? { label: 'Low Stock', color: 'text-amber-500' } :
                { label: 'Healthy', color: 'text-emerald-500' };

    return (
        <OneGlanceLayout title="Executive Dashboard" mode="admin">
            <Head title="Executive Dashboard" />
            <div className="h-full w-full p-2 md:p-6 overflow-hidden">
                <div className="grid grid-cols-12 grid-rows-6 gap-4 w-full h-full">



                    {/* Row 1: 3 KPI Cards */}
                    <Link href={route("store.reports.low-stock", {
                        store_slug: store.slug
                    })} className="col-span-12 md:col-span-4 lg:col-span-3 block group">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-center relative overflow-hidden group-hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="flex justify-between items-center relative z-10 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl shadow-sm">
                                        <ClipboardList size={20} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Pending Actions</span>
                                </div>
                                {inventoryHealth.lowStock > 0 && (
                                    <span className="text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full">Action Needed</span>
                                )}
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{inventoryHealth.lowStockCount > 0 ? `${inventoryHealth.lowStockCount} Items` : '0 Items'}</h2>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                                    Requires your attention <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </p>
                            </div>
                        </div>
                    </Link>

                    <div className="col-span-12 md:col-span-4 lg:col-span-3 row-span-1">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="flex justify-between items-center relative z-10 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl shadow-sm">
                                        <TrendingUp size={20} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Profit Margin</span>
                                </div>
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ArrowUpRight size={10} /> Healthy
                                </span>
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total_revenue > 0 ? `${Math.round((stats.net_profit / stats.total_revenue) * 100)}%` : '0%'}</h2>
                                <p className="text-xs text-slate-400 mt-1">Net profit / Total revenue</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-4 lg:col-span-3 row-span-1">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="flex justify-between items-center relative z-10 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl shadow-sm">
                                        <Receipt size={20} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Overdue Payments</span>
                                </div>
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <TrendingUp size={10} /> On Track
                                </span>
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(stats.overdue_payments)}</h2>
                                <p className="text-xs text-slate-400 mt-1">{stats.overdue_payments > 0 ? 'Outstanding receivables' : 'No overdue invoices'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Spans all 6 rows */}
                    <div className="hidden lg:block col-span-3 row-span-6 h-full">
                        <div className="bg-slate-900 text-white rounded-[2rem] p-6 h-full flex flex-col relative overflow-hidden shadow-2xl ring-1 ring-white/10">
                            {/* Mesh Gradient Background */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
                            <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none"></div>

                            {/* Header - Cash Flow */}
                            <div className="relative z-30 flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                        <Wallet size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-300 font-medium">Net Balance</p>
                                        <h3 className="text-xl font-bold tracking-tight">{formatCurrency(stats.net_balance)}</h3>
                                    </div>
                                </div>
                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm">
                                    <MoreHorizontal size={20} className="text-slate-300" />
                                </button>
                            </div>

                            {/* Action Buttons - Glass Style like RightPanel */}
                            <div className="relative z-20 mb-6">
                                <div className="grid grid-cols-3 gap-2 h-20">
                                    <Link href={route('store.admin.users', { store_slug: store.slug })} className="col-span-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm">
                                        <div className="p-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            <Users size={18} />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wider">USERS</span>
                                    </Link>
                                    <Link href={route("store.reports.index", {
                                        store_slug: store.slug
                                    })} className="col-span-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm">
                                        <div className="p-1.5 rounded-full bg-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                            <FileText size={18} />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wider">REPORTS</span>
                                    </Link>
                                    <Link href={route('store.activity-log.index', { store_slug: store.slug })} className="col-span-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm">
                                        <div className="p-1.5 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                            <Activity size={18} />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wider">LOGS</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Cash In/Out Cards */}
                            <div className="relative z-10 mb-6 grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-3">
                                        <TrendingUp size={18} className="text-emerald-400" />
                                        <span className="text-[10px] text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">IN</span>
                                    </div>
                                    <h4 className="text-lg font-bold tracking-tight group-hover:scale-105 transition-transform origin-left">{formatCurrency(stats.today_in)}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1">Today's In</p>
                                </div>
                                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-3">
                                        <TrendingDown size={18} className="text-red-400" />
                                        <span className="text-[10px] text-red-200 bg-red-500/20 px-2 py-0.5 rounded-full font-bold">OUT</span>
                                    </div>
                                    <h4 className="text-lg font-bold tracking-tight group-hover:scale-105 transition-transform origin-left">{formatCurrency(stats.today_out)}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1">Today's Out</p>
                                </div>
                            </div>

                            {/* Business Alerts */}
                            <div className="relative z-10 mb-6 bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <AlertCircle size={14} /> Alerts
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {inventoryHealth.lowStock > 0 && (
                                        <div className="flex items-center gap-3 p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                            <Package size={14} className="text-amber-400 shrink-0" />
                                            <p className="text-xs text-amber-200">{inventoryHealth.lowStock}% inventory running low</p>
                                        </div>
                                    )}
                                    {inventoryHealth.outOfStock > 0 && (
                                        <div className="flex items-center gap-3 p-2.5 bg-red-500/10 rounded-lg border border-red-500/20">
                                            <AlertCircle size={14} className="text-red-400 shrink-0" />
                                            <p className="text-xs text-red-200">{inventoryHealth.outOfStock}% products out of stock</p>
                                        </div>
                                    )}
                                    {inventoryHealth.lowStock === 0 && inventoryHealth.outOfStock === 0 && (
                                        <div className="flex items-center gap-3 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                            <TrendingUp size={14} className="text-emerald-400 shrink-0" />
                                            <p className="text-xs text-emerald-200">All systems running smoothly</p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                        <DollarSign size={14} className="text-indigo-400 shrink-0" />
                                        <p className="text-xs text-indigo-200">Profit: {formatCurrency(stats.net_profit)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Section */}
                            <div className="relative z-10 flex-1 bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/5 flex flex-col min-h-0">
                                <div className="flex justify-between items-center mb-3 shrink-0">
                                    <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Business Activity</h3>
                                    <Link href={route('store.funds.index', { store_slug: store.slug, view: 'history' })} className="text-[10px] text-indigo-300 hover:text-white transition-colors font-semibold">View All</Link>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                    {recentActivity.length > 0 ? recentActivity.map((act, idx) => (
                                        <div key={idx} className="flex items-center justify-between group cursor-pointer px-2 py-2 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${act.is_plus ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                    {act.is_plus ? <Plus size={14} /> : <Minus size={14} />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[11px] font-bold text-white/90 truncate">{act.title}</span>
                                                    <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                                        <Clock size={8} /> {act.time}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[11px] font-black ${act.is_plus ? 'text-emerald-400' : 'text-rose-400'}`}>{act.amount}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                            <Activity size={24} className="mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Activity</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions Footer */}
                            <div className="relative z-10 pt-4 mt-4 border-t border-white/5 shrink-0">
                                <div className="grid grid-cols-2 gap-2">
                                    <Link href={route('store.admin.settings', { store_slug: store.slug })} className="flex items-center justify-center gap-2 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all">
                                        <Settings size={14} /> Settings
                                    </Link>
                                    <button className="flex items-center justify-center gap-2 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all">
                                        <Shield size={14} /> Security
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-12 lg:col-span-9 row-span-5 grid grid-cols-9 grid-rows-5 gap-4 h-full">
                        {/* Row 2 & 3: Main Charts Area */}

                        {/* purchases (Trend) - Large Tile (Left Top) */}
                        <div className="col-span-9 md:col-span-6 row-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Purchases Trend</h3>
                                    <p className="text-xs text-slate-400">Past 6 months spending</p>
                                </div>
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl">
                                    <TrendingUp size={18} />
                                </div>
                            </div>
                            <div className="flex-1 min-h-[120px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                    <AreaChart data={profitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            tickFormatter={(value) => `${currencySymbol}${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                            itemStyle={{ color: '#fff' }}
                                            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                                            formatter={(value) => `${currencySymbol} ${value.toLocaleString()}`}
                                        />
                                        <Area type="monotone" dataKey="expenses" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Inventory Health - Small Tile (Right Top) */}
                        <div className="col-span-9 md:col-span-3 row-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col">
                            <div className="flex justify-between items-start mb-2 shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Inventory</h3>
                                    <div className={`flex items-center gap-1.5 mt-1 ${activeInventoryStatus.color}`}>
                                        <Activity size={12} strokeWidth={3} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">{activeInventoryStatus.label}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[140px] relative -mt-4">
                                {/* Chart with z-10 to stay above icon */}
                                <div className="absolute inset-0 z-10 text-[10px]">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                        <PieChart>
                                            <Pie
                                                data={pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1, color: '#334155' }]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="60%"
                                                outerRadius="100%"
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {(pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1, color: '#334155' }]).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Icon with lower z-index */}
                                <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none z-0">
                                    <Package size={24} className="text-slate-300 dark:text-slate-600 opacity-50" />
                                </div>
                            </div>

                            <div className="mt-auto space-y-1.5 shrink-0 pt-2 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex justify-between gap-1 text-[10px]">
                                    {[
                                        { k: 'Healthy', val: inventoryHealth.healthy ?? 0, c: 'bg-emerald-500' },
                                        { k: 'Low', val: inventoryHealth.lowStock ?? 0, c: 'bg-amber-500' },
                                        { k: 'Out', val: inventoryHealth.outOfStock ?? 0, c: 'bg-red-500' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex flex-col items-center flex-1">
                                            <div className={`w-3 h-1 rounded-full mb-1 ${item.c}`}></div>
                                            <span className="font-bold text-slate-700 dark:text-white">{item.val}%</span>
                                            <span className="text-slate-400 text-[9px] uppercase">{item.k}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods - Small Tile (Left Bottom) */}
                        <div className="col-span-9 md:col-span-3 row-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Payments</h3>
                                    <p className="text-xs text-slate-400">Transaction types</p>
                                </div>
                                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
                                    <Wallet size={18} />
                                </div>
                            </div>
                            <div className="flex-1 min-h-[120px] relative">
                                {/* Chart Z-10 */}
                                <div className="absolute inset-0 z-10 text-[10px]">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                        <PieChart>
                                            <Pie
                                                data={paymentMethods.length > 0 ? paymentMethods : [{ name: 'No Data', value: 1, color: '#334155' }]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="60%"
                                                outerRadius="100%"
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {(paymentMethods.length > 0 ? paymentMethods : [{ name: 'No Data', value: 1, color: '#334155' }]).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value, name) => [value, name]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Icon Z-0 */}
                                <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none z-0">
                                    <Receipt size={24} className="text-slate-300 dark:text-slate-600 opacity-50" />
                                </div>
                            </div>
                            <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex justify-around items-center text-[10px] flex-wrap">
                                    {paymentMethods.map((method, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 mx-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: method.color }}></div>
                                            <span className="font-bold text-slate-600 dark:text-slate-300">{method.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Expense Breakdown - Large Tile (Right Bottom) */}
                        <div className="col-span-9 md:col-span-6 row-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col">
                            <div className="flex justify-between items-start mb-1 shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Expenses</h3>
                                    <p className="text-xs text-slate-400">Monthly breakdown</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(totalExpenseValue)}</p>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 w-full flex items-center gap-6">
                                {/* Chart on Left */}
                                <div className="h-full w-[45%] relative">
                                    {/* Z-10 for Chart */}
                                    <div className="absolute inset-0 z-10 text-[10px]">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                            <PieChart>
                                                <Pie
                                                    data={finalExpenseData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="60%"
                                                    outerRadius="95%"
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {finalExpenseData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value) => `${currencySymbol} ${value.toLocaleString()}`}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Icon Z-0 */}
                                    <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none z-0">
                                        <DollarSign size={24} className="text-slate-300 dark:text-slate-600 opacity-50" />
                                    </div>
                                </div>

                                {/* Legend on Right (Grid Layout) */}
                                <div className="flex-1 grid grid-cols-2 gap-3 content-center">
                                    {finalExpenseData.map((item, idx) => (
                                        <div key={idx} className="flex flex-col p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[80px]">{item.name}</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-800 dark:text-slate-200">{item.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>


                        {/* Row 4: Quick Stats Footer */}
                        <div className="col-span-9 row-span-1 grid grid-cols-3 gap-6" >
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Staff</p>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{stats.active_staff} / {stats.total_staff}</h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status</p>
                                    <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Operational</h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-2xl">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Backup</p>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{stats.last_backup || 'N/A'}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout >
    );
}

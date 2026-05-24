import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const ChartSection = ({ isDarkMode, salesData }) => {
    const { store, settings } = usePage().props;
    const [activeTab, setActiveTab] = useState('Today');
    const chartData = salesData[activeTab] || [];

    // Calculate period totals
    const totalSales = chartData.reduce((sum, item) => sum + (item.sales || 0), 0);
    const totalProfit = chartData.reduce((sum, item) => sum + (item.profit || 0), 0);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 h-full flex flex-col relative group">
            {/* Single Line Header */}
            <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                            <TrendingUp size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Revenue Analytics</h2>
                    </div>

                    {/* Sales with color indicator and value */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <span className="font-bold text-slate-600 dark:text-slate-400">Sales</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalSales, store || settings)}</span>
                    </div>

                    {/* Gross Profit with color indicator and value */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="font-bold text-slate-600 dark:text-slate-400">Gross Profit</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalProfit, store || settings)}</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {['Today', 'Month', 'Year'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 w-full relative min-h-[300px]">
                <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} strokeOpacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? '#94a3b8' : '#94a3b8', fontSize: 11, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? '#94a3b8' : '#94a3b8', fontSize: 11, fontWeight: 500 }}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div style={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                                padding: '12px 16px'
                                            }}>
                                                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}>
                                                    {label}
                                                </p>
                                                {/* Sales first */}
                                                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
                                                    💰 Sales: <span style={{ color: '#6366f1' }}>{formatCurrency(payload.find(p => p.dataKey === 'sales')?.value || 0, store || settings)}</span>
                                                </p>
                                                {/* Gross Profit second */}
                                                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
                                                    ✨ Gross Profit: <span style={{ color: '#10b981' }}>{formatCurrency(payload.find(p => p.dataKey === 'profit')?.value || 0, store || settings)}</span>
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                                cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                            />
                            <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ChartSection;

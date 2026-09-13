import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { vq } from '@/theme/runtime';
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
        <div className="bg-surface rounded-lg p-5 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-line h-full flex flex-col relative group">
            {/* Single Line Header */}
            <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600">
                            <TrendingUp size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-ink">Revenue Analytics</h2>
                    </div>

                    {/* Sales with color indicator and value */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                        <span className="font-bold text-ink-secondary">Sales</span>
                        <span className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(totalSales, store || settings)}</span>
                    </div>

                    {/* Gross Profit with color indicator and value */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="font-bold text-ink-secondary">Gross Profit</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalProfit, store || settings)}</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex bg-sunken p-1 rounded-xl">
                    {['Today', 'Month', 'Year'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-sunken shadow-sm text-brand-600' : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 w-full relative min-h-[300px]">
                <div className="w-full h-[300px] lg:absolute lg:inset-0 lg:h-auto">
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={vq.indigo[500]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={vq.indigo[500]} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={vq.emerald[500]} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={vq.emerald[500]} stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? vq.slate[700] : vq.slate[100]} strokeOpacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? vq.slate[400] : vq.slate[400], fontSize: 11, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? vq.slate[400] : vq.slate[400], fontSize: 11, fontWeight: 500 }}
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
                                                <p style={{ fontSize: '11px', fontWeight: 'bold', color: vq.slate[400], marginBottom: '4px' }}>
                                                    {label}
                                                </p>
                                                {/* Sales first */}
                                                <p style={{ fontSize: '13px', fontWeight: 'bold', color: vq.slate[200], margin: 0 }}>
                                                    💰 Sales: <span style={{ color: vq.indigo[500] }}>{formatCurrency(payload.find(p => p.dataKey === 'sales')?.value || 0, store || settings)}</span>
                                                </p>
                                                {/* Gross Profit second */}
                                                <p style={{ fontSize: '13px', fontWeight: 'bold', color: vq.slate[200], margin: 0 }}>
                                                    ✨ Gross Profit: <span style={{ color: vq.emerald[500] }}>{formatCurrency(payload.find(p => p.dataKey === 'profit')?.value || 0, store || settings)}</span>
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                                cursor={{ stroke: vq.indigo[500], strokeWidth: 2, strokeDasharray: '5 5' }}
                            />
                            <Area type="monotone" dataKey="profit" stroke={vq.emerald[500]} strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            <Area type="monotone" dataKey="sales" stroke={vq.indigo[500]} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ChartSection;

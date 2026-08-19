import React from 'react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs/ThinkingOrb';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Database, Package, TrendingUp } from 'lucide-react';

export default function HistoryUnlockedModal({ isOpen, onClose, moduleName = 'Inventory', historyData }) {
    if (!isOpen) return null;

    const metrics = historyData || {
        months_tracked: 8,
        recorded_sales: 1420,
        recorded_products: 48,
        stock_value: 847300,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-xl overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-indigo-500/10">
                {/* Glow Backdrop */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="p-6 md:p-8 space-y-6 relative z-10">
                    {/* Header with ThinkingOrb */}
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-center shadow-inner">
                            <ThinkingOrb state="weaving" size={48} theme="dark" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold mb-1">
                                <Sparkles size={12} className="text-indigo-400" />
                                <span>The Qore Ledger Advantage</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                                Welcome to {moduleName}
                            </h2>
                        </div>
                    </div>

                    {/* Announcement Banner */}
                    <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-2">
                        <p className="text-slate-200 text-sm md:text-base font-medium">
                            ✨ <span className="text-emerald-400 font-bold">VenQore has been tracking this for you since March.</span>
                        </p>
                        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                            Because The Qore's double-entry ledger always records in the background, your new module is ready with verified historical data from day one.
                        </p>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                                <Database size={14} className="text-indigo-400" />
                                <span>Movement History</span>
                            </div>
                            <div className="text-lg md:text-xl font-bold text-white">
                                {metrics.months_tracked} Months
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                                <TrendingUp size={14} className="text-emerald-400" />
                                <span>Recorded Movements</span>
                            </div>
                            <div className="text-lg md:text-xl font-bold text-emerald-400">
                                {metrics.recorded_sales?.toLocaleString() || 1420} Rows
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                                <Package size={14} className="text-amber-400" />
                                <span>Tracked Items</span>
                            </div>
                            <div className="text-lg md:text-xl font-bold text-white">
                                {metrics.recorded_products || 48} Products
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                                <ShieldCheck size={14} className="text-indigo-400" />
                                <span>Current Stock Value</span>
                            </div>
                            <div className="text-lg md:text-xl font-bold text-indigo-300">
                                Rs. {metrics.stock_value?.toLocaleString() || '847,300'}
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98"
                        >
                            <span>Explore Unlocked History</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

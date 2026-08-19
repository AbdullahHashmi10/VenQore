import React, { useState } from 'react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs/ThinkingOrb';
import HistoryUnlockedModal from './Components/HistoryUnlockedModal';
import { Sparkles, ArrowRight, CheckCircle2, ShoppingBag, Receipt, Package, DollarSign, BarChart2, ShieldCheck, Rocket, Zap, BookOpen } from 'lucide-react';

export default function FirstRunDashboard({ storeSlug, tenantName, modules = [], onCompleteAll }) {
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const activeList = modules.length > 0 ? modules : ['products', 'pos', 'inventory', 'expenses', 'reports'];

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn relative z-10">
            {/* Celebration Banner */}
            <div className="p-8 md:p-10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-30">
                    <ThinkingOrb state="weaving" size={180} theme="dark" />
                </div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-semibold backdrop-blur-md">
                        <CheckCircle2 size={14} />
                        <span>Architecture Verified & Live</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                        Your Custom System is Live!
                    </h2>

                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                        Welcome to <strong className="text-white">{tenantName || 'your store'}</strong>. Your custom module workspace has been assembled on The Qore ledger engine.
                    </p>

                    <div className="pt-3 flex flex-wrap gap-3">
                        <button
                            onClick={onCompleteAll}
                            className="py-4 px-8 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center gap-2.5 transition-all transform active:scale-98"
                        >
                            <Rocket size={18} />
                            <span>Launch Main Workspace</span>
                            <ArrowRight size={18} />
                        </button>

                        <button
                            onClick={() => setShowHistoryModal(true)}
                            className="py-4 px-6 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs rounded-2xl flex items-center gap-2 transition-all shadow-lg"
                        >
                            <Sparkles size={16} className="text-amber-400" />
                            <span>Preview §6.7 Ledger History Probe</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Launchers */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Active Module Launchers ({activeList.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-all duration-300 shadow-xl group">
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 w-fit group-hover:scale-110 transition-transform">
                            <ShoppingBag size={22} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">POS Counter</h4>
                            <p className="text-slate-400 text-xs mt-1">Start counter checkout & cash register</p>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-emerald-500/50 transition-all duration-300 shadow-xl group">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 w-fit group-hover:scale-110 transition-transform">
                            <Package size={22} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Product Catalogue</h4>
                            <p className="text-slate-400 text-xs mt-1">Manage physical products & categories</p>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-amber-500/50 transition-all duration-300 shadow-xl group">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 w-fit group-hover:scale-110 transition-transform">
                            <Receipt size={22} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Invoices & Quotes</h4>
                            <p className="text-slate-400 text-xs mt-1">Issue legal bills & B2B proposals</p>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-purple-500/50 transition-all duration-300 shadow-xl group">
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400 w-fit group-hover:scale-110 transition-transform">
                            <BarChart2 size={22} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Reports & Pulse</h4>
                            <p className="text-slate-400 text-xs mt-1">Auto-scaled financial summaries</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* §6.7 Modal */}
            <HistoryUnlockedModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                moduleName="Inventory"
            />
        </div>
    );
}

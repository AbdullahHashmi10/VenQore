import React, { useState } from 'react';
import { usePage, Head, router } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import PageHeader from '@/Components/PageHeader';
import {
    Scale,
    Download,
    ShieldCheck,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Landmark,
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, accounts = [], total, colorClass, totalColorClass }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className={`p-6 border-b border-slate-100 dark:border-slate-800 ${colorClass}`}>
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Icon size={20} />
                    {title}
                </h3>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {accounts.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400 italic text-center">No activity as of this date.</p>
                ) : accounts.map((account) => (
                    <div
                        key={account.id}
                        className="px-6 py-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-slate-400 w-12 shrink-0">{account.code}</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{account.name}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(account.balance)}
                        </span>
                    </div>
                ))}

                {/* Section total row */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                        Total {title}
                    </span>
                    <span className={`text-lg font-black tabular-nums ${totalColorClass}`}>
                        {formatCurrency(total)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BalanceSheet({
    assets = { accounts: [], total: 0 },
    liabilities = { accounts: [], total: 0 },
    equity = { accounts: [], total: 0 },
    total_assets = 0,
    total_liabilities = 0,
    total_equity = 0,
    is_balanced = true,
    as_of = '',
}) {
    const [dateInput, setDateInput] = useState(as_of);
    const equationDiff = Math.abs(total_assets - (total_liabilities + total_equity));

    return (
        <ReportsLayout title="Balance Sheet">
            <Head title="Balance Sheet" />

            <div className="h-full flex flex-col gap-5 p-6 overflow-hidden">

                <PageHeader
                    title="Balance Sheet"
                    subtitle={`Financial position as of ${as_of}`}
                    icon={Scale}
                    breadcrumbs={[
                        { label: 'Money' },
                        { label: 'Accounting' },
                        { label: 'Balance Sheet' },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            {/* As-Of Date Picker */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800
                                            border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                                <Calendar size={15} className="text-slate-400 shrink-0" />
                                <input
                                    type="date"
                                    value={dateInput}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setDateInput(e.target.value)}
                                    onBlur={() => router.get(route('store.accounting.balance-sheet', { store_slug: store.slug }), { date: dateInput }, { preserveScroll: true })}
                                    onKeyDown={(e) => e.key === 'Enter' && router.get(route('store.accounting.balance-sheet', { store_slug: store.slug }), { date: dateInput }, { preserveScroll: true })}
                                    title="As-of date — all balances computed up to and including this date"
                                    className="text-sm bg-transparent text-slate-800 dark:text-slate-200
                                               outline-none cursor-pointer"
                                />
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800
                                               border border-slate-200 dark:border-slate-700 rounded-xl font-bold
                                               text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                                <Download size={18} /> Export PDF
                            </button>
                        </div>
                    }
                />

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">

                    {/* ── Balance Status Banner ───────────────────────────── */}
                    <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border
                        ${is_balanced
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                        }`}
                    >
                        {is_balanced
                            ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                            : <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                        }
                        <div>
                            <p className="font-bold">
                                {is_balanced
                                    ? 'Books are Balanced — Assets = Liabilities + Equity'
                                    : `BOOKS ARE UNBALANCED — difference of ${formatCurrency(equationDiff)}`
                                }
                            </p>
                            <p className="text-sm opacity-75 mt-0.5">
                                {is_balanced
                                    ? `All journal entries are correctly double-posted. As of ${as_of}.`
                                    : `One or more journal entries have a DR/CR mismatch. Immediate investigation required. As of ${as_of}.`
                                }
                            </p>
                        </div>
                    </div>

                    {/* ── Accounting Equation Card ────────────────────────── */}
                    <div className="p-8 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20
                                    flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        {/* Total Assets */}
                        <div className="text-center md:text-left relative z-10">
                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">
                                Total Assets
                            </p>
                            <h3 className="text-4xl font-black tabular-nums">
                                {formatCurrency(total_assets)}
                            </h3>
                        </div>

                        <div className="text-3xl font-light text-indigo-300 hidden md:block">=</div>

                        {/* Liabilities + Equity */}
                        <div className="flex gap-10 text-center md:text-right relative z-10">
                            <div>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">
                                    Liabilities
                                </p>
                                <p className="text-2xl font-bold tabular-nums">
                                    {formatCurrency(total_liabilities)}
                                </p>
                            </div>
                            <div className="text-2xl font-light text-indigo-300 self-end pb-1">+</div>
                            <div>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">
                                    Equity
                                </p>
                                <p className="text-2xl font-bold tabular-nums">
                                    {formatCurrency(total_equity)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Section Grid ─────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Left column — Assets */}
                        <SectionCard
                            title="Assets"
                            icon={ShieldCheck}
                            accounts={assets.accounts}
                            total={total_assets}
                            colorClass="bg-blue-50/40 dark:bg-blue-900/5 text-blue-700 dark:text-blue-400"
                            totalColorClass="text-blue-600 dark:text-blue-400"
                        />

                        {/* Right column — Liabilities + Equity stacked */}
                        <div className="space-y-6">
                            <SectionCard
                                title="Liabilities"
                                icon={Landmark}
                                accounts={liabilities.accounts}
                                total={total_liabilities}
                                colorClass="bg-rose-50/40 dark:bg-rose-900/5 text-rose-700 dark:text-rose-400"
                                totalColorClass="text-rose-600 dark:text-rose-400"
                            />
                            <SectionCard
                                title="Equity"
                                icon={TrendingUp}
                                accounts={equity.accounts}
                                total={total_equity}
                                colorClass="bg-indigo-50/40 dark:bg-indigo-900/5 text-indigo-700 dark:text-indigo-400"
                                totalColorClass="text-indigo-600 dark:text-indigo-400"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </ReportsLayout>
    );
}

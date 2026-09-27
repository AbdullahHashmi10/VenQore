import React from 'react';
import { BookOpen, Lock, Sparkles, AlertTriangle } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';

export default function AccountingSection({ data, setData }) {
    const { store } = usePage().props;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Financial Cycles */}
                <div className="space-y-4 bg-surface rounded-2xl border border-line p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Financial Cycles</h3>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Fiscal Year Start Date</label>
                        <input
                            type="date"
                            value={data.fiscal_year_start || '2025-01-01'}
                            onChange={e => setData('fiscal_year_start', e.target.value)}
                            className="w-full px-4 py-2.5 bg-app text-ink border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold shadow-xs"
                        />
                        <p className="text-3xs text-ink-muted mt-1">Used by financial statements, balance sheets, and annual P&amp;L period closings.</p>
                    </div>

                    <div className="pt-4 border-t border-line space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-ink">Financial Period Locks</h4>
                                <p className="text-xs text-ink-muted">Freeze historical dates to prevent retroactive ledger tampering</p>
                            </div>
                        </div>
                        <Link
                            href={route('store.v3.fiscal-year.index', { store_slug: store?.slug || route().params?.store_slug })}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 w-full sm:w-auto"
                        >
                            <Lock size={14} />
                            <span>Manage Fiscal Years &amp; Hard Locks</span>
                        </Link>
                    </div>
                </div>

                {/* Right Card: Reckoner Intelligence Risk Thresholds */}
                <div className="space-y-4 bg-surface rounded-2xl border border-line p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Reckoner Intelligence Tuning</h3>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between">
                                <span>Heavy Discount Review Flag</span>
                                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{data['reckoner.heavy_discount_pct'] ?? 20}%</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={data['reckoner.heavy_discount_pct'] ?? 20}
                                onChange={e => setData('reckoner.heavy_discount_pct', parseInt(e.target.value, 10) || 20)}
                                className="w-full px-4 py-2 bg-app text-ink border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold"
                            />
                            <p className="text-3xs text-ink-muted">Discounts above this percentage trigger manager review flags in audit logs.</p>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-line">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between">
                                <span>Expiry Warning Horizon</span>
                                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{data['reckoner.expiry_warning_days'] ?? 30} days</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={data['reckoner.expiry_warning_days'] ?? 30}
                                onChange={e => setData('reckoner.expiry_warning_days', parseInt(e.target.value, 10) || 30)}
                                className="w-full px-4 py-2 bg-app text-ink border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold"
                            />
                            <p className="text-3xs text-ink-muted">Products expiring within this timeframe are surfaced on executive dashboards.</p>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-line">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between">
                                <span>Inventory Carrying Cost Rate</span>
                                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{data['reckoner.carrying_cost_pct'] ?? 15}%</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={data['reckoner.carrying_cost_pct'] ?? 15}
                                onChange={e => setData('reckoner.carrying_cost_pct', parseInt(e.target.value, 10) || 15)}
                                className="w-full px-4 py-2 bg-app text-ink border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold"
                            />
                            <p className="text-3xs text-ink-muted">Annual holding rate used to estimate carrying cost on excess inventory.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

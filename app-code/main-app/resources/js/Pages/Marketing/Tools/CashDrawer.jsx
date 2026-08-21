import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Download, Loader2, DollarSign, Calculator, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';

const STORAGE_KEY = 'venqore_cash_drawer_store_v1';

const FAQS = [
    { q: 'What is a Cash Drawer Count Sheet?', a: 'A Cash Drawer Count Sheet is a till reconciliation form used at the start and end of retail or restaurant shifts to record cash currency breakdown (bills and coins), compare against expected sales, and calculate overage or shortage variances.' },
    { q: 'Why is balancing the cash drawer important?', a: 'Regular till reconciliation deters theft, catches cashier errors early, prevents accounting discrepancies, and builds an accurate paper trail for audit compliance.' },
    { q: 'Can I customize currency notes and coins?', a: 'Yes — you can select USD, EUR, or GBP pre-populated presets, or add custom bill/coin rows with your own values and labels for any local currency.' },
    { q: 'How is the variance calculated?', a: 'Variance = Total Counted Cash − Expected Cash Total. If counted cash is greater than expected, it shows as an OVER (+); if counted cash is less than expected, it shows as a SHORT (-).' },
    { q: 'Is my register audit data saved on your servers?', a: 'No. Everything calculates instantly in your browser, and the PDF is generated on demand without storing any shift figures on our servers.' },
];

export default function CashDrawerTool({ currencies = {}, defaultDenominations = {}, toolGroups = [] }) {
    const [store, setStore] = useState({
        name: '',
        location: '',
        cashier_name: '',
        supervisor_name: '',
        register_id: 'Register 1',
        shift_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const [meta, setMeta] = useState({
        currency: 'USD',
        opening_float: 150.00,
        expected_cash_sales: 0.00,
        expected_cash_total: 150.00,
    });

    const [denominations, setDenominations] = useState([]);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initialize default denominations based on currency
    useEffect(() => {
        const defaults = defaultDenominations[meta.currency] || defaultDenominations['USD'] || [];
        setDenominations(defaults.map((d) => ({ ...d })));
    }, [meta.currency]);

    // Load store profile from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setStore((prev) => ({ ...prev, ...JSON.parse(saved) }));
        } catch (e) { /* ignore */ }
    }, []);

    // Persist store info
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                name: store.name,
                location: store.location,
                register_id: store.register_id,
            }));
        } catch (e) { /* ignore */ }
    }, [store.name, store.location, store.register_id]);

    // Auto-update expected_cash_total when float or sales change unless manually overridden
    const handleFloatOrSalesChange = (field, val) => {
        setMeta((prev) => {
            const next = { ...prev, [field]: parseFloat(val) || 0 };
            next.expected_cash_total = (next.opening_float || 0) + (next.expected_cash_sales || 0);
            return next;
        });
    };

    const symbol = currencies[meta.currency]?.symbol || '$';

    const totals = useMemo(() => {
        let totalBills = 0;
        let totalCoins = 0;

        denominations.forEach((d) => {
            const val = parseFloat(d.value) || 0;
            const count = parseInt(d.count) || 0;
            const sub = val * count;
            if (d.type === 'coin') {
                totalCoins += sub;
            } else {
                totalBills += sub;
            }
        });

        const totalCounted = totalBills + totalCoins;
        const expected = parseFloat(meta.expected_cash_total) || 0;
        const variance = totalCounted - expected;

        return {
            totalBills,
            totalCoins,
            totalCounted,
            expected,
            variance,
            status: variance === 0 ? 'exact' : (variance > 0 ? 'over' : 'short'),
        };
    }, [denominations, meta.expected_cash_total]);

    const updateCount = (idx, countVal) => {
        const count = Math.max(0, parseInt(countVal) || 0);
        setDenominations((prev) => prev.map((d, i) => (i === idx ? { ...d, count } : d)));
    };

    const updateDenomField = (idx, field, val) => {
        setDenominations((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: val } : d)));
    };

    const addDenomination = (type) => {
        setDenominations((prev) => [
            ...prev,
            { name: type === 'bill' ? 'Custom Bill' : 'Custom Coin', type, value: 1.00, count: 0 },
        ]);
    };

    const removeDenomination = (idx) => {
        setDenominations((prev) => prev.filter((_, i) => i !== idx));
    };

    const resetCounts = () => {
        setDenominations((prev) => prev.map((d) => ({ ...d, count: 0 })));
    };

    const generatePdf = async () => {
        setErrors([]);
        if (!store.name.trim()) { setErrors(['Store name is required.']); return; }
        if (denominations.length === 0) { setErrors(['Add at least one denomination line.']); return; }

        setLoading(true);
        try {
            const res = await fetch(route('tools.cash-drawer.render'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ store, denominations, meta }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErrors(body.errors || ['Could not generate PDF count sheet. Please check entries.']);
                setLoading(false);
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cash-drawer-count-${store.shift_date || 'shift'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setErrors(['Failed to build PDF. Please try again.']);
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-900/10 dark:border-white/10 text-ink text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-400/60 transition-colors';
    const labelCls = 'block text-xs font-bold text-ink-muted mb-1.5';

    const currencyOptions = Object.entries(currencies).map(([code, c]) => ({
        value: code, label: c.label,
    }));

    return (
        <ToolShell
            title="Free Cash Drawer Count Sheet & Till Reconciliation | VenQore"
            metaDescription="Free online cash drawer count sheet and till reconciliation tool. Calculate cash denomination totals, expected sales, and over/short variance with a printable PDF audit sheet."
            eyebrow="Free Tools"
            h1="Cash Drawer Count Sheet"
            answer="Reconcile your register till at shift end in minutes. Enter bill and coin counts, opening float, and expected sales to instantly calculate cash totals and over/short variance. Print an audit PDF with cashier and supervisor signature lines."
            toolGroups={toolGroups}
            currentSlug="cash-drawer-count-sheet"
            faqs={FAQS}
            cta={{ headline: 'Tired of manual cash balancing?', subtext: 'VenQore POS tracks shift sales, cash drawer openings, and payment balances automatically with double-entry precision.' }}
            related={[{ href: '/tools/stock-count-sheet', label: 'Stock Count Sheet' }, { href: '/tools/receipt-generator', label: 'Receipt Generator' }]}
        >
            {errors.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-600 dark:text-red-400">
                        {errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                </div>
            )}

            {/* Store & Register Metadata */}
            <section className="mb-8 p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-wide text-ink-muted mb-4">
                    Store & Register Shift Info
                </h3>
                <div className="grid sm:grid-cols-3 gap-3 mb-3">
                    <div>
                        <label className={labelCls}>Store Name *</label>
                        <input className={inputCls} placeholder="e.g. Downtown Retail Store" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>Register / Till ID</label>
                        <input className={inputCls} placeholder="e.g. Till #1" value={store.register_id} onChange={(e) => setStore({ ...store, register_id: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>Shift Date</label>
                        <input type="date" className={inputCls} value={store.shift_date} onChange={(e) => setStore({ ...store, shift_date: e.target.value })} />
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Cashier Name</label>
                        <input className={inputCls} placeholder="e.g. John Doe" value={store.cashier_name} onChange={(e) => setStore({ ...store, cashier_name: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>Supervisor Name</label>
                        <input className={inputCls} placeholder="e.g. Jane Smith" value={store.supervisor_name} onChange={(e) => setStore({ ...store, supervisor_name: e.target.value })} />
                    </div>
                </div>
            </section>

            {/* Reconciliation Expected Amounts */}
            <section className="mb-8 p-5 rounded-2xl bg-brand-500/[0.03] border border-brand-500/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400 flex items-center gap-2">
                        <Calculator size={16} /> Reconciliation Targets
                    </h3>
                    <div className="w-40">
                        <Select value={meta.currency} onChange={(v) => setMeta({ ...meta, currency: v })} options={currencyOptions} />
                    </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className={labelCls}>Opening Float ({symbol})</label>
                        <input type="number" min="0" step="any" className={inputCls} value={meta.opening_float} onChange={(e) => handleFloatOrSalesChange('opening_float', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelCls}>Expected Cash Sales ({symbol})</label>
                        <input type="number" min="0" step="any" className={inputCls} value={meta.expected_cash_sales} onChange={(e) => handleFloatOrSalesChange('expected_cash_sales', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelCls}>Total Expected Cash ({symbol})</label>
                        <input type="number" min="0" step="any" className={`${inputCls} font-bold`} value={meta.expected_cash_total} onChange={(e) => setMeta({ ...meta, expected_cash_total: parseFloat(e.target.value) || 0 })} />
                    </div>
                </div>
            </section>

            {/* Denomination Counter Breakdown */}
            <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-ink-muted flex items-center gap-2">
                        <DollarSign size={16} /> Currency Denominations Count
                    </h3>
                    <button
                        type="button"
                        onClick={resetCounts}
                        className="text-xs font-bold text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 flex items-center gap-1 transition-colors"
                    >
                        <RefreshCw size={12} /> Reset Counts
                    </button>
                </div>

                <div className="space-y-2 mb-4">
                    {denominations.map((d, idx) => {
                        const subtotal = (parseFloat(d.value) || 0) * (parseInt(d.count) || 0);
                        return (
                            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                                <span className={`text-2xs font-bold uppercase px-2 py-0.5 rounded ${d.type === 'coin' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                    {d.type}
                                </span>
                                <input
                                    className={`${inputCls} flex-1 text-xs py-1.5`}
                                    value={d.name}
                                    onChange={(e) => updateDenomField(idx, 'name', e.target.value)}
                                />
                                <div className="w-24 shrink-0">
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        className={`${inputCls} text-xs py-1.5`}
                                        value={d.value}
                                        onChange={(e) => updateDenomField(idx, 'value', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="w-28 shrink-0">
                                    <input
                                        type="number"
                                        min="0"
                                        className={`${inputCls} text-xs py-1.5 font-bold text-center`}
                                        placeholder="Count"
                                        value={d.count === 0 ? '' : d.count}
                                        onChange={(e) => updateCount(idx, e.target.value)}
                                    />
                                </div>
                                <div className="w-28 text-right font-bold text-sm text-ink shrink-0">
                                    {symbol}{subtotal.toFixed(2)}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeDenomination(idx)}
                                    className="p-1.5 text-ink-muted hover:text-red-500 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => addDenomination('bill')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-line dark:border-white/15 text-xs font-bold text-ink-muted hover:border-brand-400/50 hover:text-brand-500 transition-colors"
                    >
                        <Plus size={12} /> Add Bill
                    </button>
                    <button
                        type="button"
                        onClick={() => addDenomination('coin')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-line dark:border-white/15 text-xs font-bold text-ink-muted hover:border-brand-400/50 hover:text-brand-500 transition-colors"
                    >
                        <Plus size={12} /> Add Coin
                    </button>
                </div>
            </section>

            {/* Reconciliation Live Summary Box */}
            <section className="mb-8 p-5 rounded-2xl bg-sunken dark:bg-white/[0.04] border border-line dark:border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-wide text-ink-muted mb-4">
                    Till Summary & Variance
                </h3>

                <div className="grid sm:grid-cols-4 gap-4 text-center">
                    <div className="p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/5">
                        <span className="block text-2xs font-bold uppercase text-ink-muted">Bills Total</span>
                        <span className="text-lg font-bold text-ink">{symbol}{totals.totalBills.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/5">
                        <span className="block text-2xs font-bold uppercase text-ink-muted">Coins Total</span>
                        <span className="text-lg font-bold text-ink">{symbol}{totals.totalCoins.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/5">
                        <span className="block text-2xs font-bold uppercase text-ink-muted">Total Counted Cash</span>
                        <span className="text-xl font-bold text-brand-600 dark:text-brand-400">{symbol}{totals.totalCounted.toFixed(2)}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${totals.status === 'exact' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : totals.status === 'over' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                        <span className="block text-2xs font-bold uppercase">Variance (Over/Short)</span>
                        <span className="text-xl font-bold">
                            {totals.variance > 0 ? `+${symbol}${totals.variance.toFixed(2)} OVER` : totals.variance < 0 ? `-${symbol}${Math.abs(totals.variance).toFixed(2)} SHORT` : `${symbol}0.00 BALANCED`}
                        </span>
                    </div>
                </div>
            </section>

            {/* Notes */}
            <section className="mb-8">
                <label className={labelCls}>Shift Notes / Discrepancy Reason (Optional)</label>
                <textarea
                    className={inputCls}
                    rows={2}
                    placeholder="Enter any notes regarding drawer overage/shortage or shift audit details..."
                    value={store.notes}
                    onChange={(e) => setStore({ ...store, notes: e.target.value })}
                />
            </section>

            <button
                type="button"
                onClick={generatePdf}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-sunken dark:bg-white text-white dark:text-[#05030f] rounded-xl text-sm font-bold uppercase tracking-wide transition-transform disabled:opacity-50 disabled:"
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {loading ? 'Generating PDF…' : 'Download Printable Audit PDF'}
            </button>
        </ToolShell>
    );
}

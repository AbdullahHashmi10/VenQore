import React, { useState, useMemo, useRef } from 'react';
import { Calculator, TrendingUp, Table as TableIcon, Download, Trash2, Plus, ClipboardPaste, AlertTriangle } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';

/**
 * Profit Margin & Markup Calculator — free, entirely client-side.
 *
 * Standard retail math, kept in one place so it can't drift:
 *   margin%  = (price - cost) / price  * 100
 *   markup%  = (price - cost) / cost   * 100
 *
 * Solving for price given cost + target margin%:
 *   price = cost / (1 - margin/100)
 * Solving for price given cost + target markup%:
 *   price = cost * (1 + markup/100)
 *
 * Solving for cost given price + target margin%:
 *   cost = price * (1 - margin/100)
 * Solving for cost given price + target markup%:
 *   cost = price / (1 + markup/100)
 *
 * Hand-verified: cost=40, price=100 -> margin=60%, markup=150%.
 *   margin = (100-40)/100*100 = 60          ✓
 *   markup = (100-40)/40*100  = 150         ✓
 *   price from cost=40 + margin=60: 40/(1-0.6) = 40/0.4 = 100   ✓
 *   price from cost=40 + markup=150: 40*(1+1.5) = 40*2.5 = 100  ✓
 */

const CURRENCIES = {
    USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'AU$',
    PKR: 'Rs', INR: '₹', AED: 'AED', SAR: 'SAR', JPY: '¥',
};

function round2(n) {
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100) / 100;
}

function marginFromCostPrice(cost, price) {
    if (!Number.isFinite(price) || price === 0) return null;
    return ((price - cost) / price) * 100;
}

function markupFromCostPrice(cost, price) {
    if (!Number.isFinite(cost) || cost === 0) return null;
    return ((price - cost) / cost) * 100;
}

function priceFromCostMargin(cost, margin) {
    if (margin === null || margin === undefined || margin === '' || Number.isNaN(margin)) return null;
    const denom = 1 - margin / 100;
    if (denom === 0) return null; // 100% margin is mathematically undefined (infinite price)
    return cost / denom;
}

function priceFromCostMarkup(cost, markup) {
    if (markup === null || markup === undefined || markup === '' || Number.isNaN(markup)) return null;
    return cost * (1 + markup / 100);
}

function costFromPriceMargin(price, margin) {
    if (margin === null || margin === undefined || margin === '' || Number.isNaN(margin)) return null;
    return price * (1 - margin / 100);
}

function costFromPriceMarkup(price, markup) {
    if (markup === null || markup === undefined || markup === '' || Number.isNaN(markup)) return null;
    const denom = 1 + markup / 100;
    if (denom === 0) return null; // -100% markup undefined
    return price / denom;
}

const FAQS = [
    { q: "What's the difference between margin and markup?", a: 'Margin is profit as a percentage of the selling price: (price − cost) ÷ price. Markup is profit as a percentage of the cost: (price − cost) ÷ cost. They use the same profit dollar amount but divide by a different base, so markup is always a bigger number than margin for the same sale (except at 0%). A 50% margin equals a 100% markup — not a 50% markup.' },
    { q: 'How do I calculate my profit margin?', a: 'Subtract your cost from your selling price to get gross profit, then divide that by the selling price and multiply by 100. Example: sell price $100, cost $40 → profit $60 → margin = 60 ÷ 100 × 100 = 60%.' },
    { q: "What's a good profit margin for retail?", a: 'It varies widely by category. General retail often runs 20–50% gross margin, grocery is much thinner (often single digits to ~15%), and specialty/apparel/jewelry can run 50–70%+. There is no universal "good" number — compare against your specific category and your fixed costs, not a rule of thumb.' },
    { q: 'How do I price a product to hit a target margin?', a: 'Use price = cost ÷ (1 − target margin ÷ 100). For a $40 cost and a 60% target margin: 40 ÷ (1 − 0.60) = 40 ÷ 0.40 = $100.' },
    { q: 'How do I price a product to hit a target markup?', a: 'Use price = cost × (1 + target markup ÷ 100). For a $40 cost and a 150% target markup: 40 × (1 + 1.50) = 40 × 2.50 = $100.' },
    { q: 'Why can margin never reach 100%?', a: 'Margin is profit divided by selling price. As cost approaches zero, margin approaches 100% but never gets there while price stays finite — and a 100% margin would mean the product had zero cost. Markup, by contrast, has no upper bound.' },
];

export default function MarginCalculator({ toolGroups = [] }) {
    /* ── Solver mode ─────────────────────────────────────────────────── */
    const [currency, setCurrency] = useState('USD');
    const [cost, setCost] = useState('40');
    const [price, setPrice] = useState('100');
    const [margin, setMargin] = useState('');
    const [markup, setMarkup] = useState('');
    // Which two fields the user is treating as "inputs" right now.
    const [lastEdited, setLastEdited] = useState(['cost', 'price']);

    const sym = CURRENCIES[currency] || currency;

    const setField = (field, raw) => {
        const next = [field, ...lastEdited.filter((f) => f !== field)].slice(0, 2);
        setLastEdited(next);
        if (field === 'cost') setCost(raw);
        if (field === 'price') setPrice(raw);
        if (field === 'margin') setMargin(raw);
        if (field === 'markup') setMarkup(raw);
    };

    const solved = useMemo(() => {
        const c = cost === '' ? null : parseFloat(cost);
        const p = price === '' ? null : parseFloat(price);
        const m = margin === '' ? null : parseFloat(margin);
        const mk = markup === '' ? null : parseFloat(markup);

        const has = (v) => v !== null && !Number.isNaN(v);
        const values = { cost: c, price: p, margin: m, markup: mk };

        // Determine the two "driver" fields: prefer the two most recently
        // edited fields that both currently hold a valid number.
        const candidates = [...lastEdited, 'cost', 'price', 'margin', 'markup'];
        const drivers = [];
        for (const f of candidates) {
            if (has(values[f]) && !drivers.includes(f)) drivers.push(f);
            if (drivers.length === 2) break;
        }

        if (drivers.length < 2) {
            return { cost: c, price: p, margin: m, markup: mk, error: 'Enter any two of cost, price, margin % or markup %.' };
        }

        const pair = drivers.slice().sort().join('+');
        let outCost = c, outPrice = p, outMargin = m, outMarkup = mk, error = null;

        try {
            switch (pair) {
                case 'cost+price': {
                    if (p === 0) { error = 'Selling price cannot be $0 — margin is undefined.'; break; }
                    outMargin = marginFromCostPrice(c, p);
                    outMarkup = c === 0 ? null : markupFromCostPrice(c, p);
                    if (c === 0) error = 'Cost is $0 — markup is undefined (division by zero), margin shown assumes 100% profit.';
                    break;
                }
                case 'cost+margin': {
                    if (m >= 100) { error = 'Margin must be below 100% — at 100% the implied price is infinite.'; break; }
                    outPrice = priceFromCostMargin(c, m);
                    outMarkup = outPrice != null && c !== 0 ? markupFromCostPrice(c, outPrice) : (c === 0 ? null : outMarkup);
                    if (c === 0) { outMarkup = null; }
                    break;
                }
                case 'cost+markup': {
                    if (mk <= -100) { error = 'Markup must be above -100%.'; break; }
                    outPrice = priceFromCostMarkup(c, mk);
                    outMargin = outPrice != null ? marginFromCostPrice(c, outPrice) : outMargin;
                    break;
                }
                case 'margin+price': {
                    if (m >= 100) { error = 'Margin must be below 100%.'; break; }
                    outCost = costFromPriceMargin(p, m);
                    outMarkup = outCost != null && outCost !== 0 ? markupFromCostPrice(outCost, p) : null;
                    break;
                }
                case 'markup+price': {
                    outCost = costFromPriceMarkup(p, mk);
                    outMargin = outCost != null ? marginFromCostPrice(outCost, p) : outMargin;
                    break;
                }
                case 'margin+markup': {
                    // Both percentages given, no cost/price anchor — cannot
                    // recover absolute dollars, only confirm consistency.
                    error = 'Margin % and markup % alone can\'t determine a dollar price — enter a cost or price too.';
                    break;
                }
                default:
                    error = 'Enter any two of cost, price, margin % or markup %.';
            }
        } catch (e) {
            error = 'Could not solve with those values.';
        }

        return { cost: outCost, price: outPrice, margin: outMargin, markup: outMarkup, error, drivers };
    }, [cost, price, margin, markup, lastEdited]);

    const fmtMoney = (v) => (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) ? '—' : `${sym}${round2(v).toFixed(2)}`;
    const fmtPct = (v) => (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) ? '—' : `${round2(v).toFixed(2)}%`;

    /* ── Target price mode ───────────────────────────────────────────── */
    const [tCost, setTCost] = useState('40');
    const [tMarginTarget, setTMarginTarget] = useState('50');
    const [tMarkupTarget, setTMarkupTarget] = useState('100');

    const targetByMargin = useMemo(() => {
        const c = parseFloat(tCost);
        const m = parseFloat(tMarginTarget);
        if (!Number.isFinite(c) || !Number.isFinite(m)) return { error: 'Enter a cost and target margin %.' };
        if (m >= 100) return { error: 'Margin must be below 100%.' };
        const p = priceFromCostMargin(c, m);
        return { price: p, profit: p !== null ? p - c : null };
    }, [tCost, tMarginTarget]);

    const targetByMarkup = useMemo(() => {
        const c = parseFloat(tCost);
        const mk = parseFloat(tMarkupTarget);
        if (!Number.isFinite(c) || !Number.isFinite(mk)) return { error: 'Enter a cost and target markup %.' };
        if (mk <= -100) return { error: 'Markup must be above -100%.' };
        const p = priceFromCostMarkup(c, mk);
        return { price: p, profit: p !== null ? p - c : null };
    }, [tCost, tMarkupTarget]);

    /* ── Bulk mode ────────────────────────────────────────────────────── */
    const [rows, setRows] = useState([
        { name: 'Product A', cost: '40', price: '100' },
        { name: 'Product B', cost: '12.50', price: '19.99' },
    ]);
    const [bulkPaste, setBulkPaste] = useState('');
    const pasteRef = useRef(null);

    const updateRow = (i, field, val) => {
        setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
    };

    const addRow = () => setRows((r) => [...r, { name: '', cost: '', price: '' }]);
    const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));

    const parseBulk = () => {
        const lines = bulkPaste.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const parsed = lines.map((line) => {
            const parts = line.split(',').map((p) => p.trim());
            return { name: parts[0] || '', cost: parts[1] || '', price: parts[2] || '' };
        }).filter((r) => r.name);
        if (parsed.length) {
            setRows((r) => [...r, ...parsed]);
            setBulkPaste('');
        }
    };

    const bulkResults = useMemo(() => {
        return rows.map((row) => {
            const c = parseFloat(row.cost);
            const p = parseFloat(row.price);
            const validCost = Number.isFinite(c);
            const validPrice = Number.isFinite(p) && p !== 0;
            const m = validCost && validPrice ? marginFromCostPrice(c, p) : null;
            const mk = validCost && c !== 0 && validPrice ? markupFromCostPrice(c, p) : null;
            const profit = validCost && Number.isFinite(p) ? p - c : null;
            let note = null;
            if (!validCost || !Number.isFinite(p)) note = 'Enter cost and price';
            else if (p === 0) note = 'Price is $0 — margin undefined';
            else if (c === 0) note = 'Cost is $0 — markup undefined';
            return { ...row, marginPct: m, markupPct: mk, profit, note };
        });
    }, [rows]);

    const exportCsv = () => {
        const header = ['Product', 'Cost', 'Price', 'Profit', 'Margin %', 'Markup %'];
        const lines = [header.join(',')];
        bulkResults.forEach((r) => {
            lines.push([
                `"${(r.name || '').replace(/"/g, '""')}"`,
                r.cost || '',
                r.price || '',
                r.profit !== null ? round2(r.profit) : '',
                r.marginPct !== null ? round2(r.marginPct) : '',
                r.markupPct !== null ? round2(r.markupPct) : '',
            ].join(','));
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'margin-markup-results.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-900/10 dark:border-white/10 text-ink text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-400/60 transition-colors';
    const labelCls = 'block text-xs font-bold uppercase tracking-widest text-ink-muted mb-2';

    const currencyOptions = Object.entries(CURRENCIES).map(([code, symbol]) => ({
        value: code, label: `${code} (${symbol})`,
    }));

    return (
        <ToolShell
            title="Free Profit Margin & Markup Calculator | VenQore"
            metaDescription="Solve cost, price, margin % and markup % instantly — enter any two and the rest are calculated live. Plus bulk CSV mode and CSV export. Free, no signup."
            eyebrow="Free Tool"
            h1="Profit Margin & Markup Calculator"
            answer="Enter any two of cost, selling price, margin % or markup % and the calculator solves the other two instantly, using the standard retail formulas: margin = (price − cost) ÷ price, markup = (price − cost) ÷ cost. Includes target-price modes, a bulk table for pricing a whole product list, and CSV export — all entirely in your browser, free, no signup."
            faqs={FAQS}
            toolGroups={toolGroups}
            currentSlug="margin-calculator"
            cta={{
                headline: 'Pricing a whole catalogue by hand doesn\'t scale.',
                subtext: 'VenQore tracks landed cost per unit automatically and reports margin on every sale — no spreadsheet required.',
            }}
            related={[{ label: 'Barcode Generator', href: '/tools/barcode-generator' }, { label: 'Invoice Generator', href: '/tools/invoice-generator' }]}
        >
            {/* ── Bidirectional solver ─────────────────────────────────── */}
            <div className="rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10 p-5 sm:p-7">
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                        <Calculator size={17} className="text-brand-500 dark:text-brand-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ink">Solve any two</h2>
                        <p className="text-sm text-ink-muted">Type into any two fields — cost, price, margin % or markup % — and the other two update live.</p>
                    </div>
                </div>

                <div className="mb-5 max-w-[220px]">
                    <label className={labelCls}>Currency</label>
                    <Select value={currency} onChange={setCurrency} options={currencyOptions} />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                        <label className={labelCls}>Cost</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                            <input type="number" step="0.01" value={cost} onChange={(e) => setField('cost', e.target.value)} className={`${inputCls} pl-8`} placeholder="0.00" />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Selling price</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                            <input type="number" step="0.01" value={price} onChange={(e) => setField('price', e.target.value)} className={`${inputCls} pl-8`} placeholder="0.00" />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Margin %</label>
                        <div className="relative">
                            <input type="number" step="0.01" value={margin} onChange={(e) => setField('margin', e.target.value)} className={`${inputCls} pr-8`} placeholder="—" />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">%</span>
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Markup %</label>
                        <div className="relative">
                            <input type="number" step="0.01" value={markup} onChange={(e) => setField('markup', e.target.value)} className={`${inputCls} pr-8`} placeholder="—" />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">%</span>
                        </div>
                    </div>
                </div>

                {solved.error && (
                    <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">{solved.error}</p>
                    </div>
                )}

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        ['Cost', fmtMoney(solved.cost)],
                        ['Price', fmtMoney(solved.price)],
                        ['Margin', fmtPct(solved.margin)],
                        ['Markup', fmtPct(solved.markup)],
                    ].map(([label, val]) => (
                        <div key={label} className="p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-center">
                            <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">{label}</p>
                            <p className="text-xl font-bold text-ink">{val}</p>
                        </div>
                    ))}
                </div>
                {Number.isFinite(parseFloat(solved.cost)) && Number.isFinite(parseFloat(solved.price)) && (
                    <p className="text-xs text-ink-muted mt-3 text-center">
                        Profit per unit: <strong className="text-ink-secondary">{fmtMoney(parseFloat(solved.price) - parseFloat(solved.cost))}</strong>
                    </p>
                )}
            </div>

            {/* ── Target price modes ───────────────────────────────────── */}
            <div className="mt-6 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10 p-5 sm:p-7">
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                        <TrendingUp size={17} className="text-brand-500 dark:text-brand-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ink">Price to hit a target</h2>
                        <p className="text-sm text-ink-muted">Give a cost and a goal, get the price that hits it exactly.</p>
                    </div>
                </div>

                <div className="mb-5 max-w-xs">
                    <label className={labelCls}>Cost</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                        <input type="number" step="0.01" value={tCost} onChange={(e) => setTCost(e.target.value)} className={`${inputCls} pl-8`} />
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10">
                        <label className={labelCls}>Target margin %</label>
                        <div className="relative mb-3">
                            <input type="number" step="0.01" value={tMarginTarget} onChange={(e) => setTMarginTarget(e.target.value)} className={`${inputCls} pr-8`} />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">%</span>
                        </div>
                        {targetByMargin.error ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400">{targetByMargin.error}</p>
                        ) : (
                            <>
                                <p className="text-sm text-ink-muted">Suggested price</p>
                                <p className="text-2xl font-bold text-ink">{fmtMoney(targetByMargin.price)}</p>
                                <p className="text-xs text-ink-muted mt-1">Profit per unit: {fmtMoney(targetByMargin.profit)}</p>
                            </>
                        )}
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10">
                        <label className={labelCls}>Target markup %</label>
                        <div className="relative mb-3">
                            <input type="number" step="0.01" value={tMarkupTarget} onChange={(e) => setTMarkupTarget(e.target.value)} className={`${inputCls} pr-8`} />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">%</span>
                        </div>
                        {targetByMarkup.error ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400">{targetByMarkup.error}</p>
                        ) : (
                            <>
                                <p className="text-sm text-ink-muted">Suggested price</p>
                                <p className="text-2xl font-bold text-ink">{fmtMoney(targetByMarkup.price)}</p>
                                <p className="text-xs text-ink-muted mt-1">Profit per unit: {fmtMoney(targetByMarkup.profit)}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Bulk mode ─────────────────────────────────────────────── */}
            <div className="mt-6 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10 p-5 sm:p-7">
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                        <TableIcon size={17} className="text-brand-500 dark:text-brand-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ink">Bulk mode</h2>
                        <p className="text-sm text-ink-muted">Price a whole product list at once, then export the results as CSV.</p>
                    </div>
                </div>

                <div className="mb-5">
                    <label className={labelCls}>Paste rows (name,cost,price — one per line)</label>
                    <div className="flex gap-2">
                        <textarea
                            ref={pasteRef}
                            value={bulkPaste}
                            onChange={(e) => setBulkPaste(e.target.value)}
                            rows={2}
                            placeholder={'Blue T-Shirt,8.00,19.99\nCoffee Mug,3.50,9.99'}
                            className={`${inputCls} font-mono flex-1`}
                        />
                        <button
                            type="button"
                            onClick={parseBulk}
                            className="px-4 py-2 rounded-xl bg-brand-500/15 border border-brand-400/40 text-brand-600 dark:text-brand-300 text-xs font-bold uppercase tracking-wide hover:bg-brand-500/25 transition-colors inline-flex items-center gap-1.5 shrink-0"
                        >
                            <ClipboardPaste size={14} /> Add rows
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-line dark:border-white/10">
                    <table className="w-full text-sm min-w-[720px]">
                        <thead>
                            <tr className="bg-sunken dark:bg-white/[0.04] text-left">
                                {['Product', 'Cost', 'Price', 'Profit', 'Margin %', 'Markup %', ''].map((h) => (
                                    <th key={h} className="px-3 py-2.5 font-bold text-ink-secondary text-xs uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bulkResults.map((r, i) => (
                                <tr key={i} className="border-t border-line dark:border-white/[0.06]">
                                    <td className="px-3 py-2">
                                        <input value={r.name} onChange={(e) => updateRow(i, 'name', e.target.value)} className={`${inputCls} py-1.5`} placeholder="Product name" />
                                    </td>
                                    <td className="px-3 py-2 w-28">
                                        <input type="number" step="0.01" value={r.cost} onChange={(e) => updateRow(i, 'cost', e.target.value)} className={`${inputCls} py-1.5`} />
                                    </td>
                                    <td className="px-3 py-2 w-28">
                                        <input type="number" step="0.01" value={r.price} onChange={(e) => updateRow(i, 'price', e.target.value)} className={`${inputCls} py-1.5`} />
                                    </td>
                                    <td className="px-3 py-2 text-ink-secondary whitespace-nowrap">{fmtMoney(r.profit)}</td>
                                    <td className="px-3 py-2 text-ink-secondary whitespace-nowrap">{r.note ? <span className="text-amber-600 dark:text-amber-400 text-xs">{r.note}</span> : fmtPct(r.marginPct)}</td>
                                    <td className="px-3 py-2 text-ink-secondary whitespace-nowrap">{r.note ? '—' : fmtPct(r.markupPct)}</td>
                                    <td className="px-3 py-2">
                                        <button onClick={() => removeRow(i)} className="text-ink-muted hover:text-red-500 transition-colors">
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                    <button
                        type="button"
                        onClick={addRow}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink-secondary text-xs font-bold uppercase tracking-wide hover:border-brand-400/40 transition-colors inline-flex items-center gap-1.5"
                    >
                        <Plus size={14} /> Add row
                    </button>
                    <button
                        type="button"
                        onClick={exportCsv}
                        className="px-4 py-2.5 rounded-xl bg-accent-fill text-accent-on text-xs font-bold uppercase tracking-wide transition-transform inline-flex items-center gap-1.5"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <p className="text-1xs text-ink-muted">Downloads directly from your browser — nothing is sent to a server.</p>
                </div>
            </div>

            {/* ── Education section ────────────────────────────────────── */}
            <section className="mt-12">
                <h2 className="text-2xl font-bold mb-4 text-ink">Margin vs. markup — what's the difference?</h2>
                <p className="text-sm text-ink-secondary leading-relaxed mb-4">
                    Both describe the same profit in dollars, but they divide it by a different number. <strong>Margin</strong> divides
                    profit by the <em>selling price</em>: it tells you what share of each sales dollar is profit. <strong>Markup</strong>{''}
                    divides profit by the <em>cost</em>: it tells you how much you added on top of what you paid. Because the selling
                    price is always higher than the cost (assuming you're profitable), markup is always the larger percentage of the two.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                        <p className="font-bold text-ink mb-1">Margin formula</p>
                        <p className="font-mono text-sm text-brand-600 dark:text-brand-300">margin % = (price − cost) ÷ price × 100</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                        <p className="font-bold text-ink mb-1">Markup formula</p>
                        <p className="font-mono text-sm text-brand-600 dark:text-brand-300">markup % = (price − cost) ÷ cost × 100</p>
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-brand-500/[0.06] dark:bg-brand-500/10 border border-brand-500/20 mb-6">
                    <p className="font-bold text-ink mb-2">Worked example</p>
                    <p className="text-sm text-ink-secondary leading-relaxed">
                        Say a product costs you <strong>$40</strong> and you sell it for <strong>$100</strong>. Your gross profit is{''}
                        <strong>$60</strong> either way. As a <strong>margin</strong>, that's $60 ÷ $100 = <strong>60%</strong> — 60% of every
                        sales dollar is profit. As a <strong>markup</strong>, that's $60 ÷ $40 = <strong>150%</strong> — you sold it for
                        150% more than you paid for it. Same sale, same $60 profit, two very different-looking percentages: 60% margin
                        equals 150% markup, not the same number.
                    </p>
                </div>
                <p className="text-sm text-ink-secondary leading-relaxed">
                    A common mix-up: pricing off a "50% markup" when you actually meant a 50% margin. A 50% markup on a $40 cost gives a
                    $60 price (50% margin instead would need a $80 price). Mixing the two up systematically under-prices inventory —
                    always double check which one you're quoting before you set shelf prices.
                </p>
            </section>
        </ToolShell>
    );
}

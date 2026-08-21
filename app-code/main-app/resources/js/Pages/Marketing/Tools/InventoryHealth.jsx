import React, { useState, useMemo } from 'react';
import { Boxes, Shield, Package, PiggyBank, RefreshCw } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';

/**
 * Inventory Health Toolkit — free, entirely client-side.
 *
 * Bundles five standard retail inventory formulas. Every calculation runs
 * in the browser as the user types — no submit button, no server round trip.
 *
 * Formulas (hand-verified in code comments below each section):
 *   1. Reorder Point   = (AverageDailySales × LeadTimeDays) + SafetyStock
 *   2. Safety Stock     = (MaxDailySales × MaxLeadTimeDays) − (AvgDailySales × AvgLeadTimeDays)   [simple method]
 *   3. EOQ              = sqrt((2 × AnnualDemand × OrderCost) / HoldingCostPerUnit)
 *   4. GMROI            = GrossMargin($) / AverageInventoryCostValue($)
 *   5. Inventory Turnover = COGS / AverageInventoryValue ; Days of Inventory = 365 / Turnover
 */

const CURRENCIES = {
    USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'AU$',
    PKR: 'Rs', INR: '₹', AED: 'AED', SAR: 'SAR', JPY: '¥',
};

function round2(n) {
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100) / 100;
}

const num = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
};

const FAQS = [
    { q: 'What is a good inventory turnover rate?', a: 'It varies heavily by category — grocery and perishables often turn 15-25+ times a year, general retail is commonly in the 4-8 range, and slow-moving categories like furniture or jewelry may turn only 2-4 times a year. There is no single universal target: compare your turnover against your own category history and similar retailers, not an arbitrary number. Very high turnover can also signal you are understocked and losing sales to stockouts, so faster is not automatically better.' },
    { q: 'How do I calculate safety stock?', a: 'The simple method is: Safety Stock = (Maximum Daily Sales × Maximum Lead Time Days) − (Average Daily Sales × Average Lead Time Days). It compares your worst-case demand-during-lead-time against your average case, and the gap is the buffer stock you should hold. More statistically rigorous methods exist that use the standard deviation of demand and lead time combined with a service-level Z-score, but the simple method is far easier to use with data most small retailers already have (max/average daily sales and lead times) and is a reasonable starting point.' },
    { q: 'What is GMROI and why does it matter?', a: 'GMROI (Gross Margin Return on Inventory Investment) measures how many dollars of gross margin you earn per dollar tied up in inventory: GMROI = Gross Margin ($) ÷ Average Inventory Cost Value ($). A GMROI above 1.0 generally means the inventory investment is being recovered with some profit on top; higher is generally better. What counts as "good" varies a lot by industry — a jeweler and a grocer will have very different healthy GMROI ranges — so use it to track your own trend over time and compare within your category, not against a universal benchmark.' },
    { q: 'How do I calculate reorder point?', a: 'Reorder Point = (Average Daily Sales × Supplier Lead Time in Days) + Safety Stock. It is the stock level at which you should place a new purchase order so the replenishment arrives before you run out. Example: 20 units/day average sales, a 7-day lead time, and 30 units of safety stock gives a reorder point of (20 × 7) + 30 = 170 units — reorder when on-hand stock reaches 170.' },
];

export default function InventoryHealth({ toolGroups = [] }) {
    const [currency, setCurrency] = useState('USD');
    const sym = CURRENCIES[currency] || currency;
    const currencyOptions = Object.entries(CURRENCIES).map(([code, symbol]) => ({ value: code, label: `${code} (${symbol})` }));

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-900/10 dark:border-white/10 text-ink text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-400/60 transition-colors';
    const labelCls = 'block text-xs font-bold uppercase tracking-widest text-ink-muted mb-2';
    const cardCls = 'rounded-2xl bg-neutral-900/[0.02] dark:bg-white/[0.03] border border-neutral-900/[0.06] dark:border-white/10 p-5 sm:p-7';
    const resultCardCls = 'p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-neutral-900/[0.06] dark:border-white/10 text-center';

    const fmtNum = (v, digits = 0) => (v === null || v === undefined || !Number.isFinite(v)) ? '—' : v.toLocaleString(undefined, { maximumFractionDigits: digits });
    const fmtMoney = (v) => (v === null || v === undefined || !Number.isFinite(v)) ? '—' : `${sym}${round2(v).toFixed(2)}`;

    /* ── 2. Safety Stock (computed first so Reorder Point can carry it over) ── */
    const [maxDailySales, setMaxDailySales] = useState('35');
    const [maxLeadTime, setMaxLeadTime] = useState('10');
    const [ssAvgDailySales, setSsAvgDailySales] = useState('20');
    const [ssAvgLeadTime, setSsAvgLeadTime] = useState('7');

    const safetyStock = useMemo(() => {
        const mds = num(maxDailySales), mlt = num(maxLeadTime), ads = num(ssAvgDailySales), alt = num(ssAvgLeadTime);
        if (mds === null || mlt === null || ads === null || alt === null) return { value: null, error: 'Enter all four values.' };
        const value = (mds * mlt) - (ads * alt);
        return { value, error: value < 0 ? 'Result is negative — your "max" inputs are lower than your average inputs; safety stock cannot be below zero, so treat it as 0.' : null };
    }, [maxDailySales, maxLeadTime, ssAvgDailySales, ssAvgLeadTime]);

    const safetyStockClamped = safetyStock.value !== null ? Math.max(0, safetyStock.value) : null;

    /* ── 1. Reorder Point ── */
    const [avgDailySales, setAvgDailySales] = useState('20');
    const [leadTimeDays, setLeadTimeDays] = useState('7');
    const [safetyStockInput, setSafetyStockInput] = useState('30');
    const [useComputedSafetyStock, setUseComputedSafetyStock] = useState(false);

    const effectiveSafetyStock = useComputedSafetyStock ? safetyStockClamped : num(safetyStockInput);

    const reorderPoint = useMemo(() => {
        const ads = num(avgDailySales), lt = num(leadTimeDays);
        if (ads === null || lt === null || effectiveSafetyStock === null) return { value: null };
        return { value: (ads * lt) + effectiveSafetyStock };
    }, [avgDailySales, leadTimeDays, effectiveSafetyStock]);

    /* ── 3. EOQ ── */
    const [annualDemand, setAnnualDemand] = useState('5000');
    const [orderCost, setOrderCost] = useState('50');
    const [holdingCost, setHoldingCost] = useState('2');

    const eoq = useMemo(() => {
        const d = num(annualDemand), s = num(orderCost), h = num(holdingCost);
        if (d === null || s === null || h === null || h <= 0 || d < 0 || s < 0) return { value: null, error: h !== null && h <= 0 ? 'Holding cost per unit must be greater than 0.' : 'Enter annual demand, order cost and holding cost.' };
        return { value: Math.sqrt((2 * d * s) / h), error: null };
    }, [annualDemand, orderCost, holdingCost]);

    /* ── 4. GMROI ── */
    const [gmroiMode, setGmroiMode] = useState('direct'); // 'direct' | 'salesCogs'
    const [grossMarginDirect, setGrossMarginDirect] = useState('45000');
    const [netSales, setNetSales] = useState('100000');
    const [cogsForGm, setCogsForGm] = useState('55000');
    const [avgInventoryCostGmroi, setAvgInventoryCostGmroi] = useState('18000');

    const gmroi = useMemo(() => {
        const inv = num(avgInventoryCostGmroi);
        if (inv === null || inv <= 0) return { value: null, grossMargin: null, error: 'Enter average inventory cost value greater than 0.' };
        let gm;
        if (gmroiMode === 'direct') {
            gm = num(grossMarginDirect);
        } else {
            const ns = num(netSales), c = num(cogsForGm);
            gm = (ns === null || c === null) ? null : ns - c;
        }
        if (gm === null) return { value: null, grossMargin: null, error: 'Enter gross margin (or net sales and COGS).' };
        return { value: gm / inv, grossMargin: gm, error: null };
    }, [gmroiMode, grossMarginDirect, netSales, cogsForGm, avgInventoryCostGmroi]);

    /* ── 5. Inventory Turnover ── */
    const [cogsTurnover, setCogsTurnover] = useState('120000');
    const [avgInventoryValueTurnover, setAvgInventoryValueTurnover] = useState('20000');

    const turnover = useMemo(() => {
        const c = num(cogsTurnover), inv = num(avgInventoryValueTurnover);
        if (c === null || inv === null || inv <= 0) return { turns: null, days: null, error: 'Enter COGS and an average inventory value greater than 0.' };
        const turns = c / inv;
        const days = turns > 0 ? 365 / turns : null;
        return { turns, days, error: null };
    }, [cogsTurnover, avgInventoryValueTurnover]);

    return (
        <ToolShell
            title="Free Inventory Health Toolkit | Reorder Point, Safety Stock, EOQ, GMROI, Turnover | VenQore"
            metaDescription="Five standard retail inventory formulas in one free calculator: reorder point, safety stock, economic order quantity (EOQ), GMROI and inventory turnover. Live results, no signup."
            eyebrow="Free Tool"
            h1="Inventory Health Toolkit"
            answer="Five standard inventory-management calculations in one place — reorder point, safety stock, economic order quantity (EOQ), GMROI, and inventory turnover — each with live results as you type. Enter your own numbers and each calculator shows the formula result plus a plain-English explanation of what it means. Free, entirely in your browser, no signup."
            faqs={FAQS}
            toolGroups={toolGroups}
            currentSlug="inventory-health"
            cta={{
                headline: 'Reorder points and safety stock shouldn\'t live in a spreadsheet.',
                subtext: 'VenQore tracks FIFO stock levels per warehouse and can alert you automatically when a product crosses its reorder point.',
            }}
            related={[{ label: 'Stock Count Sheet', href: '/tools/stock-count-sheet' }, { label: 'Margin Calculator', href: '/tools/margin-calculator' }]}
        >
            <div className="mb-6 max-w-[220px]">
                <label className={labelCls}>Currency</label>
                <Select value={currency} onChange={setCurrency} options={currencyOptions} />
            </div>

            {/* ── 2. Safety Stock (shown first since Reorder Point can use it) ── */}
            <div className={cardCls}>
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                        <Shield size={17} className="text-brand-500 dark:text-brand-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ink">Safety Stock</h2>
                        <p className="text-sm text-ink-muted">Simple method: buffer stock = worst-case demand-during-lead-time minus average demand-during-lead-time.</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                        <label className={labelCls}>Max daily sales (units)</label>
                        <input type="number" step="0.01" value={maxDailySales} onChange={(e) => setMaxDailySales(e.target.value)} className={inputCls} placeholder="35" />
                    </div>
                    <div>
                        <label className={labelCls}>Max lead time (days)</label>
                        <input type="number" step="0.01" value={maxLeadTime} onChange={(e) => setMaxLeadTime(e.target.value)} className={inputCls} placeholder="10" />
                    </div>
                    <div>
                        <label className={labelCls}>Average daily sales (units)</label>
                        <input type="number" step="0.01" value={ssAvgDailySales} onChange={(e) => setSsAvgDailySales(e.target.value)} className={inputCls} placeholder="20" />
                    </div>
                    <div>
                        <label className={labelCls}>Average lead time (days)</label>
                        <input type="number" step="0.01" value={ssAvgLeadTime} onChange={(e) => setSsAvgLeadTime(e.target.value)} className={inputCls} placeholder="7" />
                    </div>
                </div>

                {safetyStock.error && (
                    <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">{safetyStock.error}</p>
                )}

                <div className="mt-6">
                    <div className={resultCardCls}>
                        <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Safety Stock</p>
                        <p className="text-2xl font-bold text-ink">{fmtNum(safetyStockClamped)} units</p>
                    </div>
                    <p className="text-xs text-ink-muted mt-3 text-center">
                        This is the buffer stock to hold on top of expected demand so a slower delivery or a sales spike doesn't cause a stockout.
                    </p>
                </div>

                <p className="text-xs text-ink-muted mt-5 leading-relaxed">
                    Note: this simple method is easy to use with numbers most small retailers already track. A more statistically rigorous
                    approach uses the standard deviation of daily demand and lead time combined with a service-level Z-score (e.g. 1.65 for
                    95% service level) — that method exists and is worth knowing about, but it needs more historical data than most small
                    retailers have on hand, so this tool intentionally keeps to the simple method for usability.
                </p>
            </div>

            {/* ── 1. Reorder Point ── */}
            <div className={`${cardCls} mt-6`}>
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                        <Boxes size={17} className="text-brand-500 dark:text-brand-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ink">Reorder Point</h2>
                        <p className="text-sm text-ink-muted">The stock level that should trigger a new purchase order.</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                        <label className={labelCls}>Average daily sales (units)</label>
                        <input type="number" step="0.01" value={avgDailySales} onChange={(e) => setAvgDailySales(e.target.value)} className={inputCls} placeholder="20" />
                    </div>
                    <div>
                        <label className={labelCls}>Supplier lead time (days)</label>
                        <input type="number" step="0.01" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} className={inputCls} placeholder="7" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Safety stock (units)</label>
                        <input
                            type="number" step="0.01" value={safetyStockInput}
                            onChange={(e) => setSafetyStockInput(e.target.value)}
                            disabled={useComputedSafetyStock}
                            className={`${inputCls} ${useComputedSafetyStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="30"
                        />
                        <label className="mt-2 flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
                            <input type="checkbox" checked={useComputedSafetyStock} onChange={(e) => setUseComputedSafetyStock(e.target.checked)} className="rounded" />
                            Use the safety stock computed above ({fmtNum(safetyStockClamped)} units) instead
                        </label>
                    </div>
                </div>

                <div className="mt-6">
                    <div className={resultCardCls}>
                        <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Reorder Point</p>
                        <p className="text-2xl font-bold text-ink">{fmtNum(reorderPoint.value)} units</p>
                    </div>
                    <p className="text-xs text-ink-muted mt-3 text-center">
                        Reorder when stock hits this level to avoid running out before the next delivery arrives.
                    </p>
                </div>
            </div>

            {/* ── 3. EOQ ── */}
            <div className={`${cardCls} mt-6`}>
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                        <Package size={17} className="text-brand-500 dark:text-brand-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ink">Economic Order Quantity (EOQ)</h2>
                        <p className="text-sm text-ink-muted">The order size that minimizes total ordering + holding cost.</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-5">
                    <div>
                        <label className={labelCls}>Annual demand (units/year)</label>
                        <input type="number" step="1" value={annualDemand} onChange={(e) => setAnnualDemand(e.target.value)} className={inputCls} placeholder="5000" />
                    </div>
                    <div>
                        <label className={labelCls}>Cost per order</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                            <input type="number" step="0.01" value={orderCost} onChange={(e) => setOrderCost(e.target.value)} className={`${inputCls} pl-8`} placeholder="50" />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Annual holding cost / unit</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                            <input type="number" step="0.01" value={holdingCost} onChange={(e) => setHoldingCost(e.target.value)} className={`${inputCls} pl-8`} placeholder="2" />
                        </div>
                    </div>
                </div>

                {eoq.error && <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">{eoq.error}</p>}

                <div className="mt-6">
                    <div className={resultCardCls}>
                        <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Optimal Order Quantity</p>
                        <p className="text-2xl font-bold text-ink">{fmtNum(eoq.value)} units</p>
                    </div>
                    <p className="text-xs text-ink-muted mt-3 text-center">
                        This is the order size that minimizes the combined total of ordering costs (placing more orders costs more in fixed
                        fees) and holding costs (carrying more inventory costs more in storage, capital and shrinkage risk).
                    </p>
                </div>
            </div>

            {/* ── 4. GMROI ── */}
            <div className={`${cardCls} mt-6`}>
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                        <PiggyBank size={17} className="text-brand-500 dark:text-brand-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ink">GMROI</h2>
                        <p className="text-sm text-ink-muted">Gross Margin Return on Inventory Investment — dollars of margin per dollar tied up in stock.</p>
                    </div>
                </div>

                <div className="mb-5 flex gap-2">
                    <button type="button" onClick={() => setGmroiMode('direct')} className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${gmroiMode === 'direct' ? 'bg-brand-500/15 border border-brand-400/40 text-brand-600 dark:text-brand-300' : 'bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink-muted'}`}>Enter gross margin $</button>
                    <button type="button" onClick={() => setGmroiMode('salesCogs')} className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${gmroiMode === 'salesCogs' ? 'bg-brand-500/15 border border-brand-400/40 text-brand-600 dark:text-brand-300' : 'bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink-muted'}`}>Compute from sales − COGS</button>
                </div>

                {gmroiMode === 'direct' ? (
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Gross margin ($)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                                <input type="number" step="0.01" value={grossMarginDirect} onChange={(e) => setGrossMarginDirect(e.target.value)} className={`${inputCls} pl-8`} placeholder="45000" />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Average inventory cost value ($)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                                <input type="number" step="0.01" value={avgInventoryCostGmroi} onChange={(e) => setAvgInventoryCostGmroi(e.target.value)} className={`${inputCls} pl-8`} placeholder="18000" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-3 gap-5">
                        <div>
                            <label className={labelCls}>Net sales ($)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                                <input type="number" step="0.01" value={netSales} onChange={(e) => setNetSales(e.target.value)} className={`${inputCls} pl-8`} placeholder="100000" />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>COGS ($)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                                <input type="number" step="0.01" value={cogsForGm} onChange={(e) => setCogsForGm(e.target.value)} className={`${inputCls} pl-8`} placeholder="55000" />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Average inventory cost value ($)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                                <input type="number" step="0.01" value={avgInventoryCostGmroi} onChange={(e) => setAvgInventoryCostGmroi(e.target.value)} className={`${inputCls} pl-8`} placeholder="18000" />
                            </div>
                        </div>
                    </div>
                )}

                {gmroi.error && <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">{gmroi.error}</p>}

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className={resultCardCls}>
                        <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Gross Margin</p>
                        <p className="text-xl font-bold text-ink">{fmtMoney(gmroi.grossMargin)}</p>
                    </div>
                    <div className={resultCardCls}>
                        <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">GMROI</p>
                        <p className="text-xl font-bold text-ink">{gmroi.value !== null && Number.isFinite(gmroi.value) ? round2(gmroi.value).toFixed(2) : '—'}</p>
                    </div>
                </div>
                <p className="text-xs text-ink-muted mt-3 text-center">
                    A GMROI above 1.0 generally means the inventory investment is being recovered with some profit on top, and higher is
                    generally better — but "good" varies a lot by industry, so track your own trend rather than chasing a universal number.
                </p>
            </div>

            {/* ── 5. Inventory Turnover ── */}
            <div className={`${cardCls} mt-6`}>
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                        <RefreshCw size={17} className="text-brand-500 dark:text-brand-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ink">Inventory Turnover</h2>
                        <p className="text-sm text-ink-muted">How many times inventory is sold and replaced over a period, and the equivalent days of stock on hand.</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                        <label className={labelCls}>Cost of goods sold (period)</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                            <input type="number" step="0.01" value={cogsTurnover} onChange={(e) => setCogsTurnover(e.target.value)} className={`${inputCls} pl-8`} placeholder="120000" />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Average inventory value (period)</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">{sym}</span>
                            <input type="number" step="0.01" value={avgInventoryValueTurnover} onChange={(e) => setAvgInventoryValueTurnover(e.target.value)} className={`${inputCls} pl-8`} placeholder="20000" />
                        </div>
                    </div>
                </div>

                {turnover.error && <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">{turnover.error}</p>}

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className={resultCardCls}>
                        <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Turnover Ratio</p>
                        <p className="text-xl font-bold text-ink">{turnover.turns !== null ? `${round2(turnover.turns).toFixed(2)}×` : '—'}</p>
                    </div>
                    <div className={resultCardCls}>
                        <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Days of Inventory</p>
                        <p className="text-xl font-bold text-ink">{turnover.days !== null ? fmtNum(round2(turnover.days), 1) : '—'} days</p>
                    </div>
                </div>
                <p className="text-xs text-ink-muted mt-3 text-center">
                    These are two views of the same number: turnover says how many times stock cycles per year, days of inventory says how
                    many days of sales you're carrying on the shelf right now — a lower days figure means cash is tied up for less time.
                </p>
            </div>

            {/* ── Education section ────────────────────────────────────── */}
            <section className="mt-12">
                <h2 className="text-2xl font-bold mb-4 text-ink">How these five numbers fit together</h2>
                <p className="text-sm text-ink-secondary leading-relaxed mb-4">
                    These metrics are not independent — each one feeds into or explains another. <strong>Supplier lead time</strong> is the
                    starting point: it tells you how long you'll be waiting for a new order to arrive, and it drives both{''}
                    <strong>safety stock</strong> (the buffer against demand or delivery variability during that wait) and{''}
                    <strong>reorder point</strong> (the stock level that should trigger the next order, combining expected sales during the
                    lead time with that safety buffer). <strong>EOQ</strong> answers a different question — not *when* to reorder, but{''}
                    <em>how much</em> to order each time to minimize the combined cost of placing orders and holding stock.{''}
                    <strong>GMROI</strong> and <strong>inventory turnover</strong> both look backward at how efficiently capital tied up in
                    inventory is being used — turnover in units of "times sold through," GMROI in dollars of margin earned per dollar
                    invested. A retailer with a healthy reorder-point and EOQ setup should, over time, see that reflected in stronger
                    turnover and GMROI, because stock is neither sitting too long (tying up cash, risking spoilage or obsolescence) nor
                    running out (losing sales and reputation).
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                        <p className="font-bold text-ink mb-1">Reorder Point</p>
                        <p className="font-mono text-xs text-brand-600 dark:text-brand-300">ROP = (Avg Daily Sales × Lead Time Days) + Safety Stock</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                        <p className="font-bold text-ink mb-1">Safety Stock (simple method)</p>
                        <p className="font-mono text-xs text-brand-600 dark:text-brand-300">SS = (Max Daily Sales × Max Lead Time) − (Avg Daily Sales × Avg Lead Time)</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                        <p className="font-bold text-ink mb-1">Economic Order Quantity</p>
                        <p className="font-mono text-xs text-brand-600 dark:text-brand-300">EOQ = √((2 × Annual Demand × Order Cost) ÷ Holding Cost per Unit)</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                        <p className="font-bold text-ink mb-1">GMROI</p>
                        <p className="font-mono text-xs text-brand-600 dark:text-brand-300">GMROI = Gross Margin ($) ÷ Average Inventory Cost Value ($)</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10 sm:col-span-2">
                        <p className="font-bold text-ink mb-1">Inventory Turnover &amp; Days of Inventory</p>
                        <p className="font-mono text-xs text-brand-600 dark:text-brand-300">Turnover = COGS ÷ Average Inventory Value &nbsp;·&nbsp; Days of Inventory = 365 ÷ Turnover</p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-brand-500/[0.06] dark:bg-brand-500/10 border border-brand-500/20 mb-6">
                    <p className="font-bold text-ink mb-2">Worked example — reorder point and safety stock together</p>
                    <p className="text-sm text-ink-secondary leading-relaxed">
                        Suppose a product sells an average of <strong>20 units/day</strong>, but on its busiest days sells{''}
                        <strong>35 units/day</strong>. The supplier usually takes <strong>7 days</strong> to deliver, but can occasionally
                        take up to <strong>10 days</strong>. Safety stock = (35 × 10) − (20 × 7) = 350 − 140 = <strong>210 units</strong>.
                        Reorder point = (20 × 7) + 210 = 140 + 210 = <strong>350 units</strong> — reorder when on-hand stock reaches 350 to
                        stay covered even if a delivery is slow and demand spikes at the same time.
                    </p>
                </div>

                <p className="text-sm text-ink-secondary leading-relaxed">
                    Why this matters for a small retailer: without a reorder point, restocking decisions become guesswork — either too
                    reactive (stockouts, lost sales, unhappy customers) or too cautious (excess cash tied up in slow-moving stock, higher
                    shrinkage and obsolescence risk). EOQ then refines *how much* to order once you've decided *when* to order, balancing
                    the fixed cost of placing an order against the ongoing cost of holding inventory. Finally, GMROI and turnover are the
                    scorecards — they tell you, after the fact, whether your reorder and order-quantity decisions actually turned into
                    efficient use of the cash tied up on your shelves.
                </p>
            </section>
        </ToolShell>
    );
}

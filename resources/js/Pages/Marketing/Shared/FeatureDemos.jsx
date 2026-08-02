import React, { useState, useEffect, useRef } from 'react';
import { vq } from '@/theme/runtime';
import {
    AlertTriangle, BarChart3, Boxes, Brain, Check, CheckCircle2, ChevronRight,
    Factory, Loader2, Lock, Mic, Minus, Package, Percent, Plus, Receipt,
    RefreshCw, Search, ShieldCheck, Sparkles, Target, Trash2, TrendingUp,
    Truck, Upload, Users, Wallet,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════════════
   SHARED FEATURE DEMOS

   Six simulated mini-apps of the real product. Extracted from Features.jsx so
   the /features hub AND each dedicated /features/{slug} deep-dive can render
   the same live demo — previously a visitor who landed on a deep-dive page
   from search never saw the product actually working, which is exactly the
   page where proof matters most.

   Nothing here persists data; it is a guided simulation of the real UI.
   The demo chrome is deliberately dark in both themes: it represents an app
   window, and a dark app window reads as "screenshot of the product" on a
   light marketing page.

   Also exported: DemoFrame, PillTabs, Num and the two small hooks, so future
   demos can be built on the same furniture.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── local hooks ─────────────────────────────────────────────────────────── */
export function usePRM() {
    const [r, setR] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const on = () => setR(mq.matches); on();
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);
    return r;
}
export function useInView(threshold = 0.25) {
    const ref = useRef(null);
    const [v, setV] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const o = new IntersectionObserver(([e]) => setV(e.isIntersecting), { threshold });
        o.observe(el); return () => o.disconnect();
    }, [threshold]);
    return [ref, v];
}
const group = (n, d = 0) => {
    const v = d > 0 ? Number(n).toFixed(d) : String(Math.round(n));
    const [i, dec] = v.split('.');
    const gi = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return dec ? `${gi}.${dec}` : gi;
};
/* animated, grouped number */
export const Num = ({ end, prefix = '', suffix = '', d = 0, dur = 1600 }) => {
    const reduced = usePRM();
    const [val, setVal] = useState(0);
    const [ref, v] = useInView(0.4);
    const ran = useRef(false);
    useEffect(() => {
        if (!v || ran.current) return; ran.current = true;
        if (reduced) { setVal(end); return; }
        const s = performance.now();
        const tick = (now) => {
            const p = Math.min((now - s) / dur, 1);
            setVal((1 - Math.pow(1 - p, 4)) * end);
            if (p < 1) requestAnimationFrame(tick); else setVal(end);
        };
        requestAnimationFrame(tick);
    }, [v, reduced, end, dur]);
    return <span ref={ref}>{prefix}{group(val, d)}{suffix}</span>;
};

/* ── App-window frame that wraps each simulated product screen ────────────── */
const ACCENTS = {
    indigo: 'text-indigo-300', emerald: 'text-emerald-300', violet: 'text-violet-300',
    blue: 'text-blue-300', amber: 'text-amber-300', cyan: 'text-cyan-300',
};
export function DemoFrame({ title, url, badge = 'LIVE DEMO', accent = 'indigo', children }) {
    return (
        <div className="relative rounded-[1.5rem] border border-white/[0.08] bg-slate-950/85 backdrop-blur-2xl shadow-[0_40px_140px_-50px_rgba(99,102,241,0.55)] overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400/70" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                    <Lock size={10} className="text-slate-500" />
                    <span className="text-2xs font-mono text-slate-500 dark:text-slate-400">{url}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 vqf-blink" />
                    <span className={`text-3xs font-black uppercase tracking-[0.2em] ${ACCENTS[accent] || ACCENTS.indigo}`}>{badge}</span>
                </div>
            </div>
            <div className="p-4 sm:p-6">{children}</div>
        </div>
    );
}

/* small reusable pill tabs */
export const PillTabs = ({ tabs, value, onChange, size = 'sm' }) => (
    <div className="inline-flex bg-white/[0.04] p-0.5 rounded-lg">
        {tabs.map(t => (
            <button key={t} onClick={() => onChange(t)}
                className={`${size === 'sm' ? 'px-2.5 py-0.5 text-2xs' : 'px-3 py-1 text-1xs'} font-bold rounded-md transition-all ${value === t ? 'bg-white/10 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}>
                {t}
            </button>
        ))}
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 1 · PROFIT & LOSS REPORT  (the hero report)
   ═══════════════════════════════════════════════════════════════════════════ */
const PL_SETS = {
    'This Month': { rev: 1245670, cogs: 473355, exp: 287400 },
    'Last Month': { rev: 1086400, cogs: 423700, exp: 271500 },
    'This Year':  { rev: 13980500, cogs: 5312000, exp: 3140000 },
};
const Donut = ({ segments, size = 132 }) => {
    const reduced = usePRM();
    const [ref, v] = useInView(0.4);
    const r = (size - 16) / 2, C = 2 * Math.PI * r, total = segments.reduce((s, x) => s + x.value, 0) || 1;
    let acc = 0;
    return (
        <div ref={ref} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                {segments.map((s, i) => {
                    const frac = s.value / total, len = frac * C, off = acc; acc += len;
                    return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth="12"
                        strokeDasharray={`${(reduced || v) ? len : 0} ${C}`} strokeDashoffset={-off}
                        style={{ transition: reduced ? 'none' : `stroke-dasharray 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 0.18}s` }} />;
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xs font-black uppercase tracking-widest text-slate-500">Net Margin</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{((segments[2].value / total) * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
};
export const ProfitLossDemo = () => {
    const [range, setRange] = useState('This Month');
    const [phase, setPhase] = useState('idle'); // idle | analyzing | done
    const s = PL_SETS[range];
    const gross = s.rev - s.cogs, net = gross - s.exp;
    const gm = ((gross / s.rev) * 100).toFixed(1), nm = ((net / s.rev) * 100).toFixed(1);
    const analyze = () => { setPhase('analyzing'); setTimeout(() => setPhase('done'), 1700); };
    useEffect(() => { setPhase('idle'); }, [range]);
    const kpis = [
        { l: 'Revenue', v: s.rev, c: 'text-white', ic: TrendingUp, tone: 'text-indigo-300 bg-indigo-500/15' },
        { l: 'COGS (FIFO)', v: s.cogs, c: 'text-amber-300', ic: Package, tone: 'text-amber-300 bg-amber-500/15' },
        { l: 'Expenses', v: s.exp, c: 'text-rose-300', ic: Receipt, tone: 'text-rose-300 bg-rose-500/15' },
        { l: 'Net Profit', v: net, c: 'text-emerald-300', ic: Wallet, tone: 'text-emerald-300 bg-emerald-500/15' },
    ];
    return (
        <DemoFrame title="Profit & Loss" url="app.venqore.com/reports/profit-loss" accent="emerald">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-emerald-500" />
                    <div>
                        <div className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Profit &amp; Loss Statement</div>
                        <div className="text-2xs text-slate-500">Verified from the double-entry ledger</div>
                    </div>
                </div>
                <PillTabs tabs={['This Month', 'Last Month', 'This Year']} value={range} onChange={setRange} size="md" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
                {kpis.map((k) => (
                    <div key={k.l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg ${k.tone}`}><k.ic size={13} /></div>
                            <span className="text-3xs font-black uppercase tracking-wide text-slate-500">{k.l}</span>
                        </div>
                        <div className={`text-base sm:text-lg font-black tabular-nums ${k.c}`}>$<Num end={k.v} /></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 flex items-center gap-4">
                    <Donut segments={[
                        { name: 'COGS', value: s.cogs, color: vq.amber[500] },
                        { name: 'Expenses', value: s.exp, color: vq.red[500] },
                        { name: 'Net', value: Math.max(0, net), color: vq.emerald[500] },
                    ]} />
                    <div className="space-y-2 text-1xs">
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /><span className="text-slate-500 dark:text-slate-400">COGS</span><span className="ml-auto text-slate-600 dark:text-slate-300 font-bold">{((s.cogs / s.rev) * 100).toFixed(0)}%</span></div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /><span className="text-slate-500 dark:text-slate-400">Expenses</span><span className="ml-auto text-slate-600 dark:text-slate-300 font-bold">{((s.exp / s.rev) * 100).toFixed(0)}%</span></div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-slate-500 dark:text-slate-400">Net Profit</span><span className="ml-auto text-emerald-300 font-bold">{nm}%</span></div>
                        <div className="pt-1 mt-1 border-t border-slate-900/[0.06] dark:border-white/5 flex items-center gap-2"><span className="text-slate-500">Gross margin</span><span className="ml-auto text-slate-900 dark:text-white font-bold">{gm}%</span></div>
                    </div>
                </div>

                <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2"><Sparkles size={14} className="text-violet-300" /><span className="text-[13px] font-bold text-slate-900 dark:text-white">AI Analysis</span></div>
                        {phase !== 'done' && (
                            <button onClick={analyze} disabled={phase === 'analyzing'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-200 text-1xs font-bold hover:bg-violet-500/25 transition-colors disabled:opacity-60">
                                {phase === 'analyzing' ? <><Loader2 size={12} className="animate-spin" /> Analyzing…</> : <><Brain size={12} /> Analyze with AI</>}
                            </button>
                        )}
                    </div>
                    {phase === 'idle' && <p className="text-slate-500 text-[12px] leading-relaxed">Click <span className="text-violet-300 font-semibold">Analyze with AI</span> — VenQore reads this statement and returns plain-English insights and a health score.</p>}
                    {phase === 'analyzing' && (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-3 w-3/4 bg-slate-900/[0.03] dark:bg-white/5 rounded" /><div className="h-3 w-2/3 bg-slate-900/[0.03] dark:bg-white/5 rounded" /><div className="h-3 w-1/2 bg-slate-900/[0.03] dark:bg-white/5 rounded" />
                        </div>
                    )}
                    {phase === 'done' && (
                        <div className="vqf-in space-y-2.5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{Math.round(parseFloat(nm) + 50)}<span className="text-sm text-slate-500">/100</span></div>
                                <span className="text-1xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full">Financially Healthy</span>
                            </div>
                            {[
                                { ic: CheckCircle2, c: 'text-emerald-400', t: 'Strong gross margin', d: `At ${gm}%, your product pricing leaves healthy room for overheads.` },
                                { ic: AlertTriangle, c: 'text-amber-400', t: 'Watch overheads', d: `Expenses are ${((s.exp / s.rev) * 100).toFixed(0)}% of revenue — trim toward the 30% benchmark.` },
                                { ic: TrendingUp, c: 'text-indigo-400', t: 'Reinvest to grow', d: 'You are profitable — consider routing 20% of net profit into marketing.' },
                            ].map((x, i) => (
                                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-slate-900/[0.06] dark:border-white/5">
                                    <x.ic size={15} className={`${x.c} mt-0.5 shrink-0`} />
                                    <div><div className="text-[12px] font-bold text-slate-200">{x.t}</div><div className="text-1xs text-slate-500 leading-snug">{x.d}</div></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DemoFrame>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 2 · POS — simulated invoice builder
   ═══════════════════════════════════════════════════════════════════════════ */
const POS_PRODUCTS = [
    { id: 1, e: '🥤', n: 'Cola 500ml', p: 80 }, { id: 2, e: '🍫', n: 'Dark Choco', p: 120 },
    { id: 3, e: '🧴', n: 'Hand Wash', p: 210 }, { id: 4, e: '🍞', n: 'Bread Loaf', p: 95 },
    { id: 5, e: '🥛', n: 'Milk 1L', p: 160 }, { id: 6, e: '🧃', n: 'Mango Juice', p: 140 },
    { id: 7, e: '☕', n: 'Coffee Jar', p: 540 }, { id: 8, e: '🍪', n: 'Cookies', p: 110 },
];
export const PosInvoiceDemo = () => {
    const [cart, setCart] = useState([{ ...POS_PRODUCTS[0], q: 2 }, { ...POS_PRODUCTS[3], q: 1 }]);
    const [pay, setPay] = useState('Cash');
    const [done, setDone] = useState(false);
    const add = (p) => setCart(c => { const f = c.find(x => x.id === p.id); return f ? c.map(x => x.id === p.id ? { ...x, q: x.q + 1 } : x) : [...c, { ...p, q: 1 }]; });
    const dec = (id) => setCart(c => c.flatMap(x => x.id === id ? (x.q > 1 ? [{ ...x, q: x.q - 1 }] : []) : [x]));
    const del = (id) => setCart(c => c.filter(x => x.id !== id));
    const sub = cart.reduce((s, x) => s + x.p * x.q, 0);
    const tax = Math.round(sub * 0.05), total = sub + tax;
    return (
        <DemoFrame title="POS" url="app.venqore.com/pos" accent="indigo">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* product grid */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <div className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-1xs text-slate-500">Scan barcode or search…</div>
                        </div>
                        <span className="text-3xs font-black uppercase tracking-widest text-slate-600 ml-3 hidden sm:block">F1 Search · F4 Pay</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {POS_PRODUCTS.map(p => (
                            <button key={p.id} onClick={() => add(p)}
                                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:border-indigo-400/40 hover:bg-indigo-500/10 transition-all active:scale-95">
                                <div className="text-xl mb-1.5 group-hover:scale-110 transition-transform">{p.e}</div>
                                <div className="text-1xs font-bold text-slate-200 truncate">{p.n}</div>
                                <div className="text-1xs font-black text-indigo-300">Rs {p.p}</div>
                            </button>
                        ))}
                    </div>
                </div>
                {/* cart */}
                <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-void-800 p-3 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-1xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Cart</span>
                        <span className="text-2xs text-slate-500">{cart.reduce((s, x) => s + x.q, 0)} items</span>
                    </div>
                    {done ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 vqf-in">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3"><Check size={28} className="text-emerald-600 dark:text-emerald-400" /></div>
                            <div className="text-slate-900 dark:text-white font-black">Sale completed</div>
                            <div className="text-1xs text-slate-500 mb-1">Journal posted · stock deducted (FIFO)</div>
                            <div className="text-1xs text-emerald-600 dark:text-emerald-400 font-mono">Rs {group(total)} · {pay}</div>
                            <button onClick={() => { setDone(false); setCart([{ ...POS_PRODUCTS[0], q: 2 }]); }} className="mt-4 text-1xs font-bold text-indigo-300 hover:underline">New sale</button>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 space-y-1.5 min-h-[120px] max-h-[180px] overflow-y-auto pr-1">
                                {cart.length === 0 && <div className="text-center text-1xs text-slate-600 py-10">Tap a product to add</div>}
                                {cart.map(x => (
                                    <div key={x.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/5">
                                        <span className="text-base">{x.e}</span>
                                        <div className="min-w-0 flex-1"><div className="text-1xs font-bold text-slate-200 truncate">{x.n}</div><div className="text-2xs text-slate-500">Rs {x.p}</div></div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => dec(x.id)} className="w-5 h-5 rounded bg-slate-900/[0.03] dark:bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300"><Minus size={11} /></button>
                                            <span className="w-5 text-center text-1xs font-bold text-slate-900 dark:text-white tabular-nums">{x.q}</span>
                                            <button onClick={() => add(x)} className="w-5 h-5 rounded bg-slate-900/[0.03] dark:bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300"><Plus size={11} /></button>
                                            <button onClick={() => del(x.id)} className="w-5 h-5 rounded bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 ml-0.5"><Trash2 size={11} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-900/[0.06] dark:border-white/5 space-y-1 text-1xs">
                                <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Subtotal</span><span className="tabular-nums">Rs {group(sub)}</span></div>
                                <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>VAT 5%</span><span className="tabular-nums">Rs {group(tax)}</span></div>
                                <div className="flex justify-between text-slate-900 dark:text-white font-black text-sm pt-0.5"><span>Total</span><span className="tabular-nums">Rs {group(total)}</span></div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                                {['Cash', 'Card', 'Split'].map(m => (
                                    <button key={m} onClick={() => setPay(m)} className={`py-1.5 rounded-lg text-2xs font-black uppercase tracking-wide border transition-all ${pay === m ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200' : 'bg-white/[0.03] border-slate-900/[0.08] dark:border-white/10 text-slate-500'}`}>{m}</button>
                                ))}
                            </div>
                            <button onClick={() => cart.length && setDone(true)} className="mt-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#05130c] font-black text-[12px] uppercase tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled={!cart.length}>
                                <CheckCircle2 size={15} /> Complete Sale
                            </button>
                        </>
                    )}
                </div>
            </div>
        </DemoFrame>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 3 · SMART CAPTURE — image / audio → AI draft (Bring-Your-Own-Key)
   ═══════════════════════════════════════════════════════════════════════════ */
const SC_IMAGE = {
    action: 'Purchase', supplier: 'Khan Distributors', date: 'Today',
    items: [
        { n: 'Cola 500ml (×24 case)', sku: 'BEV-COLA-500', qty: 5, price: 1680 },
        { n: 'Dark Choco Bar', sku: 'SNK-CHOCO-01', qty: 40, price: 78 },
        { n: 'Mango Juice 1L', sku: 'BEV-MNGO-1L', qty: 12, price: 132 },
    ],
};
const SC_AUDIO = {
    action: 'Sale', party: 'Bilal General Store (Credit)',
    transcript: '“Sold three Cola, two Hand Wash and one Coffee jar to Bilal on credit.”',
    items: [
        { n: 'Cola 500ml', sku: 'BEV-COLA-500', qty: 3, price: 80 },
        { n: 'Hand Wash', sku: 'CARE-HW-01', qty: 2, price: 210 },
        { n: 'Coffee Jar', sku: 'BEV-COFF-JR', qty: 1, price: 540 },
    ],
};
const Waveform = ({ active }) => (
    <div className="flex items-end gap-1 h-10">
        {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className={`w-1 rounded-full ${active ? 'bg-violet-400 vqf-wave' : 'bg-white/15'}`}
                style={{ height: active ? undefined : '20%', animationDelay: `${(i % 7) * 0.09}s` }} />
        ))}
    </div>
);
export const SmartCaptureDemo = () => {
    const reduced = usePRM();
    const [tab, setTab] = useState('Image');
    const [phase, setPhase] = useState('idle'); // idle | working | extracted | confirmed
    const [t, setT] = useState(0);
    const data = tab === 'Image' ? SC_IMAGE : SC_AUDIO;
    useEffect(() => { setPhase('idle'); setT(0); }, [tab]);
    useEffect(() => {
        if (phase !== 'working') return;
        if (tab === 'Audio') { const iv = setInterval(() => setT(x => x + 1), 900); return () => clearInterval(iv); }
    }, [phase, tab]);
    const run = () => { setPhase('working'); setTimeout(() => setPhase('extracted'), reduced ? 0 : 1900); };
    const total = data.items.reduce((s, x) => s + x.qty * x.price, 0);
    return (
        <DemoFrame title="Smart Capture" url="app.venqore.com/capture" badge="AI · BYOK" accent="violet">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-violet-500" />
                    <div>
                        <div className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Smart Capture</div>
                        <div className="text-2xs text-slate-500">Snap a bill or speak — AI turns it into a transaction</div>
                    </div>
                </div>
                <PillTabs tabs={['Image', 'Audio']} value={tab} onChange={setTab} size="md" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* capture stage */}
                <div className="lg:col-span-2">
                    <div className="relative rounded-xl border border-dashed border-white/15 bg-white/[0.02] h-[208px] flex flex-col items-center justify-center overflow-hidden">
                        {tab === 'Image' ? (
                            <>
                                <div className="w-28 rounded-md bg-white/90 p-2 shadow-xl rotate-[-3deg]">
                                    <div className="h-1.5 w-10 bg-slate-800 rounded mb-1.5" />
                                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-1 bg-slate-300 rounded mb-1" style={{ width: `${90 - i * 9}%` }} />)}
                                    <div className="h-1.5 w-12 bg-emerald-500 rounded mt-1.5 ml-auto" />
                                </div>
                                {phase === 'working' && !reduced && <div className="absolute left-0 right-0 h-0.5 bg-violet-400 shadow-[0_0_14px_2px_rgba(167,139,250,0.9)] vqf-scan" />}
                                <div className="mt-3 text-2xs text-slate-500">Sample supplier invoice</div>
                            </>
                        ) : (
                            <>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${phase === 'working' ? 'bg-violet-500/20 vqf-pulse' : 'bg-white/[0.04]'}`}>
                                    <Mic size={26} className={phase === 'working' ? 'text-violet-300' : 'text-slate-400'} />
                                </div>
                                <Waveform active={phase === 'working'} />
                                <div className="mt-2 text-1xs font-mono text-slate-500">{phase === 'working' ? `00:0${t}` : '00:00'}</div>
                            </>
                        )}
                    </div>
                    {phase === 'idle' && (
                        <button onClick={run} className="mt-3 w-full py-2.5 rounded-xl bg-violet-500/15 border border-violet-400/30 text-violet-200 font-bold text-[12px] hover:bg-violet-500/25 transition-colors flex items-center justify-center gap-2">
                            {tab === 'Image' ? <><Upload size={14} /> Scan sample invoice</> : <><Mic size={14} /> Record sample voice note</>}
                        </button>
                    )}
                    {phase === 'working' && (
                        <div className="mt-3 w-full py-2.5 rounded-xl bg-white/[0.03] border border-slate-900/[0.08] dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold text-[12px] flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> {tab === 'Image' ? 'Reading invoice…' : 'Transcribing…'}
                        </div>
                    )}
                </div>

                {/* extraction result */}
                <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 min-h-[208px]">
                    {phase === 'idle' || phase === 'working' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <Sparkles size={22} className="text-violet-300 mb-2" />
                            <div className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">AI extraction</div>
                            <p className="text-1xs text-slate-500 max-w-xs">Your own AI key reads the {tab === 'Image' ? 'photo' : 'audio'}, detects whether it’s a sale, purchase or expense, and matches every line to a product in your catalog.</p>
                        </div>
                    ) : (
                        <div className="vqf-in">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xs font-black uppercase tracking-widest text-slate-500">Detected</span>
                                    <span className={`px-2 py-0.5 rounded-full text-2xs font-black ${data.action === 'Sale' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{data.action}</span>
                                    <span className="text-1xs text-slate-500 dark:text-slate-400">→ {data.supplier || data.party}</span>
                                </div>
                                {phase === 'confirmed' && <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-300"><Check size={12} /> Draft created</span>}
                            </div>
                            {data.transcript && <div className="mb-2 text-1xs italic text-violet-200/80">{data.transcript}</div>}
                            <div className="space-y-1.5 mb-3">
                                {data.items.map((it, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-slate-900/[0.06] dark:border-white/5 vqf-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <div className="min-w-0 flex-1"><div className="text-[12px] font-bold text-slate-200 truncate">{it.n}</div><div className="text-3xs font-mono text-slate-500">matched · {it.sku}</div></div>
                                        <div className="text-1xs text-slate-500 dark:text-slate-400 tabular-nums">{it.qty} × {it.price}</div>
                                        <div className="text-1xs font-bold text-slate-900 dark:text-white tabular-nums w-16 text-right">Rs {group(it.qty * it.price)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-900/[0.06] dark:border-white/5">
                                <span className="text-[12px] font-black text-slate-900 dark:text-white">Total <span className="text-slate-500 font-normal">({data.items.length} lines)</span></span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[13px] font-black text-slate-900 dark:text-white tabular-nums">Rs {group(total)}</span>
                                    {phase === 'extracted' && <button onClick={() => setPhase('confirmed')} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-[#05130c] text-1xs font-black hover:bg-emerald-400 transition-colors flex items-center gap-1.5"><Check size={12} /> Confirm &amp; Record</button>}
                                    {phase === 'confirmed' && <button onClick={() => setPhase('idle')} className="text-1xs font-bold text-indigo-300 hover:underline">Try again</button>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DemoFrame>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 4 · VENSYNQ — multi-channel command center
   ═══════════════════════════════════════════════════════════════════════════ */
const VQ_CHANNELS = [
    { k: 'Amazon', c: '#FF9900', rev: 482300, units: 1240, comm: 15, net: 96400, stock: 'In sync', tone: 'ok', fulfil: 'FBA' },
    { k: 'eBay', c: '#0968f6', rev: 213900, units: 540, comm: 11, net: 41200, stock: 'In sync', tone: 'ok', fulfil: 'FBM' },
    { k: 'TikTok Shop', c: '#69C9D0', rev: 168400, units: 690, comm: 8, net: 52800, stock: 'Low (4 SKU)', tone: 'warn', fulfil: 'JIT' },
    { k: 'Etsy', c: '#f1641e', rev: 74200, units: 210, comm: 6.5, net: 18900, stock: 'In sync', tone: 'ok', fulfil: 'FBM' },
    { k: 'WooCommerce', c: '#7f54b3', rev: 156000, units: 430, comm: 0, net: 61500, stock: 'Oversold (1)', tone: 'bad', fulfil: 'FBM' },
];
const STOCK_TONE = { ok: 'text-emerald-300 bg-emerald-500/10', warn: 'text-amber-300 bg-amber-500/10', bad: 'text-rose-300 bg-rose-500/10' };
export const VenSynQDemo = () => {
    const [syncing, setSyncing] = useState(false);
    const totalRev = VQ_CHANNELS.reduce((s, c) => s + c.rev, 0);
    const totalNet = VQ_CHANNELS.reduce((s, c) => s + c.net, 0);
    const best = VQ_CHANNELS.reduce((a, b) => (b.net / b.rev > a.net / a.rev ? b : a));
    const maxNet = Math.max(...VQ_CHANNELS.map(c => c.net));
    return (
        <DemoFrame title="VenSynQ" url="app.venqore.com/vensynq" badge="MULTI-CHANNEL" accent="blue">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-blue-500" />
                    <div>
                        <div className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">VenSynQ — Channel Command Center</div>
                        <div className="text-2xs text-slate-500">One inventory, every marketplace, true net margin</div>
                    </div>
                </div>
                <button onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 1400); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-200 text-1xs font-bold hover:bg-blue-500/25 transition-colors">
                    <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Sync now'}
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="text-3xs font-black uppercase tracking-wide text-slate-500 mb-1">Gross Revenue</div><div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">Rs <Num end={totalRev} /></div></div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="text-3xs font-black uppercase tracking-wide text-slate-500 mb-1">Net Profit</div><div className="text-lg font-black text-emerald-300 tabular-nums">Rs <Num end={totalNet} /></div></div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="text-3xs font-black uppercase tracking-wide text-slate-500 mb-1">Channels</div><div className="text-lg font-black text-slate-900 dark:text-white">{VQ_CHANNELS.length} <span className="text-2xs text-slate-500 font-bold">connected</span></div></div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3"><div className="text-3xs font-black uppercase tracking-wide text-emerald-300/80 mb-1">Most profitable</div><div className="text-lg font-black text-emerald-300">{best.k}</div></div>
            </div>

            <div className="space-y-2">
                {VQ_CHANNELS.map((c) => (
                    <div key={c.k} className="grid grid-cols-12 items-center gap-2 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
                        <div className="col-span-4 sm:col-span-3 flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-1xs font-black shrink-0" style={{ background: c.c + '22', color: c.c }}>{c.k[0]}</span>
                            <div className="min-w-0"><div className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{c.k}</div><div className="text-3xs text-slate-500">{c.units} units · {c.fulfil}</div></div>
                        </div>
                        <div className="hidden sm:block col-span-3">
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(c.net / maxNet) * 100}%`, background: c.c }} /></div>
                            <div className="text-3xs text-slate-500 mt-1">net margin {((c.net / c.rev) * 100).toFixed(0)}%</div>
                        </div>
                        <div className="col-span-4 sm:col-span-2 text-right"><div className="text-3xs text-slate-500">Revenue</div><div className="text-[12px] font-bold text-slate-900 dark:text-white tabular-nums">Rs {group(c.rev)}</div></div>
                        <div className="col-span-4 sm:col-span-2 text-right"><div className="text-3xs text-slate-500">Net · {c.comm}% fee</div><div className="text-[12px] font-bold text-emerald-300 tabular-nums">Rs {group(c.net)}</div></div>
                        <div className="col-span-12 sm:col-span-2 flex sm:justify-end"><span className={`px-2 py-1 rounded-full text-3xs font-black ${STOCK_TONE[c.tone]}`}>{c.stock}</span></div>
                    </div>
                ))}
            </div>
        </DemoFrame>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 5 · AI GROWTH ENGINE — proactive business signals
   ═══════════════════════════════════════════════════════════════════════════ */
/* Four brains. Each signal carries the EVIDENCE behind it, because the whole
   pitch is that this engine shows its working rather than asking for faith. */
const BRAINS = [
    {
        key: 'Customers', ic: Users, tone: 'indigo',
        blurb: 'Reads each customer’s own buying rhythm — not an average of everyone else’s.',
        signals: [
            {
                tag: 'Running late', title: 'Ali Traders', conf: 84, worth: 46800, urgency: 'high',
                text: 'Orders every 12 days, give or take 2. It has now been 21 — that is 4.4 standard deviations past their own pattern, not just past an average.',
                why: [
                    ['Their normal gap', '12 days (± 2)'],
                    ['Days since last order', '21'],
                    ['How unusual', '4.4 standard deviations'],
                    ['Average order', 'Rs 46,800'],
                    ['Lifetime profit', 'Rs 312,400'],
                ],
                act: 'Message on WhatsApp', actIc: Sparkles,
            },
            {
                tag: 'Spending down 41%', title: 'Khan Kirana Store', conf: 71, worth: 128000, urgency: 'high',
                text: 'Still buying — which is why nothing else has flagged them — but spend has fallen 41%. A quiet decline like this usually means orders are being split with someone else.',
                why: [
                    ['Spend last 90 days', 'Rs 184,000'],
                    ['Spend previous 90 days', 'Rs 312,000'],
                    ['Change', '−41%'],
                    ['Orders last 90 days', '7'],
                    ['Products they buy', '4 (was 11)'],
                ],
                act: 'Open customer', actIc: ChevronRight,
            },
            {
                tag: 'Growing fast', title: 'Noor Distributors', conf: 78, worth: 96500, urgency: 'low',
                text: 'Increased spend 64% over 90 days across 9 orders. This is the moment to secure them — better terms, priority stock, a direct line to you.',
                why: [
                    ['Spend last 90 days', 'Rs 96,500'],
                    ['Growth', '+64%'],
                    ['Profit contributed', 'Rs 21,300'],
                    ['Different products bought', '14'],
                ],
                act: 'Open customer', actIc: ChevronRight,
            },
        ],
    },
    {
        key: 'Stock', ic: Boxes, tone: 'amber',
        blurb: 'Models demand as a rate from every sale, then times alerts to your real supplier lead time.',
        signals: [
            {
                tag: 'Running out in 5 days', title: 'Alpha 12 · SKU-492', conf: 88, worth: 74200, urgency: 'high',
                text: 'You have 16 pcs left and it is selling 3.2 pcs/day. Your suppliers typically take 9 days, so this needs ordering today to avoid an empty shelf.',
                why: [
                    ['Stock on hand', '16 pcs'],
                    ['Sales rate', '3.2 pcs/day'],
                    ['Days of cover', '5'],
                    ['Your typical lead time', '9 days'],
                    ['Suggested order', '96 pcs'],
                    ['Trend', '+18% vs last month'],
                ],
                act: 'Draft purchase order', actIc: Truck,
            },
            {
                tag: 'Dead stock', title: 'Winter Throw · SKU-118', conf: 91, worth: 213000, urgency: 'high',
                text: 'Rs 213,000 is sitting in this line and it has not sold in 147 days, with the oldest units bought 302 days ago. That is cash you already spent, locked in a shelf.',
                why: [
                    ['Money tied up', 'Rs 213,000'],
                    ['Units held', '284 pcs'],
                    ['Last sold', '147 days ago'],
                    ['Oldest stock', '302 days old'],
                    ['Sales last 90 days', '0 pcs'],
                ],
                act: 'Open product', actIc: ChevronRight,
            },
            {
                tag: 'Demand jumped 71%', title: 'Cold Brew 250ml', conf: 74, worth: 38900, urgency: 'medium',
                text: 'Now selling 11.4 units/day versus 6.7 over the past month. At the new rate your stock lasts only 12 days — order deeper than usual next time.',
                why: [
                    ['Last 7 days', '11.4 units/day'],
                    ['Last 30 days', '6.7 units/day'],
                    ['Change', '+71%'],
                    ['Days of cover', '12'],
                    ['Buyers (90 days)', '186'],
                ],
                act: 'Draft purchase order', actIc: Truck,
            },
        ],
    },
    {
        key: 'Profit', ic: Percent, tone: 'emerald',
        blurb: 'Uses real FIFO cost per line, so it sees the margin problems a revenue report cannot.',
        signals: [
            {
                tag: 'Selling at a loss', title: 'Basmati 5kg', conf: 92, worth: 18400, urgency: 'high',
                text: 'Brought in Rs 246,000 over 30 days but cost Rs 264,400 to buy — a loss of Rs 18,400. The more you sell, the more you lose.',
                why: [
                    ['Revenue (30 days)', 'Rs 246,000'],
                    ['FIFO cost (30 days)', 'Rs 264,400'],
                    ['Loss', 'Rs 18,400'],
                    ['Current sell price', 'Rs 1,640'],
                    ['Last purchase cost', 'Rs 1,762'],
                    ['Units sold (30 days)', '150'],
                ],
                act: 'Open product', actIc: ChevronRight,
            },
            {
                tag: 'Margin down 6.2 pts', title: 'Cooking Oil 5L', conf: 82, worth: 214000, urgency: 'high',
                text: 'Earned 11.3% margin this month against 17.5% last month, on Rs 288,000 of sales. Revenue looks fine, which is exactly why this is easy to miss.',
                why: [
                    ['Margin this month', '11.3%'],
                    ['Margin last month', '17.5%'],
                    ['Change', '−6.2 points'],
                    ['Revenue (30 days)', 'Rs 288,000'],
                    ['Profit lost vs last month', 'Rs 17,856'],
                ],
                act: 'Open product', actIc: ChevronRight,
            },
            {
                tag: 'Discounts eating profit', title: 'Store-wide', conf: 80, worth: 386000, urgency: 'medium',
                text: 'You gave away Rs 91,800 in discounts over 30 days — 7.4% of gross sales, up from 4.9%. Discounts come straight off profit, not off revenue.',
                why: [
                    ['Discounts (30 days)', 'Rs 91,800'],
                    ['As % of gross sales', '7.4%'],
                    ['Previously', '4.9%'],
                    ['Annualised', 'Rs 1,101,600'],
                ],
                act: 'Open report', actIc: BarChart3,
            },
        ],
    },
    {
        key: 'Cash & Ops', ic: Wallet, tone: 'cyan',
        blurb: 'Watches money actually arriving, and compares this week against your own weekday history.',
        signals: [
            {
                tag: 'Overdue payment', title: 'Sadiq Enterprises', conf: 89, worth: 342000, urgency: 'high',
                text: 'Owes Rs 342,000 across 4 unpaid invoices. The oldest (SAL-2291) is 74 days old — 59 days past your normal 15-day terms, in the 31–60 day bucket.',
                why: [
                    ['Total outstanding', 'Rs 342,000'],
                    ['Unpaid invoices', '4'],
                    ['Oldest invoice', 'SAL-2291 (74 days)'],
                    ['Your payment terms', '15 days'],
                    ['Ageing bucket', '31–60 day'],
                ],
                act: 'Send reminder', actIc: Sparkles,
            },
            {
                tag: 'Collections slowing', title: 'Store-wide', conf: 77, worth: 264000, urgency: 'high',
                text: 'You collected 61% of sales as cash this month, versus 83% over the previous two. Sales are not the problem; collection is.',
                why: [
                    ['Collected (30 days)', 'Rs 734,000'],
                    ['Sales (30 days)', 'Rs 1,203,000'],
                    ['Conversion now', '61%'],
                    ['Conversion before', '83%'],
                    ['Cash not collected', 'Rs 264,000'],
                ],
                act: 'Open report', actIc: BarChart3,
            },
            {
                tag: 'Sales below your normal', title: 'This week', conf: 73, worth: 187000, urgency: 'medium',
                text: 'The last 7 days brought Rs 612,000 against the Rs 799,000 these same weekdays normally produce for you. Measured against your own history, so it is not seasonal.',
                why: [
                    ['Last 7 days', 'Rs 612,000'],
                    ['Typical', 'Rs 799,000'],
                    ['Difference', '−23.4%'],
                    ['Your normal week-to-week swing', '±9%'],
                    ['Tue 22 Jul', 'Rs 71,400 (typical Rs 118,900)'],
                ],
                act: 'Open report', actIc: BarChart3,
            },
        ],
    },
];
const GTONE = {
    indigo:  { c: 'text-indigo-300',  b: 'bg-indigo-500/15',  bar: 'bg-indigo-400',  br: 'border-indigo-400/40' },
    amber:   { c: 'text-amber-300',   b: 'bg-amber-500/15',   bar: 'bg-amber-400',   br: 'border-amber-400/40' },
    emerald: { c: 'text-emerald-300', b: 'bg-emerald-500/15', bar: 'bg-emerald-400', br: 'border-emerald-400/40' },
    cyan:    { c: 'text-cyan-300',    b: 'bg-cyan-500/15',    bar: 'bg-cyan-400',    br: 'border-cyan-400/40' },
};
const URG = {
    high:   'bg-rose-500/15 text-rose-300',
    medium: 'bg-amber-500/15 text-amber-300',
    low:    'bg-emerald-500/15 text-emerald-300',
};

/* The self-learning loop, shown as a real report card rather than a claim. */
const TRACK_RECORD = [
    { l: 'Stock run-out warnings', graded: 34, hit: 29 },
    { l: 'Late-customer warnings', graded: 41, hit: 27 },
    { l: 'Overdue payment flags',  graded: 22, hit: 19 },
    { l: 'Margin erosion',         graded: 12, hit: 10 },
];

export const GrowthEngineDemo = () => {
    const reduced = usePRM();
    const [ref, v] = useInView(0.3);
    const [brainIdx, setBrainIdx] = useState(0);
    const [sigIdx, setSigIdx] = useState(0);
    const [showProof, setShowProof] = useState(false);

    const brain = BRAINS[brainIdx];
    const sig = brain.signals[sigIdx];
    const t = GTONE[brain.tone];

    const pickBrain = (i) => { setBrainIdx(i); setSigIdx(0); };

    const totalGraded = TRACK_RECORD.reduce((s, r) => s + r.graded, 0);
    const totalHit = TRACK_RECORD.reduce((s, r) => s + r.hit, 0);
    const overall = Math.round((totalHit / totalGraded) * 100);

    return (
        <DemoFrame title="Intelligence Engine" url="app.venqore.com/growth-engine" badge="LIVE DEMO" accent="violet">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-violet-500" />
                    <div>
                        <div className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Intelligence Engine</div>
                        <div className="text-2xs text-slate-500">Four brains reading your ledger — every insight tracked and scored afterwards</div>
                    </div>
                </div>
                <button onClick={() => setShowProof(p => !p)}
                    className={`px-3 py-1.5 rounded-lg border text-2xs font-bold flex items-center gap-1.5 transition-all ${showProof ? 'bg-violet-500/15 text-violet-300 border-violet-400/40' : 'bg-white/[0.04] text-slate-500 dark:text-slate-400 border-slate-900/[0.08] dark:border-white/10 hover:text-slate-200'}`}>
                    <ShieldCheck size={12} /> {overall}% accurate
                </button>
            </div>

            {/* brain selector */}
            <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                {BRAINS.map((b, i) => {
                    const bt = GTONE[b.tone], on = i === brainIdx;
                    return (
                        <button key={b.key} onClick={() => pickBrain(i)}
                            className={`text-left p-2.5 rounded-xl border transition-all ${on ? `${bt.b} ${bt.br}` : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <b.ic size={13} className={on ? bt.c : 'text-slate-500'} />
                                <span className={`text-2xs font-black uppercase tracking-wide ${on ? bt.c : 'text-slate-400'}`}>{b.key}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 leading-snug line-clamp-2">{b.signals.length} live insights</div>
                        </button>
                    );
                })}
            </div>

            {showProof ? (
                /* ── THE LEARNING LOOP ─────────────────────────────────── */
                <div className="vqf-in rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Target size={14} className="text-violet-300" />
                        <span className="text-[13px] font-bold text-slate-900 dark:text-white">It scores itself</span>
                    </div>
                    <p className="text-1xs text-slate-500 leading-relaxed mb-4">
                        Every prediction is checked afterwards against what actually happened. Types that prove accurate
                        get more sensitive; types that keep missing get quieter, and eventually mute themselves.
                        Observations like “this stock hasn’t sold in 90 days” are facts, not forecasts — they’re excluded
                        rather than used to pad the score.
                    </p>
                    <div className="space-y-2.5 mb-4">
                        {TRACK_RECORD.map((r, i) => {
                            const pct = Math.round((r.hit / r.graded) * 100);
                            const tone = pct >= 70 ? 'bg-emerald-400' : pct >= 45 ? 'bg-amber-400' : 'bg-rose-400';
                            return (
                                <div key={i}>
                                    <div className="flex items-center justify-between text-1xs mb-1">
                                        <span className="text-slate-500 dark:text-slate-400">{r.l}</span>
                                        <span className="text-slate-500">
                                            <span className="text-slate-900 dark:text-white font-bold">{pct}%</span> · {r.hit}/{r.graded} checked
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                        <div className={`h-full rounded-full ${tone}`}
                                            style={{ width: (reduced || v) ? `${pct}%` : 0, transition: `width 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[['Insights given', 412], ['Checked', totalGraded], ['Recovered', 'Rs 1.4M']].map(([l, val], i) => (
                            <div key={i} className="rounded-lg bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/5 p-2.5 text-center">
                                <div className="text-3xs font-black uppercase tracking-widest text-slate-600">{l}</div>
                                <div className="text-[15px] font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">{val}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ── SIGNAL LIST + EVIDENCE ────────────────────────────── */
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2 space-y-2">
                        <p className="text-1xs text-slate-500 leading-snug mb-2.5">{brain.blurb}</p>
                        {brain.signals.map((s, i) => (
                            <button key={i} onClick={() => setSigIdx(i)}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${i === sigIdx ? `${t.b} ${t.br}` : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className={`text-3xs font-black uppercase tracking-widest ${i === sigIdx ? t.c : 'text-slate-500'}`}>{s.tag}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-3xs font-black uppercase ${URG[s.urgency]}`}>{s.urgency}</span>
                                </div>
                                <div className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">{s.title}</div>
                                <div className="flex items-center gap-2 text-3xs text-slate-500">
                                    <span className="text-emerald-300 font-bold tabular-nums">Rs {group(s.worth)}</span>
                                    <span>·</span>
                                    <span>{s.conf}% confidence</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg ${t.b} ${t.c}`}><brain.ic size={14} /></div>
                            <span className="text-[13px] font-bold text-slate-900 dark:text-white">{sig.title}</span>
                        </div>
                        <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{sig.text}</p>

                        <div className="text-3xs font-black uppercase tracking-widest text-slate-600 mb-1.5">Why we’re telling you this</div>
                        <div className="rounded-lg border border-white/[0.06] divide-y divide-white/[0.05] mb-3">
                            {sig.why.map(([k, val], i) => (
                                <div key={i} className="flex items-center justify-between gap-3 px-3 py-1.5">
                                    <span className="text-1xs text-slate-500">{k}</span>
                                    <span className="text-1xs font-bold text-slate-200 text-right tabular-nums">{val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-3xs text-slate-500 mb-1">
                            <span>Confidence</span><span className="font-bold">{sig.conf}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                            <div className={`h-full rounded-full ${t.bar}`}
                                style={{ width: (reduced || v) ? `${sig.conf}%` : 0, transition: 'width 1.1s cubic-bezier(0.22,1,0.36,1)' }} />
                        </div>

                        <button className={`mt-auto w-full py-2 rounded-lg ${t.b} ${t.c} text-2xs font-bold flex items-center justify-center gap-1.5 hover:brightness-125 transition-all`}>
                            <sig.actIc size={12} /> {sig.act}
                        </button>
                    </div>
                </div>
            )}
        </DemoFrame>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 6 · COOKBOOK — recipe-based manufacturing / auto-assembly
   ═══════════════════════════════════════════════════════════════════════════ */
const RECIPE = {
    out: 'Garam Masala 100g', outStock: 0,
    raw: [
        { n: 'Coriander', per: 40, unit: 'g', stock: 4000 },
        { n: 'Cumin', per: 30, unit: 'g', stock: 3000 },
        { n: 'Red Chili', per: 20, unit: 'g', stock: 2200 },
        { n: 'Salt', per: 10, unit: 'g', stock: 5000 },
    ],
};
export const CookbookDemo = () => {
    const reduced = usePRM();
    const [mode, setMode] = useState('Make now');
    const [qty, setQty] = useState(20);
    const [ran, setRan] = useState(false);
    const cost = { Coriander: 0.9, Cumin: 1.4, 'Red Chili': 1.1, Salt: 0.2 };
    const batchCost = RECIPE.raw.reduce((s, r) => s + r.per * qty * (cost[r.n] || 1), 0);
    const run = () => { setRan(true); setTimeout(() => setRan(false), 2600); };
    return (
        <DemoFrame title="Cookbook" url="app.venqore.com/cookbook" badge="MANUFACTURING" accent="amber">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-amber-500" />
                    <div>
                        <div className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Cookbook — Auto-Assembly</div>
                        <div className="text-2xs text-slate-500">Build composite items from a recipe — raw stock deducts automatically</div>
                    </div>
                </div>
                <PillTabs tabs={['Make now', 'Auto on sale']} value={mode} onChange={setMode} size="md" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* recipe */}
                <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-1xs font-black uppercase tracking-widest text-slate-500">Bill of Materials</span>
                        <span className="text-2xs text-slate-500">per 1 unit</span>
                    </div>
                    <div className="space-y-2">
                        {RECIPE.raw.map((r, i) => {
                            const used = r.per * qty;
                            return (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-slate-900/[0.06] dark:border-white/5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center"><Boxes size={14} className="text-amber-300" /></div>
                                    <div className="min-w-0 flex-1"><div className="text-[12px] font-bold text-slate-200">{r.n}</div><div className="text-3xs text-slate-500">{r.per}{r.unit} / unit · stock {group(ran ? r.stock - used : r.stock)}{r.unit}</div></div>
                                    <div className={`text-1xs font-bold tabular-nums ${ran ? 'text-rose-300 vqf-in' : 'text-slate-400'}`}>−{group(used)}{r.unit}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* produce */}
                <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-void-800 p-4 flex flex-col">
                    <div className="text-1xs font-black uppercase tracking-widest text-slate-500 mb-2">Output</div>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-lg">🧂</div>
                        <div><div className="text-[13px] font-bold text-slate-900 dark:text-white">{RECIPE.out}</div><div className="text-2xs text-slate-500">finished good · stock {ran ? qty : RECIPE.outStock}</div></div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-1xs text-slate-500 dark:text-slate-400">Quantity</span>
                        <div className="flex items-center gap-1 ml-auto">
                            <button onClick={() => setQty(q => Math.max(5, q - 5))} className="w-6 h-6 rounded bg-slate-900/[0.03] dark:bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300"><Minus size={12} /></button>
                            <span className="w-8 text-center text-[13px] font-black text-slate-900 dark:text-white tabular-nums">{qty}</span>
                            <button onClick={() => setQty(q => q + 5)} className="w-6 h-6 rounded bg-slate-900/[0.03] dark:bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300"><Plus size={12} /></button>
                        </div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/5 p-2.5 mb-3 text-1xs">
                        <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Batch cost (FIFO)</span><span className="text-slate-900 dark:text-white font-bold tabular-nums">Rs {group(batchCost)}</span></div>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400 mt-1"><span>Cost / unit</span><span className="text-amber-300 font-bold tabular-nums">Rs {group(batchCost / qty, 1)}</span></div>
                    </div>
                    {ran ? (
                        <div className="mt-auto vqf-in rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center">
                            <Check size={18} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                            <div className="text-[12px] font-bold text-slate-900 dark:text-white">{mode === 'Make now' ? `${qty} units produced` : 'Auto-assembled on sale'}</div>
                            <div className="text-2xs text-slate-500">Raw stock deducted · journal posted</div>
                        </div>
                    ) : (
                        <button onClick={run} className="mt-auto w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1a1200] font-black text-[12px] uppercase tracking-wide transition-colors flex items-center justify-center gap-2">
                            <Factory size={15} /> {mode === 'Make now' ? 'Produce batch' : 'Simulate a sale'}
                        </button>
                    )}
                </div>
            </div>
        </DemoFrame>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   FULL FEATURE CATALOG — every capability, click any to read what it does
   (sourced from the VenQore Product Catalog — 226+ features)

/* ── shared keyframes for every demo ───────────────────────────────────
   Features.jsx already ships these in its own <style> block. Deep-dive pages
   render a demo without that block, so DemoStyles must travel with them.
   Rendering it twice is harmless — identical rules, same cascade. */
export const DemoStyles = () => (
    <style>{`
        .tabular-nums { font-variant-numeric: tabular-nums; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        @keyframes vqf-blink { 0%,100%{opacity:1;} 50%{opacity:.25;} }
        .vqf-blink { animation: vqf-blink 1.6s ease-in-out infinite; }
        @keyframes vqf-in { 0%{opacity:0;transform:translateY(8px);} 100%{opacity:1;transform:none;} }
        .vqf-in { animation: vqf-in .45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes vqf-scan { 0%{top:6%;} 50%{top:86%;} 100%{top:6%;} }
        .vqf-scan { animation: vqf-scan 1.5s ease-in-out infinite; }
        @keyframes vqf-wave { 0%,100%{transform:scaleY(.3);} 50%{transform:scaleY(1);} }
        .vqf-wave { transform-origin:bottom; animation: vqf-wave .9s ease-in-out infinite; }
        @keyframes vqf-pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.08);opacity:.85;} }
        .vqf-pulse { animation: vqf-pulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .vqf-blink,.vqf-scan,.vqf-wave,.vqf-pulse{animation:none!important;} }
    `}</style>
);

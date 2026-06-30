import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel
} from './Shared/MarketingLayout';
import {
    AlertTriangle, ArrowRight, BarChart3, Bot, Boxes, Brain, Calculator, Check,
    CheckCircle2, ChevronRight, Cpu, Factory, Gauge, Globe, Layers, Loader2, Lock,
    Mic, Minus, Package, Plus, Receipt, RefreshCw, Repeat, ScanBarcode, Search,
    ShoppingCart, Sparkles, Trash2, TrendingUp, Truck, Upload, Wallet, Warehouse, X
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   VENQORE FEATURES — "See the whole machine."
   Live, simulated mini-apps of the real product (Reports, POS, Smart Capture,
   VenSynQ, Growth Engine, Cookbook) + a searchable catalog of every feature.
   Nothing here saves data — it's a guided simulation of the actual UI.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── local hooks ─────────────────────────────────────────────────────────── */
function usePRM() {
    const [r, setR] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const on = () => setR(mq.matches); on();
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);
    return r;
}
function useInView(threshold = 0.25) {
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
const Num = ({ end, prefix = '', suffix = '', d = 0, dur = 1600 }) => {
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
function DemoFrame({ title, url, badge = 'LIVE DEMO', accent = 'indigo', children }) {
    return (
        <div className="relative rounded-[1.5rem] border border-white/[0.08] bg-[#0a0820]/85 backdrop-blur-2xl shadow-[0_40px_140px_-50px_rgba(99,102,241,0.55)] overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400/70" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                    <Lock size={10} className="text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">{url}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 vqf-blink" />
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${ACCENTS[accent] || ACCENTS.indigo}`}>{badge}</span>
                </div>
            </div>
            <div className="p-4 sm:p-6">{children}</div>
        </div>
    );
}

/* small reusable pill tabs */
const PillTabs = ({ tabs, value, onChange, size = 'sm' }) => (
    <div className="inline-flex bg-white/[0.04] p-0.5 rounded-lg">
        {tabs.map(t => (
            <button key={t} onClick={() => onChange(t)}
                className={`${size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]'} font-bold rounded-md transition-all ${value === t ? 'bg-white/10 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}>
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
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Net Margin</span>
                <span className="text-xl font-black text-emerald-400">{((segments[2].value / total) * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
};
const ProfitLossDemo = () => {
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
                        <div className="text-[15px] font-black text-white tracking-tight">Profit &amp; Loss Statement</div>
                        <div className="text-[10px] text-slate-500">Verified from the double-entry ledger</div>
                    </div>
                </div>
                <PillTabs tabs={['This Month', 'Last Month', 'This Year']} value={range} onChange={setRange} size="md" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
                {kpis.map((k) => (
                    <div key={k.l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg ${k.tone}`}><k.ic size={13} /></div>
                            <span className="text-[9px] font-black uppercase tracking-wide text-slate-500">{k.l}</span>
                        </div>
                        <div className={`text-base sm:text-lg font-black tabular-nums ${k.c}`}>$<Num end={k.v} /></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 flex items-center gap-4">
                    <Donut segments={[
                        { name: 'COGS', value: s.cogs, color: '#f59e0b' },
                        { name: 'Expenses', value: s.exp, color: '#ef4444' },
                        { name: 'Net', value: Math.max(0, net), color: '#10b981' },
                    ]} />
                    <div className="space-y-2 text-[11px]">
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /><span className="text-slate-400">COGS</span><span className="ml-auto text-slate-300 font-bold">{((s.cogs / s.rev) * 100).toFixed(0)}%</span></div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /><span className="text-slate-400">Expenses</span><span className="ml-auto text-slate-300 font-bold">{((s.exp / s.rev) * 100).toFixed(0)}%</span></div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-slate-400">Net Profit</span><span className="ml-auto text-emerald-300 font-bold">{nm}%</span></div>
                        <div className="pt-1 mt-1 border-t border-white/5 flex items-center gap-2"><span className="text-slate-500">Gross margin</span><span className="ml-auto text-white font-bold">{gm}%</span></div>
                    </div>
                </div>

                <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2"><Sparkles size={14} className="text-violet-300" /><span className="text-[13px] font-bold text-white">AI Analysis</span></div>
                        {phase !== 'done' && (
                            <button onClick={analyze} disabled={phase === 'analyzing'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-200 text-[11px] font-bold hover:bg-violet-500/25 transition-colors disabled:opacity-60">
                                {phase === 'analyzing' ? <><Loader2 size={12} className="animate-spin" /> Analyzing…</> : <><Brain size={12} /> Analyze with AI</>}
                            </button>
                        )}
                    </div>
                    {phase === 'idle' && <p className="text-slate-500 text-[12px] leading-relaxed">Click <span className="text-violet-300 font-semibold">Analyze with AI</span> — VenQore reads this statement and returns plain-English insights and a health score.</p>}
                    {phase === 'analyzing' && (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-3 w-3/4 bg-white/5 rounded" /><div className="h-3 w-2/3 bg-white/5 rounded" /><div className="h-3 w-1/2 bg-white/5 rounded" />
                        </div>
                    )}
                    {phase === 'done' && (
                        <div className="vqf-in space-y-2.5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="text-2xl font-black text-emerald-400">{Math.round(parseFloat(nm) + 50)}<span className="text-sm text-slate-500">/100</span></div>
                                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full">Financially Healthy</span>
                            </div>
                            {[
                                { ic: CheckCircle2, c: 'text-emerald-400', t: 'Strong gross margin', d: `At ${gm}%, your product pricing leaves healthy room for overheads.` },
                                { ic: AlertTriangle, c: 'text-amber-400', t: 'Watch overheads', d: `Expenses are ${((s.exp / s.rev) * 100).toFixed(0)}% of revenue — trim toward the 30% benchmark.` },
                                { ic: TrendingUp, c: 'text-indigo-400', t: 'Reinvest to grow', d: 'You are profitable — consider routing 20% of net profit into marketing.' },
                            ].map((x, i) => (
                                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                                    <x.ic size={15} className={`${x.c} mt-0.5 shrink-0`} />
                                    <div><div className="text-[12px] font-bold text-slate-200">{x.t}</div><div className="text-[11px] text-slate-500 leading-snug">{x.d}</div></div>
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
const PosInvoiceDemo = () => {
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
                            <div className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-slate-500">Scan barcode or search…</div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-3 hidden sm:block">F1 Search · F4 Pay</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {POS_PRODUCTS.map(p => (
                            <button key={p.id} onClick={() => add(p)}
                                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:border-indigo-400/40 hover:bg-indigo-500/10 transition-all active:scale-95">
                                <div className="text-xl mb-1.5 group-hover:scale-110 transition-transform">{p.e}</div>
                                <div className="text-[11px] font-bold text-slate-200 truncate">{p.n}</div>
                                <div className="text-[11px] font-black text-indigo-300">Rs {p.p}</div>
                            </button>
                        ))}
                    </div>
                </div>
                {/* cart */}
                <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0b0a1c] p-3 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Cart</span>
                        <span className="text-[10px] text-slate-500">{cart.reduce((s, x) => s + x.q, 0)} items</span>
                    </div>
                    {done ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 vqf-in">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3"><Check size={28} className="text-emerald-400" /></div>
                            <div className="text-white font-black">Sale completed</div>
                            <div className="text-[11px] text-slate-500 mb-1">Journal posted · stock deducted (FIFO)</div>
                            <div className="text-[11px] text-emerald-400 font-mono">Rs {group(total)} · {pay}</div>
                            <button onClick={() => { setDone(false); setCart([{ ...POS_PRODUCTS[0], q: 2 }]); }} className="mt-4 text-[11px] font-bold text-indigo-300 hover:underline">New sale</button>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 space-y-1.5 min-h-[120px] max-h-[180px] overflow-y-auto pr-1">
                                {cart.length === 0 && <div className="text-center text-[11px] text-slate-600 py-10">Tap a product to add</div>}
                                {cart.map(x => (
                                    <div key={x.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                        <span className="text-base">{x.e}</span>
                                        <div className="min-w-0 flex-1"><div className="text-[11px] font-bold text-slate-200 truncate">{x.n}</div><div className="text-[10px] text-slate-500">Rs {x.p}</div></div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => dec(x.id)} className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"><Minus size={11} /></button>
                                            <span className="w-5 text-center text-[11px] font-bold text-white tabular-nums">{x.q}</span>
                                            <button onClick={() => add(x)} className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"><Plus size={11} /></button>
                                            <button onClick={() => del(x.id)} className="w-5 h-5 rounded bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-400 ml-0.5"><Trash2 size={11} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/5 space-y-1 text-[11px]">
                                <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="tabular-nums">Rs {group(sub)}</span></div>
                                <div className="flex justify-between text-slate-400"><span>VAT 5%</span><span className="tabular-nums">Rs {group(tax)}</span></div>
                                <div className="flex justify-between text-white font-black text-sm pt-0.5"><span>Total</span><span className="tabular-nums">Rs {group(total)}</span></div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                                {['Cash', 'Card', 'Split'].map(m => (
                                    <button key={m} onClick={() => setPay(m)} className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all ${pay === m ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200' : 'bg-white/[0.03] border-white/10 text-slate-500'}`}>{m}</button>
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
const SmartCaptureDemo = () => {
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
                        <div className="text-[15px] font-black text-white tracking-tight">Smart Capture</div>
                        <div className="text-[10px] text-slate-500">Snap a bill or speak — AI turns it into a transaction</div>
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
                                <div className="mt-3 text-[10px] text-slate-500">Sample supplier invoice</div>
                            </>
                        ) : (
                            <>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${phase === 'working' ? 'bg-violet-500/20 vqf-pulse' : 'bg-white/[0.04]'}`}>
                                    <Mic size={26} className={phase === 'working' ? 'text-violet-300' : 'text-slate-400'} />
                                </div>
                                <Waveform active={phase === 'working'} />
                                <div className="mt-2 text-[11px] font-mono text-slate-500">{phase === 'working' ? `00:0${t}` : '00:00'}</div>
                            </>
                        )}
                    </div>
                    {phase === 'idle' && (
                        <button onClick={run} className="mt-3 w-full py-2.5 rounded-xl bg-violet-500/15 border border-violet-400/30 text-violet-200 font-bold text-[12px] hover:bg-violet-500/25 transition-colors flex items-center justify-center gap-2">
                            {tab === 'Image' ? <><Upload size={14} /> Scan sample invoice</> : <><Mic size={14} /> Record sample voice note</>}
                        </button>
                    )}
                    {phase === 'working' && (
                        <div className="mt-3 w-full py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 font-bold text-[12px] flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> {tab === 'Image' ? 'Reading invoice…' : 'Transcribing…'}
                        </div>
                    )}
                </div>

                {/* extraction result */}
                <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 min-h-[208px]">
                    {phase === 'idle' || phase === 'working' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <Sparkles size={22} className="text-violet-300 mb-2" />
                            <div className="text-[13px] font-bold text-white mb-1">AI extraction</div>
                            <p className="text-[11px] text-slate-500 max-w-xs">Your own AI key reads the {tab === 'Image' ? 'photo' : 'audio'}, detects whether it’s a sale, purchase or expense, and matches every line to a product in your catalog.</p>
                        </div>
                    ) : (
                        <div className="vqf-in">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Detected</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${data.action === 'Sale' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{data.action}</span>
                                    <span className="text-[11px] text-slate-400">→ {data.supplier || data.party}</span>
                                </div>
                                {phase === 'confirmed' && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300"><Check size={12} /> Draft created</span>}
                            </div>
                            {data.transcript && <div className="mb-2 text-[11px] italic text-violet-200/80">{data.transcript}</div>}
                            <div className="space-y-1.5 mb-3">
                                {data.items.map((it, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 vqf-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                        <div className="min-w-0 flex-1"><div className="text-[12px] font-bold text-slate-200 truncate">{it.n}</div><div className="text-[9px] font-mono text-slate-500">matched · {it.sku}</div></div>
                                        <div className="text-[11px] text-slate-400 tabular-nums">{it.qty} × {it.price}</div>
                                        <div className="text-[11px] font-bold text-white tabular-nums w-16 text-right">Rs {group(it.qty * it.price)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <span className="text-[12px] font-black text-white">Total <span className="text-slate-500 font-normal">({data.items.length} lines)</span></span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[13px] font-black text-white tabular-nums">Rs {group(total)}</span>
                                    {phase === 'extracted' && <button onClick={() => setPhase('confirmed')} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-[#05130c] text-[11px] font-black hover:bg-emerald-400 transition-colors flex items-center gap-1.5"><Check size={12} /> Confirm &amp; Record</button>}
                                    {phase === 'confirmed' && <button onClick={() => setPhase('idle')} className="text-[11px] font-bold text-indigo-300 hover:underline">Try again</button>}
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
const VenSynQDemo = () => {
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
                        <div className="text-[15px] font-black text-white tracking-tight">VenSynQ — Channel Command Center</div>
                        <div className="text-[10px] text-slate-500">One inventory, every marketplace, true net margin</div>
                    </div>
                </div>
                <button onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 1400); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-200 text-[11px] font-bold hover:bg-blue-500/25 transition-colors">
                    <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Sync now'}
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-slate-500 mb-1">Gross Revenue</div><div className="text-lg font-black text-white tabular-nums">Rs <Num end={totalRev} /></div></div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-slate-500 mb-1">Net Profit</div><div className="text-lg font-black text-emerald-300 tabular-nums">Rs <Num end={totalNet} /></div></div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-slate-500 mb-1">Channels</div><div className="text-lg font-black text-white">{VQ_CHANNELS.length} <span className="text-[10px] text-slate-500 font-bold">connected</span></div></div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-300/80 mb-1">Most profitable</div><div className="text-lg font-black text-emerald-300">{best.k}</div></div>
            </div>

            <div className="space-y-2">
                {VQ_CHANNELS.map((c) => (
                    <div key={c.k} className="grid grid-cols-12 items-center gap-2 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
                        <div className="col-span-4 sm:col-span-3 flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0" style={{ background: c.c + '22', color: c.c }}>{c.k[0]}</span>
                            <div className="min-w-0"><div className="text-[12px] font-bold text-white truncate">{c.k}</div><div className="text-[9px] text-slate-500">{c.units} units · {c.fulfil}</div></div>
                        </div>
                        <div className="hidden sm:block col-span-3">
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(c.net / maxNet) * 100}%`, background: c.c }} /></div>
                            <div className="text-[9px] text-slate-500 mt-1">net margin {((c.net / c.rev) * 100).toFixed(0)}%</div>
                        </div>
                        <div className="col-span-4 sm:col-span-2 text-right"><div className="text-[9px] text-slate-500">Revenue</div><div className="text-[12px] font-bold text-white tabular-nums">Rs {group(c.rev)}</div></div>
                        <div className="col-span-4 sm:col-span-2 text-right"><div className="text-[9px] text-slate-500">Net · {c.comm}% fee</div><div className="text-[12px] font-bold text-emerald-300 tabular-nums">Rs {group(c.net)}</div></div>
                        <div className="col-span-12 sm:col-span-2 flex sm:justify-end"><span className={`px-2 py-1 rounded-full text-[9px] font-black ${STOCK_TONE[c.tone]}`}>{c.stock}</span></div>
                    </div>
                ))}
            </div>
        </DemoFrame>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO 5 · AI GROWTH ENGINE — proactive business signals
   ═══════════════════════════════════════════════════════════════════════════ */
const GROWTH_SIGNALS = [
    { ic: Boxes, tone: 'amber', tag: 'Stockout Risk', title: 'SKU-492 · Alpha 12', conf: 88, text: 'Selling 3.2/day — current stock runs out in ~5 days.', action: 'Draft purchase order', actIc: Truck },
    { ic: AlertTriangle, tone: 'rose', tag: 'Churn Rising', title: 'Ali Traders', conf: 72, text: 'Order frequency dropped 46% vs their 6-month average.', action: 'Send WhatsApp offer', actIc: Sparkles },
    { ic: Repeat, tone: 'emerald', tag: 'Return Predicted', title: 'Bilal General Store', conf: 64, text: 'Buys ~every 9 days. Due to reorder in 3 days.', action: 'Schedule reminder', actIc: CheckCircle2 },
];
const GTONE = {
    amber: { c: 'text-amber-300', b: 'bg-amber-500/15', bar: 'bg-amber-400' },
    rose: { c: 'text-rose-300', b: 'bg-rose-500/15', bar: 'bg-rose-400' },
    emerald: { c: 'text-emerald-300', b: 'bg-emerald-500/15', bar: 'bg-emerald-400' },
};
const GrowthEngineDemo = () => {
    const reduced = usePRM();
    const [ref, v] = useInView(0.3);
    const [asked, setAsked] = useState(false);
    return (
        <DemoFrame title="Growth Engine" url="app.venqore.com/growth" badge="AI ENGINE" accent="violet">
            <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-5 rounded-full bg-violet-500" />
                <div>
                    <div className="text-[15px] font-black text-white tracking-tight">Growth Engine</div>
                    <div className="text-[10px] text-slate-500">Three models watching your business so you act before problems do</div>
                </div>
            </div>
            <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-4">
                {GROWTH_SIGNALS.map((s, i) => {
                    const t = GTONE[s.tone];
                    return (
                        <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5 rounded-lg ${t.b} ${t.c}`}><s.ic size={14} /></div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${t.c}`}>{s.tag}</span>
                            </div>
                            <div className="text-[13px] font-bold text-white mb-1">{s.title}</div>
                            <p className="text-[11px] text-slate-500 leading-snug mb-3 flex-1">{s.text}</p>
                            <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1"><span>Confidence</span><span className="font-bold">{s.conf}%</span></div>
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                                <div className={`h-full rounded-full ${t.bar}`} style={{ width: (reduced || v) ? `${s.conf}%` : 0, transition: 'width 1.1s cubic-bezier(0.22,1,0.36,1)' }} />
                            </div>
                            <button className={`w-full py-1.5 rounded-lg ${t.b} ${t.c} text-[10px] font-bold flex items-center justify-center gap-1.5 hover:brightness-125 transition-all`}>
                                <s.actIc size={11} /> {s.action}
                            </button>
                        </div>
                    );
                })}
            </div>
            {/* ask in plain English */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0b0a1c] p-3.5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center"><Bot size={15} className="text-violet-300" /></div>
                    <span className="text-[12px] font-bold text-white">Ask in plain English</span>
                </div>
                <button onClick={() => setAsked(true)} className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[12px] text-slate-300 hover:border-violet-400/40 transition-colors mb-2">
                    “Which 5 products made me the most profit this month?” <span className="text-violet-300 font-bold">↵</span>
                </button>
                {asked && (
                    <div className="vqf-in p-3 rounded-lg bg-white/[0.03] border border-white/5">
                        <p className="text-[12px] text-slate-200 mb-2">Your top profit drivers this month:</p>
                        {[['Coffee Jar', 38400], ['Hand Wash', 29100], ['Dark Choco', 21850], ['Milk 1L', 18600], ['Cola 500ml', 15200]].map(([n, p], i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] py-0.5"><span className="text-slate-400">{i + 1}. {n}</span><span className="text-emerald-300 font-bold tabular-nums">Rs {group(p)}</span></div>
                        ))}
                    </div>
                )}
            </div>
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
const CookbookDemo = () => {
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
                        <div className="text-[15px] font-black text-white tracking-tight">Cookbook — Auto-Assembly</div>
                        <div className="text-[10px] text-slate-500">Build composite items from a recipe — raw stock deducts automatically</div>
                    </div>
                </div>
                <PillTabs tabs={['Make now', 'Auto on sale']} value={mode} onChange={setMode} size="md" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* recipe */}
                <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Bill of Materials</span>
                        <span className="text-[10px] text-slate-500">per 1 unit</span>
                    </div>
                    <div className="space-y-2">
                        {RECIPE.raw.map((r, i) => {
                            const used = r.per * qty;
                            return (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center"><Boxes size={14} className="text-amber-300" /></div>
                                    <div className="min-w-0 flex-1"><div className="text-[12px] font-bold text-slate-200">{r.n}</div><div className="text-[9px] text-slate-500">{r.per}{r.unit} / unit · stock {group(ran ? r.stock - used : r.stock)}{r.unit}</div></div>
                                    <div className={`text-[11px] font-bold tabular-nums ${ran ? 'text-rose-300 vqf-in' : 'text-slate-400'}`}>−{group(used)}{r.unit}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* produce */}
                <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0b0a1c] p-4 flex flex-col">
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Output</div>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-lg">🧂</div>
                        <div><div className="text-[13px] font-bold text-white">{RECIPE.out}</div><div className="text-[10px] text-slate-500">finished good · stock {ran ? qty : RECIPE.outStock}</div></div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] text-slate-400">Quantity</span>
                        <div className="flex items-center gap-1 ml-auto">
                            <button onClick={() => setQty(q => Math.max(5, q - 5))} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"><Minus size={12} /></button>
                            <span className="w-8 text-center text-[13px] font-black text-white tabular-nums">{qty}</span>
                            <button onClick={() => setQty(q => q + 5)} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"><Plus size={12} /></button>
                        </div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 mb-3 text-[11px]">
                        <div className="flex justify-between text-slate-400"><span>Batch cost (FIFO)</span><span className="text-white font-bold tabular-nums">Rs {group(batchCost)}</span></div>
                        <div className="flex justify-between text-slate-400 mt-1"><span>Cost / unit</span><span className="text-amber-300 font-bold tabular-nums">Rs {group(batchCost / qty, 1)}</span></div>
                    </div>
                    {ran ? (
                        <div className="mt-auto vqf-in rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center">
                            <Check size={18} className="text-emerald-400 mx-auto mb-1" />
                            <div className="text-[12px] font-bold text-white">{mode === 'Make now' ? `${qty} units produced` : 'Auto-assembled on sale'}</div>
                            <div className="text-[10px] text-slate-500">Raw stock deducted · journal posted</div>
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
   ═══════════════════════════════════════════════════════════════════════════ */
const FEATURE_CATS = [
    {
        key: 'start', label: 'Getting Started', icon: Gauge, color: 'indigo',
        items: [
            { n: 'One-Click Interactive Demo', d: 'Launch a fully pre-populated demo store from the landing page — test checkout, reports and dummy products with no account.' },
            { n: '14-Day Free Trial', d: 'Explore the full platform for 14 days with no credit card required.' },
            { n: 'Instant Store Creator', d: 'Start setup by entering only your store name — no servers or technical knowledge needed.' },
            { n: 'Smart Industry Seeding', d: 'Auto-imports standard units, tax settings and categories tailored to your industry (Retail, Grocery, F&B, Fashion, Hard Goods).' },
            { n: 'Dark Theme (Midnight Nebula)', d: 'Premium glassmorphic dark dashboard with amber accents — easy on cashiers’ eyes during long shifts.' },
            { n: 'Light Theme', d: 'Crisp, high-contrast layout designed for bright storefront environments.' },
            { n: 'Multi-Store Hub Dashboard', d: 'Central launchpad showing all branches with one-click switching between them.' },
            { n: 'Granular Multi-Store Roles', d: 'Be Owner in Store A, Manager in Store B and read-only Viewer in Store C — from one account.' },
            { n: 'Cashier PIN Login', d: 'Staff log in with a fast 4-digit PIN — no retyping email and password between shifts.' },
            { n: 'Progressive Web App (PWA)', d: 'Install VenQore on Windows, Android or iOS as a native-feeling app.' },
            { n: 'Self-Guiding Setup Tour', d: 'Interactive onboarding that highlights buttons and walks new staff through their first sale.' },
            { n: 'Coupon Code Upgrades', d: 'Apply, stack and upgrade license voucher codes to instantly unlock higher limits or store slots.' },
            { n: 'Hardware Status Badge', d: 'Live indicator showing whether thermal printers and payment hardware are connected and ready.' },
            { n: 'One-Click Cache Refresh', d: 'Instantly optimize local performance so every screen loads at full speed.' },
            { n: 'Owner Profile Card', d: 'See your active tier, remaining trial days and login details at a glance.' },
            { n: 'Test Data Wipe', d: 'Securely erase demo/test transactions while preserving tax rules, settings and staff accounts.' },
            { n: 'Security Activity Log', d: 'Traces staff IP addresses, login timestamps and locations for every sensitive action.' },
        ],
    },
    {
        key: 'pos', label: 'Point of Sale', icon: ShoppingCart, color: 'amber',
        items: [
            { n: 'Instant Barcode Scanner', d: 'Scan product tags to add items to the cart instantly — no mouse or keyboard.' },
            { n: 'Serial & IMEI Scanner', d: 'Prompts operators to scan device identifiers (phone IMEIs, appliance serials) at checkout.' },
            { n: 'Keyboard-First Checkout', d: 'F1 search, F2 quantity, F3 discount, F4 checkout — process whole queues without a mouse.' },
            { n: 'Senior Mode Accessibility', d: 'Increases font sizes by 40% with high-contrast, traffic-light colors for easier reading.' },
            { n: 'Color-Coded Price & Qty', d: 'Green pricing, blue quantities — prevents numerical confusion at a glance.' },
            { n: 'Owner Profit Peek', d: 'Drag down on the bill total to reveal the live profit margin of the active cart, hidden from the customer.' },
            { n: 'Multi-Tab Customer Checkout', d: 'Manage up to 10 active customer carts simultaneously, switchable via hotkeys.' },
            { n: 'Park & Recall (Hold Bill)', d: 'Put a cart on hold with a note (e.g. “Table 5”) while serving others, then recall it instantly.' },
            { n: 'In-Flight Product Creation', d: 'Add a new product to the catalog inside the checkout screen without losing the cart.' },
            { n: 'Cart Rescue & Session Protection', d: 'Active sales are saved to local memory — carts survive power cuts and browser crashes.' },
            { n: 'Auto-Applying Customer Discounts', d: 'Applies pre-negotiated discount agreements the moment a customer is selected.' },
            { n: 'Typo-Tolerant Search (OmniSearch)', d: 'Finds products even when the cashier misspells the name.' },
            { n: 'Automatic Cash Rounding', d: 'Rounds fractional change to the nearest valid denomination by local currency rules.' },
            { n: 'Multi-Account Split Payments', d: 'Accept any mix of Cash, Card, Bank Transfer and Store Credit in one transaction.' },
            { n: 'Daily Cash Register Audit', d: 'End-of-day cash-out wizard comparing the physical drawer against the system total.' },
            { n: 'Silent WebUSB Thermal Printing', d: 'Prints receipts directly to thermal hardware without browser popup dialogs.' },
            { n: 'Custom Thermal Roll Widths', d: 'Switch print templates between 80mm and 58mm thermal paper.' },
            { n: 'Receipt Cut-Line Padding', d: 'Adds blank lines so totals clear the paper cutter cleanly.' },
            { n: 'Dynamic Brand Colors on PDFs', d: 'Customize B2B invoice PDFs to match your corporate palette.' },
            { n: 'Print Column Toggles', d: 'Show/hide MRP, HSN codes, batch details, serials or savings by customer type.' },
            { n: 'Amount-to-Words Translation', d: 'Prints totals as written words (e.g. “Five Thousand Rupees Only”).' },
            { n: 'Tax Verification QR Codes', d: 'Embeds regional tax-compliance QR codes on printed receipts.' },
            { n: 'Branded Receipt Sync', d: 'Scales and positions store logos, headers and footer terms on all templates.' },
            { n: 'Auto-Deducting Composite Items', d: 'Selling a bundled/manufactured item deducts raw ingredients from stock in real time.' },
            { n: 'Negative Stock Alert & Lock', d: 'Warns — or hard-blocks — selling an item with empty inventory (configurable).' },
            { n: 'Service Fee & Freight Additions', d: 'Add delivery charges, assembly fees or service costs directly to invoices.' },
            { n: 'Automatic VAT / GST Calculation', d: 'Computes regional tax at the line-item level automatically — no cashier input.' },
            { n: 'Recent Invoices Panel', d: 'Shows the last 50 completed sales inside POS for quick refunds or reprints.' },
            { n: 'Cashier Change Calculator', d: 'Displays the exact change to hand back upon payment entry.' },
            { n: 'Barcode Label Print Factory', d: 'Design and print custom barcode stickers with name, logo, price and variant info.' },
            { n: 'Dynamic Label QR Codes', d: 'Embeds product QR codes on labels that link to your online storefront.' },
        ],
    },
    {
        key: 'receivables', label: 'Invoicing & Receivables', icon: Receipt, color: 'emerald',
        items: [
            { n: 'Customer Account Registry (Khata)', d: 'A dedicated ledger for every buyer — lifetime purchases, credit balance and payment history.' },
            { n: 'Customer Payments Log', d: 'Records cash, bank transfers and partial cheque deposits against specific invoices.' },
            { n: 'Customer Statement Generator', d: 'Clean downloadable PDF statements of purchases, returns and payments.' },
            { n: 'Aged Receivables Report', d: 'Categorizes outstanding balances into 30/60/90/120+ day buckets for collection priority.' },
            { n: 'WhatsApp & SMS Debt Reminders', d: 'One-click pre-formatted overdue-balance reminders from the customer ledger (coming soon).' },
            { n: 'Credit Limit Enforcement', d: 'Blocks credit sales when a customer’s balance exceeds their configured limit.' },
            { n: 'Multi-Payment Invoices', d: 'Accept partial payments across multiple sessions against one invoice.' },
            { n: 'Automatic Payment Allocation', d: 'Distributes lump-sum payments against the oldest unpaid invoices automatically.' },
            { n: 'Customer Lifetime Value Score', d: 'Ranks customers by total profit generated and sales volume.' },
            { n: 'Customer Wallet Credit', d: 'Returns refunds into a digital store wallet, keeping capital in your business.' },
            { n: 'Loyalty Points System', d: 'Awards purchase points automatically, redeemable as discounts on future orders.' },
            { n: 'Wholesale vs Retail Pricing Tiers', d: 'Assigns custom price lists per customer for automatic wholesale pricing.' },
            { n: 'B2B Proposal Builder', d: 'Creates corporate proposals and estimates with tracked “Valid Until” dates.' },
            { n: 'One-Click Quotation Conversion', d: 'Converts accepted quotes into posted tax invoices and updates the ledger in one click.' },
            { n: 'Tax-Inclusive / Exclusive Toggle', d: 'Switch B2B pricing between tax-inclusive and tax-exclusive display.' },
            { n: 'B2B Invoice Margin Display', d: 'Shows calculated profit per line item while building an invoice (owner-only).' },
            { n: 'Sales Return Vouchers', d: 'Generates formal return records and restores returned items to inventory.' },
            { n: 'Interactive B2B Invoice Designer', d: 'Customizable invoice layout with brand colors, logos, margins and signature fields.' },
            { n: 'Pre-Sales Inventory Reservation', d: 'Locks stock batches for pending orders without recording revenue until delivery.' },
            { n: 'Automated Recurring Invoicing', d: 'Schedules subscription invoices on daily, weekly, monthly or quarterly cycles.' },
            { n: 'Refund Reason Analysis', d: 'Tracks return reasons (damaged, wrong size…) to surface product quality patterns.' },
            { n: 'Tax-Exempt Customer Flag', d: 'Marks corporate clients as tax-exempt, skipping tax on their orders.' },
            { n: 'Customer Address Book', d: 'Stores billing, shipping and multiple warehouse addresses per customer.' },
            { n: 'A4 & Letter Invoice PDF Export', d: 'Generates clean professional A4 or US-Letter PDF invoices ready to email.' },
            { n: 'Outstanding Balance Dashboard', d: 'Widget showing total receivables across all customer accounts at a glance.' },
            { n: 'Unified Party Ledger', d: 'Merges a customer’s full sales, returns and payment history into one clean view.' },
            { n: 'Customer Milestone Tracker', d: 'Logs birthdays and anniversaries, sending automated greetings and discount vouchers.' },
            { n: 'Digital Gift Cards', d: 'Issues promotional digital gift cards with configurable balances and expiry dates.' },
            { n: 'Overdue Customer Highlights', d: 'Highlights past-due customer profiles in red across all ledger screens.' },
        ],
    },
    {
        key: 'procurement', label: 'Procurement & Payables', icon: Truck, color: 'cyan',
        items: [
            { n: 'Supplier Account Registry (Khata)', d: 'Vendor profile tracking what you owe each supplier and their payment terms.' },
            { n: 'Delayed Supplier Payments', d: 'Record stock on credit, track the balance and pay in installments.' },
            { n: 'Supplier Statement Generator', d: 'Downloadable PDF statements of purchases, returns and payments per vendor.' },
            { n: 'Aged Payables Directory', d: 'Categorizes vendor balances owed into 30/60/90/120+ day buckets.' },
            { n: 'Purchase Order Tracker', d: 'Tracks POs from Draft → Ordered → Partially Received → Fully Received.' },
            { n: 'Partial Shipment Intake', d: 'Logs split deliveries, keeping remaining quantities active.' },
            { n: 'Supplier Debit Notes', d: 'Formal debit notes when returning faulty stock to claim vendor credits.' },
            { n: 'Automated Cost Price Updater', d: 'Recalculates product cost prices automatically from each new supplier invoice.' },
            { n: 'Cost Price Increase Alert', d: 'Warns when a supplier charges more than their historical average.' },
            { n: 'Supplier Lead Time Tracker', d: 'Logs average delivery days between order and receipt per vendor.' },
            { n: 'Landing Cost Allocations', d: 'Distributes freight, customs and overhead across product batch costs accurately.' },
            { n: 'Supplier SKU Mapping', d: 'Maps supplier product codes to your internal catalog for fast reordering.' },
            { n: 'Inbound Expiry Date Tracking', d: 'Logs expiry dates at intake to prevent silent shelf expiry.' },
            { n: 'Purchase Returns Register', d: 'Processes vendor returns, adjusts stock and reduces payables automatically.' },
            { n: 'Auto-Generated Purchase Orders', d: 'Drafts POs for products that drop below safety stock levels.' },
            { n: 'Bulk Supplier Payments', d: 'Records one payment settled across multiple outstanding vendor invoices.' },
            { n: 'Bank-Linked Supplier Payments', d: 'Connects outgoing vendor payments to your cash and bank ledgers.' },
            { n: 'Custom Supplier Payment Terms', d: 'Set vendor-specific terms such as Net 15, Net 30 or Net 60.' },
            { n: 'Purchase Invoice Document Scanner', d: 'Upload and attach scanned invoices directly to purchase records for auditing.' },
            { n: 'Supplier Refund Tracker', d: 'Logs refund payments received back from suppliers for returned goods.' },
            { n: 'Tax-Inclusive Procurement Toggle', d: 'Switches purchase calculations between tax-inclusive and tax-exclusive formats.' },
            { n: 'Supplier Credit Limit Alerts', d: 'Highlights vendor accounts in red when balances approach their pre-set caps.' },
            { n: 'Outstanding Payables Dashboard', d: 'A widget showing total amounts owed across all suppliers in one view.' },
        ],
    },
    {
        key: 'inventory', label: 'Inventory & Warehouses', icon: Warehouse, color: 'blue',
        items: [
            { n: 'Multi-Warehouse Isolation (Godown)', d: 'Separate inventory balances for each godown, retail floor or wholesale depot.' },
            { n: 'Stock Transfer Vouchers', d: 'Logged transfers between locations, complete with printable waybills.' },
            { n: 'Product Variant Support', d: 'Tracks size, color and weight variants under single product groups.' },
            { n: 'Variant-Aware FIFO Costing', d: 'Separate cost pools per variant for accurate COGS from actual batch prices.' },
            { n: 'Batch Intake Number Tracking', d: 'Records manufacturing batch numbers at receipt for precise traceability.' },
            { n: 'Batch Expiry Warnings', d: 'Dashboard notifications for batches approaching their expiration date.' },
            { n: 'Stock Take Audit Wizard', d: 'Reconciles system inventory against physical counts, logging discrepancy causes.' },
            { n: 'Disaster & Asset Claim Manager', d: 'Logs stock lost to theft, fire or water, handles write-offs and tracks insurance claims.' },
            { n: 'Bill of Materials (BOM) Recipes', d: 'Defines composite items built from multiple raw stock components.' },
            { n: 'Auto-Assembly Cookbook', d: 'Deducts raw ingredients in real time when a manufactured item is sold.' },
            { n: 'Production Run Simulator', d: 'Checks raw materials to confirm whether a planned production run can complete.' },
            { n: 'Recipe History Archive', d: 'Preserves historical cost and component configs so past audits stay accurate.' },
            { n: 'Product History Timeline', d: 'Unified list of all purchase, sale and return movements per product.' },
            { n: 'Category Management Center', d: 'Hierarchical category groups for organizing thousands of items cleanly.' },
            { n: 'Low Stock Threshold Alerts', d: 'Configurable per-product triggers when inventory drops below reorder levels.' },
            { n: 'IMEI & Serial Lifecycle Tracking', d: 'Tracks device identifiers from supplier purchase through sale and returns.' },
            { n: 'Unit of Measure Converter', d: 'Buy in cartons, sell in pieces — convert between base and secondary units.' },
            { n: 'Stock Valuation by Location', d: 'Detailed value of all active stock holdings by warehouse using real FIFO cost.' },
        ],
    },
    {
        key: 'ecom', label: 'E-Commerce & Channels', icon: Globe, color: 'violet',
        items: [
            { n: 'VenSynQ Command Center', d: 'Connects Amazon, WooCommerce, TikTok Shop and eBay — syncs stock and manages all channel orders in one place.' },
            { n: '3-Click OAuth Store Connection', d: 'Connect marketplace accounts through a secure authorization link in three clicks.' },
            { n: 'Automated Commission Isolation', d: 'Calculates platform fees (e.g. Amazon’s 15%) to reveal your clean net margin per sale.' },
            { n: 'Dropshipping Order Automator', d: 'Syncs incoming marketplace orders and compiles dropship sales invoices automatically.' },
            { n: 'Just-in-Time Purchase Orders', d: 'Drafts a supplier PO the moment a dropship sale is recorded — locking your margin.' },
            { n: 'Bulk Tracking ID Sync', d: 'Pushes courier tracking numbers and carriers back to marketplaces in bulk.' },
            { n: 'Multi-Channel Expense Allocation', d: 'Routes platform fees and commissions into custom expense categories automatically.' },
            { n: 'WooCommerce Real-Time Webhook', d: 'Listens to WooCommerce orders, matches by SKU and deducts inventory instantly.' },
            { n: 'WooCommerce Customer Auto-Registry', d: 'Creates a unified “Web Customer” contact for all incoming e-commerce orders.' },
            { n: 'WooCommerce Stock Sync', d: 'Pushes updated inventory levels to your WooCommerce store every 5 minutes.' },
            { n: 'Online Orders Bridge', d: 'Pulls pending web orders into the central POS dashboard for fulfillment.' },
            { n: 'Web Store Catalog Controls', d: 'Choose which products appear or are hidden from your public storefront.' },
        ],
    },
    {
        key: 'accounting', label: 'Accounting & Ledgers', icon: Calculator, color: 'emerald',
        items: [
            { n: 'Double-Entry Journal Engine', d: 'Posts balanced debit/credit entries for every transaction — the gold standard of accuracy.' },
            { n: 'Automated Cash Reconciliation', d: 'Computes current cash from live ledger queries, eliminating cached reporting errors.' },
            { n: 'Fixed Asset Depreciation Tracker', d: 'Calculates monthly depreciation for fixtures, hardware and vehicles automatically.' },
            { n: 'Business Loan Ledger', d: 'Tracks loans separately, splitting principal repayments from interest expense.' },
            { n: 'Inter-Register Cash Transfers', d: 'Records cash moved between registers and banks with manager approvals.' },
            { n: 'Advance Payment Allocation', d: 'Registers and applies customer pre-payments and supplier deposits to later invoices.' },
            { n: 'Fiscal Year Closing Wizard', d: 'Locks year-end entries, archives balances and opens fresh books for the new period.' },
            { n: 'Debit & Credit Note Registry', d: 'Generates and prints formal financial notes for returns and adjustments.' },
            { n: 'Bank Reconciliation Checker', d: 'Compares uploaded bank CSV statements against records, flagging unmatched lines.' },
            { n: 'Tax Summary Engine', d: 'Tracks output tax collected vs input tax paid, computing net tax liability.' },
            { n: 'Expense Manager + Receipt Uploads', d: 'Logs expenses by category with scanned receipt images for audit trails.' },
            { n: 'Charity Allocation Engine', d: 'Directs a configured percentage of checkout profit to a dedicated charity ledger.' },
            { n: 'Petty Cash Logs', d: 'Records small cash movements between registers with mandatory approval trails.' },
            { n: 'Immutable Transaction Locks', d: 'System observers block any modification to posted financial transactions.' },
            { n: 'Balanced Reversal Engine', d: 'Generates matching zero-balance entries for reversals, keeping ledgers correct.' },
            { n: 'Multi-Currency Configuration', d: 'Exchange rates, symbols and formatting for SAR, AED, USD, PKR, GBP and more.' },
        ],
    },
    {
        key: 'reports', label: 'Reports (40+)', icon: BarChart3, color: 'pink',
        items: [
            { n: 'Profit & Loss Statement', d: 'Net revenue, COGS, gross margin and operating expenses with category drill-down.' },
            { n: 'Balance Sheet', d: 'Real-time snapshot of total assets, liabilities and equity.' },
            { n: 'Cash Flow Statement', d: 'Monitors operating, investing and financing cash flows.' },
            { n: 'Double-Entry Trial Balance', d: 'Verifies accounting health by matching all debit and credit totals.' },
            { n: 'Sales Summary & Daily Trend', d: 'Transaction history filterable by date, customer and payment status; daily tax/discount trends.' },
            { n: 'Day Book Log', d: 'Chronological minute-by-minute diary of all cash inflows and outflows.' },
            { n: 'Account Ledger Report', d: 'Comprehensive audit ledger for any category in your chart of accounts.' },
            { n: 'Party Statement (Khata Ledger)', d: 'Credit statements for customers or suppliers with debit, credit and closing balance.' },
            { n: 'Stock Valuation Report', d: 'Value of all active stock holdings by warehouse, at real FIFO cost.' },
            { n: 'Low Stock Shortages Report', d: 'Lists products below reorder threshold with exact shortage quantities.' },
            { n: 'Stock Movement History', d: 'Every receipt, adjustment, transfer and sale with operator details.' },
            { n: 'Tax Compliance Summary', d: 'Output tax collected vs input tax credits, showing net tax due.' },
            { n: 'Item-Wise Profit Analysis', d: 'Identifies high-margin products by revenue and cost per item.' },
            { n: 'Party-Wise Profitability', d: 'Ranks customers and suppliers by the net margin they generate.' },
            { n: 'Bill-Wise Profitability', d: 'Computes net profit margins generated by individual invoices.' },
            { n: 'Sales Aging Report', d: 'Categorizes outstanding receivables into 30/60/90+ day intervals.' },
            { n: 'Expense by Category', d: 'Pie-chart view of overhead costs across all custom business categories.' },
            { n: 'Stock Summary & Aging', d: 'Inventory levels and capital by category; flags slow-moving stock by age in each godown.' },
            { n: 'Item / Party Cross Reports', d: 'Every product a customer bought, and every customer who bought a product.' },
            { n: 'Loan Repayment Statement', d: 'Amortization showing principal reduction and interest paid per period.' },
            { n: 'Graph Analytics Dashboard', d: 'Heatmaps and trend charts showing platform performance over time.' },
            { n: 'Purchases Report', d: 'Procurement totals, supplier amounts owed and full invoice histories.' },
            { n: 'Transactions History', d: 'Searchable directory of every operational transaction in the system.' },
            { n: 'Expenses Directory', d: 'Categorized operating-expense report with receipt file attachments.' },
            { n: 'Bank Statements Log', d: 'Traces all bank ledger accounts, cash balances and payment records.' },
            { n: 'Expiring Soon Alert', d: 'Highlights inventory batches expiring within a configurable window.' },
            { n: 'All Parties Credit Summary', d: 'Combined outstanding receivables and payables across all contacts.' },
            { n: 'General Discount Report', d: 'Analyzes the total cost of discount strategies across all transactions.' },
            { n: 'Category Profit & Loss', d: 'Tracks profit and loss performance for individual product departments.' },
            { n: 'Tax Rate Breakdown', d: 'Traces output taxes collected, organized by tax-rate bracket.' },
            { n: 'Sales Order Items', d: 'Line-item breakdown of every pending and fulfilled sales order.' },
        ],
    },
    {
        key: 'ai', label: 'AI & Administration', icon: Cpu, color: 'violet',
        items: [
            { n: 'Floating AI Assistant', d: 'Context-aware chat that answers ledger and business questions in plain English.' },
            { n: 'Smart Capture (Image & Audio)', d: 'Snap a bill or speak — AI extracts a sale, purchase or expense and matches products to your catalog.' },
            { n: 'Bring-Your-Own-Key AI', d: 'Plug in your own AI key so intelligence runs on your terms and budget.' },
            { n: 'Customer Return Predictor', d: 'Forecasts when each customer is due back so promos land before they lapse.' },
            { n: 'Stock Depletion Forecaster', d: 'Projects depletion per SKU and drafts purchase orders before you stock out.' },
            { n: 'Churn Risk Detector', d: 'Flags high-value accounts losing momentum while there’s still time to act.' },
            { n: 'Multi-Tenant Store Isolation', d: 'Each store runs in a completely isolated database scope, accessible only to its users.' },
            { n: 'Three-Zone Security Architecture', d: 'Server-side partitioning between public, store and SuperAdmin layers.' },
            { n: 'SuperAdmin Command Center', d: 'An 8-tab war room monitoring store creation, subscriptions and platform metrics.' },
            { n: 'Subscription Plan Enforcement', d: 'Enforces transaction limits, seat counts and store caps per tier automatically.' },
            { n: 'Redis-Cached Plan Gates', d: 'Verifies tenant plan limits instantly, reducing DB load during peak periods.' },
            { n: 'Automated Limit Override Manager', d: 'Lets admins grant custom plan extensions to specific tenants.' },
            { n: 'Staff Invitation Codes', d: 'Secure alphanumeric tokens (e.g. VQ-A3X9P2) for adding staff without sharing passwords.' },
            { n: 'Ephemeral Demo Sandbox', d: 'Builds temporary public demo environments by cloning a master dataset, auto-expiring after 48h.' },
            { n: 'Soft-Delete Trash Management', d: 'Restore or permanently delete soft-deleted stores and user accounts.' },
            { n: 'Custom Tax Rate Configurator', d: 'Create regional brackets (GST, VAT) configurable at the product level.' },
            { n: 'Cashier Inactivity Auto-Logout', d: 'Automatic terminal logout timers based on cashier inactivity.' },
            { n: 'Module Toggle Controls', d: 'Enable or disable modules (AI, WooCommerce, Manufacturing) per tenant dynamically.' },
            { n: 'Backups & Google Drive Sync', d: 'Automated backups with restore points, syncable to your own Google Drive.' },
            { n: 'Import / Export Tools', d: 'Bulk import and export products, parties and transactions — your data is always yours.' },
            { n: 'Barcode Pattern Recognition', d: 'Maps scanner input to distinguish SKUs, serial numbers and IMEI identifiers.' },
            { n: 'Stock Reservation Rules', d: 'Configures whether sales orders reserve active stock or draft from empty allocations.' },
            { n: 'Passcode Security Standards', d: 'Enforces numerical complexity requirements for all employee access codes.' },
        ],
    },
    {
        key: 'roadmap', label: 'On the Roadmap', icon: Sparkles, color: 'amber',
        items: [
            { n: 'Device-Adaptive Layouts', d: 'Optimizing checkout across ultra-wide monitors, legacy tablets and small phones.' },
            { n: 'Custom SMTP Mail Gateway', d: 'Send invoices and statements from your own branded company email domain.' },
            { n: 'SMS & Messaging Gateway', d: 'Connect leading SMS providers for automated customer text alerts.' },
            { n: 'WhatsApp & SMS Debt Reminders', d: 'One-click overdue payment alerts sent from customer ledger pages.' },
            { n: 'Anniversary & Birthday Tracker', d: 'Automated milestone greetings paired with targeted discount vouchers.' },
            { n: 'Digital Gift Cards & Wallet Credit', d: 'Issue promotional gift cards and handle refunds as store credit.' },
        ],
    },
];
const TOTAL_FEATURES = FEATURE_CATS.reduce((s, c) => s + c.items.length, 0);
const CAT_COLOR = {
    indigo: 'text-indigo-300 bg-indigo-500/12 border-indigo-400/20',
    amber: 'text-amber-300 bg-amber-500/12 border-amber-400/20',
    emerald: 'text-emerald-300 bg-emerald-500/12 border-emerald-400/20',
    cyan: 'text-cyan-300 bg-cyan-500/12 border-cyan-400/20',
    blue: 'text-blue-300 bg-blue-500/12 border-blue-400/20',
    violet: 'text-violet-300 bg-violet-500/12 border-violet-400/20',
    pink: 'text-pink-300 bg-pink-500/12 border-pink-400/20',
};

/* ── Feature explorer: search + filter + click-to-explain ─────────────────── */
const ALL_ITEMS = FEATURE_CATS.flatMap(c => c.items.map(it => ({ ...it, cat: c.label, color: c.color, ckey: c.key, icon: c.icon })));
const FeatureExplorer = () => {
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('all');
    const [sel, setSel] = useState(null);
    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        return ALL_ITEMS.filter(it =>
            (cat === 'all' || it.ckey === cat) &&
            (!ql || it.n.toLowerCase().includes(ql) || it.d.toLowerCase().includes(ql))
        );
    }, [q, cat]);
    return (
        <div>
            {/* controls */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="relative max-w-md mx-auto w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search all ${TOTAL_FEATURES} features…`}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/50 text-white text-sm outline-none transition-colors" />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={() => setCat('all')} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${cat === 'all' ? 'bg-white text-[#05030f] border-white' : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'}`}>All <span className="opacity-60">{TOTAL_FEATURES}</span></button>
                    {FEATURE_CATS.map(c => (
                        <button key={c.key} onClick={() => setCat(c.key)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all inline-flex items-center gap-1.5 ${cat === c.key ? CAT_COLOR[c.color] + ' brightness-125' : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'}`}>
                            <c.icon size={12} /> {c.label} <span className="opacity-60">{c.items.length}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filtered.map((it, i) => (
                    <button key={it.cat + it.n} onClick={() => setSel(it)}
                        className="group text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-400/25 transition-all hover:-translate-y-0.5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center border ${CAT_COLOR[it.color]}`}><it.icon size={13} /></span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{it.cat}</span>
                            <ChevronRight size={13} className="ml-auto text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <div className="text-[13px] font-bold text-white tracking-tight mb-1">{it.n}</div>
                        <div className="text-[11px] text-slate-500 leading-snug line-clamp-2">{it.d}</div>
                    </button>
                ))}
            </div>
            {filtered.length === 0 && <div className="text-center py-12 text-slate-500 text-sm">No features match “{q}”.</div>}

            {/* detail modal */}
            {sel && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm vqf-in" onClick={() => setSel(null)}>
                    <div className="relative max-w-lg w-full rounded-3xl border border-white/10 bg-[#0b0a1c] p-7 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-t-3xl" />
                        <button onClick={() => setSel(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400"><X size={16} /></button>
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${CAT_COLOR[sel.color]}`}><sel.icon size={22} /></span>
                            <div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{sel.cat}</div>
                                <h3 className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{sel.n}</h3>
                            </div>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[15px] mb-5">{sel.d}</p>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                            <span className="text-[12px] text-slate-400">Included in VenQore — verified by the same double-entry engine that powers every number.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── anchor nav pill ─────────────────────────────────────────────────────── */
const JumpPill = ({ href, icon: Ic, children }) => (
    <a href={href} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[11px] font-bold text-slate-300 hover:text-white hover:border-indigo-400/40 hover:bg-white/[0.06] transition-all">
        <Ic size={13} className="text-indigo-300" /> {children}
    </a>
);

/* ── Demo section wrapper ────────────────────────────────────────────────── */
const DemoSection = ({ id, eyebrow, icon: Ic, title, accent, lead, hero, children }) => (
    <section id={id} className="vqf-anchor py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
            <RevealOnScroll>
                <div className="text-center mb-10 max-w-3xl mx-auto">
                    <SectionLabel icon={Ic}>{eyebrow}</SectionLabel>
                    {hero && <div className="inline-block ml-2 mb-8 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 text-[10px] font-black tracking-widest uppercase align-middle">★ Hero feature</div>}
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-[0.95] font-display">{title}</h2>
                    <p className="text-slate-400 text-base md:text-lg mt-5">{lead}</p>
                </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>{children}</RevealOnScroll>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Features() {
    const heroStats = [
        { e: TOTAL_FEATURES, s: '+', l: 'Features' },
        { e: 40, s: '+', l: 'Reports' },
        { e: 12, s: '', l: 'Core Modules' },
        { e: 6, s: '', l: 'Live Demos' },
    ];
    return (
        <MarketingLayout title="Features — VenQore" description="Explore every VenQore feature with live, interactive demos of the real product — Reports, POS, Smart Capture AI, VenSynQ, Growth Engine and Cookbook — plus a searchable catalog of all 226+ capabilities.">
            {/* HERO */}
            <section className="relative pt-36 md:pt-44 pb-12 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <RevealOnScroll><SectionLabel icon={Layers}>The whole machine</SectionLabel></RevealOnScroll>
                    <RevealOnScroll delay={0.08}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 font-display">
                            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Don’t take our word.</span><br />
                            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent vq-text-glow">See it run.</span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.16}>
                        <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                            Six of VenQore’s flagship tools — playable right here as guided simulations of the real product. Then browse every one of the <span className="text-white font-semibold">{TOTAL_FEATURES}+ features</span>, each explained in a click.
                        </p>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.24}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-12 border-t border-white/[0.06] pt-8">
                            {heroStats.map((s, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-3xl md:text-4xl font-black text-white tracking-tighter font-display"><Num end={s.e} />{s.s}</div>
                                    <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.22em] mt-1">{s.l}</div>
                                </div>
                            ))}
                        </div>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.3}>
                        <div className="flex flex-wrap justify-center gap-2 mt-10">
                            <JumpPill href="#reports" icon={BarChart3}>Reports</JumpPill>
                            <JumpPill href="#pos" icon={ShoppingCart}>POS</JumpPill>
                            <JumpPill href="#capture" icon={ScanBarcode}>Smart Capture</JumpPill>
                            <JumpPill href="#vensynq" icon={Globe}>VenSynQ</JumpPill>
                            <JumpPill href="#growth" icon={Cpu}>Growth Engine</JumpPill>
                            <JumpPill href="#cookbook" icon={Factory}>Cookbook</JumpPill>
                            <JumpPill href="#all" icon={Layers}>All {TOTAL_FEATURES}</JumpPill>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* DEMO 1 · REPORTS (hero, first) */}
            <DemoSection id="reports" eyebrow="Reporting Engine" icon={BarChart3} accent="emerald" hero
                title={<>Reports that <span className="text-emerald-400">never disagree.</span></>}
                lead="40+ statements from one verified ledger. Here’s the live Profit & Loss — switch periods, then let AI read it for you.">
                <ProfitLossDemo />
            </DemoSection>

            {/* DEMO 2 · POS */}
            <DemoSection id="pos" eyebrow="Point of Sale" icon={ShoppingCart} accent="indigo" hero
                title={<>Ring up a sale <span className="text-indigo-400">right now.</span></>}
                lead="This is the real POS. Add products, change quantities, pick a payment method and complete the sale — nothing is saved, it’s yours to play with.">
                <PosInvoiceDemo />
            </DemoSection>

            {/* DEMO 3 · SMART CAPTURE */}
            <DemoSection id="capture" eyebrow="Smart Capture · AI" icon={ScanBarcode} accent="violet" hero
                title={<>Snap it. Say it. <span className="text-violet-400">Booked.</span></>}
                lead="Photograph a supplier bill or speak a sale out loud. Your own AI key reads it, figures out the transaction type, and matches every line to your catalog.">
                <SmartCaptureDemo />
            </DemoSection>

            {/* DEMO 4 · VENSYNQ */}
            <DemoSection id="vensynq" eyebrow="VenSynQ · Multi-Channel" icon={Globe} accent="blue" hero
                title={<>Every marketplace, <span className="text-blue-400">one truth.</span></>}
                lead="Amazon, eBay, TikTok, Etsy and WooCommerce in a single command center — real net margin after fees, live inventory status, and which channel actually makes you money.">
                <VenSynQDemo />
            </DemoSection>

            {/* DEMO 5 · GROWTH ENGINE */}
            <DemoSection id="growth" eyebrow="AI Growth Engine" icon={Cpu} accent="violet" hero
                title={<>It watches, <span className="text-violet-400">so you can act.</span></>}
                lead="Three models run continuously — predicting stockouts, flagging churn and timing customer returns — then hand you the next action.">
                <GrowthEngineDemo />
            </DemoSection>

            {/* DEMO 6 · COOKBOOK */}
            <DemoSection id="cookbook" eyebrow="Cookbook · Manufacturing" icon={Factory} accent="amber" hero
                title={<>Build products from <span className="text-amber-400">recipes.</span></>}
                lead="Define a Bill of Materials once. Produce a batch — or sell a composite item and watch raw stock deduct automatically, costed by real FIFO.">
                <CookbookDemo />
            </DemoSection>

            {/* ALL FEATURES */}
            <section id="all" className="vqf-anchor py-20 md:py-28 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-12 max-w-3xl mx-auto">
                            <SectionLabel icon={Layers}>The complete catalog</SectionLabel>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-[0.95] font-display">All {TOTAL_FEATURES}+ features.<br /><span className="text-indigo-400">Every one explained.</span></h2>
                            <p className="text-slate-400 text-base md:text-lg mt-5">Search, filter by area, and click any feature to read exactly what it does.</p>
                        </div>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.1}><FeatureExplorer /></RevealOnScroll>
                </div>
            </section>

            {/* CTA */}
            <section className="py-28 md:py-36 px-6 text-center">
                <div className="max-w-4xl mx-auto relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                    <RevealOnScroll>
                        <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[0.95] relative z-10 font-display">Now run it on <span className="text-indigo-400">your numbers.</span></h2>
                        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed relative z-10">14-day free trial · full access · no credit card · live in 15 minutes.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <MagneticButton href="/register" variant="primary">Start Free Trial <ArrowRight size={16} /></MagneticButton>
                            <MagneticButton href="/demo" variant="ghost">Launch Live Demo</MagneticButton>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* local demo keyframes */}
            <style>{`
                .vqf-anchor { scroll-margin-top: 100px; }
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
        </MarketingLayout>
    );
}

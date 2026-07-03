import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Link } from '@inertiajs/react';
import {
    ArrowRight, ScanBarcode, Boxes, Calculator, BarChart3, ShoppingCart, Users,
    Building2, ShieldCheck, Factory, Gift, Plug, ClipboardList, WifiOff, Check,
    MessageCircle, Sparkles, Mic,
} from 'lucide-react';
import MarketingLayout, {
    RevealOnScroll, EntryLabel, LedgerFigure, Btn, useScrollReveal,
    useEnhancedCapability, useReducedMotion,
} from './Marketing/Shared/MarketingLayout';

/* ═══════════════════════════════════════════════════════════════════════════
   VENQORE HOME — "The Ledger" (2026-07-03)
   Dark cover → the book opens → paper entries → dark back cover.
   One signature 3D moment (The Ledger Engine), everything else quiet.
   Content-first: crawler HTML comes from MarketingSeo (server-rendered);
   this page renders full text + a composed SVG instantly; three.js arrives
   later, only on capable devices, as a cross-fade. See DESIGN_NOTES.md.
   ═══════════════════════════════════════════════════════════════════════════ */

const LedgerEngineScene = React.lazy(() => import('./Marketing/Shared/LedgerEngineScene'));

/* ── Static fallback / first paint: the same idea, drawn ───────────────────
   Two equal columns, a level brass beam, the Qore, the stream. This is the
   complete experience on low-end devices — an illustration, not a hole. */
const LedgerBalanceSVG = () => (
    <svg viewBox="0 0 560 420" className="w-full h-full" role="img"
        aria-label="Diagram: each transaction entering VenQore becomes a debit and a credit — two columns of equal height under a perfectly level beam. Trial balance zero, always.">
        <defs>
            <linearGradient id="vq-cube" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7FE9CE" /><stop offset="1" stopColor="#2fa88e" />
            </linearGradient>
            <linearGradient id="vq-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7FE9CE" stopOpacity="0.14" /><stop offset="1" stopColor="#7FE9CE" stopOpacity="0" />
            </linearGradient>
        </defs>

        {/* ambient glow */}
        <ellipse cx="290" cy="240" rx="250" ry="150" fill="url(#vq-glow)" />

        {/* stream of incoming transactions */}
        {[[492, 96, 0.9], [452, 122, 0.7], [412, 148, 0.55], [372, 172, 0.4]].map(([x, y, o], i) => (
            <rect key={i} x={x} y={y} width="17" height="17" rx="3" fill="url(#vq-cube)" opacity={o} />
        ))}

        {/* the Qore — lattice cube, echo of the logo */}
        <g transform="translate(318,196)">
            <rect x="-34" y="-34" width="68" height="68" rx="8" fill="none" stroke="#7FE9CE" strokeOpacity="0.5" strokeWidth="1.5" />
            <rect x="-16" y="-16" width="32" height="32" rx="5" fill="#7FE9CE" opacity="0.92" />
            {[[-30, -30], [14, -30], [-30, 14], [14, 14]].map(([x, y], i) => (
                <rect key={i} x={x} y={y} width="16" height="16" rx="3" fill="#1E7E82" />
            ))}
        </g>

        {/* split paths: one in, two out */}
        <path d="M284 196 C 220 196, 210 150, 148 128" fill="none" stroke="#7FE9CE" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 6" />
        <path d="M284 196 C 230 208, 226 150, 212 130" fill="none" stroke="#7FE9CE" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 6" />

        {/* the two columns — always equal */}
        {[128, 192].map((cx, col) => (
            <g key={col}>
                {[0, 1, 2, 3, 4, 5].map((row) => (
                    <rect key={row} x={cx - 21} y={150 + row * 38} width="42" height="32" rx="5"
                        fill="url(#vq-cube)" opacity={0.95 - row * 0.11} />
                ))}
            </g>
        ))}

        {/* base plates + level brass beam */}
        <rect x="96" y="382" width="64" height="5" rx="2.5" fill="#C4A468" opacity="0.85" />
        <rect x="160" y="382" width="64" height="5" rx="2.5" fill="#C4A468" opacity="0.85" />
        <rect x="88" y="128" width="144" height="6" rx="3" fill="#C4A468" />
        <circle cx="160" cy="131" r="8" fill="none" stroke="#C4A468" strokeWidth="2" />
        <circle cx="160" cy="131" r="2.6" fill="#C4A468" />

        {/* Dr / Cr labels */}
        <text x="128" y="412" textAnchor="middle" fill="#7FE9CE" opacity="0.75" fontSize="13" fontFamily="'IBM Plex Mono', monospace">DR</text>
        <text x="192" y="412" textAnchor="middle" fill="#7FE9CE" opacity="0.75" fontSize="13" fontFamily="'IBM Plex Mono', monospace">CR</text>
    </svg>
);

/* ── Hero visual: SVG immediately; 3D cross-fades in when earned ─────────── */
const EngineVisual = () => {
    const capable = useEnhancedCapability();
    const containerRef = useRef(null);
    const [inView, setInView] = useState(true);
    const [tabVisible, setTabVisible] = useState(true);
    const [sceneReady, setSceneReady] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
        io.observe(el);
        const onVis = () => setTabVisible(!document.hidden);
        document.addEventListener('visibilitychange', onVis);
        return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-[380px] sm:h-[460px] lg:h-[540px]" >
            <div className={`absolute inset-0 transition-opacity duration-1000 ${sceneReady ? 'opacity-0' : 'opacity-100'}`}>
                <LedgerBalanceSVG />
            </div>
            {capable && (
                <div className={`absolute inset-0 transition-opacity duration-1000 ${sceneReady ? 'opacity-100' : 'opacity-0'}`}
                    onTransitionEnd={undefined}>
                    <ErrorQuiet onReady={() => setSceneReady(true)}>
                        <Suspense fallback={null}>
                            <SceneMount active={inView && tabVisible} onReady={() => setSceneReady(true)} />
                        </Suspense>
                    </ErrorQuiet>
                </div>
            )}
            {/* HUD — real text, real promise */}
            <div className="absolute -bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                <span className="font-mono text-[11px] sm:text-xs tracking-[0.3em] uppercase text-[#C4A468] bg-[rgba(7,22,20,0.72)] px-4 py-2 rounded-full border border-[rgba(196,164,104,0.25)]">
                    Trial balance 0.00 · always
                </span>
            </div>
        </div>
    );
};

const SceneMount = ({ active, onReady }) => {
    useEffect(() => {
        const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
        return () => cancelAnimationFrame(id);
    }, [onReady]);
    return <LedgerEngineScene active={active} />;
};

/* If the 3D layer throws for any reason, the SVG simply remains. */
class ErrorQuiet extends React.Component {
    constructor(props) { super(props); this.state = { failed: false }; }
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { /* deliberately silent — fallback is the design */ }
    render() { return this.state.failed ? null : this.props.children; }
}

/* ── The journal entry that posts itself (Entry 02) ────────────────────────
   DOM + CSS only. Reduced motion sees it complete. */
const JOURNAL_ROWS = [
    { account: 'Cash in drawer', dr: '1,250.00', cr: '' },
    { account: 'Sales revenue', dr: '', cr: '1,190.48' },
    { account: 'Sales tax payable', dr: '', cr: '59.52' },
    { account: 'Cost of goods sold', dr: '830.00', cr: '' },
    { account: 'Inventory · FIFO batch #218', dr: '', cr: '830.00' },
];

const JournalDemo = () => {
    const [ref, visible] = useScrollReveal({ threshold: 0.35 });
    const reduced = useReducedMotion();
    const show = visible || reduced;
    return (
        <div ref={ref} className="rounded-2xl border border-[rgba(13,33,29,0.15)] bg-white/70 overflow-hidden shadow-[0_18px_50px_-30px_rgba(13,33,29,0.35)]">
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[rgba(13,33,29,0.1)] bg-[rgba(13,33,29,0.03)]">
                <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[rgba(13,33,29,0.6)]">Journal · JE-10482</span>
                <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[rgba(13,33,29,0.45)]">Sale · POS Terminal 1</span>
            </div>
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-[rgba(13,33,29,0.1)]">
                        <th scope="col" className="px-5 sm:px-6 py-3 font-mono text-[10px] tracking-[0.24em] uppercase text-[rgba(13,33,29,0.5)] font-medium">Account</th>
                        <th scope="col" className="px-3 py-3 text-right font-mono text-[10px] tracking-[0.24em] uppercase text-[rgba(13,33,29,0.5)] font-medium">Debit</th>
                        <th scope="col" className="px-5 sm:px-6 py-3 text-right font-mono text-[10px] tracking-[0.24em] uppercase text-[rgba(13,33,29,0.5)] font-medium">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    {JOURNAL_ROWS.map((row, i) => (
                        <tr key={row.account} className="border-b border-[rgba(13,33,29,0.06)]" style={{
                            opacity: show ? 1 : 0,
                            transform: show ? 'none' : 'translateY(8px)',
                            transition: `opacity .4s ease ${0.15 + i * 0.22}s, transform .4s ease ${0.15 + i * 0.22}s`,
                        }}>
                            <td className="px-5 sm:px-6 py-3 text-[13.5px] sm:text-sm text-[#0D211D]">{row.account}</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums text-[13px] sm:text-sm text-[#0D211D]">{row.dr}</td>
                            <td className="px-5 sm:px-6 py-3 text-right font-mono tabular-nums text-[13px] sm:text-sm text-[#0D211D]">{row.cr}</td>
                        </tr>
                    ))}
                    <tr style={{
                        opacity: show ? 1 : 0,
                        transition: `opacity .5s ease ${0.3 + JOURNAL_ROWS.length * 0.22}s`,
                    }}>
                        <td className="px-5 sm:px-6 py-3.5 font-mono text-[11px] tracking-[0.2em] uppercase text-[rgba(13,33,29,0.55)]">Totals</td>
                        <td className="px-3 py-3.5 text-right font-mono tabular-nums text-sm font-semibold text-[#0D211D]">2,080.00</td>
                        <td className="px-5 sm:px-6 py-3.5 text-right font-mono tabular-nums text-sm font-semibold text-[#0D211D]">2,080.00</td>
                    </tr>
                </tbody>
            </table>
            <div className="px-5 sm:px-6 py-4 border-t border-[rgba(13,33,29,0.1)] flex items-center gap-2.5"
                style={{ opacity: show ? 1 : 0, transition: `opacity .5s ease ${0.55 + JOURNAL_ROWS.length * 0.22}s` }}>
                <Check size={15} className="text-[#1E7E82]" aria-hidden="true" />
                <span className="font-mono text-[11px] tracking-[0.26em] uppercase text-[#1E7E82] font-medium">Balanced · posted · immutable</span>
            </div>
        </div>
    );
};

/* ── Offline diagram (Entry 03) — drawn, quiet ────────────────────────────── */
const OfflineDiagram = () => (
    <svg viewBox="0 0 520 150" className="w-full max-w-xl" role="img"
        aria-label="Diagram: the POS till keeps a local queue on the device and syncs to the cloud when the connection returns.">
        <defs>
            <marker id="vq-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 L8 4 L0 8 z" fill="#1E7E82" />
            </marker>
        </defs>
        {[
            { x: 10, label1: 'THE TILL', label2: 'sells offline' },
            { x: 195, label1: 'LOCAL QUEUE', label2: 'on this device' },
            { x: 380, label1: 'THE LEDGER', label2: 'syncs when back' },
        ].map((b) => (
            <g key={b.x}>
                <rect x={b.x} y="30" width="130" height="66" rx="12" fill="rgba(13,33,29,0.035)" stroke="rgba(13,33,29,0.25)" strokeWidth="1.3" />
                <text x={b.x + 65} y="58" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="12" fill="#0D211D" letterSpacing="2">{b.label1}</text>
                <text x={b.x + 65} y="78" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="11" fill="rgba(13,33,29,0.55)">{b.label2}</text>
            </g>
        ))}
        <line x1="142" y1="63" x2="192" y2="63" stroke="#1E7E82" strokeWidth="1.6" markerEnd="url(#vq-arr)" />
        <line x1="327" y1="63" x2="377" y2="63" stroke="#1E7E82" strokeWidth="1.6" strokeDasharray="5 5" markerEnd="url(#vq-arr)" />
        <text x="352" y="48" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="10" fill="#1E7E82" letterSpacing="1">WHEN ONLINE</text>
        <text x="75" y="122" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="11" fill="rgba(13,33,29,0.5)">barcode · split payments · hold bills</text>
        <text x="445" y="122" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="11" fill="rgba(13,33,29,0.5)">nothing lost, nothing doubled</text>
    </svg>
);

/* ── Module grid (Entry 05) ────────────────────────────────────────────────── */
const MODULES = [
    { icon: ScanBarcode, name: 'POS terminal', desc: 'Offline-first checkout, barcode, hold & recall, split payments, thermal printing.' },
    { icon: Boxes, name: 'Inventory', desc: 'FIFO batches with expiry, serials, variants, multi-unit, composite recipes.' },
    { icon: Calculator, name: 'Accounting', desc: 'Automatic balanced journals, immutable posted history, bank reconciliation.' },
    { icon: BarChart3, name: 'Reports', desc: '40+ statements — P&L, balance sheet, cash flow, aging — all ledger-true.' },
    { icon: ShoppingCart, name: 'Purchases', desc: 'Purchase orders, partial receiving, supplier bills, debit notes.' },
    { icon: Users, name: 'Customers & khata', desc: 'Credit limits, running balances, WhatsApp reminders for what’s owed.' },
    { icon: Building2, name: 'Multi-store', desc: 'Branches, warehouses and transfers under one owner view.' },
    { icon: ShieldCheck, name: 'Staff & roles', desc: 'Seven roles, per-feature permissions, full audit log.' },
    { icon: Factory, name: 'Manufacturing', desc: 'Recipes and production runs that consume raw stock correctly.' },
    { icon: Gift, name: 'Loyalty & gift cards', desc: 'Points, digital gift cards, campaigns that post real entries.' },
    { icon: Plug, name: 'WooCommerce', desc: 'Stock synced out, online orders posted in — matched by SKU.' },
    { icon: ClipboardList, name: 'Expenses & funds', desc: 'Expense tracking, funds, bank accounts — one money picture.' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
    return (
        <MarketingLayout
            title="VenQore — Offline-First POS & ERP with Verified Double-Entry Accounting"
            description="VenQore is the point of sale that keeps real books. Every sale writes a balanced double-entry journal — verified by 636 automated tests. Try the live demo, no signup."
        >
            {/* ══ HERO — the dark cover, the one cinematic moment ══ */}
            <section className="relative pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
                {/* single quiet ambient — a teal dawn behind the engine, nothing else */}
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(90% 70% at 68% 30%, rgba(30,126,130,0.28) 0%, rgba(7,22,20,0) 60%)' }} />
                <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    <div className="max-w-xl">
                        <p className="font-mono text-[11px] sm:text-xs tracking-[0.34em] uppercase text-[#7FE9CE] mb-7">
                            Offline-first POS + ERP
                        </p>
                        <h1 className="font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.2rem] font-medium text-[#F5F2E9] mb-7">
                            The books are<br />always right.
                        </h1>
                        <p className="text-[rgba(245,242,233,0.72)] text-base sm:text-lg leading-relaxed mb-10 max-w-lg">
                            VenQore is a point of sale with a real accounting engine underneath.
                            Every sale, purchase and return posts a correct, balanced journal
                            entry on its own — while the till keeps running, internet or not.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <Btn href="/demo" variant="primary" surface="dark">
                                Open the live demo <ArrowRight size={16} aria-hidden="true" />
                            </Btn>
                            <Btn href="/register" variant="ghost" surface="dark">
                                Start free · 14 days
                            </Btn>
                        </div>
                        <p className="text-[rgba(245,242,233,0.42)] text-[13px]">
                            No signup for the demo. No card for the trial.
                        </p>
                    </div>
                    <EngineVisual />
                </div>

                {/* proof strip — a journal line of honest figures */}
                <div className="relative max-w-7xl mx-auto mt-20 sm:mt-24 pt-9 border-t border-[rgba(245,242,233,0.1)]">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <LedgerFigure value="636" label="automated tests, green" />
                        <LedgerFigure value="0.00" label="trial-balance drift" />
                        <LedgerFigure value="40+" label="reports · one ledger" />
                        <LedgerFigure value="24/7" label="the till, online or not" />
                    </div>
                </div>
            </section>

            {/* ══ THE BOOK OPENS — paper pages ══ */}
            <div className="vq-paper-ruled text-[#0D211D] rounded-t-[2.5rem] relative">

                {/* Entry 01 — the problem */}
                <section className="max-w-4xl mx-auto px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
                    <RevealOnScroll>
                        <EntryLabel number={1}>The problem</EntryLabel>
                        <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight font-medium mb-7">
                            Most POS systems count sales.<br className="hidden sm:block" />
                            Almost none keep books.
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-8 text-[15px] leading-relaxed text-[rgba(13,33,29,0.75)]">
                            <p>
                                The till says what you sold. It doesn&rsquo;t say what you earned, what
                                the stock you sold actually cost, who still owes you, or whether the
                                cash in the drawer matches the day. So the real accounting happens
                                later — in a notebook, in a spreadsheet, in your head at midnight.
                            </p>
                            <p>
                                VenQore closes that gap at the source: the sale itself writes the
                                accounting. Not a summary, not an export — a proper double-entry
                                journal, posted the moment the receipt prints. There is no
                                &ldquo;later&rdquo;. The books are simply already done, and already right.
                            </p>
                        </div>
                    </RevealOnScroll>
                </section>

                {/* Entry 02 — double-entry, automatic */}
                <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 vq-margin-rule">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <RevealOnScroll>
                            <EntryLabel number={2}>Double-entry, automatic</EntryLabel>
                            <h2 className="font-display text-3xl sm:text-4xl leading-tight font-medium mb-6">
                                One sale.<br />Five correct lines.<br />Zero effort.
                            </h2>
                            <p className="text-[15px] leading-relaxed text-[rgba(13,33,29,0.75)] max-w-md mb-8">
                                Ring up a sale and this is what VenQore writes — cash, revenue, tax,
                                cost of goods at true FIFO cost, inventory relieved from the exact
                                batch. Debits equal credits, every time, because the engine cannot
                                post anything else. Your accountant gets a ledger, not a shoebox.
                            </p>
                            <Link href="/features" className="inline-flex items-center gap-2 text-[#1E7E82] font-medium text-[15px] hover:gap-3 transition-all">
                                See everything it posts <ArrowRight size={15} aria-hidden="true" />
                            </Link>
                        </RevealOnScroll>
                        <JournalDemo />
                    </div>
                </section>

                {/* Entry 03 — offline-first */}
                <section className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
                    <RevealOnScroll>
                        <EntryLabel number={3}>Offline-first</EntryLabel>
                        <h2 className="font-display text-3xl sm:text-4xl leading-tight font-medium mb-6 flex items-center gap-4">
                            The internet can leave.<span className="inline-flex"><WifiOff size={30} className="text-[#1E7E82]" aria-hidden="true" /></span><br />
                        </h2>
                        <h2 className="font-display text-3xl sm:text-4xl leading-tight font-medium mb-7 -mt-4">The till stays open.</h2>
                        <p className="text-[15px] leading-relaxed text-[rgba(13,33,29,0.75)] max-w-2xl mb-10">
                            The POS keeps its own copy of your products on the device. Power cut
                            the router, lose the fiber, sell from a basement — checkout keeps
                            working at full speed. Everything queues locally and posts to the
                            ledger when the connection returns. Nothing lost, nothing doubled.
                        </p>
                        <OfflineDiagram />
                    </RevealOnScroll>
                </section>

                {/* Entry 04 — the reconciliation gate */}
                <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 vq-margin-rule">
                    <div className="grid lg:grid-cols-5 gap-12">
                        <RevealOnScroll className="lg:col-span-3">
                            <EntryLabel number={4}>The reconciliation gate</EntryLabel>
                            <h2 className="font-display text-3xl sm:text-4xl leading-tight font-medium mb-6">
                                We don&rsquo;t ask you to trust it.<br />We test it. 636 times.
                            </h2>
                            <p className="text-[15px] leading-relaxed text-[rgba(13,33,29,0.75)] max-w-xl mb-6">
                                Every build of VenQore has to pass an automated reconciliation gate
                                before it ships: each of the 40+ reports is recomputed straight from
                                the journal and must match the ledger to the cent. A sale that
                                wouldn&rsquo;t balance can&rsquo;t even be saved — the engine refuses it.
                            </p>
                            <p className="text-[15px] leading-relaxed text-[rgba(13,33,29,0.75)] max-w-xl">
                                Posted history is immutable. Corrections are new entries, the way
                                real accounting has worked for five hundred years — so an audit
                                trail exists for everything, forever.
                            </p>
                        </RevealOnScroll>
                        <RevealOnScroll delay={0.1} className="lg:col-span-2">
                            <div className="rounded-2xl border border-[rgba(13,33,29,0.15)] bg-white/70 p-7">
                                <p className="font-mono text-[11px] tracking-[0.26em] uppercase text-[rgba(13,33,29,0.5)] mb-6">Before every release</p>
                                <ul className="space-y-4">
                                    {[
                                        'Trial balance recomputed — must equal 0.00',
                                        'Every report re-derived from raw journals',
                                        'FIFO cost layers replayed and matched',
                                        'Posted entries verified untouched',
                                        '636 tests green, or nothing ships',
                                    ].map((line) => (
                                        <li key={line} className="flex items-start gap-3 text-sm leading-relaxed text-[rgba(13,33,29,0.8)]">
                                            <Check size={15} className="text-[#1E7E82] mt-0.5 shrink-0" aria-hidden="true" />
                                            {line}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </RevealOnScroll>
                    </div>
                </section>

                {/* Entry 05 — what's in the box */}
                <section className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
                    <RevealOnScroll>
                        <EntryLabel number={5}>What&rsquo;s in the box</EntryLabel>
                        <h2 className="font-display text-3xl sm:text-4xl leading-tight font-medium mb-4">
                            The whole back office,<br />writing to one ledger.
                        </h2>
                        <p className="text-[15px] text-[rgba(13,33,29,0.7)] max-w-xl mb-12">
                            226+ capabilities. Not one of them keeps its own private numbers —
                            everything posts to the same verified books.
                        </p>
                    </RevealOnScroll>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {MODULES.map((m, i) => (
                            <RevealOnScroll key={m.name} delay={Math.min(i * 0.04, 0.3)}>
                                <div className="h-full rounded-2xl border border-[rgba(13,33,29,0.12)] bg-white/60 p-6 transition-colors duration-300 hover:border-[#1E7E82]">
                                    <m.icon size={20} className="text-[#1E7E82] mb-4" aria-hidden="true" />
                                    <h3 className="font-semibold text-[15px] mb-2">{m.name}</h3>
                                    <p className="text-[13px] leading-relaxed text-[rgba(13,33,29,0.65)]">{m.desc}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </section>

                {/* Entry 06 — what's next */}
                <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 vq-margin-rule">
                    <RevealOnScroll>
                        <EntryLabel number={6}>In the workshop</EntryLabel>
                        <h2 className="font-display text-3xl sm:text-4xl leading-tight font-medium mb-12">
                            Two engines being fitted now.
                        </h2>
                    </RevealOnScroll>
                    <div className="grid md:grid-cols-2 gap-6">
                        <RevealOnScroll>
                            <Link href="/vensynq" className="group block h-full rounded-2xl border border-[rgba(13,33,29,0.12)] bg-white/60 p-8 transition-colors duration-300 hover:border-[#1E7E82]">
                                <div className="flex items-center justify-between mb-5">
                                    <Plug size={22} className="text-[#1E7E82]" aria-hidden="true" />
                                    <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#1E7E82] border border-[rgba(30,126,130,0.3)] rounded-full px-3 py-1">WooCommerce live</span>
                                </div>
                                <h3 className="font-display text-2xl font-medium mb-3">VenSynQ</h3>
                                <p className="text-sm leading-relaxed text-[rgba(13,33,29,0.68)] mb-5">
                                    One inventory, one ledger, every channel. WooCommerce sync is live
                                    today; Amazon, eBay and TikTok Shop are on the bench.
                                </p>
                                <span className="inline-flex items-center gap-2 text-[#1E7E82] text-sm font-medium group-hover:gap-3 transition-all">
                                    See how it works <ArrowRight size={14} aria-hidden="true" />
                                </span>
                            </Link>
                        </RevealOnScroll>
                        <RevealOnScroll delay={0.08}>
                            <Link href="/smartcapture" className="group block h-full rounded-2xl border border-[rgba(13,33,29,0.12)] bg-white/60 p-8 transition-colors duration-300 hover:border-[#1E7E82]">
                                <div className="flex items-center justify-between mb-5">
                                    <span className="flex gap-2"><Sparkles size={22} className="text-[#1E7E82]" aria-hidden="true" /><Mic size={22} className="text-[#1E7E82]" aria-hidden="true" /></span>
                                    <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#C4A468] border border-[rgba(196,164,104,0.35)] rounded-full px-3 py-1">Coming soon</span>
                                </div>
                                <h3 className="font-display text-2xl font-medium mb-3">SmartCapture</h3>
                                <p className="text-sm leading-relaxed text-[rgba(13,33,29,0.68)] mb-5">
                                    Photograph a paper invoice or say &ldquo;sold 5 bags of rice to Ali on
                                    credit&rdquo; — get a structured, ledger-ready transaction to review.
                                </p>
                                <span className="inline-flex items-center gap-2 text-[#1E7E82] text-sm font-medium group-hover:gap-3 transition-all">
                                    Join the waitlist <ArrowRight size={14} aria-hidden="true" />
                                </span>
                            </Link>
                        </RevealOnScroll>
                    </div>
                </section>

                {/* Entry 07 — pricing */}
                <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
                    <RevealOnScroll>
                        <EntryLabel number={7}>Pricing</EntryLabel>
                        <h2 className="font-display text-3xl sm:text-4xl leading-tight font-medium mb-4">
                            Every plan keeps real books.
                        </h2>
                        <p className="text-[15px] text-[rgba(13,33,29,0.7)] max-w-xl mb-12">
                            The double-entry engine and the P&amp;L are never paywalled. 14-day free
                            trial on everything, no credit card.
                        </p>
                    </RevealOnScroll>
                    <div className="grid md:grid-cols-3 gap-6 mb-10">
                        {[
                            { name: 'Starter', price: '$36', pk: 'Rs 1,100', line: '1 location · 3 staff · 1,000 SKUs', best: false },
                            { name: 'Growth', price: '$63', pk: 'Rs 1,800', line: '3 locations · 10 staff · 10,000 SKUs', best: true },
                            { name: 'Enterprise', price: '$129', pk: 'Rs 5,300', line: '10 locations · 50 staff · 50,000 SKUs', best: false },
                        ].map((p, i) => (
                            <RevealOnScroll key={p.name} delay={i * 0.06}>
                                <div className={`h-full rounded-2xl p-8 border transition-colors duration-300 ${p.best ? 'bg-[#0D211D] text-[#F5F2E9] border-[#0D211D]' : 'bg-white/60 border-[rgba(13,33,29,0.12)] hover:border-[#1E7E82]'}`}>
                                    <div className="flex items-baseline justify-between mb-1">
                                        <h3 className={`font-display text-xl font-medium ${p.best ? 'text-[#F5F2E9]' : ''}`}>{p.name}</h3>
                                        {p.best && <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#7FE9CE]">Most chosen</span>}
                                    </div>
                                    <p className={`font-mono tabular-nums text-4xl font-semibold mt-4 mb-1 ${p.best ? 'text-[#7FE9CE]' : 'text-[#0D211D]'}`}>{p.price}<span className="text-sm font-normal opacity-60">/mo</span></p>
                                    <p className={`font-mono text-xs mb-5 ${p.best ? 'text-[rgba(245,242,233,0.5)]' : 'text-[rgba(13,33,29,0.5)]'}`}>{p.pk}/mo in Pakistan</p>
                                    <p className={`text-[13px] leading-relaxed ${p.best ? 'text-[rgba(245,242,233,0.7)]' : 'text-[rgba(13,33,29,0.65)]'}`}>{p.line}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                    <RevealOnScroll>
                        <Link href="/pricing" className="inline-flex items-center gap-2 text-[#1E7E82] font-medium text-[15px] hover:gap-3 transition-all">
                            Full plan comparison, annual billing &amp; lifetime deals <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                    </RevealOnScroll>
                </section>

                {/* The founder's note — paper, signed */}
                <section className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
                    <RevealOnScroll>
                        <div className="rounded-2xl border border-[rgba(13,33,29,0.15)] bg-white/70 p-8 sm:p-12">
                            <EntryLabel>A note from the founder</EntryLabel>
                            <p className="font-display text-xl sm:text-2xl leading-relaxed text-[rgba(13,33,29,0.85)] italic mb-8">
                                &ldquo;I built VenQore for shops like the ones I grew up around — where
                                the till is busy, the margins are thin, and nobody has time to fix
                                books that a computer got wrong. If something in VenQore isn&rsquo;t
                                right, you message me and I fix it. That&rsquo;s the whole support
                                policy.&rdquo;
                            </p>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <p className="font-semibold text-[15px]">Abdullah</p>
                                    <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[rgba(13,33,29,0.5)]">Founder, VenQore</p>
                                </div>
                                <a href="https://wa.me/923091999489" className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full border border-[rgba(13,33,29,0.2)] text-sm font-medium text-[#0D211D] hover:border-[#1E7E82] hover:text-[#1E7E82] transition-colors">
                                    <MessageCircle size={15} aria-hidden="true" /> WhatsApp the founder
                                </a>
                            </div>
                        </div>
                    </RevealOnScroll>
                </section>
            </div>

            {/* ══ THE BACK COVER — dark close ══ */}
            <section className="relative py-24 sm:py-32 px-6 overflow-hidden">
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(70% 90% at 50% 110%, rgba(30,126,130,0.3) 0%, rgba(7,22,20,0) 65%)' }} />
                <div className="relative max-w-3xl mx-auto text-center">
                    <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#C4A468] mb-7">Closing entry</p>
                    <h2 className="font-display text-4xl sm:text-5xl leading-tight font-medium text-[#F5F2E9] mb-6">
                        Open the demo.<br />Audit us yourself.
                    </h2>
                    <p className="text-[rgba(245,242,233,0.65)] text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
                        A full store is running right now — sell something on the POS, then open
                        the P&amp;L and watch your sale sitting in it, balanced. No signup.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Btn href="/demo" variant="primary" surface="dark">
                            Open the live demo <ArrowRight size={16} aria-hidden="true" />
                        </Btn>
                        <Btn href="/register" variant="ghost" surface="dark">
                            Start your free trial
                        </Btn>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}

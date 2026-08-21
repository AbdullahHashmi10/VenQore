import React, { useState, useEffect, useRef } from 'react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel, GlassCard
} from './Shared/MarketingLayout';
import {
    BookOpen, ShieldCheck, Calculator, Boxes, Zap, ArrowRight, Sparkles,
    Fingerprint, Scale, Eye, Heart, Gauge, CheckCircle2, AlertTriangle,
    Search, Wallet, Lock, Quote, TrendingUp, Database, Activity, Lightbulb,
    Building2, Receipt, RefreshCw, Crosshair
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ABOUT — "We refused to guess."
   The story of why VenQore exists, the obsession with detail, and the
   engineering that makes the numbers trustworthy.
   ═══════════════════════════════════════════════════════════════════════════ */

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
function useInView(threshold = 0.3) {
    const ref = useRef(null);
    const [v, setV] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.unobserve(el); } }, { threshold });
        o.observe(el); return () => o.disconnect();
    }, [threshold]);
    return [ref, v];
}
const grp = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const Num = ({ end, prefix = '', suffix = '', dur = 1800 }) => {
    const reduced = usePRM();
    const [val, setVal] = useState(0);
    const [ref, v] = useInView(0.5);
    const ran = useRef(false);
    useEffect(() => {
        if (!v || ran.current) return; ran.current = true;
        if (reduced) { setVal(end); return; }
        const s = performance.now();
        const tick = (now) => { const p = Math.min((now - s) / dur, 1); setVal((1 - Math.pow(1 - p, 4)) * end); if (p < 1) requestAnimationFrame(tick); else setVal(end); };
        requestAnimationFrame(tick);
    }, [v, reduced, end, dur]);
    return <span ref={ref}>{prefix}{grp(val)}{suffix}</span>;
};

/* ── data ────────────────────────────────────────────────────────────────── */
const TRUTHS = [
    { ic: AlertTriangle, c: 'rose', t: 'Tax counted as revenue', d: "Most systems fold the VAT/GST you owe the government straight into your “revenue.” Your top line looks 10-20% bigger than it is." },
    { ic: Calculator, c: 'amber', t: 'Profit from a guessed cost', d: "Weighted-average costing overwrites what you actually paid. Every margin you read is built on a number that no longer exists." },
    { ic: Fingerprint, c: 'indigo', t: 'Books you can silently edit', d: "If a past sale can be changed with no reversal trail, that is not accounting — it is a spreadsheet pretending to be one." },
];
const DETAILS = [
    { ic: Zap, t: "Carts survive a power cut", d: "An active sale is saved to the device before the server even knows. Lights flicker, the bill is still there." },
    { ic: Boxes, t: "FIFO cost, per batch", d: "We track the real price of every batch you bought — never a blended average — so COGS is the truth." },
    { ic: Calculator, t: "Tax never inflates revenue", d: "Output tax is separated at the ledger level the instant a sale posts." },
    { ic: Lock, t: "Posted entries are immutable", d: "Corrections happen through balanced reversals, leaving a clean audit trail — not edits." },
    { ic: Eye, t: "Senior mode", d: "One toggle bumps every font 40% with high-contrast, traffic-light colors for tired eyes on long shifts." },
    { ic: Search, t: "Typo-tolerant search", d: "Cashiers find the product even when they misspell it. Queues do not wait for spelling." },
    { ic: ShieldCheck, t: "Negative-stock lock", d: "Optionally hard-block a sale when the shelf is empty, so your counts never silently go negative." },
    { ic: Receipt, t: "Receipts that cut clean", d: "Padding lines so totals always clear the thermal cutter — a tiny thing you would only notice if it were wrong." },
    { ic: Wallet, t: "Change-due, instantly", d: "The exact cash to hand back appears the moment payment is entered. No mental math at the counter." },
    { ic: Scale, t: "Reconciled to the cent", d: "Dashboard summaries are verified against the general ledger — if they ever disagreed, the build would fail." },
    { ic: RefreshCw, t: "Live across every terminal", d: "Sell on one register and every screen in the store updates instantly — no refresh, no drift." },
    { ic: Gauge, t: "Live in 15 minutes", d: "Type your store name and we seed units, taxes and categories for your industry. That is the whole setup." },
];
const TONE = {
    rose: { c: 'text-rose-400', b: 'bg-rose-500/[0.06] border-rose-500/15' },
    amber: { c: 'text-amber-400', b: 'bg-amber-500/[0.06] border-amber-500/15' },
    indigo: { c: 'text-brand-400', b: 'bg-brand-500/[0.06] border-brand-500/15' },
};
const TIMELINE = [
    { k: 'The frustration', d: 'Owners ringing up a thousand sales a day still could not answer one question: did I actually make money this month?' },
    { k: 'The decision', d: 'Instead of bolting reports onto a cash register, we chose to rebuild retail software on a real double-entry foundation.' },
    { k: 'The engine', d: 'A DECIMAL(20,4) ledger with a FIFO cost core — wrapped in 1,500+ automated tests so the math can never quietly drift.' },
    { k: 'The platform', d: '226+ features grew on top of that engine: POS, inventory, manufacturing, AI and 40+ reports — one connected system.' },
    { k: 'Today', d: 'From a single counter to multi-store operations, VenQore gives owners one number they can finally trust.' },
];
const PRINCIPLES = [
    { ic: Scale, t: 'Accuracy over approximation', d: 'If a number is not provably correct, it does not ship. The ledger is the source of truth, always.' },
    { ic: Zap, t: 'Speed without lies', d: 'Fast checkout and correct books are not a trade-off. You get both, or we have not finished.' },
    { ic: Crosshair, t: 'Every feature earns its place', d: 'Each capability traces back to a real problem a real operator hit on a real shop floor.' },
    { ic: Heart, t: 'The operator comes first', d: 'We design for the person at the counter at closing time — not for a slide in a sales deck.' },
    { ic: Fingerprint, t: 'Trust is non-negotiable', d: 'Immutable records, isolated stores, your data exportable any time. We never hold it hostage.' },
    { ic: Lightbulb, t: 'Sweat the small things', d: 'The details nobody markets are the ones that break — or save — a real business day.' },
];
const INDUSTRIES = ['Retail', 'Grocery', 'Food & Beverage', 'Fashion', 'Electronics', 'Wholesale', 'Pharmacy', 'Hardware', 'Manufacturing'];

/* ── animated timeline item ──────────────────────────────────────────────── */
const TimelineItem = ({ item, i, last }) => {
    const [ref, v] = useInView(0.5);
    return (
        <div ref={ref} className="relative pl-14 pb-10">
            {!last && <span className="absolute left-[18px] top-9 bottom-0 w-px bg-gradient-to-b from-brand-500/40 to-transparent" />}
            <span className={`absolute left-0 top-1 w-9 h-9 rounded-full border flex items-center justify-center text-[12px] font-bold transition-all duration-slower ${v ? 'bg-brand-500/15 border-brand-400/40 text-brand-200 scale-100' : 'bg-white/[0.02] border-line dark:border-white/10 text-ink-secondary scale-90'}`}
                style={{ transitionDelay: `${i * 0.05}s` }}>{i + 1}</span>
            <div style={{ opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(16px)', transition: 'opacity .7s cubic-bezier(0.22,1,0.36,1), transform .7s cubic-bezier(0.22,1,0.36,1)' }}>
                <h3 className="text-xl md:text-2xl font-bold text-ink tracking-tight font-display mb-2">{item.k}</h3>
                <p className="text-ink-muted leading-relaxed max-w-2xl">{item.d}</p>
            </div>
        </div>
    );
};

export default function About() {
    return (
        <MarketingLayout title="About — VenQore" description="We were tired of software that lies about your money — so we rebuilt retail on real accounting and obsessed over every detail in between. This is the VenQore story.">

            {/* ── HERO ─────────────────────────────────────────── */}
            <section className="relative pt-40 md:pt-48 pb-16 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <RevealOnScroll><SectionLabel icon={BookOpen}>Our story</SectionLabel></RevealOnScroll>
                    <RevealOnScroll delay={0.08}>
                        <h1 className="text-[2.5rem] xs:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] sm:leading-[0.9] mb-8 font-display">
                            <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">Most software guesses.</span><br />
                            <span className="vq-headline-grad vq-text-glow">We refused to.</span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.16}>
                        <p className="text-lg md:text-2xl text-ink-muted max-w-3xl mx-auto leading-relaxed font-medium">
                            VenQore began with one maddening problem: a shop could ring up a thousand sales a day and still not answer — <span className="text-ink font-semibold">did I actually make money?</span> So we rebuilt retail software on real accounting, and obsessed over every tiny detail in between.
                        </p>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.24}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                            <MagneticButton href="/demo" variant="primary">See it live <ArrowRight size={16} /></MagneticButton>
                            <MagneticButton href="/features" variant="ghost">Explore the platform</MagneticButton>
                        </div>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.3}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16 border-t border-white/[0.06] pt-10">
                            {[{ e: 226, s: '+', l: 'Features' }, { e: 1000, s: '+', l: 'Tests Passed' }, { e: 40, s: '+', l: 'Reports' }, { e: 5, s: '', l: 'Audit Layers' }].map((x, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-3xl md:text-4xl font-bold text-ink tracking-tighter font-display"><Num end={x.e} suffix={x.s} /></div>
                                    <div className="text-2xs text-ink-secondary font-bold uppercase tracking-[0.22em] mt-1">{x.l}</div>
                                </div>
                            ))}
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── THE PROBLEM ──────────────────────────────────── */}
            <section className="py-20 md:py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <GlassCard hover={false} padding="p-8 md:p-16" className="overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 text-white/[0.025] pointer-events-none"><Calculator size={240} strokeWidth={0.3} /></div>
                            <div className="relative z-10 max-w-4xl">
                                <SectionLabel icon={AlertTriangle}>The uncomfortable truth</SectionLabel>
                                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-ink mb-8 leading-[0.9] font-display">
                                    Your software has been<br /><span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent italic">lying to you.</span>
                                </h2>
                                <p className="text-lg md:text-xl text-ink-muted leading-relaxed max-w-3xl mb-12">
                                    Not on purpose — structurally. We lived these three lies for years before we decided to end them. They are the reason VenQore exists.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {TRUTHS.map((c, i) => (
                                        <RevealOnScroll key={i} delay={0.1 + i * 0.1}>
                                            <div className={`h-full p-7 rounded-2xl border ${TONE[c.c].b} transition-all duration-slower hover:-translate-y-1`}>
                                                <c.ic className={`${TONE[c.c].c} mb-5`} size={26} />
                                                <h4 className="text-ink font-bold mb-2.5 tracking-tight text-lg font-display">{c.t}</h4>
                                                <p className="text-ink-muted text-sm leading-relaxed">{c.d}</p>
                                            </div>
                                        </RevealOnScroll>
                                    ))}
                                </div>
                            </div>
                        </GlassCard>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── ATTENTION TO DETAIL ──────────────────────────── */}
            <section className="py-20 md:py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-14 max-w-3xl mx-auto">
                            <SectionLabel icon={Sparkles}>Attention to detail</SectionLabel>
                            <h2 className="text-4xl md:text-6xl font-bold text-ink tracking-tighter leading-[0.92] font-display">We sweat the small stuff —<br /><span className="text-brand-600 dark:text-brand-400">because you live in it.</span></h2>
                            <p className="text-ink-muted text-base md:text-lg mt-5">A real business day is a thousand tiny frictions. Most software ignores them. We treat each one as a feature worth building. Here are a few we obsess over.</p>
                        </div>
                    </RevealOnScroll>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DETAILS.map((d, i) => (
                            <RevealOnScroll key={i} delay={(i % 3) * 0.07}>
                                <div className="group h-full p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-brand-400/25 transition-all duration-slower hover:-translate-y-1">
                                    <div className="w-11 h-11 rounded-xl bg-brand-500/12 text-brand-300 flex items-center justify-center mb-4 group-hover:rotate-3 transition-transform duration-slower"><d.ic size={20} /></div>
                                    <h4 className="text-ink font-bold text-[15px] tracking-tight mb-1.5 font-display">{d.t}</h4>
                                    <p className="text-ink-muted text-[13px] leading-relaxed">{d.d}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ENGINEERING / REAL DEAL ──────────────────────── */}
            <section className="py-20 md:py-28 px-6 border-y border-line dark:border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <RevealOnScroll direction="right">
                        <SectionLabel icon={ShieldCheck}>Proof, not promises</SectionLabel>
                        <h2 className="text-4xl md:text-6xl font-bold text-ink tracking-tighter leading-[0.92] mb-6 font-display">Built like financial<br /><span className="text-emerald-600 dark:text-emerald-400">infrastructure.</span></h2>
                        <p className="text-ink-muted text-lg leading-relaxed mb-8 max-w-xl">
                            Anyone can claim accuracy. We make it verifiable. The accounting core is guarded by five layers of automated checks, and the whole system is re-tested on every release — because trust you cannot measure is just marketing.
                        </p>
                        <div className="space-y-3">
                            {[
                                ['One controlled gateway', 'All financial writes pass a single audited path — no back-door edits.'],
                                ['Live balances, never cached', 'Every figure is computed from raw entries, so it cannot drift.'],
                                ['One reporting engine', 'Dashboard, P&L and balance sheet read the same source and always agree.'],
                            ].map((r, i) => (
                                <RevealOnScroll key={i} delay={i * 0.08} direction="right">
                                    <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                                        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                        <div><div className="text-ink font-bold text-[14px]">{r[0]}</div><div className="text-ink-muted text-[13px] leading-snug">{r[1]}</div></div>
                                    </div>
                                </RevealOnScroll>
                            ))}
                        </div>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.12} direction="left">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { e: 1000, s: '+', l: 'Tests Passed', ic: CheckCircle2, c: 'text-emerald-300' },
                                { e: 4000, s: '+', l: 'Integrity Checks', ic: Database, c: 'text-brand-300' },
                                { e: 13, s: '', l: 'E2E Scenarios', ic: Activity, c: 'text-cyan-300' },
                                { e: 0, s: '', disp: 'DECIMAL(20,4)', l: 'Ledger Precision', ic: Scale, c: 'text-violet-300' },
                            ].map((x, i) => (
                                <div key={i} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-brand-400/20 transition-colors duration-slower">
                                    <x.ic size={22} className={`${x.c} mb-4`} />
                                    <div className="text-2xl md:text-3xl font-bold text-ink tracking-tighter font-display mb-1">{x.disp ? <span className="text-lg md:text-xl">{x.disp}</span> : <Num end={x.e} suffix={x.s} />}</div>
                                    <div className="text-2xs text-ink-secondary font-bold uppercase tracking-[0.2em]">{x.l}</div>
                                </div>
                            ))}
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── TIMELINE ─────────────────────────────────────── */}
            <section className="py-20 md:py-28 px-6">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-14">
                            <SectionLabel icon={TrendingUp}>The journey</SectionLabel>
                            <h2 className="text-4xl md:text-5xl font-bold text-ink tracking-tighter font-display leading-[0.95]">From frustration<br /><span className="text-brand-600 dark:text-brand-400">to financial truth.</span></h2>
                        </div>
                    </RevealOnScroll>
                    <div>
                        {TIMELINE.map((t, i) => <TimelineItem key={i} item={t} i={i} last={i === TIMELINE.length - 1} />)}
                    </div>
                </div>
            </section>

            {/* ── PRINCIPLES ───────────────────────────────────── */}
            <section className="py-20 md:py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-14 max-w-3xl mx-auto">
                            <SectionLabel icon={Crosshair}>What we believe</SectionLabel>
                            <h2 className="text-4xl md:text-6xl font-bold text-ink tracking-tighter leading-[0.92] font-display">Six principles we<br /><span className="text-brand-600 dark:text-brand-400">refuse to bend.</span></h2>
                        </div>
                    </RevealOnScroll>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {PRINCIPLES.map((p, i) => (
                            <RevealOnScroll key={i} delay={(i % 3) * 0.07}>
                                <GlassCard className="h-full" padding="p-7">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-500/12 text-brand-300 flex items-center justify-center mb-5 transition-transform duration-slower"><p.ic size={22} /></div>
                                    <h3 className="text-lg font-bold text-ink tracking-tight mb-2 font-display">{p.t}</h3>
                                    <p className="text-ink-muted text-sm leading-relaxed">{p.d}</p>
                                </GlassCard>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── QUOTE / MISSION ──────────────────────────────── */}
            <section className="py-20 md:py-28 px-6">
                <div className="max-w-4xl mx-auto">
                    <RevealOnScroll>
                        <GlassCard hover={false} padding="p-10 md:p-16" className="text-center overflow-hidden">
                            <div className="absolute inset-0 vq-dot-pattern opacity-30 pointer-events-none" />
                            <Quote size={36} className="text-brand-400/50 mx-auto mb-6 relative z-10" />
                            <p className="relative z-10 text-2xl md:text-4xl font-bold text-ink tracking-tight leading-[1.15] font-display">
                                “We are not trying to be the biggest POS. We are trying to be the one whose numbers you never have to question.”
                            </p>
                            <div className="relative z-10 mt-8 text-1xs font-bold text-ink-muted uppercase tracking-[0.25em]">— The VenQore Team</div>
                        </GlassCard>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── WHO IT'S FOR ─────────────────────────────────── */}
            <section className="py-16 md:py-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <RevealOnScroll>
                        <SectionLabel icon={Building2}>Built for real businesses</SectionLabel>
                        <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tighter font-display mb-10 leading-[0.95]">If you sell something,<br /><span className="text-brand-600 dark:text-brand-400">we built this for you.</span></h2>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.1}>
                        <div className="flex flex-wrap justify-center gap-3">
                            {INDUSTRIES.map((x) => (
                                <span key={x} className="px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.025] text-sm font-bold text-ink-secondary hover:border-brand-400/30 hover:text-white transition-colors">{x}</span>
                            ))}
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────── */}
            <section className="py-28 md:py-36 px-6 text-center">
                <div className="max-w-4xl mx-auto relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
                    <RevealOnScroll>
                        <h2 className="text-4xl md:text-7xl font-bold text-ink mb-8 tracking-tighter leading-[0.95] relative z-10 font-display">Run your business on<br /><span className="vq-headline-grad">numbers you trust.</span></h2>
                        <p className="text-lg md:text-xl text-ink-muted mb-10 max-w-2xl mx-auto leading-relaxed relative z-10">14-day free trial · full access · no credit card · live in 15 minutes.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <MagneticButton href="/register" variant="primary">Start Free Trial <ArrowRight size={16} /></MagneticButton>
                            <MagneticButton href="/contact" variant="ghost">Talk to us</MagneticButton>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
        </MarketingLayout>
    );
}

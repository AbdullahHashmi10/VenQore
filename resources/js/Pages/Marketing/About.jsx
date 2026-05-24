import React, { useRef, useState, useEffect } from 'react';
import MarketingLayout, {
    RevealOnScroll, AnimatedCounter, MagneticButton, SectionLabel, GlassCard, useScrollReveal
} from './Shared/MarketingLayout';
import {
    ArrowRight, Heart, Target, Eye, Shield,
    Zap, Users, Globe, BookOpen, Lightbulb,
    CheckCircle2, Quote, Crosshair, Flame
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   ABOUT PAGE — "The Manifesto"
   Visual Concept: An editorial-style narrative experience. Feels like
   reading a design manifesto at a gallery opening. Each section has
   intentional pacing — like chapters in a story. Immersive, minimal,
   powerful. No stock photos. Only ideas.
   ═══════════════════════════════════════════════════════════════════════ */

const ValuePillar = ({ icon: Icon, title, body, index }) => (
    <RevealOnScroll delay={index * 0.1}>
        <div className="relative group">
            <div className="absolute -left-px top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/40 via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="pl-8 py-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Icon size={22} />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight mb-3 font-display">{title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{body}</p>
            </div>
        </div>
    </RevealOnScroll>
);

const TimelineNode = ({ year, title, description, index }) => (
    <RevealOnScroll delay={index * 0.12} direction={index % 2 === 0 ? 'left' : 'right'}>
        <div className="relative pl-10 pb-12 group">
            {/* Connecting line */}
            <div className="absolute left-[7px] top-3 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/30 to-transparent" />
            {/* Node dot */}
            <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-[#020010] border-2 border-indigo-500/40 group-hover:border-indigo-400 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-500" />

            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">{year}</div>
            <h4 className="text-lg font-black text-white tracking-tight mb-2 font-display">{title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </div>
    </RevealOnScroll>
);

export default function About() {
    return (
        <MarketingLayout
            title="About — VenQore"
            description="We built VenQore because we were tired of software that lies about your money. This is our story."
        >
            {/* ── 1. HERO — "The Why" ─────────────────────────── */}
            <section className="relative pt-40 pb-32 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <RevealOnScroll>
                                <SectionLabel icon={BookOpen}>Our Story</SectionLabel>
                            </RevealOnScroll>
                            <RevealOnScroll delay={0.1}>
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8 font-display">
                                    <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">We Built This</span>
                                    <br />
                                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent vq-text-glow">Out of Frustration.</span>
                                </h1>
                            </RevealOnScroll>
                            <RevealOnScroll delay={0.2}>
                                <p className="text-xl text-slate-400 leading-relaxed mb-8">
                                    We watched businesses make critical decisions on numbers their software fabricated. Revenue inflated by tax. Margins calculated on overwritten costs. Balance sheets that never balanced.
                                </p>
                            </RevealOnScroll>
                            <RevealOnScroll delay={0.3}>
                                <p className="text-lg text-slate-500 leading-relaxed">
                                    <span className="text-white font-bold">We decided that was unacceptable.</span> So we built the first operations platform where every transaction writes a correct journal entry — by design, not by accident.
                                </p>
                            </RevealOnScroll>
                        </div>

                        {/* Abstract visual — animated geometric composition */}
                        <RevealOnScroll delay={0.2} direction="left">
                            <div className="relative aspect-square max-w-md mx-auto">
                                {/* Layered glass panels suggesting depth and precision */}
                                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/10 vq-float" />
                                <div className="absolute inset-4 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] vq-float-delay" />
                                <div className="absolute inset-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-7xl font-black text-white/10 font-display tracking-tighter mb-2">0.00</div>
                                        <div className="text-[10px] font-black text-indigo-400/40 uppercase tracking-[0.3em]">Balance Error</div>
                                    </div>
                                </div>
                                {/* Orbiting accent */}
                                <div className="absolute -top-2 -right-2 w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center vq-float">
                                    <Shield size={20} className="text-indigo-400/60" />
                                </div>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* ── 2. THE MANIFESTO QUOTE ──────────────────────── */}
            <section className="py-32 px-6 border-y border-white/5 vq-grid-pattern">
                <div className="max-w-4xl mx-auto text-center">
                    <RevealOnScroll>
                        <Quote size={40} className="text-indigo-500/20 mx-auto mb-8" />
                        <blockquote className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-8 font-display">
                            We don't sell software.<br />
                            We sell the ability to <span className="text-indigo-400">trust your own numbers.</span>
                        </blockquote>
                        <div className="text-sm text-slate-600 font-bold uppercase tracking-[0.2em]">— The VenQore Team</div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 3. VALUES / PRINCIPLES ──────────────────────── */}
            <section className="py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-20">
                            <SectionLabel icon={Crosshair}>Principles</SectionLabel>
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter font-display leading-[0.9]">
                                What We <span className="text-indigo-400">Stand For</span>
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
                        <ValuePillar
                            index={0}
                            icon={Target}
                            title="Accuracy Over Features"
                            body="We'd rather have 10 features that produce correct numbers than 100 features that produce approximate ones. Every function in VenQore traces back to a verified financial outcome."
                        />
                        <ValuePillar
                            index={1}
                            icon={Eye}
                            title="Transparency Is Architecture"
                            body="We don't hide complexity — we organize it. Every report shows where its numbers come from. Every ledger entry links to the transaction that created it."
                        />
                        <ValuePillar
                            index={2}
                            icon={Shield}
                            title="Immutability Is Non-Negotiable"
                            body="No silent edits. No overwritten costs. No backdated adjustments without a reversal trail. If it happened, the ledger remembers."
                        />
                        <ValuePillar
                            index={3}
                            icon={Zap}
                            title="Speed Is Respect"
                            body="Fast software respects your time. The POS terminal is designed for zero-mouse operation. Keyboard-first. 25+ shortcuts. Because operators don't have time to click."
                        />
                        <ValuePillar
                            index={4}
                            icon={Heart}
                            title="Operator-First Design"
                            body="We build for the person standing behind the counter at midnight, not the person reviewing charts in a boardroom. The operator's workflow is our design brief."
                        />
                        <ValuePillar
                            index={5}
                            icon={Lightbulb}
                            title="Intelligence, Not Dashboards"
                            body="We don't give you 50 charts to interpret. We give you 3 signals that tell you what to do next. Proactive intelligence over passive visualization."
                        />
                    </div>
                </div>
            </section>

            {/* ── 4. TIMELINE ─────────────────────────────────── */}
            <section className="py-32 px-6">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-20">
                            <SectionLabel icon={Flame}>Journey</SectionLabel>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter font-display">
                                How We <span className="text-indigo-400">Got Here</span>
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <div className="space-y-0">
                        <TimelineNode
                            index={0}
                            year="2024 — The Problem"
                            title="Saw the Lie Firsthand"
                            description="Working with retail businesses, we discovered that every POS on the market was silently inflating revenue by including tax. Margins were calculated on overwritten average costs. Nobody questioned it — because nobody knew."
                        />
                        <TimelineNode
                            index={1}
                            year="2024 — The Architecture"
                            title="Built the Double-Entry Wall"
                            description="We decided that every single transaction — every sale, purchase, return, transfer — must produce a correct, balanced journal entry. No shortcuts. No post-hoc reconciliation. Financial truth at the transaction level."
                        />
                        <TimelineNode
                            index={2}
                            year="2025 — The Engine"
                            title="FIFO, Batch Tracking, AI"
                            description="Added batch-level FIFO cost tracking, multi-warehouse management, and three AI models that actually predict business outcomes instead of just visualizing past data."
                        />
                        <TimelineNode
                            index={3}
                            year="2025 — The Platform"
                            title="Multi-Tenant SaaS Launch"
                            description="Rebuilt the entire system as a multi-tenant SaaS platform. Role-based access, kiosk mode, manager overrides, staff attendance, and 38 verified financial reports."
                        />
                        <TimelineNode
                            index={4}
                            year="2026 — Today"
                            title="The Books Are Always Right"
                            description="VenQore is now the only POS and ERP platform where financial accuracy isn't a feature — it's the foundation everything else is built on."
                        />
                    </div>
                </div>
            </section>

            {/* ── 5. STATS ────────────────────────────────────── */}
            <section className="py-24 px-6 border-y border-white/5">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {[
                        { end: 38, suffix: '', label: 'Verified Reports' },
                        { end: 25, suffix: '+', label: 'Keyboard Shortcuts' },
                        { end: 15, suffix: 'min', label: 'Setup Time' },
                        { end: 24, suffix: '/7', label: 'System Uptime' },
                    ].map((s, i) => (
                        <RevealOnScroll key={i} delay={i * 0.1}>
                            <div>
                                <div className="text-4xl md:text-5xl font-black text-white tracking-tighter font-display mb-2">
                                    <AnimatedCounter end={s.end} />{s.suffix}
                                </div>
                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.25em]">{s.label}</div>
                            </div>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>

            {/* ── 6. TEAM PHILOSOPHY ──────────────────────────── */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <RevealOnScroll>
                            <div>
                                <SectionLabel icon={Users}>The Team</SectionLabel>
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter font-display mb-8 leading-[0.9]">
                                    Engineers Who <span className="text-indigo-400">Understand Accounting.</span>
                                </h2>
                                <div className="space-y-6 text-slate-400 leading-relaxed">
                                    <p>
                                        We're not a team of 200. We're a small, focused group of engineers who happen to understand double-entry bookkeeping, FIFO cost flows, and tax isolation at the database level.
                                    </p>
                                    <p>
                                        Every person on the team can explain <span className="text-white font-semibold">why</span> a journal entry debits one account and credits another. That's why VenQore works — because the people who build it understand the problem at a structural level.
                                    </p>
                                    <p className="text-white font-bold">
                                        We don't hire for quantity. We hire for conviction.
                                    </p>
                                </div>
                            </div>
                        </RevealOnScroll>

                        <RevealOnScroll delay={0.2} direction="left">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Engineering', desc: 'Full-stack architects' },
                                    { label: 'Accounting', desc: 'Double-entry expertise' },
                                    { label: 'Design', desc: 'Operator-first UX' },
                                    { label: 'Support', desc: 'Real humans, always' },
                                ].map((team, i) => (
                                    <GlassCard key={i} padding="p-6">
                                        <div className="text-lg font-black text-white tracking-tight font-display mb-1">{team.label}</div>
                                        <div className="text-xs text-slate-600 uppercase tracking-widest font-bold">{team.desc}</div>
                                    </GlassCard>
                                ))}
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* ── 7. CTA ──────────────────────────────────────── */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none" />
                    <RevealOnScroll>
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight relative z-10 font-display">
                            Join the Operators<br />Who <span className="text-indigo-400">Demand Truth.</span>
                        </h2>
                        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto relative z-10">
                            14-day free trial. Full access. No credit card.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <MagneticButton href="/register" variant="primary">
                                Start Free Trial <ArrowRight size={16} />
                            </MagneticButton>
                            <MagneticButton href="/contact" variant="ghost">
                                Talk to Us
                            </MagneticButton>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
        </MarketingLayout>
    );
}

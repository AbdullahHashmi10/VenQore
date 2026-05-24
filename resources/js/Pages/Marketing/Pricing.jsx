import React, { useState } from 'react';
import MarketingLayout, {
    RevealOnScroll, AnimatedCounter, MagneticButton, SectionLabel, GlassCard
} from './Shared/MarketingLayout';
import {
    Check, X, ArrowRight, Zap, ShieldCheck, Crown,
    ChevronDown, Sparkles, Building2, Users, HelpCircle
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   PRICING PAGE — "Transparent. Simple. Honest."
   Visual Concept: A pricing experience that feels like a premium
   configurator — not a comparison table. Clean, decisive, authoritative.
   ═══════════════════════════════════════════════════════════════════════ */

const PricingToggle = ({ annual, setAnnual }) => (
    <div className="flex items-center justify-center gap-4 mb-16">
        <span className={`text-sm font-bold transition-colors ${!annual ? 'text-white' : 'text-slate-600'}`}>Monthly</span>
        <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-16 h-8 rounded-full transition-all duration-500 ${annual ? 'bg-indigo-600' : 'bg-white/10'}`}
        >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-500 ${annual ? 'left-9' : 'left-1'}`} />
        </button>
        <span className={`text-sm font-bold transition-colors ${annual ? 'text-white' : 'text-slate-600'}`}>
            Annual
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-wider">SAVE 20%</span>
        </span>
    </div>
);

const PricingCard = ({ name, icon: Icon, description, price, annualPrice, annual, features, highlighted, cta, delay }) => (
    <RevealOnScroll delay={delay}>
        <div className={`relative rounded-[2.5rem] overflow-hidden transition-all duration-700 h-full flex flex-col
            ${highlighted
                ? 'bg-gradient-to-b from-indigo-500/10 to-purple-500/5 border-2 border-indigo-500/30 shadow-2xl shadow-indigo-900/20 scale-[1.02]'
                : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]'
            }`}
        >
            {highlighted && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 vq-gradient-shift" />
            )}

            <div className="p-8 md:p-10 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlighted ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-500'}`}>
                        <Icon size={20} />
                    </div>
                    {highlighted && (
                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-[0.2em] uppercase">
                            Most Popular
                        </span>
                    )}
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight mb-2 font-display">{name}</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">{description}</p>

                {/* Price */}
                <div className="mb-8">
                    <div className="flex items-end gap-2">
                        <span className="text-5xl font-black text-white tracking-tighter font-display">
                            ${annual ? annualPrice : price}
                        </span>
                        <span className="text-slate-600 text-sm font-bold mb-2">/month</span>
                    </div>
                    {annual && price !== annualPrice && (
                        <div className="text-emerald-400/60 text-xs font-bold mt-1">
                            Billed annually · Save ${(price - annualPrice) * 12}/year
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-10 flex-1">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <Check size={16} className={`mt-0.5 flex-shrink-0 ${highlighted ? 'text-indigo-400' : 'text-slate-600'}`} />
                            <span className="text-sm text-slate-400">{f}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <MagneticButton
                    href="/register"
                    variant={highlighted ? 'primary' : 'ghost'}
                    className="w-full justify-center"
                >
                    {cta} <ArrowRight size={15} />
                </MagneticButton>
            </div>
        </div>
    </RevealOnScroll>
);

const FaqItem = ({ question, answer }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-white/5">
            <button
                onClick={() => setOpen(!open)}
                className="w-full py-6 flex items-center justify-between text-left hover:text-indigo-400 transition-colors group"
            >
                <span className="text-base font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors pr-4">{question}</span>
                <ChevronDown size={18} className={`transform transition-transform duration-500 flex-shrink-0 ${open ? 'rotate-180 text-indigo-400' : 'text-slate-700'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'max-h-60 pb-6' : 'max-h-0'}`}>
                <p className="text-slate-500 leading-relaxed text-sm">{answer}</p>
            </div>
        </div>
    );
};

export default function Pricing() {
    const [annual, setAnnual] = useState(true);

    const plans = [
        {
            name: 'Starter',
            icon: Zap,
            description: 'For single-location businesses getting serious about financial accuracy.',
            price: 29,
            annualPrice: 23,
            features: [
                '1 Store Location',
                '3 Staff Accounts',
                'Full POS Terminal',
                'Double-Entry Accounting',
                'FIFO Inventory Tracking',
                '15 Core Reports',
                'Email Support',
            ],
            highlighted: false,
            cta: 'Start Free Trial',
        },
        {
            name: 'Professional',
            icon: ShieldCheck,
            description: 'For growing operations that need multi-store control and full reporting.',
            price: 59,
            annualPrice: 47,
            features: [
                'Up to 3 Store Locations',
                '10 Staff Accounts',
                'Everything in Starter',
                'All 38 Master Reports',
                'Multi-Warehouse Support',
                'AI Intelligence Suite',
                'Manufacturing (BOM)',
                'Priority Support',
            ],
            highlighted: true,
            cta: 'Start Free Trial',
        },
        {
            name: 'Enterprise',
            icon: Crown,
            description: 'For operators who demand complete control over their entire organization.',
            price: 129,
            annualPrice: 99,
            features: [
                'Unlimited Locations',
                'Unlimited Staff',
                'Everything in Professional',
                'White-Label Options',
                'Dedicated Account Manager',
                'Custom Report Builder',
                'SLA & Uptime Guarantee',
                'On-Premise Option Available',
            ],
            highlighted: false,
            cta: 'Contact Sales',
        },
    ];

    return (
        <MarketingLayout
            title="Pricing — VenQore"
            description="Simple, transparent pricing. No hidden fees. Full access during your 14-day free trial."
        >
            {/* ── 1. HERO ─────────────────────────────────────── */}
            <section className="relative pt-40 pb-12 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <RevealOnScroll>
                        <SectionLabel icon={Sparkles}>Simple Pricing</SectionLabel>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.1}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 font-display">
                            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Invest in</span>
                            <br />
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent vq-text-glow">Truth.</span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.2}>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Every plan includes full financial accuracy. No feature gates on your books being right. <span className="text-white">14-day free trial on every plan.</span>
                        </p>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 2. PRICING CARDS ────────────────────────────── */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <PricingToggle annual={annual} setAnnual={setAnnual} />
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        {plans.map((plan, i) => (
                            <PricingCard key={plan.name} {...plan} annual={annual} delay={i * 0.1} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 3. TRUST STRIP ──────────────────────────────── */}
            <section className="py-20 px-6 border-y border-white/5">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { icon: ShieldCheck, label: 'No Credit Card Required', sub: 'Start risk-free' },
                        { icon: Users, label: 'No Setup Fees', sub: 'Start in 15 minutes' },
                        { icon: Building2, label: 'Cancel Anytime', sub: 'No contracts' },
                        { icon: HelpCircle, label: 'Full Support', sub: 'Real humans' },
                    ].map((item, i) => (
                        <RevealOnScroll key={i} delay={i * 0.08}>
                            <div className="flex flex-col items-center">
                                <item.icon size={24} className="text-indigo-400/60 mb-3" />
                                <div className="text-sm font-bold text-white mb-1">{item.label}</div>
                                <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">{item.sub}</div>
                            </div>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>

            {/* ── 4. FEATURE COMPARISON TABLE ─────────────────── */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter font-display mb-4">
                                Compare <span className="text-indigo-400">Every Detail</span>
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={0.1}>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] overflow-hidden">
                            {/* Header */}
                            <div className="grid grid-cols-4 p-6 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em]">
                                <div className="text-slate-600">Feature</div>
                                <div className="text-slate-500 text-center">Starter</div>
                                <div className="text-indigo-400 text-center">Professional</div>
                                <div className="text-slate-500 text-center">Enterprise</div>
                            </div>
                            {[
                                ['POS Terminal', true, true, true],
                                ['Double-Entry Accounting', true, true, true],
                                ['FIFO Inventory', true, true, true],
                                ['Multi-Warehouse', false, true, true],
                                ['AI Intelligence Suite', false, true, true],
                                ['Manufacturing (BOM)', false, true, true],
                                ['All 38 Reports', false, true, true],
                                ['Custom Report Builder', false, false, true],
                                ['White-Label', false, false, true],
                                ['Dedicated Account Manager', false, false, true],
                                ['SLA Guarantee', false, false, true],
                            ].map(([feature, s, p, e], i) => (
                                <div key={i} className={`grid grid-cols-4 p-5 items-center ${i < 10 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}>
                                    <div className="text-sm text-slate-400 font-medium">{feature}</div>
                                    {[s, p, e].map((val, j) => (
                                        <div key={j} className="flex justify-center">
                                            {val
                                                ? <Check size={16} className={j === 1 ? 'text-indigo-400' : 'text-slate-600'} />
                                                : <X size={16} className="text-slate-800" />
                                            }
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 5. FAQ ──────────────────────────────────────── */}
            <section className="py-32 px-6">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <SectionLabel icon={HelpCircle}>Common Questions</SectionLabel>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter font-display">
                                Before You <span className="text-indigo-400">Decide</span>
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={0.1}>
                        <div>
                            <FaqItem
                                question="Can I switch plans later?"
                                answer="Yes. Upgrade or downgrade anytime. Changes take effect on your next billing cycle. Your data is never affected by plan changes."
                            />
                            <FaqItem
                                question="What happens after my trial ends?"
                                answer="You'll be prompted to choose a plan. Your data stays safe — we never delete trial data. If you need more time, just ask."
                            />
                            <FaqItem
                                question="Is there a per-transaction fee?"
                                answer="No. VenQore charges a flat subscription. Process 10 or 10,000 transactions — same price. We don't profit from your volume."
                            />
                            <FaqItem
                                question="Can I export my data if I leave?"
                                answer="Yes — full CSV/Excel export of all your data at any time. We don't hold data hostage. It's yours."
                            />
                            <FaqItem
                                question="Do you offer non-profit or educational discounts?"
                                answer="Yes. Contact our team for special pricing for registered non-profits and educational institutions."
                            />
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 6. FINAL CTA ────────────────────────────────── */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none" />
                    <RevealOnScroll>
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight relative z-10 font-display">
                            Start Free.<br /><span className="text-indigo-400">Decide Later.</span>
                        </h2>
                        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto relative z-10">
                            Full access for 14 days. No credit card. No commitment.
                        </p>
                        <div className="relative z-10">
                            <MagneticButton href="/register" variant="primary">
                                Start Free Trial <ArrowRight size={16} />
                            </MagneticButton>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
        </MarketingLayout>
    );
}

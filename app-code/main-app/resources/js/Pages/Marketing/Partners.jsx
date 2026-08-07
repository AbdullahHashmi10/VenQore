import React from 'react';
import { useForm } from '@inertiajs/react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel, GlassCard
} from './Shared/MarketingLayout';
import {
    ArrowRight, Send, Briefcase, Mail, ShieldAlert,
    CheckCircle2, Users, FileText, Globe, Code, Key, ChevronDown
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   PARTNERS PAGE — "Licensing & B2B Partnerships"
   Visual Concept: A highly professional, premium enterprise landing page.
   Draws directly from Phase 14 licensing ladder with clean B2B/reseller
   positioning. Includes B2B schema support.
   ═══════════════════════════════════════════════════════════════════════ */

export default function Partners() {
    const { data, setData, post, processing, wasSuccessful, reset, errors } = useForm({
        name: '',
        email: '',
        company: '',
        partnership_type: 'White-Label Reseller',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('marketing.partners.store'), {
            onSuccess: () => reset(),
        });
    };

    const Tiers = [
        {
            icon: Globe,
            title: 'White-Label Reseller',
            type: 'Recurring Revenue Share',
            desc: 'Rebrand the entire offline-first VenQore platform under your own domain name and logo. The default answer for resellers and marketing agencies who want to offer SaaS tools without hosting, security, or maintenance overhead.',
            color: 'emerald'
        },
        {
            icon: Code,
            title: 'Source-Code License',
            type: 'Non-Exclusive Deployment',
            desc: 'Acquire a full source-code license to host and deploy VenQore on your own server infrastructure. Ideal for regional hardware distributors or software operators seeking full operational independence.',
            color: 'indigo'
        },
        {
            icon: Key,
            title: 'Vertical/Region Exclusivity',
            type: 'Exclusive IP Rights',
            desc: 'Secure exclusive rights to operate VenQore POS within a specific industry vertical (e.g. Pharmacy Chains) or geographical country. Governed by a dedicated B2B distribution contract and evaluated on a six-figure model.',
            color: 'violet'
        },
        {
            icon: Briefcase,
            title: 'Strategic Acquisition',
            type: 'Full Intellectual Property',
            desc: 'Complete IP, brand, and asset acquisition. We discuss full buyout proposals only with qualified strategic buyers under revenue-multiple valuations. VenQore does not participate in code-broker or lowball source code bids.',
            color: 'rose'
        }
    ];

    const getTheme = (color) => {
        switch (color) {
            case 'emerald': return { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
            case 'indigo': return { text: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' };
            case 'violet': return { text: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' };
            case 'rose': return { text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
            default: return { text: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' };
        }
    };

    return (
        <MarketingLayout
            title="B2B Partnership & Licensing Programs — VenQore"
            description="Explore white-label reseller opportunities, non-exclusive source-code licensing, and regional exclusive partnerships for our offline-first Business OS."
        >
            {/* ── 1. HERO ─────────────────────────────────────── */}
            <section className="relative pt-40 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <RevealOnScroll>
                        <SectionLabel icon={Briefcase}>Licensing & Partnerships</SectionLabel>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.1}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 font-display text-slate-900 dark:text-white">
                            The Licensing <br />
                            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Ladder Program</span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.2}>
                        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                            VenQore licenses its double-entry retail operating system. The company is not for sale; serious partnership and licensing conversations are welcome.
                        </p>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 2. LICENSING LADDER GRID ────────────────────── */}
            <section className="relative py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Tiers.map((t, idx) => {
                            const theme = getTheme(t.color);
                            const Icon = t.icon;
                            return (
                                <RevealOnScroll key={idx} delay={idx * 0.1}>
                                    <GlassCard className="p-8 h-full flex flex-col justify-between group hover:border-slate-800 transition-all duration-500">
                                        <div>
                                            <div className={`w-12 h-12 rounded-2xl ${theme.bg} flex items-center justify-center mb-6 group-hover:scale-115 transition-transform duration-500`}>
                                                <Icon className={`w-6 h-6 ${theme.text}`} />
                                            </div>
                                            <span className={`text-2xs font-black uppercase tracking-[0.2em] ${theme.text}`}>
                                                {t.type}
                                            </span>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2 mb-4 font-display">
                                                {t.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm leading-relaxed">
                                                {t.desc}
                                            </p>
                                        </div>
                                    </GlassCard>
                                </RevealOnScroll>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── 3. ACQUISITION Moat / 48-HOUR KIT STATS ─────── */}
            <section className="relative py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <RevealOnScroll>
                        <GlassCard className="p-8 border-yellow-500/10 bg-yellow-500/[0.01]">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight font-display mb-1">
                                        IP & Technical Moat Integrity
                                    </h4>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        VenQore is governed by strict developer-owner copyrights, no third-party contested intellectual property, and contains a locked database integrity engine tested under <strong>1,500+ automated test suites</strong>. All partnership inquiries route directly to our founding team.
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 4. PARTNERSHIP CONTACT FORM ─────────────────── */}
            <section className="relative py-16 px-6 pb-32">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-display mb-4">
                                Partnership Inquiry
                            </h2>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                                Select your licensing tier below. Qualified inquiries receive a response within one business day from our founders.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={0.1}>
                        <GlassCard className="p-8 md:p-12 relative overflow-hidden">
                            {wasSuccessful ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display mb-2">
                                        Inquiry Submitted
                                    </h3>
                                    <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                                        Thank you! Your partnership inquiry has been securely stored and routed to the founding team. We will review your company profile and respond shortly.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-2xs font-black uppercase tracking-[0.25em] mb-3 text-slate-600">
                                                Your Name <span className="text-indigo-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03]"
                                                placeholder="e.g. Alexander Wright"
                                            />
                                            {errors.name && <span className="text-xs text-rose-500 mt-1">{errors.name}</span>}
                                        </div>

                                        <div>
                                            <label className="block text-2xs font-black uppercase tracking-[0.25em] mb-3 text-slate-600">
                                                Business Email <span className="text-indigo-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03]"
                                                placeholder="e.g. alex@distributor.com"
                                            />
                                            {errors.email && <span className="text-xs text-rose-500 mt-1">{errors.email}</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-2xs font-black uppercase tracking-[0.25em] mb-3 text-slate-600">
                                                Company Name <span className="text-indigo-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={data.company}
                                                onChange={e => setData('company', e.target.value)}
                                                className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03]"
                                                placeholder="e.g. Wright Retail Group"
                                            />
                                            {errors.company && <span className="text-xs text-rose-500 mt-1">{errors.company}</span>}
                                        </div>

                                        <div>
                                            <label className="block text-2xs font-black uppercase tracking-[0.25em] mb-3 text-slate-600">
                                                Licensing Program <span className="text-indigo-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={data.partnership_type}
                                                    onChange={e => setData('partnership_type', e.target.value)}
                                                    className="w-full px-5 py-4 bg-[#0a0a0c] border border-white/[0.06] rounded-2xl text-white text-sm outline-none hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] appearance-none cursor-pointer"
                                                >
                                                    <option>White-Label Reseller</option>
                                                    <option>Source-Code License</option>
                                                    <option>Vertical/Region Exclusivity</option>
                                                    <option>Strategic Acquisition</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-2xs font-black uppercase tracking-[0.25em] mb-3 text-slate-600">
                                            Inquiry & Use Case Description <span className="text-indigo-500">*</span>
                                        </label>
                                        <textarea
                                            required
                                            rows={5}
                                            value={data.message}
                                            onChange={e => setData('message', e.target.value)}
                                            className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] resize-none"
                                            placeholder="Detail your target market, operating region, and why you are interested in licensing VenQore..."
                                        />
                                        {errors.message && <span className="text-xs text-rose-500 mt-1">{errors.message}</span>}
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <MagneticButton>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-500 transition-all duration-300"
                                            >
                                                {processing ? 'Submitting...' : 'Submit Inquiry'}
                                                <Send size={12} />
                                            </button>
                                        </MagneticButton>
                                    </div>
                                </form>
                            )}
                        </GlassCard>
                    </RevealOnScroll>
                </div>
            </section>
        </MarketingLayout>
    );
}

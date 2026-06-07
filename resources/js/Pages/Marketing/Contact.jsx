import React, { useState, useRef } from 'react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel, GlassCard
} from './Shared/MarketingLayout';
import {
    ArrowRight, Send, MessageCircle, Mail, MapPin, Clock,
    Phone, Headphones, BookOpen, Zap, CheckCircle2,
    AlertCircle, Loader2
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   CONTACT PAGE — "Let's Talk"
   Visual Concept: A premium communication terminal. Not a boring form.
   Feels like accessing a private command line to an elite team.
   Every field has purpose. Every interaction has feedback.
   ═══════════════════════════════════════════════════════════════════════ */

const InputField = ({ label, type = 'text', name, placeholder, required, value, onChange, rows }) => {
    const [focused, setFocused] = useState(false);
    const Tag = rows ? 'textarea' : 'input';

    return (
        <div className="relative group">
            <label className={`block text-[10px] font-black uppercase tracking-[0.25em] mb-3 transition-colors duration-300 ${focused ? 'text-indigo-400' : 'text-slate-600'}`}>
                {label} {required && <span className="text-indigo-500">*</span>}
            </label>
            <Tag
                type={type}
                name={name}
                placeholder={placeholder}
                required={required}
                value={value}
                onChange={onChange}
                rows={rows}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`w-full px-5 py-4 bg-white/[0.03] border rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none transition-all duration-500 resize-none
                    ${focused
                        ? 'border-indigo-500/40 bg-indigo-500/[0.03] shadow-lg shadow-indigo-900/10'
                        : 'border-white/[0.06] hover:border-white/10'
                    }
                `}
            />
            {/* Focus glow line */}
            <div className={`absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-opacity duration-500 ${focused ? 'opacity-100' : 'opacity-0'}`} />
        </div>
    );
};

const ContactMethod = ({ icon: Icon, title, subtitle, action, href, color = 'indigo', delay }) => (
    <RevealOnScroll delay={delay}>
        <a
            href={href}
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`block p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] hover:bg-${color}-500/[0.04] hover:border-${color}-500/20 transition-all duration-500 group cursor-pointer`}
        >
            <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 text-${color}-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <Icon size={22} />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight mb-1 font-display">{title}</h3>
            <p className="text-slate-600 text-sm mb-3">{subtitle}</p>
            <span className={`text-${color}-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 group-hover:gap-3 transition-all`}>
                {action} <ArrowRight size={12} />
            </span>
        </a>
    </RevealOnScroll>
);

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' });
    const [status, setStatus] = useState('idle'); // idle | sending | success | error

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        // Simulate submission — replace with real endpoint
        await new Promise(r => setTimeout(r, 1500));
        setStatus('success');
        setForm({ name: '', email: '', company: '', subject: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
    };

    return (
        <MarketingLayout
            title="Contact — VenQore"
            description="Talk to our team. Whether you need a demo, have questions, or want enterprise pricing — we respond fast."
        >
            {/* ── 1. HERO ─────────────────────────────────────── */}
            <section className="relative pt-40 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <RevealOnScroll>
                        <SectionLabel icon={Headphones}>Get in Touch</SectionLabel>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.1}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 font-display">
                            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Let's</span>{' '}
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent vq-text-glow">Talk.</span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.2}>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Whether you need a personalized walkthrough, have technical questions, or want to discuss enterprise licensing — <span className="text-white">we respond within hours, not days.</span>
                        </p>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 2. CONTACT METHODS ──────────────────────────── */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
                    <ContactMethod
                        delay={0}
                        icon={MessageCircle}
                        title="WhatsApp"
                        subtitle="Fastest way to reach us. Immediate response during business hours."
                        action="Chat Now"
                        href="https://wa.me/923091999489"
                        color="emerald"
                    />
                    <ContactMethod
                        delay={0.1}
                        icon={Mail}
                        title="Email"
                        subtitle="For detailed inquiries, partnerships, and enterprise discussions."
                        action="Send Email"
                        href="mailto:hello@venqore.com"
                        color="indigo"
                    />
                    <ContactMethod
                        delay={0.2}
                        icon={Zap}
                        title="Live Demo"
                        subtitle="See VenQore in action with your own data. 30-minute, 1-on-1 session."
                        action="Book Demo"
                        href="/demo"
                        color="amber"
                    />
                </div>
            </section>

            {/* ── 3. CONTACT FORM + INFO ──────────────────────── */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Form — 3 cols */}
                    <div className="lg:col-span-3">
                        <RevealOnScroll>
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[3rem] p-8 md:p-12">
                                <h2 className="text-2xl font-black text-white tracking-tight mb-2 font-display">Send a Message</h2>
                                <p className="text-slate-600 text-sm mb-10">We'll get back to you within a few hours.</p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <InputField
                                            label="Your Name"
                                            name="name"
                                            placeholder="John Doe"
                                            required
                                            value={form.name}
                                            onChange={handleChange}
                                        />
                                        <InputField
                                            label="Email Address"
                                            type="email"
                                            name="email"
                                            placeholder="john@company.com"
                                            required
                                            value={form.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <InputField
                                            label="Company"
                                            name="company"
                                            placeholder="Acme Inc."
                                            value={form.company}
                                            onChange={handleChange}
                                        />
                                        <InputField
                                            label="Subject"
                                            name="subject"
                                            placeholder="Sales Inquiry"
                                            required
                                            value={form.subject}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <InputField
                                        label="Message"
                                        name="message"
                                        placeholder="Tell us about your business and what you're looking for..."
                                        required
                                        rows={5}
                                        value={form.message}
                                        onChange={handleChange}
                                    />

                                    {/* Submit */}
                                    <div className="flex items-center justify-between gap-6 pt-4">
                                        <button
                                            type="submit"
                                            disabled={status === 'sending'}
                                            className={`inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-sm uppercase tracking-[0.15em] transition-all duration-500
                                                ${status === 'sending'
                                                    ? 'bg-indigo-600/50 text-white/50 cursor-wait'
                                                    : status === 'success'
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                                                        : 'bg-white text-[#020010] hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.3)] hover:scale-105'
                                                }
                                            `}
                                        >
                                            {status === 'sending' && <Loader2 size={16} className="animate-spin" />}
                                            {status === 'success' && <CheckCircle2 size={16} />}
                                            {status === 'idle' && <Send size={16} />}
                                            {status === 'error' && <AlertCircle size={16} />}

                                            {status === 'idle' && 'Send Message'}
                                            {status === 'sending' && 'Sending...'}
                                            {status === 'success' && 'Message Sent!'}
                                            {status === 'error' && 'Try Again'}
                                        </button>

                                        <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest hidden sm:block">
                                            We respect your privacy
                                        </span>
                                    </div>
                                </form>
                            </div>
                        </RevealOnScroll>
                    </div>

                    {/* Info Panel — 2 cols */}
                    <div className="lg:col-span-2 space-y-6">
                        <RevealOnScroll delay={0.1}>
                            <GlassCard padding="p-8">
                                <Clock size={22} className="text-indigo-400 mb-4" />
                                <h3 className="text-lg font-black text-white tracking-tight mb-2 font-display">Response Time</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                    We typically respond within <span className="text-white font-bold">2-4 hours</span> during business hours. WhatsApp is fastest for urgent inquiries.
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Currently Online
                                </div>
                            </GlassCard>
                        </RevealOnScroll>

                        <RevealOnScroll delay={0.2}>
                            <GlassCard padding="p-8">
                                <MapPin size={22} className="text-indigo-400 mb-4" />
                                <h3 className="text-lg font-black text-white tracking-tight mb-2 font-display">Location</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    We're a remote-first team. Our engineering is based in Pakistan, serving businesses globally.
                                </p>
                            </GlassCard>
                        </RevealOnScroll>

                        <RevealOnScroll delay={0.3}>
                            <GlassCard padding="p-8">
                                <BookOpen size={22} className="text-indigo-400 mb-4" />
                                <h3 className="text-lg font-black text-white tracking-tight mb-2 font-display">For Partners</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                    Interested in reselling, white-labeling, or integrating VenQore into your ecosystem? We'd love to hear from you.
                                </p>
                                <a href="mailto:partners@venqore.com" className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
                                    Partner Inquiries <ArrowRight size={12} />
                                </a>
                            </GlassCard>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* ── 4. CTA ──────────────────────────────────────── */}
            <section className="py-32 px-6 text-center border-t border-white/5">
                <div className="max-w-3xl mx-auto relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none" />
                    <RevealOnScroll>
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-tight relative z-10 font-display">
                            Not Ready to Talk?<br /><span className="text-indigo-400">Try It First.</span>
                        </h2>
                        <p className="text-lg text-slate-500 mb-10 max-w-lg mx-auto relative z-10">
                            14-day free trial. No credit card. No sales call required.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <MagneticButton href="/register" variant="primary">
                                Start Free Trial <ArrowRight size={16} />
                            </MagneticButton>
                            <MagneticButton href="/demo" variant="ghost">
                                Live Demo
                            </MagneticButton>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
        </MarketingLayout>
    );
}

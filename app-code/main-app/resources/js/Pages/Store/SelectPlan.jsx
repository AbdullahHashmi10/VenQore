import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
 Store, ArrowRight, ArrowLeft, Check, Zap, TrendingUp, Crown,
 Sparkles, ShieldCheck, CreditCard, Clock
} from 'lucide-react';

/**
 * Store/SelectPlan.jsx — Plan-gated store creation, Step 1
 *
 * URL: /new-store (no query string)
 *
 * The user must pick the plan they want to trial before they can name and
 * create a store. The selection (plan + billing interval) is carried into
 * step 2 (/new-store?plan=<slug>&interval=<monthly|annual>) where the store
 * is actually named and the trial is started. No card is collected here —
 * the chosen plan simply determines what is charged once the trial ends.
 */

const TIER_STYLES = {
 starter: {
 icon: Zap,
 iconBg: 'bg-blue-500/10 text-blue-400',
 accentFrom: 'from-blue-500/[0.10]',
 accentBorder: 'border-blue-500/40',
 glow: '',
 badge: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
 dot: 'text-blue-400',
 },
 growth: {
 icon: TrendingUp,
 iconBg: 'bg-brand-500/10 text-brand-400',
 accentFrom: 'from-brand-500/[0.12]',
 accentBorder: 'border-brand-500/50',
 glow: '',
 badge: 'bg-brand-500/10 border-brand-500/20 text-brand-300',
 dot: 'text-brand-400',
 },
 business: {
 icon: Crown,
 iconBg: 'bg-brand-500/10 text-brand-400',
 accentFrom: 'from-brand-500/[0.10]',
 accentBorder: 'border-brand-500/40',
 glow: '',
 badge: 'bg-brand-500/10 border-brand-500/20 text-brand-300',
 dot: 'text-brand-400',
 },
};

const INTERVALS = [
 { key: 'monthly', label: 'Monthly' },
 { key: 'annual', label: 'Annual', badge: 'Save 20%' },
];

export default function SelectPlan({ plans = [], currency = { code: 'USD', symbol: '$' }, trial_days = 14 }) {
 const { geo } = usePage().props;
 const symbol = currency?.symbol || geo?.symbol || '$';

 const [interval, setInterval] = useState('monthly');
 const [selected, setSelected] = useState(
 plans.find(p => p.popular)?.slug || plans[0]?.slug || 'growth'
 );

 const fmt = (n) => {
 const val = Number(n || 0);
 const rounded = Number.isInteger(val) ? val : Math.round(val);
 return symbol === 'Rs'
 ? `Rs ${rounded.toLocaleString()}`
 : `${symbol}${rounded.toLocaleString()}`;
 };

 const perMonth = (plan) =>
 interval === 'annual' ? plan.price_annual : plan.price_monthly;

 const proceed = (slug) => {
 router.visit(route('store.create', { plan: slug, interval }));
 };

 const selectedPlan = plans.find(p => p.slug === selected);

 return (
 <div className="min-h-screen bg-void-950 text-white font-sans">
 <Head title="Choose your plan — VenQore" />

 {/* Ambient */}
 <div className="fixed inset-0 pointer-events-none">
 <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-900/15 rounded-full blur-[140px]" />
 <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-brand-900/10 rounded-full blur-[100px]" />
 </div>

 {/* Nav */}
 <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
 <div className="flex items-center gap-2">
 <img src="/images/logo.png" alt="VenQore" className="h-8 w-8 object-contain" />
 <span className="font-bold text-lg text-white">VenQore<span className="text-brand-400">.</span></span>
 </div>
 <Link
 href={route('hub')}
 className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-white transition-colors"
 >
 <ArrowLeft size={14} /> Back
 </Link>
 </header>

 <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 sm:py-14">

 {/* Header */}
 <div className="text-center mb-9">
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-semibold mb-5">
 <Sparkles size={14} />
 {trial_days}-day free trial · No card required
 </div>
 <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
 Choose a plan to start your trial
 </h1>
 <p className="text-ink-muted text-base max-w-xl mx-auto">
 Pick the plan that fits your store. You won't be charged today —
 we'll only bill you when your {trial_days}-day trial ends, and you can cancel anytime.
 </p>

 {/* Billing interval toggle */}
 <div className="flex items-center justify-center mt-7">
 <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
 {INTERVALS.map((opt) => (
 <button
 key={opt.key}
 onClick={() => setInterval(opt.key)}
 className={`relative px-5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-slow ${
 interval === opt.key
 ? 'bg-brand-600 text-white shadow-md'
 : 'text-ink-muted hover:text-neutral-200'
 }`}
 >
 {opt.label}
 {opt.badge && (
 <span className="absolute -top-2.5 -right-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-4xs font-bold rounded-full whitespace-nowrap">
 {opt.badge}
 </span>
 )}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Plan cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
 {plans.map((plan) => {
 const style = TIER_STYLES[plan.slug] || TIER_STYLES.starter;
 const PlanIcon = style.icon;
 const isSelected = selected === plan.slug;

 return (
 <div
 key={plan.slug}
 id={`plan-${plan.slug}`}
 onClick={() => setSelected(plan.slug)}
 className={`relative rounded-xl border cursor-pointer overflow-hidden transition-all duration-slow flex flex-col
 ${isSelected
 ? `bg-gradient-to-b ${style.accentFrom} to-transparent ${style.accentBorder} shadow-2xl ${style.glow} scale-[1.015]`
 : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04] hover:border-white/15'}`}
 >
 {plan.popular && (
 <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-brand" />
 )}
 {plan.popular && (
 <div className="absolute top-3 right-4">
 <span className="px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 text-3xs font-bold tracking-widest uppercase">
 Most Popular
 </span>
 </div>
 )}

 <div className="p-6 sm:p-7">
 {/* Icon + name */}
 <div className="flex items-center gap-3 mb-5">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}>
 <PlanIcon size={18} />
 </div>
 <div className="flex items-center gap-2">
 <span className="text-white font-bold text-base tracking-tight">{plan.name}</span>
 {isSelected && (
 <span className={`text-3xs font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
 Selected
 </span>
 )}
 </div>
 </div>

 {/* Price */}
 <div className="mb-5">
 <div className="flex items-baseline gap-1">
 <span className="text-4xl font-bold text-white tracking-tight">
 {fmt(perMonth(plan))}
 </span>
 <span className="text-ink-muted text-sm font-semibold">/mo</span>
 </div>
 <span className="text-2xs text-ink-muted font-semibold mt-1 block">
 {interval === 'annual'
 ? `billed annually — ${fmt(plan.annual_total)}/yr`
 : 'billed monthly'}
 </span>
 </div>

 <p className="text-xs text-ink-muted leading-relaxed mb-5">{plan.tagline}</p>

 {/* Features */}
 <div className="space-y-2">
 {plan.features.map((f, i) => (
 <div key={i} className="flex items-center gap-2.5">
 <Check size={12} className={`${style.dot} flex-shrink-0`} />
 <span className="text-xs text-neutral-300">{f}</span>
 </div>
 ))}
 </div>
 </div>

 {/* CTA */}
 <div className="px-6 sm:px-7 pb-6 pt-2 mt-auto">
 <button
 onClick={(e) => { e.stopPropagation(); proceed(plan.slug); }}
 className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 duration-normal flex items-center justify-center gap-2 ${
 isSelected
 ? 'bg-gradient-brand text-white shadow-lg '
 : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] border border-white/[0.06]'
 }`}
 >
 Start {plan.name} trial <ArrowRight size={13} />
 </button>
 </div>
 </div>
 );
 })}
 </div>

 {/* Sticky summary / continue */}
 <div className="max-w-2xl mx-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-start gap-3">
 <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
 <ShieldCheck size={16} className="text-emerald-400" />
 </div>
 <div>
 <p className="text-sm font-bold text-white">
 {selectedPlan ? `${selectedPlan.name} · ${interval === 'annual' ? 'Annual' : 'Monthly'}` : 'Select a plan'}
 </p>
 <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1.5">
 <Clock size={11} className="text-ink-muted" />
 Free for {selectedPlan?.trial_days ?? trial_days} days, then{''}
 {selectedPlan
 ? `${fmt(interval === 'annual' ? selectedPlan.annual_total : selectedPlan.price_monthly)}/${interval === 'annual' ? 'yr' : 'mo'}`
 : '—'}
 </p>
 </div>
 </div>
 <button
 id="select-plan-continue"
 onClick={() => selected && proceed(selected)}
 disabled={!selected}
 className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-brand text-white font-bold text-sm transition-all disabled:opacity-50 disabled:scale-100 whitespace-nowrap"
 >
 Continue <ArrowRight size={15} />
 </button>
 </div>
 <p className="text-center sm:text-left text-1xs text-ink-muted mt-4 flex items-center gap-1.5 justify-center sm:justify-start">
 <CreditCard size={11} /> No credit card required to start. Cancel anytime before your trial ends.
 </p>
 </div>

 </div>
 </div>
 );
}

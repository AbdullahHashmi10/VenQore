import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Zap, Crown, Shield, CheckCircle2, XCircle, AlertTriangle,
    ArrowRight, Calendar, Users, Package, BarChart2, Globe2,
    Cpu, GitBranch, ExternalLink, Sparkles, Lock, Infinity
} from 'lucide-react';

// ─── Plan metadata (display-only) ───────────────────────────────────────────
const PLAN_META = {
    starter:  { label: 'Starter',  price: '$19/mo',  color: '#6366f1', badge: '',          Icon: Shield },
    growth:   { label: 'Growth',   price: '$49/mo',  color: '#8b5cf6', badge: 'Popular',   Icon: Zap },
    business: { label: 'Business', price: '$99/mo',  color: '#f59e0b', badge: 'Unlimited', Icon: Crown },
    ltd_1:    { label: 'LTD — Starter',  price: 'Lifetime', color: '#10b981', badge: 'AppSumo', Icon: Sparkles },
    ltd_2:    { label: 'LTD — Growth',   price: 'Lifetime', color: '#10b981', badge: 'AppSumo', Icon: Sparkles },
    ltd_3:    { label: 'LTD — Business', price: 'Lifetime', color: '#10b981', badge: 'AppSumo', Icon: Sparkles },
};

const FEATURES = [
    { key: 'staff_limit',   icon: Users,     label: 'Staff Members' },
    { key: 'sku_limit',     icon: Package,   label: 'Products (SKUs)' },
    { key: 'locations',     icon: GitBranch, label: 'Locations / Warehouses' },
    { key: 'woocommerce',   icon: Globe2,    label: 'WooCommerce Sync' },
    { key: 'api_access',    icon: Cpu,       label: 'API Access' },
    { key: 'growth_engine', icon: Sparkles,  label: 'AI Growth Engine' },
    { key: 'reports',       icon: BarChart2, label: 'Advanced Reports' },
    { key: 'multi_branch',  icon: GitBranch, label: 'Multi-Branch' },
];

function formatLimit(val) {
    if (val === null || val === undefined) return <><Infinity size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Unlimited</>;
    if (val === false) return <XCircle size={14} color="#ef4444" style={{ display: 'inline', verticalAlign: 'middle' }} />;
    if (val === true) return <CheckCircle2 size={14} color="#10b981" style={{ display: 'inline', verticalAlign: 'middle' }} />;
    if (val === 'basic') return 'Basic';
    if (val === 'advanced') return 'Advanced';
    return val;
}

// ─── Usage Meter ─────────────────────────────────────────────────────────────
function UsageMeter({ icon: Icon, label, used, limit, color }) {
    const pct = limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const isUnlimited = limit === null;
    const isCritical  = !isUnlimited && pct >= 90;
    const isWarning   = !isUnlimited && pct >= 70;

    const barColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : color;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '15' }}>
                        <Icon size={16} color={color} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</span>
                </div>
                {isCritical && <AlertTriangle size={14} className="text-red-500" />}
            </div>

            <div className={`text-2xl font-black mb-1 ${isCritical ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                {isUnlimited
                    ? <span className="flex items-center gap-1.5">{used} <span className="text-xs text-slate-400 font-medium">/ ∞</span></span>
                    : <span>{used} <span className="text-sm font-medium text-slate-400">/ {limit}</span></span>
                }
            </div>

            {isUnlimited ? (
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Unlimited</div>
            ) : (
                <>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5 mt-2">
                        <div style={{ width: `${pct}%`, background: barColor }} className="h-full rounded-full transition-all duration-700" />
                    </div>
                    <div className={`text-[10px] font-bold ${isCritical ? 'text-red-500' : 'text-slate-400'} uppercase tracking-wider`}>
                        {pct}% used
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ planKey, planConfig, isCurrent, storeId, tenant }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const meta = PLAN_META[planKey] ?? { label: planKey, price: '—', color: '#6366f1', Icon: Shield };
    const { Icon } = meta;
    const isLtd = planKey.startsWith('ltd');

    if (isLtd && !isCurrent) return null;
    const planOrder = ['starter', 'growth', 'business'];
    const currentIdx = planOrder.indexOf(tenant?.plan);
    const thisIdx    = planOrder.indexOf(planKey);
    if (!isLtd && currentIdx >= thisIdx && !isCurrent) return null;

    return (
        <div 
            className={`relative p-6 rounded-3xl transition-all duration-300 border-2 ${
                isCurrent 
                ? 'bg-slate-50 dark:bg-slate-900 shadow-xl' 
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'
            }`}
            style={{ borderColor: isCurrent ? meta.color : undefined }}
        >
            {isCurrent && (
                <div 
                    className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white"
                    style={{ background: meta.color }}
                >
                    CURRENT PLAN
                </div>
            )}
            
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: meta.color + '15' }}>
                    <Icon size={24} color={meta.color} />
                </div>
                <div>
                    <div className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{meta.label}</div>
                    <div className="text-sm font-bold" style={{ color: meta.color }}>{meta.price}</div>
                </div>
            </div>

            <div className="space-y-3 mb-8">
                {FEATURES.map(f => {
                    const val = planConfig[f.key];
                    const enabled = val !== false;
                    return (
                        <div key={f.key} className="flex items-center gap-3 text-xs">
                            {enabled
                                ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                : <XCircle size={14} className="text-slate-200 dark:text-slate-800 shrink-0" />}
                            <span className={`font-medium ${enabled ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 line-through opacity-50'}`}>
                                {f.label}
                                {typeof val === 'number' ? `: ${val}` : ''}
                                {val === null ? ': Unlimited' : ''}
                            </span>
                        </div>
                    );
                })}
            </div>

            {!isCurrent && !isLtd && (
                <button
                    onClick={() => window.location.href = route('store.billing.upgrade', { store_slug: storeSlug, plan: planKey })}
                    className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}dd)` }}
                >
                    Upgrade to {meta.label} <ArrowRight size={16} />
                </button>
            )}
            {isCurrent && !isLtd && (
                <button
                    onClick={() => window.location.href = route('store.billing.portal', { store_slug: storeSlug })}
                    className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                    style={{ borderColor: meta.color + '40', color: meta.color }}
                >
                    <ExternalLink size={16} /> Manage Subscription
                </button>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BillingIndex({ tenant, plans, usage }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;

    const currentPlanKey = tenant?.plan ?? 'starter';
    const currentMeta    = PLAN_META[currentPlanKey] ?? PLAN_META.starter;
    const isLtd          = currentPlanKey.startsWith('ltd');
    const subEndsAt = tenant?.subscription_ends_at
        ? new Date(tenant.subscription_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    const isTrial = tenant?.status === 'trial' || (tenant?.trial_ends_at && new Date(tenant.trial_ends_at) > new Date());
    const trialDaysLeft = tenant?.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at) - new Date()) / 86400000))
        : null;

    const usageData = usage ?? {};

    return (
        <OneGlanceLayout title="Billing & Subscription" mode="admin">
            <Head title="Billing & Subscription" />

            <div className="max-w-6xl mx-auto p-4 md:p-8">

                {/* Header */}
                <div className="mb-0">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-indigo-500/10 rounded-2xl text-indigo-500">
                             <Receipt size={28} />
                        </span>
                        Billing & Subscription
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium uppercase tracking-widest">{tenant?.name}</p>
                </div>

                {/* Trial Alert Banner */}
                {isTrial && (
                    <div className="mt-8 mb-8 p-6 rounded-[2rem] bg-gradient-to-r from-amber-500 to-orange-600 shadow-xl shadow-amber-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                                    <Zap size={28} className="fill-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight leading-none mb-1">Evaluation Period</h2>
                                    <p className="text-white/80 font-bold text-sm tracking-wide uppercase">You have <span className="text-white font-black underline decoration-2 underline-offset-4">{trialDaysLeft} days</span> remaining in your trial.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => window.location.href = route('store.billing.portal', { store_slug: storeSlug })}
                                className="px-8 py-4 bg-white text-orange-600 rounded-[1.25rem] font-black text-sm uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Current Plan Summary */}
                <div className={`mb-8 p-8 rounded-[2.5rem] border-2 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden ${
                    isTrial ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }`}>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg" style={{ background: currentMeta.color + '15' }}>
                            <currentMeta.Icon size={32} color={currentMeta.color} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active Plan</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-white">{currentMeta.label}</div>
                            <div className="text-sm font-bold text-slate-400 mt-1">
                                {isTrial ? `${trialDaysLeft} days trial remaining` : isLtd ? 'Lifetime License' : subEndsAt ? `Renews on ${subEndsAt}` : 'Active Subscription'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
                        {!isLtd && (
                            <button
                                onClick={() => window.location.href = route('store.billing.portal', { store_slug: storeSlug })}
                                className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                            >
                                <ExternalLink size={16} /> Billing Portal
                            </button>
                        )}
                        <div className="px-5 py-2 rounded-full font-black text-xs tracking-widest uppercase" style={{ background: currentMeta.color + '20', color: currentMeta.color }}>
                            {currentPlanKey}
                        </div>
                    </div>
                </div>

                {/* Usage Section */}
                <div className="mb-12">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                         <BarChart2 size={16} /> Plan Usage
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <UsageMeter
                            icon={Users} label="Staff Members" color="#6366f1"
                            used={usageData.staff_count ?? 0}
                            limit={usageData.staff_limit}
                        />
                        <UsageMeter
                            icon={Package} label="Products (SKUs)" color="#10b981"
                            used={usageData.product_count ?? 0}
                            limit={usageData.sku_limit}
                        />
                        <UsageMeter
                            icon={GitBranch} label="Locations" color="#f59e0b"
                            used={usageData.location_count ?? 1}
                            limit={usageData.locations}
                        />
                    </div>
                </div>

                {/* Plans Grid */}
                <div>
                     <div className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 text-center">
                         {isLtd ? 'Your Early Supporter Perks' : '🚀 Ready to supercharge your business?'}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* If Trial - Show standard plans */}
                        {isTrial ? (
                             ['starter', 'growth', 'business'].map(key => (
                                <PlanCard
                                    key={key}
                                    planKey={key}
                                    planConfig={plans?.[key] ?? {}}
                                    isCurrent={false}
                                    storeId={store?.id}
                                    tenant={{ plan: 'none' }}
                                />
                            ))
                        ) : (
                            /* If Subscribed - Show upgrade options */
                            Object.entries(plans ?? {}).map(([key, config]) => (
                                <PlanCard
                                    key={key}
                                    planKey={key}
                                    planConfig={config}
                                    isCurrent={key === currentPlanKey}
                                    storeId={store?.id}
                                    tenant={tenant}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* AppSumo Note */}
                <div className="mt-16 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <strong className="text-slate-800 dark:text-slate-200">Have a promo code?</strong> Redeem your keys at <a href="/redeem" className="text-indigo-500 font-bold underline decoration-2 underline-offset-4">/redeem</a>.
                    </p>
                </div>
            </div>
        </OneGlanceLayout>
    );
}

// Add Receipt to imports
import { Receipt } from 'lucide-react';

import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import Modal from '@/Components/Modal';
import { useTermText } from '@/lib/terms';
import { openLemonCheckout, closeLemonCheckout, preloadLemonCheckout } from '@/lib/lemonCheckout';
import { vq } from '@/theme/runtime';
import { normalizePlan, planRank, SELF_SERVE_PLANS, PLAN_PRICE_USD } from '@/lib/plans';
import {
    Zap, Crown, Shield, CheckCircle2, XCircle, AlertTriangle,
    ArrowRight, Calendar, Users, Package, BarChart2, Globe2,
    Cpu, GitBranch, ExternalLink, Sparkles, Lock, Infinity as InfinityIcon,
    Receipt, Download, Info, HelpCircle, MessageSquare, Monitor,
    BadgeCheck, ScanFace, RefreshCw, History, CreditCard, FileText,
    Clock, Loader2, Smartphone, HardDrive, Check, ArrowUpRight,
    TrendingUp, Layers, AlertCircle
} from 'lucide-react';

// ── PKR MASTER SWITCH (see Pricing.jsx) — OFF for USD-only launch ──────
const PKR_ENABLED = false;

// ── V6 Plan metadata & styling ─────────────────────────────────────────────
const PLAN_META = {
    solo: {
        label: 'Solo',
        monthlyUSD: 0,
        annualUSD: 0,
        priceDisplay: '$0',
        period: '/forever',
        tag: 'Free forever',
        color: '#0BAA8F',
        Icon: Monitor,
        desc: 'One person, one register. Free forever with structural limits.',
        perks: [
            'Up to 500 products (SKUs)',
            '1 location, 1 full seat (2 till logins)',
            '1 register (POS till)',
            '100 sales & 20 service jobs/mo',
            'Core Ledger + all 43 financial reports',
            '30-day history visible (older safely kept)',
            'SmartCapture: 10 scans / 100 AI credits',
            'Help centre + Vena support'
        ],
    },
    starter: {
        label: 'Starter',
        monthlyUSD: 49,
        annualUSD: 490,
        priceDisplay: '$49',
        period: '/month',
        tag: 'Essential Till',
        color: '#3B82F6',
        Icon: Shield,
        desc: 'A shop with a couple of people on the till and full history.',
        perks: [
            'Up to 5,000 products (SKUs)',
            '1 location, 1 full seat (+ $15/mo per extra seat)',
            '2 registers (cashier PIN logins unlimited)',
            'Full history retention (unlimited days)',
            'Google Drive automated backup included',
            '500 AI credits/month + 1 rebuild / 90 days',
            'Email support (2 business days)'
        ],
    },
    core: {
        label: 'Core',
        monthlyUSD: 99,
        annualUSD: 990,
        priceDisplay: '$99',
        period: '/month',
        tag: 'Most Popular',
        featured: true,
        color: '#8B5CF6',
        Icon: Zap,
        desc: 'Multi-branch stock, API access, audit logs, custom roles and signals.',
        perks: [
            'Up to 25,000 products (SKUs)',
            '1 location, 5 full seats (+ $15/mo per extra seat)',
            'Up to 6 registers (cashier PIN logins unlimited)',
            'Multi-branch transfers (activates with 2nd location)',
            'Full REST API access & webhooks',
            'Audit trail & custom granular roles',
            '2,000 AI credits/month + 1 rebuild / 90 days',
            'Priority email support (1 business day)'
        ],
    },
    scale: {
        label: 'Scale',
        monthlyUSD: 299,
        annualUSD: 2990,
        priceDisplay: '$299',
        period: '/month',
        tag: 'Enterprise Scale',
        color: '#F59E0B',
        Icon: Crown,
        desc: 'Large operations, custom roles, white-label and channel sync.',
        perks: [
            'Up to 250,000 products (SKUs)',
            '1 location, 25 full seats',
            'Up to 20 registers (cashier PIN logins unlimited)',
            'Multi-branch & inter-branch transfers',
            'White-label & consolidated multi-entity reporting',
            '2 channel syncs included (WooCommerce/Amazon)',
            '10,000 AI credits/month + 1 rebuild / month',
            'Named contact (4 business hours SLA)'
        ],
    },
    custom: {
        label: 'Custom Enterprise',
        monthlyUSD: 800,
        annualUSD: null,
        priceDisplay: '$800+',
        period: '/month',
        tag: 'Tailored SLA',
        color: '#EC4899',
        Icon: Crown,
        desc: 'Dedicated multi-entity enterprise cluster with tailored SLA.',
        perks: [
            'Unlimited products & custom SKU capacity',
            'Unlimited full seats & cashiers',
            'Unlimited registers across all locations',
            'Dedicated database partition & private hosting option',
            'Custom ERP workflow integrations',
            '24/7 Phone & Slack channel SLA'
        ],
    },
};

// Aliases
PLAN_META.growth = PLAN_META.core;
PLAN_META.business = PLAN_META.scale;
PLAN_META.counter = PLAN_META.solo;

// --- Onboarding Service Tiers ---
const SERVICE_TIERS = {
    basic: { name: 'Basic Upload', priceUSD: 1.00, pricePKR: 100, extraUSD: 0.50, extraPKR: 50, sla: '2–3 business days', desc: 'Product data uploaded with all core fields. Up to 5 variants per product included.' },
    descriptions: { name: '+ Rich Descriptions', priceUSD: 1.50, pricePKR: 150, extraUSD: 0.50, extraPKR: 50, sla: '3–5 business days', desc: 'Everything in Basic + long descriptions, SEO copy, and full product detail. You provide images.' },
    images: { name: '+ AI Images', priceUSD: 2.00, pricePKR: 200, extraUSD: 0.50, extraPKR: 50, sla: '4–6 business days', desc: 'Everything in Descriptions + we source or AI-generate product images for you.' },
};

function formatLimit(val) {
    if (val === null || val === undefined) return <><InfinityIcon size={13} className="inline align-middle" /> Unlimited</>;
    if (val === false) return <XCircle size={13} className="inline align-middle text-rose-500" />;
    if (val === true) return <CheckCircle2 size={13} className="inline align-middle text-emerald-400" />;
    if (val === 'basic') return 'Basic';
    if (val === 'advanced') return 'Advanced';
    return val;
}

// ── V6 Usage Meter Card ──────────────────────────────────────────────────────
function UsageMeterCard({ icon: Icon, label, used, limit, suffix = '', helper = null }) {
    const isUnlimited = limit === null || limit === undefined;
    const usedNum = Number(used) || 0;
    const limitNum = Number(limit) || 0;
    const pct = isUnlimited ? 0 : Math.min(100, Math.round((usedNum / Math.max(1, limitNum)) * 100));
    const isCritical = !isUnlimited && pct >= 90;
    const isWarning = !isUnlimited && pct >= 75 && pct < 90;

    const barColor = isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-[#0BAA8F]';
    const textColor = isCritical ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-ink';

    return (
        <div className="p-5 rounded-2xl bg-surface border border-line shadow-sm hover:border-line-strong hover:shadow-md transition-all flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-surface-raised text-ink-secondary border border-line">
                            <Icon size={16} />
                        </div>
                        <span className="text-xs font-semibold text-ink-secondary">{label}</span>
                    </div>
                    {isCritical && <AlertTriangle size={14} className="text-rose-500 shrink-0" />}
                </div>

                <div className={`text-2xl font-bold tracking-tight mb-1 font-mono ${textColor}`}>
                    {isUnlimited ? (
                        <span className="flex items-center gap-1.5">
                            {usedNum.toLocaleString()}
                            <span className="text-xs text-ink-muted font-sans font-medium">/ ∞</span>
                        </span>
                    ) : (
                        <span>
                            {usedNum.toLocaleString()}
                            <span className="text-xs text-ink-muted font-sans font-medium"> / {limitNum.toLocaleString()}{suffix}</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-line">
                {isUnlimited ? (
                    <div className="flex items-center justify-between text-2xs font-semibold">
                        <span className="text-[#0BAA8F] uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={11} /> Uncapped Capacity
                        </span>
                        {helper && <span className="text-ink-muted">{helper}</span>}
                    </div>
                ) : (
                    <>
                        <div className="h-2 bg-surface-raised border border-line rounded-full overflow-hidden mb-1.5">
                            <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            />
                        </div>
                        <div className="flex items-center justify-between text-2xs">
                            <span className={`font-semibold uppercase tracking-wider ${isCritical ? 'text-rose-600 dark:text-rose-400 font-bold' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-ink-muted'}`}>
                                {pct}% utilized
                            </span>
                            {helper && <span className="text-ink-muted text-3xs">{helper}</span>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── V6 Plan Card ─────────────────────────────────────────────────────────────
function PlanCardV6({
    planKey,
    _planConfig,
    isCurrent,
    _storeSlug,
    tenant,
    onSelectPlan,
    onCheckout,
    checkoutBusy = null,
    billingCycle = 'monthly',
    currencyDisplay = 'USD'
}) {
    const meta = PLAN_META[planKey] || { label: planKey, priceDisplay: '—', color: '#0BAA8F', Icon: Shield, perks: [] };
    const { Icon } = meta;
    const isLtd = planKey.startsWith('ltd');

    const currentIdx = planRank(tenant?.plan);
    const thisIdx = planRank(planKey);
    const isAnnual = billingCycle === 'annual';
    const isCheckingOut = checkoutBusy === planKey;

    // Pricing calculation
    const monthlyRate = meta.monthlyUSD;
    const annualRate = meta.annualUSD;
    const effectiveMonthly = isAnnual && annualRate ? Math.round(annualRate / 12) : monthlyRate;

    return (
        <div
            className={`relative p-6 sm:p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isCurrent
                    ? 'bg-surface border-2 border-[#0BAA8F] shadow-lg ring-2 ring-[#0BAA8F]/20'
                    : meta.featured
                    ? 'bg-surface border-2 border-[#8B5CF6] dark:border-[#A78BFA] shadow-lg ring-2 ring-purple-500/20'
                    : 'bg-surface border border-line shadow-sm hover:border-line-strong hover:shadow-md'
            }`}
        >
            {/* Badges */}
            <div className="flex items-center justify-between gap-2 mb-4">
                {isCurrent ? (
                    <span className="px-3 py-1 rounded-full text-3xs font-bold tracking-widest text-white bg-[#0BAA8F] shadow-sm flex items-center gap-1">
                        <CheckCircle2 size={11} /> CURRENT PLAN
                    </span>
                ) : meta.tag ? (
                    <span className={`px-2.5 py-1 rounded-full text-3xs font-bold tracking-widest uppercase ${
                        meta.featured
                            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50'
                            : 'bg-surface-raised text-ink-muted border border-line'
                    }`}>
                        {meta.tag}
                    </span>
                ) : <span />}

                {isAnnual && annualRate && (
                    <span className="px-2 py-0.5 rounded-full text-3xs font-bold tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                        2 MOS FREE
                    </span>
                )}
            </div>

            <div>
                {/* Header */}
                <div className="flex items-center gap-3.5 mb-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-line"
                        style={{ background: meta.color + '18', color: meta.color }}
                    >
                        <Icon size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-ink leading-tight">{meta.label}</h3>
                        <p className="text-2xs text-ink-muted mt-0.5 line-clamp-1">{meta.desc}</p>
                    </div>
                </div>

                {/* Price Display */}
                <div className="py-4 my-2 border-y border-line">
                    <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight font-mono">
                            ${isAnnual && annualRate ? effectiveMonthly : monthlyRate}
                        </span>
                        <span className="text-xs text-ink-muted font-sans font-medium">
                            {monthlyRate === 0 ? '/forever' : '/month'}
                        </span>
                    </div>
                    {isAnnual && annualRate > 0 && (
                        <div className="text-2xs text-ink-muted font-medium mt-1">
                            Billed annually as <span className="font-semibold text-ink">${annualRate}/year</span>
                        </div>
                    )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 my-6 text-xs">
                    {(meta.perks || []).map((perk, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-ink-secondary">
                            <Check size={15} className="text-[#0BAA8F] shrink-0 mt-0.5" />
                            <span className="leading-snug text-xs">{perk}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action CTA Button */}
            <div className="pt-4 border-t border-line mt-auto">
                {isCurrent ? (
                    (tenant?.status === 'trial' || tenant?.status === 'suspended') ? (
                        <button
                            onClick={() => onCheckout?.(planKey, isAnnual ? 'annual' : 'monthly', currencyDisplay)}
                            disabled={isCheckingOut}
                            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-[#0BAA8F] hover:bg-[#09927D] text-white shadow-md transition-all active:scale-98"
                        >
                            {isCheckingOut ? <Loader2 size={15} className="animate-spin" /> : <>Activate Subscription <ArrowRight size={14} /></>}
                        </button>
                    ) : (
                        <div className="text-center py-3 text-xs font-bold text-[#0BAA8F] uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2">
                            <CheckCircle2 size={15} /> Active Plan
                        </div>
                    )
                ) : isLtd ? (
                    <div className="text-center py-3 text-xs font-bold text-ink-muted uppercase tracking-widest bg-surface-raised border border-line rounded-xl">
                        Lifetime Supporter
                    </div>
                ) : (
                    <button
                        onClick={() => onSelectPlan(planKey)}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-98 ${
                            thisIdx > currentIdx
                                ? 'bg-[#0BAA8F] hover:bg-[#09927D] text-white shadow-md hover:shadow-lg'
                                : 'bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink font-semibold'
                        }`}
                    >
                        <span>{thisIdx > currentIdx ? `Upgrade to ${meta.label}` : `Select ${meta.label}`}</span>
                        <ArrowRight size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function BillingIndex({
    tenant,
    plans,
    usage,
    feature_status,
    country,
    pk_verification,
    trial_credit = null,
    intended_plan = null,
    current_plan = null
}) {
    const tt = useTermText();
    const { store, pricing } = usePage().props;
    const aiTiers = pricing?.ai_tiers || {};
    const storeSlug = store?.slug || tenant?.slug || 'my-store';
    const isPK = PKR_ENABLED && country === 'PK' && pk_verification?.status === 'approved';

    // 4 Streamlined Tabs: 'subscription' | 'usage' | 'addons' | 'payments'
    const [activeTab, setActiveTab] = useState('subscription');

    const [billingCycle, setBillingCycle] = useState('monthly');
    const [currencyDisplay, setCurrencyDisplay] = useState(isPK ? 'PKR' : 'USD');

    // Onboarding Setup Service States
    const [calcProducts, setCalcProducts] = useState('');
    const [calcVariants, setCalcVariants] = useState('');
    const [selectedService, setSelectedService] = useState('basic');
    const [isOrderingService, setIsOrderingService] = useState(false);

    // Payment History State
    const [history, setHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);

    const loadHistory = async (fresh = false) => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const res = await fetch(
                route('store.billing.payment-history', { store_slug: storeSlug, ...(fresh ? { fresh: 1 } : {}) }),
                { headers: { Accept: 'application/json' } }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setHistory(await res.json());
        } catch (err) {
            console.error('[billing] payment history failed', err);
            setHistoryError('Could not load payment history. Please try again.');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'payments' && !history && !historyLoading) {
            loadHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const fmtDay = (iso) => iso
        ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

    // Preload checkout script
    useEffect(() => {
        preloadLemonCheckout();
    }, []);

    const toast = (message, type = 'info') => {
        window.dispatchEvent(new CustomEvent('amd:toast', { detail: { message, type } }));
    };

    // Subscription sync state
    const [isSyncing, setIsSyncing] = useState(false);
    const runSubscriptionSync = async ({ silent = false } = {}) => {
        setIsSyncing(true);
        try {
            const res = await fetch(route('store.billing.sync-subscription', { store_slug: storeSlug }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
            });
            const data = await res.json().catch(() => ({}));
            if (data?.synced) {
                if (!silent) {
                    toast(data.message || 'Subscription synced.', 'success');
                    router.reload({ preserveScroll: true });
                }
            } else {
                if (!silent) toast(data?.message || 'Subscription checked. No changes.', 'info');
            }
        } catch (e) {
            if (!silent) toast('Failed to check with payment provider.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    // Checkout execution helper
    const launchCheckout = (getUrlAsync, { context = 'checkout', successMessage = 'Payment received!', onDone } = {}) => {
        getUrlAsync()
            .then((url) => {
                if (!url) {
                    onDone?.();
                    return;
                }
                openLemonCheckout(url, {
                    onSuccess: () => {
                        toast(successMessage, 'success');
                        runSubscriptionSync({ silent: true });
                        router.reload({ preserveScroll: true });
                    },
                    onClose: () => {
                        onDone?.();
                    }
                });
            })
            .catch(() => {
                toast('Failed to open checkout overlay. Please try again.', 'error');
                onDone?.();
            });
    };

    const postForCheckoutUrl = async (routeName, payload = {}) => {
        const res = await fetch(route(routeName, { store_slug: storeSlug }), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (data?.url) return data.url;
        toast(data?.error || 'An unexpected error occurred.', 'error');
        return null;
    };

    // Purchase add-on
    const [isPurchasingAddon, setIsPurchasingAddon] = useState(null);
    const handlePurchaseAddon = (addonType) => {
        setIsPurchasingAddon(addonType);
        launchCheckout(
            () => postForCheckoutUrl('store.billing.checkout-addon', { addon_type: addonType }),
            {
                context: 'addon',
                successMessage: 'Payment received — activating your add-on…',
                onDone: () => setIsPurchasingAddon(null)
            }
        );
    };

    // Plan Checkout
    const [checkoutBusy, setCheckoutBusy] = useState(null);
    const [pendingCheckout, setPendingCheckout] = useState(null);

    const trialCreditFor = (cycle = billingCycle) => {
        if (!trial_credit) return null;
        const percent = cycle === 'annual' ? trial_credit.percent_annual : trial_credit.percent_monthly;
        if (!percent || percent <= 0) return null;
        return { percent, daysRemaining: trial_credit.days_remaining };
    };

    const handlePlanCheckout = (planKey, cycle = billingCycle, currency = currencyDisplay) => {
        if (checkoutBusy) return;
        if (trialCreditFor(cycle)) {
            setPendingCheckout({ planKey, cycle, currency });
            return;
        }
        startPlanCheckout(planKey, cycle, currency);
    };

    const startPlanCheckout = (planKey, cycle = billingCycle, currency = currencyDisplay) => {
        setPendingCheckout(null);
        setCheckoutBusy(planKey);
        launchCheckout(
            async () => {
                const res = await fetch(route('store.billing.upgrade', {
                    store_slug: storeSlug,
                    plan: planKey,
                    cycle: cycle === 'annual' ? 'annual' : 'monthly',
                    currency,
                    format: 'json',
                }), {
                    headers: { 'Accept': 'application/json' },
                });
                const data = await res.json().catch(() => ({}));
                if (data?.url) return data.url;
                toast(data?.error || 'Checkout unavailable right now. Please try again.', 'error');
                return null;
            },
            {
                context: 'plan',
                successMessage: 'Payment received — applying your new plan…',
                onDone: () => setCheckoutBusy(null)
            }
        );
    };

    // Plan change modal
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

    const handleSelectPlan = (planKey) => {
        setSelectedPlan(planKey);
        setIsChangeModalOpen(true);
    };

    const handleConfirmPlanChange = () => {
        router.post(route('store.billing.change-plan', { store_slug: storeSlug }), { plan: selectedPlan }, {
            onSuccess: () => setIsChangeModalOpen(false)
        });
    };

    // Current plan normalized
    const currentPlanKey = normalizePlan(current_plan ?? tenant?.plan ?? 'starter');
    const currentMeta = PLAN_META[currentPlanKey] || PLAN_META.starter;
    const isLtd = currentPlanKey.startsWith('ltd');

    const subEndsAt = tenant?.subscription_ends_at
        ? new Date(tenant.subscription_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    const subDaysLeft = tenant?.subscription_ends_at
        ? Math.max(0, Math.ceil((new Date(tenant.subscription_ends_at) - new Date()) / 86400000))
        : null;

    const lsStatus = history?.subscription?.status ?? null;
    const lsIsTrialling = lsStatus === 'on_trial';
    const lsIsPaying = lsStatus ? ['active', 'past_due', 'cancelled'].includes(lsStatus) : null;
    const isTrial = tenant?.status === 'trial' || lsIsTrialling;
    const confirmedPaying = lsIsPaying ?? (tenant?.status === 'active');
    const statusMismatch = lsStatus !== null && ((tenant?.status === 'active') !== !!lsIsPaying);

    const trialEndsAt = (lsIsTrialling && (history?.subscription?.trial_ends_at || history?.subscription?.expires_at))
        || (tenant?.status === 'trial' ? tenant?.trial_ends_at : null);

    const trialDaysLeft = isTrial && trialEndsAt
        ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / 86400000))
        : null;

    const isViewOnly = tenant?.view_only_since !== null;
    const viewOnlyDaysLeft = tenant?.view_only_since
        ? Math.max(0, 30 - Math.ceil((new Date() - new Date(tenant.view_only_since)) / 86400000))
        : 30;

    const usageData = usage || {};

    // Catalog setup service calculation
    const calcProductsNum = Math.max(0, parseInt(calcProducts) || 0);
    const calcVariantsNum = Math.max(1, parseInt(calcVariants) || 1);
    const serviceTier = SERVICE_TIERS[selectedService];
    const extraBlocks = calcVariantsNum > 5 ? Math.ceil((calcVariantsNum - 5) / 5) : 0;
    const usdPricePerProduct = serviceTier ? serviceTier.priceUSD + extraBlocks * serviceTier.extraUSD : 0;
    const usdTotalSetupCost = calcProductsNum * usdPricePerProduct;

    const handleOrderSetupService = () => {
        setIsOrderingService(true);
        launchCheckout(
            () => postForCheckoutUrl('store.billing.checkout-upload-service', {
                tier: selectedService,
                products: calcProductsNum,
                variants: calcVariantsNum
            }),
            {
                context: 'setup-service',
                successMessage: 'Order received — our catalog team will be in touch shortly.',
                onDone: () => setIsOrderingService(false)
            }
        );
    };

    // Cancellation modal
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelBusy, setCancelBusy] = useState(false);
    const [resumeBusy, setResumeBusy] = useState(false);

    const paidUntilLabel = history?.subscription?.expires_at
        ? fmtDay(history.subscription.expires_at)
        : (subEndsAt || null);

    const submitCancelSubscription = () => {
        setCancelBusy(true);
        router.post(route('store.billing.cancel-subscription', { store_slug: storeSlug }), {}, {
            preserveScroll: true,
            onFinish: () => {
                setCancelBusy(false);
                setCancelOpen(false);
                setHistory(null);
                if (activeTab === 'payments') loadHistory(true);
            },
        });
    };

    const submitResumeSubscription = () => {
        setResumeBusy(true);
        router.post(route('store.billing.resume-subscription', { store_slug: storeSlug }), {}, {
            preserveScroll: true,
            onFinish: () => {
                setResumeBusy(false);
                setHistory(null);
                if (activeTab === 'payments') loadHistory(true);
            },
        });
    };

    return (
        <>
            <Head title="Billing & Subscription — VenQore" />

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

                {/* ── View-Only Mode Warning Banner ─────────────────────────── */}
                {isViewOnly && (
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/90 via-red-900/60 to-black border border-red-500/30 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white leading-tight mb-1">View-Only Mode Active</h2>
                                    <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
                                        Your trial or subscription has expired. Reports and data export remain available, but transaction entry and modifications are locked.
                                        <span className="text-red-400 font-semibold block mt-1">Data preserved for {viewOnlyDaysLeft} days before archival purge.</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 shrink-0">
                                <button
                                    onClick={() => handleSelectPlan('starter')}
                                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    Activate Store
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Active Plan Hero Card ─────────────────────────────────── */}
                <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5 relative z-10">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-line"
                            style={{
                                background: currentMeta.color + '15',
                                borderColor: currentMeta.color + '30',
                                color: currentMeta.color
                            }}
                        >
                            <currentMeta.Icon size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-3xs font-bold uppercase tracking-widest text-[#0BAA8F]">Active Subscription</span>
                                <span className="px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-surface-raised text-ink-secondary border border-line">
                                    {currentPlanKey}
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-ink tracking-tight">{currentMeta.label}</div>
                            <div className="text-xs text-ink-muted mt-1">
                                {isViewOnly ? `View-Only Mode (${viewOnlyDaysLeft} days remaining)`
                                    : tenant?.status === 'suspended' ? 'Trial Expired / Suspended'
                                    : isTrial ? (trialDaysLeft !== null
                                        ? `Free trial — ${trialDaysLeft} ${trialDaysLeft === 1 ? 'day' : 'days'} remaining`
                                        : 'Free evaluation trial')
                                    : isLtd ? 'Lifetime Supporter License'
                                    : subEndsAt ? `Renews on ${subEndsAt}`
                                    : 'Active subscription'}
                            </div>

                            {isTrial && trialCreditFor(billingCycle) && (
                                <div className="text-2xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
                                    <Zap size={12} className="fill-emerald-500 text-emerald-500" />
                                    <span>Pay early and unused days become a {trialCreditFor(billingCycle).percent}% credit on your first invoice.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto">
                        {/* Primary Pay Button */}
                        {!confirmedPaying && !isLtd && !isViewOnly && (
                            <button
                                disabled={checkoutBusy === currentPlanKey}
                                onClick={() => handlePlanCheckout(currentPlanKey, billingCycle, currencyDisplay)}
                                className="px-6 py-3 rounded-xl bg-[#0BAA8F] hover:bg-[#09927D] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-98"
                            >
                                <Zap size={14} className="fill-white" />
                                <span>{checkoutBusy === currentPlanKey ? 'Opening…' : 'Pay Now'}</span>
                            </button>
                        )}

                        {/* Direct Link to Native Apps */}
                        <Link
                            href={route('store.apps', { store_slug: storeSlug })}
                            className="px-5 py-3 rounded-xl bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                        >
                            <Monitor size={14} className="text-[#0BAA8F]" />
                            <span>Download Apps</span>
                        </Link>

                        {/* Update Card Link (direct LS session) */}
                        {history?.subscription?.update_card_url && !isViewOnly && (
                            <a
                                href={history.subscription.update_card_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-3 rounded-xl bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                            >
                                <CreditCard size={14} /> <span>Update Card</span>
                            </a>
                        )}

                        {/* Resume / Cancel triggers */}
                        {confirmedPaying && !isLtd && !isViewOnly && !history?.subscription?.is_cancelled && (
                            <button
                                onClick={() => setCancelOpen(true)}
                                className="px-3.5 py-3 text-ink-muted hover:text-rose-500 text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                        )}

                        {history?.subscription?.is_cancelled && !isLtd && !isViewOnly && (
                            <button
                                onClick={submitResumeSubscription}
                                disabled={resumeBusy}
                                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                            >
                                <RefreshCw size={14} className={resumeBusy ? 'animate-spin' : ''} />
                                <span>Resume</span>
                            </button>
                        )}

                        {/* Re-sync button */}
                        <button
                            onClick={() => runSubscriptionSync()}
                            disabled={isSyncing}
                            title="Re-check status with Lemon Squeezy"
                            className="p-3 rounded-xl bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink-muted hover:text-ink transition-all"
                        >
                            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* ── 4 Streamlined Tabs Navigation ─────────────────────────── */}
                <div className="flex border-b border-line overflow-x-auto gap-2">
                    {[
                        { id: 'subscription', label: 'Subscription & Plans', icon: Receipt },
                        { id: 'usage', label: 'Resource Usage & Limits', icon: BarChart2 },
                        { id: 'addons', label: 'Add-ons & Services', icon: Sparkles },
                        { id: 'payments', label: 'Payment History', icon: History },
                    ].map((tab) => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'border-[#0BAA8F] text-[#0BAA8F] bg-[#0BAA8F]/5'
                                        : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
                                }`}
                            >
                                <TabIcon size={15} />
                                <span>{tt(tab.label)}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ── TAB 1: SUBSCRIPTION & PLANS ───────────────────────────── */}
                {activeTab === 'subscription' && (
                    <div className="space-y-10 animate-fadeIn">

                        {/* Apps Download Promo Callout */}
                        <div className="p-6 rounded-2xl bg-surface border border-[#0BAA8F]/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#0BAA8F]/10 border border-[#0BAA8F]/25 flex items-center justify-center text-[#0BAA8F] shrink-0">
                                    <Monitor size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-ink">Need Raw Hardware Receipt Printing &amp; Peripherals?</h4>
                                    <p className="text-xs text-ink-muted mt-0.5">
                                        Download <span className="text-ink font-semibold">VenQore Station for Windows</span> for raw ESC/POS printing, cash drawers, and scales.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route('store.apps', { store_slug: storeSlug })}
                                className="px-5 py-2.5 rounded-xl bg-[#0BAA8F] hover:bg-[#09927D] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-sm"
                            >
                                <span>Download Apps</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        {/* Billing Cycle Toggle */}
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest">Select Billing Term</div>
                            <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-surface-raised border border-line shadow-inner">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                        billingCycle === 'monthly'
                                            ? 'bg-surface text-ink shadow-sm border border-line'
                                            : 'text-ink-muted hover:text-ink'
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('annual')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                        billingCycle === 'annual'
                                            ? 'bg-[#0BAA8F] text-white shadow-sm'
                                            : 'text-ink-muted hover:text-ink'
                                    }`}
                                >
                                    <span>Annual</span>
                                    <span className="text-3xs px-1.5 py-0.5 rounded-full font-bold bg-black/15 text-white">
                                        SAVE ~17%
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* V6 Plans Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {SELF_SERVE_PLANS.map((planKey) => (
                                <PlanCardV6
                                    key={planKey}
                                    planKey={planKey}
                                    _planConfig={plans?.find(p => p.slug === planKey)?.limits || {}}
                                    isCurrent={planKey === currentPlanKey}
                                    _storeSlug={storeSlug}
                                    tenant={tenant}
                                    onSelectPlan={handleSelectPlan}
                                    onCheckout={handlePlanCheckout}
                                    checkoutBusy={checkoutBusy}
                                    billingCycle={billingCycle}
                                    currencyDisplay={currencyDisplay}
                                />
                            ))}
                        </div>

                        {/* V6 Universal Guarantees: "Nothing Important is Withheld" */}
                        <div className="p-8 rounded-2xl bg-surface border border-line shadow-sm">
                            <div className="text-2xs font-bold text-[#0BAA8F] uppercase tracking-widest mb-1">
                                In Every Plan, At Every Price
                            </div>
                            <h3 className="text-xl font-bold text-ink mb-6">Nothing Important is Withheld.</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs text-ink-secondary">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[#0BAA8F] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-ink">The Complete Double-Entry Ledger</div>
                                        <p className="text-2xs text-ink-muted mt-0.5">Automated balanced journal entries, chart of accounts, and fiscal compliance.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[#0BAA8F] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-ink">All 43 Financial &amp; Tax Reports</div>
                                        <p className="text-2xs text-ink-muted mt-0.5">P&amp;L, Balance Sheet, Cash Flow, Party Statements, and Tax breakdowns included.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[#0BAA8F] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-ink">Unlimited Transactions on Paid Plans</div>
                                        <p className="text-2xs text-ink-muted mt-0.5">Process thousands of daily till orders without artificial per-transaction fees.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[#0BAA8F] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-ink">Offline POS Mode</div>
                                        <p className="text-2xs text-ink-muted mt-0.5">Keep ringing up sales even during internet drops; orders sync automatically when restored.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[#0BAA8F] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-ink">Full Data Ownership &amp; Export</div>
                                        <p className="text-2xs text-ink-muted mt-0.5">Export all customers, products, and ledger postings anytime in open CSV/JSON formats.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[#0BAA8F] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-ink">Zero Implementation or Consultant Fees</div>
                                        <p className="text-2xs text-ink-muted mt-0.5">Priced like software, not a months-long consulting project. Ready in 4 minutes.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* ── TAB 2: RESOURCE USAGE & LIMITS ────────────────────────── */}
                {activeTab === 'usage' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="p-6 rounded-2xl bg-surface border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-ink">Live Store Resource Usage</h3>
                                <p className="text-xs text-ink-muted mt-0.5">
                                    Real-time tracking of active database records and monthly operational metrics under your <span className="text-ink font-semibold capitalize">{currentPlanKey}</span> tier.
                                </p>
                            </div>
                            <div className="text-2xs text-ink-muted">
                                Evaluated live against active tenant records
                            </div>
                        </div>

                        {/* 10-Point Resource Meters Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <UsageMeterCard
                                icon={Package}
                                label="Products (SKUs)"
                                used={usageData.product_count ?? 0}
                                limit={usageData.sku_limit}
                                helper="Active catalogue items"
                            />

                            <UsageMeterCard
                                icon={Users}
                                label="Staff Members (Full Seats)"
                                used={usageData.staff_count ?? 1}
                                limit={usageData.staff_limit}
                                helper="Owners, managers, & admins"
                            />

                            <UsageMeterCard
                                icon={Users}
                                label="Cashier Till PINs"
                                used={usageData.cashier_count ?? 0}
                                limit={usageData.till_logins_limit}
                                helper="Cashier accounts on registers"
                            />

                            <UsageMeterCard
                                icon={GitBranch}
                                label="Locations & Warehouses"
                                used={usageData.location_count ?? 1}
                                limit={usageData.locations}
                                helper="Physical branches & depots"
                            />

                            <UsageMeterCard
                                icon={Monitor}
                                label="POS Registers (Devices)"
                                used={usageData.register_count ?? 0}
                                limit={usageData.registers_limit}
                                helper="Hardware checkout terminals"
                            />

                            <UsageMeterCard
                                icon={Receipt}
                                label="Monthly Transactions"
                                used={usageData.transactions_count ?? 0}
                                limit={usageData.transactions_limit}
                                helper="Sales logged this month"
                            />

                            <UsageMeterCard
                                icon={Clock}
                                label="Monthly Service Jobs"
                                used={usageData.service_jobs_count ?? 0}
                                limit={usageData.service_jobs_limit}
                                helper="Work orders & repair tickets"
                            />

                            <UsageMeterCard
                                icon={Sparkles}
                                label="AI SmartCapture Credits"
                                used={usageData.ai_credits_used ?? 0}
                                limit={usageData.ai_credits_limit}
                                helper="Monthly OCR & query credits"
                            />

                            <UsageMeterCard
                                icon={FileText}
                                label="AI Document Scans"
                                used={usageData.ai_pages_used ?? 0}
                                limit={usageData.ai_scans_limit}
                                helper="Scans conducted this month"
                            />

                            <UsageMeterCard
                                icon={HardDrive}
                                label="History Retention Window"
                                used={usageData.visible_history_days ? `${usageData.visible_history_days} Days` : 'Full History'}
                                limit={null}
                                helper={usageData.visible_history_days ? 'Historical data older than 30 days safely archived' : 'Unlimited transaction history preserved'}
                            />
                        </div>
                    </div>
                )}

                {/* ── TAB 3: ADD-ONS & SERVICES ─────────────────────────────── */}
                {activeTab === 'addons' && (
                    <div className="space-y-8 animate-fadeIn">

                        {/* AI Engine Add-on Hub */}
                        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <Cpu className="text-[#0BAA8F]" size={24} />
                                <h3 className="text-lg font-bold text-ink">AI Engine &amp; SmartCapture Add-ons</h3>
                            </div>
                            <p className="text-xs text-ink-muted leading-relaxed mb-6 max-w-2xl">
                                Expand your document scanning quota or connect your own LLM credentials to power SmartCapture and assistant features.
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* BYOK */}
                                <div className="p-6 rounded-2xl bg-surface-raised border border-line hover:border-line-strong transition-all flex flex-col justify-between shadow-sm">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                Bring Your Own Key
                                            </span>
                                            <span className="text-lg font-bold font-mono text-ink">$19 <span className="text-2xs font-sans text-ink-muted font-normal">once</span></span>
                                        </div>
                                        <h4 className="text-sm font-bold text-ink mb-1.5">Lifetime BYOK License</h4>
                                        <p className="text-2xs text-ink-muted leading-relaxed">
                                            Bypass platform scanning fees forever. Plug in your own Gemini, Claude, OpenAI, or DeepSeek API key and pay zero per-page fees.
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-line">
                                        {tenant?.ai_status === 'byok' ? (
                                            <div className="w-full py-2.5 text-center text-xs font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                BYOK Active
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handlePurchaseAddon('ai_byok')}
                                                disabled={isPurchasingAddon !== null}
                                                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm font-bold"
                                            >
                                                {isPurchasingAddon === 'ai_byok' ? 'Opening…' : 'Unlock BYOK ($19)'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 1000 Credits Top-up */}
                                <div className="p-6 rounded-2xl bg-surface-raised border border-line hover:border-line-strong transition-all flex flex-col justify-between shadow-sm">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-[#0BAA8F]/15 text-[#0BAA8F] border border-[#0BAA8F]/30">
                                                Top-up Pack
                                            </span>
                                            <span className="text-lg font-bold font-mono text-ink">$10 <span className="text-2xs font-sans text-ink-muted font-normal">once</span></span>
                                        </div>
                                        <h4 className="text-sm font-bold text-ink mb-1.5">1,000 AI Credits Top-Up</h4>
                                        <p className="text-2xs text-ink-muted leading-relaxed">
                                            Instantly add 1,000 credits (~100 document scans or 500 AI queries) to your store balance without changing your monthly tier.
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-line">
                                        <button
                                            onClick={() => handlePurchaseAddon('ai_topup')}
                                            disabled={isPurchasingAddon !== null}
                                            className="w-full py-2.5 bg-[#0BAA8F] hover:bg-[#09927D] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                                        >
                                            {isPurchasingAddon === 'ai_topup' ? 'Opening…' : 'Add 1,000 Credits ($10)'}
                                        </button>
                                    </div>
                                </div>

                                {/* Managed Monthly Subscriptions */}
                                <div className="p-6 rounded-2xl bg-surface-raised border border-line hover:border-line-strong transition-all flex flex-col justify-between shadow-sm">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                                Managed API
                                            </span>
                                            <span className="text-lg font-bold font-mono text-ink">$15–$39 <span className="text-2xs font-sans text-ink-muted font-normal">/mo</span></span>
                                        </div>
                                        <h4 className="text-sm font-bold text-ink mb-1.5">Managed AI Subscriptions</h4>
                                        <p className="text-2xs text-ink-muted leading-relaxed mb-4">
                                            High-volume monthly allowances with zero configuration:
                                        </p>

                                        <div className="space-y-2">
                                            {Object.entries(aiTiers).filter(([, tier]) => Number(tier.price_monthly) > 0).map(([key, tier]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handlePurchaseAddon(`ai_${key}`)}
                                                    className="w-full p-2.5 rounded-xl bg-surface border border-line hover:border-[#0BAA8F]/40 flex items-center justify-between text-xs transition-all shadow-2xs"
                                                >
                                                    <span className="font-semibold text-ink">{tier.label}</span>
                                                    <span className="text-[#0BAA8F] font-mono font-bold">${tier.price_monthly}/mo</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Marketplace & Platform Channel Syncs */}
                        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <Globe2 className="text-[#0BAA8F]" size={24} />
                                <h3 className="text-lg font-bold text-ink">Platform Channel Sync</h3>
                            </div>
                            <p className="text-xs text-ink-muted leading-relaxed mb-6 max-w-2xl">
                                2-way real-time stock, pricing, and order synchronization between your VenQore till and your e-commerce channels.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-surface-raised border border-line flex flex-col justify-between shadow-sm">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-ink">WooCommerce Channel Sync</h4>
                                            <span className="text-sm font-mono font-bold text-ink">$19/mo</span>
                                        </div>
                                        <p className="text-2xs text-ink-muted leading-relaxed">
                                            Instant webhook-driven stock decrementing on online sales, automatic catalog pushing, and web order fulfillment directly from POS.
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-line">
                                        {tenant?.sync_channels && tenant.sync_channels.includes('woocommerce') ? (
                                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                <CheckCircle2 size={14} /> Active &amp; Synchronizing
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handlePurchaseAddon('sync_woocommerce')}
                                                className="px-5 py-2.5 bg-[#0BAA8F] hover:bg-[#09927D] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                                            >
                                                Connect WooCommerce ($19/mo)
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-surface-raised border border-line flex flex-col justify-between shadow-sm">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-ink">Amazon SP-API Channel Sync</h4>
                                            <span className="text-sm font-mono font-bold text-ink">$19/mo</span>
                                        </div>
                                        <p className="text-2xs text-ink-muted leading-relaxed">
                                            2-way inventory sync with Amazon Seller Central for FBM orders and FBA replenishment tracking.
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-line">
                                        {tenant?.sync_channels && tenant.sync_channels.includes('amazon') ? (
                                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                <CheckCircle2 size={14} /> Active &amp; Synchronizing
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handlePurchaseAddon('sync_amazon')}
                                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                                            >
                                                Connect Amazon SP-API ($19/mo)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Catalog Upload Service */}
                        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="text-[#0BAA8F]" size={24} />
                                <h3 className="text-lg font-bold text-ink">Professional Catalog Onboarding Service</h3>
                            </div>
                            <p className="text-xs text-ink-muted leading-relaxed mb-6 max-w-2xl">
                                Let our catalog engineering team clean, structure, and import your existing inventory databases, supplier spreadsheets, or paper invoices into VenQore.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {Object.entries(SERVICE_TIERS).map(([key, tier]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        aria-label={tier.name}
                                        onClick={() => setSelectedService(key)}
                                        className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                                            selectedService === key
                                                ? 'bg-[#0BAA8F]/10 border-[#0BAA8F] shadow-sm'
                                                : 'bg-surface-raised border-line hover:border-line-strong'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-ink font-bold text-sm">{tier.name}</div>
                                            <div className="text-2xs text-ink-muted mt-1 leading-relaxed">{tier.desc}</div>
                                        </div>
                                        <div className="flex justify-between items-baseline mt-4 pt-3 border-t border-line w-full">
                                            <span className="text-2xs text-[#0BAA8F] font-semibold">{tier.sla}</span>
                                            <span className="text-ink font-mono font-bold text-sm">${tier.priceUSD.toFixed(2)}/item</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-line">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="calc-products-input" className="block text-xs font-bold text-ink-secondary uppercase tracking-wider mb-2">Number of Products to Import</label>
                                        <input
                                            id="calc-products-input"
                                            type="number"
                                            placeholder="e.g. 500"
                                            value={calcProducts}
                                            onChange={(e) => setCalcProducts(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-line bg-surface text-ink text-sm outline-none focus:border-[#0BAA8F] transition-colors font-mono shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="calc-variants-input" className="block text-xs font-bold text-ink-secondary uppercase tracking-wider mb-2">Average Variants Per Product</label>
                                        <input
                                            id="calc-variants-input"
                                            type="number"
                                            placeholder="First 5 variants included (e.g. 6)"
                                            value={calcVariants}
                                            onChange={(e) => setCalcVariants(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-line bg-surface text-ink text-sm outline-none focus:border-[#0BAA8F] transition-colors font-mono shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-surface-raised border border-line flex flex-col justify-between shadow-sm">
                                    <div className="space-y-2 text-xs text-ink-muted">
                                        <div className="flex justify-between">
                                            <span>Tier Base Rate:</span>
                                            <span className="font-mono text-ink font-bold">${serviceTier.priceUSD.toFixed(2)} / product</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Surcharge for Extra Variants:</span>
                                            <span className="font-mono text-ink font-bold">+${(extraBlocks * serviceTier.extraUSD).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-line text-ink">
                                            <span>Calculated Rate:</span>
                                            <span className="font-mono text-[#0BAA8F] font-bold">${usdPricePerProduct.toFixed(2)} / item</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-line flex justify-between items-center mt-4">
                                        <div>
                                            <div className="text-3xs font-bold uppercase text-ink-muted">Total Setup Estimate</div>
                                            <div className="text-2xl font-bold font-mono text-ink">${usdTotalSetupCost.toFixed(2)}</div>
                                        </div>
                                        <button
                                            onClick={handleOrderSetupService}
                                            disabled={calcProductsNum === 0 || isOrderingService}
                                            className="px-6 py-3 rounded-xl bg-[#0BAA8F] hover:bg-[#09927D] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                                        >
                                            {isOrderingService ? 'Redirecting…' : 'Order Service'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* ── TAB 4: PAYMENT HISTORY ────────────────────────────────── */}
                {activeTab === 'payments' && (
                    <div className="space-y-8 animate-fadeIn">
                        {historyLoading && !history && (
                            <div className="space-y-3">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="h-16 rounded-2xl bg-surface-raised border border-line animate-pulse" />
                                ))}
                            </div>
                        )}

                        {historyError && (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                <AlertTriangle size={15} /> {historyError}
                            </div>
                        )}

                        {history && (
                            <>
                                {history.subscription && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-5 rounded-2xl bg-surface border border-line shadow-sm">
                                            <div className="text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <BadgeCheck size={13} className="text-[#0BAA8F]" /> Status
                                            </div>
                                            <div className="text-lg font-bold text-ink capitalize">
                                                {history.subscription.status_formatted || history.subscription.status || '—'}
                                            </div>
                                            {history.subscription.is_cancelled && (
                                                <div className="text-2xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                                                    Cancelled — paid access remains active
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-5 rounded-2xl bg-surface border border-line shadow-sm">
                                            <div className="text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Clock size={13} className="text-[#0BAA8F]" /> {history.subscription.is_cancelled ? 'Access Ends' : 'Next Renewal'}
                                            </div>
                                            <div className="text-lg font-bold text-ink font-mono">
                                                {fmtDay(history.subscription.expires_at)}
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-surface border border-line shadow-sm">
                                            <div className="text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <CreditCard size={13} className="text-[#0BAA8F]" /> Payment Method
                                            </div>
                                            <div className="text-lg font-bold text-ink">
                                                {history.subscription.card || 'Not on file'}
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-surface border border-line shadow-sm">
                                            <div className="text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Receipt size={13} className="text-[#0BAA8F]" /> Total Paid
                                            </div>
                                            <div className="text-lg font-bold text-ink font-mono">
                                                {history.lifetime_usd || '$0.00'}
                                            </div>
                                            <div className="text-2xs text-ink-muted mt-0.5">
                                                {history.invoice_count} {history.invoice_count === 1 ? 'receipt' : 'receipts'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Invoices Table */}
                                {history.invoices && history.invoices.length > 0 ? (
                                    <div className="rounded-2xl bg-surface border border-line shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-line bg-surface-raised text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                                        <th className="px-5 py-3.5">Paid On</th>
                                                        <th className="px-5 py-3.5">Period Covered</th>
                                                        <th className="px-5 py-3.5">Amount</th>
                                                        <th className="px-5 py-3.5">Status</th>
                                                        <th className="px-5 py-3.5 text-right">Invoice</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-line text-xs">
                                                    {history.invoices.map((inv) => (
                                                        <tr key={inv.id} className="hover:bg-surface-raised/50 transition-colors">
                                                            <td className="px-5 py-4 whitespace-nowrap">
                                                                <div className="font-bold text-ink">{fmtDay(inv.paid_at)}</div>
                                                                <div className="text-2xs text-ink-muted capitalize">{inv.billing_reason || 'Payment'}</div>
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap text-ink-secondary">
                                                                {inv.period_end ? `${fmtDay(inv.period_start)} → ${fmtDay(inv.period_end)}` : fmtDay(inv.period_start)}
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-ink">
                                                                {inv.total}
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap">
                                                                <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                                                    {inv.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                                {inv.invoice_url && (
                                                                    <a
                                                                        href={inv.invoice_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line hover:border-line-strong text-ink-secondary hover:text-ink text-2xs font-bold transition-all shadow-2xs"
                                                                    >
                                                                        <FileText size={12} />
                                                                        <span>PDF</span>
                                                                    </a>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 rounded-2xl bg-surface border border-line shadow-sm text-center">
                                        <Receipt size={28} className="mx-auto text-ink-muted mb-2" />
                                        <p className="text-xs font-semibold text-ink-muted">No payment records found.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── Pakistan CNIC Regional Pricing Panel (When Applicable) ── */}
                {PKR_ENABLED && country === 'PK' && (
                    <PkVerificationPanel
                        tenant={tenant}
                        pk_verification={pk_verification}
                        storeSlug={storeSlug}
                    />
                )}

            </div>

            {/* ── Change Plan Confirmation Modal ────────────────────────────── */}
            <Modal show={isChangeModalOpen} onClose={() => setIsChangeModalOpen(false)} maxWidth="md">
                <div className="relative overflow-hidden bg-surface border border-line rounded-2xl shadow-2xl p-6 text-ink">
                    <h3 className="text-lg font-bold tracking-tight flex items-center gap-2 mb-4 text-ink">
                        <Sparkles className="text-[#0BAA8F]" size={20} />
                        Confirm Plan Selection
                    </h3>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-raised border border-line">
                            <div className="text-center flex-1">
                                <div className="text-3xs text-ink-muted font-bold uppercase">Current</div>
                                <div className="text-sm font-bold capitalize text-ink mt-0.5">{currentPlanKey}</div>
                            </div>
                            <ArrowRight className="text-ink-muted" size={16} />
                            <div className="text-center flex-1">
                                <div className="text-3xs text-[#0BAA8F] font-bold uppercase">New Plan</div>
                                <div className="text-sm font-bold capitalize text-[#0BAA8F] mt-0.5">{selectedPlan}</div>
                            </div>
                        </div>

                        <p className="text-xs text-ink-muted leading-relaxed">
                            Switching to <span className="font-bold text-ink capitalize">{selectedPlan}</span> will update your resource limits immediately. Any prorated difference will be applied according to your billing cycle.
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setIsChangeModalOpen(false)}
                            className="px-4 py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-line text-ink font-semibold text-xs transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmPlanChange}
                            className="px-5 py-2.5 rounded-xl bg-[#0BAA8F] hover:bg-[#09927D] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                        >
                            Confirm Change
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Cancel Subscription Modal ─────────────────────────────────── */}
            <Modal show={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="md">
                <div className="p-8 bg-surface text-ink rounded-2xl border border-line shadow-2xl">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-ink">Cancel Subscription?</h3>
                            <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider">{currentMeta.label}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 mb-4 text-xs text-emerald-800 dark:text-emerald-300">
                        <span className="font-bold">You retain full access until {paidUntilLabel || 'the end of your paid billing period'}.</span> No immediate lockout and no further renewals will be charged.
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-6">
                        <button
                            onClick={() => setCancelOpen(false)}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-line text-ink font-bold text-xs uppercase tracking-wider"
                        >
                            Keep Subscription
                        </button>
                        <button
                            onClick={submitCancelSubscription}
                            disabled={cancelBusy}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider shadow-sm"
                        >
                            {cancelBusy ? 'Cancelling…' : 'Yes, Cancel'}
                        </button>
                    </div>
                </div>
            </Modal>

        </>
    );
}

BillingIndex.layout = (page) => <OneGlanceLayout title="Billing & Subscription" mode="admin">{page}</OneGlanceLayout>;

function PkVerificationPanel({ tenant, pk_verification, storeSlug }) {
    const [cnic, setCnic] = useState('');
    const [phone, setPhone] = useState('');
    const [imageFront, setImageFront] = useState(null);
    const [imageBack, setImageBack] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        const formData = new FormData();
        formData.append('tenant_id', tenant.id);
        formData.append('cnic', cnic);
        formData.append('phone', phone);
        formData.append('image_front', imageFront);
        formData.append('image_back', imageBack);

        router.post(route('platform.pk-verifications.submit'), formData, {
            onSuccess: () => {
                setLoading(false);
                setMsg({ type: 'success', text: 'Verification submitted successfully! Under review.' });
            },
            onError: (errs) => {
                setLoading(false);
                const firstErr = Object.values(errs)[0] || 'Verification submission failed.';
                setMsg({ type: 'error', text: firstErr });
            }
        });
    };

    if (pk_verification?.status === 'approved') {
        return (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-8">
                <div className="flex gap-3 items-start">
                    <CheckCircle2 className="shrink-0 mt-0.5 animate-pulse" size={18} />
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide">Regional Pricing Unlocked</h4>
                        <p className="text-xs text-emerald-300/80 mt-1">
                            Your CNIC verification has been approved. Regional Pakistani Rupees (PKR) pricing is fully unlocked for checkout.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (pk_verification?.status === 'pending') {
        return (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-8">
                <div className="flex gap-3 items-start">
                    <ScanFace className="shrink-0 mt-0.5 animate-pulse" size={18} />
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide">Verification Request Pending</h4>
                        <p className="text-xs text-amber-300/80 mt-1">
                            Your CNIC front/back documents are currently being reviewed by our compliance team. Regional PKR pricing checkouts will unlock as soon as your identity is verified.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-sm mb-8">
            <div className="flex gap-3 items-start mb-4">
                <BadgeCheck className="text-[#0BAA8F] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold text-sm text-ink uppercase tracking-wide">Verify Identity for Regional Pricing</h4>
                    <p className="text-xs text-ink-muted mt-1">
                        Pakistani stores qualify for special regional pricing (in PKR). Submit your CNIC and contact details below to unlock PKR checkouts. Limit of 1 store per CNIC.
                    </p>
                </div>
            </div>

            {pk_verification?.status === 'rejected' && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 mb-4 text-xs">
                    <strong>Rejection Reason:</strong> {pk_verification.rejection_reason}
                </div>
            )}

            {msg && (
                <div className={`p-4 rounded-xl mb-4 text-xs ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="pk-cnic-input" className="block text-1xs font-bold text-ink-muted uppercase tracking-wider mb-2">CNIC Number (13 Digits)</label>
                    <input
                        id="pk-cnic-input"
                        type="text"
                        pattern="^[0-9]{5}-?[0-9]{7}-?[0-9]{1}$"
                        value={cnic}
                        onChange={e => setCnic(e.target.value)}
                        placeholder="e.g. 42101-1234567-1"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-raised border border-line text-ink text-xs outline-none focus:border-[#0BAA8F] transition-colors"
                    />
                </div>
                <div>
                    <label htmlFor="pk-phone-input" className="block text-1xs font-bold text-ink-muted uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                        id="pk-phone-input"
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. +92 300 1234567"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-raised border border-line text-ink text-xs outline-none focus:border-[#0BAA8F] transition-colors"
                    />
                </div>
                <div>
                    <label htmlFor="pk-front-input" className="block text-1xs font-bold text-ink-muted uppercase tracking-wider mb-2">CNIC Front Side Image</label>
                    <input
                        id="pk-front-input"
                        type="file"
                        accept="image/*"
                        onChange={e => setImageFront(e.target.files[0])}
                        required
                        className="w-full text-xs text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-line file:text-1xs file:font-bold file:uppercase file:bg-surface-raised file:text-ink file:cursor-pointer hover:file:bg-surface"
                    />
                </div>
                <div>
                    <label htmlFor="pk-back-input" className="block text-1xs font-bold text-ink-muted uppercase tracking-wider mb-2">CNIC Back Side Image</label>
                    <input
                        id="pk-back-input"
                        type="file"
                        accept="image/*"
                        onChange={e => setImageBack(e.target.files[0])}
                        required
                        className="w-full text-xs text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-line file:text-1xs file:font-bold file:uppercase file:bg-surface-raised file:text-ink file:cursor-pointer hover:file:bg-surface"
                    />
                </div>
                <div className="md:col-span-2 mt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-[#0BAA8F] hover:bg-[#09927D] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        {loading ? 'Submitting...' : 'Submit Documents'}
                    </button>
                </div>
            </form>
        </div>
    );
}

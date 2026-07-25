import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import Modal from '@/Components/Modal';
import { openLemonCheckout, closeLemonCheckout, preloadLemonCheckout } from '@/lib/lemonCheckout';
import {
    Zap, Crown, Shield, CheckCircle2, XCircle, AlertTriangle,
    ArrowRight, Calendar, Users, Package, BarChart2, Globe2,
    Cpu, GitBranch, ExternalLink, Sparkles, Lock, Infinity,
    Receipt, Download, Info, HelpCircle, MessageSquare, Monitor,
    BadgeCheck, ScanFace, RefreshCw
} from 'lucide-react';

// ── PKR MASTER SWITCH (see Pricing.jsx) — OFF for USD-only launch ──────
const PKR_ENABLED = false;

// --- Plan metadata (display-only) -------------------------------------------
const PLAN_META = {
    starter:  { label: 'Starter Engine',  price: '$36/mo',  color: '#6366f1', Icon: Shield },
    growth:   { label: 'Growth Engine',   price: '$63/mo',  color: '#8b5cf6', Icon: Zap },
    business: { label: 'Business Engine', price: '$129/mo', color: '#f59e0b', Icon: Crown },
    ltd_1:    { label: 'LTD — Starter',  price: '$79',      color: '#10b981', Icon: Sparkles },
    ltd_2:    { label: 'LTD — Growth',   price: '$199',     color: '#10b981', Icon: Sparkles },
    ltd_3:    { label: 'LTD — Business', price: '$399',     color: '#10b981', Icon: Sparkles },
};

const FEATURES = [
    { key: 'staff_limit',   icon: Users,         label: 'Staff Members' },
    { key: 'sku_limit',     icon: Package,       label: 'Products (SKUs)' },
    { key: 'locations',     icon: GitBranch,     label: 'Locations / Warehouses' },
    { key: 'woocommerce',   icon: Globe2,        label: 'WooCommerce Sync' },
    { key: 'api_access',    icon: Cpu,           label: 'API Access' },
    { key: 'growth_engine', icon: Sparkles,      label: 'AI Growth Engine' },
    { key: 'chat_support',  icon: MessageSquare, label: 'Live Agent Support' },
    { key: 'reports',       icon: BarChart2,     label: 'Advanced Reports' },
    { key: 'multi_branch',  icon: GitBranch,     label: 'Multi-Branch' },
];

const FEATURE_UPGRADE_TARGET = {
    woocommerce: 'growth',
    growth_engine: 'growth',
    multi_branch: 'growth',
    api_access: 'business',
    bill_of_materials: 'business',
    fixed_asset_depreciation: 'business',
    fiscal_year_closing: 'business',
    recurring_invoicing: 'business',
    chat_support: 'growth',
    feature_serials: 'business',
    whatsapp_reminders: 'growth',
    loyalty_points: 'business',
    wholesale_pricing: 'business',
    dedicated_account_manager: 'business',
};

// --- Onboarding Service Tiers ---
const SERVICE_TIERS = {
    basic:        { name: 'Basic Upload',        priceUSD: 1.00, pricePKR: 100,  extraUSD: 0.50, extraPKR: 50,  sla: '2–3 business days', desc: 'Product data uploaded with all core fields. Up to 5 variants per product included.' },
    descriptions: { name: '+ Rich Descriptions', priceUSD: 1.50, pricePKR: 150,  extraUSD: 0.50, extraPKR: 50,  sla: '3–5 business days', desc: 'Everything in Basic + long descriptions, SEO copy, and full product detail. You provide images.' },
    images:       { name: '+ AI Images',         priceUSD: 2.00, pricePKR: 200,  extraUSD: 0.50, extraPKR: 50,  sla: '4–6 business days', desc: 'Everything in Descriptions + we source or AI-generate product images for you.' },
};

function formatLimit(val) {
    if (val === null || val === undefined) return <><Infinity size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Unlimited</>;
    if (val === false) return <XCircle size={14} color="#ef4444" style={{ display: 'inline', verticalAlign: 'middle' }} />;
    if (val === true) return <CheckCircle2 size={14} color="#10b981" style={{ display: 'inline', verticalAlign: 'middle' }} />;
    if (val === 'basic') return 'Basic';
    if (val === 'advanced') return 'Advanced';
    return val;
}

// --- Usage Meter -------------------------------------------------------------
function UsageMeter({ icon: Icon, label, used, limit, color }) {
    const pct = limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const isUnlimited = limit === null;
    const isCritical  = !isUnlimited && pct >= 90;
    const isWarning   = !isUnlimited && pct >= 70;
    const barColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : color;

    return (
        <div className="bg-[#0b081e]/40 border border-white/[0.06] rounded-2xl p-5 shadow-inner">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03]">
                        <Icon size={16} color={color} />
                    </div>
                    <span className="text-xs font-bold text-slate-300">{label}</span>
                </div>
                {isCritical && <AlertTriangle size={14} className="text-red-500" />}
            </div>

            <div className={`text-2xl font-black mb-1 ${isCritical ? 'text-red-500' : 'text-white'}`}>
                {isUnlimited
                    ? <span className="flex items-center gap-1.5">{used} <span className="text-xs text-slate-500 font-medium">/ ∞</span></span>
                    : <span>{used} <span className="text-sm font-medium text-slate-500">/ {limit}</span></span>
                }
            </div>

            {isUnlimited ? (
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Unlimited</div>
            ) : (
                <>
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-1.5 mt-2">
                        <div style={{ width: `${pct}%`, backgroundColor: barColor }} className="h-full rounded-full transition-all duration-700" />
                    </div>
                    <div className={`text-[10px] font-bold ${isCritical ? 'text-red-500' : 'text-slate-500'} uppercase tracking-wider`}>
                        {pct}% used
                    </div>
                </>
            )}
        </div>
    );
}

// --- Plan Card ----------------------------------------------------------------
function PlanCard({ planKey, planConfig, isCurrent, storeSlug, tenant, onSelectPlan, onCheckout, checkoutBusy = null, plans, billingCycle = 'monthly', currencyDisplay = 'USD' }) {
    const { geo = { country: 'US', currency: 'USD', symbol: '$' } } = usePage().props;
    const isPK = PKR_ENABLED && geo.currency === 'PKR';
    const fmt = (usdAmount, pkrAmount = null, suffix = '') => {
        const usdVal = parseFloat(usdAmount) || 0;
        const pkrVal = pkrAmount !== null ? parseFloat(pkrAmount) : Math.round(usdVal * 280);
        
        if (isPK && currencyDisplay === 'PKR') {
            return `Rs ${Math.round(pkrVal).toLocaleString()}${suffix} (billed as $${usdVal.toLocaleString()})`;
        }
        
        let str = `$${usdVal.toLocaleString()}${suffix}`;
        if (isPK) {
            str += ` (approx. Rs ${Math.round(pkrVal).toLocaleString()}${suffix}, billed in USD)`;
        }
        return str;
    };

    const meta = PLAN_META[planKey] ?? { label: planKey, price: '—', color: '#6366f1', Icon: Shield };
    const { Icon } = meta;
    const isLtd = planKey.startsWith('ltd');

    const dbPlan = plans?.find(p => p.slug === planKey);
    const planName = dbPlan?.name ? `${dbPlan.name} Engine` : meta.label;

    // --- Cycle-aware pricing ---
    const isAnnual = billingCycle === 'annual';

    // Pick the right prices based on cycle and region (Option A: USD primary, PKR estimate)
    let displayMonthly, displayAnnualNote, savingsNote, pkrEstimate;
    const usdMonthly = dbPlan ? parseFloat(dbPlan.price_monthly_usd || dbPlan.price_monthly || 0) : 0;
    const usdAnnual = dbPlan ? parseFloat(dbPlan.price_annual_usd || dbPlan.price_annual || 0) : 0;

    if (isAnnual) {
        if (isPK && currencyDisplay === 'PKR') {
            const pkrAnnualTotal = dbPlan?.price_annual ? parseFloat(dbPlan.price_annual) : Math.round(usdAnnual * 280);
            const pkrPerMonth = Math.round(pkrAnnualTotal / 12);
            displayMonthly = `Rs ${pkrPerMonth.toLocaleString()}/mo`;
            displayAnnualNote = `billed Rs ${Math.round(pkrAnnualTotal).toLocaleString()}/yr`;
            savingsNote = `SAVE ~17%`;
            pkrEstimate = null;
        } else {
            if (usdAnnual > 0) {
                const perMonth = Math.round(usdAnnual / 12);
                const saved = usdMonthly ? Math.round(usdMonthly * 12 - usdAnnual) : null;
                displayMonthly = `$${perMonth}/mo`;
                displayAnnualNote = `billed $${usdAnnual}/yr`;
                savingsNote = saved && saved > 0 ? `Save $${saved}/yr` : null;
                pkrEstimate = null;
            }
        }
    } else {
        if (isPK && currencyDisplay === 'PKR') {
            const pkrMonthly = dbPlan?.price_monthly ? parseFloat(dbPlan.price_monthly) : Math.round(usdMonthly * 280);
            displayMonthly = `Rs ${Math.round(pkrMonthly).toLocaleString()}/mo`;
            displayAnnualNote = null;
            savingsNote = null;
            pkrEstimate = null;
        } else {
            displayMonthly = dbPlan ? (usdMonthly ? `$${usdMonthly}/mo` : 'Free') : meta.price;
            displayAnnualNote = null;
            savingsNote = null;
            pkrEstimate = null;
        }
    }

    if (isLtd && !isCurrent) return null;
    const planOrder = ['starter', 'growth', 'business'];
    const currentIdx = planOrder.indexOf(tenant?.plan ?? 'starter');
    const thisIdx    = planOrder.indexOf(planKey);

    const checkoutCycle = isAnnual ? 'annual' : 'monthly';
    const isCheckingOut = checkoutBusy === planKey;

    return (
        <div 
            className={`relative p-6 rounded-3xl border transition-all duration-300 ${
                isCurrent 
                ? 'bg-purple-950/10 border-purple-500/35 shadow-[0_0_30px_rgba(168,85,247,0.06)]' 
                : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.035] hover:border-white/10'
            }`}
        >
            {isCurrent && (
                <div 
                    className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white bg-purple-600"
                >
                    CURRENT PLAN
                </div>
            )}
            {savingsNote && (
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white bg-emerald-600">
                    {savingsNote}
                </div>
            )}
            
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: meta.color + '15' }}>
                    <Icon size={24} color={meta.color} />
                </div>
                <div>
                    <div className="font-bold text-base text-white leading-tight">{planName}</div>
                    <div className="text-sm font-bold mt-1" style={{ color: meta.color }}>
                        {displayMonthly}
                        {displayAnnualNote && (
                            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                {displayAnnualNote}
                            </span>
                        )}
                        {pkrEstimate && (
                            <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                                {pkrEstimate}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-8">
                {FEATURES.map(f => {
                    const val = planConfig[f.key];
                    const enabled = val !== false && val !== '0' && val !== 0 && val !== undefined;
                    return (
                        <div key={f.key} className="flex items-center gap-3 text-xs">
                            {enabled
                                ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                : <XCircle size={14} className="text-slate-600 shrink-0" />}
                            <span className={`font-medium ${enabled ? 'text-slate-300' : 'text-slate-500 line-through opacity-50'}`}>
                                {f.label}
                                {typeof val === 'number' ? `: ${val}` : ''}
                                {val === null ? ': Unlimited' : ''}
                            </span>
                        </div>
                    );
                })}
            </div>

            {isCurrent ? (
                (tenant?.status === 'trial' || tenant?.status === 'suspended') ? (
                    <button
                        onClick={() => onCheckout?.(planKey, checkoutCycle, currencyDisplay)}
                        disabled={isCheckingOut}
                        className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-wait text-white shadow-lg shadow-purple-500/10"
                    >
                        {isCheckingOut ? 'Opening secure checkout…' : <>Activate Subscription <ArrowRight size={16} /></>}
                    </button>
                ) : (
                    <div className="text-center py-3 text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} /> Active Plan
                    </div>
                )
            ) : isLtd ? (
                <div className="text-center py-3 text-xs font-black text-slate-500 uppercase tracking-widest bg-white/5 rounded-2xl">
                    Lifetime Supporter
                </div>
            ) : (
                <button
                    onClick={() => onSelectPlan(planKey)}
                    className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                        thisIdx > currentIdx
                        ? 'bg-white text-[#020010] hover:bg-slate-100'
                        : 'border border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800'
                    }`}
                >
                    {thisIdx > currentIdx ? `Upgrade to ${meta.label}` : `Downgrade to ${meta.label}`} <ArrowRight size={16} />
                </button>
            )}
        </div>
    );
}

// --- Main Page Component ---
export default function BillingIndex({ tenant, plans, usage, feature_status, country, pk_verification }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const isPK = PKR_ENABLED && country === 'PK' && pk_verification?.status === 'approved';
    const fmt = (usdAmount, pkrAmount = null, suffix = '') => {
        const usdVal = parseFloat(usdAmount) || 0;
        const pkrVal = pkrAmount !== null ? parseFloat(pkrAmount) : Math.round(usdVal * 280);
        
        if (isPK && currencyDisplay === 'PKR') {
            return `Rs ${Math.round(pkrVal).toLocaleString()}${suffix}`;
        }
        
        return `$${usdVal.toLocaleString()}${suffix}`;
    };

    const fmtCost = (usdAmount, pkrAmount = null) => {
        const usdVal = parseFloat(usdAmount) || 0;
        const pkrVal = pkrAmount !== null ? parseFloat(pkrAmount) : Math.round(usdVal * 280);

        if (isPK && currencyDisplay === 'PKR') {
            return `Rs ${Math.round(pkrVal).toLocaleString()}`;
        }

        return `$${usdVal.toFixed(2)}`;
    };

    const [activeTab, setActiveTab] = useState('subscription');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [currencyDisplay, setCurrencyDisplay] = useState(isPK ? 'PKR' : 'USD');

    // Onboarding Setup Service States
    const [calcProducts, setCalcProducts] = useState('');
    const [calcVariants, setCalcVariants] = useState('');
    const [selectedService, setSelectedService] = useState('basic');
    const [isOrderingService, setIsOrderingService] = useState(false);

    // ── In-app checkout plumbing ────────────────────────────────────────────
    // Lemon Squeezy is our Merchant of Record, so the card form has to be
    // theirs. Everything below keeps that form INSIDE VenQore: the server
    // hands back a branded, prefilled checkout URL and we render it as an
    // overlay on top of the current page rather than navigating away.

    const toast = (message, type = 'info') => {
        window.dispatchEvent(new CustomEvent('amd:toast', { detail: { message, type } }));
    };

    // Warm lemon.js up as soon as the billing screen mounts so the overlay
    // appears instantly on click instead of after a script download.
    useEffect(() => {
        preloadLemonCheckout();
    }, []);

    /**
     * Pull subscription state straight from the Lemon Squeezy API.
     *
     * Provisioning normally rides in on a webhook, but a webhook can be
     * undeliverable (local dev), delayed, or dropped — which leaves someone who
     * genuinely paid still sitting on a trial. Rather than trust the push, we
     * pull. Runs automatically right after a successful payment, and is also
     * available as a manual "Already paid?" button.
     */
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
                return true;
            }

            if (!silent) {
                toast(data?.message || data?.error || 'No subscription found to sync yet.', 'info');
            }
            return false;
        } catch (err) {
            console.error('[billing] subscription sync failed', err);
            if (!silent) {
                toast('Could not reach the server to sync your subscription.', 'error');
            }
            return false;
        } finally {
            setIsSyncing(false);
        }
    };

    /**
     * Shared handler: fetch a checkout URL from our own backend, then open it
     * as an overlay. `onDone` runs when the overlay closes or fails so the
     * caller can clear its loading state.
     */
    const launchCheckout = async (fetchUrl, { context = 'purchase', successMessage, onDone } = {}) => {
        try {
            const url = await fetchUrl();

            if (!url) {
                onDone?.();
                return;
            }

            await openLemonCheckout(url, {
                onSuccess: () => {
                    toast(successMessage || 'Payment received — updating your account…', 'success');
                    // Let the user read Lemon Squeezy's confirmation, then
                    // reconcile against their API rather than waiting on a
                    // webhook that may be slow or may never arrive at all.
                    setTimeout(async () => {
                        await runSubscriptionSync({ silent: true });
                        closeLemonCheckout();
                        router.reload({ preserveScroll: true });
                        onDone?.();
                    }, 2200);
                },
                onClose: () => {
                    onDone?.();
                },
                onError: () => {
                    // openLemonCheckout already falls back to a hard redirect,
                    // so this is only for state cleanup.
                    onDone?.();
                },
            });
        } catch (err) {
            console.error(`[billing] ${context} checkout failed`, err);
            toast('Could not open the checkout. Please check your connection and try again.', 'error');
            onDone?.();
        }
    };

    const postForCheckoutUrl = async (routeName, payload) => {
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

        toast(data?.error || 'An unexpected error occurred. Please try again.', 'error');
        return null;
    };

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

    // Plan Change Confirmation States
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

    const currentPlanKey = tenant?.plan ?? 'starter';
    const currentMeta    = PLAN_META[currentPlanKey] ?? PLAN_META.starter;
    const isLtd          = currentPlanKey.startsWith('ltd');
    
    const subEndsAt = tenant?.subscription_ends_at
        ? new Date(tenant.subscription_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    const isTrial = tenant?.status === 'trial';
    const trialDaysLeft = tenant?.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at) - new Date()) / 86400000))
        : null;

    const isViewOnly = tenant?.view_only_since !== null;
    const viewOnlyDaysLeft = tenant?.view_only_since
        ? Math.max(0, 30 - Math.ceil((new Date() - new Date(tenant.view_only_since)) / 86400000))
        : 30;

    const usageData = usage ?? {};
    const hasLockedActive = feature_status?.some(f => f.is_active && f.is_locked);

    // Calculate setup service estimate
    const calcProductsNum = Math.max(0, parseInt(calcProducts) || 0);
    const calcVariantsNum = Math.max(1, parseInt(calcVariants) || 1);
    const serviceTier = SERVICE_TIERS[selectedService];
    const extraBlocks = calcVariantsNum > 5 ? Math.ceil((calcVariantsNum - 5) / 5) : 0;
    const usdPricePerProduct = serviceTier
        ? serviceTier.priceUSD + extraBlocks * serviceTier.extraUSD
        : 0;
    const pkrPricePerProduct = serviceTier
        ? serviceTier.pricePKR + extraBlocks * serviceTier.extraPKR
        : 0;
    const usdTotalSetupCost = calcProductsNum * usdPricePerProduct;
    const pkrTotalSetupCost = calcProductsNum * pkrPricePerProduct;

    // Handle cancel trial
    const handleCancelTrial = () => {
        if (confirm("Are you sure you want to cancel your free trial? Your store will immediately transition to View-Only mode for 30 days, locking all modifications and sales. You can restore access anytime by subscribing.")) {
            router.post(route('store.billing.cancel-trial', { store_slug: storeSlug }));
        }
    };

    // Handle activation of addon free trial (e.g. WooCommerce sync or AI assistant during main store trial)
    const handleAddonTrial = (addonType) => {
        router.post(route('store.billing.checkout-addon', { store_slug: storeSlug }), {
            addon_type: addonType,
            trial_mode: true
        });
    };


    const [isPurchasingAddon, setIsPurchasingAddon] = useState(null);

    // Handle checkout for AI or Sync add-ons — opens in-app, no redirect.
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

    // Subscription / plan checkout. Asks our backend for a branded, prefilled
    // checkout URL (?format=json) and opens it as an overlay over the app.
    const [checkoutBusy, setCheckoutBusy] = useState(null);

    const handlePlanCheckout = (planKey, cycle = billingCycle, currency = currencyDisplay) => {
        if (checkoutBusy) return;
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

                toast(data?.error || 'Checkout is unavailable right now. Please try again shortly.', 'error');
                return null;
            },
            {
                context: 'plan',
                successMessage: 'Payment received — applying your new plan…',
                onDone: () => setCheckoutBusy(null)
            }
        );
    };

    // Open change plan confirmation modal
    const handleSelectPlan = (planKey) => {
        setSelectedPlan(planKey);
        setIsChangeModalOpen(true);
    };

    // Submit simulated local plan change
    const handleConfirmPlanChange = () => {
        router.post(route('store.billing.change-plan', { store_slug: storeSlug }), { plan: selectedPlan }, {
            onSuccess: () => {
                setIsChangeModalOpen(false);
            }
        });
    };

    // Cancel scheduled plan downgrade
    const handleCancelDowngrade = () => {
        if (confirm("Are you sure you want to cancel your scheduled plan downgrade? You will remain on your current plan and continue to be billed normally.")) {
            router.post(route('store.billing.change-plan', { store_slug: storeSlug }), { cancel_downgrade: true });
        }
    };

    // Deactivate feature in DB to self-heal limits warnings
    const handleDeactivateFeature = (key, name) => {
        if (confirm(`Are you sure you want to deactivate ${name}? This will permanently delete the active records and configurations in your store database for this feature, allowing you to return below limits. This cannot be undone.`)) {
            router.post(route('store.billing.deactivate-feature', { store_slug: storeSlug }), { feature: key });
        }
    };

    // Handle redirect to billing portal (standard navigation / direct redirect to LS or toast warning)
    const handlePortalClick = () => {
        if (!tenant?.has_customer_id) {
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: {
                    message: 'No active Lemon Squeezy subscription found. Please subscribe to a paid plan first to access the billing portal.',
                    type: 'info'
                }
            }));
            return;
        }

        // The Lemon Squeezy customer portal is a full account area and cannot be
        // embedded, so open it in a new tab. The user keeps VenQore open behind
        // it instead of losing their place in the app.
        window.open(
            route('store.billing.portal', { store_slug: storeSlug }),
            '_blank',
            'noopener,noreferrer'
        );
    };

    // Calculate dynamic proration details for confirmation modal
    const targetPlanModel = plans?.find(p => p.slug === selectedPlan);
    const currentPlanModel = plans?.find(p => p.slug === currentPlanKey);

    const targetPriceUSD = targetPlanModel ? parseFloat(targetPlanModel.price_monthly_usd || targetPlanModel.price_monthly) : (selectedPlan === 'starter' ? 19 : selectedPlan === 'growth' ? 49 : selectedPlan === 'business' ? 99 : 0);
    const targetPricePKR = targetPlanModel ? parseFloat(targetPlanModel.price_monthly) : Math.round(targetPriceUSD * 280);

    const currentPriceUSD = currentPlanModel ? parseFloat(currentPlanModel.price_monthly_usd || currentPlanModel.price_monthly) : (currentPlanKey === 'starter' ? 19 : currentPlanKey === 'growth' ? 49 : currentPlanKey === 'business' ? 99 : 0);
    const currentPricePKR = currentPlanModel ? parseFloat(currentPlanModel.price_monthly) : Math.round(currentPriceUSD * 280);

    const diffUSD = targetPriceUSD - currentPriceUSD;
    const diffPKR = targetPricePKR - currentPricePKR;
    
    let proratedEstUSD = 0;
    let proratedEstPKR = 0;
    let remainingDays = 0;
    let nextBillingDateStr = "";

    const planOrder = ['starter', 'growth', 'business'];
    const currentIdx = planOrder.indexOf(currentPlanKey);
    const targetIdx = planOrder.indexOf(selectedPlan);
    const isUpgrade = targetIdx > currentIdx;

    if (tenant?.subscription_ends_at) {
        const cycleEnd = new Date(tenant.subscription_ends_at);
        nextBillingDateStr = cycleEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        const now = new Date();
        const cycleStart = new Date(cycleEnd);
        cycleStart.setMonth(cycleStart.getMonth() - 1);
        
        const totalMs = cycleEnd - cycleStart;
        const remainingMs = cycleEnd - now;
        remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
        const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
        
        if (isUpgrade) {
            proratedEstUSD = diffUSD * ratio;
            proratedEstPKR = diffPKR * ratio;
        }
    } else {
        const nextBilling = new Date();
        nextBilling.setDate(nextBilling.getDate() + 30);
        nextBillingDateStr = nextBilling.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        proratedEstUSD = targetPriceUSD;
        proratedEstPKR = targetPricePKR;
    }

    // Modal features comparison listing
    const FEATURES_GAIN_LOSS = {
        growth: {
            gained: [
                'WooCommerce Sync (Unlimited)',
                'AI Chatbot & Retention engine',
                'Multi-Branch warehouse support',
                'Up to 10 staff member accounts (Starter: 3)',
                'Unlimited products/SKUs (Starter: 1,000)',
                'Advanced reporting structures'
            ],
            lost: [
                'WooCommerce Sync connections',
                'AI Chatbot key configurations',
                'Multi-Branch warehouse settings',
                'Warehouse locations limit (reduced to 3)',
                'Staff accounts limit (reduced to 10)',
                'Product/SKUs count capped at 1,000 SKUs',
                'Advanced reporting modules'
            ]
        },
        business: {
            gained: [
                'Full Public REST API Access',
                'Unlimited warehouse locations (Growth: 3)',
                'Unlimited staff member accounts (Growth: 10)',
                'Bill of Materials (BOM) & Manufacturing',
                'Fixed asset depreciation postings',
                'Fiscal year closing automated wizard',
                'Recurring invoicing automation'
            ],
            lost: [
                'Public REST API keys & access',
                'Warehouse locations cap of 3 (Business: Unlimited)',
                'Staff accounts cap of 10 (Business: Unlimited)',
                'BOM records and manufacturing actions',
                'Asset depreciation posting calculations',
                'Fiscal year close zeroing wizard',
                'Recurring invoicing records'
            ]
        },
        starter: {
            lost: [
                'WooCommerce Sync connections',
                'AI Chatbot key configurations',
                'Multi-Branch warehouse settings',
                'Warehouse locations cap of 1 (Growth: 3)',
                'Staff accounts cap of 3 (Growth: 10)',
                'Product/SKUs count capped at 1,000 SKUs',
                'Advanced reporting modules',
                'BOM records and manufacturing actions',
                'Asset depreciation posting calculations',
                'Fiscal year close zeroing wizard',
                'Recurring invoicing records',
                'Public REST API keys & access'
            ]
        }
    };

    let modalFeatures = [];
    if (isUpgrade) {
        if (selectedPlan === 'growth') {
            modalFeatures = FEATURES_GAIN_LOSS.growth.gained;
        } else if (selectedPlan === 'business') {
            if (currentPlanKey === 'starter') {
                modalFeatures = [...FEATURES_GAIN_LOSS.growth.gained, ...FEATURES_GAIN_LOSS.business.gained];
            } else {
                modalFeatures = FEATURES_GAIN_LOSS.business.gained;
            }
        }
    } else {
        if (selectedPlan === 'growth') {
            modalFeatures = FEATURES_GAIN_LOSS.business.lost;
        } else if (selectedPlan === 'starter') {
            if (currentPlanKey === 'business') {
                modalFeatures = FEATURES_GAIN_LOSS.starter.lost;
            } else {
                modalFeatures = FEATURES_GAIN_LOSS.growth.lost;
            }
        }
    }

    return (
        <OneGlanceLayout title="Billing & Subscription" mode="admin">
            <Head title="Billing & Subscription" />

            <div className="max-w-6xl mx-auto p-4 md:p-8">

                {/* View-Only Mode Warning Banner */}
                {isViewOnly && (
                    <div className="mb-8 p-6 rounded-[2rem] bg-gradient-to-r from-red-900/80 via-red-950 to-black border border-red-500/30 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                                    <AlertTriangle size={24} className="text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white leading-none mb-2">View-Only Mode Active</h2>
                                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                                        Your evaluation period or subscription has expired. You can view reports and download your database backup, but writing transactions and inventory is locked. 
                                        <span className="text-red-400 font-bold block mt-1">Your store data will be permanently deleted in {viewOnlyDaysLeft} days if you do not subscribe.</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.location.href = route('store.admin.data', { store_slug: storeSlug }) + '?tab=backup'}
                                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1.5"
                                >
                                    <Download size={14} /> Full System Backup & Restore
                                </button>
                                <button
                                    onClick={() => handleSelectPlan('growth')}
                                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors whitespace-nowrap"
                                >
                                    Activate Store Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Profile Summary */}
                <div className={`mb-8 p-6 md:p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-[#040113] border-white/[0.06]`}>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg" style={{ background: currentMeta.color + '15' }}>
                            <currentMeta.Icon size={32} color={currentMeta.color} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active Plan</div>
                            <div className="text-2xl font-black text-white">{currentMeta.label}</div>
                            <div className="text-xs font-bold text-slate-400 mt-1">
                                {isViewOnly ? `Locked in View-Only (${viewOnlyDaysLeft} days until deletion)` : tenant?.status === 'suspended' ? 'Trial Expired / Suspended' : isTrial ? `You have ${trialDaysLeft} days remaining in your free trial.` : isLtd ? 'Lifetime License' : subEndsAt ? `Renews on ${subEndsAt}` : 'Active Subscription'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
                        {isTrial && !isViewOnly && (
                            <>
                                <button 
                                    onClick={handleCancelTrial}
                                    className="px-4 py-3 bg-transparent hover:bg-white/[0.04] text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-colors whitespace-nowrap"
                                >
                                    Cancel Trial
                                </button>
                                <button
                                    disabled={checkoutBusy === currentPlanKey}
                                    onClick={() => handlePlanCheckout(currentPlanKey, billingCycle, currencyDisplay)}
                                    className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-wait text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                >
                                    <Zap size={14} className="fill-white" />
                                    {checkoutBusy === currentPlanKey ? 'Opening…' : 'Pay Now'}
                                </button>
                            </>
                        )}
                        {!isTrial && !isLtd && !isViewOnly && (
                            <button
                                onClick={handlePortalClick}
                                className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-slate-300 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                            >
                                <ExternalLink size={14} /> Billing Portal
                            </button>
                        )}
                        {/* Escape hatch: if a payment succeeded but the webhook
                            never landed, this pulls the subscription from
                            Lemon Squeezy and applies it immediately. */}
                        {!isLtd && tenant?.status !== 'active' && (
                            <button
                                onClick={() => runSubscriptionSync()}
                                disabled={isSyncing}
                                title="Already paid but your plan hasn't updated? Click to re-check with Lemon Squeezy."
                                className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-wait text-slate-400 hover:text-white font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                                {isSyncing ? 'Checking…' : 'Already Paid?'}
                            </button>
                        )}
                        <div className="px-5 py-2 rounded-full font-black text-xs tracking-widest uppercase border border-purple-500/20 bg-purple-500/10 text-purple-300">
                            {currentPlanKey}
                        </div>
                    </div>
                </div>

                {/* Scheduled Downgrade Warning Banner */}
                {tenant?.plan_limits?.pending_downgrade && (
                    <div className="mb-8 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                            <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-wider">Scheduled Downgrade Pending</h4>
                                <p className="text-xs text-slate-300 mt-1">
                                    Your plan is scheduled to downgrade to <span className="font-bold text-amber-300 uppercase">{tenant.plan_limits.pending_downgrade.plan}</span> on <span className="font-bold text-white">{new Date(tenant.plan_limits.pending_downgrade.effective_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCancelDowngrade}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap"
                        >
                            Cancel Downgrade
                        </button>
                    </div>
                )}

                {/* Tabs Selector */}
                <div className="flex border-b border-white/[0.06] mb-8 overflow-x-auto gap-2">
                    {[
                        { id: 'subscription', label: 'Subscription & Usage', icon: Receipt },
                        { id: 'extra_features', label: 'Extra Features', icon: Lock },
                        { id: 'addons', label: 'AI & Sync Add-ons', icon: Sparkles },
                        { id: 'services', label: 'Onboarding Services', icon: Calendar },
                        { id: 'desktop_app', label: 'Windows Application', icon: Monitor },
                    ].map((tab) => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const showWarningDot = tab.id === 'extra_features' && hasLockedActive;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap
                                    ${isActive 
                                        ? 'border-purple-500 text-white' 
                                        : 'border-transparent text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <TabIcon size={14} /> {tab.label}
                                {showWarningDot && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT 1: SUBSCRIPTION & USAGE */}
                {activeTab === 'subscription' && (
                    <div className="space-y-8 animate-fadeIn">
                        {PKR_ENABLED && country === 'PK' && (
                            <PkVerificationPanel
                                tenant={tenant}
                                pk_verification={pk_verification}
                                storeSlug={storeSlug}
                            />
                        )}

                        {/* Usage meters */}
                        <div>
                            <div className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                 <BarChart2 size={16} /> Plan Resource Usage
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

                        {/* Upgrade Options */}
                        <div className="pt-6">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center">
                                {isLtd ? 'Your Early Supporter Perks' : '🚀 Scale your system as you grow'}
                            </div>

                            {/* Pakistan Regional Pricing Unlocked Banner */}
                            {isPK && (
                                <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-950 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden text-left">
                                    <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                                    
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-2xl shadow-inner">
                                                🇵🇰
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-black">
                                                        SPECIAL GIFT UNLOCKED 🎁
                                                    </span>
                                                    <span className="text-xs font-bold text-emerald-400">Exclusive Regional Pricing</span>
                                                </div>
                                                <h3 className="text-base font-black text-white tracking-tight">
                                                    Special Pakistan Business Subsidized Rates Active!
                                                </h3>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Because you operate in Pakistan, we have unlocked special subsidized local PKR rates for your business.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 shrink-0">
                                            <button
                                                onClick={() => setCurrencyDisplay('PKR')}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-1.5 ${
                                                    currencyDisplay === 'PKR'
                                                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                🇵🇰 Subsidized PKR Price
                                            </button>
                                            <button
                                                onClick={() => setCurrencyDisplay('USD')}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-1.5 ${
                                                    currencyDisplay === 'USD'
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                🌐 Global USD Price
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Billing Cycle Toggle */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 mb-8">
                                {!isLtd && (
                                    <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                                        <button
                                            onClick={() => setBillingCycle('monthly')}
                                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                billingCycle === 'monthly'
                                                    ? 'bg-white text-[#020010] shadow-md'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            onClick={() => setBillingCycle('annual')}
                                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                                billingCycle === 'annual'
                                                    ? 'bg-emerald-600 text-white shadow-md'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Annual
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                                                billingCycle === 'annual' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                                            }`}>SAVE ~17%</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {isTrial || isViewOnly ? (
                                     ['starter', 'growth', 'business'].map(key => (
                                        <PlanCard
                                            key={key}
                                            planKey={key}
                                            planConfig={plans?.find(p => p.slug === key)?.limits ?? {}}
                                            isCurrent={key === currentPlanKey}
                                            storeSlug={storeSlug}
                                            tenant={tenant}
                                            onSelectPlan={handleSelectPlan}
                                            onCheckout={handlePlanCheckout}
                                            checkoutBusy={checkoutBusy}
                                            plans={plans}
                                            billingCycle={billingCycle}
                                            currencyDisplay={currencyDisplay}
                                        />
                                     ))
                                ) : (
                                    plans?.map((plan) => (
                                        <PlanCard
                                            key={plan.slug}
                                            planKey={plan.slug}
                                            planConfig={plan.limits}
                                            isCurrent={plan.slug === currentPlanKey}
                                            storeSlug={storeSlug}
                                            tenant={tenant}
                                            onSelectPlan={handleSelectPlan}
                                            onCheckout={handlePlanCheckout}
                                            checkoutBusy={checkoutBusy}
                                            plans={plans}
                                            billingCycle={billingCycle}
                                            currencyDisplay={currencyDisplay}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT 2: EXTRA FEATURES */}
                {activeTab === 'extra_features' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-2">
                                <Lock className="text-purple-400" size={24} />
                                <h3 className="text-lg font-black text-white">Extra Features Control</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-8 max-w-xl">
                                If you have configured features that are not included in your current plan, you can deactivate/remove them here to restore normal operations. Alternatively, upgrade your plan to unlock full access.
                            </p>

                            <div className="space-y-4">
                                {feature_status?.map((feat) => {
                                    const targetPlan = FEATURE_UPGRADE_TARGET[feat.key] || 'growth';
                                    return (
                                        <div 
                                            key={feat.key} 
                                            className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                                feat.is_active && feat.is_locked
                                                ? 'bg-red-500/[0.02] border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.03)]'
                                                : feat.is_active
                                                ? 'bg-emerald-500/[0.02] border-emerald-500/20'
                                                : 'bg-white/[0.01] border-white/[0.04]'
                                            }`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-black text-white">{feat.name}</span>
                                                    
                                                    {feat.is_active && feat.is_locked && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                                                            <AlertTriangle size={10} /> Active & Locked (Limits Exceeded)
                                                        </span>
                                                    )}
                                                    {feat.is_active && !feat.is_locked && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> Active & Subscribed
                                                        </span>
                                                    )}
                                                    {!feat.is_active && feat.is_locked && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                                            Locked (Upgrade to unlock)
                                                        </span>
                                                    )}
                                                    {!feat.is_active && !feat.is_locked && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700">
                                                            Available
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xl">{feat.description}</p>
                                            </div>

                                            <div className="flex items-center gap-3 self-end md:self-center">
                                                {feat.is_active && feat.is_locked && (
                                                    <button
                                                        onClick={() => handleDeactivateFeature(feat.key, feat.name)}
                                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                                                    >
                                                        Deactivate Feature
                                                    </button>
                                                )}
                                                {feat.is_locked && (
                                                    <button
                                                        onClick={() => handleSelectPlan(targetPlan)}
                                                        className="px-4 py-2 bg-white text-[#020010] hover:bg-slate-100 rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1 shadow-md"
                                                    >
                                                        <Sparkles size={12} /> Keep & Upgrade
                                                    </button>
                                                )}
                                                {!feat.is_locked && feat.is_active && (
                                                    <span className="text-xs font-semibold text-slate-500">Configured & Healthy</span>
                                                )}
                                                {!feat.is_locked && !feat.is_active && (
                                                    <span className="text-xs font-semibold text-slate-500">Not Configured</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT 3: AI & SYNC ADD-ONS */}
                {activeTab === 'addons' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-4">
                                <Cpu className="text-purple-400" size={24} />
                                <h3 className="text-lg font-black text-white">AI Engine Add-on</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                Supercharge your store with AI-powered scanning (SmartCapture) and interactive assistant tools. Every store starts with 10 free credits to test out the capabilities.
                            </p>

                            {/* Status Card & Progress */}
                            <div className="p-5 rounded-2xl bg-[#0b081e]/40 border border-white/[0.05] mb-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Level</span>
                                        <div className="text-2xl font-black text-white mt-1 capitalize">
                                            {tenant?.ai_status === 'none' ? 'Free Starter Tier (10 Credits)' : tenant?.ai_status}
                                        </div>
                                    </div>

                                    {tenant?.ai_status === 'none' && (
                                        <div className="flex-1 max-w-xs">
                                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                <span>Free Scans Used:</span>
                                                <span className="font-bold text-white">{(tenant?.plan_limits?.ai_scans_used ?? 0)} / 10</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" 
                                                    style={{ width: `${Math.min(100, ((tenant?.plan_limits?.ai_scans_used ?? 0) / 10) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {tenant?.ai_status === 'managed' && (
                                        <div className="flex gap-4">
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase">Scans</div>
                                                <div className="text-sm font-black text-white">
                                                    {(tenant?.plan_limits?.ai_scans_used ?? 0)} / {(tenant?.plan_limits?.ai_scans_limit ?? 90)}
                                                </div>
                                            </div>
                                            <div className="text-right border-l border-white/10 pl-4">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase">Queries</div>
                                                <div className="text-sm font-black text-white">
                                                    {(tenant?.plan_limits?.ai_queries_used ?? 0)} / {(tenant?.plan_limits?.ai_queries_limit ?? 110)}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {tenant?.ai_status === 'byok' && (
                                        <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                                            <CheckCircle2 size={14} /> Bring Your Own Key License Active
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upgrade Options Header */}
                            <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                <Sparkles size={16} className="text-amber-400" /> Choose Your Upgrade Path
                            </h4>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Option 1: BYOK */}
                                <div className="lg:col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                Bring Your Own Key
                                            </span>
                                            <div className="text-xl font-black text-white">$5 <span className="text-xs font-normal text-slate-400">once</span></div>
                                        </div>
                                        <h5 className="text-sm font-black text-white mb-2">Lifetime BYOK License</h5>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">
                                            Bypass platform scanning fees forever. Provide your own API keys for Gemini, Claude, OpenAI, or DeepSeek and pay nothing else.
                                        </p>
                                    </div>
                                    <div className="mt-6">
                                        {tenant?.ai_status === 'byok' ? (
                                            <button disabled className="w-full py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold uppercase tracking-wider cursor-default">
                                                Already Purchased
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePurchaseAddon('ai_byok')}
                                                disabled={isPurchasingAddon !== null}
                                                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#020010] rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                            >
                                                {isPurchasingAddon === 'ai_byok' ? <Loader2 size={14} className="animate-spin" /> : 'Buy BYOK Unlock'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Option 2: Managed Plans */}
                                <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                Managed API
                                            </span>
                                            <span className="text-xs text-slate-400">Monthly Subscriptions</span>
                                        </div>
                                        <h5 className="text-sm font-black text-white mb-2">Managed AI Subscriptions</h5>
                                        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                                            No developer keys or setup required. Use our fast platform credentials directly. Pick the tier that matches your monthly volume:
                                        </p>

                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { key: 'ai_starter', label: 'Starter AI', price: '$3', scans: 90, queries: 110 },
                                                { key: 'ai_lite', label: 'Lite AI', price: '$5', scans: 150, queries: 200 },
                                                { key: 'ai_pro', label: 'Pro AI', price: '$15', scans: 480, queries: 420 },
                                                { key: 'ai_ultimate', label: 'Ultimate AI', price: '$25', scans: 850, queries: 800 }
                                            ].map(plan => (
                                                <div 
                                                    key={plan.key} 
                                                    onClick={() => handlePurchaseAddon(plan.key)}
                                                    className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-purple-500/30 hover:bg-purple-500/[0.02] cursor-pointer transition-all flex flex-col justify-between group"
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-black text-white group-hover:text-purple-300 transition-colors">{plan.label}</span>
                                                        <span className="text-xs font-black text-purple-400">{plan.price}</span>
                                                    </div>
                                                    <div className="text-[9px] text-slate-500">
                                                        {plan.scans} scans / {plan.queries} queries
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Synchronizations Sync Section */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-4">
                                <Globe2 className="text-indigo-400" size={24} />
                                <h3 className="text-lg font-black text-white">Platform Sync Channels</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                Keep your inventory in sync with WooCommerce and other platforms automatically.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl bg-[#0b081e]/40 border border-white/[0.05]">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subscribed Channels</span>
                                    <div className="space-y-2 mt-3">
                                        {tenant?.sync_channels && tenant.sync_channels.length > 0 ? (
                                            tenant.sync_channels.map(ch => (
                                                <div key={ch} className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    {ch} Channel
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-slate-500">No active sync channels.</div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Platform Sync Trial</span>
                                        <h4 className="text-sm font-black text-white mt-1">Evaluate WooCommerce Sync</h4>
                                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                                            Test automatic inventory syncing with WooCommerce for the remainder of your trial period.
                                        </p>
                                    </div>
                                    
                                    <div className="mt-4">
                                        {tenant?.sync_channels && tenant.sync_channels.includes('woocommerce') ? (
                                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                                                <CheckCircle2 size={14} /> Sync Channels Active
                                            </span>
                                        ) : isTrial ? (
                                            tenant?.plan_limits?.sync_trial_used ? (
                                                <span className="text-xs text-slate-500 font-bold">Sync trial already utilized.</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddonTrial('sync')}
                                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                                                >
                                                    Start Platform Sync Trial
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                onClick={() => handleSelectPlan('growth')}
                                                className="px-5 py-2.5 bg-white text-[#020010] rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                                            >
                                                Subscribe to Sync Add-on
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT 4: ONBOARDING SERVICES */}
                {activeTab === 'services' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#0b081e] to-black border border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="text-purple-400" size={24} />
                                <h3 className="text-lg font-black text-white">Professional Product Upload Service</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-8 max-w-xl">
                                Let our catalog engineering team structure and upload your inventory. Use the calculator below to estimate the dynamic cost of importing your products.
                            </p>

                            {/* Service Tiers Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {Object.entries(SERVICE_TIERS).map(([key, tier]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedService(key)}
                                        className={`text-left p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px]
                                            ${selectedService === key 
                                                ? 'bg-purple-600/10 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.06)]' 
                                                : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10'
                                            }`}
                                    >
                                        <div>
                                            <div className="text-white font-black text-sm">{tier.name}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">{tier.desc}</div>
                                        </div>
                                        <div className="flex justify-between items-baseline mt-4 pt-3 border-t border-white/[0.04] w-full">
                                            <span className="text-[10px] text-purple-400 font-semibold">{tier.sla}</span>
                                            <span className="text-white font-black text-sm">{fmt(tier.priceUSD, tier.pricePKR)}<span className="text-[10px] text-slate-500 font-medium">/ea</span></span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Calculator inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pt-6 border-t border-white/[0.06]">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">How many products?</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 100"
                                            value={calcProducts}
                                            onChange={(e) => setCalcProducts(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white text-sm outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Average variants per product?</label>
                                        <input
                                            type="number"
                                            placeholder="First 5 variants free (e.g. 8)"
                                            value={calcVariants}
                                            onChange={(e) => setCalcVariants(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white text-sm outline-none focus:border-purple-500 transition-colors"
                                        />
                                        <span className="text-[9px] text-slate-500 mt-1 block">First 5 variants included. {fmt(serviceTier.extraUSD, serviceTier.extraPKR)} per block of 5 extra variants.</span>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.05] flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cost Estimate Details</span>
                                        <div className="space-y-2 mt-4">
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>Tier Base Rate:</span>
                                                <span className="text-white font-bold">{fmt(serviceTier.priceUSD, serviceTier.pricePKR)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>Extra Variant Surcharge:</span>
                                                <span className="text-white font-bold">+{fmt(extraBlocks * serviceTier.extraUSD, extraBlocks * serviceTier.extraPKR)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>Final Price Per Product:</span>
                                                <span className="text-white font-bold">{fmt(usdPricePerProduct, pkrPricePerProduct)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center mt-4">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Estimated Total</span>
                                        <span className="text-2xl font-black text-purple-400">{fmt(usdTotalSetupCost, pkrTotalSetupCost)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="flex justify-end pt-4 border-t border-white/[0.06]">
                                <button
                                    onClick={handleOrderSetupService}
                                    disabled={calcProductsNum === 0 || isOrderingService}
                                    className="px-8 py-3.5 bg-white text-[#020010] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:shadow-none rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    {isOrderingService ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-[#020010] border-t-transparent rounded-full animate-spin"></span>
                                            Redirecting...
                                        </>
                                    ) : (
                                        `Order Setup Service (${fmt(usdTotalSetupCost, pkrTotalSetupCost)})`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT 5: DESKTOP APPLICATION */}
                {activeTab === 'desktop_app' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#0b081e] to-black border border-white/[0.06] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="flex items-start gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                                    <Monitor className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">VenQore Station for Windows</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-2xl">
                                        VenQore Station is our native enterprise desktop application that acts as a direct hardware bridge to your registers. It enables raw receipt printing, automatic cash drawer kicks, barcode scanning, scale readings, and cashier security audits with focus-loss tracking.
                                    </p>
                                </div>
                            </div>

                            {/* Download Action Cards */}
                            <div className="max-w-xl mb-8">
                                {/* Setup Installer */}
                                <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01] hover:border-purple-500/20 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-black text-white">Windows Setup Installer</span>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">Official Build</span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                            Official setup installer. Establishes secure system directories, registers start menu entries, registers shell protocol endpoints, and supports silent auto-updates. Requires standard system installation to prevent unapproved cashier portable copies.
                                        </p>
                                    </div>
                                    <a
                                        href="/downloads/VenQore_Station_Setup.exe"
                                        download
                                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/10"
                                    >
                                        <Download size={14} /> Download Setup Installer (.exe)
                                    </a>
                                </div>
                            </div>

                            {/* Pairing and Quick Start Guide */}
                            <div className="pt-6 border-t border-white/[0.06]">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Quick Setup &amp; Pairing Instructions</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {[
                                        { step: '1', title: 'Install & Boot', desc: 'Download the setup installer above, run it on your register, and launch the VenQore Station app.' },
                                        { step: '2', title: 'Store Pairing', desc: `Enter your store's display slug: ${storeSlug || 'my-store'} on the pairing screen and click Connect.` },
                                        { step: '3', title: 'Accept Consent', desc: 'Accept the native employee security tracking consent when prompted by the manager configuration.' },
                                        { step: '4', title: 'Configure Hardware', desc: 'Click the Gear icon in the top notch bar to set receipt printers, scale baud rates, or exit passcodes.' },
                                    ].map((guide) => (
                                        <div key={guide.step} className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                                            <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-xs mb-3">
                                                {guide.step}
                                            </div>
                                            <h5 className="text-xs font-bold text-white mb-1">{guide.title}</h5>
                                            <p className="text-[10px] text-slate-400 leading-relaxed">{guide.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* AppSumo Promo Banner */}
                {false && (
                    <div className="mt-16 p-6 rounded-3xl bg-white/[0.01] border border-white/[0.04] text-center">
                        <p className="text-xs text-slate-500 font-medium">
                            Have an AppSumo promo code? Redeem your codes at{' '}
                            <a href="/redeem" className="text-purple-400 font-black underline decoration-2 underline-offset-4">
                                /redeem
                            </a>.
                        </p>
                    </div>
                )}
            </div>

            {/* Change Plan Confirmation Modal */}
            <Modal show={isChangeModalOpen} onClose={() => setIsChangeModalOpen(false)} maxWidth="md">
                <div className="relative overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white animate-fadeIn">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mb-4">
                        <Sparkles className="text-purple-400" size={20} />
                        Confirm Subscription {isUpgrade ? 'Upgrade' : 'Downgrade'}
                    </h3>

                    {/* Proration Detail & Summary */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            <div className="text-center flex-1">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Plan</div>
                                <div className="text-sm font-black mt-1 capitalize text-slate-300">{currentPlanKey}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{fmt(currentPriceUSD, currentPricePKR)}/mo</div>
                            </div>
                            <ArrowRight className="text-slate-600 shrink-0" size={16} />
                            <div className="text-center flex-1">
                                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">New Plan</div>
                                <div className="text-sm font-black mt-1 capitalize text-purple-300">{selectedPlan}</div>
                                <div className="text-xs text-purple-400 mt-0.5">{fmt(targetPriceUSD, targetPricePKR)}/mo</div>
                            </div>
                        </div>

                        {/* gained or lost features list */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                                {isUpgrade ? '🎁 Features You Will Unlock:' : '⚠️ Features You Will Lose after billing cycle:'}
                            </div>
                            <div className="space-y-2">
                                {modalFeatures.map((feat, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        {isUpgrade ? (
                                            <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                        )}
                                        <span className="text-slate-300">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Billing schedule description */}
                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs leading-relaxed text-slate-300">
                            {isTrial ? (
                                <p>
                                    Your store is currently in the **Evaluation Period**. Switching to the <span className="font-bold text-white capitalize">{selectedPlan}</span> trial is **free of charge** and will take effect immediately. Your free trial ends on <span className="text-white font-semibold">{tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>.
                                </p>
                            ) : isUpgrade ? (
                                <p>
                                    Your upgrade takes effect **instantly**. Today you will only be charged a prorated surplus difference of <span className="text-emerald-400 font-black text-sm">{fmt(proratedEstUSD, proratedEstPKR)}</span> for the remaining <span className="text-white font-semibold">{remainingDays} days</span> of your current billing month. Starting <span className="text-white font-semibold">{nextBillingDateStr}</span>, you will be charged the full price of <span className="text-white font-semibold">{fmt(targetPriceUSD, targetPricePKR)}/month</span>.
                                </p>
                            ) : (
                                <p>
                                    Your downgrade is **scheduled** and will take effect on <span className="text-amber-400 font-black">{nextBillingDateStr}</span> at the end of your paid billing month. You will keep your current features and limits until then. Starting on that date, your plan will become <span className="text-white font-bold capitalize">{selectedPlan}</span>, and your monthly billing will drop to <span className="text-white font-semibold">{fmt(targetPriceUSD, targetPricePKR)}/month</span>.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setIsChangeModalOpen(false)}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmPlanChange}
                            className={`px-5 py-2.5 rounded-xl text-black font-black text-xs uppercase tracking-wider transition-all hover:shadow-lg ${
                                isUpgrade 
                                ? 'bg-white hover:bg-slate-100'
                                : 'bg-amber-500 hover:bg-amber-400'
                            }`}
                        >
                            Confirm {isUpgrade ? 'Upgrade' : 'Downgrade'}
                        </button>
                    </div>
                </div>
            </Modal>
        </OneGlanceLayout>
    );
}

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
                        <h4 className="font-black text-sm uppercase tracking-wide">Regional Pricing Unlocked</h4>
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
                        <h4 className="font-black text-sm uppercase tracking-wide">Verification Request Pending</h4>
                        <p className="text-xs text-amber-300/80 mt-1">
                            Your CNIC front/back documents are currently being reviewed by our compliance team. Regional PKR pricing checkouts will unlock as soon as your identity is verified.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/[0.04] mb-8">
            <div className="flex gap-3 items-start mb-4">
                <BadgeCheck className="text-purple-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-black text-sm text-white uppercase tracking-wide">Verify Identity for Regional Pricing</h4>
                    <p className="text-xs text-slate-400 mt-1">
                        Pakistani stores qualify for special regional pricing (in PKR). Submit your CNIC and contact details below to unlock PKR checkouts. Limit of 1 store per CNIC.
                    </p>
                </div>
            </div>

            {pk_verification?.status === 'rejected' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4 text-xs">
                    <strong>Rejection Reason:</strong> {pk_verification.rejection_reason}
                </div>
            )}

            {msg && (
                <div className={`p-4 rounded-xl mb-4 text-xs ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">CNIC Number (13 Digits)</label>
                    <input
                        type="text"
                        pattern="^[0-9]{5}-?[0-9]{7}-?[0-9]{1}$"
                        value={cnic}
                        onChange={e => setCnic(e.target.value)}
                        placeholder="e.g. 42101-1234567-1"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-white text-xs outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. +92 300 1234567"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-white text-xs outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">CNIC Front Side Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setImageFront(e.target.files[0])}
                        required
                        className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:uppercase file:bg-white/[0.04] file:text-white file:cursor-pointer hover:file:bg-white/[0.08]"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">CNIC Back Side Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setImageBack(e.target.files[0])}
                        required
                        className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:uppercase file:bg-white/[0.04] file:text-white file:cursor-pointer hover:file:bg-white/[0.08]"
                    />
                </div>
                <div className="md:col-span-2 mt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                    >
                        {loading ? 'Submitting...' : 'Submit Documents'}
                    </button>
                </div>
            </form>
        </div>
    );
}

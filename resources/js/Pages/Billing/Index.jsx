import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import Modal from '@/Components/Modal';
import {
    Zap, Crown, Shield, CheckCircle2, XCircle, AlertTriangle,
    ArrowRight, Calendar, Users, Package, BarChart2, Globe2,
    Cpu, GitBranch, ExternalLink, Sparkles, Lock, Infinity,
    Receipt, Download, Info, HelpCircle, MessageSquare, Monitor
} from 'lucide-react';

// --- Plan metadata (display-only) -------------------------------------------
const PLAN_META = {
    starter:  { label: 'Starter Engine',  price: '$19/mo',  color: '#6366f1', Icon: Shield },
    growth:   { label: 'Growth Engine',   price: '$49/mo',  color: '#8b5cf6', Icon: Zap },
    business: { label: 'Business Engine', price: '$99/mo',  color: '#f59e0b', Icon: Crown },
    ltd_1:    { label: 'LTD — Starter',  price: 'Lifetime', color: '#10b981', Icon: Sparkles },
    ltd_2:    { label: 'LTD — Growth',   price: 'Lifetime', color: '#10b981', Icon: Sparkles },
    ltd_3:    { label: 'LTD — Business', price: 'Lifetime', color: '#10b981', Icon: Sparkles },
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
    basic:        { name: 'Basic Upload',        priceUSD: 0.50, pricePKR: 100,  extraUSD: 0.25, extraPKR: 50,  sla: '2–3 business days', desc: 'Product data uploaded with all core fields. Up to 5 variants per product included.' },
    descriptions: { name: '+ Rich Descriptions', priceUSD: 1.00, pricePKR: 150,  extraUSD: 0.25, extraPKR: 50,  sla: '3–5 business days', desc: 'Everything in Basic + long descriptions, SEO copy, and full product detail. You provide images.' },
    images:       { name: '+ AI Images',         priceUSD: 1.50, pricePKR: 200,  extraUSD: 0.25, extraPKR: 50,  sla: '4–6 business days', desc: 'Everything in Descriptions + we source or AI-generate product images for you.' },
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
function PlanCard({ planKey, planConfig, isCurrent, storeSlug, tenant, onSelectPlan, plans }) {
    const { geo = { country: 'US', currency: 'USD', symbol: '$' } } = usePage().props;
    const isPK = geo.currency === 'PKR';
    const fmt = (n) => isPK ? `Rs ${n.toLocaleString()}` : `$${n}`;

    const meta = PLAN_META[planKey] ?? { label: planKey, price: '—', color: '#6366f1', Icon: Shield };
    const { Icon } = meta;
    const isLtd = planKey.startsWith('ltd');

    const dbPlan = plans?.find(p => p.slug === planKey);
    const planName = dbPlan?.name ? `${dbPlan.name} Engine` : meta.label;
    const planPrice = dbPlan 
        ? (dbPlan.price_monthly ? `${fmt(dbPlan.price_monthly)}/mo` : 'Free')
        : meta.price;
    const planAnnualPrice = dbPlan?.price_annual 
        ? `or ${fmt(Math.round(dbPlan.price_annual / 12))}/mo billed annually`
        : null;

    if (isLtd && !isCurrent) return null;
    const planOrder = ['starter', 'growth', 'business'];
    const currentIdx = planOrder.indexOf(tenant?.plan ?? 'starter');
    const thisIdx    = planOrder.indexOf(planKey);

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
            
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: meta.color + '15' }}>
                    <Icon size={24} color={meta.color} />
                </div>
                <div>
                    <div className="font-bold text-base text-white leading-tight">{planName}</div>
                    <div className="text-sm font-bold mt-1" style={{ color: meta.color }}>
                        {planPrice}
                        {planAnnualPrice && (
                            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                {planAnnualPrice}
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
                <div className="text-center py-3 text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-center justify-center gap-2">
                    <CheckCircle2 size={14} /> Active Plan
                </div>
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
export default function BillingIndex({ tenant, plans, usage, feature_status }) {
    const { store, geo = { country: 'US', currency: 'USD', symbol: '$' } } = usePage().props;
    const storeSlug = store?.slug;
    const isPK = geo.currency === 'PKR';
    const fmt = (n) => isPK ? `Rs ${n.toLocaleString()}` : `$${n}`;

    const [activeTab, setActiveTab] = useState('subscription');

    // Onboarding Setup Service States
    const [calcProducts, setCalcProducts] = useState('');
    const [calcVariants, setCalcVariants] = useState('');
    const [selectedService, setSelectedService] = useState('basic');
    const [isOrderingService, setIsOrderingService] = useState(false);

    const handleOrderSetupService = () => {
        setIsOrderingService(true);
        fetch(route('store.billing.checkout-upload-service', { store_slug: storeSlug }), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify({
                tier: selectedService,
                products: calcProductsNum,
                variants: calcVariantsNum
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.url) {
                window.location.href = data.url;
            } else if (data.error) {
                alert(data.error);
                setIsOrderingService(false);
            } else {
                alert('An unexpected error occurred. Please try again.');
                setIsOrderingService(false);
            }
        })
        .catch(err => {
            console.error(err);
            alert('Failed to generate checkout link. Please check your network connection.');
            setIsOrderingService(false);
        });
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

    const isTrial = tenant?.status === 'trial' || (tenant?.trial_ends_at && new Date(tenant.trial_ends_at) > new Date());
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
    const pricePerProduct = serviceTier
        ? (isPK ? serviceTier.pricePKR : serviceTier.priceUSD) + extraBlocks * (isPK ? serviceTier.extraPKR : serviceTier.extraUSD)
        : 0;
    const totalSetupCost = calcProductsNum * pricePerProduct;

    // Handle cancel trial
    const handleCancelTrial = () => {
        if (confirm("Are you sure you want to cancel your free trial? Your store will immediately transition to View-Only mode for 30 days, locking all modifications and sales. You can restore access anytime by subscribing.")) {
            router.post(route('store.billing.cancel-trial', { store_slug: storeSlug }));
        }
    };

    // Handle activate addon trial
    const handleAddonTrial = (addon) => {
        router.post(route('store.billing.addon-trial', { store_slug: storeSlug }), { addon });
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

        window.location.href = route('store.billing.portal', { store_slug: storeSlug });
    };

    // Calculate dynamic proration details for confirmation modal
    const targetPlanModel = plans?.find(p => p.slug === selectedPlan);
    const currentPlanModel = plans?.find(p => p.slug === currentPlanKey);

    const targetPrice = targetPlanModel ? parseFloat(targetPlanModel.price_monthly) : (selectedPlan === 'starter' ? 19 : selectedPlan === 'growth' ? 49 : selectedPlan === 'business' ? 99 : 0);
    const currentPrice = currentPlanModel ? parseFloat(currentPlanModel.price_monthly) : (currentPlanKey === 'starter' ? 19 : currentPlanKey === 'growth' ? 49 : currentPlanKey === 'business' ? 99 : 0);
    const diff = targetPrice - currentPrice;
    
    let proratedEst = "0.00";
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
            proratedEst = (diff * ratio).toFixed(2);
        }
    } else {
        const nextBilling = new Date();
        nextBilling.setDate(nextBilling.getDate() + 30);
        nextBillingDateStr = nextBilling.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        proratedEst = targetPrice.toFixed(2);
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

                {/* Active Trial Alert Banner */}
                {isTrial && !isViewOnly && (
                    <div className="mb-8 p-6 rounded-[2rem] bg-gradient-to-r from-amber-500/80 to-orange-600/90 shadow-xl shadow-amber-500/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Zap size={22} className="fill-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight mb-0.5">Evaluation Period Active</h2>
                                    <p className="text-white/80 font-bold text-xs uppercase">
                                        You have <span className="underline decoration-2 underline-offset-2">{trialDaysLeft} days remaining</span> in your free trial.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleSelectPlan('growth')}
                                    className="px-6 py-3 bg-white text-orange-600 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-orange-50 transition-all shadow-md active:scale-95 whitespace-nowrap"
                                >
                                    Subscribe Now
                                </button>
                                <button 
                                    onClick={handleCancelTrial}
                                    className="px-4 py-3 bg-transparent hover:bg-white/10 text-white/80 hover:text-white rounded-xl font-bold text-xs transition-colors"
                                >
                                    Cancel Trial
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
                                {isViewOnly ? `Locked in View-Only (${viewOnlyDaysLeft} days until deletion)` : isTrial ? `${trialDaysLeft} days remaining on trial` : isLtd ? 'Lifetime License' : subEndsAt ? `Renews on ${subEndsAt}` : 'Active Subscription'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
                        {!isLtd && !isViewOnly && (
                            <button
                                onClick={handlePortalClick}
                                className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-slate-300 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                            >
                                <ExternalLink size={14} /> Billing Portal
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
                                            plans={plans}
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
                                            plans={plans}
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
                                Unlock Gemini-powered smart answers, scan invoice details directly, and let artificial intelligence track product parameters. 
                                Set up managed queries or provide your own API key to bypass billing.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* AI Status Card */}
                                <div className="p-5 rounded-2xl bg-[#0b081e]/40 border border-white/[0.05]">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Level</span>
                                    <div className="text-2xl font-black text-white mt-1 capitalize">{tenant?.ai_status === 'none' ? 'Disabled' : tenant?.ai_status}</div>
                                    
                                    {tenant?.ai_status === 'managed' && (
                                        <div className="space-y-2 mt-4 pt-4 border-t border-white/[0.05]">
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>AI Queries:</span>
                                                <span className="font-bold text-white">{tenant?.plan_limits?.ai_queries_used ?? 0} / {tenant?.plan_limits?.ai_queries_limit ?? 110}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>AI Scans:</span>
                                                <span className="font-bold text-white">{tenant?.plan_limits?.ai_scans_used ?? 0} / {tenant?.plan_limits?.ai_scans_limit ?? 90}</span>
                                            </div>
                                        </div>
                                    )}

                                    {tenant?.ai_status === 'byok' && (
                                        <div className="mt-4 pt-4 border-t border-white/[0.05]">
                                            <p className="text-[11px] text-amber-300">Bring Your Own Key active. Customize your keys in the Chatbot Settings page.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Trial Activate Card */}
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Trial Configuration</span>
                                        <h4 className="text-sm font-black text-white mt-1">Want to evaluate AI features?</h4>
                                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                                            If you are on an active trial, you can start a 14-day free trial of our managed AI Engine immediately. This can only be done once.
                                        </p>
                                    </div>
                                    
                                    <div className="mt-4">
                                        {tenant?.ai_status !== 'none' ? (
                                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                                                <CheckCircle2 size={14} /> AI Engine Active
                                            </span>
                                        ) : isTrial ? (
                                            tenant?.plan_limits?.ai_trial_used ? (
                                                <span className="text-xs text-slate-500 font-bold">Add-on trial already utilized.</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddonTrial('ai')}
                                                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                                                >
                                                    Start 14-Day AI Trial
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                onClick={() => handleSelectPlan('growth')}
                                                className="px-5 py-2.5 bg-white text-[#020010] rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                                            >
                                                Subscribe to AI Add-on
                                            </button>
                                        )}
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
                                            <span className="text-white font-black text-sm">{fmt(isPK ? tier.pricePKR : tier.priceUSD)}<span className="text-[10px] text-slate-500 font-medium">/ea</span></span>
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
                                        <span className="text-[9px] text-slate-500 mt-1 block">First 5 variants included. {fmt(isPK ? serviceTier.extraPKR : serviceTier.extraUSD)} per block of 5 extra variants.</span>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.05] flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cost Estimate Details</span>
                                        <div className="space-y-2 mt-4">
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>Tier Base Rate:</span>
                                                <span className="text-white font-bold">{fmt(isPK ? serviceTier.pricePKR : serviceTier.priceUSD)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>Extra Variant Surcharge:</span>
                                                <span className="text-white font-bold">+{fmt(extraBlocks * (isPK ? serviceTier.extraPKR : serviceTier.extraUSD))}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>Final Price Per Product:</span>
                                                <span className="text-white font-bold">{fmt(pricePerProduct)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center mt-4">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Estimated Total</span>
                                        <span className="text-2xl font-black text-purple-400">{fmt(totalSetupCost)}</span>
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
                                        `Order Setup Service (${fmt(totalSetupCost)})`
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
                <div className="mt-16 p-6 rounded-3xl bg-white/[0.01] border border-white/[0.04] text-center">
                    <p className="text-xs text-slate-500 font-medium">
                        Have an AppSumo promo code? Redeem your codes at{' '}
                        <a href="/redeem" className="text-purple-400 font-black underline decoration-2 underline-offset-4">
                            /redeem
                        </a>.
                    </p>
                </div>
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
                                <div className="text-xs text-slate-500 mt-0.5">{fmt(currentPrice)}/mo</div>
                            </div>
                            <ArrowRight className="text-slate-600 shrink-0" size={16} />
                            <div className="text-center flex-1">
                                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">New Plan</div>
                                <div className="text-sm font-black mt-1 capitalize text-purple-300">{selectedPlan}</div>
                                <div className="text-xs text-purple-400 mt-0.5">{fmt(targetPrice)}/mo</div>
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
                                    Your upgrade takes effect **instantly**. Today you will only be charged a prorated surplus difference of <span className="text-emerald-400 font-black text-sm">{fmt(parseFloat(proratedEst))}</span> for the remaining <span className="text-white font-semibold">{remainingDays} days</span> of your current billing month. Starting <span className="text-white font-semibold">{nextBillingDateStr}</span>, you will be charged the full price of <span className="text-white font-semibold">{fmt(targetPrice)}/month</span>.
                                </p>
                            ) : (
                                <p>
                                    Your downgrade is **scheduled** and will take effect on <span className="text-amber-400 font-black">{nextBillingDateStr}</span> at the end of your paid billing month. You will keep your current features and limits until then. Starting on that date, your plan will become <span className="text-white font-bold capitalize">{selectedPlan}</span>, and your monthly billing will drop to <span className="text-white font-semibold">{fmt(targetPrice)}/month</span>.
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

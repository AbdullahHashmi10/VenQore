import React, { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel, GlassCard
} from './Shared/MarketingLayout';
import {
    Check, X, ArrowRight, ArrowLeft, Zap, ShieldCheck, Crown,
    ChevronDown, Sparkles, Globe, CreditCard, Lock, CheckCircle2,
    AlertCircle, Cpu, Key, Ban, Star, ShoppingCart, Package,
    BarChart3, Layers, MessageSquare, TrendingUp, Rocket
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   VENQORE PRICING — "One Decision At A Time"
   ═══════════════════════════════════════════════════════════════════════ */

// ── FAQ Component ──────────────────────────────────────────────────────
const FaqItem = ({ question, answer, id }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-white/[0.06]">
            <button
                id={id}
                onClick={() => setOpen(!open)}
                className="w-full py-6 flex items-start justify-between text-left group"
            >
                <span className="text-sm font-semibold text-white/90 leading-snug pr-6 group-hover:text-white transition-colors">
                    {question}
                </span>
                <ChevronDown
                    size={16}
                    className={`flex-shrink-0 mt-0.5 transition-all duration-400 ${open ? 'rotate-180 text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                />
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'max-h-80 pb-6' : 'max-h-0'}`}>
                <p className="text-sm text-slate-400 leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

// ── Comparison Table Row ───────────────────────────────────────────────
const TableRow = ({ label, starter, growth, enterprise, highlight }) => (
    <tr className={`border-b border-white/[0.04] transition-colors ${highlight ? 'bg-white/[0.015]' : 'hover:bg-white/[0.01]'}`}>
        <td className="py-3.5 pl-6 pr-4 text-xs text-slate-400 font-medium">{label}</td>
        <td className="py-3.5 px-4 text-center text-xs">
            {typeof starter === 'boolean'
                ? (starter ? <Check size={14} className="mx-auto text-teal-400" /> : <X size={14} className="mx-auto text-slate-500" />)
                : <span className="text-slate-300 font-semibold">{starter}</span>}
        </td>
        <td className="py-3.5 px-4 text-center text-xs bg-teal-950/20">
            {typeof growth === 'boolean'
                ? (growth ? <Check size={14} className="mx-auto text-teal-400" /> : <X size={14} className="mx-auto text-slate-500" />)
                : <span className="text-slate-300 font-semibold">{growth}</span>}
        </td>
        <td className="py-3.5 pr-6 pl-4 text-center text-xs">
            {typeof enterprise === 'boolean'
                ? (enterprise ? <Check size={14} className="mx-auto text-teal-400" /> : <X size={14} className="mx-auto text-slate-500" />)
                : <span className="text-slate-300 font-semibold">{enterprise}</span>}
        </td>
    </tr>
);

// ── Billing Toggle ─────────────────────────────────────────────────────
const BillingToggle = ({ value, onChange }) => (
    <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {[
            { key: 'subscription_monthly', label: 'Monthly' },
            { key: 'subscription_annual', label: 'Annual', badge: 'Save 20%' },
            { key: 'ltd', label: 'Lifetime' },
        ].map((opt) => (
            <button
                key={opt.key}
                onClick={() => onChange(opt.key)}
                className={`relative px-4 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-300
                    ${value === opt.key
                        ? opt.key === 'ltd'
                            ? 'bg-amber-600/80 text-white shadow-md'
                            : 'bg-teal-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-300'}`}
            >
                {opt.label}
                {opt.badge && (
                    <span className="absolute -top-2.5 -right-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[8px] font-black rounded-full whitespace-nowrap">
                        {opt.badge}
                    </span>
                )}
            </button>
        ))}
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────
export default function Pricing({ plans = [] }) {
    const { geo = { country: 'US', currency: 'USD', symbol: '$' }, auth } = usePage().props;
    const isPK = geo.currency === 'PKR';

    const [billingType, setBillingType] = useState('subscription_annual');
    const [selectedPlan, setSelectedPlan] = useState('growth');
    const [selectedAI, setSelectedAI] = useState('none');
    const [currentStep, setCurrentStep] = useState(1); // 1=pricing page, 2=sync, 3=onboarding, 4=checkout, 5=confirmation
    const [selectedSyncs, setSelectedSyncs] = useState([]);
    const [selectedService, setSelectedService] = useState(null); // 'basic' | 'descriptions' | 'images'
    const [calcProducts, setCalcProducts] = useState('');
    const [calcVariants, setCalcVariants] = useState('');
    const [trialMode, setTrialMode] = useState('instant');
    const [checkoutDetails, setCheckoutDetails] = useState({ email: '', phone: '', cardholder: '', cardNumber: '', expiry: '', cvc: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const aiSectionRef = useRef(null);
    const confirmSectionRef = useRef(null);

    const isLTD = billingType === 'ltd';

    useEffect(() => {
        setSelectedAI('none');
    }, [selectedPlan]);

    const handleCurrencyOverride = (country) => {
        router.post(route('marketing.pricing.override'), { country }, { preserveScroll: true });
    };

    // Price helpers — default fallback
    const defaultPrices = isPK ? {
        starter: { subscription_monthly: 1100, subscription_annual: 916, ltd: 22120 },
        growth: { subscription_monthly: 1800, subscription_annual: 1500, ltd: 55720 },
        enterprise: { subscription_monthly: 5300, subscription_annual: 4416, ltd: 111720 },
    } : {
        starter: { subscription_monthly: 36, subscription_annual: 29, ltd: 79 },
        growth: { subscription_monthly: 63, subscription_annual: 50, ltd: 199 },
        enterprise: { subscription_monthly: 129, subscription_annual: 103, ltd: 399 },
    };

    const PRICES = { ...defaultPrices };

    // Override dynamically from database plans if populated
    if (plans && plans.length > 0) {
        plans.forEach(plan => {
            const baseSlug = plan.slug === 'business' ? 'enterprise' : plan.slug;
            
            if (baseSlug === 'starter' || baseSlug === 'growth' || baseSlug === 'enterprise') {
                if (plan.type === 'subscription') {
                    if (isPK) {
                        const monthlyPKR = plan.price_monthly_pkr ? parseFloat(plan.price_monthly_pkr) : (plan.price_monthly ? Math.round(plan.price_monthly * 280) : defaultPrices[baseSlug].subscription_monthly);
                        const annualPKR = plan.price_annual_pkr ? parseFloat(plan.price_annual_pkr) : (plan.price_annual ? Math.round(plan.price_annual * 280) : (defaultPrices[baseSlug].subscription_annual * 12));
                        PRICES[baseSlug].subscription_monthly = monthlyPKR;
                        PRICES[baseSlug].subscription_annual = Math.round(annualPKR / 12);
                    } else {
                        PRICES[baseSlug].subscription_monthly = parseFloat(plan.price_monthly) || defaultPrices[baseSlug].subscription_monthly;
                        PRICES[baseSlug].subscription_annual = plan.price_annual ? Math.round(parseFloat(plan.price_annual) / 12) : defaultPrices[baseSlug].subscription_annual;
                    }
                }
            } else if (plan.slug === 'ltd_1' || plan.slug === 'ltd_2' || plan.slug === 'ltd_3') {
                const targetSlug = plan.slug === 'ltd_1' ? 'starter' : plan.slug === 'ltd_2' ? 'growth' : 'enterprise';
                if (isPK) {
                    PRICES[targetSlug].ltd = plan.price_lifetime_pkr ? parseFloat(plan.price_lifetime_pkr) : (plan.price_lifetime ? Math.round(plan.price_lifetime * 280) : defaultPrices[targetSlug].ltd);
                } else {
                    PRICES[targetSlug].ltd = parseFloat(plan.price_lifetime) || defaultPrices[targetSlug].ltd;
                }
            }
        });
    }

    const fmt = (n, suffix = '') => isPK ? `Rs ${n.toLocaleString()}${suffix}` : `$${n}${suffix}`;
    const planPrice = (key) => PRICES[key]?.[billingType] ?? 0;
    const planPriceStr = (key) => fmt(planPrice(key), isLTD ? '' : '/mo');

    // AI options per plan
    const AI_OPTIONS = {
        starter: [
            { key: 'core', emoji: '🌱', name: 'AI Core', tagline: 'Essentials — query answering & invoice reading', priceUSD: 3, pricePKR: 840, queries: 110, scans: 90 },
            { key: 'lite', emoji: '⚡', name: 'AI Lite', tagline: 'Active scanning & automation triggers', priceUSD: 5, pricePKR: 1400, queries: 200, scans: 150 },
        ],
        growth: [
            { key: 'lite', emoji: '⚡', name: 'AI Lite', tagline: 'Active scanning & automation triggers', priceUSD: 5, pricePKR: 1400, queries: 200, scans: 150 },
            { key: 'pro', emoji: '🚀', name: 'AI Pro', tagline: 'High-volume stores, churn predictions & forecasting', priceUSD: 15, pricePKR: 4200, queries: 420, scans: 480 },
        ],
        enterprise: [
            { key: 'pro', emoji: '🚀', name: 'AI Pro', tagline: 'High-volume stores, churn predictions & forecasting', priceUSD: 15, pricePKR: 4200, queries: 420, scans: 480 },
            { key: 'ultimate', emoji: '👑', name: 'AI Ultimate', tagline: 'Maximum throughput — full catalog intelligence', priceUSD: 25, pricePKR: 7000, queries: 800, scans: 850 },
        ],
    };

    const aiOptions = selectedPlan ? AI_OPTIONS[selectedPlan] : [];
    const selectedAIData = aiOptions.find(o => `opt_${o.key}` === selectedAI) ?? null;

    const aiCostNum = selectedAI === 'byok' ? (isPK ? 1400 : 5)
        : selectedAIData ? (isPK ? selectedAIData.pricePKR : selectedAIData.priceUSD) : 0;
    const aiIsMonthly = selectedAI !== 'none' && selectedAI !== 'byok';

    const syncCostNum = selectedSyncs.length * (isPK ? 2800 : 10);

    // ── Per-product service tiers ──
    const SERVICE_TIERS = {
        basic:        { key: 'basic',        name: 'Basic Upload',        emoji: '📦', priceUSD: 1.00, pricePKR: 100,  variantExtraUSD: 0.50, variantExtraPKR: 50,  sla: '2–3 business days', desc: 'Product data uploaded with all core fields. Up to 5 variants per product included.' },
        descriptions: { key: 'descriptions', name: '+ Rich Descriptions', emoji: '✍️', priceUSD: 1.50, pricePKR: 150,  variantExtraUSD: 0.50, variantExtraPKR: 50,  sla: '3–5 business days', desc: 'Everything in Basic + long descriptions, SEO copy, and full product detail. You provide images.' },
        images:       { key: 'images',       name: '+ AI Images',         emoji: '🎨', priceUSD: 2.00, pricePKR: 200,  variantExtraUSD: 0.50, variantExtraPKR: 50,  sla: '4–6 business days', desc: 'Everything in Descriptions + we source or AI-generate product images for you.' },
    };

    // Calculator logic
    const calcProductsNum  = Math.max(0, parseInt(calcProducts)  || 0);
    const calcVariantsNum  = Math.max(1, parseInt(calcVariants)  || 1);
    const selectedTier     = selectedService ? SERVICE_TIERS[selectedService] : null;
    const extraBlocks      = calcVariantsNum > 5 ? Math.ceil((calcVariantsNum - 5) / 5) : 0;
    const pricePerProduct  = selectedTier
        ? (isPK ? selectedTier.pricePKR : selectedTier.priceUSD) + extraBlocks * (isPK ? selectedTier.variantExtraPKR : selectedTier.variantExtraUSD)
        : 0;
    const serviceCostNum   = calcProductsNum * pricePerProduct;

    // Alias for downstream compatibility
    const selectedServiceData = selectedTier ? {
        name:     selectedTier.name,
        subtitle: `${calcProductsNum} product${calcProductsNum !== 1 ? 's' : ''}`,
        sla:      selectedTier.sla,
        cost:     serviceCostNum,
    } : null;

    const totalMonthlyCost = selectedPlan ? planPrice(selectedPlan) + (aiIsMonthly ? aiCostNum : 0) + syncCostNum : 0;
    const totalDueToday = selectedAI === 'byok' ? (isPK ? 1400 : 5) : 0;
    const isCardRequired = selectedAI !== 'none' || selectedSyncs.length > 0 || !!selectedService || trialMode === 'deferred';

    const getActivePlanSlug = (key) => {
        if (isLTD) {
            if (key === 'starter') return 'ltd_1';
            if (key === 'growth') return 'ltd_2';
            return 'ltd_3';
        }
        if (key === 'enterprise') return 'business';
        return key;
    };

    const getPlanLimit = (key, limitKey) => {
        const activeSlug = getActivePlanSlug(key);
        const plan = plans?.find(p => p.slug === activeSlug);
        if (!plan || !plan.limits) return null;
        
        const limitVal = plan.limits[limitKey];
        if (limitVal === null || limitVal === undefined) return null;
        if (limitVal === '0') return false;
        if (limitVal === '1') return true;
        if (!isNaN(limitVal)) return parseInt(limitVal);
        return limitVal;
    };

    const getPlanIncludes = (key) => {
        const locations = getPlanLimit(key, 'locations');
        const staff = getPlanLimit(key, 'staff_limit');
        const sku = getPlanLimit(key, 'sku_limit');
        
        const locStr = locations === null ? 'Unlimited Store Locations' : `${locations} Store Location${locations > 1 ? 's' : ''}`;
        const staffStr = staff === null ? 'Unlimited Staff Accounts' : `${staff} Staff Account${staff > 1 ? 's' : ''}`;
        const skuStr = sku === null ? 'Unlimited Product SKUs' : `${sku.toLocaleString()} Product SKUs`;
        
        if (key === 'starter') {
            return [
                locStr,
                staffStr,
                skuStr,
                'Full POS Checkout',
                'Double-Entry Khata',
                'WebUSB Thermal Printing',
                'Vena AI Support Chat',
                'Email Support'
            ];
        }
        
        if (key === 'growth') {
            const starterLoc = getPlanLimit('starter', 'locations') ?? 1;
            const starterStaff = getPlanLimit('starter', 'staff_limit') ?? 3;
            const starterSku = getPlanLimit('starter', 'sku_limit') ?? 1000;
            
            const locCompare = locations === null ? `Unlimited Store Locations` : `${locations} Store Locations (up from ${starterLoc})`;
            const staffCompare = staff === null ? `Unlimited Staff Accounts` : `${staff} Staff Accounts (up from ${starterStaff})`;
            const skuCompare = sku === null ? `Unlimited Product SKUs` : `${sku.toLocaleString()} Product SKUs (up from ${starterSku.toLocaleString()})`;
            
            return [
                locCompare,
                staffCompare,
                skuCompare,
                '3-Store Multi-Branch Sync',
                'Batch & Expiry Tracking',
                'Bill of Materials',
                'WhatsApp Debt Alerts',
                'Live Agent Chat Support'
            ];
        }
        
        // enterprise / business
        const growthLoc = getPlanLimit('growth', 'locations') ?? 3;
        const growthStaff = getPlanLimit('growth', 'staff_limit') ?? 10;
        const growthSku = getPlanLimit('growth', 'sku_limit') ?? 10000;
        
        const locCompare = locations === null ? `Unlimited Store Locations (up from ${growthLoc})` : `${locations} Store Locations (up from ${growthLoc})`;
        const staffCompare = staff === null ? `Unlimited Staff Accounts (up from ${growthStaff})` : `${staff} Staff Accounts (up from ${growthStaff})`;
        const skuCompare = sku === null ? `Unlimited Product SKUs (up from ${growthSku.toLocaleString()})` : `${sku.toLocaleString()} Product SKUs (up from ${growthSku.toLocaleString()})`;
        
        return [
            locCompare,
            staffCompare,
            skuCompare,
            'Serial / IMEI Lifecycle Tracking',
            'Auto-Assembly Production Runs',
            'Loyalty & Gift Cards',
            '24/7 Priority SLA',
            'Dedicated Account Manager'
        ];
    };

    const getPlanExcludes = (key) => {
        if (key === 'starter') {
            return ['Multi-branch syncing', 'Batch & Expiry tracking', 'Bill of Materials'];
        }
        if (key === 'growth') {
            return ['Serial / IMEI tracking', 'Auto-assembly production runs'];
        }
        return [];
    };

    const PLAN_DATA = {
        starter: {
            name: 'Starter Engine',
            tagline: 'Single-location stores getting serious about POS & inventory.',
            icon: Zap,
            color: 'blue',
            accentFrom: 'from-blue-500/[0.08]',
            accentBorder: 'border-blue-500/30',
            accentGlow: 'shadow-blue-900/20',
            iconBg: 'bg-blue-500/10 text-blue-400',
            badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
            inheritLabel: null,
            includes: getPlanIncludes('starter'),
            excludes: getPlanExcludes('starter'),
        },
        growth: {
            name: 'Growth Engine',
            tagline: 'Expanding outlets that need multi-location stock routing.',
            icon: TrendingUp,
            color: 'indigo',
            accentFrom: 'from-teal-500/[0.10]',
            accentBorder: 'border-teal-500/40',
            accentGlow: 'shadow-teal-900/30',
            iconBg: 'bg-teal-500/10 text-teal-400',
            badgeBg: 'bg-teal-500/10 border-teal-500/20 text-teal-300',
            popular: true,
            inheritLabel: 'Everything in Starter Engine, plus:',
            includes: getPlanIncludes('growth'),
            excludes: getPlanExcludes('growth'),
        },
        enterprise: {
            name: 'Enterprise Engine',
            tagline: 'Multi-channel operators demanding full-scale operations.',
            icon: Crown,
            color: 'purple',
            accentFrom: 'from-teal-500/[0.08]',
            accentBorder: 'border-teal-500/30',
            accentGlow: 'shadow-teal-900/20',
            iconBg: 'bg-teal-500/10 text-teal-400',
            badgeBg: 'bg-teal-500/10 border-teal-500/20 text-teal-300',
            inheritLabel: 'Everything in Growth Engine, plus:',
            includes: getPlanIncludes('enterprise'),
            excludes: getPlanExcludes('enterprise'),
        },
    };

    const SYNC_CHANNELS = [
        { key: 'woocommerce', name: 'WooCommerce', icon: Globe, desc: 'Real-time bidirectional stock sync for WordPress/WooCommerce stores.', priceUSD: 10, pricePKR: 2800 },
        { key: 'amazon', name: 'Amazon Marketplace', icon: ShoppingCart, desc: 'Automate order extraction and live inventory tracking across Amazon.', priceUSD: 10, pricePKR: 2800 },
        { key: 'ebay', name: 'eBay Integration', icon: Package, desc: 'Sync inventory counts and sales invoices automatically with eBay.', priceUSD: 10, pricePKR: 2800 },
        { key: 'tiktok', name: 'TikTok Shop', icon: Star, desc: 'Connect catalog attributes and import marketplace sales from TikTok.', priceUSD: 10, pricePKR: 2800 },
    ];

    const FAQS = [
        { id: 'faq-trial', q: 'Do I need a credit card to start my trial?', a: 'No. If you select a base plan without any AI add-on, sync integration, or onboarding service, your 14-day trial starts immediately with zero card details required. A card is only needed if you add an AI plan, connect a sync channel, or select an onboarding service.' },
        { id: 'faq-ai-cost', q: 'What is the $5 one-time BYOK fee for?', a: 'Bringing Your Own API Key (BYOK) means you connect your own OpenAI or Gemini key. We charge a one-time $5 platform activation fee to unlock the AI routing layer in your account. After that, you are billed directly by your AI provider — we charge you nothing ongoing. This fee does not expire and has no hidden conditions.' },
        { id: 'faq-ai-monthly', q: 'How does managed AI billing work?', a: 'Managed AI plans (AI Core, AI Lite, AI Pro, AI Ultimate) are monthly add-ons. We handle the infrastructure, models, and usage. You pay us a flat monthly fee and we take care of the rest. There is no usage surprise billing — your monthly cap is shown clearly on your plan.' },
        { id: 'faq-charge', q: 'When will my card actually be charged?', a: 'Your subscription is only charged after your 14-day free trial ends — not on the day you sign up. The only immediate charge possible is the $5 BYOK activation fee (if you select that option). Onboarding services are charged from inside your admin panel when you choose to initiate the service — not at checkout.' },
        { id: 'faq-service', q: 'How do onboarding services work with the trial?', a: 'You have two options. You can start your trial immediately and request the setup service later from your admin panel (we begin within 48 hours of your request). Or you can choose "Pause Trial" — your trial clock is held while our team completes your setup, and you get your full 14 days on a store that\'s already ready.' },
        { id: 'faq-cancel', q: 'Can I cancel during the trial?', a: 'Yes, at any time. No questions asked. If you cancel before day 14, you owe nothing for your subscription. If you selected a BYOK activation, that $5 one-time fee is non-refundable (it activated your AI routing). If you added an onboarding service and we have already begun work, the service fee applies per our terms.' },
        { id: 'faq-upgrade', q: 'Can I change my plan later?', a: 'Yes. You can upgrade or downgrade your plan at any time from your admin dashboard. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.' },
    ];

    const handlePlanSelect = (planKey) => {
        setSelectedPlan(planKey);
    };

    // Map pricing-card keys to backend subscription slugs.
    const PLAN_SLUG_MAP = { starter: 'starter', growth: 'growth', enterprise: 'business' };

    // Selecting a plan starts the trial. Logged-in users jump straight to
    // creating a store on the chosen plan. Guests simply sign up first — we do
    // NOT force a plan through account creation; the plan is chosen later at the
    // Hub when they actually create a store.
    const goToTrial = (planKey) => {
        if (auth?.user) {
            const slug = PLAN_SLUG_MAP[planKey] || 'growth';
            const interval = billingType === 'subscription_annual' ? 'annual' : 'monthly';
            router.visit(route('store.create', { plan: slug, interval }));
        } else {
            router.visit(route('register'));
        }
    };

    const handleContinue = () => {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setCurrentStep(5);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1800);
    };

    // ── Step 1: Pricing Page ───────────────────────────────────────────────
    const renderPricingPage = () => (
        <div className="space-y-0">

            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="relative pt-28 sm:pt-36 pb-16 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <SectionLabel icon={Sparkles}>14-Day Free Trial — No Card Required</SectionLabel>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.08}>
                        <h1 className="text-[2.75rem] xs:text-5xl md:text-[68px] font-black tracking-tighter leading-[0.9] sm:leading-[0.88] mb-5 font-display">
                            <span className="bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                                Pick your plan.
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-teal-400 via-teal-400 to-teal-300 bg-clip-text text-transparent vq-text-glow">
                                Power it with AI.
                            </span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.15}>
                        <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                            Select a plan below. We'll then show you exactly which AI tier fits it best — so you're never comparing plans, just picking your power level.
                        </p>
                    </RevealOnScroll>

                    {/* Billing toggle only — currency auto-detected from location */}
                    <RevealOnScroll delay={0.2}>
                        <div className="flex items-center justify-center mt-8">
                            <BillingToggle value={billingType} onChange={setBillingType} />
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── Plan Cards ───────────────────────────────────────── */}
            <section className="px-6 pb-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {Object.entries(PLAN_DATA).map(([key, plan], idx) => {
                            const PlanIcon = plan.icon;
                            const isSelected = selectedPlan === key;
                            const price = planPrice(key);

                            return (
                                <RevealOnScroll key={key} delay={idx * 0.06}>
                                    <div
                                        id={`plan-${key}`}
                                        onClick={() => handlePlanSelect(key)}
                                        className={`relative rounded-[2rem] border cursor-pointer overflow-hidden transition-all duration-500 flex flex-col
                                            ${isSelected
                                                ? `bg-gradient-to-b ${plan.accentFrom} to-transparent ${plan.accentBorder} shadow-2xl ${plan.accentGlow} scale-[1.015]`
                                                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.035] hover:border-white/10 hover:scale-[1.005]'
                                            }`}
                                    >
                                        {/* Popular badge */}
                                        {plan.popular && (
                                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500" />
                                        )}
                                        {plan.popular && (
                                            <div className="absolute top-3 right-4">
                                                <span className="px-2.5 py-1 rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-300 text-[9px] font-black tracking-widest uppercase">
                                                    Most Popular
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-7">
                                            {/* Icon + name */}
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.iconBg}`}>
                                                    <PlanIcon size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-black text-base tracking-tight">{plan.name}</div>
                                                    {isSelected && (
                                                        <span className={`text-[9px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded-full ${plan.badgeBg} border`}>
                                                            Selected ✓
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="mb-5">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-black text-white tracking-tight font-display">
                                                        {fmt(price)}
                                                    </span>
                                                    {!isLTD && <span className="text-slate-500 text-sm font-semibold">/mo</span>}
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                                                    {isLTD ? '2-year hosting included, one payment' : billingType === 'subscription_annual' ? 'billed annually' : 'billed monthly'}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 leading-relaxed mb-5">{plan.tagline}</p>

                                            {/* Inherit banner for Growth & Enterprise */}
                                            {plan.inheritLabel && (
                                                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${isSelected ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} border border-white/[0.05]`}>
                                                    <Layers size={11} className="text-teal-400 flex-shrink-0" />
                                                    <span className="text-[10px] font-black text-teal-300 uppercase tracking-wider">{plan.inheritLabel}</span>
                                                </div>
                                            )}

                                            {/* Features — always fully visible */}
                                            <div className="space-y-2">
                                                {plan.includes.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-2.5">
                                                        <Check size={12} className="text-emerald-400 flex-shrink-0" />
                                                        <span className="text-xs text-slate-300">{f}</span>
                                                    </div>
                                                ))}
                                                {plan.excludes.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-2.5">
                                                        <X size={12} className="text-slate-500 flex-shrink-0" />
                                                        <span className="text-xs text-slate-500">{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Selection indicator at bottom */}
                                        <div className="px-7 pb-6 pt-3 space-y-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePlanSelect(key);
                                                    // Allow state update to register before continuing
                                                    setTimeout(() => handleContinue(), 50);
                                                }}
                                                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 duration-200 ${
                                                    isSelected
                                                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/20'
                                                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.05]'
                                                }`}
                                            >
                                                {isSelected ? 'Selected ✓' : 'Choose Plan'}
                                            </button>
                                            <div className={`h-[2px] rounded-full transition-all duration-500 ${isSelected ? 'bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 opacity-100' : 'bg-white/[0.04] opacity-30'}`} />
                                        </div>
                                    </div>
                                </RevealOnScroll>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── AI Configuration Panel — always visible, updates when plan changes ── */}
            {false && (
            <section ref={aiSectionRef} className="px-6 py-6">
                <div className="max-w-5xl mx-auto">
                    <div className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-100 translate-y-0">

                        {selectedPlan && (
                            <div className="rounded-[2rem] border border-white/[0.07] bg-gradient-to-b from-[#0b081e] to-[#060214] overflow-hidden relative">

                                {/* Top gradient line */}
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

                                <div className="p-8 md:p-10">

                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                                                    <Cpu size={12} />
                                                </span>
                                                <span className="text-[10px] font-black tracking-widest text-teal-400 uppercase">
                                                    AI Engine — {PLAN_DATA[selectedPlan]?.name}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl font-black text-white tracking-tight font-display">
                                                Which AI level do you want?
                                            </h2>
                                            <p className="text-sm text-slate-500 mt-1 max-w-lg">
                                                These two options are matched to your selected plan. Pick the one that fits your volume — or bring your own key for free AI.
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase ${PLAN_DATA[selectedPlan]?.badgeBg} border`}>
                                                {PLAN_DATA[selectedPlan]?.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Two AI Option Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {aiOptions.map((opt, idx) => {
                                            const optKey = `opt_${opt.key}`;
                                            const isChosen = selectedAI === optKey;
                                            const price = isPK ? opt.pricePKR : opt.priceUSD;
                                            return (
                                                <button
                                                    key={opt.key}
                                                    id={`ai-option-${opt.key}`}
                                                    onClick={() => setSelectedAI(isChosen ? 'none' : optKey)}
                                                    className={`relative text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col gap-3
                                                        ${isChosen
                                                            ? 'bg-teal-600/10 border-teal-500/60 shadow-[0_0_30px_rgba(168,85,247,0.12)]'
                                                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]'
                                                        }`}
                                                >
                                                    {/* Header row: emoji+name on left, radio on right — no absolute overlap */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-white font-black text-base">{opt.name}</span>
                                                                    {idx === 1 && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[8px] font-black tracking-wider whitespace-nowrap">MORE POWER</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-slate-500 text-xs mt-0.5">{opt.tagline}</div>
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${isChosen ? 'border-teal-400 bg-teal-400' : 'border-slate-600'}`}>
                                                            {isChosen && <Check size={10} className="text-white" strokeWidth={3} />}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <div className="flex gap-2 flex-wrap">
                                                            <span className="text-[10px] text-teal-400 bg-teal-500/[0.08] border border-teal-500/10 px-2 py-1 rounded-lg font-mono">
                                                                {opt.queries} Queries/mo
                                                            </span>
                                                            <span className="text-[10px] text-teal-400 bg-teal-500/[0.08] border border-teal-500/10 px-2 py-1 rounded-lg font-mono">
                                                                {opt.scans} Scans/mo
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-white font-black text-xl">
                                                                +{fmt(price)}
                                                            </span>
                                                            <span className="text-slate-500 text-xs">/mo</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* BYOK + No AI row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                        {/* BYOK */}
                                        <button
                                            id="ai-byok"
                                            onClick={() => setSelectedAI(selectedAI === 'byok' ? 'none' : 'byok')}
                                            className={`text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3
                                                ${selectedAI === 'byok'
                                                    ? 'bg-amber-500/8 border-amber-500/40'
                                                    : 'bg-white/[0.02] border-white/[0.05] hover:border-white/8'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                    <Key size={14} className="text-amber-400" />
                                                </div>
                                                <div>
                                                    <div className="text-white text-xs font-bold">Bring Your Own API Key (BYOK)</div>
                                                    <div className="text-slate-500 text-[10px] mt-0.5">Use your own OpenAI or Gemini key — free forever after</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <span className="text-amber-300 font-black text-sm whitespace-nowrap">
                                                    {isPK ? 'Rs 1,400' : '$5'} once
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">one-time unlock</span>
                                            </div>
                                        </button>

                                        {/* No AI */}
                                        <button
                                            id="ai-none"
                                            onClick={() => setSelectedAI('none')}
                                            className={`text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3
                                                ${selectedAI === 'none'
                                                    ? 'bg-slate-800/50 border-slate-600/40'
                                                    : 'bg-white/[0.02] border-white/[0.05] hover:border-white/8'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                                    <Ban size={14} className="text-slate-500" />
                                                </div>
                                                <div>
                                                    <div className="text-white text-xs font-bold">Skip AI for now</div>
                                                    <div className="text-slate-500 text-[10px] mt-0.5">Base retail system — you can add AI later from your dashboard</div>
                                                </div>
                                            </div>
                                            <span className="text-emerald-400 font-black text-xs whitespace-nowrap">No card needed</span>
                                        </button>
                                    </div>

                                    {/* BYOK clarification line */}
                                    <div className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/[0.08] flex items-start gap-2.5 mb-6">
                                        <Key size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-slate-400 leading-relaxed">
                                            <span className="text-amber-300 font-semibold">Have your own OpenAI or Gemini API key?</span>{' '}
                                            Select BYOK and pay a one-time {isPK ? 'Rs 1,400' : '$5'} platform unlock fee. After that, you use AI on VenQore for free — forever. Your API provider bills you directly based on your usage only.
                                        </p>
                                    </div>

                                    {/* Card requirement notice or No-AI Warning Nudge */}
                                    {selectedAI === 'none' ? (
                                        <div className="flex items-start gap-4 p-5 rounded-2xl border border-teal-500/20 bg-teal-500/[0.04] transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
                                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                                                <Sparkles size={16} className="text-teal-400 animate-pulse" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-teal-300 tracking-wide uppercase flex items-center gap-1.5">
                                                    Unlock the full experience
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                                    You haven't added any AI add-ons. Without an AI plan, <span className="text-slate-200 font-semibold">you won't be able to experience any of the AI-powered features</span> like smart catalog intelligence and automated scanning. In order to enjoy complete features, we highly recommend adding one of the premium AI options above — <span className="text-teal-300 font-bold">you don't have to pay anything today!</span> Just add your card to unlock all capabilities, and you can cancel anytime.
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${isCardRequired && selectedPlan
                                            ? 'bg-amber-500/[0.05] border-amber-500/20'
                                            : 'bg-emerald-500/[0.05] border-emerald-500/15'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCardRequired && selectedPlan ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                                                {isCardRequired && selectedPlan
                                                    ? <CreditCard size={14} className="text-amber-400" />
                                                    : <CheckCircle2 size={14} className="text-emerald-400" />}
                                            </div>
                                            <div>
                                                <div className={`text-xs font-bold ${isCardRequired && selectedPlan ? 'text-amber-300' : 'text-emerald-300'}`}>
                                                    {isCardRequired && selectedPlan ? 'A credit card will be required at checkout' : 'No credit card required'}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                    {isCardRequired && selectedPlan
                                                        ? 'An AI add-on is selected. Your card is authorized now but charged only after your 14-day trial ends.'
                                                        : 'No AI selected. Your full 14-day trial starts immediately — no payment details needed.'}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Continue CTA — visible right here after AI selection ── */}
                                    <div className="mt-6 flex flex-col gap-4 pt-6 border-t border-white/[0.06]">
                                        {/* Summary pill */}
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                                <Check size={11} className="text-teal-400" />
                                                <span className="text-[11px] text-slate-300 font-semibold">{PLAN_DATA[selectedPlan]?.name}</span>
                                            </div>
                                            {selectedAIData && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/[0.08] border border-teal-500/[0.15]">
                                                    <span className="text-sm">{selectedAIData.emoji}</span>
                                                    <span className="text-[11px] text-teal-300 font-semibold">{selectedAIData.name}</span>
                                                </div>
                                            )}
                                            {selectedAI === 'byok' && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/[0.08] border border-amber-500/[0.15]">
                                                    <Key size={11} className="text-amber-400" />
                                                    <span className="text-[11px] text-amber-300 font-semibold">BYOK</span>
                                                </div>
                                            )}
                                            {selectedAI === 'none' && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                                    <Ban size={11} className="text-slate-500" />
                                                    <span className="text-[11px] text-slate-500 font-semibold">No AI</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA — full width on mobile */}
                                        <button
                                            id="ai-panel-continue"
                                            onClick={handleContinue}
                                            className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-[#020010] text-sm font-black uppercase tracking-widest hover:shadow-[0_0_50px_-5px_rgba(255,255,255,0.25)] shadow-lg transition-all duration-300"
                                        >
                                            Continue <ArrowRight size={14} />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </section>
            )}

            {/* ── Comparison Table ─────────────────────────────────── */}
            <section className="px-6 py-16">
                <div className="max-w-5xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-10">
                            <SectionLabel icon={BarChart3}>Deep Dive Comparison</SectionLabel>
                            <h2 className="text-3xl font-black text-white tracking-tight font-display">Everything, side by side.</h2>
                            <p className="text-slate-500 text-sm mt-2">No asterisks. No fine print. Just exactly what each plan includes.</p>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={0.1}>
                        <div className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.01] overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-white/[0.07]">
                                        <th className="py-5 pl-6 pr-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Feature</th>
                                        <th className="py-5 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Zap size={14} className="text-blue-400" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide">Starter</span>
                                                <span className="text-[10px] text-blue-400 font-bold">{planPriceStr('starter')}</span>
                                            </div>
                                        </th>
                                        <th className="py-5 px-4 text-center bg-teal-950/20">
                                            <div className="flex flex-col items-center gap-1">
                                                <TrendingUp size={14} className="text-teal-400" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide">Growth</span>
                                                <span className="text-[10px] text-teal-400 font-bold">{planPriceStr('growth')}</span>
                                            </div>
                                        </th>
                                        <th className="py-5 pr-6 pl-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Crown size={14} className="text-teal-400" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide">Enterprise</span>
                                                <span className="text-[10px] text-teal-400 font-bold">{planPriceStr('enterprise')}</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Limits */}
                                    <tr className="bg-white/[0.02]"><td colSpan={4} className="py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Platform Limits</td></tr>
                                    <TableRow label="Store Locations" starter="1" growth="3" enterprise="10" />
                                    <TableRow label="Staff Accounts" starter="3" growth="10" enterprise="50" />
                                    <TableRow label="Product SKUs" starter="1,000" growth="10,000" enterprise="50,000" />
                                    <TableRow label="Multi-Branch Sync" starter={false} growth={true} enterprise={true} />
                                    <TableRow label="14-Day Free Trial" starter={true} growth={true} enterprise={true} highlight />

                                    {/* POS */}
                                    <tr className="bg-white/[0.02]"><td colSpan={4} className="py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">POS & Checkout</td></tr>
                                    {false && <TableRow label="Barcode Scanner" starter={true} growth={true} enterprise={true} />}
                                    <TableRow label="WebUSB Thermal Printing" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="Multi-Tab Checkout" starter="3 tabs" growth="10 tabs" enterprise="50 tabs" />
                                    <TableRow label="Park & Recall (Hold Bill)" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="Split Payments" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="Serial / IMEI Tracking" starter={false} growth={false} enterprise={true} highlight />

                                    {/* Inventory */}
                                    <tr className="bg-white/[0.02]"><td colSpan={4} className="py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Inventory</td></tr>
                                    <TableRow label="Product Variants & FIFO" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="Batch & Expiry Tracking" starter={false} growth={true} enterprise={true} />
                                    <TableRow label="Bill of Materials (Recipes)" starter={false} growth={true} enterprise={true} />
                                    <TableRow label="Auto-Assembly Production" starter={false} growth={false} enterprise={true} highlight />

                                    {/* Finance */}
                                    <tr className="bg-white/[0.02]"><td colSpan={4} className="py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Finance & Accounting</td></tr>
                                    <TableRow label="Double-Entry Ledger" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="Customer Khata (Credit)" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="WhatsApp Debt Alerts" starter={false} growth={true} enterprise={true} />
                                    <TableRow label="Bank Reconciliation" starter={false} growth={true} enterprise={true} />
                                    <TableRow label="Loyalty & Gift Cards" starter={false} growth={false} enterprise={true} highlight />

                                    {/* Reports */}
                                    <tr className="bg-white/[0.02]"><td colSpan={4} className="py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Reports</td></tr>
                                    <TableRow label="Sales & Purchase Reports" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="Profit & Loss Statement" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="Balance Sheet" starter={false} growth={true} enterprise={true} />
                                    <TableRow label="Cash Flow Statement" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="40-Report Full Suite" starter={false} growth={false} enterprise={true} highlight />

                                    {/* Support */}
                                    <tr className="bg-white/[0.02]"><td colSpan={4} className="py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Support</td></tr>
                                    <TableRow label="AI Support Chatbot (Vena)" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="Live Agent Support (Handoff)" starter={false} growth={true} enterprise={true} />
                                    <TableRow label="Email Support" starter={true} growth={true} enterprise={true} />
                                    <TableRow label="24/7 Priority SLA" starter={false} growth={false} enterprise={true} highlight />
                                    <TableRow label="Dedicated Account Manager" starter={false} growth={false} enterprise={true} />
                                </tbody>
                            </table>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── FAQs ─────────────────────────────────────────────── */}
            <section className="px-6 py-12">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-10">
                            <SectionLabel icon={MessageSquare}>Common Questions</SectionLabel>
                            <h2 className="text-3xl font-black text-white tracking-tight font-display">Straight answers.</h2>
                        </div>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.1}>
                        <div className="divide-y-0">
                            {FAQS.map((f) => (
                                <FaqItem key={f.id} id={f.id} question={f.q} answer={f.a} />
                            ))}
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── Sticky CTA ───────────────────────────────────────── */}
            <section className="px-6 py-10 pb-20">
                <div className="max-w-lg mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-6">
                            {selectedPlan ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400 mb-4">
                                    <Check size={14} className="text-emerald-400" />
                                    <span>{PLAN_DATA[selectedPlan]?.name} selected{selectedAIData ? ` + ${selectedAIData.name}` : selectedAI === 'byok' ? ' + BYOK' : ''}</span>
                                </div>
                            ) : (
                                <div className="text-slate-500 text-sm mb-4">Select a plan above to continue</div>
                            )}
                        </div>
                        <MagneticButton
                            id="pricing-continue-btn"
                            onClick={selectedPlan ? handleContinue : undefined}
                            variant={selectedPlan ? 'indigo' : 'ghost'}
                            className={`w-full py-5 justify-center text-sm ${!selectedPlan ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            {selectedPlan ? (
                                <>Secure My Plan <ArrowRight size={16} /></>
                            ) : (
                                <>Select a plan to continue <ArrowRight size={16} /></>
                            )}
                        </MagneticButton>
                        <p className="text-center text-[11px] text-slate-500 mt-3">
                            {isCardRequired && selectedPlan
                                ? 'Card authorized today. Charged only after 14-day trial ends.'
                                : '14-day free trial. No card. No commitment.'}
                        </p>
                    </RevealOnScroll>
                </div>
            </section>
        </div>
    );

    // ── Step 2: Platform Sync ──────────────────────────────────────────────
    const renderSyncStep = () => (
        <section className="min-h-screen px-6 py-24">
            <div className="max-w-3xl mx-auto space-y-8">
                <RevealOnScroll>
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/15 text-teal-400 text-[10px] font-black tracking-widest uppercase mb-4">
                            Step 2 of 3
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tight font-display mb-3">
                            Do you sell online?
                        </h2>
                        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                            Connect your existing platforms and everything syncs in one place — stock, orders, and customers. You can also do this anytime from your dashboard.
                        </p>
                        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span className="text-[11px] text-emerald-400 font-semibold">No card needed to connect — just to subscribe later</span>
                        </div>
                    </div>
                </RevealOnScroll>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SYNC_CHANNELS.map((ch, idx) => {
                        const SyncIcon = ch.icon;
                        const isAdded = selectedSyncs.includes(ch.key);
                        return (
                            <RevealOnScroll key={ch.key} delay={idx * 0.05}>
                                <button
                                    id={`sync-${ch.key}`}
                                    onClick={() => setSelectedSyncs(isAdded
                                        ? selectedSyncs.filter(s => s !== ch.key)
                                        : [...selectedSyncs, ch.key])}
                                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300
                                        ${isAdded
                                            ? 'bg-teal-600/8 border-teal-500/40 shadow-md shadow-teal-950/10'
                                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isAdded ? 'bg-teal-500/15' : 'bg-white/[0.04]'}`}>
                                                <SyncIcon size={16} className={isAdded ? 'text-teal-400' : 'text-slate-500'} />
                                            </div>
                                            <div>
                                                <div className="text-white text-sm font-bold">{ch.name}</div>
                                                <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">{ch.desc}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isAdded ? 'border-teal-400 bg-teal-500' : 'border-slate-700'}`}>
                                                {isAdded && <Check size={9} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <span className="text-xs text-white font-bold whitespace-nowrap">
                                                +{fmt(isPK ? ch.pricePKR : ch.priceUSD)}/mo
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            </RevealOnScroll>
                        );
                    })}
                </div>

                {selectedSyncs.length > 0 && (
                    <div className="p-4 rounded-xl bg-teal-500/[0.06] border border-teal-500/15 flex items-center gap-3">
                        <Globe size={14} className="text-teal-400 flex-shrink-0" />
                        <p className="text-xs text-slate-400">
                            The moment a barcode transaction completes inside your POS, stock updates across all connected platforms in under 3 seconds. No overselling. Ever.
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                    <button
                        onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.06] text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={13} /> Back
                    </button>
                    <MagneticButton
                        id="sync-continue"
                        onClick={() => { setCurrentStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        variant="indigo"
                        className="px-8 py-3.5 text-xs font-black uppercase tracking-widest"
                    >
                        {selectedSyncs.length > 0 ? `Continue with ${selectedSyncs.length} channel${selectedSyncs.length > 1 ? 's' : ''}` : 'Skip for now'} <ArrowRight size={13} />
                    </MagneticButton>
                </div>
            </div>
        </section>
    );

    // ── Step 3: Onboarding Services — per-product calculator ─────────────────
    const renderOnboardingStep = () => {
        const fmtCost = (n) => isPK ? `Rs ${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`;
        const hasEstimate = selectedTier && calcProductsNum > 0;

        return (
        <section className="min-h-screen px-6 py-24">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/15 text-teal-400 text-[10px] font-black tracking-widest uppercase mb-4">
                        Step 3 of 3
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight font-display mb-3">
                        Want us to load your products?
                    </h2>
                    <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                        We'll upload your catalog for you — fully configured and ready to sell from day one. Pay only for what you need, per product. No fixed packages.
                    </p>
                </div>

                {/* Tier selector */}
                <div className="space-y-3">
                    {Object.values(SERVICE_TIERS).map((tier, idx) => {
                        const isChosen = selectedService === tier.key;
                        const tierPrice = isPK ? tier.pricePKR : tier.priceUSD;
                        return (
                            <button
                                key={tier.key}
                                id={`service-tier-${tier.key}`}
                                onClick={() => setSelectedService(isChosen ? null : tier.key)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300
                                    ${isChosen
                                        ? 'bg-teal-600/[0.08] border-teal-500/40'
                                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${isChosen ? 'border-teal-400 bg-teal-500' : 'border-slate-700'}`}>
                                            {isChosen && <Check size={9} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-lg">{tier.emoji}</span>
                                                <span className="text-white font-bold text-sm">{tier.name}</span>
                                                {idx === 1 && <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[8px] font-black tracking-widest uppercase">Most Popular</span>}
                                            </div>
                                            <p className="text-slate-500 text-xs mt-1 leading-relaxed">{tier.desc}</p>
                                            <p className="text-slate-500 text-[10px] mt-1.5 font-semibold">⏱ Turnaround: {tier.sla}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-white font-black text-lg">{isPK ? `Rs ${tierPrice}` : `$${tierPrice.toFixed(2)}`}</div>
                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">per product</div>
                                        <div className="text-[9px] text-teal-400 font-semibold mt-0.5">+{isPK ? 'Rs 50' : '$0.50'} / extra 5 variants</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Variant explanation */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Layers size={11} className="text-teal-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        <span className="text-white font-semibold">Variant pricing:</span> The first 5 variants per product are included in the base price.
                        Every additional 5 variants cost {isPK ? 'Rs 50' : '+$0.50'} more.
                        Example: a product with 20 variants = base price + 3 extra blocks ({isPK ? 'Rs 150' : '$1.50'} more).
                    </p>
                </div>

                {/* ── Interactive Calculator ── */}
                {selectedTier && (
                    <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-b from-teal-950/30 to-transparent overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2">
                            <BarChart3 size={14} className="text-teal-400" />
                            <span className="text-xs font-black text-white uppercase tracking-widest">Cost Estimator</span>
                            <span className="text-[10px] text-slate-500 ml-1">— see your price before committing</span>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                                        How many products?
                                    </label>
                                    <input
                                        id="calc-products"
                                        type="number" min="1" placeholder="e.g. 50"
                                        value={calcProducts}
                                        onChange={e => setCalcProducts(e.target.value)}
                                        className="w-full bg-black/30 border border-white/[0.07] focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                                        Average variants per product?
                                    </label>
                                    <input
                                        id="calc-variants"
                                        type="number" min="1" placeholder="e.g. 3 (default: 1)"
                                        value={calcVariants}
                                        onChange={e => setCalcVariants(e.target.value)}
                                        className="w-full bg-black/30 border border-white/[0.07] focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1.5">Leave blank if products have no variants or ≤5</p>
                                </div>
                            </div>

                            {/* Breakdown */}
                            {hasEstimate && (
                                <div className="space-y-2 pt-4 border-t border-white/[0.05]">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">{calcProductsNum} products × {isPK ? `Rs ${selectedTier.pricePKR}` : `$${selectedTier.priceUSD.toFixed(2)}`} base</span>
                                        <span className="text-slate-300 font-semibold font-mono">{fmtCost(calcProductsNum * (isPK ? selectedTier.pricePKR : selectedTier.priceUSD))}</span>
                                    </div>
                                    {extraBlocks > 0 && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400">
                                                {calcProductsNum} products × {extraBlocks} extra variant block{extraBlocks > 1 ? 's' : ''} × {isPK ? 'Rs 50' : '$0.50'}
                                            </span>
                                            <span className="text-slate-300 font-semibold font-mono">{fmtCost(calcProductsNum * extraBlocks * (isPK ? 50 : 0.5))}</span>
                                        </div>
                                    )}
                                    {calcVariantsNum > 1 && (
                                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                                            <span>Per product: {fmtCost(pricePerProduct)} ({calcVariantsNum} variants — first 5 free{extraBlocks > 0 ? `, +${extraBlocks} block${extraBlocks > 1 ? 's' : ''}` : ''})</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-1">
                                        <span className="text-white font-black text-sm">Your estimated total</span>
                                        <span className="text-2xl font-black text-teal-300 font-display">{fmtCost(serviceCostNum)}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        This is an estimate. Final invoice is generated when you initiate the service from your admin panel — after reviewing and confirming.
                                    </p>
                                </div>
                            )}

                            {!hasEstimate && (
                                <div className="text-center py-4 text-slate-500 text-xs">
                                    Enter your product count above to see your estimated cost →
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Disclosures */}
                <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/10 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ShieldCheck size={12} className="text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-emerald-300 text-xs font-bold mb-1">Not charged at checkout</div>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Adding your card now just unlocks the service. You trigger it yourself from the admin panel — <strong className="text-slate-300">that's when the charge happens</strong>, after you've reviewed the final product count.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Rocket size={12} className="text-teal-400" />
                        </div>
                        <div>
                            <div className="text-teal-300 text-xs font-bold mb-1">Trial paused while we work</div>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Your 14-day trial is <strong className="text-slate-300">held while we load your catalog</strong>. Every one of your trial days starts on a store that's already live and stocked.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trial mode */}
                {selectedService && (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                        <h4 className="text-white text-sm font-bold">When should we start your trial?</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { key: 'instant', emoji: '⚡', label: 'Start immediately', desc: 'Trial runs now. Request catalog loading whenever you\'re ready from your dashboard.' },
                                { key: 'deferred', emoji: '⏸️', label: 'Wait until catalog is ready', desc: 'Trial clock pauses. Starts only after your products are fully loaded.' },
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    id={`trial-mode-${opt.key}`}
                                    onClick={() => setTrialMode(opt.key)}
                                    className={`text-left p-4 rounded-xl border transition-all duration-300
                                        ${trialMode === opt.key
                                            ? 'bg-teal-600/8 border-teal-500/40'
                                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/8'
                                        }`}
                                >
                                    <div className="text-base mb-1">{opt.emoji}</div>
                                    <div className="text-white text-xs font-bold mb-1">{opt.label}</div>
                                    <div className="text-slate-500 text-[10px] leading-relaxed">{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Nav */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                    <button
                        onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.06] text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={13} /> Back
                    </button>
                    <MagneticButton
                        id="onboarding-continue"
                        onClick={() => { setCurrentStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        variant="indigo"
                        className="px-8 py-3.5 text-xs font-black uppercase tracking-widest"
                    >
                        {selectedService
                            ? hasEstimate
                                ? `Continue — ${isPK ? `Rs ${Math.round(serviceCostNum).toLocaleString()}` : `$${serviceCostNum.toFixed(2)}`} estimated`
                                : `Continue with ${selectedTier.name}`
                            : 'Skip — go to checkout'} <ArrowRight size={13} />
                    </MagneticButton>
                </div>

            </div>
        </section>
        );
    };

    // ── Step 4: Checkout ────────────────────────────────────────────────────
    const renderCheckout = () => {
        const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const trialEndStr = trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        return (
            <section className="min-h-screen px-6 py-24">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black text-white tracking-tight font-display mb-2">Review & Confirm</h2>
                        <p className="text-slate-500 text-sm">Everything you've selected. Clear. In one place.</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-start">

                        {/* Left: Order Summary */}
                        <div className="flex-1 space-y-4">

                            {/* Plan */}
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Your Subscription</div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold">{selectedPlan && PLAN_DATA[selectedPlan]?.name}</div>
                                        <div className="text-slate-500 text-xs mt-0.5">14-day free trial → then auto-renews</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-slate-300 font-black text-lg">{selectedPlan && planPriceStr(selectedPlan)}</div>
                                        <div className="text-emerald-400 text-[10px] font-bold">$0.00 today</div>
                                    </div>
                                </div>
                                {selectedAIData && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
                                        <div>
                                            <div className="text-white font-bold text-sm">{selectedAIData.emoji} {selectedAIData.name}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">Managed AI — included in trial</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-300 font-bold">+{fmt(isPK ? selectedAIData.pricePKR : selectedAIData.priceUSD)}/mo</div>
                                            <div className="text-emerald-400 text-[10px] font-bold">$0.00 today</div>
                                        </div>
                                    </div>
                                )}
                                {selectedAI === 'byok' && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
                                        <div>
                                            <div className="text-white font-bold text-sm">🔑 BYOK AI Activation</div>
                                            <div className="text-slate-500 text-xs mt-0.5">One-time unlock — free AI forever after</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-amber-400 font-black">{isPK ? 'Rs 1,400' : '$5.00'}</div>
                                            <div className="text-amber-400 text-[10px] font-bold">charged today</div>
                                        </div>
                                    </div>
                                )}
                                {selectedSyncs.length > 0 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
                                        <div>
                                            <div className="text-white font-bold text-sm">{selectedSyncs.length} Platform Sync{selectedSyncs.length > 1 ? 's' : ''}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">{selectedSyncs.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-300 font-bold">+{fmt(syncCostNum)}/mo</div>
                                            <div className="text-emerald-400 text-[10px] font-bold">$0.00 today</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Services */}
                            {selectedServiceData && (
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Optional Service</div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-white font-bold">{selectedTier?.emoji} Catalog Loading — {selectedTier?.name}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">{calcProductsNum} products · charged when initiated from dashboard</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-amber-400 font-black">{isPK ? `Rs ${Math.round(serviceCostNum).toLocaleString()}` : `$${serviceCostNum.toFixed(2)}`} est.</div>
                                            <div className="text-amber-400 text-[10px] font-bold">deferred — from dashboard</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Billing Timeline */}
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Your Billing Timeline</div>
                                <div className="space-y-5 relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-white/[0.05]">
                                    <div className="relative">
                                        <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-emerald-400" />
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-white text-xs font-bold">Today</span>
                                            <span className="text-emerald-400 text-xs font-black">{fmt(totalDueToday, totalDueToday > 0 ? '' : '.00')}</span>
                                        </div>
                                        <p className="text-slate-500 text-[10px]">
                                            {totalDueToday > 0
                                                ? 'BYOK activation fee charged. Trial begins.'
                                                : 'No charge. Trial begins immediately.'}
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-teal-500" />
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-white text-xs font-bold">{trialEndStr}</span>
                                            <span className="text-teal-400 text-xs font-black">{fmt(totalMonthlyCost)}/mo</span>
                                        </div>
                                        <p className="text-slate-500 text-[10px]">
                                            First subscription charge — only if you choose to continue. Cancel anytime before this date.
                                        </p>
                                    </div>
                                    {selectedServiceData && (
                                        <div className="relative">
                                            <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-amber-400" />
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-white text-xs font-bold">When you initiate catalog loading</span>
                                                <span className="text-amber-400 text-xs font-black">{isPK ? `Rs ${Math.round(serviceCostNum).toLocaleString()}` : `$${serviceCostNum.toFixed(2)}`} est.</span>
                                            </div>
                                            <p className="text-slate-500 text-[10px]">
                                                Charged per product from your admin panel. Turnaround: {selectedTier?.sla}.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="p-5 rounded-2xl bg-teal-600/8 border border-teal-500/20 flex items-center justify-between">
                                <div>
                                    <div className="text-white font-bold text-sm">Due today</div>
                                    <div className="text-slate-400 text-[10px]">{totalDueToday > 0 ? 'BYOK activation' : 'Nothing. Trial is free.'}</div>
                                </div>
                                <div className="text-3xl font-black text-emerald-400">
                                    {fmt(totalDueToday, totalDueToday > 0 ? '' : '.00')}
                                </div>
                            </div>
                        </div>

                        {/* Right: Form */}
                        <div className="w-full lg:w-[380px] bg-white/[0.01] border border-white/[0.06] rounded-[1.75rem] p-7">
                            <form onSubmit={handleFormSubmit} className="space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lock size={13} className="text-teal-400" />
                                    <span className="text-xs font-black text-white uppercase tracking-widest">Secure Activation</span>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Business Email</label>
                                    <input
                                        type="email" required placeholder="name@business.com"
                                        value={checkoutDetails.email}
                                        onChange={e => setCheckoutDetails({ ...checkoutDetails, email: e.target.value })}
                                        className="w-full bg-black/30 border border-white/[0.06] focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                                    <input
                                        type="tel" required placeholder="+1 (555) 000-0000"
                                        value={checkoutDetails.phone}
                                        onChange={e => setCheckoutDetails({ ...checkoutDetails, phone: e.target.value })}
                                        className="w-full bg-black/30 border border-white/[0.06] focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                                    />
                                </div>

                                {isCardRequired ? (
                                    <div className="space-y-3 pt-4 border-t border-white/[0.05]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Card Details</span>
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1"><Lock size={9} /> Secured</span>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Cardholder Name</label>
                                            <input
                                                type="text" required placeholder="Jane Doe"
                                                value={checkoutDetails.cardholder}
                                                onChange={e => setCheckoutDetails({ ...checkoutDetails, cardholder: e.target.value })}
                                                className="w-full bg-black/30 border border-white/[0.06] focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Card Number</label>
                                            <input
                                                type="text" required placeholder="•••• •••• •••• ••••" maxLength="19"
                                                value={checkoutDetails.cardNumber}
                                                onChange={e => setCheckoutDetails({ ...checkoutDetails, cardNumber: e.target.value })}
                                                className="w-full bg-black/30 border border-white/[0.06] focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono outline-none transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Expiry</label>
                                                <input
                                                    type="text" required placeholder="MM/YY" maxLength="5"
                                                    value={checkoutDetails.expiry}
                                                    onChange={e => setCheckoutDetails({ ...checkoutDetails, expiry: e.target.value })}
                                                    className="w-full bg-black/30 border border-white/[0.06] focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono text-center outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">CVC</label>
                                                <input
                                                    type="password" required placeholder="•••" maxLength="4"
                                                    value={checkoutDetails.cvc}
                                                    onChange={e => setCheckoutDetails({ ...checkoutDetails, cvc: e.target.value })}
                                                    className="w-full bg-black/30 border border-white/[0.06] focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono text-center outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            Encrypted connection. Your card is authorized today. Subscription is charged only after your 14-day trial ends — and only if you choose to continue.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-white/[0.05]">
                                        <div className="p-3.5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/10 flex items-start gap-2.5">
                                            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                No credit card required. Your trial starts immediately with full dashboard access.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    id="checkout-submit"
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2
                                        ${isSubmitting
                                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-white text-[#020010] hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.3)] shadow-lg'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <span>Activating your account...</span>
                                    ) : (
                                        <>{isCardRequired ? 'Activate & Start Trial' : 'Start Free Trial'} <ArrowRight size={14} /></>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setCurrentStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="w-full text-center text-slate-500 hover:text-slate-400 text-[11px] font-bold uppercase tracking-widest transition-colors"
                                >
                                    ← Back
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    // ── Step 5: Confirmation ────────────────────────────────────────────────
    const renderConfirmation = () => {
        const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const trialEndStr = trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        return (
            <section className="min-h-screen px-6 py-24 flex items-center justify-center">
                <div className="max-w-2xl w-full">
                    <div className="rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-b from-[#0a1a14] to-[#040212] p-10 md:p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

                        <div className="relative z-10">
                            {/* Success mark */}
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={28} className="text-emerald-400" />
                            </div>

                            <h2 className="text-4xl font-black text-white tracking-tight font-display mb-2">You're in.</h2>
                            <p className="text-slate-400 text-sm mb-8">Your account has been activated. Here's exactly what happens next.</p>

                            {/* What's included */}
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left space-y-3 mb-6">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">What you purchased</div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-300">{selectedPlan && PLAN_DATA[selectedPlan]?.name}</span>
                                    <span className="text-slate-400 font-semibold">{selectedPlan && planPriceStr(selectedPlan)}</span>
                                </div>
                                {selectedAIData && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-300">{selectedAIData.emoji} {selectedAIData.name}</span>
                                        <span className="text-slate-400 font-semibold">+{fmt(isPK ? selectedAIData.pricePKR : selectedAIData.priceUSD)}/mo</span>
                                    </div>
                                )}
                                {selectedSyncs.length > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-300">{selectedSyncs.length} Platform Sync{selectedSyncs.length > 1 ? 's' : ''}</span>
                                        <span className="text-slate-400 font-semibold">+{fmt(syncCostNum)}/mo</span>
                                    </div>
                                )}
                                {selectedServiceData && (
                                    <div className="flex items-center justify-between text-sm pt-2 border-t border-white/[0.05]">
                                        <span className="text-slate-300">Catalog Loading — {selectedTier?.name}</span>
                                        <span className="text-amber-400 font-semibold">{isPK ? `Rs ${Math.round(serviceCostNum).toLocaleString()}` : `$${serviceCostNum.toFixed(2)}`} est.</span>
                                    </div>
                                )}
                            </div>

                            {/* Timeline */}
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left space-y-4 mb-6">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">What happens next</div>

                                {[
                                    { dot: 'bg-emerald-400', title: 'Right now', desc: `Your 14-day trial has started. Log in and explore everything.${totalDueToday > 0 ? ` BYOK activation fee of ${fmt(totalDueToday)} has been processed.` : ' No charge today.'}` },
                                    ...(selectedServiceData ? [{ dot: 'bg-teal-400', title: 'Within 2 business hours', desc: `Our team will contact you on ${checkoutDetails.phone || 'the number you provided'} to confirm your catalog details and begin loading ${calcProductsNum} products. Turnaround: ${selectedTier?.sla}.` }] : []),
                                    { dot: 'bg-teal-400', title: trialEndStr, desc: `Trial ends. Subscription begins at ${fmt(totalMonthlyCost)}/mo — only if you choose to stay. Cancel from your dashboard anytime before this date.` },
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${step.dot}`} />
                                            {i < 2 && <div className="w-px flex-1 bg-white/[0.05] my-1" />}
                                        </div>
                                        <div className="pb-3">
                                            <div className="text-white text-xs font-bold mb-0.5">{step.title}</div>
                                            <div className="text-slate-500 text-[11px] leading-relaxed">{step.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Human contact */}
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center gap-3 mb-6 text-sm text-slate-400">
                                <MessageSquare size={14} className="text-teal-400 flex-shrink-0" />
                                <span>Questions? WhatsApp us at <a href="https://wa.me/923091999489" className="text-teal-400 font-semibold hover:text-teal-300 transition-colors">+92 309 1999489</a> — we reply within a few hours.</span>
                            </div>

                            <MagneticButton
                                id="goto-dashboard"
                                href="/login"
                                variant="primary"
                                className="px-10 py-4 text-sm font-black uppercase tracking-widest"
                            >
                                Go to Dashboard <ArrowRight size={15} />
                            </MagneticButton>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    // ── Step indicator (steps 2–4) ─────────────────────────────────────────
    const renderStepBar = () => {
        if (currentStep === 1 || currentStep === 5) return null;
        const steps = [
            { n: 1, label: 'Plan' },
            { n: 3, label: 'Setup' },
            { n: 4, label: 'Checkout' },
        ];
        return (
            <div className="sticky top-[64px] z-40 bg-[#071614]/90 backdrop-blur-xl border-b border-white/[0.05] py-3 px-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
                    {steps.map((s) => {
                        const done = currentStep > s.n;
                        const active = currentStep === s.n;
                        return (
                            <div key={s.n} className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-slate-500'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all ${active ? 'bg-teal-600 text-white' : done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-slate-500'}`}>
                                    {done ? '✓' : s.n}
                                </div>
                                <span className="hidden sm:block">{s.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <MarketingLayout
            title="Pricing — VenQore"
            description="Start with the right plan. Add the AI power level that fits your business. No surprises. No hidden fees. 14-day free trial."
        >
            {renderStepBar()}
            {currentStep === 1 && renderPricingPage()}
            {currentStep === 2 && renderSyncStep()}
            {currentStep === 3 && renderOnboardingStep()}
            {currentStep === 4 && renderCheckout()}
            {currentStep === 5 && renderConfirmation()}
        </MarketingLayout>
    );
}

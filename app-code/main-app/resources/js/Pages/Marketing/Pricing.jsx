import React, { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel, GlassCard
} from './Shared/MarketingLayout';
import {
    Check, X, ArrowRight, ArrowLeft, Zap, ShieldCheck, Crown,
    ChevronDown, Sparkles, Globe, CreditCard, Lock, CheckCircle2,
    AlertCircle, Cpu, Key, Ban, Star, ShoppingCart, Package,
    BarChart3, Layers, MessageSquare, TrendingUp, Rocket, FileText, Store
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   VENQORE PRICING — V6 Design System & Canonical Pricing Specification
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
                    className={`flex-shrink-0 mt-0.5 transition-all duration-slow ${open ? 'rotate-180 text-brand-400' : 'text-ink-muted group-hover:text-neutral-300'}`}
                />
            </button>
            <div className={`overflow-hidden transition-all duration-slower ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'max-h-80 pb-6' : 'max-h-0'}`}>
                <p className="text-sm text-ink-muted leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

// ── Billing Toggle ─────────────────────────────────────────────────────
const BillingToggle = ({ value, onChange }) => {
    const options = [
        { key: 'subscription_monthly', label: 'Monthly' },
        { key: 'subscription_annual', label: 'Annual — 2 months free', badge: 'Save 20%' },
    ];

    return (
        <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {options.map((opt) => (
                <button
                    key={opt.key}
                    onClick={() => onChange(opt.key)}
                    className={`relative px-4 py-2 rounded-lg text-1xs font-bold tracking-wide transition-all duration-slow
                    ${value === opt.key
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-ink-muted hover:text-neutral-300'}`}
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
    );
};

// ── Main Pricing Page Component ────────────────────────────────────────
export default function Pricing({ plans = [] }) {
    const { geo = { country: 'US', currency: 'USD', symbol: '$' }, auth } = usePage().props;

    const PKR_ENABLED = false;
    const isPK = PKR_ENABLED && geo.currency === 'PKR';

    const [billingType, setBillingType] = useState('subscription_annual');
    const [currencyDisplay, setCurrencyDisplay] = useState('USD');
    const [selectedPlan, setSelectedPlan] = useState('growth'); // 'solo' | 'starter' | 'growth' (Core) | 'enterprise' (Scale)
    const [selectedAI, setSelectedAI] = useState('none');
    const [currentStep, setCurrentStep] = useState(1); // 1=pricing, 2=ai, 3=sync, 4=onboarding, 5=checkout, 6=confirmation
    const [expandedCards, setExpandedCards] = useState({ solo: false, starter: false, growth: false, enterprise: false });
    const toggleCardExpand = (key) => setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
    const [selectedSyncs, setSelectedSyncs] = useState([]);
    const [selectedService, setSelectedService] = useState(null); // 'basic' | 'descriptions' | 'images'
    const [calcProducts, setCalcProducts] = useState('');
    const [calcVariants, setCalcVariants] = useState('');
    const [trialMode, setTrialMode] = useState('instant');
    const [checkoutDetails, setCheckoutDetails] = useState({ email: '', phone: '', cardholder: '', cardNumber: '', expiry: '', cvc: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const aiSectionRef = useRef(null);

    const isLTD = false;

    useEffect(() => {
        setSelectedAI('none');
    }, [selectedPlan]);

    // Price helpers — Canonical V6/V11 specifications
    const defaultPricesUSD = {
        solo: { subscription_monthly: 0, subscription_annual: 0 },
        starter: { subscription_monthly: 49, subscription_annual: 40.83 },
        growth: { subscription_monthly: 99, subscription_annual: 82.50 },
        enterprise: { subscription_monthly: 299, subscription_annual: 249.17 },
    };
    const defaultPricesPKR = {
        solo: { subscription_monthly: 0, subscription_annual: 0 },
        starter: { subscription_monthly: 13700, subscription_annual: 11400 },
        growth: { subscription_monthly: 27700, subscription_annual: 23100 },
        enterprise: { subscription_monthly: 83700, subscription_annual: 69700 },
    };

    const PRICES_USD = { ...defaultPricesUSD };
    const PRICES_PKR = { ...defaultPricesPKR };

    // Override dynamically from database plans if populated
    if (plans && plans.length > 0) {
        plans.forEach(plan => {
            const baseSlug = plan.slug === 'business' ? 'enterprise' : (plan.slug === 'core' ? 'growth' : plan.slug);

            if (baseSlug === 'solo' || baseSlug === 'starter' || baseSlug === 'growth' || baseSlug === 'enterprise') {
                if (plan.type === 'subscription' || baseSlug === 'solo') {
                    PRICES_USD[baseSlug].subscription_monthly = parseFloat(plan.price_monthly_usd || plan.price_monthly || defaultPricesUSD[baseSlug].subscription_monthly);
                    PRICES_USD[baseSlug].subscription_annual = plan.price_annual_usd ? Math.round(parseFloat(plan.price_annual_usd) / 12) : (plan.price_annual ? Math.round(parseFloat(plan.price_annual) / 12) : defaultPricesUSD[baseSlug].subscription_annual);

                    const monthlyPKR = plan.price_monthly_pkr ? parseFloat(plan.price_monthly_pkr) : (plan.price_monthly ? Math.round(plan.price_monthly * 280) : defaultPricesPKR[baseSlug].subscription_monthly);
                    const annualPKR = plan.price_annual_pkr ? parseFloat(plan.price_annual_pkr) : (plan.price_annual ? Math.round(plan.price_annual * 280) : (defaultPricesPKR[baseSlug].subscription_annual * 12));
                    PRICES_PKR[baseSlug].subscription_monthly = monthlyPKR;
                    PRICES_PKR[baseSlug].subscription_annual = Math.round(annualPKR / 12);
                }
            }
        });
    }

    const fmt = (usdAmount, pkrAmount = null, suffix = '', showEstimate = true) => {
        const usdVal = parseFloat(usdAmount) || 0;
        return `$${usdVal.toLocaleString()}${suffix}`;
    };

    const planPrice = (key) => PRICES_USD[key]?.[billingType] ?? 0;
    const planPricePKR = (key) => PRICES_PKR[key]?.[billingType] ?? 0;
    const planPriceStr = (key) => {
        if (key === 'solo') return '$0';
        return fmt(planPrice(key), planPricePKR(key), '/mo', false);
    };

    const pricingProps = usePage().props.pricing || {};
    const aiTiersFromProp = pricingProps.ai_tiers || {};

    const ALL_AI_OPTIONS = Object.keys(aiTiersFromProp).length > 0
        ? Object.entries(aiTiersFromProp).map(([key, tier]) => ({
            key,
            name: tier.name?.includes('Smart Capture') ? tier.name : `Smart Capture ${tier.name || key.toUpperCase()}`,
            emoji: key === 'spark' ? '🌱' : key === 'shop' ? '⚡' : key === 'pro' ? '🚀' : '👑',
            tagline: tier.tagline || '',
            priceUSD: tier.price_monthly || 0,
            pricePKR: (tier.price_monthly || 0) * 280,
            popular: key === 'shop',
            laymanDesc: tier.description || '',
            laymanStats: [
                { label: `${(tier.ai_pages_limit || 0).toLocaleString()} Smart Capture Pages per month`, icon: FileText, desc: 'Auto extraction for paper supplier bills' },
                { label: `${(tier.ai_queries_limit || 0).toLocaleString()} AI Questions per month`, icon: MessageSquare, desc: 'Voice & text inventory queries' },
            ],
            techSpecs: tier.tech_specs || [
                { name: 'Multipage Support', value: 'Merges multi-page bills into 1 transaction' },
                { name: 'Language Support', value: 'Handwritten & printed (English, Urdu, Arabic numerals)' },
                { name: 'Safety Guard', value: 'Review screen first — never posts to ledger unconfirmed' },
                { name: 'Self-Verification', value: 'Auto checks line totals (qty × price = total)' },
            ]
        }))
        : [
            { key: 'spark', name: 'Smart Capture Spark', emoji: '🌱', tagline: 'Small Retailer', priceUSD: 3, pricePKR: 840, popular: false, laymanDesc: 'For boutique shops digitizing occasional paper bills.', laymanStats: [{ label: '500 Pages/month', icon: FileText, desc: 'Automated invoice capture' }, { label: '500 AI Queries', icon: MessageSquare, desc: 'Voice & text assistant questions' }] },
            { key: 'shop', name: 'Smart Capture Shop', emoji: '⚡', tagline: 'Busy Store', priceUSD: 6, pricePKR: 1680, popular: true, laymanDesc: 'Ideal for everyday grocery, apparel and wholesale stores with steady supplier receipts.', laymanStats: [{ label: '1,500 Pages/month', icon: FileText, desc: 'High-speed OCR & line splitting' }, { label: '1,500 AI Queries', icon: MessageSquare, desc: 'Live sales & inventory insights' }] },
            { key: 'pro', name: 'Smart Capture Pro', emoji: '🚀', tagline: 'High Volume', priceUSD: 12, pricePKR: 3360, popular: false, laymanDesc: 'High-speed automated ingestion for multi-counter busy retailers.', laymanStats: [{ label: '4,000 Pages/month', icon: FileText, desc: 'Batch procurement extraction' }, { label: '4,000 AI Queries', icon: MessageSquare, desc: 'Multi-store analytics' }] },
            { key: 'max', name: 'Smart Capture Max', emoji: '👑', tagline: 'Enterprise', priceUSD: 24, pricePKR: 6720, popular: false, laymanDesc: 'Enterprise throughput with unlimited concurrent scanner pipelines.', laymanStats: [{ label: '10,000 Pages/month', icon: FileText, desc: 'Custom ledger mapping' }, { label: '10,000 AI Queries', icon: MessageSquare, desc: 'Direct model routing' }] },
        ];

    const selectedAIData = ALL_AI_OPTIONS.find(o => o.key === selectedAI || `opt_${o.key}` === selectedAI) ?? null;

    const aiCostUSD = selectedAI === 'byok' ? 19 : selectedAIData ? selectedAIData.priceUSD : 0;
    const aiCostPKR = selectedAI === 'byok' ? 5300 : selectedAIData ? selectedAIData.pricePKR : 0;
    const aiIsMonthly = selectedAI !== 'none' && selectedAI !== 'byok';

    const syncCostUSD = selectedSyncs.length * 19;
    const syncCostPKR = selectedSyncs.length * 5300;

    const SERVICE_TIERS = {
        basic: { key: 'basic', name: 'Basic Upload', emoji: '📦', priceUSD: 1.00, pricePKR: 100, variantExtraUSD: 0.50, variantExtraPKR: 50, sla: '2–3 business days', desc: 'Product data uploaded with all core fields. Up to 5 variants per product included.' },
        descriptions: { key: 'descriptions', name: '+ Rich Descriptions', emoji: '✍️', priceUSD: 1.50, pricePKR: 150, variantExtraUSD: 0.50, variantExtraPKR: 50, sla: '3–5 business days', desc: 'Everything in Basic + long descriptions, SEO copy, and full product detail.' },
        images: { key: 'images', name: '+ AI Images', emoji: '🎨', priceUSD: 2.00, pricePKR: 200, variantExtraUSD: 0.50, variantExtraPKR: 50, sla: '4–6 business days', desc: 'Everything in Descriptions + AI-generated or curated product imagery.' },
    };

    const calcProductsNum = Math.max(0, parseInt(calcProducts) || 0);
    const calcVariantsNum = Math.max(1, parseInt(calcVariants) || 1);
    const selectedTier = selectedService ? SERVICE_TIERS[selectedService] : null;
    const extraBlocks = calcVariantsNum > 5 ? Math.ceil((calcVariantsNum - 5) / 5) : 0;

    const usdPricePerProduct = selectedTier
        ? selectedTier.priceUSD + extraBlocks * selectedTier.variantExtraUSD
        : 0;
    const pkrPricePerProduct = selectedTier
        ? selectedTier.pricePKR + extraBlocks * selectedTier.variantExtraPKR
        : 0;

    const usdServiceCostNum = calcProductsNum * usdPricePerProduct;
    const pkrServiceCostNum = calcProductsNum * pkrPricePerProduct;

    const selectedServiceData = selectedTier ? {
        name: selectedTier.name,
        subtitle: `${calcProductsNum} product${calcProductsNum !== 1 ? 's' : ''}`,
        sla: selectedTier.sla,
        cost: usdServiceCostNum,
        pkrCost: pkrServiceCostNum,
    } : null;

    const usdTotalMonthlyCost = selectedPlan && selectedPlan !== 'solo'
        ? planPrice(selectedPlan) + (aiIsMonthly ? aiCostUSD : 0) + syncCostUSD
        : 0;
    const pkrTotalMonthlyCost = selectedPlan && selectedPlan !== 'solo'
        ? planPricePKR(selectedPlan) + (aiIsMonthly ? aiCostPKR : 0) + syncCostPKR
        : 0;

    const totalMonthlyCost = usdTotalMonthlyCost;
    const usdTotalDueToday = selectedAI === 'byok' ? 19 : 0;
    const pkrTotalDueToday = selectedAI === 'byok' ? 5300 : 0;
    const totalDueToday = usdTotalDueToday;

    // Card requirement rule: Required for all paid plans & trials. Only Solo $0 free-forever can bypass card.
    const isCardRequired = selectedPlan !== 'solo';

    const PLAN_DATA = {
        solo: {
            name: 'Solo',
            tagline: 'One person, one register. Free forever with structural limits.',
            flag: 'Free forever',
            icon: Store,
            color: 'teal',
            accentFrom: 'from-teal-500/[0.08]',
            accentBorder: 'border-teal-500/30',
            accentGlow: '',
            iconBg: 'bg-teal-500/10 text-teal-400',
            badgeBg: 'bg-teal-500/10 border-teal-500/20 text-teal-300',
            totalIncluded: 18,
            ratioLabel: '18 Core Capabilities',
            buttonLabel: 'Choose Solo',
            isTrialPlan: false,
            includes: [
                'Up to 500 products (SKUs)',
                '1 location, 1 full seat',
                '1 register (2 cashier PIN logins)',
                '100 sales & 20 service jobs/month',
                'Core Ledger + all 43 financial reports',
                '30-day history visible (data safely kept)',
                'SmartCapture: 10 scans / 100 AI credits',
                'Help centre + Vena AI support',
            ],
            excludes: [
                'Multi-Branch Stock & Transfers',
                'API Access & Webhooks',
                'Google Drive Backup Included',
            ],
        },
        starter: {
            name: 'Starter',
            tagline: 'A shop with a couple of people on the till and full history.',
            flag: 'Essential',
            icon: Zap,
            color: 'blue',
            accentFrom: 'from-blue-500/[0.08]',
            accentBorder: 'border-blue-500/30',
            accentGlow: '',
            iconBg: 'bg-blue-500/10 text-blue-400',
            badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
            totalIncluded: 22,
            ratioLabel: '22 Features Included',
            buttonLabel: 'Choose Starter',
            isTrialPlan: true,
            includes: [
                'Up to 5,000 products (SKUs)',
                '1 location, 1 full seat (+ $15/mo seat)',
                '2 registers (cashier logins unlimited)',
                'Full history retention (unlimited days)',
                'Google Drive backup included',
                '500 AI credits/mo + 1 rebuild / 90 days',
                'Full offline POS checkout & receipt print',
                'Email support (2 business days SLA)',
            ],
            excludes: [
                'Multi-Branch & Transfers',
                'REST API & Webhooks',
                'White-Label & Custom Domain',
            ],
        },
        growth: {
            name: 'Core',
            tagline: 'Multi-branch stock, API access, audit logs, custom roles and signals.',
            flag: 'Most popular',
            popular: true,
            icon: TrendingUp,
            color: 'indigo',
            accentFrom: 'from-brand-500/[0.12]',
            accentBorder: 'border-brand-500/50',
            accentGlow: 'shadow-[0_0_35px_rgba(11,170,143,0.15)]',
            iconBg: 'bg-brand-500/10 text-brand-400',
            badgeBg: 'bg-brand-500/10 border-brand-500/20 text-brand-300',
            inheritLabel: 'Everything in Starter, plus:',
            totalIncluded: 28,
            ratioLabel: '28 of 32 Features Included',
            buttonLabel: 'Start 14-day trial',
            isTrialPlan: true,
            includes: [
                'Up to 25,000 products (SKUs)',
                '1 location, 5 full seats (+ $15/mo seat)',
                'Up to 6 registers (cashier logins unlimited)',
                'Multi-branch transfers (with 2nd location)',
                'Full REST API access & webhooks',
                'Audit trail & custom granular roles',
                '2,000 AI credits/mo + 1 rebuild / 90 days',
                'Priority email support (1 business day SLA)',
            ],
            excludes: [
                'White-Label & Custom Domain',
                'Consolidated Multi-Entity Reporting',
            ],
        },
        enterprise: {
            name: 'Scale',
            tagline: 'Large operations, custom roles, white-label and channel sync.',
            flag: 'Enterprise Scale',
            icon: Crown,
            color: 'purple',
            accentFrom: 'from-purple-500/[0.08]',
            accentBorder: 'border-purple-500/30',
            accentGlow: '',
            iconBg: 'bg-purple-500/10 text-purple-400',
            badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
            inheritLabel: 'Everything in Core, plus:',
            totalIncluded: 32,
            ratioLabel: 'All 32 Features Included',
            buttonLabel: 'Choose Scale',
            isTrialPlan: true,
            includes: [
                'Up to 250,000 products (SKUs)',
                '1 location, 25 full seats',
                'Up to 20 registers (cashier logins unlimited)',
                'Multi-branch & inter-branch transfers',
                'White-label & consolidated reporting',
                '2 channel syncs included (WooCommerce/Amazon)',
                '10,000 AI credits/mo + 1 rebuild / month',
                'Named contact (4 business hours SLA)',
            ],
            excludes: [],
        },
    };

    const [expandedNerdSpecs, setExpandedNerdSpecs] = useState({});
    const toggleNerdSpec = (key) => setExpandedNerdSpecs(prev => ({ ...prev, [key]: !prev[key] }));

    const SYNC_CHANNELS = [
        {
            key: 'woocommerce',
            name: 'WooCommerce Integration',
            icon: Globe,
            priceUSD: 19,
            pricePKR: 5300,
            comingSoon: false,
            laymanTitle: 'Sync Physical Shop with WooCommerce Website',
            laymanDesc: 'Connect your WordPress / WooCommerce online store. When a customer buys in your physical shop, online stock decreases in under 3 seconds so you never sell out-of-stock items.',
            laymanHighlights: [
                '⚡ Instant stock sync (POS ↔ Website in under 3 seconds)',
                '📦 Auto-import web orders straight into your POS cashier screen',
                '👥 Unified customer profiles & complete purchase history'
            ],
            techSpecs: [
                { name: 'Protocol', value: 'WooCommerce REST API v3 & Webhook Listener' },
                { name: 'Sync Latency', value: '<3,000ms bidirectional webhook trigger' },
                { name: 'Stock Locking', value: 'Atomic inventory subtraction with lock prevention' },
                { name: 'Security', value: 'HMAC-SHA256 signature verification' }
            ]
        },
        {
            key: 'amazon',
            name: 'Amazon Marketplace Sync',
            icon: ShoppingCart,
            priceUSD: 19,
            pricePKR: 5300,
            comingSoon: false,
            laymanTitle: 'Sync FBA/FBM Inventory & Auto-Import Amazon Orders',
            laymanDesc: 'Connect your Amazon Seller Central account. Import Amazon orders straight into your POS ledger, keep FBA & FBM stock in sync, and generate tax invoices in 1 click.',
            laymanHighlights: [
                '🛒 Auto-import Amazon FBA & FBM orders to POS ledger',
                '📉 Live FBA & FBM inventory count auto-sync',
                '📄 1-Click tax invoice & packing slip generation'
            ],
            techSpecs: [
                { name: 'Protocol', value: 'Amazon Selling Partner API (SP-API v2022-09-01)' },
                { name: 'Authentication', value: 'OAuth 2.0 PKCE with LWA auto-rotation' },
                { name: 'Throttling', value: 'Token-bucket rate limiter for SP-API quotas' },
                { name: 'Multi-Region', value: 'US, UK, EU, UAE, & SA Marketplace endpoints' }
            ]
        },
        {
            key: 'shopify',
            name: 'Shopify Store Sync',
            icon: Store,
            priceUSD: 19,
            pricePKR: 5300,
            comingSoon: true,
            laymanTitle: 'Real-Time Inventory & Order Sync with Shopify',
            laymanDesc: 'Connect your Shopify store. Automatically mirror physical store inventory with your online Shopify catalog.',
            laymanHighlights: [
                '🛍️ Instant 2-way stock adjustment between POS & Shopify',
                '📊 Sync online orders, tax codes, and customer profiles'
            ],
            techSpecs: [
                { name: 'Protocol', value: 'Shopify GraphQL Admin API & Webhooks (2024-07)' },
                { name: 'Status', value: 'Coming Soon — Beta Access Q4 2026' }
            ]
        },
        {
            key: 'ebay',
            name: 'eBay Integration',
            icon: Package,
            priceUSD: 19,
            pricePKR: 5300,
            comingSoon: true,
            laymanTitle: 'Automate eBay Listings & Order Imports',
            laymanDesc: 'Automatically sync physical POS sales with your eBay seller listings so quantities are always 100% accurate.',
            laymanHighlights: [
                '🏷️ Sync store inventory with active eBay auction listings',
                '🚚 Import eBay orders directly into local POS dispatch queue'
            ],
            techSpecs: [
                { name: 'Protocol', value: 'eBay Trading API & Fulfillment API' },
                { name: 'Status', value: 'Coming Soon — Launching Q4 2026' }
            ]
        },
        {
            key: 'tiktok',
            name: 'TikTok Shop',
            icon: Star,
            priceUSD: 19,
            pricePKR: 5300,
            comingSoon: true,
            laymanTitle: 'Live-Stream & Short-Video Sales Sync',
            laymanDesc: 'Connect TikTok Shop to import live-stream sales directly into your POS stock system.',
            laymanHighlights: [
                '🎥 Real-time flash sale inventory reservation during TikTok lives',
                '📊 Channel-wise TikTok revenue performance reports'
            ],
            techSpecs: [
                { name: 'Protocol', value: 'TikTok Shop Partner API v2' },
                { name: 'Status', value: 'Coming Soon — Launching Q4 2026' }
            ]
        }
    ];

    const FAQS = [
        { id: 'faq-trial', q: 'Is there a free trial?', a: '14 days at Core level, card required, cancel anytime. That includes multi-branch, API access, audit trail, Vena, Signals and all 43 reports — so you are trying the real thing, not a demo of it. We send a reminder on day 11 before the trial ends, not after.' },
        { id: 'faq-after-trial', q: 'What happens after the trial?', a: 'If you don\'t select a paid plan, your system drops smoothly to Solo — free forever. Your data is preserved and nothing is deleted or reset.' },
        { id: 'faq-change', q: 'Can I change plans?', a: 'Any time, both directions, prorated. Downgrading never deletes anything: data above the new limit or beyond 30 days on Solo becomes read-only and safely archived, and comes back the moment you upgrade.' },
        { id: 'faq-import', q: 'Do you charge to import my data?', a: 'No. Import is included, and so is the help getting it in.' },
        { id: 'faq-leave', q: 'Do you charge to leave?', a: 'No. Export everything, any time, in a format your next system can read.' },
        { id: 'faq-contract', q: 'Is there a contract?', a: 'Monthly is month-to-month. Annual is twelve months at two months off ($490, $990, or $2,990). There is no minimum term and no notice period.' },
        { id: 'faq-all-included', q: 'Why does the cheapest plan include everything?', a: 'Because a feature you need should not be a negotiation. A one-person shop needs a correct trial balance exactly as much as a ten-branch one does — it just needs fewer seats. You pay for the size of your business, not for permission to run it properly.' },
        { id: 'faq-charge', q: 'When will my card actually be charged?', a: 'Your card is authorized today ($0.00 charge) to verify your account. Your subscription is charged only after your 14-day trial ends on your chosen plan. You can cancel with one click from your dashboard anytime before the 14 days end.' },
        { id: 'faq-ai-cost', q: 'What is the $19 one-time BYOK fee for?', a: 'Bringing Your Own API Key (BYOK) means you connect your own OpenAI or Gemini key. We charge a one-time $19 platform activation fee to unlock direct model routing in your account. After that, you are billed directly by your AI provider — we charge you nothing ongoing.' },
    ];

    const handlePlanSelect = (planKey) => {
        setSelectedPlan(planKey);
    };

    const handleContinue = () => {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setCurrentStep(6);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
    };

    // ── Step 1: Pricing Overview ───────────────────────────────────────────
    const renderPricingPage = () => (
        <div className="space-y-0">
            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="relative pt-28 sm:pt-36 pb-12 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <RevealOnScroll>
                        <SectionLabel icon={Sparkles}>14-Day Free Trial — Full Feature Access</SectionLabel>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.08}>
                        <h1 className="text-[2.75rem] xs:text-5xl md:text-[68px] font-bold tracking-tighter leading-[0.9] sm:leading-[0.88] mb-5 font-display">
                            <span className="bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
                                Priced like software.
                            </span>
                            <br />
                            <span className="bg-gradient-brand bg-clip-text text-transparent vq-text-glow">
                                Not like a project.
                            </span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.15}>
                        <p className="text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
                            Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $49 a month — or free. Every paid plan carries universal business modules, the full double-entry ledger and all 43 financial reports.
                        </p>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 14-Day Free Trial Trust Badges Strip ── */}
            <section className="px-6 py-4 relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: ShieldCheck, text: "14-Day Free Trial", desc: "Full Core access at zero risk" },
                                { icon: CreditCard, text: "Card Required for Trial", desc: "Authorized today, billed day 14" },
                                { icon: Ban, text: "Cancel Anytime", desc: "1-click cancellation, no lock-in" },
                                { icon: Lock, text: "SOC2-Compliant Security", desc: "Bank-grade encrypted pipeline" }
                            ].map((badge, i) => (
                                <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
                                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-3">
                                        <badge.icon size={20} />
                                    </div>
                                    <h4 className="text-ink text-xs font-bold tracking-tight mb-1">{badge.text}</h4>
                                    <p className="text-ink-muted text-3xs leading-relaxed">{badge.desc}</p>
                                </div>
                            ))}
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── Plan Cards (4 Column Grid: Solo, Starter, Core, Scale) ──── */}
            <section className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Billing toggle */}
                    <RevealOnScroll delay={0.1}>
                        <div className="flex justify-center mb-12 relative z-10">
                            <BillingToggle value={billingType} onChange={setBillingType} />
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {Object.entries(PLAN_DATA).map(([key, plan], idx) => {
                            const PlanIcon = plan.icon;
                            const isSelected = selectedPlan === key;

                            return (
                                <RevealOnScroll key={key} delay={idx * 0.05}>
                                    <div
                                        id={`plan-${key}`}
                                        onClick={() => handlePlanSelect(key)}
                                        className={`relative rounded-2xl border cursor-pointer overflow-hidden transition-all duration-slower flex flex-col h-full
                                        ${isSelected
                                            ? `bg-gradient-to-b ${plan.accentFrom} to-transparent ${plan.accentBorder} shadow-2xl ${plan.accentGlow} scale-[1.015]`
                                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.035] hover:border-white/10'
                                        }`}
                                    >
                                        {/* Flag / Badge */}
                                        {plan.popular && (
                                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 via-teal-400 to-brand-500" />
                                        )}
                                        {plan.flag && (
                                            <div className="absolute top-3 right-4">
                                                <span className={`px-2.5 py-1 rounded-full text-3xs font-bold tracking-widest uppercase border ${plan.popular ? 'bg-brand-500/15 border-brand-500/30 text-brand-300' : 'bg-white/[0.04] border-white/[0.08] text-ink-muted'}`}>
                                                    {plan.flag}
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-6 flex-1 flex flex-col">
                                            {/* Icon + name */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.iconBg}`}>
                                                    <PlanIcon size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-ink font-bold text-base tracking-tight">{plan.name}</div>
                                                    {isSelected && (
                                                        <span className={`text-3xs font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded-full ${plan.badgeBg} border`}>
                                                            Selected ✓
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="mb-4 flex flex-col">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-[32px] font-bold text-ink font-display">{planPriceStr(key)}</span>
                                                    {key === 'solo' && <span className="text-xs text-ink-muted font-semibold">/forever</span>}
                                                </div>
                                                <span className="text-xs text-ink-muted font-medium mt-0.5">
                                                    {key === 'solo'
                                                        ? 'Free forever, structural limits'
                                                        : billingType === 'subscription_annual'
                                                            ? (key === 'starter' ? '$490 billed annually' : key === 'growth' ? '$990 billed annually' : '$2,990 billed annually')
                                                            : 'billed monthly'}
                                                </span>
                                            </div>

                                            <p className="text-xs text-ink-muted leading-relaxed mb-4">{plan.tagline}</p>

                                            {/* Inherit banner */}
                                            {plan.inheritLabel && (
                                                <div className={`flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-xl ${isSelected ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} border border-white/[0.05]`}>
                                                    <Layers size={11} className="text-brand-400 flex-shrink-0" />
                                                    <span className="text-3xs font-bold text-brand-300 uppercase tracking-wider">{plan.inheritLabel}</span>
                                                </div>
                                            )}

                                            {/* Highlights */}
                                            <div className="space-y-2 flex-1">
                                                {plan.includes.map((f, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <Check size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                                        <span className="text-xs text-ink-secondary leading-snug">{f}</span>
                                                    </div>
                                                ))}
                                                {plan.excludes.map((f, i) => (
                                                    <div key={i} className="flex items-start gap-2 opacity-50">
                                                        <X size={13} className="text-ink-muted flex-shrink-0 mt-0.5" />
                                                        <span className="text-xs text-ink-muted leading-snug">{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="px-6 pb-6 pt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePlanSelect(key);
                                                    setTimeout(() => handleContinue(), 50);
                                                }}
                                                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-normal ${
                                                    isSelected
                                                        ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20'
                                                        : 'bg-white/[0.04] text-ink-secondary hover:bg-white/[0.08] border border-white/[0.05]'
                                                }`}
                                            >
                                                {isSelected ? 'Selected ✓' : plan.buttonLabel}
                                            </button>
                                        </div>
                                    </div>
                                </RevealOnScroll>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── In Every Plan Banner (Canonical V6 Approved) ── */}
            <section className="px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-brand-950/20 via-white/[0.01] to-transparent p-8 md:p-10 shadow-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-2xs font-bold tracking-widest uppercase mb-4">
                                In Every Plan
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight font-display mb-6">
                                Nothing important is withheld.
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    'The complete double-entry ledger',
                                    'All 43 financial reports',
                                    'Unlimited monthly transactions (Paid & LTD)',
                                    'Your data exportable at any time',
                                    'Every new feature we ship, no extra cost',
                                    'Offline mode at the POS till'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                        <Check size={14} className="text-brand-400 flex-shrink-0" />
                                        <span className="text-xs text-ink-secondary font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/[0.06] text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
                                <p className="text-sm font-semibold text-white/90">
                                    No implementation fee. No setup fee. No module fees. No consultant.
                                </p>
                                <span className="text-2xs text-ink-muted">
                                    *Published industry benchmarks compare to overall total cost of ownership.
                                </span>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── Line-by-Line Comparison Table ─────────────────────── */}
            <section className="px-6 py-12">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-8">
                            <SectionLabel icon={Layers}>Line by Line</SectionLabel>
                            <h2 className="text-3xl font-bold text-ink tracking-tight font-display">Compare the plans.</h2>
                        </div>
                    </RevealOnScroll>

                    <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.01]">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-ink-muted">Capability</th>
                                    <th className="py-4 px-4 text-center text-xs font-bold text-ink">Solo (Free)</th>
                                    <th className="py-4 px-4 text-center text-xs font-bold text-ink">Starter</th>
                                    <th className="py-4 px-4 text-center text-xs font-bold text-brand-400 bg-brand-500/[0.05]">Core</th>
                                    <th className="py-4 px-6 text-center text-xs font-bold text-ink">Scale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04] text-xs">
                                <tr className="bg-white/[0.03]">
                                    <td colSpan={5} className="py-2.5 px-6 font-bold uppercase tracking-widest text-brand-400 text-3xs">Operational Limits</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">Monthly price (annual)</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold">$0</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold">$49/mo ($490/yr)</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-brand-400 bg-brand-500/[0.05]">$99/mo ($990/yr)</td>
                                    <td className="py-3 px-6 text-center font-mono font-bold">$299/mo ($2,990/yr)</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">Product SKUs</td>
                                    <td className="py-3 px-4 text-center font-mono">500</td>
                                    <td className="py-3 px-4 text-center font-mono">5,000</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-brand-400 bg-brand-500/[0.05]">25,000</td>
                                    <td className="py-3 px-6 text-center font-mono">250,000</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">Full Staff seats</td>
                                    <td className="py-3 px-4 text-center font-mono">1</td>
                                    <td className="py-3 px-4 text-center font-mono">1</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-brand-400 bg-brand-500/[0.05]">5</td>
                                    <td className="py-3 px-6 text-center font-mono">25</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">POS Registers</td>
                                    <td className="py-3 px-4 text-center font-mono">1</td>
                                    <td className="py-3 px-4 text-center font-mono">2</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-brand-400 bg-brand-500/[0.05]">6</td>
                                    <td className="py-3 px-6 text-center font-mono">20</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">Transactions per month</td>
                                    <td className="py-3 px-4 text-center font-mono">100</td>
                                    <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">Unlimited</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400 bg-brand-500/[0.05]">Unlimited</td>
                                    <td className="py-3 px-6 text-center font-mono text-emerald-400 font-bold">Unlimited</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">History retention visible</td>
                                    <td className="py-3 px-4 text-center font-mono">30 days</td>
                                    <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">Unlimited</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400 bg-brand-500/[0.05]">Unlimited</td>
                                    <td className="py-3 px-6 text-center font-mono text-emerald-400 font-bold">Unlimited</td>
                                </tr>

                                <tr className="bg-white/[0.03]">
                                    <td colSpan={5} className="py-2.5 px-6 font-bold uppercase tracking-widest text-brand-400 text-3xs">Scale Fences</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">Multi-branch stock & transfers</td>
                                    <td className="py-3 px-4 text-center"><X size={14} className="mx-auto text-ink-muted" /></td>
                                    <td className="py-3 px-4 text-center text-2xs text-ink-muted">With 2nd location</td>
                                    <td className="py-3 px-4 text-center bg-brand-500/[0.05]"><Check size={14} className="mx-auto text-brand-400" /></td>
                                    <td className="py-3 px-6 text-center"><Check size={14} className="mx-auto text-brand-400" /></td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">REST API & webhooks</td>
                                    <td className="py-3 px-4 text-center"><X size={14} className="mx-auto text-ink-muted" /></td>
                                    <td className="py-3 px-4 text-center text-2xs text-ink-muted">$29/mo add-on</td>
                                    <td className="py-3 px-4 text-center bg-brand-500/[0.05]"><Check size={14} className="mx-auto text-brand-400" /></td>
                                    <td className="py-3 px-6 text-center"><Check size={14} className="mx-auto text-brand-400" /></td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">Audit trail & custom roles</td>
                                    <td className="py-3 px-4 text-center"><X size={14} className="mx-auto text-ink-muted" /></td>
                                    <td className="py-3 px-4 text-center text-2xs text-ink-muted">$39/mo add-on</td>
                                    <td className="py-3 px-4 text-center bg-brand-500/[0.05]"><Check size={14} className="mx-auto text-brand-400" /></td>
                                    <td className="py-3 px-6 text-center"><Check size={14} className="mx-auto text-brand-400" /></td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">White-label branding & custom domain</td>
                                    <td className="py-3 px-4 text-center"><X size={14} className="mx-auto text-ink-muted" /></td>
                                    <td className="py-3 px-4 text-center"><X size={14} className="mx-auto text-ink-muted" /></td>
                                    <td className="py-3 px-4 text-center text-2xs text-ink-muted bg-brand-500/[0.05]">$49/mo add-on</td>
                                    <td className="py-3 px-6 text-center"><Check size={14} className="mx-auto text-brand-400" /></td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-6 text-ink-muted font-medium">Channel sync (Woo/Amazon)</td>
                                    <td className="py-3 px-4 text-center"><X size={14} className="mx-auto text-ink-muted" /></td>
                                    <td className="py-3 px-4 text-center text-2xs text-ink-muted">$19/mo per channel</td>
                                    <td className="py-3 px-4 text-center text-2xs text-ink-muted bg-brand-500/[0.05]">$19/mo per channel</td>
                                    <td className="py-3 px-6 text-center text-emerald-400 font-bold text-2xs">2 Included</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ── FAQs ─────────────────────────────────────────────── */}
            <section className="px-6 py-12">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-10">
                            <SectionLabel icon={MessageSquare}>Common Questions</SectionLabel>
                            <h2 className="text-3xl font-bold text-ink tracking-tight font-display">Straight answers.</h2>
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

            {/* ── Bottom CTA ───────────────────────────────────────── */}
            <section className="px-6 py-10 pb-20">
                <div className="max-w-lg mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-6">
                            {selectedPlan ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-ink-muted mb-4">
                                    <Check size={14} className="text-emerald-400" />
                                    <span>{PLAN_DATA[selectedPlan]?.name} selected</span>
                                </div>
                            ) : (
                                <div className="text-ink-muted text-sm mb-4">Select a plan above to continue</div>
                            )}
                        </div>
                        <MagneticButton
                            id="pricing-continue-btn"
                            onClick={selectedPlan ? handleContinue : undefined}
                            variant={selectedPlan ? 'indigo' : 'ghost'}
                            className={`w-full py-5 justify-center text-sm ${!selectedPlan ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            {selectedPlan ? (
                                <>Select {PLAN_DATA[selectedPlan]?.name} & Customize <ArrowRight size={16} /></>
                            ) : (
                                <>Select a plan to continue <ArrowRight size={16} /></>
                            )}
                        </MagneticButton>
                        <p className="text-center text-1xs text-ink-muted mt-3">
                            14-day free trial · Card required · Cancel anytime with 1 click.
                        </p>
                    </RevealOnScroll>
                </div>
            </section>
        </div>
    );

    // ── Step 2: Dedicated AI Engine Configuration ──────────────────────────
    const renderAIStep = () => (
        <section ref={aiSectionRef} className="min-h-screen px-6 py-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/15 text-brand-400 text-2xs font-bold tracking-widest uppercase mb-4">
                        Step 2 of 4
                    </div>
                    <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-3">
                        Power {PLAN_DATA[selectedPlan]?.name} with AI
                    </h2>
                    <p className="text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
                        Select an AI scanning power level tailored for your invoice ingestion volume, or bring your own API key.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-void-950 p-8 md:p-10 space-y-6 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {ALL_AI_OPTIONS.map((opt) => {
                            const optKey = `opt_${opt.key}`;
                            const isChosen = selectedAI === optKey;
                            const isNerdExpanded = expandedNerdSpecs[optKey];

                            return (
                                <div
                                    key={opt.key}
                                    id={`ai-option-${opt.key}`}
                                    onClick={() => setSelectedAI(isChosen ? 'none' : optKey)}
                                    className={`relative text-left p-6 rounded-2xl border transition-all duration-slow flex flex-col justify-between cursor-pointer
                                    ${isChosen
                                        ? 'bg-brand-600/10 border-brand-500/60 shadow-[0_0_30px_rgba(11,170,143,0.12)]'
                                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-ink font-bold text-lg">{opt.name}</span>
                                                        {opt.popular && (
                                                            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-3xs font-bold tracking-wider uppercase">
                                                                RECOMMENDED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-ink-muted text-xs font-semibold mt-0.5">{opt.tagline}</div>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-ink font-bold text-xl">
                                                    +{fmt(opt.priceUSD, opt.pricePKR)}
                                                </div>
                                                <span className="text-ink-muted text-3xs">/month</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-ink-muted leading-relaxed mb-4">{opt.laymanDesc}</p>

                                        <div className="space-y-2 mb-4 p-3 rounded-xl bg-black/30 border border-white/[0.05]">
                                            {opt.laymanStats.map((stat, i) => {
                                                const StatIcon = stat.icon;
                                                return (
                                                    <div key={i} className="flex items-start gap-2.5">
                                                        <div className="w-5 h-5 rounded bg-brand-500/10 text-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <StatIcon size={11} />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-neutral-200">{stat.label}</div>
                                                            <div className="text-3xs text-ink-muted leading-tight">{stat.desc}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        {isNerdExpanded && opt.techSpecs && (
                                            <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-1.5 animate-fadeIn">
                                                <div className="text-3xs font-bold text-brand-300 uppercase tracking-widest mb-2">Technical Specifications:</div>
                                                {opt.techSpecs.map((spec, i) => (
                                                    <div key={i} className="flex items-center justify-between text-3xs gap-2">
                                                        <span className="text-ink-muted font-mono">{spec.name}</span>
                                                        <span className="text-neutral-300 font-mono font-semibold text-right">{spec.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleNerdSpec(optKey);
                                                }}
                                                className="text-3xs font-bold text-ink-muted hover:text-brand-300 uppercase tracking-wider transition-colors flex items-center gap-1"
                                            >
                                                {isNerdExpanded ? 'Hide Details ▲' : 'Technical Specs ▼'}
                                            </button>
                                            <span className={`text-2xs font-bold px-3 py-1 rounded-lg transition-all ${isChosen ? 'bg-brand-500 text-white' : 'bg-white/5 text-ink-muted'}`}>
                                                {isChosen ? 'Selected ✓' : 'Select Tier'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* BYOK + Skip AI row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            id="ai-byok"
                            onClick={() => setSelectedAI(selectedAI === 'byok' ? 'none' : 'byok')}
                            className={`text-left p-4 rounded-xl border transition-all duration-slow flex items-center justify-between gap-3
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
                                    <div className="text-ink text-xs font-bold">Bring Your Own Key (BYOK)</div>
                                    <div className="text-ink-muted text-2xs mt-0.5">Connect your OpenAI/Gemini API key</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className="text-amber-300 font-bold text-sm whitespace-nowrap">
                                    {fmt(19, 5300, ' once')}
                                </span>
                                <span className="text-3xs text-ink-muted font-bold uppercase tracking-wider">one-time unlock</span>
                            </div>
                        </button>

                        <button
                            id="ai-none"
                            onClick={() => setSelectedAI('none')}
                            className={`text-left p-4 rounded-xl border transition-all duration-slow flex items-center justify-between gap-3
                            ${selectedAI === 'none'
                                ? 'bg-neutral-800/50 border-neutral-600/40'
                                : 'bg-white/[0.02] border-white/[0.05] hover:border-white/8'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                                    <Ban size={14} className="text-ink-muted" />
                                </div>
                                <div>
                                    <div className="text-ink text-xs font-bold">Standard Allowance Only</div>
                                    <div className="text-ink-muted text-2xs mt-0.5">Use plan included credits — add anytime</div>
                                </div>
                            </div>
                            <span className="text-ink-muted font-semibold text-xs whitespace-nowrap">Included</span>
                        </button>
                    </div>

                    {/* Notice */}
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                        <CreditCard size={14} className="text-brand-400 flex-shrink-0" />
                        <div className="text-xs text-ink-muted">
                            <strong className="text-white/90">Zero charge today.</strong> Your card is authorized for subscription verification. Billing starts only after your 14-day trial ends.
                        </div>
                    </div>
                </div>

                {/* Step 2 Nav */}
                <div className="flex items-center justify-between pt-6 border-t border-white/[0.05]">
                    <button
                        onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.06] text-ink-muted hover:text-neutral-200 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={13} /> Back to Plans
                    </button>
                    <MagneticButton
                        id="ai-step-continue"
                        onClick={() => { setCurrentStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        variant="indigo"
                        className="px-8 py-3.5 text-xs font-bold uppercase tracking-widest"
                    >
                        Continue to Channel Sync <ArrowRight size={13} />
                    </MagneticButton>
                </div>
            </div>
        </section>
    );

    // ── Step 3: Platform Sync ──────────────────────────────────────────────
    const renderSyncStep = () => (
        <section className="min-h-screen px-6 py-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/15 text-brand-400 text-2xs font-bold tracking-widest uppercase mb-4">
                        Step 3 of 4
                    </div>
                    <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-3">
                        Connect Online Channels
                    </h2>
                    <p className="text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
                        Connect your online store or Amazon seller central. Sync quantities bidirectionally in under 3 seconds.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {SYNC_CHANNELS.map((ch) => {
                        const Icon = ch.icon;
                        const isAdded = selectedSyncs.includes(ch.key);
                        const isComingSoon = ch.comingSoon;
                        const isNerdExpanded = expandedNerdSpecs[`sync_${ch.key}`];

                        return (
                            <div
                                key={ch.key}
                                onClick={() => !isComingSoon && setSelectedSyncs(isAdded
                                    ? selectedSyncs.filter(s => s !== ch.key)
                                    : [...selectedSyncs, ch.key])}
                                className={`w-full text-left p-6 rounded-2xl border transition-all duration-slow relative flex flex-col justify-between ${
                                    isComingSoon
                                        ? 'border-white/[0.04] bg-white/[0.01] opacity-60 cursor-not-allowed'
                                        : isAdded
                                            ? 'border-brand-400/50 bg-brand-500/[0.08] shadow-lg cursor-pointer'
                                            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 cursor-pointer'
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl flex-shrink-0 ${isAdded ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-ink-muted'}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-bold text-white">{ch.name}</span>
                                                    {isComingSoon && (
                                                        <span className="px-2 py-0.5 rounded-full text-4xs font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                            Coming Soon
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-2xs text-brand-300 font-bold mt-0.5">{ch.laymanTitle}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <span className="text-sm text-white font-bold whitespace-nowrap">
                                                +{fmt(ch.priceUSD, ch.pricePKR)}
                                            </span>
                                            <span className="text-3xs text-ink-muted">/month</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-ink-muted leading-relaxed mb-4">{ch.laymanDesc}</p>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
                                    <span className="text-3xs font-mono text-ink-muted">
                                        {isComingSoon ? 'In Development' : '3-second Bidirectional Sync'}
                                    </span>
                                    <span className={`text-2xs font-bold px-3 py-1 rounded-lg transition-all ${isAdded ? 'bg-brand-500 text-white' : 'bg-white/5 text-ink-muted'}`}>
                                        {isAdded ? 'Connected ✓' : isComingSoon ? 'Coming Soon' : 'Connect Channel'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                    <button
                        onClick={() => { setCurrentStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.06] text-ink-muted hover:text-neutral-200 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={13} /> Back to AI
                    </button>
                    <MagneticButton
                        id="sync-continue"
                        onClick={() => { setCurrentStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        variant="indigo"
                        className="px-8 py-3.5 text-xs font-bold uppercase tracking-widest"
                    >
                        {selectedSyncs.length > 0 ? `Continue with ${selectedSyncs.length} channel${selectedSyncs.length > 1 ? 's' : ''}` : 'Skip for now'} <ArrowRight size={13} />
                    </MagneticButton>
                </div>
            </div>
        </section>
    );

    // ── Step 4: Catalog Onboarding Services ─────────────────────────────────
    const renderOnboardingStep = () => {
        const hasEstimate = selectedTier && calcProductsNum > 0;

        return (
            <section className="min-h-screen px-6 py-24">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/15 text-brand-400 text-2xs font-bold tracking-widest uppercase mb-4">
                            Step 4 of 4
                        </div>
                        <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-3">
                            Want Us to Load Your Catalog?
                        </h2>
                        <p className="text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
                            Optional white-glove catalog migration. Pay only for what you need, per product. Or skip and upload yourself via CSV or SmartCapture.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {Object.values(SERVICE_TIERS).map((tier, idx) => {
                            const isChosen = selectedService === tier.key;
                            return (
                                <button
                                    key={tier.key}
                                    id={`service-tier-${tier.key}`}
                                    onClick={() => setSelectedService(isChosen ? null : tier.key)}
                                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-slow
                                    ${isChosen
                                        ? 'bg-brand-600/[0.08] border-brand-500/40'
                                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${isChosen ? 'border-brand-400 bg-brand-500' : 'border-neutral-700'}`}>
                                                {isChosen && <Check size={9} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-lg">{tier.emoji}</span>
                                                    <span className="text-ink font-bold text-sm">{tier.name}</span>
                                                    {idx === 1 && <span className="px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-4xs font-bold tracking-widest uppercase">Popular</span>}
                                                </div>
                                                <p className="text-ink-muted text-xs mt-1 leading-relaxed">{tier.desc}</p>
                                                <p className="text-ink-muted text-2xs mt-1.5 font-semibold">⏱ Turnaround: {tier.sla}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-ink font-bold text-lg">{fmt(tier.priceUSD, tier.pricePKR)}</div>
                                            <div className="text-3xs text-ink-muted font-bold uppercase tracking-widest">per product</div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Nav */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                        <button
                            onClick={() => { setCurrentStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.06] text-ink-muted hover:text-neutral-200 text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft size={13} /> Back
                        </button>
                        <MagneticButton
                            id="onboarding-continue"
                            onClick={() => { setCurrentStep(5); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            variant="indigo"
                            className="px-8 py-3.5 text-xs font-bold uppercase tracking-widest"
                        >
                            {selectedService ? 'Continue with Setup' : 'Continue to Checkout'} <ArrowRight size={13} />
                        </MagneticButton>
                    </div>
                </div>
            </section>
        );
    };

    // ── Step 5: Checkout & Card Collection ──────────────────────────────────
    const renderCheckout = () => {
        const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const trialEndStr = trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        return (
            <section className="min-h-screen px-6 py-24">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-2xs font-bold tracking-widest uppercase mb-3">
                            Secure Activation
                        </div>
                        <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-2">Review & Activate</h2>
                        <p className="text-ink-muted text-sm">Everything you've selected. Transparent. Verified.</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Left: Order Summary */}
                        <div className="flex-1 w-full space-y-4">
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-4">Your Selected Plan</div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-ink font-bold text-lg">{selectedPlan && PLAN_DATA[selectedPlan]?.name}</div>
                                        <div className="text-ink-muted text-xs mt-0.5">
                                            {selectedPlan === 'solo' ? 'Free forever' : '14-day free trial → then auto-renews'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-ink-secondary font-bold text-lg">
                                            {selectedPlan && fmt(planPrice(selectedPlan), planPricePKR(selectedPlan), selectedPlan === 'solo' ? '' : '/mo')}
                                        </div>
                                        <div className="text-emerald-400 text-2xs font-bold">$0.00 today</div>
                                    </div>
                                </div>

                                {selectedAIData && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
                                        <div>
                                            <div className="text-ink font-bold text-sm">{selectedAIData.emoji} {selectedAIData.name}</div>
                                            <div className="text-ink-muted text-xs mt-0.5">Managed AI allowance</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-ink-secondary font-bold">+{fmt(selectedAIData.priceUSD, selectedAIData.pricePKR, '/mo')}</div>
                                            <div className="text-emerald-400 text-2xs font-bold">$0.00 today</div>
                                        </div>
                                    </div>
                                )}

                                {selectedAI === 'byok' && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
                                        <div>
                                            <div className="text-ink font-bold text-sm">🔑 BYOK Platform Activation</div>
                                            <div className="text-ink-muted text-xs mt-0.5">One-time unlock fee</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-amber-400 font-bold">{fmt(19, 5300)}</div>
                                            <div className="text-amber-400 text-2xs font-bold">charged today</div>
                                        </div>
                                    </div>
                                )}

                                {selectedSyncs.length > 0 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
                                        <div>
                                            <div className="text-ink font-bold text-sm">{selectedSyncs.length} Channel Sync{selectedSyncs.length > 1 ? 's' : ''}</div>
                                            <div className="text-ink-muted text-xs mt-0.5">{selectedSyncs.join(', ')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-ink-secondary font-bold">+{fmt(syncCostUSD, syncCostPKR, '/mo')}</div>
                                            <div className="text-emerald-400 text-2xs font-bold">$0.00 today</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Billing Timeline */}
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-5">Your Billing Timeline</div>
                                <div className="space-y-5 relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-white/[0.05]">
                                    <div className="relative">
                                        <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-emerald-400" />
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-ink text-xs font-bold">Today</span>
                                            <span className="text-emerald-400 text-xs font-bold">{fmt(totalDueToday, pkrTotalDueToday)}</span>
                                        </div>
                                        <p className="text-ink-muted text-2xs">
                                            {selectedPlan === 'solo'
                                                ? 'Solo plan activated immediately for free.'
                                                : totalDueToday > 0
                                                    ? 'BYOK activation processed. 14-day trial begins.'
                                                    : 'Card authorized ($0.00 charge). 14-day free trial begins immediately.'}
                                        </p>
                                    </div>
                                    {selectedPlan !== 'solo' && (
                                        <div className="relative">
                                            <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-brand-500" />
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-ink text-xs font-bold">{trialEndStr}</span>
                                                <span className="text-brand-400 text-xs font-bold">{fmt(totalMonthlyCost, pkrTotalMonthlyCost, '/mo')}</span>
                                            </div>
                                            <p className="text-ink-muted text-2xs">
                                                First subscription charge — only if you choose to continue. Reminder sent on day 11. Cancel anytime with 1 click.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Due Today Card */}
                            <div className="p-5 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-between">
                                <div>
                                    <div className="text-ink font-bold text-sm">Due today</div>
                                    <div className="text-ink-muted text-2xs">{totalDueToday > 0 ? 'BYOK activation fee' : 'Nothing. 14-day trial is free.'}</div>
                                </div>
                                <div className="text-3xl font-bold text-emerald-400 font-display">
                                    {fmt(totalDueToday, pkrTotalDueToday)}
                                </div>
                            </div>
                        </div>

                        {/* Right: Secure Payment Form (ALWAYS Active for Paid Plans) */}
                        <div className="w-full lg:w-[420px] bg-white/[0.02] border border-white/[0.08] rounded-2xl p-7 shadow-2xl">
                            <form onSubmit={handleFormSubmit} className="space-y-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Lock size={14} className="text-brand-400" />
                                        <span className="text-xs font-bold text-ink uppercase tracking-widest">Account Details</span>
                                    </div>
                                    <span className="text-3xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        256-Bit SSL
                                    </span>
                                </div>

                                <div>
                                    <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Business Email</label>
                                    <input
                                        type="email" required placeholder="owner@company.com"
                                        value={checkoutDetails.email}
                                        onChange={e => setCheckoutDetails({ ...checkoutDetails, email: e.target.value })}
                                        className="w-full bg-black/40 border border-white/[0.08] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Phone Number</label>
                                    <input
                                        type="tel" required placeholder="+1 (555) 000-0000"
                                        value={checkoutDetails.phone}
                                        onChange={e => setCheckoutDetails({ ...checkoutDetails, phone: e.target.value })}
                                        className="w-full bg-black/40 border border-white/[0.08] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                                    />
                                </div>

                                {isCardRequired ? (
                                    <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <CreditCard size={13} className="text-brand-400" /> Payment Method
                                            </span>
                                            <span className="text-3xs text-ink-muted flex items-center gap-1">
                                                <Lock size={10} /> Card Authorized ($0.00)
                                            </span>
                                        </div>

                                        <div>
                                            <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Cardholder Name</label>
                                            <input
                                                type="text" required placeholder="Jane Doe"
                                                value={checkoutDetails.cardholder}
                                                onChange={e => setCheckoutDetails({ ...checkoutDetails, cardholder: e.target.value })}
                                                className="w-full bg-black/40 border border-white/[0.08] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Card Number</label>
                                            <input
                                                type="text" required placeholder="4242 •••• •••• 4242" maxLength={19}
                                                value={checkoutDetails.cardNumber}
                                                onChange={e => setCheckoutDetails({ ...checkoutDetails, cardNumber: e.target.value })}
                                                className="w-full bg-black/40 border border-white/[0.08] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono outline-none transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Expiry</label>
                                                <input
                                                    type="text" required placeholder="MM/YY" maxLength={5}
                                                    value={checkoutDetails.expiry}
                                                    onChange={e => setCheckoutDetails({ ...checkoutDetails, expiry: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/[0.08] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono text-center outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">CVC</label>
                                                <input
                                                    type="password" required placeholder="•••" maxLength={4}
                                                    value={checkoutDetails.cvc}
                                                    onChange={e => setCheckoutDetails({ ...checkoutDetails, cvc: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/[0.08] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono text-center outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <p className="text-3xs text-ink-muted leading-relaxed">
                                            🔒 Encrypted connection. Card authorized today ($0.00 charge). Your subscription starts after 14 days and you can cancel anytime before then.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-white/[0.05]">
                                        <div className="p-3.5 rounded-xl bg-teal-500/[0.05] border border-teal-500/15 flex items-start gap-2.5">
                                            <CheckCircle2 size={14} className="text-teal-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-1xs text-ink-muted leading-relaxed">
                                                Solo Free Plan selected. Your store is activated immediately with free-forever limits.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    id="checkout-submit"
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-slow flex items-center justify-center gap-2
                                    ${isSubmitting
                                        ? 'bg-white/20 text-ink-muted cursor-not-allowed'
                                        : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white shadow-lg shadow-brand-500/25'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <span>Authorizing & Setting Up...</span>
                                    ) : (
                                        <>{isCardRequired ? 'Authorize & Start 14-Day Free Trial' : 'Activate Free Solo Plan'} <ArrowRight size={14} /></>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setCurrentStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="w-full text-center text-ink-muted hover:text-white text-3xs font-bold uppercase tracking-widest transition-colors"
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

    // ── Step 6: Confirmation Screen ─────────────────────────────────────────
    const renderConfirmation = () => {
        const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const trialEndStr = trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        return (
            <section className="min-h-screen px-6 py-24 flex items-center justify-center">
                <div className="max-w-2xl w-full">
                    <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-b from-neutral-900 to-void-950 p-10 md:p-12 text-center relative overflow-hidden shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} className="text-brand-400" />
                        </div>

                        <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-2">You're in.</h2>
                        <p className="text-ink-muted text-sm mb-8">Your account has been activated. Here's what happens next.</p>

                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left space-y-3 mb-6">
                            <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-3">Your Plan Summary</div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ink-secondary">{selectedPlan && PLAN_DATA[selectedPlan]?.name}</span>
                                <span className="text-ink-muted font-semibold">{selectedPlan && fmt(planPrice(selectedPlan), planPricePKR(selectedPlan), selectedPlan === 'solo' ? '' : '/mo')}</span>
                            </div>
                            {selectedAIData && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-ink-secondary">{selectedAIData.emoji} {selectedAIData.name}</span>
                                    <span className="text-ink-muted font-semibold">+{fmt(selectedAIData.priceUSD, selectedAIData.pricePKR, '/mo')}</span>
                                </div>
                            )}
                            {selectedSyncs.length > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-ink-secondary">{selectedSyncs.length} Channel Sync{selectedSyncs.length > 1 ? 's' : ''}</span>
                                    <span className="text-ink-muted font-semibold">+{fmt(syncCostUSD, syncCostPKR, '/mo')}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left space-y-4 mb-6">
                            <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest">Next Steps</div>
                            {[
                                { dot: 'bg-emerald-400', title: 'Right now', desc: `Your ${selectedPlan === 'solo' ? 'Solo store' : '14-day free trial'} is active. Log in to start configuring products and registers.` },
                                ...(selectedPlan !== 'solo' ? [{ dot: 'bg-brand-400', title: trialEndStr, desc: `Trial ends. Subscription starts at ${fmt(totalMonthlyCost, pkrTotalMonthlyCost, '/mo')} — cancel anytime before from your dashboard.` }] : []),
                            ].map((step, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${step.dot}`} />
                                    <div>
                                        <div className="text-ink text-xs font-bold mb-0.5">{step.title}</div>
                                        <div className="text-ink-muted text-1xs leading-relaxed">{step.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <MagneticButton
                            id="goto-dashboard"
                            href="/login"
                            variant="primary"
                            className="px-10 py-4 text-sm font-bold uppercase tracking-widest"
                        >
                            Go to Dashboard <ArrowRight size={15} />
                        </MagneticButton>
                    </div>
                </div>
            </section>
        );
    };

    // ── Step Progress Indicator ─────────────────────────────────────────────
    const renderStepBar = () => {
        if (currentStep === 1 || currentStep === 6) return null;
        const steps = [
            { n: 1, label: 'Plan' },
            { n: 2, label: 'AI Engine' },
            { n: 3, label: 'Sync' },
            { n: 4, label: 'Setup' },
            { n: 5, label: 'Checkout' },
        ];
        return (
            <div className="sticky top-[64px] z-40 bg-void-950/90 backdrop-blur-xl border-b border-white/[0.05] py-3 px-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
                    {steps.map((s) => {
                        const done = currentStep > s.n;
                        const active = currentStep === s.n;
                        return (
                            <div key={s.n} className={`flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider transition-colors ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-ink-muted'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-3xs transition-all ${active ? 'bg-brand-600 text-white' : done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-ink-muted'}`}>
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
            description="Priced like software. Not like a project. Transparent plans for single stores and multi-branch operations. 14-day free trial."
        >
            {renderStepBar()}
            {currentStep === 1 && renderPricingPage()}
            {currentStep === 2 && renderAIStep()}
            {currentStep === 3 && renderSyncStep()}
            {currentStep === 4 && renderOnboardingStep()}
            {currentStep === 5 && renderCheckout()}
            {currentStep === 6 && renderConfirmation()}
        </MarketingLayout>
    );
}
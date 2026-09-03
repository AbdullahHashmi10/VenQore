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
 className={`flex-shrink-0 mt-0.5 transition-all duration-slow ${open ? 'rotate-180 text-brand-400' : 'text-ink-muted group-hover:text-neutral-300'}`}
 />
 </button>
 <div className={`overflow-hidden transition-all duration-slower ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'max-h-80 pb-6' : 'max-h-0'}`}>
 <p className="text-sm text-ink-muted leading-relaxed">{answer}</p>
 </div>
 </div>
 );
};

// ── Comparison Table Row ───────────────────────────────────────────────
const TableRow = ({ label, starter, growth, enterprise, highlight }) => (
 <tr className={`border-b border-white/[0.04] transition-colors ${highlight ? 'bg-white/[0.015]' : 'hover:bg-white/[0.01]'}`}>
 <td className="py-3.5 pl-6 pr-4 text-xs text-ink-muted font-medium">{label}</td>
 <td className="py-3.5 px-4 text-center text-xs">
 {typeof starter === 'boolean'
 ? (starter ? <Check size={14} className="mx-auto text-brand-600 dark:text-brand-400" /> : <X size={14} className="mx-auto text-ink-muted" />)
 : <span className="text-ink-secondary font-semibold">{starter}</span>}
 </td>
 <td className="py-3.5 px-4 text-center text-xs bg-brand-950/20">
 {typeof growth === 'boolean'
 ? (growth ? <Check size={14} className="mx-auto text-brand-600 dark:text-brand-400" /> : <X size={14} className="mx-auto text-ink-muted" />)
 : <span className="text-ink-secondary font-semibold">{growth}</span>}
 </td>
 <td className="py-3.5 pr-6 pl-4 text-center text-xs">
 {typeof enterprise === 'boolean'
 ? (enterprise ? <Check size={14} className="mx-auto text-brand-400" /> : <X size={14} className="mx-auto text-ink-muted" />)
 : <span className="text-ink-secondary font-semibold">{enterprise}</span>}
 </td>
 </tr>
);

// ── Billing Toggle ─────────────────────────────────────────────────────
const BillingToggle = ({ value, onChange }) => {
 const options = [
 { key: 'subscription_monthly', label: 'Monthly' },
 { key: 'subscription_annual', label: 'Annual', badge: 'Save 20%' },
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
 <span className="absolute -top-2.5 -right-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-4xs font-bold rounded-full whitespace-nowrap">
 {opt.badge}
 </span>
 )}
 </button>
 ))}
 </div>
 );
};

// ── Main Component ─────────────────────────────────────────────────────
export default function Pricing({ plans = [] }) {
 const { geo = { country: 'US', currency: 'USD', symbol: '$' }, auth } = usePage().props;
 // ── PKR MASTER SWITCH ──────────────────────────────────────────────
 // Set to true to re-enable all Pakistani PKR pricing UI (banner, toggle,
 // Rs estimates). Kept OFF for the USD-only launch. Flip to true to restore.
 const PKR_ENABLED = false;
 const isPK = PKR_ENABLED && geo.currency === 'PKR';

 const [billingType, setBillingType] = useState('subscription_annual');
 const [currencyDisplay, setCurrencyDisplay] = useState('USD');
 const [selectedPlan, setSelectedPlan] = useState('growth');
 const [selectedAI, setSelectedAI] = useState('none');
 const [currentStep, setCurrentStep] = useState(1); // 1=pricing page, 2=ai engine, 3=sync, 4=onboarding, 5=checkout, 6=confirmation
 const [expandedCards, setExpandedCards] = useState({ starter: false, growth: false, enterprise: false });
 const toggleCardExpand = (key) => setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
 const [selectedSyncs, setSelectedSyncs] = useState([]);
 const [selectedService, setSelectedService] = useState(null); // 'basic' | 'descriptions' | 'images'
 const [calcProducts, setCalcProducts] = useState('');
 const [calcVariants, setCalcVariants] = useState('');
 const [trialMode, setTrialMode] = useState('instant');
 const [checkoutDetails, setCheckoutDetails] = useState({ email: '', phone: '', cardholder: '', cardNumber: '', expiry: '', cvc: '' });
 const [isSubmitting, setIsSubmitting] = useState(false);
 const aiSectionRef = useRef(null);
 const confirmSectionRef = useRef(null);

 const isLTD = false;

 useEffect(() => {
 setSelectedAI('none');
 }, [selectedPlan]);

 const handleCurrencyOverride = (country) => {
 router.post(route('marketing.pricing.override'), { country }, { preserveScroll: true });
 };

 // Price helpers — default fallbacks
 const defaultPricesUSD = {
 starter: { subscription_monthly: 36, subscription_annual: 30 },
 growth: { subscription_monthly: 63, subscription_annual: 53 },
 enterprise: { subscription_monthly: 129, subscription_annual: 108 },
 };
 const defaultPricesPKR = {
 starter: { subscription_monthly: 1100, subscription_annual: 916 },
 growth: { subscription_monthly: 1800, subscription_annual: 1500 },
 enterprise: { subscription_monthly: 5300, subscription_annual: 4416 },
 };

 const PRICES_USD = { ...defaultPricesUSD };
 const PRICES_PKR = { ...defaultPricesPKR };

 // Override dynamically from database plans if populated
 if (plans && plans.length > 0) {
 plans.forEach(plan => {
 const baseSlug = plan.slug === 'business' ? 'enterprise' : plan.slug;
 
 if (baseSlug === 'starter' || baseSlug === 'growth' || baseSlug === 'enterprise') {
 if (plan.type === 'subscription') {
 // USD values
 PRICES_USD[baseSlug].subscription_monthly = parseFloat(plan.price_monthly_usd || plan.price_monthly || defaultPricesUSD[baseSlug].subscription_monthly);
 PRICES_USD[baseSlug].subscription_annual = plan.price_annual_usd ? Math.round(parseFloat(plan.price_annual_usd) / 12) : (plan.price_annual ? Math.round(parseFloat(plan.price_annual) / 12) : defaultPricesUSD[baseSlug].subscription_annual);
 
 // PKR values
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
 const planPriceStr = (key) => fmt(planPrice(key), planPricePKR(key), isLTD ? '' : '/mo', false);

 const pricingProps = usePage().props.pricing || {};
 const aiTiersFromProp = pricingProps.ai_tiers || {};

 // Dynamic AI Options — reading directly from single source of truth (config('pricing'))
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
 { name: 'Language Support', value: 'Handwritten & printed (English, Urdu, Hindi, Arabic numerals)' },
 { name: 'Safety Guard', value: 'Review screen first — never posts to ledger unconfirmed' },
 { name: 'Self-Verification', value: 'Auto checks line totals (qty × price = total)' },
 ]
 }))
 : [
 { key: 'spark', name: 'Smart Capture Spark', emoji: '🌱', tagline: 'Small Retailer', priceUSD: 3, pricePKR: 840, popular: false },
 { key: 'shop', name: 'Smart Capture Shop', emoji: '⚡', tagline: 'Busy Store', priceUSD: 6, pricePKR: 1680, popular: true },
 { key: 'pro', name: 'Smart Capture Pro', emoji: '🚀', tagline: 'High Volume', priceUSD: 12, pricePKR: 3360, popular: false },
 { key: 'max', name: 'Smart Capture Max', emoji: '👑', tagline: 'Enterprise', priceUSD: 24, pricePKR: 6720, popular: false },
 ];

 const selectedAIData = ALL_AI_OPTIONS.find(o => o.key === selectedAI || `opt_${o.key}` === selectedAI) ?? null;

 // USD costs
 const aiCostUSD = selectedAI === 'byok' ? 5
 : selectedAIData ? selectedAIData.priceUSD : 0;
 // PKR costs
 const aiCostPKR = selectedAI === 'byok' ? 1400
 : selectedAIData ? selectedAIData.pricePKR : 0;

 const aiIsMonthly = selectedAI !== 'none' && selectedAI !== 'byok';

 // USD sync cost
 const syncCostUSD = selectedSyncs.length * 10;
 // PKR sync cost
 const syncCostPKR = selectedSyncs.length * 2800;

 // For backward compatibility / global total calculations
 const aiCostNum = aiCostUSD;
 const syncCostNum = syncCostUSD;

 // ── Per-product service tiers ──
 const SERVICE_TIERS = {
 basic: { key: 'basic', name: 'Basic Upload', emoji: '📦', priceUSD: 1.00, pricePKR: 100, variantExtraUSD: 0.50, variantExtraPKR: 50, sla: '2–3 business days', desc: 'Product data uploaded with all core fields. Up to 5 variants per product included.' },
 descriptions: { key: 'descriptions', name: '+ Rich Descriptions', emoji: '✍️', priceUSD: 1.50, pricePKR: 150, variantExtraUSD: 0.50, variantExtraPKR: 50, sla: '3–5 business days', desc: 'Everything in Basic + long descriptions, SEO copy, and full product detail. You provide images.' },
 images: { key: 'images', name: '+ AI Images', emoji: '🎨', priceUSD: 2.00, pricePKR: 200, variantExtraUSD: 0.50, variantExtraPKR: 50, sla: '4–6 business days', desc: 'Everything in Descriptions + we source or AI-generate product images for you.' },
 };

 // Calculator logic
 const calcProductsNum = Math.max(0, parseInt(calcProducts) || 0);
 const calcVariantsNum = Math.max(1, parseInt(calcVariants) || 1);
 const selectedTier = selectedService ? SERVICE_TIERS[selectedService] : null;
 const extraBlocks = calcVariantsNum > 5 ? Math.ceil((calcVariantsNum - 5) / 5) : 0;
 
 // USD per product
 const usdPricePerProduct = selectedTier
 ? selectedTier.priceUSD + extraBlocks * selectedTier.variantExtraUSD
 : 0;
 // PKR per product estimate
 const pkrPricePerProduct = selectedTier
 ? selectedTier.pricePKR + extraBlocks * selectedTier.variantExtraPKR
 : 0;

 const usdServiceCostNum = calcProductsNum * usdPricePerProduct;
 const pkrServiceCostNum = calcProductsNum * pkrPricePerProduct;

 // Alias for downstream compatibility
 const serviceCostNum = usdServiceCostNum;

 const selectedServiceData = selectedTier ? {
 name: selectedTier.name,
 subtitle: `${calcProductsNum} product${calcProductsNum !== 1 ? 's' : ''}`,
 sla: selectedTier.sla,
 cost: usdServiceCostNum,
 pkrCost: pkrServiceCostNum,
 } : null;

 const usdTotalMonthlyCost = selectedPlan ? planPrice(selectedPlan) + (aiIsMonthly ? aiCostUSD : 0) + syncCostUSD : 0;
 const pkrTotalMonthlyCost = selectedPlan ? planPricePKR(selectedPlan) + (aiIsMonthly ? aiCostPKR : 0) + syncCostPKR : 0;

 const totalMonthlyCost = usdTotalMonthlyCost;

 const usdTotalDueToday = selectedAI === 'byok' ? 5 : 0;
 const pkrTotalDueToday = selectedAI === 'byok' ? 1400 : 0;

 const totalDueToday = usdTotalDueToday;
 const isCardRequired = selectedAI !== 'none' || selectedSyncs.length > 0 || !!selectedService || trialMode === 'deferred';

 const getActivePlanSlug = (key) => {
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
 'WhatsApp Debt Alerts (Coming Soon)',
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

 const FULL_FEATURE_LIST = {
 starter: {
 totalIncluded: 18,
 totalSuite: 32,
 ratioLabel: '18 of 32 Features Included',
 categorizedFeatures: [
 { category: 'Platform Limits', name: '1 Store Location', included: true },
 { category: 'Platform Limits', name: '3 Staff Accounts', included: true },
 { category: 'Platform Limits', name: '1,000 Product SKUs', included: true },
 { category: 'Platform Limits', name: '14-Day Free Trial', included: true },
 { category: 'Platform Limits', name: 'Multi-Branch Sync', included: false },

 { category: 'POS & Checkout', name: 'Full POS Checkout', included: true },
 { category: 'POS & Checkout', name: 'Barcode Scanner Integration', included: true },
 { category: 'POS & Checkout', name: 'WebUSB Thermal Printing', included: true },
 { category: 'POS & Checkout', name: 'Multi-Tab Checkout (3 Tabs)', included: true },
 { category: 'POS & Checkout', name: 'Park & Recall Bills', included: true },
 { category: 'POS & Checkout', name: 'Split Payments (Cash/Card/Khata)', included: true },
 { category: 'POS & Checkout', name: 'Serial / IMEI Lifecycle Tracking', included: false },

 { category: 'Inventory', name: 'Product Variants & FIFO Valuation', included: true },
 { category: 'Inventory', name: 'Batch & Expiry Date Tracking', included: false },
 { category: 'Inventory', name: 'Bill of Materials (Recipes)', included: false },
 { category: 'Inventory', name: 'Auto-Assembly Production Runs', included: false },

 { category: 'Finance & Ledger', name: 'Double-Entry Khata Ledger', included: true },
 { category: 'Finance & Ledger', name: 'Customer Credit Ledger', included: true },
 { category: 'Finance & Ledger', name: 'WhatsApp Debt Alerts (Coming Soon)', included: false },
 { category: 'Finance & Ledger', name: 'Bank Feed Reconciliation', included: false },
 { category: 'Finance & Ledger', name: 'Customer Loyalty & Gift Cards', included: false },

 { category: 'Reports', name: 'Sales & Purchase Reports', included: true },
 { category: 'Reports', name: 'Profit & Loss Statement (P&L)', included: true },
 { category: 'Reports', name: 'Cash Flow Statement', included: true },
 { category: 'Reports', name: 'Balance Sheet Statement', included: false },
 { category: 'Reports', name: '40-Report Full Analytics Suite', included: false },

 { category: 'AI & E-Commerce', name: 'Vena AI Support Chat', included: true },
 { category: 'AI & E-Commerce', name: '10 Lifetime Free AI Scans', included: true },
 { category: 'AI & E-Commerce', name: 'Managed AI Add-ons (From $3/mo)', included: true },
 { category: 'AI & E-Commerce', name: 'BYOK AI Key Unlock ($5 once)', included: true },
 { category: 'AI & E-Commerce', name: 'VenSynQ Marketplace Sync ($10/mo)', included: true },

 { category: 'Support', name: 'Email Support', included: true },
 { category: 'Support', name: 'Live Agent Chat Support', included: false },
 { category: 'Support', name: '24/7 Priority SLA & Dedicated Account Manager', included: false },
 ]
 },
 growth: {
 totalIncluded: 26,
 totalSuite: 32,
 ratioLabel: '26 of 32 Features Included',
 categorizedFeatures: [
 { category: 'Platform Limits', name: '3 Store Locations', included: true },
 { category: 'Platform Limits', name: '10 Staff Accounts', included: true },
 { category: 'Platform Limits', name: '10,000 Product SKUs', included: true },
 { category: 'Platform Limits', name: '14-Day Free Trial', included: true },
 { category: 'Platform Limits', name: '3-Store Multi-Branch Sync', included: true },

 { category: 'POS & Checkout', name: 'Full POS Checkout', included: true },
 { category: 'POS & Checkout', name: 'Barcode Scanner Integration', included: true },
 { category: 'POS & Checkout', name: 'WebUSB Thermal Printing', included: true },
 { category: 'POS & Checkout', name: 'Multi-Tab Checkout (10 Tabs)', included: true },
 { category: 'POS & Checkout', name: 'Park & Recall Bills', included: true },
 { category: 'POS & Checkout', name: 'Split Payments (Cash/Card/Khata)', included: true },
 { category: 'POS & Checkout', name: 'Serial / IMEI Lifecycle Tracking', included: false },

 { category: 'Inventory', name: 'Product Variants & FIFO Valuation', included: true },
 { category: 'Inventory', name: 'Batch & Expiry Date Tracking', included: true },
 { category: 'Inventory', name: 'Bill of Materials (Recipes)', included: true },
 { category: 'Inventory', name: 'Auto-Assembly Production Runs', included: false },

 { category: 'Finance & Ledger', name: 'Double-Entry Khata Ledger', included: true },
 { category: 'Finance & Ledger', name: 'Customer Credit Ledger', included: true },
 { category: 'Finance & Ledger', name: 'WhatsApp Debt Alerts (Coming Soon)', included: false },
 { category: 'Finance & Ledger', name: 'Bank Feed Reconciliation', included: true },
 { category: 'Finance & Ledger', name: 'Customer Loyalty & Gift Cards', included: false },

 { category: 'Reports', name: 'Sales & Purchase Reports', included: true },
 { category: 'Reports', name: 'Profit & Loss Statement (P&L)', included: true },
 { category: 'Reports', name: 'Cash Flow Statement', included: true },
 { category: 'Reports', name: 'Balance Sheet Statement', included: true },
 { category: 'Reports', name: '40-Report Full Analytics Suite', included: false },

 { category: 'AI & E-Commerce', name: 'Vena AI Support Chat', included: true },
 { category: 'AI & E-Commerce', name: '10 Lifetime Free AI Scans', included: true },
 { category: 'AI & E-Commerce', name: 'Managed AI Add-ons (From $5/mo)', included: true },
 { category: 'AI & E-Commerce', name: 'BYOK AI Key Unlock ($5 once)', included: true },
 { category: 'AI & E-Commerce', name: 'VenSynQ Marketplace Sync ($10/mo)', included: true },

 { category: 'Support', name: 'Email Support', included: true },
 { category: 'Support', name: 'Live Agent Chat Support', included: true },
 { category: 'Support', name: '24/7 Priority SLA & Dedicated Account Manager', included: false },
 ]
 },
 enterprise: {
 totalIncluded: 32,
 totalSuite: 32,
 ratioLabel: 'All 32 Features Included',
 categorizedFeatures: [
 { category: 'Platform Limits', name: '10 Store Locations', included: true },
 { category: 'Platform Limits', name: '50 Staff Accounts', included: true },
 { category: 'Platform Limits', name: '50,000 Product SKUs', included: true },
 { category: 'Platform Limits', name: '14-Day Free Trial', included: true },
 { category: 'Platform Limits', name: 'Multi-Branch Sync', included: true },

 { category: 'POS & Checkout', name: 'Full POS Checkout', included: true },
 { category: 'POS & Checkout', name: 'Barcode Scanner Integration', included: true },
 { category: 'POS & Checkout', name: 'WebUSB Thermal Printing', included: true },
 { category: 'POS & Checkout', name: 'Multi-Tab Checkout (50 Tabs)', included: true },
 { category: 'POS & Checkout', name: 'Park & Recall Bills', included: true },
 { category: 'POS & Checkout', name: 'Split Payments (Cash/Card/Khata)', included: true },
 { category: 'POS & Checkout', name: 'Serial / IMEI Lifecycle Tracking', included: true },

 { category: 'Inventory', name: 'Product Variants & FIFO Valuation', included: true },
 { category: 'Inventory', name: 'Batch & Expiry Date Tracking', included: true },
 { category: 'Inventory', name: 'Bill of Materials (Recipes)', included: true },
 { category: 'Inventory', name: 'Auto-Assembly Production Runs', included: true },

 { category: 'Finance & Ledger', name: 'Double-Entry Khata Ledger', included: true },
 { category: 'Finance & Ledger', name: 'Customer Credit Ledger', included: true },
 { category: 'Finance & Ledger', name: 'WhatsApp Debt Alerts (Coming Soon)', included: false },
 { category: 'Finance & Ledger', name: 'Bank Feed Reconciliation', included: true },
 { category: 'Finance & Ledger', name: 'Customer Loyalty & Gift Cards', included: true },

 { category: 'Reports', name: 'Sales & Purchase Reports', included: true },
 { category: 'Reports', name: 'Profit & Loss Statement (P&L)', included: true },
 { category: 'Reports', name: 'Cash Flow Statement', included: true },
 { category: 'Reports', name: 'Balance Sheet Statement', included: true },
 { category: 'Reports', name: '40-Report Full Analytics Suite', included: true },

 { category: 'AI & E-Commerce', name: 'Vena AI Support Chat', included: true },
 { category: 'AI & E-Commerce', name: '10 Lifetime Free AI Scans', included: true },
 { category: 'AI & E-Commerce', name: 'Managed AI Add-ons (From $15/mo)', included: true },
 { category: 'AI & E-Commerce', name: 'BYOK AI Key Unlock ($5 once)', included: true },
 { category: 'AI & E-Commerce', name: 'VenSynQ Marketplace Sync ($10/mo)', included: true },

 { category: 'Support', name: 'Email Support', included: true },
 { category: 'Support', name: 'Live Agent Chat Support', included: true },
 { category: 'Support', name: '24/7 Priority SLA & Dedicated Account Manager', included: true },
 ]
 }
 };

 const PLAN_DATA = {
 starter: {
 name: 'Starter Engine',
 tagline: 'Single-location stores getting serious about POS & inventory.',
 icon: Zap,
 color: 'blue',
 accentFrom: 'from-blue-500/[0.08]',
 accentBorder: 'border-blue-500/30',
 accentGlow: '',
 iconBg: 'bg-blue-500/10 text-blue-400',
 badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
 inheritLabel: null,
 totalIncluded: 18,
 ratioLabel: '18 of 32 Features Included',
 includes: getPlanIncludes('starter'),
 excludes: getPlanExcludes('starter'),
 },
 growth: {
 name: 'Growth Engine',
 tagline: 'Expanding outlets that need multi-location stock routing.',
 icon: TrendingUp,
 color: 'indigo',
 accentFrom: 'from-brand-500/[0.10]',
 accentBorder: 'border-brand-500/40',
 accentGlow: '',
 iconBg: 'bg-brand-500/10 text-brand-400',
 badgeBg: 'bg-brand-500/10 border-brand-500/20 text-brand-300',
 popular: true,
 inheritLabel: 'Everything in Starter Engine, plus:',
 totalIncluded: 26,
 ratioLabel: '26 of 32 Features Included',
 includes: getPlanIncludes('growth'),
 excludes: getPlanExcludes('growth'),
 },
 enterprise: {
 name: 'Enterprise Engine',
 tagline: 'Multi-channel operators demanding full-scale operations.',
 icon: Crown,
 color: 'purple',
 accentFrom: 'from-brand-500/[0.08]',
 accentBorder: 'border-brand-500/30',
 accentGlow: '',
 iconBg: 'bg-brand-500/10 text-brand-400',
 badgeBg: 'bg-brand-500/10 border-brand-500/20 text-brand-300',
 inheritLabel: 'Everything in Growth Engine, plus:',
 totalIncluded: 32,
 ratioLabel: 'All 32 Features Included',
 includes: getPlanIncludes('enterprise'),
 excludes: getPlanExcludes('enterprise'),
 },
 };

 const [expandedNerdSpecs, setExpandedNerdSpecs] = useState({});
 const toggleNerdSpec = (key) => setExpandedNerdSpecs(prev => ({ ...prev, [key]: !prev[key] }));

 const SYNC_CHANNELS = [
 {
 key: 'woocommerce',
 name: 'WooCommerce Integration',
 icon: Globe,
 priceUSD: 10,
 pricePKR: 2800,
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
 priceUSD: 10,
 pricePKR: 2800,
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
 priceUSD: 10,
 pricePKR: 2800,
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
 priceUSD: 10,
 pricePKR: 2800,
 comingSoon: true,
 laymanTitle: 'Automate eBay Listings & Order Imports',
 laymanDesc: 'Automatically sync physical POS sales with your eBay seller listings so quantities are always 100% accurate.',
 laymanHighlights: [
 '🏷️ Sync store inventory with active eBay auction & buy-it-now listings',
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
 priceUSD: 10,
 pricePKR: 2800,
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
 { id: 'faq-trial', q: 'Do I need a credit card to start my trial?', a: 'No. If you select a base plan without any AI add-on, sync integration, or onboarding service, your 14-day trial starts immediately with zero card details required. A card is only needed if you add an AI plan, connect a sync channel, or select an onboarding service.' },
 { id: 'faq-ai-cost', q: 'What is the $5 one-time BYOK fee for?', a: 'Bringing Your Own API Key (BYOK) means you connect your own OpenAI or Gemini key. We charge a one-time $5 platform activation fee to unlock the AI routing layer in your account. After that, you are billed directly by your AI provider — we charge you nothing ongoing. This fee does not expire and has no hidden conditions.' },
 { id: 'faq-ai-monthly', q: 'How does managed AI billing work?', a: 'Managed AI plans (AI Core, AI Lite, AI Pro, AI Ultimate) are monthly add-ons. We handle the infrastructure, models, and usage. You pay us a flat monthly fee and we take care of the rest. There is no usage surprise billing — your monthly cap is shown clearly on your plan.' },
 { id: 'faq-scans-allowance', q: 'How many Smart Capture scans do I get, and what happens when I run out?', a: 'Every plan comes with monthly free Smart Capture pages (Counter gets 10, Starter gets 25, Growth gets 100, and Business gets 500). Smart Capture add-ons provide larger monthly quotas: Spark (500 pages/mo), Shop (1000 pages/mo), Pro (2000 pages/mo), and Max (4000 pages/mo). When you reach your monthly limit, Smart Capture extraction pauses until your next billing cycle, or you can add your own OpenAI/Gemini API key (BYOK) for unlimited scans.' },
 { id: 'faq-scan-definition', q: 'What counts as one Smart Capture page scan?', a: 'Every single invoice page or receipt image processed counts as 1 page scan. A document with multiple pages is calculated page-by-page (e.g. a 3-page supplier PDF invoice will count as 3 page scans). The maximum size allowed per upload is 5 pages. Retrying or reviewing extracted data inside VenQore does not consume additional pages.' },
 { id: 'faq-token-usage', q: 'How does token consumption work across Smart Capture Scanning, Assistant Questions, and Product Writing?', a: 'AI models (like Gemini & OpenAI) measure work in tokens (approx. 4 characters per token). Here is what each action consumes under the hood: 1) Smart Capture Photo Scan uses ~7,000 input tokens (image processing + system prompt) + ~800 output tokens (JSON data). On Gemini 1.5 Flash, 1 scan costs ~$0.0007 (less than 1/10th of a cent). 2) AI Assistant Question uses ~1,500 input tokens + ~250 output tokens (~$0.00018 per query). 3) AI Product Description Writer uses ~300 input tokens + ~350 output tokens (~$0.00012 per product). Managed Smart Capture plans cover all these operations with flat monthly caps so you never have to worry about token math.' },
 { id: 'faq-vensynq-channels', q: 'Which marketplaces does VenSynQ support?', a: 'VenSynQ currently supports live automated sync for Amazon Marketplace and WooCommerce. eBay and TikTok Shop integrations are currently on our product roadmap.' },
 { id: 'faq-charge', q: 'When will my card actually be charged?', a: 'Your subscription is only charged after your 14-day free trial ends — not on the day you sign up. The only immediate charge possible is the $5 BYOK activation fee (if you select that option). Onboarding services are charged from inside your admin panel when you choose to initiate the service — not at checkout.' },
 { id: 'faq-service', q: 'How do onboarding services work with the trial?', a: 'You have two options. You can start your trial immediately and request the setup service later from your admin panel (we begin within 48 hours of your request). Or you can choose "Pause Trial" — your trial clock is held while our team completes your setup, and you get your full 14 days on a store that\'s already ready.' },
 { id: 'faq-cancel', q: 'Can I cancel during the trial?', a: 'Yes, at any time. No questions asked. If you cancel before day 14, you owe nothing for your subscription. If you selected a BYOK activation, that $5 one-time fee is non-refundable (it activated your AI routing). If you added an onboarding service and we have already begun work, the service fee applies per our terms.' },
 { id: 'faq-upgrade', q: 'Can I change my plan later?', a: 'Yes. You can upgrade or downgrade your plan at any time from your admin dashboard. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.' },
 { id: 'faq-hidden-fees', q: 'Are there any hidden fees or setup costs?', a: 'No. There are zero hidden fees, transaction markups, or setup fees. The monthly or annual price you see is exactly what you pay. Standard payment processing fees from your merchant gateway still apply if you process credit cards.' },
 { id: 'faq-discounts', q: 'Do you offer discounts for annual billing?', a: 'Yes. Every plan has a discounted annual billing option. Choosing annual billing saves you 20% compared to monthly billing, which is the equivalent of getting two months completely free.' },
 { id: 'faq-trial-end', q: 'What happens when the 14-day free trial ends?', a: 'Before your trial ends, we will notify you by email and dashboard alert. If you wish to continue using VenQore, you can select your plan and provide payment details. If you choose not to subscribe, your account will be paused, and you can export your data anytime. We never charge you automatically.' },
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
 setCurrentStep(2);
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
 <section className="relative pt-28 sm:pt-36 pb-12 px-6 text-center">
 <div className="max-w-3xl mx-auto">
 <RevealOnScroll>
 <SectionLabel icon={Sparkles}>14-Day Free Trial — No Card Required</SectionLabel>
 </RevealOnScroll>
 <RevealOnScroll delay={0.08}>
 <h1 className="text-[2.75rem] xs:text-5xl md:text-[68px] font-bold tracking-tighter leading-[0.9] sm:leading-[0.88] mb-5 font-display">
 <span className="bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
 Pick your plan.
 </span>
 <br />
 <span className="bg-gradient-brand bg-clip-text text-transparent vq-text-glow">
 Power it with AI.
 </span>
 </h1>
 </RevealOnScroll>
 <RevealOnScroll delay={0.15}>
 <p className="text-base text-ink-muted max-w-xl mx-auto leading-relaxed">
 Simple, transparent pricing built for modern retail. Select your base plan below and customize your AI power level in the next step.
 </p>
 </RevealOnScroll>

 {/* Regional Gift Banner */}
 {isPK && (
 <RevealOnScroll delay={0.18}>
 <div className="max-w-3xl mx-auto mt-8 mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-neutral-950 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden text-left">
 <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
 
 <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-2xl shadow-inner">
 🇵🇰
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-widest bg-emerald-500 text-black">
 SPECIAL GIFT UNLOCKED 🎁
 </span>
 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Exclusive Regional Pricing</span>
 </div>
 <h3 className="text-base font-bold text-ink tracking-tight">
 Special Pakistan Subsidized Rates Unlocked!
 </h3>
 <p className="text-xs text-ink-muted mt-0.5">
 As a special gift for businesses operating in Pakistan, you get access to heavily subsidized local PKR pricing.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-line dark:border-white/10 shrink-0">
 <button
 onClick={() => setCurrencyDisplay('PKR')}
 className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 ${
 currencyDisplay === 'PKR'
 ? 'bg-emerald-500 text-black shadow-lg scale-[1.02]'
 : 'text-ink-muted hover:text-white'
 }`}
 >
 🇵🇰 Subsidized PKR Rate
 </button>
 <button
 onClick={() => setCurrencyDisplay('USD')}
 className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 ${
 currencyDisplay === 'USD'
 ? 'bg-brand-600 text-white shadow-lg scale-[1.02]'
 : 'text-ink-muted hover:text-white'
 }`}
 >
 🌐 Global USD Rate
 </button>
 </div>
 </div>
 </div>
 </RevealOnScroll>
 )}
 </div>
 </section>

 {/* ── Competitor Cost Comparison (Moved to top after main header) ── */}
 <section className="px-6 py-6 relative overflow-hidden">
 <div className="max-w-4xl mx-auto">
 <RevealOnScroll>
 <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-transparent p-8 md:p-12 relative shadow-[0_0_50px_rgba(16,185,129,0.05)]">
 <div className="absolute top-0 right-0 p-8 text-emerald-500/[0.02] pointer-events-none">
 <TrendingUp size={160} strokeWidth={0.5} />
 </div>
 
 <div className="text-center mb-8">
 <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-3xs font-bold tracking-widest uppercase">
 Why Pay More?
 </span>
 <h3 className="text-2xl md:text-4xl font-bold text-ink tracking-tight mt-3 font-display">
 Save up to <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">$13,000/year</span>
 </h3>
 <p className="text-ink-muted text-xs mt-2 max-w-xl mx-auto">
 Most systems charge extra per register, plus monthly fees for accounting sync, multi-store management, and inventory tools. VenQore includes it all.
 </p>
 </div>

 {/* Comparison Table */}
 <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/40">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-white/[0.08] bg-white/[0.02]">
 <th className="py-4 px-6 font-bold text-ink-secondary">System (1 Store, 3 Devices)</th>
 <th className="py-4 px-4 font-bold text-ink-secondary text-center">Software Fees</th>
 <th className="py-4 px-4 font-bold text-ink-secondary text-center">Required Apps</th>
 <th className="py-4 px-6 font-bold text-ink-secondary text-right">Total Annual Cost</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/[0.04]">
 <tr>
 <td className="py-4 px-6 font-medium text-ink-muted">Shopify POS Pro + Apps</td>
 <td className="py-4 px-4 text-center text-ink-muted">$3,228/yr</td>
 <td className="py-4 px-4 text-center text-ink-muted">$1,800/yr <span className="text-2xs text-ink-secondary block">(accounting & stock sync)</span></td>
 <td className="py-4 px-6 text-right text-ink-muted font-semibold">$5,028/yr</td>
 </tr>
 <tr>
 <td className="py-4 px-6 font-medium text-ink-muted">Square POS (Plus Device Add-ons)</td>
 <td className="py-4 px-4 text-center text-ink-muted">$2,160/yr</td>
 <td className="py-4 px-4 text-center text-ink-muted">$1,200/yr <span className="text-2xs text-ink-secondary block">(Xero/QuickBooks sync)</span></td>
 <td className="py-4 px-6 text-right text-ink-muted font-semibold">$3,360/yr</td>
 </tr>
 <tr className="bg-emerald-950/20">
 <td className="py-4 px-6 font-bold text-ink flex items-center gap-2">
 <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
 <span>VenQore Growth (Annual)</span>
 </td>
 <td className="py-4 px-4 text-center font-bold text-ink">$636/yr</td>
 <td className="py-4 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">$0 <span className="text-2xs text-emerald-500/80 block">(built-in)</span></td>
 <td className="py-4 px-6 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">$636/yr</td>
 </tr>
 </tbody>
 </table>
 </div>

 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10">
 <span className="text-1xs text-ink-muted font-medium">
 *Based on standard pricing of Shopify POS Pro ($89/device/mo + basic Shopify plan) and average QuickBooks sync app fees.
 </span>
 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap bg-emerald-500/10 px-3 py-1 rounded-lg">
 Net Savings: $2,724 – $4,392 / year
 </span>
 </div>
 </div>
 </RevealOnScroll>
 </div>
 </section>

 {/* ── 14-Day Free Trial Notice & Trust Badges Strip ── */}
 <section className="px-6 py-6 relative overflow-hidden">
 <div className="max-w-6xl mx-auto">
 <RevealOnScroll>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { icon: ShieldCheck, text: "14-Day Free Trial", desc: "Test all features risk-free" },
 { icon: CreditCard, text: "No Credit Card Required", desc: "Start instantly without friction" },
 { icon: Ban, text: "Cancel Anytime", desc: "No contracts, no lock-in" },
 { icon: Lock, text: "SOC2-Compliant Security", desc: "Your data is fully encrypted" }
 ].map((badge, i) => (
 <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
 <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
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

 {/* ── Plan Cards ───────────────────────────────────────── */}
 <section className="px-6 py-8">
 <div className="max-w-6xl mx-auto">
 {/* Billing toggle */}
 <RevealOnScroll delay={0.1}>
 <div className="flex justify-center mb-12 relative z-10">
 <BillingToggle value={billingType} onChange={setBillingType} />
 </div>
 </RevealOnScroll>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {Object.entries(PLAN_DATA).map(([key, plan], idx) => {
 const PlanIcon = plan.icon;
 const isSelected = selectedPlan === key;

 return (
 <RevealOnScroll key={key} delay={idx * 0.06}>
 <div
 id={`plan-${key}`}
 onClick={() => handlePlanSelect(key)}
 className={`relative rounded-xl border cursor-pointer overflow-hidden transition-all duration-slower flex flex-col
 ${isSelected
 ? `bg-gradient-to-b ${plan.accentFrom} to-transparent ${plan.accentBorder} shadow-2xl ${plan.accentGlow} scale-[1.015]`
 : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.035] hover:border-white/10'
 }`}
 >
 {/* Popular badge */}
 {plan.popular && (
 <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-brand-500" />
 )}
 {plan.popular && (
 <div className="absolute top-3 right-4">
 <span className="px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 text-3xs font-bold tracking-widest uppercase">
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
 <div className="text-ink font-bold text-base tracking-tight">{plan.name}</div>
 {isSelected && (
 <span className={`text-3xs font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded-full ${plan.badgeBg} border`}>
 Selected ✓
 </span>
 )}
 </div>
 </div>

 {/* Price */}
 <div className="mb-6 flex flex-col">
 <span className="text-[32px] font-bold text-ink font-display">{planPriceStr(key)}</span>
 <span className="text-xs text-ink-muted font-medium mt-1">
 {isLTD ? '2-year hosting included, one payment' : billingType === 'subscription_annual' ? 'billed annually' : 'billed monthly'}
 </span>
 {isPK && (
 <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 block">
 ≈ Rs {Math.round(planPricePKR(key)).toLocaleString()}{isLTD ? '' : '/mo'} (billed in USD)
 </span>
 )}
 </div>

 <p className="text-xs text-ink-muted leading-relaxed mb-5">{plan.tagline}</p>

 {/* Inherit banner for Growth & Enterprise */}
 {plan.inheritLabel && (
 <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${isSelected ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} border border-white/[0.05]`}>
 <Layers size={11} className="text-brand-600 dark:text-brand-400 flex-shrink-0" />
 <span className="text-2xs font-bold text-brand-300 uppercase tracking-wider">{plan.inheritLabel}</span>
 </div>
 )}

 {/* Feature Ratio Counter Badge */}
 <div className="mb-4 flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
 <span className="text-2xs font-bold text-neutral-300 flex items-center gap-1.5">
 <CheckCircle2 size={13} className="text-emerald-400" />
 {plan.ratioLabel}
 </span>
 </div>

 {/* Highlights */}
 <div className="space-y-2">
 {plan.includes.map((f, i) => (
 <div key={i} className="flex items-center gap-2.5">
 <Check size={12} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
 <span className="text-xs text-ink-secondary">{f}</span>
 </div>
 ))}
 {plan.excludes.map((f, i) => (
 <div key={i} className="flex items-center gap-2.5">
 <X size={12} className="text-ink-muted flex-shrink-0" />
 <span className="text-xs text-ink-muted">{f}</span>
 </div>
 ))}
 </div>

 {/* Expanded Detailed Breakdown */}
 {expandedCards[key] && (
 <div className="space-y-2 mt-4 pt-4 border-t border-white/[0.08] animate-fadeIn">
 <div className="text-3xs font-bold text-brand-300 uppercase tracking-widest mb-3">All {FULL_FEATURE_LIST[key].totalSuite} Platform Capabilities:</div>
 {FULL_FEATURE_LIST[key].categorizedFeatures.map((item, i) => (
 <div key={i} className="flex items-center gap-2 text-2xs">
 {item.included ? (
 <Check size={11} className="text-emerald-400 flex-shrink-0" />
 ) : (
 <X size={11} className="text-ink-secondary flex-shrink-0" />
 )}
 <span className={item.included ? "text-neutral-200 font-medium" : "text-ink-muted opacity-60"}>
 {item.name}
 </span>
 </div>
 ))}
 </div>
 )}

 {/* In-Card See More / Show Less Toggle Button */}
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 toggleCardExpand(key);
 }}
 className="w-full mt-4 py-2 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-brand-500/30 text-brand-300 hover:text-white text-2xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
 >
 <span>{expandedCards[key] ? 'Show Less ▲' : `See All ${FULL_FEATURE_LIST[key].totalIncluded} Features ▼`}</span>
 </button>
 </div>

 {/* Selection indicator at bottom */}
 <div className="px-7 pb-6 pt-3 space-y-3">
 <button
 onClick={(e) => {
 e.stopPropagation();
 handlePlanSelect(key);
 setTimeout(() => handleContinue(), 50);
 }}
 className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 duration-normal ${
 isSelected
 ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-ink shadow-lg '
 : 'bg-white/[0.04] text-ink-secondary hover:bg-white/[0.08] border border-white/[0.05]'
 }`}
 >
 {isSelected ? 'Selected ✓' : 'Choose Plan'}
 </button>
 <div className={`h-[2px] rounded-full transition-all duration-slower ${isSelected ? 'bg-gradient-to-r from-brand-500 to-brand-500 opacity-100' : 'bg-white/[0.04] opacity-30'}`} />
 </div>
 </div>
 </RevealOnScroll>
 );
 })}
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
 <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
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
 <>Select Plan & Customise AI <ArrowRight size={16} /></>
 ) : (
 <>Select a plan to continue <ArrowRight size={16} /></>
 )}
 </MagneticButton>
 <p className="text-center text-1xs text-ink-muted mt-3">
 14-day free trial. No credit card required. Cancel anytime.
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
 {/* Header */}
 <div className="text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/15 text-brand-400 text-2xs font-bold tracking-widest uppercase mb-4">
 Step 2 of 4
 </div>
 <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-3">
 Power {PLAN_DATA[selectedPlan]?.name} with AI
 </h2>
 <p className="text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
 These two AI tiers are tailored to your selected plan. Choose the power level that fits your business volume, or bring your own API key.
 </p>
 </div>

 {selectedPlan && (
 <div className="rounded-xl border border-white/[0.07] bg-void-950 overflow-hidden relative shadow-2xl">
 <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-hairline" />

 <div className="p-8 md:p-10 space-y-6">
 {/* All 4 AI Option Cards */}
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
 ? 'bg-brand-600/10 border-brand-500/60 shadow-[0_0_30px_rgba(168,85,247,0.12)]'
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

 {/* Plain English Layman Description */}
 <p className="text-xs text-ink-muted leading-relaxed mb-4">{opt.laymanDesc}</p>

 {/* Layman Key Capabilities List */}
 <div className="space-y-2.5 mb-4 p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
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
 {/* Expandable Technical Specs for Nerds */}
 {isNerdExpanded && (
 <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-1.5 animate-fadeIn">
 <div className="text-3xs font-bold text-brand-300 uppercase tracking-widest mb-2">Technical Engine Specifications:</div>
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
 {isNerdExpanded ? 'Hide Technical Details ▲' : 'Technical Specifications ▼'}
 </button>
 <span className={`text-2xs font-bold px-3 py-1 rounded-lg transition-all ${isChosen ? 'bg-brand-500 text-ink' : 'bg-white/5 text-ink-muted'}`}>
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
 <Key size={14} className="text-amber-600 dark:text-amber-400" />
 </div>
 <div>
 <div className="text-ink text-xs font-bold">Bring Your Own Key (BYOK)</div>
 <div className="text-ink-muted text-2xs mt-0.5">Use OpenAI/Gemini key — free forever after</div>
 </div>
 </div>
 <div className="flex flex-col items-end gap-1 flex-shrink-0">
 <span className="text-amber-300 font-bold text-sm whitespace-nowrap">
 {fmt(5, 1400, ' once')}
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
 <div className="text-ink text-xs font-bold">Skip AI for now</div>
 <div className="text-ink-muted text-2xs mt-0.5">Base retail system — add AI anytime later</div>
 </div>
 </div>
 <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs whitespace-nowrap">No card needed</span>
 </button>
 </div>

 {/* BYOK clarification line */}
 <div className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/[0.08] flex items-start gap-2.5">
 <Key size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
 <p className="text-1xs text-ink-muted leading-relaxed">
 <span className="text-amber-300 font-semibold">Have your own OpenAI or Gemini API key?</span>{''}
 Select BYOK and pay a one-time {isPK ? (currencyDisplay === 'PKR' ? 'Rs 1,400 (approx. $5, billed in USD)' : '$5 (approx. Rs 1,400, billed in USD)') : '$5'} platform unlock fee. After that, you use AI on VenQore for free — forever.
 </p>
 </div>

 {/* Card requirement notice or No-AI Warning Nudge */}
 {selectedAI === 'none' ? (
 <div className="flex items-start gap-4 p-5 rounded-2xl border border-brand-500/20 bg-brand-500/[0.04] transition-all duration-slow shadow-[0_0_30px_rgba(168,85,247,0.05)]">
 <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
 <Sparkles size={16} className="text-brand-400 animate-pulse" />
 </div>
 <div>
 <div className="text-xs font-bold text-brand-300 tracking-wide uppercase flex items-center gap-1.5">
 Unlock the full experience
 </div>
 <div className="text-1xs text-ink-muted mt-1 leading-relaxed">
 You haven't added any AI add-ons. Without an AI plan, <span className="text-neutral-200 font-semibold">you won't experience AI catalog intelligence & invoice scanning</span>. We recommend adding one of the AI options above — <span className="text-brand-300 font-bold">you pay nothing today!</span>
 </div>
 </div>
 </div>
 ) : (
 <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-slow ${isCardRequired && selectedPlan
 ? 'bg-amber-500/[0.05] border-amber-500/20'
 : 'bg-emerald-500/[0.05] border-emerald-500/15'}`}>
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCardRequired && selectedPlan ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
 {isCardRequired && selectedPlan
 ? <CreditCard size={14} className="text-amber-600 dark:text-amber-400" />
 : <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />}
 </div>
 <div>
 <div className={`text-xs font-bold ${isCardRequired && selectedPlan ? 'text-amber-300' : 'text-emerald-300'}`}>
 {isCardRequired && selectedPlan ? 'A credit card will be required at checkout' : 'No credit card required'}
 </div>
 <div className="text-2xs text-ink-muted mt-0.5">
 {isCardRequired && selectedPlan
 ? 'Your card is authorized now but charged only after your 14-day trial ends.'
 : 'No AI selected. Your full 14-day trial starts immediately — no payment details needed.'}
 </div>
 </div>
 </div>
 )}

 </div>
 </div>
 )}

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
 Continue to Online Sync <ArrowRight size={13} />
 </MagneticButton>
 </div>
 </div>
 </section>
 );

 // ── Step 3: Platform Sync ──────────────────────────────────────────────
 const renderSyncStep = () => (
 <section className="min-h-screen px-6 py-24">
 <div className="max-w-4xl mx-auto space-y-8">
 <RevealOnScroll>
 <div className="text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/15 text-brand-400 text-2xs font-bold tracking-widest uppercase mb-4">
 Step 3 of 5
 </div>
 <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-3">
 Connect Your Online Sales Channels
 </h2>
 <p className="text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
 Connect your online store or Amazon seller account. When an item sells in your physical shop, online inventory updates automatically in under 3 seconds.
 </p>
 <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
 <CheckCircle2 size={12} className="text-emerald-400" />
 <span className="text-1xs text-emerald-400 font-semibold">Available for all users globally — connect now or add anytime later</span>
 </div>
 </div>
 </RevealOnScroll>

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

 {/* Plain English Layman Description */}
 <p className="text-xs text-ink-muted leading-relaxed mb-4">{ch.laymanDesc}</p>

 {/* Key Highlights (Active channels only) */}
 {!isComingSoon && ch.laymanHighlights && (
 <div className="space-y-1.5 mb-4 p-3 rounded-xl bg-black/30 border border-white/[0.05]">
 {ch.laymanHighlights.map((hl, i) => (
 <div key={i} className="text-2xs text-neutral-300 font-medium leading-relaxed">
 {hl}
 </div>
 ))}
 </div>
 )}
 </div>

 <div>
 {/* Technical Specs (Active channels only) */}
 {!isComingSoon && isNerdExpanded && (
 <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-1.5 animate-fadeIn">
 <div className="text-3xs font-bold text-brand-300 uppercase tracking-widest mb-2">Technical API Specifications:</div>
 {ch.techSpecs.map((spec, i) => (
 <div key={i} className="flex items-center justify-between text-3xs gap-2">
 <span className="text-ink-muted font-mono">{spec.name}</span>
 <span className="text-neutral-300 font-mono font-semibold text-right">{spec.value}</span>
 </div>
 ))}
 </div>
 )}

 <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
 {!isComingSoon ? (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 toggleNerdSpec(`sync_${ch.key}`);
 }}
 className="text-3xs font-bold text-ink-muted hover:text-brand-300 uppercase tracking-wider transition-colors flex items-center gap-1"
 >
 {isNerdExpanded ? 'Hide Technical Details ▲' : 'Technical Specifications ▼'}
 </button>
 ) : (
 <span className="text-3xs font-mono text-amber-400/70">In Development</span>
 )}
 <span className={`text-2xs font-bold px-3 py-1 rounded-lg transition-all ${isAdded ? 'bg-brand-500 text-ink' : 'bg-white/5 text-ink-muted'}`}>
 {isAdded ? 'Connected ✓' : isComingSoon ? 'Coming Soon' : 'Connect Channel'}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {selectedSyncs.length > 0 && (
 <div className="p-4 rounded-xl bg-brand-500/[0.06] border border-brand-500/15 flex items-center gap-3">
 <Globe size={14} className="text-brand-400 flex-shrink-0" />
 <p className="text-xs text-ink-muted">
 The moment a barcode transaction completes inside your POS, stock updates across all connected platforms in under 3 seconds. No overselling. Ever.
 </p>
 </div>
 )}

 <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
 <button
 onClick={() => { setCurrentStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.06] text-ink-muted hover:text-neutral-200 text-xs font-bold uppercase tracking-widest transition-colors"
 >
 <ArrowLeft size={13} /> Back to AI Selection
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

 // ── Step 4: Onboarding Services — per-product calculator ─────────────────
 const renderOnboardingStep = () => {
 const fmtCost = (usdAmount, pkrAmount = null) => {
 const usdVal = parseFloat(usdAmount) || 0;
 const pkrVal = pkrAmount !== null ? parseFloat(pkrAmount) : Math.round(usdVal * 280);

 if (isPK && currencyDisplay === 'PKR') {
 return `Rs ${Math.round(pkrVal).toLocaleString()} (billed as $${usdVal.toFixed(2)})`;
 }

 let str = `$${usdVal.toFixed(2)}`;
 if (isPK) {
 str += ` (approx. Rs ${Math.round(pkrVal).toLocaleString()}, billed in USD)`;
 }
 return str;
 };
 const hasEstimate = selectedTier && calcProductsNum > 0;

 return (
 <section className="min-h-screen px-6 py-24">
 <div className="max-w-3xl mx-auto space-y-8">

 {/* Header */}
 <div className="text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/15 text-brand-600 dark:text-brand-400 text-2xs font-bold tracking-widest uppercase mb-4">
 Step 4 of 4
 </div>
 <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-3">
 Want us to load your products?
 </h2>
 <p className="text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
 We'll upload your catalog for you — fully configured and ready to sell from day one. Pay only for what you need, per product. No fixed packages.
 </p>
 </div>

 {/* Tier selector */}
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
 {isChosen && <Check size={9} className="text-ink" strokeWidth={3} />}
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-lg">{tier.emoji}</span>
 <span className="text-ink font-bold text-sm">{tier.name}</span>
 {idx === 1 && <span className="px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-4xs font-bold tracking-widest uppercase">Most Popular</span>}
 </div>
 <p className="text-ink-muted text-xs mt-1 leading-relaxed">{tier.desc}</p>
 <p className="text-ink-muted text-2xs mt-1.5 font-semibold">⏱ Turnaround: {tier.sla}</p>
 </div>
 </div>
 <div className="text-right flex-shrink-0">
 <div className="text-ink font-bold text-lg">{fmtCost(tier.priceUSD, tier.pricePKR)}</div>
 <div className="text-3xs text-ink-muted font-bold uppercase tracking-widest">per product</div>
 <div className="text-3xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5">+{fmtCost(0.50, 50)} / extra 5 variants</div>
 </div>
 </div>
 </button>
 );
 })}
 </div>

 {/* Variant explanation */}
 <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3">
 <div className="w-6 h-6 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
 <Layers size={11} className="text-brand-600 dark:text-brand-400" />
 </div>
 <p className="text-1xs text-ink-muted leading-relaxed">
 <span className="text-ink font-semibold">Variant pricing:</span> The first 5 variants per product are included in the base price.
 Every additional 5 variants cost {fmtCost(0.50, 50)} more.
 Example: a product with 20 variants = base price + 3 extra blocks ({fmtCost(1.50, 150)} more).
 </p>
 </div>

 {/* ── Interactive Calculator ── */}
 {selectedTier && (
 <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-b from-brand-950/30 to-transparent overflow-hidden">
 <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2">
 <BarChart3 size={14} className="text-brand-600 dark:text-brand-400" />
 <span className="text-xs font-bold text-ink uppercase tracking-widest">Cost Estimator</span>
 <span className="text-2xs text-ink-muted ml-1">— see your price before committing</span>
 </div>

 <div className="p-6 space-y-5">
 {/* Inputs */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-2">
 How many products?
 </label>
 <input
 id="calc-products"
 type="number" min="1" placeholder="e.g. 50"
 value={calcProducts}
 onChange={e => setCalcProducts(e.target.value)}
 className="w-full bg-black/30 border border-white/[0.07] focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
 />
 </div>
 <div>
 <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-2">
 Average variants per product?
 </label>
 <input
 id="calc-variants"
 type="number" min="1" placeholder="e.g. 3 (default: 1)"
 value={calcVariants}
 onChange={e => setCalcVariants(e.target.value)}
 className="w-full bg-black/30 border border-white/[0.07] focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
 />
 <p className="text-2xs text-ink-muted mt-1.5">Leave blank if products have no variants or ≤5</p>
 </div>
 </div>

 {/* Breakdown */}
 {hasEstimate && (
 <div className="space-y-2 pt-4 border-t border-white/[0.05]">
 <div className="flex items-center justify-between text-xs">
 <span className="text-ink-muted">{calcProductsNum} products × {fmtCost(selectedTier.priceUSD, selectedTier.pricePKR)} base</span>
 <span className="text-ink-secondary font-semibold font-mono">{fmtCost(calcProductsNum * selectedTier.priceUSD, calcProductsNum * selectedTier.pricePKR)}</span>
 </div>
 {extraBlocks > 0 && (
 <div className="flex items-center justify-between text-xs">
 <span className="text-ink-muted">
 {calcProductsNum} products × {extraBlocks} extra variant block{extraBlocks > 1 ? 's' : ''} × {fmtCost(0.50, 50)}
 </span>
 <span className="text-ink-secondary font-semibold font-mono">{fmtCost(calcProductsNum * extraBlocks * 0.50, calcProductsNum * extraBlocks * 50)}</span>
 </div>
 )}
 {calcVariantsNum > 1 && (
 <div className="flex items-center justify-between text-2xs text-ink-muted">
 <span>Per product: {fmtCost(usdPricePerProduct, pkrPricePerProduct)} ({calcVariantsNum} variants — first 5 free{extraBlocks > 0 ? `, +${extraBlocks} block${extraBlocks > 1 ? 's' : ''}` : ''})</span>
 </div>
 )}
 <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-1">
 <span className="text-ink font-bold text-sm">Your estimated total</span>
 <span className="text-2xl font-bold text-brand-300 font-display">{fmtCost(usdServiceCostNum, pkrServiceCostNum)}</span>
 </div>
 <p className="text-2xs text-ink-muted leading-relaxed">
 This is an estimate. Final invoice is generated when you initiate the service from your admin panel — after reviewing and confirming.
 </p>
 </div>
 )}

 {!hasEstimate && (
 <div className="text-center py-4 text-ink-muted text-xs">
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
 <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
 </div>
 <div>
 <div className="text-emerald-300 text-xs font-bold mb-1">Not charged at checkout</div>
 <p className="text-ink-muted text-xs leading-relaxed">
 Adding your card now just unlocks the service. You trigger it yourself from the admin panel — <strong className="text-ink-secondary">that's when the charge happens</strong>, after you've reviewed the final product count.
 </p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <div className="w-6 h-6 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
 <Rocket size={12} className="text-brand-600 dark:text-brand-400" />
 </div>
 <div>
 <div className="text-brand-300 text-xs font-bold mb-1">Trial paused while we work</div>
 <p className="text-ink-muted text-xs leading-relaxed">
 Your 14-day trial is <strong className="text-ink-secondary">held while we load your catalog</strong>. Every one of your trial days starts on a store that's already live and stocked.
 </p>
 </div>
 </div>
 </div>

 {/* Trial mode */}
 {selectedService && (
 <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
 <h4 className="text-ink text-sm font-bold">When should we start your trial?</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {[
 { key: 'instant', emoji: '⚡', label: 'Start immediately', desc: 'Trial runs now. Request catalog loading whenever you\'re ready from your dashboard.' },
 { key: 'deferred', emoji: '⏸️', label: 'Wait until catalog is ready', desc: 'Trial clock pauses. Starts only after your products are fully loaded.' },
 ].map(opt => (
 <button
 key={opt.key}
 id={`trial-mode-${opt.key}`}
 onClick={() => setTrialMode(opt.key)}
 className={`text-left p-4 rounded-xl border transition-all duration-slow
 ${trialMode === opt.key
 ? 'bg-brand-600/8 border-brand-500/40'
 : 'bg-white/[0.02] border-white/[0.06] hover:border-white/8'
 }`}
 >
 <div className="text-base mb-1">{opt.emoji}</div>
 <div className="text-ink text-xs font-bold mb-1">{opt.label}</div>
 <div className="text-ink-muted text-2xs leading-relaxed">{opt.desc}</div>
 </button>
 ))}
 </div>
 </div>
 )}

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
 {selectedService
 ? hasEstimate
 ? `Continue — ${fmt(usdServiceCostNum, pkrServiceCostNum)} estimated`
 : `Continue with ${selectedTier.name}`
 : 'Skip — go to checkout'} <ArrowRight size={13} />
 </MagneticButton>
 </div>

 </div>
 </section>
 );
 };

 // ── Step 5: Checkout ────────────────────────────────────────────────────
 const renderCheckout = () => {
 const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
 const trialEndStr = trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

 return (
 <section className="min-h-screen px-6 py-24">
 <div className="max-w-5xl mx-auto">
 <div className="text-center mb-10">
 <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-2">Review & Confirm</h2>
 <p className="text-ink-muted text-sm">Everything you've selected. Clear. In one place.</p>
 </div>

 <div className="flex flex-col lg:flex-row gap-6 items-start">

 {/* Left: Order Summary */}
 <div className="flex-1 space-y-4">

 {/* Plan */}
 <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
 <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-4">Your Subscription</div>
 <div className="flex items-center justify-between">
 <div>
 <div className="text-ink font-bold">{selectedPlan && PLAN_DATA[selectedPlan]?.name}</div>
 <div className="text-ink-muted text-xs mt-0.5">14-day free trial → then auto-renews</div>
 </div>
 <div className="text-right">
 <div className="text-ink-secondary font-bold text-lg">{selectedPlan && fmt(planPrice(selectedPlan), planPricePKR(selectedPlan), isLTD ? '' : '/mo')}</div>
 <div className="text-emerald-600 dark:text-emerald-400 text-2xs font-bold">$0.00 today</div>
 </div>
 </div>
 {selectedAIData && (
 <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
 <div>
 <div className="text-ink font-bold text-sm">{selectedAIData.emoji} {selectedAIData.name}</div>
 <div className="text-ink-muted text-xs mt-0.5">Managed AI — included in trial</div>
 </div>
 <div className="text-right">
 <div className="text-ink-secondary font-bold">+{fmt(selectedAIData.priceUSD, selectedAIData.pricePKR, '/mo')}</div>
 <div className="text-emerald-600 dark:text-emerald-400 text-2xs font-bold">$0.00 today</div>
 </div>
 </div>
 )}
 {selectedAI === 'byok' && (
 <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
 <div>
 <div className="text-ink font-bold text-sm">🔑 BYOK AI Activation</div>
 <div className="text-ink-muted text-xs mt-0.5">One-time unlock — free AI forever after</div>
 </div>
 <div className="text-right">
 <div className="text-amber-600 dark:text-amber-400 font-bold">{fmt(5, 1400)}</div>
 <div className="text-amber-600 dark:text-amber-400 text-2xs font-bold">charged today</div>
 </div>
 </div>
 )}
 {selectedSyncs.length > 0 && (
 <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
 <div>
 <div className="text-ink font-bold text-sm">{selectedSyncs.length} Platform Sync{selectedSyncs.length > 1 ? 's' : ''}</div>
 <div className="text-ink-muted text-xs mt-0.5">{selectedSyncs.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</div>
 </div>
 <div className="text-right">
 <div className="text-ink-secondary font-bold">+{fmt(syncCostUSD, syncCostPKR, '/mo')}</div>
 <div className="text-emerald-600 dark:text-emerald-400 text-2xs font-bold">$0.00 today</div>
 </div>
 </div>
 )}
 </div>

 {/* Services */}
 {selectedServiceData && (
 <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
 <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-4">Optional Service</div>
 <div className="flex items-center justify-between">
 <div>
 <div className="text-ink font-bold">{selectedTier?.emoji} Catalog Loading — {selectedTier?.name}</div>
 <div className="text-ink-muted text-xs mt-0.5">{calcProductsNum} products · charged when initiated from dashboard</div>
 </div>
 <div className="text-right">
 <div className="text-amber-600 dark:text-amber-400 font-bold">{fmt(usdServiceCostNum, pkrServiceCostNum)} est.</div>
 <div className="text-amber-600 dark:text-amber-400 text-2xs font-bold">deferred — from dashboard</div>
 </div>
 </div>
 </div>
 )}

 {/* Billing Timeline */}
 <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
 <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-5">Your Billing Timeline</div>
 <div className="space-y-5 relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-white/[0.05]">
 <div className="relative">
 <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-emerald-400" />
 <div className="flex items-center justify-between mb-0.5">
 <span className="text-ink text-xs font-bold">Today</span>
 <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">{fmt(totalDueToday, pkrTotalDueToday)}</span>
 </div>
 <p className="text-ink-muted text-2xs">
 {totalDueToday > 0
 ? 'BYOK activation fee charged. Trial begins.'
 : 'No charge. Trial begins immediately.'}
 </p>
 </div>
 <div className="relative">
 <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-brand-500" />
 <div className="flex items-center justify-between mb-0.5">
 <span className="text-ink text-xs font-bold">{trialEndStr}</span>
 <span className="text-brand-600 dark:text-brand-400 text-xs font-bold">{fmt(totalMonthlyCost, pkrTotalMonthlyCost, '/mo')}</span>
 </div>
 <p className="text-ink-muted text-2xs">
 First subscription charge — only if you choose to continue. Cancel anytime before this date.
 </p>
 </div>
 {selectedServiceData && (
 <div className="relative">
 <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-amber-400" />
 <div className="flex items-center justify-between mb-0.5">
 <span className="text-ink text-xs font-bold">When you initiate catalog loading</span>
 <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">{fmt(usdServiceCostNum, pkrServiceCostNum)} est.</span>
 </div>
 <p className="text-ink-muted text-2xs">
 Charged per product from your admin panel. Turnaround: {selectedTier?.sla}.
 </p>
 </div>
 )}
 </div>
 </div>

 {/* Totals */}
 <div className="p-5 rounded-2xl bg-brand-600/8 border border-brand-500/20 flex items-center justify-between">
 <div>
 <div className="text-ink font-bold text-sm">Due today</div>
 <div className="text-ink-muted text-2xs">{totalDueToday > 0 ? 'BYOK activation' : 'Nothing. Trial is free.'}</div>
 </div>
 <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
 {fmt(totalDueToday, pkrTotalDueToday)}
 </div>
 </div>
 </div>

 {/* Right: Form */}
 <div className="w-full lg:w-[380px] bg-white/[0.01] border border-white/[0.06] rounded-xl p-7">
 <form onSubmit={handleFormSubmit} className="space-y-5">
 <div className="flex items-center gap-2 mb-2">
 <Lock size={13} className="text-brand-600 dark:text-brand-400" />
 <span className="text-xs font-bold text-ink uppercase tracking-widest">Secure Activation</span>
 </div>

 <div>
 <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Business Email</label>
 <input
 type="email" required placeholder="name@business.com"
 value={checkoutDetails.email}
 onChange={e => setCheckoutDetails({ ...checkoutDetails, email: e.target.value })}
 className="w-full bg-black/30 border border-white/[0.06] focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
 />
 </div>
 <div>
 <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Phone Number</label>
 <input
 type="tel" required placeholder="+1 (555) 000-0000"
 value={checkoutDetails.phone}
 onChange={e => setCheckoutDetails({ ...checkoutDetails, phone: e.target.value })}
 className="w-full bg-black/30 border border-white/[0.06] focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
 />
 </div>

 {isCardRequired ? (
 <div className="space-y-3 pt-4 border-t border-white/[0.05]">
 <div className="flex items-center justify-between">
 <span className="text-2xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Card Details</span>
 <span className="text-2xs text-ink-muted flex items-center gap-1"><Lock size={9} /> Secured</span>
 </div>
 <div>
 <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Cardholder Name</label>
 <input
 type="text" required placeholder="Jane Doe"
 value={checkoutDetails.cardholder}
 onChange={e => setCheckoutDetails({ ...checkoutDetails, cardholder: e.target.value })}
 className="w-full bg-black/30 border border-white/[0.06] focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
 />
 </div>
 <div>
 <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Card Number</label>
 <input
 type="text" required placeholder="•••• •••• •••• ••••" maxLength="19"
 value={checkoutDetails.cardNumber}
 onChange={e => setCheckoutDetails({ ...checkoutDetails, cardNumber: e.target.value })}
 className="w-full bg-black/30 border border-white/[0.06] focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono outline-none transition-all"
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">Expiry</label>
 <input
 type="text" required placeholder="MM/YY" maxLength="5"
 value={checkoutDetails.expiry}
 onChange={e => setCheckoutDetails({ ...checkoutDetails, expiry: e.target.value })}
 className="w-full bg-black/30 border border-white/[0.06] focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono text-center outline-none transition-all"
 />
 </div>
 <div>
 <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">CVC</label>
 <input
 type="password" required placeholder="•••" maxLength="4"
 value={checkoutDetails.cvc}
 onChange={e => setCheckoutDetails({ ...checkoutDetails, cvc: e.target.value })}
 className="w-full bg-black/30 border border-white/[0.06] focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono text-center outline-none transition-all"
 />
 </div>
 </div>
 <p className="text-2xs text-ink-muted leading-relaxed">
 Encrypted connection. Your card is authorized today. Subscription is charged only after your 14-day trial ends — and only if you choose to continue.
 </p>
 </div>
 ) : (
 <div className="pt-4 border-t border-white/[0.05]">
 <div className="p-3.5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/10 flex items-start gap-2.5">
 <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
 <p className="text-1xs text-ink-muted leading-relaxed">
 No credit card required. Your trial starts immediately with full dashboard access.
 </p>
 </div>
 </div>
 )}

 <button
 id="checkout-submit"
 type="submit"
 disabled={isSubmitting}
 className={`w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-slow flex items-center justify-center gap-2
 ${isSubmitting
 ? 'bg-sunken text-ink-muted cursor-not-allowed'
 : 'bg-white text-void-950 hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.3)] shadow-lg'
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
 onClick={() => { setCurrentStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className="w-full text-center text-ink-muted hover:text-ink-muted text-1xs font-bold uppercase tracking-widest transition-colors"
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

 // ── Step 6: Confirmation ────────────────────────────────────────────────
 const renderConfirmation = () => {
 const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
 const trialEndStr = trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

 return (
 <section className="min-h-screen px-6 py-24 flex items-center justify-center">
 <div className="max-w-2xl w-full">
 <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-neutral-900 to-void-950 p-10 md:p-12 text-center relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

 <div className="relative z-10">
 {/* Success mark */}
 <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
 <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" />
 </div>

 <h2 className="text-4xl font-bold text-ink tracking-tight font-display mb-2">You're in.</h2>
 <p className="text-ink-muted text-sm mb-8">Your account has been activated. Here's exactly what happens next.</p>

 {/* What's included */}
 <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left space-y-3 mb-6">
 <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-3">What you purchased</div>
 <div className="flex items-center justify-between text-sm">
 <span className="text-ink-secondary">{selectedPlan && PLAN_DATA[selectedPlan]?.name}</span>
 <span className="text-ink-muted font-semibold">{selectedPlan && fmt(planPrice(selectedPlan), planPricePKR(selectedPlan), isLTD ? '' : '/mo')}</span>
 </div>
 {selectedAIData && (
 <div className="flex items-center justify-between text-sm">
 <span className="text-ink-secondary">{selectedAIData.emoji} {selectedAIData.name}</span>
 <span className="text-ink-muted font-semibold">+{fmt(selectedAIData.priceUSD, selectedAIData.pricePKR, '/mo')}</span>
 </div>
 )}
 {selectedSyncs.length > 0 && (
 <div className="flex items-center justify-between text-sm">
 <span className="text-ink-secondary">{selectedSyncs.length} Platform Sync{selectedSyncs.length > 1 ? 's' : ''}</span>
 <span className="text-ink-muted font-semibold">+{fmt(syncCostUSD, syncCostPKR, '/mo')}</span>
 </div>
 )}
 {selectedServiceData && (
 <div className="flex items-center justify-between text-sm pt-2 border-t border-white/[0.05]">
 <span className="text-ink-secondary">Catalog Loading — {selectedTier?.name}</span>
 <span className="text-amber-600 dark:text-amber-400 font-semibold">{fmt(usdServiceCostNum, pkrServiceCostNum)} est.</span>
 </div>
 )}
 </div>

 {/* Timeline */}
 <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left space-y-4 mb-6">
 <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest">What happens next</div>

 {[
 { dot: 'bg-emerald-400', title: 'Right now', desc: `Your 14-day trial has started. Log in and explore everything.${totalDueToday > 0 ? ` BYOK activation fee of ${fmt(totalDueToday, pkrTotalDueToday)} has been processed.` : ' No charge today.'}` },
 ...(selectedServiceData ? [{ dot: 'bg-brand-400', title: 'Within 2 business hours', desc: `Our team will contact you on ${checkoutDetails.phone || 'the number you provided'} to confirm your catalog details and begin loading ${calcProductsNum} products. Turnaround: ${selectedTier?.sla}.` }] : []),
 { dot: 'bg-brand-400', title: trialEndStr, desc: `Trial ends. Subscription begins at ${fmt(totalMonthlyCost, pkrTotalMonthlyCost, '/mo')} — only if you choose to stay. Cancel from your dashboard anytime before this date.` },
 ].map((step, i) => (
 <div key={i} className="flex gap-3">
 <div className="flex flex-col items-center gap-1">
 <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${step.dot}`} />
 {i < 2 && <div className="w-px flex-1 bg-white/[0.05] my-1" />}
 </div>
 <div className="pb-3">
 <div className="text-ink text-xs font-bold mb-0.5">{step.title}</div>
 <div className="text-ink-muted text-1xs leading-relaxed">{step.desc}</div>
 </div>
 </div>
 ))}
 </div>

 {/* Human contact */}
 <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center gap-3 mb-6 text-sm text-ink-muted">
 <MessageSquare size={14} className="text-brand-600 dark:text-brand-400 flex-shrink-0" />
 <span>Questions? WhatsApp us at <a href="https://wa.me/923091999489" className="text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-300 transition-colors">+92 309 1999489</a> — we reply within a few hours.</span>
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
 </div>
 </section>
 );
 };

 // ── Step indicator (steps 2–5) ─────────────────────────────────────────
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
 description="Start with the right plan. Add the AI power level that fits your business. No surprises. No hidden fees. 14-day free trial."
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

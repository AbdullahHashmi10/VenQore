import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import MarketingLayout, { RevealOnScroll, SectionLabel, MagneticButton } from "./MarketingLayout-CMiC1Bik.js";
import { Sparkles, Crown, TrendingUp, Zap, Layers, Check, X, BarChart3, MessageSquare, ArrowRight, CheckCircle2, Globe, ShoppingCart, Package, Star, ArrowLeft, ShieldCheck, Rocket, Lock, ChevronDown } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
const FaqItem = ({ question, answer, id }) => {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "border-b border-white/[0.06]", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        id,
        onClick: () => setOpen(!open),
        className: "w-full py-6 flex items-start justify-between text-left group",
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-white/90 leading-snug pr-6 group-hover:text-white transition-colors", children: question }),
          /* @__PURE__ */ jsx(
            ChevronDown,
            {
              size: 16,
              className: `flex-shrink-0 mt-0.5 transition-all duration-400 ${open ? "rotate-180 text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: `overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "max-h-80 pb-6" : "max-h-0"}`, children: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 leading-relaxed", children: answer }) })
  ] });
};
const TableRow = ({ label, starter, growth, enterprise, highlight }) => /* @__PURE__ */ jsxs("tr", { className: `border-b border-white/[0.04] transition-colors ${highlight ? "bg-white/[0.015]" : "hover:bg-white/[0.01]"}`, children: [
  /* @__PURE__ */ jsx("td", { className: "py-3.5 pl-6 pr-4 text-xs text-slate-400 font-medium", children: label }),
  /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-center text-xs", children: typeof starter === "boolean" ? starter ? /* @__PURE__ */ jsx(Check, { size: 14, className: "mx-auto text-indigo-400" }) : /* @__PURE__ */ jsx(X, { size: 14, className: "mx-auto text-slate-500" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-300 font-semibold", children: starter }) }),
  /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-center text-xs bg-indigo-950/20", children: typeof growth === "boolean" ? growth ? /* @__PURE__ */ jsx(Check, { size: 14, className: "mx-auto text-indigo-400" }) : /* @__PURE__ */ jsx(X, { size: 14, className: "mx-auto text-slate-500" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-300 font-semibold", children: growth }) }),
  /* @__PURE__ */ jsx("td", { className: "py-3.5 pr-6 pl-4 text-center text-xs", children: typeof enterprise === "boolean" ? enterprise ? /* @__PURE__ */ jsx(Check, { size: 14, className: "mx-auto text-purple-400" }) : /* @__PURE__ */ jsx(X, { size: 14, className: "mx-auto text-slate-500" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-300 font-semibold", children: enterprise }) })
] });
const BillingToggle = ({ value, onChange }) => /* @__PURE__ */ jsx("div", { className: "inline-flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]", children: [
  { key: "subscription_monthly", label: "Monthly" },
  { key: "subscription_annual", label: "Annual", badge: "Save 20%" },
  { key: "ltd", label: "Lifetime" }
].map((opt) => /* @__PURE__ */ jsxs(
  "button",
  {
    onClick: () => onChange(opt.key),
    className: `relative px-4 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-300
                    ${value === opt.key ? opt.key === "ltd" ? "bg-amber-600/80 text-white shadow-md" : "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-300"}`,
    children: [
      opt.label,
      opt.badge && /* @__PURE__ */ jsx("span", { className: "absolute -top-2.5 -right-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[8px] font-black rounded-full whitespace-nowrap", children: opt.badge })
    ]
  },
  opt.key
)) });
function Pricing({ plans = [] }) {
  const { geo = { country: "US", currency: "USD", symbol: "$" }, auth } = usePage().props;
  const PKR_ENABLED = false;
  const isPK = PKR_ENABLED;
  const [billingType, setBillingType] = useState("subscription_annual");
  const [currencyDisplay, setCurrencyDisplay] = useState("USD");
  const [selectedPlan, setSelectedPlan] = useState("growth");
  const [selectedAI, setSelectedAI] = useState("none");
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSyncs, setSelectedSyncs] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [calcProducts, setCalcProducts] = useState("");
  const [calcVariants, setCalcVariants] = useState("");
  const [trialMode, setTrialMode] = useState("instant");
  const [checkoutDetails, setCheckoutDetails] = useState({ email: "", phone: "", cardholder: "", cardNumber: "", expiry: "", cvc: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  useRef(null);
  useRef(null);
  const isLTD = billingType === "ltd";
  useEffect(() => {
    setSelectedAI("none");
  }, [selectedPlan]);
  const defaultPricesUSD = {
    starter: { subscription_monthly: 36, subscription_annual: 30, ltd: 79 },
    growth: { subscription_monthly: 63, subscription_annual: 53, ltd: 199 },
    enterprise: { subscription_monthly: 129, subscription_annual: 108, ltd: 399 }
  };
  const defaultPricesPKR = {
    starter: { subscription_monthly: 1100, subscription_annual: 916, ltd: 22120 },
    growth: { subscription_monthly: 1800, subscription_annual: 1500, ltd: 55720 },
    enterprise: { subscription_monthly: 5300, subscription_annual: 4416, ltd: 111720 }
  };
  const PRICES_USD = { ...defaultPricesUSD };
  const PRICES_PKR = { ...defaultPricesPKR };
  if (plans && plans.length > 0) {
    plans.forEach((plan) => {
      const baseSlug = plan.slug === "business" ? "enterprise" : plan.slug;
      if (baseSlug === "starter" || baseSlug === "growth" || baseSlug === "enterprise") {
        if (plan.type === "subscription") {
          PRICES_USD[baseSlug].subscription_monthly = parseFloat(plan.price_monthly_usd || plan.price_monthly || defaultPricesUSD[baseSlug].subscription_monthly);
          PRICES_USD[baseSlug].subscription_annual = plan.price_annual_usd ? Math.round(parseFloat(plan.price_annual_usd) / 12) : plan.price_annual ? Math.round(parseFloat(plan.price_annual) / 12) : defaultPricesUSD[baseSlug].subscription_annual;
          const monthlyPKR = plan.price_monthly_pkr ? parseFloat(plan.price_monthly_pkr) : plan.price_monthly ? Math.round(plan.price_monthly * 280) : defaultPricesPKR[baseSlug].subscription_monthly;
          const annualPKR = plan.price_annual_pkr ? parseFloat(plan.price_annual_pkr) : plan.price_annual ? Math.round(plan.price_annual * 280) : defaultPricesPKR[baseSlug].subscription_annual * 12;
          PRICES_PKR[baseSlug].subscription_monthly = monthlyPKR;
          PRICES_PKR[baseSlug].subscription_annual = Math.round(annualPKR / 12);
        }
      } else if (plan.slug === "ltd_1" || plan.slug === "ltd_2" || plan.slug === "ltd_3") {
        const targetSlug = plan.slug === "ltd_1" ? "starter" : plan.slug === "ltd_2" ? "growth" : "enterprise";
        PRICES_USD[targetSlug].ltd = parseFloat(plan.price_lifetime_usd || plan.price_lifetime || defaultPricesUSD[targetSlug].ltd);
        PRICES_PKR[targetSlug].ltd = plan.price_lifetime_pkr ? parseFloat(plan.price_lifetime_pkr) : plan.price_lifetime ? Math.round(plan.price_lifetime * 280) : defaultPricesPKR[targetSlug].ltd;
      }
    });
  }
  const fmt = (usdAmount, pkrAmount = null, suffix = "", showEstimate = true) => {
    const usdVal = parseFloat(usdAmount) || 0;
    return `$${usdVal.toLocaleString()}${suffix}`;
  };
  const planPrice = (key) => PRICES_USD[key]?.[billingType] ?? 0;
  const planPricePKR = (key) => PRICES_PKR[key]?.[billingType] ?? 0;
  const planPriceStr = (key) => fmt(planPrice(key), planPricePKR(key), isLTD ? "" : "/mo", false);
  const AI_OPTIONS = {
    starter: [
      { key: "core", emoji: "🌱", name: "AI Core", tagline: "Essentials — query answering & invoice reading", priceUSD: 3, pricePKR: 840, queries: 110, scans: 90 },
      { key: "lite", emoji: "⚡", name: "AI Lite", tagline: "Active scanning & automation triggers", priceUSD: 5, pricePKR: 1400, queries: 200, scans: 150 }
    ],
    growth: [
      { key: "lite", emoji: "⚡", name: "AI Lite", tagline: "Active scanning & automation triggers", priceUSD: 5, pricePKR: 1400, queries: 200, scans: 150 },
      { key: "pro", emoji: "🚀", name: "AI Pro", tagline: "High-volume stores, churn predictions & forecasting", priceUSD: 15, pricePKR: 4200, queries: 420, scans: 480 }
    ],
    enterprise: [
      { key: "pro", emoji: "🚀", name: "AI Pro", tagline: "High-volume stores, churn predictions & forecasting", priceUSD: 15, pricePKR: 4200, queries: 420, scans: 480 },
      { key: "ultimate", emoji: "👑", name: "AI Ultimate", tagline: "Maximum throughput — full catalog intelligence", priceUSD: 25, pricePKR: 7e3, queries: 800, scans: 850 }
    ]
  };
  const aiOptions = selectedPlan ? AI_OPTIONS[selectedPlan] : [];
  const selectedAIData = aiOptions.find((o) => `opt_${o.key}` === selectedAI) ?? null;
  const aiCostUSD = selectedAI === "byok" ? 5 : selectedAIData ? selectedAIData.priceUSD : 0;
  const aiCostPKR = selectedAI === "byok" ? 1400 : selectedAIData ? selectedAIData.pricePKR : 0;
  const aiIsMonthly = selectedAI !== "none" && selectedAI !== "byok";
  const syncCostUSD = selectedSyncs.length * 10;
  const syncCostPKR = selectedSyncs.length * 2800;
  const SERVICE_TIERS = {
    basic: { key: "basic", name: "Basic Upload", emoji: "📦", priceUSD: 1, pricePKR: 100, variantExtraUSD: 0.5, variantExtraPKR: 50, sla: "2–3 business days", desc: "Product data uploaded with all core fields. Up to 5 variants per product included." },
    descriptions: { key: "descriptions", name: "+ Rich Descriptions", emoji: "✍️", priceUSD: 1.5, pricePKR: 150, variantExtraUSD: 0.5, variantExtraPKR: 50, sla: "3–5 business days", desc: "Everything in Basic + long descriptions, SEO copy, and full product detail. You provide images." },
    images: { key: "images", name: "+ AI Images", emoji: "🎨", priceUSD: 2, pricePKR: 200, variantExtraUSD: 0.5, variantExtraPKR: 50, sla: "4–6 business days", desc: "Everything in Descriptions + we source or AI-generate product images for you." }
  };
  const calcProductsNum = Math.max(0, parseInt(calcProducts) || 0);
  const calcVariantsNum = Math.max(1, parseInt(calcVariants) || 1);
  const selectedTier = selectedService ? SERVICE_TIERS[selectedService] : null;
  const extraBlocks = calcVariantsNum > 5 ? Math.ceil((calcVariantsNum - 5) / 5) : 0;
  const usdPricePerProduct = selectedTier ? selectedTier.priceUSD + extraBlocks * selectedTier.variantExtraUSD : 0;
  const pkrPricePerProduct = selectedTier ? selectedTier.pricePKR + extraBlocks * selectedTier.variantExtraPKR : 0;
  const usdServiceCostNum = calcProductsNum * usdPricePerProduct;
  const pkrServiceCostNum = calcProductsNum * pkrPricePerProduct;
  const selectedServiceData = selectedTier ? {
    name: selectedTier.name,
    subtitle: `${calcProductsNum} product${calcProductsNum !== 1 ? "s" : ""}`,
    sla: selectedTier.sla,
    cost: usdServiceCostNum,
    pkrCost: pkrServiceCostNum
  } : null;
  const usdTotalMonthlyCost = selectedPlan ? planPrice(selectedPlan) + (aiIsMonthly ? aiCostUSD : 0) + syncCostUSD : 0;
  const pkrTotalMonthlyCost = selectedPlan ? planPricePKR(selectedPlan) + (aiIsMonthly ? aiCostPKR : 0) + syncCostPKR : 0;
  const totalMonthlyCost = usdTotalMonthlyCost;
  const usdTotalDueToday = selectedAI === "byok" ? 5 : 0;
  const pkrTotalDueToday = selectedAI === "byok" ? 1400 : 0;
  const totalDueToday = usdTotalDueToday;
  const isCardRequired = selectedAI !== "none" || selectedSyncs.length > 0 || !!selectedService || trialMode === "deferred";
  const getActivePlanSlug = (key) => {
    if (isLTD) {
      if (key === "starter") return "ltd_1";
      if (key === "growth") return "ltd_2";
      return "ltd_3";
    }
    if (key === "enterprise") return "business";
    return key;
  };
  const getPlanLimit = (key, limitKey) => {
    const activeSlug = getActivePlanSlug(key);
    const plan = plans?.find((p) => p.slug === activeSlug);
    if (!plan || !plan.limits) return null;
    const limitVal = plan.limits[limitKey];
    if (limitVal === null || limitVal === void 0) return null;
    if (limitVal === "0") return false;
    if (limitVal === "1") return true;
    if (!isNaN(limitVal)) return parseInt(limitVal);
    return limitVal;
  };
  const getPlanIncludes = (key) => {
    const locations = getPlanLimit(key, "locations");
    const staff = getPlanLimit(key, "staff_limit");
    const sku = getPlanLimit(key, "sku_limit");
    const locStr = locations === null ? "Unlimited Store Locations" : `${locations} Store Location${locations > 1 ? "s" : ""}`;
    const staffStr = staff === null ? "Unlimited Staff Accounts" : `${staff} Staff Account${staff > 1 ? "s" : ""}`;
    const skuStr = sku === null ? "Unlimited Product SKUs" : `${sku.toLocaleString()} Product SKUs`;
    if (key === "starter") {
      return [
        locStr,
        staffStr,
        skuStr,
        "Full POS Checkout",
        "Double-Entry Khata",
        "WebUSB Thermal Printing",
        "Vena AI Support Chat",
        "Email Support"
      ];
    }
    if (key === "growth") {
      const starterLoc = getPlanLimit("starter", "locations") ?? 1;
      const starterStaff = getPlanLimit("starter", "staff_limit") ?? 3;
      const starterSku = getPlanLimit("starter", "sku_limit") ?? 1e3;
      const locCompare2 = locations === null ? `Unlimited Store Locations` : `${locations} Store Locations (up from ${starterLoc})`;
      const staffCompare2 = staff === null ? `Unlimited Staff Accounts` : `${staff} Staff Accounts (up from ${starterStaff})`;
      const skuCompare2 = sku === null ? `Unlimited Product SKUs` : `${sku.toLocaleString()} Product SKUs (up from ${starterSku.toLocaleString()})`;
      return [
        locCompare2,
        staffCompare2,
        skuCompare2,
        "3-Store Multi-Branch Sync",
        "Batch & Expiry Tracking",
        "Bill of Materials",
        "WhatsApp Debt Alerts",
        "Live Agent Chat Support"
      ];
    }
    const growthLoc = getPlanLimit("growth", "locations") ?? 3;
    const growthStaff = getPlanLimit("growth", "staff_limit") ?? 10;
    const growthSku = getPlanLimit("growth", "sku_limit") ?? 1e4;
    const locCompare = locations === null ? `Unlimited Store Locations (up from ${growthLoc})` : `${locations} Store Locations (up from ${growthLoc})`;
    const staffCompare = staff === null ? `Unlimited Staff Accounts (up from ${growthStaff})` : `${staff} Staff Accounts (up from ${growthStaff})`;
    const skuCompare = sku === null ? `Unlimited Product SKUs (up from ${growthSku.toLocaleString()})` : `${sku.toLocaleString()} Product SKUs (up from ${growthSku.toLocaleString()})`;
    return [
      locCompare,
      staffCompare,
      skuCompare,
      "Serial / IMEI Lifecycle Tracking",
      "Auto-Assembly Production Runs",
      "Loyalty & Gift Cards",
      "24/7 Priority SLA",
      "Dedicated Account Manager"
    ];
  };
  const getPlanExcludes = (key) => {
    if (key === "starter") {
      return ["Multi-branch syncing", "Batch & Expiry tracking", "Bill of Materials"];
    }
    if (key === "growth") {
      return ["Serial / IMEI tracking", "Auto-assembly production runs"];
    }
    return [];
  };
  const PLAN_DATA = {
    starter: {
      name: "Starter Engine",
      tagline: "Single-location stores getting serious about POS & inventory.",
      icon: Zap,
      color: "blue",
      accentFrom: "from-blue-500/[0.08]",
      accentBorder: "border-blue-500/30",
      accentGlow: "shadow-blue-900/20",
      iconBg: "bg-blue-500/10 text-blue-400",
      badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-300",
      inheritLabel: null,
      includes: getPlanIncludes("starter"),
      excludes: getPlanExcludes("starter")
    },
    growth: {
      name: "Growth Engine",
      tagline: "Expanding outlets that need multi-location stock routing.",
      icon: TrendingUp,
      color: "indigo",
      accentFrom: "from-indigo-500/[0.10]",
      accentBorder: "border-indigo-500/40",
      accentGlow: "shadow-indigo-900/30",
      iconBg: "bg-indigo-500/10 text-indigo-400",
      badgeBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      popular: true,
      inheritLabel: "Everything in Starter Engine, plus:",
      includes: getPlanIncludes("growth"),
      excludes: getPlanExcludes("growth")
    },
    enterprise: {
      name: "Enterprise Engine",
      tagline: "Multi-channel operators demanding full-scale operations.",
      icon: Crown,
      color: "purple",
      accentFrom: "from-purple-500/[0.08]",
      accentBorder: "border-purple-500/30",
      accentGlow: "shadow-purple-900/20",
      iconBg: "bg-purple-500/10 text-purple-400",
      badgeBg: "bg-purple-500/10 border-purple-500/20 text-purple-300",
      inheritLabel: "Everything in Growth Engine, plus:",
      includes: getPlanIncludes("enterprise"),
      excludes: getPlanExcludes("enterprise")
    }
  };
  const SYNC_CHANNELS = [
    { key: "woocommerce", name: "WooCommerce", icon: Globe, desc: "Real-time bidirectional stock sync for WordPress/WooCommerce stores.", priceUSD: 10, pricePKR: 2800 },
    { key: "amazon", name: "Amazon Marketplace", icon: ShoppingCart, desc: "Automate order extraction and live inventory tracking across Amazon.", priceUSD: 10, pricePKR: 2800 },
    { key: "ebay", name: "eBay Integration", icon: Package, desc: "Sync inventory counts and sales invoices automatically with eBay.", priceUSD: 10, pricePKR: 2800 },
    { key: "tiktok", name: "TikTok Shop", icon: Star, desc: "Connect catalog attributes and import marketplace sales from TikTok.", priceUSD: 10, pricePKR: 2800 }
  ];
  const FAQS = [
    { id: "faq-trial", q: "Do I need a credit card to start my trial?", a: "No. If you select a base plan without any AI add-on, sync integration, or onboarding service, your 14-day trial starts immediately with zero card details required. A card is only needed if you add an AI plan, connect a sync channel, or select an onboarding service." },
    { id: "faq-ai-cost", q: "What is the $5 one-time BYOK fee for?", a: "Bringing Your Own API Key (BYOK) means you connect your own OpenAI or Gemini key. We charge a one-time $5 platform activation fee to unlock the AI routing layer in your account. After that, you are billed directly by your AI provider — we charge you nothing ongoing. This fee does not expire and has no hidden conditions." },
    { id: "faq-ai-monthly", q: "How does managed AI billing work?", a: "Managed AI plans (AI Core, AI Lite, AI Pro, AI Ultimate) are monthly add-ons. We handle the infrastructure, models, and usage. You pay us a flat monthly fee and we take care of the rest. There is no usage surprise billing — your monthly cap is shown clearly on your plan." },
    { id: "faq-charge", q: "When will my card actually be charged?", a: "Your subscription is only charged after your 14-day free trial ends — not on the day you sign up. The only immediate charge possible is the $5 BYOK activation fee (if you select that option). Onboarding services are charged from inside your admin panel when you choose to initiate the service — not at checkout." },
    { id: "faq-service", q: "How do onboarding services work with the trial?", a: `You have two options. You can start your trial immediately and request the setup service later from your admin panel (we begin within 48 hours of your request). Or you can choose "Pause Trial" — your trial clock is held while our team completes your setup, and you get your full 14 days on a store that's already ready.` },
    { id: "faq-cancel", q: "Can I cancel during the trial?", a: "Yes, at any time. No questions asked. If you cancel before day 14, you owe nothing for your subscription. If you selected a BYOK activation, that $5 one-time fee is non-refundable (it activated your AI routing). If you added an onboarding service and we have already begun work, the service fee applies per our terms." },
    { id: "faq-upgrade", q: "Can I change my plan later?", a: "Yes. You can upgrade or downgrade your plan at any time from your admin dashboard. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle." }
  ];
  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
  };
  const handleContinue = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1800);
  };
  const renderPricingPage = () => /* @__PURE__ */ jsxs("div", { className: "space-y-0", children: [
    /* @__PURE__ */ jsx("section", { className: "relative pt-28 sm:pt-36 pb-16 px-6 text-center", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
      /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsx(SectionLabel, { icon: Sparkles, children: "14-Day Free Trial — No Card Required" }) }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.08, children: /* @__PURE__ */ jsxs("h1", { className: "text-[2.75rem] xs:text-5xl md:text-[68px] font-black tracking-tighter leading-[0.9] sm:leading-[0.88] mb-5 font-display", children: [
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent", children: "Pick your plan." }),
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-300 bg-clip-text text-transparent vq-text-glow", children: "Power it with AI." })
      ] }) }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.15, children: /* @__PURE__ */ jsx("p", { className: "text-base text-slate-400 max-w-xl mx-auto leading-relaxed", children: "Select a plan below. We'll then show you exactly which AI tier fits it best — so you're never comparing plans, just picking your power level." }) }),
      isPK,
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.2, children: /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-16 mt-4 relative z-10", children: /* @__PURE__ */ jsx(BillingToggle, { value: billingType, onChange: setBillingType }) }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "px-6 pb-4", children: /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5", children: Object.entries(PLAN_DATA).map(([key, plan], idx) => {
      const PlanIcon = plan.icon;
      const isSelected = selectedPlan === key;
      return /* @__PURE__ */ jsx(RevealOnScroll, { delay: idx * 0.06, children: /* @__PURE__ */ jsxs(
        "div",
        {
          id: `plan-${key}`,
          onClick: () => handlePlanSelect(key),
          className: `relative rounded-[2rem] border cursor-pointer overflow-hidden transition-all duration-500 flex flex-col
                                            ${isSelected ? `bg-gradient-to-b ${plan.accentFrom} to-transparent ${plan.accentBorder} shadow-2xl ${plan.accentGlow} scale-[1.015]` : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.035] hover:border-white/10 hover:scale-[1.005]"}`,
          children: [
            plan.popular && /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-500" }),
            plan.popular && /* @__PURE__ */ jsx("div", { className: "absolute top-3 right-4", children: /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[9px] font-black tracking-widest uppercase", children: "Most Popular" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-7", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-5", children: [
                /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${plan.iconBg}`, children: /* @__PURE__ */ jsx(PlanIcon, { size: 18 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-white font-black text-base tracking-tight", children: plan.name }),
                  isSelected && /* @__PURE__ */ jsx("span", { className: `text-[9px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded-full ${plan.badgeBg} border`, children: "Selected ✓" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[32px] font-black text-white font-display", children: planPriceStr(key) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium mt-1", children: isLTD ? "2-year hosting included, one payment" : billingType === "subscription_annual" ? "billed annually" : "billed monthly" }),
                isPK
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 leading-relaxed mb-5", children: plan.tagline }),
              plan.inheritLabel && /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${isSelected ? "bg-white/[0.04]" : "bg-white/[0.02]"} border border-white/[0.05]`, children: [
                /* @__PURE__ */ jsx(Layers, { size: 11, className: "text-indigo-400 flex-shrink-0" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-indigo-300 uppercase tracking-wider", children: plan.inheritLabel })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                plan.includes.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                  /* @__PURE__ */ jsx(Check, { size: 12, className: "text-emerald-400 flex-shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-300", children: f })
                ] }, i)),
                plan.excludes.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                  /* @__PURE__ */ jsx(X, { size: 12, className: "text-slate-500 flex-shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500", children: f })
                ] }, i))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "px-7 pb-6 pt-3 space-y-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    handlePlanSelect(key);
                    setTimeout(() => handleContinue(), 50);
                  },
                  className: `w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 duration-200 ${isSelected ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.05]"}`,
                  children: isSelected ? "Selected ✓" : "Choose Plan"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: `h-[2px] rounded-full transition-all duration-500 ${isSelected ? "bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-500 opacity-100" : "bg-white/[0.04] opacity-30"}` })
            ] })
          ]
        }
      ) }, key);
    }) }) }) }),
    false,
    /* @__PURE__ */ jsx("section", { className: "px-6 py-16", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx(SectionLabel, { icon: BarChart3, children: "Deep Dive Comparison" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-white tracking-tight font-display", children: "Everything, side by side." }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-2", children: "No asterisks. No fine print. Just exactly what each plan includes." })
      ] }) }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsx("div", { className: "rounded-[1.5rem] border border-white/[0.07] bg-white/[0.01] overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[600px]", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/[0.07]", children: [
          /* @__PURE__ */ jsx("th", { className: "py-5 pl-6 pr-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Feature" }),
          /* @__PURE__ */ jsx("th", { className: "py-5 px-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
            /* @__PURE__ */ jsx(Zap, { size: 14, className: "text-blue-400" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-300 uppercase tracking-wide", children: "Starter" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] text-blue-400 font-bold", children: planPriceStr("starter") })
          ] }) }),
          /* @__PURE__ */ jsx("th", { className: "py-5 px-4 text-center bg-indigo-950/20", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
            /* @__PURE__ */ jsx(TrendingUp, { size: 14, className: "text-indigo-400" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-300 uppercase tracking-wide", children: "Growth" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] text-indigo-400 font-bold", children: planPriceStr("growth") })
          ] }) }),
          /* @__PURE__ */ jsx("th", { className: "py-5 pr-6 pl-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
            /* @__PURE__ */ jsx(Crown, { size: 14, className: "text-purple-400" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-300 uppercase tracking-wide", children: "Enterprise" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] text-purple-400 font-bold", children: planPriceStr("enterprise") })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsx("tr", { className: "bg-white/[0.02]", children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest", children: "Platform Limits" }) }),
          /* @__PURE__ */ jsx(TableRow, { label: "Store Locations", starter: "1", growth: "3", enterprise: "10" }),
          /* @__PURE__ */ jsx(TableRow, { label: "Staff Accounts", starter: "3", growth: "10", enterprise: "50" }),
          /* @__PURE__ */ jsx(TableRow, { label: "Product SKUs", starter: "1,000", growth: "10,000", enterprise: "50,000" }),
          /* @__PURE__ */ jsx(TableRow, { label: "Multi-Branch Sync", starter: false, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "14-Day Free Trial", starter: true, growth: true, enterprise: true, highlight: true }),
          /* @__PURE__ */ jsx("tr", { className: "bg-white/[0.02]", children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest", children: "POS & Checkout" }) }),
          false,
          /* @__PURE__ */ jsx(TableRow, { label: "WebUSB Thermal Printing", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Multi-Tab Checkout", starter: "3 tabs", growth: "10 tabs", enterprise: "50 tabs" }),
          /* @__PURE__ */ jsx(TableRow, { label: "Park & Recall (Hold Bill)", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Split Payments", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Serial / IMEI Tracking", starter: false, growth: false, enterprise: true, highlight: true }),
          /* @__PURE__ */ jsx("tr", { className: "bg-white/[0.02]", children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest", children: "Inventory" }) }),
          /* @__PURE__ */ jsx(TableRow, { label: "Product Variants & FIFO", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Batch & Expiry Tracking", starter: false, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Bill of Materials (Recipes)", starter: false, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Auto-Assembly Production", starter: false, growth: false, enterprise: true, highlight: true }),
          /* @__PURE__ */ jsx("tr", { className: "bg-white/[0.02]", children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest", children: "Finance & Accounting" }) }),
          /* @__PURE__ */ jsx(TableRow, { label: "Double-Entry Ledger", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Customer Khata (Credit)", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "WhatsApp Debt Alerts", starter: false, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Bank Reconciliation", starter: false, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Loyalty & Gift Cards", starter: false, growth: false, enterprise: true, highlight: true }),
          /* @__PURE__ */ jsx("tr", { className: "bg-white/[0.02]", children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest", children: "Reports" }) }),
          /* @__PURE__ */ jsx(TableRow, { label: "Sales & Purchase Reports", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Profit & Loss Statement", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Balance Sheet", starter: false, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Cash Flow Statement", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "40-Report Full Suite", starter: false, growth: false, enterprise: true, highlight: true }),
          /* @__PURE__ */ jsx("tr", { className: "bg-white/[0.02]", children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-2.5 pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest", children: "Support" }) }),
          /* @__PURE__ */ jsx(TableRow, { label: "AI Support Chatbot (Vena)", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Live Agent Support (Handoff)", starter: false, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Email Support", starter: true, growth: true, enterprise: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "24/7 Priority SLA", starter: false, growth: false, enterprise: true, highlight: true }),
          /* @__PURE__ */ jsx(TableRow, { label: "Dedicated Account Manager", starter: false, growth: false, enterprise: true })
        ] })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "px-6 py-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
      /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx(SectionLabel, { icon: MessageSquare, children: "Common Questions" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-white tracking-tight font-display", children: "Straight answers." })
      ] }) }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsx("div", { className: "divide-y-0", children: FAQS.map((f) => /* @__PURE__ */ jsx(FaqItem, { id: f.id, question: f.q, answer: f.a }, f.id)) }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "px-6 py-10 pb-20", children: /* @__PURE__ */ jsx("div", { className: "max-w-lg mx-auto", children: /* @__PURE__ */ jsxs(RevealOnScroll, { children: [
      /* @__PURE__ */ jsx("div", { className: "text-center mb-6", children: selectedPlan ? /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400 mb-4", children: [
        /* @__PURE__ */ jsx(Check, { size: 14, className: "text-emerald-400" }),
        /* @__PURE__ */ jsxs("span", { children: [
          PLAN_DATA[selectedPlan]?.name,
          " selected",
          selectedAIData ? ` + ${selectedAIData.name}` : selectedAI === "byok" ? " + BYOK" : ""
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-sm mb-4", children: "Select a plan above to continue" }) }),
      /* @__PURE__ */ jsx(
        MagneticButton,
        {
          id: "pricing-continue-btn",
          onClick: selectedPlan ? handleContinue : void 0,
          variant: selectedPlan ? "indigo" : "ghost",
          className: `w-full py-5 justify-center text-sm ${!selectedPlan ? "opacity-40 cursor-not-allowed" : ""}`,
          children: selectedPlan ? /* @__PURE__ */ jsxs(Fragment, { children: [
            "Secure My Plan ",
            /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            "Select a plan to continue ",
            /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
          ] })
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-center text-[11px] text-slate-500 mt-3", children: isCardRequired && selectedPlan ? "Card authorized today. Charged only after 14-day trial ends." : "14-day free trial. No card. No commitment." })
    ] }) }) })
  ] });
  const renderSyncStep = () => /* @__PURE__ */ jsx("section", { className: "min-h-screen px-6 py-24", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-[10px] font-black tracking-widest uppercase mb-4", children: "Step 2 of 3" }),
      /* @__PURE__ */ jsx("h2", { className: "text-4xl font-black text-white tracking-tight font-display mb-3", children: "Do you sell online?" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm max-w-md mx-auto leading-relaxed", children: "Connect your existing platforms and everything syncs in one place — stock, orders, and customers. You can also do this anytime from your dashboard." }),
      /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400" }),
        /* @__PURE__ */ jsx("span", { className: "text-[11px] text-emerald-400 font-semibold", children: "No card needed to connect — just to subscribe later" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: SYNC_CHANNELS.map((ch, idx) => {
      const SyncIcon = ch.icon;
      const isAdded = selectedSyncs.includes(ch.key);
      return /* @__PURE__ */ jsx(RevealOnScroll, { delay: idx * 0.05, children: /* @__PURE__ */ jsx(
        "button",
        {
          id: `sync-${ch.key}`,
          onClick: () => setSelectedSyncs(isAdded ? selectedSyncs.filter((s) => s !== ch.key) : [...selectedSyncs, ch.key]),
          className: `w-full text-left p-5 rounded-2xl border transition-all duration-300
                                        ${isAdded ? "bg-indigo-600/8 border-indigo-500/40 shadow-md shadow-indigo-950/10" : "bg-white/[0.02] border-white/[0.06] hover:border-white/10"}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isAdded ? "bg-indigo-500/15" : "bg-white/[0.04]"}`, children: /* @__PURE__ */ jsx(SyncIcon, { size: 16, className: isAdded ? "text-indigo-400" : "text-slate-500" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-white text-sm font-bold", children: ch.name }),
                /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-xs mt-0.5 leading-relaxed", children: ch.desc })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1.5 flex-shrink-0", children: [
              /* @__PURE__ */ jsx("div", { className: `w-4 h-4 rounded border flex items-center justify-center transition-all ${isAdded ? "border-indigo-400 bg-indigo-500" : "border-slate-700"}`, children: isAdded && /* @__PURE__ */ jsx(Check, { size: 9, className: "text-white", strokeWidth: 3 }) }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-white font-bold whitespace-nowrap", children: [
                "+",
                fmt(ch.priceUSD, ch.pricePKR),
                "/mo"
              ] })
            ] })
          ] })
        }
      ) }, ch.key);
    }) }),
    selectedSyncs.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/15 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Globe, { size: 14, className: "text-indigo-400 flex-shrink-0" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "The moment a barcode transaction completes inside your POS, stock updates across all connected platforms in under 3 seconds. No overselling. Ever." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-white/[0.05]", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            setCurrentStep(1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          },
          className: "flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.06] text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 13 }),
            " Back"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        MagneticButton,
        {
          id: "sync-continue",
          onClick: () => {
            setCurrentStep(3);
            window.scrollTo({ top: 0, behavior: "smooth" });
          },
          variant: "indigo",
          className: "px-8 py-3.5 text-xs font-black uppercase tracking-widest",
          children: [
            selectedSyncs.length > 0 ? `Continue with ${selectedSyncs.length} channel${selectedSyncs.length > 1 ? "s" : ""}` : "Skip for now",
            " ",
            /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
          ]
        }
      )
    ] })
  ] }) });
  const renderOnboardingStep = () => {
    const fmtCost = (usdAmount, pkrAmount = null) => {
      const usdVal = parseFloat(usdAmount) || 0;
      let str = `$${usdVal.toFixed(2)}`;
      return str;
    };
    const hasEstimate = selectedTier && calcProductsNum > 0;
    return /* @__PURE__ */ jsx("section", { className: "min-h-screen px-6 py-24", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-[10px] font-black tracking-widest uppercase mb-4", children: "Step 3 of 3" }),
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-black text-white tracking-tight font-display mb-3", children: "Want us to load your products?" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm max-w-lg mx-auto leading-relaxed", children: "We'll upload your catalog for you — fully configured and ready to sell from day one. Pay only for what you need, per product. No fixed packages." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Object.values(SERVICE_TIERS).map((tier, idx) => {
        const isChosen = selectedService === tier.key;
        return /* @__PURE__ */ jsx(
          "button",
          {
            id: `service-tier-${tier.key}`,
            onClick: () => setSelectedService(isChosen ? null : tier.key),
            className: `w-full text-left p-5 rounded-2xl border transition-all duration-300
                                    ${isChosen ? "bg-indigo-600/[0.08] border-indigo-500/40" : "bg-white/[0.02] border-white/[0.06] hover:border-white/10"}`,
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${isChosen ? "border-indigo-400 bg-indigo-500" : "border-slate-700"}`, children: isChosen && /* @__PURE__ */ jsx(Check, { size: 9, className: "text-white", strokeWidth: 3 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-lg", children: tier.emoji }),
                    /* @__PURE__ */ jsx("span", { className: "text-white font-bold text-sm", children: tier.name }),
                    idx === 1 && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[8px] font-black tracking-widest uppercase", children: "Most Popular" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs mt-1 leading-relaxed", children: tier.desc }),
                  /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-[10px] mt-1.5 font-semibold", children: [
                    "⏱ Turnaround: ",
                    tier.sla
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right flex-shrink-0", children: [
                /* @__PURE__ */ jsx("div", { className: "text-white font-black text-lg", children: fmtCost(tier.priceUSD, tier.pricePKR) }),
                /* @__PURE__ */ jsx("div", { className: "text-[9px] text-slate-500 font-black uppercase tracking-widest", children: "per product" }),
                /* @__PURE__ */ jsxs("div", { className: "text-[9px] text-indigo-400 font-semibold mt-0.5", children: [
                  "+",
                  fmtCost(0.5, 50),
                  " / extra 5 variants"
                ] })
              ] })
            ] })
          },
          tier.key
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5", children: /* @__PURE__ */ jsx(Layers, { size: 11, className: "text-indigo-400" }) }),
        /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-400 leading-relaxed", children: [
          /* @__PURE__ */ jsx("span", { className: "text-white font-semibold", children: "Variant pricing:" }),
          " The first 5 variants per product are included in the base price. Every additional 5 variants cost ",
          fmtCost(0.5, 50),
          " more. Example: a product with 20 variants = base price + 3 extra blocks (",
          fmtCost(1.5, 150),
          " more)."
        ] })
      ] }),
      selectedTier && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 to-transparent overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 border-b border-white/[0.05] flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(BarChart3, { size: 14, className: "text-indigo-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-white uppercase tracking-widest", children: "Cost Estimator" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 ml-1", children: "— see your price before committing" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2", children: "How many products?" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "calc-products",
                  type: "number",
                  min: "1",
                  placeholder: "e.g. 50",
                  value: calcProducts,
                  onChange: (e) => setCalcProducts(e.target.value),
                  className: "w-full bg-black/30 border border-white/[0.07] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2", children: "Average variants per product?" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "calc-variants",
                  type: "number",
                  min: "1",
                  placeholder: "e.g. 3 (default: 1)",
                  value: calcVariants,
                  onChange: (e) => setCalcVariants(e.target.value),
                  className: "w-full bg-black/30 border border-white/[0.07] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 mt-1.5", children: "Leave blank if products have no variants or ≤5" })
            ] })
          ] }),
          hasEstimate && /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-4 border-t border-white/[0.05]", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-slate-400", children: [
                calcProductsNum,
                " products × ",
                fmtCost(selectedTier.priceUSD, selectedTier.pricePKR),
                " base"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-slate-300 font-semibold font-mono", children: fmtCost(calcProductsNum * selectedTier.priceUSD, calcProductsNum * selectedTier.pricePKR) })
            ] }),
            extraBlocks > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-slate-400", children: [
                calcProductsNum,
                " products × ",
                extraBlocks,
                " extra variant block",
                extraBlocks > 1 ? "s" : "",
                " × ",
                fmtCost(0.5, 50)
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-slate-300 font-semibold font-mono", children: fmtCost(calcProductsNum * extraBlocks * 0.5, calcProductsNum * extraBlocks * 50) })
            ] }),
            calcVariantsNum > 1 && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between text-[10px] text-slate-500", children: /* @__PURE__ */ jsxs("span", { children: [
              "Per product: ",
              fmtCost(usdPricePerProduct, pkrPricePerProduct),
              " (",
              calcVariantsNum,
              " variants — first 5 free",
              extraBlocks > 0 ? `, +${extraBlocks} block${extraBlocks > 1 ? "s" : ""}` : "",
              ")"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-white/[0.06] mt-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-white font-black text-sm", children: "Your estimated total" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-indigo-300 font-display", children: fmtCost(usdServiceCostNum, pkrServiceCostNum) })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 leading-relaxed", children: "This is an estimate. Final invoice is generated when you initiate the service from your admin panel — after reviewing and confirming." })
          ] }),
          !hasEstimate && /* @__PURE__ */ jsx("div", { className: "text-center py-4 text-slate-500 text-xs", children: "Enter your product count above to see your estimated cost →" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/10 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5", children: /* @__PURE__ */ jsx(ShieldCheck, { size: 12, className: "text-emerald-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-emerald-300 text-xs font-bold mb-1", children: "Not charged at checkout" }),
            /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-xs leading-relaxed", children: [
              "Adding your card now just unlocks the service. You trigger it yourself from the admin panel — ",
              /* @__PURE__ */ jsx("strong", { className: "text-slate-300", children: "that's when the charge happens" }),
              ", after you've reviewed the final product count."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5", children: /* @__PURE__ */ jsx(Rocket, { size: 12, className: "text-indigo-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-indigo-300 text-xs font-bold mb-1", children: "Trial paused while we work" }),
            /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-xs leading-relaxed", children: [
              "Your 14-day trial is ",
              /* @__PURE__ */ jsx("strong", { className: "text-slate-300", children: "held while we load your catalog" }),
              ". Every one of your trial days starts on a store that's already live and stocked."
            ] })
          ] })
        ] })
      ] }),
      selectedService && /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-white text-sm font-bold", children: "When should we start your trial?" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
          { key: "instant", emoji: "⚡", label: "Start immediately", desc: "Trial runs now. Request catalog loading whenever you're ready from your dashboard." },
          { key: "deferred", emoji: "⏸️", label: "Wait until catalog is ready", desc: "Trial clock pauses. Starts only after your products are fully loaded." }
        ].map((opt) => /* @__PURE__ */ jsxs(
          "button",
          {
            id: `trial-mode-${opt.key}`,
            onClick: () => setTrialMode(opt.key),
            className: `text-left p-4 rounded-xl border transition-all duration-300
                                        ${trialMode === opt.key ? "bg-indigo-600/8 border-indigo-500/40" : "bg-white/[0.02] border-white/[0.06] hover:border-white/8"}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: "text-base mb-1", children: opt.emoji }),
              /* @__PURE__ */ jsx("div", { className: "text-white text-xs font-bold mb-1", children: opt.label }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-[10px] leading-relaxed", children: opt.desc })
            ]
          },
          opt.key
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-white/[0.05]", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              setCurrentStep(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            },
            className: "flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.06] text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { size: 13 }),
              " Back"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          MagneticButton,
          {
            id: "onboarding-continue",
            onClick: () => {
              setCurrentStep(4);
              window.scrollTo({ top: 0, behavior: "smooth" });
            },
            variant: "indigo",
            className: "px-8 py-3.5 text-xs font-black uppercase tracking-widest",
            children: [
              selectedService ? hasEstimate ? `Continue — ${fmt(usdServiceCostNum, pkrServiceCostNum)} estimated` : `Continue with ${selectedTier.name}` : "Skip — go to checkout",
              " ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
            ]
          }
        )
      ] })
    ] }) });
  };
  const renderCheckout = () => {
    const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3);
    const trialEndStr = trialEndDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    return /* @__PURE__ */ jsx("section", { className: "min-h-screen px-6 py-24", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-black text-white tracking-tight font-display mb-2", children: "Review & Confirm" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm", children: "Everything you've selected. Clear. In one place." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-6 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4", children: "Your Subscription" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-white font-bold", children: selectedPlan && PLAN_DATA[selectedPlan]?.name }),
                /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-xs mt-0.5", children: "14-day free trial → then auto-renews" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-slate-300 font-black text-lg", children: selectedPlan && fmt(planPrice(selectedPlan), planPricePKR(selectedPlan), isLTD ? "" : "/mo") }),
                /* @__PURE__ */ jsx("div", { className: "text-emerald-400 text-[10px] font-bold", children: "$0.00 today" })
              ] })
            ] }),
            selectedAIData && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "text-white font-bold text-sm", children: [
                  selectedAIData.emoji,
                  " ",
                  selectedAIData.name
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-xs mt-0.5", children: "Managed AI — included in trial" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-slate-300 font-bold", children: [
                  "+",
                  fmt(selectedAIData.priceUSD, selectedAIData.pricePKR, "/mo")
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-emerald-400 text-[10px] font-bold", children: "$0.00 today" })
              ] })
            ] }),
            selectedAI === "byok" && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-white font-bold text-sm", children: "🔑 BYOK AI Activation" }),
                /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-xs mt-0.5", children: "One-time unlock — free AI forever after" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-amber-400 font-black", children: fmt(5, 1400) }),
                /* @__PURE__ */ jsx("div", { className: "text-amber-400 text-[10px] font-bold", children: "charged today" })
              ] })
            ] }),
            selectedSyncs.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "text-white font-bold text-sm", children: [
                  selectedSyncs.length,
                  " Platform Sync",
                  selectedSyncs.length > 1 ? "s" : ""
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-xs mt-0.5", children: selectedSyncs.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-slate-300 font-bold", children: [
                  "+",
                  fmt(syncCostUSD, syncCostPKR, "/mo")
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-emerald-400 text-[10px] font-bold", children: "$0.00 today" })
              ] })
            ] })
          ] }),
          selectedServiceData && /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4", children: "Optional Service" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "text-white font-bold", children: [
                  selectedTier?.emoji,
                  " Catalog Loading — ",
                  selectedTier?.name
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-slate-500 text-xs mt-0.5", children: [
                  calcProductsNum,
                  " products · charged when initiated from dashboard"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-amber-400 font-black", children: [
                  fmt(usdServiceCostNum, pkrServiceCostNum),
                  " est."
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-amber-400 text-[10px] font-bold", children: "deferred — from dashboard" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5", children: "Your Billing Timeline" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-5 relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-white/[0.05]", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-emerald-400" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-0.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-white text-xs font-bold", children: "Today" }),
                  /* @__PURE__ */ jsx("span", { className: "text-emerald-400 text-xs font-black", children: fmt(totalDueToday, pkrTotalDueToday) })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-[10px]", children: totalDueToday > 0 ? "BYOK activation fee charged. Trial begins." : "No charge. Trial begins immediately." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-indigo-500" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-0.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-white text-xs font-bold", children: trialEndStr }),
                  /* @__PURE__ */ jsx("span", { className: "text-indigo-400 text-xs font-black", children: fmt(totalMonthlyCost, pkrTotalMonthlyCost, "/mo") })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-[10px]", children: "First subscription charge — only if you choose to continue. Cancel anytime before this date." })
              ] }),
              selectedServiceData && /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-amber-400" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-0.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-white text-xs font-bold", children: "When you initiate catalog loading" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-amber-400 text-xs font-black", children: [
                    fmt(usdServiceCostNum, pkrServiceCostNum),
                    " est."
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-[10px]", children: [
                  "Charged per product from your admin panel. Turnaround: ",
                  selectedTier?.sla,
                  "."
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-indigo-600/8 border border-indigo-500/20 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-white font-bold text-sm", children: "Due today" }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-400 text-[10px]", children: totalDueToday > 0 ? "BYOK activation" : "Nothing. Trial is free." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-3xl font-black text-emerald-400", children: fmt(totalDueToday, pkrTotalDueToday) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-full lg:w-[380px] bg-white/[0.01] border border-white/[0.06] rounded-[1.75rem] p-7", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleFormSubmit, className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsx(Lock, { size: 13, className: "text-indigo-400" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-white uppercase tracking-widest", children: "Secure Activation" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5", children: "Business Email" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                required: true,
                placeholder: "name@business.com",
                value: checkoutDetails.email,
                onChange: (e) => setCheckoutDetails({ ...checkoutDetails, email: e.target.value }),
                className: "w-full bg-black/30 border border-white/[0.06] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5", children: "Phone Number" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "tel",
                required: true,
                placeholder: "+1 (555) 000-0000",
                value: checkoutDetails.phone,
                onChange: (e) => setCheckoutDetails({ ...checkoutDetails, phone: e.target.value }),
                className: "w-full bg-black/30 border border-white/[0.06] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
              }
            )
          ] }),
          isCardRequired ? /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-4 border-t border-white/[0.05]", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-amber-400 uppercase tracking-wider", children: "Card Details" }),
              /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-slate-500 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Lock, { size: 9 }),
                " Secured"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5", children: "Cardholder Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  required: true,
                  placeholder: "Jane Doe",
                  value: checkoutDetails.cardholder,
                  onChange: (e) => setCheckoutDetails({ ...checkoutDetails, cardholder: e.target.value }),
                  className: "w-full bg-black/30 border border-white/[0.06] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5", children: "Card Number" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  required: true,
                  placeholder: "•••• •••• •••• ••••",
                  maxLength: "19",
                  value: checkoutDetails.cardNumber,
                  onChange: (e) => setCheckoutDetails({ ...checkoutDetails, cardNumber: e.target.value }),
                  className: "w-full bg-black/30 border border-white/[0.06] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono outline-none transition-all"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5", children: "Expiry" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    required: true,
                    placeholder: "MM/YY",
                    maxLength: "5",
                    value: checkoutDetails.expiry,
                    onChange: (e) => setCheckoutDetails({ ...checkoutDetails, expiry: e.target.value }),
                    className: "w-full bg-black/30 border border-white/[0.06] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono text-center outline-none transition-all"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5", children: "CVC" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "password",
                    required: true,
                    placeholder: "•••",
                    maxLength: "4",
                    value: checkoutDetails.cvc,
                    onChange: (e) => setCheckoutDetails({ ...checkoutDetails, cvc: e.target.value }),
                    className: "w-full bg-black/30 border border-white/[0.06] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono text-center outline-none transition-all"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 leading-relaxed", children: "Encrypted connection. Your card is authorized today. Subscription is charged only after your 14-day trial ends — and only if you choose to continue." })
          ] }) : /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-white/[0.05]", children: /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/10 flex items-start gap-2.5", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 14, className: "text-emerald-400 flex-shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 leading-relaxed", children: "No credit card required. Your trial starts immediately with full dashboard access." })
          ] }) }),
          /* @__PURE__ */ jsx(
            "button",
            {
              id: "checkout-submit",
              type: "submit",
              disabled: isSubmitting,
              className: `w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2
                                        ${isSubmitting ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-white text-[#020010] hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.3)] shadow-lg"}`,
              children: isSubmitting ? /* @__PURE__ */ jsx("span", { children: "Activating your account..." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                isCardRequired ? "Activate & Start Trial" : "Start Free Trial",
                " ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setCurrentStep(3);
                window.scrollTo({ top: 0, behavior: "smooth" });
              },
              className: "w-full text-center text-slate-500 hover:text-slate-400 text-[11px] font-bold uppercase tracking-widest transition-colors",
              children: "← Back"
            }
          )
        ] }) })
      ] })
    ] }) });
  };
  const renderConfirmation = () => {
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3);
    const trialEndStr = trialEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    return /* @__PURE__ */ jsx("section", { className: "min-h-screen px-6 py-24 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "max-w-2xl w-full", children: /* @__PURE__ */ jsxs("div", { className: "rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-b from-[#0a1a14] to-[#040212] p-10 md:p-12 text-center relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 28, className: "text-emerald-400" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-black text-white tracking-tight font-display mb-2", children: "You're in." }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm mb-8", children: "Your account has been activated. Here's exactly what happens next." }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left space-y-3 mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3", children: "What you purchased" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: selectedPlan && PLAN_DATA[selectedPlan]?.name }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-semibold", children: selectedPlan && fmt(planPrice(selectedPlan), planPricePKR(selectedPlan), isLTD ? "" : "/mo") })
          ] }),
          selectedAIData && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
              selectedAIData.emoji,
              " ",
              selectedAIData.name
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-slate-400 font-semibold", children: [
              "+",
              fmt(selectedAIData.priceUSD, selectedAIData.pricePKR, "/mo")
            ] })
          ] }),
          selectedSyncs.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
              selectedSyncs.length,
              " Platform Sync",
              selectedSyncs.length > 1 ? "s" : ""
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-slate-400 font-semibold", children: [
              "+",
              fmt(syncCostUSD, syncCostPKR, "/mo")
            ] })
          ] }),
          selectedServiceData && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm pt-2 border-t border-white/[0.05]", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
              "Catalog Loading — ",
              selectedTier?.name
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-amber-400 font-semibold", children: [
              fmt(usdServiceCostNum, pkrServiceCostNum),
              " est."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left space-y-4 mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest", children: "What happens next" }),
          [
            { dot: "bg-emerald-400", title: "Right now", desc: `Your 14-day trial has started. Log in and explore everything.${totalDueToday > 0 ? ` BYOK activation fee of ${fmt(totalDueToday, pkrTotalDueToday)} has been processed.` : " No charge today."}` },
            ...selectedServiceData ? [{ dot: "bg-indigo-400", title: "Within 2 business hours", desc: `Our team will contact you on ${checkoutDetails.phone || "the number you provided"} to confirm your catalog details and begin loading ${calcProductsNum} products. Turnaround: ${selectedTier?.sla}.` }] : [],
            { dot: "bg-purple-400", title: trialEndStr, desc: `Trial ends. Subscription begins at ${fmt(totalMonthlyCost, pkrTotalMonthlyCost, "/mo")} — only if you choose to stay. Cancel from your dashboard anytime before this date.` }
          ].map((step, i) => /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
              /* @__PURE__ */ jsx("div", { className: `w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${step.dot}` }),
              i < 2 && /* @__PURE__ */ jsx("div", { className: "w-px flex-1 bg-white/[0.05] my-1" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pb-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-white text-xs font-bold mb-0.5", children: step.title }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-[11px] leading-relaxed", children: step.desc })
            ] })
          ] }, i))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center gap-3 mb-6 text-sm text-slate-400", children: [
          /* @__PURE__ */ jsx(MessageSquare, { size: 14, className: "text-indigo-400 flex-shrink-0" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Questions? WhatsApp us at ",
            /* @__PURE__ */ jsx("a", { href: "https://wa.me/923091999489", className: "text-indigo-400 font-semibold hover:text-indigo-300 transition-colors", children: "+92 309 1999489" }),
            " — we reply within a few hours."
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          MagneticButton,
          {
            id: "goto-dashboard",
            href: "/login",
            variant: "primary",
            className: "px-10 py-4 text-sm font-black uppercase tracking-widest",
            children: [
              "Go to Dashboard ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 15 })
            ]
          }
        )
      ] })
    ] }) }) });
  };
  const renderStepBar = () => {
    if (currentStep === 1 || currentStep === 5) return null;
    const steps = [
      { n: 1, label: "Plan" },
      { n: 3, label: "Setup" },
      { n: 4, label: "Checkout" }
    ];
    return /* @__PURE__ */ jsx("div", { className: "sticky top-[64px] z-40 bg-[#020010]/90 backdrop-blur-xl border-b border-white/[0.05] py-3 px-6", children: /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto flex items-center justify-between gap-2", children: steps.map((s) => {
      const done = currentStep > s.n;
      const active = currentStep === s.n;
      return /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${active ? "text-white" : done ? "text-emerald-400" : "text-slate-500"}`, children: [
        /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all ${active ? "bg-indigo-600 text-white" : done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.04] text-slate-500"}`, children: done ? "✓" : s.n }),
        /* @__PURE__ */ jsx("span", { className: "hidden sm:block", children: s.label })
      ] }, s.n);
    }) }) });
  };
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Pricing — VenQore",
      description: "Start with the right plan. Add the AI power level that fits your business. No surprises. No hidden fees. 14-day free trial.",
      children: [
        renderStepBar(),
        currentStep === 1 && renderPricingPage(),
        currentStep === 2 && renderSyncStep(),
        currentStep === 3 && renderOnboardingStep(),
        currentStep === 4 && renderCheckout(),
        currentStep === 5 && renderConfirmation()
      ]
    }
  );
}
export {
  Pricing as default
};

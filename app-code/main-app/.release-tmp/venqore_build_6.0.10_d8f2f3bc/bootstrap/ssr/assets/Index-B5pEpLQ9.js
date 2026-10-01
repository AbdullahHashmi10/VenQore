import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { M as Modal } from "../ssr.js";
import { u as useTermText } from "./terms-BnWz3Igl.js";
import { p as preloadLemonCheckout, o as openLemonCheckout } from "./lemonCheckout-BuxyNDnA.js";
import "./runtime-zM7XrUga.js";
import { n as normalizePlan, S as SELF_SERVE_PLANS, p as planRank } from "./plans-Dp89V3MJ.js";
import { AlertTriangle, Crown, Zap, Shield, Monitor, CreditCard, RefreshCw, Receipt, BarChart2, Sparkles, History, ArrowRight, CheckCircle2, Package, Users, GitBranch, Clock, FileText, HardDrive, Cpu, Globe2, Calendar, BadgeCheck, Check, Loader2 } from "lucide-react";
import "react-dom";
import "./Input-B_UmKR56.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "axios";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
const PKR_ENABLED = false;
const PLAN_META = {
  solo: {
    label: "Solo",
    monthlyUSD: 0,
    annualUSD: 0,
    priceDisplay: "$0",
    period: "/forever",
    tag: "Free forever",
    color: "#0BAA8F",
    Icon: Monitor,
    desc: "One person, one register. Free forever with structural limits.",
    perks: [
      "Up to 500 products (SKUs)",
      "1 location, 1 full seat (2 till logins)",
      "1 register (POS till)",
      "100 sales & 20 service jobs/mo",
      "Core Ledger + all 43 financial reports",
      "30-day history visible (older safely kept)",
      "SmartCapture: 10 scans / 100 AI credits",
      "Help centre + Vena support"
    ]
  },
  starter: {
    label: "Starter",
    monthlyUSD: 49,
    annualUSD: 490,
    priceDisplay: "$49",
    period: "/month",
    tag: "Essential Till",
    color: "#3B82F6",
    Icon: Shield,
    desc: "A shop with a couple of people on the till and full history.",
    perks: [
      "Up to 5,000 products (SKUs)",
      "1 location, 1 full seat (+ $15/mo per extra seat)",
      "2 registers (cashier PIN logins unlimited)",
      "Full history retention (unlimited days)",
      "Google Drive automated backup included",
      "500 AI credits/month + 1 rebuild / 90 days",
      "Email support (2 business days)"
    ]
  },
  core: {
    label: "Core",
    monthlyUSD: 99,
    annualUSD: 990,
    priceDisplay: "$99",
    period: "/month",
    tag: "Most Popular",
    featured: true,
    color: "#8B5CF6",
    Icon: Zap,
    desc: "Multi-branch stock, API access, audit logs, custom roles and signals.",
    perks: [
      "Up to 25,000 products (SKUs)",
      "1 location, 5 full seats (+ $15/mo per extra seat)",
      "Up to 6 registers (cashier PIN logins unlimited)",
      "Multi-branch transfers (activates with 2nd location)",
      "Full REST API access & webhooks",
      "Audit trail & custom granular roles",
      "2,000 AI credits/month + 1 rebuild / 90 days",
      "Priority email support (1 business day)"
    ]
  },
  scale: {
    label: "Scale",
    monthlyUSD: 299,
    annualUSD: 2990,
    priceDisplay: "$299",
    period: "/month",
    tag: "Enterprise Scale",
    color: "#F59E0B",
    Icon: Crown,
    desc: "Large operations, custom roles, white-label and channel sync.",
    perks: [
      "Up to 250,000 products (SKUs)",
      "1 location, 25 full seats",
      "Up to 20 registers (cashier PIN logins unlimited)",
      "Multi-branch & inter-branch transfers",
      "White-label & consolidated multi-entity reporting",
      "2 channel syncs included (WooCommerce/Amazon)",
      "10,000 AI credits/month + 1 rebuild / month",
      "Named contact (4 business hours SLA)"
    ]
  },
  custom: {
    label: "Custom Enterprise",
    monthlyUSD: 800,
    annualUSD: null,
    priceDisplay: "$800+",
    period: "/month",
    tag: "Tailored SLA",
    color: "#EC4899",
    Icon: Crown,
    desc: "Dedicated multi-entity enterprise cluster with tailored SLA.",
    perks: [
      "Unlimited products & custom SKU capacity",
      "Unlimited full seats & cashiers",
      "Unlimited registers across all locations",
      "Dedicated database partition & private hosting option",
      "Custom ERP workflow integrations",
      "24/7 Phone & Slack channel SLA"
    ]
  }
};
PLAN_META.growth = PLAN_META.core;
PLAN_META.business = PLAN_META.scale;
PLAN_META.counter = PLAN_META.solo;
const SERVICE_TIERS = {
  basic: { name: "Basic Upload", priceUSD: 1, pricePKR: 100, extraUSD: 0.5, extraPKR: 50, sla: "2–3 business days", desc: "Product data uploaded with all core fields. Up to 5 variants per product included." },
  descriptions: { name: "+ Rich Descriptions", priceUSD: 1.5, pricePKR: 150, extraUSD: 0.5, extraPKR: 50, sla: "3–5 business days", desc: "Everything in Basic + long descriptions, SEO copy, and full product detail. You provide images." },
  images: { name: "+ AI Images", priceUSD: 2, pricePKR: 200, extraUSD: 0.5, extraPKR: 50, sla: "4–6 business days", desc: "Everything in Descriptions + we source or AI-generate product images for you." }
};
function UsageMeterCard({ icon: Icon, label, used, limit, suffix = "", helper = null }) {
  const isUnlimited = limit === null || limit === void 0;
  const usedNum = Number(used) || 0;
  const limitNum = Number(limit) || 0;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round(usedNum / Math.max(1, limitNum) * 100));
  const isCritical = !isUnlimited && pct >= 90;
  const isWarning = !isUnlimited && pct >= 75 && pct < 90;
  const barColor = isCritical ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-[#0BAA8F]";
  const textColor = isCritical ? "text-rose-600 dark:text-rose-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-ink";
  return /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-surface border border-line shadow-sm hover:border-line-strong hover:shadow-md transition-all flex flex-col justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl flex items-center justify-center bg-surface-raised text-ink-secondary border border-line", children: /* @__PURE__ */ jsx(Icon, { size: 16 }) }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-ink-secondary", children: label })
        ] }),
        isCritical && /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "text-rose-500 shrink-0" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `text-2xl font-bold tracking-tight mb-1 font-mono ${textColor}`, children: isUnlimited ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
        usedNum.toLocaleString(),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted font-sans font-medium", children: "/ ∞" })
      ] }) : /* @__PURE__ */ jsxs("span", { children: [
        usedNum.toLocaleString(),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted font-sans font-medium", children: [
          " / ",
          limitNum.toLocaleString(),
          suffix
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 pt-3 border-t border-line", children: isUnlimited ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-2xs font-semibold", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-[#0BAA8F] uppercase tracking-wider flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { size: 11 }),
        " Uncapped Capacity"
      ] }),
      helper && /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: helper })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "h-2 bg-surface-raised border border-line rounded-full overflow-hidden mb-1.5", children: /* @__PURE__ */ jsx(
        "div",
        {
          style: { width: `${pct}%` },
          className: `h-full rounded-full transition-all duration-500 ${barColor}`
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-2xs", children: [
        /* @__PURE__ */ jsxs("span", { className: `font-semibold uppercase tracking-wider ${isCritical ? "text-rose-600 dark:text-rose-400 font-bold" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-ink-muted"}`, children: [
          pct,
          "% utilized"
        ] }),
        helper && /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-3xs", children: helper })
      ] })
    ] }) })
  ] });
}
function PlanCardV6({
  planKey,
  _planConfig,
  isCurrent,
  _storeSlug,
  tenant,
  onSelectPlan,
  onCheckout,
  checkoutBusy = null,
  billingCycle = "monthly",
  currencyDisplay = "USD"
}) {
  const meta = PLAN_META[planKey] || { label: planKey, color: "#0BAA8F", Icon: Shield, perks: [] };
  const { Icon } = meta;
  const isLtd = planKey.startsWith("ltd");
  const currentIdx = planRank(tenant?.plan);
  const thisIdx = planRank(planKey);
  const isAnnual = billingCycle === "annual";
  const isCheckingOut = checkoutBusy === planKey;
  const monthlyRate = meta.monthlyUSD;
  const annualRate = meta.annualUSD;
  const effectiveMonthly = isAnnual && annualRate ? Math.round(annualRate / 12) : monthlyRate;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative p-6 sm:p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${isCurrent ? "bg-surface border-2 border-[#0BAA8F] shadow-lg ring-2 ring-[#0BAA8F]/20" : meta.featured ? "bg-surface border-2 border-[#8B5CF6] dark:border-[#A78BFA] shadow-lg ring-2 ring-purple-500/20" : "bg-surface border border-line shadow-sm hover:border-line-strong hover:shadow-md"}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 mb-4", children: [
          isCurrent ? /* @__PURE__ */ jsxs("span", { className: "px-3 py-1 rounded-full text-3xs font-bold tracking-widest text-white bg-[#0BAA8F] shadow-sm flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 11 }),
            " CURRENT PLAN"
          ] }) : meta.tag ? /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-full text-3xs font-bold tracking-widest uppercase ${meta.featured ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50" : "bg-surface-raised text-ink-muted border border-line"}`, children: meta.tag }) : /* @__PURE__ */ jsx("span", {}),
          isAnnual && annualRate && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-3xs font-bold tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800", children: "2 MOS FREE" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 mb-4", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-line",
                style: { background: meta.color + "18", color: meta.color },
                children: /* @__PURE__ */ jsx(Icon, { size: 24 })
              }
            ),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-xl text-ink leading-tight", children: meta.label }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5 line-clamp-1", children: meta.desc })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "py-4 my-2 border-y border-line", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5 font-mono", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-3xl sm:text-4xl font-extrabold text-ink tracking-tight font-mono", children: [
                "$",
                isAnnual && annualRate ? effectiveMonthly : monthlyRate
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted font-sans font-medium", children: monthlyRate === 0 ? "/forever" : "/month" })
            ] }),
            isAnnual && annualRate > 0 && /* @__PURE__ */ jsxs("div", { className: "text-2xs text-ink-muted font-medium mt-1", children: [
              "Billed annually as ",
              /* @__PURE__ */ jsxs("span", { className: "font-semibold text-ink", children: [
                "$",
                annualRate,
                "/year"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2.5 my-6 text-xs", children: (meta.perks || []).map((perk, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5 text-ink-secondary", children: [
            /* @__PURE__ */ jsx(Check, { size: 15, className: "text-[#0BAA8F] shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsx("span", { className: "leading-snug text-xs", children: perk })
          ] }, idx)) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-line mt-auto", children: isCurrent ? tenant?.status === "trial" || tenant?.status === "suspended" ? /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onCheckout?.(planKey, isAnnual ? "annual" : "monthly", currencyDisplay),
            disabled: isCheckingOut,
            className: "w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-[#0BAA8F] hover:bg-[#09927D] text-white shadow-md transition-all active:scale-98",
            children: isCheckingOut ? /* @__PURE__ */ jsx(Loader2, { size: 15, className: "animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              "Activate Subscription ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
            ] })
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "text-center py-3 text-xs font-bold text-[#0BAA8F] uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 15 }),
          " Active Plan"
        ] }) : isLtd ? /* @__PURE__ */ jsx("div", { className: "text-center py-3 text-xs font-bold text-ink-muted uppercase tracking-widest bg-surface-raised border border-line rounded-xl", children: "Lifetime Supporter" }) : /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onSelectPlan(planKey),
            className: `w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-98 ${thisIdx > currentIdx ? "bg-[#0BAA8F] hover:bg-[#09927D] text-white shadow-md hover:shadow-lg" : "bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink font-semibold"}`,
            children: [
              /* @__PURE__ */ jsx("span", { children: thisIdx > currentIdx ? `Upgrade to ${meta.label}` : `Select ${meta.label}` }),
              /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
            ]
          }
        ) })
      ]
    }
  );
}
function BillingIndex({
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
  const storeSlug = store?.slug || tenant?.slug || "my-store";
  const [activeTab, setActiveTab] = useState("subscription");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currencyDisplay, setCurrencyDisplay] = useState("USD");
  const [calcProducts, setCalcProducts] = useState("");
  const [calcVariants, setCalcVariants] = useState("");
  const [selectedService, setSelectedService] = useState("basic");
  const [isOrderingService, setIsOrderingService] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const loadHistory = async (fresh = false) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(
        route("store.billing.payment-history", { store_slug: storeSlug, ...fresh ? { fresh: 1 } : {} }),
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHistory(await res.json());
    } catch (err) {
      console.error("[billing] payment history failed", err);
      setHistoryError("Could not load payment history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === "payments" && !history && !historyLoading) {
      loadHistory();
    }
  }, [activeTab]);
  const fmtDay = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  useEffect(() => {
    preloadLemonCheckout();
  }, []);
  const toast = (message, type = "info") => {
    window.dispatchEvent(new CustomEvent("amd:toast", { detail: { message, type } }));
  };
  const [isSyncing, setIsSyncing] = useState(false);
  const runSubscriptionSync = async ({ silent = false } = {}) => {
    setIsSyncing(true);
    try {
      const res = await fetch(route("store.billing.sync-subscription", { store_slug: storeSlug }), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || ""
        }
      });
      const data = await res.json().catch(() => ({}));
      if (data?.synced) {
        if (!silent) {
          toast(data.message || "Subscription synced.", "success");
          router.reload({ preserveScroll: true });
        }
      } else {
        if (!silent) toast(data?.message || "Subscription checked. No changes.", "info");
      }
    } catch (e) {
      if (!silent) toast("Failed to check with payment provider.", "error");
    } finally {
      setIsSyncing(false);
    }
  };
  const launchCheckout = (getUrlAsync, { context = "checkout", successMessage = "Payment received!", onDone } = {}) => {
    getUrlAsync().then((url) => {
      if (!url) {
        onDone?.();
        return;
      }
      openLemonCheckout(url, {
        onSuccess: () => {
          toast(successMessage, "success");
          runSubscriptionSync({ silent: true });
          router.reload({ preserveScroll: true });
        },
        onClose: () => {
          onDone?.();
        }
      });
    }).catch(() => {
      toast("Failed to open checkout overlay. Please try again.", "error");
      onDone?.();
    });
  };
  const postForCheckoutUrl = async (routeName, payload = {}) => {
    const res = await fetch(route(routeName, { store_slug: storeSlug }), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || ""
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (data?.url) return data.url;
    toast(data?.error || "An unexpected error occurred.", "error");
    return null;
  };
  const [isPurchasingAddon, setIsPurchasingAddon] = useState(null);
  const handlePurchaseAddon = (addonType) => {
    setIsPurchasingAddon(addonType);
    launchCheckout(
      () => postForCheckoutUrl("store.billing.checkout-addon", { addon_type: addonType }),
      {
        context: "addon",
        successMessage: "Payment received — activating your add-on…",
        onDone: () => setIsPurchasingAddon(null)
      }
    );
  };
  const [checkoutBusy, setCheckoutBusy] = useState(null);
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const trialCreditFor = (cycle = billingCycle) => {
    if (!trial_credit) return null;
    const percent = cycle === "annual" ? trial_credit.percent_annual : trial_credit.percent_monthly;
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
        const res = await fetch(route("store.billing.upgrade", {
          store_slug: storeSlug,
          plan: planKey,
          cycle: cycle === "annual" ? "annual" : "monthly",
          currency,
          format: "json"
        }), {
          headers: { "Accept": "application/json" }
        });
        const data = await res.json().catch(() => ({}));
        if (data?.url) return data.url;
        toast(data?.error || "Checkout unavailable right now. Please try again.", "error");
        return null;
      },
      {
        context: "plan",
        successMessage: "Payment received — applying your new plan…",
        onDone: () => setCheckoutBusy(null)
      }
    );
  };
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const handleSelectPlan = (planKey) => {
    setSelectedPlan(planKey);
    setIsChangeModalOpen(true);
  };
  const handleConfirmPlanChange = () => {
    router.post(route("store.billing.change-plan", { store_slug: storeSlug }), { plan: selectedPlan }, {
      onSuccess: () => setIsChangeModalOpen(false)
    });
  };
  const currentPlanKey = normalizePlan(current_plan ?? tenant?.plan ?? "starter");
  const currentMeta = PLAN_META[currentPlanKey] || PLAN_META.starter;
  const isLtd = currentPlanKey.startsWith("ltd");
  const subEndsAt = tenant?.subscription_ends_at ? new Date(tenant.subscription_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
  tenant?.subscription_ends_at ? Math.max(0, Math.ceil((new Date(tenant.subscription_ends_at) - /* @__PURE__ */ new Date()) / 864e5)) : null;
  const lsStatus = history?.subscription?.status ?? null;
  const lsIsTrialling = lsStatus === "on_trial";
  const lsIsPaying = lsStatus ? ["active", "past_due", "cancelled"].includes(lsStatus) : null;
  const isTrial = tenant?.status === "trial" || lsIsTrialling;
  const confirmedPaying = lsIsPaying ?? tenant?.status === "active";
  lsStatus !== null && tenant?.status === "active" !== !!lsIsPaying;
  const trialEndsAt = lsIsTrialling && (history?.subscription?.trial_ends_at || history?.subscription?.expires_at) || (tenant?.status === "trial" ? tenant?.trial_ends_at : null);
  const trialDaysLeft = isTrial && trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt) - /* @__PURE__ */ new Date()) / 864e5)) : null;
  const isViewOnly = tenant?.view_only_since !== null;
  const viewOnlyDaysLeft = tenant?.view_only_since ? Math.max(0, 30 - Math.ceil((/* @__PURE__ */ new Date() - new Date(tenant.view_only_since)) / 864e5)) : 30;
  const usageData = usage || {};
  const calcProductsNum = Math.max(0, parseInt(calcProducts) || 0);
  const calcVariantsNum = Math.max(1, parseInt(calcVariants) || 1);
  const serviceTier = SERVICE_TIERS[selectedService];
  const extraBlocks = calcVariantsNum > 5 ? Math.ceil((calcVariantsNum - 5) / 5) : 0;
  const usdPricePerProduct = serviceTier ? serviceTier.priceUSD + extraBlocks * serviceTier.extraUSD : 0;
  const usdTotalSetupCost = calcProductsNum * usdPricePerProduct;
  const handleOrderSetupService = () => {
    setIsOrderingService(true);
    launchCheckout(
      () => postForCheckoutUrl("store.billing.checkout-upload-service", {
        tier: selectedService,
        products: calcProductsNum,
        variants: calcVariantsNum
      }),
      {
        context: "setup-service",
        successMessage: "Order received — our catalog team will be in touch shortly.",
        onDone: () => setIsOrderingService(false)
      }
    );
  };
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const paidUntilLabel = history?.subscription?.expires_at ? fmtDay(history.subscription.expires_at) : subEndsAt || null;
  const submitCancelSubscription = () => {
    setCancelBusy(true);
    router.post(route("store.billing.cancel-subscription", { store_slug: storeSlug }), {}, {
      preserveScroll: true,
      onFinish: () => {
        setCancelBusy(false);
        setCancelOpen(false);
        setHistory(null);
        if (activeTab === "payments") loadHistory(true);
      }
    });
  };
  const submitResumeSubscription = () => {
    setResumeBusy(true);
    router.post(route("store.billing.resume-subscription", { store_slug: storeSlug }), {}, {
      preserveScroll: true,
      onFinish: () => {
        setResumeBusy(false);
        setHistory(null);
        if (activeTab === "payments") loadHistory(true);
      }
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Billing & Subscription — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 py-8 space-y-8", children: [
      isViewOnly && /* @__PURE__ */ jsx("div", { className: "p-6 rounded-2xl bg-gradient-to-r from-red-950/90 via-red-900/60 to-black border border-red-500/30 shadow-2xl relative overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-6 relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-white leading-tight mb-1", children: "View-Only Mode Active" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 max-w-xl leading-relaxed", children: [
              "Your trial or subscription has expired. Reports and data export remain available, but transaction entry and modifications are locked.",
              /* @__PURE__ */ jsxs("span", { className: "text-red-400 font-semibold block mt-1", children: [
                "Data preserved for ",
                viewOnlyDaysLeft,
                " days before archival purge."
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-3 shrink-0", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleSelectPlan("starter"),
            className: "px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
            children: "Activate Store"
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5 relative z-10", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-line",
              style: {
                background: currentMeta.color + "15",
                borderColor: currentMeta.color + "30",
                color: currentMeta.color
              },
              children: /* @__PURE__ */ jsx(currentMeta.Icon, { size: 32 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-widest text-[#0BAA8F]", children: "Active Subscription" }),
              /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-surface-raised text-ink-secondary border border-line", children: currentPlanKey })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-ink tracking-tight", children: currentMeta.label }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-ink-muted mt-1", children: isViewOnly ? `View-Only Mode (${viewOnlyDaysLeft} days remaining)` : tenant?.status === "suspended" ? "Trial Expired / Suspended" : isTrial ? trialDaysLeft !== null ? `Free trial — ${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} remaining` : "Free evaluation trial" : isLtd ? "Lifetime Supporter License" : subEndsAt ? `Renews on ${subEndsAt}` : "Active subscription" }),
            isTrial && trialCreditFor(billingCycle) && /* @__PURE__ */ jsxs("div", { className: "text-2xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Zap, { size: 12, className: "fill-emerald-500 text-emerald-500" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Pay early and unused days become a ",
                trialCreditFor(billingCycle).percent,
                "% credit on your first invoice."
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto", children: [
          !confirmedPaying && !isLtd && !isViewOnly && /* @__PURE__ */ jsxs(
            "button",
            {
              disabled: checkoutBusy === currentPlanKey,
              onClick: () => handlePlanCheckout(currentPlanKey, billingCycle, currencyDisplay),
              className: "px-6 py-3 rounded-xl bg-[#0BAA8F] hover:bg-[#09927D] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-98",
              children: [
                /* @__PURE__ */ jsx(Zap, { size: 14, className: "fill-white" }),
                /* @__PURE__ */ jsx("span", { children: checkoutBusy === currentPlanKey ? "Opening…" : "Pay Now" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.apps", { store_slug: storeSlug }),
              className: "px-5 py-3 rounded-xl bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm",
              children: [
                /* @__PURE__ */ jsx(Monitor, { size: 14, className: "text-[#0BAA8F]" }),
                /* @__PURE__ */ jsx("span", { children: "Download Apps" })
              ]
            }
          ),
          history?.subscription?.update_card_url && !isViewOnly && /* @__PURE__ */ jsxs(
            "a",
            {
              href: history.subscription.update_card_url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "px-4 py-3 rounded-xl bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all",
              children: [
                /* @__PURE__ */ jsx(CreditCard, { size: 14 }),
                " ",
                /* @__PURE__ */ jsx("span", { children: "Update Card" })
              ]
            }
          ),
          confirmedPaying && !isLtd && !isViewOnly && !history?.subscription?.is_cancelled && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setCancelOpen(true),
              className: "px-3.5 py-3 text-ink-muted hover:text-rose-500 text-xs font-semibold transition-colors",
              children: "Cancel"
            }
          ),
          history?.subscription?.is_cancelled && !isLtd && !isViewOnly && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: submitResumeSubscription,
              disabled: resumeBusy,
              className: "px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: resumeBusy ? "animate-spin" : "" }),
                /* @__PURE__ */ jsx("span", { children: "Resume" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => runSubscriptionSync(),
              disabled: isSyncing,
              title: "Re-check status with Lemon Squeezy",
              className: "p-3 rounded-xl bg-surface-raised hover:bg-surface border border-line hover:border-line-strong text-ink-muted hover:text-ink transition-all",
              children: /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: isSyncing ? "animate-spin" : "" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex border-b border-line overflow-x-auto gap-2", children: [
        { id: "subscription", label: "Subscription & Plans", icon: Receipt },
        { id: "usage", label: "Resource Usage & Limits", icon: BarChart2 },
        { id: "addons", label: "Add-ons & Services", icon: Sparkles },
        { id: "payments", label: "Payment History", icon: History }
      ].map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab(tab.id),
            className: `flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${isActive ? "border-[#0BAA8F] text-[#0BAA8F] bg-[#0BAA8F]/5" : "border-transparent text-ink-muted hover:text-ink hover:border-line"}`,
            children: [
              /* @__PURE__ */ jsx(TabIcon, { size: 15 }),
              /* @__PURE__ */ jsx("span", { children: tt(tab.label) })
            ]
          },
          tab.id
        );
      }) }),
      activeTab === "subscription" && /* @__PURE__ */ jsxs("div", { className: "space-y-10 animate-fadeIn", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-surface border border-[#0BAA8F]/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-[#0BAA8F]/10 border border-[#0BAA8F]/25 flex items-center justify-center text-[#0BAA8F] shrink-0", children: /* @__PURE__ */ jsx(Monitor, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "Need Raw Hardware Receipt Printing & Peripherals?" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted mt-0.5", children: [
                "Download ",
                /* @__PURE__ */ jsx("span", { className: "text-ink font-semibold", children: "VenQore Station for Windows" }),
                " for raw ESC/POS printing, cash drawers, and scales."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.apps", { store_slug: storeSlug }),
              className: "px-5 py-2.5 rounded-xl bg-[#0BAA8F] hover:bg-[#09927D] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-sm",
              children: [
                /* @__PURE__ */ jsx("span", { children: "Download Apps" }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold text-ink-muted uppercase tracking-widest", children: "Select Billing Term" }),
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1 p-1 rounded-2xl bg-surface-raised border border-line shadow-inner", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setBillingCycle("monthly"),
                className: `px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${billingCycle === "monthly" ? "bg-surface text-ink shadow-sm border border-line" : "text-ink-muted hover:text-ink"}`,
                children: "Monthly"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setBillingCycle("annual"),
                className: `px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${billingCycle === "annual" ? "bg-[#0BAA8F] text-white shadow-sm" : "text-ink-muted hover:text-ink"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Annual" }),
                  /* @__PURE__ */ jsx("span", { className: "text-3xs px-1.5 py-0.5 rounded-full font-bold bg-black/15 text-white", children: "SAVE ~17%" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: SELF_SERVE_PLANS.map((planKey) => /* @__PURE__ */ jsx(
          PlanCardV6,
          {
            planKey,
            _planConfig: plans?.find((p) => p.slug === planKey)?.limits || {},
            isCurrent: planKey === currentPlanKey,
            _storeSlug: storeSlug,
            tenant,
            onSelectPlan: handleSelectPlan,
            onCheckout: handlePlanCheckout,
            checkoutBusy,
            billingCycle,
            currencyDisplay
          },
          planKey
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 rounded-2xl bg-surface border border-line shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold text-[#0BAA8F] uppercase tracking-widest mb-1", children: "In Every Plan, At Every Price" }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink mb-6", children: "Nothing Important is Withheld." }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs text-ink-secondary", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { size: 18, className: "text-[#0BAA8F] shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-ink", children: "The Complete Double-Entry Ledger" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: "Automated balanced journal entries, chart of accounts, and fiscal compliance." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { size: 18, className: "text-[#0BAA8F] shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-ink", children: "All 43 Financial & Tax Reports" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: "P&L, Balance Sheet, Cash Flow, Party Statements, and Tax breakdowns included." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { size: 18, className: "text-[#0BAA8F] shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-ink", children: "Unlimited Transactions on Paid Plans" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: "Process thousands of daily till orders without artificial per-transaction fees." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { size: 18, className: "text-[#0BAA8F] shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-ink", children: "Offline POS Mode" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: "Keep ringing up sales even during internet drops; orders sync automatically when restored." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { size: 18, className: "text-[#0BAA8F] shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-ink", children: "Full Data Ownership & Export" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: "Export all customers, products, and ledger postings anytime in open CSV/JSON formats." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { size: 18, className: "text-[#0BAA8F] shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-ink", children: "Zero Implementation or Consultant Fees" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: "Priced like software, not a months-long consulting project. Ready in 4 minutes." })
              ] })
            ] })
          ] })
        ] })
      ] }),
      activeTab === "usage" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-fadeIn", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-surface border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink", children: "Live Store Resource Usage" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted mt-0.5", children: [
              "Real-time tracking of active database records and monthly operational metrics under your ",
              /* @__PURE__ */ jsx("span", { className: "text-ink font-semibold capitalize", children: currentPlanKey }),
              " tier."
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted", children: "Evaluated live against active tenant records" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: [
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: Package,
              label: "Products (SKUs)",
              used: usageData.product_count ?? 0,
              limit: usageData.sku_limit,
              helper: "Active catalogue items"
            }
          ),
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: Users,
              label: "Staff Members (Full Seats)",
              used: usageData.staff_count ?? 1,
              limit: usageData.staff_limit,
              helper: "Owners, managers, & admins"
            }
          ),
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: Users,
              label: "Cashier Till PINs",
              used: usageData.cashier_count ?? 0,
              limit: usageData.till_logins_limit,
              helper: "Cashier accounts on registers"
            }
          ),
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: GitBranch,
              label: "Locations & Warehouses",
              used: usageData.location_count ?? 1,
              limit: usageData.locations,
              helper: "Physical branches & depots"
            }
          ),
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: Monitor,
              label: "POS Registers (Devices)",
              used: usageData.register_count ?? 0,
              limit: usageData.registers_limit,
              helper: "Hardware checkout terminals"
            }
          ),
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: Receipt,
              label: "Monthly Transactions",
              used: usageData.transactions_count ?? 0,
              limit: usageData.transactions_limit,
              helper: "Sales logged this month"
            }
          ),
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: Clock,
              label: "Monthly Service Jobs",
              used: usageData.service_jobs_count ?? 0,
              limit: usageData.service_jobs_limit,
              helper: "Work orders & repair tickets"
            }
          ),
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: Sparkles,
              label: "AI SmartCapture Credits",
              used: usageData.ai_credits_used ?? 0,
              limit: usageData.ai_credits_limit,
              helper: "Monthly OCR & query credits"
            }
          ),
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: FileText,
              label: "AI Document Scans",
              used: usageData.ai_pages_used ?? 0,
              limit: usageData.ai_scans_limit,
              helper: "Scans conducted this month"
            }
          ),
          /* @__PURE__ */ jsx(
            UsageMeterCard,
            {
              icon: HardDrive,
              label: "History Retention Window",
              used: usageData.visible_history_days ? `${usageData.visible_history_days} Days` : "Full History",
              limit: null,
              helper: usageData.visible_history_days ? "Historical data older than 30 days safely archived" : "Unlimited transaction history preserved"
            }
          )
        ] })
      ] }),
      activeTab === "addons" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-fadeIn", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsx(Cpu, { className: "text-[#0BAA8F]", size: 24 }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "AI Engine & SmartCapture Add-ons" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted leading-relaxed mb-6 max-w-2xl", children: "Expand your document scanning quota or connect your own LLM credentials to power SmartCapture and assistant features." }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-surface-raised border border-line hover:border-line-strong transition-all flex flex-col justify-between shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30", children: "Bring Your Own Key" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold font-mono text-ink", children: [
                    "$19 ",
                    /* @__PURE__ */ jsx("span", { className: "text-2xs font-sans text-ink-muted font-normal", children: "once" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink mb-1.5", children: "Lifetime BYOK License" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: "Bypass platform scanning fees forever. Plug in your own Gemini, Claude, OpenAI, or DeepSeek API key and pay zero per-page fees." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-6 pt-4 border-t border-line", children: tenant?.ai_status === "byok" ? /* @__PURE__ */ jsx("div", { className: "w-full py-2.5 text-center text-xs font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl", children: "BYOK Active" }) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handlePurchaseAddon("ai_byok"),
                  disabled: isPurchasingAddon !== null,
                  className: "w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm font-bold",
                  children: isPurchasingAddon === "ai_byok" ? "Opening…" : "Unlock BYOK ($19)"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-surface-raised border border-line hover:border-line-strong transition-all flex flex-col justify-between shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-[#0BAA8F]/15 text-[#0BAA8F] border border-[#0BAA8F]/30", children: "Top-up Pack" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold font-mono text-ink", children: [
                    "$10 ",
                    /* @__PURE__ */ jsx("span", { className: "text-2xs font-sans text-ink-muted font-normal", children: "once" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink mb-1.5", children: "1,000 AI Credits Top-Up" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: "Instantly add 1,000 credits (~100 document scans or 500 AI queries) to your store balance without changing your monthly tier." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-6 pt-4 border-t border-line", children: /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handlePurchaseAddon("ai_topup"),
                  disabled: isPurchasingAddon !== null,
                  className: "w-full py-2.5 bg-[#0BAA8F] hover:bg-[#09927D] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm",
                  children: isPurchasingAddon === "ai_topup" ? "Opening…" : "Add 1,000 Credits ($10)"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-6 rounded-2xl bg-surface-raised border border-line hover:border-line-strong transition-all flex flex-col justify-between shadow-sm", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
                /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30", children: "Managed API" }),
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold font-mono text-ink", children: [
                  "$15–$39 ",
                  /* @__PURE__ */ jsx("span", { className: "text-2xs font-sans text-ink-muted font-normal", children: "/mo" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink mb-1.5", children: "Managed AI Subscriptions" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed mb-4", children: "High-volume monthly allowances with zero configuration:" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: Object.entries(aiTiers).filter(([, tier]) => Number(tier.price_monthly) > 0).map(([key, tier]) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handlePurchaseAddon(`ai_${key}`),
                  className: "w-full p-2.5 rounded-xl bg-surface border border-line hover:border-[#0BAA8F]/40 flex items-center justify-between text-xs transition-all shadow-2xs",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: tier.label }),
                    /* @__PURE__ */ jsxs("span", { className: "text-[#0BAA8F] font-mono font-bold", children: [
                      "$",
                      tier.price_monthly,
                      "/mo"
                    ] })
                  ]
                },
                key
              )) })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsx(Globe2, { className: "text-[#0BAA8F]", size: 24 }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Platform Channel Sync" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted leading-relaxed mb-6 max-w-2xl", children: "2-way real-time stock, pricing, and order synchronization between your VenQore till and your e-commerce channels." }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-surface-raised border border-line flex flex-col justify-between shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "WooCommerce Channel Sync" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-mono font-bold text-ink", children: "$19/mo" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: "Instant webhook-driven stock decrementing on online sales, automatic catalog pushing, and web order fulfillment directly from POS." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-6 pt-4 border-t border-line", children: tenant?.sync_channels && tenant.sync_channels.includes("woocommerce") ? /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
                " Active & Synchronizing"
              ] }) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handlePurchaseAddon("sync_woocommerce"),
                  className: "px-5 py-2.5 bg-[#0BAA8F] hover:bg-[#09927D] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm",
                  children: "Connect WooCommerce ($19/mo)"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-surface-raised border border-line flex flex-col justify-between shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "Amazon SP-API Channel Sync" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-mono font-bold text-ink", children: "$19/mo" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: "2-way inventory sync with Amazon Seller Central for FBM orders and FBA replenishment tracking." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-6 pt-4 border-t border-line", children: tenant?.sync_channels && tenant.sync_channels.includes("amazon") ? /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
                " Active & Synchronizing"
              ] }) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handlePurchaseAddon("sync_amazon"),
                  className: "px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm",
                  children: "Connect Amazon SP-API ($19/mo)"
                }
              ) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "text-[#0BAA8F]", size: 24 }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Professional Catalog Onboarding Service" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted leading-relaxed mb-6 max-w-2xl", children: "Let our catalog engineering team clean, structure, and import your existing inventory databases, supplier spreadsheets, or paper invoices into VenQore." }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: Object.entries(SERVICE_TIERS).map(([key, tier]) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              "aria-label": tier.name,
              onClick: () => setSelectedService(key),
              className: `text-left p-5 rounded-2xl border transition-all flex flex-col justify-between ${selectedService === key ? "bg-[#0BAA8F]/10 border-[#0BAA8F] shadow-sm" : "bg-surface-raised border-line hover:border-line-strong"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-ink font-bold text-sm", children: tier.name }),
                  /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted mt-1 leading-relaxed", children: tier.desc })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-baseline mt-4 pt-3 border-t border-line w-full", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-2xs text-[#0BAA8F] font-semibold", children: tier.sla }),
                  /* @__PURE__ */ jsxs("span", { className: "text-ink font-mono font-bold text-sm", children: [
                    "$",
                    tier.priceUSD.toFixed(2),
                    "/item"
                  ] })
                ] })
              ]
            },
            key
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-line", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { htmlFor: "calc-products-input", className: "block text-xs font-bold text-ink-secondary uppercase tracking-wider mb-2", children: "Number of Products to Import" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "calc-products-input",
                    type: "number",
                    placeholder: "e.g. 500",
                    value: calcProducts,
                    onChange: (e) => setCalcProducts(e.target.value),
                    className: "w-full px-4 py-3 rounded-xl border border-line bg-surface text-ink text-sm outline-none focus:border-[#0BAA8F] transition-colors font-mono shadow-inner"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { htmlFor: "calc-variants-input", className: "block text-xs font-bold text-ink-secondary uppercase tracking-wider mb-2", children: "Average Variants Per Product" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "calc-variants-input",
                    type: "number",
                    placeholder: "First 5 variants included (e.g. 6)",
                    value: calcVariants,
                    onChange: (e) => setCalcVariants(e.target.value),
                    className: "w-full px-4 py-3 rounded-xl border border-line bg-surface text-ink text-sm outline-none focus:border-[#0BAA8F] transition-colors font-mono shadow-inner"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-surface-raised border border-line flex flex-col justify-between shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-xs text-ink-muted", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsx("span", { children: "Tier Base Rate:" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-mono text-ink font-bold", children: [
                    "$",
                    serviceTier.priceUSD.toFixed(2),
                    " / product"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsx("span", { children: "Surcharge for Extra Variants:" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-mono text-ink font-bold", children: [
                    "+$",
                    (extraBlocks * serviceTier.extraUSD).toFixed(2)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-2 border-t border-line text-ink", children: [
                  /* @__PURE__ */ jsx("span", { children: "Calculated Rate:" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-mono text-[#0BAA8F] font-bold", children: [
                    "$",
                    usdPricePerProduct.toFixed(2),
                    " / item"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-line flex justify-between items-center mt-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-3xs font-bold uppercase text-ink-muted", children: "Total Setup Estimate" }),
                  /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold font-mono text-ink", children: [
                    "$",
                    usdTotalSetupCost.toFixed(2)
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleOrderSetupService,
                    disabled: calcProductsNum === 0 || isOrderingService,
                    className: "px-6 py-3 rounded-xl bg-[#0BAA8F] hover:bg-[#09927D] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md",
                    children: isOrderingService ? "Redirecting…" : "Order Service"
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] }),
      activeTab === "payments" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-fadeIn", children: [
        historyLoading && !history && /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsx("div", { className: "h-16 rounded-2xl bg-surface-raised border border-line animate-pulse" }, i)) }),
        historyError && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 15 }),
          " ",
          historyError
        ] }),
        history && /* @__PURE__ */ jsxs(Fragment, { children: [
          history.subscription && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-surface border border-line shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(BadgeCheck, { size: 13, className: "text-[#0BAA8F]" }),
                " Status"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-ink capitalize", children: history.subscription.status_formatted || history.subscription.status || "—" }),
              history.subscription.is_cancelled && /* @__PURE__ */ jsx("div", { className: "text-2xs font-semibold text-amber-600 dark:text-amber-400 mt-1", children: "Cancelled — paid access remains active" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-surface border border-line shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Clock, { size: 13, className: "text-[#0BAA8F]" }),
                " ",
                history.subscription.is_cancelled ? "Access Ends" : "Next Renewal"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-ink font-mono", children: fmtDay(history.subscription.expires_at) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-surface border border-line shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(CreditCard, { size: 13, className: "text-[#0BAA8F]" }),
                " Payment Method"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-ink", children: history.subscription.card || "Not on file" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-surface border border-line shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Receipt, { size: 13, className: "text-[#0BAA8F]" }),
                " Total Paid"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-ink font-mono", children: history.lifetime_usd || "$0.00" }),
              /* @__PURE__ */ jsxs("div", { className: "text-2xs text-ink-muted mt-0.5", children: [
                history.invoice_count,
                " ",
                history.invoice_count === 1 ? "receipt" : "receipts"
              ] })
            ] })
          ] }),
          history.invoices && history.invoices.length > 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-surface border border-line shadow-sm overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line bg-surface-raised text-2xs font-bold text-ink-muted uppercase tracking-wider", children: [
              /* @__PURE__ */ jsx("th", { className: "px-5 py-3.5", children: "Paid On" }),
              /* @__PURE__ */ jsx("th", { className: "px-5 py-3.5", children: "Period Covered" }),
              /* @__PURE__ */ jsx("th", { className: "px-5 py-3.5", children: "Amount" }),
              /* @__PURE__ */ jsx("th", { className: "px-5 py-3.5", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-5 py-3.5 text-right", children: "Invoice" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line text-xs", children: history.invoices.map((inv) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-surface-raised/50 transition-colors", children: [
              /* @__PURE__ */ jsxs("td", { className: "px-5 py-4 whitespace-nowrap", children: [
                /* @__PURE__ */ jsx("div", { className: "font-bold text-ink", children: fmtDay(inv.paid_at) }),
                /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted capitalize", children: inv.billing_reason || "Payment" })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-5 py-4 whitespace-nowrap text-ink-secondary", children: inv.period_end ? `${fmtDay(inv.period_start)} → ${fmtDay(inv.period_end)}` : fmtDay(inv.period_start) }),
              /* @__PURE__ */ jsx("td", { className: "px-5 py-4 whitespace-nowrap font-mono font-bold text-ink", children: inv.total }),
              /* @__PURE__ */ jsx("td", { className: "px-5 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800", children: inv.status }) }),
              /* @__PURE__ */ jsx("td", { className: "px-5 py-4 whitespace-nowrap text-right", children: inv.invoice_url && /* @__PURE__ */ jsxs(
                "a",
                {
                  href: inv.invoice_url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line hover:border-line-strong text-ink-secondary hover:text-ink text-2xs font-bold transition-all shadow-2xs",
                  children: [
                    /* @__PURE__ */ jsx(FileText, { size: 12 }),
                    /* @__PURE__ */ jsx("span", { children: "PDF" })
                  ]
                }
              ) })
            ] }, inv.id)) })
          ] }) }) }) : /* @__PURE__ */ jsxs("div", { className: "p-8 rounded-2xl bg-surface border border-line shadow-sm text-center", children: [
            /* @__PURE__ */ jsx(Receipt, { size: 28, className: "mx-auto text-ink-muted mb-2" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-ink-muted", children: "No payment records found." })
          ] })
        ] })
      ] }),
      PKR_ENABLED
    ] }),
    /* @__PURE__ */ jsx(Modal, { show: isChangeModalOpen, onClose: () => setIsChangeModalOpen(false), maxWidth: "md", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-surface border border-line rounded-2xl shadow-2xl p-6 text-ink", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold tracking-tight flex items-center gap-2 mb-4 text-ink", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "text-[#0BAA8F]", size: 20 }),
        "Confirm Plan Selection"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 rounded-xl bg-surface-raised border border-line", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xs text-ink-muted font-bold uppercase", children: "Current" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-bold capitalize text-ink mt-0.5", children: currentPlanKey })
          ] }),
          /* @__PURE__ */ jsx(ArrowRight, { className: "text-ink-muted", size: 16 }),
          /* @__PURE__ */ jsxs("div", { className: "text-center flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xs text-[#0BAA8F] font-bold uppercase", children: "New Plan" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-bold capitalize text-[#0BAA8F] mt-0.5", children: selectedPlan })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted leading-relaxed", children: [
          "Switching to ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-ink capitalize", children: selectedPlan }),
          " will update your resource limits immediately. Any prorated difference will be applied according to your billing cycle."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsChangeModalOpen(false),
            className: "px-4 py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-line text-ink font-semibold text-xs transition-colors",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleConfirmPlanChange,
            className: "px-5 py-2.5 rounded-xl bg-[#0BAA8F] hover:bg-[#09927D] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm",
            children: "Confirm Change"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { show: cancelOpen, onClose: () => setCancelOpen(false), maxWidth: "md", children: /* @__PURE__ */ jsxs("div", { className: "p-8 bg-surface text-ink rounded-2xl border border-line shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 20 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Cancel Subscription?" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: currentMeta.label })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 mb-4 text-xs text-emerald-800 dark:text-emerald-300", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
          "You retain full access until ",
          paidUntilLabel || "the end of your paid billing period",
          "."
        ] }),
        " No immediate lockout and no further renewals will be charged."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-6", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setCancelOpen(false),
            className: "w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-line text-ink font-bold text-xs uppercase tracking-wider",
            children: "Keep Subscription"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: submitCancelSubscription,
            disabled: cancelBusy,
            className: "w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider shadow-sm",
            children: cancelBusy ? "Cancelling…" : "Yes, Cancel"
          }
        )
      ] })
    ] }) })
  ] });
}
BillingIndex.layout = (page) => /* @__PURE__ */ jsx(OneGlanceLayout, { title: "Billing & Subscription", mode: "admin", children: page });
export {
  BillingIndex as default
};

import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { p as preloadLemonCheckout, O as OneGlanceLayout, o as openLemonCheckout, c as closeLemonCheckout } from "./OneGlanceLayout-C-94hBqK.js";
import { M as Modal } from "../ssr.js";
import { Sparkles, Crown, Zap, Shield, AlertTriangle, Download, CreditCard, RefreshCw, Receipt, History, Lock, Calendar, Monitor, BarChart2, Users, Package, GitBranch, BadgeCheck, Clock, Info, FileText, CheckCircle2, Cpu, Globe2, ArrowRight, XCircle, MessageSquare, Infinity } from "lucide-react";
import "axios";
import "driver.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
const PKR_ENABLED = false;
const PLAN_META = {
  starter: { label: "Starter Engine", price: "$36/mo", color: "#6366f1", Icon: Shield },
  growth: { label: "Growth Engine", price: "$63/mo", color: "#8b5cf6", Icon: Zap },
  business: { label: "Business Engine", price: "$129/mo", color: "#f59e0b", Icon: Crown },
  ltd_1: { label: "LTD — Starter", price: "$79", color: "#10b981", Icon: Sparkles },
  ltd_2: { label: "LTD — Growth", price: "$199", color: "#10b981", Icon: Sparkles },
  ltd_3: { label: "LTD — Business", price: "$399", color: "#10b981", Icon: Sparkles }
};
const FEATURES = [
  { key: "staff_limit", icon: Users, label: "Staff Members" },
  { key: "sku_limit", icon: Package, label: "Products (SKUs)" },
  { key: "locations", icon: GitBranch, label: "Locations / Warehouses" },
  { key: "woocommerce", icon: Globe2, label: "WooCommerce Sync" },
  { key: "api_access", icon: Cpu, label: "API Access" },
  { key: "growth_engine", icon: Sparkles, label: "AI Growth Engine" },
  { key: "chat_support", icon: MessageSquare, label: "Live Agent Support" },
  { key: "reports", icon: BarChart2, label: "Advanced Reports" },
  { key: "multi_branch", icon: GitBranch, label: "Multi-Branch" }
];
const FEATURE_UPGRADE_TARGET = {
  woocommerce: "growth",
  growth_engine: "growth",
  multi_branch: "growth",
  api_access: "business",
  bill_of_materials: "business",
  fixed_asset_depreciation: "business",
  fiscal_year_closing: "business",
  recurring_invoicing: "business",
  chat_support: "growth",
  feature_serials: "business",
  whatsapp_reminders: "growth",
  loyalty_points: "business",
  wholesale_pricing: "business",
  dedicated_account_manager: "business"
};
const SERVICE_TIERS = {
  basic: { name: "Basic Upload", priceUSD: 1, pricePKR: 100, extraUSD: 0.5, extraPKR: 50, sla: "2–3 business days", desc: "Product data uploaded with all core fields. Up to 5 variants per product included." },
  descriptions: { name: "+ Rich Descriptions", priceUSD: 1.5, pricePKR: 150, extraUSD: 0.5, extraPKR: 50, sla: "3–5 business days", desc: "Everything in Basic + long descriptions, SEO copy, and full product detail. You provide images." },
  images: { name: "+ AI Images", priceUSD: 2, pricePKR: 200, extraUSD: 0.5, extraPKR: 50, sla: "4–6 business days", desc: "Everything in Descriptions + we source or AI-generate product images for you." }
};
function formatLimit(val) {
  if (val === null || val === void 0) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Infinity, { size: 14, style: { display: "inline", verticalAlign: "middle" } }),
    " Unlimited"
  ] });
  if (val === false) return /* @__PURE__ */ jsx(XCircle, { size: 14, color: "#ef4444", style: { display: "inline", verticalAlign: "middle" } });
  if (val === true) return /* @__PURE__ */ jsx(CheckCircle2, { size: 14, color: "#10b981", style: { display: "inline", verticalAlign: "middle" } });
  if (val === "basic") return "Basic";
  if (val === "advanced") return "Advanced";
  return val;
}
function UsageMeter({ icon: Icon, label, used, limit, color }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round(used / limit * 100));
  const isUnlimited = limit === null;
  const isCritical = !isUnlimited && pct >= 90;
  const isWarning = !isUnlimited && pct >= 70;
  const barColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : color;
  return /* @__PURE__ */ jsxs("div", { className: "bg-[#0b081e]/40 border border-white/[0.06] rounded-2xl p-5 shadow-inner", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03]", children: /* @__PURE__ */ jsx(Icon, { size: 16, color }) }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-300", children: label })
      ] }),
      isCritical && /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "text-red-500" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `text-2xl font-black mb-1 ${isCritical ? "text-red-500" : "text-white"}`, children: isUnlimited ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
      used,
      " ",
      /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium", children: "/ ∞" })
    ] }) : /* @__PURE__ */ jsxs("span", { children: [
      used,
      " ",
      /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-slate-500", children: [
        "/ ",
        limit
      ] })
    ] }) }),
    isUnlimited ? /* @__PURE__ */ jsx("div", { className: "text-[10px] text-emerald-400 font-bold uppercase tracking-wider", children: "Unlimited" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-1.5 mt-2", children: /* @__PURE__ */ jsx("div", { style: { width: `${pct}%`, backgroundColor: barColor }, className: "h-full rounded-full transition-all duration-700" }) }),
      /* @__PURE__ */ jsxs("div", { className: `text-[10px] font-bold ${isCritical ? "text-red-500" : "text-slate-500"} uppercase tracking-wider`, children: [
        pct,
        "% used"
      ] })
    ] })
  ] });
}
function PlanCard({ planKey, planConfig, isCurrent, storeSlug, tenant, onSelectPlan, onCheckout, checkoutBusy = null, plans, billingCycle = "monthly", currencyDisplay = "USD" }) {
  const { geo = { country: "US", currency: "USD", symbol: "$" } } = usePage().props;
  const meta = PLAN_META[planKey] ?? { label: planKey, price: "—", color: "#6366f1", Icon: Shield };
  const { Icon } = meta;
  const isLtd = planKey.startsWith("ltd");
  const dbPlan = plans?.find((p) => p.slug === planKey);
  const planName = dbPlan?.name ? `${dbPlan.name} Engine` : meta.label;
  const isAnnual = billingCycle === "annual";
  let displayMonthly, displayAnnualNote, savingsNote, pkrEstimate;
  const usdMonthly = dbPlan ? parseFloat(dbPlan.price_monthly_usd || dbPlan.price_monthly || 0) : 0;
  const usdAnnual = dbPlan ? parseFloat(dbPlan.price_annual_usd || dbPlan.price_annual || 0) : 0;
  if (isAnnual) {
    {
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
    {
      displayMonthly = dbPlan ? usdMonthly ? `$${usdMonthly}/mo` : "Free" : meta.price;
      displayAnnualNote = null;
      savingsNote = null;
      pkrEstimate = null;
    }
  }
  if (isLtd && !isCurrent) return null;
  const planOrder = ["starter", "growth", "business"];
  const currentIdx = planOrder.indexOf(tenant?.plan ?? "starter");
  const thisIdx = planOrder.indexOf(planKey);
  const checkoutCycle = isAnnual ? "annual" : "monthly";
  const isCheckingOut = checkoutBusy === planKey;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative p-6 rounded-3xl border transition-all duration-300 ${isCurrent ? "bg-purple-950/10 border-purple-500/35 shadow-[0_0_30px_rgba(168,85,247,0.06)]" : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.035] hover:border-white/10"}`,
      children: [
        isCurrent && /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white bg-purple-600",
            children: "CURRENT PLAN"
          }
        ),
        savingsNote && /* @__PURE__ */ jsx("div", { className: "absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white bg-emerald-600", children: savingsNote }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", style: { background: meta.color + "15" }, children: /* @__PURE__ */ jsx(Icon, { size: 24, color: meta.color }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold text-base text-white leading-tight", children: planName }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm font-bold mt-1", style: { color: meta.color }, children: [
              displayMonthly,
              displayAnnualNote && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 font-semibold block mt-0.5", children: displayAnnualNote }),
              pkrEstimate && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-emerald-400 font-semibold block mt-0.5", children: pkrEstimate })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3 mb-8", children: FEATURES.map((f) => {
          const val = planConfig[f.key];
          const enabled = val !== false && val !== "0" && val !== 0 && val !== void 0;
          return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs", children: [
            enabled ? /* @__PURE__ */ jsx(CheckCircle2, { size: 14, className: "text-emerald-400 shrink-0" }) : /* @__PURE__ */ jsx(XCircle, { size: 14, className: "text-slate-600 shrink-0" }),
            /* @__PURE__ */ jsxs("span", { className: `font-medium ${enabled ? "text-slate-300" : "text-slate-500 line-through opacity-50"}`, children: [
              f.label,
              typeof val === "number" ? `: ${val}` : "",
              val === null ? ": Unlimited" : ""
            ] })
          ] }, f.key);
        }) }),
        isCurrent ? tenant?.status === "trial" || tenant?.status === "suspended" ? /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onCheckout?.(planKey, checkoutCycle, currencyDisplay),
            disabled: isCheckingOut,
            className: "w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-wait text-white shadow-lg shadow-purple-500/10",
            children: isCheckingOut ? "Opening secure checkout…" : /* @__PURE__ */ jsxs(Fragment, { children: [
              "Activate Subscription ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] })
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "text-center py-3 text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
          " Active Plan"
        ] }) : isLtd ? /* @__PURE__ */ jsx("div", { className: "text-center py-3 text-xs font-black text-slate-500 uppercase tracking-widest bg-white/5 rounded-2xl", children: "Lifetime Supporter" }) : /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onSelectPlan(planKey),
            className: `w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 ${thisIdx > currentIdx ? "bg-white text-[#020010] hover:bg-slate-100" : "border border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800"}`,
            children: [
              thisIdx > currentIdx ? `Upgrade to ${meta.label}` : `Downgrade to ${meta.label}`,
              " ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ]
          }
        )
      ]
    }
  );
}
function BillingIndex({ tenant, plans, usage, feature_status, country, pk_verification, trial_credit = null }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug;
  const isPK = PKR_ENABLED;
  const fmt = (usdAmount, pkrAmount = null, suffix = "") => {
    const usdVal = parseFloat(usdAmount) || 0;
    return `$${usdVal.toLocaleString()}${suffix}`;
  };
  const fmtCost = (usdAmount, pkrAmount = null) => {
    const usdVal = parseFloat(usdAmount) || 0;
    return `$${usdVal.toFixed(2)}`;
  };
  const [activeTab, setActiveTab] = useState("subscription");
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
      setHistoryError("Could not load your payment history. Please try again.");
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
  const historyDateMismatch = (() => {
    const remote = history?.subscription?.expires_at;
    const local = history?.local?.subscription_ends_at;
    if (!remote || !local) return false;
    return new Date(remote).toDateString() !== new Date(local).toDateString();
  })();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currencyDisplay, setCurrencyDisplay] = useState("USD");
  const [calcProducts, setCalcProducts] = useState("");
  const [calcVariants, setCalcVariants] = useState("");
  const [selectedService, setSelectedService] = useState("basic");
  const [isOrderingService, setIsOrderingService] = useState(false);
  const toast = (message, type = "info") => {
    window.dispatchEvent(new CustomEvent("amd:toast", { detail: { message, type } }));
  };
  useEffect(() => {
    preloadLemonCheckout();
  }, []);
  const [congratsModalOpen, setCongratsModalOpen] = useState(false);
  const [congratsPlanSlug, setCongratsPlanSlug] = useState("");
  useEffect(() => {
    const justUpgraded = sessionStorage.getItem("vq_just_upgraded");
    const upgradedToPlan = sessionStorage.getItem("vq_upgraded_to_plan");
    if (justUpgraded === "true" && upgradedToPlan) {
      sessionStorage.removeItem("vq_just_upgraded");
      sessionStorage.removeItem("vq_upgraded_to_plan");
      setCongratsPlanSlug(upgradedToPlan);
      setCongratsModalOpen(true);
    }
  }, [tenant.plan, tenant.status]);
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
        if (data.plan !== tenant.plan || tenant.status !== "active") {
          sessionStorage.setItem("vq_just_upgraded", "true");
          sessionStorage.setItem("vq_upgraded_to_plan", data.plan || tenant.plan);
        }
        if (!silent) {
          toast(data.message || "Subscription synced.", "success");
          router.reload({ preserveScroll: true });
        }
        return true;
      }
      if (!silent) {
        toast(data?.message || data?.error || "No subscription found to sync yet.", "info");
      }
      return false;
    } catch (err) {
      console.error("[billing] subscription sync failed", err);
      if (!silent) {
        toast("Could not reach the server to sync your subscription.", "error");
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  const launchCheckout = async (fetchUrl, { context = "purchase", successMessage, onDone } = {}) => {
    try {
      const url = await fetchUrl();
      if (!url) {
        onDone?.();
        return;
      }
      await openLemonCheckout(url, {
        onSuccess: () => {
          toast(successMessage || "Payment received — activating your plan…", "success");
          (async () => {
            const delays = [1200, 2e3, 3e3, 4e3, 5e3, 6e3];
            for (const wait of delays) {
              await new Promise((r) => setTimeout(r, wait));
              if (await runSubscriptionSync({ silent: true })) {
                closeLemonCheckout();
                toast("Your plan is active.", "success");
                router.reload({ preserveScroll: true });
                onDone?.();
                return;
              }
            }
            closeLemonCheckout();
            toast(
              'Payment received. Your plan is taking longer than usual to activate — tap "Already Paid?" to retry.',
              "info"
            );
            router.reload({ preserveScroll: true });
            onDone?.();
          })();
        },
        onClose: () => {
          onDone?.();
        },
        onError: () => {
          onDone?.();
        }
      });
    } catch (err) {
      console.error(`[billing] ${context} checkout failed`, err);
      toast("Could not open the checkout. Please check your connection and try again.", "error");
      onDone?.();
    }
  };
  const postForCheckoutUrl = async (routeName, payload) => {
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
    toast(data?.error || "An unexpected error occurred. Please try again.", "error");
    return null;
  };
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
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const currentPlanKey = tenant?.plan ?? "starter";
  const currentMeta = PLAN_META[currentPlanKey] ?? PLAN_META.starter;
  const isLtd = currentPlanKey.startsWith("ltd");
  const subEndsAt = tenant?.subscription_ends_at ? new Date(tenant.subscription_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
  const subDaysLeft = tenant?.subscription_ends_at ? Math.max(0, Math.ceil((new Date(tenant.subscription_ends_at) - /* @__PURE__ */ new Date()) / 864e5)) : null;
  const lsStatus = history?.subscription?.status ?? null;
  const lsIsTrialling = lsStatus === "on_trial";
  const lsIsPaying = lsStatus ? ["active", "past_due", "cancelled"].includes(lsStatus) : null;
  const isTrial = tenant?.status === "trial" || lsIsTrialling;
  const confirmedPaying = lsIsPaying ?? tenant?.status === "active";
  const statusMismatch = lsStatus !== null && tenant?.status === "active" !== !!lsIsPaying;
  const trialEndsAt = lsIsTrialling && (history?.subscription?.trial_ends_at || history?.subscription?.expires_at) || (tenant?.status === "trial" ? tenant?.trial_ends_at : null);
  const trialDaysLeft = isTrial && trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt) - /* @__PURE__ */ new Date()) / 864e5)) : null;
  const trialCreditFor = (cycle = billingCycle) => {
    if (!trial_credit) return null;
    const percent = cycle === "annual" ? trial_credit.percent_annual : trial_credit.percent_monthly;
    if (!percent || percent <= 0) return null;
    return { percent, daysRemaining: trial_credit.days_remaining };
  };
  const isViewOnly = tenant?.view_only_since !== null;
  const viewOnlyDaysLeft = tenant?.view_only_since ? Math.max(0, 30 - Math.ceil((/* @__PURE__ */ new Date() - new Date(tenant.view_only_since)) / 864e5)) : 30;
  const usageData = usage ?? {};
  const hasLockedActive = feature_status?.some((f) => f.is_active && f.is_locked);
  const calcProductsNum = Math.max(0, parseInt(calcProducts) || 0);
  const calcVariantsNum = Math.max(1, parseInt(calcVariants) || 1);
  const serviceTier = SERVICE_TIERS[selectedService];
  const extraBlocks = calcVariantsNum > 5 ? Math.ceil((calcVariantsNum - 5) / 5) : 0;
  const usdPricePerProduct = serviceTier ? serviceTier.priceUSD + extraBlocks * serviceTier.extraUSD : 0;
  const pkrPricePerProduct = serviceTier ? serviceTier.pricePKR + extraBlocks * serviceTier.extraPKR : 0;
  const usdTotalSetupCost = calcProductsNum * usdPricePerProduct;
  const pkrTotalSetupCost = calcProductsNum * pkrPricePerProduct;
  const handleCancelTrial = () => {
    if (confirm("Are you sure you want to cancel your free trial? Your store will immediately transition to View-Only mode for 30 days, locking all modifications and sales. You can restore access anytime by subscribing.")) {
      router.post(route("store.billing.cancel-trial", { store_slug: storeSlug }));
    }
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
  const handleAddonTrial = (addonType) => {
    router.post(route("store.billing.checkout-addon", { store_slug: storeSlug }), {
      addon_type: addonType,
      trial_mode: true
    });
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
        toast(data?.error || "Checkout is unavailable right now. Please try again shortly.", "error");
        return null;
      },
      {
        context: "plan",
        successMessage: "Payment received — applying your new plan…",
        onDone: () => setCheckoutBusy(null)
      }
    );
  };
  const handleSelectPlan = (planKey) => {
    setSelectedPlan(planKey);
    setIsChangeModalOpen(true);
  };
  const handleConfirmPlanChange = () => {
    router.post(route("store.billing.change-plan", { store_slug: storeSlug }), { plan: selectedPlan }, {
      onSuccess: () => {
        setIsChangeModalOpen(false);
      }
    });
  };
  const handleCancelDowngrade = () => {
    if (confirm("Are you sure you want to cancel your scheduled plan downgrade? You will remain on your current plan and continue to be billed normally.")) {
      router.post(route("store.billing.change-plan", { store_slug: storeSlug }), { cancel_downgrade: true });
    }
  };
  const handleDeactivateFeature = (key, name) => {
    if (confirm(`Are you sure you want to deactivate ${name}? This will permanently delete the active records and configurations in your store database for this feature, allowing you to return below limits. This cannot be undone.`)) {
      router.post(route("store.billing.deactivate-feature", { store_slug: storeSlug }), { feature: key });
    }
  };
  const pendingCreditSummary = (() => {
    if (!pendingCheckout) return null;
    const credit = trialCreditFor(pendingCheckout.cycle);
    if (!credit) return null;
    const plan = plans?.find((p) => p.slug === pendingCheckout.planKey);
    const isAnnualPending = pendingCheckout.cycle === "annual";
    const fullUsd = parseFloat(
      (isAnnualPending ? plan?.price_annual_usd : plan?.price_monthly_usd) || 0
    );
    const fullPkr = parseFloat(
      (isAnnualPending ? plan?.price_annual : plan?.price_monthly) || 0
    );
    const ratio = credit.percent / 100;
    const renewal = /* @__PURE__ */ new Date();
    if (isAnnualPending) {
      renewal.setFullYear(renewal.getFullYear() + 1);
    } else {
      renewal.setMonth(renewal.getMonth() + 1);
    }
    return {
      planKey: pendingCheckout.planKey,
      planLabel: PLAN_META[pendingCheckout.planKey]?.label ?? plan?.name ?? pendingCheckout.planKey,
      cycleLabel: isAnnualPending ? "year" : "month",
      percent: credit.percent,
      daysRemaining: credit.daysRemaining,
      fullPrice: fmtCost(fullUsd, fullPkr),
      creditAmount: fmtCost(fullUsd * ratio, fullPkr * ratio),
      dueToday: fmtCost(fullUsd * (1 - ratio), fullPkr * (1 - ratio)),
      renewalDate: renewal.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    };
  })();
  const targetPlanModel = plans?.find((p) => p.slug === selectedPlan);
  const currentPlanModel = plans?.find((p) => p.slug === currentPlanKey);
  const targetPriceUSD = targetPlanModel ? parseFloat(targetPlanModel.price_monthly_usd || targetPlanModel.price_monthly) : selectedPlan === "starter" ? 19 : selectedPlan === "growth" ? 49 : selectedPlan === "business" ? 99 : 0;
  const targetPricePKR = targetPlanModel ? parseFloat(targetPlanModel.price_monthly) : Math.round(targetPriceUSD * 280);
  const currentPriceUSD = currentPlanModel ? parseFloat(currentPlanModel.price_monthly_usd || currentPlanModel.price_monthly) : currentPlanKey === "starter" ? 19 : currentPlanKey === "growth" ? 49 : currentPlanKey === "business" ? 99 : 0;
  const currentPricePKR = currentPlanModel ? parseFloat(currentPlanModel.price_monthly) : Math.round(currentPriceUSD * 280);
  const diffUSD = targetPriceUSD - currentPriceUSD;
  const diffPKR = targetPricePKR - currentPricePKR;
  let proratedEstUSD = 0;
  let proratedEstPKR = 0;
  let remainingDays = 0;
  let nextBillingDateStr = "";
  const planOrder = ["starter", "growth", "business"];
  const currentIdx = planOrder.indexOf(currentPlanKey);
  const targetIdx = planOrder.indexOf(selectedPlan);
  const isUpgrade = targetIdx > currentIdx;
  if (tenant?.subscription_ends_at) {
    const cycleEnd = new Date(tenant.subscription_ends_at);
    nextBillingDateStr = cycleEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const now = /* @__PURE__ */ new Date();
    const cycleStart = new Date(cycleEnd);
    cycleStart.setMonth(cycleStart.getMonth() - 1);
    const totalMs = cycleEnd - cycleStart;
    const remainingMs = cycleEnd - now;
    remainingDays = Math.max(0, Math.ceil(remainingMs / (1e3 * 60 * 60 * 24)));
    const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
    if (isUpgrade) {
      proratedEstUSD = diffUSD * ratio;
      proratedEstPKR = diffPKR * ratio;
    }
  } else {
    const nextBilling = /* @__PURE__ */ new Date();
    nextBilling.setDate(nextBilling.getDate() + 30);
    nextBillingDateStr = nextBilling.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    proratedEstUSD = targetPriceUSD;
    proratedEstPKR = targetPricePKR;
  }
  const FEATURES_GAIN_LOSS = {
    growth: {
      gained: [
        "WooCommerce Sync (Unlimited)",
        "AI Chatbot & Retention engine",
        "Multi-Branch warehouse support",
        "Up to 10 staff member accounts (Starter: 3)",
        "Unlimited products/SKUs (Starter: 1,000)",
        "Advanced reporting structures"
      ],
      lost: [
        "WooCommerce Sync connections",
        "AI Chatbot key configurations",
        "Multi-Branch warehouse settings",
        "Warehouse locations limit (reduced to 3)",
        "Staff accounts limit (reduced to 10)",
        "Product/SKUs count capped at 1,000 SKUs",
        "Advanced reporting modules"
      ]
    },
    business: {
      gained: [
        "Full Public REST API Access",
        "Unlimited warehouse locations (Growth: 3)",
        "Unlimited staff member accounts (Growth: 10)",
        "Bill of Materials (BOM) & Manufacturing",
        "Fixed asset depreciation postings",
        "Fiscal year closing automated wizard",
        "Recurring invoicing automation"
      ],
      lost: [
        "Public REST API keys & access",
        "Warehouse locations cap of 3 (Business: Unlimited)",
        "Staff accounts cap of 10 (Business: Unlimited)",
        "BOM records and manufacturing actions",
        "Asset depreciation posting calculations",
        "Fiscal year close zeroing wizard",
        "Recurring invoicing records"
      ]
    },
    starter: {
      lost: [
        "WooCommerce Sync connections",
        "AI Chatbot key configurations",
        "Multi-Branch warehouse settings",
        "Warehouse locations cap of 1 (Growth: 3)",
        "Staff accounts cap of 3 (Growth: 10)",
        "Product/SKUs count capped at 1,000 SKUs",
        "Advanced reporting modules",
        "BOM records and manufacturing actions",
        "Asset depreciation posting calculations",
        "Fiscal year close zeroing wizard",
        "Recurring invoicing records",
        "Public REST API keys & access"
      ]
    }
  };
  let modalFeatures = [];
  if (isUpgrade) {
    if (selectedPlan === "growth") {
      modalFeatures = FEATURES_GAIN_LOSS.growth.gained;
    } else if (selectedPlan === "business") {
      if (currentPlanKey === "starter") {
        modalFeatures = [...FEATURES_GAIN_LOSS.growth.gained, ...FEATURES_GAIN_LOSS.business.gained];
      } else {
        modalFeatures = FEATURES_GAIN_LOSS.business.gained;
      }
    }
  } else {
    if (selectedPlan === "growth") {
      modalFeatures = FEATURES_GAIN_LOSS.business.lost;
    } else if (selectedPlan === "starter") {
      if (currentPlanKey === "business") {
        modalFeatures = FEATURES_GAIN_LOSS.starter.lost;
      } else {
        modalFeatures = FEATURES_GAIN_LOSS.growth.lost;
      }
    }
  }
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Billing & Subscription", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Billing & Subscription" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto p-4 md:p-8", children: [
      isViewOnly && /* @__PURE__ */ jsxs("div", { className: "mb-8 p-6 rounded-[2rem] bg-gradient-to-r from-red-900/80 via-red-950 to-black border border-red-500/30 shadow-2xl relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-32 -mt-32" }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col md:flex-row items-center justify-between gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-1", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 24, className: "text-red-400" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-white leading-none mb-2", children: "View-Only Mode Active" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 max-w-xl leading-relaxed", children: [
                "Your evaluation period or subscription has expired. You can view reports and download your database backup, but writing transactions and inventory is locked.",
                /* @__PURE__ */ jsxs("span", { className: "text-red-400 font-bold block mt-1", children: [
                  "Your store data will be permanently deleted in ",
                  viewOnlyDaysLeft,
                  " days if you do not subscribe."
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => window.location.href = route("store.admin.data", { store_slug: storeSlug }) + "?tab=backup",
                className: "px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(Download, { size: 14 }),
                  " Full System Backup & Restore"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleSelectPlan("growth"),
                className: "px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors whitespace-nowrap",
                children: "Activate Store Now"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `mb-8 p-6 md:p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-[#040113] border-white/[0.06]`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5 relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg", style: { background: currentMeta.color + "15" }, children: /* @__PURE__ */ jsx(currentMeta.Icon, { size: 32, color: currentMeta.color }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1", children: "Active Plan" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-black text-white", children: currentMeta.label }),
            /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 mt-1", children: isViewOnly ? `Locked in View-Only (${viewOnlyDaysLeft} days until deletion)` : tenant?.status === "suspended" ? "Trial Expired / Suspended" : isTrial ? trialDaysLeft !== null ? `Free trial — ${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left. No payment taken yet.` : "Free trial — no payment taken yet." : isLtd ? "Lifetime License" : subEndsAt ? `Renews on ${subEndsAt}` : "Active Subscription" }),
            isTrial && !isViewOnly && trialDaysLeft !== null && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1.5 flex-wrap", children: [
              /* @__PURE__ */ jsxs("span", { className: `text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${trialDaysLeft <= 3 ? "bg-red-500/10 text-red-400" : trialDaysLeft <= 7 ? "bg-amber-500/10 text-amber-400" : "bg-purple-500/10 text-purple-300"}`, children: [
                "Trial · ",
                trialDaysLeft,
                " ",
                trialDaysLeft === 1 ? "day" : "days",
                " left"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setActiveTab("payments"),
                  className: "text-[11px] font-bold text-slate-500 hover:text-purple-300 underline decoration-dotted underline-offset-2 transition-colors",
                  children: "View payment history"
                }
              )
            ] }),
            !isTrial && !isLtd && !isViewOnly && subDaysLeft !== null && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1.5 flex-wrap", children: [
              /* @__PURE__ */ jsxs("span", { className: `text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${subDaysLeft <= 3 ? "bg-red-500/10 text-red-400" : subDaysLeft <= 7 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`, children: [
                subDaysLeft,
                " ",
                subDaysLeft === 1 ? "day" : "days",
                " left"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setActiveTab("payments"),
                  className: "text-[11px] font-bold text-slate-500 hover:text-purple-300 underline decoration-dotted underline-offset-2 transition-colors",
                  children: "View payment history"
                }
              )
            ] }),
            isTrial && !isViewOnly && trialCreditFor(billingCycle) && /* @__PURE__ */ jsxs("div", { className: "text-[11px] font-bold text-emerald-400 mt-1.5 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Zap, { size: 11, className: "fill-emerald-400" }),
              "Pay early and your unused days become a ",
              trialCreditFor(billingCycle).percent,
              "% credit — you lose nothing."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-3 relative z-10", children: [
          !confirmedPaying && !isLtd && !isViewOnly && /* @__PURE__ */ jsxs(Fragment, { children: [
            isTrial && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleCancelTrial,
                className: "px-4 py-3 bg-transparent hover:bg-white/[0.04] text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-colors whitespace-nowrap",
                children: "Cancel Trial"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                disabled: checkoutBusy === currentPlanKey,
                onClick: () => handlePlanCheckout(currentPlanKey, billingCycle, currencyDisplay),
                className: "px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-wait text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg active:scale-95 whitespace-nowrap",
                children: [
                  /* @__PURE__ */ jsx(Zap, { size: 14, className: "fill-white" }),
                  checkoutBusy === currentPlanKey ? "Opening…" : "Pay Now"
                ]
              }
            )
          ] }),
          history?.subscription?.update_card_url && !isViewOnly && /* @__PURE__ */ jsxs(
            "a",
            {
              href: history.subscription.update_card_url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-slate-300 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all",
              children: [
                /* @__PURE__ */ jsx(CreditCard, { size: 14 }),
                " Update Card"
              ]
            }
          ),
          confirmedPaying && !isLtd && !isViewOnly && !history?.subscription?.is_cancelled && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setCancelOpen(true),
              className: "px-4 py-3 bg-transparent hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl font-bold text-xs transition-colors whitespace-nowrap",
              children: "Cancel Subscription"
            }
          ),
          history?.subscription?.is_cancelled && !isLtd && !isViewOnly && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: submitResumeSubscription,
              disabled: resumeBusy,
              className: "px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-wait text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg active:scale-95 whitespace-nowrap",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: resumeBusy ? "animate-spin" : "" }),
                resumeBusy ? "Resuming…" : "Resume Subscription"
              ]
            }
          ),
          !isLtd && (tenant?.status !== "active" || statusMismatch) && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => runSubscriptionSync(),
              disabled: isSyncing,
              title: "Already paid but your plan hasn't updated? Click to re-check with Lemon Squeezy.",
              className: "px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-wait text-slate-400 hover:text-white font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { size: 13, className: isSyncing ? "animate-spin" : "" }),
                isSyncing ? "Checking…" : "Already Paid?"
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "px-5 py-2 rounded-full font-black text-xs tracking-widest uppercase border border-purple-500/20 bg-purple-500/10 text-purple-300", children: currentPlanKey })
        ] })
      ] }),
      tenant?.plan_limits?.pending_downgrade && /* @__PURE__ */ jsxs("div", { className: "mb-8 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "text-amber-400 shrink-0", size: 20 }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-black text-white uppercase tracking-wider", children: "Scheduled Downgrade Pending" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 mt-1", children: [
              "Your plan is scheduled to downgrade to ",
              /* @__PURE__ */ jsx("span", { className: "font-bold text-amber-300 uppercase", children: tenant.plan_limits.pending_downgrade.plan }),
              " on ",
              /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: new Date(tenant.plan_limits.pending_downgrade.effective_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) }),
              "."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleCancelDowngrade,
            className: "px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap",
            children: "Cancel Downgrade"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex border-b border-white/[0.06] mb-8 overflow-x-auto gap-2", children: [
        { id: "subscription", label: "Subscription & Usage", icon: Receipt },
        { id: "payments", label: "Payment History", icon: History },
        { id: "extra_features", label: "Extra Features", icon: Lock },
        { id: "addons", label: "AI & Sync Add-ons", icon: Sparkles },
        { id: "services", label: "Onboarding Services", icon: Calendar },
        { id: "desktop_app", label: "Windows Application", icon: Monitor }
      ].map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;
        const showWarningDot = tab.id === "extra_features" && hasLockedActive;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab(tab.id),
            className: `flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap
                                    ${isActive ? "border-purple-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`,
            children: [
              /* @__PURE__ */ jsx(TabIcon, { size: 14 }),
              " ",
              tab.label,
              showWarningDot && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-red-500 animate-pulse" })
            ]
          },
          tab.id
        );
      }) }),
      activeTab === "subscription" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-fadeIn", children: [
        PKR_ENABLED,
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(BarChart2, { size: 16 }),
            " Plan Resource Usage"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsx(
              UsageMeter,
              {
                icon: Users,
                label: "Staff Members",
                color: "#6366f1",
                used: usageData.staff_count ?? 0,
                limit: usageData.staff_limit
              }
            ),
            /* @__PURE__ */ jsx(
              UsageMeter,
              {
                icon: Package,
                label: "Products (SKUs)",
                color: "#10b981",
                used: usageData.product_count ?? 0,
                limit: usageData.sku_limit
              }
            ),
            /* @__PURE__ */ jsx(
              UsageMeter,
              {
                icon: GitBranch,
                label: "Locations",
                color: "#f59e0b",
                used: usageData.location_count ?? 1,
                limit: usageData.locations
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-6", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center", children: isLtd ? "Your Early Supporter Perks" : "🚀 Scale your system as you grow" }),
          isPK,
          /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 mb-8", children: !isLtd && /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.07]", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setBillingCycle("monthly"),
                className: `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${billingCycle === "monthly" ? "bg-white text-[#020010] shadow-md" : "text-slate-400 hover:text-white"}`,
                children: "Monthly"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setBillingCycle("annual"),
                className: `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${billingCycle === "annual" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`,
                children: [
                  "Annual",
                  /* @__PURE__ */ jsx("span", { className: `text-[9px] px-1.5 py-0.5 rounded-full font-black ${billingCycle === "annual" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400"}`, children: "SAVE ~17%" })
                ]
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: isTrial || isViewOnly ? ["starter", "growth", "business"].map((key) => /* @__PURE__ */ jsx(
            PlanCard,
            {
              planKey: key,
              planConfig: plans?.find((p) => p.slug === key)?.limits ?? {},
              isCurrent: key === currentPlanKey,
              storeSlug,
              tenant,
              onSelectPlan: handleSelectPlan,
              onCheckout: handlePlanCheckout,
              checkoutBusy,
              plans,
              billingCycle,
              currencyDisplay
            },
            key
          )) : plans?.map((plan) => /* @__PURE__ */ jsx(
            PlanCard,
            {
              planKey: plan.slug,
              planConfig: plan.limits,
              isCurrent: plan.slug === currentPlanKey,
              storeSlug,
              tenant,
              onSelectPlan: handleSelectPlan,
              onCheckout: handlePlanCheckout,
              checkoutBusy,
              plans,
              billingCycle,
              currencyDisplay
            },
            plan.slug
          )) })
        ] })
      ] }),
      activeTab === "payments" && /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fadeIn", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(History, { size: 14 }),
            " Billing Period & Payments"
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => loadHistory(true),
              disabled: historyLoading,
              className: "px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-wait text-slate-400 hover:text-white font-bold text-xs transition-all flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { size: 13, className: historyLoading ? "animate-spin" : "" }),
                historyLoading ? "Loading…" : "Refresh"
              ]
            }
          )
        ] }),
        historyLoading && !history && /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsx("div", { className: "h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" }, i)) }),
        historyError && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-xs font-bold text-red-400 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 14 }),
          " ",
          historyError
        ] }),
        history && /* @__PURE__ */ jsxs(Fragment, { children: [
          history.subscription && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(BadgeCheck, { size: 12 }),
                " Status"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-black text-white capitalize", children: history.subscription.status_formatted || history.subscription.status || "—" }),
              history.subscription.is_cancelled && /* @__PURE__ */ jsx("div", { className: "text-[11px] font-bold text-amber-400 mt-1", children: "Cancelled — access runs to the date below" }),
              history.subscription.test_mode && /* @__PURE__ */ jsx("div", { className: "text-[11px] font-bold text-amber-400 mt-1", children: "Test mode" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Clock, { size: 12 }),
                " ",
                history.subscription.is_cancelled ? "Access Ends" : "Next Charge"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-black text-white", children: fmtDay(history.subscription.expires_at) }),
              history.subscription.days_until_expiry !== null && /* @__PURE__ */ jsxs("div", { className: `text-[11px] font-bold mt-1 ${history.subscription.days_until_expiry <= 3 ? "text-red-400" : history.subscription.days_until_expiry <= 7 ? "text-amber-400" : "text-emerald-400"}`, children: [
                history.subscription.days_until_expiry,
                " days remaining"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(CreditCard, { size: 12 }),
                " Payment Method"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-black text-white", children: history.subscription.card || "Not on file" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Receipt, { size: 12 }),
                " Total Paid"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-black text-white", children: history.lifetime_usd || "$0.00" }),
              /* @__PURE__ */ jsxs("div", { className: "text-[11px] font-bold text-slate-500 mt-1", children: [
                history.invoice_count,
                " ",
                history.invoice_count === 1 ? "invoice" : "invoices"
              ] })
            ] })
          ] }),
          statusMismatch && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs leading-relaxed text-amber-300 flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Lemon Squeezy reports this subscription as",
              " ",
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: history.subscription?.status_formatted || lsStatus }),
              ", but this store is saved locally as",
              " ",
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: tenant?.status }),
              ".",
              lsIsTrialling ? " No payment has been taken yet — Pay Now is available above." : " Lemon Squeezy is correct.",
              " ",
              "Click ",
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Already Paid?" }),
              " to re-sync the record."
            ] })
          ] }),
          lsIsTrialling && history.invoices?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs leading-relaxed text-purple-200 flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(Info, { size: 14, className: "shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "This subscription is in a Lemon Squeezy free-trial period, so the first invoice is ",
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: "$0.00" }),
              ". The first real charge happens on",
              " ",
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: fmtDay(history.subscription?.expires_at) }),
              "."
            ] })
          ] }),
          historyDateMismatch && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs leading-relaxed text-amber-300 flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "This store's saved renewal date (",
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: fmtDay(history.local?.subscription_ends_at) }),
              ") doesn't match what Lemon Squeezy reports (",
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: fmtDay(history.subscription?.expires_at) }),
              "). Lemon Squeezy is correct. Use ",
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Already Paid?" }),
              " to re-sync."
            ] })
          ] }),
          history.local && !history.local.has_subscription_id && history.local.status === "active" && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs leading-relaxed text-amber-300 flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(Info, { size: 14, className: "shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsx("span", { children: "This store is marked active but has no Lemon Squeezy subscription ID, so no real payment is recorded against it. Its renewal date was set locally, not by a purchase." })
          ] }),
          history.message && /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center", children: [
            /* @__PURE__ */ jsx(Receipt, { size: 28, className: "mx-auto text-slate-600 mb-3" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400", children: history.message })
          ] }),
          history.invoices?.length > 0 && /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "border-b border-white/[0.06]", children: ["Paid On", "Period Covered", "Days", "Amount", "Credit Applied", "Status", ""].map((h) => /* @__PURE__ */ jsx("th", { className: "px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap", children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/[0.04]", children: history.invoices.map((inv) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-white/[0.02] transition-colors", children: [
              /* @__PURE__ */ jsxs("td", { className: "px-5 py-4 whitespace-nowrap", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-black text-white", children: fmtDay(inv.paid_at) }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-slate-500 capitalize mt-0.5", children: inv.billing_reason === "initial" ? "First payment" : inv.billing_reason === "renewal" ? "Renewal" : inv.billing_reason === "updated" ? "Plan change" : inv.billing_reason })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-300", children: inv.period_end ? `${fmtDay(inv.period_start)} → ${fmtDay(inv.period_end)}` : fmtDay(inv.period_start) }),
              /* @__PURE__ */ jsx("td", { className: "px-5 py-4 whitespace-nowrap", children: inv.period_days !== null ? /* @__PURE__ */ jsxs("span", { className: "px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-black", children: [
                inv.period_days,
                " days"
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-slate-600", children: "—" }) }),
              /* @__PURE__ */ jsxs("td", { className: "px-5 py-4 whitespace-nowrap", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-black text-white", children: inv.total }),
                inv.has_discount && /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-slate-500 mt-0.5 line-through", children: inv.subtotal })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-5 py-4 whitespace-nowrap", children: inv.has_discount ? /* @__PURE__ */ jsxs("span", { className: "px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center gap-1 w-fit", children: [
                /* @__PURE__ */ jsx(Zap, { size: 10, className: "fill-emerald-400" }),
                " −",
                inv.discount_total
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-slate-600", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-5 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-lg text-[11px] font-black border ${inv.refunded || inv.status === "refunded" ? "bg-slate-500/10 border-slate-500/20 text-slate-400" : inv.status === "paid" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : inv.status === "pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`, children: inv.status_formatted || inv.status }) }),
              /* @__PURE__ */ jsx("td", { className: "px-5 py-4 whitespace-nowrap text-right", children: inv.invoice_url && /* @__PURE__ */ jsxs(
                "a",
                {
                  href: inv.invoice_url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-slate-400 hover:text-white text-[11px] font-bold transition-all",
                  children: [
                    /* @__PURE__ */ jsx(FileText, { size: 11 }),
                    " Invoice"
                  ]
                }
              ) })
            ] }, inv.id)) })
          ] }) }) }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-slate-600 text-center", children: [
            "Read live from Lemon Squeezy · updated ",
            history.fetched_at ? new Date(history.fetched_at).toLocaleTimeString() : "—"
          ] })
        ] })
      ] }),
      activeTab === "extra_features" && /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-fadeIn", children: /* @__PURE__ */ jsxs("div", { className: "p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06]", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsx(Lock, { className: "text-purple-400", size: 24 }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white", children: "Extra Features Control" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mb-8 max-w-xl", children: "If you have configured features that are not included in your current plan, you can deactivate/remove them here to restore normal operations. Alternatively, upgrade your plan to unlock full access." }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: feature_status?.map((feat) => {
          const targetPlan = FEATURE_UPGRADE_TARGET[feat.key] || "growth";
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: `p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${feat.is_active && feat.is_locked ? "bg-red-500/[0.02] border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.03)]" : feat.is_active ? "bg-emerald-500/[0.02] border-emerald-500/20" : "bg-white/[0.01] border-white/[0.04]"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-white", children: feat.name }),
                    feat.is_active && feat.is_locked && /* @__PURE__ */ jsxs("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
                      " Active & Locked (Limits Exceeded)"
                    ] }),
                    feat.is_active && !feat.is_locked && /* @__PURE__ */ jsxs("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { size: 10 }),
                      " Active & Subscribed"
                    ] }),
                    !feat.is_active && feat.is_locked && /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700", children: "Locked (Upgrade to unlock)" }),
                    !feat.is_active && !feat.is_locked && /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700", children: "Available" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-2 leading-relaxed max-w-xl", children: feat.description })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 self-end md:self-center", children: [
                  feat.is_active && feat.is_locked && /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDeactivateFeature(feat.key, feat.name),
                      className: "px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors",
                      children: "Deactivate Feature"
                    }
                  ),
                  feat.is_locked && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => handleSelectPlan(targetPlan),
                      className: "px-4 py-2 bg-white text-[#020010] hover:bg-slate-100 rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1 shadow-md",
                      children: [
                        /* @__PURE__ */ jsx(Sparkles, { size: 12 }),
                        " Keep & Upgrade"
                      ]
                    }
                  ),
                  !feat.is_locked && feat.is_active && /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-slate-500", children: "Configured & Healthy" }),
                  !feat.is_locked && !feat.is_active && /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-slate-500", children: "Not Configured" })
                ] })
              ]
            },
            feat.key
          );
        }) })
      ] }) }),
      activeTab === "addons" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-fadeIn", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx(Cpu, { className: "text-purple-400", size: 24 }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white", children: "AI Engine Add-on" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mb-6", children: "Supercharge your store with AI-powered scanning (SmartCapture) and interactive assistant tools. Every store starts with 10 free credits to test out the capabilities." }),
          /* @__PURE__ */ jsx("div", { className: "p-5 rounded-2xl bg-[#0b081e]/40 border border-white/[0.05] mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-widest", children: "Active Level" }),
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-black text-white mt-1 capitalize", children: tenant?.ai_status === "none" ? "Free Starter Tier (10 Credits)" : tenant?.ai_status })
            ] }),
            tenant?.ai_status === "none" && /* @__PURE__ */ jsxs("div", { className: "flex-1 max-w-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-slate-400 mb-1", children: [
                /* @__PURE__ */ jsx("span", { children: "Free Scans Used:" }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-white", children: [
                  tenant?.plan_limits?.ai_scans_used ?? 0,
                  " / 10"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 bg-white/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500",
                  style: { width: `${Math.min(100, (tenant?.plan_limits?.ai_scans_used ?? 0) / 10 * 100)}%` }
                }
              ) })
            ] }),
            tenant?.ai_status === "managed" && /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500 font-bold uppercase", children: "Scans" }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm font-black text-white", children: [
                  tenant?.plan_limits?.ai_scans_used ?? 0,
                  " / ",
                  tenant?.plan_limits?.ai_scans_limit ?? 90
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right border-l border-white/10 pl-4", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500 font-bold uppercase", children: "Queries" }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm font-black text-white", children: [
                  tenant?.plan_limits?.ai_queries_used ?? 0,
                  " / ",
                  tenant?.plan_limits?.ai_queries_limit ?? 110
                ] })
              ] })
            ] }),
            tenant?.ai_status === "byok" && /* @__PURE__ */ jsxs("div", { className: "text-xs text-amber-300 font-bold flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
              " Bring Your Own Key License Active"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("h4", { className: "text-sm font-black text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 16, className: "text-amber-400" }),
            " Choose Your Upgrade Path"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "lg:col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all flex flex-col justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
                  /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20", children: "Bring Your Own Key" }),
                  /* @__PURE__ */ jsxs("div", { className: "text-xl font-black text-white", children: [
                    "$5 ",
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-slate-400", children: "once" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("h5", { className: "text-sm font-black text-white mb-2", children: "Lifetime BYOK License" }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 leading-relaxed", children: "Bypass platform scanning fees forever. Provide your own API keys for Gemini, Claude, OpenAI, or DeepSeek and pay nothing else." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-6", children: tenant?.ai_status === "byok" ? /* @__PURE__ */ jsx("button", { disabled: true, className: "w-full py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold uppercase tracking-wider cursor-default", children: "Already Purchased" }) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handlePurchaseAddon("ai_byok"),
                  disabled: isPurchasingAddon !== null,
                  className: "w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#020010] rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2",
                  children: isPurchasingAddon === "ai_byok" ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }) : "Buy BYOK Unlock"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
                /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20", children: "Managed API" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Monthly Subscriptions" })
              ] }),
              /* @__PURE__ */ jsx("h5", { className: "text-sm font-black text-white mb-2", children: "Managed AI Subscriptions" }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 leading-relaxed mb-4", children: "No developer keys or setup required. Use our fast platform credentials directly. Pick the tier that matches your monthly volume:" }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: [
                { key: "ai_starter", label: "Starter AI", price: "$3", scans: 90, queries: 110 },
                { key: "ai_lite", label: "Lite AI", price: "$5", scans: 150, queries: 200 },
                { key: "ai_pro", label: "Pro AI", price: "$15", scans: 480, queries: 420 },
                { key: "ai_ultimate", label: "Ultimate AI", price: "$25", scans: 850, queries: 800 }
              ].map((plan) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => handlePurchaseAddon(plan.key),
                  className: "p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-purple-500/30 hover:bg-purple-500/[0.02] cursor-pointer transition-all flex flex-col justify-between group",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-white group-hover:text-purple-300 transition-colors", children: plan.label }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-purple-400", children: plan.price })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-[9px] text-slate-500", children: [
                      plan.scans,
                      " scans / ",
                      plan.queries,
                      " queries"
                    ] })
                  ]
                },
                plan.key
              )) })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx(Globe2, { className: "text-indigo-400", size: 24 }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white", children: "Platform Sync Channels" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mb-6", children: "Keep your inventory in sync with WooCommerce and other platforms automatically." }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-[#0b081e]/40 border border-white/[0.05]", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-widest", children: "Subscribed Channels" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2 mt-3", children: tenant?.sync_channels && tenant.sync_channels.length > 0 ? tenant.sync_channels.map((ch) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400" }),
                ch,
                " Channel"
              ] }, ch)) : /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "No active sync channels." }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-indigo-400 uppercase tracking-widest", children: "Platform Sync Trial" }),
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-black text-white mt-1", children: "Evaluate WooCommerce Sync" }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 mt-2 leading-relaxed", children: "Test automatic inventory syncing with WooCommerce for the remainder of your trial period." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-4", children: tenant?.sync_channels && tenant.sync_channels.includes("woocommerce") ? /* @__PURE__ */ jsxs("span", { className: "text-xs text-emerald-400 font-bold flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
                " Sync Channels Active"
              ] }) : isTrial ? tenant?.plan_limits?.sync_trial_used ? /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-bold", children: "Sync trial already utilized." }) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleAddonTrial("sync"),
                  className: "px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors",
                  children: "Start Platform Sync Trial"
                }
              ) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleSelectPlan("growth"),
                  className: "px-5 py-2.5 bg-white text-[#020010] rounded-xl text-xs font-black uppercase tracking-wider transition-colors",
                  children: "Subscribe to Sync Add-on"
                }
              ) })
            ] })
          ] })
        ] })
      ] }),
      activeTab === "services" && /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-fadeIn", children: /* @__PURE__ */ jsxs("div", { className: "p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#0b081e] to-black border border-white/[0.06]", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "text-purple-400", size: 24 }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white", children: "Professional Product Upload Service" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mb-8 max-w-xl", children: "Let our catalog engineering team structure and upload your inventory. Use the calculator below to estimate the dynamic cost of importing your products." }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-8", children: Object.entries(SERVICE_TIERS).map(([key, tier]) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setSelectedService(key),
            className: `text-left p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px]
                                            ${selectedService === key ? "bg-purple-600/10 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.06)]" : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-white font-black text-sm", children: tier.name }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500 mt-1 leading-relaxed", children: tier.desc })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-baseline mt-4 pt-3 border-t border-white/[0.04] w-full", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-purple-400 font-semibold", children: tier.sla }),
                /* @__PURE__ */ jsxs("span", { className: "text-white font-black text-sm", children: [
                  fmt(tier.priceUSD, tier.pricePKR),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 font-medium", children: "/ea" })
                ] })
              ] })
            ]
          },
          key
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pt-6 border-t border-white/[0.06]", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2", children: "How many products?" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  placeholder: "e.g. 100",
                  value: calcProducts,
                  onChange: (e) => setCalcProducts(e.target.value),
                  className: "w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white text-sm outline-none focus:border-purple-500 transition-colors"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2", children: "Average variants per product?" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  placeholder: "First 5 variants free (e.g. 8)",
                  value: calcVariants,
                  onChange: (e) => setCalcVariants(e.target.value),
                  className: "w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white text-sm outline-none focus:border-purple-500 transition-colors"
                }
              ),
              /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-slate-500 mt-1 block", children: [
                "First 5 variants included. ",
                fmt(serviceTier.extraUSD, serviceTier.extraPKR),
                " per block of 5 extra variants."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-white/[0.01] border border-white/[0.05] flex flex-col justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-widest", children: "Cost Estimate Details" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-slate-400", children: [
                  /* @__PURE__ */ jsx("span", { children: "Tier Base Rate:" }),
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: fmt(serviceTier.priceUSD, serviceTier.pricePKR) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-slate-400", children: [
                  /* @__PURE__ */ jsx("span", { children: "Extra Variant Surcharge:" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-white font-bold", children: [
                    "+",
                    fmt(extraBlocks * serviceTier.extraUSD, extraBlocks * serviceTier.extraPKR)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-slate-400", children: [
                  /* @__PURE__ */ jsx("span", { children: "Final Price Per Product:" }),
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: fmt(usdPricePerProduct, pkrPricePerProduct) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-white/[0.05] flex justify-between items-center mt-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-400 uppercase tracking-wider", children: "Estimated Total" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-purple-400", children: fmt(usdTotalSetupCost, pkrTotalSetupCost) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4 border-t border-white/[0.06]", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleOrderSetupService,
            disabled: calcProductsNum === 0 || isOrderingService,
            className: "px-8 py-3.5 bg-white text-[#020010] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:shadow-none rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            children: isOrderingService ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "w-3.5 h-3.5 border-2 border-[#020010] border-t-transparent rounded-full animate-spin" }),
              "Redirecting..."
            ] }) : `Order Setup Service (${fmt(usdTotalSetupCost, pkrTotalSetupCost)})`
          }
        ) })
      ] }) }),
      activeTab === "desktop_app" && /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-fadeIn", children: /* @__PURE__ */ jsxs("div", { className: "p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#0b081e] to-black border border-white/[0.06] relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20", children: /* @__PURE__ */ jsx(Monitor, { className: "text-purple-400", size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white", children: "VenQore Station for Windows" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mt-1 max-w-2xl", children: "VenQore Station is our native enterprise desktop application that acts as a direct hardware bridge to your registers. It enables raw receipt printing, automatic cash drawer kicks, barcode scanning, scale readings, and cashier security audits with focus-loss tracking." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-w-xl mb-8", children: /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01] hover:border-purple-500/20 transition-all flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-white", children: "Windows Setup Installer" }),
              /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20", children: "Official Build" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mb-6", children: "Official setup installer. Establishes secure system directories, registers start menu entries, registers shell protocol endpoints, and supports silent auto-updates. Requires standard system installation to prevent unapproved cashier portable copies." })
          ] }),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/downloads/VenQore_Station_Setup.exe",
              download: true,
              className: "w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/10",
              children: [
                /* @__PURE__ */ jsx(Download, { size: 14 }),
                " Download Setup Installer (.exe)"
              ]
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-white/[0.06]", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-black text-white uppercase tracking-wider mb-4", children: "Quick Setup & Pairing Instructions" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
            { step: "1", title: "Install & Boot", desc: "Download the setup installer above, run it on your register, and launch the VenQore Station app." },
            { step: "2", title: "Store Pairing", desc: `Enter your store's display slug: ${storeSlug || "my-store"} on the pairing screen and click Connect.` },
            { step: "3", title: "Accept Consent", desc: "Accept the native employee security tracking consent when prompted by the manager configuration." },
            { step: "4", title: "Configure Hardware", desc: "Click the Gear icon in the top notch bar to set receipt printers, scale baud rates, or exit passcodes." }
          ].map((guide) => /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]", children: [
            /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-xs mb-3", children: guide.step }),
            /* @__PURE__ */ jsx("h5", { className: "text-xs font-bold text-white mb-1", children: guide.title }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 leading-relaxed", children: guide.desc })
          ] }, guide.step)) })
        ] })
      ] }) }),
      false
    ] }),
    /* @__PURE__ */ jsx(Modal, { show: isChangeModalOpen, onClose: () => setIsChangeModalOpen(false), maxWidth: "md", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white animate-fadeIn", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" }),
      /* @__PURE__ */ jsxs("h3", { className: "text-lg font-black tracking-tight flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "text-purple-400", size: 20 }),
        "Confirm Subscription ",
        isUpgrade ? "Upgrade" : "Downgrade"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500 font-bold uppercase tracking-wider", children: "Current Plan" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-black mt-1 capitalize text-slate-300", children: currentPlanKey }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 mt-0.5", children: [
              fmt(currentPriceUSD, currentPricePKR),
              "/mo"
            ] })
          ] }),
          /* @__PURE__ */ jsx(ArrowRight, { className: "text-slate-600 shrink-0", size: 16 }),
          /* @__PURE__ */ jsxs("div", { className: "text-center flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-purple-400 font-bold uppercase tracking-wider", children: "New Plan" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-black mt-1 capitalize text-purple-300", children: selectedPlan }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-purple-400 mt-0.5", children: [
              fmt(targetPriceUSD, targetPricePKR),
              "/mo"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2", children: isUpgrade ? "🎁 Features You Will Unlock:" : "⚠️ Features You Will Lose after billing cycle:" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: modalFeatures.map((feat, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-xs", children: [
            isUpgrade ? /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 12, className: "text-amber-500 shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: feat })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs leading-relaxed text-slate-300", children: isTrial ? /* @__PURE__ */ jsxs("p", { children: [
          "Your store is currently in the **Evaluation Period**. Switching to the ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-white capitalize", children: selectedPlan }),
          " trial is **free of charge** and will take effect immediately. Your free trial ends on ",
          /* @__PURE__ */ jsx("span", { className: "text-white font-semibold", children: tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "N/A" }),
          "."
        ] }) : isUpgrade ? /* @__PURE__ */ jsxs("p", { children: [
          "Your upgrade takes effect **instantly**. Today you will only be charged a prorated surplus difference of ",
          /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-black text-sm", children: fmt(proratedEstUSD, proratedEstPKR) }),
          " for the remaining ",
          /* @__PURE__ */ jsxs("span", { className: "text-white font-semibold", children: [
            remainingDays,
            " days"
          ] }),
          " of your current billing month. Starting ",
          /* @__PURE__ */ jsx("span", { className: "text-white font-semibold", children: nextBillingDateStr }),
          ", you will be charged the full price of ",
          /* @__PURE__ */ jsxs("span", { className: "text-white font-semibold", children: [
            fmt(targetPriceUSD, targetPricePKR),
            "/month"
          ] }),
          "."
        ] }) : /* @__PURE__ */ jsxs("p", { children: [
          "Your downgrade is **scheduled** and will take effect on ",
          /* @__PURE__ */ jsx("span", { className: "text-amber-400 font-black", children: nextBillingDateStr }),
          " at the end of your paid billing month. You will keep your current features and limits until then. Starting on that date, your plan will become ",
          /* @__PURE__ */ jsx("span", { className: "text-white font-bold capitalize", children: selectedPlan }),
          ", and your monthly billing will drop to ",
          /* @__PURE__ */ jsxs("span", { className: "text-white font-semibold", children: [
            fmt(targetPriceUSD, targetPricePKR),
            "/month"
          ] }),
          "."
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsChangeModalOpen(false),
            className: "px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs transition-colors",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleConfirmPlanChange,
            className: `px-5 py-2.5 rounded-xl text-black font-black text-xs uppercase tracking-wider transition-all hover:shadow-lg ${isUpgrade ? "bg-white hover:bg-slate-100" : "bg-amber-500 hover:bg-amber-400"}`,
            children: [
              "Confirm ",
              isUpgrade ? "Upgrade" : "Downgrade"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { show: !!pendingCreditSummary, onClose: () => setPendingCheckout(null), maxWidth: "md", children: pendingCreditSummary && /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white animate-fadeIn", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" }),
      /* @__PURE__ */ jsxs("h3", { className: "text-lg font-black tracking-tight flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsx(Zap, { className: "text-emerald-400 fill-emerald-400", size: 20 }),
        "You keep your ",
        pendingCreditSummary.daysRemaining,
        " free ",
        pendingCreditSummary.daysRemaining === 1 ? "day" : "days"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 leading-relaxed mb-5", children: [
        "You still have ",
        pendingCreditSummary.daysRemaining,
        " unused ",
        pendingCreditSummary.daysRemaining === 1 ? "day" : "days",
        " of free trial. Rather than lose ",
        pendingCreditSummary.daysRemaining === 1 ? "it" : "them",
        ", we take",
        " ",
        pendingCreditSummary.percent,
        "% off your first payment — the exact value of the time you have not used."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.05] mb-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-slate-400", children: [
            pendingCreditSummary.planLabel,
            " — per ",
            pendingCreditSummary.cycleLabel
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-300", children: pendingCreditSummary.fullPrice })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-emerald-400", children: [
            "Unused trial credit (",
            pendingCreditSummary.percent,
            "%)"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-black text-emerald-400", children: [
            "− ",
            pendingCreditSummary.creditAmount
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3.5 bg-white/[0.02]", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-black uppercase tracking-wider text-white", children: "Due today" }),
          /* @__PURE__ */ jsx("span", { className: "text-lg font-black text-white", children: pendingCreditSummary.dueToday })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs leading-relaxed text-slate-300 mb-6", children: [
        "Your plan activates immediately and nothing about your access changes. Your next payment is the full ",
        /* @__PURE__ */ jsx("span", { className: "text-white font-semibold", children: pendingCreditSummary.fullPrice }),
        " on",
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-white font-semibold", children: pendingCreditSummary.renewalDate }),
        ", and every payment after that renews normally. The credit applies once."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setPendingCheckout(null),
            className: "px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs transition-colors",
            children: "Not yet"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => startPlanCheckout(
              pendingCheckout.planKey,
              pendingCheckout.cycle,
              pendingCheckout.currency
            ),
            className: "px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-black font-black text-xs uppercase tracking-wider transition-all hover:shadow-lg",
            children: [
              "Pay ",
              pendingCreditSummary.dueToday,
              " now"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { show: cancelOpen, onClose: () => setCancelOpen(false), maxWidth: "md", children: /* @__PURE__ */ jsxs("div", { className: "p-8 bg-[#0b081e] text-white", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 20, className: "text-red-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-black", children: "Cancel your subscription?" }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-500 uppercase tracking-wider", children: currentMeta.label })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 mb-4", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-emerald-300 leading-relaxed flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { size: 14, className: "shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "You keep full access",
          paidUntilLabel ? /* @__PURE__ */ jsxs(Fragment, { children: [
            " until ",
            /* @__PURE__ */ jsx("span", { className: "font-black", children: paidUntilLabel })
          ] }) : " until the end of your current paid period",
          ". Nothing is lost today and no refund is needed — you already paid for this time."
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("ul", { className: "space-y-2 mb-6 text-xs font-bold text-slate-400", children: [
        /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(XCircle, { size: 13, className: "shrink-0 mt-0.5 text-slate-600" }),
          "No further payments will be taken."
        ] }),
        /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(XCircle, { size: 13, className: "shrink-0 mt-0.5 text-slate-600" }),
          "After that date your store moves to View-Only — your data stays intact, but sales and edits are locked until you subscribe again."
        ] }),
        /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(RefreshCw, { size: 13, className: "shrink-0 mt-0.5 text-slate-600" }),
          "You can resume any time before that date, with no new card details."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col-reverse sm:flex-row items-center justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setCancelOpen(false),
            disabled: cancelBusy,
            className: "w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] disabled:opacity-50 text-slate-300 font-black text-xs uppercase tracking-wider transition-all",
            children: "Keep my subscription"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: submitCancelSubscription,
            disabled: cancelBusy,
            className: "w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-wait text-white font-black text-xs uppercase tracking-wider transition-all",
            children: cancelBusy ? "Cancelling…" : "Yes, cancel it"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { show: congratsModalOpen, onClose: () => setCongratsModalOpen(false), maxWidth: "md", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 text-white animate-fadeIn", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4 animate-bounce", children: /* @__PURE__ */ jsx(Crown, { className: "text-purple-400", size: 32 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-indigo-200", children: "Congratulations!" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Your store is successfully upgraded and active" })
        ] }),
        (() => {
          const congratsPlan = plans?.find((p) => p.slug === congratsPlanSlug) || {
            name: congratsPlanSlug ? PLAN_META[congratsPlanSlug]?.label || congratsPlanSlug : "Starter Engine",
            limits: {}
          };
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3 border-b border-white/[0.05] pb-3", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "ACTIVE PLAN" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-purple-400 uppercase tracking-widest", children: congratsPlan.name || congratsPlanSlug })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "RENEWAL DATE" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-emerald-400", children: tenant.subscription_ends_at ? fmtDay(tenant.subscription_ends_at) : "—" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3", children: "What's Included in Your Plan:" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-white/[0.01] border border-white/[0.03] flex flex-col", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-500 font-bold uppercase tracking-wider", children: "Staff Limit" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-white mt-0.5", children: formatLimit(congratsPlan.limits?.staff_limit) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-white/[0.01] border border-white/[0.03] flex flex-col", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-500 font-bold uppercase tracking-wider", children: "Product (SKU) Limit" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-white mt-0.5", children: formatLimit(congratsPlan.limits?.sku_limit) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-white/[0.01] border border-white/[0.03] flex flex-col", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-500 font-bold uppercase tracking-wider", children: "Locations Limit" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-white mt-0.5", children: formatLimit(congratsPlan.limits?.locations) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-white/[0.01] border border-white/[0.03] flex flex-col", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-500 font-bold uppercase tracking-wider", children: "Transactions/mo" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-white mt-0.5", children: formatLimit(congratsPlan.limits?.transactions_per_month) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2", children: "Premium Upgrades Activated:" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                congratsPlanSlug === "business" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-300", children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "Unlimited Branches / Warehouses" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-300", children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "Full Public REST API Access" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-300", children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "Bill of Materials & Manufacturing" })
                  ] })
                ] }),
                congratsPlanSlug === "growth" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-300", children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "Multi-Branch Support (up to 3)" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-300", children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "AI Growth Engine Access" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-300", children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "Recurring Invoicing Gating Lifted" })
                  ] })
                ] }),
                congratsPlanSlug === "starter" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-300", children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "Access to Core POS & Retail Features" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-300", children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "Sales History Tracking" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-300", children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { size: 12, className: "text-emerald-400 shrink-0" }),
                  /* @__PURE__ */ jsx("span", { children: "Instant Real-Time Webhook Synchronization" })
                ] })
              ] })
            ] })
          ] });
        })(),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-6", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setCongratsModalOpen(false),
            className: "w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-purple-500/20 active:scale-95",
            children: "Let's Go!"
          }
        ) })
      ] })
    ] }) })
  ] });
}
export {
  BillingIndex as default
};

import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from "react";
import { usePage, Link, router } from "@inertiajs/react";
import { createPortal } from "react-dom";
import { Lock, Zap, ArrowRight, ChevronRight, Home, ShoppingCart, Package, Users, BarChart2, Settings, Plus, Truck, CreditCard, DollarSign, FileText, Calculator, Tag, Search, Command, Sparkles, RefreshCw, UserCheck, Download, X, Check, HeartHandshake, Info, AlertTriangle, AlertCircle, CheckCircle, Crown, Minimize2, Eye, LogOut, Clock, Activity, ShoppingBag, Store, Loader2, ShieldCheck, Circle, Globe, BarChart3, BadgeCheck, BookText, GitCompare, Landmark, Coins, Receipt, Wallet, BookUser, Factory, BookOpen, FileMinus, FileInput, Barcode, ScanLine, Layers, ClipboardCheck, ArrowLeftRight, Building2, CalendarClock, Utensils, FileSignature, Repeat, RefreshCcw, ClipboardList, Wrench, Menu, Box, LayoutDashboard, TrendingUp, Database, Ticket, UserCog, Rss, Monitor, MessageSquare, Mail, HardDrive, History, Trash2, ChevronLeft, User, Settings2, Type, PenLine, PanelRight, RotateCcw, MoreVertical, Sun, Moon } from "lucide-react";
import { n as normalizePlan, S as SELF_SERVE_PLANS, p as planRank, a as nextPlan, b as planLabel, P as PLAN_PERKS } from "./plans-CxabWI_P.js";
import { v as vq } from "./runtime-DwSFgQZq.js";
import { M as Modal, f as useWorkspace, g as useTheme, h as useAppearance } from "../ssr.js";
import { B as Button } from "./Input-BO7OpFmF.js";
import { V as VenaLogo, A as AiIsland } from "./AiIsland-Ccw9HuV0.js";
import { a as useNavLabel, u as useTermText } from "./terms-DwYjlWsV.js";
import "./ThinkingOrb-DGYTy5s1.js";
import { driver } from "driver.js";
import axios from "axios";
import { c as cn } from "./utils-H80jjgLf.js";
const NEAR_LIMIT_THRESHOLD = 0.8;
const CRITICAL_THRESHOLD = 0.95;
function usePlan() {
  const { props } = usePage();
  const plan = props.plan || {};
  const store = props.store || {};
  const features = plan.features || store.features || {};
  const limits = plan.limits || store.limits || {};
  const usage = plan.usage || {};
  const hasFeature = (featureKey) => {
    if (Object.prototype.hasOwnProperty.call(features, featureKey)) {
      return Boolean(features[featureKey]);
    }
    return false;
  };
  const isWithinLimit = (limitKey, currentCount = null) => {
    const limitVal = limits[limitKey];
    if (limitVal === null || limitVal === void 0) {
      return true;
    }
    const count = currentCount !== null ? currentCount : usage[limitKey] || 0;
    return count < limitVal;
  };
  const usageStatus = (usageBucket) => {
    const limitVal = limits[usageBucket];
    if (limitVal === null || limitVal === void 0 || limitVal === 0) {
      return "ok";
    }
    const count = usage[usageBucket] || 0;
    const ratio = count / limitVal;
    if (ratio >= CRITICAL_THRESHOLD) return "critical";
    if (ratio >= NEAR_LIMIT_THRESHOLD) return "warning";
    return "ok";
  };
  return {
    plan,
    store,
    features,
    limits,
    usage,
    hasFeature,
    isWithinLimit,
    usageStatus
  };
}
const FEATURE_METADATA = {
  // Universal Modules (ON for all including Solo)
  product_variants: { icon: "📦", label: "Product Variants", plan: "solo" },
  fifo_costing: { icon: "🧮", label: "FIFO Costing", plan: "solo" },
  barcode_label_factory: { icon: "🏷️", label: "Barcode Label Factory", plan: "solo" },
  batch_tracking: { icon: "📦", label: "Batch Tracking", plan: "solo" },
  batch_expiry: { icon: "📅", label: "Batch Expiry Tracking", plan: "solo" },
  bill_of_materials: { icon: "📋", label: "Bill of Materials & Recipes", plan: "solo" },
  cookbook: { icon: "📖", label: "Cookbook / Production", plan: "solo" },
  production: { icon: "🏭", label: "Manufacturing & Production", plan: "solo" },
  stock_take_audit: { icon: "🔍", label: "Stock Take Audits", plan: "solo" },
  imei_lifecycle: { icon: "📱", label: "IMEI / Serial Lifecycle Tracking", plan: "solo" },
  double_entry_ledger: { icon: "📓", label: "Double-Entry Ledger", plan: "solo" },
  marketing_campaigns: { icon: "📢", label: "SMS & Email Campaigns", plan: "solo" },
  email_marketing: { icon: "✉️", label: "Email Marketing", plan: "solo" },
  sms_marketing: { icon: "💬", label: "SMS Marketing", plan: "solo" },
  // Paid Universal (ON for Starter, Core, Scale)
  growth_engine: { icon: "✨", label: "AI Growth Engine", plan: "starter" },
  recurring_invoices: { icon: "🔄", label: "Recurring Invoices", plan: "starter" },
  bank_reconciliation: { icon: "🏦", label: "Bank Reconciliation", plan: "starter" },
  e_invoicing: { icon: "⚡", label: "E-Invoicing integration", plan: "starter" },
  fund_management: { icon: "💰", label: "Fund Management", plan: "starter" },
  fixed_asset_depreciation: { icon: "📉", label: "Asset Depreciation", plan: "starter" },
  fiscal_year_closing: { icon: "🔒", label: "Fiscal Year Closing", plan: "starter" },
  // Scale Fences
  multi_branch: { icon: "🚚", label: "Multi-Branch & Transfers", plan: "core" },
  stock_transfer: { icon: "🚚", label: "Stock Transfers", plan: "core" },
  api_access: { icon: "🔌", label: "API Access", plan: "core" },
  webhooks: { icon: "🪝", label: "Webhooks", plan: "core" },
  security_activity_log: { icon: "🛡️", label: "Security Activity Log", plan: "core" },
  custom_roles: { icon: "👥", label: "Custom Granular Roles", plan: "core" },
  network_unlimited: { icon: "🌐", label: "B2B Network Unlimited", plan: "core" },
  white_label: { icon: "🏷️", label: "White-Label Branding", plan: "scale" },
  consolidated_reporting: { icon: "🏢", label: "Consolidated Multi-Entity Reporting", plan: "scale" },
  // E-Commerce & Channels
  woocommerce: { icon: "🛒", label: "WooCommerce Sync", plan: "addon" },
  amazon_sync: { icon: "📦", label: "Amazon Sync", plan: "addon" },
  ebay_sync: { icon: "🏷️", label: "eBay Sync", plan: "addon" },
  tiktok_sync: { icon: "📱", label: "TikTok Shop Sync", plan: "addon" },
  // Support & Limits
  chat_support: { icon: "💬", label: "Live Chat Support", plan: "core" },
  sku_limit: { icon: "📦", label: "Product Catalogue Limit", plan: "starter" },
  staff_limit: { icon: "👤", label: "Staff Seat Limit", plan: "starter" },
  locations: { icon: "🏪", label: "Locations Limit", plan: "starter" },
  transactions_per_month: { icon: "📈", label: "Transaction Limit", plan: "solo" },
  smart_capture: { icon: "📸", label: "Smart Capture Limit", plan: "starter" }
};
const PLAN_LABELS = {
  solo: "Solo",
  trial: "Trial",
  starter: "Starter",
  core: "Core",
  scale: "Scale",
  custom: "Custom",
  growth: "Core",
  business: "Scale",
  ltd: "Lifetime Deal",
  ltd_1: "LTD Tier 1",
  ltd_2: "LTD Tier 2",
  ltd_3: "LTD Tier 3",
  addon: "Add-on Purchase"
};
function SecondaryButton({ className: _ignoredClassName, disabled, children, ...props }) {
  return /* @__PURE__ */ jsx(Button, { variant: "secondary", disabled, ...props, children });
}
const PLAN_COLORS = {
  core: { bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)", accent: vq.indigo[400] },
  scale: { bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.3)", accent: vq.purple[400] },
  addon: { bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.3)", accent: vq.purple[400] },
  default: { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", accent: vq.indigo[400] }
};
function LockedFeature({
  feature,
  mode = "gate",
  // 'gate' (block), 'lock' (overlay), 'badge' (inline clickable)
  label: customLabel,
  plan: customPlanRequired,
  fallback = null,
  showUpgradeBadge = true,
  // for gate mode
  height = 220,
  // for lock mode
  isComingSoon = false,
  // for badge mode (coming soon modal)
  isLocked,
  // explicit lock override
  children
}) {
  const { store } = usePage().props;
  const { hasFeature } = usePlan();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const isAllowed = isLocked !== void 0 ? !isLocked : hasFeature(feature);
  if (isAllowed && !isComingSoon) {
    return /* @__PURE__ */ jsx(Fragment, { children });
  }
  const metadata = FEATURE_METADATA[feature] || {};
  const label = customLabel || metadata.label || "This Feature";
  const planRequired = normalizePlan(customPlanRequired || metadata.plan || "core");
  const planLabel2 = PLAN_LABELS[planRequired] || planRequired;
  const currentPlan = store?.plan || "starter";
  const colors = PLAN_COLORS[planRequired] || PLAN_COLORS.default;
  const triggerUpgradeModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isComingSoon) {
      setShowComingSoon(true);
      return;
    }
    const billingUrl = window.route ? route("store.billing", { store_slug: store?.slug }) : "/billing";
    window.dispatchEvent(new CustomEvent("amd:plan-limit", {
      detail: {
        feature,
        message: `${label} is not available on your current plan.`,
        current_plan: currentPlan,
        billing_url: billingUrl
      }
    }));
  };
  if (mode === "gate") {
    if (fallback) return /* @__PURE__ */ jsx(Fragment, { children: fallback });
    if (!showUpgradeBadge) return null;
    return /* @__PURE__ */ jsx("div", { className: "relative border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-5 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center space-y-3", children: [
      /* @__PURE__ */ jsx("div", { style: { width: 44, height: 44, borderRadius: "50%", background: colors.bg, border: `1.5px solid ${colors.border}`, display: "grid", placeItems: "center", color: colors.accent }, children: /* @__PURE__ */ jsx(Lock, { size: 18 }) }),
      /* @__PURE__ */ jsxs("h4", { className: "text-sm font-bold text-ink dark:text-ink", children: [
        label,
        " is Locked"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-secondary dark:text-ink-secondary max-w-md leading-relaxed", children: [
        "This feature requires a ",
        planLabel2,
        " subscription."
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: triggerUpgradeModal,
          className: "inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-brand-600 hover:bg-brand-700 transition shadow-sm",
          children: [
            /* @__PURE__ */ jsx(Zap, { size: 12, className: "mr-1.5" }),
            "Upgrade to ",
            planLabel2
          ]
        }
      )
    ] }) });
  }
  if (mode === "lock") {
    return /* @__PURE__ */ jsxs("div", { style: { position: "relative", minHeight: height }, children: [
      /* @__PURE__ */ jsx("div", { style: { filter: "blur(4px)", opacity: 0.35, pointerEvents: "none", userSelect: "none" }, "aria-hidden": "true", children }),
      /* @__PURE__ */ jsxs("div", { style: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(8,10,18,0.72)", backdropFilter: "blur(2px)", borderRadius: 14, border: `1px solid ${colors.border}`, gap: 14, padding: 24, textAlign: "center", zIndex: 30 }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 52, height: 52, borderRadius: "50%", background: colors.bg, border: `1.5px solid ${colors.border}`, display: "grid", placeItems: "center", color: colors.accent }, children: /* @__PURE__ */ jsx(Lock, { size: 22 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 15, fontWeight: 800, color: vq.slate[200], marginBottom: 5 }, children: [
            label,
            " requires ",
            planLabel2
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 12.5, color: vq.slate[500], maxWidth: 280, margin: "0 auto", lineHeight: 1.55 }, children: [
            "Upgrade your plan to unlock ",
            label.toLowerCase(),
            " and other advanced capabilities."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: triggerUpgradeModal, style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 999, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}bb)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: `0 4px 16px ${colors.accent}33`, transition: "all .15s" }, onMouseEnter: (e) => e.currentTarget.style.transform = "translateY(-1px)", onMouseLeave: (e) => e.currentTarget.style.transform = "translateY(0)", children: [
          /* @__PURE__ */ jsx(Zap, { size: 14 }),
          "Upgrade to ",
          planLabel2,
          /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
        ] })
      ] })
    ] });
  }
  if (mode === "badge") {
    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerUpgradeModal();
    };
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { onClick: handleClick, className: "relative cursor-pointer group w-full", children: [
        children,
        showUpgradeBadge && /* @__PURE__ */ jsx("div", { className: "absolute right-2 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx(Lock, { size: 12, className: "text-amber-500" }) })
      ] }),
      showComingSoon && /* @__PURE__ */ jsx(Modal, { show: showComingSoon, onClose: () => setShowComingSoon(false), maxWidth: "sm", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-brand-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 text-center relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 transform hover:rotate-6 transition-transform", children: /* @__PURE__ */ jsx(Lock, { size: 32, className: "text-white" }) }),
          /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2", children: [
            "Coming Soon ",
            /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono uppercase border border-amber-500/30", children: "V1.1" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-neutral-300 mb-8 leading-relaxed", children: "This advanced module is part of our upcoming Gold Release expansion. We are currently finalizing the security and performance audits." }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => setShowComingSoon(false), children: "Acknowledge" }) })
        ] })
      ] }) })
    ] });
  }
  return children;
}
function FeatureLockBadge(props) {
  return /* @__PURE__ */ jsx(LockedFeature, { mode: "badge", ...props });
}
const REPORT_PLAN_FEATURES = {
  // ── Starter (10 keys, 19 reports) ──────────────────────────────────
  "store.reports.sales": "report_sales_records",
  "store.v3.reports.sales": "report_sales_records",
  "store.reports.sale-orders": "report_sales_records",
  "store.reports.sale-order-items": "report_sales_records",
  "store.reports.daily-sales": "report_sales_records",
  "store.reports.purchases": "report_purchase_records",
  "store.v3.reports.purchases": "report_purchase_records",
  "store.reports.purchase-returns": "report_purchase_records",
  "store.reports.low-stock": "report_stock_records",
  "store.reports.movement-history": "report_stock_records",
  "store.v3.reports.inventory-movement": "report_stock_records",
  "store.reports.stock-summary-by-category": "report_stock_records",
  "store.reports.item-detail": "report_stock_records",
  "store.reports.expiry": "report_stock_records",
  "store.reports.stock-valuation": "report_stock_valuation",
  "store.reports.inventory-valuation": "report_stock_valuation",
  "store.v3.reports.inventory-valuation": "report_stock_valuation",
  "store.reports.profit-loss": "report_profit_loss",
  "store.v3.reports.profit-loss": "report_profit_loss",
  "store.reports.gross-profit": "report_profit_loss",
  "store.v3.reports.gross-profit": "report_profit_loss",
  "store.reports.cogs": "report_profit_loss",
  "store.v3.reports.cogs": "report_profit_loss",
  "store.reports.refund-reasons": "report_profit_loss",
  "store.reports.cash-flow": "report_cash_flow",
  "store.v3.reports.cash-flow": "report_cash_flow",
  "store.reports.bank-statement": "report_cash_flow",
  "store.reports.expenses": "report_expenses",
  "store.reports.tax": "report_tax",
  "store.v3.reports.tax": "report_tax",
  "store.reports.tax-rate": "report_tax",
  "store.reports.day-book": "report_day_book",
  "store.reports.all-parties": "report_party_records",
  "store.reports.party-statement": "report_party_records",
  "store.v3.reports.party-ledger": "report_party_records",
  // ── Core (8 keys, 12 reports) ──────────────────────────────────────
  "store.reports.analytics": "report_sales_analytics",
  "store.reports.item-wise-profit": "report_profitability",
  "store.reports.item-category-wise-profit-loss": "report_profitability",
  "store.reports.bill-wise-profit": "report_profitability",
  "store.reports.party-wise-profit-loss": "report_profitability",
  "store.reports.discount": "report_discounts",
  "store.reports.discount-report": "report_discounts",
  "store.reports.item-wise-discount": "report_discounts",
  "store.reports.sale-aging": "report_aging",
  "store.v3.reports.aged-receivables": "report_aging",
  "store.v3.reports.aged-payables": "report_aging",
  "store.reports.stock-aging": "report_aging",
  "store.reports.balance-sheet": "report_balance_sheet",
  "store.v3.reports.balance-sheet": "report_balance_sheet",
  "store.reports.expense-by-category": "report_expense_analysis",
  "store.reports.expense-by-item": "report_expense_analysis",
  "store.reports.customer-insights": "report_party_insights",
  "store.reports.customer-insights.details": "report_party_insights",
  "store.reports.supplier-insights": "report_party_insights",
  "store.reports.supplier-insights.details": "report_party_insights",
  "store.reports.owner-daily-pulse": "owners_daily_pulse",
  "store.reports.owner-daily-pulse.verify": "owners_daily_pulse",
  "store.reports.owner-daily-pulse.setup": "owners_daily_pulse",
  "store.reports.owner-daily-pulse.lock": "owners_daily_pulse",
  "store.reports.owner-daily-pulse.note": "owners_daily_pulse",
  // ── Scale (5 keys, 9 reports) ──────────────────────────────────────
  "store.reports.trial-balance": "report_ledger",
  "store.v3.reports.trial-balance": "report_ledger",
  "store.reports.account-ledger": "report_ledger",
  "store.reports.transactions": "report_ledger",
  "store.reports.point-in-time-inventory": "report_point_in_time",
  "store.reports.point-in-time-inventory.details": "report_point_in_time",
  "store.reports.sale-purchase-by-party": "report_cross_party",
  "store.reports.sale-purchase-by-party-group": "report_cross_party",
  "store.reports.sale-purchase-by-item-category": "report_cross_party",
  "store.reports.item-report-by-party": "report_cross_party",
  "store.reports.party-report-by-item": "report_cross_party",
  "store.reports.loan-statement": "report_loans",
  "store.reports.export": "report_export",
  "store.v3.reports.export": "report_export"
};
const REPORT_FEATURE_TIERS = {
  "report_sales_records": "Starter",
  "report_purchase_records": "Starter",
  "report_stock_records": "Starter",
  "report_stock_valuation": "Starter",
  "report_profit_loss": "Starter",
  "report_cash_flow": "Starter",
  "report_expenses": "Starter",
  "report_tax": "Starter",
  "report_day_book": "Starter",
  "report_party_records": "Starter",
  "report_sales_analytics": "Core",
  "report_profitability": "Core",
  "report_discounts": "Core",
  "report_aging": "Core",
  "report_balance_sheet": "Core",
  "report_expense_analysis": "Core",
  "report_party_insights": "Core",
  "owners_daily_pulse": "Core",
  "report_ledger": "Scale",
  "report_point_in_time": "Scale",
  "report_cross_party": "Scale",
  "report_loans": "Scale",
  "report_export": "Scale"
};
const REPORT_DECISION_MESSAGES = {
  "report_sales_records": "Access detailed sales order and item breakdown — Starter",
  "report_purchase_records": "Track vendor purchases and returns history — Starter",
  "report_stock_records": "Manage batch tracking, movement and expiry alerts — Starter",
  "report_stock_valuation": "Calculate inventory value at cost and retail — Starter",
  "report_profit_loss": "View detailed statement of profit and loss — Starter",
  "report_cash_flow": "Review operating cash flows and bank statements — Starter",
  "report_expenses": "Review comprehensive operational expenses — Starter",
  "report_tax": "File accurate tax returns with rate breakdowns — Starter",
  "report_day_book": "Inspect daily financial activity and chronologies — Starter",
  "report_party_records": "Review customer and supplier statements — Starter",
  "report_sales_analytics": "Analyze sales velocity, channels and trends — Core",
  "report_profitability": "See which products are losing you money — Core",
  "report_discounts": "Audit discounts and promotional margins — Core",
  "report_aging": "Track overdue receivables and aging inventory — Core",
  "report_balance_sheet": "Examine assets, liabilities and equity health — Core",
  "report_expense_analysis": "Break down expenses by category and item — Core",
  "report_party_insights": "Identify top customers, dormant accounts and buying trends — Core",
  "owners_daily_pulse": "Daily executive briefing and margin alerts — Core",
  "report_ledger": "Double-entry trial balance and chart of accounts — Scale",
  "report_point_in_time": "Reconstruct inventory levels at any date in the past — Scale",
  "report_cross_party": "Multi-dimensional party and item matrix analysis — Scale",
  "report_loans": "Audit debt schedules, principal and interest statements — Scale",
  "report_export": "Export financial data to CSV, Excel and BI tools — Scale"
};
function isReportLocked(routeName, planFeatures) {
  if (!routeName || !planFeatures || typeof planFeatures !== "object") {
    return false;
  }
  const requiredFeature = REPORT_PLAN_FEATURES[routeName];
  if (!requiredFeature) {
    return false;
  }
  return planFeatures[requiredFeature] === false;
}
function getReportTier(routeName) {
  const requiredFeature = REPORT_PLAN_FEATURES[routeName];
  if (!requiredFeature) return null;
  return REPORT_FEATURE_TIERS[requiredFeature] || "Starter";
}
function getReportDecisionMessage(routeName) {
  const requiredFeature = REPORT_PLAN_FEATURES[routeName];
  if (!requiredFeature) return "Upgrade your plan to unlock full report";
  return REPORT_DECISION_MESSAGES[requiredFeature] || "Upgrade your plan to unlock full report";
}
function SidebarItem({
  icon: Icon,
  label,
  name,
  // In OneGlanceLayout we use 'name' instead of 'label'
  isActive,
  isExpanded,
  isMenuExpanded,
  onClick,
  onToggle,
  subItems = [],
  routeName,
  route: targetRoute,
  // Renamed to avoid shadowing Ziggy's route()
  routeParams,
  onHoverExpand,
  menuKey,
  id,
  isPlatformHQ = false
  // New prop for premium HQ styling
}) {
  const displayName = name || label;
  const { store, planFeatures = {} } = usePage().props;
  const navLabel = useNavLabel();
  const finalRoute = targetRoute || routeName;
  const hoverTimerRef = useRef(null);
  const rowRef = useRef(null);
  const [tipAt, setTipAt] = useState(null);
  const handleMouseEnter = useCallback(() => {
    if (!isExpanded && rowRef.current) {
      const r = rowRef.current.getBoundingClientRect();
      setTipAt({ top: r.top + r.height / 2, left: r.right + 8 });
    }
    if (!isExpanded && subItems.length > 0 && onHoverExpand) {
      hoverTimerRef.current = setTimeout(() => {
        onHoverExpand(menuKey);
      }, 1e3);
    }
  }, [isExpanded, subItems.length, onHoverExpand, menuKey]);
  const handleMouseLeave = useCallback(() => {
    setTipAt(null);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      id,
      className: "flex flex-col w-full mb-2",
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: rowRef,
            className: `
          flex items-center justify-between p-0 rounded-md transition-colors duration-fast group relative
          ${isActive ? "bg-accent-quiet text-accent-text" : "text-ink-muted hover:bg-interactive-hover"}
`,
            children: [
              isActive && /* @__PURE__ */ jsx(
                "span",
                {
                  "aria-hidden": "true",
                  className: "absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-accent pointer-events-none"
                }
              ),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: finalRoute && window.route().has(finalRoute) ? window.route(finalRoute, routeParams || {}) : "#",
                  onClick: (e) => {
                    if (!finalRoute) {
                      e.preventDefault();
                      if (onClick) onClick();
                    }
                  },
                  className: `flex-1 flex items-center relative z-10 outline-none ${isExpanded ? "gap-3 p-3 justify-start" : "p-3 justify-center"}`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
                      Icon,
                      {
                        size: isPlatformHQ ? 22 : 20,
                        className: `transition-colors duration-fast ${isActive ? "text-accent-text" : "group-hover:text-accent-text"}`
                      }
                    ) }),
                    isExpanded && /* @__PURE__ */ jsx("span", { className: `text-sm whitespace-nowrap overflow-hidden transition-colors duration-fast ${isActive ? "font-semibold text-accent-text" : "font-medium text-ink-muted group-hover:text-ink-secondary"}`, children: displayName })
                  ]
                }
              ),
              isExpanded && subItems.length > 0 && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onToggle) onToggle();
                  },
                  className: "p-3 relative z-raised hover:bg-interactive-active transition-colors duration-fast rounded-r-md",
                  children: /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: `transition-transform duration-fast ${isMenuExpanded ? "rotate-90" : ""} ${isActive ? "text-accent-text" : "text-ink-muted group-hover:text-ink-secondary"}` })
                }
              ),
              !isExpanded && tipAt && createPortal(
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    role: "tooltip",
                    className: "fixed z-tooltip px-3 py-2 bg-overlay text-ink text-sm font-medium rounded-sm shadow-lg border border-line whitespace-nowrap pointer-events-none",
                    style: { top: tipAt.top, left: tipAt.left, transform: "translateY(-50%)" },
                    children: [
                      displayName,
                      subItems.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted ml-2", children: "Hold to expand" })
                    ]
                  }
                ),
                document.body
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: `
        overflow-hidden transition-all duration-slow flex flex-col gap-1 ml-4 border-l-2 border-line
        ${isMenuExpanded && isExpanded && subItems.length > 0 ? "max-h-[800px] mt-2 opacity-100" : "max-h-0 opacity-0"}
`, children: subItems.map((item, idx) => {
          const getRoute = (itemName2) => {
            const routeMap = {
              "Products": "store.inventory.index",
              "Categories": "store.categories.index",
              "Stock Operations": "store.stock-operations",
              "Suppliers": "store.suppliers.index",
              "Purchase Orders": "store.purchase-orders.index",
              "Labels": "store.labels.index",
              "Reports": "store.reports.index",
              "Import/Export": "store.admin.data",
              "Attributes": "store.attributes.index",
              "Quick Access": "store.home",
              "Home": "store.home",
              "Dashboard": "store.dashboard",
              "Main Dashboard": "store.dashboard",
              "Executive Dashboard": "store.admin.dashboard",
              "User Management": "store.admin.users",
              "Staff Attendance": "store.admin.attendance",
              "Data Management": "store.admin.data",
              "System Settings": "store.admin.settings",
              "Store Settings": "store.settings",
              "Builder": "store.builder",
              "Subscription": "store.billing",
              "Agent Inbox": "store.admin.chatbot.inbox",
              "Chatbot Settings": "store.admin.chatbot.settings",
              "POS": "store.pos",
              "Analytics": "store.sales.analytics",
              "Orders": "store.sales.index",
              "Invoices": "store.sales.invoice.create",
              "Customers": "store.customers.index",
              "To Receive": "store.finance.receivables",
              "To Pay": "store.finance.payables",
              "Bank Accounts": "store.bank-accounts.index",
              "Chart of Accounts": "store.accounting.index",
              "P&L": "store.accounting.pnl",
              "Balance Sheet": "store.accounting.balance-sheet",
              // Phase 2 routes
              "Parties": "store.parties.index",
              "Purchases": "store.purchases.index",
              "Payments": "store.payments.index",
              "Expenses": "store.expenses.index",
              "All Transactions": "store.transactions.index",
              // Phase 3 routes
              "Stock Levels": "store.inventory.stock",
              "Sales Orders": "store.sales.orders.index",
              "Production": "store.production.index",
              "Parked Sales": "store.parked-sales.index",
              // Phase 4 Reports
              "Sales Report": "store.reports.sales",
              "Purchase Report": "store.reports.purchases",
              "Day Book": "store.reports.day-book",
              "Profit & Loss": "store.reports.profit-loss",
              "Party Statement": "store.reports.party-statement",
              "Cookbook": "store.cookbook.index",
              // ALL 40 Reports
              "Stock Valuation": "store.reports.stock-valuation",
              "Low Stock": "store.reports.low-stock",
              "Movement History": "store.reports.movement-history",
              "Expiry Report": "store.reports.expiry",
              "Stock Summary by Category": "store.reports.stock-summary-by-category",
              "Item Detail": "store.reports.item-detail",
              "Item Report by Party": "store.reports.item-report-by-party",
              "Party Report by Item": "store.reports.item-report-by-item",
              "Sale/Purchase by Item Category": "store.reports.sale-purchase-by-item-category",
              "Bank Statement": "store.reports.bank-statement",
              "Expense Report": "store.reports.expenses",
              "Tax Report": "store.reports.tax",
              "Tax Rate Report": "store.reports.tax-rate",
              "Trial Balance": "store.reports.trial-balance",
              "Cash Flow": "store.reports.cash-flow",
              "Discount Report": "store.reports.discount",
              "Loan Statement": "store.reports.loan-statement",
              "Item Wise Profit": "store.reports.item-wise-profit",
              "Party Wise Profit Loss": "store.reports.party-wise-profit-loss",
              "Bill Wise Profit": "store.reports.bill-wise-profit",
              "Item Category Wise Profit Loss": "store.reports.item-category-wise-profit-loss",
              "Item Wise Discount": "store.reports.item-wise-discount",
              "Sale Purchase by Party": "store.reports.sale-purchase-by-party",
              "Sale Purchase by Party Group": "store.reports.sale-purchase-by-party-group",
              "Stock Aging": "store.reports.stock-aging",
              "Sale Orders Report": "store.reports.sale-orders",
              "Sale Order Items": "store.reports.sale-order-items",
              "Sale Aging": "store.reports.sale-aging",
              "All Parties": "store.reports.all-parties",
              "Expense by Category": "store.reports.expense-by-category",
              "Expense by Item": "store.reports.expense-by-item",
              "Staff Summaries": "store.admin.staff",
              // New Features
              "Service Jobs": "store.service-jobs.index",
              "Dispatch Calendar": "store.service-jobs.calendar",
              "Tools & Equipment": "store.tools.index",
              "Services": "store.service-jobs.index",
              "Proposals": "store.proposals.index",
              "Returns History": "store.returns-history.index",
              "Recurring Invoices": "store.recurring-invoices.index",
              "Invoice Reminders": "store.invoice-reminders.index",
              "Stock Transfers": "store.stock-transfers.index",
              "Stock Audit": "store.stock-takes.index",
              "Batch Tracking": "store.batches.index",
              "Serial Tracking": "store.serials.index",
              "Debit Notes": "store.debit-notes.index",
              "Purchase Returns": "store.debit-notes.index",
              "Campaigns": "store.marketing-campaigns.index",
              "Online Store": "store.online-store.index",
              "VenSynQ": "vensynq.index",
              "VenSynQ Settings": "vensynq.settings",
              "WooCommerce Sync": "store.woocommerce.index",
              "E-Invoicing (Coming Soon)": "store.e-invoicing.index",
              "Bank Reconciliation": "store.bank-reconciliation.index",
              "Activity Log": "store.activity-log.index",
              "Recycle Bin": "store.recycle-bin.index",
              "Settings": "store.settings",
              "Quotations / Pre-Sales": "store.pre-sales.index",
              "Pre-Purchases": "store.purchase-orders.index",
              "Fund Management": "store.funds.index"
            };
            return routeMap[itemName2];
          };
          if (typeof item === "object" && item.group) {
            return /* @__PURE__ */ jsxs("div", { className: "mt-2 mb-1", children: [
              /* @__PURE__ */ jsx("p", { className: "px-4 text-2xs uppercase font-medium text-ink-muted tracking-wider mb-1", children: item.group }),
              item.items.filter(Boolean).map((subItem, sIdx) => {
                const { label: itemName2 } = typeof subItem === "object" ? { label: subItem.label, locked: subItem.locked } : { label: subItem };
                const baseRoute2 = typeof subItem === "object" && subItem.route ? subItem.route : getRoute(itemName2);
                if (!baseRoute2) {
                  return /* @__PURE__ */ jsx("span", { className: "block pl-4 py-1.5 text-xs text-ink-muted cursor-not-allowed", children: navLabel(itemName2) }, sIdx);
                }
                const activeRouteName = routeParams?.store_slug && !baseRoute2.startsWith("store.") ? `store.${baseRoute2}` : baseRoute2;
                const isComingSoon = itemName2.includes("Coming Soon");
                const isPlanLocked2 = isReportLocked(activeRouteName, planFeatures);
                return /* @__PURE__ */ jsx(FeatureLockBadge, { isLocked: isPlanLocked2, feature: itemName2.toLowerCase().replace(" ", "_").replace("/", "_"), showBadge: false, children: isComingSoon ? /* @__PURE__ */ jsx("span", { className: "block pl-4 py-1.5 text-xs font-medium text-ink-muted dark:text-ink-secondary cursor-pointer", children: navLabel(itemName2) }) : isPlanLocked2 ? /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: window.route && store?.slug ? window.route("store.billing", { store_slug: store.slug }) : "/billing",
                    className: "flex items-center justify-between pl-4 pr-3 py-1.5 text-xs font-medium transition-colors text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400 group/lock",
                    title: "Upgrade to unlock this report",
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "flex items-center gap-1.5 truncate", children: navLabel(itemName2) }),
                      /* @__PURE__ */ jsx(Lock, { size: 12, className: "shrink-0 text-amber-500/80 group-hover/lock:text-amber-500" })
                    ]
                  }
                ) : window.route().has(activeRouteName) && /* @__PURE__ */ jsx(
                  Link,
                  {
                    id: itemName2 === "Products" ? "tour-sidebar-products" : itemName2 === "Purchases" ? "tour-sidebar-purchases" : void 0,
                    href: window.route(activeRouteName, routeParams || {}),
                    className: "block pl-4 py-1.5 text-xs font-medium transition-colors text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400",
                    children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                      (itemName2 === "Agent Inbox" || itemName2 === "Chatbot Settings") && /* @__PURE__ */ jsx(VenaLogo, { size: 13, className: "shrink-0" }),
                      navLabel(itemName2)
                    ] })
                  }
                ) }, sIdx);
              })
            ] }, idx);
          }
          const { label: itemName } = typeof item === "object" && !item.group ? { label: item.label } : { label: item };
          const baseRoute = typeof item === "object" && item.route ? item.route : getRoute(itemName);
          if (!baseRoute) {
            return /* @__PURE__ */ jsx(
              "span",
              {
                className: "block pl-4 py-2 text-xs font-medium text-ink-muted dark:text-ink-secondary cursor-not-allowed relative",
                children: navLabel(itemName)
              },
              idx
            );
          }
          const routeName2 = routeParams?.store_slug && !baseRoute.startsWith("store.") ? `store.${baseRoute}` : baseRoute;
          const isPlanLocked = isReportLocked(routeName2, planFeatures);
          return /* @__PURE__ */ jsx(FeatureLockBadge, { isLocked: isPlanLocked, feature: itemName.toLowerCase().replace(" ", "_").replace("/", "_"), showBadge: false, children: isPlanLocked ? /* @__PURE__ */ jsxs(
            Link,
            {
              href: window.route && store?.slug ? window.route("store.billing", { store_slug: store.slug }) : "/billing",
              className: "flex items-center justify-between pl-4 pr-3 py-2 text-xs font-medium transition-colors relative text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400 group/lock",
              title: "Upgrade to unlock this report",
              children: [
                /* @__PURE__ */ jsx("span", { className: "flex items-center gap-1.5 truncate", children: navLabel(itemName) }),
                /* @__PURE__ */ jsx(Lock, { size: 12, className: "shrink-0 text-amber-500/80 group-hover/lock:text-amber-500" })
              ]
            }
          ) : window.route().has(routeName2) && /* @__PURE__ */ jsx(
            Link,
            {
              href: window.route(routeName2, routeParams || {}),
              className: "block pl-4 py-2 text-xs font-medium transition-colors relative text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400",
              children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                (itemName === "Agent Inbox" || itemName === "Chatbot Settings") && /* @__PURE__ */ jsx(VenaLogo, { size: 13, className: "shrink-0" }),
                navLabel(itemName)
              ] })
            }
          ) }, idx);
        }) })
      ]
    }
  );
}
const CommandPalette = () => {
  const { auth, store, modules } = usePage().props;
  const tt = useTermText();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const userRole = auth.user?.role;
  const userPerms = auth.user?.permissions || [];
  const COMMAND_MODULES = {
    "pos": ["pos"],
    "inventory": ["inventory", "products"],
    "parties": ["customers", "suppliers", "khata_credit"],
    "reports": ["reports"],
    "new-sale": ["invoicing", "pos"],
    "new-purchase": ["purchases"],
    "new-product": ["products"],
    "new-customer": ["customers"],
    "new-expense": ["expenses"],
    "payment-in": ["payments"],
    "payment-out": ["payments"],
    "report-sales": ["reports"],
    "report-purchases": ["purchases", "reports"],
    "report-pnl": ["accounting_workspace", "reports"],
    "report-stock": ["inventory", "reports"],
    "report-daybook": ["accounting_workspace", "reports"],
    "stock-levels": ["inventory"],
    "categories": ["products"],
    "production": ["production_runs", "manufacturing"]
  };
  const COMMAND_PERMISSIONS = {
    "pos": ["pos"],
    "inventory": ["inventory"],
    "parties": ["customers"],
    "reports": ["reports"],
    "settings": ["settings"],
    "new-sale": ["sales"],
    "new-purchase": ["purchases"],
    "new-product": ["inventory"],
    "new-customer": ["customers"],
    "new-expense": ["finance"],
    "payment-in": ["finance"],
    "payment-out": ["finance"],
    "report-sales": ["reports"],
    "report-purchases": ["reports"],
    "report-pnl": ["reports"],
    "report-stock": ["reports"],
    "report-daybook": ["reports"],
    "stock-levels": ["inventory"],
    "categories": ["inventory"],
    "production": ["inventory"]
  };
  const rawCommands = [
    // Navigation
    { id: "home", name: "Go to Home", keywords: "home dashboard", icon: Home, action: () => router.visit(route("store.home", { store_slug: store?.slug })), category: "Navigation" },
    { id: "pos", name: "Open POS", keywords: "pos sell cashier", icon: ShoppingCart, action: () => router.visit(route("store.pos", { store_slug: store?.slug })), category: "Navigation" },
    { id: "inventory", name: "Inventory Dashboard", keywords: "inventory products stock items", icon: Package, action: () => router.visit(route("store.inventory.dashboard", { store_slug: store?.slug })), category: "Navigation" },
    { id: "parties", name: "Parties / Contacts", keywords: "parties customers suppliers contacts", icon: Users, action: () => router.visit(route("store.parties.index", { store_slug: store?.slug })), category: "Navigation" },
    { id: "reports", name: "Reports", keywords: "reports analytics insights", icon: BarChart2, action: () => router.visit(route("store.reports.index", { store_slug: store?.slug })), category: "Navigation" },
    { id: "settings", name: "Settings", keywords: "settings preferences config", icon: Settings, action: () => router.visit(route("store.settings", { store_slug: store?.slug })), category: "Navigation" },
    // Quick Actions
    { id: "new-sale", name: tt("New Sale Invoice"), keywords: "new sale invoice create", icon: Plus, action: () => router.visit(route("store.new-invoice", { store_slug: store?.slug })), category: "Quick Actions" },
    { id: "new-purchase", name: tt("New Purchase"), keywords: "new purchase buy", icon: Truck, action: () => router.visit(route("store.purchases.create", { store_slug: store?.slug })), category: "Quick Actions" },
    { id: "new-product", name: tt("Add Product"), keywords: "new product item add create", icon: Package, action: () => router.visit(route("store.inventory.dashboard", { store_slug: store?.slug }) + "?action=add"), category: "Quick Actions" },
    { id: "new-customer", name: tt("Add Customer"), keywords: "new customer party add create", icon: Users, action: () => router.visit(route("store.parties.index", { store_slug: store?.slug }) + "?action=add&type=customer"), category: "Quick Actions" },
    { id: "new-expense", name: tt("Add Expense"), keywords: "new expense add create", icon: CreditCard, action: () => router.visit(route("store.expenses.index", { store_slug: store?.slug }) + "?action=add"), category: "Quick Actions" },
    { id: "payment-in", name: tt("Record Payment In"), keywords: "payment receive in money", icon: DollarSign, action: () => router.visit(route("store.payments.in", { store_slug: store?.slug })), category: "Quick Actions" },
    { id: "payment-out", name: tt("Record Payment Out"), keywords: "payment out pay money", icon: DollarSign, action: () => router.visit(route("store.payments.out", { store_slug: store?.slug })), category: "Quick Actions" },
    // Reports
    { id: "report-sales", name: "Sales Report", keywords: "report sales revenue", icon: FileText, action: () => router.visit(route("store.reports.sales", { store_slug: store?.slug })), category: "Reports" },
    { id: "report-purchases", name: "Purchases Report", keywords: "report purchases buying", icon: FileText, action: () => router.visit(route("store.reports.purchases", { store_slug: store?.slug })), category: "Reports" },
    { id: "report-pnl", name: "Profit & Loss", keywords: "report profit loss pnl", icon: Calculator, action: () => router.visit(route("store.reports.profit-loss", { store_slug: store?.slug })), category: "Reports" },
    { id: "report-stock", name: "Stock Valuation", keywords: "report stock valuation inventory", icon: Tag, action: () => router.visit(route("store.reports.inventory-valuation", { store_slug: store?.slug })), category: "Reports" },
    { id: "report-daybook", name: "Day Book", keywords: "report daybook daily", icon: FileText, action: () => router.visit(route("store.reports.trial-balance", { store_slug: store?.slug })), category: "Reports" },
    // Inventory
    { id: "stock-levels", name: "Stock Levels", keywords: "stock levels quantity low", icon: Package, action: () => router.visit(route("store.inventory.dashboard", { store_slug: store?.slug })), category: "Inventory" },
    { id: "categories", name: "Categories", keywords: "categories organize", icon: Tag, action: () => router.visit(route("store.inventory.dashboard", { store_slug: store?.slug })), category: "Inventory" },
    { id: "production", name: "Production / Manufacturing", keywords: "production manufacturing make", icon: Settings, action: () => router.visit(route("store.production.index", { store_slug: store?.slug })), category: "Inventory" }
  ];
  const commands = rawCommands.filter((cmd) => {
    if (Array.isArray(modules)) {
      const requiredModules = COMMAND_MODULES[cmd.id];
      if (requiredModules && requiredModules.length > 0) {
        if (!requiredModules.some((m) => modules.includes(m))) {
          return false;
        }
      }
    }
    if (userRole === "platform_admin") return true;
    const required = COMMAND_PERMISSIONS[cmd.id];
    if (!required || required.length === 0) return true;
    return required.some((p) => userPerms.includes(p));
  });
  const filteredCommands = query.trim() === "" ? commands : commands.filter(
    (cmd) => cmd.name.toLowerCase().includes(query.toLowerCase()) || cmd.keywords.toLowerCase().includes(query.toLowerCase())
  );
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});
  const flatCommands = filteredCommands;
  useEffect(() => {
    const handleKeyDown2 = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown2);
    return () => window.removeEventListener("keydown", handleKeyDown2);
  }, [isOpen]);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);
  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && flatCommands[selectedIndex]) {
      e.preventDefault();
      executeCommand(flatCommands[selectedIndex]);
    }
  }, [flatCommands, selectedIndex]);
  const executeCommand = (cmd) => {
    setIsOpen(false);
    cmd.action();
  };
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-modal animate-in fade-in duration-normal",
        onClick: () => setIsOpen(false)
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-modal animate-in fade-in zoom-in-95 duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-5 py-4 border-b border-line", children: [
        /* @__PURE__ */ jsx(Search, { size: 20, className: "text-ink-muted" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            type: "text",
            value: query,
            onChange: (e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            },
            onKeyDown: handleKeyDown,
            placeholder: "Type a command or search...",
            className: "flex-1 bg-transparent border-none outline-none text-ink text-lg placeholder-slate-400"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-ink-muted", children: [
          /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-sunken rounded font-mono", children: "esc" }),
          /* @__PURE__ */ jsx("span", { children: "to close" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: listRef, className: "max-h-[400px] overflow-y-auto p-2", children: Object.keys(groupedCommands).length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-8 text-center text-ink-muted", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No commands found" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Try a different search term" })
      ] }) : Object.entries(groupedCommands).map(([category, cmds]) => /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
        /* @__PURE__ */ jsx("p", { className: "px-3 py-1.5 text-xs font-bold uppercase text-ink-muted tracking-wider", children: category }),
        cmds.map((cmd, idx) => {
          const globalIdx = flatCommands.findIndex((c) => c.id === cmd.id);
          const isSelected = globalIdx === selectedIndex;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              "data-index": globalIdx,
              onClick: () => executeCommand(cmd),
              onMouseEnter: () => setSelectedIndex(globalIdx),
              className: `
                                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                                                    ${isSelected ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" : "text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover"}
`,
              children: [
                /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${isSelected ? "bg-brand-100 dark:bg-brand-800/50" : "bg-sunken"}`, children: /* @__PURE__ */ jsx(cmd.icon, { size: 16 }) }),
                /* @__PURE__ */ jsx("span", { className: "flex-1 font-medium", children: cmd.name }),
                isSelected && /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "text-brand-500" })
              ]
            },
            cmd.id
          );
        })
      ] }, category)) }),
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-t border-line flex items-center justify-between text-xs text-ink-muted", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-sunken rounded font-mono", children: "↑" }),
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-sunken rounded font-mono", children: "↓" }),
            /* @__PURE__ */ jsx("span", { children: "to navigate" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-sunken rounded font-mono", children: "↵" }),
            /* @__PURE__ */ jsx("span", { children: "to select" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Command, { size: 12 }),
          /* @__PURE__ */ jsx("span", { children: "Command Palette" })
        ] })
      ] })
    ] }) })
  ] });
};
const OnboardingDriver = () => {
  const { flash, auth } = usePage().props;
  useEffect(() => {
    if (!auth?.user) return;
    const isSetupSuccess = flash?.success === "Setup completed successfully!";
    const onboardingCompleted = localStorage.getItem("amd_onboarding_driver_complete");
    if (!isSetupSuccess && onboardingCompleted) return;
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: "Finish Tour",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      overlayColor: "rgba(0, 0, 0, 0.75)",
      steps: [
        {
          popover: {
            title: "Welcome to VenQore!",
            description: "Let us take a quick 1-minute tour of your new high-performance ERP dashboard. Ready to see how it works?"
          }
        },
        {
          element: "#tour-omnisearch",
          popover: {
            title: "Universal AI Search",
            description: "Your command center. Search products, customers, invoices, or ask our AI a question. Press <b>Ctrl + K</b> anywhere to open it instantly.",
            position: "bottom"
          }
        },
        {
          element: "#sidebar-dashboard",
          popover: {
            title: "Your Command Center",
            description: "View real-time performance graphs, outstanding balances, and low-stock alerts right here.",
            position: "right"
          }
        },
        {
          element: "#sidebar-sell",
          popover: {
            title: "Selling Power",
            description: "Manage Quotations, Orders, Proposals, and Invoices. Everything relates back to your accounting ledger automatically.",
            position: "right"
          }
        },
        {
          element: "#sidebar-stock",
          popover: {
            title: "Inventory Control",
            description: "Track products, manage categories, and handle stock transfers. Our V3 engine ensures batch-level accuracy.",
            position: "right"
          }
        },
        {
          element: "#tour-growth-engine",
          popover: {
            title: "AI Growth Engine",
            description: "Our proprietary brain detects opportunities—like which customer is due for a refill—and drafts WhatsApp reminders for you.",
            position: "bottom"
          }
        },
        {
          element: "#tour-performance",
          popover: {
            title: "Performance Tracking",
            description: "Instantly view today’s Sales vs Gross Profit. Switch between day, month, and year views with one click.",
            position: "bottom"
          }
        },
        {
          element: "#tour-net-profit",
          popover: {
            title: "Net Profit & Health",
            description: "The ultimate bottom line. See exactly how much money is staying in your pocket after all expenses.",
            position: "bottom"
          }
        },
        {
          element: "#tour-sales-chart",
          popover: {
            title: "Visualize Growth",
            description: "Real-time sales visualizations. Hover over any point to see specific transaction details.",
            position: "top"
          }
        },
        {
          element: "#tour-low-stock",
          popover: {
            title: "Never Run Out",
            description: 'Products reaching their alert limit appear here instantly. Tap "Order" to draft a new Purchase Order.',
            position: "left"
          }
        },
        {
          element: "#tour-right-panel",
          popover: {
            title: "Asset Overview",
            description: "Monitor Cash-in-Hand, Bank Balances, and Total Inventory Valuation at all times.",
            position: "left"
          }
        },
        {
          popover: {
            title: "You’re All Set!",
            description: "Explore the settings to customize your experience. Welcome to the future of your business!"
          }
        }
      ],
      onDestroyed: () => {
        localStorage.setItem("amd_onboarding_driver_complete", "true");
      }
    });
    const style = document.createElement("style");
    style.innerHTML = `
            .driver-popover {
                border-radius: 20px !important;
                padding: 24px !important;
                background-color: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
            }
            .dark .driver-popover {
                background-color: rgb(var(--vq-slate-900)) !important;
                border-color: rgb(var(--vq-slate-800)) !important;
                color: rgb(var(--vq-slate-50)) !important;
            }
            .driver-popover-title {
                font-size: 18px !important;
                font-weight: 800 !important;
                color: rgb(var(--vq-slate-800)) !important;
                margin-bottom: 8px !important;
            }
            .dark .driver-popover-title {
                color: #ffffff !important;
            }
            .driver-popover-description {
                font-size: 14px !important;
                color: rgb(var(--vq-slate-500)) !important;
                line-height: 1.6 !important;
            }
            .dark .driver-popover-description {
                color: rgb(var(--vq-slate-400)) !important;
            }
            .driver-popover-btn {
                border-radius: 10px !important;
                font-weight: 700 !important;
                text-shadow: none !important;
                padding: 8px 16px !important;
                transition: all 0.2s !important;
            }
            .driver-popover-next-btn {
                background-color: rgb(var(--vq-indigo-600)) !important;
                color: white !important;
            }
            .driver-popover-prev-btn {
                background-color: rgb(var(--vq-slate-100)) !important;
                color: rgb(var(--vq-slate-500)) !important;
            }
            .dark .driver-popover-prev-btn {
                background-color: rgb(var(--vq-slate-800)) !important;
                color: rgb(var(--vq-slate-400)) !important;
            }
            .driver-popover-progress-text {
                font-weight: 600 !important;
                color: rgb(var(--vq-slate-400)) !important;
            }
        `;
    document.head.appendChild(style);
    const timer = setTimeout(() => {
      if (window.location.pathname.includes("/dashboard")) {
        driverObj.drive();
      }
    }, 2e3);
    return () => {
      clearTimeout(timer);
      document.head.removeChild(style);
    };
  }, [flash?.success, auth?.user?.id]);
  return null;
};
function DemoBanner() {
  const { props } = usePage();
  const { is_demo, demo_reset_at, store, auth } = props;
  const isDemoStore = is_demo || store?.is_demo || store?.slug === "demo";
  const [timeLeft, setTimeLeft] = useState("");
  const currentRole = auth?.user?.demo_role || auth?.user?.role || "cashier";
  useEffect(() => {
    if (!demo_reset_at) return;
    const tick = () => {
      const now = /* @__PURE__ */ new Date();
      const reset = new Date(demo_reset_at);
      const diff = reset - now;
      if (diff <= 0) {
        setTimeLeft("Resetting soon...");
        return;
      }
      const h = Math.floor(diff / 36e5);
      const m = Math.floor(diff % 36e5 / 6e4);
      setTimeLeft(`${h}h ${m}m`);
    };
    tick();
    const interval = setInterval(tick, 6e4);
    return () => clearInterval(interval);
  }, [demo_reset_at]);
  if (!isDemoStore) return null;
  const handleRoleSwitch = (role) => {
    window.location.href = route("demo.login", { role });
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full bg-gradient-to-r from-neutral-900 via-brand-950 to-neutral-900 text-white text-xs py-2 px-4 border-b border-brand-500/30 shadow-md relative z-drawer flex flex-col md:flex-row items-center justify-between gap-2.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 flex-wrap", children: [
      /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/20 border border-brand-400/40 text-brand-300 font-bold tracking-wide uppercase text-2xs", children: [
        /* @__PURE__ */ jsx(Sparkles, { size: 12, className: "text-brand-400 animate-pulse" }),
        "LIVE DEMO STORE"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-neutral-200 font-medium leading-tight", children: [
        "You are exploring ",
        /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "VenQore" }),
        " with 5 years of live pre-loaded store data."
      ] }),
      timeLeft && /* @__PURE__ */ jsxs("span", { className: "hidden lg:inline-flex items-center gap-1 text-2xs font-semibold text-ink-muted bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700", children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 10, className: "animate-spin" }),
        "Resets in ",
        timeLeft
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex items-center bg-neutral-800/80 border border-neutral-700/80 rounded-lg p-0.5 text-1xs", children: [
        /* @__PURE__ */ jsxs("span", { className: "px-2 text-ink-muted font-semibold text-2xs uppercase tracking-wider flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(UserCheck, { size: 11, className: "text-brand-400" }),
          "Role:"
        ] }),
        ["owner", "manager", "cashier", "accountant"].map((role) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleRoleSwitch(role),
            disabled: currentRole === role,
            className: `px-2 py-0.5 rounded text-2xs font-bold capitalize transition-all ${currentRole === role ? "bg-brand-600 text-white shadow" : "text-ink-faint hover:text-white hover:bg-interactive-hover"}`,
            children: role
          },
          role
        ))
      ] }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/register",
          className: "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-brand text-white font-bold text-1xs shadow-md active:scale-[0.98] transition-all",
          children: [
            /* @__PURE__ */ jsx("span", { children: "Start Free Trial & Full Guided Tour" }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
          ]
        }
      )
    ] })
  ] });
}
function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      if (localStorage.getItem("pwa_prompt_dismissed") === "true") return;
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(false);
    }
  }, []);
  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  if (!showPrompt) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed bottom-4 right-4 z-command animate-in slide-in-from-bottom duration-slower", children: /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900 text-white p-4 rounded-2xl shadow-2xl border border-neutral-700 max-w-sm flex flex-col gap-4 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Download, { size: 20, className: "text-white" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm", children: "Install App" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Add to Home Screen for faster access" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: dismissPrompt,
          className: "text-ink-muted hover:text-white transition-colors",
          children: /* @__PURE__ */ jsx(X, { size: 16 })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleInstallClick,
        className: "w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 relative z-10",
        children: "Install Now"
      }
    )
  ] }) });
}
function CharityButton({ showLabel = false }) {
  const { store, settings } = usePage().props;
  const [stats, setStats] = useState({
    today: 0,
    default_amount: 10,
    enabled: String(settings?.charity_enabled) === "1" || settings?.charity_enabled === true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const holdTimer = useRef(null);
  const inputRef = useRef(null);
  const editBoxRef = useRef(null);
  useEffect(() => {
    fetchStats();
  }, []);
  useEffect(() => {
    if (!showEdit) return;
    const handleClickOutside = (e) => {
      if (editBoxRef.current && !editBoxRef.current.contains(e.target)) {
        setShowEdit(false);
        setCustomAmount(stats.default_amount?.toString() || "10");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEdit, stats.default_amount]);
  const fetchStats = async () => {
    try {
      const response = await axios.get(route("store.charity.stats", { store_slug: store.slug }));
      setStats(response.data);
      setCustomAmount(response.data.default_amount?.toString() || "10");
    } catch (error) {
    }
  };
  const handleClick = async () => {
    if (showEdit) return;
    setIsLoading(true);
    try {
      const response = await axios.post(route("store.charity.add", { store_slug: store.slug }), {
        amount: parseFloat(customAmount) || stats.default_amount
      });
      if (response.data.success) {
        setStats((prev) => ({ ...prev, today: response.data.today_total }));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2e3);
      }
    } catch (error) {
      console.error("Failed to add charity:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleMouseDown = () => {
    holdTimer.current = setTimeout(() => {
      setShowEdit(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 500);
  };
  const handleMouseUp = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
    }
  };
  const saveCustomAmount = async () => {
    try {
      await axios.post(route("store.charity.update-default", { store_slug: store.slug }), {
        amount: parseFloat(customAmount)
      });
      setStats((prev) => ({ ...prev, default_amount: parseFloat(customAmount) }));
      setShowEdit(false);
    } catch (error) {
      console.error("Failed to update default:", error);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      saveCustomAmount();
    } else if (e.key === "Escape") {
      setShowEdit(false);
      setCustomAmount(stats.default_amount?.toString() || "10");
    }
  };
  if (!stats.enabled) return null;
  const buttonContent = /* @__PURE__ */ jsxs(
    "button",
    {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onClick: handleClick,
      disabled: isLoading || showEdit,
      className: `
                h-11 flex items-center gap-2 px-3 rounded-xl transition-all duration-slow
                ${showSuccess ? "bg-green-500 text-white" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-300 dark:border-amber-700"}
                ${isLoading ? "opacity-50 cursor-wait" : ""}
            `,
      title: "Click to donate | Hold to change amount",
      children: [
        showSuccess ? /* @__PURE__ */ jsx(Check, { size: 18, className: "animate-bounce" }) : /* @__PURE__ */ jsx(HeartHandshake, { size: 18, className: isLoading ? "animate-pulse" : "" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start", children: [
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold uppercase tracking-wide opacity-70", children: "Charity" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold", children: showSuccess ? "Added!" : `${store?.currency_symbol || "Rs"} ${stats.today?.toLocaleString() || 0}` })
        ] })
      ]
    }
  );
  if (showLabel) {
    return /* @__PURE__ */ jsxs("div", { className: "p-1 border-b border-line flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-ink-secondary pl-2", children: "Charity Donations" }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        buttonContent,
        showEdit && /* @__PURE__ */ jsxs("div", { ref: editBoxRef, className: "absolute top-full right-0 mt-2 bg-surface rounded-[14px] shadow-2xl border border-amber-200 dark:border-amber-800/40 p-3 z-50 animate-in fade-in slide-in-from-top-2 min-w-[160px]", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-ink-muted mb-1 block", children: [
            "Amount (",
            store?.currency_symbol || "Rs",
            ")"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: inputRef,
                type: "number",
                value: customAmount,
                onChange: (e) => setCustomAmount(e.target.value),
                onKeyDown: handleKeyDown,
                className: "w-20 px-2 py-1.5 text-sm font-bold bg-app border border-line rounded-lg text-center focus:ring-2 ring-amber-500/20 outline-none",
                min: "1"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: saveCustomAmount,
                className: "p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors",
                children: /* @__PURE__ */ jsx(Check, { size: 14 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowEdit(false);
                  setCustomAmount(stats.default_amount?.toString() || "10");
                },
                className: "p-1.5 bg-sunken text-ink-secondary rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
                children: /* @__PURE__ */ jsx(X, { size: 14 })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-2", children: "Hold button to edit default" })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    buttonContent,
    showEdit && /* @__PURE__ */ jsxs("div", { ref: editBoxRef, className: "absolute top-full left-0 mt-2 bg-surface rounded-[14px] shadow-2xl border border-amber-200 dark:border-amber-800/40 p-3 z-50 animate-in fade-in slide-in-from-top-2 min-w-[160px]", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-ink-muted mb-1 block", children: [
        "Amount (",
        store?.currency_symbol || "Rs",
        ")"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            type: "number",
            value: customAmount,
            onChange: (e) => setCustomAmount(e.target.value),
            onKeyDown: handleKeyDown,
            className: "w-20 px-2 py-1.5 text-sm font-bold bg-app border border-line rounded-lg text-center focus:ring-2 ring-amber-500/20 outline-none",
            min: "1"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: saveCustomAmount,
            className: "p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors",
            children: /* @__PURE__ */ jsx(Check, { size: 14 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setShowEdit(false);
              setCustomAmount(stats.default_amount?.toString() || "10");
            },
            className: "p-1.5 bg-sunken text-ink-secondary rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
            children: /* @__PURE__ */ jsx(X, { size: 14 })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-2", children: "Hold button to edit default" })
    ] })
  ] });
}
function VersionChecker({ checkInterval = 6e4 }) {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [initialVersion, setInitialVersion] = useState(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    checkVersion(true);
    const intervalId = setInterval(() => {
      checkVersion(false);
    }, checkInterval);
    return () => clearInterval(intervalId);
  }, []);
  const checkVersion = async (isInitial = false) => {
    try {
      if (checking) return;
      const response = await axios.get("/api/app-version", { _skipGlobalErrorHandler: true });
      const serverVersion = response.data.version;
      if (isInitial) {
        setInitialVersion(serverVersion);
      } else {
        if (initialVersion && serverVersion !== initialVersion) {
          setNewVersionAvailable(true);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") ;
    } finally {
      setChecking(false);
    }
  };
  const handleReload = () => {
    window.location.reload(true);
  };
  if (!newVersionAvailable) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-command animate-in slide-in-from-bottom-5 fade-in duration-slower", children: /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900 border border-neutral-700/50 shadow-2xl rounded-2xl p-4 pl-5 flex items-center gap-6 max-w-md w-full relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" }),
    /* @__PURE__ */ jsx("div", { className: "absolute -left-10 top-0 w-20 h-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400 animate-pulse", children: /* @__PURE__ */ jsx(Zap, { size: 16, fill: "currentColor" }) }),
        /* @__PURE__ */ jsx("h4", { className: "font-bold text-white text-md", children: "Update Available" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-ink-muted text-xs font-medium", children: [
        "A new version of the application has been released.",
        /* @__PURE__ */ jsx("br", {}),
        "Reload to unlock new features."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: handleReload,
        className: "group bg-emerald-500 hover:bg-emerald-400 text-ink font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95 whitespace-nowrap",
        children: [
          /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "group-hover:rotate-180 transition-transform duration-slower" }),
          "RELOAD"
        ]
      }
    )
  ] }) });
}
function Toast({ toasts = [], removeToast, duration = 4e3 }) {
  return /* @__PURE__ */ jsx("div", { className: "fixed top-4 right-4 z-command flex flex-col gap-2 pointer-events-none", children: toasts.map((toast) => /* @__PURE__ */ jsx(
    ToastItem,
    {
      toast,
      onClose: () => removeToast(toast.id),
      duration
    },
    toast.id
  )) });
}
function ToastItem({ toast, onClose, duration }) {
  const progressRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingRef = useRef(duration);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const typeStyles = {
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      border: "border-emerald-200 dark:border-emerald-700",
      text: "text-emerald-800 dark:text-emerald-200",
      icon: /* @__PURE__ */ jsx(CheckCircle, { size: 18, className: "text-emerald-500" }),
      progress: "bg-emerald-500"
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-700",
      text: "text-red-800 dark:text-red-200",
      icon: /* @__PURE__ */ jsx(AlertCircle, { size: 18, className: "text-red-500" }),
      progress: "bg-red-500"
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-900/30",
      border: "border-amber-200 dark:border-amber-700",
      text: "text-amber-800 dark:text-amber-200",
      icon: /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "text-amber-500" }),
      progress: "bg-amber-500"
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-700",
      text: "text-blue-800 dark:text-blue-200",
      icon: /* @__PURE__ */ jsx(Info, { size: 18, className: "text-blue-500" }),
      progress: "bg-blue-500"
    }
  };
  const style = typeStyles[toast.type] || typeStyles.info;
  useEffect(() => {
    startTimeRef.current = Date.now();
    remainingRef.current = duration;
    const startTimer = () => {
      timerRef.current = setTimeout(() => {
        onCloseRef.current();
      }, remainingRef.current);
    };
    startTimer();
    if (progressRef.current) {
      progressRef.current.style.transition = `width ${remainingRef.current}ms linear`;
      progressRef.current.style.width = "0%";
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration]);
  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    if (progressRef.current) {
      const currentWidth = remainingRef.current / duration * 100;
      progressRef.current.style.transition = "none";
      progressRef.current.style.width = `${currentWidth}%`;
    }
  };
  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onCloseRef.current();
    }, remainingRef.current);
    if (progressRef.current) {
      progressRef.current.style.transition = `width ${remainingRef.current}ms linear`;
      progressRef.current.style.width = "0%";
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `pointer-events-auto min-w-[280px] max-w-sm rounded-xl border shadow-lg overflow-hidden animate-in slide-in-from-right-5 fade-in duration-slow ${style.bg} ${style.border}`,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "shrink-0 mt-0.5", children: style.icon }),
          /* @__PURE__ */ jsx("p", { className: `text-sm font-medium flex-1 ${style.text}`, children: toast.message }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              className: `shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${style.text}`,
              children: /* @__PURE__ */ jsx(X, { size: 14 })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-1 w-full bg-black/5 dark:bg-white/10", children: /* @__PURE__ */ jsx(
          "div",
          {
            ref: progressRef,
            className: `h-full w-full ${style.progress}`
          }
        ) })
      ]
    }
  );
}
function UpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState(null);
  const [message, setMessage] = useState("");
  const [currentPlan, setCurrentPlan] = useState("starter");
  const [upgradeUrl, setUpgradeUrl] = useState("#");
  const [billingUrl, setBillingUrl] = useState("#");
  const [portalUrl, setPortalUrl] = useState("#");
  const [currentCount, setCurrentCount] = useState(null);
  const [limit, setLimit] = useState(null);
  const [upgradeTarget, setUpgradeTarget] = useState("core");
  const { flash, limit_grace_status, store } = usePage().props;
  const tt = useTermText();
  useEffect(() => {
    const handlePlanLimitEvent = (e) => {
      const data = e.detail || {};
      setFeature(data.feature || null);
      setMessage(data.message || "You have reached a limit on your current plan.");
      setCurrentPlan(normalizePlan(data.current_plan || store?.plan || "starter"));
      setUpgradeUrl(data.upgrade_url || (store?.slug ? `/stores/${store.slug}/billing` : "/billing"));
      setBillingUrl(data.billing_url || (store?.slug ? `/stores/${store.slug}/billing` : "/billing"));
      setPortalUrl(data.portal_url || "#");
      setCurrentCount(data.current_count ?? null);
      setLimit(data.limit ?? null);
      setUpgradeTarget(normalizePlan(data.upgrade_target || ""));
      setIsOpen(true);
    };
    window.addEventListener("amd:plan-limit", handlePlanLimitEvent);
    return () => window.removeEventListener("amd:plan-limit", handlePlanLimitEvent);
  }, [store]);
  useEffect(() => {
    if (flash?.plan_limit) {
      const data = flash.plan_limit;
      setFeature(data.feature || null);
      setMessage(data.message || "You have reached a limit on your current plan.");
      setCurrentPlan(normalizePlan(data.current_plan || store?.plan || "starter"));
      setUpgradeUrl(data.upgrade_url || (store?.slug ? `/stores/${store.slug}/billing` : "/billing"));
      setBillingUrl(data.billing_url || (store?.slug ? `/stores/${store.slug}/billing` : "/billing"));
      setPortalUrl(data.portal_url || "#");
      setCurrentCount(data.current_count ?? null);
      setLimit(data.limit ?? null);
      setUpgradeTarget(normalizePlan(data.upgrade_target || ""));
      setIsOpen(true);
    }
  }, [flash, store]);
  const upgradeTo = SELF_SERVE_PLANS.includes(upgradeTarget) && planRank(upgradeTarget) > planRank(currentPlan) ? upgradeTarget : nextPlan(currentPlan) || "custom";
  const isHighestTier = upgradeTo === "custom";
  const isTopTierStyle = upgradeTo === "scale";
  const upgradeLabel = isHighestTier ? "Enterprise Support" : planLabel(upgradeTo);
  const upgradePerks = PLAN_PERKS[upgradeTo] || PLAN_PERKS.core;
  const featureLabels = {
    sku_limit: { icon: "📦", label: tt("Product SKU Limit") },
    staff_limit: { icon: "👤", label: tt("Full Staff Seat Limit") },
    locations: { icon: "🏪", label: "Store Location Limit" },
    location_limit: { icon: "🏪", label: "Store Location Limit" },
    multi_branch: { icon: "🌐", label: "Multi-Branch Operations" },
    production: { icon: "🏭", label: "Manufacturing & Production" },
    bill_of_materials: { icon: "📋", label: "Bill of Materials" },
    ai_system_builder: { icon: "🤖", label: "AI System Builder" },
    growth_engine: { icon: "✨", label: "Growth Engine & Signals" },
    owners_daily_pulse: { icon: "⚡", label: "Daily Pulse" },
    loyalty_points: { icon: "⭐", label: "Loyalty Points" },
    digital_gift_cards: { icon: "🎁", label: "Digital Gift Cards" },
    recurring_invoices: { icon: "🔄", label: "Recurring Invoicing" },
    bank_reconciliation: { icon: "🏦", label: "Bank Reconciliation" },
    e_invoicing: { icon: "📄", label: "E-Invoicing" },
    api_access: { icon: "🔌", label: "REST API & Webhooks" },
    white_label: { icon: "🏷️", label: "White-Label Branding" },
    security_activity_log: { icon: "🛡️", label: "Security & Audit Log" },
    custom_roles: { icon: "👥", label: "Custom Roles" },
    imei_scanner: { icon: "📱", label: "IMEI Scanning" },
    serial_tracking: { icon: "🔢", label: "Serial Tracking" },
    woocommerce: { icon: "🛒", label: "WooCommerce Sync" }
  };
  const getFeatureMeta = (feat) => {
    if (!feat) return { icon: "🔒", label: "Feature Locked" };
    if (featureLabels[feat]) return featureLabels[feat];
    const label = feat.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    return { icon: "🔒", label };
  };
  const featureMeta = getFeatureMeta(feature);
  const planColors = {
    solo: "text-ink-muted",
    starter: "text-ink-muted",
    core: "text-brand-400",
    scale: "text-amber-400"
  };
  const displayCount = currentCount || (limit_grace_status?.is_over_limit && limit_grace_status?.exceeded_feature === feature ? limit_grace_status.current_count : null);
  const displayLimit = limit || (limit_grace_status?.is_over_limit && limit_grace_status?.exceeded_feature === feature ? limit_grace_status.limit : null);
  let unitName = "items";
  if (feature === "sku_limit") unitName = tt("Products");
  else if (feature === "staff_limit") unitName = "Full Seats";
  else if (feature === "locations" || feature === "location_limit") unitName = "Locations";
  return /* @__PURE__ */ jsx(Modal, { show: isOpen, onClose: () => setIsOpen(false), maxWidth: "lg", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-64 h-64 bg-brand-600/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setIsOpen(false),
        className: "absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-interactive-hover text-ink-muted hover:text-white transition-all",
        children: /* @__PURE__ */ jsx(X, { size: 14 })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 p-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-5 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-amber-400/20 to-orange-600/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg", children: featureMeta.icon }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1.5 flex-wrap", children: [
            /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider", children: featureMeta.label }),
            displayCount !== null && displayLimit !== null && /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30", children: [
              displayCount.toLocaleString(),
              " / ",
              displayLimit.toLocaleString(),
              " ",
              unitName
            ] }),
            /* @__PURE__ */ jsxs("span", { className: `px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-800 border border-neutral-700 ${planColors[currentPlan] || "text-white"}`, children: [
              planLabel(currentPlan),
              " plan"
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white leading-tight", children: isHighestTier ? /* @__PURE__ */ jsx("span", { children: "Plan Limit Reached" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            "Available in",
            " ",
            /* @__PURE__ */ jsx("span", { className: isTopTierStyle ? "text-amber-400" : "text-brand-400", children: upgradeLabel })
          ] }) }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mt-1 leading-relaxed", children: message })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-neutral-800/60 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-5 mb-6", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Crown, { size: 12, className: isTopTierStyle ? "text-amber-400" : "text-brand-400" }),
          "Included in ",
          upgradeLabel
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-2.5", children: upgradePerks.map((perk, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isTopTierStyle ? "bg-amber-500/15 text-amber-400" : "bg-brand-500/15 text-brand-400"}`, children: /* @__PURE__ */ jsx(Check, { size: 11, strokeWidth: 3 }) }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-neutral-300", children: perk })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: upgradeUrl,
            className: `flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${isTopTierStyle ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400" : "bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500"}`,
            children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 16 }),
              "Upgrade to ",
              upgradeLabel,
              /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: billingUrl,
            className: "flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-medium text-sm text-neutral-300 bg-neutral-800 hover:bg-interactive-hover border border-neutral-700 hover:border-line-strong transition-all",
            children: "View Plans & Add-ons"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsOpen(false),
            className: "flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-medium text-sm text-ink-muted hover:text-neutral-300 transition-colors",
            children: "Dismiss"
          }
        )
      ] }),
      portalUrl && portalUrl !== "#" && /* @__PURE__ */ jsxs("p", { className: "text-center text-ink-secondary text-xs mt-5", children: [
        "Upgrades apply immediately with prorated billing. Manage anytime at the",
        " ",
        /* @__PURE__ */ jsx("a", { href: portalUrl, className: "text-ink-muted hover:text-neutral-300 underline transition-colors", children: "billing portal" }),
        "."
      ] })
    ] })
  ] }) });
}
function GlobalOnboardingWidget({ store }) {
  const tt = useTermText();
  const [isMinimized, setIsMinimized] = useState(() => {
    return sessionStorage.getItem("amd_global_onboarding_minimized") === "true";
  });
  const toggleMinimized = (val) => {
    setIsMinimized(val);
    sessionStorage.setItem("amd_global_onboarding_minimized", val ? "true" : "false");
  };
  const getOnboardingProgress = (step2) => {
    switch (step2) {
      case "welcome":
        return 0;
      case "stock_value":
        return 10;
      case "sidebar_stock":
        return 20;
      case "inventory_tour":
        return 35;
      case "congratulations":
        return 45;
      case "inventory_tour_more":
        return 45;
      case "purchase_tour_start":
        return 55;
      case "purchase_tour_sidebar":
        return 60;
      case "purchase_tour":
        return 65;
      case "purchase_congratulations":
        return 70;
      case "invoice_tour_start":
      case "pos_tour_start":
        return 75;
      case "invoice_tour":
      case "pos_tour":
        return 85;
      case "invoice_congratulations":
      case "pos_congratulations":
        return 90;
      case "expense_tour_start":
        return 92;
      case "expense_tour":
        return 95;
      case "expense_congratulations":
        return 97;
      case "drive_sync_tour":
        return 99;
      default:
        return 0;
    }
  };
  const handleResume = () => {
    const step2 = store?.onboarding_step;
    if (step2 === "skipped") {
      router.post(
        route("store.onboarding.step", { store_slug: store?.slug }),
        { step: "welcome" },
        {
          onSuccess: () => {
            router.visit(route("store.dashboard", { store_slug: store.slug }));
          }
        }
      );
      return;
    }
    if (["welcome", "stock_value", "sidebar_stock"].includes(step2)) {
      router.visit(route("store.dashboard", { store_slug: store.slug }));
    } else if (["inventory_tour", "congratulations", "inventory_tour_more"].includes(step2)) {
      router.visit(route("store.inventory.index", { store_slug: store.slug }));
    } else if (["purchase_tour_start", "purchase_tour_sidebar", "purchase_tour", "purchase_congratulations"].includes(step2)) {
      if (step2 === "purchase_tour") {
        router.visit(route("store.purchases.create", { store_slug: store.slug }));
      } else {
        router.visit(route("store.dashboard", { store_slug: store.slug }));
      }
    } else if (["invoice_tour_start", "invoice_tour", "invoice_congratulations"].includes(step2)) {
      if (step2 === "invoice_tour") {
        router.visit(route("store.sales.invoice.create", { store_slug: store.slug }));
      } else {
        router.visit(route("store.dashboard", { store_slug: store.slug }));
      }
    } else if (["pos_tour_start", "pos_tour", "pos_congratulations"].includes(step2)) {
      if (step2 === "pos_tour") {
        router.visit(route("store.pos", { store_slug: store.slug }));
      } else {
        router.visit(route("store.dashboard", { store_slug: store.slug }));
      }
    } else if (["expense_tour_start", "expense_tour", "expense_congratulations"].includes(step2)) {
      if (step2 === "expense_tour") {
        router.visit(route("store.expenses.index", { store_slug: store.slug }));
      } else {
        router.visit(route("store.dashboard", { store_slug: store.slug }));
      }
    } else if (step2 === "drive_sync_tour") {
      router.visit(route("store.admin.data", { store_slug: store.slug, tab: "drive_sync" }));
    } else {
      router.visit(route("store.dashboard", { store_slug: store.slug }));
    }
  };
  const handleMarkComplete = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "completed" },
      { preserveScroll: true }
    );
  };
  const { component, url, props } = usePage();
  const step = store?.onboarding_step;
  const onboarding_metrics = props.onboarding_metrics;
  const metrics = onboarding_metrics || {
    has_products: false,
    has_purchases: false,
    has_sales: false,
    has_expenses: false,
    has_drive_sync: false
  };
  const checklist = [
    { key: "inventory", label: tt("Catalog First Product"), isDone: metrics.has_products },
    { key: "purchase", label: "Record First Purchase", isDone: metrics.has_purchases },
    { key: "sale", label: "Record First Sale (POS/Invoice)", isDone: metrics.has_sales },
    { key: "expense", label: "Record Store Expense", isDone: metrics.has_expenses },
    { key: "drive_sync", label: "Secure Database (Google Drive)", isDone: metrics.has_drive_sync || !!store?.google_backup_enabled || !!store?.google_connected }
  ];
  const remainingCount = checklist.filter((item) => !item.isDone).length;
  useEffect(() => {
    if (remainingCount === 0 && store && !store.onboarding_completed && step !== "completed") {
      router.post(
        route("store.onboarding.step", { store_slug: store?.slug }),
        { step: "completed" },
        { preserveScroll: true }
      );
    }
  }, [remainingCount, store?.onboarding_completed, step]);
  const showMobileNavBar = (() => {
    if (!store) return false;
    const auth = props?.auth;
    if (!auth?.user) return false;
    const path2 = url.toLowerCase();
    const isReturnsHistoryList = path2.includes("/returns-history") && !path2.includes("/create") && !path2.includes("/edit") && !path2.includes("/return-detail");
    if (isReturnsHistoryList) return true;
    if (path2.includes("/pos")) return false;
    const isCreateFlow = path2.includes("/create");
    const isEditFlow = path2.includes("/edit");
    const isReturnFlow = path2.includes("/return") && !path2.includes("/returns-history");
    const isRefundFlow = path2.includes("/refund");
    const isSetupFlow = path2.includes("/setup") || path2.includes("/new-store") || path2.includes("/start") || path2.includes("/build-workspace");
    if (isCreateFlow || isEditFlow || isReturnFlow || isRefundFlow || isSetupFlow) {
      return false;
    }
    return true;
  })();
  const isTourActive = () => {
    if (!step) return false;
    const pathname = window.location.pathname;
    if (["welcome", "stock_value", "sidebar_stock", "purchase_tour_start", "purchase_tour_sidebar", "invoice_tour_start", "pos_tour_start", "expense_tour_start"].includes(step)) {
      return component === "Dashboard" || pathname.endsWith("/dashboard");
    }
    if (["inventory_tour", "congratulations", "inventory_tour_more"].includes(step)) {
      return component?.includes("Inventory") || pathname.includes("/inventory");
    }
    if (["purchase_tour", "purchase_congratulations"].includes(step)) {
      return component?.includes("Purchases/Create") || pathname.includes("/purchases/create");
    }
    if (["invoice_tour", "invoice_congratulations"].includes(step)) {
      return component?.includes("CreateInvoice") || pathname.includes("/sales/invoice/create");
    }
    if (["pos_tour", "pos_congratulations"].includes(step)) {
      return component?.includes("Pos") || pathname.includes("/pos");
    }
    if (["expense_tour", "expense_congratulations"].includes(step)) {
      return component?.includes("Expenses") || pathname.includes("/expenses");
    }
    return false;
  };
  if (store?.onboarding_completed || store?.is_demo || step === "completed") {
    return null;
  }
  if (!step) {
    return null;
  }
  if (isTourActive()) {
    return null;
  }
  const path = window.location.pathname.toLowerCase();
  const blockedPatterns = [
    "/pos",
    "/create",
    "/edit",
    "/new-store",
    "/build-workspace",
    "/setup",
    "/refund",
    "/return"
  ];
  const isProfileEdit = path.includes("/profile/edit") || path.includes("/profile");
  if (blockedPatterns.some((p) => path.includes(p) && !(p === "/edit" && isProfileEdit))) {
    return null;
  }
  const progress = getOnboardingProgress(step);
  const circumference = 2 * Math.PI * 18;
  const progressOffset = circumference * (1 - progress / 100);
  const handleStepClick = (item) => {
    if (item.isDone) return;
    let targetStep = "";
    let targetRoute = "";
    let routeParams = { store_slug: store?.slug };
    switch (item.key) {
      case "inventory":
        targetStep = "inventory_tour";
        targetRoute = "store.inventory.index";
        break;
      case "purchase":
        targetStep = "purchase_tour_start";
        targetRoute = "store.dashboard";
        break;
      case "sale":
        targetStep = "invoice_tour_start";
        targetRoute = "store.dashboard";
        break;
      case "expense":
        targetStep = "expense_tour_start";
        targetRoute = "store.dashboard";
        break;
      case "drive_sync":
        targetStep = "drive_sync_tour";
        targetRoute = "store.admin.data";
        routeParams.tab = "drive_sync";
        break;
      default:
        return;
    }
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: targetStep },
      {
        onSuccess: () => {
          router.visit(route(targetRoute, routeParams));
        }
      }
    );
  };
  if (isMinimized) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: () => toggleMinimized(false),
        title: `Onboarding Checklist: ${remainingCount} steps remaining`,
        className: `fixed right-6 z-drawer w-14 h-14 bg-surface border border-line dark:border-brand-500/30 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(99,102,241,0.3)] backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto active:scale-95 hover:border-brand-400/50 transition-all duration-slow group animate-in zoom-in-90 ${showMobileNavBar ? "bottom-[172px] lg:bottom-24" : "bottom-24"}`,
        children: [
          /* @__PURE__ */ jsxs("svg", { className: "absolute w-full h-full -rotate-90", viewBox: "0 0 44 44", children: [
            /* @__PURE__ */ jsx(
              "circle",
              {
                className: "text-neutral-100 dark:text-ink",
                strokeWidth: "3.5",
                stroke: "currentColor",
                fill: "transparent",
                r: "18",
                cx: "22",
                cy: "22"
              }
            ),
            /* @__PURE__ */ jsx(
              "circle",
              {
                className: "text-brand-500 transition-all duration-slower ease-out",
                strokeWidth: "3.5",
                strokeDasharray: circumference,
                strokeDashoffset: progressOffset,
                strokeLinecap: "round",
                stroke: "currentColor",
                fill: "transparent",
                r: "18",
                cx: "22",
                cy: "22"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "relative z-10 text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-white transition-colors duration-normal", children: /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "animate-pulse" }) }),
          /* @__PURE__ */ jsxs("span", { className: "absolute -top-1 -right-2 bg-rose-600 text-4xs font-bold text-white px-2 py-0.5 rounded-full shadow whitespace-nowrap", children: [
            remainingCount,
            " left"
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: `fixed right-6 z-drawer max-w-sm w-full bg-surface border border-line dark:border-brand-500/30 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_15px_40px_rgba(99,102,241,0.25)] p-5 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-slow pointer-events-auto ${showMobileNavBar ? "bottom-[172px] lg:bottom-24" : "bottom-24"}`, children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => toggleMinimized(true),
        className: "absolute top-4 right-4 p-1.5 rounded-lg bg-surface hover:bg-interactive-hover text-ink-muted hover:text-ink-secondary dark:bg-surface dark:hover:bg-interactive-hover dark:text-ink-muted dark:hover:text-white transition-colors border border-line",
        title: "Minimize to widget",
        children: /* @__PURE__ */ jsx(Minimize2, { size: 12 })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
      /* @__PURE__ */ jsx("div", { className: "p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg text-brand-600 dark:text-brand-400 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink uppercase tracking-wider", children: "Setup Checklist" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wide", children: remainingCount === 0 ? "All Completed!" : `${remainingCount} steps remaining` })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-4 space-y-1.5 border-t border-b border-line py-3", children: checklist.map((item, idx) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => handleStepClick(item),
        disabled: item.isDone,
        className: `w-full flex items-center justify-between text-xs p-1.5 rounded-lg transition-all text-left ${item.isDone ? "cursor-not-allowed opacity-80" : "hover:bg-interactive-hover dark:hover:bg-interactive-hover cursor-pointer"}`,
        title: item.isDone ? `${item.label} completed` : `Click to jump to ${item.label}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: `w-4 h-4 rounded-full flex items-center justify-center transition-all ${item.isDone ? "bg-emerald-500/15 text-emerald-500" : "bg-sunken text-ink-muted"}`, children: item.isDone ? /* @__PURE__ */ jsx(Check, { size: 10, strokeWidth: 3 }) : /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-sunken" }) }),
            /* @__PURE__ */ jsx("span", { className: `font-semibold ${item.isDone ? "text-ink-muted line-through" : "text-ink-secondary dark:text-ink"}`, children: item.label })
          ] }),
          /* @__PURE__ */ jsx("span", { className: `text-3xs font-bold px-1.5 py-0.5 rounded-full ${item.isDone ? "bg-emerald-500/10 text-emerald-500" : "bg-brand-500/10 text-brand-500"}`, children: item.isDone ? "Done" : "Start" })
        ]
      },
      idx
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleResume,
          className: "flex-[2] py-2.5 px-3 bg-gradient-brand text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99]",
          children: [
            /* @__PURE__ */ jsx("span", { children: "Resume Setup" }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleMarkComplete,
          className: "flex-1 py-2.5 px-3 bg-surface hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink dark:bg-surface dark:hover:bg-interactive-hover dark:border-line dark:text-ink-muted dark:hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1",
          children: [
            /* @__PURE__ */ jsx(Check, { size: 12 }),
            /* @__PURE__ */ jsx("span", { children: "Done" })
          ]
        }
      )
    ] })
  ] });
}
function ImpersonationBanner() {
  const { impersonation } = usePage().props;
  if (!impersonation?.active) return null;
  function exit() {
    router.post(impersonation.exit_url);
  }
  return /* @__PURE__ */ jsxs("div", { style: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: "linear-gradient(135deg, rgb(var(--vq-violet-600)), rgb(var(--vq-red-600)))",
    padding: "10px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    boxShadow: "0 2px 20px rgba(220,38,38,0.4)",
    animation: "slideDown 0.3s ease"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
      /* @__PURE__ */ jsx("div", { style: { width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Eye, { size: 14, color: "#fff" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 13 }),
          "IMPERSONATION MODE — READ ONLY"
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }, children: [
          "Viewing as ",
          /* @__PURE__ */ jsx("strong", { children: impersonation.target_name }),
          " (",
          impersonation.target_email,
          ") · All write operations are blocked"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: exit,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 16px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          transition: "background 0.15s",
          flexShrink: 0
        },
        onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)",
        onMouseLeave: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)",
        children: [
          /* @__PURE__ */ jsx(LogOut, { size: 13 }),
          " Exit Impersonation"
        ]
      }
    ),
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to   { transform: translateY(0);     opacity: 1; }
                }
` })
  ] });
}
function PlanUsageBanner() {
  const { store, plan_usage } = usePage().props;
  if (!plan_usage || plan_usage.transactions_limit === null) return null;
  const { transactions_used, transactions_limit } = plan_usage;
  const pct = transactions_limit > 0 ? transactions_used / transactions_limit * 100 : 0;
  if (pct < 80) return null;
  const isCapped = pct >= 100;
  const isUrgent = pct >= 95;
  const bgColor = isCapped ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" : isUrgent ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800";
  const textColor = isCapped ? "text-red-700 dark:text-red-300" : isUrgent ? "text-orange-700 dark:text-orange-300" : "text-yellow-700 dark:text-yellow-300";
  const btnColor = isCapped || isUrgent ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-yellow-500 hover:bg-yellow-600 text-white";
  const message = isCapped ? `You've used all ${transactions_limit.toLocaleString()} transactions this month. New sales are paused until the 1st.` : isUrgent ? `You've used ${transactions_used.toLocaleString()} of ${transactions_limit.toLocaleString()} transactions (${Math.round(pct)}%). Almost at your monthly limit.` : `You've used ${transactions_used.toLocaleString()} of ${transactions_limit.toLocaleString()} transactions (${Math.round(pct)}%) this month.`;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      id: "plan-usage-banner",
      className: `flex items-center justify-between gap-4 px-5 py-2.5 border-b text-sm font-medium shrink-0 ${bgColor} ${textColor}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: `shrink-0 ${isCapped ? "animate-pulse" : ""}` }),
          /* @__PURE__ */ jsx("span", { children: message })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            id: "plan-usage-upgrade-btn",
            onClick: () => store?.slug && router.visit(route("store.billing", { store_slug: store.slug })),
            className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${btnColor}`,
            children: [
              /* @__PURE__ */ jsx(Zap, { size: 11 }),
              isCapped ? "Upgrade Now" : "Upgrade"
            ]
          }
        )
      ]
    }
  );
}
function SubscriptionExpiryBanner() {
  const { store, is_demo } = usePage().props;
  if (!store || is_demo) return null;
  const goToBilling = () => {
    if (store.slug) router.visit(route("store.billing", { store_slug: store.slug }));
  };
  if (store.view_only_since) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        id: "subscription-expiry-banner",
        className: "flex items-center justify-between gap-4 px-5 py-2.5 border-b text-sm font-medium shrink-0 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(Lock, { size: 14, className: "shrink-0" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Your access period has ended. Your store is in ",
              /* @__PURE__ */ jsx("strong", { children: "View-Only mode" }),
              " — subscribe to restore full access."
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: goToBilling,
              className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors bg-red-500 hover:bg-red-600 text-white",
              children: [
                /* @__PURE__ */ jsx(Zap, { size: 11 }),
                " Subscribe Now"
              ]
            }
          )
        ]
      }
    );
  }
  if (!store.subscription_ends_at) return null;
  const msRemaining = new Date(store.subscription_ends_at).getTime() - Date.now();
  if (msRemaining <= 0) return null;
  const daysRemaining = Math.ceil(msRemaining / (1e3 * 60 * 60 * 24));
  if (daysRemaining > 7) return null;
  const isUrgent = daysRemaining <= 2;
  const bgColor = isUrgent ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800";
  const textColor = isUrgent ? "text-red-700 dark:text-red-300" : "text-yellow-700 dark:text-yellow-300";
  const btnColor = isUrgent ? "bg-red-500 hover:bg-red-600 text-white" : "bg-yellow-500 hover:bg-yellow-600 text-white";
  const dayLabel = daysRemaining === 1 ? "1 day" : `${daysRemaining} days`;
  const dateLabel = new Date(store.subscription_ends_at).toLocaleDateString(void 0, { month: "long", day: "numeric" });
  const message = isUrgent ? `Urgent: your access ends in ${dayLabel} (${dateLabel}). Your store will become view-only after that.` : `Your access ends in ${dayLabel} (${dateLabel}). Subscribe to avoid interruption.`;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      id: "subscription-expiry-banner",
      className: `flex items-center justify-between gap-4 px-5 py-2.5 border-b text-sm font-medium shrink-0 ${bgColor} ${textColor}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: `shrink-0 ${isUrgent ? "animate-pulse" : ""}` }),
          /* @__PURE__ */ jsx("span", { children: message })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: goToBilling,
            className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${btnColor}`,
            children: [
              /* @__PURE__ */ jsx(Zap, { size: 11 }),
              " ",
              isUrgent ? "Subscribe Now" : "Subscribe"
            ]
          }
        )
      ]
    }
  );
}
function LimitGraceBanner() {
  const { props } = usePage();
  const limitGraceStatus = props.limit_grace_status;
  const is_demo = props.is_demo;
  const [timeLeftStr, setTimeLeftStr] = useState("");
  useEffect(() => {
    if (!limitGraceStatus?.grace_ends_at) return;
    const updateTimer = () => {
      const diffMs = new Date(limitGraceStatus.grace_ends_at).getTime() - (/* @__PURE__ */ new Date()).getTime();
      if (diffMs <= 0) {
        setTimeLeftStr("Expired");
        return;
      }
      const totalSecs = Math.floor(diffMs / 1e3);
      const days = Math.floor(totalSecs / (3600 * 24));
      const hours = Math.floor(totalSecs % (3600 * 24) / 3600);
      const mins = Math.floor(totalSecs % 3600 / 60);
      const secs = totalSecs % 60;
      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);
      setTimeLeftStr(parts.join(" "));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1e3);
    return () => clearInterval(interval);
  }, [limitGraceStatus?.grace_ends_at]);
  if (is_demo || !limitGraceStatus?.is_over_limit || !limitGraceStatus?.grace_ends_at) return null;
  const exceededFeature = limitGraceStatus.exceeded_feature;
  const current = limitGraceStatus.current_count;
  const limit = limitGraceStatus.limit;
  const isTrial = limitGraceStatus.is_trial;
  let stuffName = "items";
  if (exceededFeature === "sku_limit") {
    stuffName = "products";
  } else if (exceededFeature === "staff_limit") {
    stuffName = "staff members";
  } else if (exceededFeature === "locations") {
    stuffName = "warehouses";
  }
  const billingUrl = props.store ? `/s/${props.store.slug}/billing` : "#";
  return /* @__PURE__ */ jsxs("div", { className: "w-full bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center justify-between shrink-0 shadow-sm transition-all duration-slow", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "animate-pulse" }) }),
      /* @__PURE__ */ jsx("div", { className: "truncate pr-4 leading-normal", children: isTrial ? /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("strong", { className: "font-bold text-amber-900 dark:text-amber-200", children: "Trial Usage High:" }),
        " Moving your trial to Growth won't cost anything during your trial period, but is required to support your current usage level. Please upgrade or delete the extra ",
        stuffName,
        " (currently ",
        /* @__PURE__ */ jsxs("strong", { className: "font-semibold", children: [
          current,
          " / ",
          limit
        ] }),
        ") to avoid your store becoming read-only."
      ] }) : /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("strong", { className: "font-bold text-amber-900 dark:text-amber-200", children: "Plan Limits Exceeded:" }),
        " Please delete the extra ",
        stuffName,
        " or upgrade your plan to maintain full access. Currently using ",
        /* @__PURE__ */ jsxs("strong", { className: "font-semibold", children: [
          current,
          " / ",
          limit,
          " ",
          stuffName
        ] }),
        "."
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 shrink-0 font-sans", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider", children: [
        /* @__PURE__ */ jsx(Clock, { size: 12, className: "inline-block" }),
        /* @__PURE__ */ jsx("span", { children: timeLeftStr })
      ] }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: billingUrl,
          className: "flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-1.5 rounded-full text-xs transition-all shadow-sm hover:shadow",
          children: [
            "Upgrade Plan",
            /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
          ]
        }
      )
    ] })
  ] });
}
function ActivityHubModal({
  isOpen,
  onClose,
  store,
  currentUrl = "",
  visibleInvoices = [],
  currentInvoiceId,
  onSelectInvoice,
  userPosSessions = [],
  currentPosId,
  onSelectPos,
  visiblePurchases = [],
  currentPurchaseId,
  onSelectPurchase,
  /* What the store actually built. Null means "unknown" — an older caller
     that does not pass it keeps the previous behaviour rather than rendering
     an empty panel. */
  modules = null,
  totalActiveOps = 0
}) {
  const has = (key) => !Array.isArray(modules) || modules.includes(key);
  const modalRef = useRef(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-modal bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ref: modalRef,
          className: "bg-surface rounded-2xl shadow-2xl border border-line dark:border-white/10 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-line flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(Activity, { size: 22, className: totalActiveOps > 0 ? "animate-pulse" : "" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Activity Hub" }),
                    totalActiveOps > 0 ? /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400", children: [
                      totalActiveOps,
                      " Active"
                    ] }) : /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-2xs font-bold bg-sunken text-ink-muted", children: "Idle" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-0.5", children: "Real-time active sales, POS registers, and purchase orders" })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors",
                  title: "Close",
                  children: /* @__PURE__ */ jsx(X, { size: 18 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 overflow-y-auto custom-scrollbar space-y-6 flex-1", children: [
              visibleInvoices.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-2.5", children: /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(ShoppingCart, { size: 14, className: "text-blue-500" }),
                  "Active Sales Invoices (",
                  visibleInvoices.length,
                  ")"
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2", children: visibleInvoices.map((inv, idx) => {
                  const isCurrent = currentInvoiceId === inv.id && currentUrl.includes("/sales/invoice/create");
                  return /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: `flex items-center justify-between p-3.5 rounded-xl border transition-all ${isCurrent ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : "bg-surface border-line hover:border-brand-200 dark:hover:border-brand-800"}`,
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ jsx("div", { className: `w-2.5 h-2.5 rounded-full ${isCurrent ? "bg-blue-500 ring-4 ring-blue-500/20" : "bg-blue-400/50"}` }),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: inv.customer?.name || `Invoice #${idx + 1}` }),
                            /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Sale draft in progress" })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            onClick: () => onSelectInvoice(inv.id),
                            className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isCurrent ? "bg-blue-600 text-white" : "bg-interactive-hover hover:bg-brand-600 hover:text-white text-ink-secondary"}`,
                            children: [
                              isCurrent ? "Active Now" : "Switch To",
                              !isCurrent && /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                            ]
                          }
                        )
                      ]
                    },
                    inv.id
                  );
                }) })
              ] }),
              userPosSessions.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-2.5", children: /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Zap, { size: 14, className: "text-emerald-500" }),
                  "Active POS Register Sessions (",
                  userPosSessions.length,
                  ")"
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2", children: userPosSessions.map((pos, idx) => {
                  const isCurrent = currentPosId === pos.id && currentUrl.startsWith("/pos");
                  return /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: `flex items-center justify-between p-3.5 rounded-xl border transition-all ${isCurrent ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-surface border-line hover:border-brand-200 dark:hover:border-brand-800"}`,
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ jsx("div", { className: `w-2.5 h-2.5 rounded-full ${isCurrent ? "bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" : "bg-emerald-400/50"}` }),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: pos.customer?.name || `POS Session #${idx + 1}` }),
                            /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Cashier checkout cart" })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            onClick: () => onSelectPos(pos.id),
                            className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isCurrent ? "bg-emerald-600 text-white" : "bg-interactive-hover hover:bg-emerald-600 hover:text-white text-ink-secondary"}`,
                            children: [
                              isCurrent ? "Active Now" : "Switch To",
                              !isCurrent && /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                            ]
                          }
                        )
                      ]
                    },
                    pos.id
                  );
                }) })
              ] }),
              visiblePurchases.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-2.5", children: /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(ShoppingBag, { size: 14, className: "text-amber-500" }),
                  "Active Purchases & Orders (",
                  visiblePurchases.length,
                  ")"
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2", children: visiblePurchases.map((pur, idx) => {
                  const isCurrent = currentPurchaseId === pur.id && currentUrl.includes("/purchases/create");
                  return /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: `flex items-center justify-between p-3.5 rounded-xl border transition-all ${isCurrent ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-surface border-line hover:border-brand-200 dark:hover:border-brand-800"}`,
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ jsx("div", { className: `w-2.5 h-2.5 rounded-full ${isCurrent ? "bg-amber-500 ring-4 ring-amber-500/20" : "bg-amber-400/50"}` }),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: pur.supplier?.name || `Purchase #${idx + 1}` }),
                            /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Purchase order draft" })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            onClick: () => onSelectPurchase(pur.id),
                            className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isCurrent ? "bg-amber-600 text-white" : "bg-interactive-hover hover:bg-amber-600 hover:text-white text-ink-secondary"}`,
                            children: [
                              isCurrent ? "Active Now" : "Switch To",
                              !isCurrent && /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                            ]
                          }
                        )
                      ]
                    },
                    pur.id
                  );
                }) })
              ] }),
              totalActiveOps === 0 && /* @__PURE__ */ jsxs("div", { className: "py-8 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsx(Activity, { size: 26 }) }),
                /* @__PURE__ */ jsx("h4", { className: "text-base font-bold text-ink", children: "No Active Operations" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted max-w-sm mx-auto mt-1 mb-6", children: "Multiple POS sessions, in-progress invoices, and purchase drafts will appear here so you can toggle between operations seamlessly." }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-center gap-3", children: [
                  store && has("pos") && /* @__PURE__ */ jsxs(
                    Link,
                    {
                      href: window.route("store.pos", { store_slug: store.slug }),
                      onClick: onClose,
                      className: "px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors flex items-center gap-1.5 shadow-sm",
                      children: [
                        /* @__PURE__ */ jsx(Zap, { size: 14 }),
                        " Open POS"
                      ]
                    }
                  ),
                  store && has("invoicing") && /* @__PURE__ */ jsxs(
                    Link,
                    {
                      href: window.route("store.sales.invoice.create", { store_slug: store.slug }),
                      onClick: onClose,
                      className: "px-4 py-2 rounded-xl text-xs font-bold bg-surface border border-line hover:border-brand-300 text-ink transition-colors flex items-center gap-1.5 shadow-xs",
                      children: [
                        /* @__PURE__ */ jsx(Plus, { size: 14 }),
                        " New Invoice"
                      ]
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-line bg-surface/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-ink-muted", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "Press ",
                /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 rounded bg-sunken font-mono text-2xs", children: "ESC" }),
                " to close"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "px-3 py-1.5 rounded-lg border border-line hover:bg-interactive-hover text-ink font-medium transition-colors",
                  children: "Close"
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
const PLAN_BADGES = {
  trial: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  starter: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  growth: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  business: "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-800",
  ltd: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
};
const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  cashier: "Cashier",
  accountant: "Accountant",
  viewer: "Viewer"
};
function StoreSwitcherModal({ isOpen, onClose }) {
  const { props } = usePage();
  const currentStore = props.store;
  const [stores, setStores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [navigatingId, setNavigatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef(null);
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      if (stores === null) {
        setLoading(true);
        axios.get(route("my-stores.api")).then((res) => setStores(res.data || [])).catch(() => setStores([])).finally(() => setLoading(false));
      }
    }
  }, [isOpen]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const filteredStores = (stores || []).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.plan?.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q);
  });
  const handleSwitch = (s) => {
    if (s.store_id === currentStore?.id) {
      onClose();
      return;
    }
    setNavigatingId(s.store_id);
    onClose();
    router.visit(s.url);
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-modal bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ref: modalRef,
          className: "bg-surface rounded-2xl shadow-2xl border border-line dark:border-white/10 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-line flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(Store, { size: 22 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Switch Store" }),
                    stores && /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-full text-2xs font-bold bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400", children: [
                      stores.length,
                      " ",
                      stores.length === 1 ? "store" : "stores"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-0.5", children: "Select an active store or organization to switch context" })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors",
                  children: /* @__PURE__ */ jsx(X, { size: 18 })
                }
              )
            ] }),
            stores && stores.length > 2 && /* @__PURE__ */ jsx("div", { className: "px-4 py-3 border-b border-line bg-app/40", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
              /* @__PURE__ */ jsx(Search, { size: 15, className: "absolute left-3 text-ink-muted" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  placeholder: "Search stores by name or role...",
                  className: "w-full bg-surface border border-line rounded-xl pl-9 pr-4 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-brand-500",
                  autoFocus: true
                }
              ),
              searchQuery && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setSearchQuery(""),
                  className: "absolute right-3 text-ink-muted hover:text-ink text-xs",
                  children: "Clear"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "p-4 overflow-y-auto max-h-[50vh] space-y-2.5 custom-scrollbar", children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-ink-muted", children: [
              /* @__PURE__ */ jsx(Loader2, { size: 28, className: "animate-spin text-brand-500 mb-2" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Loading your stores..." })
            ] }) : filteredStores.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-10 text-ink-muted", children: [
              /* @__PURE__ */ jsx(Store, { size: 32, className: "mx-auto mb-2 opacity-30" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: searchQuery ? "No matching stores found." : "No stores associated with your account." })
            ] }) : filteredStores.map((s) => {
              const isCurrent = s.store_id === currentStore?.id;
              const isNavigating = navigatingId === s.store_id;
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => handleSwitch(s),
                  className: `w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${isCurrent ? "border-brand-500/40 bg-brand-50/40 dark:bg-brand-950/20 shadow-xs ring-1 ring-brand-500/20" : "border-line bg-surface hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
                      /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${isCurrent ? "bg-gradient-brand text-white" : "bg-surface border border-line text-ink-secondary group-hover:border-brand-400 group-hover:text-brand-600 transition-colors"}`, children: s.name?.charAt(0).toUpperCase() || "S" }),
                      /* @__PURE__ */ jsxs("div", { className: "min-w-0 text-left", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink truncate group-hover:text-brand-600 transition-colors", children: s.name }),
                          isCurrent && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800", children: [
                            /* @__PURE__ */ jsx(Check, { size: 10 }),
                            " Active"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                          /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-md text-2xs font-bold capitalize border ${PLAN_BADGES[s.plan] || PLAN_BADGES.starter}`, children: s.plan || "Free" }),
                          /* @__PURE__ */ jsxs("span", { className: "text-2xs text-ink-muted flex items-center gap-1 font-medium", children: [
                            /* @__PURE__ */ jsx(ShieldCheck, { size: 11, className: "text-ink-muted" }),
                            ROLE_LABELS[s.role] || s.role || "Member"
                          ] })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "shrink-0 ml-3", children: isCurrent ? /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30", children: "Current" }) : isNavigating ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sunken text-ink-muted text-xs font-semibold", children: [
                      /* @__PURE__ */ jsx(Loader2, { size: 13, className: "animate-spin text-brand-500" }),
                      /* @__PURE__ */ jsx("span", { children: "Switching..." })
                    ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-line group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 text-ink-secondary text-xs font-semibold transition-all", children: [
                      /* @__PURE__ */ jsx("span", { children: "Switch" }),
                      /* @__PURE__ */ jsx(ArrowRight, { size: 13, className: "group-hover:translate-x-0.5 transition-transform" })
                    ] }) })
                  ]
                },
                s.store_id
              );
            }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-line bg-app/50 flex items-center justify-between", children: [
              currentStore && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    onClose();
                    router.visit(route("store.create", { store_slug: currentStore.slug }));
                  },
                  className: "flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 14 }),
                    /* @__PURE__ */ jsx("span", { children: "Create New Store" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "ml-auto px-4 py-2 rounded-xl text-xs font-bold text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors",
                  children: "Close"
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
const ICON_MAP = {
  Home,
  ShoppingCart,
  Box,
  Users,
  Menu,
  Package,
  Wrench,
  Truck,
  FileText,
  ClipboardList,
  RefreshCcw,
  Repeat,
  FileSignature,
  Utensils,
  CalendarClock,
  Building2,
  ArrowLeftRight,
  ClipboardCheck,
  Layers,
  ScanLine,
  Barcode,
  ShoppingBag,
  FileInput,
  FileMinus,
  BookOpen,
  Factory,
  BookUser,
  Wallet,
  Receipt,
  Coins,
  Landmark,
  GitCompare,
  BookText,
  BadgeCheck,
  BarChart3,
  Sparkles,
  Globe,
  Circle
};
function BottomNavBar({
  store: propStore,
  modules: propModules,
  mobileNav: propMobileNav,
  onOpenMore,
  className = "",
  currentUrl,
  activeItem: propActiveItem,
  hide = false
}) {
  let pageProps = {};
  let pageUrl = "";
  try {
    const page = usePage();
    pageProps = page?.props || {};
    pageUrl = page?.url || "";
  } catch (e) {
  }
  const store = propStore || pageProps?.store;
  const modules = propModules !== void 0 ? propModules : pageProps?.modules;
  const rawMobileNav = propMobileNav !== void 0 ? propMobileNav : pageProps?.mobile_nav;
  const url = currentUrl !== void 0 ? currentUrl : pageUrl;
  let tt = (s) => s;
  try {
    const termFn = useTermText();
    if (typeof termFn === "function") {
      tt = termFn;
    }
  } catch (e) {
  }
  if (hide) return null;
  const path = (url || "").toLowerCase();
  const isExcluded = path && (path.includes("/pos") || path.includes("/checkout") || path.includes("/create") || path.includes("/edit"));
  if (isExcluded) return null;
  const storeSlug = store?.slug;
  const isRouteActive = (pattern) => {
    try {
      if (typeof route === "function" && route().current) {
        return route().current(pattern);
      }
    } catch (e) {
    }
    return false;
  };
  const resolveRoute = (name, params = {}) => {
    try {
      if (typeof route === "function" && route().has && route().has(name)) {
        return route(name, params);
      }
    } catch (e) {
    }
    return "#";
  };
  const items = [];
  if (Array.isArray(rawMobileNav) && rawMobileNav.length > 0) {
    for (const navItem of rawMobileNav) {
      const isItemHome = navItem.id === "home";
      const isItemMore = navItem.id === "more";
      const IconComponent = ICON_MAP[navItem.icon] || (isItemHome ? Home : isItemMore ? Menu : Circle);
      let href = "#";
      let isActive = false;
      if (isItemHome) {
        href = storeSlug ? resolveRoute(navItem.route || "store.dashboard", { store_slug: storeSlug }) : resolveRoute(navItem.route || "dashboard");
        isActive = propActiveItem === "home" || isRouteActive("store.dashboard") || isRouteActive("store.home") || isRouteActive("store.new-dashboard") || isRouteActive("dashboard") || path === "/" || path.endsWith("/dashboard");
      } else if (isItemMore) {
        href = null;
        isActive = propActiveItem === "more";
      } else {
        href = storeSlug ? resolveRoute(navItem.route, { store_slug: storeSlug }) : resolveRoute(navItem.route);
        isActive = propActiveItem === navItem.id || navItem.route && isRouteActive(navItem.route + "*") || navItem.module && path.includes("/" + navItem.module);
      }
      items.push({
        id: navItem.id,
        label: tt(navItem.label),
        href,
        icon: IconComponent,
        isActive,
        isAction: isItemMore,
        onClick: isItemMore ? onOpenMore : void 0,
        ariaLabel: isItemMore ? tt("Open navigation menu") : void 0
      });
    }
  } else {
    const hasModule = (name) => !Array.isArray(modules) || modules.includes(name);
    const isHomeActive = propActiveItem === "home" || isRouteActive("store.dashboard") || isRouteActive("store.home") || isRouteActive("store.new-dashboard") || isRouteActive("dashboard") || path === "/" || path.endsWith("/dashboard");
    items.push({
      id: "home",
      label: tt("Home"),
      href: storeSlug ? resolveRoute("store.dashboard", { store_slug: storeSlug }) : resolveRoute("dashboard"),
      icon: Home,
      isActive: isHomeActive
    });
    if (hasModule("pos")) {
      const isPosActive = propActiveItem === "sell" || isRouteActive("store.pos*") || path.includes("/pos");
      items.push({
        id: "sell",
        label: tt("Sell"),
        href: storeSlug ? resolveRoute("store.pos", { store_slug: storeSlug }) : "/pos",
        icon: ShoppingCart,
        isActive: isPosActive
      });
    } else if (hasModule("invoicing")) {
      const isInvoiceActive = propActiveItem === "sell" || isRouteActive("store.sales.*") || isRouteActive("store.orders.*") || path.includes("/sales");
      items.push({
        id: "sell",
        label: tt("Sell"),
        href: storeSlug ? resolveRoute("store.sales.invoice.create", { store_slug: storeSlug }) : "#",
        icon: ShoppingCart,
        isActive: isInvoiceActive
      });
    }
    if (hasModule("products") || hasModule("inventory")) {
      const isStockActive = propActiveItem === "stock" || isRouteActive("store.inventory.*") || isRouteActive("store.products.*") || path.includes("/inventory") || path.includes("/products");
      items.push({
        id: "stock",
        label: tt("Stock"),
        href: storeSlug ? resolveRoute("store.inventory.index", { store_slug: storeSlug }) : resolveRoute("store.products.index", { store_slug: storeSlug }),
        icon: Box,
        isActive: isStockActive
      });
    }
    if (hasModule("customers") || hasModule("suppliers")) {
      const isContactsActive = propActiveItem === "contacts" || isRouteActive("store.customers.*") || isRouteActive("store.suppliers.*") || path.includes("/customers") || path.includes("/suppliers");
      const contactsHref = hasModule("customers") ? storeSlug ? resolveRoute("store.customers.index", { store_slug: storeSlug }) : "#" : storeSlug ? resolveRoute("store.suppliers.index", { store_slug: storeSlug }) : "#";
      items.push({
        id: "contacts",
        label: tt("Contacts"),
        href: contactsHref,
        icon: Users,
        isActive: isContactsActive
      });
    }
    items.push({
      id: "more",
      label: tt("More"),
      isAction: true,
      onClick: onOpenMore,
      icon: Menu,
      isActive: propActiveItem === "more",
      ariaLabel: tt("Open navigation menu")
    });
  }
  if (items.length < 3) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "nav",
    {
      "aria-label": tt("Mobile navigation"),
      className: cn(
        "lg:hidden fixed bottom-3 inset-x-0 z-nav flex justify-center px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none",
        className
      ),
      children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-around gap-1 p-1.5 bg-surface/95 dark:bg-surface/95 backdrop-blur-md border border-line rounded-full shadow-lg pointer-events-auto max-w-md w-full", children: items.map((item) => {
        const Icon = item.icon;
        const isActive = !!item.isActive;
        const isButton = !!item.isAction;
        const content = /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            Icon,
            {
              size: 18,
              className: cn(
                "shrink-0 transition-transform duration-normal",
                isActive ? "scale-110" : ""
              )
            }
          ),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "overflow-hidden whitespace-nowrap text-1xs font-medium transition-all duration-normal",
                isActive ? "max-w-24 opacity-100 ml-1.5" : "max-w-0 opacity-0 ml-0"
              ),
              children: item.label
            }
          )
        ] });
        const commonClasses = cn(
          "relative flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-full transition-all duration-normal text-xs font-medium select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50",
          isActive ? "bg-brand-500/15 dark:bg-brand-400/20 text-brand-600 dark:text-brand-400 font-semibold shadow-xs" : "text-ink-muted hover:text-ink hover:bg-interactive-hover"
        );
        if (isButton) {
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: item.onClick,
              className: commonClasses,
              "aria-label": item.ariaLabel || item.label,
              children: content
            },
            item.id
          );
        }
        return /* @__PURE__ */ jsx(
          Link,
          {
            href: item.href,
            className: commonClasses,
            "aria-current": isActive ? "page" : void 0,
            "aria-label": item.label,
            children: content
          },
          item.id
        );
      }) })
    }
  );
}
function OneGlanceLayout({ children, title, activeMenu, defaultCollapsed = false, hideHeader = false, fullScreen = false, mode = "app", noPadding = false, hideSidebar = false }) {
  const {
    store
  } = usePage().props;
  const tt = useTermText();
  const isStarterOrLtd1 = store?.plan === "starter" || store?.plan === "ltd_1";
  const { activeInvoices, currentInvoiceId, setCurrentInvoiceId, posSessions, currentPosId, setCurrentPosId, activePurchases, currentPurchaseId, setCurrentPurchaseId } = useWorkspace();
  const { url, props } = usePage();
  const { settings, flash, my_role, userRole: userRoleProp, vensynq_enabled, woocommerce_enabled, is_demo, planFeatures } = props;
  settings?.service_mode || "counter";
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    if (!message || typeof message !== "string") return;
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => {
      if (prev.some((t) => t.message === message && t.type === type)) {
        return prev;
      }
      const updated = [...prev, { id, message, type }];
      return updated.length > 3 ? updated.slice(updated.length - 3) : updated;
    });
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const [isActivityHubModalOpen, setIsActivityHubModalOpen] = useState(false);
  const [isStoreSwitcherModalOpen, setIsStoreSwitcherModalOpen] = useState(false);
  const [showClock, setShowClock] = useState(() => {
    try {
      return localStorage.getItem("venqore_header_clock_visible") === "true";
    } catch (e) {
      return false;
    }
  });
  const toggleClockVisibility = () => {
    const next = !showClock;
    setShowClock(next);
    try {
      localStorage.setItem("venqore_header_clock_visible", String(next));
    } catch (e) {
    }
  };
  const [currentTime, setCurrentTime] = useState(/* @__PURE__ */ new Date());
  useEffect(() => {
    if (!showClock) return;
    const clockInterval = setInterval(() => {
      setCurrentTime(/* @__PURE__ */ new Date());
    }, 1e3);
    return () => clearInterval(clockInterval);
  }, [showClock]);
  useEffect(() => {
    if (flash?.success) {
      addToast(flash.success, "success");
    }
    if (flash?.error) {
      addToast(flash.error, "error");
    }
    if (flash?.warning) {
      addToast(flash.warning, "warning");
    }
    if (flash?.info) {
      addToast(flash.info, "info");
    }
  }, [flash?.success, flash?.error, flash?.warning, flash?.info]);
  useEffect(() => {
    const handleToast = (e) => {
      if (e.detail && e.detail.message) {
        addToast(e.detail.message, e.detail.type || "info");
      }
    };
    const handleNetworkError = (e) => {
      if (e.detail && e.detail.message) {
        addToast(e.detail.message, "error");
      }
    };
    window.addEventListener("amd:toast", handleToast);
    window.addEventListener("amd:network-error", handleNetworkError);
    return () => {
      window.removeEventListener("amd:toast", handleToast);
      window.removeEventListener("amd:network-error", handleNetworkError);
    };
  }, []);
  const isInvoiceCreate = url.includes("/sales/invoice/create") || url.includes("/purchases/create");
  const isPosRoute = url.includes("/pos");
  if (typeof window !== "undefined") {
    window.amdSettings = {
      ...settings || {},
      // Unified metadata: prioritize store-level (synced) values, then settings
      currency: settings?.currency || store?.currency_code,
      currency_code: store?.currency_code || settings?.currency_code,
      currency_symbol: store?.currency_symbol || settings?.currency_symbol,
      store_name: store?.name || settings?.store_name || settings?.business_name,
      decimal_places: parseInt(settings?.decimal_places || 2)
    };
  }
  const isTrial = store?.status === "trial";
  const trialDaysLeft = isTrial && store?.trial_ends_at ? Math.max(0, Math.ceil((new Date(store.trial_ends_at) - /* @__PURE__ */ new Date()) / 864e5)) : null;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobileFabsOpen, setIsMobileFabsOpen] = useState(false);
  const [budIconType, setBudIconType] = useState("setup");
  useEffect(() => {
    const interval = setInterval(() => {
      setBudIconType((prev) => prev === "setup" ? "chat" : "setup");
    }, 2e3);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (isMobileFabsOpen) {
      document.body.classList.add("mobile-fabs-expanded");
    } else {
      document.body.classList.remove("mobile-fabs-expanded");
    }
  }, [isMobileFabsOpen]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isMobileFabsOpen) return;
      const target = event.target;
      const isClickOnBud = target.closest("#mobile-fabs-toggle-bud");
      const isClickOnFloatingPanel = target.closest(".fixed.right-6.z-\\[55\\]") || target.closest(".fixed.right-6.z-\\[95\\]") || target.closest("#tour-chat-widget-btn");
      if (!isClickOnBud && !isClickOnFloatingPanel) {
        setIsMobileFabsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileFabsOpen]);
  const showExpandedSidebar = isSidebarOpen || mobileSidebarOpen;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { appearance, update: updateAppearance, isDark } = useAppearance();
  const isEffectiveDarkMode = store ? isDark : isDarkMode;
  const toggleAppTheme = (targetMode) => {
    const nextMode = typeof targetMode === "string" ? targetMode : isEffectiveDarkMode ? "light" : "dark";
    setIsDarkMode(nextMode === "dark");
    try {
      localStorage.setItem("amd_theme", nextMode);
    } catch (e) {
    }
    if (store) {
      updateAppearance({ theme: "venqore-v6", mode: nextMode });
    }
  };
  const handleEditLayout = () => {
    if (typeof window !== "undefined" && window.location.pathname.includes("/new-dashboard")) {
      window.dispatchEvent(new CustomEvent("vq:edit-layout"));
    } else if (store?.slug) {
      router.visit(route("store.new-dashboard", { store_slug: store.slug, edit: 1 }));
    } else {
      router.visit("/new-dashboard?edit=1");
    }
  };
  const handleAddCard = () => {
    if (typeof window !== "undefined" && window.location.pathname.includes("/new-dashboard")) {
      window.dispatchEvent(new CustomEvent("vq:add-card"));
    } else if (store?.slug) {
      router.visit(route("store.new-dashboard", { store_slug: store.slug, add_card: 1 }));
    } else {
      router.visit("/new-dashboard?add_card=1");
    }
  };
  const handleToggleSidePanel = () => {
    if (typeof window !== "undefined" && window.location.pathname.includes("/new-dashboard")) {
      window.dispatchEvent(new CustomEvent("vq:open-side-panel"));
      window.dispatchEvent(new CustomEvent("vq:toggle-side-panel"));
    } else if (store?.slug) {
      router.visit(route("store.new-dashboard", { store_slug: store.slug, side_panel: 1 }));
    } else {
      router.visit("/new-dashboard?side_panel=1");
    }
  };
  const handleStartFresh = () => {
    if (typeof window !== "undefined" && window.location.pathname.includes("/new-dashboard")) {
      window.dispatchEvent(new CustomEvent("vq:start-fresh"));
    } else if (store?.slug) {
      router.visit(route("store.new-dashboard", { store_slug: store.slug, reset: 1 }));
    } else {
      router.visit("/new-dashboard?reset=1");
    }
  };
  const [isLargeText, setIsLargeText] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const growthRef = useRef(null);
  const displayMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [isDisplayMenuOpen, setIsDisplayMenuOpen] = useState(false);
  const showMobileNavBar = (() => {
    if (!props.auth?.user) return false;
    if (fullScreen) return false;
    const path = url.toLowerCase();
    const isReturnsHistoryList = path.includes("/returns-history") && !path.includes("/create") && !path.includes("/edit") && !path.includes("/return-detail");
    if (isReturnsHistoryList) return true;
    if (path.includes("/pos")) return false;
    const isCreateFlow = path.includes("/create");
    const isEditFlow = path.includes("/edit");
    const isReturnFlow = path.includes("/return") && !path.includes("/returns-history");
    const isRefundFlow = path.includes("/refund");
    const isSetupFlow = path.includes("/setup") || path.includes("/new-store") || path.includes("/start") || path.includes("/build-workspace");
    if (isCreateFlow || isEditFlow || isReturnFlow || isRefundFlow || isSetupFlow) {
      return false;
    }
    return true;
  })();
  route().current("store.sales.dashboard") || route().current("store.sales.*") || route().current("store.orders.*") || route().current("store.sales.index");
  route().current("store.purchases.*") || route().current("store.purchases.index");
  route().current("store.dashboard") || route().current("store.home");
  route().current("store.expenses.*") || route().current("store.expenses.index");
  route().current("store.inventory.*") || route().current("store.inventory.dashboard") || route().current("store.products.*");
  const [activeDropdown, setActiveDropdown] = useState(null);
  useRef(null);
  useRef(false);
  const wasHoverExpandedRef = useRef(false);
  const sidebarRef = useRef(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiMinimized, setIsAiMinimized] = useState(false);
  const [aiModalQuery, setAiModalQuery] = useState("");
  const [aiMessageCount, setAiMessageCount] = useState(0);
  useEffect(() => {
    const checkMessages = () => {
      const saved = sessionStorage.getItem("amd_ai_messages");
      if (saved) {
        try {
          const messages = JSON.parse(saved);
          setAiMessageCount(messages.length);
        } catch (e) {
        }
      }
    };
    checkMessages();
    const interval = setInterval(checkMessages, 1e3);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const handleTourStep = (e) => {
      const step = e.detail;
      if (step === "sidebar_stock") {
        setIsSidebarOpen(true);
        setExpandedMenu("Stock");
      } else if (step === "purchase_tour_sidebar") {
        setIsSidebarOpen(true);
        setExpandedMenu("Purchase");
      }
    };
    window.addEventListener("onboarding-step-changed", handleTourStep);
    if (window.activeOnboardingStep === "sidebar_stock") {
      setIsSidebarOpen(true);
      setExpandedMenu("Stock");
    } else if (window.activeOnboardingStep === "purchase_tour_sidebar") {
      setIsSidebarOpen(true);
      setExpandedMenu("Purchase");
    }
    return () => {
      window.removeEventListener("onboarding-step-changed", handleTourStep);
    };
  }, [store]);
  const [isGrowthOpen, setIsGrowthOpen] = useState(false);
  const [showAiPopup, setShowAiPopup] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAiPopup(true);
    }, 5e3);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (isInvoiceCreate) {
      setIsSidebarOpen(false);
    }
  }, [isInvoiceCreate]);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef(null);
  const resetIdleTimer = () => {
    if (isIdle) setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    const autoLogoutMinutes = parseInt(settings?.auto_logout) || 60;
    const timeoutMs = autoLogoutMinutes * 60 * 1e3;
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeoutMs);
  };
  useEffect(() => {
    resetIdleTimer();
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    const handler = () => resetIdleTimer();
    events.forEach((event) => window.addEventListener(event, handler));
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((event) => window.removeEventListener(event, handler));
    };
  }, [isIdle]);
  const userRole = my_role || userRoleProp || props.auth?.user?.role;
  const isPlatformAdmin = !!props.auth?.user?.is_platform_admin;
  const userPerms = props.auth?.user?.permissions || [];
  const hasAnyPerm = (...keys) => keys.some((k) => userPerms.some((p) => p === k || p.startsWith(k + ".")));
  const userPosSessions = posSessions?.filter((pos) => userRole === "cashier" ? pos.user_id === props.auth?.user?.id : true) || [];
  const visibleInvoices = userRole === "owner" || userRole === "admin" || userRole === "manager" ? activeInvoices || [] : [];
  const visiblePurchases = activePurchases && (userRole === "owner" || userRole === "admin" || userRole === "manager" || userRole === "purchasing_officer" || userPerms.includes("purchases")) ? activePurchases : [];
  const totalActiveOps = visibleInvoices.length + userPosSessions.length + visiblePurchases.length;
  const appMenuItemsRaw = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      subs: [
        { group: "Overview", items: ["Home", "Main Dashboard"] }
      ],
      route: store ? "store.dashboard" : "dashboard",
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Sell",
      icon: ShoppingCart,
      // PROBLEM 1 FIX: Cashier sees only POS. All other roles see full Sell menu sub-items.
      subs: userRole === "cashier" ? [] : [
        { group: "Transactions", items: ["Orders", "Service Jobs", "Dispatch Calendar", "Tools & Equipment", "Quotations / Pre-Sales", "Proposals"] },
        { group: "Post-Sale", items: ["Returns History", "Invoice Reminders", "Recurring Invoices"] },
        { group: "Config", items: ["E-Invoicing"] }
      ],
      route: store ? "store.sales.dashboard" : "sales.dashboard",
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Purchase",
      icon: ShoppingBag,
      subs: [
        { group: "Transactions", items: ["Purchases", "Purchase Orders"] },
        { group: "Post-Purchase", items: ["Purchase Returns"] }
      ],
      route: store ? "store.purchases.index" : "purchases.index",
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Stock",
      icon: Box,
      subs: [
        { group: "Catalog", items: ["Products", "Categories", "Attributes", "Labels"] },
        { group: "Operations", items: ["Stock Levels", "Stock Operations", "Stock Transfers", "Stock Audit"] },
        { group: "Tracking", items: ["Batch Tracking", "Serial Tracking"] },
        { group: "Manufacturing", items: ["Production", "Cookbook"] }
      ],
      route: store ? "store.inventory.dashboard" : "inventory.dashboard",
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Contacts",
      icon: Users,
      subs: [
        { group: "Partners", items: ["Customers", "Suppliers", "Parties"] }
      ],
      route: store ? "store.parties.index" : "parties.index",
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Money",
      icon: Wallet,
      subs: [
        { group: "Cash Flow", items: ["Payments", "Expenses", "To Receive", "To Pay"] },
        { group: "Banking", items: ["Fund Management", "Bank Accounts", "Bank Reconciliation"] }
      ],
      route: store ? "store.transactions.index" : "transactions.index",
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "VenSynQ",
      icon: RefreshCcw,
      subs: [
        { group: "Multi-Channel", items: ["VenSynQ"] },
        { group: "Promotion", items: ["Email Marketing", "SMS Marketing", "Campaigns"] },
        { group: "Integrations", items: [woocommerce_enabled ? "WooCommerce Sync" : null].filter(Boolean) },
        { group: "Configuration", items: ["VenSynQ Settings"] }
      ],
      route: store ? "store.vensynq.index" : "vensynq.index",
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Insights",
      icon: TrendingUp,
      subs: [
        { group: "Growth", items: ["Growth Engine"] },
        { group: "Financial Health", items: ["Chart of Accounts", "Profit & Loss", "Balance Sheet", "Cash Flow", "Tax Report"] },
        { group: "Sales Analysis", items: ["Sales Report", "Discount Report", "Sale Aging"] },
        { group: "Purchase Analysis", items: ["Purchase Report", "Expense Report"] },
        { group: "Inventory", items: ["Stock Valuation", "Low Stock", "Movement History", "Expiry Report"] },
        { group: "Operational", items: ["Activity Log"] }
      ],
      route: store ? "store.reports.index" : "reports.index",
      routeParams: store ? { store_slug: store.slug } : {}
    },
    store && (userRole === "owner" || userRole === "admin" || userRole === "manager" || hasAnyPerm("admin.settings_manage", "users.manage", "audit")) ? {
      name: "Administration",
      icon: ShieldCheck,
      subs: [
        { group: "Executive", items: ["Executive Dashboard"] },
        { group: "Team & Staff", items: ["User Management", "Staff Attendance"] },
        { group: "System & Data", items: ["Data Management", "Activity Log", "Recycle Bin", ...!is_demo ? ["Subscription"] : []] },
        { group: "AI Support", items: ["Agent Inbox"] }
      ],
      route: store ? "store.admin.dashboard" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    } : null,
    store && (userRole === "owner" || userRole === "admin" || userRole === "manager" || hasAnyPerm("admin.settings_manage")) ? {
      name: "Settings",
      icon: Settings,
      subs: [
        { group: "Store Configuration", items: ["Store Settings", "System Settings", "Builder"] },
        { group: "AI & Automation", items: ["Chatbot Settings"] }
      ],
      route: store ? "store.settings" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    } : null
  ].filter(Boolean);
  props?.terms || {};
  const SUBITEM_MODULE = {
    "Orders": "sales_orders",
    "Service Jobs": "services",
    "Dispatch Calendar": "services",
    "Tools & Equipment": "services",
    "Services": "services",
    "Quotations / Pre-Sales": "pre_sales",
    "Proposals": "b2b_proposals",
    "Returns History": "sales_returns",
    "Invoice Reminders": "recurring_invoices",
    "Recurring Invoices": "recurring_invoices",
    "Purchases": "purchases",
    "Purchase Orders": "purchase_orders",
    "Purchase Returns": "purchase_returns",
    "Products": "products",
    "Categories": "products",
    "Attributes": "variants",
    "Labels": "barcodes_labels",
    "Stock Levels": "inventory",
    "Stock Operations": "inventory",
    "Stock Transfers": "stock_transfers",
    "Stock Audit": "stock_takes",
    "Batch Tracking": "batches_expiry",
    "Serial Tracking": "serials",
    "Production": "production_runs",
    "Cookbook": "cookbook",
    "Customers": "customers",
    "Suppliers": "suppliers",
    "Parties": "khata_credit",
    "Payments": "payments",
    "Expenses": "expenses",
    "To Receive": "khata_credit",
    "To Pay": "khata_credit",
    "Fund Management": "bank_accounts",
    "Bank Accounts": "bank_accounts",
    "Bank Reconciliation": "bank_reconciliation",
    "VenSynQ": "marketplace_sync",
    "WooCommerce Sync": "marketplace_sync",
    "Staff Attendance": "staff_attendance",
    /* ── Added 12 Sep 2026 ──────────────────────────────────────────────
    		   Thirty-three of the seventy labels in this menu had no owner, which
    		   meant they rendered whatever the customer actually built. Reports was
    		   the worst of it: every single entry under Insights was ungated, so a
    		   one-person services business that never asked for stock was still
    		   shown Stock Valuation, Low Stock, Movement History and an Expiry
    		   Report — and because a group only hides once ALL of its children are
    		   filtered out, a group full of ungated children could never hide at
    		   all. That is why a freshly built workspace looked like the whole
    		   product: not because the builder failed to save the choice, but
    		   because the shell never asked what the choice was.
    
    		   Deliberately still ungated below this map: Home, Main Dashboard, and
    		   everything under Administration and Settings. Those are how someone
    		   runs, fixes, pays for and extends their workspace — gating them on a
    		   module is how a customer loses the screen that would have let them
    		   turn the module back on. */
    "E-Invoicing": "invoicing",
    // Insights → Financial Health
    "Chart of Accounts": "accounting_workspace",
    "Profit & Loss": "accounting_workspace",
    "Balance Sheet": "accounting_workspace",
    "Cash Flow": "accounting_workspace",
    "Tax Report": "tax_compliance",
    // Insights → Sales / Purchase analysis
    "Sales Report": "reports",
    "Discount Report": "pricing_tiers",
    "Sale Aging": "khata_credit",
    "Purchase Report": "purchases",
    "Expense Report": "expenses",
    "Growth Engine": "reports",
    "Invoices": "invoicing",
    "Invoices List": "invoicing",
    "New Sale": "invoicing",
    "Sales Orders": "sales_orders",
    "Return History": "sales_returns",
    "Purchases List": "purchases",
    "New Purchase": "purchases",
    "Debit Notes": "purchase_returns",
    // Insights → Inventory. The four that gave a plumber a stock menu.
    "Stock Valuation": "inventory",
    "Low Stock": "inventory",
    "Movement History": "inventory",
    "Expiry Report": "batches_expiry",
    // VenSynQ → everything in this group belongs to the sync module, so the
    // group itself disappears for someone who never asked to sell online.
    "Email Marketing": "marketplace_sync",
    "SMS Marketing": "marketplace_sync",
    "Campaigns": "marketplace_sync",
    "VenSynQ Settings": "marketplace_sync"
  };
  const SUBITEM_ROUTES = {
    "Orders": ["store.sales-orders.index", "store.sales.index"],
    "Service Jobs": ["store.service-jobs.index", "store.service-jobs.create", "store.service-jobs.show", "store.service-jobs.calendar"],
    "Dispatch Calendar": ["store.service-jobs.calendar"],
    "Tools & Equipment": ["store.tools.index"],
    "Services": ["store.service-jobs.index", "store.service-jobs.create", "store.service-jobs.show", "store.service-jobs.calendar", "store.tools.index"],
    "Quotations / Pre-Sales": ["store.pre-sales.index", "store.quotations.index"],
    "Proposals": ["store.proposals.index"],
    "Returns History": ["store.returns-history.index"],
    "Invoice Reminders": ["store.recurring-invoices.index"],
    "Recurring Invoices": ["store.recurring-invoices.index"],
    "Purchases": ["store.purchases.index"],
    "Purchase Orders": ["store.purchase-orders.index"],
    "Purchase Returns": ["store.debit-notes.index"],
    "Products": ["store.inventory.index"],
    "Categories": ["store.inventory.index"],
    "Attributes": ["store.inventory.index"],
    "Labels": ["store.labels.index"],
    "Stock Levels": ["store.inventory.dashboard"],
    "Stock Operations": ["store.inventory.dashboard"],
    "Stock Transfers": ["store.stock-transfers.index"],
    "Stock Audit": ["store.stock-takes.index"],
    "Batch Tracking": ["store.batches.index"],
    "Serial Tracking": ["store.serials.index"],
    "Production": ["store.production.index"],
    "Cookbook": ["store.cookbook.index"],
    "Customers": ["store.customers.index"],
    "Suppliers": ["store.suppliers.index"],
    "Parties": ["store.parties.ledger"],
    "Payments": ["store.payments.index"],
    "Expenses": ["store.expenses.index"],
    "To Receive": ["store.parties.ledger"],
    "To Pay": ["store.parties.ledger"],
    "Fund Management": ["store.funds.index", "store.bank-accounts.index"],
    "Bank Accounts": ["store.bank-accounts.index"],
    "Bank Reconciliation": ["store.bank-reconciliation.index"],
    "VenSynQ": ["store.vensynq.index"],
    "WooCommerce Sync": ["store.vensynq.index", "store.woocommerce.index"]
  };
  const enabledModuleSet = Array.isArray(props?.modules) ? new Set(props.modules) : null;
  const derivedNavRoutes = Array.isArray(props?.nav) ? new Set(props.nav.map((n) => n.route)) : null;
  const subitemModuleVisible = (item) => {
    const label = typeof item === "string" ? item : item?.label;
    if (!label) return true;
    const owner = SUBITEM_MODULE[label];
    if (owner && enabledModuleSet && !enabledModuleSet.has(owner)) {
      return false;
    }
    const routes = SUBITEM_ROUTES[label];
    if (routes && derivedNavRoutes && derivedNavRoutes.size > 0) {
      const routePresent = routes.some((r) => derivedNavRoutes.has(r));
      if (!routePresent) {
        return false;
      }
    }
    return true;
  };
  const appMenuItems = appMenuItemsRaw.map((group) => {
    if (!group?.subs) return group;
    const filteredSubs = group.subs.map((sub) => ({
      ...sub,
      items: (sub.items || []).filter(subitemModuleVisible)
    })).filter((sub) => sub.items.length > 0);
    return {
      ...group,
      subs: filteredSubs
    };
  }).filter((group) => {
    if (["Dashboard", "Home", "Settings", "Administration", "Appearance"].includes(group.name)) {
      return true;
    }
    if (userRole === "cashier" && group.name === "Sell") {
      return enabledModuleSet ? enabledModuleSet.has("pos") : true;
    }
    if (group.subs && group.subs.length === 0) {
      return false;
    }
    return true;
  });
  if (!store && mode !== "admin") {
    if (typeof window !== "undefined") {
      window.location.href = "/hub";
    }
    return null;
  }
  const adminMenuItems = mode === "admin" && isPlatformAdmin && !store ? [
    // ── Platform HQ (Unified SuperAdmin Experience) ─────────────────────────
    { name: "Overview", icon: LayoutDashboard, subs: [], route: "platform.dashboard" },
    { name: "System Health", icon: Activity, subs: [], route: "platform.health.errors" },
    { name: "Plans & Limits", icon: Layers, subs: [], route: "platform.plans.index" },
    { name: "Platforms", icon: Database, subs: [], route: "platform.platforms.index" },
    { name: "Coupons", icon: Ticket, subs: [], route: "platform.coupons.index" },
    { name: "Tenant Overrides", icon: Zap, subs: [], route: "platform.tenants.overrides" },
    { name: "Stores", icon: ShoppingBag, subs: [], route: "platform.stores" },
    { name: "Platform Users", icon: UserCog, subs: [], route: "platform.users" },
    { name: "Revenue", icon: TrendingUp, subs: [], route: "platform.dashboard", routeParams: { tab: "revenue" } },
    { name: "Support", icon: Ticket, subs: [], route: "platform.tickets" },
    { name: "Activity Feed", icon: Rss, subs: [], route: "platform.dashboard", routeParams: { tab: "feed" } },
    { name: "Demo Store", icon: Monitor, subs: [], route: "platform.dashboard", routeParams: { tab: "demo" } },
    { name: "Agent Inbox", icon: MessageSquare, subs: [], route: "platform.chatbot.inbox" },
    { name: "Chatbot Settings", icon: Sparkles, subs: [], route: "platform.chatbot.settings" },
    { name: "VenSynQ", icon: RefreshCcw, subs: [], route: "platform.dashboard", routeParams: { tab: "vensynq" } },
    { name: "Settings", icon: Settings, subs: [], route: "platform.dashboard", routeParams: { tab: "settings" } },
    { name: "System Update", icon: Package, subs: [], route: "updater.index" },
    { name: "Digital Products", icon: Package, subs: [], route: "platform.digital-hub" },
    { name: "Newsletter Hub", icon: Mail, subs: [], route: "platform.newsletter-hub" }
  ] : [
    // ── Store Admin Panel — Restored Full Legacy Experience ──────────────
    // Scoped to /s/{store_slug}/admin/... to maintain SaaS isolation.
    {
      name: "Home",
      icon: Home,
      subs: [],
      route: store ? "store.home" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Executive Dashboard",
      icon: LayoutDashboard,
      subs: [],
      route: store ? "store.admin.dashboard" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "User Management",
      icon: Users,
      subs: [],
      route: store ? "store.admin.users" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "System Settings",
      icon: Settings,
      subs: [],
      route: store ? "store.admin.settings" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Data & Backup",
      icon: HardDrive,
      subs: [],
      route: store ? "store.admin.data" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    // OVERRIDE: Backups feature strictly removed from tenant admin panel for structural security.
    {
      name: "Activity Log",
      icon: History,
      subs: [],
      route: store ? "store.admin.logs" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Recycle Bin",
      icon: Trash2,
      subs: [],
      route: store ? "store.admin.recycle-bin.index" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    // Subscription page is hidden in demo stores — they have no billing
    ...!is_demo ? [{
      name: "Subscription",
      icon: CreditCard,
      subs: [],
      route: store ? "store.billing" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    }] : [],
    {
      name: "Agent Inbox",
      icon: MessageSquare,
      subs: [],
      route: store ? "store.admin.chatbot.inbox" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Chatbot Settings",
      icon: Sparkles,
      subs: [],
      route: store ? "store.admin.chatbot.settings" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    }
  ];
  const MENU_PERMISSIONS = {
    "Home": [],
    "Dashboard": [],
    "Administration": ["admin.settings_manage", "users.manage"],
    "Settings": ["admin.settings_manage"],
    "AI Scan": ["pos", "sales", "purchases"],
    // Sell: only roles that can actually create sales or open POS sessions
    "Sell": ["sales.create", "sales.view"],
    // Purchase: only roles that can create purchase orders
    "Purchase": ["purchases.create"],
    // Stock: only roles that can manage/adjust inventory (not read-only view)
    "Stock": ["inventory.create", "inventory.adjust", "inventory.edit"],
    // Contacts: owner/admin/manager bypass above; others need purchases.suppliers
    "Contacts": ["purchases.suppliers", "admin.staff_view"],
    // Money: anyone with finance access
    "Money": ["finance.balances", "finance.transactions", "finance.expenses"],
    "VenSynQ": ["sales.create", "inventory.adjust"],
    "Insights": ["reports"],
    "Activity Log": ["audit"],
    "Recycle Bin": ["settings"],
    "Agent Inbox": ["settings"],
    "Chatbot Settings": ["settings"],
    // 'Settings': ['settings'], // Removed
    // 'System': ['settings', 'audit'], // Removed
    "Overview": [],
    "System Health": [],
    "Plans & Limits": [],
    "Platforms": [],
    "Coupons": [],
    "Tenant Overrides": [],
    "Stores": [],
    "Platform Users": [],
    "Revenue": [],
    "Support": [],
    "Activity Feed": [],
    "Demo Store": [],
    "System Update": [],
    "Staff Summaries": ["users"],
    "Staff Attendance": ["users"],
    "System Settings": ["settings"],
    "Database": ["settings"]
  };
  const rawMenuItems = mode === "admin" && isPlatformAdmin && !store ? adminMenuItems : appMenuItems;
  const menuItems = rawMenuItems.filter((item) => {
    if (item.name === "VenSynQ" && !vensynq_enabled) {
      return false;
    }
    if (item.name === "Agent Inbox" || item.name === "Chatbot Settings") {
      const isStaff = isPlatformAdmin || !!props.auth?.user?.is_platform_staff;
      if (!isStaff) return false;
      if (isStarterOrLtd1) return false;
    }
    if (isPlatformAdmin) return true;
    if (userRole === "owner" || userRole === "admin" || userRole === "manager") return true;
    const required = MENU_PERMISSIONS[item.name];
    if (item.name === "Home" || item.name === "Appearance") return true;
    if (!required || required.length === 0) return false;
    return required.some(
      (req) => userPerms.some((p) => p === req || p.startsWith(req + "."))
    );
  });
  const toggleMenu = (menuName) => {
    if (expandedMenu === menuName) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(menuName);
    }
  };
  const handleHoverExpand = useCallback((menuKey) => {
    if (!isSidebarOpen) {
      wasHoverExpandedRef.current = true;
      setIsSidebarOpen(true);
      setExpandedMenu(menuKey);
    }
  }, [isSidebarOpen]);
  const handleSidebarMouseLeave = useCallback(() => {
    if (wasHoverExpandedRef.current && isSidebarOpen) {
      setTimeout(() => {
        if (wasHoverExpandedRef.current) {
          setIsSidebarOpen(false);
          setExpandedMenu(null);
          wasHoverExpandedRef.current = false;
        }
      }, 300);
    }
  }, [isSidebarOpen]);
  const handleManualToggle = useCallback(() => {
    wasHoverExpandedRef.current = false;
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);
  const handleSidebarInteraction = useCallback(() => {
    wasHoverExpandedRef.current = false;
  }, []);
  const [posSeniorModeTick, setPosSeniorModeTick] = useState(0);
  useEffect(() => {
    const handlePosSeniorModeChanged = () => setPosSeniorModeTick((t) => t + 1);
    window.addEventListener("vq:pos-senior-mode-changed", handlePosSeniorModeChanged);
    return () => window.removeEventListener("vq:pos-senior-mode-changed", handlePosSeniorModeChanged);
  }, []);
  useEffect(() => {
    let posSeniorOverride = null;
    try {
      const raw = sessionStorage.getItem("pos_senior_mode");
      if (raw !== null) posSeniorOverride = JSON.parse(raw);
    } catch (_) {
    }
    let fontSize = "16px";
    let scale = (parseInt(settings?.ui_scale) || 100) / 100;
    const seniorActive = posSeniorOverride !== null ? posSeniorOverride : settings?.senior_mode === "1";
    if (seniorActive) {
      fontSize = "20px";
    } else if (isLargeText) {
      fontSize = "18px";
    }
    document.documentElement.style.fontSize = fontSize;
    document.documentElement.style.setProperty("--ui-scale", scale.toString());
    if (scale !== 1) {
      document.body.style.transform = `scale(${scale})`;
      document.body.style.transformOrigin = "top left";
      document.body.style.width = `${100 / scale}%`;
      document.body.style.height = `${100 / scale}%`;
    } else {
      document.body.style.transform = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }
  }, [isLargeText, settings?.senior_mode, settings?.ui_scale, posSeniorModeTick]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (displayMenuRef.current && !displayMenuRef.current.contains(event.target)) {
        setIsDisplayMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (growthRef.current && !growthRef.current.contains(event.target)) {
        setIsGrowthOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(CommandPalette, {}),
    /* @__PURE__ */ jsx(UpgradeModal, {}),
    /* @__PURE__ */ jsx(ImpersonationBanner, {}),
    /* @__PURE__ */ jsxs("div", { className: `fixed inset-0 overflow-hidden flex bg-surface text-ink font-sans transition-colors duration-slow`, children: [
      /* @__PURE__ */ jsx("style", { children: `
 .custom-scrollbar::-webkit-scrollbar {
 display: none;
 }
 .custom-scrollbar {
 -ms-overflow-style: none;
 scrollbar-width: none;
 }
 @media (max-width: 1023px) {
 ::-webkit-scrollbar {
 display: none !important;
 }
 * {
 -ms-overflow-style: none !important;
 scrollbar-width: none !important;
 }
 }
 @keyframes fadeIn {
 from { opacity: 0; transform: translateY(10px); }
 to { opacity: 1; transform: translateY(0); }
 }
 :root {
 --ui-scale: ${settings?.ui_scale ? settings.ui_scale / 100 : 1};
 }
 /* Draggable region for custom title bar */
 .amd-draggable {
 -webkit-app-region: drag;
 }
 .amd-no-drag {
 -webkit-app-region: no-drag;
 }
` }),
      mobileSidebarOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 z-drawer lg:hidden", onClick: () => setMobileSidebarOpen(false) }),
      !fullScreen && !hideSidebar && /* @__PURE__ */ jsxs(
        "aside",
        {
          ref: sidebarRef,
          onMouseLeave: handleSidebarMouseLeave,
          onClick: handleSidebarInteraction,
          className: `
 fixed lg:relative inset-y-0 lg:inset-auto lg:top-0 left-0 h-full shrink-0 z-drawer lg:z-40
 transform lg:transform-none transition-all duration-slow lg:duration-slower lg:ease-[cubic-bezier(0.2,0.8,0.2,1)]
 flex flex-col amd-no-drag
 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
 ${isPlatformAdmin && !store ? isDarkMode ? "bg-neutral-950/95 backdrop-blur-2xl border-r border-white/5" : "bg-white border-r border-line" : "bg-surface border-r border-line dark:border-line"}
 ${showExpandedSidebar ? "w-[280px]" : "w-[280px] lg:w-[88px]"}
 ${isPlatformAdmin && !store ? isDarkMode ? "m-4 rounded-xl h-[calc(100vh-32px)] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]" : "border-r border-line shadow-sm transition-all" : ""}
`,
          children: [
            /* @__PURE__ */ jsx("div", { className: "h-24 flex items-center justify-center shrink-0 relative z-10", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: store?.logo_url && !store.logo_url.includes("logo.png") ? store.logo_url : "/images/icon.svg",
                alt: "Logo",
                className: "w-16 h-16 object-contain drop-shadow-md transition-all duration-normal"
              }
            ) }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleManualToggle,
                className: `
 hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-surface border border-line rounded-full shadow-md z-50 items-center justify-center text-ink-muted hover:text-brand-500 transition-all group
 ${!showExpandedSidebar && "rotate-180"}
`,
                children: /* @__PURE__ */ jsx(ChevronLeft, { size: 14, className: "transition-transform" })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto py-6 px-4 custom-scrollbar relative z-10", onClick: () => setMobileSidebarOpen(false), children: [
              menuItems.map((item) => /* @__PURE__ */ jsx(
                SidebarItem,
                {
                  id: item.name === "Stock" ? "tour-sidebar-stock" : `tour-sidebar-${item.name.toLowerCase()}`,
                  name: tt(item.name),
                  icon: item.icon,
                  subItems: item.subs,
                  route: item.route,
                  routeParams: item.routeParams || { store_slug: store?.slug },
                  menuKey: item.name,
                  onHoverExpand: handleHoverExpand,
                  isPlatformHQ: isPlatformAdmin && !store,
                  isExpanded: showExpandedSidebar,
                  isMenuExpanded: expandedMenu === item.name || expandedMenu === null && activeMenu === "Home" && item.name === "Dashboard",
                  isActive: activeMenu === item.name || item.name === "Dashboard" && activeMenu === "Home",
                  onToggle: () => {
                    if (item.onClick) {
                      item.onClick();
                      return;
                    }
                    toggleMenu(item.name);
                    if (!showExpandedSidebar) setIsSidebarOpen(true);
                  },
                  onClick: item.onClick
                },
                item.name
              )),
              !(isPlatformAdmin && !store) && /* @__PURE__ */ jsx("div", { className: "mt-4 pt-4 border-t border-line px-1", children: /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setIsActivityHubModalOpen(true),
                  className: `
										w-full flex items-center justify-between p-2.5 rounded-xl transition-all border group
										${totalActiveOps > 0 ? "bg-brand-50/80 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/30 shadow-xs" : "bg-surface text-ink-muted border-line hover:text-ink hover:bg-interactive-hover"}
										${!showExpandedSidebar && "justify-center"}
									`,
                  title: `Activity Hub (${totalActiveOps} active operations)`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx(Activity, { size: 18, className: totalActiveOps > 0 ? "text-brand-500 animate-pulse" : "text-ink-muted" }),
                        totalActiveOps > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" })
                      ] }),
                      showExpandedSidebar && /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-wider", children: "Activity Hub" })
                    ] }),
                    showExpandedSidebar && /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-2xs font-bold transition-all ${totalActiveOps > 0 ? "bg-brand-500 text-white shadow-xs" : "bg-sunken text-ink-muted"}`, children: totalActiveOps })
                  ]
                }
              ) }),
              mode === "admin" && !(isPlatformAdmin && !store) && /* @__PURE__ */ jsx("div", { className: "mt-4 px-2", children: /* @__PURE__ */ jsxs(
                Link,
                {
                  href: store ? route("store.dashboard", { store_slug: store.slug }) : "#",
                  className: `
 flex items-center gap-3 w-full p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-all font-medium border border-brand-100 dark:border-brand-800
 ${!showExpandedSidebar && "justify-center"}
`,
                  title: "Back to Store",
                  children: [
                    /* @__PURE__ */ jsx(LogOut, { size: 20, className: "rotate-180" }),
                    showExpandedSidebar && /* @__PURE__ */ jsx("span", { children: "Back to Store" })
                  ]
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: `border-t border-line shrink-0 flex flex-col gap-3 relative z-10 ${showExpandedSidebar ? "p-4" : "p-2"}`, ref: userMenuRef, children: [
              store && !(isPlatformAdmin && !store) && (!enabledModuleSet || enabledModuleSet.has("pos")) && (userRole === "owner" || userRole === "admin" || userRole === "manager" || userRole === "cashier" || hasAnyPerm("pos")) && /* @__PURE__ */ jsxs(
                Link,
                {
                  href: store ? isPosRoute ? route("store.dashboard", { store_slug: store.slug }) : route("store.pos", { store_slug: store.slug }) : "#",
                  className: `
 flex items-center justify-center gap-3 w-full py-4 rounded-2xl transition-all duration-slow group relative overflow-hidden shadow-lg
 ${showExpandedSidebar ? "px-4" : "px-0"}
`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-neutral-900 z-0", children: [
                      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-brand-600/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-brand-600/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex items-center gap-3 text-white", children: [
                      /* @__PURE__ */ jsx(Monitor, { size: 24, className: "transition-transform duration-slow" }),
                      /* @__PURE__ */ jsx("span", { className: `font-bold tracking-wide whitespace-nowrap transition-all duration-slow ${showExpandedSidebar ? "w-auto opacity-100" : "w-0 opacity-0 hidden"}`, children: isPosRoute ? "Close POS" : "Open POS" })
                    ] })
                  ]
                }
              ),
              isUserMenuOpen && /* @__PURE__ */ jsxs("div", { className: "absolute bottom-20 left-4 w-56 bg-surface rounded-[14px] shadow-xl border border-line p-2 z-50 animate-in fade-in slide-in-from-bottom-2", children: [
                props.auth?.my_stores_count > 1 && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setIsUserMenuOpen(false);
                      setIsStoreSwitcherModalOpen(true);
                    },
                    className: "flex items-center justify-between w-full p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors text-sm font-medium text-ink-secondary dark:text-ink group mb-1",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                        /* @__PURE__ */ jsx(Store, { size: 16, className: "text-brand-500 group-hover:scale-110 transition-transform" }),
                        /* @__PURE__ */ jsx("span", { children: "Switch Store" })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 max-w-[75px] truncate", children: store?.name })
                    ]
                  }
                ),
                store && /* @__PURE__ */ jsxs(Link, { href: route("store.profile.edit", { store_slug: store.slug }), className: "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors text-sm font-medium text-ink-secondary dark:text-ink", children: [
                  /* @__PURE__ */ jsx(User, { size: 16 }),
                  " Profile Settings"
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      localStorage.removeItem("amd_onboarding_driver_complete");
                      window.location.reload();
                    },
                    className: "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors text-sm font-medium text-brand-600 dark:indigo-400",
                    children: [
                      /* @__PURE__ */ jsx(Sparkles, { size: 16 }),
                      " Take a Tour"
                    ]
                  }
                ),
                userRole === "platform_admin" && /* @__PURE__ */ jsxs(Link, { href: "/updater", className: "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-sm font-medium text-amber-600 dark:text-amber-400", children: [
                  /* @__PURE__ */ jsx(Package, { size: 16 }),
                  " System Update"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-px bg-sunken my-1" }),
                /* @__PURE__ */ jsxs(Link, { href: route("logout"), method: "post", as: "button", className: "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors text-sm font-medium", children: [
                  /* @__PURE__ */ jsx(LogOut, { size: 16 }),
                  " Logout"
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: `flex items-center ${showExpandedSidebar ? "justify-start px-3 gap-3" : "justify-center px-0 gap-0"} w-full py-2.5 rounded-2xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors border border-transparent hover:border-line dark:hover:border-line-strong`,
                  onClick: () => setIsUserMenuOpen(!isUserMenuOpen),
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md ring-2 ring-white dark:ring-line", children: (() => {
                      const name = props.auth?.user?.name || "";
                      const email = props.auth?.user?.email || "?";
                      if (name) {
                        const parts = name.split(" ");
                        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                        return name.substring(0, 2).toUpperCase();
                      }
                      return email.substring(0, 2).toUpperCase();
                    })() }),
                    /* @__PURE__ */ jsxs("div", { className: `text-left transition-all duration-slow overflow-hidden ${showExpandedSidebar ? "w-auto opacity-100" : "w-0 opacity-0"}`, children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink truncate max-w-[120px]", children: props.auth?.user?.name || props.auth?.user?.email }),
                      /* @__PURE__ */ jsx("p", { className: "text-2xs font-semibold text-ink-muted uppercase tracking-wider", children: props.auth?.user?.role === "platform_admin" ? "Hashmi Dashboard" : props.auth?.user?.role || "User" })
                    ] })
                  ]
                }
              )
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("main", { className: `flex-1 flex flex-col h-full min-w-0 relative bg-[var(--vq-bg)] transition-opacity duration-slower ease-in-out opacity-100`, children: [
        /* @__PURE__ */ jsx(DemoBanner, {}),
        /* @__PURE__ */ jsx(LimitGraceBanner, {}),
        (() => {
          if (!store || is_demo) return null;
          let daysLeft = null;
          let isTrial2 = store.status === "trial";
          let targetDate = isTrial2 ? store.trial_ends_at : store.subscription_ends_at;
          if (targetDate) {
            const diffMs = new Date(targetDate).getTime() - (/* @__PURE__ */ new Date()).getTime();
            daysLeft = Math.max(0, Math.ceil(diffMs / (1e3 * 3600 * 24)));
          }
          if (daysLeft !== null && !isTrial2 && daysLeft <= 7 && store.status !== "suspended") {
            const isUrgent = daysLeft <= 3;
            const isWarning = daysLeft > 3 && daysLeft <= 7;
            let bannerColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
            let btnColor = "bg-emerald-500 hover:bg-emerald-600";
            if (isWarning) {
              bannerColor = "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
              btnColor = "bg-amber-500 hover:bg-amber-600";
            }
            if (isUrgent) {
              bannerColor = "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/30";
              btnColor = "bg-red-500 hover:bg-red-600";
            }
            return /* @__PURE__ */ jsxs("div", { className: `w-full px-4 py-2 text-sm font-medium flex items-center justify-between shrink-0 border-b ${bannerColor}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Activity, { size: 16, className: isUrgent ? "animate-pulse" : "" }),
                /* @__PURE__ */ jsx("span", { children: isTrial2 ? `Your free trial expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}.` : `Your subscription expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}.` })
              ] }),
              /* @__PURE__ */ jsx(Link, { href: `/s/${store.slug}/billing`, className: `px-3 py-1 rounded-md text-xs font-bold text-white transition-colors ${btnColor}`, children: "Upgrade Now" })
            ] });
          }
          if (store.status === "suspended") {
            return /* @__PURE__ */ jsxs("div", { className: "w-full px-4 py-2 text-sm font-bold bg-neutral-900 text-white flex items-center justify-between shrink-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(X, { size: 16, className: "text-red-500" }),
                /* @__PURE__ */ jsx("span", { children: "Your subscription has expired. The system is in locked mode." })
              ] }),
              /* @__PURE__ */ jsx(Link, { href: `/s/${store.slug}/billing`, className: "px-3 py-1 rounded-md text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 transition-colors", children: "Upgrade Plan" })
            ] });
          }
          return null;
        })(),
        /* @__PURE__ */ jsx(PlanUsageBanner, {}),
        /* @__PURE__ */ jsx(SubscriptionExpiryBanner, {}),
        (fullScreen || hideHeader) && /* @__PURE__ */ jsx("div", { className: "fixed top-4 left-1/2 -translate-x-1/2 z-nav pointer-events-none flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "pointer-events-auto", children: /* @__PURE__ */ jsx(AiIsland, { compact: true }) }) }),
        !hideHeader && !fullScreen && /* @__PURE__ */ jsxs("header", { className: "h-16 px-6 flex items-center justify-between z-nav relative shrink-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-ink-muted min-w-[100px] z-10", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "lg:hidden h-11 w-11 flex items-center justify-center rounded-xl text-ink-muted hover:text-brand-600 hover:bg-brand-50 transition-colors border border-line",
                onClick: () => setMobileSidebarOpen(true),
                children: /* @__PURE__ */ jsx(Menu, { size: 20 })
              }
            ),
            store && !(isPlatformAdmin && !store) && mode === "admin" && /* @__PURE__ */ jsxs(
              Link,
              {
                id: "tour-sidebar-admin",
                href: store ? route("store.home", { store_slug: store.slug }) : "#",
                className: "hidden sm:flex group relative items-center gap-2 h-11 px-3.5 rounded-xl border bg-surface text-ink-secondary dark:text-ink border-line hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-slow",
                children: [
                  /* @__PURE__ */ jsx(Home, { size: 16, className: "text-brand-500" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink", children: "Home" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { id: "tour-omnisearch", className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "pointer-events-auto", children: /* @__PURE__ */ jsx(AiIsland, {}) }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 sm:gap-3 min-w-[100px] z-10", children: [
            isTrial && !is_demo && /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.billing", { store_slug: store?.slug }),
                className: "hidden sm:flex items-center gap-2 h-11 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all group shadow-sm ",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-2xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em] leading-none", children: [
                    trialDaysLeft,
                    "d Left"
                  ] })
                ]
              }
            ),
            showClock && /* @__PURE__ */ jsxs("div", { className: "hidden xl:flex items-center gap-2 h-11 px-3.5 rounded-xl bg-surface border border-line text-xs font-bold text-ink-secondary dark:text-ink shrink-0 font-mono shadow-sm", children: [
              /* @__PURE__ */ jsx(Clock, { size: 14, className: "text-brand-500 dark:text-brand-400 animate-[pulse_2s_infinite]" }),
              /* @__PURE__ */ jsx("span", { children: currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "hidden lg:block", children: /* @__PURE__ */ jsx(CharityButton, {}) }),
            /* @__PURE__ */ jsxs("div", { className: "hidden lg:block relative", ref: displayMenuRef, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setIsDisplayMenuOpen(!isDisplayMenuOpen),
                  className: `h-11 w-11 flex items-center justify-center rounded-xl transition-all border shadow-sm relative ${isDisplayMenuOpen ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 border-brand-200 dark:border-brand-800" : "bg-surface text-ink-secondary hover:text-brand-600 hover:shadow-md border-line"}`,
                  title: "Theme & Header Preferences",
                  children: /* @__PURE__ */ jsx(Settings2, { size: 18 })
                }
              ),
              isDisplayMenuOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-72 bg-surface rounded-[14px] shadow-xl border border-line z-dropdown overflow-hidden animate-in fade-in zoom-in-95 origin-top-right p-2.5 space-y-2", children: [
                /* @__PURE__ */ jsx("div", { className: "px-2 pt-1 pb-1 text-3xs font-bold uppercase tracking-wider text-ink-muted", children: "Theme Appearance" }),
                /* @__PURE__ */ jsx("div", { className: "flex items-center p-1 bg-sunken rounded-xl gap-1", children: [
                  { id: "light", label: "Light" },
                  { id: "dark", label: "Dark" },
                  { id: "system", label: "System" }
                ].map((t) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => toggleAppTheme(t.id),
                    className: `flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${appearance?.mode === t.id || !appearance?.mode && t.id === (isEffectiveDarkMode ? "dark" : "light") ? "bg-surface shadow-sm text-brand-600 font-bold" : "text-ink-muted hover:text-ink"}`,
                    children: t.label
                  },
                  t.id
                )) }),
                /* @__PURE__ */ jsx("div", { className: "h-px bg-line my-1" }),
                /* @__PURE__ */ jsx("div", { className: "px-2 pt-1 pb-1 text-3xs font-bold uppercase tracking-wider text-ink-muted", children: "Header Preferences" }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: toggleClockVisibility,
                    className: "w-full flex items-center justify-between p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary transition-all",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                        /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-brand-500 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Digital Clock" })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full relative transition-colors ${showClock ? "bg-brand-500" : "bg-sunken"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showClock ? "left-4.5" : "left-0.5"}` }) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      const newValue = settings?.senior_mode === "1" ? "0" : "1";
                      router.post(route("store.settings.update", {
                        store_slug: store.slug
                      }), {
                        settings: { ...settings, senior_mode: newValue }
                      }, { preserveScroll: true });
                    },
                    className: `w-full flex items-center justify-between p-2 rounded-xl transition-all ${settings?.senior_mode === "1" ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600" : "hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary"}`,
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                        /* @__PURE__ */ jsx(Type, { size: 16, className: "shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Senior Mode" })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full relative transition-colors ${settings?.senior_mode === "1" ? "bg-brand-500" : "bg-sunken"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings?.senior_mode === "1" ? "left-4.5" : "left-0.5"}` }) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      const newValue = String(settings?.charity_enabled) === "1" || settings?.charity_enabled === true ? "0" : "1";
                      router.post(route("store.settings.update", {
                        store_slug: store.slug
                      }), {
                        settings: { ...settings, charity_enabled: newValue }
                      }, { preserveScroll: true });
                    },
                    className: `w-full flex items-center justify-between p-2 rounded-xl transition-all ${String(settings?.charity_enabled) === "1" || settings?.charity_enabled === true ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" : "hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary"}`,
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                        /* @__PURE__ */ jsx(HeartHandshake, { size: 16, className: "text-rose-500 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Charity Donations" })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full relative transition-colors ${String(settings?.charity_enabled) === "1" || settings?.charity_enabled === true ? "bg-rose-500" : "bg-sunken"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${String(settings?.charity_enabled) === "1" || settings?.charity_enabled === true ? "left-4.5" : "left-0.5"}` }) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "h-px bg-line my-1" }),
                /* @__PURE__ */ jsx("div", { className: "px-2 pt-1 pb-1 text-3xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between", children: /* @__PURE__ */ jsx("span", { children: "Dashboard Customizer" }) }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setIsDisplayMenuOpen(false);
                      handleEditLayout();
                    },
                    className: "w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-all text-sm font-semibold",
                    children: [
                      /* @__PURE__ */ jsx(PenLine, { size: 16, className: "text-brand-500 shrink-0" }),
                      /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Edit Layout" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setIsDisplayMenuOpen(false);
                      handleAddCard();
                    },
                    className: "w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-all text-sm font-semibold",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { size: 16, className: "text-emerald-500 shrink-0" }),
                      /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Add Card" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setIsDisplayMenuOpen(false);
                      handleToggleSidePanel();
                    },
                    className: "w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-all text-sm font-semibold",
                    children: [
                      /* @__PURE__ */ jsx(PanelRight, { size: 16, className: "text-indigo-500 shrink-0" }),
                      /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Side Panel" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setIsDisplayMenuOpen(false);
                      handleStartFresh();
                    },
                    className: "w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-amber-600 dark:text-amber-400 transition-all text-sm font-semibold",
                    children: [
                      /* @__PURE__ */ jsx(RotateCcw, { size: 16, className: "text-amber-500 shrink-0" }),
                      /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Start Fresh…" })
                    ]
                  }
                ),
                props.auth?.my_stores_count > 1 && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setIsDisplayMenuOpen(false);
                      setIsStoreSwitcherModalOpen(true);
                    },
                    className: "w-full flex items-center justify-between p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary transition-all",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                        /* @__PURE__ */ jsx(Store, { size: 16, className: "text-brand-500 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Switch Store" })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 max-w-[80px] truncate", children: store?.name })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "lg:hidden relative", ref: mobileMenuRef, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
                  className: `h-11 w-11 flex items-center justify-center rounded-xl transition-all border shadow-sm relative ${isMobileMenuOpen ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 border-brand-200 dark:border-brand-800" : "bg-surface text-ink-secondary hover:text-brand-600 hover:shadow-md border-line"}`,
                  title: "More Options",
                  children: /* @__PURE__ */ jsx(MoreVertical, { size: 18 })
                }
              ),
              isMobileMenuOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-64 bg-surface rounded-[14px] shadow-xl border border-line z-dropdown overflow-hidden animate-in fade-in zoom-in-95 origin-top-right p-2 space-y-2", children: [
                (props.auth?.my_stores_count > 1 || String(settings?.charity_enabled) === "1" || settings?.charity_enabled === true) && /* @__PURE__ */ jsxs("div", { className: "p-2 border-b border-line flex items-center justify-between gap-3", children: [
                  props.auth?.my_stores_count > 1 ? /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setIsMobileMenuOpen(false);
                        setIsStoreSwitcherModalOpen(true);
                      },
                      className: "flex-1 flex items-center justify-between p-2 rounded-xl bg-app border border-line hover:border-brand-400 text-ink-secondary hover:text-brand-600 transition-all text-left",
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx(Store, { size: 15, className: "text-brand-500" }),
                          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold truncate max-w-[100px]", children: store?.name })
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-brand-600", children: "Switch" })
                      ]
                    }
                  ) : /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-ink-secondary pl-2", children: "Charity Donations" }),
                  (String(settings?.charity_enabled) === "1" || settings?.charity_enabled === true) && /* @__PURE__ */ jsx("div", { className: "flex-none", children: /* @__PURE__ */ jsx(CharityButton, {}) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1 border-b border-line pb-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "px-2 pt-1 pb-0.5 text-3xs font-bold uppercase tracking-wider text-ink-muted", children: "Dashboard Layout" }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setIsMobileMenuOpen(false);
                        handleEditLayout();
                      },
                      className: "w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-all text-sm font-semibold",
                      children: [
                        /* @__PURE__ */ jsx(PenLine, { size: 16, className: "text-brand-500 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Edit Layout" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setIsMobileMenuOpen(false);
                        handleAddCard();
                      },
                      className: "w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-all text-sm font-semibold",
                      children: [
                        /* @__PURE__ */ jsx(Plus, { size: 16, className: "text-emerald-500 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Add Card" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setIsMobileMenuOpen(false);
                        handleToggleSidePanel();
                      },
                      className: "w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-all text-sm font-semibold",
                      children: [
                        /* @__PURE__ */ jsx(PanelRight, { size: 16, className: "text-indigo-500 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Side Panel" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setIsMobileMenuOpen(false);
                        handleStartFresh();
                      },
                      className: "w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-amber-600 dark:text-amber-400 transition-all text-sm font-semibold",
                      children: [
                        /* @__PURE__ */ jsx(RotateCcw, { size: 16, className: "text-amber-500 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Start Fresh…" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        const newValue = settings?.senior_mode === "1" ? "0" : "1";
                        router.post(route("store.settings.update", {
                          store_slug: store.slug
                        }), {
                          settings: { ...settings, senior_mode: newValue }
                        }, { preserveScroll: true });
                      },
                      className: `w-full flex items-center justify-between p-3 rounded-xl transition-all ${settings?.senior_mode === "1" ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600" : "hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary"}`,
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx(Type, { size: 16 }),
                          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Senior Mode" })
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full relative transition-colors ${settings?.senior_mode === "1" ? "bg-brand-500" : "bg-sunken"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings?.senior_mode === "1" ? "left-4.5" : "left-0.5"}` }) })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: toggleAppTheme,
                      className: `w-full flex items-center justify-between p-3 rounded-xl transition-all ${isEffectiveDarkMode ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600" : "hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary"}`,
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          isEffectiveDarkMode ? /* @__PURE__ */ jsx(Sun, { size: 16 }) : /* @__PURE__ */ jsx(Moon, { size: 16 }),
                          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: isEffectiveDarkMode ? "Light Mode" : "Dark Mode" })
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full relative transition-colors ${isEffectiveDarkMode ? "bg-brand-500" : "bg-sunken"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isEffectiveDarkMode ? "left-4.5" : "left-0.5"}` }) })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "border-t border-line pt-2 space-y-1", children: [
                  store && /* @__PURE__ */ jsxs(Link, { href: route("store.profile.edit", { store_slug: store.slug }), className: "flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors text-sm font-medium text-ink-secondary dark:text-ink", children: [
                    /* @__PURE__ */ jsx(User, { size: 16 }),
                    " Profile Settings"
                  ] }),
                  /* @__PURE__ */ jsxs(Link, { href: route("logout"), method: "post", as: "button", className: "flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors text-sm font-medium", children: [
                    /* @__PURE__ */ jsx(LogOut, { size: 16 }),
                    " Logout"
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `flex-1 min-h-0 overflow-y-auto animate-[fadeIn_0.4s_ease-out] ${noPadding ? "" : "p-6"}`, children: [
          children,
          showMobileNavBar && /* @__PURE__ */ jsx("div", { className: "lg:hidden w-full shrink-0", style: { height: "80px" }, "aria-hidden": "true" })
        ] })
      ] }),
      isIdle && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-drawer bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-slower", children: /* @__PURE__ */ jsxs("div", { className: "text-center text-white space-y-6 max-w-lg p-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse", children: /* @__PURE__ */ jsx(Clock, { size: 48, className: "text-brand-400" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold tracking-tight", children: "Session Paused" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xl text-neutral-300", children: [
          "We haven't detected any activity for ",
          parseInt(settings?.auto_logout) || 60,
          " minutes. Your session has been paused to secure your work."
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsIdle(false),
            className: "px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-lg shadow-lg transition-all",
            children: "I'm Back, Resume Work"
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(PwaInstallPrompt, {}),
    /* @__PURE__ */ jsx(VersionChecker, {}),
    /* @__PURE__ */ jsx(OnboardingDriver, {}),
    /* @__PURE__ */ jsx(GlobalOnboardingWidget, { store }),
    /* @__PURE__ */ jsx(
      ActivityHubModal,
      {
        isOpen: isActivityHubModalOpen,
        onClose: () => setIsActivityHubModalOpen(false),
        store,
        modules: Array.isArray(props?.modules) ? props.modules : null,
        currentUrl: url,
        visibleInvoices,
        currentInvoiceId,
        onSelectInvoice: (id) => {
          setCurrentInvoiceId(id);
          setIsActivityHubModalOpen(false);
          if (!url.includes("/sales/invoice/create")) {
            router.visit(route("store.sales.invoice.create", { store_slug: store?.slug }));
          }
        },
        userPosSessions,
        currentPosId,
        onSelectPos: (id) => {
          setCurrentPosId(id);
          setIsActivityHubModalOpen(false);
          if (!url.startsWith("/pos")) {
            router.visit(route("store.pos", { store_slug: store?.slug }));
          }
        },
        visiblePurchases,
        currentPurchaseId,
        onSelectPurchase: (id) => {
          setCurrentPurchaseId(id);
          setIsActivityHubModalOpen(false);
          if (!url.includes("/purchases/create")) {
            router.visit(route("store.purchases.create", { store_slug: store?.slug }));
          }
        },
        totalActiveOps
      }
    ),
    /* @__PURE__ */ jsx(
      StoreSwitcherModal,
      {
        isOpen: isStoreSwitcherModalOpen,
        onClose: () => setIsStoreSwitcherModalOpen(false)
      }
    ),
    showMobileNavBar && /* @__PURE__ */ jsx(
      BottomNavBar,
      {
        store,
        modules: props?.modules,
        onOpenMore: () => setMobileSidebarOpen(true)
      }
    ),
    /* @__PURE__ */ jsx(Toast, { toasts, removeToast, duration: 4e3 }),
    /* @__PURE__ */ jsx("style", { children: `
 @media (max-width: 1023px) {
 /* Hide FABs by translating down */
 div[class*="z-sticky"],
 div[class*="z-drawer"],
 div[class*="z-modal"] {
 transform: translateY(400px) !important;
 opacity: 0 !important;
 pointer-events: none !important;
 transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease !important;
 }
 /* Slide up when active and offset slightly higher to clear bottom bar/bud overlap */
 body.mobile-fabs-expanded div[class*="z-sticky"],
 body.mobile-fabs-expanded div[class*="z-drawer"],
 body.mobile-fabs-expanded div[class*="z-modal"] {
 transform: translateY(-20px) !important;
 opacity: 1 !important;
 pointer-events: auto !important;
 }
 }
` })
  ] });
}
export {
  LockedFeature as L,
  OneGlanceLayout as O,
  Toast as T,
  getReportDecisionMessage as a,
  getReportTier as g,
  isReportLocked as i
};

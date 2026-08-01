import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePage, router, Link } from "@inertiajs/react";
import { ChevronDown, Loader2, Check, ArrowRight, Plus, Lock, ChevronRight, Home, ShoppingCart, Package, Users, BarChart2, Settings, Truck, CreditCard, DollarSign, FileText, Calculator, Tag, Search, Command, Box, Layers, ArrowRightLeft, Building2, Activity, BookOpen, TrendingUp, Receipt, Clock, UserPlus, Database, Percent, Shield, History, Trash2, Download, Sparkles, PlusCircle, FilePlus, Upload, Printer, Brain, Settings2, X, KeyRound, CheckCircle2, User, AlertTriangle, Eye, Zap, Camera, Mic, Type, FilePlus2, RefreshCw, TestTube2, Minimize2, ExternalLink, Send, UserCheck, HeartHandshake, Info, AlertCircle, CheckCircle, Crown, LogOut, LayoutDashboard, ShoppingBag, Wallet, RefreshCcw, Ticket, UserCog, Rss, Monitor, MessageSquare, Mail, HardDrive, ChevronLeft, ShieldCheck, Menu, Sun, Moon, MoreVertical, Bell, ChevronUp, Factory } from "lucide-react";
import axios from "axios";
import { M as Modal, f as useWorkspace, g as useTheme } from "../ssr.js";
import { driver } from "driver.js";
const PLAN_COLORS = {
  trial: "text-amber-400",
  starter: "text-slate-400",
  growth: "text-indigo-400",
  business: "text-purple-400",
  ltd: "text-emerald-400"
};
function StoreSwitcher() {
  const { props } = usePage();
  const store = props.store;
  props.my_role;
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [navigating, setNav] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  const loadStores = useCallback(async () => {
    if (stores !== null) return;
    setLoading(true);
    try {
      const res = await axios.get(route("my-stores.api"));
      setStores(res.data);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [stores]);
  const toggle = () => {
    if (!open) loadStores();
    setOpen((prev) => !prev);
  };
  const switchTo = (s) => {
    if (s.store_id === store?.id) {
      setOpen(false);
      return;
    }
    setNav(s.store_id);
    setOpen(false);
    router.visit(s.url);
  };
  if (!store) return null;
  PLAN_COLORS[store.plan] ?? "text-slate-400";
  return /* @__PURE__ */ jsxs("div", { ref, className: "relative", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: toggle,
        className: `flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 border
                    ${open ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"}`,
        "aria-label": "Switch store",
        "aria-expanded": open,
        children: [
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm leading-none", children: store.name.charAt(0).toUpperCase() }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0 text-left hidden lg:block", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-bold truncate leading-tight", children: store.name }) }),
          /* @__PURE__ */ jsx(
            ChevronDown,
            {
              size: 14,
              className: `shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-indigo-500" : "text-slate-400"}`
            }
          )
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { className: "absolute left-0 right-0 mt-1 z-50 rounded-xl border border-white/12 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150", children: [
      /* @__PURE__ */ jsx("div", { className: "px-3 py-2 border-b border-white/8", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-widest", children: "Your Stores" }) }),
      /* @__PURE__ */ jsx("div", { className: "p-1 max-h-64 overflow-y-auto", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-6", children: /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin text-slate-500" }) }) : stores?.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 text-center py-4", children: "No other stores" }) : stores?.map((s) => {
        const isCurrent = s.store_id === store.id;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => switchTo(s),
            disabled: navigating === s.store_id,
            className: `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left
                                            ${isCurrent ? "bg-indigo-500/10 text-white cursor-default" : "text-slate-300 hover:bg-white/6 hover:text-white active:scale-[0.98]"}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: `w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${isCurrent ? "bg-indigo-500/25 text-indigo-300" : "bg-white/8 text-slate-300"}`, children: s.name.charAt(0).toUpperCase() }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold truncate leading-tight", children: s.name }),
                /* @__PURE__ */ jsxs("p", { className: `text-[10px] capitalize leading-tight ${PLAN_COLORS[s.plan] ?? "text-slate-500"}`, children: [
                  s.plan,
                  " · ",
                  s.role
                ] })
              ] }),
              isCurrent ? /* @__PURE__ */ jsx(Check, { size: 13, className: "text-indigo-400 shrink-0" }) : navigating === s.store_id ? /* @__PURE__ */ jsx(Loader2, { size: 13, className: "animate-spin text-slate-500 shrink-0" }) : /* @__PURE__ */ jsx(ArrowRight, { size: 13, className: "text-slate-600 shrink-0" })
            ]
          },
          s.store_id
        );
      }) }),
      /* @__PURE__ */ jsx("div", { className: "p-1 border-t border-white/8", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            setOpen(false);
            router.visit(route("store.create", { store_slug: store.slug }));
          },
          className: "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/8 transition-all text-sm",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 14 }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Create new store" })
          ]
        }
      ) })
    ] })
  ] });
}
function SecondaryButton({
  type = "button",
  className = "",
  disabled,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      ...props,
      type,
      className: `inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800 ${disabled && "opacity-25"} ` + className,
      disabled,
      children
    }
  );
}
function FeatureLockBadge({
  children,
  isLocked = false,
  className = "",
  showBadge = true
}) {
  const [showModal, setShowModal] = useState(false);
  const handleClick = (e) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    }
  };
  if (!isLocked) return children;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { onClick: handleClick, className: `relative cursor-pointer group ${className}`, children: [
      children,
      showBadge && /* @__PURE__ */ jsx("div", { className: "absolute right-2 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx(Lock, { size: 12, className: "text-amber-500" }) })
    ] }),
    /* @__PURE__ */ jsx(Modal, { show: showModal, onClose: () => setShowModal(false), maxWidth: "sm", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-slate-900 border border-slate-700 rounded-lg shadow-2xl", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 text-center relative z-10", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-900/20 rotate-3 transform group-hover:rotate-6 transition-transform", children: /* @__PURE__ */ jsx(Lock, { size: 32, className: "text-white" }) }),
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2", children: [
          "Coming Soon ",
          /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono uppercase border border-amber-500/30", children: "V1.1" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-300 mb-8 leading-relaxed", children: "This advanced module is part of our upcoming Gold Release expansion. We are currently finalizing the security and performance audits." }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
          SecondaryButton,
          {
            onClick: () => setShowModal(false),
            className: "!bg-slate-800 !text-slate-300 !border-slate-700 hover:!bg-slate-700 hover:!text-white",
            children: "Acknowledge"
          }
        ) })
      ] })
    ] }) })
  ] });
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
  const finalRoute = targetRoute || routeName;
  const hoverTimerRef = useRef(null);
  const handleMouseEnter = useCallback(() => {
    if (!isExpanded && subItems.length > 0 && onHoverExpand) {
      hoverTimerRef.current = setTimeout(() => {
        onHoverExpand(menuKey);
      }, 1e3);
    }
  }, [isExpanded, subItems.length, onHoverExpand, menuKey]);
  const handleMouseLeave = useCallback(() => {
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
            className: `
          flex items-center justify-between p-0 rounded-2xl transition-all duration-300 group relative overflow-hidden
          ${isActive ? "text-white shadow-xl shadow-indigo-500/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}
        `,
            children: [
              isActive && /* @__PURE__ */ jsxs("div", { className: `absolute inset-0 z-0 pointer-events-none ${isPlatformHQ ? "bg-indigo-600/10" : "bg-slate-900"}`, children: [
                /* @__PURE__ */ jsx("div", { className: `absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 ${isPlatformHQ ? "bg-indigo-500/30" : "bg-indigo-600/40"}` }),
                /* @__PURE__ */ jsx("div", { className: `absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 ${isPlatformHQ ? "bg-violet-500/20" : "bg-purple-600/30"}` }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" }),
                /* @__PURE__ */ jsx("div", { className: `absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50` })
              ] }),
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
                    /* @__PURE__ */ jsxs("div", { className: "relative group-hover:scale-125 transition-transform duration-300 origin-center", children: [
                      /* @__PURE__ */ jsx(Icon, { size: isPlatformHQ ? 22 : 20, className: `transition-all duration-300 ${isActive ? isPlatformHQ ? "text-white" : "text-white" : isPlatformHQ ? "text-slate-500 group-hover:text-white" : "group-hover:text-indigo-600"}` }),
                      !isExpanded && subItems.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute -inset-1 rounded-full border-2 border-transparent group-hover:border-indigo-400/50 transition-all duration-300 group-hover:animate-pulse" })
                    ] }),
                    isExpanded && /* @__PURE__ */ jsx("span", { className: `font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isActive ? "text-white" : isPlatformHQ ? "text-slate-400 group-hover:text-white" : "text-slate-500"}`, children: displayName })
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
                  className: "p-3 relative z-10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors rounded-r-2xl",
                  children: /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: `transition-transform duration-300 ${isMenuExpanded ? "rotate-90" : ""} ${isActive ? "text-white" : "group-hover:text-indigo-600"}` })
                }
              ),
              !isExpanded && /* @__PURE__ */ jsxs("div", { className: "absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none", children: [
                label,
                subItems.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 ml-2", children: "(Hold 2s to expand)" }),
                /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: `
        overflow-hidden transition-all duration-300 flex flex-col gap-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800
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
              "Dashboard": "store.dashboard",
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
              // ALL 38 Reports
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
              "Staff Attendance": "store.staff-attendance.index",
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
              /* @__PURE__ */ jsx("p", { className: "px-4 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1", children: item.group }),
              item.items.filter(Boolean).map((subItem, sIdx) => {
                const { label: itemName2, locked: locked2 } = typeof subItem === "object" ? { label: subItem.label, locked: subItem.locked } : { label: subItem, locked: false };
                const baseRoute2 = getRoute(itemName2);
                if (!baseRoute2) {
                  return /* @__PURE__ */ jsx("span", { className: "block pl-4 py-1.5 text-xs text-slate-400 cursor-not-allowed", children: itemName2 }, sIdx);
                }
                const activeRouteName = routeParams?.store_slug && !baseRoute2.startsWith("store.") ? `store.${baseRoute2}` : baseRoute2;
                const isComingSoon = itemName2.includes("Coming Soon");
                return /* @__PURE__ */ jsx(FeatureLockBadge, { isLocked: locked2 || isComingSoon, showBadge: false, children: isComingSoon ? /* @__PURE__ */ jsx("span", { className: "block pl-4 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-600 cursor-pointer", children: itemName2 }) : locked2 ? /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent("amd:plan-limit", {
                        detail: {
                          feature: itemName2.toLowerCase().replace(" ", "_").replace("/", "_"),
                          message: `${itemName2} is not available on your current plan. Please upgrade your plan to unlock.`,
                          current_plan: routeParams?.store_slug ? "starter" : "starter",
                          upgrade_url: routeParams?.store_slug ? `/s/${routeParams.store_slug}/billing/upgrade` : "#",
                          billing_url: routeParams?.store_slug ? `/s/${routeParams.store_slug}/billing` : "#",
                          portal_url: routeParams?.store_slug ? `/s/${routeParams.store_slug}/billing/portal` : "#"
                        }
                      }));
                    },
                    className: "w-full text-left pl-4 py-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors flex justify-between pr-2 group/sub outline-none",
                    children: [
                      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                        itemName2,
                        /* @__PURE__ */ jsx("span", { className: "text-[10px]", children: "🔒" })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-[9px] px-1 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 self-center opacity-0 group-hover/sub:opacity-100 transition-opacity", children: "UPGRADE" })
                    ]
                  }
                ) : window.route().has(activeRouteName) && /* @__PURE__ */ jsx(
                  Link,
                  {
                    id: itemName2 === "Products" ? "tour-sidebar-products" : itemName2 === "Purchases" ? "tour-sidebar-purchases" : void 0,
                    href: window.route(activeRouteName, routeParams || {}),
                    className: "block pl-4 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors",
                    children: itemName2
                  }
                ) }, sIdx);
              })
            ] }, idx);
          }
          const { label: itemName, locked } = typeof item === "object" && !item.group ? { label: item.label, locked: item.locked } : { label: item, locked: false };
          const baseRoute = getRoute(itemName);
          if (!baseRoute) {
            return /* @__PURE__ */ jsx(
              "span",
              {
                className: "block pl-4 py-2 text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed relative",
                children: itemName
              },
              idx
            );
          }
          const routeName2 = routeParams?.store_slug && !baseRoute.startsWith("store.") ? `store.${baseRoute}` : baseRoute;
          return /* @__PURE__ */ jsx(FeatureLockBadge, { isLocked: locked, showBadge: false, children: locked ? /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("amd:plan-limit", {
                  detail: {
                    feature: itemName.toLowerCase().replace(" ", "_").replace("/", "_"),
                    message: `${itemName} is not available on your current plan. Please upgrade your plan to unlock.`,
                    current_plan: routeParams?.store_slug ? "starter" : "starter",
                    upgrade_url: routeParams?.store_slug ? `/s/${routeParams.store_slug}/billing/upgrade` : "#",
                    billing_url: routeParams?.store_slug ? `/s/${routeParams.store_slug}/billing` : "#",
                    portal_url: routeParams?.store_slug ? `/s/${routeParams.store_slug}/billing/portal` : "#"
                  }
                }));
              },
              className: "w-full text-left pl-4 py-2 text-xs font-medium text-slate-400 hover:text-indigo-600 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors flex justify-between pr-2 group/sub outline-none",
              children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                  itemName,
                  /* @__PURE__ */ jsx("span", { className: "text-[10px]", children: "🔒" })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] px-1 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 self-center opacity-0 group-hover/sub:opacity-100 transition-opacity", children: "UPGRADE" })
              ]
            }
          ) : window.route().has(routeName2) && /* @__PURE__ */ jsx(
            Link,
            {
              href: window.route(routeName2, routeParams || {}),
              className: "block pl-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative",
              children: itemName
            }
          ) }, idx);
        }) })
      ]
    }
  );
}
const CommandPalette = () => {
  const { auth, store } = usePage().props;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const userRole = auth.user?.role;
  const userPerms = auth.user?.permissions || [];
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
    { id: "new-sale", name: "New Sale Invoice", keywords: "new sale invoice create", icon: Plus, action: () => router.visit(route("store.sales.create", { store_slug: store?.slug })), category: "Quick Actions" },
    { id: "new-purchase", name: "New Purchase", keywords: "new purchase buy", icon: Truck, action: () => router.visit(route("store.purchases.create", { store_slug: store?.slug })), category: "Quick Actions" },
    { id: "new-product", name: "Add Product", keywords: "new product item add create", icon: Package, action: () => router.visit(route("store.inventory.dashboard", { store_slug: store?.slug }) + "?action=add"), category: "Quick Actions" },
    { id: "new-customer", name: "Add Customer", keywords: "new customer party add create", icon: Users, action: () => router.visit(route("store.parties.index", { store_slug: store?.slug }) + "?action=add&type=customer"), category: "Quick Actions" },
    { id: "new-expense", name: "Add Expense", keywords: "new expense add create", icon: CreditCard, action: () => router.visit(route("store.expenses.index", { store_slug: store?.slug }) + "?action=add"), category: "Quick Actions" },
    { id: "payment-in", name: "Record Payment In", keywords: "payment receive in money", icon: DollarSign, action: () => router.visit(route("store.payment-in.create", { store_slug: store?.slug })), category: "Quick Actions" },
    { id: "payment-out", name: "Record Payment Out", keywords: "payment out pay money", icon: DollarSign, action: () => router.visit(route("store.payment-out.create", { store_slug: store?.slug })), category: "Quick Actions" },
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
        className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-200",
        onClick: () => setIsOpen(false)
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[201] animate-in fade-in zoom-in-95 duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800", children: [
        /* @__PURE__ */ jsx(Search, { size: 20, className: "text-slate-400" }),
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
            className: "flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white text-lg placeholder-slate-400"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-slate-400", children: [
          /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono", children: "esc" }),
          /* @__PURE__ */ jsx("span", { children: "to close" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: listRef, className: "max-h-[400px] overflow-y-auto p-2", children: Object.keys(groupedCommands).length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-8 text-center text-slate-400", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No commands found" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Try a different search term" })
      ] }) : Object.entries(groupedCommands).map(([category, cmds]) => /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
        /* @__PURE__ */ jsx("p", { className: "px-3 py-1.5 text-xs font-bold uppercase text-slate-400 tracking-wider", children: category }),
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
                                                    ${isSelected ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}
                                                `,
              children: [
                /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${isSelected ? "bg-indigo-100 dark:bg-indigo-800/50" : "bg-slate-100 dark:bg-slate-800"}`, children: /* @__PURE__ */ jsx(cmd.icon, { size: 16 }) }),
                /* @__PURE__ */ jsx("span", { className: "flex-1 font-medium", children: cmd.name }),
                isSelected && /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "text-indigo-500" })
              ]
            },
            cmd.id
          );
        })
      ] }, category)) }),
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono", children: "↑" }),
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono", children: "↓" }),
            /* @__PURE__ */ jsx("span", { children: "to navigate" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono", children: "↵" }),
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
const CATEGORIES = {
  NAVIGATION: "navigation",
  ACTION: "action",
  REPORT: "report",
  SETTING: "setting",
  RECORD: "record"
  // Products, Parties, Invoices (from DB search)
};
const APP_REGISTRY = [
  // ==========================================
  // DASHBOARDS & HOME
  // ==========================================
  {
    id: "home",
    title: "Home",
    subtitle: "Main dashboard & quick access",
    keywords: ["home", "dashboard", "main", "start", "overview"],
    icon: Home,
    category: CATEGORIES.NAVIGATION,
    route: "home"
  },
  {
    id: "pos",
    title: "Point of Sale",
    subtitle: "Open the POS terminal",
    keywords: ["pos", "sell", "checkout", "terminal", "cash register", "billing", "counter"],
    icon: ShoppingCart,
    category: CATEGORIES.NAVIGATION,
    route: "store.pos"
  },
  // ==========================================
  // INVENTORY / STOCK
  // ==========================================
  {
    id: "inventory-dashboard",
    title: "Inventory Dashboard",
    subtitle: "Stock overview & analytics",
    keywords: ["inventory", "stock", "warehouse", "items", "products"],
    icon: Box,
    category: CATEGORIES.NAVIGATION,
    route: "store.inventory.dashboard"
  },
  {
    id: "inventory-list",
    title: "Product List",
    subtitle: "View & manage all products",
    keywords: ["products", "items", "inventory", "list", "catalog"],
    icon: Package,
    category: CATEGORIES.NAVIGATION,
    route: "inventory.index"
  },
  {
    id: "stock-levels",
    title: "Stock Levels",
    subtitle: "Current stock quantities",
    keywords: ["stock", "levels", "quantity", "remaining", "available"],
    icon: Layers,
    category: CATEGORIES.NAVIGATION,
    route: "inventory.stock-levels"
  },
  {
    id: "stock-operations",
    title: "Stock Operations",
    subtitle: "Transfers, adjustments & audits",
    keywords: ["stock", "transfer", "adjust", "audit", "operations", "movement"],
    icon: ArrowRightLeft,
    category: CATEGORIES.NAVIGATION,
    route: "stock-operations"
  },
  {
    id: "categories",
    title: "Categories",
    subtitle: "Product categories management",
    keywords: ["categories", "groups", "types", "classification"],
    icon: Tag,
    category: CATEGORIES.NAVIGATION,
    route: "categories.index"
  },
  {
    id: "suppliers",
    title: "Suppliers",
    subtitle: "Manage your suppliers",
    keywords: ["suppliers", "vendors", "wholesalers"],
    icon: Building2,
    category: CATEGORIES.NAVIGATION,
    route: "suppliers.index"
  },
  {
    id: "purchase-orders",
    title: "Purchase Orders",
    subtitle: "Manage purchase orders",
    keywords: ["purchase", "orders", "po", "buy"],
    icon: FileText,
    category: CATEGORIES.NAVIGATION,
    route: "purchase-orders.index"
  },
  {
    id: "production",
    title: "Production Runs",
    subtitle: "Manufacturing & production",
    keywords: ["production", "manufacturing", "make", "assemble"],
    icon: Activity,
    category: CATEGORIES.NAVIGATION,
    route: "production.index"
  },
  {
    id: "cookbook",
    title: "Cookbook (Recipes)",
    subtitle: "Product recipes & formulas",
    keywords: ["cookbook", "recipes", "formula", "bom", "bill of materials"],
    icon: BookOpen,
    category: CATEGORIES.NAVIGATION,
    route: "cookbook.index"
  },
  {
    id: "labels",
    title: "Print Labels",
    subtitle: "Generate product labels & barcodes",
    keywords: ["labels", "barcode", "print", "stickers"],
    icon: Tag,
    category: CATEGORIES.NAVIGATION,
    route: "labels.index"
  },
  {
    id: "attributes",
    title: "Product Attributes",
    subtitle: "Size, color, variants",
    keywords: ["attributes", "variants", "size", "color", "options"],
    icon: Layers,
    category: CATEGORIES.NAVIGATION,
    route: "attributes.index"
  },
  // ==========================================
  // SALES
  // ==========================================
  {
    id: "sales-dashboard",
    title: "Sales Dashboard",
    subtitle: "Sales overview & analytics",
    keywords: ["sales", "revenue", "dashboard", "sell"],
    icon: TrendingUp,
    category: CATEGORIES.NAVIGATION,
    route: "store.sales.dashboard"
  },
  {
    id: "sales-list",
    title: "Sales List",
    subtitle: "View all sales transactions",
    keywords: ["sales", "transactions", "history", "invoices"],
    icon: Receipt,
    category: CATEGORIES.NAVIGATION,
    route: "sales.index"
  },
  {
    id: "sales-analytics",
    title: "Sales Analytics",
    subtitle: "Advanced sales insights",
    keywords: ["analytics", "insights", "charts", "trends"],
    icon: BarChart2,
    category: CATEGORIES.NAVIGATION,
    route: "sales.analytics"
  },
  {
    id: "sales-pre-sales",
    title: "Pre-Sales",
    subtitle: "Manage pre-sales / quotes",
    keywords: ["sale", "orders", "quotes", "proforma", "pre-sale"],
    icon: FileText,
    category: CATEGORIES.NAVIGATION,
    route: "pre-sales.index"
  },
  {
    id: "parked-sales",
    title: "Parked Sales (Hold Bills)",
    subtitle: "View parked/held transactions",
    keywords: ["parked", "hold", "saved", "pending"],
    icon: Clock,
    category: CATEGORIES.NAVIGATION,
    route: "parked-sales.index"
  },
  // ==========================================
  // CONTACTS / PARTIES
  // ==========================================
  {
    id: "parties",
    title: "Parties",
    subtitle: "Customers & suppliers ledger",
    keywords: ["parties", "customers", "suppliers", "contacts", "ledger"],
    icon: Users,
    category: CATEGORIES.NAVIGATION,
    route: "store.parties.index"
  },
  {
    id: "customers",
    title: "Customers",
    subtitle: "Manage customer database",
    keywords: ["customers", "clients", "buyers"],
    icon: UserPlus,
    category: CATEGORIES.NAVIGATION,
    route: "customers.index"
  },
  // ==========================================
  // MONEY / FINANCE
  // ==========================================
  {
    id: "transactions",
    title: "All Transactions",
    subtitle: "View all financial transactions",
    keywords: ["transactions", "all", "money", "finance"],
    icon: DollarSign,
    category: CATEGORIES.NAVIGATION,
    route: "store.funds.index"
  },
  {
    id: "purchases",
    title: "Purchases",
    subtitle: "Purchase bills & invoices",
    keywords: ["purchases", "bills", "buying", "vendors"],
    icon: ShoppingCart,
    category: CATEGORIES.NAVIGATION,
    route: "purchases.index"
  },
  {
    id: "payments",
    title: "Payments",
    subtitle: "Payment in & out",
    keywords: ["payments", "receive", "pay", "collection"],
    icon: CreditCard,
    category: CATEGORIES.NAVIGATION,
    route: "payments.index"
  },
  {
    id: "payment-in",
    title: "Payment In (Receive)",
    subtitle: "Record incoming payment",
    keywords: ["receive", "collection", "payment in", "incoming"],
    icon: CreditCard,
    category: CATEGORIES.NAVIGATION,
    route: "payments.in"
  },
  {
    id: "payment-out",
    title: "Payment Out (Pay)",
    subtitle: "Record outgoing payment",
    keywords: ["pay", "payment out", "outgoing", "disbursement"],
    icon: CreditCard,
    category: CATEGORIES.NAVIGATION,
    route: "payments.out"
  },
  {
    id: "expenses",
    title: "Expenses",
    subtitle: "Track business expenses",
    keywords: ["expenses", "costs", "spending", "bills"],
    icon: Receipt,
    category: CATEGORIES.NAVIGATION,
    route: "expenses.index"
  },
  {
    id: "bank-accounts",
    title: "Bank Accounts",
    subtitle: "Manage bank & cash accounts",
    keywords: ["bank", "accounts", "cash", "wallet"],
    icon: Building2,
    category: CATEGORIES.NAVIGATION,
    route: "bank-accounts.index"
  },
  {
    id: "receivables",
    title: "Receivables",
    subtitle: "Money owed to you",
    keywords: ["receivables", "owed", "pending", "dues"],
    icon: DollarSign,
    category: CATEGORIES.NAVIGATION,
    route: "finance.receivables"
  },
  {
    id: "payables",
    title: "Payables",
    subtitle: "Money you owe",
    keywords: ["payables", "owe", "debts", "liabilities"],
    icon: DollarSign,
    category: CATEGORIES.NAVIGATION,
    route: "finance.payables"
  },
  // ==========================================
  // ACCOUNTING
  // ==========================================
  {
    id: "accounting-dashboard",
    title: "Accounting Dashboard",
    subtitle: "Financial overview",
    keywords: ["accounting", "finance", "dashboard"],
    icon: Calculator,
    category: CATEGORIES.NAVIGATION,
    route: "accounting.dashboard"
  },
  {
    id: "chart-of-accounts",
    title: "Chart of Accounts",
    subtitle: "Account ledgers & structure",
    keywords: ["chart", "accounts", "ledger", "coa"],
    icon: Database,
    category: CATEGORIES.NAVIGATION,
    route: "accounting.index"
  },
  {
    id: "profit-loss",
    title: "Profit & Loss (P&L)",
    subtitle: "Income statement",
    keywords: ["profit", "loss", "pnl", "income", "statement", "earnings"],
    icon: TrendingUp,
    category: CATEGORIES.NAVIGATION,
    route: "accounting.pnl"
  },
  {
    id: "balance-sheet",
    title: "Balance Sheet",
    subtitle: "Assets, liabilities & equity",
    keywords: ["balance", "sheet", "assets", "liabilities", "equity"],
    icon: FileText,
    category: CATEGORIES.NAVIGATION,
    route: "accounting.balance-sheet"
  },
  // ==========================================
  // REPORTS
  // ==========================================
  {
    id: "reports-dashboard",
    title: "Reports Hub",
    subtitle: "All reports in one place",
    keywords: ["reports", "analytics", "insights", "data"],
    icon: BarChart2,
    category: CATEGORIES.NAVIGATION,
    route: "reports.dashboard"
  },
  {
    id: "report-sales",
    title: "Sales Report",
    subtitle: "Detailed sales analysis",
    keywords: ["sales", "report", "revenue"],
    icon: BarChart2,
    category: CATEGORIES.REPORT,
    route: "store.reports.sales"
  },
  {
    id: "report-purchases",
    title: "Purchase Report",
    subtitle: "Purchase analysis",
    keywords: ["purchase", "report", "buying"],
    icon: BarChart2,
    category: CATEGORIES.REPORT,
    route: "store.reports.purchases"
  },
  {
    id: "report-day-book",
    title: "Day Book",
    subtitle: "Daily transactions summary",
    keywords: ["day", "book", "daily", "journal"],
    icon: BookOpen,
    category: CATEGORIES.REPORT,
    route: "store.reports.day-book"
  },
  {
    id: "report-profit-loss",
    title: "Profit & Loss Report",
    subtitle: "Detailed P&L analysis",
    keywords: ["profit", "loss", "report", "margin"],
    icon: TrendingUp,
    category: CATEGORIES.REPORT,
    route: "store.reports.profit-loss"
  },
  {
    id: "report-party-statement",
    title: "Party Statement",
    subtitle: "Ledger for specific party",
    keywords: ["party", "statement", "ledger", "account"],
    icon: FileText,
    category: CATEGORIES.REPORT,
    route: "store.reports.party-statement"
  },
  {
    id: "report-stock-valuation",
    title: "Stock Valuation",
    subtitle: "Inventory value report",
    keywords: ["stock", "valuation", "inventory", "value"],
    icon: Package,
    category: CATEGORIES.REPORT,
    route: "store.reports.stock-valuation"
  },
  {
    id: "report-low-stock",
    title: "Low Stock Report",
    subtitle: "Items below reorder level",
    keywords: ["low", "stock", "reorder", "shortage"],
    icon: Package,
    category: CATEGORIES.REPORT,
    route: "store.reports.low-stock"
  },
  {
    id: "report-expiry",
    title: "Expiry Report",
    subtitle: "Expiring products",
    keywords: ["expiry", "expiring", "date", "shelf life"],
    icon: Clock,
    category: CATEGORIES.REPORT,
    route: "store.reports.expiry"
  },
  {
    id: "report-tax",
    title: "Tax Report",
    subtitle: "Tax collected & payable",
    keywords: ["tax", "gst", "vat", "fbr"],
    icon: Percent,
    category: CATEGORIES.REPORT,
    route: "store.reports.tax"
  },
  {
    id: "report-bank-statement",
    title: "Bank Statement",
    subtitle: "Bank account transactions",
    keywords: ["bank", "statement", "transactions"],
    icon: Building2,
    category: CATEGORIES.REPORT,
    route: "store.reports.bank-statement"
  },
  {
    id: "report-expenses",
    title: "Expense Report",
    subtitle: "Expense analysis",
    keywords: ["expense", "report", "spending"],
    icon: Receipt,
    category: CATEGORIES.REPORT,
    route: "store.reports.expenses"
  },
  {
    id: "report-cash-flow",
    title: "Cash Flow",
    subtitle: "Money in & out analysis",
    keywords: ["cash", "flow", "liquidity"],
    icon: DollarSign,
    category: CATEGORIES.REPORT,
    route: "store.reports.cash-flow"
  },
  {
    id: "report-trial-balance",
    title: "Trial Balance",
    subtitle: "Accounting trial balance",
    keywords: ["trial", "balance", "accounting"],
    icon: Calculator,
    category: CATEGORIES.REPORT,
    route: "store.reports.trial-balance"
  },
  {
    id: "report-item-wise-profit",
    title: "Item-wise Profit",
    subtitle: "Profit by product",
    keywords: ["item", "product", "profit", "margin"],
    icon: TrendingUp,
    category: CATEGORIES.REPORT,
    route: "store.reports.item-wise-profit"
  },
  {
    id: "report-party-wise-profit",
    title: "Party-wise Profit/Loss",
    subtitle: "Profit by customer/supplier",
    keywords: ["party", "customer", "profit", "loss"],
    icon: Users,
    category: CATEGORIES.REPORT,
    route: "store.reports.party-wise-profit-loss"
  },
  {
    id: "report-discount",
    title: "Discount Report",
    subtitle: "Discounts given analysis",
    keywords: ["discount", "offers", "concession"],
    icon: Percent,
    category: CATEGORIES.REPORT,
    route: "store.reports.discount"
  },
  // ==========================================
  // ADMIN & SETTINGS
  // ==========================================
  {
    id: "settings",
    title: "Settings",
    subtitle: "App preferences & configuration",
    keywords: ["settings", "preferences", "config", "options"],
    icon: Settings,
    category: CATEGORIES.SETTING,
    route: "settings"
  },
  {
    id: "admin-panel",
    title: "Store Admin Panel",
    subtitle: "Manage your store",
    keywords: ["admin", "panel", "system", "management", "store settings"],
    icon: Shield,
    category: CATEGORIES.NAVIGATION,
    route: "store.settings"
    // Store-scoped — NOT /admin-panel
  },
  {
    id: "admin-settings",
    title: "System Settings",
    subtitle: "Business, print, tax settings",
    keywords: ["system", "settings", "admin", "configuration"],
    icon: Settings,
    category: CATEGORIES.SETTING,
    route: "store.settings"
    // Store-scoped settings
  },
  {
    id: "admin-users",
    title: "Staff Management",
    subtitle: "Manage staff & users",
    keywords: ["users", "staff", "employees", "team", "accounts"],
    icon: Users,
    category: CATEGORIES.NAVIGATION,
    route: "store.staff"
    // Store-scoped staff
  },
  {
    id: "admin-logs",
    title: "Activity Log",
    subtitle: "Activity & audit logs",
    keywords: ["logs", "activity", "errors", "history", "audit"],
    icon: FileText,
    category: CATEGORIES.NAVIGATION,
    route: "activity-log.index"
  },
  {
    id: "admin-staff",
    title: "Staff Summaries",
    subtitle: "Staff performance & attendance",
    keywords: ["staff", "attendance", "performance", "employees"],
    icon: Users,
    category: CATEGORIES.NAVIGATION,
    route: "staff-attendance.index"
  },
  // ==========================================
  // UTILITY PAGES
  // ==========================================
  {
    id: "activity-log",
    title: "Activity Log",
    subtitle: "Recent actions & history",
    keywords: ["activity", "log", "history", "audit", "changes"],
    icon: History,
    category: CATEGORIES.NAVIGATION,
    route: "activity-log.index"
  },
  {
    id: "recycle-bin",
    title: "Recycle Bin",
    subtitle: "Deleted items & restore",
    keywords: ["recycle", "bin", "trash", "deleted", "restore"],
    icon: Trash2,
    category: CATEGORIES.NAVIGATION,
    route: "recycle-bin.index"
  },
  {
    id: "import-export",
    title: "Import / Export",
    subtitle: "Bulk data import & export",
    keywords: ["import", "export", "csv", "excel", "bulk"],
    icon: Download,
    category: CATEGORIES.NAVIGATION,
    route: "store.admin.data"
  },
  {
    id: "growth-engine",
    title: "Growth Engine",
    subtitle: "AI recommendations & loyalty",
    keywords: ["growth", "engine", "ai", "recommendations", "loyalty"],
    icon: Sparkles,
    category: CATEGORIES.NAVIGATION,
    route: "growth-engine.index"
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "View all notifications",
    keywords: ["notifications", "alerts", "messages"],
    icon: Activity,
    category: CATEGORIES.NAVIGATION,
    route: "notifications.index"
  },
  // ==========================================
  // QUICK ACTIONS (Create/Add)
  // ==========================================
  {
    id: "action-new-sale",
    title: "Create New Sale",
    subtitle: "Open POS to make a sale",
    keywords: ["new", "create", "sale", "sell", "add"],
    icon: PlusCircle,
    category: CATEGORIES.ACTION,
    route: "store.pos",
    action: "create"
  },
  {
    id: "action-new-invoice",
    title: "Create Invoice",
    subtitle: "Create a detailed invoice",
    keywords: ["new", "create", "invoice", "bill", "add"],
    icon: FilePlus,
    category: CATEGORIES.ACTION,
    route: "sales.invoice.create",
    action: "create"
  },
  {
    id: "action-new-pre-sale",
    title: "Create Pre-Sale",
    subtitle: "Create a new pre-sale/quote",
    keywords: ["new", "create", "sale", "order", "quote", "proforma", "pre-sale"],
    icon: FilePlus,
    category: CATEGORIES.ACTION,
    route: "pre-sales.create",
    action: "create"
  },
  {
    id: "action-new-purchase",
    title: "Create Purchase",
    subtitle: "Record a new purchase bill",
    keywords: ["new", "create", "purchase", "buy", "add"],
    icon: FilePlus,
    category: CATEGORIES.ACTION,
    route: "purchases.create",
    action: "create"
  },
  {
    id: "action-new-product",
    title: "Add New Product",
    subtitle: "Add item to inventory",
    keywords: ["new", "create", "product", "item", "add", "inventory"],
    icon: PlusCircle,
    category: CATEGORIES.ACTION,
    route: "inventory.index",
    action: "create",
    queryParams: { action: "add" }
  },
  {
    id: "action-new-party",
    title: "Add New Party",
    subtitle: "Add customer or supplier",
    keywords: ["new", "create", "party", "customer", "supplier", "add"],
    icon: UserPlus,
    category: CATEGORIES.ACTION,
    route: "store.parties.index",
    action: "create"
  },
  {
    id: "action-new-expense",
    title: "Record Expense",
    subtitle: "Add a new expense entry",
    keywords: ["new", "create", "expense", "add", "cost"],
    icon: PlusCircle,
    category: CATEGORIES.ACTION,
    route: "expenses.index",
    action: "create"
  },
  {
    id: "action-receive-payment",
    title: "Receive Payment",
    subtitle: "Record payment in",
    keywords: ["receive", "payment", "collection", "money"],
    icon: CreditCard,
    category: CATEGORIES.ACTION,
    route: "payments.in",
    action: "create"
  },
  {
    id: "action-make-payment",
    title: "Make Payment",
    subtitle: "Record payment out",
    keywords: ["make", "pay", "payment", "send"],
    icon: CreditCard,
    category: CATEGORIES.ACTION,
    route: "payments.out",
    action: "create"
  },
  {
    id: "action-export-products",
    title: "Export Products",
    subtitle: "Download product data as CSV",
    keywords: ["export", "download", "products", "csv"],
    icon: Download,
    category: CATEGORIES.ACTION,
    route: "store.admin.data.export",
    action: "export"
  },
  {
    id: "action-import-products",
    title: "Import Products",
    subtitle: "Upload product data from CSV",
    keywords: ["import", "upload", "products", "csv"],
    icon: Upload,
    category: CATEGORIES.ACTION,
    route: "store.admin.data",
    action: "import"
  },
  // ==========================================
  // SETTING SHORTCUTS
  // ==========================================
  {
    id: "setting-print",
    title: "Print Settings",
    subtitle: "Configure receipt & invoice printing",
    keywords: ["print", "settings", "receipt", "thermal", "printer"],
    icon: Printer,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "print"
  },
  {
    id: "setting-business",
    title: "Business Info Settings",
    subtitle: "Store name, address, logo",
    keywords: ["business", "info", "store", "company", "name"],
    icon: Building2,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "business"
  },
  {
    id: "setting-taxes",
    title: "Tax Settings",
    subtitle: "Configure tax rates",
    keywords: ["tax", "settings", "gst", "vat", "rate"],
    icon: Percent,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "taxes"
  },
  {
    id: "setting-ai",
    title: "AI Settings",
    subtitle: "Configure Gemini/OpenAI API",
    keywords: ["ai", "settings", "gemini", "openai", "intelligence"],
    icon: Sparkles,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "ai"
  },
  {
    id: "setting-general",
    title: "General Settings",
    subtitle: "Passcode, UI scale, defaults",
    keywords: ["general", "settings", "passcode", "scale", "default"],
    icon: Settings,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "general"
  },
  {
    id: "setting-transaction",
    title: "Transaction Settings",
    subtitle: "Invoice prefixes, billing type",
    keywords: ["transaction", "settings", "invoice", "prefix", "billing"],
    icon: FileText,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "transaction"
  }
];
const INTENT_PATTERNS = [
  // SELL / SALES intents
  { patterns: ["i want to sell", "want to sell", "make a sale", "create sale", "new sale", "open pos", "start selling"], boost: ["pos", "action-new-sale", "action-new-invoice", "sales-dashboard"] },
  // CREATE / ADD intents
  { patterns: ["create invoice", "new invoice", "make invoice"], boost: ["action-new-invoice", "action-new-sale", "sales-list"] },
  { patterns: ["add product", "new product", "create product", "add item", "new item"], boost: ["action-new-product", "inventory-list"] },
  { patterns: ["add party", "new party", "add customer", "new customer", "add supplier"], boost: ["action-new-party", "parties", "customers"] },
  { patterns: ["add expense", "new expense", "record expense"], boost: ["action-new-expense", "expenses"] },
  { patterns: ["create purchase", "new purchase", "buy stock"], boost: ["action-new-purchase", "purchases"] },
  { patterns: ["receive payment", "payment in", "collect money"], boost: ["action-receive-payment", "payments"] },
  { patterns: ["make payment", "pay money", "payment out"], boost: ["action-make-payment", "payments"] },
  // VIEW / CHECK intents
  { patterns: ["check stock", "view stock", "stock level", "how much stock"], boost: ["stock-levels", "inventory-dashboard"] },
  { patterns: ["check profit", "view profit", "show profit", "how much profit", "pnl", "p&l"], boost: ["profit-loss", "report-profit-loss"] },
  { patterns: ["check sales", "view sales", "sales today", "sales report"], boost: ["sales-dashboard", "sales-list", "report-sales"] },
  { patterns: ["check expenses", "view expenses", "expense report"], boost: ["expenses", "report-expenses"] },
  { patterns: ["check balance", "balance sheet", "view balance"], boost: ["balance-sheet", "accounting-dashboard"] },
  // SETTINGS intents
  { patterns: ["print settings", "printing", "receipt settings"], boost: ["setting-print", "admin-settings"] },
  { patterns: ["tax settings", "gst settings", "configure tax"], boost: ["setting-taxes", "admin-settings"] },
  { patterns: ["ai settings", "gemini settings", "openai settings"], boost: ["setting-ai", "admin-settings"] },
  { patterns: ["business settings", "company info", "store info"], boost: ["setting-business", "admin-settings"] },
  // REPORTS intents
  { patterns: ["day book", "daily report", "today report"], boost: ["report-day-book", "reports-dashboard"] },
  { patterns: ["cash flow", "money flow"], boost: ["report-cash-flow", "accounting-dashboard"] },
  { patterns: ["low stock", "stock shortage", "reorder"], boost: ["report-low-stock", "stock-levels"] },
  { patterns: ["expiry report", "expiring", "about to expire"], boost: ["report-expiry"] },
  // ADMIN intents
  { patterns: ["admin panel", "administration", "system admin"], boost: ["admin-panel", "admin-settings"] },
  { patterns: ["manage users", "user management", "staff accounts"], boost: ["admin-users", "admin-staff"] },
  { patterns: ["backup", "restore", "database backup"], boost: ["admin-database"] },
  { patterns: ["activity log", "audit log", "who did what"], boost: ["activity-log"] },
  { patterns: ["deleted items", "recycle bin", "restore deleted"], boost: ["recycle-bin"] },
  { patterns: ["import products", "upload products", "import csv"], boost: ["action-import-products", "import-export"] },
  { patterns: ["export products", "download products", "export csv"], boost: ["action-export-products", "import-export"] }
];
function searchRegistry(query) {
  if (!query || query.length < 1) return [];
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);
  let intentBoosts = /* @__PURE__ */ new Set();
  INTENT_PATTERNS.forEach((intent) => {
    if (intent.patterns.some((pattern) => normalizedQuery.includes(pattern))) {
      intent.boost.forEach((id) => intentBoosts.add(id));
    }
  });
  const scored = APP_REGISTRY.map((item) => {
    let score = 0;
    if (intentBoosts.has(item.id)) {
      score += 200;
    }
    if (item.title.toLowerCase().includes(normalizedQuery)) {
      score += 100;
    }
    item.keywords.forEach((keyword) => {
      if (keyword.includes(normalizedQuery)) {
        score += 50;
      }
      words.forEach((word) => {
        if (word.length >= 2 && keyword.includes(word)) {
          score += 20;
        }
      });
    });
    if (item.subtitle.toLowerCase().includes(normalizedQuery)) {
      score += 30;
    }
    const actionVerbs = ["new", "create", "add", "make", "open", "go", "show", "view", "check", "want"];
    if (item.category === CATEGORIES.ACTION && actionVerbs.some((v) => normalizedQuery.includes(v))) {
      score += 25;
    }
    if (/^(i want to|i need to|let me|show me|take me to|go to|open)/.test(normalizedQuery)) {
      if (item.category === CATEGORIES.ACTION) score += 15;
    }
    return { ...item, score };
  });
  return scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
}
function getCategoryLabel(category) {
  switch (category) {
    case CATEGORIES.NAVIGATION:
      return "Go to";
    case CATEGORIES.ACTION:
      return "Action";
    case CATEGORIES.REPORT:
      return "Report";
    case CATEGORIES.SETTING:
      return "Settings";
    case CATEGORIES.RECORD:
      return "Record";
    default:
      return "";
  }
}
function getCategoryColor(category) {
  switch (category) {
    case CATEGORIES.NAVIGATION:
      return "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400";
    case CATEGORIES.ACTION:
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
    case CATEGORIES.REPORT:
      return "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400";
    case CATEGORIES.SETTING:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    case CATEGORIES.RECORD:
      return "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400";
    default:
      return "bg-slate-50 text-slate-500";
  }
}
const LEMON_JS_SRC = "https://app.lemonsqueezy.com/js/lemon.js";
const LOAD_TIMEOUT_MS = 12e3;
let loaderPromise = null;
let activeHandlers = null;
function toEmbeddableUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  try {
    const url = new URL(rawUrl, window.location.origin);
    if (url.searchParams.has("signature")) return rawUrl;
    url.searchParams.set("embed", "1");
    return url.toString();
  } catch {
    if (rawUrl.includes("signature=") || rawUrl.includes("embed=")) return rawUrl;
    return `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}embed=1`;
  }
}
function handleLemonEvent(payload) {
  const name = payload?.event ?? payload;
  const handlers = activeHandlers;
  if (!handlers) return;
  if (name === "Checkout.Success") {
    handlers.onSuccess?.(payload?.data ?? null);
    return;
  }
  if (name === "Checkout.Closed" || name === "Checkout.Close") {
    activeHandlers = null;
    handlers.onClose?.();
  }
}
function loadLemonJs() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("lemon.js requires a browser environment"));
  }
  if (window.LemonSqueezy?.Url?.Open) {
    return Promise.resolve(window.LemonSqueezy);
  }
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      loaderPromise = null;
      reject(new Error("lemon.js load timed out"));
    }, LOAD_TIMEOUT_MS);
    const finish = () => {
      if (settled) return;
      try {
        window.createLemonSqueezy?.();
      } catch {
      }
      if (!window.LemonSqueezy?.Url?.Open) {
        settled = true;
        clearTimeout(timer);
        loaderPromise = null;
        reject(new Error("lemon.js loaded but did not initialise"));
        return;
      }
      try {
        window.LemonSqueezy.Setup({ eventHandler: handleLemonEvent });
      } catch {
      }
      settled = true;
      clearTimeout(timer);
      resolve(window.LemonSqueezy);
    };
    const existing = document.querySelector(`script[src="${LEMON_JS_SRC}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") {
        finish();
      } else {
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          loaderPromise = null;
          reject(new Error("lemon.js failed to load"));
        }, { once: true });
      }
      return;
    }
    const script = document.createElement("script");
    script.src = LEMON_JS_SRC;
    script.defer = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "1";
      finish();
    }, { once: true });
    script.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      loaderPromise = null;
      script.remove();
      reject(new Error("lemon.js failed to load"));
    }, { once: true });
    document.head.appendChild(script);
  });
  return loaderPromise;
}
function preloadLemonCheckout() {
  loadLemonJs().catch(() => {
  });
}
async function openLemonCheckout(url, options = {}) {
  const {
    onSuccess,
    onClose,
    onError,
    redirectOnFailure = true
  } = options;
  if (!url) {
    onError?.(new Error("No checkout URL was provided."));
    return false;
  }
  const embedUrl = toEmbeddableUrl(url);
  try {
    const lemon = await loadLemonJs();
    activeHandlers = {
      onSuccess: (data) => {
        onSuccess?.(data);
      },
      onClose: () => {
        onClose?.();
      }
    };
    lemon.Url.Open(embedUrl);
    return true;
  } catch (error) {
    activeHandlers = null;
    onError?.(error);
    if (redirectOnFailure) {
      window.location.href = embedUrl;
    }
    return false;
  }
}
function closeLemonCheckout() {
  try {
    window.LemonSqueezy?.Url?.Close?.();
  } catch {
  }
  activeHandlers = null;
}
function SmartCapturePanel({ isOpen, onClose, initialTab = "image" }) {
  const { store } = usePage().props;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [ctxLoading, setCtxLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const [textInput, setTextInput] = useState("");
  const [capturePartyId, setCapturePartyId] = useState("");
  const [capturePartySide, setCapturePartySide] = useState("customer");
  const [forkDialog, setForkDialog] = useState(null);
  const [acknowledgeLocked, setAcknowledgeLocked] = useState(false);
  const [targetType, setTargetType] = useState("");
  const [customCommand, setCustomCommand] = useState("");
  const [appendMode, setAppendMode] = useState(false);
  const [appendDocType, setAppendDocType] = useState("pre_invoice");
  const [appendDocId, setAppendDocId] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ provider: "gemini", api_key: "", model: "" });
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [availableModels, setAvailableModels] = useState(null);
  const [modelsBusy, setModelsBusy] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);
  const extractInFlight = useRef(false);
  const idempotencyKeyRef = useRef(null);
  const [isPurchasingAddon, setIsPurchasingAddon] = useState(null);
  const handlePurchaseAddon = (addonType) => {
    setIsPurchasingAddon(addonType);
    axios.post(`/store/${store?.slug}/billing/checkout-addon`, { addon_type: addonType }).then((res) => {
      if (!res.data.url) {
        alert(res.data.error || "Failed to create checkout.");
        setIsPurchasingAddon(null);
        return;
      }
      openLemonCheckout(res.data.url, {
        onSuccess: () => {
          setTimeout(async () => {
            await axios.post(`/store/${store?.slug}/billing/sync-subscription`).catch(() => {
            });
            closeLemonCheckout();
            router.reload({ preserveScroll: true });
            setIsPurchasingAddon(null);
          }, 2200);
        },
        onClose: () => setIsPurchasingAddon(null),
        onError: () => setIsPurchasingAddon(null)
      });
    }).catch((err) => {
      console.error(err);
      alert("Failed to generate checkout link. Please check your network connection.");
      setIsPurchasingAddon(null);
    });
  };
  const baseUrl = useMemo(() => {
    try {
      return route("store.smart-capture.extract", { store_slug: store?.slug }).replace(/\/extract$/, "");
    } catch (e) {
      return `/s/${store?.slug}/smart-capture`;
    }
  }, [store?.slug]);
  const maxFiles = ctx?.limits?.max_files ?? 5;
  const locked = ctx && !ctx.entitlement?.allowed;
  useEffect(() => {
    if (!isOpen) return;
    setCtxLoading(true);
    axios.get(`${baseUrl}/context`).then((res) => setCtx(res.data)).catch(() => setCtx(null)).finally(() => setCtxLoading(false));
  }, [isOpen, baseUrl]);
  useEffect(() => {
    if (!rateLimit || rateLimit.seconds <= 0) return;
    const id = setInterval(() => {
      setRateLimit((prev) => {
        if (!prev) return null;
        if (prev.seconds <= 1) return null;
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1e3);
    return () => clearInterval(id);
  }, [rateLimit]);
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1e3);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);
  if (!isOpen) return null;
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
  };
  const handleFileChange = (e) => {
    if (e.target.files?.length) addFiles(Array.from(e.target.files));
    e.target.value = "";
  };
  const addFiles = (files) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const maxMb = ctx?.limits?.max_image_mb ?? 10;
    const next = [...selectedFiles];
    for (const file of files) {
      if (next.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files per scan.`);
        break;
      }
      if (!validTypes.includes(file.type)) {
        setError("Unsupported file format. Please upload JPG, PNG, WEBP or PDF.");
        continue;
      }
      if (file.size > maxMb * 1024 * 1024) {
        setError(`"${file.name}" exceeds the ${maxMb}MB limit.`);
        continue;
      }
      const entry = { file, preview: null };
      if (file.type.startsWith("image/")) {
        entry.preview = URL.createObjectURL(file);
      }
      next.push(entry);
      setError(null);
    }
    setSelectedFiles(next);
  };
  const removeFile = (idx) => {
    setSelectedFiles((prev) => {
      const next = [...prev];
      if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) options = { mimeType: "audio/mp4" };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: options.mimeType });
        setAudioBlob(blob);
        setAudioSource("recorded");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Audio capture failed:", err);
      setError("Permission denied. Could not access microphone.");
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };
  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const validTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/aac", "audio/x-m4a", "audio/m4a"];
    const maxMb = ctx?.limits?.max_audio_mb ?? 25;
    if (!validTypes.includes(file.type) && !file.type.startsWith("audio/")) {
      setError("Unsupported audio format. Use MP3, WAV, M4A, OGG or WEBM.");
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Audio exceeds the ${maxMb}MB limit.`);
      return;
    }
    setAudioBlob(file);
    setAudioSource("uploaded");
    setError(null);
  };
  const convertToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });
  const handleExtract = async () => {
    if (extractInFlight.current || loading) return;
    if (rateLimit) return;
    extractInFlight.current = true;
    setLoading(true);
    setError(null);
    setExtractedData(null);
    try {
      const payload = {
        type: activeTab,
        target_type: targetType || null,
        custom_command: customCommand || null,
        // Told to the model so it does not invent a party from a
        // letterhead, and used to pre-fill the review screen.
        party_id: capturePartyId || null
      };
      if (activeTab === "image") {
        if (selectedFiles.length === 0) {
          setError("Please add at least one photo or PDF first.");
          setLoading(false);
          return;
        }
        payload.files = [];
        for (const entry of selectedFiles) {
          const data = await convertToBase64(entry.file);
          payload.files.push({ base64: data.split(",")[1], mime: entry.file.type });
        }
      } else if (activeTab === "audio") {
        if (!audioBlob) {
          setError("Please record or upload a voice memo first.");
          setLoading(false);
          return;
        }
        const data = await convertToBase64(audioBlob);
        payload.base64 = data.split(",")[1];
        payload.mime_type = audioBlob.type;
      } else {
        if (!textInput.trim()) {
          setError("Please type or paste some text first.");
          setLoading(false);
          return;
        }
        payload.text = textInput;
      }
      const response = await axios.post(`${baseUrl}/extract`, payload);
      if (response.data.success) {
        setExtractedData(response.data);
        setSelectedPartyId(response.data.suggested_party_id || "");
        setSelectedCategoryId(response.data.suggested_category_id || "");
        setPaymentMethod(response.data.action === "purchase" ? "credit" : "cash");
        idempotencyKeyRef.current = crypto?.randomUUID?.() || `sc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      } else {
        setError(response.data.message || "Failed to extract transaction details.");
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 402) {
        axios.get(`${baseUrl}/context`).then((res) => setCtx(res.data)).catch(() => {
        });
        setError(data?.message || "AI Scan is locked for this store.");
      } else if (status === 429) {
        setRateLimit({
          seconds: Math.max(1, parseInt(data?.retry_after ?? 30, 10)),
          message: data?.message || "The AI provider is rate limiting this key.",
          daily: !!data?.daily
        });
        setError(null);
      } else if (status === 409) {
        setError(data?.message || "A scan is already running for this store. Give it a moment.");
      } else {
        setError(data?.message || "AI extraction failed. Please check your AI settings and try again.");
      }
    } finally {
      extractInFlight.current = false;
      setLoading(false);
    }
  };
  const handleItemChange = (idx, field, value) => {
    setExtractedData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[idx] = { ...updatedItems[idx], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };
  const handleProductPick = (idx, value) => {
    setExtractedData((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[idx] };
      if (value === "__create_new__") {
        item.product_id = null;
        item.create_new = {
          name: item.raw_name,
          price: item.unit_price || 0,
          cost_price: 0
        };
      } else {
        item.product_id = value;
        item.create_new = null;
        const candidate = (item.candidates || []).find((c) => String(c.id) === String(value));
        if (candidate && (item.unit_price === null || item.unit_price === void 0 || item.unit_price === "")) {
          item.unit_price = candidate.sale_price;
        }
      }
      updatedItems[idx] = item;
      return { ...prev, items: updatedItems };
    });
  };
  const removeItem = (idx) => {
    setExtractedData((prev) => {
      const updatedItems = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: updatedItems };
    });
  };
  const isExpense = extractedData?.action === "expense";
  const partyType = extractedData ? ["purchase", "pre_purchase", "purchase_return"].includes(extractedData.action) ? "supplier" : "customer" : "customer";
  const partyList = partyType === "supplier" ? ctx?.parties?.suppliers || [] : ctx?.parties?.customers || [];
  const candidateIds = new Set((extractedData?.party_candidates || []).map((c) => String(c.id)));
  const itemsReady = extractedData?.items?.length > 0 && extractedData.items.every(
    (i) => isExpense ? true : i.product_id || i.create_new && i.create_new.name?.trim()
  );
  const isAppending = appendMode && !!appendDocId;
  const partyReady = isAppending ? true : isExpense ? !!selectedCategoryId : !!selectedPartyId;
  const appendReady = !appendMode || appendDocType && appendDocId;
  const policyFor = (action) => ctx?.document_policy?.[action] || null;
  const currentPolicy = extractedData ? policyFor(extractedData.action) : null;
  const handleConfirmTransaction = async (options = {}) => {
    if (!extractedData || confirming) return;
    const action = options.overrideAction || extractedData.action;
    const policy = policyFor(action);
    const isAppending2 = appendMode && !!appendDocId;
    if (!options.resolved && !isAppending2 && policy?.locking) {
      setAcknowledgeLocked(false);
      setForkDialog({
        action,
        label: policy.label,
        handoffUrl: policy.handoff_url,
        draftAction: policy.draft_action,
        draftLabel: policy.draft_label
      });
      return;
    }
    setConfirming(true);
    setError(null);
    const postItems = extractedData.items.map((item) => ({
      product_id: item.create_new ? null : item.product_id,
      create_new: item.create_new ? {
        name: item.create_new.name,
        price: parseFloat(item.create_new.price || 0),
        cost_price: parseFloat(item.create_new.cost_price || 0)
      } : null,
      qty: parseFloat(item.qty || 1),
      unit_price: parseFloat(item.unit_price || 0),
      name: item.raw_name,
      // The exact wording the AI read. The server pairs it with whatever
      // product the user settled on, and remembers it for this store.
      raw_name: item.raw_name
    }));
    const payload = {
      action,
      mode: options.mode || "create",
      acknowledge_locked: !!options.acknowledgeLocked,
      party_id: isExpense ? null : selectedPartyId,
      party: extractedData.party,
      notes: extractedData.notes || null,
      payment_method: isExpense && paymentMethod === "credit" ? "cash" : paymentMethod,
      expense_category: isExpense ? extractedData.expense_category || null : null,
      expense_category_id: isExpense ? selectedCategoryId : null,
      date: extractedData.date || null,
      reference: extractedData.reference || null,
      append_to: appendMode && appendDocId ? { type: appendDocType, id: appendDocId } : null,
      // Same key on a retry => the server returns the original result
      // instead of posting a second transaction.
      idempotency_key: idempotencyKeyRef.current,
      items: postItems
    };
    try {
      const response = await axios.post(`${baseUrl}/confirm`, payload);
      if (response.data.success && response.data.mode === "handoff") {
        setForkDialog(null);
        onClose();
        router.visit(response.data.redirect);
        return;
      }
      if (response.data.success) {
        setForkDialog(null);
        setSuccessData({
          ...response.data.data,
          message: response.data.message,
          duplicate: response.data.duplicate,
          createdProducts: response.data.created_products || []
        });
        axios.get(`${baseUrl}/context`).then((r) => setCtx(r.data)).catch(() => {
        });
      } else {
        setError(response.data.message || "Failed to post transaction.");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === "requires_review" || data?.code === "requires_acknowledgement") {
        const policy2 = policyFor(action);
        setAcknowledgeLocked(false);
        setForkDialog({
          action,
          label: data.label || policy2?.label,
          handoffUrl: policy2?.handoff_url,
          draftAction: data.draft_action ?? policy2?.draft_action,
          draftLabel: policy2?.draft_label
        });
      } else {
        setForkDialog(null);
        setError(data?.message || "Transaction creation failed. Check the details and try again.");
      }
    } finally {
      setConfirming(false);
    }
  };
  const calculateGrossTotal = () => {
    if (!extractedData) return "0.00";
    return extractedData.items.reduce((sum, item) => sum + parseFloat(item.qty || 1) * parseFloat(item.unit_price || 0), 0).toFixed(2);
  };
  const resetAll = () => {
    setSuccessData(null);
    setExtractedData(null);
    setSelectedFiles([]);
    setAudioBlob(null);
    setAudioSource(null);
    setTextInput("");
    setSelectedPartyId("");
    setSelectedCategoryId("");
    setAppendDocId("");
    setError(null);
    setRateLimit(null);
    setForkDialog(null);
    setAcknowledgeLocked(false);
    idempotencyKeyRef.current = null;
  };
  const navigateToSuccessDoc = () => {
    if (!successData) return;
    onClose();
    let path = null;
    try {
      if (successData.type === "purchase") {
        path = route("store.v3.purchases.show", { store_slug: store.slug, purchase: successData.id });
      } else if (successData.type === "sale" || successData.type === "invoice") {
        path = route("store.sales.dashboard", { store_slug: store.slug });
      } else if (successData.type === "expense") {
        path = route("store.expenses.index", { store_slug: store.slug });
      } else if (successData.type === "return") {
        path = route("store.returns-history.index", { store_slug: store.slug });
      } else if (successData.type === "proposal") {
        path = route("store.proposals.show", { store_slug: store.slug, proposal: successData.id });
      } else if (successData.type === "pre_invoice") {
        path = route("store.sales-orders.show", { store_slug: store.slug, sales_order: successData.id });
      } else if (successData.type === "pre_purchase") {
        path = route("store.purchase-orders.show", { store_slug: store.slug, purchase_order: successData.id });
      } else if (successData.type === "recurring_invoice") {
        path = route("store.recurring-invoices.index", { store_slug: store.slug });
      } else if (successData.type === "purchase_return") {
        path = route("store.debit-notes.show", { store_slug: store.slug, id: successData.id });
      }
    } catch (e) {
    }
    if (path) router.visit(path);
  };
  const openSettings = () => {
    setShowSettings(true);
    setSettingsMsg(null);
    setAvailableModels(null);
    axios.get(`${baseUrl}/settings`).then((res) => {
      setSettings(res.data);
      setSettingsForm({
        provider: res.data.provider || "gemini",
        api_key: res.data.api_key_masked || "",
        model: res.data.model || ""
      });
    }).catch((err) => setSettingsMsg({ ok: false, text: err.response?.data?.message || "Could not load settings." }));
  };
  const discoverModels = async () => {
    setModelsBusy(true);
    setSettingsMsg(null);
    try {
      const res = await axios.post(`${baseUrl}/settings/models`, {
        provider: settingsForm.provider,
        api_key: settingsForm.api_key
      });
      setAvailableModels(res.data.models || []);
      if (!res.data.models?.length) {
        setSettingsMsg({ ok: false, text: "No models were returned for this key." });
      }
    } catch (err) {
      setSettingsMsg({ ok: false, text: err.response?.data?.message || "Could not load the model list." });
    } finally {
      setModelsBusy(false);
    }
  };
  const saveSettings = async () => {
    setSettingsBusy(true);
    setSettingsMsg(null);
    try {
      const res = await axios.post(`${baseUrl}/settings`, settingsForm);
      setSettingsMsg({ ok: true, text: res.data.message || "Saved." });
      axios.get(`${baseUrl}/context`).then((r) => setCtx(r.data)).catch(() => {
      });
    } catch (err) {
      setSettingsMsg({ ok: false, text: err.response?.data?.message || "Failed to save settings." });
    } finally {
      setSettingsBusy(false);
    }
  };
  const testSettings = async () => {
    setSettingsBusy(true);
    setSettingsMsg(null);
    try {
      const res = await axios.post(`${baseUrl}/settings/test`, settingsForm);
      setSettingsMsg({ ok: res.data.success, text: res.data.message });
    } catch (err) {
      setSettingsMsg({ ok: false, text: err.response?.data?.message || "Connection test failed." });
    } finally {
      setSettingsBusy(false);
    }
  };
  const providerLabels = { gemini: "Google Gemini", openai: "OpenAI", anthropic: "Anthropic (Claude)", deepseek: "DeepSeek" };
  const providerCaps = ctx?.settings?.providers || {};
  const openDocs = ctx?.open_documents?.[appendDocType] || [];
  const renderAdvancedControls = () => /* @__PURE__ */ jsxs("div", { className: "mb-6 space-y-4 text-left bg-slate-50/50 dark:bg-slate-850/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 relative z-20", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setAppendMode(false),
          className: `flex-1 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${!appendMode ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`,
          children: [
            /* @__PURE__ */ jsx(FilePlus2, { size: 14 }),
            "Create New Document"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setAppendMode(true),
          className: `flex-1 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${appendMode ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`,
          children: [
            /* @__PURE__ */ jsx(Layers, { size: 14 }),
            "Add to Existing Document"
          ]
        }
      )
    ] }),
    appendMode ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1", children: "Document Type" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: appendDocType,
            onChange: (e) => {
              setAppendDocType(e.target.value);
              setAppendDocId("");
            },
            className: "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-white cursor-pointer",
            children: [
              /* @__PURE__ */ jsx("option", { value: "pre_invoice", children: "Sales Order (Pre-Invoice)" }),
              /* @__PURE__ */ jsx("option", { value: "pre_purchase", children: "Purchase Order (Pre-Purchase)" }),
              /* @__PURE__ */ jsx("option", { value: "proposal", children: "Proposal / Quote" }),
              /* @__PURE__ */ jsx("option", { value: "recurring_invoice", children: "Recurring Invoice" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1", children: "Target Document" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: appendDocId,
            onChange: (e) => setAppendDocId(e.target.value),
            className: "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-white cursor-pointer",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "-- Select an open document --" }),
              openDocs.map((doc) => /* @__PURE__ */ jsxs("option", { value: doc.id, children: [
                doc.reference || doc.id?.slice(0, 8),
                " — ",
                doc.party || "No party",
                doc.total !== void 0 && doc.total !== null ? ` — ${parseFloat(doc.total).toFixed(2)}` : "",
                " (",
                doc.status,
                ")"
              ] }, doc.id))
            ]
          }
        ),
        openDocs.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-amber-500 font-semibold ml-1", children: "No open documents of this type found." })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 md:col-span-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1", children: [
          "Who is this document for? ",
          /* @__PURE__ */ jsx("span", { className: "normal-case font-bold text-slate-400", children: "(optional — helps the AI a lot)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: capturePartySide,
              onChange: (e) => {
                setCapturePartySide(e.target.value);
                setCapturePartyId("");
              },
              className: "px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-white cursor-pointer",
              children: [
                /* @__PURE__ */ jsx("option", { value: "customer", children: "Customer" }),
                /* @__PURE__ */ jsx("option", { value: "supplier", children: "Supplier" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: capturePartyId,
              onChange: (e) => setCapturePartyId(e.target.value),
              className: "flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-white cursor-pointer",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Let the AI read it from the document" }),
                (capturePartySide === "supplier" ? ctx?.parties?.suppliers || [] : ctx?.parties?.customers || []).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1", children: "What would you like to create?" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: targetType,
            onChange: (e) => setTargetType(e.target.value),
            className: "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-white cursor-pointer",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "No Preference (Auto-Detect)" }),
              /* @__PURE__ */ jsxs("optgroup", { label: "Editable afterwards — safest", children: [
                /* @__PURE__ */ jsx("option", { value: "pre_invoice", children: "Pre-Sale (Sales Order)" }),
                /* @__PURE__ */ jsx("option", { value: "pre_purchase", children: "Purchase Order" }),
                /* @__PURE__ */ jsx("option", { value: "proposal", children: "Proposal / Quote" }),
                /* @__PURE__ */ jsx("option", { value: "recurring_invoice", children: "Recurring Invoice" })
              ] }),
              /* @__PURE__ */ jsxs("optgroup", { label: "Final — cannot be edited once posted", children: [
                /* @__PURE__ */ jsx("option", { value: "sale", children: "Sales Invoice" }),
                /* @__PURE__ */ jsx("option", { value: "purchase", children: "Purchase Bill" }),
                /* @__PURE__ */ jsx("option", { value: "expense", children: "Operating Expense" }),
                /* @__PURE__ */ jsx("option", { value: "return", children: "Sales Return" }),
                /* @__PURE__ */ jsx("option", { value: "purchase_return", children: "Purchase Return (Debit Note)" })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400 block ml-1", children: "Text Commands / Instructions (Optional)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: customCommand,
            onChange: (e) => setCustomCommand(e.target.value),
            placeholder: "e.g. 'Use wholesale prices', 'Skip tax'",
            className: "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none text-slate-800 dark:text-white font-medium"
          }
        )
      ] })
    ] })
  ] });
  const renderSettingsDrawer = () => /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150", onClick: () => setShowSettings(false), children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto animate-in slide-in-from-right duration-200", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(KeyRound, { size: 18, className: "text-indigo-500" }),
        /* @__PURE__ */ jsx("h3", { className: "text-base font-black text-slate-800 dark:text-white", children: "AI Settings (Bring Your Own Key)" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => setShowSettings(false), className: "w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-6 leading-relaxed", children: "Use your own API key from any major AI provider. Your key is stored only for this store and is never shared with other stores." }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5", children: "Provider" }),
        /* @__PURE__ */ jsx(
          "select",
          {
            value: settingsForm.provider,
            onChange: (e) => setSettingsForm((f) => ({ ...f, provider: e.target.value, model: "" })),
            className: "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-white",
            children: Object.keys(providerLabels).map((p) => /* @__PURE__ */ jsx("option", { value: p, children: providerLabels[p] }, p))
          }
        ),
        providerCaps[settingsForm.provider] && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400 mt-1.5 ml-1", children: [
          "Supports: ",
          ["image", "audio", "text"].filter((t) => providerCaps[settingsForm.provider][t]).map((t) => t === "image" ? "Photos" : t === "audio" ? "Voice" : "Text").join(", "),
          !providerCaps[settingsForm.provider].image && " — no photo scanning!"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5", children: "API Key" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: settingsForm.api_key,
            onChange: (e) => setSettingsForm((f) => ({ ...f, api_key: e.target.value })),
            placeholder: "Paste your API key",
            className: "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-slate-800 dark:text-white"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400", children: "Model (optional)" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: discoverModels,
              disabled: modelsBusy,
              className: "text-[10px] font-black uppercase tracking-wider text-indigo-500 hover:text-indigo-400 flex items-center gap-1 disabled:opacity-40",
              children: [
                modelsBusy ? /* @__PURE__ */ jsx(Loader2, { size: 11, className: "animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { size: 11 }),
                "Load available models"
              ]
            }
          )
        ] }),
        availableModels?.length ? /* @__PURE__ */ jsxs(
          "select",
          {
            value: settingsForm.model,
            onChange: (e) => setSettingsForm((f) => ({ ...f, model: e.target.value })),
            className: "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-slate-800 dark:text-white",
            children: [
              /* @__PURE__ */ jsxs("option", { value: "", children: [
                "Recommended default (",
                settings?.default_models?.[settingsForm.provider],
                ")"
              ] }),
              availableModels.map((m) => /* @__PURE__ */ jsxs("option", { value: m.id, children: [
                m.label,
                " — ",
                m.id
              ] }, m.id))
            ]
          }
        ) : /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: settingsForm.model,
            onChange: (e) => setSettingsForm((f) => ({ ...f, model: e.target.value })),
            placeholder: settings?.default_models?.[settingsForm.provider] || "Default model",
            className: "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-slate-800 dark:text-white"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1.5 ml-1 leading-relaxed", children: 'Leave empty for the recommended default. Newer Flash models read handwriting better and usually cost less — press "Load available models" to see what your key can use.' })
      ] }),
      settingsMsg && /* @__PURE__ */ jsx("div", { className: `p-3 rounded-xl text-xs font-bold ${settingsMsg.ok ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`, children: settingsMsg.text }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: testSettings,
            disabled: settingsBusy,
            className: "flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40",
            children: [
              settingsBusy ? /* @__PURE__ */ jsx(Loader2, { className: "animate-spin", size: 14 }) : /* @__PURE__ */ jsx(TestTube2, { size: 14 }),
              "Test Connection"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: saveSettings,
            disabled: settingsBusy,
            className: "flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-40",
            children: "Save Settings"
          }
        )
      ] })
    ] })
  ] }) });
  const renderForkDialog = () => {
    if (!forkDialog) return null;
    const { label, handoffUrl, draftAction, draftLabel } = forkDialog;
    const canHandoff = !!handoffUrl;
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-6 animate-in fade-in duration-150",
        onClick: () => !confirming && setForkDialog(null),
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 shadow-2xl animate-in zoom-in-95 duration-200",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0", children: /* @__PURE__ */ jsx(Lock, { size: 20 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("h3", { className: "text-base font-black text-slate-800 dark:text-white tracking-tight", children: [
                    "A ",
                    label,
                    " cannot be edited later"
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1 leading-relaxed", children: "Once posted it becomes a permanent accounting record. Fixing a mistake then means issuing a return or credit note — you cannot simply change it." })
                ] })
              ] }),
              canHandoff ? /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 leading-relaxed mb-5 bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4", children: [
                "Choosing ",
                /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-200", children: "Continue" }),
                " takes you to the ",
                label,
                " screen with everything already filled in from this scan. Nothing is saved until you press Save there, so you get one last look at every line."
              ] }) : /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 cursor-pointer", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: acknowledgeLocked,
                    onChange: (e) => setAcknowledgeLocked(e.target.checked),
                    className: "mt-0.5 w-4 h-4 rounded accent-indigo-600 shrink-0"
                  }
                ),
                /* @__PURE__ */ jsxs("span", { children: [
                  "There is no draft version of a ",
                  label,
                  ", so this will post straight to your ledger. I have checked every line and understand it cannot be edited afterwards."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2.5", children: [
                canHandoff && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleConfirmTransaction({ resolved: true, mode: "handoff" }),
                    disabled: confirming,
                    className: "w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2",
                    children: [
                      confirming ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsx(ChevronRight, { size: 14 }),
                      "Continue — review on the ",
                      label,
                      " screen"
                    ]
                  }
                ),
                draftAction && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleConfirmTransaction({ resolved: true, overrideAction: draftAction, mode: "create" }),
                    disabled: confirming,
                    className: "w-full px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-all active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2",
                    children: [
                      /* @__PURE__ */ jsx(FilePlus2, { size: 14 }),
                      "Make a ",
                      draftLabel,
                      " instead — I can still change it"
                    ]
                  }
                ),
                !canHandoff && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleConfirmTransaction({ resolved: true, mode: "create", acknowledgeLocked: true }),
                    disabled: confirming || !acknowledgeLocked,
                    className: "w-full px-5 py-3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all active:scale-[0.99] disabled:opacity-30",
                    children: confirming ? "Posting…" : `Post this ${label} now`
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setForkDialog(null),
                    disabled: confirming,
                    className: "w-full px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-40",
                    children: "No, take me back to the review"
                  }
                )
              ] })
            ]
          }
        )
      }
    );
  };
  const renderLocked = () => /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-center p-8 overflow-y-auto max-h-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 mb-3 shrink-0", children: /* @__PURE__ */ jsx(Lock, { size: 28 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-800 dark:text-white tracking-tight", children: "AI Scan is Locked" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-2 max-w-md leading-relaxed", children: ctx?.entitlement?.message || "AI Scan requires the AI add-on. Every store gets 10 free credits to test out the capabilities." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-between text-left", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
            /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20", children: "BYOK Lifetime" }),
            /* @__PURE__ */ jsxs("div", { className: "text-lg font-black text-slate-800 dark:text-white", children: [
              "$5 ",
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-normal text-slate-500", children: "once" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("h5", { className: "text-xs font-black text-slate-800 dark:text-white mb-1.5", children: "Bring Your Own Key" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed", children: "Provide your own Gemini, OpenAI, Claude, or DeepSeek API key. Bypass platform fees forever." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: ctx?.entitlement?.reason === "no_key" ? /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: openSettings,
            className: "w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5",
            children: [
              /* @__PURE__ */ jsx(KeyRound, { size: 12 }),
              " Configure API Key"
            ]
          }
        ) : /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handlePurchaseAddon("ai_byok"),
            disabled: isPurchasingAddon !== null,
            className: "w-full py-2 bg-amber-500 hover:bg-amber-600 text-[#020010] rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5",
            children: isPurchasingAddon === "ai_byok" ? /* @__PURE__ */ jsx(Loader2, { size: 12, className: "animate-spin" }) : "Buy BYOK Unlock"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "md:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-between text-left", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20", children: "Managed API" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500", children: "Monthly Tiers" })
        ] }),
        /* @__PURE__ */ jsx("h5", { className: "text-xs font-black text-slate-800 dark:text-white mb-1.5", children: "Managed AI Subscriptions" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3", children: "No API keys or developer setup needed. Access our premium high-speed models instantly. Select a volume:" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: [
          { key: "ai_starter", label: "Starter AI", price: "$9", scans: 90, queries: 110 },
          { key: "ai_lite", label: "Lite AI", price: "$19", scans: 150, queries: 200 },
          { key: "ai_pro", label: "Pro AI", price: "$39", scans: 480, queries: 420 },
          { key: "ai_ultimate", label: "Ultimate AI", price: "$79", scans: 850, queries: 800 }
        ].map((plan) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => handlePurchaseAddon(plan.key),
            className: "p-2.5 rounded-lg bg-white dark:bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] hover:border-purple-500/30 hover:bg-purple-500/[0.02] cursor-pointer transition-all flex flex-col justify-between group",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-0.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-slate-800 dark:text-white group-hover:text-purple-400 transition-colors", children: plan.label }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-purple-500", children: plan.price })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-[8px] text-slate-500", children: [
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
  ] });
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden h-[720px] relative", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" }),
    showSettings && renderSettingsDrawer(),
    renderForkDialog(),
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-900 text-white shrink-0 flex items-center justify-between border-b border-slate-800 relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-black tracking-tight", children: "AI Scan" }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5 flex flex-wrap items-center gap-x-2", children: [
            /* @__PURE__ */ jsx("span", { children: "AI-Powered Transaction Entry" }),
            (ctx?.entitlement?.mode === "managed" || ctx?.entitlement?.mode === "free") && ctx?.entitlement?.scans_limit > 0 && /* @__PURE__ */ jsxs("span", { className: "text-slate-400 normal-case", children: [
              "(",
              ctx.entitlement.scans_used,
              "/",
              ctx.entitlement.scans_limit,
              " scans used)"
            ] }),
            ctx?.learning?.total > 0 && /* @__PURE__ */ jsxs(
              "span",
              {
                className: "text-violet-300 normal-case flex items-center gap-1",
                title: "Corrections your team has made. AI Scan reuses them automatically.",
                children: [
                  /* @__PURE__ */ jsx(Brain, { size: 11 }),
                  " ",
                  ctx.learning.total,
                  " learned"
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: openSettings,
            title: "AI Settings (BYOK)",
            className: "w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/55 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95",
            children: /* @__PURE__ */ jsx(Settings2, { size: 16 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/55 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95",
            children: /* @__PURE__ */ jsx(X, { size: 16 })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-hidden flex flex-col relative z-10", children: ctxLoading && !ctx ? /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "animate-spin text-indigo-500", size: 28 }) }) : locked && !extractedData && !successData ? renderLocked() : rateLimit && !extractedData && !successData ? (
      /* RATE LIMITED — we wait, we never auto-retry */
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 mb-5", children: /* @__PURE__ */ jsx(Clock, { size: 30 }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-800 dark:text-white tracking-tight", children: rateLimit.daily ? "Daily AI quota reached" : "Sending a little too fast" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-2 max-w-sm leading-relaxed", children: rateLimit.message }),
        !rateLimit.daily && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-4xl font-black text-slate-800 dark:text-white tabular-nums", children: [
            rateLimit.seconds,
            "s"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider text-slate-400", children: "Ready again shortly" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-6 max-w-sm leading-relaxed", children: "Your document is still here — nothing was lost, and no request was wasted. We never retry automatically, because that is what burns through a free-tier key." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setRateLimit(null),
              className: "px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95",
              children: "Back to my document"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: openSettings,
              className: "px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5",
              children: [
                /* @__PURE__ */ jsx(KeyRound, { size: 13 }),
                " Use a different key"
              ]
            }
          )
        ] })
      ] })
    ) : successData ? (
      /* SUCCESS STATE */
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-350", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-400 mb-6 shadow-inner animate-bounce", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 44 }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-black text-slate-800 dark:text-white tracking-tight", children: successData.appended ? "Items Added!" : "Transaction Created!" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-2 max-w-sm", children: successData.message || `Structured ${successData.type} transaction successfully processed.` }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 max-w-sm w-full space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-semibold text-slate-400", children: [
            /* @__PURE__ */ jsx("span", { children: "Type:" }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-800 dark:text-white uppercase font-bold", children: successData.type?.replace(/_/g, " ") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-semibold text-slate-400", children: [
            /* @__PURE__ */ jsx("span", { children: "Reference:" }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-800 dark:text-white font-mono", children: successData.reference })
          ] }),
          successData.appended ? /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-semibold text-slate-400", children: [
            /* @__PURE__ */ jsx("span", { children: "Lines Added:" }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-800 dark:text-white font-black", children: successData.appended })
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-semibold text-slate-400", children: [
            /* @__PURE__ */ jsx("span", { children: "Total:" }),
            /* @__PURE__ */ jsxs("span", { className: "text-slate-800 dark:text-white font-black", children: [
              "Rs. ",
              Math.abs(successData.total || 0).toFixed(2)
            ] })
          ] })
        ] }),
        successData.createdProducts?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-5 max-w-sm w-full text-left bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-2 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Plus, { size: 11 }),
            successData.createdProducts.length,
            " new product",
            successData.createdProducts.length > 1 ? "s" : "",
            " added to your catalogue"
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: successData.createdProducts.map((p) => /* @__PURE__ */ jsxs("li", { className: "text-[11px] text-slate-600 dark:text-slate-300 font-semibold", children: [
            p.name,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-slate-400 font-mono", children: [
              "(",
              p.sku,
              ")"
            ] })
          ] }, p.id)) }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-2 leading-relaxed", children: 'Check the spelling — a misread name creates a near-duplicate that splits your reports. You can find these under Products, filtered by "created by AI Scan".' })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 flex gap-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: resetAll,
              className: "px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95",
              children: "Scan Another"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: navigateToSuccessDoc,
              className: "px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5",
              children: [
                /* @__PURE__ */ jsx("span", { children: "View Document" }),
                /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
              ]
            }
          )
        ] })
      ] })
    ) : extractedData ? (
      /* AI REVIEW & CONFIRMATION */
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "px-8 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-end gap-5 justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black uppercase text-slate-400 mb-1", children: "Transaction Intent" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: extractedData.action,
                  onChange: (e) => {
                    const action = e.target.value;
                    setExtractedData({ ...extractedData, action });
                    setSelectedPartyId("");
                  },
                  disabled: appendMode && !!appendDocId,
                  className: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-2 py-1.5 outline-none text-slate-800 dark:text-white disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "sale", children: "Sales Invoice" }),
                    /* @__PURE__ */ jsx("option", { value: "purchase", children: "Purchase" }),
                    /* @__PURE__ */ jsx("option", { value: "expense", children: "Operating Expense" }),
                    /* @__PURE__ */ jsx("option", { value: "return", children: "Sales Return" }),
                    /* @__PURE__ */ jsx("option", { value: "proposal", children: "Proposal" }),
                    /* @__PURE__ */ jsx("option", { value: "pre_invoice", children: "Pre-Invoice (Sales Order)" }),
                    /* @__PURE__ */ jsx("option", { value: "pre_purchase", children: "Pre-Purchase (Purchase Order)" }),
                    /* @__PURE__ */ jsx("option", { value: "recurring_invoice", children: "Recurring Invoice" }),
                    /* @__PURE__ */ jsx("option", { value: "purchase_return", children: "Purchase Return (Debit Note)" })
                  ]
                }
              )
            ] }),
            isExpense ? /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-[9px] font-black uppercase text-slate-400 mb-1", children: [
                "Expense Category ",
                /* @__PURE__ */ jsx("span", { className: "text-rose-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: selectedCategoryId,
                  onChange: (e) => setSelectedCategoryId(e.target.value),
                  className: `bg-white dark:bg-slate-800 border text-xs font-bold rounded-lg px-2 py-1.5 outline-none text-slate-800 dark:text-white min-w-[180px] ${!selectedCategoryId ? "border-rose-400" : "border-slate-200 dark:border-slate-700"}`,
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Select category --" }),
                    (ctx?.expense_categories || []).map((cat) => /* @__PURE__ */ jsx("option", { value: cat.id, children: cat.name }, cat.id))
                  ]
                }
              ),
              extractedData.expense_category && /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-indigo-400 font-bold mt-0.5", children: [
                "AI suggested: ",
                extractedData.expense_category
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-[9px] font-black uppercase text-slate-400 mb-1", children: [
                partyType === "supplier" ? "Supplier" : "Customer",
                " ",
                /* @__PURE__ */ jsx("span", { className: "text-rose-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(User, { size: 12, className: "text-slate-400" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: selectedPartyId,
                    onChange: (e) => setSelectedPartyId(e.target.value),
                    className: `bg-white dark:bg-slate-800 border text-xs font-bold rounded-lg px-2 py-1.5 outline-none text-slate-800 dark:text-white min-w-[200px] ${!selectedPartyId ? "border-rose-400" : "border-slate-200 dark:border-slate-700"}`,
                    children: [
                      /* @__PURE__ */ jsxs("option", { value: "", children: [
                        "-- Select ",
                        partyType,
                        " --"
                      ] }),
                      (extractedData.party_candidates || []).length > 0 && /* @__PURE__ */ jsx("optgroup", { label: `AI matches for "${extractedData.party}"`, children: extractedData.party_candidates.map((c) => /* @__PURE__ */ jsxs("option", { value: c.id, children: [
                        c.name,
                        " (",
                        c.confidence,
                        "% match)"
                      ] }, `cand-${c.id}`)) }),
                      /* @__PURE__ */ jsx("optgroup", { label: `All ${partyType}s`, children: partyList.filter((p) => !candidateIds.has(String(p.id))).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id)) })
                    ]
                  }
                )
              ] }),
              extractedData.party && /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-indigo-400 font-bold mt-0.5", children: [
                'AI read: "',
                extractedData.party,
                '"'
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black uppercase text-slate-400 mb-1", children: "Payment Method" }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-1.5", children: (isExpense ? ["cash", "bank"] : ["cash", "credit", "bank"]).map((method) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setPaymentMethod(method),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${paymentMethod === method ? "bg-slate-900 border-slate-900 dark:bg-indigo-600 dark:border-indigo-600 text-white font-black" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400"}`,
                children: method
              },
              method
            )) })
          ] })
        ] }),
        appendMode && appendDocId && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2 text-xs font-bold text-indigo-500", children: [
          /* @__PURE__ */ jsx(Layers, { size: 13 }),
          "Items will be ADDED to the selected existing ",
          appendDocType.replace(/_/g, " "),
          " — no new document will be created."
        ] }),
        extractedData.party_preselected?.type_mismatch && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-2 text-xs font-bold text-rose-500", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 13 }),
          "You chose the ",
          extractedData.party_preselected.type,
          ' "',
          extractedData.party_preselected.name,
          '", but this looks like a ',
          partyType,
          " document. Pick the right ",
          partyType,
          " below."
        ] }),
        !isAppending && currentPolicy?.locking && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-500", children: [
          /* @__PURE__ */ jsx(Lock, { size: 13 }),
          currentPolicy.handoff_url ? `A ${currentPolicy.label} cannot be edited once posted — you will get a final review on the ${currentPolicy.label} screen before anything is saved.` : `A ${currentPolicy.label} posts a permanent ledger entry that cannot be edited afterwards.`
        ] }),
        extractedData.meta?.learned_lines > 0 && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-violet-500/10 border-b border-violet-500/20 flex items-center gap-2 text-xs font-bold text-violet-500", children: [
          /* @__PURE__ */ jsx(Brain, { size: 13 }),
          extractedData.meta.learned_lines,
          " line",
          extractedData.meta.learned_lines > 1 ? "s were" : " was",
          " matched from what your store taught AI Scan previously — already filled in below."
        ] }),
        typeof extractedData.document_confidence === "number" && extractedData.document_confidence < 70 && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-500", children: [
          /* @__PURE__ */ jsx(Eye, { size: 13 }),
          "This document was hard to read (",
          extractedData.document_confidence,
          "% legible). Check the amber and red lines carefully before posting."
        ] }),
        (extractedData.date || extractedData.reference || extractedData.notes || extractedData.meta) && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-400", children: [
          extractedData.date && /* @__PURE__ */ jsxs("span", { children: [
            "Date read: ",
            /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-300", children: extractedData.date })
          ] }),
          extractedData.reference && /* @__PURE__ */ jsxs("span", { children: [
            "Ref: ",
            /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-300 font-mono", children: extractedData.reference })
          ] }),
          extractedData.notes && /* @__PURE__ */ jsxs("span", { className: "truncate max-w-md", children: [
            "Notes: ",
            /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-300", children: extractedData.notes })
          ] }),
          extractedData.meta?.api_requests ? /* @__PURE__ */ jsxs("span", { className: "ml-auto flex items-center gap-1 text-emerald-500", title: "One scan costs exactly one AI request", children: [
            /* @__PURE__ */ jsx(Zap, { size: 11 }),
            extractedData.meta.api_requests,
            " API request",
            extractedData.meta.api_requests > 1 ? "s" : "",
            extractedData.meta.model ? ` · ${extractedData.meta.model}` : ""
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-8 custom-scrollbar", children: [
          error && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-850 dark:text-rose-300 text-xs font-bold flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-rose-500 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: error })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: extractedData.items.map((item, idx) => {
            const isNew = !!item.create_new;
            const isLearned = !!item.learned && !isNew;
            const isHigh = item.confidence >= 90;
            const isMedium = item.confidence >= 60 && item.confidence < 90;
            const unclearReading = item.needs_review || item.read_confidence !== null && item.read_confidence < 70;
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: `p-4 rounded-2xl border transition-all flex flex-col gap-3 ${isLearned ? "bg-violet-500/5 border-violet-500/25" : isNew ? "bg-indigo-500/5 border-indigo-500/20" : isHigh ? "bg-emerald-500/5 border-emerald-500/10" : isMedium ? "bg-amber-500/5 border-amber-500/10" : "bg-rose-500/5 border-rose-500/10"}`,
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                      /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: [
                        'AI read: "',
                        item.raw_name,
                        '"'
                      ] }),
                      unclearReading && /* @__PURE__ */ jsxs("span", { className: "px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-500 border border-amber-500/25 flex items-center gap-1", children: [
                        /* @__PURE__ */ jsx(Eye, { size: 9 }),
                        " Check this reading"
                      ] })
                    ] }),
                    isLearned && item.match_reason && /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-violet-500 flex items-center gap-1 mt-0.5", children: [
                      /* @__PURE__ */ jsx(Brain, { size: 10 }),
                      " Remembered — ",
                      item.match_reason
                    ] }),
                    !isExpense ? /* @__PURE__ */ jsxs("div", { className: "mt-1.5 space-y-2", children: [
                      /* @__PURE__ */ jsxs(
                        "select",
                        {
                          value: isNew ? "__create_new__" : item.product_id || "",
                          onChange: (e) => handleProductPick(idx, e.target.value),
                          className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white outline-none",
                          children: [
                            /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "-- Match a store product --" }),
                            (item.candidates || []).map((c) => /* @__PURE__ */ jsxs("option", { value: c.id, children: [
                              c.learned ? "★ " : "",
                              c.name,
                              " (SKU: ",
                              c.sku,
                              " | Match: ",
                              c.confidence,
                              "%",
                              c.learned ? " — learned" : "",
                              ")"
                            ] }, c.id)),
                            /* @__PURE__ */ jsx("option", { value: "__create_new__", children: "＋ Create as NEW product…" })
                          ]
                        }
                      ),
                      isNew && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-indigo-500/20", children: [
                        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-3", children: [
                          /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-indigo-400 uppercase", children: "New Product Name" }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "text",
                              value: item.create_new.name,
                              onChange: (e) => handleItemChange(idx, "create_new", { ...item.create_new, name: e.target.value }),
                              className: "w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-indigo-400 uppercase", children: "Sale Price" }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "number",
                              min: "0",
                              step: "any",
                              value: item.create_new.price,
                              onChange: (e) => handleItemChange(idx, "create_new", { ...item.create_new, price: e.target.value }),
                              className: "w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-indigo-400 uppercase", children: "Cost Price" }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "number",
                              min: "0",
                              step: "any",
                              value: item.create_new.cost_price,
                              onChange: (e) => handleItemChange(idx, "create_new", { ...item.create_new, cost_price: e.target.value }),
                              className: "w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                            }
                          )
                        ] })
                      ] }),
                      !isNew && (!item.candidates || item.candidates.length === 0) && /* @__PURE__ */ jsxs("span", { className: "text-rose-500 text-xs font-bold flex items-center gap-1", children: [
                        /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
                        'No matches found — use "Create as NEW product".'
                      ] })
                    ] }) : /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs font-bold text-slate-700 dark:text-slate-200", children: item.raw_name })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-slate-400 uppercase", children: "Quantity" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: item.qty,
                          onChange: (e) => handleItemChange(idx, "qty", e.target.value),
                          className: "w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-center outline-none",
                          min: "0.0001",
                          step: "any"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-slate-400 uppercase", children: "Unit Price" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: item.unit_price ?? 0,
                          onChange: (e) => handleItemChange(idx, "unit_price", e.target.value),
                          className: "w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-center outline-none",
                          min: "0",
                          step: "any"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "pt-4 flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: `px-2 py-1 text-[8px] font-black uppercase rounded-full ${isLearned ? "bg-violet-500/15 text-violet-600" : isNew ? "bg-indigo-150 text-indigo-700" : isHigh ? "bg-emerald-150 text-emerald-700" : isMedium ? "bg-amber-150 text-amber-700" : "bg-rose-150 text-rose-700"}`, children: isLearned ? "Learned" : isNew ? "New Product" : `${item.confidence}% Match` }),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => removeItem(idx),
                          title: "Remove line",
                          className: "w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-300 transition-all",
                          children: /* @__PURE__ */ jsx(Trash2, { size: 12 })
                        }
                      )
                    ] })
                  ] })
                ] })
              },
              idx
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between bg-slate-55/40 dark:bg-slate-900/60 backdrop-blur-md", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-medium", children: "Estimated Gross:" }),
            " ",
            /* @__PURE__ */ jsxs("span", { className: "font-black text-slate-800 dark:text-white text-base", children: [
              "Rs. ",
              calculateGrossTotal()
            ] }),
            !partyReady ? /* @__PURE__ */ jsx("span", { className: "block text-[10px] text-rose-500 font-bold mt-0.5", children: isExpense ? "Select an expense category to continue." : `Select the ${partyType} to continue.` }) : /* @__PURE__ */ jsxs("span", { className: "block text-[10px] text-violet-500 font-bold mt-0.5 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Brain, { size: 10 }),
              " Your choices here are remembered for this store — next scan will fill them in for you."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setExtractedData(null);
                  setError(null);
                },
                className: "px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95",
                children: "Re-Intake"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleConfirmTransaction(),
                disabled: confirming || !itemsReady || !partyReady || !appendReady,
                className: "px-8 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/10 transition-all active:scale-95 disabled:opacity-30 disabled:hover:scale-100",
                children: confirming ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "animate-spin", size: 14 }),
                  /* @__PURE__ */ jsx("span", { children: "Working..." })
                ] }) : /* @__PURE__ */ jsx("span", { children: isAppending ? "Add to Document" : currentPolicy?.locking ? currentPolicy.handoff_url ? "Review & Finalise…" : "Post Transaction…" : `Create ${currentPolicy?.label || "Document"}` })
              }
            )
          ] })
        ] })
      ] })
    ) : loading ? (
      /* LOADING */
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative w-20 h-20 mb-6 flex items-center justify-center", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute w-16 h-16 rounded-full border-4 border-indigo-500/10 border-t-indigo-600 border-r-indigo-600 animate-spin" }),
          /* @__PURE__ */ jsx(Sparkles, { className: "text-indigo-500 animate-pulse", size: 24 })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-800 dark:text-white tracking-tight", children: "AI Intake in Progress..." }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed", children: [
          "Reading your ",
          activeTab === "image" ? `document (${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""})` : activeTab === "audio" ? "voice memo" : "text",
          " and matching items against your catalog..."
        ] })
      ] })
    ) : (
      /* INTAKE */
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30", children: [
          { key: "image", icon: Camera, label: "Photos / PDF" },
          { key: "audio", icon: Mic, label: "Voice Memo" },
          { key: "text", icon: Type, label: "Text" }
        ].map((tab) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              setActiveTab(tab.key);
              setError(null);
            },
            className: `flex-1 py-4 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === tab.key ? "border-indigo-500 text-indigo-500 bg-white dark:bg-slate-900" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`,
            children: [
              /* @__PURE__ */ jsx(tab.icon, { size: 14 }),
              tab.label
            ]
          },
          tab.key
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-8 custom-scrollbar", children: [
          error && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-850 dark:text-rose-300 text-xs font-bold flex items-start gap-2 animate-in slide-in-from-top-2", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-rose-500 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: error })
          ] }),
          renderAdvancedControls(),
          activeTab === "image" ? (
            /* MULTI-PHOTO TAB */
            /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-between min-h-[300px]", children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  onDragEnter: handleDrag,
                  onDragOver: handleDrag,
                  onDragLeave: handleDrag,
                  onDrop: handleDrop,
                  className: `flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 transition-all min-h-[240px] ${dragActive ? "border-indigo-500 bg-indigo-500/5 scale-[0.99]" : selectedFiles.length > 0 ? "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750"}`,
                  children: [
                    selectedFiles.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 justify-center", children: [
                        selectedFiles.map((entry, idx) => /* @__PURE__ */ jsxs("div", { className: "relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center", children: [
                          entry.preview ? /* @__PURE__ */ jsx("img", { src: entry.preview, alt: `Page ${idx + 1}`, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxs("div", { className: "text-center px-1", children: [
                            /* @__PURE__ */ jsx(FileText, { className: "text-indigo-500 mx-auto", size: 26 }),
                            /* @__PURE__ */ jsx("p", { className: "text-[8px] font-bold text-slate-500 mt-1 truncate max-w-[96px]", children: entry.file.name })
                          ] }),
                          /* @__PURE__ */ jsx("span", { className: "absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-black rounded-md", children: idx + 1 }),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              onClick: () => removeFile(idx),
                              className: "absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center",
                              children: /* @__PURE__ */ jsx(X, { size: 10 })
                            }
                          )
                        ] }, idx)),
                        selectedFiles.length < maxFiles && /* @__PURE__ */ jsxs("label", { htmlFor: "capture-file-picker", className: "w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-400 cursor-pointer transition-all", children: [
                          /* @__PURE__ */ jsx(Plus, { size: 22 }),
                          /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold mt-1", children: "Add More" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("p", { className: "text-center text-[10px] text-slate-400 font-semibold mt-4", children: [
                        selectedFiles.length,
                        "/",
                        maxFiles,
                        " files — multiple photos are treated as pages of ONE document."
                      ] })
                    ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center max-w-xs", children: [
                      /* @__PURE__ */ jsx(Upload, { className: "text-slate-400 mx-auto mb-4", size: 40 }),
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-slate-100", children: "Upload invoice / receipt / handwritten note" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-1.5 leading-relaxed", children: [
                        "Drag & drop up to ",
                        maxFiles,
                        " photos or PDFs (printed OR handwritten), or click to browse. Long receipt? Snap it in sections."
                      ] }),
                      /* @__PURE__ */ jsx(
                        "label",
                        {
                          htmlFor: "capture-file-picker",
                          className: "mt-6 inline-block px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-850 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow",
                          children: "Browse Files"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        accept: "image/jpeg,image/png,image/webp,.pdf",
                        multiple: true,
                        onChange: handleFileChange,
                        className: "hidden",
                        id: "capture-file-picker"
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "pt-6 shrink-0 text-right", children: /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleExtract,
                  disabled: selectedFiles.length === 0 || loading || !!rateLimit,
                  className: "px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:hover:scale-100",
                  children: loading ? "Scanning…" : `Scan ${selectedFiles.length || ""} ${selectedFiles.length === 1 ? "page" : "pages"} — 1 AI request`
                }
              ) })
            ] })
          ) : activeTab === "audio" ? (
            /* VOICE TAB — record OR upload */
            /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-between min-h-[300px]", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-1 border border-slate-200 dark:border-slate-800/80 rounded-3xl flex flex-col items-center justify-center p-8 bg-slate-50/20 dark:bg-slate-900/10", children: audioBlob ? /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-4 animate-pulse", children: /* @__PURE__ */ jsx(Mic, { size: 32 }) }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white", children: audioSource === "uploaded" ? "Audio File Ready" : "Voice Memo Recorded" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1", children: audioSource === "uploaded" && audioBlob.name ? audioBlob.name : "Audio capture ready for analysis" }),
                /* @__PURE__ */ jsx("audio", { src: URL.createObjectURL(audioBlob), controls: true, className: "mt-4 mx-auto max-w-[240px] h-9" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      setAudioBlob(null);
                      setAudioSource(null);
                    },
                    className: "mt-6 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-450 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all",
                    children: "Delete Audio"
                  }
                )
              ] }) : recording ? /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative w-20 h-20 mx-auto flex items-center justify-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute w-20 h-20 bg-rose-500/20 rounded-full animate-ping opacity-60" }),
                  /* @__PURE__ */ jsx("div", { className: "absolute w-16 h-16 bg-rose-500/30 rounded-full animate-pulse" }),
                  /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg relative z-20", children: /* @__PURE__ */ jsx("div", { className: "w-4 h-4 bg-white rounded-sm" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-rose-500 tracking-tight", children: formatTime(recordingTime) }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1.5", children: "Microphone active. Speak transaction items..." })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: stopRecording,
                    className: "px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95",
                    children: "Stop Recording"
                  }
                )
              ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center max-w-sm space-y-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-slate-100 dark:bg-slate-850 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto", children: /* @__PURE__ */ jsx(Mic, { size: 24 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-slate-100", children: "Voice memo" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mt-1", children: 'Record now, or upload an existing audio file (e.g. "Invoice received from Vendor XYZ: 10 Cokes, 3 units of Pepsi")' })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: startRecording,
                      className: "px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-600/10 flex items-center gap-1.5",
                      children: [
                        /* @__PURE__ */ jsx(Mic, { size: 14 }),
                        /* @__PURE__ */ jsx("span", { children: "Start Recording" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "label",
                    {
                      htmlFor: "capture-audio-picker",
                      className: "px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
                      children: [
                        /* @__PURE__ */ jsx(Upload, { size: 14 }),
                        /* @__PURE__ */ jsx("span", { children: "Upload Audio" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "file",
                      accept: "audio/*",
                      onChange: handleAudioUpload,
                      className: "hidden",
                      id: "capture-audio-picker"
                    }
                  )
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "pt-6 shrink-0 text-right", children: /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleExtract,
                  disabled: !audioBlob || loading || !!rateLimit,
                  className: "px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:hover:scale-100",
                  children: "Proceed to Extract"
                }
              ) })
            ] })
          ) : (
            /* TEXT TAB */
            /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-between min-h-[300px]", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 ml-1", children: "Type or paste your transaction text" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: textInput,
                    onChange: (e) => setTextInput(e.target.value),
                    placeholder: "e.g.\nBought from Ali Traders:\n10 x Coca Cola 1.5L @ 180\n5 x Lays Masala @ 50\n2 cartons Nestle Water",
                    maxLength: 2e4,
                    className: "flex-1 min-h-[180px] w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white outline-none resize-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium leading-relaxed"
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-semibold mt-2 ml-1", children: "Works with item lists, copied invoices, WhatsApp order messages — any language." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pt-6 shrink-0 text-right", children: /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleExtract,
                  disabled: !textInput.trim() || loading || !!rateLimit,
                  className: "px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:hover:scale-100",
                  children: "Proceed to Extract"
                }
              ) })
            ] })
          )
        ] })
      ] })
    ) })
  ] }) });
}
function OmniSearch({ onAskAi, isAiLoading = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [dbResults, setDbResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);
  const [smartCaptureTab, setSmartCaptureTab] = useState("image");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const { auth, store } = usePage().props;
  const userRole = auth.user?.role;
  const userPerms = auth.user?.permissions || [];
  const vensynq_enabled = usePage().props.vensynq_enabled;
  const isFullAccess = userRole === "owner" || userRole === "admin" || userRole === "manager" || userRole === "platform_admin";
  useEffect(() => {
    const handleOpenScan = (e) => {
      const tab = e.detail?.tab || "image";
      setSmartCaptureTab(tab);
      setIsSmartCaptureOpen(true);
    };
    window.addEventListener("amd:open-smart-capture", handleOpenScan);
    return () => window.removeEventListener("amd:open-smart-capture", handleOpenScan);
  }, []);
  const canUseSmartCapture = vensynq_enabled && (isFullAccess || userPerms.some((p) => p.startsWith("pos") || p.startsWith("sales") || p.startsWith("purchases")));
  const checkPerm = (required) => {
    if (userRole === "platform_admin") return true;
    if (!required || required.length === 0) return isFullAccess;
    return required.some((p) => userPerms.includes(p));
  };
  const getRequiredPerms = (item) => {
    if (item.route?.includes("pos")) return ["pos"];
    if (item.route?.includes("inventory") || item.route?.includes("production")) return ["inventory"];
    if (item.route?.includes("sales")) return ["sales", "sales_view"];
    if (item.route?.includes("reports") || item.route?.includes("finance")) return ["reports", "finance"];
    if (item.route?.includes("settings")) return ["settings"];
    if (item.route?.includes("parties") || item.route?.includes("customer")) return ["customers"];
    if (item.category === "Inventory") return ["inventory"];
    if (item.category === "Finance") return ["finance"];
    if (item.category === "Reports") return ["reports"];
    return [];
  };
  useEffect(() => {
    const handleKeyDown2 = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        if (isOpen) {
          setIsOpen(false);
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown2);
    return () => window.removeEventListener("keydown", handleKeyDown2);
  }, [isOpen]);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);
  useEffect(() => {
    if (!query || query.length < 1) {
      setResults([]);
      setDbResults([]);
      return;
    }
    const appResults = searchRegistry(query);
    const filteredAppResults = appResults.filter((item) => checkPerm(getRequiredPerms(item)));
    setResults(filteredAppResults);
    if (query.length >= 2) {
      setIsSearchingDb(true);
      const timeout = setTimeout(() => {
        window.axios.get(route("store.global.search", { store_slug: store?.slug }), { params: { query } }).then((res) => {
          setDbResults(res.data || []);
        }).catch(() => setDbResults([])).finally(() => setIsSearchingDb(false));
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setDbResults([]);
    }
  }, [query]);
  useEffect(() => {
    setSelectedIndex(0);
  }, [results, dbResults]);
  const handleKeyDown = (e) => {
    const totalItems = results.length + dbResults.length + (query.length > 2 ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };
  const handleSelect = (index) => {
    const aiButtonIndex = query.length > 2 ? 0 : -1;
    if (index === aiButtonIndex && query.length > 2) {
      handleAskAi();
      return;
    }
    const adjustedIndex = query.length > 2 ? index - 1 : index;
    if (adjustedIndex < results.length) {
      const item = results[adjustedIndex];
      navigateToItem(item);
    } else {
      const dbIndex = adjustedIndex - results.length;
      if (dbResults[dbIndex]) {
        router.visit(dbResults[dbIndex].url);
        handleClose();
      }
    }
  };
  const navigateToItem = (item) => {
    try {
      const routeName = item.route.startsWith("store.") ? item.route : `store.${item.route}`;
      const url = route(routeName, { ...item.queryParams, store_slug: store?.slug });
      router.visit(url);
      handleClose();
    } catch (e) {
      console.warn("Route not found:", item.route);
      handleClose();
    }
  };
  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setDbResults([]);
    setSelectedIndex(0);
  };
  const handleAskAi = () => {
    if (onAskAi && query.length > 2) {
      onAskAi(query);
      handleClose();
    }
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative z-50", children: [
    /* @__PURE__ */ jsxs("div", { className: `relative flex items-center bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border transition-all rounded-2xl w-full sm:w-80 lg:w-96 ${isOpen ? "border-slate-300 dark:border-slate-600 shadow-md" : "border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600"}`, children: [
      /* @__PURE__ */ jsx("div", { className: "pl-4 text-slate-500 dark:text-slate-400", children: /* @__PURE__ */ jsx(Search, { size: 16 }) }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: inputRef,
          type: "text",
          value: query,
          onFocus: () => setIsOpen(true),
          onChange: (e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          },
          onKeyDown: handleKeyDown,
          placeholder: "Search anything...",
          className: "flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-sm text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 font-medium h-10 px-3",
          autoComplete: "off"
        }
      ),
      canUseSmartCapture && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setSmartCaptureTab("image");
              setIsSmartCaptureOpen(true);
            },
            className: "p-1.5 text-slate-400 hover:text-indigo-500 dark:text-slate-550 dark:hover:text-indigo-400 transition-colors",
            title: "Snap Invoice",
            children: /* @__PURE__ */ jsx(Camera, { size: 15 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setSmartCaptureTab("audio");
              setIsSmartCaptureOpen(true);
            },
            className: "p-1.5 text-slate-400 hover:text-indigo-500 dark:text-slate-550 dark:hover:text-indigo-400 transition-colors mr-1",
            title: "Record Voice Memo",
            children: /* @__PURE__ */ jsx(Mic, { size: 15 })
          }
        )
      ] }),
      query && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            setQuery("");
            inputRef.current?.focus();
          },
          className: "p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors",
          children: /* @__PURE__ */ jsx(X, { size: 14 })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "pr-3 hidden sm:flex pointer-events-none", children: /* @__PURE__ */ jsxs("kbd", { className: "flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs", children: "⌘" }),
        /* @__PURE__ */ jsx("span", { className: "opacity-40", children: "/" }),
        /* @__PURE__ */ jsx("span", { className: "text-[9px]", children: "Ctrl" }),
        /* @__PURE__ */ jsx("span", { className: "ml-1 text-xs", children: "F" })
      ] }) })
    ] }),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "fixed top-16 left-4 right-4 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:w-[500px] mt-3 max-h-[50vh] sm:max-h-[75vh] overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-black/20 dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-150 flex flex-col", children: [
      /* @__PURE__ */ jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" }),
      /* @__PURE__ */ jsxs("div", { className: "overflow-y-auto custom-scrollbar", children: [
        query.length > 2 && /* @__PURE__ */ jsx("div", { className: "p-2 border-b border-slate-100 dark:border-slate-800/50", children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleAskAi,
            className: `w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${selectedIndex === 0 ? "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-lg shadow-black/20" : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800"}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${selectedIndex === 0 ? "bg-white/20" : "bg-white dark:bg-slate-700 text-indigo-500 dark:text-indigo-400"}`, children: /* @__PURE__ */ jsx(Sparkles, { size: 16, className: selectedIndex === 0 ? "text-white" : "" }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left", children: [
                /* @__PURE__ */ jsx("div", { className: `text-sm font-bold ${selectedIndex === 0 ? "text-white" : "text-slate-800 dark:text-indigo-300"}`, children: "Ask AI Assistant" }),
                /* @__PURE__ */ jsxs("div", { className: `text-[11px] ${selectedIndex === 0 ? "text-indigo-100" : "text-slate-500"}`, children: [
                  'Analyze "',
                  query,
                  '"...'
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: `text-[10px] font-medium px-2 py-0.5 rounded ${selectedIndex === 0 ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-indigo-900/50 text-slate-600 dark:text-indigo-400"}`, children: "ENTER" })
            ]
          }
        ) }),
        results.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2", children: [
          /* @__PURE__ */ jsx("div", { className: "px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest", children: "Navigation" }),
          results.map((item, idx) => {
            const actualIndex = (query.length > 2 ? 1 : 0) + idx;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleSelect(actualIndex),
                className: `w-full flex items-center gap-3 p-2.5 rounded-lg transition-all group mb-0.5 ${selectedIndex === actualIndex ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"}`,
                children: [
                  /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: item.icon ? /* @__PURE__ */ jsx(item.icon, { size: 16 }) : /* @__PURE__ */ jsx(Box, { size: 16 }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: item.title }),
                    item.description && /* @__PURE__ */ jsx("div", { className: `text-[10px] truncate ${selectedIndex === actualIndex ? "text-indigo-200" : "text-slate-500"}`, children: item.description })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: `text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getCategoryColor(item.category)}`, children: getCategoryLabel(item.category) })
                ]
              },
              item.id
            );
          })
        ] }),
        dbResults.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2 border-t border-slate-100 dark:border-slate-800/30", children: [
          /* @__PURE__ */ jsxs("div", { className: "px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2", children: [
            "Data",
            isSearchingDb && /* @__PURE__ */ jsx(Loader2, { size: 10, className: "animate-spin" })
          ] }),
          dbResults.map((item, idx) => {
            const actualIndex = (query.length > 2 ? 1 : 0) + results.length + idx;
            return /* @__PURE__ */ jsxs(
              Link,
              {
                href: item.url,
                onClick: () => setIsOpen(false),
                className: `w-full flex items-center gap-3 p-2.5 rounded-lg transition-all group mb-0.5 ${selectedIndex === actualIndex ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: `p-1.5 rounded-md ${item.type === "Answer" ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white" : "bg-indigo-50 dark:bg-purple-500/10 text-indigo-600 dark:text-purple-400"}`, children: [
                    item.type === "Product" && /* @__PURE__ */ jsx(Box, { size: 14 }),
                    item.type === "Party" && /* @__PURE__ */ jsx(User, { size: 14 }),
                    item.type === "Invoice" && /* @__PURE__ */ jsx(FileText, { size: 14 }),
                    item.type === "Answer" && /* @__PURE__ */ jsx(Sparkles, { size: 14 })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: item.title }),
                    /* @__PURE__ */ jsx("div", { className: `text-[10px] ${selectedIndex === actualIndex ? "text-purple-200" : "text-slate-500"}`, children: item.subtitle })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-purple-900/30 text-indigo-600 dark:text-purple-400", children: item.type })
                ]
              },
              idx
            );
          })
        ] }),
        query.length > 2 && results.length === 0 && dbResults.length === 0 && !isSearchingDb && /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 font-medium", children: "No results found" }) }),
        query.length === 0 && /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: [
            { label: "New Sale", keys: ["N", "S"], action: () => router.visit(route("store.pos", { store_slug: store?.slug })), perms: ["pos"] },
            { label: "Add Product", keys: ["N", "P"], action: () => router.visit(route("store.inventory.index", { store_slug: store?.slug })), perms: ["inventory"] },
            { label: "Profit & Loss", keys: ["P", "L"], action: () => router.visit(route("store.reports.profit-loss", { store_slug: store?.slug })), perms: ["reports", "finance"] },
            { label: "Settings", keys: ["S", "T"], action: () => router.visit(route("store.admin.settings", { store_slug: store?.slug })), perms: ["settings"] }
          ].filter((link) => checkPerm(link.perms)).map((shortcut, idx) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                shortcut.action();
                setIsOpen(false);
              },
              className: "flex items-center justify-between p-3 rounded-xl bg-slate-50:50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-700/30 transition-all group",
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-slate-600 dark:text-slate-300", children: shortcut.label }),
                /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: shortcut.keys.map((key, i) => /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600", children: key }, i)) })
              ]
            },
            idx
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 12, className: "text-indigo-500 dark:text-indigo-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-indigo-600 dark:text-indigo-300", children: "Quick AI Prompts" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-1", children: [
              "How much profit did we make this week?",
              "What's our best selling product?"
            ].map((suggestion, idx) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setQuery(suggestion);
                  inputRef.current?.focus();
                },
                className: "block w-full text-left text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition-colors py-1 truncate",
                children: [
                  '"',
                  suggestion,
                  '"'
                ]
              },
              idx
            )) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-2 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/50", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-[10px] text-slate-500", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("kbd", { className: "font-sans", children: "↑↓" }),
            " navigate"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("kbd", { className: "font-sans", children: "↵" }),
            " select"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-[9px] text-slate-500 dark:text-slate-600 font-medium", children: "VenQore Intelligence" })
      ] })
    ] }),
    isSmartCaptureOpen && /* @__PURE__ */ jsx(
      SmartCapturePanel,
      {
        isOpen: isSmartCaptureOpen,
        onClose: () => setIsSmartCaptureOpen(false),
        initialTab: smartCaptureTab
      }
    )
  ] });
}
function AiAssistantModal({
  isOpen,
  onClose,
  onMinimize,
  initialQuery = "",
  settings = {},
  store: propStore = null
}) {
  const { store: pageStore } = usePage().props;
  const activeStore = propStore || pageStore;
  const [query, setQuery] = useState(initialQuery);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    const saved = sessionStorage.getItem("amd_ai_messages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
      }
    }
  }, []);
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("amd_ai_messages", JSON.stringify(messages));
    }
  }, [messages]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
      handleSend(initialQuery);
    }
  }, [isOpen, initialQuery]);
  const handleSend = async (customQuery = null) => {
    const q = customQuery || query;
    if (!q.trim() || isLoading) return;
    const userMessage = { role: "user", content: q };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);
    try {
      console.log("AI Assistant Query:", q, "Store:", activeStore?.slug);
      const res = await window.axios.get(route("store.ai.query", { store_slug: activeStore?.slug }), { params: { query: q } });
      const aiMessage = {
        role: "assistant",
        content: res.data.answer,
        relatedLinks: getRelatedLinks(q)
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const isLocked = err.response?.status === 402 || err.response?.data?.code === "ai_locked";
      const errorMessage = {
        role: "assistant",
        content: err.response?.data?.message || err.response?.data?.error || "Sorry, I couldn't process that request. (" + err.message + ")",
        isError: true,
        isLocked
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  const iconMap = {
    TrendingUp,
    DollarSign,
    Package,
    Users
  };
  const getRelatedLinks = (q) => {
    const lower = q.toLowerCase();
    const links = [];
    if (lower.includes("profit") || lower.includes("loss") || lower.includes("margin")) {
      links.push({ label: "View P&L Report", route: "store.reports.profit-loss", iconName: "TrendingUp" });
    }
    if (lower.includes("sales") || lower.includes("revenue") || lower.includes("sold")) {
      links.push({ label: "Sales Dashboard", route: "store.sales.dashboard", iconName: "DollarSign" });
    }
    if (lower.includes("stock") || lower.includes("inventory") || lower.includes("product")) {
      links.push({ label: "Inventory", route: "store.inventory.dashboard", iconName: "Package" });
    }
    if (lower.includes("expense") || lower.includes("cost") || lower.includes("spending")) {
      links.push({ label: "Expenses", route: "expenses.index", iconName: "DollarSign" });
    }
    if (lower.includes("customer") || lower.includes("party") || lower.includes("supplier") || lower.includes("owe")) {
      links.push({ label: "Parties", route: "store.parties.index", iconName: "Users" });
    }
    return links.slice(0, 3);
  };
  const handleClearHistory = () => {
    setMessages([]);
    sessionStorage.removeItem("amd_ai_messages");
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const suggestedQuestions = [
    "How much profit did we make this week?",
    "What are our best selling products?",
    "Show me today's sales summary",
    "What's our current stock level for milk?",
    "How much did we spend on expenses this month?"
  ];
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[200] flex items-center justify-center p-4", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/95 to-slate-950 backdrop-blur-xl",
        onClick: onClose,
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-10 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px]" }),
          /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 right-10 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[80px]" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-3xl h-[80vh] flex flex-col bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 border-b border-slate-800/50 bg-gradient-to-r from-indigo-900/30 to-purple-900/30", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/25", children: /* @__PURE__ */ jsx(Sparkles, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white", children: "VenQore AI Assistant" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Ask anything about your business" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          messages.length > 0 && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleClearHistory,
              className: "px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors",
              children: "Clear History"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onMinimize,
              className: "p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors",
              title: "Minimize",
              children: /* @__PURE__ */ jsx(Minimize2, { size: 18 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              className: "p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors",
              title: "Close",
              children: /* @__PURE__ */ jsx(X, { size: 18 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-5 space-y-4", children: messages.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Sparkles, { size: 32, className: "text-indigo-400" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-white mb-2", children: "How can I help you today?" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm mb-8 max-w-md", children: "Ask me about your sales, profits, stock levels, expenses, or any business data." }),
        /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-widest mb-3", children: "Try asking" }),
          suggestedQuestions.slice(0, 4).map((q, idx) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => handleSend(q),
              className: "w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 text-slate-300 hover:text-white transition-all text-sm",
              children: [
                '"',
                q,
                '"'
              ]
            },
            idx
          ))
        ] })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        messages.map((msg, idx) => /* @__PURE__ */ jsx(
          "div",
          {
            className: `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`,
            children: /* @__PURE__ */ jsxs("div", { className: `max-w-[80%] ${msg.role === "user" ? "bg-indigo-600 text-white rounded-2xl rounded-tr-md" : msg.isError ? "bg-red-900/30 text-red-300 border border-red-800/50 rounded-2xl rounded-tl-md" : "bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-md"} p-4`, children: [
              msg.role === "assistant" && !msg.isError && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/30", children: [
                /* @__PURE__ */ jsx(Sparkles, { size: 14, className: "text-indigo-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-indigo-400", children: "AI Insight" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed whitespace-pre-line", children: msg.content }),
              msg.isLocked && /* @__PURE__ */ jsx("div", { className: "mt-3 pt-3 border-t border-red-800/40 flex flex-wrap gap-2", children: /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.billing", { store_slug: activeStore?.slug }),
                  onClick: onMinimize,
                  className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Sparkles, { size: 12 }),
                    "Unlock AI (Buy usage or BYOK)",
                    /* @__PURE__ */ jsx(ExternalLink, { size: 10 })
                  ]
                }
              ) }),
              msg.relatedLinks && msg.relatedLinks.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-4 pt-3 border-t border-slate-700/30 flex flex-wrap gap-2", children: msg.relatedLinks.map((link, linkIdx) => {
                const IconComponent = iconMap[link.iconName];
                return /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: route(link.route, { store_slug: activeStore?.slug }),
                    onClick: onMinimize,
                    className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors",
                    children: [
                      IconComponent && /* @__PURE__ */ jsx(IconComponent, { size: 12 }),
                      link.label,
                      /* @__PURE__ */ jsx(ExternalLink, { size: 10 })
                    ]
                  },
                  linkIdx
                );
              }) })
            ] })
          },
          idx
        )),
        isLoading && /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsx("div", { className: "bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-md p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin text-indigo-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400", children: "Analyzing your data..." })
        ] }) }) }),
        /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-5 border-t border-slate-800/50 bg-slate-900/50", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-2 focus-within:border-indigo-500/50 transition-colors", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: inputRef,
              type: "text",
              value: query,
              onChange: (e) => setQuery(e.target.value),
              onKeyDown: handleKeyDown,
              placeholder: "Ask about sales, profits, stock, expenses...",
              className: "flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 px-3 py-2",
              disabled: isLoading
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleSend(),
              disabled: !query.trim() || isLoading,
              className: "p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all",
              children: isLoading ? /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }) : /* @__PURE__ */ jsx(Send, { size: 18 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-center text-[10px] text-slate-600 mt-3", children: [
          "Powered by ",
          settings?.ai_provider === "openai" ? "OpenAI GPT" : "Google Gemini",
          " • Your data stays private"
        ] })
      ] })
    ] })
  ] });
}
function FloatingAiBubble({
  onClick,
  onClose,
  messageCount = 0
}) {
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef(null);
  const hasDragged = useRef(false);
  useEffect(() => {
    const saved = sessionStorage.getItem("amd_ai_bubble_position");
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        setPosition({
          x: Math.min(pos.x, window.innerWidth - 80),
          y: Math.min(pos.y, window.innerHeight - 80)
        });
      } catch (e) {
      }
    }
  }, []);
  useEffect(() => {
    if (!isDragging) {
      sessionStorage.setItem("amd_ai_bubble_position", JSON.stringify(position));
    }
  }, [position, isDragging]);
  const handleMouseDown = (e) => {
    if (e.target.closest("[data-close-button]")) return;
    setIsDragging(true);
    hasDragged.current = false;
    const rect = bubbleRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 80));
    const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 80));
    setPosition({ x: newX, y: newY });
    hasDragged.current = true;
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  const handleTouchStart = (e) => {
    if (e.target.closest("[data-close-button]")) return;
    const touch = e.touches[0];
    setIsDragging(true);
    hasDragged.current = false;
    const rect = bubbleRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = Math.max(0, Math.min(touch.clientX - dragOffset.x, window.innerWidth - 80));
    const newY = Math.max(0, Math.min(touch.clientY - dragOffset.y, window.innerHeight - 80));
    setPosition({ x: newX, y: newY });
    hasDragged.current = true;
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragOffset]);
  const handleClick = (e) => {
    if (!hasDragged.current && !e.target.closest("[data-close-button]")) {
      onClick();
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: bubbleRef,
      className: `fixed z-[150] select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`,
      style: {
        left: position.x,
        top: position.y,
        transition: isDragging ? "none" : "box-shadow 0.3s ease"
      },
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: handleClick,
            className: `relative group w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-2xl shadow-indigo-500/30 flex items-center justify-center transition-transform ${isDragging ? "scale-110" : "hover:scale-105"}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 blur-md transition-opacity" }),
              /* @__PURE__ */ jsx("div", { className: "relative z-10 text-white", children: /* @__PURE__ */ jsx(Sparkles, { size: 28 }) }),
              /* @__PURE__ */ jsxs("div", { className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg", children: [
                "AI Assistant",
                /* @__PURE__ */ jsx("div", { className: "absolute top-full left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-slate-900 rotate-45" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            "data-close-button": true,
            onClick: onClose,
            className: "absolute -top-2 -left-2 w-6 h-6 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-lg opacity-0 group-hover:opacity-100",
            title: "Close assistant",
            children: /* @__PURE__ */ jsx(X, { size: 12 })
          }
        )
      ]
    }
  );
}
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
                background-color: #0f172a !important;
                border-color: #1e293b !important;
                color: #f8fafc !important;
            }
            .driver-popover-title {
                font-size: 18px !important;
                font-weight: 800 !important;
                color: #1e293b !important;
                margin-bottom: 8px !important;
            }
            .dark .driver-popover-title {
                color: #ffffff !important;
            }
            .driver-popover-description {
                font-size: 14px !important;
                color: #64748b !important;
                line-height: 1.6 !important;
            }
            .dark .driver-popover-description {
                color: #94a3b8 !important;
            }
            .driver-popover-btn {
                border-radius: 10px !important;
                font-weight: 700 !important;
                text-shadow: none !important;
                padding: 8px 16px !important;
                transition: all 0.2s !important;
            }
            .driver-popover-next-btn {
                background-color: #4f46e5 !important;
                color: white !important;
            }
            .driver-popover-prev-btn {
                background-color: #f1f5f9 !important;
                color: #64748b !important;
            }
            .dark .driver-popover-prev-btn {
                background-color: #1e293b !important;
                color: #94a3b8 !important;
            }
            .driver-popover-progress-text {
                font-weight: 600 !important;
                color: #94a3b8 !important;
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
  return /* @__PURE__ */ jsxs("div", { className: "w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-xs py-2 px-4 border-b border-indigo-500/30 shadow-md relative z-[100] flex flex-col md:flex-row items-center justify-between gap-2.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 flex-wrap", children: [
      /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-extrabold tracking-wide uppercase text-[10px]", children: [
        /* @__PURE__ */ jsx(Sparkles, { size: 12, className: "text-indigo-400 animate-pulse" }),
        "LIVE DEMO STORE"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-slate-200 font-medium leading-tight", children: [
        "You are exploring ",
        /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "VenQore" }),
        " with 5 years of live pre-loaded store data."
      ] }),
      timeLeft && /* @__PURE__ */ jsxs("span", { className: "hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700", children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 10, className: "animate-spin" }),
        "Resets in ",
        timeLeft
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-0.5 text-[11px]", children: [
        /* @__PURE__ */ jsxs("span", { className: "px-2 text-slate-400 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(UserCheck, { size: 11, className: "text-indigo-400" }),
          "Role:"
        ] }),
        ["owner", "manager", "cashier", "accountant"].map((role) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleRoleSwitch(role),
            disabled: currentRole === role,
            className: `px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${currentRole === role ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white hover:bg-slate-700/60"}`,
            children: role
          },
          role
        ))
      ] }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/register",
          className: "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold text-[11px] shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all",
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
  return /* @__PURE__ */ jsx("div", { className: "fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom duration-500", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 max-w-sm flex flex-col gap-4 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Download, { size: 20, className: "text-white" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm", children: "Install App" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Add to Home Screen for faster access" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: dismissPrompt,
          className: "text-slate-500 hover:text-white transition-colors",
          children: /* @__PURE__ */ jsx(X, { size: 16 })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleInstallClick,
        className: "w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 relative z-10",
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
  useEffect(() => {
    fetchStats();
  }, []);
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
                flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300
                ${showSuccess ? "bg-green-500 text-white" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-300 dark:border-amber-700"}
                ${isLoading ? "opacity-50 cursor-wait" : ""}
            `,
      title: "Click to donate | Hold to change amount",
      children: [
        showSuccess ? /* @__PURE__ */ jsx(Check, { size: 18, className: "animate-bounce" }) : /* @__PURE__ */ jsx(HeartHandshake, { size: 18, className: isLoading ? "animate-pulse" : "" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-wide opacity-70", children: "Charity" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-black", children: showSuccess ? "Added!" : `${store?.currency_symbol || "Rs"} ${stats.today?.toLocaleString() || 0}` })
        ] })
      ]
    }
  );
  if (showLabel) {
    return /* @__PURE__ */ jsxs("div", { className: "p-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-slate-600 dark:text-slate-350 pl-2", children: "Charity Donations" }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        buttonContent,
        showEdit && /* @__PURE__ */ jsxs("div", { className: "absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-amber-200 dark:border-amber-800/40 p-3 z-50 animate-in fade-in slide-in-from-top-2 min-w-[160px]", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block", children: [
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
                className: "w-20 px-2 py-1.5 text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center focus:ring-2 ring-amber-500/20 outline-none",
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
                className: "p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors",
                children: /* @__PURE__ */ jsx(X, { size: 14 })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-2", children: "Hold button to edit default" })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    buttonContent,
    showEdit && /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-amber-200 dark:border-amber-800/40 p-3 z-50 animate-in fade-in slide-in-from-top-2 min-w-[160px]", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block", children: [
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
            className: "w-20 px-2 py-1.5 text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center focus:ring-2 ring-amber-500/20 outline-none",
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
            className: "p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors",
            children: /* @__PURE__ */ jsx(X, { size: 14 })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-2", children: "Hold button to edit default" })
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
  return /* @__PURE__ */ jsx("div", { className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-500", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#0f172a] border border-slate-700/50 shadow-2xl rounded-2xl p-4 pl-5 flex items-center gap-6 max-w-md w-full relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" }),
    /* @__PURE__ */ jsx("div", { className: "absolute -left-10 top-0 w-20 h-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400 animate-pulse", children: /* @__PURE__ */ jsx(Zap, { size: 16, fill: "currentColor" }) }),
        /* @__PURE__ */ jsx("h4", { className: "font-bold text-white text-md", children: "Update Available" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-xs font-medium", children: [
        "A new version of the application has been released.",
        /* @__PURE__ */ jsx("br", {}),
        "Reload to unlock new features."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: handleReload,
        className: "group bg-emerald-500 hover:bg-emerald-400 text-[#0f172a] font-black py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap",
        children: [
          /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "group-hover:rotate-180 transition-transform duration-500" }),
          "RELOAD"
        ]
      }
    )
  ] }) });
}
function Toast({ toasts = [], removeToast, duration = 4e3 }) {
  return /* @__PURE__ */ jsx("div", { className: "fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none", children: toasts.map((toast) => /* @__PURE__ */ jsx(
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
      className: `pointer-events-auto min-w-[280px] max-w-sm rounded-xl border shadow-lg overflow-hidden animate-in slide-in-from-right-5 fade-in duration-300 ${style.bg} ${style.border}`,
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
  const { flash, limit_grace_status, store } = usePage().props;
  useEffect(() => {
    const handlePlanLimit = (e) => {
      const detail = e.detail || {};
      const feat = detail.feature;
      if (feat && store?.features?.[feat] === true) {
        return;
      }
      setFeature(feat || "limit");
      setMessage(detail.message || "You've reached the limit for your current plan.");
      setCurrentPlan(detail.current_plan || "starter");
      setUpgradeUrl(detail.upgrade_url || "#");
      setBillingUrl(detail.billing_url || "#");
      setPortalUrl(detail.portal_url || "#");
      setCurrentCount(detail.current_count || null);
      setLimit(detail.limit || null);
      setIsOpen(true);
    };
    window.addEventListener("amd:plan-limit", handlePlanLimit);
    return () => window.removeEventListener("amd:plan-limit", handlePlanLimit);
  }, [store?.features]);
  useEffect(() => {
    if (flash?.plan_limit) {
      const detail = flash.plan_limit;
      const feat = detail.feature;
      if (feat && store?.features?.[feat] === true) {
        return;
      }
      setFeature(feat || "limit");
      setMessage(detail.message || "You've reached the limit for your current plan.");
      setCurrentPlan(detail.current_plan || "starter");
      setUpgradeUrl(detail.upgrade_url || "#");
      setBillingUrl(detail.billing_url || "#");
      setPortalUrl(detail.portal_url || "#");
      setCurrentCount(detail.current_count || null);
      setLimit(detail.limit || null);
      setIsOpen(true);
    }
  }, [flash?.plan_limit, store?.features]);
  const planPerks = {
    growth: [
      "Unlimited products (SKUs)",
      "Up to 10 staff accounts",
      "Up to 3 warehouse locations",
      "WooCommerce integration",
      "Growth Engine (AI retention)",
      "Advanced reports",
      "Multi-branch support",
      "Live agent chat support"
    ],
    business: [
      "Everything in Growth",
      "Unlimited staff accounts",
      "Unlimited warehouse locations",
      "Public REST API access",
      "Priority support",
      "White-label ready"
    ]
  };
  const upgradeTo = currentPlan === "starter" || currentPlan === "ltd_1" ? "growth" : currentPlan === "growth" || currentPlan === "ltd_2" ? "business" : "business";
  const isHighestTier = currentPlan === "business" || currentPlan === "ltd_3";
  const upgradeLabel = isHighestTier ? currentPlan?.startsWith("ltd_") ? "Subscription Plans" : "Enterprise / Support" : upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1);
  const upgradePerks = planPerks[upgradeTo] || planPerks.growth;
  const isLtd = currentPlan?.startsWith("ltd_");
  isLtd ? parseInt(currentPlan.replace("ltd_", "")) : 0;
  const featureLabels = {
    sku_limit: { icon: "📦", label: "Product Limit" },
    staff_limit: { icon: "👤", label: "Staff Limit" },
    locations: { icon: "🏪", label: "Warehouse Limit" },
    woocommerce: { icon: "🛒", label: "WooCommerce" },
    api_access: { icon: "🔌", label: "API Access" },
    growth_engine: { icon: "✨", label: "Growth Engine" },
    multi_branch: { icon: "🌐", label: "Multi-Branch" },
    transactions_per_month: { icon: "📈", label: "Transaction Limit" },
    smart_capture: { icon: "📸", label: "Smart Capture" },
    bill_of_materials: { icon: "📋", label: "Bill of Materials" },
    fixed_asset_depreciation: { icon: "📉", label: "Asset Depreciation" },
    fiscal_year_closing: { icon: "🔒", label: "Fiscal Year Closing" },
    live_chat_widget: { icon: "💬", label: "Live Chat Widget" },
    chat_support: { icon: "💬", label: "Live Chat Support" },
    owners_daily_pulse: { icon: "⚡", label: "Daily Pulse" },
    recurring_invoicing: { icon: "🔄", label: "Recurring Invoicing" }
  };
  const getFeatureMeta = (feat) => {
    if (!feat) return { icon: "🔒", label: "Feature" };
    const predefined = featureLabels[feat];
    if (predefined) return predefined;
    const label = feat.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    return { icon: "🔒", label };
  };
  const featureMeta = getFeatureMeta(feature);
  const planColors = {
    starter: "text-slate-400",
    growth: "text-indigo-400",
    business: "text-amber-400"
  };
  const displayCount = currentCount || (limit_grace_status?.is_over_limit && limit_grace_status?.exceeded_feature === feature ? limit_grace_status.current_count : null);
  const displayLimit = limit || (limit_grace_status?.is_over_limit && limit_grace_status?.exceeded_feature === feature ? limit_grace_status.limit : null);
  let stuffName = "items";
  if (feature === "sku_limit") stuffName = "Products";
  else if (feature === "staff_limit") stuffName = "Staff Members";
  else if (feature === "locations") stuffName = "Warehouses";
  return /* @__PURE__ */ jsx(Modal, { show: isOpen, onClose: () => setIsOpen(false), maxWidth: "lg", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-5 pointer-events-none" }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setIsOpen(false),
        className: "absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all",
        children: /* @__PURE__ */ jsx(X, { size: 14 })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 p-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-5 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-amber-400/20 to-orange-600/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg", children: featureMeta.icon }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1.5 flex-wrap", children: [
            /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider", children: [
              featureMeta.label,
              " Reached"
            ] }),
            displayCount !== null && displayLimit !== null && /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30", children: [
              displayCount.toLocaleString(),
              " / ",
              displayLimit.toLocaleString(),
              " ",
              stuffName
            ] }),
            /* @__PURE__ */ jsxs("span", { className: `px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 ${planColors[currentPlan]}`, children: [
              currentPlan,
              " plan"
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white leading-tight", children: isHighestTier ? /* @__PURE__ */ jsx("span", { children: "Plan Limit Reached" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            "Unlock More with",
            " ",
            /* @__PURE__ */ jsx("span", { className: upgradeTo === "business" ? "text-amber-400" : "text-indigo-400", children: upgradeLabel })
          ] }) }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm mt-1 leading-relaxed", children: message }),
          displayCount !== null && displayLimit !== null && /* @__PURE__ */ jsxs("p", { className: "text-amber-400 text-xs font-bold mt-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg px-2.5 py-1 inline-block", children: [
            "Current Usage: ",
            displayCount.toLocaleString(),
            " of ",
            displayLimit.toLocaleString(),
            " ",
            stuffName,
            " reached"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 mb-6", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Crown, { size: 12, className: upgradeTo === "business" ? "text-amber-400" : "text-indigo-400" }),
          "What you unlock with ",
          upgradeLabel
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-2.5", children: upgradePerks.map((perk, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${upgradeTo === "business" ? "bg-amber-500/15 text-amber-400" : "bg-indigo-500/15 text-indigo-400"}`, children: /* @__PURE__ */ jsx(Check, { size: 11, strokeWidth: 3 }) }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-300", children: perk })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
        isLtd ? (
          // LTD user at max tier (ltd_3) — must move to subscription
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: upgradeUrl,
              className: "flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-900/30",
              children: [
                /* @__PURE__ */ jsx(Sparkles, { size: 16 }),
                "Upgrade to Subscription",
                /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
              ]
            }
          )
        ) : (
          // Regular subscription user
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: upgradeUrl,
              className: `
                                    flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-lg
                                    ${upgradeTo === "business" ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-900/20 hover:shadow-amber-900/40" : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-indigo-900/30 hover:shadow-indigo-900/50"}
                                `,
              children: [
                /* @__PURE__ */ jsx(Sparkles, { size: 16 }),
                "Upgrade to ",
                upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1),
                /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
              ]
            }
          )
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: billingUrl,
            className: "flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-medium text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all",
            children: "View Plans"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsOpen(false),
            className: "flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-medium text-sm text-slate-500 hover:text-slate-300 transition-colors",
            children: "Dismiss"
          }
        )
      ] }),
      portalUrl && portalUrl !== "#" ? /* @__PURE__ */ jsxs("p", { className: "text-center text-slate-600 text-xs mt-5", children: [
        "Upgrade takes effect instantly. No downtime. Manage subscription at",
        " ",
        /* @__PURE__ */ jsx("a", { href: portalUrl, className: "text-slate-500 hover:text-slate-300 underline transition-colors", children: "billing portal" }),
        "."
      ] }) : /* @__PURE__ */ jsxs("p", { className: "text-center text-slate-600 text-xs mt-5", children: [
        "Upgrade takes effect instantly. No downtime. You can manage these features inside your",
        " ",
        /* @__PURE__ */ jsx("a", { href: billingUrl, className: "text-slate-500 hover:text-slate-300 underline transition-colors", children: "billing page" }),
        "."
      ] })
    ] })
  ] }) });
}
function GlobalOnboardingWidget({ store }) {
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
    { key: "inventory", label: "Catalog First Product", isDone: metrics.has_products },
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
    const isSetupFlow = path2.includes("/setup") || path2.includes("/new-store") || path2.includes("/start");
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
        className: `fixed right-6 z-[95] w-14 h-14 bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-indigo-500/30 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(99,102,241,0.3)] backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto hover:scale-110 active:scale-95 hover:border-indigo-400/50 transition-all duration-300 group animate-in zoom-in-90 ${showMobileNavBar ? "bottom-[172px] lg:bottom-24" : "bottom-24"}`,
        children: [
          /* @__PURE__ */ jsxs("svg", { className: "absolute w-full h-full -rotate-90", viewBox: "0 0 44 44", children: [
            /* @__PURE__ */ jsx(
              "circle",
              {
                className: "text-slate-100 dark:text-slate-800",
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
                className: "text-indigo-500 transition-all duration-500 ease-out",
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
          /* @__PURE__ */ jsx("div", { className: "relative z-10 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-white transition-colors duration-200", children: /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "animate-pulse" }) }),
          /* @__PURE__ */ jsxs("span", { className: "absolute -top-1 -right-2 bg-rose-600 text-[8px] font-black text-white px-2 py-0.5 rounded-full shadow whitespace-nowrap", children: [
            remainingCount,
            " left"
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: `fixed right-6 z-[95] max-w-sm w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_15px_40px_rgba(99,102,241,0.25)] p-5 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto ${showMobileNavBar ? "bottom-[172px] lg:bottom-24" : "bottom-24"}`, children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => toggleMinimized(true),
        className: "absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700/50",
        title: "Minimize to widget",
        children: /* @__PURE__ */ jsx(Minimize2, { size: 12 })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
      /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider", children: "Setup Checklist" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide", children: remainingCount === 0 ? "All Completed!" : `${remainingCount} steps remaining` })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-4 space-y-1.5 border-t border-b border-slate-100 dark:border-slate-800/80 py-3", children: checklist.map((item, idx) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => handleStepClick(item),
        disabled: item.isDone,
        className: `w-full flex items-center justify-between text-xs p-1.5 rounded-lg transition-all text-left ${item.isDone ? "cursor-not-allowed opacity-80" : "hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"}`,
        title: item.isDone ? `${item.label} completed` : `Click to jump to ${item.label}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: `w-4 h-4 rounded-full flex items-center justify-center transition-all ${item.isDone ? "bg-emerald-500/15 text-emerald-500" : "bg-slate-100 dark:bg-slate-850 text-slate-400"}`, children: item.isDone ? /* @__PURE__ */ jsx(Check, { size: 10, strokeWidth: 3 }) : /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" }) }),
            /* @__PURE__ */ jsx("span", { className: `font-semibold ${item.isDone ? "text-slate-400 dark:text-slate-600 line-through" : "text-slate-750 dark:text-slate-200"}`, children: item.label })
          ] }),
          /* @__PURE__ */ jsx("span", { className: `text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.isDone ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"}`, children: item.isDone ? "Done" : "Start" })
        ]
      },
      idx
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleResume,
          className: "flex-[2] py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]",
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
          className: "flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1",
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
    background: "linear-gradient(135deg, #7c3aed, #dc2626)",
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
  return /* @__PURE__ */ jsxs("div", { className: "w-full bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center justify-between shrink-0 shadow-sm transition-all duration-300", children: [
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
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-black uppercase tracking-wider", children: [
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
function OneGlanceLayout({ children, title, activeMenu, defaultCollapsed = false, hideHeader = false, fullScreen = false, mode = "app", noPadding = false }) {
  const {
    store
  } = usePage().props;
  const isStarterOrLtd1 = store?.plan === "starter" || store?.plan === "ltd_1";
  const { activeInvoices, currentInvoiceId, setCurrentInvoiceId, posSessions, currentPosId, setCurrentPosId, activePurchases, currentPurchaseId, setCurrentPurchaseId } = useWorkspace();
  const { url, props } = usePage();
  const { settings, flash, my_role, userRole: userRoleProp, vensynq_enabled, woocommerce_enabled, is_demo } = props;
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const [currentTime, setCurrentTime] = useState(/* @__PURE__ */ new Date());
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(/* @__PURE__ */ new Date());
    }, 1e3);
    return () => clearInterval(clockInterval);
  }, []);
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
    const isSetupFlow = path.includes("/setup") || path.includes("/new-store") || path.includes("/start");
    if (isCreateFlow || isEditFlow || isReturnFlow || isRefundFlow || isSetupFlow) {
      return false;
    }
    return true;
  })();
  const isSaleInvoiceActive = route().current("store.sales.dashboard") || route().current("store.sales.*") || route().current("store.orders.*") || route().current("store.sales.index");
  const isPurchaseActive = route().current("store.purchases.*") || route().current("store.purchases.index");
  const isHomeActive = route().current("store.dashboard") || route().current("store.home");
  const isExpenseActive = route().current("store.expenses.*") || route().current("store.expenses.index");
  const isStockActive = route().current("store.inventory.*") || route().current("store.inventory.dashboard") || route().current("store.products.*");
  const getMobileTabUrl = (routeName) => {
    if (!store) return "#";
    if (route().has(routeName)) {
      return route(routeName, { store_slug: store.slug });
    }
    return "#";
  };
  const [activeDropdown, setActiveDropdown] = useState(null);
  const pressTimerRef = useRef(null);
  const wasLongPressRef = useRef(false);
  const startPress = (menuKey) => {
    wasLongPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      wasLongPressRef.current = true;
      setActiveDropdown(menuKey);
    }, 400);
  };
  const cancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };
  const handleLinkClick = (menuKey, defaultRouteName) => (e) => {
    if (wasLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      wasLongPressRef.current = false;
      return;
    }
    router.visit(getMobileTabUrl(defaultRouteName));
  };
  const getDropdownOptions = (menuKey) => {
    switch (menuKey) {
      case "sales":
        return [
          { label: "Invoices List", href: "store.sales.index", icon: /* @__PURE__ */ jsx(FileText, { size: 14 }) },
          { label: "New Sale", href: "store.sales.create", icon: /* @__PURE__ */ jsx(Plus, { size: 14 }) },
          { label: "Sales Orders", href: "store.pre-sales.index", icon: /* @__PURE__ */ jsx(ShoppingCart, { size: 14 }) },
          { label: "Proposals", href: "store.proposals.index", icon: /* @__PURE__ */ jsx(FileText, { size: 14 }) },
          { label: "Return History", href: "store.returns-history.index", icon: /* @__PURE__ */ jsx(History, { size: 14 }) },
          { label: "Invoice Reminders", href: "store.invoice-reminders.index", icon: /* @__PURE__ */ jsx(Clock, { size: 14 }) },
          { label: "Recurring Invoices", href: "store.recurring-invoices.index", icon: /* @__PURE__ */ jsx(RefreshCcw, { size: 14 }) }
        ];
      case "purchases":
        return [
          { label: "Purchases List", href: "store.purchases.index", icon: /* @__PURE__ */ jsx(ShoppingBag, { size: 14 }) },
          { label: "New Purchase", href: "store.purchases.create", icon: /* @__PURE__ */ jsx(Plus, { size: 14 }) },
          { label: "Purchase Orders", href: "store.purchase-orders.index", icon: /* @__PURE__ */ jsx(FileText, { size: 14 }) },
          { label: "Debit Notes", href: "store.debit-notes.index", icon: /* @__PURE__ */ jsx(CreditCard, { size: 14 }) }
        ];
      case "dashboard":
        return [
          { label: "Business Dashboard", href: "store.dashboard", icon: /* @__PURE__ */ jsx(LayoutDashboard, { size: 14 }) },
          { label: "Point of Sale (POS)", href: "store.pos", icon: /* @__PURE__ */ jsx(Monitor, { size: 14 }) },
          { label: "New Sale", href: "store.sales.create", icon: /* @__PURE__ */ jsx(Plus, { size: 14 }) },
          { label: "New Purchase", href: "store.purchases.create", icon: /* @__PURE__ */ jsx(Plus, { size: 14 }) },
          { label: "New Expense", action: "expense-modal", icon: /* @__PURE__ */ jsx(CreditCard, { size: 14 }) },
          { label: "All Parties", href: "store.parties.index", icon: /* @__PURE__ */ jsx(Users, { size: 14 }) },
          { label: "All Inventory", href: "store.inventory.index", icon: /* @__PURE__ */ jsx(Box, { size: 14 }) }
        ];
      case "expenses":
        return [
          { label: "Expenses List", href: "store.expenses.index", icon: /* @__PURE__ */ jsx(CreditCard, { size: 14 }) },
          { label: "New Expense", action: "expense-modal", icon: /* @__PURE__ */ jsx(Plus, { size: 14 }) }
        ];
      case "stock":
        return [
          { label: "Products List", href: "store.inventory.index", icon: /* @__PURE__ */ jsx(Box, { size: 14 }) },
          { label: "Categories", href: "store.categories.index", icon: /* @__PURE__ */ jsx(Layers, { size: 14 }) },
          { label: "Attributes", href: "store.attributes.index", icon: /* @__PURE__ */ jsx(Settings, { size: 14 }) },
          { label: "Stock Levels", href: "store.inventory.stock-levels", icon: /* @__PURE__ */ jsx(BarChart2, { size: 14 }) },
          { label: "Stock Adjustments", href: "store.stock-operations", query: { tab: "adjustments" }, icon: /* @__PURE__ */ jsx(Layers, { size: 14 }) },
          { label: "Warehouses", href: "store.stock-operations", query: { tab: "warehouses" }, icon: /* @__PURE__ */ jsx(Box, { size: 14 }) },
          { label: "Stock Transfers", href: "store.stock-transfers.index", icon: /* @__PURE__ */ jsx(RefreshCcw, { size: 14 }) },
          { label: "Stock Audit", href: "store.stock-takes.index", icon: /* @__PURE__ */ jsx(Search, { size: 14 }) },
          { label: "Batch Tracking", href: "store.batches.index", icon: /* @__PURE__ */ jsx(Package, { size: 14 }) },
          { label: "Serial Tracking", href: "store.serials.index", icon: /* @__PURE__ */ jsx(Package, { size: 14 }) },
          { label: "Production", href: "store.production.index", icon: /* @__PURE__ */ jsx(Factory, { size: 14 }) },
          { label: "Cookbook", href: "store.cookbook.index", icon: /* @__PURE__ */ jsx(BookOpen, { size: 14 }) }
        ];
      default:
        return [];
    }
  };
  const handleOptionClick = (option) => {
    setActiveDropdown(null);
    if (option.action === "expense-modal") {
      router.visit(route("store.expenses.index", { store_slug: store?.slug }) + "?action=add");
      return;
    }
    if (option.href) {
      const url2 = route(option.href, { store_slug: store?.slug, ...option.query || {} });
      router.visit(url2);
    }
  };
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
  const userPerms = props.auth?.user?.permissions || [];
  const hasAnyPerm = (...keys) => keys.some((k) => userPerms.some((p) => p === k || p.startsWith(k + ".")));
  const appMenuItems = [
    {
      name: "Home",
      icon: Home,
      subs: [],
      route: store ? "store.home" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      subs: [],
      route: store ? "store.dashboard" : null,
      routeParams: store ? { store_slug: store.slug } : {}
    },
    store ? {
      name: "AI Scan",
      icon: Sparkles,
      subs: [],
      onClick: () => {
        window.dispatchEvent(new CustomEvent("amd:open-smart-capture", { detail: { tab: "image" } }));
      }
    } : null,
    {
      name: "Sell",
      icon: ShoppingCart,
      // PROBLEM 1 FIX: Cashier sees only POS. All other roles see full Sell menu sub-items.
      subs: props.auth?.user?.role === "cashier" ? [] : [
        { group: "Transactions", items: ["Orders", "Quotations / Pre-Sales", "Proposals"] },
        { group: "Post-Sale", items: ["Returns History", { label: "Invoice Reminders", locked: !store?.features?.invoice_reminders }, { label: "Recurring Invoices", locked: !store?.features?.recurring_invoices }] },
        { group: "Config", items: [{ label: "E-Invoicing (Coming Soon)", locked: true }] }
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
        { group: "Manufacturing", items: [{ label: "Production", locked: !store?.features?.production }, { label: "Cookbook", locked: !store?.features?.bill_of_materials }] }
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
        { group: "Banking", items: [{ label: "Fund Management", locked: !store?.features?.fund_management }, "Bank Accounts", { label: "Bank Reconciliation", locked: !store?.features?.bank_reconciliation }] }
      ],
      route: store ? "store.transactions.index" : "transactions.index",
      routeParams: store ? { store_slug: store.slug } : {}
    },
    {
      name: "VenSynQ",
      icon: RefreshCcw,
      subs: [
        { group: "Multi-Channel", items: ["VenSynQ"] },
        { group: "Promotion", items: [{ label: "Email Marketing", locked: !store?.features?.email_marketing }, { label: "SMS Marketing", locked: !store?.features?.sms_marketing }, { label: "Campaigns", locked: !store?.features?.campaigns }] },
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
        { group: "Growth", items: [!store?.features?.growth_engine ? { label: "Growth Engine", locked: true } : "Growth Engine"] },
        { group: "Financial Health", items: ["Chart of Accounts", "Profit & Loss", "Balance Sheet", "Cash Flow", "Tax Report"] },
        { group: "Sales Analysis", items: ["Sales Report", "Discount Report", "Sale Aging"] },
        { group: "Purchase Analysis", items: ["Purchase Report", "Expense Report"] },
        { group: "Inventory", items: ["Stock Valuation", "Low Stock", "Movement History", "Expiry Report"] },
        { group: "Operational", items: ["Activity Log"] }
      ],
      route: store ? "store.reports.index" : "reports.index",
      routeParams: store ? { store_slug: store.slug } : {}
    }
  ].filter(Boolean);
  const userRole = my_role || userRoleProp || props.auth?.user?.role;
  const isPlatformAdmin = !!props.auth?.user?.is_platform_admin;
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
      name: "Admin Home",
      icon: Home,
      subs: [],
      route: store ? "store.admin.home" : null,
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
    // 'Settings': ['settings'],  // Removed
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
    "Settings": [],
    "System Update": [],
    "Staff Summaries": ["users"],
    "Staff Attendance": ["users"],
    "System Settings": ["settings"],
    "Database": ["settings"]
  };
  const rawMenuItems = mode === "admin" ? adminMenuItems : appMenuItems;
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
    if (item.name === "Home") return true;
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
  useEffect(() => {
    let fontSize = "16px";
    let scale = (parseInt(settings?.ui_scale) || 100) / 100;
    if (settings?.senior_mode === "1") {
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
  }, [isLargeText, settings?.senior_mode, settings?.ui_scale]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (!document.body.contains(event.target)) return;
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuRef, notificationRef, growthRef, mobileMenuRef]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(DemoBanner, {}),
    /* @__PURE__ */ jsx(CommandPalette, {}),
    /* @__PURE__ */ jsx(OnboardingDriver, {}),
    /* @__PURE__ */ jsx(PwaInstallPrompt, {}),
    /* @__PURE__ */ jsx(UpgradeModal, {}),
    /* @__PURE__ */ jsx(ImpersonationBanner, {}),
    /* @__PURE__ */ jsxs("div", { className: `h-full w-full overflow-hidden flex bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300`, children: [
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
      mobileSidebarOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 z-[90] lg:hidden", onClick: () => setMobileSidebarOpen(false) }),
      !fullScreen && /* @__PURE__ */ jsxs(
        "aside",
        {
          ref: sidebarRef,
          onMouseLeave: handleSidebarMouseLeave,
          onClick: handleSidebarInteraction,
          className: `
                            fixed lg:relative inset-y-0 lg:inset-auto lg:top-0 left-0 h-[100vh] shrink-0 z-[100] lg:z-40
                            transform lg:transform-none transition-all duration-300 lg:duration-500 lg:ease-[cubic-bezier(0.2,0.8,0.2,1)]
                            flex flex-col amd-no-drag
                            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                            ${isPlatformAdmin && !store ? isDarkMode ? "bg-[#020617]/95 backdrop-blur-2xl border-r border-white/5" : "bg-white border-r border-slate-200" : "bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900"}
                            ${showExpandedSidebar ? "w-[280px]" : "w-[280px] lg:w-[88px]"}
                            ${isPlatformAdmin && !store ? isDarkMode ? "m-4 rounded-[32px] h-[calc(100vh-32px)] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]" : "border-r border-slate-200 shadow-sm transition-all" : ""}
                        `,
          children: [
            /* @__PURE__ */ jsx("div", { className: "h-24 flex items-center justify-center shrink-0 relative z-10", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx("img", { src: store?.logo_url || "/images/logo.png", alt: "Logo", className: "w-20 h-20 object-contain drop-shadow-md" }) }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleManualToggle,
                className: `
                        hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-md z-50 items-center justify-center text-slate-400 hover:text-indigo-500 transition-all group
                        ${!showExpandedSidebar && "rotate-180"}
                    `,
                children: /* @__PURE__ */ jsx(ChevronLeft, { size: 14, className: "group-hover:scale-125 transition-transform" })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto py-6 px-4 custom-scrollbar relative z-10", onClick: () => setMobileSidebarOpen(false), children: [
              menuItems.map((item) => /* @__PURE__ */ jsx(
                SidebarItem,
                {
                  id: item.name === "Stock" ? "tour-sidebar-stock" : `tour-sidebar-${item.name.toLowerCase()}`,
                  name: item.name,
                  icon: item.icon,
                  subItems: item.subs,
                  route: item.route,
                  routeParams: item.routeParams || { store_slug: store?.slug },
                  menuKey: item.name,
                  onHoverExpand: handleHoverExpand,
                  isPlatformHQ: isPlatformAdmin && !store,
                  isExpanded: showExpandedSidebar,
                  isMenuExpanded: expandedMenu === item.name,
                  isActive: activeMenu === item.name,
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
              (activeInvoices.length > 0 || posSessions.length > 0 || activePurchases && activePurchases.length > 0) && !(isPlatformAdmin && !store) && /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-left-2", children: [
                /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-3 mb-4 px-2 ${!showExpandedSidebar && "justify-center"}`, children: [
                  /* @__PURE__ */ jsx(Activity, { size: 18, className: "text-indigo-500" }),
                  showExpandedSidebar && /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest", children: "Activity Hub" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  (userRole === "owner" || userRole === "admin" || userRole === "manager") && activeInvoices.map((inv, idx) => /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setCurrentInvoiceId(inv.id);
                        if (!url.includes("/sales/invoice/create")) router.visit(route("store.sales.invoice.create", { store_slug: store?.slug }));
                      },
                      className: `
                                            w-full flex items-center gap-3 p-2 rounded-xl transition-all group
                                            ${currentInvoiceId === inv.id && url.includes("/sales/invoice/create") ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}
                                            ${!showExpandedSidebar && "justify-center"}
                                        `,
                      title: `Invoice: ${inv.customer?.name || `Sale #${idx + 1}`}`,
                      children: [
                        /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${currentInvoiceId === inv.id && url.includes("/sales/invoice/create") ? "bg-emerald-500" : "bg-green-500/50"}` }),
                        showExpandedSidebar && /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium truncate", children: [
                          "📄 ",
                          inv.customer?.name || `Sale #${idx + 1}`
                        ] })
                      ]
                    },
                    inv.id
                  )),
                  (userRole === "owner" || userRole === "admin" || userRole === "manager" || userRole === "cashier" || userPerms.includes("pos")) && posSessions.filter((pos) => userRole === "cashier" ? pos.user_id === props.auth?.user?.id : true).map((pos, idx) => /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setCurrentPosId(pos.id);
                        if (!url.startsWith("/pos")) router.visit(route("store.pos", { store_slug: store?.slug }));
                      },
                      className: `
                                            w-full flex items-center gap-3 p-2 rounded-xl transition-all group
                                            ${currentPosId === pos.id && url.startsWith("/pos") ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}
                                            ${!showExpandedSidebar && "justify-center"}
                                        `,
                      title: `POS: ${pos.customer?.name || `Session #${idx + 1}`}`,
                      children: [
                        /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${currentPosId === pos.id && url.startsWith("/pos") ? "bg-emerald-500" : "bg-green-500/50"}` }),
                        showExpandedSidebar && /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium truncate", children: [
                          "🛒 ",
                          pos.customer?.name || `POS #${idx + 1}`
                        ] })
                      ]
                    },
                    pos.id
                  )),
                  activePurchases && (userRole === "owner" || userRole === "admin" || userRole === "manager" || userRole === "purchasing_officer" || userPerms.includes("purchases")) && activePurchases.map((pur, idx) => /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setCurrentPurchaseId(pur.id);
                        if (!url.includes("/purchases/create")) router.visit(route("store.purchases.create", { store_slug: store?.slug }));
                      },
                      className: `
                                            w-full flex items-center gap-3 p-2 rounded-xl transition-all group
                                            ${currentPurchaseId === pur.id && url.includes("/purchases/create") ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}
                                            ${!showExpandedSidebar && "justify-center"}
                                        `,
                      title: `Purchase: ${pur.supplier?.name || `Purchase #${idx + 1}`}`,
                      children: [
                        /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${currentPurchaseId === pur.id && url.includes("/purchases/create") ? "bg-red-500" : "bg-red-500/50"}` }),
                        showExpandedSidebar && /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium truncate", children: [
                          "🛍️ ",
                          pur.supplier?.name || `Purchase #${idx + 1}`
                        ] })
                      ]
                    },
                    pur.id
                  ))
                ] })
              ] }),
              mode === "admin" && !(isPlatformAdmin && !store) && /* @__PURE__ */ jsx("div", { className: "mt-4 px-2", children: /* @__PURE__ */ jsxs(
                Link,
                {
                  href: store ? route("store.dashboard", { store_slug: store.slug }) : "#",
                  className: `
                                    flex items-center gap-3 w-full p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all font-medium border border-indigo-100 dark:border-indigo-800
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
            /* @__PURE__ */ jsxs("div", { className: `border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col gap-3 relative z-10 ${showExpandedSidebar ? "p-4" : "p-2"}`, ref: userMenuRef, children: [
              store && !(isPlatformAdmin && !store) && (userRole === "owner" || userRole === "admin" || userRole === "manager" || userRole === "cashier" || hasAnyPerm("pos")) && /* @__PURE__ */ jsxs(
                Link,
                {
                  href: store ? isPosRoute ? route("store.dashboard", { store_slug: store.slug }) : route("store.pos", { store_slug: store.slug }) : "#",
                  className: `
                            flex items-center justify-center gap-3 w-full py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden shadow-lg hover:shadow-indigo-500/30
                            ${showExpandedSidebar ? "px-4" : "px-0"}
                        `,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-slate-900 z-0", children: [
                      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-indigo-600/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-purple-600/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex items-center gap-3 text-white", children: [
                      /* @__PURE__ */ jsx(Monitor, { size: 24, className: "group-hover:scale-110 transition-transform duration-300" }),
                      /* @__PURE__ */ jsx("span", { className: `font-bold tracking-wide whitespace-nowrap transition-all duration-300 ${showExpandedSidebar ? "w-auto opacity-100" : "w-0 opacity-0 hidden"}`, children: isPosRoute ? "Close POS" : "Open POS" })
                    ] })
                  ]
                }
              ),
              isUserMenuOpen && /* @__PURE__ */ jsxs("div", { className: "absolute bottom-20 left-4 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-bottom-2", children: [
                store && /* @__PURE__ */ jsxs(Link, { href: route("store.profile.edit", { store_slug: store.slug }), className: "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200", children: [
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
                    className: "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium text-indigo-600 dark:indigo-400",
                    children: [
                      /* @__PURE__ */ jsx(Sparkles, { size: 16 }),
                      " Take a Tour"
                    ]
                  }
                ),
                store && (userRole === "owner" || userRole === "admin") && /* @__PURE__ */ jsxs(
                  Link,
                  {
                    id: "tour-sidebar-admin",
                    href: mode === "admin" ? route("store.dashboard", { store_slug: store.slug }) : route("store.admin.home", { store_slug: store.slug }),
                    className: "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200",
                    children: [
                      /* @__PURE__ */ jsx(ShieldCheck, { size: 16, className: mode === "admin" ? "text-indigo-500" : "text-amber-500" }),
                      mode === "admin" ? "Back to Store" : "Admin Panel"
                    ]
                  }
                ),
                userRole === "platform_admin" && /* @__PURE__ */ jsxs(Link, { href: "/updater", className: "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-sm font-medium text-amber-600 dark:text-amber-400", children: [
                  /* @__PURE__ */ jsx(Package, { size: 16 }),
                  " System Update"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
                /* @__PURE__ */ jsxs(Link, { href: route("logout"), method: "post", as: "button", className: "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors text-sm font-medium", children: [
                  /* @__PURE__ */ jsx(LogOut, { size: 16 }),
                  " Logout"
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: `flex items-center ${showExpandedSidebar ? "justify-start px-3 gap-3" : "justify-center px-0 gap-0"} w-full py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700`,
                  onClick: () => setIsUserMenuOpen(!isUserMenuOpen),
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md ring-2 ring-white dark:ring-slate-900", children: (() => {
                      const name = props.auth?.user?.name || "";
                      const email = props.auth?.user?.email || "?";
                      if (name) {
                        const parts = name.split(" ");
                        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                        return name.substring(0, 2).toUpperCase();
                      }
                      return email.substring(0, 2).toUpperCase();
                    })() }),
                    /* @__PURE__ */ jsxs("div", { className: `text-left transition-all duration-300 overflow-hidden ${showExpandedSidebar ? "w-auto opacity-100" : "w-0 opacity-0"}`, children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px]", children: props.auth?.user?.name || props.auth?.user?.email }),
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-semibold text-slate-400 uppercase tracking-wider", children: props.auth?.user?.role === "platform_admin" ? "Hashmi Dashboard" : props.auth?.user?.role || "User" })
                    ] })
                  ]
                }
              )
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("main", { className: `flex-1 flex flex-col h-full min-w-0 relative bg-slate-50 dark:bg-slate-950 transition-opacity duration-500 ease-in-out opacity-100`, children: [
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
            return /* @__PURE__ */ jsxs("div", { className: "w-full px-4 py-2 text-sm font-bold bg-slate-900 text-white flex items-center justify-between shrink-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(X, { size: 16, className: "text-red-500" }),
                /* @__PURE__ */ jsx("span", { children: "Your subscription has expired. The system is in locked mode." })
              ] }),
              /* @__PURE__ */ jsx(Link, { href: `/s/${store.slug}/billing`, className: "px-3 py-1 rounded-md text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors", children: "Upgrade Plan" })
            ] });
          }
          return null;
        })(),
        /* @__PURE__ */ jsx(PlanUsageBanner, {}),
        /* @__PURE__ */ jsx(SubscriptionExpiryBanner, {}),
        !hideHeader && !fullScreen && /* @__PURE__ */ jsxs("header", { className: "h-14 px-4 sm:px-8 flex items-center z-50 relative shrink-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex items-center gap-3 sm:gap-8 text-slate-400", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "lg:hidden p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors",
                onClick: () => setMobileSidebarOpen(true),
                children: /* @__PURE__ */ jsx(Menu, { size: 20 })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col", children: [
              /* @__PURE__ */ jsx("h1", { className: `font-bold tracking-tight whitespace-nowrap ${isPlatformAdmin && !store ? isDarkMode ? "text-2xl text-white" : "text-2xl text-slate-900" : "text-xl text-slate-800 dark:text-white"}`, children: title || (isPlatformAdmin && !store ? "Command Center" : "Overview") }),
              !isPosRoute && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 font-medium", children: [
                "Welcome back, ",
                props.auth?.user?.name || "Abdullah"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { id: "tour-omnisearch", className: "flex-1 max-w-[240px] sm:max-w-xs md:max-w-none", children: /* @__PURE__ */ jsx(
              OmniSearch,
              {
                onAskAi: (query) => {
                  setAiModalQuery(query);
                  setIsAiModalOpen(true);
                  setIsAiMinimized(false);
                }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-none", children: isTrial && !is_demo && /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.billing", { store_slug: store?.slug }),
              className: "hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all group shadow-sm shadow-amber-500/5",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] leading-none", children: [
                  trialDaysLeft,
                  " Days Left"
                ] }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "text-amber-500 group-hover:translate-x-1 transition-transform" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex items-center justify-end gap-2 sm:gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "hidden lg:block", children: /* @__PURE__ */ jsx(CharityButton, {}) }),
            /* @__PURE__ */ jsxs("div", { className: "hidden lg:block relative z-50", ref: growthRef, children: [
              showAiPopup && !isGrowthOpen && props.growth_engine?.popup && /* @__PURE__ */ jsxs("div", { className: "absolute right-full mr-4 top-1/2 -translate-y-1/2 h-16 bg-white dark:bg-slate-900 pr-3 pl-4 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-800 animate-in fade-in slide-in-from-right-4 duration-500 flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-t border-r border-indigo-100 dark:border-indigo-800 rotate-45" }),
                /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 18 }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center w-72", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white truncate", children: "Opportunity Detected" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400 truncate", children: props.growth_engine.popup.description || "New insights available." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-3 h-10", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        setIsGrowthOpen(true);
                        setShowAiPopup(false);
                      },
                      className: "w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors",
                      title: "View Actions",
                      children: /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setShowAiPopup(false),
                      className: "w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                      children: /* @__PURE__ */ jsx(X, { size: 14 })
                    }
                  )
                ] })
              ] }),
              !(isPlatformAdmin && !store) && (userRole === "owner" || userRole === "admin") && /* @__PURE__ */ jsxs(
                "button",
                {
                  id: "tour-growth-engine",
                  onClick: () => setIsGrowthOpen(!isGrowthOpen),
                  className: `group relative flex items-center gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all duration-300 ${isGrowthOpen ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 dark:shadow-none" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"}`,
                  children: [
                    /* @__PURE__ */ jsx(Sparkles, { size: 16, className: isGrowthOpen ? "text-indigo-200" : "text-indigo-500" }),
                    /* @__PURE__ */ jsx("span", { className: `text-sm font-bold hidden md:inline-block ${isGrowthOpen ? "text-white" : "bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"}`, children: "Growth Engine" }),
                    props.growth_engine?.count > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" })
                  ]
                }
              ),
              isGrowthOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-3 w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right z-[70]", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
                  /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold relative z-10 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "text-yellow-300" }),
                    " Actionable Intelligence"
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-indigo-100 text-xs mt-1 relative z-10", children: [
                    props.growth_engine?.count || 0,
                    " Opportunities detected."
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "p-2 max-h-[400px] overflow-y-auto custom-scrollbar", children: !props.growth_engine?.count || props.growth_engine.count === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-8 text-center text-slate-500", children: [
                  /* @__PURE__ */ jsx(Sparkles, { size: 24, className: "mx-auto mb-2 text-slate-300" }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No new recommendations." })
                ] }) : /* @__PURE__ */ jsx("div", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Head to the dashboard to view detailed insights." }) }) }),
                /* @__PURE__ */ jsx("div", { className: "p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center", children: /* @__PURE__ */ jsxs(Link, { href: route("store.growth-engine.index", { store_slug: store.slug }), className: "text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1", children: [
                  "View All Recommendations ",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                ] }) })
              ] })
            ] }),
            props.auth?.my_stores_count > 1 && /* @__PURE__ */ jsx("div", { className: "hidden lg:block relative", children: /* @__PURE__ */ jsx(StoreSwitcher, {}) }),
            store && !(isPlatformAdmin && !store) && (userRole === "owner" || userRole === "admin") && /* @__PURE__ */ jsxs(
              Link,
              {
                href: mode === "admin" ? store ? route("store.dashboard", { store_slug: store.slug }) : "#" : store ? route("store.admin.home", { store_slug: store.slug }) : "#",
                className: "hidden lg:flex group relative items-center gap-2 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all duration-300",
                children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { size: 16, className: mode === "admin" ? "text-indigo-500" : "text-amber-500" }),
                  /* @__PURE__ */ jsx("span", { className: `text-sm font-bold bg-gradient-to-r ${mode === "admin" ? "from-indigo-600 to-violet-600" : "from-amber-600 to-orange-600"} bg-clip-text text-transparent`, children: mode === "admin" ? "Back to Store" : "Admin Panel" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0 font-mono shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300", children: [
              /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-indigo-500 dark:text-indigo-400 animate-[pulse_2s_infinite]" }),
              /* @__PURE__ */ jsx("span", { children: currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "hidden lg:block relative", ref: displayMenuRef, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setIsDisplayMenuOpen(!isDisplayMenuOpen),
                  className: `p-3 rounded-xl transition-all border shadow-sm relative ${isDisplayMenuOpen ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:shadow-md border-slate-100 dark:border-slate-700"}`,
                  title: "Display Preferences",
                  children: /* @__PURE__ */ jsx(Settings2, { size: 18 })
                }
              ),
              isDisplayMenuOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-[60] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right p-2 space-y-1", children: [
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
                    className: `w-full flex items-center justify-between p-3 rounded-xl transition-all ${settings?.senior_mode === "1" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`,
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx(Type, { size: 16 }),
                        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Senior Mode" })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full relative transition-colors ${settings?.senior_mode === "1" ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings?.senior_mode === "1" ? "left-4.5" : "left-0.5"}` }) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setIsDarkMode(!isDarkMode),
                    className: `w-full flex items-center justify-between p-3 rounded-xl transition-all ${isDarkMode ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`,
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        isDarkMode ? /* @__PURE__ */ jsx(Sun, { size: 16 }) : /* @__PURE__ */ jsx(Moon, { size: 16 }),
                        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: isDarkMode ? "Light Mode" : "Dark Mode" })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? "left-4.5" : "left-0.5"}` }) })
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
                  className: `p-3 rounded-xl transition-all border shadow-sm relative ${isMobileMenuOpen ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:shadow-md border-slate-100 dark:border-slate-700"}`,
                  title: "More Options",
                  children: /* @__PURE__ */ jsx(MoreVertical, { size: 18 })
                }
              ),
              isMobileMenuOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-[60] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right p-2 space-y-2", children: [
                (props.auth?.my_stores_count > 1 || String(settings?.charity_enabled) === "1" || settings?.charity_enabled === true) && /* @__PURE__ */ jsxs("div", { className: "p-2 border-b border-slate-100 dark:border-slate-800 flex items-end justify-between gap-3", children: [
                  props.auth?.my_stores_count > 1 ? /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1", children: "Switch Store" }),
                    /* @__PURE__ */ jsx(StoreSwitcher, {})
                  ] }) : /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-slate-600 dark:text-slate-355 pl-2 pb-2", children: "Charity Donations" }),
                  (String(settings?.charity_enabled) === "1" || settings?.charity_enabled === true) && /* @__PURE__ */ jsx("div", { className: "flex-none", children: /* @__PURE__ */ jsx(CharityButton, {}) })
                ] }),
                store && !(isPlatformAdmin && !store) && (userRole === "owner" || userRole === "admin") && /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: mode === "admin" ? store ? route("store.dashboard", { store_slug: store.slug }) : "#" : store ? route("store.admin.home", { store_slug: store.slug }) : "#",
                    className: `flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold ${mode === "admin" ? "text-indigo-600" : "text-amber-600"}`,
                    children: [
                      /* @__PURE__ */ jsx(ShieldCheck, { size: 16, className: mode === "admin" ? "text-indigo-500" : "text-amber-500" }),
                      /* @__PURE__ */ jsx("span", { children: mode === "admin" ? "Back to Store" : "Admin Panel" })
                    ]
                  }
                ),
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
                      className: `w-full flex items-center justify-between p-3 rounded-xl transition-all ${settings?.senior_mode === "1" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`,
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx(Type, { size: 16 }),
                          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Senior Mode" })
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full relative transition-colors ${settings?.senior_mode === "1" ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings?.senior_mode === "1" ? "left-4.5" : "left-0.5"}` }) })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setIsDarkMode(!isDarkMode),
                      className: `w-full flex items-center justify-between p-3 rounded-xl transition-all ${isDarkMode ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`,
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          isDarkMode ? /* @__PURE__ */ jsx(Sun, { size: 16 }) : /* @__PURE__ */ jsx(Moon, { size: 16 }),
                          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: isDarkMode ? "Light Mode" : "Dark Mode" })
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`, children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? "left-4.5" : "left-0.5"}` }) })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1", children: [
                  store && /* @__PURE__ */ jsxs(Link, { href: route("store.profile.edit", { store_slug: store.slug }), className: "flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200", children: [
                    /* @__PURE__ */ jsx(User, { size: 16 }),
                    " Profile Settings"
                  ] }),
                  /* @__PURE__ */ jsxs(Link, { href: route("logout"), method: "post", as: "button", className: "flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors text-sm font-medium", children: [
                    /* @__PURE__ */ jsx(LogOut, { size: 16 }),
                    " Logout"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", ref: notificationRef, children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setIsNotificationsOpen(!isNotificationsOpen),
                  className: `p-3 rounded-xl transition-all border shadow-sm relative ${isNotificationsOpen ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:shadow-md border-slate-100 dark:border-slate-700"}`,
                  children: [
                    /* @__PURE__ */ jsx(Bell, { size: 18 }),
                    props.auth.unread_notifications_count > 0 && /* @__PURE__ */ jsx("span", { className: "absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse" })
                  ]
                }
              ),
              isNotificationsOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-[60] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white", children: "Notifications" }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => store && router.post(route("store.notifications.mark-all-read", { store_slug: store.slug })),
                      className: "text-xs text-indigo-500 font-medium hover:underline",
                      children: "Mark all read"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1", children: props.auth.notifications && props.auth.notifications.length > 0 ? props.auth.notifications.map((notification) => /* @__PURE__ */ jsx("div", { className: `p-3 rounded-xl transition-colors ${notification.read_at ? "hover:bg-slate-50 dark:hover:bg-slate-800/50" : "bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notification.read_at ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-indigo-100 dark:bg-indigo-800 text-indigo-600"}`, children: /* @__PURE__ */ jsx(Bell, { size: 14 }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-800 dark:text-white", children: notification.data?.title || "Notification" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 dark:text-slate-400 mt-0.5", children: notification.data?.message || "No details available" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1", children: new Date(notification.created_at).toLocaleString() })
                  ] })
                ] }) }, notification.id)) : /* @__PURE__ */ jsx("div", { className: "p-6 text-center text-slate-500", children: /* @__PURE__ */ jsx("p", { className: "text-xs", children: "No notifications yet." }) }) }),
                /* @__PURE__ */ jsx("div", { className: "p-2 border-t border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center", children: /* @__PURE__ */ jsx(Link, { href: store ? route("store.notifications.index", { store_slug: store.slug }) : "#", className: "text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors", children: "View All Notifications" }) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `flex-1 min-h-0 overflow-y-auto h-full w-full animate-[fadeIn_0.4s_ease-out] ${noPadding ? "" : "px-2 sm:px-8 pb-8"}`, children: [
          children,
          showMobileNavBar && /* @__PURE__ */ jsx("div", { className: "lg:hidden w-full shrink-0", style: { height: "80px" }, "aria-hidden": "true" })
        ] })
      ] }),
      isIdle && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-500", children: /* @__PURE__ */ jsxs("div", { className: "text-center text-white space-y-6 max-w-lg p-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse", children: /* @__PURE__ */ jsx(Clock, { size: 48, className: "text-indigo-400" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold tracking-tight", children: "Session Paused" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xl text-slate-300", children: [
          "We haven't detected any activity for ",
          parseInt(settings?.auto_logout) || 60,
          " minutes. Your session has been paused to secure your work."
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsIdle(false),
            className: "px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all hover:scale-105",
            children: "I'm Back, Resume Work"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx(
        AiAssistantModal,
        {
          isOpen: isAiModalOpen,
          onClose: () => {
            setIsAiModalOpen(false);
            setAiModalQuery("");
          },
          onMinimize: () => {
            setIsAiModalOpen(false);
            setIsAiMinimized(true);
            setAiModalQuery("");
          },
          initialQuery: aiModalQuery,
          settings,
          store
        }
      ),
      isAiMinimized && /* @__PURE__ */ jsx(
        FloatingAiBubble,
        {
          onClick: () => {
            setIsAiMinimized(false);
            setIsAiModalOpen(true);
          },
          onClose: () => setIsAiMinimized(false),
          messageCount: aiMessageCount
        }
      )
    ] }),
    /* @__PURE__ */ jsx(PwaInstallPrompt, {}),
    /* @__PURE__ */ jsx(VersionChecker, {}),
    /* @__PURE__ */ jsx(OnboardingDriver, {}),
    /* @__PURE__ */ jsx(GlobalOnboardingWidget, { store }),
    showMobileNavBar && /* @__PURE__ */ jsx("div", { className: "lg:hidden fixed bottom-5 left-4 right-4 z-[100] animate-in slide-in-from-bottom-6 cubic-bezier(0.16, 1, 0.3, 1) duration-500", children: /* @__PURE__ */ jsxs("div", { className: "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/40 dark:border-slate-800/60 rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.4)] px-3 py-2 flex items-center justify-between gap-1 relative", children: [
      activeDropdown && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs transition-opacity", onClick: () => setActiveDropdown(null) }),
        /* @__PURE__ */ jsxs("div", { className: "absolute left-3 right-3 bottom-[4.5rem] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-[120] animate-in slide-in-from-bottom-2 duration-200 max-h-[60vh] overflow-y-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest", children: [
              activeDropdown,
              " Options"
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => setActiveDropdown(null), className: "p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: getDropdownOptions(activeDropdown).map((option, idx) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => handleOptionClick(option),
              className: "flex items-center gap-2 px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150/50 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all text-left text-xs font-extrabold",
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400 shrink-0", children: option.icon }),
                /* @__PURE__ */ jsx("span", { className: "truncate", children: option.label })
              ]
            },
            idx
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "absolute -top-3 right-6 z-[105]", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: (e) => {
            e.stopPropagation();
            setIsMobileFabsOpen(!isMobileFabsOpen);
          },
          id: "mobile-fabs-toggle-bud",
          className: "px-2.5 py-1 rounded-full bg-slate-900/90 dark:bg-slate-950/90 border border-indigo-500/40 flex items-center gap-1 text-white shadow-lg shadow-indigo-500/20 hover:border-indigo-400 cursor-pointer relative active:scale-95 transition-all duration-300 text-[10px] font-bold uppercase tracking-wider",
          children: [
            /* @__PURE__ */ jsx("span", { className: "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping opacity-75" }),
            /* @__PURE__ */ jsx("span", { className: "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500" }),
            budIconType === "setup" ? /* @__PURE__ */ jsx(Sparkles, { size: 10, className: "text-indigo-400 animate-in fade-in zoom-in duration-300" }) : /* @__PURE__ */ jsx(MessageSquare, { size: 10, className: "text-indigo-400 animate-in fade-in zoom-in duration-300" }),
            /* @__PURE__ */ jsx(ChevronUp, { size: 10, className: `transition-transform duration-300 ${isMobileFabsOpen ? "rotate-180" : ""}` })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: getMobileTabUrl("store.sales.index"),
          onMouseDown: () => startPress("sales"),
          onMouseUp: cancelPress,
          onMouseLeave: cancelPress,
          onTouchStart: () => startPress("sales"),
          onTouchEnd: cancelPress,
          onContextMenu: (e) => e.preventDefault(),
          onClick: handleLinkClick("sales", "store.sales.index"),
          className: `flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${isSaleInvoiceActive ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`,
          children: [
            /* @__PURE__ */ jsx(ShoppingCart, { size: 20, className: `transition-transform duration-300 ${isSaleInvoiceActive ? "scale-110" : ""}` }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap", children: "Sale" }),
            isSaleInvoiceActive && /* @__PURE__ */ jsx("span", { className: "absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: getMobileTabUrl("store.purchases.index"),
          onMouseDown: () => startPress("purchases"),
          onMouseUp: cancelPress,
          onMouseLeave: cancelPress,
          onTouchStart: () => startPress("purchases"),
          onTouchEnd: cancelPress,
          onContextMenu: (e) => e.preventDefault(),
          onClick: handleLinkClick("purchases", "store.purchases.index"),
          className: `flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${isPurchaseActive ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`,
          children: [
            /* @__PURE__ */ jsx(ShoppingBag, { size: 20, className: `transition-transform duration-300 ${isPurchaseActive ? "scale-110" : ""}` }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap", children: "Purchase" }),
            isPurchaseActive && /* @__PURE__ */ jsx("span", { className: "absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: getMobileTabUrl("store.dashboard"),
          onMouseDown: () => startPress("dashboard"),
          onMouseUp: cancelPress,
          onMouseLeave: cancelPress,
          onTouchStart: () => startPress("dashboard"),
          onTouchEnd: cancelPress,
          onContextMenu: (e) => e.preventDefault(),
          onClick: handleLinkClick("dashboard", "store.dashboard"),
          className: `flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${isHomeActive ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`,
          children: [
            /* @__PURE__ */ jsx(LayoutDashboard, { size: 20, className: `transition-transform duration-300 ${isHomeActive ? "scale-110" : ""}` }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap", children: "Dashboard" }),
            isHomeActive && /* @__PURE__ */ jsx("span", { className: "absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: getMobileTabUrl("store.expenses.index"),
          onMouseDown: () => startPress("expenses"),
          onMouseUp: cancelPress,
          onMouseLeave: cancelPress,
          onTouchStart: () => startPress("expenses"),
          onTouchEnd: cancelPress,
          onContextMenu: (e) => e.preventDefault(),
          onClick: handleLinkClick("expenses", "store.expenses.index"),
          className: `flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${isExpenseActive ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`,
          children: [
            /* @__PURE__ */ jsx(CreditCard, { size: 20, className: `transition-transform duration-300 ${isExpenseActive ? "scale-110" : ""}` }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap", children: "Expense" }),
            isExpenseActive && /* @__PURE__ */ jsx("span", { className: "absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: getMobileTabUrl("store.inventory.index"),
          onMouseDown: () => startPress("stock"),
          onMouseUp: cancelPress,
          onMouseLeave: cancelPress,
          onTouchStart: () => startPress("stock"),
          onTouchEnd: cancelPress,
          onContextMenu: (e) => e.preventDefault(),
          onClick: handleLinkClick("stock", "store.inventory.index"),
          className: `flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${isStockActive ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`,
          children: [
            /* @__PURE__ */ jsx(Box, { size: 20, className: `transition-transform duration-300 ${isStockActive ? "scale-110" : ""}` }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap", children: "Stock" }),
            isStockActive && /* @__PURE__ */ jsx("span", { className: "absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx(Toast, { toasts, removeToast, duration: 4e3 }),
    /* @__PURE__ */ jsx("style", { children: `
                @media (max-width: 1023px) {
                    /* Hide FABs by translating down */
                    div[class*="z-[55]"],
                    div[class*="z-[95]"],
                    div[class*="z-[150]"] {
                        transform: translateY(400px) !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease !important;
                    }
                    /* Slide up when active and offset slightly higher to clear bottom bar/bud overlap */
                    body.mobile-fabs-expanded div[class*="z-[55]"],
                    body.mobile-fabs-expanded div[class*="z-[95]"],
                    body.mobile-fabs-expanded div[class*="z-[150]"] {
                        transform: translateY(-20px) !important;
                        opacity: 1 !important;
                        pointer-events: auto !important;
                    }
                }
            ` })
  ] });
}
export {
  FeatureLockBadge as F,
  OneGlanceLayout as O,
  Toast as T,
  closeLemonCheckout as c,
  openLemonCheckout as o,
  preloadLemonCheckout as p
};

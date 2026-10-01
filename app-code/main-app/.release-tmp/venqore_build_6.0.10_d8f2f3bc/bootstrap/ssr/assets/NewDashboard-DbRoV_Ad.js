import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePage, router, Head } from "@inertiajs/react";
import axios from "axios";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { c as useAppearance } from "../ssr.js";
import { g as getCurrencySymbol } from "./format-Dor_DYzH.js";
import { P as PaymentModal, R as RightPanel } from "./RightPanel-UnfLd5Y4.js";
import { u as useTermText } from "./terms-BnWz3Igl.js";
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Box, Building2, X, RefreshCw, FileText, Tag } from "lucide-react";
import "./plans-Dp89V3MJ.js";
import "./runtime-zM7XrUga.js";
import "./Input-B_UmKR56.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
function FramePicker({ frames = [], value, onChange, disabled = false }) {
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-4", "aria-label": "Dashboard frame", children: [
    frames.map((frame) => {
      const columns = Math.max(...frame.slots.map((slot) => slot.x + slot.w));
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          "aria-pressed": value === frame.key,
          disabled,
          onClick: () => onChange?.(frame.key),
          className: `rounded-card border p-3 text-left ${value === frame.key ? "border-accent" : "border-line"}`,
          children: [
            /* @__PURE__ */ jsx("span", { className: "mb-3 block text-sm font-semibold", children: frame.name }),
            /* @__PURE__ */ jsx("span", { className: "relative block aspect-video overflow-hidden rounded-sm bg-line", "aria-hidden": "true", children: frame.slots.map((slot) => /* @__PURE__ */ jsx(
              "i",
              {
                className: "absolute bg-surface outline outline-1 outline-line",
                style: {
                  left: `${slot.x / columns * 100}%`,
                  top: `${slot.y / frame.rows * 100}%`,
                  width: `${slot.w / columns * 100}%`,
                  height: `${slot.h / frame.rows * 100}%`
                }
              },
              slot.slot
            )) })
          ]
        },
        frame.key
      );
    }),
    disabled && /* @__PURE__ */ jsx("p", { className: "col-span-full text-sm text-muted", children: "Your manager set this layout." })
  ] });
}
const gradientMapping = {
  blue: "linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))",
  purple: "linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))",
  red: "linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))",
  indigo: "linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))",
  orange: "linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))",
  green: "linear-gradient(hsl(123, 90%, 40%), hsl(108, 90%, 40%))",
  teal: "linear-gradient(135deg, #0baa8f, #076b5e)",
  coral: "linear-gradient(135deg, #f26a47, #b94526)",
  sky: "linear-gradient(135deg, #2ba5d1, #1b7096)",
  lime: "linear-gradient(135deg, #8ccb2e, #5e8c15)",
  rose: "linear-gradient(135deg, #f43f5e, #be123c)"
};
const GlassIcons = ({ items = [], className = "", onActionClick }) => {
  const getBackgroundStyle = (color) => {
    if (gradientMapping[color]) {
      return { background: gradientMapping[color] };
    }
    return { background: color };
  };
  return /* @__PURE__ */ jsx("div", { className: `icon-btns ${className || ""}`, children: items.map((item, index) => /* @__PURE__ */ jsxs(
    "button",
    {
      className: `icon-btn ${item.customClass || ""}`,
      "aria-label": item.label,
      type: "button",
      onClick: () => {
        if (onActionClick) onActionClick(item);
        else if (item.action) item.action();
        else if (item.onClick) item.onClick();
        else if (item.href) window.location.href = item.href;
      },
      children: [
        /* @__PURE__ */ jsx("span", { className: "icon-btn__back", style: getBackgroundStyle(item.color) }),
        /* @__PURE__ */ jsx("span", { className: "icon-btn__front", children: /* @__PURE__ */ jsx("span", { className: "icon-btn__icon", "aria-hidden": "true", children: item.icon }) }),
        /* @__PURE__ */ jsx("span", { className: "icon-btn__label", children: item.label })
      ]
    },
    index
  )) });
};
const ActionMenu = ({ isOpen, onClose, store, onAction, can }) => {
  const tt = useTermText();
  if (!isOpen) return null;
  const actions = [
    { label: "Payment In", icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", action: "payment-in" },
    { label: "Payment Out", icon: ArrowUpRight, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", action: "payment-out" },
    { label: "New Sale", icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", route: "store.sales.invoice.create" },
    { label: "New Purchase", icon: ArrowUpRight, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", route: "store.purchases.create" },
    { label: "Add Product", icon: Box, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20", route: "store.inventory.create" },
    { label: "Add Bank", icon: Building2, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", route: "store.bank-accounts.index", params: { action: "add" } },
    { label: "New Quote", icon: FileText, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", route: "store.proposals.create" },
    { label: "Transfer Stock", icon: RefreshCw, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", route: "store.stock-transfers.create" },
    { label: "Add Category", icon: Tag, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20", route: "store.categories.index" }
  ].filter((action) => can({
    "Payment In": "finance.receive_payment",
    "Payment Out": "finance.send_payment",
    "New Sale": "sales.create",
    "New Purchase": "purchases.create",
    "Add Product": "inventory.create",
    "Add Bank": "finance.journal",
    "New Quote": "sales.quotations",
    "Transfer Stock": "inventory.transfer",
    "Add Category": "inventory.create"
  }[action.label]));
  return /* @__PURE__ */ jsxs("div", { className: "absolute top-full mt-2 right-0 w-72 bg-[#0E1318]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 p-3 z-50 animate-in fade-in zoom-in-95 duration-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center px-2 py-1.5 border-b border-white/10 mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-neutral-300 uppercase tracking-wider", children: "Quick Actions" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          "aria-label": "Close actions menu",
          onClick: onClose,
          className: "p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors",
          children: /* @__PURE__ */ jsx(X, { size: 14 })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto custom-scrollbar", children: actions.map((action, i) => /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => {
          if (action.action) {
            onAction(action.action);
          } else if (action.route) {
            if (typeof route === "function" && store?.slug) {
              router.visit(route(action.route, {
                store_slug: store?.slug,
                ...action.params
              }));
            }
          }
          onClose();
        },
        className: "flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/10 transition-all group",
        children: [
          /* @__PURE__ */ jsx("div", { className: `p-2 rounded-xl mb-1.5 border transition-transform group-hover:scale-110 ${action.bg} ${action.color}`, children: /* @__PURE__ */ jsx(action.icon, { size: 16 }) }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium text-neutral-200 text-center leading-tight", children: tt(action.label) })
        ]
      },
      i
    )) })
  ] });
};
const CashDetailModal = ({ isOpen, onClose, transactions, onNavigate, store }) => {
  if (!isOpen) return null;
  const currencySymbol = getCurrencySymbol(store);
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#0E1318] w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-white/10 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsx("div", { className: "p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20", children: /* @__PURE__ */ jsx(Wallet, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-base", children: "Cash in Hand" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-neutral-400", children: "Main Till Cash Balance" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Close cash details", onClick: onClose, className: "p-1.5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-[#080B10]", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-2xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5", children: "Recent Cash Activity" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-60 overflow-y-auto custom-scrollbar", children: transactions && transactions.length > 0 ? transactions.map((tx, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-sm p-3 bg-white/[0.03] rounded-xl border border-white/5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-white truncate max-w-[200px] text-xs", children: tx.desc || "Cash Movement" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-400", children: tx.date ? new Date(tx.date).toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Recently" })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: `font-bold text-xs ${tx.type === "in" ? "text-emerald-400" : "text-rose-400"}`, children: [
          tx.type === "in" ? "+" : "-",
          " ",
          currencySymbol,
          " ",
          Math.abs(parseFloat(tx.amount || 0)).toLocaleString()
        ] })
      ] }, tx.id || i)) : /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-neutral-500 py-6", children: "No recent cash movements recorded." }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-3.5 grid grid-cols-4 gap-2 border-t border-white/10 bg-[#0E1318]", children: [
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1 p-2 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 border border-emerald-500/20 transition-all group", children: [
        /* @__PURE__ */ jsx(ArrowDownLeft, { size: 15, className: "text-emerald-400 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-emerald-400", children: "Add" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1 p-2 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 border border-rose-500/20 transition-all group", children: [
        /* @__PURE__ */ jsx(ArrowUpRight, { size: 15, className: "text-rose-400 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-rose-400", children: "Remove" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1 p-2 bg-sky-500/10 rounded-xl hover:bg-sky-500/20 border border-sky-500/20 transition-all group", children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 15, className: "text-sky-400 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-sky-400", children: "Transfer" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
        onNavigate("store.funds.index", { view: "history" });
        onClose();
      }, className: "flex flex-col items-center gap-1 p-2 bg-white/5 rounded-xl hover:bg-white/10 border border-white/10 transition-all group", children: [
        /* @__PURE__ */ jsx(FileText, { size: 15, className: "text-neutral-400 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-neutral-300", children: "History" })
      ] })
    ] })
  ] }) });
};
function V6FinancialSidebar({
  recentTransactions = [],
  bankAccounts = [],
  cashAccounts = [],
  cashData = null,
  inventoryValue = 0,
  sticky = false,
  onQuickActions = null,
  className = "",
  props: extraProps = {}
}) {
  const pageProps = usePage().props || {};
  const store = extraProps.store || pageProps.store;
  const auth = extraProps.auth || pageProps.auth;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: "in" });
  const menuRef = useRef(null);
  const userPerms = auth?.user?.permissions || [];
  const can = (permission) => auth?.user?.is_platform_admin || auth?.user?.role === "owner" || userPerms.includes("*") || userPerms.includes(permission);
  const canViewBalances = can("finance.balances");
  const canViewStockValue = can("reports.stock") || can("reports.financial");
  const canViewActivity = can("finance.transactions");
  const canSell = can("pos.checkout") || can("sales.create");
  const canPurchase = can("purchases.create");
  const hasAnyContent = canViewBalances || canViewStockValue || canViewActivity || canSell || canPurchase;
  if (!hasAnyContent) {
    return null;
  }
  const resolvedCashData = cashData || extraProps.cashData || pageProps.cashData;
  const resolvedBankAccounts = bankAccounts && bankAccounts.length > 0 ? bankAccounts : extraProps.bankAccounts || pageProps.bankAccounts || [];
  const resolvedInventoryValue = inventoryValue || extraProps.inventoryValue || pageProps.inventoryValue || 0;
  const resolvedTransactions = recentTransactions && recentTransactions.length > 0 ? recentTransactions : extraProps.recentTransactions || pageProps.recentTransactions || [];
  const glBalance = parseFloat(resolvedCashData?.balance ?? (Array.isArray(pageProps.cashAccounts) ? pageProps.cashAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0) : 0));
  const bankBalance = resolvedBankAccounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);
  const stockVal = parseFloat(resolvedInventoryValue || 0);
  const totalBalance = glBalance + bankBalance;
  const formatMoney = (amount) => {
    const sym = getCurrencySymbol(store) || "Rs";
    const val = parseFloat(amount) || 0;
    const formatted = Math.round(val).toLocaleString("en-PK");
    return `${sym} ${formatted}`;
  };
  const handleNavigate = (r, params = {}) => {
    if (store?.slug && typeof route === "function") {
      try {
        router.visit(route(r, { ...params, store_slug: store?.slug }));
        return;
      } catch (e) {
      }
    }
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);
  const displayBankAccounts = resolvedBankAccounts || [];
  const displayTransactions = (resolvedTransactions || []).slice(0, 3);
  return /* @__PURE__ */ jsxs("div", { className: `w-full h-full flex flex-col gap-2.5 text-white justify-between ${className}`, children: [
    canViewBalances && /* @__PURE__ */ jsx(
      CashDetailModal,
      {
        isOpen: isCashModalOpen,
        onClose: () => setIsCashModalOpen(false),
        transactions: resolvedCashData?.transactions || [],
        onNavigate: handleNavigate,
        store
      }
    ),
    canViewActivity && /* @__PURE__ */ jsx(
      PaymentModal,
      {
        isOpen: paymentModal.isOpen,
        onClose: () => setPaymentModal((p) => ({ ...p, isOpen: false })),
        type: paymentModal.type,
        bankAccounts: resolvedBankAccounts,
        store
      }
    ),
    canViewBalances && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 px-1 pt-0.5 shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-teal-500/15 dark:bg-white/[0.06] border border-teal-500/30 dark:border-white/[0.10] flex items-center justify-center text-teal-700 dark:text-white shadow-inner shrink-0", children: /* @__PURE__ */ jsx(Wallet, { size: 14, strokeWidth: 2.4 }) }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-extrabold text-slate-700 dark:text-neutral-400 uppercase tracking-widest leading-none", children: "TOTAL BALANCE" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-baseline justify-end", children: /* @__PURE__ */ jsx(
        "span",
        {
          className: "text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-none whitespace-nowrap",
          style: {
            fontFamily: "var(--vq-font-numeric)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.025em",
            fontWeight: 800
          },
          children: formatMoney(totalBalance)
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", ref: menuRef, children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
        canSell && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleNavigate(can("pos.checkout") ? "store.pos" : "store.sales.invoice.create"),
            className: "bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-950 dark:bg-emerald-500/[0.10] dark:hover:bg-emerald-500/[0.20] dark:border-emerald-500/30 dark:hover:border-emerald-500/50 dark:text-emerald-300 rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-sm",
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-xl bg-emerald-500/25 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:text-black flex items-center justify-center transition-all duration-200", children: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 14, strokeWidth: 2.5 }) }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black tracking-wider text-emerald-950 dark:text-emerald-300", children: "SALE" })
            ]
          }
        ),
        canPurchase && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleNavigate("store.purchases.create"),
            className: "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 text-amber-950 dark:bg-amber-500/[0.10] dark:hover:bg-amber-500/[0.20] dark:border-amber-500/30 dark:hover:border-amber-500/50 dark:text-amber-300 rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-sm",
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-xl bg-amber-500/25 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 group-hover:bg-amber-600 group-hover:text-white dark:group-hover:text-black flex items-center justify-center transition-all duration-200", children: /* @__PURE__ */ jsx(ArrowUpRight, { size: 14, strokeWidth: 2.5 }) }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black tracking-wider text-amber-950 dark:text-amber-300", children: "PURCHASE" })
            ]
          }
        ),
        canViewBalances && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              if (onQuickActions) {
                onQuickActions();
              } else {
                setIsMenuOpen(!isMenuOpen);
              }
            },
            className: `bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 hover:border-teal-500/50 text-teal-950 dark:bg-teal-500/[0.10] dark:hover:bg-teal-500/[0.20] dark:border-teal-500/30 dark:hover:border-teal-500/50 dark:text-teal-300 rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-sm ${isMenuOpen ? "ring-2 ring-teal-500/50 bg-teal-500/25" : ""}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-xl bg-teal-500/25 dark:bg-teal-500/20 text-teal-800 dark:text-teal-200 group-hover:bg-teal-600 dark:group-hover:bg-teal-400 group-hover:text-white dark:group-hover:text-black flex items-center justify-center transition-all duration-200", children: /* @__PURE__ */ jsx(Plus, { size: 14, strokeWidth: 2.5 }) }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black tracking-wider text-teal-950 dark:text-teal-300", children: "ACTIONS" })
            ]
          }
        )
      ] }),
      canViewBalances && /* @__PURE__ */ jsx(
        ActionMenu,
        {
          isOpen: isMenuOpen,
          onClose: () => setIsMenuOpen(false),
          store,
          can,
          onAction: (act) => {
            if (act === "payment-in") setPaymentModal({ isOpen: true, type: "in" });
            else if (act === "payment-out") setPaymentModal({ isOpen: true, type: "out" });
          }
        }
      )
    ] }),
    canViewBalances && /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        "aria-label": "View Cash in Hand Details",
        onClick: () => setIsCashModalOpen(true),
        className: "w-full text-left bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.07] border border-black/[0.06] hover:border-black/[0.12] dark:border-white/[0.08] dark:hover:border-white/[0.16] rounded-[20px] p-3 flex items-center justify-between transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden group shrink-0",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0", children: /* @__PURE__ */ jsx(Wallet, { size: 14, strokeWidth: 2.2 }) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-900 dark:text-neutral-100", children: "Cash in Hand" })
          ] }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "text-base sm:text-[18px] font-extrabold tracking-tight text-slate-950 dark:text-white text-right whitespace-nowrap",
              style: { fontFamily: "var(--vq-font-numeric)", fontVariantNumeric: "tabular-nums", fontWeight: 800, letterSpacing: "-0.02em" },
              children: formatMoney(glBalance)
            }
          )
        ]
      }
    ),
    canViewStockValue && /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        "aria-label": "View Stock Inventory Details",
        onClick: () => handleNavigate("store.inventory.index"),
        className: "w-full text-left bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.07] border border-black/[0.06] hover:border-black/[0.12] dark:border-white/[0.08] dark:hover:border-white/[0.16] rounded-[20px] p-3 flex items-center justify-between transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden group shrink-0",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0", children: /* @__PURE__ */ jsx(Box, { size: 14, strokeWidth: 2.2 }) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-900 dark:text-neutral-100", children: "Stock Value" })
          ] }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "text-base sm:text-[18px] font-extrabold tracking-tight text-slate-950 dark:text-white text-right whitespace-nowrap",
              style: { fontFamily: "var(--vq-font-numeric)", fontVariantNumeric: "tabular-nums", fontWeight: 800, letterSpacing: "-0.02em" },
              children: formatMoney(stockVal)
            }
          )
        ]
      }
    ),
    canViewBalances && /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1 mb-1.5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-extrabold text-slate-700 dark:text-neutral-400 uppercase tracking-widest", children: "BANK ACCOUNTS" }),
        (can("finance.journal") || can("finance.cheque_books.manage")) && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleNavigate("store.bank-accounts.index", { action: "add" }),
            className: "flex items-center gap-1 text-[10px] font-extrabold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-200 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 px-2.5 py-0.5 rounded-full transition-all",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 11, strokeWidth: 2.5 }),
              /* @__PURE__ */ jsx("span", { children: "Add Bank" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1.5", children: displayBankAccounts.length > 0 ? displayBankAccounts.map((acc) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => handleNavigate("store.bank-accounts.index"),
          className: "w-full text-left bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-black/[0.06] hover:border-black/[0.12] dark:border-white/[0.08] dark:hover:border-white/[0.16] rounded-[20px] p-2.5 flex flex-col gap-1 transition-all duration-200 cursor-pointer group shadow-sm shrink-0",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-teal-500/15 border border-teal-500/25 text-teal-700 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0", children: /* @__PURE__ */ jsx(Building2, { size: 13, strokeWidth: 2 }) }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-900 group-hover:text-black dark:text-neutral-100 dark:group-hover:text-white transition-colors leading-tight", children: acc.bank_name || acc.name })
              ] }),
              /* @__PURE__ */ jsxs(
                "span",
                {
                  className: "text-[10px] text-slate-600 dark:text-neutral-400 font-semibold whitespace-nowrap",
                  style: { fontFamily: "var(--vq-font-numeric)", fontVariantNumeric: "tabular-nums" },
                  children: [
                    "**** ",
                    acc.account_number ? acc.account_number.length > 4 ? acc.account_number.slice(-4) : acc.account_number : "...."
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end", children: /* @__PURE__ */ jsx(
              "span",
              {
                className: `text-base sm:text-[18px] font-extrabold tracking-tight whitespace-nowrap ${parseFloat(acc.current_balance || 0) < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-950 dark:text-white"}`,
                style: { fontFamily: "var(--vq-font-numeric)", fontVariantNumeric: "tabular-nums", fontWeight: 800, letterSpacing: "-0.02em" },
                children: formatMoney(acc.current_balance)
              }
            ) })
          ]
        },
        acc.id
      )) : /* @__PURE__ */ jsx("div", { className: "p-3 text-center text-xs text-neutral-500 dark:text-neutral-400 bg-black/[0.02] dark:bg-white/[0.02] rounded-[16px] border border-dashed border-black/[0.08] dark:border-white/[0.08]", children: "No bank accounts connected" }) })
    ] }),
    canViewActivity && /* @__PURE__ */ jsxs("div", { className: "bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-3 shadow-sm flex flex-col flex-1 min-h-[110px] overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2 shrink-0", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-extrabold text-[10px] text-slate-700 dark:text-neutral-300 uppercase tracking-widest", children: "ACTIVITY" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 text-[10px] font-bold text-slate-700 dark:text-neutral-400", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" }),
            "Sale"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" }),
            "Purchase"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5", children: displayTransactions.length > 0 ? displayTransactions.map((tx, i) => {
        const isSale = tx.activityType === "sale" || tx.type?.toLowerCase().includes("sale") || tx.type?.toLowerCase().includes("transaction");
        const isIncoming = tx.amount?.startsWith("+") || isSale;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center justify-between px-2 py-1.5 rounded-xl bg-black/[0.02] hover:bg-black/[0.05] dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-black/[0.03] dark:border-transparent transition-colors cursor-pointer group",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${isSale ? "bg-teal-500/20 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-500/30 dark:border-teal-500/30" : "bg-amber-500/20 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/30"}`, children: isIncoming ? /* @__PURE__ */ jsx(ArrowDownLeft, { size: 11, strokeWidth: 2.4 }) : /* @__PURE__ */ jsx(ArrowUpRight, { size: 11, strokeWidth: 2.4 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx("span", { className: `w-1 h-1 rounded-full ${isSale ? "bg-teal-600 dark:bg-teal-400" : "bg-amber-600 dark:bg-amber-400"}` }),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-slate-950 group-hover:text-black dark:text-neutral-200 dark:group-hover:text-white transition-colors", children: tx.type || "Transaction" })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-600 dark:text-neutral-400 font-semibold block pl-2", children: tx.time || "Recently" })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: `text-xs sm:text-[13px] font-extrabold tracking-tight whitespace-nowrap ${isIncoming ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`,
                  style: { fontFamily: "var(--vq-font-numeric)", fontVariantNumeric: "tabular-nums", fontWeight: 800 },
                  children: tx.amount
                }
              )
            ]
          },
          i
        );
      }) : /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center py-6 text-center text-xs text-neutral-500 dark:text-neutral-400", children: "No recent activity recorded" }) })
    ] })
  ] });
}
const RECKONER_CATALOG = /* @__PURE__ */ JSON.parse(`[{"key":"core.revenue","label":"Revenue","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Revenue","extra":false,"desc":"All the money that came into your shop from sales. It adds up every customer payment from your cash register, invoices, and receipts. This is the total money customers handed you before taking out any costs or expenses.","insight":"All the money that came into your shop from sales. It adds up every customer payment from your cash register, invoices, and receipts. This is the total money customers handed you before taking out any costs or expenses.","weight":99,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.revenue_trend","label":"Revenue Trend","shape":"TREND","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Revenue Trend","extra":false,"desc":"A day-by-day graph of your sales. It shows how much money came in each day, so you can easily spot your best sales days, your slow days, and whether your sales are going up or down this month.","insight":"A day-by-day graph of your sales. It shows how much money came in each day, so you can easily spot your best sales days, your slow days, and whether your sales are going up or down this month.","weight":96,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.net_profit","label":"Net Profit","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Net Profit","extra":false,"desc":"The real money you actually take home in your pocket. It takes your sales and subtracts everything: the cost of the products, shop rent, staff wages, electricity bills, tea, and taxes. This is your true final profit.","insight":"The real money you actually take home in your pocket. It takes your sales and subtracts everything: the cost of the products, shop rent, staff wages, electricity bills, tea, and taxes. This is your true final profit.","weight":98,"topic":"profit","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.profit_trend","label":"Profit Trend","shape":"TREND","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Profit Trend","extra":false,"desc":"A daily graph showing your actual take-home profit day by day. It shows if you made real money every day or if big bills (like rent or supplier payments) caused you to lose money on certain days.","insight":"A daily graph showing your actual take-home profit day by day. It shows if you made real money every day or if big bills (like rent or supplier payments) caused you to lose money on certain days.","weight":93,"topic":"profit","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.gross_profit","label":"Gross Profit","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Gross Profit","extra":false,"desc":"The profit you make on the items themselves. It takes your sales money and subtracts what you paid to buy those products wholesale. For example, if you sell a shirt for Rs 1,000 that cost you Rs 600, your gross profit is Rs 400.","insight":"The profit you make on the items themselves. It takes your sales money and subtracts what you paid to buy those products wholesale. For example, if you sell a shirt for Rs 1,000 that cost you Rs 600, your gross profit is Rs 400.","weight":90,"topic":"profit","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.gross_margin_pct","label":"Gross Margin %","shape":"GAUGE","unit":"percent","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Gross Margin %","extra":false,"desc":"Shows what percentage of your selling price is profit. For example, a 40% margin means that for every 100 rupees a customer pays you, 40 rupees is profit on the item and 60 rupees covers what you paid to buy it.","insight":"Shows what percentage of your selling price is profit. For example, a 40% margin means that for every 100 rupees a customer pays you, 40 rupees is profit on the item and 60 rupees covers what you paid to buy it.","weight":89,"topic":"profit","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.net_margin_pct","label":"Net Margin %","shape":"GAUGE","unit":"percent","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Net Margin %","extra":false,"desc":"Out of every 100 rupees of sales that comes into your shop, this shows how many rupees stay with you as pure profit after paying every single shop bill and expense.","insight":"Out of every 100 rupees of sales that comes into your shop, this shows how many rupees stay with you as pure profit after paying every single shop bill and expense.","weight":87,"topic":"profit","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.cogs","label":"Cost of Goods Sold","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Cost of Goods Sold","extra":false,"desc":"The wholesale cost of the products you actually sold to customers. It only counts items that were sold, so you know exactly how much you paid to buy that inventory from your suppliers.","insight":"The wholesale cost of the products you actually sold to customers. It only counts items that were sold, so you know exactly how much you paid to buy that inventory from your suppliers.","weight":85,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.expenses_total","label":"Total Expenses","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Total Expenses","extra":false,"desc":"All the everyday money spent to keep your shop running. This includes shop rent, electricity, staff salaries, internet, tea, repairs, and delivery costs. It does not include buying stock.","insight":"All the everyday money spent to keep your shop running. This includes shop rent, electricity, staff salaries, internet, tea, repairs, and delivery costs. It does not include buying stock.","weight":91,"topic":"expenses","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.expense_ratio","label":"Expense Ratio","shape":"GAUGE","unit":"percent","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Expense Ratio","extra":false,"desc":"Shows how much of your sales money is eaten up by shop bills. For example, if you sell Rs 100,000 and your shop expenses are Rs 20,000, then 20% of your money goes straight to bills.","insight":"Shows how much of your sales money is eaten up by shop bills. For example, if you sell Rs 100,000 and your shop expenses are Rs 20,000, then 20% of your money goes straight to bills.","weight":78,"topic":"expenses","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.receivables","label":"Receivables","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Receivables","extra":false,"desc":"The total money that customers owe you on credit (your Khata balance). It shows how much of your money is sitting in other people's pockets waiting to be collected.","insight":"The total money that customers owe you on credit (your Khata balance). It shows how much of your money is sitting in other people's pockets waiting to be collected.","weight":95,"topic":"receivable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.receivables_aging","label":"Receivables Aging","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Receivables Aging","extra":false,"desc":"Groups what customers owe you by how late they are (under 30 days, 60 days, or over 90 days). It reminds you which customers to call first before their credit gets too old to collect.","insight":"Groups what customers owe you by how late they are (under 30 days, 60 days, or over 90 days). It reminds you which customers to call first before their credit gets too old to collect.","weight":88,"topic":"receivable","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.payables","label":"Payables","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Payables","extra":false,"desc":"Total money you owe to your suppliers and vendors for stock or services. It shows all the upcoming bills that you need to pay soon.","insight":"Total money you owe to your suppliers and vendors for stock or services. It shows all the upcoming bills that you need to pay soon.","weight":92,"topic":"payable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.payables_aging","label":"Payables Aging","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Payables Aging","extra":false,"desc":"Lists your supplier bills by when they are due. It helps you see which bills need to be paid today and which ones you can pay next week, keeping suppliers happy.","insight":"Lists your supplier bills by when they are due. It helps you see which bills need to be paid today and which ones you can pay next week, keeping suppliers happy.","weight":76,"topic":"payable","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.total_liquidity","label":"Total Liquidity","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Total Liquidity","extra":false,"desc":"All the ready cash you have right now. It adds up all the cash inside your cash drawer and safe, plus all the money in every bank account you have.","insight":"All the ready cash you have right now. It adds up all the cash inside your cash drawer and safe, plus all the money in every bank account you have.","weight":97,"topic":"liquidity","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.liquidity_trend","label":"Liquidity Trend","shape":"TREND","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Liquidity Trend","extra":false,"desc":"A graph tracking your total cash over time. It shows whether your shop is saving more cash day by day or if your bank balance is slowly drying up.","insight":"A graph tracking your total cash over time. It shows whether your shop is saving more cash day by day or if your bank balance is slowly drying up.","weight":94,"topic":"liquidity","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.cash_flow_trend","label":"Cash In vs Cash Out","shape":"TREND","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Cash In vs Cash Out","extra":false,"desc":"Compares the cash entering your shop against the cash leaving your shop each day. It helps make sure you don't spend more cash on bills than what customers are paying you.","insight":"Compares the cash entering your shop against the cash leaving your shop each day. It helps make sure you don't spend more cash on bills than what customers are paying you.","weight":90,"topic":"liquidity","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.net_cash_position","label":"Net Cash Position","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Net Cash Position","extra":false,"desc":"The cash you have in hand and bank minus what you owe to suppliers right now. It tells you how much money is truly yours if you paid off all your supplier bills today.","insight":"The cash you have in hand and bank minus what you owe to suppliers right now. It tells you how much money is truly yours if you paid off all your supplier bills today.","weight":82,"topic":"liquidity","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.working_capital","label":"Working Capital","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Working Capital","extra":false,"desc":"Your financial breathing room. It checks if your current stock, cash, and customer dues are enough to easily cover your short-term bills and keep your shop running smoothly.","insight":"Your financial breathing room. It checks if your current stock, cash, and customer dues are enough to easily cover your short-term bills and keep your shop running smoothly.","weight":74,"topic":"liquidity","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.revenue_vs_prev","label":"Revenue vs Last Period","shape":"STAT","unit":"percent","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Revenue vs Last Period","extra":false,"desc":"Shows if your sales are higher or lower compared to last month or last week. A green number means more customers are buying from you than before.","insight":"Shows if your sales are higher or lower compared to last month or last week. A green number means more customers are buying from you than before.","weight":86,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.profit_vs_prev","label":"Profit vs Last Period","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Profit vs Last Period","extra":false,"desc":"Shows if your real take-home profit grew or shrank compared to last month. It tells you if you are actually keeping more money in your pocket than before.","insight":"Shows if your real take-home profit grew or shrank compared to last month. It tells you if you are actually keeping more money in your pocket than before.","weight":81,"topic":"profit","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.transaction_count","label":"Transactions","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Transactions","extra":false,"desc":"The total number of customer sales and printed receipts. It tells you how busy your checkout counter was, counting every visit whether the customer spent Rs 50 or Rs 50,000.","insight":"The total number of customer sales and printed receipts. It tells you how busy your checkout counter was, counting every visit whether the customer spent Rs 50 or Rs 50,000.","weight":72,"topic":"salesvol","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.avg_transaction_value","label":"Average Transaction Value","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Average Transaction Value","extra":false,"desc":"The average amount a customer spends when they buy from you. It divides your total sales by the number of customers, showing if people are buying bigger or smaller baskets.","insight":"The average amount a customer spends when they buy from you. It divides your total sales by the number of customers, showing if people are buying bigger or smaller baskets.","weight":75,"topic":"salesvol","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.busiest_day","label":"Busiest Day","shape":"STAT","unit":"currency","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Busiest Day","extra":false,"desc":"Tells you which day brought in the most sales money. It helps you know which day of the week you need the most staff and the most stock ready.","insight":"Tells you which day brought in the most sales money. It helps you know which day of the week you need the most staff and the most stock ready.","weight":62,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.peak_hour","label":"Peak Hour","shape":"STAT","unit":"hour","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Peak Hour","extra":false,"desc":"The exact hour of the day when the most customers are checking out at your counter. It tells you when you need all cashiers present to handle the rush.","insight":"The exact hour of the day when the most customers are checking out at your counter. It tells you when you need all cashiers present to handle the rush.","weight":60,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.balance_sheet_ok","label":"Books Balanced","shape":"STATUS","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Books Balanced","extra":false,"desc":"A live check that makes sure all your accounts balance. A green mark means every debit matches every credit and there are zero bookkeeping errors in your system.","insight":"A live check that makes sure all your accounts balance. A green mark means every debit matches every credit and there are zero bookkeeping errors in your system.","weight":70,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.journal_entries_count","label":"Journal Entries Posted","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Journal Entries Posted","extra":false,"desc":"The number of accounting records our system created for your shop automatically. Every time you sell, buy, or pay a bill, the system writes the accounting entries for you.","insight":"The number of accounting records our system created for your shop automatically. Every time you sell, buy, or pay a bill, the system writes the accounting entries for you.","weight":55,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.audit_trail_count","label":"Audit Events Logged","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Audit Events Logged","extra":false,"desc":"A safety counter of every action taken in your system, like making a sale, giving a discount, or editing stock. It keeps a record so you always know who did what.","insight":"A safety counter of every action taken in your system, like making a sale, giving a discount, or editing stock. It keeps a record so you always know who did what.","weight":50,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.reversal_count","label":"Reversals & Corrections","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Reversals & Corrections","extra":false,"desc":"Counts how many times a sale or bill was cancelled, returned, or corrected. A high number helps you catch cashier mistakes or customer return issues early.","insight":"Counts how many times a sale or bill was cancelled, returned, or corrected. A high number helps you catch cashier mistakes or customer return issues early.","weight":52,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.document_sequence_ok","label":"Document Numbering Intact","shape":"STATUS","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Document Numbering Intact","extra":false,"desc":"Checks that your invoice and receipt numbers follow in a clean order (like 101, 102, 103) with no missing slips or duplicate numbers.","insight":"Checks that your invoice and receipt numbers follow in a clean order (like 101, 102, 103) with no missing slips or duplicate numbers.","weight":48,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.user_activity","label":"Active Users","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Active Users","extra":false,"desc":"Shows which of your staff members and cashiers have logged into the system and are working today.","insight":"Shows which of your staff members and cashiers have logged into the system and are working today.","weight":46,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"core.plan_usage","label":"Plan Usage","shape":"BREAKDOWN","unit":"percent","precision":2,"area":"Overview","module":"Qore","modules":[],"short":"Plan Usage","extra":false,"desc":"Shows how much of your monthly software plan limits you have used, such as number of orders or products.","insight":"Shows how much of your monthly software plan limits you have used, such as number of orders or products.","weight":44,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.count","label":"Products","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Products","modules":["products"],"short":"Products","extra":false,"desc":"How many products exist in your catalogue right now.","insight":"How many products exist in your catalogue right now.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.active_count","label":"Active Products","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Products","modules":["products"],"short":"Active Products","extra":false,"desc":"Products that are switched on and sellable today.","insight":"Products that are switched on and sellable today.","weight":66,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.by_category","label":"Products by Category","shape":"BREAKDOWN","unit":"count","precision":0,"area":"Operations","module":"Products","modules":["products"],"short":"Products by Category","extra":false,"desc":"Your catalogue split by category, so you see where it is thick and where it is thin.","insight":"Your catalogue split by category, so you see where it is thick and where it is thin.","weight":63,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.catalogue_value","label":"Catalogue Value","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Products","modules":["products"],"short":"Catalogue Value","extra":false,"desc":"Every product's selling price times the quantity you hold.","insight":"Every product's selling price times the quantity you hold.","weight":71,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.avg_margin","label":"Average Product Margin","shape":"GAUGE","unit":"percent","precision":2,"area":"Operations","module":"Products","modules":["products"],"short":"Average Product Margin","extra":false,"desc":"The average gap between cost and selling price across the catalogue.","insight":"The average gap between cost and selling price across the catalogue.","weight":77,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.top_margin","label":"Best-Margin Products","shape":"LIST","unit":"percent","precision":2,"area":"Operations","module":"Products","modules":["products"],"short":"Best-Margin Products","extra":false,"desc":"The items in your shop that give you the highest profit percentage on each sale. These are your best items to recommend to customers to make more money.","insight":"The items in your shop that give you the highest profit percentage on each sale. These are your best items to recommend to customers to make more money.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.lowest_margin","label":"Thinnest-Margin Products","shape":"LIST","unit":"percent","precision":2,"area":"Operations","module":"Products","modules":["products"],"short":"Thinnest-Margin Products","extra":false,"desc":"The items you sell with very little profit markup. It warns you where you are barely making any profit so you can adjust prices if supplier costs go up.","insight":"The items you sell with very little profit markup. It warns you where you are barely making any profit so you can adjust prices if supplier costs go up.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.never_sold","label":"Products Never Sold","shape":"LIST","unit":"count","precision":0,"area":"Operations","module":"Products","modules":["products"],"short":"Products Never Sold","extra":false,"desc":"Items sitting in the catalogue that nobody has ever bought.","insight":"Items sitting in the catalogue that nobody has ever bought.","weight":65,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.missing_cost","label":"Products Missing a Cost","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Products","modules":["products"],"short":"Products Missing a Cost","extra":false,"desc":"Items with no purchase cost recorded — these silently break your margin numbers.","insight":"Items with no purchase cost recorded — these silently break your margin numbers.","weight":58,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"products.new_this_period","label":"Products Added","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Products","modules":["products"],"short":"Products Added","extra":false,"desc":"New items added to the catalogue in the period.","insight":"New items added to the catalogue in the period.","weight":49,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"services.count","label":"Services Offered","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Services","modules":["services"],"short":"Services Offered","extra":false,"desc":"How many billable services you have defined.","insight":"How many billable services you have defined.","weight":72,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"services.revenue","label":"Service Revenue","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Services","modules":["services"],"short":"Service Revenue","extra":false,"desc":"Money earned from labour and services, separate from goods.","insight":"Money earned from labour and services, separate from goods.","weight":88,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"services.revenue_trend","label":"Service Revenue Trend","shape":"TREND","unit":"currency","precision":2,"area":"Operations","module":"Services","modules":["services"],"short":"Service Revenue Trend","extra":false,"desc":"Service earnings day by day across the period.","insight":"Service earnings day by day across the period.","weight":80,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"services.share_of_revenue","label":"Services Share of Revenue","shape":"GAUGE","unit":"percent","precision":2,"area":"Operations","module":"Services","modules":["services"],"short":"Services Share of Revenue","extra":false,"desc":"What portion of the business is labour rather than product.","insight":"What portion of the business is labour rather than product.","weight":75,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"services.top_services","label":"Top Services","shape":"LIST","unit":"currency","precision":2,"area":"Operations","module":"Services","modules":["services"],"short":"Top Services","extra":false,"desc":"Which services bring in the most money.","insight":"Which services bring in the most money.","weight":79,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"services.avg_ticket","label":"Average Service Ticket","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Services","modules":["services"],"short":"Average Service Ticket","extra":false,"desc":"What a typical service job is worth.","insight":"What a typical service job is worth.","weight":71,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"services.jobs_count","label":"Jobs Completed","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Services","modules":["services"],"short":"Jobs Completed","extra":false,"desc":"How many service jobs you finished in the period.","insight":"How many service jobs you finished in the period.","weight":73,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.count","label":"Total Customers","shape":"STAT","unit":"count","precision":0,"area":"Customers","module":"Customers","modules":["customers"],"short":"Total Customers","extra":false,"desc":"Every customer on your books.","insight":"Every customer on your books.","weight":84,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.new","label":"New Customers","shape":"STAT","unit":"count","precision":0,"area":"Customers","module":"Customers","modules":["customers"],"short":"New Customers","extra":false,"desc":"People who bought from you for the first time in the period.","insight":"People who bought from you for the first time in the period.","weight":81,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.new_trend","label":"New Customer Trend","shape":"TREND","unit":"count","precision":0,"area":"Customers","module":"Customers","modules":["customers"],"short":"New Customer Trend","extra":false,"desc":"First-time buyers plotted across the period.","insight":"First-time buyers plotted across the period.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.active","label":"Active Customers","shape":"STAT","unit":"count","precision":0,"area":"Customers","module":"Customers","modules":["customers"],"short":"Active Customers","extra":false,"desc":"Customers who actually bought something in the period.","insight":"Customers who actually bought something in the period.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.dormant","label":"Dormant Customers","shape":"LIST","unit":"count","precision":0,"area":"Customers","module":"Customers","modules":["customers"],"short":"Dormant Customers","extra":false,"desc":"Regulars who have gone quiet — the cheapest sales list you own.","insight":"Regulars who have gone quiet — the cheapest sales list you own.","weight":73,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.repeat_rate","label":"Repeat Customer Rate","shape":"GAUGE","unit":"percent","precision":2,"area":"Customers","module":"Customers","modules":["customers"],"short":"Repeat Customer Rate","extra":false,"desc":"What share of sales came from people who had bought before.","insight":"What share of sales came from people who had bought before.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.top_customers","label":"Top Customers","shape":"LIST","unit":"currency","precision":2,"area":"Customers","module":"Customers","modules":["customers"],"short":"Top Customers","extra":false,"desc":"Who spends the most with you.","insight":"Who spends the most with you.","weight":86,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.avg_spend","label":"Average Customer Spend","shape":"STAT","unit":"currency","precision":2,"area":"Customers","module":"Customers","modules":["customers"],"short":"Average Customer Spend","extra":false,"desc":"What a typical customer is worth in the period.","insight":"What a typical customer is worth in the period.","weight":69,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.owing","label":"Customers Who Owe You","shape":"LIST","unit":"currency","precision":2,"area":"Customers","module":"Customers","modules":["customers"],"short":"Customers Who Owe You","extra":false,"desc":"Every customer with a balance, largest first.","insight":"Every customer with a balance, largest first.","weight":87,"topic":"receivable","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"customers.by_area","label":"Customers by Area","shape":"BREAKDOWN","unit":"count","precision":0,"area":"Customers","module":"Customers","modules":["customers"],"short":"Customers by Area","extra":false,"desc":"Where your customers are, so you know which area actually pays.","insight":"Where your customers are, so you know which area actually pays.","weight":54,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"suppliers.count","label":"Total Suppliers","shape":"STAT","unit":"count","precision":0,"area":"Customers","module":"Suppliers","modules":["suppliers"],"short":"Total Suppliers","extra":false,"desc":"Every supplier on your books.","insight":"Every supplier on your books.","weight":68,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"suppliers.active","label":"Active Suppliers","shape":"STAT","unit":"count","precision":0,"area":"Customers","module":"Suppliers","modules":["suppliers"],"short":"Active Suppliers","extra":false,"desc":"Suppliers you actually bought from in the period.","insight":"Suppliers you actually bought from in the period.","weight":60,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"suppliers.top_suppliers","label":"Top Suppliers by Spend","shape":"LIST","unit":"currency","precision":2,"area":"Customers","module":"Suppliers","modules":["suppliers"],"short":"Top Suppliers by Spend","extra":false,"desc":"Where your purchase money is going.","insight":"Where your purchase money is going.","weight":79,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"suppliers.spend_total","label":"Total Supplier Spend","shape":"STAT","unit":"currency","precision":2,"area":"Customers","module":"Suppliers","modules":["suppliers"],"short":"Total Supplier Spend","extra":false,"desc":"Everything you bought, added up.","insight":"Everything you bought, added up.","weight":82,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"suppliers.spend_trend","label":"Supplier Spend Trend","shape":"TREND","unit":"currency","precision":2,"area":"Customers","module":"Suppliers","modules":["suppliers"],"short":"Supplier Spend Trend","extra":false,"desc":"Purchase spend plotted across the period.","insight":"Purchase spend plotted across the period.","weight":71,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"suppliers.owed_list","label":"What You Owe, Supplier by Supplier","shape":"LIST","unit":"currency","precision":2,"area":"Customers","module":"Suppliers","modules":["suppliers"],"short":"What You Owe, Supplier by Supplier","extra":false,"desc":"Your payables broken out per supplier — the list you check before paying anyone.","insight":"Your payables broken out per supplier — the list you check before paying anyone.","weight":85,"topic":"payable","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"suppliers.concentration","label":"Supplier Concentration","shape":"GAUGE","unit":"percent","precision":2,"area":"Customers","module":"Suppliers","modules":["suppliers"],"short":"Supplier Concentration","extra":false,"desc":"How much of your buying depends on one supplier. High means fragile.","insight":"How much of your buying depends on one supplier. High means fragile.","weight":62,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"suppliers.new","label":"New Suppliers","shape":"STAT","unit":"count","precision":0,"area":"Customers","module":"Suppliers","modules":["suppliers"],"short":"New Suppliers","extra":false,"desc":"Suppliers added in the period.","insight":"Suppliers added in the period.","weight":45,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.revenue","label":"Counter Revenue","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Pos","modules":["pos"],"short":"Counter Revenue","extra":false,"desc":"Money taken at the counter in the period.","insight":"Money taken at the counter in the period.","weight":97,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.revenue_trend","label":"Counter Revenue Trend","shape":"TREND","unit":"currency","precision":2,"area":"Sales","module":"Pos","modules":["pos"],"short":"Counter Revenue Trend","extra":false,"desc":"Counter takings day by day.","insight":"Counter takings day by day.","weight":91,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.sale_count","label":"Sales Rung Up","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Pos","modules":["pos"],"short":"Sales Rung Up","extra":false,"desc":"How many separate sales went through the till.","insight":"How many separate sales went through the till.","weight":85,"topic":"salesvol","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.avg_ticket","label":"Average Ticket","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Pos","modules":["pos"],"short":"Average Ticket","extra":false,"desc":"What a typical sale is worth — the number to move if you want growth without more footfall.","insight":"What a typical sale is worth — the number to move if you want growth without more footfall.","weight":87,"topic":"salesvol","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.max_sale","label":"Largest Sale","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Pos","modules":["pos"],"short":"Largest Sale","extra":false,"desc":"The single biggest sale of the period.","insight":"The single biggest sale of the period.","weight":64,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.items_per_sale","label":"Items per Sale","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Pos","modules":["pos"],"short":"Items per Sale","extra":false,"desc":"How many things the average customer walks out with.","insight":"How many things the average customer walks out with.","weight":72,"topic":"salesvol","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.payment_breakdown","label":"Payment Method Split","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Sales","module":"Pos","modules":["pos"],"short":"Payment Method Split","extra":false,"desc":"Cash, card, wallet, credit — how people actually pay you.","insight":"Cash, card, wallet, credit — how people actually pay you.","weight":83,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.hourly_heatmap","label":"Sales by Hour","shape":"HEATMAP","unit":"count","precision":0,"area":"Sales","module":"Pos","modules":["pos"],"short":"Sales by Hour","extra":false,"desc":"Which hours earn and which hours you are paying staff to stand still.","insight":"Which hours earn and which hours you are paying staff to stand still.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.weekday_split","label":"Sales by Day of Week","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Sales","module":"Pos","modules":["pos"],"short":"Sales by Day of Week","extra":false,"desc":"Your week's rhythm, so rosters and stock match reality.","insight":"Your week's rhythm, so rosters and stock match reality.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.discount_total","label":"Discounts Given","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Pos","modules":["pos"],"short":"Discounts Given","extra":false,"desc":"How much margin walked out as discount.","insight":"How much margin walked out as discount.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pos.live_feed","label":"Live Sale Feed","shape":"LIST","unit":"currency","precision":2,"area":"Sales","module":"Pos","modules":["pos"],"short":"Live Sale Feed","extra":false,"desc":"The last few sales as they happen.","insight":"The last few sales as they happen.","weight":67,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.count","label":"Invoices Issued","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Invoices Issued","extra":false,"desc":"How many invoices you raised in the period.","insight":"How many invoices you raised in the period.","weight":84,"topic":"salesvol","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.value","label":"Invoiced Value","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Invoiced Value","extra":false,"desc":"Total value of everything you billed.","insight":"Total value of everything you billed.","weight":93,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.value_trend","label":"Invoiced Value Trend","shape":"TREND","unit":"currency","precision":2,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Invoiced Value Trend","extra":false,"desc":"Billing plotted across the period.","insight":"Billing plotted across the period.","weight":82,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.unpaid_value","label":"Unpaid Invoice Value","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Unpaid Invoice Value","extra":false,"desc":"Billed but not yet in your hands.","insight":"Billed but not yet in your hands.","weight":94,"topic":"receivable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.overdue_count","label":"Overdue Invoices","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Overdue Invoices","extra":false,"desc":"Invoices past their due date. Chase these first.","insight":"Invoices past their due date. Chase these first.","weight":92,"topic":"receivable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.overdue_value","label":"Overdue Value","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Overdue Value","extra":false,"desc":"How much of your money is genuinely late.","insight":"How much of your money is genuinely late.","weight":90,"topic":"receivable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.avg_invoice","label":"Average Invoice Value","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Average Invoice Value","extra":false,"desc":"What a typical invoice is worth.","insight":"What a typical invoice is worth.","weight":70,"topic":"salesvol","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.avg_days_to_pay","label":"Average Days to Get Paid","shape":"STAT","unit":"days","precision":0,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Average Days to Get Paid","extra":false,"desc":"How long customers actually take, versus the terms you gave them.","insight":"How long customers actually take, versus the terms you gave them.","weight":86,"topic":"collection","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.largest_open","label":"Largest Open Invoices","shape":"LIST","unit":"currency","precision":2,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Largest Open Invoices","extra":false,"desc":"The biggest unpaid invoices, largest first.","insight":"The biggest unpaid invoices, largest first.","weight":88,"topic":"receivable","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"invoicing.draft_count","label":"Drafts Waiting to Send","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Invoicing","modules":["invoicing"],"short":"Drafts Waiting to Send","extra":false,"desc":"Invoices written but never sent — money you forgot to ask for.","insight":"Invoices written but never sent — money you forgot to ask for.","weight":63,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"quotations.count","label":"Quotes Issued","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Quotations","modules":["quotations"],"short":"Quotes Issued","extra":false,"desc":"How many quotes you sent out.","insight":"How many quotes you sent out.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"quotations.open_value","label":"Open Quote Value","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Quotations","modules":["quotations"],"short":"Open Quote Value","extra":false,"desc":"Money on the table, waiting for a yes.","insight":"Money on the table, waiting for a yes.","weight":83,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"quotations.win_rate","label":"Quote Win Rate","shape":"GAUGE","unit":"percent","precision":2,"area":"Sales","module":"Quotations","modules":["quotations"],"short":"Quote Win Rate","extra":false,"desc":"What share of quotes turn into real sales.","insight":"What share of quotes turn into real sales.","weight":86,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"quotations.win_rate_trend","label":"Win Rate Trend","shape":"TREND","unit":"percent","precision":2,"area":"Sales","module":"Quotations","modules":["quotations"],"short":"Win Rate Trend","extra":false,"desc":"Whether your hit rate is improving or slipping.","insight":"Whether your hit rate is improving or slipping.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"quotations.avg_quote","label":"Average Quote Value","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Quotations","modules":["quotations"],"short":"Average Quote Value","extra":false,"desc":"What a typical quote is worth.","insight":"What a typical quote is worth.","weight":66,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"quotations.expiring","label":"Quotes Expiring Soon","shape":"LIST","unit":"count","precision":0,"area":"Sales","module":"Quotations","modules":["quotations"],"short":"Quotes Expiring Soon","extra":false,"desc":"Quotes about to lapse — one phone call each.","insight":"Quotes about to lapse — one phone call each.","weight":79,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_orders.open_count","label":"Open Sales Orders","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Sales Orders","modules":["sales_orders"],"short":"Open Sales Orders","extra":false,"desc":"Orders accepted but not yet delivered.","insight":"Orders accepted but not yet delivered.","weight":88,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_orders.open_value","label":"Open Order Value","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Sales Orders","modules":["sales_orders"],"short":"Open Order Value","extra":false,"desc":"Committed revenue you have not yet earned.","insight":"Committed revenue you have not yet earned.","weight":89,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_orders.count","label":"Orders Taken","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Sales Orders","modules":["sales_orders"],"short":"Orders Taken","extra":false,"desc":"New orders accepted in the period.","insight":"New orders accepted in the period.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_orders.value_trend","label":"Order Intake Trend","shape":"TREND","unit":"currency","precision":2,"area":"Sales","module":"Sales Orders","modules":["sales_orders"],"short":"Order Intake Trend","extra":false,"desc":"Order value coming in, day by day — your earliest demand signal.","insight":"Order value coming in, day by day — your earliest demand signal.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_orders.fulfil_rate","label":"Fulfilment Rate","shape":"GAUGE","unit":"percent","precision":2,"area":"Sales","module":"Sales Orders","modules":["sales_orders"],"short":"Fulfilment Rate","extra":false,"desc":"What share of orders you delivered complete and on time.","insight":"What share of orders you delivered complete and on time.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_orders.overdue","label":"Overdue Orders","shape":"LIST","unit":"count","precision":0,"area":"Sales","module":"Sales Orders","modules":["sales_orders"],"short":"Overdue Orders","extra":false,"desc":"Orders past their promised date. Every one is an unhappy customer.","insight":"Orders past their promised date. Every one is an unhappy customer.","weight":84,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_orders.by_customer","label":"Open Orders by Customer","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Sales","module":"Sales Orders","modules":["sales_orders"],"short":"Open Orders by Customer","extra":false,"desc":"Who is waiting on you, and for how much.","insight":"Who is waiting on you, and for how much.","weight":65,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_returns.count","label":"Returns Taken","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Sales Returns","modules":["sales_returns"],"short":"Returns Taken","extra":false,"desc":"How many sales came back.","insight":"How many sales came back.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_returns.value","label":"Return Value","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Sales Returns","modules":["sales_returns"],"short":"Return Value","extra":false,"desc":"The money value of what was returned.","insight":"The money value of what was returned.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_returns.rate","label":"Return Rate","shape":"GAUGE","unit":"percent","precision":2,"area":"Sales","module":"Sales Returns","modules":["sales_returns"],"short":"Return Rate","extra":false,"desc":"Returns as a share of sales. A rising number is a product or expectation problem.","insight":"Returns as a share of sales. A rising number is a product or expectation problem.","weight":79,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_returns.trend","label":"Returns Trend","shape":"TREND","unit":"currency","precision":2,"area":"Sales","module":"Sales Returns","modules":["sales_returns"],"short":"Returns Trend","extra":false,"desc":"Returns plotted across the period.","insight":"Returns plotted across the period.","weight":64,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_returns.top_returned","label":"Most-Returned Products","shape":"LIST","unit":"count","precision":0,"area":"Sales","module":"Sales Returns","modules":["sales_returns"],"short":"Most-Returned Products","extra":false,"desc":"Which items keep coming back — usually a quality or sizing story.","insight":"Which items keep coming back — usually a quality or sizing story.","weight":75,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"sales_returns.by_reason","label":"Returns by Reason","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Sales","module":"Sales Returns","modules":["sales_returns"],"short":"Returns by Reason","extra":false,"desc":"Why things come back, grouped.","insight":"Why things come back, grouped.","weight":68,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"recurring.active_count","label":"Active Recurring Invoices","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Recurring Invoices","modules":["recurring_invoices"],"short":"Active Recurring Invoices","extra":false,"desc":"How many customers are on an automatic billing cycle.","insight":"How many customers are on an automatic billing cycle.","weight":82,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"recurring.monthly_value","label":"Recurring Revenue per Month","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Recurring Invoices","modules":["recurring_invoices"],"short":"Recurring Revenue per Month","extra":false,"desc":"Money you can count on every month without selling again.","insight":"Money you can count on every month without selling again.","weight":90,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"recurring.trend","label":"Recurring Revenue Trend","shape":"TREND","unit":"currency","precision":2,"area":"Operations","module":"Recurring Invoices","modules":["recurring_invoices"],"short":"Recurring Revenue Trend","extra":false,"desc":"Whether your predictable base is growing.","insight":"Whether your predictable base is growing.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"recurring.due_next_7","label":"Due in Next 7 Days","shape":"LIST","unit":"currency","precision":2,"area":"Operations","module":"Recurring Invoices","modules":["recurring_invoices"],"short":"Due in Next 7 Days","extra":false,"desc":"What is about to bill, so nothing surprises anyone.","insight":"What is about to bill, so nothing surprises anyone.","weight":77,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"recurring.share_of_revenue","label":"Recurring Share of Revenue","shape":"GAUGE","unit":"percent","precision":2,"area":"Operations","module":"Recurring Invoices","modules":["recurring_invoices"],"short":"Recurring Share of Revenue","extra":false,"desc":"How much of the business runs on autopilot.","insight":"How much of the business runs on autopilot.","weight":73,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"recurring.churned","label":"Cancelled Subscriptions","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Recurring Invoices","modules":["recurring_invoices"],"short":"Cancelled Subscriptions","extra":false,"desc":"Recurring customers who stopped in the period.","insight":"Recurring customers who stopped in the period.","weight":71,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"proposals.count","label":"Proposals Sent","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"B2b Proposals","modules":["b2b_proposals"],"short":"Proposals Sent","extra":false,"desc":"How many formal proposals went out.","insight":"How many formal proposals went out.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"proposals.pipeline_value","label":"Proposal Pipeline Value","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"B2b Proposals","modules":["b2b_proposals"],"short":"Proposal Pipeline Value","extra":false,"desc":"Total value of everything still in play.","insight":"Total value of everything still in play.","weight":85,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"proposals.win_rate","label":"Proposal Win Rate","shape":"GAUGE","unit":"percent","precision":2,"area":"Operations","module":"B2b Proposals","modules":["b2b_proposals"],"short":"Proposal Win Rate","extra":false,"desc":"What share of proposals convert.","insight":"What share of proposals convert.","weight":81,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"proposals.avg_value","label":"Average Proposal Value","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"B2b Proposals","modules":["b2b_proposals"],"short":"Average Proposal Value","extra":false,"desc":"The size of a typical deal.","insight":"The size of a typical deal.","weight":66,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"proposals.stale","label":"Proposals Going Cold","shape":"LIST","unit":"count","precision":0,"area":"Operations","module":"B2b Proposals","modules":["b2b_proposals"],"short":"Proposals Going Cold","extra":false,"desc":"Deals with no movement for too long.","insight":"Deals with no movement for too long.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"proposals.avg_cycle_days","label":"Average Sales Cycle","shape":"STAT","unit":"days","precision":0,"area":"Operations","module":"B2b Proposals","modules":["b2b_proposals"],"short":"Average Sales Cycle","extra":false,"desc":"How many days a deal takes from sent to signed.","insight":"How many days a deal takes from sent to signed.","weight":62,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pricing.tier_count","label":"Price Tiers in Use","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Pricing Tiers","modules":["pricing_tiers"],"short":"Price Tiers in Use","extra":false,"desc":"How many price levels you actually run.","insight":"How many price levels you actually run.","weight":58,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pricing.revenue_by_tier","label":"Revenue by Price Tier","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Sales","module":"Pricing Tiers","modules":["pricing_tiers"],"short":"Revenue by Price Tier","extra":false,"desc":"Which tier carries the business.","insight":"Which tier carries the business.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pricing.customers_by_tier","label":"Customers per Tier","shape":"BREAKDOWN","unit":"count","precision":0,"area":"Sales","module":"Pricing Tiers","modules":["pricing_tiers"],"short":"Customers per Tier","extra":false,"desc":"How your customer base is spread across tiers.","insight":"How your customer base is spread across tiers.","weight":63,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pricing.avg_realised_price","label":"Average Realised Price","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Pricing Tiers","modules":["pricing_tiers"],"short":"Average Realised Price","extra":false,"desc":"What you actually get paid, after every tier and discount.","insight":"What you actually get paid, after every tier and discount.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"pricing.discount_vs_list","label":"Discount vs List Price","shape":"GAUGE","unit":"percent","precision":2,"area":"Sales","module":"Pricing Tiers","modules":["pricing_tiers"],"short":"Discount vs List Price","extra":false,"desc":"The gap between your sticker price and reality.","insight":"The gap between your sticker price and reality.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"park.open_count","label":"Parked Sales Open Now","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Park Recall","modules":["park_recall"],"short":"Parked Sales Open Now","extra":false,"desc":"Sales held mid-way and not yet completed.","insight":"Sales held mid-way and not yet completed.","weight":66,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"park.open_value","label":"Value Sitting in Parked Sales","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Park Recall","modules":["park_recall"],"short":"Value Sitting in Parked Sales","extra":false,"desc":"Money waiting in unfinished transactions.","insight":"Money waiting in unfinished transactions.","weight":68,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"park.recalled_count","label":"Parked Sales Recalled","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Park Recall","modules":["park_recall"],"short":"Parked Sales Recalled","extra":false,"desc":"How many parked sales were picked back up and completed.","insight":"How many parked sales were picked back up and completed.","weight":52,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"park.abandoned_count","label":"Parked Sales Abandoned","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Park Recall","modules":["park_recall"],"short":"Parked Sales Abandoned","extra":false,"desc":"Held sales nobody ever finished — usually a queue or staffing signal.","insight":"Held sales nobody ever finished — usually a queue or staffing signal.","weight":60,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"park.oldest","label":"Oldest Parked Sale","shape":"STAT","unit":"days","precision":0,"area":"Operations","module":"Park Recall","modules":["park_recall"],"short":"Oldest Parked Sale","extra":false,"desc":"How long the stalest held sale has been sitting there.","insight":"How long the stalest held sale has been sitting there.","weight":50,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tables.occupied","label":"Tables Occupied Now","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Table Service","modules":["table_service"],"short":"Tables Occupied Now","extra":false,"desc":"How much of the floor is working right now.","insight":"How much of the floor is working right now.","weight":92,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tables.occupancy_rate","label":"Table Occupancy Rate","shape":"GAUGE","unit":"percent","precision":2,"area":"Operations","module":"Table Service","modules":["table_service"],"short":"Table Occupancy Rate","extra":false,"desc":"What share of your seats earn, across the period.","insight":"What share of your seats earn, across the period.","weight":86,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tables.kitchen_pending","label":"Kitchen Orders Pending","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Table Service","modules":["table_service"],"short":"Kitchen Orders Pending","extra":false,"desc":"Orders fired but not yet served.","insight":"Orders fired but not yet served.","weight":90,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tables.avg_turn_minutes","label":"Average Table Turn","shape":"STAT","unit":"minutes","precision":0,"area":"Operations","module":"Table Service","modules":["table_service"],"short":"Average Table Turn","extra":false,"desc":"How long a table takes from seated to cleared.","insight":"How long a table takes from seated to cleared.","weight":84,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tables.covers","label":"Covers Served","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Table Service","modules":["table_service"],"short":"Covers Served","extra":false,"desc":"How many people you actually fed.","insight":"How many people you actually fed.","weight":82,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"tables.avg_cover_value","label":"Average Spend per Cover","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Table Service","modules":["table_service"],"short":"Average Spend per Cover","extra":false,"desc":"What one diner is worth — the lever for upselling.","insight":"What one diner is worth — the lever for upselling.","weight":85,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"tables.revenue_per_table","label":"Revenue per Table","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Operations","module":"Table Service","modules":["table_service"],"short":"Revenue per Table","extra":false,"desc":"Which tables earn and which are dead space.","insight":"Which tables earn and which are dead space.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tables.peak_occupancy","label":"Peak Occupancy by Hour","shape":"HEATMAP","unit":"count","precision":0,"area":"Operations","module":"Table Service","modules":["table_service"],"short":"Peak Occupancy by Hour","extra":false,"desc":"When the floor fills, hour by hour.","insight":"When the floor fills, hour by hour.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"presales.count","label":"Pre-orders Taken","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Pre Sales","modules":["pre_sales"],"short":"Pre-orders Taken","extra":false,"desc":"Orders taken before the goods exist.","insight":"Orders taken before the goods exist.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"presales.value","label":"Pre-order Value","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Pre Sales","modules":["pre_sales"],"short":"Pre-order Value","extra":false,"desc":"Committed value against stock you have not made or received.","insight":"Committed value against stock you have not made or received.","weight":78,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"presales.advance_collected","label":"Advances Collected","shape":"STAT","unit":"currency","precision":2,"area":"Sales","module":"Pre Sales","modules":["pre_sales"],"short":"Advances Collected","extra":false,"desc":"Cash already in hand against future delivery.","insight":"Cash already in hand against future delivery.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"presales.pending_delivery","label":"Awaiting Delivery","shape":"LIST","unit":"count","precision":0,"area":"Sales","module":"Pre Sales","modules":["pre_sales"],"short":"Awaiting Delivery","extra":false,"desc":"What you owe customers, oldest first.","insight":"What you owe customers, oldest first.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"presales.overdue","label":"Overdue Pre-orders","shape":"STAT","unit":"count","precision":0,"area":"Sales","module":"Pre Sales","modules":["pre_sales"],"short":"Overdue Pre-orders","extra":false,"desc":"Promises you have already broken.","insight":"Promises you have already broken.","weight":79,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"inventory.stock_value","label":"Stock Value","shape":"STAT","unit":"currency","precision":2,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Stock Value","extra":false,"desc":"The wholesale purchase cost of all the goods sitting on your shelves. It tells you exactly how much of your money is currently tied up in unsold stock.","insight":"The wholesale purchase cost of all the goods sitting on your shelves. It tells you exactly how much of your money is currently tied up in unsold stock.","weight":96,"topic":"stockvalue","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.stock_value_trend","label":"Stock Value Trend","shape":"TREND","unit":"currency","precision":2,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Stock Value Trend","extra":false,"desc":"Stock value across the period — rising stock with flat sales is cash going to sleep.","insight":"Stock value across the period — rising stock with flat sales is cash going to sleep.","weight":84,"topic":"stockvalue","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.product_count","label":"Items Stocked","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Items Stocked","extra":false,"desc":"How many distinct items you carry.","insight":"How many distinct items you carry.","weight":72,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.units_on_hand","label":"Units on Hand","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Units on Hand","extra":false,"desc":"Total physical count across every item.","insight":"Total physical count across every item.","weight":68,"topic":"stockvalue","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.low_stock_count","label":"Low Stock Items","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Low Stock Items","extra":false,"desc":"Items about to run out.","insight":"Items about to run out.","weight":93,"topic":"lowstock","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.low_stock_list","label":"What's Running Low","shape":"LIST","unit":"count","precision":0,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"What's Running Low","extra":false,"desc":"The actual list, so you can order without hunting.","insight":"The actual list, so you can order without hunting.","weight":91,"topic":"lowstock","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.out_of_stock_count","label":"Out of Stock","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Out of Stock","extra":false,"desc":"Items you cannot sell right now. Every one is a refused customer.","insight":"Items you cannot sell right now. Every one is a refused customer.","weight":90,"topic":"lowstock","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.dead_stock_value","label":"Dead Stock Value","shape":"STAT","unit":"currency","precision":2,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Dead Stock Value","extra":false,"desc":"Money buried in things that have not moved in months.","insight":"Money buried in things that have not moved in months.","weight":85,"topic":"stockvalue","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.turnover_ratio","label":"Stock Turnover","shape":"GAUGE","unit":"ratio","precision":2,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Stock Turnover","extra":false,"desc":"How many times your stock sells through. The single best inventory health number.","insight":"How many times your stock sells through. The single best inventory health number.","weight":83,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.days_of_cover","label":"Days of Stock Cover","shape":"STAT","unit":"days","precision":0,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Days of Stock Cover","extra":false,"desc":"At the current rate, how many days before you are empty.","insight":"At the current rate, how many days before you are empty.","weight":81,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.value_by_category","label":"Stock Value by Category","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Stock Value by Category","extra":false,"desc":"Where your stock money actually sits.","insight":"Where your stock money actually sits.","weight":75,"topic":"stockvalue","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"inventory.top_by_value","label":"Biggest Stock Holdings","shape":"LIST","unit":"currency","precision":2,"area":"Inventory","module":"Inventory","modules":["inventory"],"short":"Biggest Stock Holdings","extra":false,"desc":"The items tying up the most cash.","insight":"The items tying up the most cash.","weight":73,"topic":"stockvalue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"locations.count","label":"Locations Active","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Multi Location","modules":["multi_location"],"short":"Locations Active","extra":false,"desc":"How many branches are trading.","insight":"How many branches are trading.","weight":70,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"locations.revenue_by_location","label":"Revenue by Location","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Inventory","module":"Multi Location","modules":["multi_location"],"short":"Revenue by Location","extra":false,"desc":"Which branch earns, side by side.","insight":"Which branch earns, side by side.","weight":92,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"locations.profit_by_location","label":"Profit by Location","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Inventory","module":"Multi Location","modules":["multi_location"],"short":"Profit by Location","extra":false,"desc":"Revenue is vanity — this is which branch actually makes money.","insight":"Revenue is vanity — this is which branch actually makes money.","weight":90,"topic":"profit","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"locations.stock_by_location","label":"Stock Value by Location","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Inventory","module":"Multi Location","modules":["multi_location"],"short":"Stock Value by Location","extra":false,"desc":"Where your inventory money is parked.","insight":"Where your inventory money is parked.","weight":82,"topic":"stockvalue","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"locations.revenue_trend_by_location","label":"Location Revenue Trend","shape":"TREND","unit":"currency","precision":2,"area":"Inventory","module":"Multi Location","modules":["multi_location"],"short":"Location Revenue Trend","extra":false,"desc":"Every branch's revenue on one chart across the period.","insight":"Every branch's revenue on one chart across the period.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"locations.stock_imbalance","label":"Stock Imbalance Between Branches","shape":"LIST","unit":"count","precision":0,"area":"Inventory","module":"Multi Location","modules":["multi_location"],"short":"Stock Imbalance Between Branches","extra":false,"desc":"One branch is out while another is overstocked — this is that list.","insight":"One branch is out while another is overstocked — this is that list.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"transfers.pending_count","label":"Pending Transfers","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Stock Transfers","modules":["stock_transfers"],"short":"Pending Transfers","extra":false,"desc":"Stock moves started but not received.","insight":"Stock moves started but not received.","weight":78,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"transfers.pending_value","label":"Value in Transit","shape":"STAT","unit":"currency","precision":2,"area":"Inventory","module":"Stock Transfers","modules":["stock_transfers"],"short":"Value in Transit","extra":false,"desc":"How much stock is currently in nobody's hands.","insight":"How much stock is currently in nobody's hands.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"transfers.count","label":"Transfers Completed","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Stock Transfers","modules":["stock_transfers"],"short":"Transfers Completed","extra":false,"desc":"Moves completed in the period.","insight":"Moves completed in the period.","weight":60,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"transfers.avg_transit_days","label":"Average Transit Time","shape":"STAT","unit":"days","precision":0,"area":"Inventory","module":"Stock Transfers","modules":["stock_transfers"],"short":"Average Transit Time","extra":false,"desc":"How long stock takes to get from A to B.","insight":"How long stock takes to get from A to B.","weight":64,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"transfers.discrepancy_count","label":"Transfers with Discrepancies","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Stock Transfers","modules":["stock_transfers"],"short":"Transfers with Discrepancies","extra":false,"desc":"Moves where what arrived did not match what was sent.","insight":"Moves where what arrived did not match what was sent.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"stocktakes.pending_count","label":"Stock Takes Pending","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Stock Takes","modules":["stock_takes"],"short":"Stock Takes Pending","extra":false,"desc":"Counts started and not finished.","insight":"Counts started and not finished.","weight":76,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"stocktakes.variance_value","label":"Counting Variance Value","shape":"STAT","unit":"currency","precision":2,"area":"Inventory","module":"Stock Takes","modules":["stock_takes"],"short":"Counting Variance Value","extra":false,"desc":"The money difference between what the system said and what you actually found.","insight":"The money difference between what the system said and what you actually found.","weight":82,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"stocktakes.variance_pct","label":"Count Accuracy","shape":"GAUGE","unit":"percent","precision":2,"area":"Inventory","module":"Stock Takes","modules":["stock_takes"],"short":"Count Accuracy","extra":false,"desc":"How close your records are to physical reality.","insight":"How close your records are to physical reality.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"stocktakes.last_count_days","label":"Days Since Last Count","shape":"STAT","unit":"days","precision":0,"area":"Inventory","module":"Stock Takes","modules":["stock_takes"],"short":"Days Since Last Count","extra":false,"desc":"How stale your stock figures might be.","insight":"How stale your stock figures might be.","weight":72,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"stocktakes.top_variances","label":"Biggest Count Variances","shape":"LIST","unit":"count","precision":0,"area":"Inventory","module":"Stock Takes","modules":["stock_takes"],"short":"Biggest Count Variances","extra":false,"desc":"The items your records get wrong most often — usually where leakage lives.","insight":"The items your records get wrong most often — usually where leakage lives.","weight":75,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"batches.count","label":"Batches Tracked","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Batches Expiry","modules":["batches_expiry"],"short":"Batches Tracked","extra":false,"desc":"How many batches or lots are under tracking.","insight":"How many batches or lots are under tracking.","weight":64,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"batches.qty","label":"Units in Tracked Batches","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Batches Expiry","modules":["batches_expiry"],"short":"Units in Tracked Batches","extra":false,"desc":"Physical units covered by batch tracking.","insight":"Physical units covered by batch tracking.","weight":58,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"batches.expiring_30","label":"Expiring Within 30 Days","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Batches Expiry","modules":["batches_expiry"],"short":"Expiring Within 30 Days","extra":false,"desc":"Stock on a clock. Discount it or lose it.","insight":"Stock on a clock. Discount it or lose it.","weight":91,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"batches.expiring_value","label":"Value Expiring Soon","shape":"STAT","unit":"currency","precision":2,"area":"Inventory","module":"Batches Expiry","modules":["batches_expiry"],"short":"Value Expiring Soon","extra":false,"desc":"The rupee value of everything about to expire.","insight":"The rupee value of everything about to expire.","weight":89,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"batches.expired_value","label":"Expired Stock Value","shape":"STAT","unit":"currency","precision":2,"area":"Inventory","module":"Batches Expiry","modules":["batches_expiry"],"short":"Expired Stock Value","extra":false,"desc":"Money already lost to expiry in the period.","insight":"Money already lost to expiry in the period.","weight":85,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"batches.expiry_list","label":"Expiry Watchlist","shape":"LIST","unit":"count","precision":0,"area":"Inventory","module":"Batches Expiry","modules":["batches_expiry"],"short":"Expiry Watchlist","extra":false,"desc":"Batch by batch, soonest first.","insight":"Batch by batch, soonest first.","weight":88,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"batches.write_off_trend","label":"Expiry Write-off Trend","shape":"TREND","unit":"currency","precision":2,"area":"Inventory","module":"Batches Expiry","modules":["batches_expiry"],"short":"Expiry Write-off Trend","extra":false,"desc":"Whether your expiry losses are getting better or worse.","insight":"Whether your expiry losses are getting better or worse.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"serials.count","label":"Serial-Tracked Units","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Serials","modules":["serials"],"short":"Serial-Tracked Units","extra":false,"desc":"Individual units you can trace by serial number.","insight":"Individual units you can trace by serial number.","weight":62,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"serials.in_stock","label":"Serials in Stock","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Serials","modules":["serials"],"short":"Serials in Stock","extra":false,"desc":"Traceable units you still hold.","insight":"Traceable units you still hold.","weight":68,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"serials.under_warranty","label":"Units Under Warranty","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Serials","modules":["serials"],"short":"Units Under Warranty","extra":false,"desc":"Sold units you are still on the hook for.","insight":"Sold units you are still on the hook for.","weight":76,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"serials.warranty_expiring","label":"Warranties Expiring Soon","shape":"LIST","unit":"count","precision":0,"area":"Inventory","module":"Serials","modules":["serials"],"short":"Warranties Expiring Soon","extra":false,"desc":"A ready-made list for renewal or service calls.","insight":"A ready-made list for renewal or service calls.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"serials.returned","label":"Serials Returned","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Serials","modules":["serials"],"short":"Serials Returned","extra":false,"desc":"Traceable units that came back.","insight":"Traceable units that came back.","weight":60,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"variants.count","label":"Variants Tracked","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Variants","modules":["variants"],"short":"Variants Tracked","extra":false,"desc":"Size, colour and style combinations you carry.","insight":"Size, colour and style combinations you carry.","weight":62,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"variants.top_variants","label":"Best-Selling Variants","shape":"LIST","unit":"count","precision":0,"area":"Inventory","module":"Variants","modules":["variants"],"short":"Best-Selling Variants","extra":false,"desc":"Which exact size and colour sells — not just which product.","insight":"Which exact size and colour sells — not just which product.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"variants.slow_variants","label":"Slow-Moving Variants","shape":"LIST","unit":"count","precision":0,"area":"Inventory","module":"Variants","modules":["variants"],"short":"Slow-Moving Variants","extra":false,"desc":"The sizes and colours that always get left behind.","insight":"The sizes and colours that always get left behind.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"variants.out_of_stock","label":"Variants Out of Stock","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Variants","modules":["variants"],"short":"Variants Out of Stock","extra":false,"desc":"Gaps in your size or colour run.","insight":"Gaps in your size or colour run.","weight":78,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"variants.size_colour_mix","label":"Size / Colour Mix","shape":"BREAKDOWN","unit":"count","precision":0,"area":"Inventory","module":"Variants","modules":["variants"],"short":"Size / Colour Mix","extra":false,"desc":"How demand splits across your run, so next order matches reality.","insight":"How demand splits across your run, so next order matches reality.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"barcodes.coverage_pct","label":"Products with Barcodes","shape":"GAUGE","unit":"percent","precision":2,"area":"Inventory","module":"Barcodes Labels","modules":["barcodes_labels"],"short":"Products with Barcodes","extra":false,"desc":"What share of your catalogue can be scanned.","insight":"What share of your catalogue can be scanned.","weight":64,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"barcodes.missing_count","label":"Products Missing Barcodes","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Barcodes Labels","modules":["barcodes_labels"],"short":"Products Missing Barcodes","extra":false,"desc":"Items still being typed in by hand at the counter.","insight":"Items still being typed in by hand at the counter.","weight":66,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"barcodes.labels_printed","label":"Labels Printed","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Barcodes Labels","modules":["barcodes_labels"],"short":"Labels Printed","extra":false,"desc":"Labels produced in the period.","insight":"Labels produced in the period.","weight":44,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"barcodes.scan_share","label":"Share of Sales Scanned","shape":"GAUGE","unit":"percent","precision":2,"area":"Inventory","module":"Barcodes Labels","modules":["barcodes_labels"],"short":"Share of Sales Scanned","extra":false,"desc":"How much of your counter work is scanned rather than searched. Scanning is faster and wrong less.","insight":"How much of your counter work is scanned rather than searched. Scanning is faster and wrong less.","weight":60,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"barcodes.duplicate_count","label":"Duplicate Barcodes","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Barcodes Labels","modules":["barcodes_labels"],"short":"Duplicate Barcodes","extra":false,"desc":"The same code on two products — a silent source of wrong sales.","insight":"The same code on two products — a silent source of wrong sales.","weight":58,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"uom.count","label":"Units of Measure in Use","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Units Of Measure","modules":["units_of_measure"],"short":"Units of Measure in Use","extra":false,"desc":"How many units you buy and sell in.","insight":"How many units you buy and sell in.","weight":52,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"uom.conversion_count","label":"Conversion Rules Defined","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Units Of Measure","modules":["units_of_measure"],"short":"Conversion Rules Defined","extra":false,"desc":"Rules that turn a bought unit into a sold unit.","insight":"Rules that turn a bought unit into a sold unit.","weight":56,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"uom.sales_by_uom","label":"Sales Volume by Unit","shape":"BREAKDOWN","unit":"count","precision":0,"area":"Inventory","module":"Units Of Measure","modules":["units_of_measure"],"short":"Sales Volume by Unit","extra":false,"desc":"How much you move in each unit — kilos, pieces, cartons.","insight":"How much you move in each unit — kilos, pieces, cartons.","weight":62,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"uom.missing_conversion","label":"Items Missing a Conversion","shape":"STAT","unit":"count","precision":0,"area":"Inventory","module":"Units Of Measure","modules":["units_of_measure"],"short":"Items Missing a Conversion","extra":false,"desc":"Items that will cost you wrong until a conversion is set.","insight":"Items that will cost you wrong until a conversion is set.","weight":68,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"uom.bulk_vs_retail","label":"Bulk vs Retail Split","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Inventory","module":"Units Of Measure","modules":["units_of_measure"],"short":"Bulk vs Retail Split","extra":false,"desc":"Whether you are really a bulk business or a retail one.","insight":"Whether you are really a bulk business or a retail one.","weight":64,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchases.spend","label":"Purchase Spend","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Purchases","modules":["purchases"],"short":"Purchase Spend","extra":false,"desc":"Everything you bought in the period.","insight":"Everything you bought in the period.","weight":90,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchases.spend_trend","label":"Purchase Spend Trend","shape":"TREND","unit":"currency","precision":2,"area":"Purchasing","module":"Purchases","modules":["purchases"],"short":"Purchase Spend Trend","extra":false,"desc":"Buying plotted day by day.","insight":"Buying plotted day by day.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchases.count","label":"Purchase Bills","shape":"STAT","unit":"count","precision":0,"area":"Purchasing","module":"Purchases","modules":["purchases"],"short":"Purchase Bills","extra":false,"desc":"How many supplier bills you entered.","insight":"How many supplier bills you entered.","weight":68,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchases.unpaid_value","label":"Unpaid Purchase Value","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Purchases","modules":["purchases"],"short":"Unpaid Purchase Value","extra":false,"desc":"Bills received and not yet settled.","insight":"Bills received and not yet settled.","weight":89,"topic":"payable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchases.overdue_value","label":"Overdue to Suppliers","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Purchases","modules":["purchases"],"short":"Overdue to Suppliers","extra":false,"desc":"What is already late. Relationships live here.","insight":"What is already late. Relationships live here.","weight":86,"topic":"payable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchases.paid_to_suppliers","label":"Paid to Suppliers","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Purchases","modules":["purchases"],"short":"Paid to Suppliers","extra":false,"desc":"Cash that actually left for suppliers.","insight":"Cash that actually left for suppliers.","weight":83,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchases.by_supplier","label":"Spend by Supplier","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Purchasing","module":"Purchases","modules":["purchases"],"short":"Spend by Supplier","extra":false,"desc":"Where your buying money goes.","insight":"Where your buying money goes.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchases.by_category","label":"Spend by Category","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Purchasing","module":"Purchases","modules":["purchases"],"short":"Spend by Category","extra":false,"desc":"What you are buying, grouped.","insight":"What you are buying, grouped.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchases.price_increases","label":"Items That Got Pricier","shape":"LIST","unit":"percent","precision":2,"area":"Purchasing","module":"Purchases","modules":["purchases"],"short":"Items That Got Pricier","extra":false,"desc":"Products whose cost has crept up — the quiet margin killer.","insight":"Products whose cost has crept up — the quiet margin killer.","weight":81,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"po.open_count","label":"Open Purchase Orders","shape":"STAT","unit":"count","precision":0,"area":"Purchasing","module":"Purchase Orders","modules":["purchase_orders"],"short":"Open Purchase Orders","extra":false,"desc":"Orders placed with suppliers, not yet received.","insight":"Orders placed with suppliers, not yet received.","weight":82,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"po.open_value","label":"Open PO Value","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Purchase Orders","modules":["purchase_orders"],"short":"Open PO Value","extra":false,"desc":"Money committed to suppliers but not yet spent.","insight":"Money committed to suppliers but not yet spent.","weight":84,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"po.pending_receipt_value","label":"Awaiting Delivery Value","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Purchase Orders","modules":["purchase_orders"],"short":"Awaiting Delivery Value","extra":false,"desc":"Stock you have paid for or promised to pay for, still on the road.","insight":"Stock you have paid for or promised to pay for, still on the road.","weight":78,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"po.overdue_count","label":"Overdue POs","shape":"STAT","unit":"count","precision":0,"area":"Purchasing","module":"Purchase Orders","modules":["purchase_orders"],"short":"Overdue POs","extra":false,"desc":"Suppliers who are late on you.","insight":"Suppliers who are late on you.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"po.avg_lead_days","label":"Average PO Lead Time","shape":"STAT","unit":"days","precision":0,"area":"Purchasing","module":"Purchase Orders","modules":["purchase_orders"],"short":"Average PO Lead Time","extra":false,"desc":"How long suppliers really take, versus what they promise.","insight":"How long suppliers really take, versus what they promise.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"po.fill_rate","label":"Supplier Fill Rate","shape":"GAUGE","unit":"percent","precision":2,"area":"Purchasing","module":"Purchase Orders","modules":["purchase_orders"],"short":"Supplier Fill Rate","extra":false,"desc":"What share of what you ordered actually arrived.","insight":"What share of what you ordered actually arrived.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchase_returns.count","label":"Returns to Suppliers","shape":"STAT","unit":"count","precision":0,"area":"Purchasing","module":"Purchase Returns","modules":["purchase_returns"],"short":"Returns to Suppliers","extra":false,"desc":"How many times you sent goods back.","insight":"How many times you sent goods back.","weight":62,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchase_returns.value","label":"Value Returned","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Purchase Returns","modules":["purchase_returns"],"short":"Value Returned","extra":false,"desc":"The money value of what you returned.","insight":"The money value of what you returned.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchase_returns.credit_due","label":"Credit Notes Due","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Purchase Returns","modules":["purchase_returns"],"short":"Credit Notes Due","extra":false,"desc":"Money suppliers still owe you for returns. Easy to forget, easy to lose.","insight":"Money suppliers still owe you for returns. Easy to forget, easy to lose.","weight":78,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchase_returns.by_supplier","label":"Returns by Supplier","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Purchasing","module":"Purchase Returns","modules":["purchase_returns"],"short":"Returns by Supplier","extra":false,"desc":"Which supplier sends you bad goods.","insight":"Which supplier sends you bad goods.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"purchase_returns.rate","label":"Supplier Return Rate","shape":"GAUGE","unit":"percent","precision":2,"area":"Purchasing","module":"Purchase Returns","modules":["purchase_returns"],"short":"Supplier Return Rate","extra":false,"desc":"Returns as a share of what you bought.","insight":"Returns as a share of what you bought.","weight":68,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"landed.total","label":"Landed Cost Added","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Landed Cost","modules":["landed_cost"],"short":"Landed Cost Added","extra":false,"desc":"Freight, duty and clearing added onto goods in the period.","insight":"Freight, duty and clearing added onto goods in the period.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"landed.pct_of_goods","label":"Landed Cost as % of Goods","shape":"GAUGE","unit":"percent","precision":2,"area":"Purchasing","module":"Landed Cost","modules":["landed_cost"],"short":"Landed Cost as % of Goods","extra":false,"desc":"How much your true cost exceeds the invoice price.","insight":"How much your true cost exceeds the invoice price.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"landed.by_type","label":"Landed Cost by Type","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Purchasing","module":"Landed Cost","modules":["landed_cost"],"short":"Landed Cost by Type","extra":false,"desc":"Freight versus duty versus clearing, split out.","insight":"Freight versus duty versus clearing, split out.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"landed.true_cost_gap","label":"List Cost vs True Cost","shape":"STAT","unit":"currency","precision":2,"area":"Purchasing","module":"Landed Cost","modules":["landed_cost"],"short":"List Cost vs True Cost","extra":false,"desc":"The gap between what the supplier billed and what the goods actually cost you. Price on the wrong one and you lose money on every sale.","insight":"The gap between what the supplier billed and what the goods actually cost you. Price on the wrong one and you lose money on every sale.","weight":82,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"landed.trend","label":"Landed Cost Trend","shape":"TREND","unit":"currency","precision":2,"area":"Purchasing","module":"Landed Cost","modules":["landed_cost"],"short":"Landed Cost Trend","extra":false,"desc":"Whether import costs are climbing.","insight":"Whether import costs are climbing.","weight":66,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"cookbook.recipe_count","label":"Recipes Defined","shape":"STAT","unit":"count","precision":0,"area":"Production","module":"Cookbook","modules":["cookbook"],"short":"Recipes Defined","extra":false,"desc":"How many dishes have a costed recipe.","insight":"How many dishes have a costed recipe.","weight":66,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"cookbook.recipe_cost_pct","label":"Recipe Cost %","shape":"GAUGE","unit":"percent","precision":2,"area":"Production","module":"Cookbook","modules":["cookbook"],"short":"Recipe Cost %","extra":false,"desc":"What share of the selling price is raw material. In a kitchen this is food cost %; on a workbench it is material cost. Either way it is the number the trade lives or dies by.","insight":"What share of the selling price is raw material. In a kitchen this is food cost %; on a workbench it is material cost. Either way it is the number the trade lives or dies by.","weight":90,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"cookbook.best_margin","label":"Best-Margin Recipes","shape":"LIST","unit":"percent","precision":2,"area":"Production","module":"Cookbook","modules":["cookbook"],"short":"Best-Margin Recipes","extra":false,"desc":"What to push — the items that earn most per unit made.","insight":"What to push — the items that earn most per unit made.","weight":84,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"cookbook.worst_margin","label":"Worst-Margin Recipes","shape":"LIST","unit":"percent","precision":2,"area":"Production","module":"Cookbook","modules":["cookbook"],"short":"Worst-Margin Recipes","extra":false,"desc":"What to reprice, re-spec or drop.","insight":"What to reprice, re-spec or drop.","weight":86,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"cookbook.ingredient_cost_trend","label":"Input Cost Trend","shape":"TREND","unit":"currency","precision":2,"area":"Production","module":"Cookbook","modules":["cookbook"],"short":"Input Cost Trend","extra":false,"desc":"Whether your inputs are getting more expensive while your selling price stands still.","insight":"Whether your inputs are getting more expensive while your selling price stands still.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"cookbook.wastage_value","label":"Recipe Wastage Value","shape":"STAT","unit":"currency","precision":2,"area":"Production","module":"Cookbook","modules":["cookbook"],"short":"Recipe Wastage Value","extra":false,"desc":"Material that was bought, consumed and never turned into a sale.","insight":"Material that was bought, consumed and never turned into a sale.","weight":82,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"production.run_count","label":"Production Runs","shape":"STAT","unit":"count","precision":0,"area":"Production","module":"Production Runs","modules":["production_runs"],"short":"Production Runs","extra":false,"desc":"How many batches you made.","insight":"How many batches you made.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"production.total_cost","label":"Production Cost","shape":"STAT","unit":"currency","precision":2,"area":"Production","module":"Production Runs","modules":["production_runs"],"short":"Production Cost","extra":false,"desc":"Everything consumed to make goods in the period.","insight":"Everything consumed to make goods in the period.","weight":86,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"production.output_qty","label":"Units Produced","shape":"STAT","unit":"count","precision":0,"area":"Production","module":"Production Runs","modules":["production_runs"],"short":"Units Produced","extra":false,"desc":"What actually came out.","insight":"What actually came out.","weight":84,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"production.cost_per_unit","label":"Cost per Unit Produced","shape":"STAT","unit":"currency","precision":2,"area":"Production","module":"Production Runs","modules":["production_runs"],"short":"Cost per Unit Produced","extra":false,"desc":"Your true manufacturing cost per piece — the basis for every price you set.","insight":"Your true manufacturing cost per piece — the basis for every price you set.","weight":88,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"production.yield_pct","label":"Production Yield","shape":"GAUGE","unit":"percent","precision":2,"area":"Production","module":"Production Runs","modules":["production_runs"],"short":"Production Yield","extra":false,"desc":"What share of raw material became sellable goods.","insight":"What share of raw material became sellable goods.","weight":85,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"production.wastage_value","label":"Production Wastage","shape":"STAT","unit":"currency","precision":2,"area":"Production","module":"Production Runs","modules":["production_runs"],"short":"Production Wastage","extra":false,"desc":"Material lost in the making.","insight":"Material lost in the making.","weight":81,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"production.in_progress","label":"Runs in Progress","shape":"STAT","unit":"count","precision":0,"area":"Production","module":"Production Runs","modules":["production_runs"],"short":"Runs in Progress","extra":false,"desc":"What is on the floor right now.","insight":"What is on the floor right now.","weight":74,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"production.output_trend","label":"Output Trend","shape":"TREND","unit":"count","precision":0,"area":"Production","module":"Production Runs","modules":["production_runs"],"short":"Output Trend","extra":false,"desc":"Production volume across the period.","insight":"Production volume across the period.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"composite.count","label":"Bundles & Kits Defined","shape":"STAT","unit":"count","precision":0,"area":"Production","module":"Composite Items","modules":["composite_items"],"short":"Bundles & Kits Defined","extra":false,"desc":"How many multi-item products you sell as one.","insight":"How many multi-item products you sell as one.","weight":60,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"composite.revenue","label":"Bundle Revenue","shape":"STAT","unit":"currency","precision":2,"area":"Production","module":"Composite Items","modules":["composite_items"],"short":"Bundle Revenue","extra":false,"desc":"What bundles brought in.","insight":"What bundles brought in.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"composite.margin","label":"Bundle Margin","shape":"GAUGE","unit":"percent","precision":2,"area":"Production","module":"Composite Items","modules":["composite_items"],"short":"Bundle Margin","extra":false,"desc":"Whether bundling is earning or just discounting.","insight":"Whether bundling is earning or just discounting.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"composite.top_bundles","label":"Best-Selling Bundles","shape":"LIST","unit":"count","precision":0,"area":"Production","module":"Composite Items","modules":["composite_items"],"short":"Best-Selling Bundles","extra":false,"desc":"Which combinations customers actually want.","insight":"Which combinations customers actually want.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"composite.component_shortage","label":"Bundles Blocked by Shortages","shape":"LIST","unit":"count","precision":0,"area":"Production","module":"Composite Items","modules":["composite_items"],"short":"Bundles Blocked by Shortages","extra":false,"desc":"Kits you cannot build because one part is missing.","insight":"Kits you cannot build because one part is missing.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"khata.receivable_total","label":"Udhaar Out","shape":"STAT","unit":"currency","precision":2,"area":"Customers","module":"Khata Credit","modules":["khata_credit"],"short":"Udhaar Out","extra":false,"desc":"Total credit sitting with customers.","insight":"Total credit sitting with customers.","weight":97,"topic":"receivable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"khata.payable_total","label":"Udhaar In","shape":"STAT","unit":"currency","precision":2,"area":"Customers","module":"Khata Credit","modules":["khata_credit"],"short":"Udhaar In","extra":false,"desc":"Total credit you have taken from suppliers.","insight":"Total credit you have taken from suppliers.","weight":90,"topic":"payable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"khata.net_position","label":"Net Khata Position","shape":"STAT","unit":"currency","precision":2,"area":"Customers","module":"Khata Credit","modules":["khata_credit"],"short":"Net Khata Position","extra":false,"desc":"What you are owed minus what you owe, on credit alone.","insight":"What you are owed minus what you owe, on credit alone.","weight":88,"topic":"receivable","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"khata.biggest_debtors","label":"Who Owes You Most","shape":"LIST","unit":"currency","precision":2,"area":"Customers","module":"Khata Credit","modules":["khata_credit"],"short":"Who Owes You Most","extra":false,"desc":"Your collection list, largest first.","insight":"Your collection list, largest first.","weight":95,"topic":"receivable","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"khata.overdue_total","label":"Overdue Udhaar","shape":"STAT","unit":"currency","precision":2,"area":"Customers","module":"Khata Credit","modules":["khata_credit"],"short":"Overdue Udhaar","extra":false,"desc":"Credit that has crossed its agreed date.","insight":"Credit that has crossed its agreed date.","weight":93,"topic":"receivable","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"khata.aging","label":"Udhaar Aging","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Customers","module":"Khata Credit","modules":["khata_credit"],"short":"Udhaar Aging","extra":false,"desc":"Your credit split by how old it is. Past 90 days, most of it never comes.","insight":"Your credit split by how old it is. Past 90 days, most of it never comes.","weight":89,"topic":"receivable","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"khata.collected","label":"Udhaar Collected","shape":"STAT","unit":"currency","precision":2,"area":"Customers","module":"Khata Credit","modules":["khata_credit"],"short":"Udhaar Collected","extra":false,"desc":"How much old credit you actually recovered in the period.","insight":"How much old credit you actually recovered in the period.","weight":86,"topic":"collection","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"khata.collection_trend","label":"Collection Trend","shape":"TREND","unit":"currency","precision":2,"area":"Customers","module":"Khata Credit","modules":["khata_credit"],"short":"Collection Trend","extra":false,"desc":"Whether your recovery is improving.","insight":"Whether your recovery is improving.","weight":78,"topic":"collection","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"khata.over_limit","label":"Customers Over Credit Limit","shape":"LIST","unit":"currency","precision":2,"area":"Customers","module":"Khata Credit","modules":["khata_credit"],"short":"Customers Over Credit Limit","extra":false,"desc":"People you should stop giving credit to today.","insight":"People you should stop giving credit to today.","weight":84,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"payments.received","label":"Money Received","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Payments","modules":["payments"],"short":"Money Received","extra":false,"desc":"Every rupee that came in, by any method.","insight":"Every rupee that came in, by any method.","weight":94,"topic":"collection","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"payments.received_trend","label":"Money Received Trend","shape":"TREND","unit":"currency","precision":2,"area":"Finance","module":"Payments","modules":["payments"],"short":"Money Received Trend","extra":false,"desc":"Collections plotted day by day.","insight":"Collections plotted day by day.","weight":85,"topic":"collection","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"payments.paid","label":"Money Paid Out","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Payments","modules":["payments"],"short":"Money Paid Out","extra":false,"desc":"Every rupee that left.","insight":"Every rupee that left.","weight":88,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"payments.net_flow","label":"Net Money Movement","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Payments","modules":["payments"],"short":"Net Money Movement","extra":false,"desc":"In minus out. The most honest number on the dashboard.","insight":"In minus out. The most honest number on the dashboard.","weight":90,"topic":"liquidity","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"payments.by_method","label":"Payments by Method","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Payments","modules":["payments"],"short":"Payments by Method","extra":false,"desc":"Cash, bank, wallet, cheque — how money actually moves.","insight":"Cash, bank, wallet, cheque — how money actually moves.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"payments.cash_vs_digital","label":"Cash vs Digital","shape":"GAUGE","unit":"percent","precision":2,"area":"Finance","module":"Payments","modules":["payments"],"short":"Cash vs Digital","extra":false,"desc":"How much of your business is still paper money.","insight":"How much of your business is still paper money.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"payments.unallocated","label":"Unallocated Payments","shape":"LIST","unit":"currency","precision":2,"area":"Finance","module":"Payments","modules":["payments"],"short":"Unallocated Payments","extra":false,"desc":"Money received but not matched to any bill. Fix these before they become arguments.","insight":"Money received but not matched to any bill. Fix these before they become arguments.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"payments.bounced","label":"Bounced / Failed Payments","shape":"STAT","unit":"count","precision":0,"area":"Finance","module":"Payments","modules":["payments"],"short":"Bounced / Failed Payments","extra":false,"desc":"Payments that did not clear.","insight":"Payments that did not clear.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"expenses.count","label":"Expense Entries","shape":"STAT","unit":"count","precision":0,"area":"Finance","module":"Expenses","modules":["expenses"],"short":"Expense Entries","extra":false,"desc":"How many expense entries were logged in the period.","insight":"How many expense entries were logged in the period.","weight":62,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"expenses.trend","label":"Expense Trend","shape":"TREND","unit":"currency","precision":2,"area":"Finance","module":"Expenses","modules":["expenses"],"short":"Expense Trend","extra":false,"desc":"Spending plotted day by day.","insight":"Spending plotted day by day.","weight":84,"topic":"expenses","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"expenses.by_category","label":"Expenses by Category","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Expenses","modules":["expenses"],"short":"Expenses by Category","extra":false,"desc":"Where the money goes, grouped. Usually the first real surprise an owner gets.","insight":"Where the money goes, grouped. Usually the first real surprise an owner gets.","weight":89,"topic":"expenses","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"expenses.top_categories","label":"Biggest Expense Categories","shape":"LIST","unit":"currency","precision":2,"area":"Finance","module":"Expenses","modules":["expenses"],"short":"Biggest Expense Categories","extra":false,"desc":"Your top spending buckets, largest first.","insight":"Your top spending buckets, largest first.","weight":85,"topic":"expenses","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"expenses.unpaid","label":"Unpaid Expenses","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Expenses","modules":["expenses"],"short":"Unpaid Expenses","extra":false,"desc":"Bills already booked as expenses but not yet actually paid out.","insight":"Bills already booked as expenses but not yet actually paid out.","weight":79,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"expenses.largest","label":"Largest Expenses","shape":"LIST","unit":"currency","precision":2,"area":"Finance","module":"Expenses","modules":["expenses"],"short":"Largest Expenses","extra":false,"desc":"The individual entries worth looking at twice.","insight":"The individual entries worth looking at twice.","weight":76,"topic":"expenses","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"expenses.recurring_total","label":"Recurring Fixed Costs","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Expenses","modules":["expenses"],"short":"Recurring Fixed Costs","extra":false,"desc":"What leaves every month whether you sell anything or not.","insight":"What leaves every month whether you sell anything or not.","weight":80,"topic":"expenses","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"expenses.per_day","label":"Average Daily Burn","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Expenses","modules":["expenses"],"short":"Average Daily Burn","extra":false,"desc":"What one day of existing costs you.","insight":"What one day of existing costs you.","weight":78,"topic":"expenses","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"expenses.vs_prev","label":"Expenses vs Last Period","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Expenses","modules":["expenses"],"short":"Expenses vs Last Period","extra":false,"desc":"Spending against the period before.","insight":"Spending against the period before.","weight":74,"topic":"expenses","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"register.open_count","label":"Registers Open Now","shape":"STAT","unit":"count","precision":0,"area":"Finance","module":"Cash Register","modules":["cash_register"],"short":"Registers Open Now","extra":false,"desc":"Tills currently in an open shift.","insight":"Tills currently in an open shift.","weight":70,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"register.cash_in_drawer","label":"Cash in Drawer","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Cash Register","modules":["cash_register"],"short":"Cash in Drawer","extra":false,"desc":"Physical money that should be there right now.","insight":"Physical money that should be there right now.","weight":88,"topic":"liquidity","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"register.cash_sales","label":"Cash Sales This Shift","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Cash Register","modules":["cash_register"],"short":"Cash Sales This Shift","extra":false,"desc":"Cash taken since the till was opened.","insight":"Cash taken since the till was opened.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"register.expected_vs_actual","label":"Expected vs Counted Cash","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Cash Register","modules":["cash_register"],"short":"Expected vs Counted Cash","extra":false,"desc":"What the system says versus what was physically counted.","insight":"What the system says versus what was physically counted.","weight":86,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"register.variance_total","label":"Till Variance","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Cash Register","modules":["cash_register"],"short":"Till Variance","extra":false,"desc":"The running difference. Small and consistent is normal; growing is not.","insight":"The running difference. Small and consistent is normal; growing is not.","weight":84,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"register.by_staff","label":"Till Variance by Staff","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Cash Register","modules":["cash_register"],"short":"Till Variance by Staff","extra":false,"desc":"Which person's shifts keep coming up short.","insight":"Which person's shifts keep coming up short.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"register.shift_count","label":"Shifts Closed","shape":"STAT","unit":"count","precision":0,"area":"Finance","module":"Cash Register","modules":["cash_register"],"short":"Shifts Closed","extra":false,"desc":"Completed shifts in the period.","insight":"Completed shifts in the period.","weight":58,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"bank.account_count","label":"Bank Accounts","shape":"STAT","unit":"count","precision":0,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Bank Accounts","extra":false,"desc":"How many accounts feed into your books.","insight":"How many accounts feed into your books.","weight":76,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"bank.balances_total","label":"Bank Balances Total","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Bank Balances Total","extra":false,"desc":"What is sitting in the banks, excluding cash in hand.","insight":"What is sitting in the banks, excluding cash in hand.","weight":91,"topic":"liquidity","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"bank.balance_trend","label":"Bank Balance Trend","shape":"TREND","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Bank Balance Trend","extra":false,"desc":"Bank money plotted across the period — today next to where you were thirty days ago.","insight":"Bank money plotted across the period — today next to where you were thirty days ago.","weight":88,"topic":"liquidity","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"bank.balance_by_account","label":"Balance in Each Account","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Balance in Each Account","extra":false,"desc":"Account by account, how much is actually in each one.","insight":"Account by account, how much is actually in each one.","weight":93,"topic":"liquidity","periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"bank.top_account","label":"Largest Account Balance","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Largest Account Balance","extra":false,"desc":"Which account holds the most.","insight":"Which account holds the most.","weight":70,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"bank.money_in","label":"Money Into Bank","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Money Into Bank","extra":false,"desc":"Deposits and receipts in the period.","insight":"Deposits and receipts in the period.","weight":82,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"bank.money_out","label":"Money Out of Bank","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Money Out of Bank","extra":false,"desc":"Withdrawals and payments in the period.","insight":"Withdrawals and payments in the period.","weight":81,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"bank.cash_vs_bank","label":"Cash vs Bank Split","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Cash vs Bank Split","extra":false,"desc":"How much of your liquidity is in hand versus in the bank.","insight":"How much of your liquidity is in hand versus in the bank.","weight":74,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"bank.idle_accounts","label":"Accounts With No Movement","shape":"LIST","unit":"count","precision":0,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Accounts With No Movement","extra":false,"desc":"Accounts nothing has touched — usually forgotten money or forgotten fees.","insight":"Accounts nothing has touched — usually forgotten money or forgotten fees.","weight":58,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"recon.unreconciled_count","label":"Unreconciled Entries","shape":"STAT","unit":"count","precision":0,"area":"Finance","module":"Bank Reconciliation","modules":["bank_reconciliation"],"short":"Unreconciled Entries","extra":false,"desc":"Bank lines not yet matched to a book entry.","insight":"Bank lines not yet matched to a book entry.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"recon.unreconciled_value","label":"Unreconciled Value","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Reconciliation","modules":["bank_reconciliation"],"short":"Unreconciled Value","extra":false,"desc":"The money value of everything unmatched.","insight":"The money value of everything unmatched.","weight":82,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"recon.matched_pct","label":"Reconciliation Coverage","shape":"GAUGE","unit":"percent","precision":2,"area":"Finance","module":"Bank Reconciliation","modules":["bank_reconciliation"],"short":"Reconciliation Coverage","extra":false,"desc":"What share of bank movement is accounted for.","insight":"What share of bank movement is accounted for.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"recon.last_recon_days","label":"Days Since Last Reconciliation","shape":"STAT","unit":"days","precision":0,"area":"Finance","module":"Bank Reconciliation","modules":["bank_reconciliation"],"short":"Days Since Last Reconciliation","extra":false,"desc":"How long since your books and your bank last agreed.","insight":"How long since your books and your bank last agreed.","weight":74,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"recon.difference","label":"Book vs Bank Difference","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Reconciliation","modules":["bank_reconciliation"],"short":"Book vs Bank Difference","extra":false,"desc":"The single number that should be zero.","insight":"The single number that should be zero.","weight":84,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"accounting.trial_balance_ok","label":"Trial Balance","shape":"STATUS","unit":"count","precision":0,"area":"Finance","module":"Accounting Workspace","modules":["accounting_workspace"],"short":"Trial Balance","extra":false,"desc":"Whether every debit has its credit. Green means you can trust every other number.","insight":"Whether every debit has its credit. Green means you can trust every other number.","weight":84,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"accounting.assets_total","label":"Total Assets","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Accounting Workspace","modules":["accounting_workspace"],"short":"Total Assets","extra":false,"desc":"Everything the business owns.","insight":"Everything the business owns.","weight":82,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"accounting.liabilities_total","label":"Total Liabilities","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Accounting Workspace","modules":["accounting_workspace"],"short":"Total Liabilities","extra":false,"desc":"Everything the business owes.","insight":"Everything the business owes.","weight":81,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"accounting.equity_total","label":"Owner's Equity","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Accounting Workspace","modules":["accounting_workspace"],"short":"Owner's Equity","extra":false,"desc":"What is genuinely yours once everyone else is paid.","insight":"What is genuinely yours once everyone else is paid.","weight":86,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"accounting.equity_trend","label":"Equity Trend","shape":"TREND","unit":"currency","precision":2,"area":"Finance","module":"Accounting Workspace","modules":["accounting_workspace"],"short":"Equity Trend","extra":false,"desc":"Your stake in the business, plotted over time. The long-game number.","insight":"Your stake in the business, plotted over time. The long-game number.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"accounting.pnl_summary","label":"Profit & Loss Summary","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Accounting Workspace","modules":["accounting_workspace"],"short":"Profit & Loss Summary","extra":false,"desc":"The full P&L in one card.","insight":"The full P&L in one card.","weight":88,"topic":"profit","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"accounting.balance_sheet","label":"Balance Sheet Snapshot","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Accounting Workspace","modules":["accounting_workspace"],"short":"Balance Sheet Snapshot","extra":false,"desc":"Assets, liabilities and equity side by side.","insight":"Assets, liabilities and equity side by side.","weight":83,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"accounting.unposted_count","label":"Unposted Transactions","shape":"STAT","unit":"count","precision":0,"area":"Finance","module":"Accounting Workspace","modules":["accounting_workspace"],"short":"Unposted Transactions","extra":false,"desc":"Entries not yet in the ledger — until these post, the books are incomplete.","insight":"Entries not yet in the ledger — until these post, the books are incomplete.","weight":76,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"accounting.drawings","label":"Owner Drawings","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Accounting Workspace","modules":["accounting_workspace"],"short":"Owner Drawings","extra":false,"desc":"What you have taken out of the business personally.","insight":"What you have taken out of the business personally.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tax.collected","label":"Tax Collected","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Tax Compliance","modules":["tax_compliance"],"short":"Tax Collected","extra":false,"desc":"Output tax you charged customers.","insight":"Output tax you charged customers.","weight":84,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tax.paid","label":"Tax Paid","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Tax Compliance","modules":["tax_compliance"],"short":"Tax Paid","extra":false,"desc":"Input tax you paid suppliers.","insight":"Input tax you paid suppliers.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tax.net_liability","label":"Net Tax Payable","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Tax Compliance","modules":["tax_compliance"],"short":"Net Tax Payable","extra":false,"desc":"What you owe the authority once input is set against output. Money you are holding, not earning.","insight":"What you owe the authority once input is set against output. Money you are holding, not earning.","weight":88,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tax.liability_trend","label":"Tax Liability Trend","shape":"TREND","unit":"currency","precision":2,"area":"Finance","module":"Tax Compliance","modules":["tax_compliance"],"short":"Tax Liability Trend","extra":false,"desc":"Your tax position across the period.","insight":"Your tax position across the period.","weight":72,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tax.by_rate","label":"Tax by Rate Band","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Tax Compliance","modules":["tax_compliance"],"short":"Tax by Rate Band","extra":false,"desc":"Sales split across each rate you apply.","insight":"Sales split across each rate you apply.","weight":66,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tax.taxable_vs_exempt","label":"Taxable vs Exempt Sales","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Tax Compliance","modules":["tax_compliance"],"short":"Taxable vs Exempt Sales","extra":false,"desc":"Which part of your business is in the net.","insight":"Which part of your business is in the net.","weight":68,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"tax.filing_due","label":"Next Filing Due","shape":"STAT","unit":"days","precision":0,"area":"Finance","module":"Tax Compliance","modules":["tax_compliance"],"short":"Next Filing Due","extra":false,"desc":"How many days until the next return.","insight":"How many days until the next return.","weight":82,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — required tracking column/event is pending migration","rowNames":[],"sliceNames":[]},{"key":"tax.invoices_missing_tax","label":"Invoices Missing Tax Detail","shape":"LIST","unit":"count","precision":0,"area":"Finance","module":"Tax Compliance","modules":["tax_compliance"],"short":"Invoices Missing Tax Detail","extra":false,"desc":"Documents that will fail an audit, listed before the auditor finds them.","insight":"Documents that will fail an audit, listed before the auditor finds them.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"assets.count","label":"Fixed Assets","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Fixed Assets","modules":["fixed_assets"],"short":"Fixed Assets","extra":false,"desc":"Machines, vehicles and equipment on the register.","insight":"Machines, vehicles and equipment on the register.","weight":66,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"assets.gross_value","label":"Asset Purchase Value","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Fixed Assets","modules":["fixed_assets"],"short":"Asset Purchase Value","extra":false,"desc":"What you originally paid for them.","insight":"What you originally paid for them.","weight":72,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"assets.net_book_value","label":"Net Book Value","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Fixed Assets","modules":["fixed_assets"],"short":"Net Book Value","extra":false,"desc":"What they are worth now, after depreciation.","insight":"What they are worth now, after depreciation.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"assets.depreciation_period","label":"Depreciation This Period","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Fixed Assets","modules":["fixed_assets"],"short":"Depreciation This Period","extra":false,"desc":"The cost of your equipment wearing out — a real expense most small businesses forget.","insight":"The cost of your equipment wearing out — a real expense most small businesses forget.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"assets.by_category","label":"Assets by Category","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Operations","module":"Fixed Assets","modules":["fixed_assets"],"short":"Assets by Category","extra":false,"desc":"Your asset base, grouped.","insight":"Your asset base, grouped.","weight":62,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"assets.warranty_amc_due","label":"Warranty / AMC Expiring","shape":"LIST","unit":"count","precision":0,"area":"Operations","module":"Fixed Assets","modules":["fixed_assets"],"short":"Warranty / AMC Expiring","extra":false,"desc":"Cover about to lapse on equipment you depend on.","insight":"Cover about to lapse on equipment you depend on.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"loans.count","label":"Active Loans","shape":"STAT","unit":"count","precision":0,"area":"Finance","module":"Loans","modules":["loans"],"short":"Active Loans","extra":false,"desc":"How many facilities you are servicing.","insight":"How many facilities you are servicing.","weight":70,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"loans.outstanding_total","label":"Total Outstanding","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Loans","modules":["loans"],"short":"Total Outstanding","extra":false,"desc":"What you still owe on borrowings.","insight":"What you still owe on borrowings.","weight":86,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"loans.outstanding_trend","label":"Loan Balance Trend","shape":"TREND","unit":"currency","precision":2,"area":"Finance","module":"Loans","modules":["loans"],"short":"Loan Balance Trend","extra":false,"desc":"Your debt plotted over time — the line you want falling.","insight":"Your debt plotted over time — the line you want falling.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"loans.emi_due","label":"Instalment Due","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Loans","modules":["loans"],"short":"Instalment Due","extra":false,"desc":"What is payable next, and when.","insight":"What is payable next, and when.","weight":84,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"loans.interest_paid","label":"Interest Paid","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Loans","modules":["loans"],"short":"Interest Paid","extra":false,"desc":"The pure cost of borrowing in the period.","insight":"The pure cost of borrowing in the period.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"loans.by_lender","label":"Balance by Lender","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Finance","module":"Loans","modules":["loans"],"short":"Balance by Lender","extra":false,"desc":"Who you owe, broken out.","insight":"Who you owe, broken out.","weight":68,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"reports.pnl_shortcut","label":"P&L Quick View","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Operations","module":"Reports","modules":["reports"],"short":"P&L Quick View","extra":false,"desc":"Your profit and loss, one tap away.","insight":"Your profit and loss, one tap away.","weight":80,"topic":"profit","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"reports.sales_shortcut","label":"Sales Summary Quick View","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Operations","module":"Reports","modules":["reports"],"short":"Sales Summary Quick View","extra":false,"desc":"The sales report as a card.","insight":"The sales report as a card.","weight":78,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"reports.stock_shortcut","label":"Stock Summary Quick View","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Operations","module":"Reports","modules":["reports"],"short":"Stock Summary Quick View","extra":false,"desc":"The stock report as a card.","insight":"The stock report as a card.","weight":74,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"reports.saved_count","label":"Saved Reports","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Reports","modules":["reports"],"short":"Saved Reports","extra":false,"desc":"Reports you have set up for reuse.","insight":"Reports you have set up for reuse.","weight":48,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"reports.most_used","label":"Most-Used Reports","shape":"LIST","unit":"count","precision":0,"area":"Operations","module":"Reports","modules":["reports"],"short":"Most-Used Reports","extra":false,"desc":"What you and your staff actually open.","insight":"What you and your staff actually open.","weight":52,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"reports.scheduled_count","label":"Scheduled Reports","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Reports","modules":["reports"],"short":"Scheduled Reports","extra":false,"desc":"Reports that arrive without anyone asking.","insight":"Reports that arrive without anyone asking.","weight":50,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"unimplemented","status_reason":"Not available yet — feature data is not captured in this version","rowNames":[],"sliceNames":[]},{"key":"ai.top_insight","label":"Today's Top Insight","shape":"STATUS","unit":"count","precision":0,"area":"Operations","module":"Ai Insights","modules":["ai_insights"],"short":"Today's Top Insight","extra":false,"desc":"The one thing the system thinks you should look at today.","insight":"The one thing the system thinks you should look at today.","weight":82,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"ai.alerts_open","label":"Open AI Alerts","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Ai Insights","modules":["ai_insights"],"short":"Open AI Alerts","extra":false,"desc":"Things flagged and not yet dealt with.","insight":"Things flagged and not yet dealt with.","weight":76,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"ai.anomalies","label":"Anomalies Detected","shape":"LIST","unit":"count","precision":0,"area":"Operations","module":"Ai Insights","modules":["ai_insights"],"short":"Anomalies Detected","extra":false,"desc":"Numbers that broke their own pattern — before you would have noticed.","insight":"Numbers that broke their own pattern — before you would have noticed.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"ai.forecast_revenue","label":"Revenue Forecast","shape":"TREND","unit":"currency","precision":2,"area":"Operations","module":"Ai Insights","modules":["ai_insights"],"short":"Revenue Forecast","extra":false,"desc":"Where your revenue is heading if nothing changes.","insight":"Where your revenue is heading if nothing changes.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"ai.forecast_cash","label":"Cash Forecast","shape":"TREND","unit":"currency","precision":2,"area":"Operations","module":"Ai Insights","modules":["ai_insights"],"short":"Cash Forecast","extra":false,"desc":"Whether you will have enough cash next month.","insight":"Whether you will have enough cash next month.","weight":84,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"ai.reorder_suggestions","label":"Suggested Reorders","shape":"LIST","unit":"count","precision":0,"area":"Operations","module":"Ai Insights","modules":["ai_insights"],"short":"Suggested Reorders","extra":false,"desc":"What to buy next, based on how things actually sell.","insight":"What to buy next, based on how things actually sell.","weight":74,"topic":"lowstock","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"loyalty.member_count","label":"Loyalty Members","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Loyalty Gift","modules":["loyalty_gift"],"short":"Loyalty Members","extra":false,"desc":"How many customers are enrolled.","insight":"How many customers are enrolled.","weight":72,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"loyalty.new_members","label":"New Members","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Loyalty Gift","modules":["loyalty_gift"],"short":"New Members","extra":false,"desc":"People who joined in the period.","insight":"People who joined in the period.","weight":66,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"loyalty.member_revenue_share","label":"Member Share of Revenue","shape":"GAUGE","unit":"percent","precision":2,"area":"Operations","module":"Loyalty Gift","modules":["loyalty_gift"],"short":"Member Share of Revenue","extra":false,"desc":"How much of your business comes from people who came back on purpose.","insight":"How much of your business comes from people who came back on purpose.","weight":80,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"loyalty.member_avg_spend","label":"Member vs Non-Member Spend","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Operations","module":"Loyalty Gift","modules":["loyalty_gift"],"short":"Member vs Non-Member Spend","extra":false,"desc":"Whether the programme actually makes people spend more.","insight":"Whether the programme actually makes people spend more.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"loyalty.liability","label":"Outstanding Points Liability","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Loyalty Gift","modules":["loyalty_gift"],"short":"Outstanding Points Liability","extra":false,"desc":"The value of points customers could redeem tomorrow. It is a debt.","insight":"The value of points customers could redeem tomorrow. It is a debt.","weight":70,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"loyalty.gift_card_balance","label":"Unredeemed Gift Card Value","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Loyalty Gift","modules":["loyalty_gift"],"short":"Unredeemed Gift Card Value","extra":false,"desc":"Money taken for gift cards that has not been spent yet.","insight":"Money taken for gift cards that has not been spent yet.","weight":68,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"marketplace.channel_count","label":"Channels Connected","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Marketplace Sync","modules":["marketplace_sync"],"short":"Channels Connected","extra":false,"desc":"How many online storefronts feed into this system.","insight":"How many online storefronts feed into this system.","weight":64,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"marketplace.revenue_by_channel","label":"Revenue by Channel","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Operations","module":"Marketplace Sync","modules":["marketplace_sync"],"short":"Revenue by Channel","extra":false,"desc":"Which channel actually sells.","insight":"Which channel actually sells.","weight":86,"topic":"revenue","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"marketplace.online_vs_offline","label":"Online vs In-Store","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Operations","module":"Marketplace Sync","modules":["marketplace_sync"],"short":"Online vs In-Store","extra":false,"desc":"The split between your counter and your screens.","insight":"The split between your counter and your screens.","weight":82,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"marketplace.sync_errors","label":"Sync Errors","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Marketplace Sync","modules":["marketplace_sync"],"short":"Sync Errors","extra":false,"desc":"Listings or orders that failed to come across. Each one is an order you may never see.","insight":"Listings or orders that failed to come across. Each one is an order you may never see.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"marketplace.stock_mismatch","label":"Stock Mismatches","shape":"LIST","unit":"count","precision":0,"area":"Operations","module":"Marketplace Sync","modules":["marketplace_sync"],"short":"Stock Mismatches","extra":false,"desc":"Where online stock disagrees with your shelf — the cause of most oversells.","insight":"Where online stock disagrees with your shelf — the cause of most oversells.","weight":78,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"marketplace.channel_margin","label":"Margin by Channel","shape":"BREAKDOWN","unit":"percent","precision":2,"area":"Operations","module":"Marketplace Sync","modules":["marketplace_sync"],"short":"Margin by Channel","extra":false,"desc":"After fees, which channel is actually worth it.","insight":"After fees, which channel is actually worth it.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"unimplemented","status_reason":"Not available yet — calculation contract implementation in progress","rowNames":[],"sliceNames":[]},{"key":"staff.member_count","label":"Staff Members","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Staff Attendance","modules":["staff_attendance"],"short":"Staff Members","extra":false,"desc":"People on the roster.","insight":"People on the roster.","weight":66,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"verified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"staff.on_shift_count","label":"On Shift Now","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Staff Attendance","modules":["staff_attendance"],"short":"On Shift Now","extra":false,"desc":"Who is working right now.","insight":"Who is working right now.","weight":80,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"staff.present_today","label":"Present Today","shape":"STAT","unit":"count","precision":0,"area":"Operations","module":"Staff Attendance","modules":["staff_attendance"],"short":"Present Today","extra":false,"desc":"Attendance for the day at a glance.","insight":"Attendance for the day at a glance.","weight":78,"topic":null,"periods":["live","today","as_of","this_month"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"staff.absent_today","label":"Absent Today","shape":"LIST","unit":"count","precision":0,"area":"Operations","module":"Staff Attendance","modules":["staff_attendance"],"short":"Absent Today","extra":false,"desc":"Who did not come in.","insight":"Who did not come in.","weight":74,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":false,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"staff.hours_worked","label":"Hours Worked","shape":"STAT","unit":"hours","precision":0,"area":"Operations","module":"Staff Attendance","modules":["staff_attendance"],"short":"Hours Worked","extra":false,"desc":"Total hours across the team in the period.","insight":"Total hours across the team in the period.","weight":70,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"staff.attendance_rate","label":"Attendance Rate","shape":"GAUGE","unit":"percent","precision":2,"area":"Operations","module":"Staff Attendance","modules":["staff_attendance"],"short":"Attendance Rate","extra":false,"desc":"How reliably the team turns up.","insight":"How reliably the team turns up.","weight":72,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"staff.sales_by_staff","label":"Sales by Staff Member","shape":"BREAKDOWN","unit":"currency","precision":2,"area":"Operations","module":"Staff Attendance","modules":["staff_attendance"],"short":"Sales by Staff Member","extra":false,"desc":"Who sells. The fairest basis for a bonus you will find.","insight":"Who sells. The fairest basis for a bonus you will find.","weight":84,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"staff.revenue_per_staff","label":"Revenue per Staff Member","shape":"STAT","unit":"currency","precision":2,"area":"Operations","module":"Staff Attendance","modules":["staff_attendance"],"short":"Revenue per Staff Member","extra":false,"desc":"What each person brings in, on average.","insight":"What each person brings in, on average.","weight":76,"topic":null,"periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"this_month","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"approval.my_pending","label":"Pending Approval Submissions","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Pending Approval Submissions","extra":false,"desc":"Documents submitted by you awaiting manager or admin review and approval.","insight":"Documents submitted by you awaiting manager or admin review and approval.","weight":90,"topic":"approval","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"approval.my_returned","label":"Returned Submissions Needing Action","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Returned Submissions Needing Action","extra":false,"desc":"Submissions returned to you by reviewers with clarification requests or correction notices.","insight":"Submissions returned to you by reviewers with clarification requests or correction notices.","weight":89,"topic":"approval","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"approval.awaiting_review","label":"Awaiting My Review","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Awaiting My Review","extra":false,"desc":"Pending transactions awaiting your review, return, or approval.","insight":"Pending transactions awaiting your review, return, or approval.","weight":88,"topic":"approval","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"approval.pending_aging","label":"Approval Queue Aging","shape":"BREAKDOWN","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Approval Queue Aging","extra":false,"desc":"Aging breakdown of pending transactions by submission time (<24h, 24-48h, >48h).","insight":"Aging breakdown of pending transactions by submission time (<24h, 24-48h, >48h).","weight":87,"topic":"approval","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"approval.my_submitted","label":"Total Submissions by Me","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Total Submissions by Me","extra":false,"desc":"Total count of all approval documents submitted by you regardless of current status.","insight":"Total count of all approval documents submitted by you regardless of current status.","weight":86,"topic":"approval","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"approval.my_approved","label":"Approved Submissions for Me","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Approved Submissions for Me","extra":false,"desc":"Submissions entered by you that have received final approval and posted to the ledger.","insight":"Submissions entered by you that have received final approval and posted to the ledger.","weight":85,"topic":"approval","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"approval.reviewer_decisions_completed","label":"Review Decisions Completed","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Review Decisions Completed","extra":false,"desc":"Total approval reviews completed by you (approved, rejected, or returned) in the selected period.","insight":"Total approval reviews completed by you (approved, rejected, or returned) in the selected period.","weight":84,"topic":"approval","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"approval.reviewer_returned_to_maker","label":"Returned to Makers by Me","shape":"STAT","unit":"count","precision":0,"area":"Overview","module":"Qore","modules":[],"short":"Returned to Makers by Me","extra":false,"desc":"Transactions reviewed by you and returned back to the maker for corrections or clarifications.","insight":"Transactions reviewed by you and returned back to the maker for corrections or clarifications.","weight":83,"topic":"approval","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"cheque.available_leaves","label":"Available Cheque Leaves","shape":"STAT","unit":"count","precision":0,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Available Cheque Leaves","extra":false,"desc":"Total unused, unreserved cheque leaves available in active chequebooks.","insight":"Total unused, unreserved cheque leaves available in active chequebooks.","weight":80,"topic":"cheque","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"cheque.issued_uncleared","label":"Issued Uncleared Cheques","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Issued Uncleared Cheques","extra":false,"desc":"Total value of cheques issued to payees awaiting bank clearance.","insight":"Total value of cheques issued to payees awaiting bank clearance.","weight":81,"topic":"cheque","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"cheque.cheques_in_hand","label":"Cheques in Hand","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Cheques in Hand","extra":false,"desc":"Total value of customer cheques received but not yet deposited.","insight":"Total value of customer cheques received but not yet deposited.","weight":82,"topic":"cheque","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"cheque.deposited_uncleared","label":"Deposited Uncleared Cheques","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Deposited Uncleared Cheques","extra":false,"desc":"Total value of customer cheques deposited into bank awaiting clearance.","insight":"Total value of customer cheques deposited into bank awaiting clearance.","weight":83,"topic":"cheque","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"cheque.bounced_total","label":"Bounced Cheques","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Bounced Cheques","extra":false,"desc":"Total amount of bounced cheques (issued or received).","insight":"Total amount of bounced cheques (issued or received).","weight":84,"topic":"cheque","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"cheque.stopped_total","label":"Stopped Cheques","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Stopped Cheques","extra":false,"desc":"Total amount of issued cheques on which payment was stopped.","insight":"Total amount of issued cheques on which payment was stopped.","weight":85,"topic":"cheque","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]},{"key":"cheque.post_dated_due","label":"Post-Dated Cheques Due","shape":"STAT","unit":"currency","precision":2,"area":"Finance","module":"Bank Accounts","modules":["bank_accounts"],"short":"Post-Dated Cheques Due","extra":false,"desc":"Total amount of incoming and outgoing post-dated cheques due within 7 days.","insight":"Total amount of incoming and outgoing post-dated cheques due within 7 days.","weight":86,"topic":"cheque","periods":["today","yesterday","this_week","this_month","last_month","this_quarter","this_year","custom"],"default_period":"today","period_aware":true,"contract_state":"implemented_unverified","status_reason":null,"rowNames":[],"sliceNames":[]}]`);
const NAV_GROUP_LABELS = { A: "Catalog", B: "Sell", C: "Stock", D: "Buy", E: "Make", F: "Money", G: "Grow" };
const NAV_GROUP_ORDER = ["A", "B", "C", "D", "E", "F", "G"];
const READING_DESC = {
  // ── Core & Overview Financials ──
  "core.revenue": "All the money that came into your shop from sales. It adds up every customer payment from your cash register, invoices, and receipts. This is the total money customers handed you before taking out any costs or expenses.",
  "core.revenue_trend": "A day-by-day graph of your sales. It shows how much money came in each day, so you can easily spot your best sales days, your slow days, and whether your sales are going up or down this month.",
  "core.gross_profit": "The profit you make on the items themselves. It takes your sales money and subtracts what you paid to buy those products wholesale. For example, if you sell a shirt for Rs 1,000 that cost you Rs 600, your gross profit is Rs 400.",
  "core.gross_margin_pct": "Shows what percentage of your selling price is profit. For example, a 40% margin means that for every 100 rupees a customer pays you, 40 rupees is profit on the item and 60 rupees covers what you paid to buy it.",
  "core.net_profit": "The real money you actually take home in your pocket. It takes your sales and subtracts everything: the cost of the products, shop rent, staff wages, electricity bills, tea, and taxes. This is your true final profit.",
  "core.net_margin_pct": "Out of every 100 rupees of sales that comes into your shop, this shows how many rupees stay with you as pure profit after paying every single shop bill and expense.",
  "core.profit_trend": "A daily graph showing your actual take-home profit day by day. It shows if you made real money every day or if big bills (like rent or supplier payments) caused you to lose money on certain days.",
  "core.cogs": "The wholesale cost of the products you actually sold to customers. It only counts items that were sold, so you know exactly how much you paid to buy that inventory from your suppliers.",
  "core.expenses_total": "All the everyday money spent to keep your shop running. This includes shop rent, electricity, staff salaries, internet, tea, repairs, and delivery costs. It does not include buying stock.",
  "core.expense_ratio": "Shows how much of your sales money is eaten up by shop bills. For example, if you sell Rs 100,000 and your shop expenses are Rs 20,000, then 20% of your money goes straight to bills.",
  "core.receivables": "The total money that customers owe you on credit (your Khata balance). It shows how much of your money is sitting in other people's pockets waiting to be collected.",
  "core.receivables_aging": "Groups what customers owe you by how late they are (under 30 days, 60 days, or over 90 days). It reminds you which customers to call first before their credit gets too old to collect.",
  "core.payables": "Total money you owe to your suppliers and vendors for stock or services. It shows all the upcoming bills that you need to pay soon.",
  "core.payables_aging": "Lists your supplier bills by when they are due. It helps you see which bills need to be paid today and which ones you can pay next week, keeping suppliers happy.",
  "core.total_liquidity": "All the ready cash you have right now. It adds up all the cash inside your cash drawer and safe, plus all the money in every bank account you have.",
  "core.liquidity_trend": "A graph tracking your total cash over time. It shows whether your shop is saving more cash day by day or if your bank balance is slowly drying up.",
  "core.cash_flow_trend": "Compares the cash entering your shop against the cash leaving your shop each day. It helps make sure you don't spend more cash on bills than what customers are paying you.",
  "core.net_cash_position": "The cash you have in hand and bank minus what you owe to suppliers right now. It tells you how much money is truly yours if you paid off all your supplier bills today.",
  "core.working_capital": "Your financial breathing room. It checks if your current stock, cash, and customer dues are enough to easily cover your short-term bills and keep your shop running smoothly.",
  "core.revenue_vs_prev": "Shows if your sales are higher or lower compared to last month or last week. A green number means more customers are buying from you than before.",
  "core.profit_vs_prev": "Shows if your real take-home profit grew or shrank compared to last month. It tells you if you are actually keeping more money in your pocket than before.",
  "core.transaction_count": "The total number of customer sales and printed receipts. It tells you how busy your checkout counter was, counting every visit whether the customer spent Rs 50 or Rs 50,000.",
  "core.avg_transaction_value": "The average amount a customer spends when they buy from you. It divides your total sales by the number of customers, showing if people are buying bigger or smaller baskets.",
  "core.busiest_day": "Tells you which day brought in the most sales money. It helps you know which day of the week you need the most staff and the most stock ready.",
  "core.peak_hour": "The exact hour of the day when the most customers are checking out at your counter. It tells you when you need all cashiers present to handle the rush.",
  "core.balance_sheet_ok": "A live check that makes sure all your accounts balance. A green mark means every debit matches every credit and there are zero bookkeeping errors in your system.",
  "core.journal_entries_count": "The number of accounting records our system created for your shop automatically. Every time you sell, buy, or pay a bill, the system writes the accounting entries for you.",
  "core.audit_trail_count": "A safety counter of every action taken in your system, like making a sale, giving a discount, or editing stock. It keeps a record so you always know who did what.",
  "core.reversal_count": "Counts how many times a sale or bill was cancelled, returned, or corrected. A high number helps you catch cashier mistakes or customer return issues early.",
  "core.document_sequence_ok": "Checks that your invoice and receipt numbers follow in a clean order (like 101, 102, 103) with no missing slips or duplicate numbers.",
  "core.user_activity": "Shows which of your staff members and cashiers have logged into the system and are working today.",
  "core.plan_usage": "Shows how much of your monthly software plan limits you have used, such as number of orders or products.",
  // ── Inventory & Products ──
  "inventory.stock_value": "The wholesale purchase cost of all the goods sitting on your shelves. It tells you exactly how much of your money is currently tied up in unsold stock.",
  "inventory.low_stock_count": "Products that are running out of stock and need to be reordered soon before you run out completely.",
  "inventory.out_of_stock_count": "Products that have completely sold out with zero left on the shelf. You need to reorder these to avoid missing sales.",
  "inventory.turnover": "Shows how many times your stock completely sells out and gets replaced. Fast-moving items sell quickly and make you more money.",
  "inventory.days_of_cover": "How many days your current stock will last based on how fast it is selling. Helps you know when to order more goods.",
  "inventory.dead_stock_value": "Money stuck in products that haven't sold in a long time. You can put these on sale or discount them to get your cash back.",
  "products.top_margin": "The items in your shop that give you the highest profit percentage on each sale. These are your best items to recommend to customers to make more money.",
  "products.lowest_margin": "The items you sell with very little profit markup. It warns you where you are barely making any profit so you can adjust prices if supplier costs go up.",
  "products.active_count": "The total number of products you currently have available for customers to buy in your store.",
  "products.by_category": "Shows how your products are divided across different groups, like drinks, snacks, or clothes, so you see what types of items you carry the most.",
  "products.catalogue_value": "How much money you would collect if you sold every single item currently on your shelves at full retail price.",
  "products.never_sold": "Items sitting in your shop that no customer has ever bought. It helps you spot dead items so you can put them on discount or stop ordering them.",
  "products.missing_cost": "Products where you forgot to enter what you paid the supplier. Entering their cost is important so the system can calculate your real profit.",
  "products.new_this_period": "New products you added to your store during this period.",
  // ── Customers & Khata ──
  "customers.count": "The total number of customers saved in your system with their contact and Khata details.",
  "customers.top_customers": "A list of your best customers who have spent the most money in your shop. It helps you know your most loyal buyers so you can give them special service.",
  "customers.dormant": "Customers who used to buy from you but have not visited in the last 2 to 3 months. A reminder to send them an SMS or give them a special offer to bring them back.",
  "customers.repeat_rate": "The percentage of customers who come back to buy from you again. A higher number means customers love your shop and keep returning.",
  "customers.avg_spend": "The average amount a customer has spent in your shop over their entire history with you.",
  // ── Suppliers & Purchasing ──
  "suppliers.active": "How many different suppliers and wholesale distributors you bought goods from during this period.",
  "suppliers.top_suppliers": "The suppliers you buy the most from. Helps you know who your biggest partners are so you can ask for better discounts.",
  "suppliers.spend_total": "The total money you spent buying new stock and goods from suppliers during this period.",
  "suppliers.spend_trend": "A timeline showing how much money you spent on buying stock each week or month.",
  "suppliers.concentration": "Shows if too much of your purchasing is coming from just one supplier, so you know if you are depending too much on one vendor.",
  // ── Point of Sale (POS) ──
  "pos.revenue_trend": "Shows your counter sales hour by hour and day by day, helping you see when your cash register is making the most money.",
  "pos.payment_breakdown": "Shows how customers paid you — how much came in cash, how much by bank card, and how much on credit. It makes end-of-day register counting easy.",
  "pos.hourly_heatmap": "A map showing your rush hours across the entire week, so you know which hours of each day are packed with customers and which hours are quiet.",
  "pos.live_feed": "A live feed showing every sale as it happens at the counter right now. You can see what customers are buying in real time.",
  "pos.max_sale": "The biggest single sale made at your counter during this period.",
  "pos.items_per_sale": "The average number of items a customer buys in one receipt. It tells you if customers are buying just one thing or filling their baskets.",
  // ── Invoicing & Billing ──
  "invoicing.value_trend": "Shows the total value of customer invoices you issued over time, tracking your wholesale and corporate billing.",
  "invoicing.unpaid_value": "The total amount of unpaid customer invoices waiting to be collected.",
  "invoicing.overdue_count": "How many customer invoices are late and past their due date, reminding you who needs a payment reminder.",
  // ── Bank Accounts & Cash ──
  "bank_accounts.total_balance": "The total money sitting in all your bank accounts combined.",
  "bank_accounts.cash_on_hand": "The physical cash inside your shop registers, cash drawer, and safe right now.",
  "bank_accounts.money_in_today": "Total money received today from sales, customer Khata payments, and bank deposits.",
  "bank_accounts.money_out_today": "Total money paid out today for supplier bills, shop expenses, and cash withdrawals.",
  "accounting.assets": "Everything of value your business owns — your unsold stock, bank balance, cash in hand, and customer credit combined.",
  "accounting.liabilities": "Everything your business owes to others — unpaid supplier bills, loans, and expenses.",
  "accounting.income_ytd": "All sales and earnings your shop has made since the beginning of this year.",
  "accounting.expense_ytd": "All shop bills, expenses, and costs spent since the beginning of this year."
};
function readingDesc(r) {
  if (READING_DESC[r.key]) return READING_DESC[r.key];
  if (r.desc && typeof r.desc === "string" && !r.desc.includes("— a live") && r.desc.trim().length > 20) return r.desc;
  if (r.insight && typeof r.insight === "string" && !r.insight.includes("— a live") && r.insight.trim().length > 20) return r.insight;
  if (r.description && typeof r.description === "string" && !r.description.includes("— a live") && r.description.trim().length > 20) return r.description;
  const noun = r.unit === "currency" ? "money amounts" : r.unit === "percent" ? "percentages" : "counts";
  return `Tracks ${r.label.toLowerCase()} for your store, showing real-time ${noun} from your ${r.area.toLowerCase()} records.`;
}
function modulesOf(key) {
  if (typeof window !== "undefined" && Array.isArray(window.READINGS)) {
    const found = window.READINGS.find((r) => r.key === key);
    if (found && Array.isArray(found.modules)) return found.modules;
  }
  const fallback = Array.isArray(RECKONER_CATALOG) ? RECKONER_CATALOG.find((r) => r.key === key) : null;
  return fallback && Array.isArray(fallback.modules) ? fallback.modules : [];
}
function prepareReadings(source) {
  const list = Array.isArray(source) ? [...source] : [...RECKONER_CATALOG];
  if (typeof window !== "undefined" && window.__VENQORE_DEMO_MODE__) {
    list.push(
      {
        key: "finance.expenses_trend",
        label: "Expense trend",
        shape: "SERIES",
        unit: "currency",
        area: "Finance",
        module: "Extra",
        modules: ["expenses"],
        short: "Expense trend",
        extra: true,
        rowNames: ["Rent", "Salaries", "Utilities", "Transport", "Marketing", "Other"],
        sliceNames: ["Rent", "Salaries", "Utilities", "Transport", "Other"]
      },
      {
        key: "operations.activity_feed",
        label: "Recent activity",
        shape: "FEED",
        unit: "currency",
        area: "Operations",
        module: "Extra",
        modules: [],
        short: "Recent activity",
        extra: true,
        rowNames: ["Bilal Ahmed", "Sana Iqbal", "Hamza Raza", "Noor Fatima", "Ayesha Khan", "Usman Ali"],
        sliceNames: ["New", "Returning", "Dormant"]
      },
      {
        key: "bank_accounts.liquid_net",
        label: "Total Liquid Net",
        shape: "SCALAR",
        unit: "currency",
        area: "Finance",
        module: "BankAccounts",
        modules: ["bank_accounts"],
        short: "Total Liquid Net",
        extra: true,
        rowNames: ["Rent", "Salaries", "Utilities", "Transport", "Marketing", "Other"],
        sliceNames: ["Rent", "Salaries", "Utilities", "Transport", "Other"]
      },
      {
        key: "purchasing.recent",
        label: "Recent purchases",
        shape: "FEED",
        unit: "currency",
        area: "Purchasing",
        module: "Extra",
        modules: ["purchases"],
        short: "Recent purchases",
        extra: true,
        rowNames: ["Metro Supply", "Karim Bros", "Lahore Foods", "Indus Traders", "Bahria Wholesale", "Ravi Depot"],
        sliceNames: ["Metro Supply", "Karim Bros", "Lahore Foods", "Indus Traders"]
      }
    );
    READING_DESC["bank_accounts.liquid_net"] = "Bank balances and cash in hand, added up — everything liquid.";
    READING_DESC["purchasing.recent"] = "The latest purchases from your suppliers, newest first.";
  }
  list.forEach((r) => {
    r.desc = readingDesc(r);
    r.modules = Array.isArray(r.modules) ? r.modules : modulesOf(r.key);
    r.rowNames = Array.isArray(r.rowNames) ? r.rowNames : [];
    r.sliceNames = Array.isArray(r.sliceNames) ? r.sliceNames : [];
  });
  return list;
}
let DASHBOARD_RUNTIME_DATA = {};
const LIVE_RECKONER_DATA = {};
const PENDING_RECKONER_REQUESTS = /* @__PURE__ */ new Set();
let RECKONER_FETCH_TIMER = null;
function clearReckonerDataCache() {
  for (const k of Object.keys(LIVE_RECKONER_DATA)) {
    delete LIVE_RECKONER_DATA[k];
  }
}
function runCardBuilder(opts) {
  const ENGINE_VERSION = 4;
  if (typeof window !== "undefined" && window.VenQoreCards?.engineVersion === ENGINE_VERSION && window.__vqCardEngine) {
    window.VenQoreCards.setStoreSlug(opts && opts.storeSlug);
    window.VenQoreCards.setEnabledModules(opts && opts.modules);
    if (opts && opts.layoutLaw && window.VenQoreCards.setLayoutLaw) {
      window.VenQoreCards.setLayoutLaw(opts.layoutLaw);
    }
    if (opts && opts.readings && window.VenQoreCards.setReadings) {
      window.VenQoreCards.setReadings(opts.readings);
    }
    window.VenQoreCards.boot();
    return;
  }
  if (typeof window !== "undefined") window.__vqCardEngine = true;
  let READINGS = prepareReadings(
    opts && opts.readings || typeof window !== "undefined" && window.__VENQORE_READINGS__ || RECKONER_CATALOG
  );
  let ENABLED_MODULES = null;
  function setEnabledModules(list) {
    ENABLED_MODULES = Array.isArray(list) && list.length ? new Set(list) : null;
  }
  function readingAvailable(r) {
    if (r && r.contract_state === "unimplemented") return false;
    if (!ENABLED_MODULES) return true;
    const mods = r.modules || [];
    if (!mods.length) return true;
    return mods.some((m) => ENABLED_MODULES.has(m));
  }
  function availableReadings() {
    return READINGS.filter(readingAvailable);
  }
  const SPECIAL_MODULES = {
    bank_liquidity: ["bank_accounts"],
    growth_engine: ["reports", "ai_insights"],
    action_hub: [],
    launchpad: [],
    alerts_hub: [],
    custom_button: []
  };
  function specialAvailable(type) {
    if (!ENABLED_MODULES) return true;
    const mods = SPECIAL_MODULES[type] || [];
    if (!mods.length) return true;
    return mods.some((m) => ENABLED_MODULES.has(m));
  }
  const MS_H = 36e5, MS_D = 864e5;
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const PERIOD = {
    Today: { n: 12, step: MS_H, grain: "hour" },
    Week: { n: 7, step: MS_D, grain: "day" },
    Month: { n: 30, step: MS_D, grain: "day" },
    Quarter: { n: 13, step: 7 * MS_D, grain: "week" },
    Year: { n: 12, step: 30 * MS_D, grain: "month" }
  };
  const PERIODS = Object.keys(PERIOD);
  function anchorNow() {
    const d = /* @__PURE__ */ new Date();
    d.setMinutes(0, 0, 0);
    return d;
  }
  function timeline(period) {
    const conf = PERIOD[period] || PERIOD.Month;
    const grain = conf.grain;
    const now = anchorNow();
    if (period === "Today") {
      const out2 = [];
      const base = new Date(now);
      base.setHours(0, 0, 0, 0);
      const maxH = Math.max(12, Math.min(24, now.getHours() + 1));
      for (let h = 0; h < maxH; h++) {
        out2.push(new Date(base.getTime() + h * MS_H));
      }
      return out2;
    }
    if (period === "Week") {
      const out2 = [];
      const base = new Date(now);
      base.setHours(0, 0, 0, 0);
      const day = base.getDay();
      const diffToMon = day === 0 ? 6 : day - 1;
      const monday = new Date(base.getTime() - diffToMon * MS_D);
      const count = Math.max(2, diffToMon + 1);
      for (let d = 0; d < count; d++) {
        out2.push(new Date(monday.getTime() + d * MS_D));
      }
      return out2;
    }
    if (period === "Month") {
      const out2 = [];
      const y = now.getFullYear();
      const m = now.getMonth();
      const todayDate = Math.max(2, now.getDate());
      for (let d = 1; d <= todayDate; d++) {
        out2.push(new Date(y, m, d, 0, 0, 0));
      }
      return out2;
    }
    if (period === "Quarter") {
      const out2 = [];
      const y = now.getFullYear();
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const currentMonth = now.getMonth();
      for (let m = qStartMonth; m <= currentMonth; m++) {
        out2.push(new Date(y, m, 1, 0, 0, 0));
      }
      return out2.length >= 2 ? out2 : [new Date(y, qStartMonth, 1, 0, 0, 0), now];
    }
    if (period === "Year") {
      const out2 = [];
      const y = now.getFullYear();
      const currentMonth = now.getMonth();
      for (let m = 0; m <= currentMonth; m++) {
        out2.push(new Date(y, m, 1, 0, 0, 0));
      }
      return out2.length >= 2 ? out2 : [new Date(y, 0, 1, 0, 0, 0), now];
    }
    const { n, step } = conf;
    const end = anchorNow();
    if (grain !== "hour") end.setHours(0, 0, 0, 0);
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(new Date(end.getTime() - i * step));
    return out;
  }
  function tickLabel(d, grain) {
    if (grain === "hour") return String(d.getHours()).padStart(2, "0") + ":00";
    if (grain === "month") return MON[d.getMonth()];
    return MON[d.getMonth()] + " " + d.getDate();
  }
  function fullLabel(d, grain) {
    if (grain === "hour") return DOW[d.getDay()] + " " + String(d.getHours()).padStart(2, "0") + ":00";
    if (grain === "month") return MON[d.getMonth()] + " " + d.getFullYear();
    if (grain === "week") return "Week of " + MON[d.getMonth()] + " " + d.getDate();
    return DOW[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate();
  }
  function tickerParts(d, grain) {
    if (grain === "hour") return { a: DOW[d.getDay()], b: String(d.getHours()).padStart(2, "0") + ":00" };
    if (grain === "month") return { a: String(d.getFullYear()), b: MON[d.getMonth()] };
    return { a: MON[d.getMonth()], b: String(d.getDate()) };
  }
  function niceStep(raw) {
    const mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }
  function niceTicks(min, max, count = 5) {
    if (!isFinite(min) || !isFinite(max) || min === max) {
      max = (max || 1) * 1.2;
      min = 0;
    }
    const step = niceStep((max - min) / Math.max(1, count - 1));
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const out = [];
    for (let v = lo; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return { ticks: out, lo, hi };
  }
  function fmtValue(v, unit, compact) {
    if (unit === "percent") return Math.round(v * 10) / 10 + "%";
    if (unit === "currency") return compact ? abbrNum(v) : groupNum(Math.round(v));
    return compact ? abbrNum(v) : groupNum(Math.round(v));
  }
  function groupNum(n) {
    return Math.round(n).toLocaleString("en-US");
  }
  function abbrNum(n) {
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "K";
    return groupNum(n);
  }
  function unitPrefix(unit) {
    return unit === "currency" ? "Rs " : "";
  }
  function toReckonerPeriod(period) {
    const map = {
      Day: "today",
      Today: "today",
      Week: "this_week",
      Month: "this_month",
      Quarter: "this_quarter",
      Year: "this_year"
    };
    return map[period] || "this_month";
  }
  function queueLiveReadings(cards, onComplete) {
    if (!cards || !cards.length || typeof window === "undefined" || typeof axios === "undefined") return;
    const now = Date.now();
    const requests = [];
    cards.forEach((c) => {
      if (!c || c.type) return;
      const uiPer = c.period || "Month";
      const rd = readingOf(c.key);
      let reckPer = toReckonerPeriod(uiPer);
      if (rd && rd.periods && Array.isArray(rd.periods) && rd.periods.length > 0 && !rd.periods.includes(reckPer)) {
        reckPer = rd.default_period || rd.periods[0] || "live";
      }
      const gran = PERIOD[uiPer]?.grain || "day";
      const compositeId = `${c.key}|${reckPer}|${gran}`;
      const reqKey = `${c.key}|${uiPer}`;
      const existing = LIVE_RECKONER_DATA[compositeId] || LIVE_RECKONER_DATA[reqKey];
      const isExpired = existing && existing._expiresAt && now > existing._expiresAt;
      if (!PENDING_RECKONER_REQUESTS.has(reqKey) && (!existing || isExpired)) {
        PENDING_RECKONER_REQUESTS.add(reqKey);
        requests.push({ key: c.key, period: reckPer, granularity: gran, reqKey, uiPeriod: uiPer });
      }
      if (Array.isArray(c.extraKeys)) {
        c.extraKeys.forEach((ek) => {
          const ekRd = readingOf(ek);
          let ekReckPer = toReckonerPeriod(uiPer);
          if (ekRd && ekRd.periods && Array.isArray(ekRd.periods) && ekRd.periods.length > 0 && !ekRd.periods.includes(ekReckPer)) {
            ekReckPer = ekRd.default_period || ekRd.periods[0] || "live";
          }
          const ekCompositeId = `${ek}|${ekReckPer}|${gran}`;
          const ekReqKey = `${ek}|${uiPer}`;
          const ekExisting = LIVE_RECKONER_DATA[ekCompositeId] || LIVE_RECKONER_DATA[ekReqKey];
          const ekIsExpired = ekExisting && ekExisting._expiresAt && now > ekExisting._expiresAt;
          if (!PENDING_RECKONER_REQUESTS.has(ekReqKey) && (!ekExisting || ekIsExpired)) {
            PENDING_RECKONER_REQUESTS.add(ekReqKey);
            requests.push({ key: ek, period: ekReckPer, granularity: gran, reqKey: ekReqKey, uiPeriod: uiPer });
          }
        });
      }
    });
    if (!requests.length) {
      return;
    }
    const chunks = [];
    for (let i = 0; i < requests.length; i += 24) {
      chunks.push(requests.slice(i, i + 24));
    }
    Promise.allSettled(chunks.map(
      (chunk) => axios.post("/api/reckoner/read", {
        requests: chunk.map((r) => ({ key: r.key, period: r.period, granularity: r.granularity }))
      }).then((res) => {
        const items = res?.data?.data || [];
        const receivedAt = Date.now();
        items.forEach((item) => {
          if (item && item.key) {
            const ttlSec = Math.max(300, Number(item.meta?.ttl) || 300);
            item._expiresAt = receivedAt + ttlSec * 1e3;
            const req = chunk.find((r) => item.id && item.id.startsWith(r.key + "|" + r.period)) || chunk.find((r) => r.key === item.key && (r.period === item.period?.key || r.period === item.period)) || chunk.find((r) => r.key === item.key);
            const perKey = item.period?.key || req?.period || "today";
            const uiP = req?.uiPeriod || "Month";
            const gran = req?.granularity || item.granularity || PERIOD[uiP]?.grain || "day";
            if (item.id) {
              LIVE_RECKONER_DATA[item.id] = item;
            }
            LIVE_RECKONER_DATA[`${item.key}|${perKey}|${gran}`] = item;
            LIVE_RECKONER_DATA[`${item.key}|${perKey}`] = item;
            LIVE_RECKONER_DATA[`${item.key}|${uiP}`] = item;
          }
        });
      }).catch((error) => {
        const message = error?.response?.data?.message || error?.message || "This reading could not be loaded.";
        chunk.forEach((req) => {
          const failure = { key: req.key, ok: false, status: "error", error: { code: "request_failed", message } };
          if (!LIVE_RECKONER_DATA[`${req.key}|${req.uiPeriod}`]) {
            LIVE_RECKONER_DATA[`${req.key}|${req.period}|${req.granularity}`] = failure;
            LIVE_RECKONER_DATA[`${req.key}|${req.period}`] = failure;
            LIVE_RECKONER_DATA[`${req.key}|${req.uiPeriod}`] = failure;
          }
        });
      }).finally(() => {
        chunk.forEach((r) => PENDING_RECKONER_REQUESTS.delete(r.reqKey));
      })
    )).then(() => {
      if (typeof window !== "undefined" && window.VenQoreCards && window.VenQoreCards.draw) {
        window.VenQoreCards.draw();
      }
    });
  }
  function liveReading(card) {
    const reckPer = toReckonerPeriod(card.period);
    const gran = PERIOD[card.period]?.grain || "day";
    return LIVE_RECKONER_DATA[`${card.key}|${card.period}`] || LIVE_RECKONER_DATA[`${card.key}|${reckPer}|${gran}`] || LIVE_RECKONER_DATA[`${card.key}|${reckPer}`] || null;
  }
  function renderDataState(host, card, emptyMessage = "No data in this period.") {
    const pending = PENDING_RECKONER_REQUESTS.has(`${card.key}|${card.period}`) || PENDING_RECKONER_REQUESTS.has(`${card.key}|${toReckonerPeriod(card.period)}`);
    const live = liveReading(card);
    if (pending && !live) {
      host.innerHTML = `<div class="ck-state is-loading" role="status">Loading…</div>`;
      return true;
    }
    if (live?.status === "unavailable") {
      const reason = live.error?.message || "Coming soon — not available yet.";
      host.innerHTML = `<div class="ck-state is-unavailable" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <b>Not available yet</b>
      <span>${esc(reason)}</span>
    </div>`;
      return true;
    }
    if (live?.status === "empty") {
      host.innerHTML = `<div class="ck-state is-empty" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><path d="M4 6v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6"/><path d="M10 12h4"/></svg>
      <b>No activity recorded</b>
      <span>${esc(emptyMessage)}</span>
    </div>`;
      return true;
    }
    if (live?.status === "locked" || live?.status === "plan_locked" || live?.status === "module_locked") {
      host.innerHTML = `<div class="ck-state is-unavailable" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <b>Module not active</b>
      <span>Enable this feature in settings to view data.</span>
    </div>`;
      return true;
    }
    if (live && (!live.ok || live.status === "error")) {
      let errText = live.error?.message || "New transactions will automatically stream here.";
      if (typeof errText === "string" && (errText.includes("Invariant failure:") || errText.includes("stock_value_control") || errText.includes("FAILED:"))) {
        errText = "Reconciling ledger entries. Data will update on next sync.";
      }
      host.innerHTML = `<div class="ck-state is-unavailable" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <b>Data reconciling</b>
      <span>${esc(errText)}</span>
    </div>`;
      return true;
    }
    if (!live) {
      host.innerHTML = `<div class="ck-state is-empty" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <b>Awaiting updates</b>
      <span>${esc(emptyMessage)}</span>
    </div>`;
      return true;
    }
    return false;
  }
  function valuesFor(key, period, unit) {
    const conf = PERIOD[period] || PERIOD.Month;
    const grain = conf.grain || "day";
    const times = timeline(period);
    const n = times.length;
    const reckPer = toReckonerPeriod(period);
    const gran = grain;
    const reqKey = `${key}|${period}`;
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${key}|${reckPer}|${gran}`] || LIVE_RECKONER_DATA[`${key}|${reckPer}`];
    if (live && live.ok && live.status !== "unavailable") {
      let seriesSource = live.data && (live.data.series || live.data.points) || live.series;
      if (!seriesSource || Array.isArray(seriesSource) && seriesSource.length === 0) {
        const trendKey = `${key}_trend`;
        const altTrendKey = key.includes("net_profit") ? key.replace("net_profit", "profit_trend") : key.includes("gross_profit") ? key.replace("gross_profit", "profit_trend") : null;
        const trendLive = LIVE_RECKONER_DATA[`${trendKey}|${period}`] || LIVE_RECKONER_DATA[`${trendKey}|${reckPer}`] || altTrendKey && (LIVE_RECKONER_DATA[`${altTrendKey}|${period}`] || LIVE_RECKONER_DATA[`${altTrendKey}|${reckPer}`]);
        if (trendLive && trendLive.ok && trendLive.data && Array.isArray(trendLive.data.series) && trendLive.data.series.length > 0) {
          seriesSource = trendLive.data.series;
        }
      }
      if (seriesSource && Array.isArray(seriesSource) && seriesSource.length > 0) {
        const xMap = /* @__PURE__ */ new Map();
        seriesSource.forEach((pt) => {
          let rawDate = pt.date ?? pt.t ?? pt.x ?? "";
          let k = String(rawDate);
          if (typeof rawDate === "string" && rawDate.includes("T")) {
            const ptDate = new Date(rawDate);
            if (!isNaN(ptDate.getTime())) {
              if (grain === "hour") {
                k = String(ptDate.getHours()).padStart(2, "0");
              } else if (grain === "month") {
                k = `${ptDate.getFullYear()}-${String(ptDate.getMonth() + 1).padStart(2, "0")}`;
              } else {
                k = `${ptDate.getFullYear()}-${String(ptDate.getMonth() + 1).padStart(2, "0")}-${String(ptDate.getDate()).padStart(2, "0")}`;
              }
            }
          } else if (typeof rawDate === "string" && rawDate.length >= 10 && rawDate.includes("-")) {
            if (grain === "month") {
              k = rawDate.slice(0, 7);
            } else if (grain === "hour" && rawDate.length >= 13) {
              k = rawDate.slice(11, 13);
            } else {
              k = rawDate.slice(0, 10);
            }
          } else if (typeof rawDate === "number" || typeof rawDate === "string" && /^\d+$/.test(rawDate)) {
            if (grain === "hour") {
              k = String(Number(rawDate)).padStart(2, "0");
            }
          }
          const v = typeof pt.y === "number" ? pt.y : typeof pt.value === "number" ? pt.value : typeof pt === "number" ? pt : Number(pt) || 0;
          xMap.set(k, v);
        });
        const mapped = times.map((t) => {
          let k;
          if (grain === "hour") {
            k = String(t.getHours()).padStart(2, "0");
          } else if (grain === "month") {
            k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
          } else {
            const y = t.getFullYear();
            const m = String(t.getMonth() + 1).padStart(2, "0");
            const d = String(t.getDate()).padStart(2, "0");
            k = `${y}-${m}-${d}`;
          }
          return xMap.has(k) ? xMap.get(k) : null;
        });
        if (mapped.some((v) => v !== null)) {
          return mapped.map((v) => v ?? 0);
        }
        const pts = seriesSource.map((pt) => typeof pt === "number" ? pt : typeof pt?.y === "number" ? pt.y : typeof pt?.value === "number" ? pt.value : 0);
        if (pts.length === n) return pts;
        if (pts.length > n) return pts.slice(-n);
        return pts;
      }
      if (Array.isArray(live.data) && typeof live.data[0] === "number") {
        if (live.data.length === n) return live.data;
        if (live.data.length > n) return live.data.slice(-n);
        return live.data;
      }
      if (typeof live.data === "number") {
        const arr = new Array(n).fill(0);
        arr[n - 1] = live.data;
        return arr;
      }
      if (typeof live.value === "number") {
        const arr = new Array(n).fill(0);
        arr[n - 1] = live.value;
        return arr;
      }
    }
    return new Array(n).fill(0);
  }
  function buildSeries(keys, period) {
    const times = timeline(period), grain = PERIOD[period].grain;
    const series = keys.map((k, i) => {
      const rd = readingOf(k);
      return {
        key: k,
        name: rd.label,
        unit: rd.unit,
        color: `var(--vq-series-${i % 8 + 1})`,
        values: valuesFor(k, period, rd.unit)
      };
    });
    return {
      times,
      grain,
      series,
      period,
      tickLabels: times.map((t) => tickLabel(t, grain)),
      fullLabels: times.map((t) => fullLabel(t, grain)),
      ticker: times.map((t) => tickerParts(t, grain))
    };
  }
  function buildParts(key, period, names) {
    const reqKey = `${key}|${period}`;
    const reckPer = toReckonerPeriod(period);
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${key}|${reckPer}`];
    const rd = readingOf(key);
    if (live && live.ok && live.status !== "unavailable" && live.data) {
      const rawItems = Array.isArray(live.data.items) && live.data.items.length > 0 ? live.data.items : Array.isArray(live.data.slices) && live.data.slices.length > 0 ? live.data.slices : Array.isArray(live.data.rows) && live.data.rows.length > 0 ? live.data.rows : Array.isArray(live.data) && live.data.length > 0 ? live.data : null;
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const list = rawItems.map((item, i) => ({
          name: item.name || item.label || item.title || item.day || `Item ${i + 1}`,
          value: typeof item.value === "number" ? item.value : typeof item.margin === "number" ? item.margin : typeof item.total === "number" ? item.total : typeof item.amount === "number" ? item.amount : item.val !== void 0 ? Number(item.val) : item.sales !== void 0 ? Number(item.sales) : item.count !== void 0 ? Number(item.count) : 0,
          color: `var(--vq-series-${i % 8 + 1})`
        }));
        if (key !== "products.lowest_margin") {
          list.sort((a, b) => b.value - a.value);
        }
        const total = Number(live.data.total) || list.reduce((s, x) => s + (x.value || 0), 0);
        return { parts: list, total, unit: rd?.unit || "currency" };
      }
    }
    return { parts: [], total: 0, unit: rd?.unit || "currency" };
  }
  function readingOf(key) {
    const found = Array.isArray(READINGS) ? READINGS.find((r) => r.key === key) : null;
    if (found) return found;
    return {
      key: key || "unknown",
      label: (key || "Metric").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      shape: "SCALAR",
      unit: "currency",
      area: "General",
      module: "General",
      short: (key || "Metric").replace(/_/g, " "),
      extra: false,
      desc: "",
      rowNames: [],
      sliceNames: []
    };
  }
  function buildRoller(el, text) {
    const s = String(text);
    el.dataset.value = s;
    el.textContent = s;
  }
  function setRoller(el, text) {
    if (!el) return;
    const s = String(text);
    if (el.dataset.value === s) return;
    el.dataset.value = s;
    el.textContent = s;
    el.classList.remove("nf-pulse");
    void el.offsetWidth;
    el.classList.add("nf-pulse");
  }
  function rollerHTML(text, cls = "") {
    const tmp = document.createElement("span");
    tmp.className = "nf " + cls;
    buildRoller(tmp, text);
    return tmp.outerHTML;
  }
  function tickerHTML(parts) {
    const stack = (items, key) => `<span class="dt-win"><span class="dt-col" data-k="${key}">` + items.map((t) => `<i>${t}</i>`).join("") + `</span></span>`;
    const coarse = [], coarseIndex = [];
    parts.forEach((p) => {
      if (!coarse.length || coarse[coarse.length - 1] !== p.a) coarse.push(p.a);
      coarseIndex.push(coarse.length - 1);
    });
    return `<span class="dt" data-coarse="${coarseIndex.join(",")}">` + stack(coarse, "a") + stack(parts.map((p) => p.b), "b") + `</span>`;
  }
  const TICK_H = 20;
  function setTicker(el, index) {
    if (!el) return;
    const map = (el.dataset.coarse || "").split(",").map(Number);
    const a = el.querySelector('.dt-col[data-k="a"]'), b = el.querySelector('.dt-col[data-k="b"]');
    if (a) a.style.transform = `translateY(${-(map[index] || 0) * TICK_H}px)`;
    if (b) b.style.transform = `translateY(${-index * TICK_H}px)`;
  }
  let CHART_UID = 0;
  const VARIANTS = {
    area: [
      ["gradient", "Gradient fill"],
      ["solid", "Solid fill"],
      ["pattern", "Pattern fill"],
      ["step", "Stepped"],
      ["stacked", "Stacked"],
      ["nofill", "Line only"]
    ],
    line: [
      ["smooth", "Smooth"],
      ["linear", "Linear"],
      ["step", "Stepped"],
      ["dots", "With points"],
      ["dashtail", "Dashed tail"],
      ["thick", "Heavy stroke"]
    ],
    bar: [
      ["rounded", "Rounded"],
      ["square", "Square"],
      ["thin", "Thin columns"],
      ["grouped", "Grouped"],
      ["stacked", "Stacked"],
      ["pattern", "Pattern fill"]
    ],
    composed: [
      ["bar-trend", "Bar + trend line"],
      ["bar-line-area", "Bar + line + area"],
      ["bar-two-lines", "Bar + two lines"],
      ["stacked-line", "Stacked bars + line"],
      ["pattern", "Pattern fills"],
      ["thin-columns", "Thin columns"],
      ["area-bar", "Area + bar"]
    ],
    pl: [["split", "Split fill"], ["bars", "Diverging bars"], ["line", "Line only"]],
    live: [["pulse", "Pulsing head"], ["trail", "Fading trail"], ["dots", "With points"]],
    pie: [["solid", "Solid"], ["donut", "Donut"], ["exploded", "Exploded"], ["pattern", "Pattern"]],
    ring: [["concentric", "Concentric rings"], ["single", "Single ring"], ["thick", "Heavy stroke"]],
    sunburst: [["two-level", "Two level"], ["three-level", "Three level"]],
    gauge: [["arc", "Arc"], ["notch", "Notched"], ["full", "Full circle"]],
    funnel: [["centered", "Centered"], ["left", "Left aligned"], ["stepped", "Stepped"]],
    radar: [["filled", "Filled"], ["outline", "Outline"], ["dots", "With points"]],
    scatter: [["dots", "Dots"], ["bubble", "Bubble"], ["trend", "With trend line"]],
    heatmap: [["square", "Square cells"], ["rounded", "Rounded cells"], ["dots", "Dot scale"]],
    table: [["rows", "Rows"], ["bars", "With bars"], ["rank", "Ranked"]],
    feed: [["dots", "Dots"], ["bars", "With bars"]],
    stat: [["number", "Number only"], ["spark", "Sparkline"], ["delta", "Period comparison"], ["plain", "Min / avg / max"]],
    sparkline: [["area", "Area"], ["line", "Line"], ["bars", "Bars"]],
    status: [["chip", "Chip"], ["dot", "Dot"]],
    treemap: [["nested", "Nested"]],
    sankey: [["flow", "Flow"], ["thin", "Thin links"]],
    choropleth: [["grid", "Region grid"], ["list", "Ranked list"]]
  };
  const variantsOf = (c) => VARIANTS[c] || [["default", "Default"]];
  const defaultVariant = (c) => variantsOf(c)[0][0];
  const CARTESIAN = /* @__PURE__ */ new Set(["area", "line", "bar", "composed", "pl", "live"]);
  const RADIAL = /* @__PURE__ */ new Set(["pie", "ring", "sunburst"]);
  const P = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  function pathLinear(pts) {
    return "M" + pts.map((p) => P(p[0], p[1])).join(" L");
  }
  function pathStep(pts) {
    let d = "M" + P(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1][0] + pts[i][0]) / 2;
      d += ` L${P(mx, pts[i - 1][1])} L${P(mx, pts[i][1])} L${P(pts[i][0], pts[i][1])}`;
    }
    return d;
  }
  function pathSmooth(pts) {
    const n = pts.length;
    if (n < 2) return "";
    if (n === 2) return "M" + P(pts[0][0], pts[0][1]) + " L" + P(pts[1][0], pts[1][1]);
    const dx = [], dy = [], m = [];
    for (let i = 0; i < n - 1; i++) {
      const deltaX = pts[i + 1][0] - pts[i][0];
      const deltaY = pts[i + 1][1] - pts[i][1];
      dx.push(deltaX);
      dy.push(deltaY);
      m.push(deltaY / (deltaX || 1e-6));
    }
    const tangents = [m[0]];
    for (let i = 1; i < n - 1; i++) {
      if (m[i - 1] * m[i] <= 0) {
        tangents.push(0);
      } else {
        tangents.push((m[i - 1] + m[i]) / 2);
      }
    }
    tangents.push(m[m.length - 1]);
    for (let i = 0; i < n - 1; i++) {
      if (dy[i] === 0) {
        tangents[i] = 0;
        tangents[i + 1] = 0;
      } else {
        const a = tangents[i] / m[i];
        const b = tangents[i + 1] / m[i];
        const h = Math.hypot(a, b);
        if (h > 3) {
          const factor = 3 / h;
          tangents[i] = a * factor * m[i];
          tangents[i + 1] = b * factor * m[i];
        }
      }
    }
    let d = "M" + P(pts[0][0], pts[0][1]);
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      const dxThird = dx[i] / 3;
      const c1 = [p0[0] + dxThird, p0[1] + tangents[i] * dxThird];
      const c2 = [p1[0] - dxThird, p1[1] - tangents[i + 1] * dxThird];
      d += ` C${P(c1[0], c1[1])} ${P(c2[0], c2[1])} ${P(p1[0], p1[1])}`;
    }
    return d;
  }
  function curveFor(variant) {
    return variant === "step" ? pathStep : variant === "linear" ? pathLinear : pathSmooth;
  }
  function mountCartesian(host, card) {
    const { W, H } = hostDimensions(host, card);
    const isWideHero = (card.w || 0) >= 7 && card.style?.accent;
    const effectiveChart = isWideHero && (card.chart === "line" || card.chart === "trend" || card.chart === "sparkline") ? "area" : card.chart;
    const cardForChart = effectiveChart !== card.chart ? { ...card } : card;
    const keys = [cardForChart.key, ...cardForChart.extraKeys || []];
    const ds = buildSeries(keys, cardForChart.period);
    const uid = "ck" + ++CHART_UID;
    const variant = cardForChart.variant || defaultVariant(effectiveChart);
    const units = [...new Set(ds.series.map((s) => s.unit))];
    const rightUnit = units.length > 1 ? units[1] : null;
    const axisOf = (s) => rightUnit && s.unit === rightUnit ? "right" : "left";
    const m = { l: 48, r: rightUnit ? 48 : 12, t: 18, b: 30 };
    const pw = Math.max(20, W - m.l - m.r), ph = Math.max(20, H - m.t - m.b);
    const domainFor = (side) => {
      const vals = ds.series.filter((s) => axisOf(s) === side).flatMap((s) => s.values);
      if (!vals.length) return null;
      const stacked = /stacked/.test(variant) && ds.series.length > 1;
      const rawHi = stacked ? Math.max(...ds.times.map((_, i) => ds.series.reduce((a, s) => a + s.values[i], 0))) : Math.max(...vals);
      const rawLo = Math.min(...vals);
      const span = Math.max(1, rawHi - Math.min(0, rawLo));
      const hi = rawHi + span * 0.18;
      const lo = rawLo < 0 ? rawLo - span * 0.12 : 0;
      return niceTicks(lo, hi, 5);
    };
    const L = domainFor("left"), Rt = rightUnit ? domainFor("right") : null;
    const yOf = (v, side) => {
      const D = side === "right" ? Rt : L;
      return m.t + ph - (v - D.lo) / (D.hi - D.lo || 1) * ph;
    };
    const n = ds.times.length;
    const xOf = (i) => m.l + (n === 1 ? pw / 2 : i * pw / (n - 1));
    const bandW = pw / n;
    const yLabels = (D, side) => D.ticks.map((v) => `<text class="ck-lab" x="${side === "right" ? W - m.r + 8 : m.l - 8}" y="${(yOf(v, side) + 4).toFixed(1)}"
      text-anchor="${side === "right" ? "start" : "end"}">${fmtValue(v, side === "right" ? rightUnit : ds.series[0].unit, true)}</text>`).join("");
    const grid = L.ticks.map((v) => `<line class="ck-grid" x1="${m.l}" x2="${W - m.r}" y1="${yOf(v, "left").toFixed(1)}" y2="${yOf(v, "left").toFixed(1)}"/>`).join("");
    const maxXT = Math.max(2, Math.floor(pw / 66));
    const stepXT = Math.max(1, Math.ceil(n / maxXT));
    const keep = /* @__PURE__ */ new Set();
    for (let i = 0; i < n; i += stepXT) keep.add(i);
    keep.add(n - 1);
    const sorted = [...keep].sort((a, b) => a - b);
    if (sorted.length > 1 && n - 1 - sorted[sorted.length - 2] < stepXT) keep.delete(sorted[sorted.length - 2]);
    const xLabels = ds.tickLabels.map((t, i) => keep.has(i) ? `<text class="ck-lab" x="${xOf(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${t}</text>` : "").join("");
    const defs = [], marks = [];
    const stackTop = new Array(n).fill(0);
    const isStacked = /stacked/.test(variant) && ds.series.length > 1;
    const Z = { area: 0, bar: 1, line: 2 };
    const order = ds.series.map((s, si) => si).sort((a, b) => Z[roleFor(effectiveChart, variant, a)] - Z[roleFor(effectiveChart, variant, b)]);
    order.forEach((si) => {
      const s = ds.series[si];
      const side = axisOf(s);
      const pts = s.values.map((v, i) => [xOf(i), yOf(isStacked ? stackTop[i] += v : v, side)]);
      const role = roleFor(effectiveChart, variant, si);
      const gid = `${uid}-g${si}`;
      if (role === "bar") {
        const groupN = effectiveChart === "bar" && variant === "grouped" ? ds.series.length : 1;
        const bw = Math.min(22, Math.max(3, bandW * (variant === "thin" ? 0.22 : variant === "thin-columns" ? 0.3 : 0.55) / groupN));
        const rx = variant === "square" ? 0 : Math.min(4, bw / 2);
        const off = groupN > 1 ? (si - (groupN - 1) / 2) * bw : 0;
        const fill = variant === "pattern" && si === 0 ? `url(#${uid}-pat)` : s.color;
        if (variant === "pattern" && si === 0) defs.push(patternDef(`${uid}-pat`, s.color));
        marks.push(`<g class="ck-s ck-s--bar" data-i="${si}">` + s.values.map((v, i) => {
          const y0 = isStacked ? yOf(stackTop[i], side) : yOf(v, side);
          const base = yOf(Math.max(0, L.lo), side);
          const yTop = Math.min(y0, base), hgt = Math.max(1.5, Math.abs(base - y0));
          return `<rect class="ck-bar" data-x="${i}" x="${(xOf(i) - bw / 2 + off).toFixed(1)}" y="${yTop.toFixed(1)}"
          width="${bw.toFixed(1)}" height="${hgt.toFixed(1)}" rx="${rx}" fill="${fill}"/>`;
        }).join("") + `</g>`);
      } else if (role === "area") {
        const curve = curveFor(variant === "step" ? "step" : "smooth");
        const base = yOf(Math.max(0, L.lo), side);
        const solid = variant === "solid", pat = variant === "pattern";
        if (pat) defs.push(patternDef(`${uid}-pa${si}`, s.color));
        else defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${s.color}" stop-opacity="${solid ? 0.45 : 0.3}"/>
        <stop offset="100%" stop-color="${s.color}" stop-opacity="${solid ? 0.28 : 0}"/></linearGradient>`);
        const fill = pat ? `url(#${uid}-pa${si})` : `url(#${gid})`;
        const areaPath = variant === "nofill" ? "" : `<path class="ck-area" d="${curve(pts)} L${P(pts[n - 1][0], base)} L${P(pts[0][0], base)} Z" fill="${fill}"/>`;
        marks.push(`<g class="ck-s" data-i="${si}">${areaPath}
        <path class="ck-line" d="${curve(pts)}" stroke="${s.color}"/></g>`);
      } else {
        const curve = curveFor(variant === "step" ? "step" : variant === "linear" ? "linear" : "smooth");
        const dash = variant === "dashtail" ? ` stroke-dasharray="6 5"` : "";
        const sw = variant === "thick" ? 3.5 : 2.5;
        const dots2 = variant === "dots" || variant === "trend" ? pts.map((p) => `<circle class="ck-pt" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${s.color}"/>`).join("") : "";
        let body;
        if (card.chart === "live" && variant === "trail") {
          const seg = [];
          for (let k = 1; k < n; k++) {
            seg.push(`<path class="ck-line" d="${pathLinear([pts[k - 1], pts[k]])}" stroke="${s.color}"
            stroke-width="${sw}" opacity="${(0.08 + 0.92 * (k / (n - 1))).toFixed(2)}"/>`);
          }
          body = seg.join("");
        } else {
          body = `<path class="ck-line" d="${curve(pts)}" stroke="${s.color}" stroke-width="${sw}"${dash}/>`;
        }
        const head = card.chart === "live" && si === 0 ? `<circle class="${variant === "trail" ? "ck-cap" : "ck-pulse"}" cx="${pts[n - 1][0].toFixed(1)}"
             cy="${pts[n - 1][1].toFixed(1)}" r="4.5" fill="${s.color}"/>` : "";
        marks.push(`<g class="ck-s" data-i="${si}">${body}${dots2}${head}</g>`);
      }
    });
    if (card.chart === "composed" && variant === "bar-trend" && ds.series.length === 1) {
      const s0 = ds.series[0], side = axisOf(s0);
      const pts = s0.values.map((v, i) => [xOf(i), yOf(v, side)]);
      marks.push(`<g class="ck-s" data-i="${ds.series.length}">
      <path class="ck-line" d="${pathSmooth(pts)}" stroke="var(--vq-series-3)" stroke-width="2.5"/></g>`);
    }
    if (card.chart === "pl") {
      marks.length = 0;
      const s = ds.series[0], zero = yOf(0, "left");
      const pts = s.values.map((v, i) => [xOf(i), yOf(v, "left")]);
      const d = pathSmooth(pts);
      if (variant === "bars") {
        const bw = Math.max(2, bandW * 0.6);
        marks.push(`<g class="ck-s" data-i="0">` + s.values.map((v, i) => {
          const y = yOf(v, "left"), up = v >= 0;
          return `<rect class="ck-bar" data-x="${i}" x="${(xOf(i) - bw / 2).toFixed(1)}"
          y="${Math.min(y, zero).toFixed(1)}" width="${bw.toFixed(1)}"
          height="${Math.max(1.5, Math.abs(zero - y)).toFixed(1)}" rx="3"
          fill="var(--vq-div-${up ? "pos" : "neg"}-2)"/>`;
        }).join("") + `<line class="ck-zero" x1="${m.l}" x2="${W - m.r}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/></g>`);
      } else if (variant === "line") {
        marks.push(`<g class="ck-s" data-i="0">
        <line class="ck-zero" x1="${m.l}" x2="${W - m.r}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/>
        <path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)" stroke-width="2.5"/>
        ${s.values.map((v, i) => `<circle class="ck-pt" cx="${xOf(i).toFixed(1)}" cy="${yOf(v, "left").toFixed(1)}"
          r="3.5" fill="var(--vq-div-${v >= 0 ? "pos" : "neg"}-2)"/>`).join("")}</g>`);
      } else {
        defs.push(`<clipPath id="${uid}-up"><rect x="0" y="0" width="${W}" height="${zero.toFixed(1)}"/></clipPath>
               <clipPath id="${uid}-dn"><rect x="0" y="${zero.toFixed(1)}" width="${W}" height="${(H - zero).toFixed(1)}"/></clipPath>`);
        const areaD = `${d} L${P(pts[n - 1][0], zero)} L${P(pts[0][0], zero)} Z`;
        marks.push(`<g class="ck-s" data-i="0">
      <path d="${areaD}" fill="var(--vq-div-pos-1)" opacity=".5" clip-path="url(#${uid}-up)"/>
      <path d="${areaD}" fill="var(--vq-div-neg-1)" opacity=".5" clip-path="url(#${uid}-dn)"/>
      <line class="ck-zero" x1="${m.l}" x2="${W - m.r}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/>
      <path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)"/></g>`);
      }
    }
    const dots = ds.series.map((s, si) => `<circle class="ck-hd" data-i="${si}" r="4.5" fill="var(--vq-surface)" stroke="${s.color}" stroke-width="2.5"/>`).join("");
    host.innerHTML = `
    <svg class="ck" width="${W}" height="${H}" role="img">
      <defs>${defs.join("")}</defs>
      <g class="ck-grids">${grid}</g>
      <g class="ck-axis">${yLabels(L, "left")}${Rt ? yLabels(Rt, "right") : ""}${xLabels}</g>
      <g class="ck-plot" style="clip-path:inset(0 100% 0 0)">${marks.join("")}</g>
      <g class="ck-hover" style="opacity:0">
        <line class="ck-cross" y1="${m.t}" y2="${m.t + ph}"/>
        ${dots}
      </g>
      <rect class="ck-cap" x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="transparent"/>
    </svg>
    <div class="ck-tip" hidden></div>
    <div class="ck-ticker" hidden>${tickerHTML(ds.ticker)}</div>`;
    requestAnimationFrame(() => {
      const plot = host.querySelector(".ck-plot");
      if (plot) plot.style.clipPath = "inset(0 0% 0 0)";
    });
    wireCartesian(host, card, ds, { xOf, yOf, axisOf, m, pw, ph, W, H, bandW, n });
  }
  function roleFor(chart, variant, si) {
    if (chart === "bar") return "bar";
    if (chart === "area") return si === 0 ? "area" : variant === "stacked" ? "area" : "line";
    if (chart === "line" || chart === "live" || chart === "pl") return "line";
    if (chart === "composed") {
      if (variant === "bar-trend") return si === 0 ? "bar" : "line";
      if (variant === "bar-two-lines") return si === 0 ? "bar" : "line";
      if (variant === "area-bar") return si === 0 ? "area" : "bar";
      if (variant === "stacked-line") return si < 2 ? "bar" : "line";
      return si === 0 ? "bar" : si === 1 ? "area" : "line";
    }
    return "line";
  }
  function patternDef(id, color) {
    return `<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="7" height="7" fill="${color}" opacity=".22"/>
    <line x1="0" y1="0" x2="0" y2="7" stroke="${color}" stroke-width="3"/></pattern>`;
  }
  function wireCartesian(host, card, ds, g) {
    const svg = host.querySelector(".ck");
    const cap = host.querySelector(".ck-cap");
    const hover = host.querySelector(".ck-hover");
    const cross = host.querySelector(".ck-cross");
    const tip = host.querySelector(".ck-tip");
    const tick = host.querySelector(".ck-ticker");
    const tickEl = host.querySelector(".dt");
    const plot = host.querySelector(".ck-plot");
    const head = host.closest(".vqc")?.querySelector(".vqc-value[data-full] .nf");
    const headSub = host.closest(".vqc")?.querySelector(".vqc-when");
    const hds = [...host.querySelectorAll(".ck-hd")];
    const bars = [...host.querySelectorAll(".ck-bar")];
    let active = -1;
    const headCompact = () => head?.closest(".vqc-value")?.dataset.mode === "compact";
    const restText = () => {
      const hl = headlineOf(card);
      if (hl && hl.value && hl.value !== "—") {
        return { v: headCompact() ? hl.valueCompact : hl.value, when: hl.when || rangeLabel(ds) };
      }
      const s0 = ds.series[0];
      const nonZeroVals = (s0?.values || []).filter((v) => v !== 0 && v !== null && !isNaN(v));
      const fallbackVal = nonZeroVals.length ? nonZeroVals[nonZeroVals.length - 1] : s0?.values?.[s0.values.length - 1] ?? 0;
      return { v: unitPrefix(s0?.unit || "") + fmtValue(fallbackVal, s0?.unit, headCompact()), when: rangeLabel(ds) };
    };
    function show(i) {
      if (i === active) return;
      active = i;
      hover.style.opacity = "1";
      plot.classList.add("is-hovering");
      const x = g.xOf(i);
      cross.style.transform = `translateX(${x.toFixed(1)}px)`;
      ds.series.forEach((s, si) => {
        const d = hds[si];
        if (!d) return;
        d.style.transform = `translate(${x.toFixed(1)}px, ${g.yOf(s.values[i], g.axisOf(s)).toFixed(1)}px)`;
      });
      bars.forEach((b) => b.classList.toggle("is-on", +b.dataset.x === i));
      tip.hidden = false;
      tip.innerHTML = `<p class="ck-tip-h">${ds.fullLabels[i]}</p>` + ds.series.map((s) => `<span class="ck-tip-r"><span class="ck-tip-d" style="background:${s.color}"></span>
          <span class="ck-tip-n">${s.name}</span>
          <b class="ck-tip-v">${unitPrefix(s.unit)}${fmtValue(s.values[i], s.unit)}</b></span>`).join("");
      const tw = tip.offsetWidth || 150;
      tip.style.left = Math.max(4, Math.min(g.W - tw - 4, x - tw / 2)) + "px";
      tick.hidden = false;
      tick.style.left = x.toFixed(1) + "px";
      setTicker(tickEl, i);
      if (head) setRoller(head, unitPrefix(ds.series[0].unit) + fmtValue(ds.series[0].values[i], ds.series[0].unit, headCompact()));
      if (headSub) headSub.textContent = ds.fullLabels[i];
    }
    function clear() {
      active = -1;
      hover.style.opacity = "0";
      plot.classList.remove("is-hovering");
      bars.forEach((b) => b.classList.remove("is-on"));
      tip.hidden = true;
      tick.hidden = true;
      const r = restText();
      if (head) setRoller(head, r.v);
      if (headSub) headSub.textContent = r.when;
    }
    const idxFrom = (ev) => {
      const r = svg.getBoundingClientRect();
      const x = ev.clientX - r.left;
      return Math.max(0, Math.min(g.n - 1, Math.round((x - g.m.l) / (g.pw / Math.max(1, g.n - 1)))));
    };
    cap.addEventListener("mousemove", (e) => show(idxFrom(e)));
    cap.addEventListener("mouseleave", clear);
    cap.addEventListener("touchmove", (e) => {
      e.preventDefault();
      show(idxFrom(e.touches[0]));
    }, { passive: false });
    cap.addEventListener("touchend", clear);
  }
  function rangeLabel(ds) {
    const a = ds.times[0], b = ds.times[ds.times.length - 1];
    const f = (d) => tickLabel(d, ds.grain);
    return ds.period === "Today" ? `Today · ${f(a)}–${f(b)}` : `${ds.period} · ${f(a)} – ${f(b)}`;
  }
  function mountRadial(host, card) {
    const { W: HW, H: HH } = hostDimensions(host, card);
    const pd0 = buildParts(card.key, card.period, readingOf(card.key)?.sliceNames);
    const pd = pd0;
    const numParts = pd.parts && pd.parts.length ? pd.parts.length : 1;
    const LEG_ROW = 24;
    const totalLegH = numParts * LEG_ROW;
    const maxDial = Math.max(64, HH - totalLegH - 10);
    const size = Math.max(68, Math.min(HW * 0.48, maxDial, 105));
    const variant = card.variant || defaultVariant(card.chart);
    const cx = size / 2, cy = size / 2, R = size / 2 - 3;
    const inner = card.chart === "pie" ? variant === "donut" ? R * 0.58 : 0 : R * 0.56;
    let arcs = "", pdefs = "";
    if (card.chart === "ring" && variant === "thick") {
      const frac = (pd.parts[0]?.value || 0) / (pd.total || 1);
      arcs = `<path class="ck-track" d="${arcPath(cx, cy, R * 0.44, R, 0, 1)}" fill="var(--vq-chart-track-data)"/><path class="ck-seg" data-i="0" d="${arcPath(cx, cy, R * 0.44, R, 0, frac)}" fill="${pd.parts[0]?.color || "var(--vq-series-1)"}"/>`;
    } else if (card.chart === "sunburst" && variant === "three-level") {
      const band = (R - R * 0.3) / 3;
      for (let lvl = 0; lvl < 3; lvl++) {
        const r1 = R - lvl * band, r0 = r1 - band * 0.86;
        const set = pd.parts.slice(0, 4 - lvl);
        const tot = set.reduce((a2, b) => a2 + (b?.value || 0), 0) || 1;
        let a = 0;
        set.forEach((p, i) => {
          const f = (p?.value || 0) / tot;
          arcs += `<path class="ck-seg" data-i="${i}" d="${arcPath(cx, cy, r0, r1, a, a + f)}" fill="${p?.color || "var(--vq-series-1)"}"
                  stroke="var(--vq-chart-surface)" stroke-width="1.5" opacity="${(1 - lvl * 0.18).toFixed(2)}"/>`;
          a += f;
        });
      }
    } else if (card.chart === "ring" && variant !== "single") {
      const band = (R - inner) / Math.max(1, pd.parts.length);
      pd.parts.forEach((p, i) => {
        const r1 = R - i * band, r0 = r1 - band * 0.72;
        const frac = (p?.value || 0) / (pd.parts[0]?.value || 1);
        arcs += `<path class="ck-track" d="${arcPath(cx, cy, r0, r1, 0, 1)}" fill="var(--vq-chart-track-data)"/><path class="ck-seg" data-i="${i}" d="${arcPath(cx, cy, r0, r1, 0, Math.min(1, frac))}" fill="${p?.color || "var(--vq-series-1)"}"/>`;
      });
    } else {
      let a = 0;
      pd.parts.forEach((p, i) => {
        const f = (p?.value || 0) / (pd.total || 1);
        const pop = variant === "exploded" ? 4 : 0;
        let fill = p?.color || "var(--vq-series-1)";
        if (variant === "pattern") {
          const pid = `${"pt" + ++CHART_UID}`;
          pdefs += patternDef(pid, p.color);
          fill = `url(#${pid})`;
        }
        arcs += `<path class="ck-seg" data-i="${i}" d="${arcPath(cx, cy, inner, R - (i % 2 ? pop : 0), a, a + f)}" fill="${fill}"
                stroke="var(--vq-chart-surface)" stroke-width="2"/>`;
        a += f;
      });
    }
    const centreV = unitPrefix(pd.unit) + fmtValue(pd.total, pd.unit, true);
    const useRows = pd.parts.slice(0, Math.min(6, numParts));
    const moreN = pd.parts.length - useRows.length;
    host.innerHTML = `
    <div class="ck-radial">
      <div class="ck-dial" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}" class="ck-rsvg"><defs>${pdefs}</defs>${arcs}</svg>
        ${inner > 0 || card.chart === "ring" ? `<span class="ck-centre">
          <span class="ck-centre-v">${rollerHTML(centreV)}</span>
          <span class="ck-centre-k">${centreLabel(card)}</span></span>` : ""}
      </div>
      <div class="ck-leg">${useRows.map((p, i) => `
        <button class="ck-leg-r" data-i="${i}" title="${esc(p.name)}">
          <span class="ck-leg-d" style="background:${p.color}"></span>
          <span class="ck-leg-n">${esc(p.name)}</span>
          <span class="ck-leg-v">${unitPrefix(pd.unit)}${fmtValue(p.value, pd.unit, true)}</span>
          <span class="ck-leg-p">${Math.round(p.value / (pd.total || 1) * 100)}%</span>
        </button>`).join("")}${moreN > 0 ? `
        <span class="ck-leg-more">+ ${moreN} more</span>` : ""}</div>
    </div>`;
    const dial = host.querySelector(".ck-dial");
    const nf = host.querySelector(".ck-centre-v .nf");
    const lab = host.querySelector(".ck-centre-k");
    const segs = [...host.querySelectorAll(".ck-seg")];
    host.querySelectorAll(".ck-leg-r").forEach((btn) => {
      const i = +btn.dataset.i;
      const on = () => {
        dial.classList.add("is-focus");
        segs.forEach((s) => s.classList.toggle("is-dim", +s.dataset.i !== i));
        host.querySelectorAll(".ck-leg-r").forEach((r) => r.classList.toggle("is-dim", +r.dataset.i !== i));
        btn.classList.add("is-on");
        setRoller(nf, unitPrefix(pd.unit) + fmtValue(pd.parts[i].value, pd.unit, true));
        if (lab) lab.textContent = pd.parts[i].name;
      };
      const off = () => {
        dial.classList.remove("is-focus");
        segs.forEach((s) => s.classList.remove("is-dim"));
        host.querySelectorAll(".ck-leg-r").forEach((r) => r.classList.remove("is-dim", "is-on"));
        setRoller(nf, centreV);
        if (lab) lab.textContent = centreLabel(card);
      };
      btn.addEventListener("mouseenter", on);
      btn.addEventListener("focus", on);
      btn.addEventListener("mouseleave", off);
      btn.addEventListener("blur", off);
    });
    segs.forEach((s) => {
      s.addEventListener("mouseenter", () => host.querySelector(`.ck-leg-r[data-i="${s.dataset.i}"]`)?.dispatchEvent(new Event("mouseenter")));
      s.addEventListener("mouseleave", () => host.querySelector(`.ck-leg-r[data-i="${s.dataset.i}"]`)?.dispatchEvent(new Event("mouseleave")));
    });
  }
  function centreLabel(card) {
    const rd = readingOf(card.key);
    return rd.unit === "currency" ? "Total" : rd.unit === "percent" ? "Share" : "All";
  }
  function arcPath(cx, cy, r0, r1, f0, f1) {
    const TAU = Math.PI * 2, a0 = -Math.PI / 2 + f0 * TAU, a1 = -Math.PI / 2 + f1 * TAU;
    const big = f1 - f0 > 0.5 ? 1 : 0;
    if (f1 - f0 >= 0.9999) {
      return `M${P(cx - r1, cy)}A${r1} ${r1} 0 1 1 ${P(cx + r1, cy)}A${r1} ${r1} 0 1 1 ${P(cx - r1, cy)}Z` + (r0 > 0 ? `M${P(cx - r0, cy)}A${r0} ${r0} 0 1 0 ${P(cx + r0, cy)}A${r0} ${r0} 0 1 0 ${P(cx - r0, cy)}Z` : "");
    }
    const x = (r, a) => cx + r * Math.cos(a), y = (r, a) => cy + r * Math.sin(a);
    return `M${P(x(r1, a0), y(r1, a0))}A${r1} ${r1} 0 ${big} 1 ${P(x(r1, a1), y(r1, a1))}L${P(x(r0, a1), y(r0, a1))}A${r0} ${r0} 0 ${big} 0 ${P(x(r0, a0), y(r0, a0))}Z`;
  }
  function mountGauge(host, card) {
    const { W, H } = hostDimensions(host, card);
    const S = Math.min(W, H);
    const size = Math.min(Math.max(60, S - 12), 250);
    const live = liveReading(card);
    const liveVal = typeof live?.data?.value === "number" ? live.data.value : typeof live?.data === "number" ? live.data : null;
    const rd = readingOf(card.key);
    const vals = valuesFor(card.key, card.period, rd.unit);
    const v = liveVal !== null ? liveVal : vals.length ? vals[vals.length - 1] : 0;
    const max = rd.unit === "percent" ? 100 : Math.ceil(Math.max(...vals.length ? vals : [v, 1]) * 1.25);
    const frac = Math.max(0, Math.min(1, max > 0 ? v / max : 0));
    const variant = card.variant || "arc";
    const cx = size / 2, cy = size / 2, R = size / 2 - 6, w = Math.max(9, size * 0.075);
    const span = variant === "full" ? 1 : 0.75;
    const rot = variant === "full" ? 0 : 0.625;
    const arc = (f, cls, col) => `<path class="${cls}" d="${arcPath(cx, cy, R - w, R, rot, rot + span * f)}" fill="${col}"/>`;
    let notches = "";
    if (variant === "notch") {
      notches = Array.from({ length: 28 }, (_, i) => {
        const f = i / 27, on = f <= frac;
        const a = (rot + span * f) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + (R - w) * Math.cos(a), y1 = cy + (R - w) * Math.sin(a);
        const x2 = cx + R * Math.cos(a), y2 = cy + R * Math.sin(a);
        return `<line class="ck-notch${on ? " is-on" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}"
        x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="--d:${i * 22}ms"/>`;
      }).join("");
    }
    host.innerHTML = `<div class="ck-radial">
    <div class="ck-dial" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" class="ck-rsvg">
        ${variant === "notch" ? notches : arc(1, "ck-track", "var(--vq-chart-track-data)") + arc(frac, "ck-seg", "var(--vq-series-1-ink)")}
      </svg>
      <span class="ck-centre">
        <span class="ck-centre-v">${rollerHTML(unitPrefix(rd.unit) + fmtValue(v, rd.unit, true))}</span>
        <span class="ck-centre-k">of ${fmtValue(max, rd.unit, true)}</span></span>
    </div></div>`;
  }
  function mountFunnel(host, card) {
    const H = Math.max(90, host.clientHeight);
    const LAB = 150;
    const W = Math.max(80, host.clientWidth - LAB - 16);
    const pd = buildParts(card.key, card.period, readingOf(card.key)?.rowNames);
    const rows = pd.parts.slice(0, 5), mx = rows[0]?.value || 1, rh = H / Math.max(1, rows.length);
    const variant = card.variant || "centered";
    const shapes = rows.map((p, i) => {
      const bw = (p?.value || 0) / mx * W * 0.94;
      const x = variant === "left" ? 0 : (W - bw) / 2;
      return `<rect class="ck-fn" data-i="${i}" x="${x.toFixed(1)}" y="${(i * rh + 3).toFixed(1)}"
      width="${bw.toFixed(1)}" height="${(rh - 6).toFixed(1)}" rx="${variant === "stepped" ? 2 : 6}" fill="${p?.color || "var(--vq-series-1)"}" style="--d:${i * 70}ms"/>`;
    }).join("");
    host.innerHTML = `<div class="ck-fnw">
    <svg width="${W}" height="${H}" class="ck-fsvg" viewBox="0 0 ${W} ${H}">${shapes}</svg>
    <div class="ck-fnl" style="width:${LAB}px">${rows.map((p, i) => `<div class="ck-fnr" data-i="${i}">
      <span>${p.name}</span><b>${unitPrefix(pd.unit)}${fmtValue(p?.value || 0, pd.unit, true)}</b>
      <em>${Math.round((p?.value || 0) / mx * 100)}%</em></div>`).join("")}</div></div>`;
    linkRows(host, ".ck-fn", ".ck-fnr");
  }
  function mountRadar(host, card) {
    const { W, H } = hostDimensions(host, card);
    const S = Math.max(120, Math.min(W - 20, H - 20));
    const pd = buildParts(card.key, card.period, (readingOf(card.key)?.rowNames || []).slice(0, 6));
    const ax = pd.parts.slice(0, 6), n = Math.max(1, ax.length), mx = Math.max(1, ...ax.map((p) => p?.value || 0));
    const cx = S / 2, cy = S / 2, R = S / 2 - 38;
    const variant = card.variant || "filled";
    const pt = (i, f) => {
      const a = -Math.PI / 2 + 2 * Math.PI * i / n;
      return [cx + R * f * Math.cos(a), cy + R * f * Math.sin(a)];
    };
    const rings = [0.25, 0.5, 0.75, 1].map((k) => `<polygon class="ck-rgrid" points="${ax.map((_, i) => pt(i, k).map((v) => v.toFixed(1)).join(",")).join(" ")}"/>`).join("");
    const spokes = ax.map((_, i) => {
      const [x, y] = pt(i, 1);
      return `<line class="ck-rgrid" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    }).join("");
    const poly = ax.map((p, i) => pt(i, (p?.value || 0) / mx).map((v) => v.toFixed(1)).join(",")).join(" ");
    const dots = variant === "dots" ? ax.map((p, i) => {
      const [x, y] = pt(i, (p?.value || 0) / mx);
      return `<circle class="ck-pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--vq-series-1-ink)"/>`;
    }).join("") : "";
    const labs = ax.map((p, i) => {
      const [x, y] = pt(i, 1.17);
      return `<text class="ck-lab" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${p.name.slice(0, 10)}</text>`;
    }).join("");
    host.innerHTML = `<div class="ck-radial"><svg width="${S}" height="${S}" class="ck-rsvg">
    ${rings}${spokes}
    <polygon class="ck-rpoly" points="${poly}" fill="${variant === "outline" ? "none" : "var(--vq-series-1-ink)"}"
      fill-opacity="${variant === "outline" ? 0 : 0.22}" stroke="var(--vq-series-1-ink)" stroke-width="2"/>
    ${dots}${labs}</svg></div>`;
  }
  function mountScatter(host, card) {
    if (renderDataState(host, card)) return;
    const { W, H } = hostDimensions(host, card);
    const m = { l: 44, r: 12, t: 10, b: 26 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
    const rd = readingOf(card.key);
    const live = liveReading(card);
    const sourceRows = live?.data?.rows || live?.data?.series || [];
    const pts = sourceRows.map((point, index) => ({
      x: Number(point.x ?? index) / Math.max(1, sourceRows.length - 1),
      y: Number(point.y ?? point.value ?? 0),
      w: Number(point.w ?? point.weight ?? 4)
    }));
    if (!pts.length) {
      host.innerHTML = `<div class="ck-state is-empty" role="status">No data in this period.</div>`;
      return;
    }
    const maxY = Math.max(...pts.map((point) => Math.abs(point.y)), 1);
    pts.forEach((point) => {
      point.y = Math.max(0, Math.min(1, point.y / maxY));
    });
    const xs = niceTicks(0, 100, 5), ys = niceTicks(0, 100, 5);
    const grid = ys.ticks.map((v) => {
      const y = m.t + ph - v / 100 * ph;
      return `<line class="ck-grid" x1="${m.l}" x2="${W - m.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>
            <text class="ck-lab" x="${m.l - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end">${v}</text>`;
    }).join("");
    const xlab = xs.ticks.map((v) => {
      const x = m.l + v / 100 * pw;
      return `<text class="ck-lab" x="${x.toFixed(1)}" y="${H - 8}" text-anchor="middle">${v}</text>`;
    }).join("");
    const variant = card.variant || "dots";
    const dots = pts.map((p, i) => `<circle class="ck-sc" data-i="${i}" cx="${(m.l + p.x * pw).toFixed(1)}"
    cy="${(m.t + ph - p.y * ph).toFixed(1)}" r="${variant === "bubble" ? p.w.toFixed(1) : 4.5}"
    fill="var(--vq-series-1-ink)" fill-opacity=".55" style="--d:${i * 14}ms"><title>${rd.label}</title></circle>`).join("");
    const trend = variant === "trend" ? `<line class="ck-trend" x1="${m.l}" y1="${(m.t + ph * 0.78).toFixed(1)}" x2="${W - m.r}" y2="${(m.t + ph * 0.2).toFixed(1)}"/>` : "";
    host.innerHTML = `<svg class="ck" width="${W}" height="${H}">${grid}${xlab}${trend}
    <g class="ck-plot" style="clip-path:inset(0 100% 0 0)">${dots}</g></svg>`;
    requestAnimationFrame(() => {
      const p = host.querySelector(".ck-plot");
      if (p) p.style.clipPath = "inset(0 0% 0 0)";
    });
  }
  function mountHeatmap(host, card) {
    const { W: HW, H: HH } = hostDimensions(host, card);
    const rd = readingOf(card.key);
    const reqKey = `${card.key}|${card.period}`;
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
    const variant = card.variant || "square";
    if (live && live.ok && live.data && Array.isArray(live.data.rows) && live.data.rows.length > 0) {
      const dayShorts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const hours = [9, 12, 15, 18];
      const hourLabels = ["09h", "12h", "15h", "18h"];
      const matrix = hourLabels.map((hl, hIdx) => {
        const targetHour = hours[hIdx];
        return dayShorts.map((ds, dIdx) => {
          const fullDay = fullDays[dIdx];
          const match = live.data.rows.find((r) => (r.day === fullDay || r.day === ds) && (Math.abs(r.hour - targetHour) <= 1 || r.hour === targetHour));
          return match ? match.sales || match.count || 0 : 0;
        });
      });
      const mx = Math.max(1, ...matrix.flat());
      const cells = matrix.flatMap((row, ri) => row.map((v, ci) => {
        const lvl = Math.min(4, Math.floor(v / mx * 5));
        const d = (ri * dayShorts.length + ci) * 11;
        if (variant === "dots") return `<span class="ck-hd2" style="--d:${d}ms"><i style="transform:scale(${(0.3 + v / mx * 0.7).toFixed(2)});background:var(--vq-seq-${lvl + 1})"></i>
        <span class="ck-hint">${hourLabels[ri]} · ${dayShorts[ci]} — ${fmtValue(v, rd.unit)}</span></span>`;
        return `<span class="ck-hc ${variant === "rounded" ? "is-round" : ""}" style="background:var(--vq-seq-${lvl + 1});--d:${d}ms">
        <span class="ck-hint">${hourLabels[ri]} · ${dayShorts[ci]} — ${fmtValue(v, rd.unit)}</span></span>`;
      })).join("");
      host.innerHTML = `<div class="ck-hm" style="--c:${dayShorts.length}">
      <div class="ck-hm-x"><span></span>${dayShorts.map((c) => `<b>${c}</b>`).join("")}</div>
      <div class="ck-hm-b"><div class="ck-hm-y">${hourLabels.map((x) => `<b>${x}</b>`).join("")}</div>
      <div class="ck-hm-g">${cells}</div></div>
      <div class="ck-hm-l"><span>Low</span>${[1, 2, 3, 4, 5].map((i) => `<i style="background:var(--vq-seq-${i})"></i>`).join("")}<span>High</span></div></div>`;
      return;
    }
    renderDataState(host, card);
  }
  function mountTable(host, card) {
    const { H } = hostDimensions(host, card);
    const pd = buildParts(card.key, card.period, readingOf(card.key)?.rowNames);
    const capacity = Math.max(3, Math.floor((H - 4) / 38));
    const rows = pd.parts.slice(0, Math.min(8, capacity)), mx = rows[0]?.value || 1;
    card.variant || "rows";
    pd.unit === "percent" || pd.unit === "pct" || rows.some((r) => Math.abs(r?.value || 0) <= 100 && String(r?.name || "").length > 0);
    const color = (i) => `var(--vq-series-${i % 6 + 1})`;
    host.innerHTML = `<div class="ck-tb ck-tb--rank">${rows.map((p, i) => {
      const pct = ((p?.value || 0) / mx * 100).toFixed(0);
      const valTxt = unitPrefix(pd.unit) + fmtValue(p?.value || 0, pd.unit, true);
      return `
    <div class="ck-tr" style="--d:${i * 40}ms;--pct:${pct}%;--clr:${color(i)}">
      <span class="ck-rank-n">${i + 1}</span>
      <span class="ck-tn" title="${esc(p.name)}">${esc(p.name)}</span>
      <span class="ck-tpct">${valTxt}</span>
    </div>`;
    }).join("")}</div>`;
  }
  function mountFeed(host, card) {
    const { H } = hostDimensions(host, card);
    const reqKey = `${card.key}|${card.period}`;
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
    const capacity = Math.max(2, Math.floor((H - 4) / 38));
    const bars = card.variant === "bars";
    if (live && live.ok && live.data && Array.isArray(live.data.items) && live.data.items.length > 0) {
      const items = live.data.items.slice(0, Math.min(6, capacity));
      host.innerHTML = `<div class="ck-tb ${bars ? "is-bars" : ""}">${items.map((item, i) => `
      <div class="ck-tr" style="--d:${i * 45}ms">
        ${bars ? "" : `<span class="ck-fd" style="background:var(--vq-series-${i % 8 + 1})"></span>`}
        <span class="ck-tn">${esc(item.subtitle ? `${item.title} (${item.subtitle})` : item.title)}</span>
        <span class="ck-tt">${esc(item.at || "")}</span>
        <b class="ck-tv">${esc(item.value || "")}</b>
      </div>`).join("")}</div>`;
      return;
    }
    const pd = buildParts(card.key, card.period, readingOf(card.key)?.rowNames);
    const times = timeline(card.period).slice(-6).reverse();
    const rows = pd.parts.slice(0, Math.min(6, capacity)), mx = rows[0]?.value || 1;
    host.innerHTML = `<div class="ck-tb ${bars ? "is-bars" : ""}">${rows.map((p, i) => `
    <div class="ck-tr" style="--d:${i * 45}ms">
      ${bars ? "" : `<span class="ck-fd" style="background:${p?.color || "var(--vq-series-1)"}"></span>`}
      <span class="ck-tn">${p.name}</span>
      ${bars ? `<span class="ck-tbar"><i style="width:${((p?.value || 0) / mx * 100).toFixed(0)}%;background:${p?.color || "var(--vq-series-1)"}"></i></span>` : `<span class="ck-tt">${fullLabel(times[i] || times[0], PERIOD[card.period].grain)}</span>`}
      <b class="ck-tv">${unitPrefix(pd.unit)}${fmtValue(p?.value || 0, pd.unit, true)}</b>
    </div>`).join("")}</div>`;
  }
  function mountSankey(host, card) {
    const { W, H } = hostDimensions(host, card);
    const pd = buildParts(card.key, card.period, readingOf(card.key)?.sliceNames);
    const parts = pd.parts.slice(0, 4), tot = parts.reduce((a, b) => a + (b?.value || 0), 0) || 1;
    const thin = card.variant === "thin";
    let y = 6, links = "", nodes = "";
    parts.forEach((p, i) => {
      const h = (p?.value || 0) / tot * (H - 12) * (thin ? 0.7 : 1);
      nodes += `<rect x="20" y="${y.toFixed(1)}" width="11" height="${h.toFixed(1)}" rx="3" fill="${p?.color || "var(--vq-series-1)"}"/>`;
      const ty = 10 + i * ((H - 20) / Math.max(1, parts.length));
      links += `<path class="ck-lk" style="--d:${i * 90}ms" d="M31 ${y.toFixed(1)} C${W * 0.45} ${y.toFixed(1)} ${W * 0.55} ${ty.toFixed(1)} ${(W - 32).toFixed(1)} ${ty.toFixed(1)}
      L${(W - 32).toFixed(1)} ${(ty + h * 0.72).toFixed(1)} C${W * 0.55} ${(ty + h * 0.72).toFixed(1)} ${W * 0.45} ${(y + h).toFixed(1)} 31 ${(y + h).toFixed(1)} Z"
      fill="${p?.color || "var(--vq-series-1)"}" fill-opacity=".3"><title>${p.name} — ${fmtValue(p?.value || 0, pd.unit, true)}</title></path>`;
      y += h + 5;
    });
    nodes += `<rect x="${W - 31}" y="6" width="11" height="${H - 12}" rx="3" fill="var(--vq-chart-track-data)"/>`;
    host.innerHTML = `<svg class="ck" width="${W}" height="${H}">${links}${nodes}</svg>`;
  }
  function mountChoropleth(host, card) {
    if (renderDataState(host, card)) return;
    const rd = readingOf(card.key);
    const live = liveReading(card);
    const sourceRows = live?.data?.rows || live?.data?.regions || [];
    const regs = sourceRows.map((row) => ({
      n: row.name ?? row.region ?? row.label ?? "—",
      v: Number(row.value ?? row.total ?? row.count ?? 0)
    }));
    if (!regs.length) {
      host.innerHTML = `<div class="ck-state is-empty" role="status">No regional data in this period.</div>`;
      return;
    }
    regs.sort((a, b) => b.v - a.v);
    const mx = regs[0].v;
    if (card.variant === "list") {
      const capacity = Math.max(2, Math.floor((host.clientHeight - 4) / 38));
      host.innerHTML = `<div class="ck-tb">${regs.slice(0, capacity).map((g, i) => `<div class="ck-tr" style="--d:${i * 45}ms">
      <span class="ck-rank">${i + 1}</span><span class="ck-tn">${g.n}</span>
      <span class="ck-tbar"><i style="width:${(g.v / mx * 100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4, Math.floor(g.v / mx * 5)) + 1})"></i></span>
      <b class="ck-tv">${unitPrefix(rd.unit)}${fmtValue(g.v, rd.unit, true)}</b></div>`).join("")}</div>`;
      return;
    }
    host.innerHTML = `<div class="ck-geo">${regs.map((g, i) => `
    <div class="ck-geo-c" style="--d:${i * 55}ms">
      <i class="ck-geo-f" style="width:${(g.v / mx * 100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4, Math.floor(g.v / mx * 5)) + 1})"></i>
      <span>${g.n}</span><b>${unitPrefix(rd.unit)}${fmtValue(g.v, rd.unit, true)}</b></div>`).join("")}</div>`;
  }
  function mountSparkline(host, card) {
    const { W, H } = hostDimensions(host, card);
    const rd = readingOf(card.key);
    const vals = valuesFor(card.key, card.period, rd.unit);
    const times = timeline(card.period), grain = PERIOD[card.period].grain;
    const rawMn = Math.min(...vals), rawMx = Math.max(...vals);
    const span = Math.max(1, rawMx - rawMn);
    const mn = rawMn < 0 ? rawMn - span * 0.08 : Math.max(0, rawMn - span * 0.06);
    const mx = rawMx + span * 0.24;
    const rg = mx - mn || 1;
    const n = vals.length;
    const padTop = 14, padBottom = 6, padX = 6;
    const availH = Math.max(10, H - padTop - padBottom);
    const pts = vals.map((v, i) => [
      i * (W - padX * 2) / Math.max(1, n - 1) + padX,
      H - padBottom - (v - mn) / rg * availH
    ]);
    const variant = card.variant || "area";
    const uid = "sp" + ++CHART_UID;
    let body;
    if (variant === "bars") {
      const bw = W / n * 0.62;
      body = vals.map((v, i) => `<rect class="ck-bar" data-x="${i}" x="${(pts[i][0] - bw / 2).toFixed(1)}"
      y="${pts[i][1].toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, H - padBottom - pts[i][1]).toFixed(1)}" rx="2"
      fill="var(--vq-series-1-ink)"/>`).join("");
    } else {
      const d = pathSmooth(pts);
      body = (variant === "area" ? `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0%" stop-color="var(--vq-series-1-ink)" stop-opacity=".3"/>
         <stop offset="100%" stop-color="var(--vq-series-1-ink)" stop-opacity="0"/></linearGradient></defs>
         <path d="${d} L${P(pts[n - 1][0], H)} L${P(pts[0][0], H)} Z" fill="url(#${uid})"/>` : "") + `<path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)" stroke-width="2.5"/>`;
    }
    host.innerHTML = `<svg class="ck ck--spark" width="${W}" height="${H}" style="overflow:visible">
    <g class="ck-plot" style="clip-path:none">${body}</g>
    <g class="ck-hover" style="opacity:0"><line class="ck-cross" y1="0" y2="${H}"/>
      <circle class="ck-hd" r="3.5" fill="var(--vq-surface)" stroke="var(--vq-series-1-ink)" stroke-width="2"/></g>
    <rect class="ck-cap" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>
    <div class="ck-tip ck-tip--sm" hidden></div>`;
    requestAnimationFrame(() => {
      const p = host.querySelector(".ck-plot");
      if (p) p.style.clipPath = "none";
    });
    const cap = host.querySelector(".ck-cap"), hov = host.querySelector(".ck-hover");
    const cross = host.querySelector(".ck-cross"), dot = host.querySelector(".ck-hd");
    const tip = host.querySelector(".ck-tip");
    const head = host.closest(".vqc")?.querySelector(".vqc-value[data-full] .nf");
    const sub = host.closest(".vqc")?.querySelector(".vqc-when");
    const headCompact = () => head?.closest(".vqc-value")?.dataset.mode === "compact";
    const rest = () => {
      if (head) {
        const hl = headlineOf(card);
        setRoller(head, hl ? headCompact() ? hl.valueCompact : hl.value : unitPrefix(rd.unit) + fmtValue(vals[n - 1], rd.unit, headCompact()));
      }
      if (sub) sub.textContent = card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[n - 1], grain);
    };
    cap.addEventListener("mousemove", (e) => {
      const r0 = cap.getBoundingClientRect();
      const i = Math.max(0, Math.min(n - 1, Math.round((e.clientX - r0.left - 3) / ((W - 6) / (n - 1)))));
      hov.style.opacity = "1";
      cross.style.transform = `translateX(${pts[i][0].toFixed(1)}px)`;
      dot.style.transform = `translate(${pts[i][0].toFixed(1)}px, ${pts[i][1].toFixed(1)}px)`;
      tip.hidden = false;
      tip.innerHTML = `<p class="ck-tip-h">${fullLabel(times[i], grain)}</p>
      <span class="ck-tip-r"><b class="ck-tip-v">${unitPrefix(rd.unit)}${fmtValue(vals[i], rd.unit)}</b></span>`;
      const tw = tip.offsetWidth || 110;
      tip.style.left = Math.max(0, Math.min(W - tw, pts[i][0] - tw / 2)) + "px";
      if (head) setRoller(head, unitPrefix(rd.unit) + fmtValue(vals[i], rd.unit, headCompact()));
      if (sub) sub.textContent = fullLabel(times[i], grain);
    });
    cap.addEventListener("mouseleave", () => {
      hov.style.opacity = "0";
      tip.hidden = true;
      rest();
    });
  }
  function mountStat(host, card) {
    const variant = card.variant || "spark";
    if (variant === "spark") return mountSparkline(host, card);
    const rd = readingOf(card.key);
    const vals = valuesFor(card.key, card.period, rd.unit);
    const now = vals[vals.length - 1];
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const times = timeline(card.period), grain = PERIOD[card.period].grain;
    const at = (i) => tickLabel(times[i], grain);
    if (variant === "delta") {
      const half = Math.floor(vals.length / 2);
      const prev = vals.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const curr = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half);
      const mx = Math.max(prev, curr) || 1;
      const row = (lab, v, col) => `<div class="ck-cmp">
      <span class="ck-cmp-l">${lab}</span>
      <span class="ck-cmp-t"><i style="width:${(v / mx * 100).toFixed(0)}%;background:${col}"></i></span>
      <b class="ck-cmp-v">${unitPrefix(rd.unit)}${fmtValue(v, rd.unit, true)}</b></div>`;
      host.innerHTML = `<div class="ck-stat">
      ${row("This " + card.period.toLowerCase(), curr, "var(--vq-series-1)")}
      ${row("Previous", prev, "var(--vq-chart-track-data)")}
      <p class="ck-stat-n">${curr >= prev ? "Up" : "Down"}
        ${Math.abs((curr - prev) / (prev || 1) * 100).toFixed(1)}% on the first half of the period.</p></div>`;
      return;
    }
    const cell = (k, v, when) => `<div class="ck-fact"><span>${k}</span>
    <b>${unitPrefix(rd.unit)}${fmtValue(v, rd.unit, true)}</b>${when ? `<em>${when}</em>` : ""}</div>`;
    host.innerHTML = `<div class="ck-stat ck-stat--facts">
    ${cell("Lowest", lo, at(vals.indexOf(lo)))}
    ${cell("Average", avg, card.period.toLowerCase())}
    ${cell("Highest", hi, at(vals.indexOf(hi)))}
    ${cell("Latest", now, at(vals.length - 1))}</div>`;
  }
  function mountStatus(host, card) {
    if (renderDataState(host, card)) return;
    const rd = readingOf(card.key);
    const times = timeline(card.period), grain = PERIOD[card.period].grain;
    const live = liveReading(card);
    const status = live?.data || {};
    const ok = status.severity === "ok" || status.state === "balanced" || status.ok === true;
    const state = status.label || status.state || (ok ? "OK" : "Needs review");
    const body = card.variant === "dot" ? `<span class="ck-dotstate ${ok ? "is-ok" : "is-warn"}"><i></i><b>${state}</b></span>` : `<span class="ck-badge ${ok ? "is-ok" : "is-warn"}"><i></i>${state}</span>`;
    host.innerHTML = `<div class="ck-stat ck-stat--status">${body}
    <p class="ck-stat-n">${rd.label} · checked ${fullLabel(times[times.length - 1], grain)}</p></div>`;
  }
  function linkRows(host, shapeSel, rowSel) {
    const shapes = [...host.querySelectorAll(shapeSel)], rows = [...host.querySelectorAll(rowSel)];
    const set = (i, on) => {
      shapes.forEach((s) => s.classList.toggle("is-dim", on && +s.dataset.i !== i));
      rows.forEach((r) => {
        r.classList.toggle("is-dim", on && +r.dataset.i !== i);
        r.classList.toggle("is-on", on && +r.dataset.i === i);
      });
    };
    [...shapes, ...rows].forEach((el) => {
      el.addEventListener("mouseenter", () => set(+el.dataset.i, true));
      el.addEventListener("mouseleave", () => set(-1, false));
    });
  }
  const MOUNT = {
    gauge: mountGauge,
    funnel: mountFunnel,
    radar: mountRadar,
    scatter: mountScatter,
    heatmap: mountHeatmap,
    table: mountTable,
    feed: mountFeed,
    sankey: mountSankey,
    choropleth: mountChoropleth,
    sparkline: mountSparkline,
    stat: mountStat,
    status: mountStatus,
    list: mountTable
  };
  function mountChart(host, card) {
    if (!host) return;
    if (!isSpecial(card) && renderDataState(host, card)) return;
    const shape = String(readingOf(card.key)?.shape || "").toUpperCase();
    const legacyTimeChart = CARTESIAN.has(card.chart) || ["sparkline", "stat", "gauge", "ring"].includes(card.chart);
    if (shape === "RANKING" && (card.chart === "bar" || legacyTimeChart)) return mountTable(host, card);
    if (shape === "BREAKDOWN" && legacyTimeChart) return mountRadial(host, { ...card, chart: "pie" });
    if (shape === "TABLE" && legacyTimeChart) return mountTable(host, card);
    if (shape === "FEED" && legacyTimeChart) return mountFeed(host, card);
    if (CARTESIAN.has(card.chart)) return mountCartesian(host, card);
    if (RADIAL.has(card.chart)) return mountRadial(host, card);
    const fn = MOUNT[card.chart];
    if (fn) return fn(host, card);
  }
  let LEGAL = {};
  let CHART_NAME = {};
  let CATS = [];
  let CAT_NAME = {};
  let FITS = {};
  let DEFAULT_FIT = {};
  let GRID = {};
  let CAT_MAX = {};
  let CAT_DESC = {};
  const chartKey = (key) => ({ profit_loss_line: "pl", live_line: "live" })[key] || key;
  function setLayoutLaw(law) {
    if (!law || !law.categories || !law.chartLegality || !law.chartCategories) return false;
    const categories = law.categories;
    GRID = {
      cols: Number(law.grid.columns),
      unit: Number(law.grid.unit),
      gutter: Number(law.grid.gutter)
    };
    CATS = Object.keys(categories).filter((key) => /^C\d+$/.test(key));
    CAT_NAME = Object.fromEntries(CATS.map((key) => [key, categories[key].name]));
    CAT_DESC = Object.fromEntries(CATS.map((key) => [key, categories[key].role]));
    CAT_MAX = Object.fromEntries(CATS.map((key) => [key, [Number(categories[key].max.w), Number(categories[key].max.h)]]));
    FITS = Object.fromEntries(CATS.map((key) => [key, categories[key].fits.map((fit) => [Number(fit.w), Number(fit.h), fit.key, Number(fit.floor)])]));
    DEFAULT_FIT = Object.fromEntries(CATS.map((key) => {
      const found = categories[key].fits.findIndex((fit) => fit.default === true);
      return [key, found < 0 ? 0 : found];
    }));
    LEGAL = Object.fromEntries(Object.entries(law.chartLegality).filter(([shape]) => !shape.startsWith("$")).map(([shape, charts]) => [shape, charts.map(chartKey)]));
    Object.fromEntries(Object.entries(law.chartCategories).filter(([chart]) => !chart.startsWith("$")).map(([chart, cats]) => [chartKey(chart), cats[0]]));
    CHART_NAME = Object.fromEntries([...new Set(Object.values(LEGAL).flat())].map((chart) => [
      chart,
      { stat: "Number", pl: "Profit / loss", live: "Live line", composed: "Combo", choropleth: "Regions" }[chart] || chart.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())
    ]));
    if (typeof window !== "undefined") window.__VENQORE_LAYOUT_LAW__ = law;
    return true;
  }
  setLayoutLaw(opts && opts.layoutLaw || typeof window !== "undefined" && window.__VENQORE_LAYOUT_LAW__);
  if (!CATS.length) throw new Error("[VenQoreCards] Layout Law was not provided by the server.");
  const FIT_INSIDE = {
    "icon+label": "icon left, label right",
    "icon": "icon only, label in tooltip",
    "inline": "label and value share one line",
    "stacked": "label above value",
    "full": "the richest interior this category has",
    "standard": "value and delta, no sparkline",
    "compact": "abbreviated value, no sparkline",
    "list": "narrow list, one item per row",
    "narrow": "legend or controls move below",
    "min": "the leanest interior — chart only"
  };
  function catFloor(cat, T) {
    const f = (T || FITS)[cat] || [];
    return [Math.min(...f.map((x) => x[0])), Math.min(...f.map((x) => x[1]))];
  }
  function sizeLegal(cat, w, h, T) {
    const [MW, MH] = CAT_MAX[cat] || [12, 16];
    if (w > MW || h > MH || w < 1 || h < 1) return false;
    return ((T || FITS)[cat] || []).some(([fw, fh]) => w >= fw && h >= fh);
  }
  function resolveFit(cat, w, h, T) {
    const list = (T || FITS)[cat] || [];
    for (let i = 0; i < list.length; i++) {
      if (w >= list[i][0] && h >= list[i][1]) return i;
    }
    return null;
  }
  function minHeightAt(cat, w, T) {
    const hs = ((T || FITS)[cat] || []).filter(([fw]) => w >= fw).map(([, fh]) => fh);
    return hs.length ? Math.min(...hs) : null;
  }
  function minWidthAt(cat, h, T) {
    const ws = ((T || FITS)[cat] || []).filter(([, fh]) => h >= fh).map(([fw]) => fw);
    return ws.length ? Math.min(...ws) : null;
  }
  function sizesFor(cat, T) {
    const tbl = T || FITS;
    const [MW, MH] = CAT_MAX[cat] || [12, 16];
    const out = [];
    for (let w = 1; w <= MW; w++) {
      for (let h = 1; h <= MH; h++) {
        if (!sizeLegal(cat, w, h, tbl)) continue;
        const fit = resolveFit(cat, w, h, tbl);
        const nm = tbl[cat][fit][2];
        out.push({
          cat,
          w,
          h,
          fit,
          fitName: nm,
          inside: FIT_INSIDE[nm] || "",
          isFit: tbl[cat][fit][0] === w && tbl[cat][fit][1] === h,
          isMax: w === MW && h === MH
        });
      }
    }
    return out;
  }
  function presetsFor(cat, T) {
    const tbl = T || FITS;
    const list = tbl[cat] || [];
    if (!list.length) return [];
    const [MW, MH] = CAT_MAX[cat] || [12, 16];
    const mk = (w, h) => {
      const fit = resolveFit(cat, w, h, tbl) ?? 0;
      const nm = tbl[cat][fit][2];
      return {
        cat,
        w,
        h,
        fit,
        fitName: nm,
        inside: FIT_INSIDE[nm] || "",
        isFit: tbl[cat][fit][0] === w && tbl[cat][fit][1] === h,
        isMax: w === MW && h === MH
      };
    };
    const out = [];
    list.forEach(([w, h]) => {
      out.push(mk(w, h));
      if (MW > w) out.push(mk(MW, h));
      const mid = Math.round((w + MW) / 2);
      if (mid > w && mid < MW) out.push(mk(mid, h));
    });
    out.push(mk(MW, MH));
    return out.filter((s) => sizeLegal(cat, s.w, s.h, tbl)).filter((s, i, a) => a.findIndex((x) => x.w === s.w && x.h === s.h) === i).sort((a, b) => a.w * a.h - b.w * b.h || a.w - b.w);
  }
  function boardCols(el) {
    const board2 = el || document.getElementById("board");
    if (board2) {
      const cs = getComputedStyle(board2);
      const v = parseInt(cs.getPropertyValue("--vq-cols"), 10);
      if (v > 0 && v <= 24) return v;
      const tpl = cs.gridTemplateColumns;
      if (tpl && tpl !== "none") {
        const n = tpl.trim().split(/\s+/).length;
        if (n > 0 && n <= 24) return n;
      }
    }
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    return vw < 600 ? 4 : vw < 1024 ? 8 : 12;
  }
  function boardColW(el) {
    const board2 = el || document.getElementById("board");
    const cols = boardCols(board2);
    if (board2 && board2.clientWidth > 0)
      return Math.max(24, (board2.clientWidth - GRID.gutter * (cols - 1)) / cols);
    return 112;
  }
  function pxWidth(w, colW) {
    return w * (colW || 112) + (w - 1) * GRID.gutter;
  }
  function fitToGrid(w, h, cols) {
    const c = cols || boardCols();
    if (w <= c) return [w, h];
    return [Math.max(1, c), h];
  }
  const MIN_SIZE = {
    stat: [2, 1],
    status: [2, 1],
    sparkline: [3, 3],
    gauge: [3, 4],
    ring: [4, 6],
    pie: [4, 6],
    sunburst: [4, 6],
    bar: [4, 4],
    table: [3, 4],
    funnel: [5, 4],
    radar: [4, 5],
    feed: [3, 4],
    area: [4, 4],
    line: [4, 4],
    pl: [4, 4],
    live: [4, 4],
    composed: [5, 5],
    scatter: [4, 4],
    heatmap: [4, 4],
    sankey: [5, 5],
    choropleth: [4, 4]
  };
  const HOSTLESS = /* @__PURE__ */ new Set(["stat", "status"]);
  const SPECIAL = {
    action_hub: {
      cat: "C4",
      min: [3, 2],
      cats: ["C3", "C4", "C5", "C6"],
      family: "hub",
      eyebrow: "OPERATIONS HUB",
      name: "Quick Operations Hub",
      sub: "Point of sale, purchases and quick dispatch"
    },
    bank_liquidity: {
      cat: "C4",
      min: [3, 2],
      cats: ["C3", "C4", "C5", "C6"],
      family: "hub",
      eyebrow: "LIQUIDITY & BALANCES",
      name: "Bank & Liquid Net Balances",
      sub: "Accounts, drawer and total liquid net"
    },
    alerts_hub: {
      cat: "C4",
      min: [3, 3],
      cats: ["C3", "C4", "C5", "C6"],
      family: "hub",
      eyebrow: "ACTIONS REQUIRED",
      name: "Actions Required & Alerts",
      sub: "Everything waiting on someone"
    },
    growth_engine: {
      cat: "C4",
      min: [3, 2],
      cats: ["C3", "C4", "C5", "C6"],
      family: "hub",
      eyebrow: "GROWTH ENGINE",
      name: "Growth Engine & Target Pace",
      sub: "Velocity, target pace and retention"
    },
    custom_button: {
      cat: "C1",
      min: [1, 1],
      cats: ["C1"],
      family: "shortcut",
      eyebrow: "SHORTCUT",
      name: "Shortcut",
      sub: "One-click jump"
    },
    launchpad: {
      cat: "C4",
      min: [3, 2],
      cats: ["C3", "C4", "C5"],
      family: "hub",
      eyebrow: "LAUNCHPAD",
      name: "Launchpad",
      sub: "Your four essentials — always the same four"
    }
  };
  const isSpecial = (c) => !!(c && c.type && SPECIAL[c.type]);
  const fitsTable = () => FITS;
  const isBare = (c) => c.chart === "stat" && c.variant === "number";
  function minSizeFor(card) {
    if (isSpecial(card)) return SPECIAL[card.type].min.slice();
    if (card.cat === "C1") return [1, 1];
    if (card.cat === "C2") return [3, 1];
    let [w, h] = MIN_SIZE[card.chart] || [3, 3];
    if (!HOSTLESS.has(card.chart) && !isBare(card)) h = Math.max(h, 3);
    if (card.chart === "stat") {
      const v = card.variant || "spark";
      if (v === "number") [w, h] = [3, 1];
      else if (v === "spark") [w, h] = [3, 3];
      else if (v === "delta") [w, h] = [3, 3];
      else [w, h] = [3, 4];
    }
    if (card.chart === "status") [w, h] = [3, 3];
    let rows = h;
    const parts = () => {
      const rd = readingOf(card.key);
      const sn = rd && Array.isArray(rd.sliceNames) && rd.sliceNames.length > 0 ? rd.sliceNames : ["Cash", "Card", "Credit", "Bank"];
      return sn.length;
    };
    if (RADIAL.has(card.chart)) rows = Math.max(rows, 2 + Math.ceil(parts() * 0.75));
    if (card.chart === "funnel") rows = Math.max(rows, parts() + 1);
    if (CARTESIAN.has(card.chart) && card.extraKeys.length) rows = Math.max(rows, h + 1);
    return [w, rows];
  }
  function fitsFor(card, cat) {
    const T = fitsTable();
    if (!isSpecial(card) && (cat === "C1" || cat === "C2") && !HOSTLESS.has(card.chart)) return [];
    const [mw, mh] = minSizeFor({ ...card, cat });
    return (T[cat] || []).map((f, i) => [i, f[0], f[1], f[2]]).filter(([, w, h]) => w >= mw && h >= mh);
  }
  function catsFor(card) {
    if (isSpecial(card)) return SPECIAL[card.type].cats.filter((k) => fitsFor(card, k).length);
    return CATS.filter((k) => fitsFor(card, k).length);
  }
  function catForSize(card, w, h) {
    const list = catsFor(card);
    for (let i = list.length - 1; i >= 0; i--) {
      if (sizeLegal(list[i], w, h, fitsTable())) return list[i];
    }
    return card.cat || list[0] || "C3";
  }
  function fitCat(card) {
    return catsFor(card)[0] || (isSpecial(card) ? SPECIAL[card.type].cat : "C6");
  }
  function geometryOf(card, cols, colW) {
    const frameSlot = FRAME_SLOTS.find((slot) => Number(slot.slot) === Number(card.frameSlot));
    if (frameSlot && (cols || 12) >= 12) {
      const sw = Number(frameSlot.w);
      const sh = Number(frameSlot.h);
      const scat = frameSlot.category || card.cat || "C4";
      const T2 = fitsTable();
      const [gw2, gh2] = fitToGrid(sw, sh, cols);
      return {
        w: gw2,
        h: gh2,
        authoredW: sw,
        authoredH: sh,
        cat: scat,
        colW: colW || COL_W,
        fit: resolveFit(scat, gw2, gh2, T2) ?? 0,
        clamped: false
      };
    }
    const cat = card.cat || fitCat(card);
    const T = fitsTable();
    const [MW, MH] = CAT_MAX[cat] || [12, 16];
    const [mw, mh] = minSizeFor({ ...card, cat });
    let w, h;
    if (card.w && card.h) {
      w = card.w;
      h = card.h;
    } else {
      const list = T[cat] || T.C4;
      const f = list[Math.min(card.fit || 0, list.length - 1)];
      w = f[0];
      h = f[1];
    }
    w = Math.max(mw, Math.min(MW, w));
    h = Math.max(mh, Math.min(MH, h));
    if (!sizeLegal(cat, w, h, T)) {
      const needH = minHeightAt(cat, w, T);
      if (needH != null) h = Math.max(h, needH);
      else {
        const needW = minWidthAt(cat, h, T);
        if (needW != null) w = Math.max(w, needW);
      }
    }
    const [gw, gh] = fitToGrid(w, h, cols);
    return {
      w: gw,
      h: gh,
      authoredW: w,
      authoredH: h,
      cat,
      colW: colW || COL_W,
      fit: resolveFit(cat, gw, gh, T) ?? 0,
      clamped: gw !== w
    };
  }
  const MULTI_OK = /* @__PURE__ */ new Set(["line", "area", "bar", "composed"]);
  const NEEDS_SERIES = {
    area: { stacked: 2 },
    bar: { grouped: 2, stacked: 2 },
    composed: {
      "bar-line-area": 2,
      "bar-two-lines": 3,
      "stacked-line": 3,
      pattern: 2,
      "thin-columns": 2,
      "area-bar": 2
    }
  };
  const ONLY_SINGLE = { composed: ["bar-trend"] };
  function variantsFor(card) {
    const need = NEEDS_SERIES[card.chart] || {};
    const solo = ONLY_SINGLE[card.chart] || [];
    const have = 1 + card.extraKeys.length;
    return variantsOf(card.chart).map(([id, name]) => {
      if (solo.includes(id)) return [id, name, have === 1, "single series only"];
      const want = need[id] || 0;
      return [id, name, have >= want, want ? `needs ${want} series` : ""];
    });
  }
  function fixVariant(card) {
    const v = variantsFor(card);
    if (!v.some(([id, , ok]) => id === card.variant && ok)) {
      const first = v.find(([, , ok]) => ok);
      if (first) card.variant = first[0];
    }
  }
  const IC = {
    up: '<path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
    down: '<path d="m3 7 6 6 4-4 8 8"/><path d="M17 17h4v-4"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    grip: '<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'
  };
  const ic = (n, s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;
  let CARDS = [], EDIT = null, SEQ = 0, LIB_AREA = "All", LIB_Q = "";
  let ACTIVE_FRAME = opts && opts.activeFrame || null;
  let FRAME_SLOTS = Array.isArray(opts && opts.frameSlots) ? opts.frameSlots : [];
  let FRAME_DIRTY = !!(opts && opts.frameDirty);
  let DASHBOARD_ID = opts && opts.dashboardId || null;
  let SAVE_LAYOUT_TIMER = null;
  const PREFS = { periodPicker: true };
  const newId = () => "c" + ++SEQ;
  const cardOf = (id) => CARDS.find((c) => c.id === id);
  function resizeForChart(c) {
    c.w = c.h = null;
    c.cat = fitCat(c);
    c.fit = DEFAULT_FIT[c.cat];
    clampFit(c);
  }
  function clampFit(c, wanted) {
    if (c.w && c.h) {
      const g = geometryOf(c, 24);
      c.w = g.authoredW;
      c.h = g.authoredH;
      c.cat = g.cat;
      c.fit = g.fit;
      return;
    }
    let legal = fitsFor(c, c.cat);
    if (!legal.length) {
      c.cat = fitCat(c);
      legal = fitsFor(c, c.cat);
    }
    const want = wanted ?? (isSpecial(c) ? 0 : DEFAULT_FIT[c.cat]);
    c.fit = legal.some(([i]) => i === want) ? want : legal[0][0];
  }
  function legalFor(key) {
    const rd = readingOf(key);
    return LEGAL[rd.shape] || ["stat"];
  }
  function addCard(key, opts2 = {}) {
    const rd = readingOf(key);
    if (!rd) return null;
    const chart = opts2.chart || legalFor(key)[0];
    const c = {
      id: newId(),
      key,
      extraKeys: opts2.extraKeys || [],
      chart,
      variant: opts2.variant || defaultVariant(chart),
      cat: "C3",
      fit: 0,
      period: opts2.period || "Month",
      title: opts2.title || null,
      accent: !!opts2.accent
    };
    c.cat = opts2.cat && fitsFor(c, opts2.cat).length ? opts2.cat : fitCat(c);
    clampFit(c, opts2.fit);
    const cols = boardCols();
    const [w, h] = sizeOf(c, cols);
    const spot = freeSpot(c, 0, 0, w, h, cols);
    c.gx = spot.x;
    c.gy = spot.y;
    markFrameDirty();
    CARDS.push(c);
    draw();
    return c;
  }
  function headlineOf(card) {
    const rd = readingOf(card.key);
    const reqKey = `${card.key}|${card.period}`;
    const live = liveReading(card);
    const times = timeline(card.period), grain = PERIOD[card.period].grain;
    if (live?.status === "unavailable") {
      return {
        value: "—",
        valueCompact: "—",
        dir: "up",
        pct: "",
        when: live.error?.message || "Not available yet"
      };
    }
    if (live && live.ok && (live.data !== void 0 && live.data !== null || live.value !== void 0)) {
      let last = null;
      let prev = null;
      let hasDelta = false;
      if (typeof live.data === "number") {
        last = live.data;
      } else if (typeof live.data === "object" && live.data !== null) {
        if (live.data.value !== void 0 && live.data.value !== null) {
          last = Number(live.data.value);
          if (live.data.previous !== void 0 && live.data.previous !== null) {
            prev = Number(live.data.previous);
            hasDelta = true;
          } else if (live.data.comparison?.previous !== void 0 && live.data.comparison?.previous !== null) {
            prev = Number(live.data.comparison.previous);
            hasDelta = true;
          }
        } else if (live.value !== void 0 && live.value !== null) {
          last = Number(live.value);
        } else if (live.data.total !== void 0 && live.data.total !== null) {
          last = Number(live.data.total);
        } else if (live.data.current !== void 0 && live.data.current !== null) {
          last = Number(live.data.current);
          if (live.data.previous !== void 0 && live.data.previous !== null) {
            prev = Number(live.data.previous);
            hasDelta = true;
          } else if (live.data.comparison?.previous !== void 0 && live.data.comparison?.previous !== null) {
            prev = Number(live.data.comparison.previous);
            hasDelta = true;
          }
        } else if (Array.isArray(live.data.slices) && live.data.slices.length > 0) {
          last = live.data.slices.reduce((acc, x) => acc + (x.value !== void 0 && x.value !== null ? Number(x.value) : 0), 0);
        } else {
          const seriesSource = live.data.series || live.data.points || live.series;
          if (Array.isArray(seriesSource) && seriesSource.length > 0) {
            if (live.data.total !== void 0 && live.data.total !== null) {
              last = Number(live.data.total);
            } else if (live.value !== void 0 && live.value !== null) {
              last = Number(live.value);
            } else {
              const nonZeroPts = seriesSource.filter((pt) => {
                const v = pt?.y ?? pt?.value ?? (typeof pt === "number" ? pt : null);
                return v !== null && v !== void 0 && v !== 0;
              });
              const chosenPt = nonZeroPts.length ? nonZeroPts[nonZeroPts.length - 1] : seriesSource[seriesSource.length - 1];
              const rawVal = chosenPt?.y ?? chosenPt?.value ?? (typeof chosenPt === "number" ? chosenPt : null);
              if (rawVal !== null && rawVal !== void 0) {
                last = Number(rawVal);
              }
            }
            if (seriesSource.length > 1) {
              const prevPt = seriesSource[seriesSource.length - 2];
              const rawPrev = prevPt?.y ?? prevPt?.value ?? (typeof prevPt === "number" ? prevPt : null);
              if (rawPrev !== null && rawPrev !== void 0) {
                prev = Number(rawPrev);
                hasDelta = true;
              }
            }
          }
        }
      } else if (typeof live.value === "number") {
        last = live.value;
      }
      if (last === null || isNaN(last)) {
        return {
          value: "—",
          valueCompact: "—",
          dir: "up",
          pct: "",
          when: card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[times.length - 1], grain)
        };
      }
      let pctNum = null;
      if (hasDelta && prev !== null && !isNaN(prev) && prev !== 0) {
        pctNum = (last - prev) / Math.abs(prev) * 100;
      } else if (live.delta?.pct !== void 0 && live.delta?.pct !== null) {
        pctNum = Number(live.delta.pct);
      } else if (live.data?.comparison?.percent !== void 0 && live.data?.comparison?.percent !== null) {
        pctNum = Number(live.data.comparison.percent);
      } else if (live.data?.change_pct !== void 0 && live.data?.change_pct !== null) {
        pctNum = Number(live.data.change_pct);
      } else if (live.data?.delta_pct !== void 0 && live.data?.delta_pct !== null) {
        pctNum = Number(live.data.delta_pct);
      }
      const dir = pctNum === null || pctNum >= 0 ? "up" : "down";
      const pct = pctNum !== null && !isNaN(pctNum) ? Math.abs(pctNum).toFixed(1) + "%" : "";
      const freshness = live.meta?.freshness || "live";
      const asOf = live.meta?.computed_at || null;
      return {
        value: unitPrefix(rd.unit) + fmtValue(last, rd.unit),
        valueCompact: unitPrefix(rd.unit) + fmtValue(last, rd.unit, true),
        dir,
        pct,
        when: card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[times.length - 1], grain),
        freshness,
        asOf
      };
    }
    const pending = PENDING_RECKONER_REQUESTS.has(reqKey) || PENDING_RECKONER_REQUESTS.has(`${card.key}|${toReckonerPeriod(card.period)}`);
    return {
      value: "—",
      valueCompact: "—",
      dir: "up",
      pct: "",
      when: pending ? "Loading data…" : "No activity recorded"
    };
  }
  function valueHTML(hl, cls) {
    return `<span class="vqc-value ${cls || ""}" data-full="${esc(hl.value)}"
    data-compact="${esc(hl.valueCompact)}">${rollerHTML(hl.value)}</span>`;
  }
  function fitValues(scope) {
    (scope || document).querySelectorAll(".vqc-value[data-full], .vqc-bank-val[data-full]").forEach((v) => {
      const nf = v.querySelector(".nf");
      const put = (t) => {
        if (nf) setRoller(nf, t);
        else v.textContent = t;
      };
      const cur = () => nf ? nf.dataset.value : v.textContent;
      const box = v.closest(".vqc-bank-box") || v.closest(".vqc-bd") || v.closest(".vqc") || v.parentElement;
      if (!box || !box.clientWidth) return;
      const over = () => box.scrollWidth - box.clientWidth > 1 || v.scrollWidth - v.clientWidth > 1;
      v.classList.remove("is-tight");
      v.dataset.mode = "full";
      if (cur() !== v.dataset.full) put(v.dataset.full);
      if (!over()) return;
      if (v.dataset.compact && v.dataset.compact !== v.dataset.full) {
        put(v.dataset.compact);
        v.dataset.mode = "compact";
        if (!over()) return;
      }
      v.classList.add("is-tight");
    });
  }
  function periodPicker(c) {
    return `<span class="vqc-per">
    <button class="vqc-per-b" aria-haspopup="true" aria-expanded="false">${c.period}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="3" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>
    <span class="vqc-per-m" hidden>${PERIODS.map((x) => `<button class="vqc-per-i ${x === c.period ? "is-on" : ""}" data-p="${x}">${x}</button>`).join("")}</span>
  </span>`;
  }
  function sizeOf(c, cols, colW) {
    const g = geometryOf(c, cols, colW);
    return [g.w, g.h];
  }
  function authoredSizeOf(c) {
    const g = geometryOf(c, 24);
    return [g.authoredW, g.authoredH];
  }
  function hostDimensions(host, card) {
    if (host && host.clientWidth > 30 && host.clientHeight > 24)
      return { W: host.clientWidth, H: host.clientHeight };
    const cardEl = host ? host.closest(".vqc") : null;
    let cardW = 0, cardH = 0;
    if (cardEl) {
      cardW = cardEl.clientWidth;
      cardH = cardEl.clientHeight;
    }
    if (cardW < 30 || cardH < 30) {
      const board2 = host && host.closest(".vq-grid") || document.getElementById("board");
      const cols = boardCols(board2);
      const [wCols, hRows] = sizeOf(card, cols);
      let colW = 112;
      if (board2 && board2.clientWidth > 0)
        colW = Math.max(36, (board2.clientWidth - GRID.gutter * (cols - 1)) / cols);
      cardW = wCols * colW + (wCols - 1) * GRID.gutter;
      cardH = hRows * GRID.unit + (hRows - 1) * GRID.gutter;
    }
    let above = 0;
    if (cardEl) {
      const cs = getComputedStyle(cardEl);
      above += parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      [...cardEl.children].forEach((ch) => {
        if (ch === host || ch.classList.contains("vqc-glare") || ch.classList.contains("vqc-star") || ch.classList.contains("vqc-resize")) return;
        if (ch.offsetHeight) above += ch.offsetHeight;
      });
    }
    if (!above) {
      const selfLabelled = card.chart === "gauge" || card.chart === "ring" || card.chart === "sunburst";
      above = card.chart !== "status" && !selfLabelled ? 92 : 30;
      if (card.extraKeys && card.extraKeys.length) above += 26;
      above += 28;
    }
    return {
      W: Math.max(60, Math.round(cardW - 28)),
      H: Math.max(40, Math.round(cardH - above))
    };
  }
  let STORE_SLUG = "";
  const storePath = (p) => STORE_SLUG ? `/s/${STORE_SLUG}${p}` : p;
  function getDeepLinkForCard(key) {
    if (!key) return "/pos";
    if (key.startsWith("sales") || key.startsWith("pre_sales") || key.startsWith("proposals") || key.startsWith("recurring") || key.startsWith("returns")) return storePath("/sales");
    if (key.startsWith("purchase") || key.startsWith("debit_notes")) return storePath("/purchase-orders");
    if (key.startsWith("inventory") || key.startsWith("batch") || key.startsWith("serial") || key.startsWith("production")) return storePath("/inventory");
    if (key.startsWith("accounting") || key.startsWith("finance") || key.startsWith("bank"))
      return storePath("/finance");
    if (key.startsWith("party") || key.startsWith("parties") || key.startsWith("contacts"))
      return storePath("/parties");
    if (key.startsWith("staff") || key.startsWith("operations")) return storePath("/reports");
    return storePath("/reports");
  }
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const TONE_CLASS = {
    surface: "vqc--tone-surface",
    accent: "vqc--tone-accent vqc--accent",
    ink: "vqc--tone-ink",
    mesh: "vqc--tone-mesh"
  };
  const SHORTCUT_ICONS = {
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    truck: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    dollar: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
    chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V4.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.5.6.87 1.15 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
  };
  const shortcutIcon = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SHORTCUT_ICONS[n] || SHORTCUT_ICONS.bolt}</svg>`;
  function cardTools(c, link) {
    const arrow = c.showOpenArrow !== false && link;
    return `<span class="vqc-tools">
    ${arrow ? `<a href="${esc(link)}" class="vqc-nav-link" title="Open ${esc(destinationName(link))}" aria-label="Open ${esc(destinationName(link))}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></a>` : ""}
    <button type="button" class="vqc-act vqc-grip" title="Drag to reorder" aria-label="Drag to reorder">${ic("grip", 13)}</button>
    <button type="button" class="vqc-act vqc-edit" title="Edit card" aria-label="Edit card">${ic("pencil", 12)}</button>
    <button type="button" class="vqc-act vqc-del" title="Remove card" aria-label="Remove card">${ic("trash", 12)}</button>
  </span>`;
  }
  function destinationName(path) {
    if (!path) return "";
    const tail = String(path).replace(/\/$/, "").split("/").pop() || "";
    const named = {
      pos: "Point of Sale",
      sales: "Sales & Invoices",
      inventory: "Inventory & Stock",
      "purchase-orders": "Purchasing",
      finance: "Finance & Accounts",
      parties: "Parties & CRM",
      reports: "Reports & Intel",
      settings: "Settings"
    };
    return named[tail] || tail.replace(/-/g, " ");
  }
  function cardFrame(c, opts2) {
    const { w, h, cat, clamped } = opts2.geo;
    const tone = c.tone || (c.accent ? "accent" : "surface");
    const cls = [
      "vqc",
      `vqc--${String(cat).toLowerCase()}`,
      `vq-w${w}`,
      `vq-h${h}`,
      TONE_CLASS[tone] || TONE_CLASS.surface,
      opts2.extraClass || "",
      clamped ? "is-clamped" : "",
      `vqc--fit-${opts2.geo.fit}`
    ].filter(Boolean).join(" ");
    const frameSlot = FRAME_SLOTS.find((slot) => Number(slot.slot) === Number(c.frameSlot));
    const is12 = (opts2.cols || 12) >= 12;
    const pinned = is12 && (frameSlot != null || Number.isInteger(c.gx) && Number.isInteger(c.gy));
    const colSpan = frameSlot && is12 ? Number(frameSlot.w) : w;
    const rowSpan = frameSlot && is12 ? Number(frameSlot.h) : h;
    const colStart = (frameSlot && is12 ? Number(frameSlot.x) : Number.isInteger(c.gx) ? c.gx : 0) + 1;
    const rowStart = (frameSlot && is12 ? Number(frameSlot.y) : Number.isInteger(c.gy) ? c.gy : 0) + 1;
    const place = pinned ? `grid-column:${colStart} / span ${colSpan};grid-row:${rowStart} / span ${rowSpan};` : "";
    return `<article class="${cls}" data-id="${c.id}" data-cat="${cat}" data-w="${colSpan}" data-h="${rowSpan}"
    tabindex="0" draggable="false"
    style="--i:${CARDS.indexOf(c)};--vqw:${colSpan};--vqh:${rowSpan};${place}">
    ${opts2.body}
    <button type="button" class="vqc-resize" aria-label="Resize card" title="Drag to resize"></button>
  </article>`;
  }
  function hubHead(c, eyebrow, link) {
    return `<div class="vqc-hd">
    <span class="vqc-eyebrow" title="${esc(eyebrow)}">${esc(eyebrow)}</span>
    <span class="vqc-hd-r">${cardTools(c, link)}</span>
  </div>`;
  }
  function bodyActionHub(c, geo) {
    const link = c.targetUrl || c.link || "/pos";
    const ALL = [
      { href: "/pos", mod: "sales", icon: "cart", label: "Point of Sale" },
      { href: storePath("/purchase-orders"), mod: "purchase", icon: "truck", label: "Purchase Order" },
      { href: null, mod: "actions", icon: "plus", label: "Quick Actions" },
      { href: storePath("/sales"), mod: "quiet", icon: "file", label: "New Invoice" },
      { href: storePath("/inventory"), mod: "quiet", icon: "box", label: "Add Product" },
      { href: storePath("/parties"), mod: "quiet", icon: "users", label: "New Customer" },
      { href: storePath("/finance"), mod: "quiet", icon: "dollar", label: "Add Expense" },
      { href: storePath("/reports"), mod: "quiet", icon: "chart", label: "Reports" }
    ];
    const cardH = geo.h * 64 + (geo.h - 1) * 24;
    const titleH = geo.h >= 3 ? 61 : 0;
    const free = cardH - 40 - 34 - titleH;
    const rows = Math.max(1, Math.floor((free + 8) / (40 + 8)));
    const perRow = Math.max(1, Math.floor(geo.w / 2));
    const items = ALL.slice(0, Math.max(3, Math.min(ALL.length, perRow * rows)));
    return hubHead(c, SPECIAL.action_hub.eyebrow, link) + `<div class="vqc-hub-title-wrap">
       <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
       <div class="vqc-action-hub-sub">${esc(SPECIAL.action_hub.sub)}</div>
     </div>
     <div class="vqc-action-hub-grid" style="grid-template-columns:repeat(${Math.min(perRow, items.length)},minmax(0,1fr))">${items.map(
      (i) => i.href ? `<a href="${esc(i.href)}" class="vqc-hub-btn vqc-hub-btn--${i.mod}">${shortcutIcon(i.icon, 15)}<span>${esc(i.label)}</span></a>` : `<button type="button" class="vqc-hub-btn vqc-hub-btn--${i.mod}" data-glass="1">${shortcutIcon(i.icon, 15)}<span>${esc(i.label)}</span></button>`
    ).join("")}</div>`;
  }
  function bodyBankLiquidity(c, geo) {
    const link = c.targetUrl || c.link || storePath("/finance");
    const bankAccounts = DASHBOARD_RUNTIME_DATA.bankAccounts || [];
    const cashAccounts = DASHBOARD_RUNTIME_DATA.cashAccounts || [];
    const cashOnHand = Number(DASHBOARD_RUNTIME_DATA.cashData?.balance || 0);
    const bankTotal = bankAccounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
    const cashAccountTotal = cashAccounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
    const boxes = [
      { l: "Bank Accounts", v: bankTotal, s: `${bankAccounts.length} accounts active` },
      { l: "Cash on Hand", v: cashOnHand, s: "Ledger balance" },
      { l: "Total Liquid Net", v: bankTotal + cashAccountTotal + cashOnHand, s: "Current balance", total: true }
    ];
    return hubHead(c, SPECIAL.bank_liquidity.eyebrow, link) + `<div class="vqc-hub-title-wrap"><div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.bank_liquidity.sub)}</div></div><div class="vqc-bank-grid">${boxes.map((b) => `
      <div class="vqc-bank-box${b.total ? " is-total" : ""}">
        <span class="vqc-bank-label" title="${esc(b.l)}">${esc(b.l)}</span>
        <span class="vqc-bank-val" data-full="Rs ${groupNum(b.v)}" data-compact="Rs ${abbrNum(b.v)}">Rs ${groupNum(b.v)}</span>
        <span class="vqc-bank-sub">${esc(b.s)}</span>
      </div>`).join("")}</div>`;
  }
  function bodyAlertsHub(c, geo) {
    const link = c.targetUrl || c.link || storePath("/reports");
    const modOk = (mods) => !ENABLED_MODULES || !mods.length || mods.some((m) => ENABLED_MODULES.has(m));
    const lowStockCount = (DASHBOARD_RUNTIME_DATA.lowStockItems || []).length;
    const rows = (lowStockCount > 0 ? [
      { k: "warning", mods: ["inventory"], href: storePath("/inventory"), msg: `<strong>${lowStockCount} products</strong> reached safety reorder limit`, cta: "Reorder" }
    ] : []).filter((r) => modOk(r.mods));
    const room = Math.max(1, Math.min(rows.length, Math.floor((geo.h - 1) * 88 / 46)));
    return hubHead(c, SPECIAL.alerts_hub.eyebrow, link) + `<div class="vqc-alerts-list">${rows.length ? rows.slice(0, room).map((r) => `
      <a href="${esc(r.href)}" class="vqc-alert-item vqc-alert-item--${r.k}">
        <span class="vqc-alert-dot"></span>
        <span class="vqc-alert-msg">${r.msg}</span>
        <span class="vqc-alert-btn">${esc(r.cta)} &rarr;</span>
      </a>`).join("") : '<p class="vq-rail-empty">No actions required</p>'}</div>`;
  }
  function bodyGrowthEngine(c, geo) {
    const link = c.targetUrl || c.link || storePath("/reports");
    return hubHead(c, SPECIAL.growth_engine.eyebrow, link) + `<div class="vqc-hub-title-wrap"><div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.growth_engine.sub)}</div></div><div class="vqc-growth-grid"><p class="vq-rail-empty">No growth data yet</p></div>`;
  }
  function bodyCustomButton(c, geo) {
    const href = c.targetUrl || c.link || "/pos";
    const colour = c.btnColor || "var(--vq-teal-500)";
    const iconOnly = geo.w < 2;
    const label = titleOf(c);
    return `<a href="${esc(href)}" class="vqc-custom-action-anchor${iconOnly ? " is-icon" : ""}"
      title="${esc(label)}">
      <span class="vqc-custom-icon-ring" style="background:${esc(colour)}">${shortcutIcon(c.icon || "bolt", 18)}</span>
      ${iconOnly ? "" : `<span class="vqc-custom-text">
        <span class="vqc-custom-btn-title">${esc(label)}</span>
        ${geo.h >= 2 ? `<span class="vqc-custom-btn-sub">Open ${esc(destinationName(href))}</span>` : ""}
      </span>`}
    </a>${cardTools(c, href)}`;
  }
  function bodyLaunchpad(c, geo) {
    const link = c.targetUrl || c.link || "/pos";
    const items = [
      { href: "/pos", icon: "cart", label: "Point of Sale" },
      { href: storePath("/sales"), icon: "file", label: "New Invoice" },
      { href: storePath("/inventory"), icon: "box", label: "Add Product" },
      { href: storePath("/purchase-orders"), icon: "truck", label: "Purchase Order" }
    ];
    const perRow = geo.w >= 4 ? 2 : 1;
    return hubHead(c, SPECIAL.launchpad.eyebrow, link) + (geo.h >= 3 ? `<div class="vqc-hub-title-wrap">
       <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
       <div class="vqc-action-hub-sub">${esc(SPECIAL.launchpad.sub)}</div>
     </div>` : "") + `<div class="vqc-launchpad" style="grid-template-columns:repeat(${perRow},minmax(0,1fr))">${items.map(
      (i) => `<a href="${esc(i.href)}" class="vqc-hub-btn vqc-hub-btn--quiet vqc-launchpad-btn">${shortcutIcon(i.icon, 16)}<span>${esc(i.label)}</span></a>`
    ).join("")}</div>`;
  }
  const SPECIAL_BODY = {
    action_hub: bodyActionHub,
    bank_liquidity: bodyBankLiquidity,
    alerts_hub: bodyAlertsHub,
    growth_engine: bodyGrowthEngine,
    custom_button: bodyCustomButton,
    launchpad: bodyLaunchpad
  };
  function bodyStrip(c, geo, link) {
    const hl = headlineOf(c);
    const title = titleOf(c);
    const px = pxWidth(geo.w, geo.colW);
    const delta = c.showDelta === false || !hl.pct ? "" : `<span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir, 10)}${hl.pct}</span>`;
    const tight = px < 320;
    const when = c.showWhen === false ? "" : `<span class="vqc-when">${esc(c.period)}</span>`;
    const stacked = Boolean(c.stacked || geo.h >= 2);
    if (stacked) {
      return `<div class="vqc-bd vqc-bd--strip is-stacked">
        <span class="vqc-eyebrow" title="${esc(title)}">${esc(title)}</span>
        <span class="vqc-head">${valueHTML(hl, "vqc-value--sm")}${delta}</span>
        ${when}
      </div>${cardTools(c, link)}`;
    }
    return `<div class="vqc-bd vqc-bd--strip is-inline${tight ? " is-tight-strip" : ""}">
      <span class="vqc-strip-left">
        <span class="vqc-eyebrow" title="${esc(title)}">${esc(title)}</span>
        ${when}
      </span>
      <span class="vqc-head">${valueHTML(hl, "vqc-value--sm")}${delta}</span>
    </div>${cardTools(c, link)}`;
  }
  function bodyTile(c, geo, link) {
    const hl = headlineOf(c);
    const title = titleOf(c);
    return `<div class="vqc-bd vqc-bd--tile">
      ${geo.w > 1 ? `<span class="vqc-label" title="${esc(title)}">${esc(title)}</span>` : ""}
      ${valueHTML(hl, "vqc-value--xs")}
    </div>${cardTools(c, link)}`;
  }
  function titleOf(c) {
    if (isSpecial(c)) return c.title || SPECIAL[c.type].name;
    return readingOf(c.key).label;
  }
  function bodyChartCard(c, geo, link) {
    const title = titleOf(c);
    const rd = readingOf(c.key);
    const shape = String(rd?.shape || "").toUpperCase();
    const hl = headlineOf(c);
    const keys = [c.key, ...c.extraKeys || []];
    const legend = keys.length > 1 && CARTESIAN.has(c.chart) ? `<div class="vqc-leg">${keys.map((k, i) => `<button type="button" class="vqc-leg-i" data-i="${i}">
        <span class="vqc-leg-d" style="background:var(--vq-series-${i % 8 + 1})"></span>${esc(readingOf(k).label)}</button>`).join("")}</div>` : "";
    const selfLabelled = c.chart === "gauge" || c.chart === "ring" || c.chart === "sunburst" || c.chart === "pie" && c.variant === "donut";
    const isList = shape === "RANKING" || shape === "TABLE" || shape === "FEED" || ["table", "list", "feed", "ranking"].includes(c.chart);
    const showHead = c.chart !== "status" && !selfLabelled && !isList;
    const room = geo.h;
    const showWhen = c.showWhen !== false && c.chart !== "status" && !isList && room >= 4;
    const showDelta = c.showDelta !== false && !isList && geo.w >= 2;
    const showPicker = c.showPeriodPicker !== false && PREFS.periodPicker && room >= 2 && geo.w >= 3 && !isList;
    return `<div class="vqc-hd">
      <span class="vqc-eyebrow" title="${esc(title)}">${esc(title)}</span>
      <span class="vqc-hd-r">${showPicker ? periodPicker(c) : ""}${cardTools(c, link)}</span>
    </div>
    <div class="vqc-bd">
      ${showHead ? `<div class="vqc-head">
        ${valueHTML(hl)}
        ${showDelta && hl.pct ? `<span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir, 10)}${hl.pct}</span>` : ""}
      </div>` : ""}
      ${showWhen ? `<p class="vqc-when"${hl.asOf ? ` title="As of ${esc(hl.asOf)}"` : ""}>${esc(hl.when)}</p>` : ""}
      ${isBare(c) ? "" : `<div class="vqc-host" data-chart="${c.chart}"></div>${legend}`}
    </div>`;
  }
  function renderCard(c, cols, colW) {
    const geo = geometryOf(c, cols, colW);
    const link = c.targetUrl || c.link || getDeepLinkForCard(c.key);
    if (isSpecial(c)) {
      const fn = SPECIAL_BODY[c.type];
      return cardFrame(c, {
        geo,
        cols,
        body: fn(c, geo),
        extraClass: `vqc--${c.type.replace(/_/g, "-")} vqc--special vqc--fam-${SPECIAL[c.type].family}`
      });
    }
    const body = geo.cat === "C1" ? bodyTile(c, geo, link) : geo.cat === "C2" ? bodyStrip(c, geo, link) : bodyChartCard(c, geo, link);
    return cardFrame(c, { geo, cols, body, extraClass: `vqc--chart-${c.chart}` });
  }
  let COL_W = 112;
  let RESIZE_T = null, LAST_COLS = 0;
  const HOST_SIZES = /* @__PURE__ */ new WeakMap();
  const HOST_RO = typeof ResizeObserver === "undefined" ? null : new ResizeObserver((entries) => {
    for (const entry of entries) {
      const host = entry.target;
      const w = host.clientWidth, h = host.clientHeight;
      if (w < 20 || h < 16) continue;
      const was = HOST_SIZES.get(host);
      if (was && Math.abs(was.w - w) < 2 && Math.abs(was.h - h) < 2) continue;
      HOST_SIZES.set(host, { w, h });
      const el = host.closest(".vqc");
      const card = el && cardOf(el.dataset.id);
      if (card) mountChart(host, card);
    }
  });
  function resolveCollisions(cards, cols) {
    if (!Array.isArray(cards) || !cards.length) return;
    if (cols >= 12) {
      const occupied = [];
      const usedSlots = /* @__PURE__ */ new Set();
      cards.forEach((c) => {
        const slotNum = Number(c.frameSlot);
        const slot = Number.isFinite(slotNum) && !usedSlots.has(slotNum) ? FRAME_SLOTS.find((s) => Number(s.slot) === slotNum) : null;
        if (slot) {
          usedSlots.add(slotNum);
        }
        let [w, h] = slot ? [Number(slot.w), Number(slot.h)] : sizeOf(c, cols);
        let x = slot ? Number(slot.x) : Number.isInteger(c.gx) ? c.gx : null;
        let y = slot ? Number(slot.y) : Number.isInteger(c.gy) ? c.gy : null;
        const collides = (xx, yy) => occupied.some(
          (o) => xx < o.x + o.w && o.x < xx + w && yy < o.y + o.h && o.y < yy + h
        );
        if (x === null || y === null || collides(x, y)) {
          let testY = y != null ? y : 0;
          let testX = x != null ? Math.max(0, Math.min(cols - w, x)) : 0;
          while (collides(testX, testY)) {
            testX++;
            if (testX + w > cols) {
              testX = 0;
              testY++;
            }
          }
          x = testX;
          y = testY;
          c.gx = x;
          c.gy = y;
          if (slot && (x !== Number(slot.x) || y !== Number(slot.y))) {
            delete c.frameSlot;
          }
        } else {
          c.gx = x;
          c.gy = y;
        }
        occupied.push({ x, y, w, h });
      });
    }
  }
  function renderEmptySlot(slot) {
    const x = Number(slot.x) + 1;
    const y = Number(slot.y) + 1;
    const w = Number(slot.w);
    const h = Number(slot.h);
    return `<div class="vqc vqc--empty-slot" data-slot="${slot.slot}"
    style="grid-column:${x} / span ${w}; grid-row:${y} / span ${h}; --vqw:${w}; --vqh:${h}; min-height:calc(${h} * (var(--vq-unit, 64px) + var(--vq-gap, 16px)) - var(--vq-gap, 16px)); display:flex; align-items:center; justify-content:center; border-radius:var(--vq-radius-card, 16px); border:1.5px dashed var(--vq-line, rgba(255,255,255,0.14)); background:var(--vq-surface-subtle, rgba(255,255,255,0.02)); transition:all 0.2s ease;">
    <button type="button" class="vqc-empty-btn" data-slot="${slot.slot}"
      style="background:none; border:none; font-size:13px; font-weight:600; color:var(--vq-muted, #8b949e); cursor:pointer; display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:8px; transition:all 0.15s ease;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Add a card
    </button>
  </div>`;
  }
  function draw() {
    const board2 = document.getElementById("board");
    if (!board2) return;
    const cols = boardCols(board2);
    COL_W = boardColW(board2);
    LAST_COLS = cols;
    const seenIds = /* @__PURE__ */ new Set();
    CARDS = CARDS.filter((c) => {
      if (!c || !c.id) return false;
      if (seenIds.has(c.id)) return false;
      seenIds.add(c.id);
      return true;
    });
    resolveCollisions(CARDS, cols);
    let emptySlotsHtml = "";
    if (cols >= 12 && Array.isArray(FRAME_SLOTS) && FRAME_SLOTS.length > 0 && !FRAME_DIRTY) {
      const occupiedSlots = /* @__PURE__ */ new Set();
      CARDS.forEach((c) => {
        const s = Number(c.frameSlot);
        if (Number.isFinite(s)) occupiedSlots.add(s);
      });
      const emptySlots = FRAME_SLOTS.filter((s) => !occupiedSlots.has(Number(s.slot)));
      emptySlotsHtml = emptySlots.map(renderEmptySlot).join("");
    }
    HOST_RO?.disconnect();
    const cardsHtml = CARDS.map((c) => renderCard(c, cols)).join("") + emptySlotsHtml;
    board2.innerHTML = cardsHtml || `<p class="board-empty">No cards yet — open <strong>Add card</strong> and pick what you want to see.</p>`;
    const count = document.getElementById("count");
    if (count) count.textContent = CARDS.length;
    board2.querySelectorAll(".vqc--empty-slot").forEach((el) => {
      const slotNum = Number(el.dataset.slot);
      const slot = FRAME_SLOTS.find((s) => Number(s.slot) === slotNum);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof window !== "undefined" && window._vqOpenAddCardForSlot) {
          window._vqOpenAddCardForSlot(slot);
        } else if (typeof window !== "undefined" && window._vqAddCard) {
          window._vqAddCard(0);
        }
      });
    });
    board2.querySelectorAll(".vqc:not(.vqc--empty-slot)").forEach((el) => {
      const c = cardOf(el.dataset.id);
      if (!c) return;
      const host = el.querySelector(".vqc-host");
      if (host) {
        mountChart(host, c);
        HOST_RO?.observe(host);
      }
      el.querySelector(".vqc-edit")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof window !== "undefined" && window._vqEditCard) window._vqEditCard(c.id);
        else openEdit(c.id);
      });
      el.querySelector(".vqc-del")?.addEventListener("click", (e) => {
        e.stopPropagation();
        el.classList.add("is-going");
        setTimeout(() => {
          CARDS = CARDS.filter((x) => x.id !== c.id);
          markFrameDirty();
          if (EDIT === c.id) closeEdit();
          draw();
        }, 200);
      });
      el.querySelectorAll("[data-glass]").forEach((b) => b.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window._vqOpenGlassActions) window._vqOpenGlassActions();
      }));
      el.querySelectorAll(".vqc-leg-i").forEach((btn) => {
        const i = +btn.dataset.i;
        const set = (on) => {
          el.querySelectorAll(".ck-s").forEach((s) => s.classList.toggle("is-dim", on && +s.dataset.i !== i));
          el.querySelectorAll(".vqc-leg-i").forEach((b) => b.classList.toggle("is-dim", on && +b.dataset.i !== i));
        };
        btn.addEventListener("mouseenter", () => set(true));
        btn.addEventListener("mouseleave", () => set(false));
      });
      wireDrag(el, c);
      wireResize(el, c);
      wirePeriod(el, c);
    });
    fitValues(board2);
    renderLibrary();
    persistBoard();
    clearTimeout(RECKONER_FETCH_TIMER);
    RECKONER_FETCH_TIMER = setTimeout(() => {
      queueLiveReadings(CARDS);
    }, 40);
  }
  function relayout() {
    const board2 = document.getElementById("board");
    if (!board2) return;
    if (boardCols(board2) !== LAST_COLS) {
      draw();
      return;
    }
    board2.querySelectorAll(".vqc").forEach((el) => {
      const c = cardOf(el.dataset.id), host = el.querySelector(".vqc-host");
      if (c && host) mountChart(host, c);
    });
    fitValues(board2);
  }
  addEventListener("resize", () => {
    clearTimeout(RESIZE_T);
    RESIZE_T = setTimeout(relayout, 150);
  });
  function wirePeriod(el, c) {
    const box = el.querySelector(".vqc-per");
    if (!box) return;
    const btn = box.querySelector(".vqc-per-b"), menu = box.querySelector(".vqc-per-m");
    const close = () => {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".vqc-per-m").forEach((m) => {
        if (m !== menu) m.hidden = true;
      });
      menu.hidden = !menu.hidden;
      btn.setAttribute("aria-expanded", String(!menu.hidden));
    });
    menu.querySelectorAll(".vqc-per-i").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      c.period = b.dataset.p;
      close();
      queueLiveReadings([c]);
      const host = el.querySelector(".vqc-host");
      el.querySelector(".vqc-per-b").childNodes[0].nodeValue = c.period + " ";
      const hl = headlineOf(c);
      const val = el.querySelector(".vqc-value[data-full]");
      if (val) {
        val.dataset.full = hl.value;
        val.dataset.compact = hl.valueCompact;
      }
      const when = el.querySelector(".vqc-when");
      if (when) when.textContent = when.closest(".vqc-bd--strip") ? c.period : hl.when;
      const deltaEl = el.querySelector(".vqc-delta");
      if (deltaEl) {
        deltaEl.className = `vqc-delta vqc-delta--${hl.dir}`;
        deltaEl.innerHTML = `${ic(hl.dir, 10)}${hl.pct}`;
      }
      fitValues(el);
      persistBoard();
      menu.querySelectorAll(".vqc-per-i").forEach((x) => x.classList.toggle("is-on", x.dataset.p === c.period));
      if (host) {
        host.classList.add("is-swapping");
        setTimeout(() => {
          mountChart(host, c);
          host.classList.remove("is-swapping");
        }, 180);
      }
      if (EDIT === c.id) openEdit(c.id);
    }));
  }
  document.addEventListener("click", () => document.querySelectorAll(".vqc-per-m").forEach((m) => m.hidden = true));
  function wireResize(el, c) {
    const grip = el.querySelector(".vqc-resize");
    if (!grip) return;
    grip.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      grip.setPointerCapture?.(e.pointerId);
      const board2 = document.getElementById("board");
      const cols = boardCols(board2);
      const colW = (board2.clientWidth - GRID.gutter * (cols - 1)) / cols;
      const pitchX = colW + GRID.gutter, pitchY = GRID.unit + GRID.gutter;
      const start = el.getBoundingClientRect();
      const T = fitsTable();
      const cat = c.cat || fitCat(c);
      const [MW, MH] = CAT_MAX[cat] || [12, 16];
      const [floorW, floorH] = minSizeFor(c);
      const capW = Math.min(cols, MW);
      el.classList.add("is-resizing");
      document.body.classList.add("is-reordering");
      const hint = document.createElement("span");
      hint.className = "vqc-size-hint";
      el.appendChild(hint);
      let lastW = 0, lastH = 0;
      const frameSlot = FRAME_SLOTS.find((slot) => Number(slot.slot) === Number(c.frameSlot));
      const is12 = cols >= 12;
      const pinned = is12 && (frameSlot != null || Number.isInteger(c.gx) && Number.isInteger(c.gy));
      const colStart = (frameSlot && is12 ? Number(frameSlot.x) : Number.isInteger(c.gx) ? c.gx : 0) + 1;
      const rowStart = (frameSlot && is12 ? Number(frameSlot.y) : Number.isInteger(c.gy) ? c.gy : 0) + 1;
      const move = (ev) => {
        let w = Math.round((ev.clientX - start.left + GRID.gutter) / pitchX);
        let h = Math.round((ev.clientY - start.top + GRID.gutter) / pitchY);
        w = Math.max(floorW, Math.min(capW, w));
        h = Math.max(floorH, Math.min(MH, h));
        if (!sizeLegal(cat, w, h, T)) {
          const needH = minHeightAt(cat, w, T);
          if (needH != null) h = Math.max(h, needH);
          else {
            const needW = minWidthAt(cat, h, T);
            if (needW != null) w = Math.max(w, needW);
          }
          h = Math.min(h, MH);
          w = Math.min(w, capW);
        }
        if (w === lastW && h === lastH) return;
        lastW = w;
        lastH = h;
        c.w = w;
        c.h = h;
        c.fit = resolveFit(cat, w, h, T) ?? c.fit;
        el.className = el.className.replace(/vq-w\d+/, "vq-w" + w).replace(/vq-h\d+/, "vq-h" + h).replace(/vqc--fit-\d+/, "vqc--fit-" + c.fit);
        el.style.setProperty("--vqw", w);
        el.style.setProperty("--vqh", h);
        el.dataset.w = w;
        el.dataset.h = h;
        if (pinned) {
          el.style.gridColumn = `${colStart} / span ${w}`;
          el.style.gridRow = `${rowStart} / span ${h}`;
        } else {
          el.style.gridColumn = `span ${w}`;
          el.style.gridRow = `span ${h}`;
        }
        const fitName = (T[cat][c.fit] || [])[2];
        hint.textContent = `${w} × ${h}${fitName ? " · " + fitName : ""}`;
        const host = el.querySelector(".vqc-host");
        if (host) mountChart(host, c);
        fitValues(el);
      };
      const up = () => {
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", up);
        el.classList.remove("is-resizing");
        document.body.classList.remove("is-reordering");
        hint.remove();
        delete c.frameSlot;
        markFrameDirty();
        draw();
        if (EDIT === c.id) openEdit(c.id);
      };
      addEventListener("pointermove", move);
      addEventListener("pointerup", up);
    });
  }
  function pinnedOthers(self, cols) {
    return CARDS.filter((o) => o !== self).map((o) => {
      const slot = FRAME_SLOTS.find((s) => Number(s.slot) === Number(o.frameSlot));
      const ox = slot && (cols || 12) >= 12 ? Number(slot.x) : Number.isInteger(o.gx) ? o.gx : null;
      const oy = slot && (cols || 12) >= 12 ? Number(slot.y) : Number.isInteger(o.gy) ? o.gy : null;
      const [ow, oh] = slot && (cols || 12) >= 12 ? [Number(slot.w), Number(slot.h)] : sizeOf(o, cols);
      if (ox === null || oy === null) return null;
      return { x: ox, y: oy, w: ow, h: oh };
    }).filter(Boolean);
  }
  function freeSpot(self, gx, gy, w, h, cols) {
    const others = pinnedOthers(self, cols);
    let x = Math.max(0, Math.min((cols || 12) - w, Number.isInteger(gx) ? gx : 0));
    let y = Math.max(0, Number.isInteger(gy) ? gy : 0);
    const hits = (yy, xx) => others.some((o) => xx < o.x + o.w && o.x < xx + w && yy < o.y + o.h && o.y < yy + h);
    while (hits(y, x)) {
      x++;
      if (x + w > (cols || 12)) {
        x = 0;
        y++;
      }
    }
    return { x, y };
  }
  function beginMove(e0, el, c) {
    e0.preventDefault();
    e0.stopPropagation();
    const board2 = document.getElementById("board");
    if (!board2) return;
    const cols = boardCols(board2);
    const colW = boardColW(board2);
    const pitchX = colW + GRID.gutter, pitchY = GRID.unit + GRID.gutter;
    const [w, h] = sizeOf(c, cols, colW);
    el.classList.add("is-dragging");
    document.body.classList.add("is-reordering");
    const ghost = document.createElement("div");
    ghost.className = "vq-drop-ghost";
    board2.appendChild(ghost);
    let gx = null, gy = null;
    const move = (ev) => {
      const r = board2.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      gx = Math.max(0, Math.min(cols - w, Math.round(x / pitchX - w / 2)));
      gy = Math.max(0, Math.round(y / pitchY - h / 2));
      ghost.style.gridColumn = `${gx + 1} / span ${w}`;
      ghost.style.gridRow = `${gy + 1} / span ${h}`;
      ghost.classList.add("is-on");
    };
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      el.classList.remove("is-dragging");
      document.body.classList.remove("is-reordering");
      ghost.remove();
      if (gx != null && gy != null && cols >= 12) {
        const spot = freeSpot(c, gx, gy, w, h, cols);
        c.gx = spot.x;
        c.gy = spot.y;
        delete c.frameSlot;
        markFrameDirty();
        draw();
      } else if (gx != null) {
        draw();
      }
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
    move(e0);
  }
  function wireDrag(el, c) {
    const grip = el.querySelector(".vqc-grip");
    grip?.addEventListener("pointerdown", (e) => beginMove(e, el, c));
    el.addEventListener("pointerdown", (e) => {
      if (!document.documentElement.classList.contains("vq-editing")) return;
      if (e.button !== 0) return;
      if (e.target.closest(".vqc-act, .vqc-nav-link, .vqc-per, .vqc-resize, a, button, input, .ck-cap")) return;
      beginMove(e, el, c);
    });
  }
  function openEdit(id) {
    EDIT = id;
    const c = cardOf(id);
    if (!c) return;
    const rd = readingOf(c.key);
    const legal = legalFor(c.key);
    const vars = variantsFor(c);
    const p = document.getElementById("edit");
    p.classList.add("is-on");
    const seriesRows = [c.key, ...c.extraKeys].map((k, i) => `
    <div class="ed-ser">
      <span class="ed-ser-d" style="background:var(--vq-series-${i % 8 + 1})"></span>
      <span class="ed-ser-n">${readingOf(k).label}</span>
      <span class="ed-ser-u">${readingOf(k).unit}</span>
      ${i === 0 ? `<span class="ed-ser-b">primary</span>` : `<button class="ed-ser-x" data-drop="${k}" title="Remove series">${ic("x", 12)}</button>`}
    </div>`).join("");
    p.innerHTML = `
    <div class="ed-h"><div>
      <p class="ed-eyebrow">Editing</p>
      <h3 class="ed-t">${c.title || rd.label}</h3>
      <code class="ed-k">${rd.key} · ${rd.shape}</code></div>
      <button class="vqc-act" id="ed-close" aria-label="Close">${ic("x", 13)}</button></div>

    <p class="ed-lab">Name</p>
    <input class="ed-in" id="ed-title" value="${(c.title || rd.label).replace(/"/g, "&quot;")}">

    <p class="ed-lab">Period</p>
    <div class="ed-seg" id="ed-period">${PERIODS.map((x) => `<button class="ed-seg-i" aria-pressed="${x === c.period}" data-p="${x}">${x}</button>`).join("")}</div>

    <p class="ed-lab">Chart</p>
    <div class="ed-chips" id="ed-charts">${legal.map((ch) => `<button class="ed-chip ${ch === c.chart ? "is-on" : ""}" data-ch="${ch}">${CHART_NAME[ch]}</button>`).join("")}</div>

    <p class="ed-lab">Look <span class="ed-sub">${CHART_NAME[c.chart]} variants</span></p>
    <div class="ed-chips" id="ed-vars">${vars.map(([v, n, ok, why]) => `<button class="ed-chip ${v === c.variant ? "is-on" : ""} ${ok ? "" : "is-off"}" ${ok ? "" : "disabled"}
        data-v="${v}" ${ok ? "" : `title="${why}"`}>${n}${ok ? "" : ` · ${why}`}</button>`).join("")}</div>

    <p class="ed-lab">Series ${MULTI_OK.has(c.chart) ? `<span class="ed-sub">compare up to 4</span>` : ""}</p>
    <div class="ed-sers">${seriesRows}</div>
    ${MULTI_OK.has(c.chart) && c.extraKeys.length < 3 ? `
      <div class="ed-add">
        <input class="ed-in ed-in--sm" id="ed-sq" placeholder="Add a series to compare…" autocomplete="off">
        <div class="ed-sug" id="ed-sug" hidden></div>
      </div>` : MULTI_OK.has(c.chart) ? "" : `<p class="ed-note">Switch to a line, area, bar or composed chart to compare more than one reading.</p>`}

    <p class="ed-lab">Size <span class="ed-sub">minimum ${minSizeFor(c)[0]}×${minSizeFor(c)[1]} for a ${CHART_NAME[c.chart].toLowerCase()}</span></p>
    <div class="ed-chips" id="ed-cats">${CATS.map((k) => {
      const ok = fitsFor(c, k).length;
      return `<button class="ed-size ${k === c.cat ? "is-on" : ""} ${ok ? "" : "is-off"}" ${ok ? "" : "disabled"}
        data-cat="${k}" ${ok ? "" : 'title="Too small for this chart"'}>${k} ${CAT_NAME[k]}</button>`;
    }).join("")}</div>
    <div class="ed-chips" id="ed-fits">${fitsFor(c, c.cat).map(([i, w, h, nm]) => `<button class="ed-size ${!c.w && i === c.fit ? "is-on" : ""}" data-fit="${i}">${w}×${h} ${nm}</button>`).join("")}
      ${c.w ? `<button class="ed-size is-on" data-fit="custom">${c.w}×${c.h} custom</button>` : ""}</div>
    <p class="ed-note">Drag a card's bottom-right corner to size it freely — it snaps to the
      grid and stops at the ${minSizeFor(c)[0]}×${minSizeFor(c)[1]} floor.</p>

    <p class="ed-lab">Period control <span class="ed-sub">applies to every card</span></p>
    <div class="ed-chips" id="ed-perpref">
      <button class="ed-chip ${PREFS.periodPicker ? "is-on" : ""}" data-pp="1">Show on cards</button>
      <button class="ed-chip ${PREFS.periodPicker ? "" : "is-on"}" data-pp="0">Hide — set it here</button></div>

    <p class="ed-lab">Emphasis</p>
    <div class="ed-chips" id="ed-acc">
      <button class="ed-chip ${!c.accent ? "is-on" : ""}" data-a="0">Plain</button>
      <button class="ed-chip ${c.accent ? "is-on" : ""}" data-a="1">Accent fill</button></div>
    <p class="ed-note">One accent card per board — setting this clears the others.</p>`;
    const again = (fn) => {
      fn();
      draw();
      openEdit(id);
    };
    p.querySelector("#ed-close").onclick = closeEdit;
    p.querySelector("#ed-title").oninput = (e) => {
      c.title = e.target.value || null;
      draw();
    };
    p.querySelectorAll("#ed-period .ed-seg-i").forEach((b) => b.onclick = () => again(() => c.period = b.dataset.p));
    p.querySelectorAll("#ed-charts .ed-chip").forEach((b) => b.onclick = () => again(() => {
      c.chart = b.dataset.ch;
      c.variant = defaultVariant(c.chart);
      if (!MULTI_OK.has(c.chart)) c.extraKeys = [];
      fixVariant(c);
      resizeForChart(c);
    }));
    p.querySelectorAll("#ed-vars .ed-chip").forEach((b) => b.onclick = () => again(() => {
      c.variant = b.dataset.v;
      resizeForChart(c);
    }));
    p.querySelectorAll("#ed-cats .ed-size").forEach((b) => b.onclick = () => again(() => {
      c.cat = b.dataset.cat;
      c.w = c.h = null;
      clampFit(c);
    }));
    p.querySelectorAll("#ed-fits .ed-size").forEach((b) => b.onclick = () => again(() => {
      if (b.dataset.fit === "custom") return;
      c.w = c.h = null;
      c.fit = +b.dataset.fit;
    }));
    p.querySelectorAll("#ed-perpref .ed-chip").forEach((b) => b.onclick = () => again(() => {
      PREFS.periodPicker = b.dataset.pp === "1";
    }));
    p.querySelectorAll("#ed-acc .ed-chip").forEach((b) => b.onclick = () => again(() => {
      const on = b.dataset.a === "1";
      if (on) CARDS.forEach((x) => x.accent = false);
      c.accent = on;
    }));
    p.querySelectorAll(".ed-ser-x").forEach((b) => b.onclick = () => again(() => {
      c.extraKeys = c.extraKeys.filter((k) => k !== b.dataset.drop);
      fixVariant(c);
      clampFit(c, c.fit);
    }));
    const q = p.querySelector("#ed-sq"), sug = p.querySelector("#ed-sug");
    if (q) {
      q.oninput = () => {
        const t = q.value.trim().toLowerCase();
        if (!t) {
          sug.hidden = true;
          return;
        }
        const hits = READINGS.filter((r) => r.key !== c.key && !c.extraKeys.includes(r.key) && (r.label.toLowerCase().includes(t) || r.key.includes(t))).slice(0, 6);
        sug.hidden = !hits.length;
        sug.innerHTML = hits.map((r) => `<button class="ed-sug-i" data-k="${r.key}">
        <span>${r.label}</span><code>${r.unit}</code></button>`).join("");
        sug.querySelectorAll(".ed-sug-i").forEach((b) => b.onclick = () => again(() => {
          c.extraKeys.push(b.dataset.k);
          clampFit(c, c.fit);
        }));
      };
    }
  }
  function closeEdit() {
    EDIT = null;
    document.getElementById("edit").classList.remove("is-on");
  }
  function renderLibrary() {
    const box = document.getElementById("lib-body");
    if (!box) return;
    const panel = document.getElementById("lib");
    if (panel && !panel.classList.contains("is-on")) return;
    const on = new Set(CARDS.map((c) => c.key));
    const q = LIB_Q.trim().toLowerCase();
    const modulesSet = /* @__PURE__ */ new Set();
    READINGS.forEach((r) => {
      if (r.module) modulesSet.add(r.module);
    });
    const areas = ["All", "Qore", ...Array.from(modulesSet).filter((m) => m !== "Qore").sort()];
    const list = READINGS.filter((r) => {
      if (LIB_AREA !== "All") {
        if (LIB_AREA === "Qore" && r.module !== "Qore") return false;
        if (LIB_AREA !== "Qore" && r.module !== LIB_AREA) return false;
      }
      if (!q) return true;
      return r.label.toLowerCase().includes(q) || r.key.toLowerCase().includes(q) || r.desc && r.desc.toLowerCase().includes(q) || r.insight && r.insight.toLowerCase().includes(q);
    }).sort((a, b) => (b.weight || 50) - (a.weight || 50));
    box.innerHTML = `
    <div class="lib-find">${ic("search", 14)}<input id="lib-q" placeholder="Search ${READINGS.length} cards by name or insight…" value="${LIB_Q.replace(/"/g, "&quot;")}"></div>
    <div class="lib-tabs">${areas.map((a) => `<button class="lib-tab ${a === LIB_AREA ? "is-on" : ""}" data-a="${a}">${a === "Qore" ? "🔒 Qore" : a}</button>`).join("")}</div>
    <div class="lib-list">${list.length ? list.map((r) => `
      <div class="lib-row ${on.has(r.key) ? "is-added" : ""}">
        <span class="lib-row-n">${r.label}</span>
        <span class="lib-row-k">${r.insight || r.desc || r.key}</span>
        <span class="lib-shape">${r.shape}</span>
        <button class="lib-add" data-k="${r.key}" title="${on.has(r.key) ? "Already on dashboard" : "Add card"}">${on.has(r.key) ? ic("check", 13) : ic("plus", 13)}</button>
      </div>`).join("") : `<p class="lib-none">Nothing matches “${LIB_Q}”.</p>`}</div>`;
    const qi = box.querySelector("#lib-q");
    if (qi) {
      qi.oninput = () => {
        LIB_Q = qi.value;
        renderLibrary();
        const el = document.getElementById("lib-q");
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      };
    }
    box.querySelectorAll(".lib-tab").forEach((b) => b.onclick = () => {
      LIB_AREA = b.dataset.a;
      renderLibrary();
    });
    box.querySelectorAll(".lib-add").forEach((b) => b.onclick = () => {
      const c = addCard(b.dataset.k);
      if (c) openEdit(c.id);
    });
  }
  const BOARD_KEY = () => `vq-dashboard-v6:${STORE_SLUG || "default"}`;
  const BOARD_SCHEMA_VERSION = 4;
  let SKIP_LEGACY_SERVER_LAYOUT = false;
  let PERSIST_ON = false;
  function persistBoard() {
    if (!PERSIST_ON || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(BOARD_KEY(), JSON.stringify({ v: BOARD_SCHEMA_VERSION, cards: CARDS }));
    } catch {
    }
  }
  function serverCard(c) {
    if (!c.key || c.type) return null;
    const [w, h] = authoredSizeOf(c);
    const fit = (FITS[c.cat] || [])[c.fit]?.[2];
    return {
      id: /^[0-9a-f-]{32,36}$/i.test(String(c.id || "")) ? c.id : void 0,
      reading_key: c.key,
      chart: { pl: "profit_loss_line", live: "live_line" }[c.chart] || c.chart,
      period: { Today: "today", Week: "this_week", Month: "this_month", Quarter: "this_quarter", Year: "this_year" }[c.period] || "this_month",
      category: c.cat,
      fit,
      w,
      h,
      x: Number.isInteger(c.gx) ? c.gx : null,
      y: Number.isInteger(c.gy) ? c.gy : null,
      frame_slot: Number.isFinite(Number(c.frameSlot)) ? Number(c.frameSlot) : null,
      style: { variant: c.variant, accent: !!c.accent }
    };
  }
  function saveServerLayout() {
    if (!DASHBOARD_ID || typeof axios === "undefined") return;
    clearTimeout(SAVE_LAYOUT_TIMER);
    SAVE_LAYOUT_TIMER = setTimeout(() => {
      const cards = CARDS.map(serverCard).filter(Boolean);
      axios.put(`/api/dashboards/${DASHBOARD_ID}/layout`, { cards, frame_dirty: FRAME_DIRTY }).catch((error) => console.error("[VenQoreCards] Could not save dashboard layout.", error));
    }, 250);
  }
  function markFrameDirty() {
    FRAME_DIRTY = true;
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("vq:frame-dirty", { detail: true }));
    saveServerLayout();
  }
  function setFrame(frameKey, slots) {
    ACTIVE_FRAME = frameKey;
    FRAME_SLOTS = Array.isArray(slots) ? slots : [];
    FRAME_DIRTY = false;
    const oldCards = [...CARDS];
    const usedKeys = /* @__PURE__ */ new Set();
    const newCards = [];
    FRAME_SLOTS.forEach((slot) => {
      let matched = oldCards.find((c) => !usedKeys.has(c.key) && c.cat === slot.category);
      if (!matched) matched = oldCards.find((c) => !usedKeys.has(c.key));
      if (!matched) {
        const availReading = READINGS.find((r) => !usedKeys.has(r.key) && readingAvailable(r));
        if (availReading) {
          matched = {
            id: newId(),
            key: availReading.key,
            chart: legalFor(availReading.key)[0] || "stat",
            period: "Month",
            variant: "spark"
          };
        }
      }
      if (matched) {
        usedKeys.add(matched.key);
        const fitIndex = (FITS[slot.category] || []).findIndex((fit) => fit[2] === slot.fit);
        newCards.push({
          ...matched,
          id: matched.id || newId(),
          frameSlot: Number(slot.slot),
          gx: Number(slot.x),
          gy: Number(slot.y),
          w: Number(slot.w),
          h: Number(slot.h),
          cat: slot.category,
          fit: fitIndex < 0 ? DEFAULT_FIT[slot.category] || 0 : fitIndex,
          accent: Number(slot.slot) === 1
        });
      }
    });
    CARDS = newCards.map(normaliseCard);
    draw();
    if (DASHBOARD_ID && typeof axios !== "undefined") {
      axios.put(`/api/dashboards/${DASHBOARD_ID}`, { frame_key: frameKey }).then(() => axios.get(`/api/dashboards/${DASHBOARD_ID}`)).then((response) => {
        const cards = response?.data?.data?.cards;
        if (!Array.isArray(cards) || !cards.length) return;
        CARDS = availableCards(cards.map((bc) => ({
          id: bc.id || newId(),
          key: bc.reading_key || bc.key,
          chart: chartKey(bc.chart),
          period: { today: "Today", this_week: "Week", this_year: "Year", this_quarter: "Quarter" }[bc.period] || "Month",
          w: bc.w,
          h: bc.h,
          gx: bc.x,
          gy: bc.y,
          cat: bc.category || "C4",
          fit: Math.max(0, (FITS[bc.category] || []).findIndex((fit) => fit[2] === bc.fit)),
          frameSlot: bc.frame_slot,
          variant: bc.style?.variant || defaultVariant(chartKey(bc.chart)),
          accent: !!bc.style?.accent
        }))).map(normaliseCard);
        draw();
      }).catch((error) => console.error("[VenQoreCards] Could not switch dashboard frame.", error));
    }
  }
  function loadBoard() {
    if (typeof localStorage === "undefined") return null;
    try {
      const data = JSON.parse(localStorage.getItem(BOARD_KEY()) || "null");
      if (data && data.v !== BOARD_SCHEMA_VERSION) SKIP_LEGACY_SERVER_LAYOUT = true;
      if (!data || data.v !== BOARD_SCHEMA_VERSION || !Array.isArray(data.cards) || !data.cards.length) return null;
      return availableCards(data.cards.filter((c) => c && (c.type ? SPECIAL[c.type] : true)));
    } catch {
      return null;
    }
  }
  function availableCards(cards) {
    return (cards || []).filter((c) => c && (c.type ? specialAvailable(c.type) : READINGS.some((r) => r.key === c.key) && readingAvailable(readingOf(c.key))));
  }
  function boot(frameKey) {
    CARDS = [];
    EDIT = null;
    SKIP_LEGACY_SERVER_LAYOUT = false;
    PERSIST_ON = false;
    if (frameKey && FRAME_SLOTS.length) {
      setFrame(frameKey, FRAME_SLOTS);
    } else {
      const saved = loadBoard();
      if (saved) {
        let maxSeq = 0;
        saved.forEach((c) => {
          const m = /^c(\d+)$/.exec(c.id || "");
          if (m) maxSeq = Math.max(maxSeq, +m[1]);
        });
        SEQ = maxSeq;
        CARDS = saved.map((c) => normaliseCard(c));
        draw();
      } else if (typeof axios !== "undefined") {
        axios.get("/api/dashboards").then((res) => {
          const list = res?.data?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const activeBoard = list.find((b) => b.is_default) || list[0];
            if (!SKIP_LEGACY_SERVER_LAYOUT && activeBoard && Array.isArray(activeBoard.cards) && activeBoard.cards.length > 0) {
              const backendCards = activeBoard.cards.map((bc) => ({
                id: bc.id || newId(),
                key: bc.reading_key || bc.key,
                chart: chartKey(bc.chart),
                period: { today: "Today", this_week: "Week", this_year: "Year", this_quarter: "Quarter" }[bc.period] || "Month",
                w: bc.w,
                h: bc.h,
                gx: bc.x,
                gy: bc.y,
                frameSlot: bc.frame_slot,
                cat: bc.category || "C4",
                fit: bc.fit || 0,
                type: bc.type,
                variant: bc.variant || defaultVariant(chartKey(bc.chart))
              }));
              CARDS = availableCards(backendCards).map(normaliseCard);
              DASHBOARD_ID = activeBoard.id || DASHBOARD_ID;
              ACTIVE_FRAME = activeBoard.frame_key || ACTIVE_FRAME;
              FRAME_DIRTY = !!activeBoard.frame_dirty;
              draw();
            }
          }
        }).catch(() => {
        });
      }
    }
    PERSIST_ON = true;
    persistBoard();
    const libOpenBtn = document.getElementById("lib-open");
    if (libOpenBtn) {
      libOpenBtn.onclick = () => {
        document.getElementById("lib")?.classList.add("is-on");
        document.getElementById("lib-q")?.focus();
      };
    }
    const libCloseBtn = document.getElementById("lib-close");
    if (libCloseBtn) {
      libCloseBtn.onclick = () => document.getElementById("lib")?.classList.remove("is-on");
    }
  }
  window.VenQoreCards = {
    engineVersion: ENGINE_VERSION,
    getCards: () => CARDS,
    setCards: (newCards) => {
      CARDS = newCards.map(normaliseCard);
      draw();
    },
    addCardObject: (card) => {
      CARDS.push(normaliseCard(card));
      draw();
      return card;
    },
    updateCard: (id, patch) => {
      const c = cardOf(id);
      if (!c) return null;
      Object.assign(c, patch);
      normaliseCard(c);
      draw();
      return c;
    },
    getReadings: () => READINGS,
    getAvailableReadings: () => availableReadings(),
    setReadings: (newReadings) => {
      if (Array.isArray(newReadings)) {
        READINGS = prepareReadings(newReadings);
        if (typeof window !== "undefined") window.__VENQORE_READINGS__ = newReadings;
        draw();
      }
    },
    setLayoutLaw: (law) => {
      if (setLayoutLaw(law)) draw();
    },
    setFrame,
    getFrame: () => ACTIVE_FRAME,
    isFrameDirty: () => FRAME_DIRTY,
    getCats: () => CATS,
    getCatNames: () => CAT_NAME,
    getCatDescs: () => CAT_DESC,
    getCatMax: () => CAT_MAX,
    getFits: () => FITS,
    getSpecialFits: () => FITS,
    getSpecials: () => SPECIAL,
    getLegalCharts: () => LEGAL,
    getChartNames: () => CHART_NAME,
    getVariants: () => VARIANTS,
    getVariantsFor: (card) => variantsFor(normaliseCard({ ...card })),
    getShortcutIcons: () => Object.keys(SHORTCUT_ICONS),
    iconMarkup: (n, s) => shortcutIcon(n, s || 18),
    /* the Layout Law, as the UI needs it */
    sizesFor,
    presetsFor,
    sizeLegal,
    resolveFit,
    minHeightAt,
    minWidthAt,
    catFloor,
    catsFor: (card) => catsFor(normaliseCard({ ...card })),
    geometryOf: (card, cols, colW) => geometryOf(normaliseCard({ ...card }), cols, colW),
    boardCols,
    fitsTable: (card) => fitsTable(),
    isSpecial,
    minSizeFor: (card) => minSizeFor(normaliseCard({ ...card })),
    fitCat: (card) => fitCat(normaliseCard({ ...card })),
    sizeOf,
    authoredSizeOf,
    getReadingOf: readingOf,
    getHeadlineOf: headlineOf,
    renderCard,
    /* the Law's own column width — the preview draws at it rather than at
       whatever the board behind the modal happens to be showing */
    REFERENCE_COL_W: 112,
    mountChart,
    draw,
    relayout,
    openEdit,
    closeEdit,
    addCard,
    boot,
    setStoreSlug: (s) => {
      if (STORE_SLUG && STORE_SLUG !== s) clearReckonerDataCache();
      STORE_SLUG = s || "";
    },
    clearCache: clearReckonerDataCache,
    deepLinkFor: getDeepLinkForCard,
    catForSize: (card, w, h) => catForSize(normaliseCard({ ...card }), w, h),
    fitValues,
    setEnabledModules,
    specialAvailable,
    destinationName,
    titleOf,
    getPrefs: () => PREFS,
    setPref: (k, v) => {
      PREFS[k] = v;
      draw();
    },
    openGlassActions: () => {
      if (window._vqOpenGlassActions) window._vqOpenGlassActions();
    }
  };
  function normaliseCard(c) {
    if (!c) return c;
    if (!c.id) c.id = newId();
    if (isSpecial(c)) {
      const S = SPECIAL[c.type];
      if (!c.cat || !S.cats.includes(c.cat)) c.cat = S.cat;
    } else {
      if (!c.chart) c.chart = legalFor(c.key)[0];
      if (!c.variant) c.variant = defaultVariant(c.chart);
      if (!Array.isArray(c.extraKeys)) c.extraKeys = [];
      if (!c.period) c.period = "Month";
      if (!c.cat || !FITS[c.cat] || !fitsFor(c, c.cat).length) c.cat = fitCat(c);
      if (c.chart === "stat") {
        const chartless = c.cat === "C1" || c.cat === "C2";
        if (chartless && c.variant !== "number") c.variant = "number";
        if (!chartless && c.variant === "number") c.variant = "spark";
      }
      fixVariant(c);
    }
    if (!Number.isInteger(c.gx) || !Number.isInteger(c.gy) || c.gx < 0 || c.gy < 0 || c.gx > 11) {
      delete c.gx;
      delete c.gy;
    }
    if (c.tone == null) c.tone = c.accent ? "accent" : "surface";
    if (c.tone === "accent") c.accent = true;
    const g = geometryOf(c, 24);
    c.cat = g.cat;
    c.fit = g.fit;
    if (c.w || c.h) {
      c.w = g.authoredW;
      c.h = g.authoredH;
    }
    return c;
  }
  STORE_SLUG = opts && opts.storeSlug || "";
  setEnabledModules(opts && opts.modules);
  boot();
  const board = document.getElementById("board");
  if (board && typeof ResizeObserver !== "undefined") {
    let timer = null, lastW = board.clientWidth;
    const ro = new ResizeObserver(() => {
      if (Math.abs(board.clientWidth - lastW) < 2) return;
      lastW = board.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(relayout, 90);
    });
    ro.observe(board);
  }
}
const CARD_TONES = [
  {
    id: "surface",
    name: "Default Surface",
    desc: "Follows the page theme",
    swatchBg: "var(--vq-surface, #ffffff)"
  },
  {
    id: "accent",
    name: "Mint Accent",
    desc: "Teal brand gradient",
    swatchBg: "linear-gradient(135deg, #0baa8f, #076b5e)"
  },
  {
    id: "ink",
    name: "Obsidian Ink",
    desc: "Always dark, both themes",
    swatchBg: "#0d1412"
  },
  {
    id: "mesh",
    name: "Aurora Mesh",
    desc: "Teal / sky gradient mesh",
    swatchBg: "radial-gradient(circle at 100% 0%, #93ebd6 0%, #8fd9f5 100%)"
  }
];
const OPERATIONAL_TEMPLATES = [
  {
    type: "action_hub",
    title: "Quick Operations Hub",
    category: "Operations",
    desc: "Action buttons for your daily flow — shows more of them as you make the card bigger.",
    tone: "ink"
  },
  {
    type: "launchpad",
    title: "Launchpad",
    category: "Operations",
    desc: "Your four essentials — Point of Sale, New Invoice, Add Product, Purchase Order. Always the same four, at any size.",
    tone: "surface"
  },
  {
    type: "bank_liquidity",
    title: "Bank & Liquid Net Balances",
    category: "Finance",
    desc: "Live breakdown of bank accounts, cash drawer holdings and total liquid net balance.",
    tone: "surface"
  },
  {
    type: "alerts_hub",
    title: "Actions Required & Alerts",
    category: "Operations",
    desc: "Operational alerts — low-stock reorders, overdue receivables, warehouse receipts. Shows more rows as the card grows.",
    tone: "surface"
  },
  {
    type: "growth_engine",
    title: "Growth Engine & Target Pace",
    category: "Sales",
    desc: "Revenue velocity, target progress and repeat-customer retention.",
    tone: "surface"
  }
];
const SHORTCUT_TARGETS = [
  { label: "Point of Sale", path: "/pos", absolute: true, icon: "cart", color: "#0baa8f" },
  { label: "Create New Invoice", path: "/sales", icon: "file", color: "#2ba5d1" },
  { label: "Inventory & Stock List", path: "/inventory", icon: "box", color: "#8ccb2e" },
  { label: "Create Purchase Order", path: "/purchase-orders", icon: "truck", color: "#f26a47" },
  { label: "Accounts & Ledgers", path: "/finance", icon: "dollar", color: "#5227ff" },
  { label: "Parties & Customers", path: "/parties", icon: "users", color: "#e0b4e0" },
  { label: "Business Intel Reports", path: "/reports", icon: "chart", color: "#f5b32e" },
  { label: "Settings", path: "/settings", icon: "settings", color: "#7b8a83" }
];
const SHORTCUT_COLORS = [
  "#0baa8f",
  "#2ba5d1",
  "#5227ff",
  "#8c4bd6",
  "#c2417a",
  "#f26a47",
  "#b8860b",
  "#4c5f57"
];
const SHORTCUT_ICON_NAMES = ["cart", "file", "box", "truck", "dollar", "users", "chart", "bolt", "plus", "settings"];
const PERIOD_LABELS = ["Today", "Week", "Month", "Quarter", "Year"];
const catMaxFromLaw = (law) => Object.fromEntries(Object.entries(law?.categories || {}).filter(([key]) => /^C\d+$/.test(key)).map(([key, category]) => [key, [Number(category.max.w), Number(category.max.h)]]));
function SizeGlyph({ w, h, max = [12, 16] }) {
  const [MW, MH] = max;
  const BOX = 46, BOXH = 30, PAD = 0.75;
  const cw = (BOX - PAD * 2) / MW, ch = (BOXH - PAD * 2) / MH;
  const fw = Math.max(3, Math.min(BOX - PAD * 2, w * cw));
  const fh = Math.max(3, Math.min(BOXH - PAD * 2, h * ch));
  return /* @__PURE__ */ jsxs("svg", { className: "vq-size-glyph", width: BOX, height: BOXH, viewBox: `0 0 ${BOX} ${BOXH}`, "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx(
      "rect",
      {
        x: PAD / 2,
        y: PAD / 2,
        width: BOX - PAD,
        height: BOXH - PAD,
        rx: "3",
        fill: "none",
        stroke: "currentColor",
        strokeOpacity: ".22",
        strokeDasharray: "2.5 2.5"
      }
    ),
    /* @__PURE__ */ jsx(
      "rect",
      {
        x: PAD,
        y: PAD,
        width: fw,
        height: fh,
        rx: "2.5",
        fill: "currentColor",
        fillOpacity: ".85"
      }
    )
  ] });
}
const isReadingCardIdx = (i) => i === 0;
const PANEL_DESIGNS = [
  {
    id: "v6_cockpit",
    name: "VenQore V6 Cockpit",
    desc: "The complete pre-V6 financial sidebar — Total balance, instant action buttons, cash in hand with detail modal, stock valuation, bank accounts, and live activity feed.",
    rails: ["v6_cockpit"]
  },
  {
    id: "classic_panel",
    name: "Classic Right Panel",
    desc: "The original dashboard right panel with quick action icons, cash balance, and live ledger feed.",
    rails: ["classic_panel"]
  },
  {
    id: "dark_hub",
    name: "Dark hub",
    desc: "Deep ink panel with teal mesh — the pre-V6 look, as a standalone dark sidebar.",
    rails: ["v6_cockpit"]
  },
  {
    id: "money",
    name: "Money desk",
    desc: "The classic panel — action buttons, cash & accounts, live activity.",
    rails: ["v6_cockpit"]
  },
  {
    id: "operations",
    name: "Operations desk",
    desc: "What needs doing — alerts, today's numbers, quick actions.",
    rails: ["alerts", "today", "quick_actions"]
  },
  {
    id: "sales",
    name: "Sales pulse",
    desc: "Today at a glance, best sellers and the live feed.",
    rails: ["today", "top_lists", "activity"]
  },
  {
    id: "credit",
    name: "Credit control",
    desc: "Who owes you — reminders, cash & accounts, activity.",
    rails: ["reminders", "balances", "activity"]
  },
  {
    id: "growth",
    name: "Growth",
    desc: "Targets, velocity and your best performers.",
    rails: ["targets", "top_lists"]
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Just quick actions and today's numbers.",
    rails: ["quick_actions", "today"]
  }
];
const RAIL_DEFS = [
  {
    id: "v6_cockpit",
    name: "VenQore V6 Financial Cockpit",
    modules: ["bank_accounts", "pos"],
    desc: "Total balance, instant action buttons, cash in hand, stock value, bank accounts and expanded activity."
  },
  {
    id: "classic_panel",
    name: "Classic Right Panel",
    modules: ["bank_accounts"],
    desc: "Original right panel with quick actions, cash balance, and activity feed."
  },
  {
    id: "action_trio",
    name: "Action buttons",
    modules: [],
    desc: "Sale, purchase and more actions — one tap each."
  },
  {
    id: "balances",
    name: "Cash & accounts",
    modules: ["bank_accounts"],
    desc: "Cash in hand, every bank account, and the liquid total."
  },
  {
    id: "today",
    name: "Today at a glance",
    modules: [],
    desc: "Today's sales, expenses and money in / out, in four numbers."
  },
  {
    id: "activity",
    name: "Recent activity",
    modules: [],
    desc: "The latest sales, purchases and payments as they happen."
  },
  {
    id: "alerts",
    name: "Actions required",
    modules: [],
    desc: "Low stock, overdue dues, waiting orders — everything needing someone."
  },
  {
    id: "quick_actions",
    name: "Quick actions",
    modules: [],
    desc: "One-tap buttons for the things you do all day."
  },
  {
    id: "targets",
    name: "Growth & targets",
    modules: ["reports", "ai_insights"],
    desc: "Monthly target pace, revenue velocity and repeat customers."
  },
  {
    id: "top_lists",
    name: "Top performers",
    modules: ["pos", "invoicing"],
    desc: "Best-selling products and biggest customers this month."
  },
  {
    id: "reminders",
    name: "Payment reminders",
    modules: ["khata_credit"],
    desc: "Who to chase today, with amounts and how overdue they are."
  }
];
function DashRail({
  id,
  storePath,
  onQuickActions,
  enabledModules = [],
  cashData = null,
  bankAccounts = [],
  cashAccounts = [],
  recentTransactions = [],
  topSellingItems = [],
  lowStockItems = [],
  performance = {},
  currencySymbol = "Rs",
  isDemo = false,
  debtors = [],
  hasPermission = () => false,
  auth = {}
}) {
  const modOk = (mods) => !enabledModules.length || !mods || !mods.length || mods.some((m) => enabledModules.includes(m));
  if (id === "v6_cockpit") {
    if (!hasPermission("finance.balances")) return null;
    return /* @__PURE__ */ jsx(
      V6FinancialSidebar,
      {
        recentTransactions,
        bankAccounts,
        cashAccounts,
        cashData,
        inventoryValue: performance?.stock_value || 0,
        sticky: false,
        onQuickActions,
        className: "w-full h-full"
      }
    );
  }
  if (id === "classic_panel") {
    if (!hasPermission("finance.balances")) return null;
    return /* @__PURE__ */ jsx(
      RightPanel,
      {
        recentTransactions,
        bankAccounts,
        cashAccounts,
        cashData,
        inventoryValue: performance?.stock_value || 0,
        sticky: false
      }
    );
  }
  if (id === "action_trio") {
    const canPos = hasPermission("pos.checkout") || hasPermission("pos.open_session");
    const canSale = canPos || hasPermission("sales.create") || hasPermission("invoices.create");
    const canPurchase = hasPermission("purchases.create") || hasPermission("purchases.view");
    return /* @__PURE__ */ jsx("section", { className: "vq-rail-card vq-rail-card--trio", children: /* @__PURE__ */ jsxs("div", { className: "vq-rail-trio", children: [
      canSale && /* @__PURE__ */ jsxs("a", { href: canPos ? storePath("/pos") : storePath("/sales"), className: "vq-trio-btn is-sale", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-trio-ic", children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx("path", { d: "M12 19V5" }),
          /* @__PURE__ */ jsx("path", { d: "m5 12 7 7 7-7" })
        ] }) }),
        /* @__PURE__ */ jsx("span", { children: canPos ? "POS" : "Sale" })
      ] }),
      canPurchase && /* @__PURE__ */ jsxs("a", { href: storePath("/purchase-orders"), className: "vq-trio-btn is-purchase", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-trio-ic", children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx("path", { d: "M12 5v14" }),
          /* @__PURE__ */ jsx("path", { d: "m19 12-7-7-7 7" })
        ] }) }),
        /* @__PURE__ */ jsx("span", { children: "Purchase" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-trio-btn is-actions", onClick: onQuickActions, children: [
        /* @__PURE__ */ jsx("span", { className: "vq-trio-ic", children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", children: [
          /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
          /* @__PURE__ */ jsx("path", { d: "M12 5v14" })
        ] }) }),
        /* @__PURE__ */ jsx("span", { children: "Actions" })
      ] })
    ] }) });
  }
  if (id === "balances") {
    if (!hasPermission("finance.balances")) return null;
    const allAccounts = [
      ...cashAccounts.map((a) => ({ n: a.name || "Cash", v: `${currencySymbol} ${(a.current_balance ?? 0).toLocaleString()}` })),
      ...bankAccounts.map((a) => ({ n: a.name || a.bank_name || "Bank", v: `${currencySymbol} ${(a.current_balance ?? 0).toLocaleString()}` }))
    ];
    const totalLiquid = [
      ...(cashAccounts || []).map((a) => a.current_balance ?? 0),
      ...(bankAccounts || []).map((a) => a.current_balance ?? 0)
    ].reduce((s, v) => s + v, 0);
    const cashBalance = cashData?.balance ?? 0;
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Cash & accounts" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/finance"), className: "vq-rail-link", children: "Open" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-hero", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-rail-hero-l", children: "Cash in hand" }),
        /* @__PURE__ */ jsxs("span", { className: "vq-rail-hero-v", children: [
          currencySymbol,
          " ",
          cashBalance.toLocaleString()
        ] }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-hero-s", children: "GL cash account" })
      ] }),
      allAccounts.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: allAccounts.map((a) => /* @__PURE__ */ jsxs("li", { className: "vq-rail-row", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-rail-row-n", children: a.n }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-row-v", children: a.v })
      ] }, a.n)) }) : /* @__PURE__ */ jsx("p", { className: "vq-rail-empty", children: "No bank accounts added yet" }),
      allAccounts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "vq-rail-total", children: [
        /* @__PURE__ */ jsx("span", { children: "Total liquid" }),
        /* @__PURE__ */ jsxs("strong", { children: [
          currencySymbol,
          " ",
          totalLiquid.toLocaleString()
        ] })
      ] })
    ] });
  }
  if (id === "today") {
    const canSeeFinance = hasPermission("finance.balances") || hasPermission("reports.summary") || hasPermission("reports.financial");
    const canSeeSales = canSeeFinance || hasPermission("sales.view") || hasPermission("reports.sales");
    const canSeeExpenses = canSeeFinance || hasPermission("finance.expenses") || hasPermission("expenses.view");
    if (!canSeeFinance && !canSeeSales && !canSeeExpenses) return null;
    const today = performance?.Today || {};
    const sales = today?.sales ?? 0;
    const expenses = today?.expenses ?? 0;
    const moneyIn = today?.money_in ?? 0;
    const moneyOut = today?.money_out ?? 0;
    const fmt = (v) => typeof v === "number" && !isNaN(v) ? `${currencySymbol} ${Math.round(v).toLocaleString()}` : "—";
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsx("header", { className: "vq-rail-h", children: /* @__PURE__ */ jsx("span", { children: "Today at a glance" }) }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-minigrid", children: [
        canSeeSales && /* @__PURE__ */ jsxs("div", { className: "vq-rail-mini", children: [
          /* @__PURE__ */ jsx("span", { children: "Sales" }),
          /* @__PURE__ */ jsx("strong", { children: fmt(sales) })
        ] }),
        canSeeExpenses && /* @__PURE__ */ jsxs("div", { className: "vq-rail-mini", children: [
          /* @__PURE__ */ jsx("span", { children: "Expenses" }),
          /* @__PURE__ */ jsx("strong", { children: fmt(expenses) })
        ] }),
        canSeeFinance && /* @__PURE__ */ jsxs("div", { className: "vq-rail-mini", children: [
          /* @__PURE__ */ jsx("span", { children: "Money in" }),
          /* @__PURE__ */ jsx("strong", { children: fmt(moneyIn) })
        ] }),
        canSeeFinance && /* @__PURE__ */ jsxs("div", { className: "vq-rail-mini", children: [
          /* @__PURE__ */ jsx("span", { children: "Money out" }),
          /* @__PURE__ */ jsx("strong", { children: fmt(moneyOut) })
        ] })
      ] })
    ] });
  }
  if (id === "activity") {
    if (!hasPermission("finance.transactions")) return null;
    const txList = recentTransactions.slice(0, 5);
    const kindClass = (t) => ({ sale: "in", payment_in: "in", purchase: "out", expense: "out", payment_out: "out", return: "warn" })[t] || "info";
    const handleTxClick = (a) => {
      if (!a.reference_id) return;
      if (a.activityType === "sale" || a.activityType === "return" || a.reference_type === "sale") {
        window.location.href = storePath(`/sales/${a.reference_id}`);
      } else if (a.activityType === "purchase" || a.reference_type === "purchase") {
        window.location.href = storePath("/purchase-orders");
      } else if (a.activityType === "expense" || a.reference_type === "expense") {
        window.location.href = storePath("/expenses");
      } else if (a.activityType === "payment_in" || a.activityType === "payment_out") {
        window.location.href = storePath("/funds");
      }
    };
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Recent activity" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/reports"), className: "vq-rail-link", children: "All" })
      ] }),
      txList.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: txList.map((a, i) => /* @__PURE__ */ jsxs(
        "li",
        {
          className: "vq-rail-row",
          style: { cursor: a.reference_id ? "pointer" : "default" },
          onClick: () => handleTxClick(a),
          title: a.description || a.reference_id || a.type,
          children: [
            /* @__PURE__ */ jsx("span", { className: `vq-rail-dot is-${kindClass(a.activityType)}`, "aria-hidden": "true" }),
            /* @__PURE__ */ jsxs("span", { className: "vq-rail-row-n", children: [
              a.type,
              " ",
              a.reference_id ? /* @__PURE__ */ jsxs("span", { style: { opacity: 0.65, fontWeight: "normal", fontSize: "11px" }, children: [
                "(",
                a.reference_id,
                ")"
              ] }) : "",
              /* @__PURE__ */ jsx("em", { children: a.time })
            ] }),
            /* @__PURE__ */ jsx("span", { className: `vq-rail-row-v is-${kindClass(a.activityType)}`, children: a.amount })
          ]
        },
        a.id || i
      )) }) : /* @__PURE__ */ jsx("p", { className: "vq-rail-empty", children: "No activity yet today" })
    ] });
  }
  if (id === "alerts") {
    if (!hasPermission("inventory.view")) return null;
    const alerts = [];
    if (lowStockItems.length > 0) {
      alerts.push({ k: "warn", mods: ["inventory"], msg: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("strong", { children: [
          lowStockItems.length,
          " products"
        ] }),
        " low on stock"
      ] }), href: "/inventory" });
    }
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsx("header", { className: "vq-rail-h", children: /* @__PURE__ */ jsx("span", { children: "Actions required" }) }),
      alerts.filter((a) => modOk(a.mods)).length > 0 ? /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: alerts.filter((a) => modOk(a.mods)).map((a, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", { href: storePath(a.href), className: `vq-rail-alert is-${a.k}`, children: [
        /* @__PURE__ */ jsx("span", { className: "vq-rail-dot", "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-alert-m", children: a.msg })
      ] }) }, i)) }) : /* @__PURE__ */ jsx("p", { className: "vq-rail-empty", children: "No actions required" })
    ] });
  }
  if (id === "quick_actions") {
    const canPos = hasPermission("pos.checkout") || hasPermission("pos.open_session");
    const canInvoice = hasPermission("sales.create") || hasPermission("invoices.create");
    const canPurchase = hasPermission("purchases.create") || hasPermission("purchases.view");
    const canApprovals = hasPermission("approvals.submit") || hasPermission("approvals.view_own");
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsx("header", { className: "vq-rail-h", children: /* @__PURE__ */ jsx("span", { children: "Quick actions" }) }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-actions", children: [
        canPos && /* @__PURE__ */ jsxs("a", { href: storePath("/pos"), className: "vq-rail-act is-primary", children: [
          /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx("rect", { width: "18", height: "14", x: "3", y: "3", rx: "2" }),
            /* @__PURE__ */ jsx("line", { x1: "3", x2: "21", y1: "9", y2: "9" }),
            /* @__PURE__ */ jsx("line", { x1: "9", x2: "9.01", y1: "13", y2: "13" }),
            /* @__PURE__ */ jsx("line", { x1: "15", x2: "15.01", y1: "13", y2: "13" })
          ] }),
          /* @__PURE__ */ jsx("span", { children: "POS Register" })
        ] }),
        canInvoice && !canPos && /* @__PURE__ */ jsxs("a", { href: storePath("/sales"), className: "vq-rail-act is-primary", children: [
          /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
            /* @__PURE__ */ jsx("polyline", { points: "14 2 14 8 20 8" }),
            /* @__PURE__ */ jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" })
          ] }),
          /* @__PURE__ */ jsx("span", { children: "New Invoice" })
        ] }),
        canPurchase && /* @__PURE__ */ jsxs("a", { href: storePath("/purchase-orders"), className: "vq-rail-act", children: [
          /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx("path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" }),
            /* @__PURE__ */ jsx("path", { d: "M3 6h18" }),
            /* @__PURE__ */ jsx("path", { d: "M16 10a4 4 0 0 1-8 0" })
          ] }),
          /* @__PURE__ */ jsx("span", { children: "New Purchase" })
        ] }),
        canApprovals && !canPurchase && /* @__PURE__ */ jsxs("a", { href: storePath("/approvals"), className: "vq-rail-act", children: [
          /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx("path", { d: "M9 11l3 3L22 4" }),
            /* @__PURE__ */ jsx("path", { d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" })
          ] }),
          /* @__PURE__ */ jsx("span", { children: "My Approvals" })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-rail-act", onClick: onQuickActions, children: [
          /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
            /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "1" }),
            /* @__PURE__ */ jsx("circle", { cx: "19", cy: "12", r: "1" }),
            /* @__PURE__ */ jsx("circle", { cx: "5", cy: "12", r: "1" })
          ] }),
          /* @__PURE__ */ jsx("span", { children: "More actions" })
        ] })
      ] })
    ] });
  }
  if (id === "targets") {
    if (!hasPermission("reports.performance") && !hasPermission("reports.summary") && !hasPermission("finance.balances")) return null;
    const monthlyRev = performance?.Month?.sales || 0;
    const targetRev = 3e5;
    const pacePct = Math.min(100, Math.round(monthlyRev / targetRev * 100));
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Growth & targets" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/reports"), className: "vq-rail-link", children: "Open" })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "vq-rail-sub", children: [
        "Monthly Revenue Target (",
        pacePct,
        "%)"
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { padding: "8px 12px 14px" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }, children: [
          /* @__PURE__ */ jsxs("span", { children: [
            currencySymbol,
            " ",
            monthlyRev.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxs("span", { style: { opacity: 0.65 }, children: [
            "Target: ",
            currencySymbol,
            " ",
            targetRev.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: { width: `${pacePct}%`, height: "100%", background: "#3b82f6", borderRadius: "3px" } }) })
      ] })
    ] });
  }
  if (id === "top_lists") {
    if (!hasPermission("reports.performance") && !hasPermission("reports.summary") && !hasPermission("sales.view")) return null;
    const topMax = topSellingItems[0]?.net_revenue ?? 0;
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Top performers" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/reports"), className: "vq-rail-link", children: "Open" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "vq-rail-sub", children: "Products this month" }),
      topSellingItems.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: topSellingItems.slice(0, 5).map((t) => /* @__PURE__ */ jsxs("li", { className: "vq-rail-rank", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-rail-row-n", children: t.name }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-track", children: /* @__PURE__ */ jsx("i", { style: { width: `${topMax > 0 ? Math.round(t.net_revenue / topMax * 100) : 0}%` } }) }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-row-v", children: t.revenue })
      ] }, t.id)) }) : /* @__PURE__ */ jsx("p", { className: "vq-rail-empty", children: "No sales yet this month" })
    ] });
  }
  if (id === "reminders") {
    if (!hasPermission("finance.balances")) return null;
    const debtorsList = debtors && debtors.length > 0 ? debtors : DASHBOARD_RUNTIME_DATA?.debtors || [];
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Payment reminders" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/customers"), className: "vq-rail-link", children: "All" })
      ] }),
      debtorsList.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: debtorsList.map((d) => /* @__PURE__ */ jsxs("li", { className: "vq-rail-row", children: [
        /* @__PURE__ */ jsxs("span", { className: "vq-rail-row-n", children: [
          d.name,
          /* @__PURE__ */ jsx("em", { children: d.phone })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-row-v is-warn", children: d.balance })
      ] }, d.id)) }) : /* @__PURE__ */ jsx("p", { className: "vq-rail-empty", children: "No overdue payments" })
    ] });
  }
  return null;
}
function NewDashboard(props) {
  const containerRef = useRef(null);
  const previewRef = useRef(null);
  const previewFrameRef = useRef(null);
  const previewHandleRef = useRef(null);
  const pageProps = usePage()?.props || {};
  const store = props?.store || pageProps.store || { name: "VenQore Main Outlet", currency_symbol: "Rs", slug: "" };
  const auth = props?.auth || pageProps.auth || {};
  auth?.user || {};
  const settings = props?.settings || {};
  const isDemo = props?.is_demo === true;
  const cashData = props?.cashData || null;
  const bankAccounts = props?.bankAccounts || [];
  const cashAccounts = props?.cashAccounts || [];
  const recentTransactions = props?.recentTransactions || [];
  const topSellingItems = props?.topSellingItems || [];
  const lowStockItems = props?.lowStockItems || [];
  const performance = props?.performance || {};
  const debtors = props?.debtors || [];
  DASHBOARD_RUNTIME_DATA = {
    cashData,
    bankAccounts,
    cashAccounts,
    recentTransactions,
    topSellingItems,
    lowStockItems,
    performance,
    debtors
  };
  const readingsProp = props?.readings || null;
  const layoutLawProp = props?.layoutLaw || null;
  const frames = Array.isArray(props?.frames) ? props.frames : [];
  const [activeFrameKey, setActiveFrameKey] = useState(props?.activeFrame || "classic");
  const [frameDirty, setFrameDirty] = useState(!!props?.frameDirty);
  if (typeof window !== "undefined" && Array.isArray(readingsProp)) {
    window.__VENQORE_READINGS__ = readingsProp;
  }
  if (typeof window !== "undefined" && layoutLawProp) {
    window.__VENQORE_LAYOUT_LAW__ = layoutLawProp;
  }
  const [seniorMode, setSeniorMode] = useState(() => String(settings?.senior_mode) === "1");
  useEffect(() => {
    setSeniorMode(String(settings?.senior_mode) === "1");
  }, [settings?.senior_mode]);
  useEffect(() => {
    let posSeniorOverride = null;
    try {
      const raw = sessionStorage.getItem("pos_senior_mode");
      if (raw !== null) posSeniorOverride = JSON.parse(raw);
    } catch (_) {
    }
    const isSenior = posSeniorOverride !== null ? posSeniorOverride : seniorMode;
    const fontSize = isSenior ? "20px" : "16px";
    document.documentElement.style.fontSize = fontSize;
  }, [seniorMode]);
  const storeSlug = useMemo(() => {
    if (props?.store?.slug) return props.store.slug;
    if (props?.store_slug) return props.store_slug;
    if (typeof window !== "undefined") {
      const m = window.location.pathname.match(/^\/s\/([^/]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
    return "";
  }, [props?.store?.slug, props?.store_slug]);
  const storePath = (p) => storeSlug ? `/s/${storeSlug}${p}` : p;
  const [navIntent, setNavIntent] = useState("auto");
  const [navOverlayOpen, setNavOverlayOpen] = useState(false);
  const [vw, setVw] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1920);
  const [isEditMode, setIsEditMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => /* @__PURE__ */ new Date());
  const [isDisplayMenuOpen, setIsDisplayMenuOpen] = useState(false);
  const displayMenuRef = useRef(null);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const canPush = vw >= 1216;
  const navMode = !canPush ? "overlay" : navIntent === "rail" ? "rail" : navIntent === "expanded" ? "expanded" : vw >= 1280 ? "expanded" : "rail";
  useEffect(() => {
    if (canPush) setNavOverlayOpen(false);
  }, [canPush]);
  useEffect(() => {
    if (!navOverlayOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setNavOverlayOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOverlayOpen]);
  const [framePickerModalOpen, setFramePickerModalOpen] = useState(false);
  const [stepperModalOpen, setStepperModalOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState(null);
  const [categoryFolderIndex, setCategoryFolderIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("All");
  const [glassModalOpen, setGlassModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: "in" });
  const [editingCardId, setEditingCardId] = useState(null);
  useEffect(() => {
    if (!glassModalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setGlassModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [glassModalOpen]);
  const [selectedReading, setSelectedReading] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customBtnTarget, setCustomBtnTarget] = useState(SHORTCUT_TARGETS[0]);
  const [draftCat, setDraftCat] = useState("C3");
  const [draftW, setDraftW] = useState(4);
  const [draftH, setDraftH] = useState(3);
  const [draftChart, setDraftChart] = useState("area");
  const [draftVariant, setDraftVariant] = useState("gradient");
  const [draftTone, setDraftTone] = useState("surface");
  const [draftPeriod, setDraftPeriod] = useState("Month");
  const [draftShowPeriodPicker, setDraftShowPeriodPicker] = useState(true);
  const [draftShowWhen, setDraftShowWhen] = useState(true);
  const [draftShowDelta, setDraftShowDelta] = useState(true);
  const [draftOpenArrow, setDraftOpenArrow] = useState(true);
  const [draftGlare, setDraftGlare] = useState(false);
  const [draftStarBorder, setDraftStarBorder] = useState(false);
  const [draftIcon, setDraftIcon] = useState("cart");
  const [draftColor, setDraftColor] = useState("#0baa8f");
  const [draftLink, setDraftLink] = useState("");
  const [previewZoom, setPreviewZoom] = useState("fit");
  const [previewScale, setPreviewScale] = useState(100);
  const engine = () => typeof window !== "undefined" ? window.VenQoreCards : null;
  const { isDark, appearance, update: updateAppearance } = useAppearance();
  useEffect(() => {
    try {
      localStorage.removeItem("vq-dashboard-v6-theme");
    } catch {
    }
  }, []);
  useEffect(() => {
    engine()?.draw?.();
  }, [isDark, appearance, engineReady]);
  const RAILS_KEY = `vq-dashboard-v6-rails:${storeSlug || "default"}`;
  const [railPrefs, setRailPrefsState] = useState(() => {
    const base = { design: null, sticky: true, width: 340, collapsed: false };
    try {
      const v = JSON.parse(localStorage.getItem(RAILS_KEY) || "null");
      if (v && typeof v.design === "string") return { ...base, ...v };
      const ids = Array.isArray(v) ? v : v && Array.isArray(v.ids) ? v.ids : null;
      if (ids && ids.length) {
        const design = ids.includes("balances") ? "money" : ids.includes("alerts") ? "operations" : ids.includes("targets") ? "growth" : "minimal";
        return { ...base, ...v && !Array.isArray(v) ? v : {}, ids: void 0, design };
      }
    } catch {
    }
    return base;
  });
  const saveRailPrefs = (next) => {
    setRailPrefsState(next);
    try {
      localStorage.setItem(RAILS_KEY, JSON.stringify(next));
    } catch {
    }
  };
  const setRailOpt = (patch) => saveRailPrefs({ ...railPrefs, ...patch });
  const panelDesign = PANEL_DESIGNS.find((d) => d.id === railPrefs.design) || null;
  const [railsModalOpen, setRailsModalOpen] = useState(false);
  const permissions = auth?.user?.permissions || [];
  const isOwnerOrAdmin = auth?.user?.is_platform_admin || auth?.user?.role === "owner" || auth?.user?.role === "admin" || permissions.includes("*");
  const hasPermission = (key) => isOwnerOrAdmin || permissions.includes(key);
  const railAvailable = (def) => {
    if (["v6_cockpit", "classic_panel", "balances", "reminders"].includes(def.id) && !hasPermission("finance.balances")) return false;
    if (def.id === "activity" && !hasPermission("finance.transactions")) return false;
    if (def.id === "today" && !hasPermission("finance.balances") && !hasPermission("reports.summary") && !hasPermission("reports.financial") && !hasPermission("sales.view")) return false;
    if (def.id === "targets" && !hasPermission("reports.performance") && !hasPermission("reports.summary") && !hasPermission("finance.balances")) return false;
    if (def.id === "top_lists" && !hasPermission("reports.performance") && !hasPermission("reports.summary") && !hasPermission("sales.view")) return false;
    if (def.id === "alerts" && !hasPermission("inventory.view")) return false;
    const mods = Array.isArray(props?.modules) ? props.modules : [];
    if (!mods.length || !def.modules.length) return true;
    return def.modules.some((m) => mods.includes(m));
  };
  const availableRailDefs = RAIL_DEFS.filter(railAvailable);
  const railsFit = vw >= 1360;
  const chosenRails = panelDesign ? panelDesign.rails.filter((id) => availableRailDefs.some((d) => d.id === id)) : [];
  const activeRails = railsFit ? chosenRails : [];
  const railsOn = activeRails.length > 0 && !railPrefs.collapsed;
  useEffect(() => {
    const t = setTimeout(() => engine()?.relayout?.(), 260);
    return () => clearTimeout(t);
  }, [railsOn, railPrefs.width, vw, navMode, engineReady]);
  useEffect(() => {
    window._vqOpenGlassActions = () => setGlassModalOpen(true);
    return () => {
      window._vqOpenGlassActions = null;
    };
  }, []);
  const enabledModules = useMemo(
    () => Array.isArray(props?.modules) ? props.modules : [],
    [props?.modules]
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onDocSave = () => {
      clearReckonerDataCache();
      engine()?.draw?.();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        engine()?.draw?.();
      }
    };
    window.addEventListener("pos:sale-saved", onDocSave);
    window.addEventListener("sale:saved", onDocSave);
    window.addEventListener("purchase:saved", onDocSave);
    window.addEventListener("expense:saved", onDocSave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pos:sale-saved", onDocSave);
      window.removeEventListener("sale:saved", onDocSave);
      window.removeEventListener("purchase:saved", onDocSave);
      window.removeEventListener("expense:saved", onDocSave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
  useEffect(() => {
    clearReckonerDataCache();
  }, [storeSlug]);
  useEffect(() => {
    const activeFrame = frames.find((frame) => frame.key === activeFrameKey);
    runCardBuilder({
      storeSlug,
      modules: enabledModules,
      readings: readingsProp,
      layoutLaw: layoutLawProp,
      dashboardId: props?.dashboardId,
      activeFrame: activeFrameKey,
      frameSlots: frameDirty ? [] : activeFrame?.slots || [],
      frameDirty
    });
    setEngineReady(true);
  }, [storeSlug, enabledModules, readingsProp, layoutLawProp, props?.dashboardId]);
  useEffect(() => {
    const onDirty = (event) => setFrameDirty(!!event.detail);
    window.addEventListener("vq:frame-dirty", onDirty);
    return () => window.removeEventListener("vq:frame-dirty", onDirty);
  }, []);
  const chooseFrame = (frameKey) => {
    if (frameDirty && !window.confirm("This dashboard has custom changes. Switching frames will re-flow its cards. Continue?")) return;
    const frame = frames.find((item) => item.key === frameKey);
    if (!frame) return;
    engine()?.setFrame?.(frame.key, frame.slots);
    setActiveFrameKey(frame.key);
    setFrameDirty(false);
  };
  useEffect(() => {
    document.documentElement.classList.toggle("vq-editing", isEditMode);
  }, [isEditMode]);
  useEffect(() => {
    const t = setTimeout(() => engine()?.relayout?.(), 280);
    return () => clearTimeout(t);
  }, [navMode]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);
  useEffect(() => {
    if (!isDisplayMenuOpen) return;
    const close = (e) => {
      if (displayMenuRef.current && displayMenuRef.current.contains(e.target)) return;
      setIsDisplayMenuOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [isDisplayMenuOpen]);
  useEffect(() => {
    const onEditLayout = () => setIsEditMode((v) => !v);
    const onAddCard = () => openPicker(0);
    const onToggleSidePanel = () => {
      if (!panelDesign) setRailsModalOpen(true);
      else setRailOpt({ collapsed: !railPrefs.collapsed });
    };
    const onOpenSidePanel = () => setRailsModalOpen(true);
    const onStartFresh = () => setFramePickerModalOpen(true);
    const onQuickActions = () => setGlassModalOpen(true);
    window.addEventListener("vq:edit-layout", onEditLayout);
    window.addEventListener("vq:toggle-edit-layout", onEditLayout);
    window.addEventListener("vq:add-card", onAddCard);
    window.addEventListener("vq:open-add-card", onAddCard);
    window.addEventListener("vq:toggle-side-panel", onToggleSidePanel);
    window.addEventListener("vq:open-side-panel", onOpenSidePanel);
    window.addEventListener("vq:start-fresh", onStartFresh);
    window.addEventListener("vq:open-quick-actions", onQuickActions);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("edit") === "1") setIsEditMode(true);
      if (params.get("add_card") === "1") setTimeout(() => openPicker(0), 350);
      if (params.get("reset") === "1") setFramePickerModalOpen(true);
    }
    return () => {
      window.removeEventListener("vq:edit-layout", onEditLayout);
      window.removeEventListener("vq:toggle-edit-layout", onEditLayout);
      window.removeEventListener("vq:add-card", onAddCard);
      window.removeEventListener("vq:open-add-card", onAddCard);
      window.removeEventListener("vq:toggle-side-panel", onToggleSidePanel);
      window.removeEventListener("vq:open-side-panel", onOpenSidePanel);
      window.removeEventListener("vq:start-fresh", onStartFresh);
      window.removeEventListener("vq:open-quick-actions", onQuickActions);
    };
  }, [panelDesign, railPrefs.collapsed]);
  const draftCard = useMemo(() => {
    const base = {
      id: editingCardId || "preview-card",
      tone: draftTone,
      accent: draftTone === "accent",
      glare: draftGlare,
      starBorder: draftStarBorder,
      showOpenArrow: draftOpenArrow,
      cat: draftCat,
      w: draftW,
      h: draftH
    };
    if (categoryFolderIndex === 0 && selectedReading) {
      const chartless = draftCat === "C1" || draftCat === "C2";
      return {
        ...base,
        key: selectedReading.key,
        chart: chartless ? "stat" : draftChart,
        variant: chartless ? "number" : draftVariant,
        period: draftPeriod,
        showPeriodPicker: draftShowPeriodPicker,
        showWhen: draftShowWhen,
        showDelta: draftShowDelta,
        extraKeys: []
      };
    }
    if (categoryFolderIndex === 1 && selectedTemplate) {
      return { ...base, type: selectedTemplate.type, title: selectedTemplate.title };
    }
    if (categoryFolderIndex === 2) {
      const url = draftLink || (customBtnTarget.absolute ? customBtnTarget.path : storePath(customBtnTarget.path));
      return {
        ...base,
        type: "custom_button",
        cat: "C1",
        title: customBtnTarget.label,
        targetUrl: url,
        icon: draftIcon,
        btnColor: draftColor
      };
    }
    return null;
  }, [
    categoryFolderIndex,
    selectedReading,
    selectedTemplate,
    customBtnTarget,
    editingCardId,
    draftCat,
    draftW,
    draftH,
    draftChart,
    draftVariant,
    draftTone,
    draftPeriod,
    draftShowPeriodPicker,
    draftShowWhen,
    draftShowDelta,
    draftOpenArrow,
    draftGlare,
    draftStarBorder,
    draftIcon,
    draftColor,
    draftLink,
    storeSlug
  ]);
  const draftName = useMemo(() => {
    if (isReadingCardIdx(categoryFolderIndex) && selectedReading) return selectedReading.label;
    if (categoryFolderIndex === 1 && selectedTemplate) return selectedTemplate.title;
    if (categoryFolderIndex === 2) return customBtnTarget.label;
    return "—";
  }, [categoryFolderIndex, selectedReading, selectedTemplate, customBtnTarget]);
  const draftDest = useMemo(() => {
    if (categoryFolderIndex === 2)
      return draftLink || (customBtnTarget.absolute ? customBtnTarget.path : storePath(customBtnTarget.path));
    const e = engine();
    if (!e || !draftCard) return "/pos";
    if (draftCard.targetUrl || draftCard.link) return draftCard.targetUrl || draftCard.link;
    try {
      return e.deepLinkFor(draftCard.key);
    } catch {
      return "/pos";
    }
  }, [categoryFolderIndex, draftCard, draftLink, customBtnTarget, storeSlug, engineReady]);
  const destLabel = useMemo(() => {
    const e = engine();
    try {
      return e?.destinationName?.(draftDest) || draftDest;
    } catch {
      return draftDest;
    }
  }, [draftDest, engineReady]);
  useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return ["C3"];
    try {
      return e.catsFor(draftCard);
    } catch {
      return ["C3"];
    }
  }, [draftCard, engineReady]);
  engine()?.getCatMax?.() || catMaxFromLaw(layoutLawProp);
  engine()?.getCatNames?.() || {};
  engine()?.getCatDescs?.() || {};
  const draftFloor = useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return [1, 1];
    try {
      return e.minSizeFor({ ...draftCard, cat: draftCat });
    } catch {
      return [1, 1];
    }
  }, [draftCard, draftCat, engineReady]);
  useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return [];
    const T = e.fitsTable(draftCard);
    const [fw, fh] = draftFloor;
    return e.presetsFor(draftCat, T).filter((s) => s.w >= fw && s.h >= fh).sort((a, b) => a.w * a.h - b.w * b.h);
  }, [draftCat, draftCard, draftFloor, engineReady]);
  const draftGeo = useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return { w: draftW, h: draftH, fit: 0, cat: draftCat, clamped: false };
    try {
      return e.geometryOf(draftCard, 24, e.REFERENCE_COL_W || 112);
    } catch {
      return { w: draftW, h: draftH, fit: 0, cat: draftCat, clamped: false };
    }
  }, [draftCard, engineReady]);
  useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return "—";
    try {
      const T = e.fitsTable(draftCard);
      const i = e.resolveFit(draftCat, draftW, draftH, T);
      return T[draftCat] && T[draftCat][i] && T[draftCat][i][2] || "—";
    } catch {
      return "—";
    }
  }, [draftCard, draftCat, draftW, draftH, engineReady]);
  const boardColCount = useMemo(() => {
    const e = engine();
    return e?.boardCols ? e.boardCols() : vw < 600 ? 4 : vw < 1024 ? 6 : vw < 1440 ? 8 : vw < 1800 ? 10 : vw < 2400 ? 12 : 16;
  }, [vw, engineReady]);
  useEffect(() => {
    if (!stepperModalOpen || step !== 2) return;
    const e = engine();
    const host = previewRef.current, frame = previewFrameRef.current;
    if (!e || !host || !frame || !draftCard) return;
    const COLW = e.REFERENCE_COL_W || 112, UNIT = 64, GUT = 24;
    const geo = e.geometryOf(draftCard, 24, COLW);
    const cardW = geo.w * COLW + (geo.w - 1) * GUT;
    const cardH = geo.h * UNIT + (geo.h - 1) * GUT;
    const avail = frame.getBoundingClientRect();
    const padded = { w: Math.max(160, avail.width - 32), h: Math.max(140, avail.height - 32) };
    const scale = previewZoom === "actual" ? 1 : Math.min(1, padded.w / cardW, padded.h / cardH);
    host.style.width = `${Math.round(cardW * scale)}px`;
    host.style.height = `${Math.round(cardH * scale)}px`;
    host.innerHTML = `<div class="vq-preview-scaler"></div>`;
    const scaler = host.firstElementChild;
    scaler.style.width = `${cardW}px`;
    scaler.style.height = `${cardH}px`;
    scaler.style.transform = `scale(${scale})`;
    scaler.style.transformOrigin = "top left";
    scaler.innerHTML = e.renderCard(draftCard, 24, COLW);
    const cardEl = scaler.querySelector(".vqc");
    if (cardEl) {
      cardEl.style.width = "100%";
      cardEl.style.height = "100%";
      cardEl.style.gridColumn = "auto";
      cardEl.style.gridRow = "auto";
      cardEl.style.animation = "none";
    }
    frame.dataset.size = `${geo.w} × ${geo.h} · ${cardW}×${cardH}px · ${Math.round(scale * 100)}%`;
    setPreviewScale(Math.round(scale * 100));
    const handle = previewHandleRef.current;
    if (handle) {
      const seat = () => {
        handle.style.left = host.offsetLeft + Math.round(cardW * scale) - 8 + "px";
        handle.style.top = host.offsetTop + Math.round(cardH * scale) - 8 + "px";
        handle.style.display = "block";
      };
      seat();
      requestAnimationFrame(seat);
    }
    const raf = requestAnimationFrame(() => {
      const chartHost = scaler.querySelector(".vqc-host");
      if (chartHost) e.mountChart(chartHost, draftCard);
      e.fitValues?.(scaler);
    });
    return () => cancelAnimationFrame(raf);
  }, [stepperModalOpen, step, draftCard, previewZoom, vw, engineReady]);
  const resetDraftChrome = () => {
    setDraftTone("surface");
    setDraftGlare(false);
    setDraftStarBorder(false);
    setDraftLink("");
    setPreviewZoom("fit");
    setDraftOpenArrow(true);
    setDraftShowWhen(true);
    setDraftShowDelta(true);
    setDraftShowPeriodPicker(true);
  };
  const setFamily = (catIndex) => {
    setCategoryFolderIndex(catIndex);
    setStep(1);
    setEditingCardId(null);
    setSelectedReading(null);
    setSelectedTemplate(null);
    setSearchQuery("");
    resetDraftChrome();
    if (catIndex === 2) {
      setDraftCat("C1");
      setDraftW(2);
      setDraftH(1);
      setDraftShowPeriodPicker(false);
    } else if (catIndex === 1) {
      setDraftCat("C4");
      setDraftW(4);
      setDraftH(2);
    } else {
      setDraftCat("C3");
      setDraftW(4);
      setDraftH(3);
      setDraftShowPeriodPicker(true);
    }
  };
  const openPicker = (catIndex = 0) => {
    setFamily(catIndex);
    setTargetSlot(null);
    setStepperModalOpen(true);
  };
  const openPickerForSlot = useCallback((slot) => {
    setTargetSlot(slot || null);
    if (slot) {
      setFamily(0);
      setDraftCat(slot.category || "C3");
      setDraftW(slot.w || 4);
      setDraftH(slot.h || 3);
      setStepperModalOpen(true);
    } else {
      openPicker(0);
    }
  }, []);
  useEffect(() => {
    window._vqOpenAddCardForSlot = openPickerForSlot;
    return () => {
      window._vqOpenAddCardForSlot = null;
    };
  }, [openPickerForSlot]);
  const seatDraftOn = (card) => {
    const e = engine();
    if (!e) return;
    const T = e.fitsTable(card);
    const cat = card.cat;
    const floor = e.minSizeFor(card);
    const list = e.presetsFor(cat, T).filter((s) => s.w >= floor[0] && s.h >= floor[1]);
    const pick = list.find((s) => s.isFit) || list[0];
    setDraftCat(cat);
    if (pick) {
      setDraftW(pick.w);
      setDraftH(pick.h);
    }
  };
  const selectMetricForStep2 = (rd) => {
    setSelectedReading(rd);
    setSelectedTemplate(null);
    const byShape = {
      SCALAR: ["stat", "spark", "C2"],
      GAUGE: ["gauge", "standard", "C4"],
      TABLE: ["table", "standard", "C5"],
      FEED: ["feed", "live", "C4"],
      BREAKDOWN: ["bar", "grouped", "C4"],
      RANKING: ["bar", "solid", "C4"],
      STATUS: ["status", "standard", "C2"],
      MULTI_SERIES: ["composed", "bar-line-area", "C5"],
      SERIES: ["area", "gradient", "C5"]
    };
    let [chart, variant, cat] = byShape[rd.shape] || ["area", "gradient", "C5"];
    if (cat === "C2" || cat === "C1") variant = "number";
    setDraftChart(chart);
    setDraftVariant(variant);
    setDraftPeriod("Month");
    resetDraftChrome();
    seatDraftOn({ key: rd.key, chart, variant, extraKeys: [], period: "Month", cat });
    setStep(2);
  };
  const selectTemplateForStep2 = (tmpl) => {
    setSelectedTemplate(tmpl);
    setSelectedReading(null);
    const specials = engine()?.getSpecials?.() || {};
    const S = specials[tmpl.type] || { cat: "C4" };
    resetDraftChrome();
    setDraftTone(tmpl.tone || "surface");
    seatDraftOn({ type: tmpl.type, cat: S.cat });
    setStep(2);
  };
  const selectCustomBtnForStep2 = (target) => {
    setCustomBtnTarget(target);
    setSelectedReading(null);
    setSelectedTemplate(null);
    setDraftCat("C1");
    setDraftW(2);
    setDraftH(1);
    setDraftIcon(target.icon);
    setDraftColor(target.color);
    resetDraftChrome();
    setDraftLink(target.absolute ? target.path : storePath(target.path));
    setStep(2);
  };
  const openCardEditor = (id) => {
    const e = engine();
    if (!e) return;
    const c = (e.getCards() || []).find((x) => x.id === id);
    if (!c) return;
    setEditingCardId(id);
    const special = e.isSpecial(c);
    setCategoryFolderIndex(special ? c.type === "custom_button" ? 2 : 1 : 0);
    if (special && c.type !== "custom_button") {
      setSelectedTemplate(OPERATIONAL_TEMPLATES.find((t) => t.type === c.type) || OPERATIONAL_TEMPLATES[0]);
      setSelectedReading(null);
    } else if (special) {
      setSelectedTemplate(null);
      setSelectedReading(null);
      setDraftIcon(c.icon || "cart");
      setDraftColor(c.btnColor || "#0baa8f");
    } else {
      setSelectedReading(e.getReadingOf(c.key));
      setSelectedTemplate(null);
      setDraftChart(c.chart);
      setDraftVariant(c.variant);
      setDraftPeriod(c.period || "Month");
      setDraftShowPeriodPicker(c.showPeriodPicker !== false);
      setDraftShowWhen(c.showWhen !== false);
      setDraftShowDelta(c.showDelta !== false);
    }
    const g = e.geometryOf(c, 24);
    setDraftCat(g.cat);
    setDraftW(g.authoredW ?? g.w);
    setDraftH(g.authoredH ?? g.h);
    setDraftTone(c.tone || (c.accent ? "accent" : "surface"));
    setDraftGlare(!!c.glare);
    setDraftStarBorder(!!c.starBorder);
    setDraftOpenArrow(c.showOpenArrow !== false);
    setDraftLink(c.targetUrl || c.link || "");
    setPreviewZoom("fit");
    setStep(2);
    setStepperModalOpen(true);
  };
  useEffect(() => {
    window._vqEditCard = openCardEditor;
    return () => {
      window._vqEditCard = null;
    };
  });
  const handleChartSelect = (chartType) => {
    const e = engine();
    setDraftChart(chartType);
    const variants = e?.getVariants?.() || {};
    const first = (variants[chartType] || [["standard"]])[0][0];
    setDraftVariant(first);
    if (!e || !selectedReading) return;
    const probe = {
      key: selectedReading.key,
      chart: chartType,
      variant: first,
      extraKeys: [],
      period: draftPeriod,
      cat: draftCat
    };
    const cats = e.catsFor(probe);
    const cat = cats.includes(draftCat) ? draftCat : cats[0] || "C5";
    const T = e.fitsTable(probe);
    const floor = e.minSizeFor({ ...probe, cat });
    const list = e.presetsFor(cat, T).filter((s) => s.w >= floor[0] && s.h >= floor[1]);
    setDraftCat(cat);
    const keep = list.find((s) => s.w === draftW && s.h === draftH);
    const pick = keep || list.find((s) => s.isFit) || list[0];
    if (pick) {
      setDraftW(pick.w);
      setDraftH(pick.h);
    }
  };
  const handleAddCardConfirm = () => {
    const e = engine();
    if (!e || !draftCard) return;
    const card = { ...draftCard };
    if (targetSlot) {
      card.frameSlot = Number(targetSlot.slot);
      card.gx = Number(targetSlot.x);
      card.gy = Number(targetSlot.y);
      card.w = Number(targetSlot.w);
      card.h = Number(targetSlot.h);
      card.cat = targetSlot.category || card.cat;
    }
    if (editingCardId) {
      delete card.id;
      e.updateCard(editingCardId, card);
    } else {
      card.id = "c-" + Math.random().toString(36).substring(2, 9);
      e.addCardObject(card);
    }
    setStepperModalOpen(false);
    setEditingCardId(null);
    setTargetSlot(null);
    setStep(1);
  };
  const readings = engineReady ? (engine()?.getAvailableReadings?.() ?? engine()?.getReadings?.()) || [] : Array.isArray(readingsProp) ? readingsProp : typeof window !== "undefined" && window.__VENQORE_READINGS__ || [];
  const visibleTemplates = engineReady ? OPERATIONAL_TEMPLATES.filter((t) => engine()?.specialAvailable?.(t.type) !== false) : OPERATIONAL_TEMPLATES;
  const availableAreas = useMemo(() => {
    const areas = Array.from(new Set(readings.filter((r) => r?.contract_state !== "unimplemented").map((r) => r?.area).filter(Boolean)));
    const hasComingSoon = readings.some((r) => r?.contract_state === "unimplemented");
    return ["All", ...areas, ...hasComingSoon ? ["Coming soon"] : []];
  }, [readings]);
  const filteredReadings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return readings.filter((r) => {
      if (!r) return false;
      const isUnimplemented = r.contract_state === "unimplemented";
      if (selectedArea === "Coming soon") {
        if (!isUnimplemented) return false;
      } else {
        if (isUnimplemented) return false;
        if (selectedArea !== "All" && r.area !== selectedArea) return false;
      }
      return !q || r.label && r.label.toLowerCase().includes(q) || r.module && r.module.toLowerCase().includes(q) || r.key && r.key.toLowerCase().includes(q);
    });
  }, [readings, selectedArea, searchQuery]);
  const groupedSections = useMemo(() => {
    const groups = {};
    filteredReadings.forEach((r) => {
      const sectionName = selectedArea === "Coming soon" ? r?.area || "Coming soon" : r?.area || "General";
      (groups[sectionName] ||= []).push(r);
    });
    return groups;
  }, [filteredReadings, selectedArea]);
  const legalMap = engine()?.getLegalCharts?.() || {};
  const legalCharts = (selectedReading ? legalMap[selectedReading?.shape] : null) || ["area", "bar", "line", "stat", "gauge", "funnel", "table", "feed", "heatmap"];
  const chartNames = engine()?.getChartNames?.() || {};
  const currentVariants = useMemo(() => {
    const e = engine();
    if (!e || !selectedReading) return [["standard", "Standard", true, ""]];
    try {
      return e.getVariantsFor({
        key: selectedReading.key,
        chart: draftChart,
        variant: draftVariant,
        extraKeys: [],
        period: draftPeriod
      });
    } catch {
      return (e.getVariants?.()[draftChart] || [["standard", "Standard"]]).map((v) => [v[0], v[1], true, ""]);
    }
  }, [selectedReading, draftChart, draftVariant, draftPeriod, engineReady]);
  const isReadingCard = categoryFolderIndex === 0;
  const isHubCard = categoryFolderIndex === 1;
  const isShortcutCard = categoryFolderIndex === 2;
  const chartlessCat = draftCat === "C1" || draftCat === "C2";
  const familyLabel = isReadingCard ? "METRIC & CHART" : isHubCard ? "SMART PANEL" : "SHORTCUT";
  const SIZE_LABELS = { C1: "Tiny", C2: "One-line", C3: "Compact", C4: "Standard", C5: "Large", C6: "Extra large" };
  const SIZE_HINTS = {
    C1: "Just the number",
    C2: "Name and number on one line",
    C3: "Number with its trend",
    C4: "Room for a small chart or list",
    C5: "A full chart",
    C6: "The biggest card there is"
  };
  const statFamily = isReadingCard && draftChart === "stat";
  const variantForCat = (cat) => {
    if (!statFamily) return draftVariant;
    if (cat === "C1" || cat === "C2") return "number";
    return draftVariant === "number" ? "spark" : draftVariant;
  };
  const sizeChips = useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return [];
    if (isShortcutCard) {
      return [
        { cat: "C1", w: 1, h: 1, label: "Icon only", hint: "Glyph only — the name shows on hover" },
        { cat: "C1", w: 2, h: 1, label: "Standard", hint: "Icon and name" },
        { cat: "C1", w: 3, h: 2, label: "Roomy", hint: "Icon, name and where it goes" }
      ];
    }
    const probeBase = { ...draftCard, variant: statFamily ? "number" : draftVariant };
    let cats = [];
    try {
      cats = e.catsFor(probeBase);
    } catch {
      cats = ["C3"];
    }
    const chips = [];
    cats.forEach((cat) => {
      if (isReadingCard && cat === "C1") return;
      const variant = variantForCat(cat);
      const probe = { ...draftCard, cat, variant };
      let pick = null;
      try {
        const T = e.fitsTable(probe);
        const floor = e.minSizeFor(probe);
        const list = e.presetsFor(cat, T).filter((s) => s.w >= floor[0] && s.h >= floor[1]);
        pick = list.find((s) => s.isFit) || list[0];
      } catch {
        pick = null;
      }
      if (pick) chips.push({
        cat,
        w: pick.w,
        h: pick.h,
        variant,
        label: SIZE_LABELS[cat] || cat,
        hint: SIZE_HINTS[cat] || ""
      });
    });
    return chips;
  }, [draftCard, isShortcutCard, isReadingCard, statFamily, draftChart, draftVariant, engineReady]);
  const pickChip = (chip) => {
    setDraftCat(chip.cat);
    if (chip.variant && chip.variant !== draftVariant) setDraftVariant(chip.variant);
    setDraftW(chip.w);
    setDraftH(chip.h);
  };
  const applyDragSize = (wRaw, hRaw) => {
    const e = engine();
    if (!e || !draftCard) return;
    const catMaxTbl = e.getCatMax?.() || catMaxFromLaw(layoutLawProp);
    const w = Math.max(1, Math.min(12, wRaw)), h = Math.max(1, Math.min(16, hRaw));
    let cats = [];
    try {
      cats = isShortcutCard ? ["C1"] : e.catsFor({ ...draftCard, variant: statFamily ? "number" : draftVariant });
    } catch {
      cats = [draftCat];
    }
    if (isReadingCard) cats = cats.filter((c) => c !== "C1");
    for (let i = cats.length - 1; i >= 0; i--) {
      const cat = cats[i];
      const variant = variantForCat(cat);
      const probe = { ...draftCard, cat, variant };
      try {
        const [MW, MH] = catMaxTbl[cat] || [12, 16];
        if (w > MW || h > MH) continue;
        const [fw, fh] = e.minSizeFor(probe);
        if (w < fw || h < fh) continue;
        if (!e.sizeLegal(cat, w, h, e.fitsTable(probe))) continue;
        setDraftCat(cat);
        if (variant !== draftVariant) setDraftVariant(variant);
        setDraftW(w);
        setDraftH(h);
        return;
      } catch {
      }
    }
    try {
      const probe = { ...draftCard, cat: draftCat };
      const T = e.fitsTable(probe);
      const [MW, MH] = catMaxTbl[draftCat] || [12, 16];
      const [fw, fh] = e.minSizeFor(probe);
      let w2 = Math.max(fw, Math.min(MW, w)), h2 = Math.max(fh, Math.min(MH, h));
      if (!e.sizeLegal(draftCat, w2, h2, T)) {
        const needH = e.minHeightAt(draftCat, w2, T);
        if (needH != null && needH <= MH) h2 = Math.max(h2, needH);
        else {
          const needW = e.minWidthAt(draftCat, h2, T);
          if (needW != null && needW <= MW) w2 = Math.max(w2, needW);
          else return;
        }
      }
      setDraftW(w2);
      setDraftH(h2);
    } catch {
    }
  };
  const applyDragSizeRef = useRef(applyDragSize);
  applyDragSizeRef.current = applyDragSize;
  const dragState = useRef(null);
  const dragScaleRef = useRef(1);
  dragScaleRef.current = Math.max(0.05, previewScale / 100);
  const onHandleDown = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    dragState.current = { x: ev.clientX, y: ev.clientY, w: draftW, h: draftH, scale: dragScaleRef.current };
    document.body.classList.add("is-reordering");
    const move = (e2) => {
      const st = dragState.current;
      if (!st) return;
      const dw = Math.round((e2.clientX - st.x) / st.scale / (112 + 24));
      const dh = Math.round((e2.clientY - st.y) / st.scale / (64 + 24));
      applyDragSizeRef.current(st.w + dw, st.h + dh);
    };
    const up = () => {
      dragState.current = null;
      document.body.classList.remove("is-reordering");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const squelch = (ce) => {
        ce.stopPropagation();
        ce.preventDefault();
      };
      window.addEventListener("click", squelch, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", squelch, { capture: true }), 250);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const glassActionItems = [
    {
      label: "Open POS",
      color: "teal",
      href: storePath("/pos"),
      permission: "pos.checkout",
      altPermission: "pos.open_session",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("rect", { width: "18", height: "14", x: "3", y: "3", rx: "2" }),
        /* @__PURE__ */ jsx("line", { x1: "3", x2: "21", y1: "9", y2: "9" }),
        /* @__PURE__ */ jsx("line", { x1: "9", x2: "9.01", y1: "13", y2: "13" }),
        /* @__PURE__ */ jsx("line", { x1: "15", x2: "15.01", y1: "13", y2: "13" })
      ] })
    },
    {
      label: "Money In",
      color: "teal",
      action: "payment-in",
      permission: "finance.receive_payment",
      altPermission: "finance.balances",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("line", { x1: "7", y1: "17", x2: "17", y2: "7" }),
        /* @__PURE__ */ jsx("polyline", { points: "7 7 17 7 17 17" })
      ] })
    },
    {
      label: "Money Out",
      color: "coral",
      action: "payment-out",
      permission: "finance.send_payment",
      altPermission: "finance.balances",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("line", { x1: "17", y1: "17", x2: "7", y2: "7" }),
        /* @__PURE__ */ jsx("polyline", { points: "7 17 7 7 17 7" })
      ] })
    },
    {
      label: "Transfer Money",
      color: "blue",
      href: storePath("/funds?action=transfer"),
      permission: "finance.internal_transfer",
      altPermission: "finance.transactions",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "m16 3 4 4-4 4" }),
        /* @__PURE__ */ jsx("path", { d: "M20 7H4" }),
        /* @__PURE__ */ jsx("path", { d: "m8 21-4-4 4-4" }),
        /* @__PURE__ */ jsx("path", { d: "M4 17h16" })
      ] })
    },
    {
      label: "Add Product",
      color: "orange",
      href: storePath("/inventory?action=add"),
      permission: "inventory.create",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "m7.5 4.27 9 5.15" }),
        /* @__PURE__ */ jsx("path", { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }),
        /* @__PURE__ */ jsx("path", { d: "m3.3 7 8.7 5 8.7-5" }),
        /* @__PURE__ */ jsx("path", { d: "M12 22V12" })
      ] })
    },
    {
      label: "Add Expense",
      color: "red",
      href: storePath("/expenses?action=add"),
      permission: "finance.expenses",
      altPermission: "expenses.create",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("line", { x1: "12", y1: "2", x2: "12", y2: "22" }),
        /* @__PURE__ */ jsx("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" })
      ] })
    },
    {
      label: "Add User",
      color: "purple",
      href: storePath("/admin/users"),
      permission: "admin.staff_manage",
      altPermission: "users.manage",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
        /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4" }),
        /* @__PURE__ */ jsx("line", { x1: "19", y1: "8", x2: "19", y2: "14" }),
        /* @__PURE__ */ jsx("line", { x1: "22", y1: "11", x2: "16", y2: "11" })
      ] })
    },
    {
      label: "Refund",
      color: "indigo",
      href: storePath("/returns/create"),
      permission: "pos.refund",
      altPermission: "sales.returns",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
        /* @__PURE__ */ jsx("path", { d: "M3 3v5h5" })
      ] })
    },
    {
      label: "New Quote",
      color: "sky",
      href: storePath("/sales/pre-sales/create"),
      permission: "sales.quotations",
      altPermission: "sales.create",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
        /* @__PURE__ */ jsx("polyline", { points: "14 2 14 8 20 8" }),
        /* @__PURE__ */ jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
        /* @__PURE__ */ jsx("line", { x1: "16", y1: "17", x2: "8", y2: "17" })
      ] })
    },
    {
      label: "New Recurring Invoice",
      color: "lime",
      href: storePath("/recurring-invoices/create"),
      permission: "sales.create",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "m17 2 4 4-4 4" }),
        /* @__PURE__ */ jsx("path", { d: "M3 11v-1a4 4 0 0 1 4-4h14" }),
        /* @__PURE__ */ jsx("path", { d: "m7 22-4-4 4-4" }),
        /* @__PURE__ */ jsx("path", { d: "M21 13v1a4 4 0 0 1-4 4H3" })
      ] })
    },
    {
      label: "Approvals",
      color: "teal",
      href: storePath("/approvals"),
      permission: "approvals.view_own",
      altPermission: "approvals.submit",
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "M9 11l3 3L22 4" }),
        /* @__PURE__ */ jsx("path", { d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" })
      ] })
    }
  ].filter((item) => {
    if (!item.permission && !item.altPermission) return true;
    return hasPermission(item.permission) || item.altPermission && hasPermission(item.altPermission);
  });
  const sharedNav = Array.isArray(props?.nav) ? props.nav : [];
  useMemo(() => {
    if (!sharedNav.length) return null;
    const safeHref = (name) => {
      try {
        if (typeof window !== "undefined" && typeof window.route === "function") {
          const has = window.route().has ? window.route().has(name) : true;
          if (has === false) return null;
          return window.route(name);
        }
      } catch {
      }
      return null;
    };
    const byGroup = /* @__PURE__ */ new Map();
    for (const item of sharedNav) {
      const href = safeHref(item.route);
      if (!href) continue;
      if (!byGroup.has(item.group)) byGroup.set(item.group, []);
      byGroup.get(item.group).push({ label: item.label, href, lucide: item.icon });
    }
    const groups = NAV_GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({ title: NAV_GROUP_LABELS[g] || g, items: byGroup.get(g) }));
    if (!groups.length) return null;
    const main = [
      {
        label: "Dashboard",
        href: storePath("/new-dashboard"),
        active: true,
        badge: "Live",
        d: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("rect", { width: "7", height: "9", x: "3", y: "3", rx: "1" }),
          /* @__PURE__ */ jsx("rect", { width: "7", height: "5", x: "14", y: "3", rx: "1" }),
          /* @__PURE__ */ jsx("rect", { width: "7", height: "9", x: "14", y: "12", rx: "1" }),
          /* @__PURE__ */ jsx("rect", { width: "7", height: "5", x: "3", y: "16", rx: "1" })
        ] })
      }
    ];
    if (sharedNav.some((i) => i.key === "pos")) main.push({
      label: "Point of Sale",
      href: "/pos",
      d: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "21", r: "1" }),
        /* @__PURE__ */ jsx("circle", { cx: "19", cy: "21", r: "1" }),
        /* @__PURE__ */ jsx("path", { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" })
      ] })
    });
    return [
      { title: "Main", items: main, pinned: true },
      ...groups,
      { title: "System", items: [
        {
          label: "Settings",
          href: storePath("/settings"),
          d: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3" }),
            /* @__PURE__ */ jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V4.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.5.6.87 1.15 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })
          ] })
        }
      ], pinned: true }
    ];
  }, [sharedNav, storeSlug]);
  const NAVFOLD_KEY = "vq-dashboard-v6-navfold";
  const [navFold, setNavFold] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NAVFOLD_KEY) || "{}") || {};
    } catch {
      return {};
    }
  });
  const SwitchRow = ({ on, set, title, sub, hint, warn }) => /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: "vq-v6-switch-wrapper",
      role: "switch",
      "aria-checked": on,
      onClick: () => set((v) => !v),
      children: [
        /* @__PURE__ */ jsxs("span", { className: "vq-v6-switch-label", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-v6-switch-title", children: title }),
          /* @__PURE__ */ jsx("span", { className: "vq-v6-switch-sub", children: sub }),
          hint && /* @__PURE__ */ jsx("span", { className: `vq-v6-switch-hint ${warn ? "is-warn" : ""}`, children: hint })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `vq-v6-switch-track ${on ? "is-on" : ""}`, children: /* @__PURE__ */ jsx("span", { className: "vq-v6-switch-knob" }) })
      ]
    }
  );
  const StylePanel = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "vq-identity", children: [
      /* @__PURE__ */ jsx("span", { className: "vq-identity-eyebrow", children: familyLabel }),
      /* @__PURE__ */ jsx("span", { className: "vq-identity-name", children: draftName }),
      /* @__PURE__ */ jsxs("span", { className: "vq-identity-meta", children: [
        isReadingCard && selectedReading?.desc ? /* @__PURE__ */ jsxs(Fragment, { children: [
          selectedReading.desc,
          " "
        ] }) : null,
        /* @__PURE__ */ jsxs("span", { className: "vq-identity-opens", children: [
          "Opens ",
          destLabel,
          "."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-form-group", children: [
      /* @__PURE__ */ jsxs("label", { className: "vq-form-label", children: [
        /* @__PURE__ */ jsx("span", { children: "Size" }),
        /* @__PURE__ */ jsx("span", { className: "vq-form-sublabel", children: "or drag the corner of the preview" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-size-grid", children: sizeChips.map((s) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: `vq-size-card ${draftCat === s.cat && draftW === s.w && draftH === s.h ? "is-active" : ""}`,
          onClick: () => pickChip(s),
          children: [
            /* @__PURE__ */ jsx(SizeGlyph, { w: s.w, h: s.h, max: [12, 8] }),
            /* @__PURE__ */ jsxs("span", { className: "vq-size-card-text", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-size-card-title", children: s.label }),
              /* @__PURE__ */ jsx("span", { className: "vq-size-card-desc", children: s.hint })
            ] })
          ]
        },
        `${s.cat}-${s.w}x${s.h}`
      )) }),
      draftW > boardColCount && /* @__PURE__ */ jsx("p", { className: "vq-form-note is-warn", children: "Wider than this screen — here it fills the row, and spreads out fully on a bigger display." })
    ] }),
    isReadingCard && !chartlessCat && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-form-group", children: [
        /* @__PURE__ */ jsxs("label", { className: "vq-form-label", children: [
          /* @__PURE__ */ jsx("span", { children: "Chart type" }),
          /* @__PURE__ */ jsx("span", { className: "vq-form-sublabel", children: "The size adjusts to fit" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "vq-select-btn-group", children: legalCharts.map((ch) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: `vq-choice-btn ${draftChart === ch ? "is-active" : ""}`,
            onClick: () => handleChartSelect(ch),
            children: chartNames[ch] || ch
          },
          ch
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-form-group", children: [
        /* @__PURE__ */ jsxs("label", { className: "vq-form-label", children: [
          /* @__PURE__ */ jsx("span", { children: "Style" }),
          /* @__PURE__ */ jsx("span", { className: "vq-form-sublabel", children: chartNames[draftChart] || draftChart })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "vq-select-btn-group", children: currentVariants.map(([v, n, ok, why]) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            disabled: ok === false,
            title: ok === false ? why : void 0,
            className: `vq-choice-btn ${draftVariant === v ? "is-active" : ""} ${ok === false ? "is-off" : ""}`,
            onClick: () => ok !== false && setDraftVariant(v),
            children: n
          },
          v
        )) })
      ] })
    ] }),
    isReadingCard && chartlessCat && /* @__PURE__ */ jsx("p", { className: "vq-form-note", children: "This size shows the name and the number, nothing else — pick a bigger size to add a chart." }),
    isShortcutCard && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-form-group", children: [
        /* @__PURE__ */ jsxs("label", { className: "vq-form-label", children: [
          /* @__PURE__ */ jsx("span", { children: "Where it goes" }),
          /* @__PURE__ */ jsx("span", { className: "vq-form-sublabel", children: "The tile is named after its destination" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "vq-dest-grid", children: SHORTCUT_TARGETS.map((t) => {
          const url = t.absolute ? t.path : storePath(t.path);
          const on = draftLink === url;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: `vq-dest-tile ${on ? "is-active" : ""}`,
              onClick: () => {
                setCustomBtnTarget(t);
                setDraftLink(url);
                setDraftIcon(t.icon);
                setDraftColor(t.color);
              },
              children: [
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "vq-dest-glyph",
                    style: { background: t.color },
                    dangerouslySetInnerHTML: { __html: engine()?.iconMarkup?.(t.icon, 16) || "" }
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "vq-dest-name", children: t.label })
              ]
            },
            t.path
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-form-group", children: [
        /* @__PURE__ */ jsxs("label", { className: "vq-form-label", children: [
          /* @__PURE__ */ jsx("span", { children: "Glyph" }),
          /* @__PURE__ */ jsx("span", { className: "vq-form-sublabel", children: "Defaults to the destination's own" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "vq-icon-grid", children: SHORTCUT_ICON_NAMES.map((n) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-label": n,
            className: `vq-icon-swatch ${draftIcon === n ? "is-active" : ""}`,
            onClick: () => setDraftIcon(n),
            dangerouslySetInnerHTML: { __html: engine()?.iconMarkup?.(n, 18) || "" }
          },
          n
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-form-group", children: [
        /* @__PURE__ */ jsx("label", { className: "vq-form-label", children: "Glyph colour" }),
        /* @__PURE__ */ jsx("div", { className: "vq-color-grid", children: SHORTCUT_COLORS.map((col) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-label": col,
            className: `vq-color-swatch ${draftColor === col ? "is-active" : ""}`,
            style: { background: col },
            onClick: () => setDraftColor(col)
          },
          col
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-form-group", children: [
      /* @__PURE__ */ jsxs("label", { className: "vq-form-label", children: [
        /* @__PURE__ */ jsx("span", { children: "Card background" }),
        /* @__PURE__ */ jsx("span", { className: "vq-form-sublabel", children: "Readable on every page background" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-tone-grid", children: CARD_TONES.map((t) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: `vq-tone-card ${draftTone === t.id ? "is-active" : ""}`,
          onClick: () => setDraftTone(t.id),
          children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tone-swatch", style: { background: t.swatchBg } }),
            /* @__PURE__ */ jsxs("span", { className: "vq-tone-info", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tone-name", children: t.name }),
              /* @__PURE__ */ jsx("span", { className: "vq-tone-desc", children: t.desc })
            ] })
          ]
        },
        t.id
      )) })
    ] }),
    isReadingCard && /* @__PURE__ */ jsxs("div", { className: "vq-form-group", children: [
      /* @__PURE__ */ jsxs("label", { className: "vq-form-label", children: [
        /* @__PURE__ */ jsx("span", { children: "Default timeframe" }),
        /* @__PURE__ */ jsx("span", { className: "vq-form-sublabel", children: "What the card reads when it loads" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-select-btn-group", children: PERIOD_LABELS.map((p) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `vq-choice-btn ${draftPeriod === p ? "is-active" : ""}`,
          onClick: () => setDraftPeriod(p),
          children: p
        },
        p
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-form-group", children: [
      /* @__PURE__ */ jsxs("label", { className: "vq-form-label", children: [
        /* @__PURE__ */ jsx("span", { children: "On the card face" }),
        /* @__PURE__ */ jsx("span", { className: "vq-form-sublabel", children: "Each is hidden automatically when the card is too small" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-switch-stack", children: [
        /* @__PURE__ */ jsx(
          SwitchRow,
          {
            on: draftOpenArrow,
            set: setDraftOpenArrow,
            title: "Open arrow",
            sub: `Jumps to ${destLabel}`,
            hint: "Appears on hover, in the card's top-right corner"
          }
        ),
        isReadingCard && /* @__PURE__ */ jsx(
          SwitchRow,
          {
            on: draftShowDelta,
            set: setDraftShowDelta,
            title: "Change pill",
            sub: "The ↗ 18.7% chip beside the number",
            hint: draftW < 2 ? "Needs 2 columns — hidden at this width" : null,
            warn: true
          }
        ),
        isReadingCard && /* @__PURE__ */ jsx(
          SwitchRow,
          {
            on: draftShowWhen,
            set: setDraftShowWhen,
            title: "Timeframe caption",
            sub: "The “Month · Jul 30 – Aug 28” line under the number",
            hint: draftH < 4 ? "Needs 4 rows — hidden at this height" : null,
            warn: true
          }
        ),
        isReadingCard && !chartlessCat && /* @__PURE__ */ jsx(
          SwitchRow,
          {
            on: draftShowPeriodPicker,
            set: setDraftShowPeriodPicker,
            title: "Timeframe picker",
            sub: "Readers can change the window without editing",
            hint: draftW < 3 ? "Needs 3 columns — hidden at this width" : null,
            warn: true
          }
        ),
        /* @__PURE__ */ jsx(
          SwitchRow,
          {
            on: draftStarBorder,
            set: setDraftStarBorder,
            title: "Animated star border",
            sub: "Marks a card as high priority"
          }
        ),
        /* @__PURE__ */ jsx(
          SwitchRow,
          {
            on: draftGlare,
            set: setDraftGlare,
            title: "Glare reflex",
            sub: "Light sweeps the card on hover"
          }
        )
      ] })
    ] })
  ] });
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Dashboard", noPadding: true, children: [
    /* @__PURE__ */ jsx(Head, { title: "Command Center — New Dashboard" }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: containerRef,
        className: `vq-shell ${isEditMode ? "is-editing" : ""} vq-nav-embedded`,
        id: "vq-app-shell",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-main-stage", children: [
            isEditMode && /* @__PURE__ */ jsxs("div", { className: "vq-edit-banner", children: [
              /* @__PURE__ */ jsxs("span", { className: "vq-edit-banner-text", children: [
                /* @__PURE__ */ jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" }) }),
                "Drag any card to place it anywhere on the grid · drag the bottom-right corner to resize · the pencil opens the full editor."
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-edit-banner-btn", onClick: () => setIsEditMode(false), children: "Done" })
            ] }),
            /* @__PURE__ */ jsx("main", { className: "vq-scroll-region", children: /* @__PURE__ */ jsx("div", { className: "vq-canvas", children: /* @__PURE__ */ jsxs("div", { className: `vq-canvas-body ${railsOn ? "has-rails" : ""}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-board-zone", children: [
                isEditMode && frames.length > 0 && /* @__PURE__ */ jsx("section", { className: "vq-frame-picker", "aria-label": "Dashboard frame settings", children: /* @__PURE__ */ jsx(FramePicker, { frames, value: activeFrameKey, onChange: chooseFrame }) }),
                /* @__PURE__ */ jsx("div", { className: "vq-grid", id: "board" })
              ] }),
              railsOn && /* @__PURE__ */ jsx(
                "aside",
                {
                  className: `vq-rails ${railPrefs.sticky ? "is-sticky" : ""} ${["v6_cockpit", "dark_hub", "money"].includes(railPrefs.design) ? "vq-rails--cockpit" : ""}`,
                  style: {
                    "--vq-rails-w": `${railPrefs.width || 340}px`,
                    width: `${railPrefs.width || 340}px`,
                    flex: `0 0 ${railPrefs.width || 340}px`,
                    minWidth: `${railPrefs.width || 340}px`,
                    maxWidth: `${railPrefs.width || 340}px`,
                    position: "sticky",
                    top: "12px",
                    height: "calc(100vh - 76px)",
                    maxHeight: "calc(100vh - 76px)",
                    marginBottom: "24px",
                    overflow: "hidden",
                    alignSelf: "flex-start"
                  },
                  "aria-label": "Side panel",
                  children: /* @__PURE__ */ jsx("div", { className: "vq-rails-shell", children: /* @__PURE__ */ jsx("div", { className: "vq-rails-scroll", children: activeRails.map((id) => /* @__PURE__ */ jsx(
                    DashRail,
                    {
                      id,
                      storePath,
                      enabledModules,
                      onQuickActions: () => setGlassModalOpen(true),
                      cashData,
                      bankAccounts,
                      cashAccounts,
                      recentTransactions,
                      topSellingItems,
                      lowStockItems,
                      performance,
                      debtors,
                      currencySymbol: store?.currency_symbol || "Rs",
                      isDemo,
                      hasPermission,
                      auth
                    },
                    id
                  )) }) })
                }
              )
            ] }) }) })
          ] }),
          framePickerModalOpen && typeof document !== "undefined" && createPortal(/* @__PURE__ */ jsx("div", { className: "vq-modal-overlay", onClick: () => setFramePickerModalOpen(false), role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsxs("div", { className: "vq-modal-card vq-preset-modal", onClick: (e) => e.stopPropagation(), children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-modal-top-bar", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "vq-modal-step-sub", children: "STARTING LAYOUTS" }),
                /* @__PURE__ */ jsx("div", { className: "vq-modal-heading", children: "Choose a layout frame" })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-modal-close-x", onClick: () => setFramePickerModalOpen(false), "aria-label": "Close", children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: [
                /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
              ] }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-preset-note", children: "Pick a geometric frame — cards adapt seamlessly to the slots, and you can customize, resize, and add cards anytime." }),
            /* @__PURE__ */ jsx("div", { className: "p-4 overflow-y-auto max-h-[70vh]", children: /* @__PURE__ */ jsx(
              FramePicker,
              {
                frames,
                value: activeFrameKey,
                onChange: (frameKey) => {
                  chooseFrame(frameKey);
                  setFramePickerModalOpen(false);
                }
              }
            ) })
          ] }) }), document.body),
          stepperModalOpen && typeof document !== "undefined" && createPortal(/* @__PURE__ */ jsx("div", { className: "vq-modal-overlay", onClick: () => setStepperModalOpen(false), role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsxs("div", { className: "vq-modal-card", onClick: (e) => e.stopPropagation(), children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-modal-top-bar", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "vq-modal-step-sub", children: editingCardId ? familyLabel : step === 1 ? "ADD A CARD" : familyLabel }),
                /* @__PURE__ */ jsx("div", { className: "vq-modal-heading", children: step === 1 ? "Add to your dashboard" : editingCardId ? "Edit this card" : "Make it yours" })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-modal-close-x", onClick: () => setStepperModalOpen(false), "aria-label": "Close", children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: [
                /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
              ] }) })
            ] }),
            !editingCardId && step === 1 && /* @__PURE__ */ jsx("div", { className: "vq-family-tabs", role: "tablist", "aria-label": "What kind of card", children: [
              { t: "Metrics & charts", s: "Live numbers from your business" },
              { t: "Smart panels", s: "Ready-made interactive cards" },
              { t: "Shortcuts", s: "One-click buttons to any page" }
            ].map((f, i) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "tab",
                "aria-selected": categoryFolderIndex === i,
                className: `vq-family-tab ${categoryFolderIndex === i ? "is-active" : ""}`,
                onClick: () => setFamily(i),
                children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-family-tab-title", children: f.t }),
                  /* @__PURE__ */ jsx("span", { className: "vq-family-tab-sub", children: f.s })
                ]
              },
              f.t
            )) }),
            step === 1 && isReadingCard && /* @__PURE__ */ jsxs("div", { className: "vq-modal-filter-zone", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-modal-search-wrapper", children: [
                /* @__PURE__ */ jsxs("svg", { className: "vq-modal-search-icon", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                  /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" }),
                  /* @__PURE__ */ jsx("path", { d: "m21 21-4.3-4.3" })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    className: "vq-modal-search-input",
                    placeholder: "Search for anything — sales, stock, expenses…",
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    autoFocus: true
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-modal-chips-row", children: availableAreas.map((a) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: `vq-modal-chip ${selectedArea === a ? "is-active" : ""}`,
                  onClick: () => setSelectedArea(a),
                  children: a
                },
                a
              )) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: `vq-modal-scroll-area ${step === 2 ? "is-step2" : ""}`, children: step === 1 ? isReadingCard ? Object.keys(groupedSections).length === 0 ? /* @__PURE__ */ jsxs("p", { className: "vq-modal-empty", children: [
              "Nothing matches “",
              searchQuery,
              "”."
            ] }) : Object.keys(groupedSections).map((area) => /* @__PURE__ */ jsxs("div", { className: "vq-modal-section-group", children: [
              /* @__PURE__ */ jsx("div", { className: "vq-modal-section-title", children: area }),
              /* @__PURE__ */ jsx("div", { className: "vq-modal-cards-grid", children: groupedSections[area].map((r) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "vq-item-card",
                  onClick: () => selectMetricForStep2(r),
                  children: [
                    /* @__PURE__ */ jsxs("span", { className: "vq-item-card-top", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-item-card-title", children: r.label }),
                      /* @__PURE__ */ jsx("svg", { className: "vq-item-card-arrow", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-item-card-desc", children: r.desc || "" })
                  ]
                },
                r.key
              )) })
            ] }, area)) : isHubCard ? /* @__PURE__ */ jsxs("div", { className: "vq-modal-section-group", children: [
              /* @__PURE__ */ jsx("div", { className: "vq-modal-section-title", children: "Ready-made panels" }),
              /* @__PURE__ */ jsx("div", { className: "vq-modal-cards-grid", children: visibleTemplates.map((tmpl) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "vq-item-card",
                  onClick: () => selectTemplateForStep2(tmpl),
                  children: [
                    /* @__PURE__ */ jsxs("span", { className: "vq-item-card-top", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-item-card-title", children: tmpl.title }),
                      /* @__PURE__ */ jsx("svg", { className: "vq-item-card-arrow", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-item-card-desc", children: tmpl.desc })
                  ]
                },
                tmpl.type
              )) })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "vq-modal-section-group", children: [
              /* @__PURE__ */ jsx("div", { className: "vq-modal-section-title", children: "Pick where the button takes you" }),
              /* @__PURE__ */ jsx("div", { className: "vq-modal-cards-grid", children: SHORTCUT_TARGETS.map((target) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "vq-item-card",
                  onClick: () => selectCustomBtnForStep2(target),
                  children: [
                    /* @__PURE__ */ jsxs("span", { className: "vq-item-card-top", children: [
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: "vq-item-glyph",
                          style: { background: target.color },
                          dangerouslySetInnerHTML: { __html: engine()?.iconMarkup?.(target.icon, 15) || "" }
                        }
                      ),
                      /* @__PURE__ */ jsx("span", { className: "vq-item-card-title", children: target.label }),
                      /* @__PURE__ */ jsx("svg", { className: "vq-item-card-arrow", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-item-card-desc", children: "One click takes you straight there." })
                  ]
                },
                target.path
              )) })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "vq-step2-layout", children: [
              /* @__PURE__ */ jsx("div", { className: "vq-controls-pane", children: StylePanel }),
              /* @__PURE__ */ jsxs("div", { className: "vq-preview-stage", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-preview-bar", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-preview-title", children: "Live preview" }),
                  /* @__PURE__ */ jsxs("span", { className: "vq-preview-meta", children: [
                    draftGeo.w,
                    " × ",
                    draftGeo.h,
                    previewScale < 100 && /* @__PURE__ */ jsxs("em", { className: "vq-preview-scale", children: [
                      " · shown at ",
                      previewScale,
                      "%"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "vq-preview-zoom", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        className: previewZoom === "fit" ? "is-on" : "",
                        onClick: () => setPreviewZoom("fit"),
                        children: "Fit"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        className: previewZoom === "actual" ? "is-on" : "",
                        onClick: () => setPreviewZoom("actual"),
                        children: "100%"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-preview-frame", ref: previewFrameRef, children: [
                  /* @__PURE__ */ jsx("div", { className: "vq-preview-card-host", ref: previewRef }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "vq-preview-handle",
                      ref: previewHandleRef,
                      onPointerDown: onHandleDown,
                      "aria-label": "Drag to resize",
                      title: "Drag to resize"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("p", { className: "vq-preview-foot", children: "Drag the corner to resize — it snaps to sizes where everything always fits." })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "vq-modal-bottom-bar", children: [
              step === 1 ? /* @__PURE__ */ jsx("span", {}) : /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "vq-choice-btn",
                  onClick: () => {
                    if (editingCardId) {
                      setStepperModalOpen(false);
                      setEditingCardId(null);
                    } else setStep(1);
                  },
                  children: [
                    /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx("path", { d: "m15 18-6-6 6-6" }) }),
                    /* @__PURE__ */ jsx("span", { children: editingCardId ? "Cancel" : "Change card" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "vq-modal-bottom-actions", children: [
                /* @__PURE__ */ jsx("button", { type: "button", className: "vq-modal-close-btn", onClick: () => setStepperModalOpen(false), children: "Close" }),
                step === 2 && /* @__PURE__ */ jsx("button", { type: "button", className: "vqb vqb--primary", onClick: handleAddCardConfirm, children: editingCardId ? "Save changes" : "Add to dashboard" })
              ] })
            ] })
          ] }) }), document.body),
          railsModalOpen && typeof document !== "undefined" && createPortal(/* @__PURE__ */ jsx("div", { className: "vq-modal-overlay", onClick: () => setRailsModalOpen(false), role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsxs("div", { className: "vq-modal-card vq-preset-modal", onClick: (e) => e.stopPropagation(), children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-modal-top-bar", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "vq-modal-step-sub", children: "SIDE PANEL" }),
                /* @__PURE__ */ jsx("div", { className: "vq-modal-heading", children: "Choose a side panel" })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-modal-close-x", onClick: () => setRailsModalOpen(false), "aria-label": "Close", children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: [
                /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
              ] }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-preset-note", children: "A ready-made column that sits to the right of your cards — pick the one that matches how you work. Each is composed to fit; there is nothing to arrange." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-rails-layoutbar", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-rails-opt-group", role: "group", "aria-label": "Panel width", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-rails-opt-label", children: "Width" }),
                [[300, "Cosy"], [340, "Comfortable"], [380, "Wide"]].map(([w, n]) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: `vq-choice-btn ${railPrefs.width === w ? "is-active" : ""}`,
                    onClick: () => setRailOpt({ width: w }),
                    children: n
                  },
                  w
                ))
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-rails-opt-group", role: "group", "aria-label": "Panel behaviour", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-rails-opt-label", children: "Scrolling" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: `vq-choice-btn ${railPrefs.sticky ? "is-active" : ""}`,
                    onClick: () => setRailOpt({ sticky: true }),
                    children: "Stays in place"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: `vq-choice-btn ${!railPrefs.sticky ? "is-active" : ""}`,
                    onClick: () => setRailOpt({ sticky: false }),
                    children: "Scrolls with cards"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-rails-options", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: `vq-rail-option ${!panelDesign ? "is-on" : ""}`,
                  onClick: () => setRailOpt({ design: null, collapsed: false }),
                  children: /* @__PURE__ */ jsxs("span", { className: "vq-rail-option-text", children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-rail-option-name", children: "No side panel" }),
                    /* @__PURE__ */ jsx("span", { className: "vq-rail-option-desc", children: "Give the cards the full width." })
                  ] })
                }
              ),
              PANEL_DESIGNS.map((d) => {
                const usable = d.rails.some((rid) => availableRailDefs.some((x) => x.id === rid));
                if (!usable) return null;
                return /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: `vq-rail-option ${railPrefs.design === d.id ? "is-on" : ""}`,
                    onClick: () => setRailOpt({ design: d.id, collapsed: false }),
                    children: /* @__PURE__ */ jsxs("span", { className: "vq-rail-option-text", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-rail-option-name", children: d.name }),
                      /* @__PURE__ */ jsx("span", { className: "vq-rail-option-desc", children: d.desc })
                    ] })
                  },
                  d.id
                );
              })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-modal-bottom-bar", children: [
              /* @__PURE__ */ jsx("span", {}),
              /* @__PURE__ */ jsx("div", { className: "vq-modal-bottom-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "vqb vqb--primary", onClick: () => setRailsModalOpen(false), children: "Done" }) })
            ] })
          ] }) }), document.body),
          glassModalOpen && typeof document !== "undefined" && createPortal(/* @__PURE__ */ jsx("div", { className: "vq-glass-modal-overlay", onClick: () => setGlassModalOpen(false), role: "dialog", "aria-modal": "true", "aria-label": "Quick Actions", children: /* @__PURE__ */ jsxs("div", { className: "vq-glass-modal-card", onClick: (e) => e.stopPropagation(), children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-glass-modal-header", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-glass-modal-eyebrow", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-glass-pulse-dot" }),
                  /* @__PURE__ */ jsx("span", { children: "Command Centre Fast Lane" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "vq-glass-modal-title", children: "Quick Actions" }),
                /* @__PURE__ */ jsx("div", { className: "vq-glass-modal-desc", children: "Instant one-click shortcuts to key operational workflows." })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-glass-modal-close", onClick: () => setGlassModalOpen(false), "aria-label": "Close Quick Actions", children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: [
                /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
              ] }) })
            ] }),
            /* @__PURE__ */ jsx(GlassIcons, { items: glassActionItems, onActionClick: (item) => {
              setGlassModalOpen(false);
              if (item.action === "payment-in") {
                setPaymentModal({ isOpen: true, type: "in" });
              } else if (item.action === "payment-out") {
                setPaymentModal({ isOpen: true, type: "out" });
              } else if (item.href) {
                window.location.href = item.href;
              }
            } })
          ] }) }), document.body),
          /* @__PURE__ */ jsx(
            PaymentModal,
            {
              isOpen: paymentModal.isOpen,
              onClose: () => setPaymentModal((p) => ({ ...p, isOpen: false })),
              type: paymentModal.type,
              bankAccounts: bankAccounts || props?.bankAccounts || [],
              store
            }
          ),
          /* @__PURE__ */ jsxs("aside", { className: "side", children: [
            /* @__PURE__ */ jsx("div", { id: "edit" }),
            /* @__PURE__ */ jsxs("div", { className: "panel", id: "lib", children: [
              /* @__PURE__ */ jsxs("div", { className: "panel-h", children: [
                /* @__PURE__ */ jsx("h2", { className: "panel-t", children: "Card library" }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "vqc-act", id: "lib-close", "aria-label": "Close library", children: /* @__PURE__ */ jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                  /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "panel-b", id: "lib-body" })
            ] })
          ] })
        ]
      }
    )
  ] });
}
NewDashboard.layout = (page) => page;
export {
  NewDashboard as default
};

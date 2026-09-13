import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { f as formatCurrency, g as getCurrencySymbol } from "./format-131Nyq79.js";
import { router, usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { b as useTerms, u as useTermText } from "./terms-DwYjlWsV.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-7dqO8VCJ.js";
import { Sparkles, ArrowRight, ArrowLeft, ChevronDown, TrendingDown, Calendar, Wallet, Receipt, Layers, Check, X, Plus, Search, Filter, ChevronUp, Edit, Trash2, AlertTriangle, Tag, CreditCard, DollarSign, Monitor, FileText, Upload, User, Building2 } from "lucide-react";
import { C as ConfirmModal } from "./ConfirmModal-DaQlI6mj.js";
import axios from "axios";
import { v as vq } from "./runtime-DwSFgQZq.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function ExpenseTourGuide({ store, categories = [] }) {
  const [isCategoryCreationPath, setIsCategoryCreationPath] = useState(() => categories.length === 0);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const isVisible = store?.onboarding_step === "expense_tour" || store?.onboarding_step === "expense_congratulations";
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const getTargetId = (step) => {
    if (store?.onboarding_step === "expense_congratulations") {
      return "tour-chat-widget-btn";
    }
    if (isCategoryCreationPath) {
      switch (step) {
        case 1:
          return "tour-expense-create-btn";
        case 2:
          return "tour-expense-category";
        case 3:
          return "tour-add-expense-category-btn";
        case 4:
          return "tour-new-expense-category-name";
        case 5:
          return "tour-expense-amount";
        case 6:
          return "tour-expense-description";
        case 7:
          return "tour-expense-submit";
        default:
          return null;
      }
    } else {
      switch (step) {
        case 1:
          return "tour-expense-create-btn";
        case 2:
          return "tour-expense-category";
        case 3:
          return "tour-expense-amount";
        case 4:
          return "tour-expense-description";
        case 5:
          return "tour-expense-submit";
        default:
          return null;
      }
    }
  };
  useEffect(() => {
    if (!isVisible) {
      setCoords(null);
      return;
    }
    const targetId = getTargetId(currentStep);
    if (!targetId) {
      setCoords(null);
      return;
    }
    const updateCoords = () => {
      const el2 = document.getElementById(targetId);
      if (el2) {
        const rect = el2.getBoundingClientRect();
        let top = rect.top;
        let left = rect.left;
        let right = rect.right;
        let bottom = rect.bottom;
        const dropdown = el2.querySelector(".absolute");
        if (dropdown && window.getComputedStyle(dropdown).display !== "none" && dropdown.getBoundingClientRect().height > 0) {
          const dropRect = dropdown.getBoundingClientRect();
          top = Math.min(top, dropRect.top);
          left = Math.min(left, dropRect.left);
          right = Math.max(right, dropRect.right);
          bottom = Math.max(bottom, dropRect.bottom);
        }
        setCoords({
          top,
          left,
          width: right - left,
          height: bottom - top
        });
      } else {
        setCoords(null);
      }
    };
    const el = document.getElementById(targetId);
    if (el && store?.onboarding_step !== "expense_congratulations") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timer = setTimeout(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    const interval = setInterval(() => {
      updateCoords();
      if (store?.onboarding_step === "expense_tour") {
        const activeId = document.activeElement?.id;
        if (currentStep === 1) {
          if (document.getElementById("tour-expense-category")) {
            setCurrentStep(2);
          }
        } else if (isCategoryCreationPath) {
          if (currentStep === 2) {
            if (document.getElementById("tour-add-expense-category-btn")) {
              setCurrentStep(3);
            }
          } else if (currentStep === 3) {
            if (document.getElementById("tour-new-expense-category-name")) {
              setCurrentStep(4);
            }
          } else if (currentStep === 4) {
            if (activeId === "tour-expense-amount") {
              setCurrentStep(5);
            }
          } else if (currentStep === 5) {
            if (activeId === "tour-expense-description") {
              setCurrentStep(6);
            }
          }
        } else {
          if (currentStep === 2) {
            if (activeId === "tour-expense-amount") {
              setCurrentStep(3);
            }
          } else if (currentStep === 3) {
            if (activeId === "tour-expense-description") {
              setCurrentStep(4);
            }
          }
        }
      }
    }, 80);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [currentStep, isVisible, store?.onboarding_step, isCategoryCreationPath]);
  const handleCompleteTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "drive_sync_tour" },
      {
        onSuccess: () => {
          router.visit(route("store.admin.data", { store_slug: store?.slug, tab: "drive_sync" }));
        }
      }
    );
  };
  if (!isVisible) return null;
  if (store?.onboarding_step === "expense_congratulations") {
    return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-drawer overflow-hidden pointer-events-none", children: [
      coords && /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed pointer-events-none transition-all duration-fast ease-out",
          style: {
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12,
            borderRadius: "50%",
            boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 20px 8px rgba(99, 102, 241, 0.5), 0 0 0 3px rgb(99, 102, 241)",
            zIndex: 110
          }
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 flex items-center justify-center p-4 z-drawer pointer-events-auto", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-md bg-neutral-900/90 dark:bg-app border border-brand-500/30 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.2)] overflow-hidden animate-in zoom-in-95 duration-slow", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-lg mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white tracking-tight mb-3", children: "Setup Completed! 🎉" }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-semibold mb-2", children: "All onboarding stages are successfully finished!" }),
          /* @__PURE__ */ jsxs("p", { className: "text-neutral-300 text-xs leading-relaxed max-w-sm mb-6", children: [
            "Outstanding! You've cataloged products, added purchases stock, created sales invoices, and logged expenses.",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { className: "text-brand-400 font-bold", children: "Need help with anything else?" }),
            " Just ask in the highlighted floating AI Chat Widget. We are always ready to guide you!"
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleCompleteTour,
              className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-brand text-white font-bold rounded-xl shadow-md transition-all duration-normal active:scale-[0.99] cursor-pointer text-sm",
              children: /* @__PURE__ */ jsx("span", { children: "Finish Setup" })
            }
          )
        ] })
      ] }) })
    ] });
  }
  const getTooltipStyle = () => {
    if (currentStep === 0) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 115
      };
    }
    if (!coords) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 115
      };
    }
    if (isMobile) {
      return {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 115
      };
    }
    const spaceOnRight = window.innerWidth - (coords.left + coords.width);
    const spaceOnLeft = coords.left;
    if (spaceOnRight > 340) {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 80,
        left: coords.left + coords.width + 20,
        width: "320px",
        zIndex: 115
      };
    } else if (spaceOnLeft > 340) {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 80,
        left: coords.left - 340,
        width: "320px",
        zIndex: 115
      };
    } else {
      return {
        position: "fixed",
        top: coords.top + coords.height + 20,
        left: coords.left + coords.width / 2 - 160,
        width: "320px",
        zIndex: 115
      };
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-drawer overflow-hidden pointer-events-none", children: [
    coords && currentStep > 0 && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed pointer-events-none transition-all duration-fast ease-out",
        style: {
          top: coords.top - 6,
          left: coords.left - 6,
          width: coords.width + 12,
          height: coords.height + 12,
          borderRadius: "12px",
          boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)",
          zIndex: 110
        }
      }
    ),
    (!coords || currentStep === 0) && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/75 pointer-events-none z-drawer" }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: getTooltipStyle(),
        className: "bg-neutral-900/95 dark:bg-app border border-brand-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-drawer animate-in fade-in duration-slow",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-brand-500/10 rounded-lg text-brand-400 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "Expense Tour" }),
              /* @__PURE__ */ jsxs("span", { className: "text-2xs font-semibold text-brand-400", children: [
                "Step ",
                currentStep + 1,
                " of ",
                isCategoryCreationPath ? 8 : 6
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            currentStep === 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: "Let's record a store operating expense. This helps calculate exact net margins in real time!" }),
              /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(1),
                  className: "px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: "Let's Start" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                  ]
                }
              ) })
            ] }),
            isCategoryCreationPath ? /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click on the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Record Expense" }),
                " button to open the expense panel."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "You don't have any expense categories yet! Click on the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Expense Category" }),
                " selection box."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Create New Category" }),
                " at the bottom of the list."
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Type a name for your new expense category (e.g. ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Utilities" }),
                ") and press Enter to add it."
              ] }),
              currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Enter the total ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Expense Amount" }),
                "."
              ] }),
              currentStep === 6 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Fill in the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Description" }),
                " of the expense."
              ] }),
              currentStep === 7 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Submit" }),
                " or Save button to record the expense!"
              ] })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click on the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Record Expense" }),
                " button to open the expense panel."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Select an ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Expense Category" }),
                "."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Enter the total ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Expense Amount" }),
                "."
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Fill in the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Description" }),
                " of the expense."
              ] }),
              currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Submit" }),
                " or Save button to record the expense!"
              ] })
            ] }),
            currentStep > 0 && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep - 1),
                  className: "px-3 py-1.5 bg-neutral-800 text-ink-muted hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                    /* @__PURE__ */ jsx("span", { children: "Back" })
                  ]
                }
              ),
              currentStep < (isCategoryCreationPath ? 7 : 5) && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep + 1),
                  className: "px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: "Next" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    )
  ] });
}
const AC_OFF = "payee-search-" + Math.random().toString(36).slice(2);
function PartySearchField({ value, selectedParty, onSelect, onClear, store }) {
  const [query, setQuery] = React.useState(value || "");
  const [results, setResults] = React.useState([]);
  const [defaultResults, setDefaultResults] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const debounceRef = React.useRef(null);
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    axios.get(route("store.parties.search", {
      store_slug: store.slug
    }), { params: {} }).then((res) => setDefaultResults((res.data || []).slice(0, 5))).catch(() => {
    });
  }, []);
  const doSearch = React.useCallback(async (q) => {
    setSearching(true);
    try {
      const res = await axios.get(route("store.parties.search", {
        store_slug: store.slug
      }), { params: q ? { search: q } : {} });
      setResults(res.data || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);
  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (selectedParty) onClear();
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 220);
  };
  const handleFocus = () => {
    if (!query) {
      setResults(defaultResults);
      setOpen(defaultResults.length > 0);
    } else {
      setOpen(results.length > 0);
    }
  };
  const handleSelect = (party) => {
    setQuery(party.name);
    setOpen(false);
    onSelect(party);
  };
  const handleClear = () => {
    setQuery("");
    setResults(defaultResults);
    setOpen(false);
    onClear();
  };
  React.useEffect(() => {
    const h = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative", children: [
    /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-4 px-6 h-16 rounded-2xl border transition-all focus-within:ring-[6px] focus-within:ring-brand-500/10 shadow-sm ${selectedParty ? "border-emerald-500/60 bg-surface" : "border-line focus-within:border-brand-500 bg-surface"}
 }`, children: [
      /* @__PURE__ */ jsx(Search, { size: 14, className: "text-ink-muted shrink-0" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          name: AC_OFF,
          value: query,
          onChange: handleInput,
          onFocus: handleFocus,
          placeholder: "Search party name or phone...",
          autoComplete: "new-password",
          className: "flex-1 bg-transparent border-none outline-none text-base font-bold text-ink placeholder-slate-400 focus:ring-0",
          style: { boxShadow: "none" }
        }
      ),
      searching && /* @__PURE__ */ jsx("div", { className: "w-3.5 h-3.5 border-2 border-line-strong border-t-emerald-400 rounded-full animate-spin shrink-0" }),
      (query || selectedParty) && !searching && /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClear, className: "text-ink-muted hover:text-white transition shrink-0", children: /* @__PURE__ */ jsx(X, { size: 13 }) })
    ] }),
    selectedParty && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center gap-2 px-1", children: [
      /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { size: 9, className: "text-emerald-400" }) }),
      /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-emerald-400", children: selectedParty.name }),
      selectedParty.type && /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-ink-muted", children: selectedParty.type })
    ] }),
    open && results.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-1 rounded-[14px] border border-white/10 shadow-2xl z-sticky max-h-52 overflow-auto", style: { background: vq.slate[800] }, children: results.map((party) => {
      const bal = parseFloat(party.current_balance || 0);
      const settled = Math.abs(bal) < 0.01;
      const isReceive = party.balance_direction === "To Receive" || bal > 0;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => handleSelect(party),
          className: "w-full px-4 py-2.5 text-left hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0",
          children: [
            /* @__PURE__ */ jsx("div", { className: `w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${party.type === "customer" ? "bg-blue-500/20" : "bg-amber-500/20"}`, children: party.type === "customer" ? /* @__PURE__ */ jsx(User, { size: 12, className: "text-blue-400" }) : /* @__PURE__ */ jsx(Building2, { size: 12, className: "text-amber-400" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-white truncate", children: party.name }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted truncate", children: party.phone || party.email || party.type })
            ] }),
            !settled && /* @__PURE__ */ jsxs("span", { className: `text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isReceive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`, children: [
              isReceive ? "To Receive" : "To Pay",
              ": ",
              getCurrencySymbol(),
              " ",
              Math.abs(bal).toLocaleString()
            ] }),
            settled && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-white/10 text-ink-muted", children: "Settled" })
          ]
        },
        party.id
      );
    }) }),
    open && results.length === 0 && !searching && query && /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 right-0 mt-1 rounded-[14px] border border-white/10 shadow-xl z-sticky px-4 py-4 text-center text-sm text-ink-muted", style: { background: vq.slate[800] }, children: [
      'No results for "',
      query,
      '"'
    ] })
  ] });
}
function CustomSelect({ value, onChange, options, placeholder, error, onAddNew }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));
  React.useEffect(() => {
    const h = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen(!open),
        className: `w-full h-16 px-6 rounded-2xl text-base font-bold flex justify-between items-center border transition-all shadow-sm outline-none cursor-pointer bg-surface ${open ? "border-brand-500 ring-[6px] ring-brand-500/10" : error ? "border-rose-500" : "border-line hover:border-line-strong"}`,
        children: [
          /* @__PURE__ */ jsx("span", { className: selected ? "text-ink" : "text-ink-muted", children: selected ? selected.label : placeholder }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `text-ink-muted transition-transform ${open ? "rotate-180" : ""}` })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 right-0 mt-1 rounded-[14px] shadow-2xl border border-white/10 z-drawer py-1 max-h-52 overflow-auto hide-scrollbar", style: { background: vq.slate[800] }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            onChange("");
            setOpen(false);
          },
          className: "w-full text-left px-4 py-2.5 text-sm text-ink-muted hover:bg-white/5 transition-colors",
          children: placeholder
        }
      ),
      options.map((opt) => {
        const isSelected = String(value) === String(opt.value);
        return /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              onChange(opt.value);
              setOpen(false);
            },
            className: `w-full text-left px-4 py-2.5 text-sm transition-colors border-l-2 ${isSelected ? "border-brand-500 bg-brand-500/10 text-white font-bold" : "border-transparent text-neutral-300 hover:bg-white/5 hover:text-white"}`,
            children: opt.label
          },
          opt.value
        );
      }),
      onAddNew && /* @__PURE__ */ jsxs(
        "button",
        {
          id: "tour-add-expense-category-btn",
          type: "button",
          onClick: () => {
            setOpen(false);
            onAddNew();
          },
          className: "w-full text-left px-4 py-2.5 text-sm text-brand-400 font-bold hover:bg-brand-500/10 transition-colors flex items-center gap-2 border-t border-white/5 mt-1",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 14 }),
            "Create New Category"
          ]
        }
      )
    ] })
  ] });
}
function ExpensesIndex({ expenses = [], categories = [], stats = {}, bankAccounts = [], cashBalance = 0, filters = {}, serviceJobs = [] }) {
  const { tp } = useTerms();
  const tt = useTermText();
  const {
    store
  } = usePage().props;
  const [allExpenses, setAllExpenses] = useState(expenses.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(expenses.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  useEffect(() => {
    if (expenses.data && expenses.current_page === 1) {
      setAllExpenses(expenses.data);
      setNextPageUrl(expenses.next_page_url);
    }
  }, [expenses]);
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, { headers: { "Accept": "application/json" } });
      const newItems = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
      setAllExpenses((prev) => {
        if (!Array.isArray(prev)) prev = [];
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setNextPageUrl(response.data?.next_page_url || null);
    } catch (error) {
      console.error(error);
    } finally {
      isLoading.current = false;
    }
  }, [nextPageUrl]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) fetchNextPage();
    }, { threshold: 0.1, rootMargin: "800px" });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [nextPageUrl, fetchNextPage]);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [activeFilter, setActiveFilter] = useState(params.get("filter") || "all");
  const [activeCategory, setActiveCategory] = useState(params.get("category") || "all");
  const [dateRange, setDateRange] = useState({
    from: params.get("from_date") || "",
    to: params.get("to_date") || ""
  });
  const [sortConfig, setSortConfig] = useState({
    key: params.get("sort_by") || "date",
    direction: params.get("sort_dir") || "desc"
  });
  const [debouncedSearch] = useMemo(() => {
    let timer;
    return [
      (val) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          applyFilters({ search: val });
        }, 400);
      }
    ];
  }, [sortConfig, activeFilter, activeCategory, dateRange]);
  useEffect(() => {
    if (searchTerm !== (params.get("search") || "")) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm]);
  const applyFilters = (newParams) => {
    router.get(route("store.expenses.index", { store_slug: store.slug }), {
      search: searchTerm,
      filter: activeFilter,
      category: activeCategory === "all" ? "" : activeCategory,
      from_date: dateRange.from,
      to_date: dateRange.to,
      sort_by: sortConfig.key,
      sort_dir: sortConfig.direction,
      ...newParams
    }, { preserveState: true, preserveScroll: true, replace: true });
  };
  const sortedExpenses = allExpenses;
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
    applyFilters({ sort_by: key, sort_dir: direction });
  };
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    expense_category_id: "",
    service_job_id: "",
    category: "",
    amount: "",
    tax_amount: "",
    payment_method: "cash",
    bank_account_id: "",
    payee: "",
    reference: "",
    description: "",
    notes: "",
    attachment: null
  });
  const [errors, setErrors] = useState({});
  const [selectedParty, setSelectedParty] = useState(null);
  const grandTotalValue = (parseFloat(formData.amount) || 0) + (parseFloat(formData.tax_amount) || 0);
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const handleWheel = (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
        }
      };
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, []);
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("action") === "add" || queryParams.get("service_job_id")) {
      handleCreate();
    }
  }, []);
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "-";
  const handleServerSearch = (e) => {
    if (e.key === "Enter") {
      applyFilters({ search: searchTerm });
    }
  };
  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    applyFilters({ category: catId === "all" ? "" : catId });
  };
  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    applyFilters({ filter: filterType });
  };
  const handleCreate = () => {
    const qParams = new URLSearchParams(window.location.search);
    setEditingExpense(null);
    setFormData({
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      expense_category_id: activeCategory !== "all" ? activeCategory : "",
      service_job_id: qParams.get("service_job_id") || "",
      channel: "",
      category: "",
      amount: "",
      tax_amount: "",
      payment_method: "cash",
      bank_account_id: "",
      payee: "",
      reference: "",
      description: "",
      notes: "",
      attachment: null
    });
    setErrors({});
    setSelectedParty(null);
    setIsModalOpen(true);
  };
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setSelectedParty(expense.party_id ? { id: expense.party_id, name: expense.payee } : null);
    setFormData({
      date: expense.date ? expense.date.split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      expense_category_id: expense.expense_category_id || "",
      service_job_id: expense.service_job_id || "",
      channel: expense.channel || "",
      category: expense.category || "",
      amount: expense.amount || "",
      tax_amount: expense.tax_amount || "",
      payment_method: expense.payment_method || "cash",
      bank_account_id: expense.bank_account_id || "",
      payee: expense.payee || "",
      party_id: expense.party_id || "",
      reference: expense.reference || "",
      description: expense.description || "",
      notes: expense.notes || "",
      attachment: null
      // Don't preload file
    });
    setErrors({});
    setIsModalOpen(true);
  };
  const handleDeleteClick = (id) => {
    setExpenseToDelete(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await axios.delete(route("store.expenses.destroy", expenseToDelete));
      setShowDeleteModal(false);
      setExpenseToDelete(null);
      router.reload({ only: ["expenses", "stats"] });
    } catch (error) {
      alert("Failed to delete expense");
    }
  };
  const handleCreateCategory = async (nameOverride = null) => {
    const nameToUse = (typeof nameOverride === "string" ? nameOverride : newCategoryName).trim();
    if (!nameToUse) return;
    try {
      const res = await axios.post(route("store.expenses.category.store", { store_slug: store.slug }), { name: nameToUse });
      if (res.data.success) {
        setNewCategoryName("");
        setIsCreatingCategory(false);
        if (isModalOpen && res.data.category) {
          setFormData((prev) => ({ ...prev, expense_category_id: res.data.category.id }));
        }
        router.reload({ only: ["categories"] });
      }
    } catch (e) {
      alert("Failed to create category. " + (e.response?.data?.message || ""));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) data.append(key, formData[key]);
    });
    const newErrors = {};
    if (!formData.description?.trim()) newErrors.description = ["Description is required"];
    if (formData.payment_method === "bank" && !formData.bank_account_id) newErrors.bank_account_id = ["Bank account is required"];
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }
    try {
      if (editingExpense) {
        data.append("_method", "PUT");
        await axios.post(route("store.expenses.update", { store_slug: store.slug, expense: editingExpense.id }), data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await axios.post(route("store.expenses.store", { store_slug: store.slug }), data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      setIsModalOpen(false);
      if (store?.onboarding_step === "expense_tour") {
        router.post(
          route("store.onboarding.step", { store_slug: store?.slug }),
          { step: "expense_congratulations" },
          { preserveScroll: true }
        );
      } else {
        router.reload({ only: ["expenses", "stats"] });
      }
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Expenses", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Expenses" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-y-auto md:overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "expenses" }),
      /* @__PURE__ */ jsxs("div", { className: "flex md:hidden items-center justify-between bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase text-left shrink-0 mr-2",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `transition-transform duration-normal ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1 items-end text-xs font-bold text-ink-secondary", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-rose-600 dark:text-rose-400", children: [
            "Today: ",
            formatCurrency(stats.today)
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-neutral-300 dark:text-ink-secondary", children: "|" }),
          /* @__PURE__ */ jsxs("span", { className: "text-brand-600 dark:text-brand-400", children: [
            "Month: ",
            formatCurrency(stats.month)
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(TrendingDown, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Today's Expenses" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: formatCurrency(stats.today) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Calendar, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "This Week" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-amber-600", children: formatCurrency(stats.week) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(Wallet, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "This Month" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-brand-600", children: formatCurrency(stats.month) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-sunken text-ink-secondary rounded-lg", children: /* @__PURE__ */ jsx(Receipt, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Expenses" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: formatCurrency(stats.total) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: scrollContainerRef,
          onMouseDown: handleMouseDown,
          onMouseLeave: handleMouseLeave,
          onMouseUp: handleMouseUp,
          onMouseMove: handleMouseMove,
          className: "bg-surface px-2 py-2 rounded-xl border border-line shadow-sm shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar cursor-grab active:cursor-grabbing select-none",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-2 shrink-0", children: [
              /* @__PURE__ */ jsx(Layers, { size: 14, className: "text-ink-muted" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase mr-2", children: "Categories:" })
            ] }),
            isCreatingCategory && !isModalOpen ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 relative z-raised", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  autoFocus: true,
                  type: "text",
                  value: newCategoryName,
                  onChange: (e) => setNewCategoryName(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Enter") handleCreateCategory();
                    if (e.key === "Escape") setIsCreatingCategory(false);
                  },
                  placeholder: "Category Name",
                  className: "w-40 md:w-56 px-3 py-1.5 text-xs font-semibold bg-surface border border-brand-300 dark:border-line rounded-lg text-ink placeholder-slate-400 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-all shadow-sm"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleCreateCategory(),
                    className: "p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm active:scale-95 transition-all",
                    title: "Save Category (Enter)",
                    children: /* @__PURE__ */ jsx(Check, { size: 14 })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setIsCreatingCategory(false),
                    className: "p-1.5 bg-sunken text-ink-muted dark:text-ink-secondary rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover shadow-sm active:scale-95 transition-all",
                    title: "Cancel (Esc)",
                    children: /* @__PURE__ */ jsx(X, { size: 14 })
                  }
                )
              ] })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setIsCreatingCategory(true),
                  className: "hidden md:flex px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-line dark:border-line text-ink-muted hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-all whitespace-nowrap items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 12 }),
                    " Add Category"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setIsCreatingCategory(true),
                  className: "md:hidden p-1.5 rounded-lg border border-dashed border-line dark:border-line text-ink-muted hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-all shrink-0",
                  title: "Add Category",
                  children: /* @__PURE__ */ jsx(Plus, { size: 14 })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-6 w-px bg-sunken mx-1 shrink-0" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleCategoryChange("all"),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeCategory === "all" ? "bg-neutral-800 text-white dark:bg-white dark:text-ink" : "bg-sunken text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "md:hidden", children: "All" }),
                  /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "All Categories" })
                ]
              }
            ),
            categories.map((cat) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleCategoryChange(cat.id),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${String(activeCategory) === String(cat.id) ? "bg-brand-600 text-white shadow-lg " : "bg-brand-50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30"}`,
                children: /* @__PURE__ */ jsx("span", { children: cat.name })
              },
              cat.id
            ))
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "md:hidden flex flex-col gap-0 bg-surface rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-sm font-bold text-ink uppercase tracking-tight", children: [
            tp("expense", "Expenses"),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-rose-600", children: "Transactions" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileSearch ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                title: "Search",
                children: /* @__PURE__ */ jsx(Search, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileFilters(!showMobileFilters);
                  if (showMobileSearch) setShowMobileSearch(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileFilters ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                title: "Filter",
                children: /* @__PURE__ */ jsx(Filter, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                id: "tour-expense-create-btn-mobile",
                onClick: handleCreate,
                className: "ml-1 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 font-bold text-xs",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  " Record"
                ]
              }
            )
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsx("div", { className: "px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              onKeyDown: handleServerSearch,
              placeholder: "Search expenses...",
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none", size: 14 })
        ] }) }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal flex flex-col gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider shrink-0", children: "Period:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-sunken rounded-lg p-1 gap-1 flex-1", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => {
              handleFilterChange("all");
              setShowMobileFilters(false);
            }, className: `flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === "all" ? "bg-sunken text-ink shadow-sm" : "text-ink-muted hover:text-ink-secondary"}`, children: "All" }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              handleFilterChange("today");
              setShowMobileFilters(false);
            }, className: `flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === "today" ? "bg-rose-100 dark:bg-rose-900/20 text-rose-600" : "text-ink-muted hover:text-ink-secondary"}`, children: "Today" }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              handleFilterChange("month");
              setShowMobileFilters(false);
            }, className: `flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === "month" ? "bg-rose-100 dark:bg-rose-900/20 text-rose-600" : "text-ink-muted hover:text-ink-secondary"}`, children: "Month" }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              handleFilterChange("year");
              setShowMobileFilters(false);
            }, className: `flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === "year" ? "bg-rose-100 dark:bg-rose-900/20 text-rose-600" : "text-ink-muted hover:text-ink-secondary"}`, children: "Year" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col flex-1 min-h-0 bg-surface rounded-xl border border-line shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-2 md:p-3 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-2 bg-sunken/50 dark:bg-surface shrink-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between md:justify-start gap-2 w-full md:w-auto", children: [
            /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "w-64 relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: searchTerm,
                    onChange: (e) => setSearchTerm(e.target.value),
                    onKeyDown: handleServerSearch,
                    placeholder: "Search expenses...",
                    className: "w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
                  }
                ),
                /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none", size: 16 })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex bg-surface rounded-lg border border-line p-1", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => handleFilterChange("all"), className: `px-3 py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === "all" ? "bg-sunken text-ink" : "text-ink-muted hover:text-ink-secondary"}`, children: "All Time" }),
                /* @__PURE__ */ jsx("button", { onClick: () => handleFilterChange("today"), className: `px-3 py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === "today" ? "bg-rose-100 dark:bg-rose-900/20 text-rose-600" : "text-ink-muted hover:text-ink-secondary"}`, children: "Today" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex md:hidden items-center gap-1", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    setShowMobileSearch(!showMobileSearch);
                    if (showMobileFilters) setShowMobileFilters(false);
                  },
                  className: `p-2 rounded-lg transition-colors ${showMobileSearch ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                  children: /* @__PURE__ */ jsx(Search, { size: 18 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    setShowMobileFilters(!showMobileFilters);
                    if (showMobileSearch) setShowMobileSearch(false);
                  },
                  className: `p-2 rounded-lg transition-colors ${showMobileFilters ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                  children: /* @__PURE__ */ jsx(Filter, { size: 18 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                id: "tour-expense-create-btn-mobile",
                onClick: handleCreate,
                className: "md:hidden px-3.5 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 font-bold text-xs",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  "Record"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center gap-2", children: /* @__PURE__ */ jsxs(
            "button",
            {
              id: "tour-expense-create-btn",
              onClick: handleCreate,
              className: "px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95 font-bold text-sm",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 16 }),
                "Record Expense"
              ]
            }
          ) })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsx("div", { className: "md:hidden px-3 py-2 border-b border-line bg-app animate-in slide-in-from-top duration-normal w-full", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              onKeyDown: handleServerSearch,
              placeholder: "Search expenses...",
              className: "w-full pl-9 pr-4 py-2 text-sm bg-surface border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none", size: 16 })
        ] }) }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "md:hidden px-3 py-2.5 border-b border-line bg-app animate-in slide-in-from-top duration-normal flex flex-col gap-2 w-full", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "Time:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-surface rounded-lg border border-line p-1 flex-1", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => {
              handleFilterChange("all");
              setShowMobileFilters(false);
            }, className: `flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === "all" ? "bg-sunken text-ink" : "text-ink-muted hover:text-ink-secondary"}`, children: "All Time" }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              handleFilterChange("today");
              setShowMobileFilters(false);
            }, className: `flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === "today" ? "bg-rose-100 dark:bg-rose-900/20 text-rose-600" : "text-ink-muted hover:text-ink-secondary"}`, children: "Today" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto hidden md:block", children: [
          /* @__PURE__ */ jsxs("table", { className: "hidden md:table w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "sticky top-0 z-10 bg-app border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { onClick: () => handleSort("date"), className: "p-4 text-xs font-bold text-ink-muted uppercase cursor-pointer hover:bg-sunken dark:hover:bg-interactive-hover transition-colors w-[12%]", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Date ",
                sortConfig.key === "date" && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 12 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 12 }))
              ] }) }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase w-[15%]", children: "Category" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase w-[25%]", children: "Description & Payee" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase w-[12%]", children: "Payment" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase w-[10%]", children: "Ref" }),
              /* @__PURE__ */ jsx("th", { onClick: () => handleSort("amount"), className: "p-4 text-xs font-bold text-ink-muted uppercase cursor-pointer hover:bg-sunken dark:hover:bg-interactive-hover transition-colors text-right w-[15%]", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                "Amount ",
                sortConfig.key === "amount" && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 12 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 12 }))
              ] }) }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase text-right w-[11%]", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line bg-surface", children: sortedExpenses.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 7, className: "p-12 text-center text-ink-muted", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-sunken rounded-full flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsx(Layers, { size: 32, className: "text-neutral-300" }) }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary", children: "No expenses found" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm opacity-70", children: "Try adjusting filters or record a new expense." })
            ] }) }) : sortedExpenses.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover group transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "p-4 text-sm font-medium text-ink-secondary tabular-nums", children: formatDate(item.date) }),
              /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wide border ${item.category_color ? `bg-${item.category_color}-50 text-${item.category_color}-600 border-${item.category_color}-200` : "bg-sunken text-ink-secondary border-line"}`, children: item.category || "Uncategorized" }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink line-clamp-1", children: item.description || "No description" }),
                item.payee && /* @__PURE__ */ jsxs("span", { className: "text-1xs font-semibold text-ink-muted flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Search, { size: 10 }),
                  " ",
                  item.payee
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: `w-2 h-2 rounded-full ${item.payment_method === "cash" ? "bg-emerald-500" : "bg-blue-500"}` }),
                /* @__PURE__ */ jsx("span", { className: "uppercase text-xs font-bold text-ink-secondary", children: item.payment_method })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-mono text-ink-muted", children: item.reference || "-" }),
              /* @__PURE__ */ jsxs("td", { className: "p-4 text-right", children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-rose-600 text-sm tabular-nums", children: formatCurrency(parseFloat(item.amount) + (parseFloat(item.tax_amount) || 0)) }),
                item.tax_amount > 0 && /* @__PURE__ */ jsxs("p", { className: "text-3xs text-ink-muted", children: [
                  "(Inc. Tax: ",
                  getCurrencySymbol(),
                  " ",
                  item.tax_amount,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => handleEdit(item), className: "p-1.5 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600 rounded transition-colors", title: "Edit", children: /* @__PURE__ */ jsx(Edit, { size: 14 }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteClick(item.id), className: "p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 rounded transition-colors", title: "Delete", children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
              ] }) })
            ] }, item.id)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "hidden", children: sortedExpenses.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl p-8 text-center border border-line mx-2", children: [
            /* @__PURE__ */ jsx(Layers, { size: 32, className: "mx-auto text-ink-muted mb-2" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink-secondary", children: "No expenses found" })
          ] }) : sortedExpenses.map((item) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "p-3 mx-0 bg-surface border-b border-line flex flex-col gap-2 cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
              onClick: () => handleEdit(item),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink text-sm leading-tight", children: item.description || "No description" }),
                    item.payee && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-semibold mt-0.5", children: item.payee })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0 ml-2", children: [
                    item.reference && /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold text-brand-600 dark:text-brand-400 block", children: item.reference }),
                    /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted font-semibold block mt-0.5", children: formatDate(item.date) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-200/30", children: item.category || "Uncategorized" }),
                  item.payment_method && /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase bg-sunken text-ink-secondary dark:bg-surface dark:text-ink-muted px-2 py-0.5 rounded border border-line dark:border-line", children: item.payment_method })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-line pt-2 mt-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-bold uppercase block tracking-wider", children: "Amount" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums", children: formatCurrency(parseFloat(item.amount) + (parseFloat(item.tax_amount) || 0)) })
                    ] }),
                    parseFloat(item.tax_amount) > 0 && /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-bold uppercase block tracking-wider", children: "Tax" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums", children: formatCurrency(item.tax_amount) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleEdit(item),
                        className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors",
                        title: "Edit",
                        children: /* @__PURE__ */ jsx(Edit, { size: 16 })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleDeleteClick(item.id),
                        className: "p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-ink-muted hover:text-rose-600 transition-colors",
                        title: "Delete",
                        children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                      }
                    )
                  ] })
                ] })
              ]
            },
            item.id
          )) }),
          /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "hidden md:block mt-4 p-4 text-center text-ink-muted text-sm opacity-0 h-4", children: nextPageUrl ? "Loading..." : "" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:hidden flex flex-col gap-2 pb-20", children: [
        sortedExpenses.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl p-8 text-center border border-line", children: [
          /* @__PURE__ */ jsx(Layers, { size: 32, className: "mx-auto text-ink-muted mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink-secondary", children: "No expenses found" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Try adjusting filters or record a new expense." })
        ] }) : sortedExpenses.map((item) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "p-3 bg-surface rounded-xl border border-line shadow-sm flex flex-col gap-2 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors",
            onClick: () => handleEdit(item),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink text-sm leading-tight", children: item.description || "No description" }),
                  item.payee && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-semibold mt-0.5", children: item.payee })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0 ml-2", children: [
                  item.reference && /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold text-brand-600 dark:text-brand-400 block", children: item.reference }),
                  /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted font-semibold block mt-0.5", children: formatDate(item.date) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-200/30", children: item.category || "Uncategorized" }),
                item.payment_method && /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase bg-sunken text-ink-secondary dark:bg-surface dark:text-ink-muted px-2 py-0.5 rounded border border-line dark:border-line", children: item.payment_method })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-line pt-2 mt-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-bold uppercase block tracking-wider", children: "Amount" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums", children: formatCurrency(parseFloat(item.amount) + (parseFloat(item.tax_amount) || 0)) })
                  ] }),
                  parseFloat(item.tax_amount) > 0 && /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-bold uppercase block tracking-wider", children: "Tax" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums", children: formatCurrency(item.tax_amount) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleEdit(item),
                      className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors",
                      title: "Edit",
                      children: /* @__PURE__ */ jsx(Edit, { size: 16 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDeleteClick(item.id),
                      className: "p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-ink-muted hover:text-rose-600 transition-colors",
                      title: "Delete",
                      children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                    }
                  )
                ] })
              ] })
            ]
          },
          item.id
        )),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "py-4 text-center text-ink-muted text-sm", children: nextPageUrl ? "Loading more..." : "" })
      ] })
    ] }),
    isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-drawer flex items-end sm:items-center justify-center p-0 sm:p-6", style: { backdropFilter: "blur(16px)", backgroundColor: "rgba(15, 23, 42, 0.85)" }, children: /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-[95vw] 2xl:max-w-[1500px] h-full sm:h-auto sm:max-h-[96vh] bg-app rounded-none sm:rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-line animate-in fade-in zoom-in-95 duration-slower", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 px-4 sm:px-8 py-4 sm:py-6 border-b border-line flex items-center justify-between bg-surface backdrop-blur-xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-xl transform transition-transform hover:rotate-3 duration-slow", children: /* @__PURE__ */ jsx(Receipt, { size: 28, className: "text-white" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-ink tracking-tight", children: editingExpense ? "Refine Record" : "Record New Expense" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-1.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
                /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest", children: "Active V3 Sync" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold text-ink-muted uppercase tracking-widest opacity-80", children: "Verified Ledger Entry" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
          grandTotalValue > 0 && /* @__PURE__ */ jsxs("div", { className: "hidden lg:block text-right px-6 py-2.5 rounded-2xl bg-brand-50/50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50 shadow-inner", children: [
            /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold text-brand-400 uppercase tracking-widest leading-none mb-1.5", children: "Grand Total Impact" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-brand-600 dark:text-brand-400 tracking-tight", children: formatCurrency(grandTotalValue) })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setIsModalOpen(false),
              className: "w-12 h-12 flex items-center justify-center rounded-2xl text-ink-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900 group",
              children: /* @__PURE__ */ jsx(X, { size: 24, className: "transition-transform" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-8 custom-scrollbar", children: [
        errors && Object.keys(errors).length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-6 rounded-xl bg-rose-500/10 border-2 border-rose-500/20 dark:bg-rose-950/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-4 duration-slow", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 24, className: "shrink-0 text-rose-500" }),
            /* @__PURE__ */ jsx("h4", { className: "text-base font-bold uppercase tracking-wider", children: "Please correct the following:" })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "list-disc pl-5 space-y-1 text-sm font-bold", children: Object.entries(errors).map(([field, messages]) => {
            const fieldLabel = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const msg = Array.isArray(messages) ? messages[0] : messages;
            return /* @__PURE__ */ jsxs("li", { className: "tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { className: "capitalize", children: fieldLabel }),
              ": ",
              msg
            ] }, field);
          }) })
        ] }),
        /* @__PURE__ */ jsx("form", { encType: "multipart/form-data", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-surface shadow-md border border-line flex items-center justify-center text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(Layers, { size: 20 }) }),
              /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink uppercase tracking-widest", children: "Basic Details" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { id: "tour-expense-category", className: "group", children: [
                /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1 group-focus-within:text-brand-500 transition-colors", children: [
                  "Expense Category ",
                  /* @__PURE__ */ jsx("span", { className: "text-rose-500", children: "*" })
                ] }),
                isCreatingCategory && isModalOpen ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 animate-in zoom-in-95 duration-normal", children: [
                  /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                    /* @__PURE__ */ jsx(Tag, { size: 12, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        id: "tour-new-expense-category-name",
                        autoFocus: true,
                        type: "text",
                        value: newCategoryName,
                        onChange: (e) => setNewCategoryName(e.target.value),
                        onKeyDown: (e) => {
                          if (e.key === "Enter") handleCreateCategory();
                          if (e.key === "Escape") setIsCreatingCategory(false);
                        },
                        placeholder: "New Category Name...",
                        className: "w-full h-12 pl-9 pr-4 rounded-xl text-sm font-bold bg-surface border border-brand-500 text-ink focus:ring-4 focus:ring-brand-500/10 outline-none transition-all shadow-sm"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => handleCreateCategory(), className: "w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 transition-all", children: /* @__PURE__ */ jsx(Check, { size: 18 }) }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setIsCreatingCategory(false), className: "w-12 h-12 flex items-center justify-center bg-surface border border-line text-ink-muted rounded-xl hover:text-rose-500 hover:border-rose-500 active:scale-95 transition-all", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
                ] }) : /* @__PURE__ */ jsx(
                  CustomSelect,
                  {
                    value: formData.expense_category_id,
                    onChange: (val) => setFormData({ ...formData, expense_category_id: val }),
                    placeholder: "— Select Category —",
                    error: errors.expense_category_id,
                    options: categories.map((c) => ({ value: c.id, label: c.name })),
                    onAddNew: () => setIsCreatingCategory(true)
                  }
                ),
                errors.expense_category_id?.[0] && !isCreatingCategory && /* @__PURE__ */ jsxs("p", { className: "text-rose-500 text-2xs font-bold mt-2 ml-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(X, { size: 10 }),
                  " ",
                  errors.expense_category_id[0]
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "group", children: [
                /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1 group-focus-within:text-brand-500 transition-colors", children: [
                  "Date of Expense ",
                  /* @__PURE__ */ jsx("span", { className: "text-rose-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: formData.date,
                    onChange: (e) => setFormData({ ...formData, date: e.target.value }),
                    className: "w-full h-12 px-4 rounded-xl text-sm font-bold bg-surface border border-line text-ink focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none shadow-sm"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { id: "tour-expense-amount", className: "group p-6 rounded-xl bg-brand-600 text-white shadow-xl relative overflow-hidden", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
                /* @__PURE__ */ jsxs("label", { className: "block text-3xs font-bold text-brand-200 uppercase tracking-widest mb-3", children: [
                  "Amount (Excl. Tax) ",
                  /* @__PURE__ */ jsx("span", { className: "text-white", children: "*" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold text-brand-300/40 mr-3 select-none", children: getCurrencySymbol() }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      step: "0.01",
                      value: formData.amount,
                      onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
                      placeholder: "0.00",
                      className: "w-full bg-transparent text-4xl font-bold text-white border-none focus:ring-0 placeholder-brand-400/50 p-0"
                    }
                  )
                ] }),
                errors.amount?.[0] && /* @__PURE__ */ jsxs("div", { className: "mt-3 bg-rose-500/30 backdrop-blur-sm border border-rose-500/30 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(X, { size: 10 }),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold", children: errors.amount[0] })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-surface shadow-md border border-line flex items-center justify-center text-emerald-500", children: /* @__PURE__ */ jsx(CreditCard, { size: 20 }) }),
              /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink uppercase tracking-widest", children: "Payment & Tax" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "group", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1", children: "Payee / Vendor" }),
                /* @__PURE__ */ jsx(
                  PartySearchField,
                  {
                    store,
                    value: formData.payee,
                    selectedParty,
                    onSelect: (party) => {
                      setSelectedParty(party);
                      setFormData((f) => ({ ...f, payee: party.name, party_id: party.id }));
                    },
                    onClear: () => {
                      setSelectedParty(null);
                      setFormData((f) => ({ ...f, payee: "", party_id: "" }));
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "group", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1", children: "Payment Method" }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 p-1.5 bg-sunken rounded-2xl border border-line shadow-inner", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => setFormData({ ...formData, payment_method: "cash" }),
                      className: `h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.payment_method === "cash" ? "bg-sunken shadow text-emerald-600 dark:text-emerald-400 border border-line dark:border-line" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
                      children: [
                        /* @__PURE__ */ jsx(DollarSign, { size: 14 }),
                        " CASH"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => setFormData({ ...formData, payment_method: "bank" }),
                      className: `h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.payment_method === "bank" ? "bg-sunken shadow text-blue-600 dark:text-blue-400 border border-line dark:border-line" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
                      children: [
                        /* @__PURE__ */ jsx(Monitor, { size: 14 }),
                        " BANK"
                      ]
                    }
                  )
                ] })
              ] }),
              formData.payment_method === "bank" && /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-top-2 duration-slow", children: [
                /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1", children: [
                  "Bank Account ",
                  /* @__PURE__ */ jsx("span", { className: "text-rose-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsx(
                  CustomSelect,
                  {
                    value: formData.bank_account_id,
                    onChange: (val) => setFormData({ ...formData, bank_account_id: val }),
                    placeholder: "Choose Bank Account",
                    error: errors.bank_account_id,
                    options: bankAccounts.map((b) => ({
                      value: b.id,
                      label: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 w-full", children: [
                        /* @__PURE__ */ jsxs("span", { className: "truncate", children: [
                          b.name || b.bank_name,
                          " ",
                          b.account_number && /* @__PURE__ */ jsxs("span", { className: "text-ink-muted text-2xs ml-1", children: [
                            "(",
                            b.account_number,
                            ")"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("span", { className: "text-2xs font-bold text-ink-muted shrink-0", children: [
                          getCurrencySymbol(),
                          " ",
                          b.current_balance?.toLocaleString() || 0
                        ] })
                      ] })
                    }))
                  }
                ),
                errors.bank_account_id?.[0] && /* @__PURE__ */ jsxs("p", { className: "text-rose-500 text-2xs font-bold mt-2 ml-1", children: [
                  /* @__PURE__ */ jsx(X, { size: 10, className: "inline" }),
                  " ",
                  errors.bank_account_id[0]
                ] })
              ] }),
              formData.payment_method === "cash" && /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-top-2 duration-slow", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-2 ml-1", children: "Current Liquidity" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-12 px-4 rounded-xl bg-surface border border-line shadow-sm", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink-secondary", children: "Cash in Hand" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-emerald-600 dark:text-emerald-400", children: [
                    getCurrencySymbol(),
                    " ",
                    cashBalance?.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "group", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1", children: "Tax Amount" }),
                /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "absolute left-4 text-ink-muted font-bold text-xs", children: getCurrencySymbol() }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      step: "0.01",
                      value: formData.tax_amount,
                      onChange: (e) => setFormData({ ...formData, tax_amount: e.target.value }),
                      placeholder: "0.00",
                      className: "w-full h-12 pl-12 px-4 rounded-xl text-sm font-bold bg-surface border border-line text-ink focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none shadow-sm"
                    }
                  )
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-surface shadow-md border border-line flex items-center justify-center text-sky-500", children: /* @__PURE__ */ jsx(FileText, { size: 20 }) }),
              /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink uppercase tracking-widest", children: "Context & Proof" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "group", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1", children: "Reference No." }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.reference,
                    onChange: (e) => setFormData({ ...formData, reference: e.target.value }),
                    placeholder: "Receipt # or Bill Code",
                    className: "w-full h-12 px-4 rounded-xl text-sm font-mono bg-surface border border-line text-ink focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none shadow-sm"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { id: "tour-expense-description", className: "group", children: [
                /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1", children: [
                  "Description ",
                  /* @__PURE__ */ jsx("span", { className: "text-rose-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: formData.description,
                    onChange: (e) => setFormData({ ...formData, description: e.target.value }),
                    placeholder: "Specify the operational purpose...",
                    rows: 3,
                    className: `w-full px-4 py-3 rounded-xl text-sm font-medium bg-surface border ${errors.description ? "border-rose-500" : "border-line"} text-ink focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none resize-none placeholder-slate-400 dark:placeholder-slate-500 shadow-sm`
                  }
                ),
                errors.description?.[0] && /* @__PURE__ */ jsxs("p", { className: "text-rose-500 text-2xs font-bold mt-2 ml-1", children: [
                  /* @__PURE__ */ jsx(X, { size: 10, className: "inline" }),
                  " ",
                  errors.description[0]
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "group", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1", children: tt("Linked Work Order / Job (Optional)") }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: formData.service_job_id,
                    onChange: (e) => setFormData({ ...formData, service_job_id: e.target.value }),
                    className: "w-full h-12 px-4 rounded-xl text-sm font-bold bg-surface border border-line text-ink focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none shadow-sm",
                    children: [
                      /* @__PURE__ */ jsxs("option", { value: "", children: [
                        "— ",
                        tt("Not linked to a service job"),
                        " —"
                      ] }),
                      serviceJobs.map((job) => /* @__PURE__ */ jsxs("option", { value: job.id, children: [
                        job.number,
                        " — ",
                        job.title,
                        " ",
                        job.party?.name ? `(${job.party.name})` : ""
                      ] }, job.id))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "group", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1", children: "Physical Evidence" }),
                /* @__PURE__ */ jsxs(
                  "label",
                  {
                    className: `relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all p-6 text-center cursor-pointer ${formData.attachment ? "bg-brand-50/50 dark:bg-brand-900/10 border-brand-400 shadow-sm" : "bg-app border-line hover:border-brand-400 dark:hover:border-brand-500"}`,
                    children: [
                      /* @__PURE__ */ jsx("input", { type: "file", className: "sr-only", onChange: (e) => setFormData({ ...formData, attachment: e.target.files[0] }), accept: "image/*,.pdf" }),
                      formData.attachment ? /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg animate-in zoom-in-75 duration-slow", children: /* @__PURE__ */ jsx(Check, { size: 28 }) }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-brand-600 dark:text-brand-400 truncate max-w-[200px] px-2", children: formData.attachment.name }),
                          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-bold uppercase tracking-widest", children: "Captured Successfully" })
                        ] })
                      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-xl bg-surface border border-line flex items-center justify-center text-ink-muted shadow-sm transition-transform duration-slow", children: /* @__PURE__ */ jsx(Upload, { size: 24 }) }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-secondary group-hover:text-brand-500 transition-colors uppercase tracking-widest", children: "SECURE RECEIPT" }),
                          /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-bold uppercase tracking-widest", children: "PDF or Image Transfer" })
                        ] })
                      ] })
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-20 px-4 sm:px-8 py-4 sm:py-6 border-t border-line bg-app flex flex-col sm:flex-row items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold text-ink-muted uppercase tracking-widest leading-none mb-2", children: "Total Payable" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-ink tracking-tight", children: formatCurrency(grandTotalValue) }),
              /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-rose-500 uppercase tracking-widest px-1.5 py-0.5 bg-rose-500/10 rounded-md border border-rose-500/20", children: "OUT" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-10 w-px bg-sunken dark:bg-surface hidden md:block" }),
          /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${formData.payment_method === "cash" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"}` }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-widest", children: formData.payment_method === "cash" ? "Direct Liquidity Reduction" : "Bank Reconciliation Pending" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface border border-line", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-neutral-400" }),
              /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-bold uppercase tracking-widest", children: "Automatic V3 Ledger Sync" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 w-full sm:w-auto", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsModalOpen(false),
              className: "flex-1 sm:flex-none px-6 h-12 rounded-xl text-xs font-bold text-ink-muted hover:text-ink dark:hover:text-neutral-200 transition-all uppercase tracking-widest border border-transparent hover:border-line dark:hover:border-line-strong",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              id: "tour-expense-submit",
              type: "button",
              onClick: handleSubmit,
              disabled: loading,
              className: "flex-1 sm:flex-none px-10 h-12 rounded-xl bg-brand-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50",
              children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" }),
                /* @__PURE__ */ jsx("span", { children: "Saving..." })
              ] }) : /* @__PURE__ */ jsx("span", { children: editingExpense ? "Update Record" : "Save Record" })
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      ConfirmModal,
      {
        show: showDeleteModal,
        onClose: () => setShowDeleteModal(false),
        onConfirm: confirmDelete,
        title: "Delete Expense",
        message: "Are you sure you want to delete this expense record? This action cannot be undone.",
        confirmLabel: "Delete Expense",
        isDangerous: true
      }
    ),
    /* @__PURE__ */ jsx(ExpenseTourGuide, { store, categories })
  ] });
}
export {
  ExpensesIndex as default
};

import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { router, usePage, Head } from "@inertiajs/react";
import axios from "axios";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { createPortal } from "react-dom";
import { X, Sparkles, Rocket, ArrowRight, Box, ArrowLeft, CheckCircle2, CalendarDays, Banknote, Building2, CreditCard, Smartphone, Hash, FileText, ArrowDownCircle, ArrowUpCircle, Search, User, Minus, TrendingUp, TrendingDown, Wallet, ArrowDownLeft, ArrowUpRight, Plus, Activity, RefreshCw, Tag } from "lucide-react";
import { g as getCurrencySymbol, f as formatCurrency$1 } from "./format-131Nyq79.js";
import { F as FormModal } from "../ssr.js";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "dexie";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@inertiajs/react/server";
import "react-dom/server";
import "@headlessui/react";
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
function WelcomeTourModal({ store }) {
  const tt = useTermText();
  const [currentStep, setCurrentStep] = useState(() => {
    return store?.onboarding_step || "welcome";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const handleSkipAll = () => {
    setIsDismissed(true);
    try {
      router.post(
        route("store.onboarding.step", { store_slug: store?.slug }),
        { step: "skipped" },
        {
          preserveScroll: true,
          onError: () => {
          },
          onFinish: () => setIsSubmitting(false)
        }
      );
    } catch (e) {
    }
  };
  const renderPortal = (content) => {
    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
  };
  console.log("WelcomeTourModal render - currentStep:", currentStep, "coords:", coords, "store onboarding_step:", store?.onboarding_step, "element:", typeof document !== "undefined" ? document.getElementById("tour-stock-value") : "no doc");
  useEffect(() => {
    if (store?.onboarding_step) {
      setCurrentStep(store.onboarding_step);
    }
  }, [store?.onboarding_step]);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  useEffect(() => {
    window.activeOnboardingStep = currentStep;
    window.dispatchEvent(new CustomEvent("onboarding-step-changed", { detail: currentStep }));
  }, [currentStep]);
  useEffect(() => {
    if (currentStep !== "sidebar_stock" && currentStep !== "purchase_tour_sidebar") return;
    let attempts = 0;
    const attachListener = () => {
      const targetId = currentStep === "sidebar_stock" ? "tour-sidebar-products" : "tour-sidebar-purchases";
      const el = document.getElementById(targetId);
      if (el) {
        const handleSidebarClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (currentStep === "sidebar_stock") {
            handleFinalizeTour();
          } else {
            handleFinalizePurchaseTourStart();
          }
        };
        el.addEventListener("click", handleSidebarClick);
        return () => {
          el.removeEventListener("click", handleSidebarClick);
        };
      } else if (attempts < 10) {
        attempts++;
        setTimeout(attachListener, 100);
      }
    };
    return attachListener();
  }, [currentStep, store]);
  useEffect(() => {
    if (currentStep === "welcome" || currentStep === "purchase_tour_start") {
      setCoords(null);
      return;
    }
    const getVisibleElement = (id) => {
      const elements = document.querySelectorAll(`[id="${id}"]`);
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return el;
        }
      }
      return elements[0] || null;
    };
    const updateCoords = () => {
      let targetId = "tour-stock-value";
      if (currentStep === "sidebar_stock") {
        targetId = "tour-sidebar-products";
      } else if (currentStep === "purchase_tour_sidebar") {
        targetId = "tour-sidebar-purchases";
      }
      const el = getVisibleElement(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords((prev) => {
          if (prev && prev.top === rect.top && prev.left === rect.left && prev.width === rect.width && prev.height === rect.height) {
            return prev;
          }
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          };
        });
      } else {
        setCoords(null);
      }
    };
    const timer = setTimeout(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    const interval = setInterval(updateCoords, 50);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [currentStep]);
  const handleUpdateStep = (stepValue, completedStepValue = null) => {
    setIsSubmitting(true);
    const data = { step: stepValue };
    if (completedStepValue) {
      data.completed_step = completedStepValue;
    }
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      data,
      {
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleStartInvoiceTour = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "invoice_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.sales.invoice.create", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleStartPosTour = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "pos_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.pos", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleStartExpenseTour = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "expense_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.expenses.index", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleSkipInvoiceOrPos = () => {
    const doneSteps = store?.onboarding_steps_done || [];
    const nextStep = !doneSteps.includes("pos") ? "pos_tour_start" : "expense_tour_start";
    handleUpdateStep(nextStep, "invoice");
  };
  const handleSkipPos = () => {
    const doneSteps = store?.onboarding_steps_done || [];
    const nextStep = !doneSteps.includes("invoice") ? "invoice_tour_start" : "expense_tour_start";
    handleUpdateStep(nextStep, "pos");
  };
  const handleSkipExpense = () => {
    handleUpdateStep("completed", "expense");
  };
  const handleFinalizeTour = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "inventory_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.inventory.index", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const handleFinalizePurchaseTourStart = () => {
    setIsSubmitting(true);
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "purchase_tour" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.purchases.create", { store_slug: store?.slug }));
        },
        onFinish: () => setIsSubmitting(false)
      }
    );
  };
  const activeSteps = [
    "welcome",
    "purchase_tour_start",
    "invoice_tour_start",
    "pos_tour_start",
    "expense_tour_start",
    "stock_value",
    "sidebar_stock",
    "purchase_tour_sidebar"
  ];
  if (!activeSteps.includes(currentStep) || store?.onboarding_completed || store?.is_demo || isDismissed) {
    return null;
  }
  if (currentStep === "welcome") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-modal flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-modal animate-in zoom-in-95 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSkipAll,
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-ink-muted hover:text-white bg-sunken/50 hover:bg-interactive-hover p-2 rounded-full transition-all duration-normal z-10",
              title: "Skip Tour",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-lg mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsxs("h2", { className: "text-2xl md:text-3xl font-bold text-white tracking-tight mb-3", children: [
              "Welcome to ",
              /* @__PURE__ */ jsx("span", { className: "bg-gradient-brand bg-clip-text text-transparent", children: store?.name || "Your Store" }),
              "!"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-semibold mb-2", children: "Your store setup is complete. Let's get you up and running!" }),
            /* @__PURE__ */ jsx("p", { className: "text-neutral-300 text-sm leading-relaxed max-w-sm mb-8", children: tt("To help you get the most out of VenQore, we have prepared a quick, interactive tour of the platform. We will show you how to add your first product and manage stock.") }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep("stock_value"),
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-brand text-white font-bold rounded-xl shadow-lg transition-all duration-normal active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Start the Tour" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSkipAll,
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-sunken/80 hover:bg-interactive-hover text-ink-faint hover:text-white font-bold rounded-xl border border-neutral-700/60 transition-all duration-normal",
                  children: "Skip Tour"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  if (currentStep === "purchase_tour_start") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-modal flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-modal animate-in zoom-in-95 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleUpdateStep("skipped"),
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-ink-muted hover:text-white bg-sunken/50 hover:bg-interactive-hover p-2 rounded-full transition-all duration-normal z-10",
              title: "Skip Tour",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-lg mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-white tracking-tight mb-3", children: "Next Step: Buy Stock! 📦" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-semibold mb-2", children: tt("Your first product is cataloged, but your stock is still 0.") }),
            /* @__PURE__ */ jsx("p", { className: "text-neutral-300 text-sm leading-relaxed max-w-sm mb-8", children: tt("To sell products and print invoices, you must first add stock to your inventory. Let's record a purchase transaction to buy inventory from a supplier!") }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep("purchase_tour_sidebar"),
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-brand text-white font-bold rounded-xl shadow-lg transition-all duration-normal active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Record a Purchase" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleUpdateStep("skipped"),
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-sunken/80 hover:bg-interactive-hover text-ink-faint hover:text-white font-bold rounded-xl border border-neutral-700/60 transition-all duration-normal",
                  children: "Skip Tour"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  if (currentStep === "invoice_tour_start") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-modal flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-modal animate-in zoom-in-95 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSkipInvoiceOrPos,
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-ink-muted hover:text-white bg-sunken/50 hover:bg-interactive-hover p-2 rounded-full transition-all duration-normal z-10",
              title: "Skip Step",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-lg mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-white tracking-tight mb-3", children: "Generate B2B Invoice! 🧾" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-semibold mb-2", children: "Stage 3: Make Your First Wholesale/B2B Sale" }),
            /* @__PURE__ */ jsx("p", { className: "text-neutral-300 text-sm leading-relaxed max-w-sm mb-8", children: "To complete your onboarding, let's create a professional B2B sale invoice for a client purchase. We'll guide you step-by-step." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleStartInvoiceTour,
                  disabled: isSubmitting,
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-brand text-white font-bold rounded-xl shadow-lg transition-all duration-normal active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Start Invoice Tour" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSkipInvoiceOrPos,
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-sunken/80 hover:bg-interactive-hover text-ink-faint hover:text-white font-bold rounded-xl border border-neutral-700/60 transition-all duration-normal",
                  children: "Skip Step"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  if (currentStep === "pos_tour_start") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-modal flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-modal animate-in zoom-in-95 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSkipPos,
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-ink-muted hover:text-white bg-sunken/50 hover:bg-interactive-hover p-2 rounded-full transition-all duration-normal z-10",
              title: "Skip Step",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-white tracking-tight mb-3", children: "Open POS Register! 🛒" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-semibold mb-2", children: "Stage 3: Make Your First Retail POS Sale" }),
            /* @__PURE__ */ jsx("p", { className: "text-neutral-300 text-sm leading-relaxed max-w-sm mb-8", children: "Let's test checking out a retail sale using our high-speed, beautiful Point of Sale interface. We'll guide you step-by-step." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleStartPosTour,
                  disabled: isSubmitting,
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg transition-all duration-normal active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Start POS Tour" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSkipPos,
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-sunken/80 hover:bg-interactive-hover text-ink-faint hover:text-white font-bold rounded-xl border border-neutral-700/60 transition-all duration-normal",
                  children: "Skip Step"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  if (currentStep === "expense_tour_start") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-modal flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-modal animate-in zoom-in-95 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSkipExpense,
              disabled: isSubmitting,
              className: "absolute top-5 right-5 text-ink-muted hover:text-white bg-sunken/50 hover:bg-interactive-hover p-2 rounded-full transition-all duration-normal z-10",
              title: "Skip Step",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-lg mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Sparkles, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-white tracking-tight mb-3", children: "Record Store Expenses! 💸" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-semibold mb-2", children: "Stage 4: Add Store Operation Expense" }),
            /* @__PURE__ */ jsx("p", { className: "text-neutral-300 text-sm leading-relaxed max-w-sm mb-8", children: "To get an accurate picture of your net profits, let's record a store operating expense (like rent or utilities) in the expenses log. We'll guide you step-by-step." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleStartExpenseTour,
                  disabled: isSubmitting,
                  className: "flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-brand text-white font-bold rounded-xl shadow-lg transition-all duration-normal active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Rocket, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Start Expense Tour" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "ml-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSkipExpense,
                  disabled: isSubmitting,
                  className: "py-3 px-5 bg-sunken/80 hover:bg-interactive-hover text-ink-faint hover:text-white font-bold rounded-xl border border-neutral-700/60 transition-all duration-normal",
                  children: "Skip Step"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  const getTooltipStyle = () => {
    if (!coords) return { display: "none" };
    if (isMobile) {
      return {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 151
      };
    }
    if (currentStep === "stock_value") {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 90,
        left: coords.left - 340,
        width: "320px",
        zIndex: 151
      };
    }
    if (currentStep === "sidebar_stock" || currentStep === "purchase_tour_sidebar") {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 80,
        left: coords.left + coords.width + 20,
        width: "320px",
        zIndex: 151
      };
    }
    return {};
  };
  return renderPortal(
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-modal overflow-hidden pointer-events-none", children: [
      coords && /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed pointer-events-none transition-all duration-fast ease-out",
          style: {
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12,
            borderRadius: currentStep === "stock_value" ? "24px" : "8px",
            boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 18px 6px rgba(99, 102, 241, 0.45), 0 0 0 2px rgb(99, 102, 241)",
            zIndex: 150
          }
        }
      ),
      !coords && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/75 pointer-events-auto z-modal" }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          style: getTooltipStyle(),
          className: "bg-neutral-900/95 dark:bg-app border border-brand-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-modal animate-in fade-in slide-in-from-bottom-4 duration-slow",
          children: [
            !isMobile && currentStep === "stock_value" && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-[90px] -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-neutral-900 border-t border-r border-brand-500/30 rotate-45 z-10" }),
            !isMobile && (currentStep === "sidebar_stock" || currentStep === "purchase_tour_sidebar") && /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-[80px] -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-900 border-b border-l border-brand-500/30 rotate-45 z-10" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-brand-500/10 rounded-lg text-brand-400 shrink-0", children: /* @__PURE__ */ jsx(Box, { size: 20, className: "animate-pulse" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: currentStep === "stock_value" ? "Inventory Status" : "Add First Purchase" }),
                /* @__PURE__ */ jsx("span", { className: "text-2xs font-semibold text-brand-400", children: currentStep === "stock_value" ? "Step 1 of 2" : "Step 2 of 2" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              currentStep === "stock_value" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                  "Your ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Stock Value is Rs. 0" }),
                  ". We need to add stock in order to sell and generate invoices."
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setCurrentStep("welcome"),
                      className: "px-3 py-1.5 bg-neutral-800 text-ink-muted hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors",
                      children: [
                        /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                        /* @__PURE__ */ jsx("span", { children: "Back" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setCurrentStep("sidebar_stock"),
                      className: "px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Next Step" }),
                        /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                      ]
                    }
                  )
                ] })
              ] }),
              currentStep === "sidebar_stock" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                  "Let's add your first product. Click on the highlighted ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Products") }),
                  " menu link in the sidebar to open the catalog."
                ] }),
                !isMobile && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-brand-400 text-xs font-bold animate-bounce mt-1", children: [
                  /* @__PURE__ */ jsx(ArrowLeft, { size: 14, className: "animate-pulse" }),
                  /* @__PURE__ */ jsx("span", { children: tt("Click on the highlighted Products link") })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setCurrentStep("stock_value"),
                      className: "px-3 py-1.5 bg-neutral-800 text-ink-muted hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors",
                      children: [
                        /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                        /* @__PURE__ */ jsx("span", { children: "Back" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: handleFinalizeTour,
                      disabled: isSubmitting,
                      className: "px-4 py-1.5 bg-gradient-brand text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg active:scale-95 transition-all disabled:opacity-50",
                      children: [
                        /* @__PURE__ */ jsx("span", { children: tt("Let's Add Product") }),
                        /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                      ]
                    }
                  )
                ] })
              ] }),
              currentStep === "purchase_tour_sidebar" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                  "Let's record your first purchase. Click on the highlighted ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Purchases" }),
                  " menu link in the sidebar to create a new purchase transaction."
                ] }),
                !isMobile && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-brand-400 text-xs font-bold animate-bounce mt-1", children: [
                  /* @__PURE__ */ jsx(ArrowLeft, { size: 14, className: "animate-pulse" }),
                  /* @__PURE__ */ jsx("span", { children: "Click on the highlighted Purchases link" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setCurrentStep("purchase_tour_start"),
                      className: "px-3 py-1.5 bg-neutral-800 text-ink-muted hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors animate-in duration-slow",
                      children: [
                        /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                        /* @__PURE__ */ jsx("span", { children: "Back" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: handleFinalizePurchaseTourStart,
                      disabled: isSubmitting,
                      className: "px-4 py-1.5 bg-gradient-brand text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg active:scale-95 transition-all disabled:opacity-50",
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Go to Purchases" }),
                        /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                      ]
                    }
                  )
                ] })
              ] })
            ] })
          ]
        }
      )
    ] })
  );
}
function DashboardTourGuide({ store }) {
  const tt = useTermText();
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const renderPortal = (content) => {
    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
  };
  const isVisible = store?.onboarding_step === "dashboard_tour";
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const getTargetId = (step) => {
    switch (step) {
      case 0:
        return "tour-performance";
      case 1:
        return "tour-outstanding";
      case 2:
        return "tour-net-profit";
      case 3:
        return "tour-sales-chart";
      case 4:
        return "tour-sidebar-admin";
      case 5:
        return "tour-chat-widget-btn";
      default:
        return null;
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
    const getVisibleElement = (id) => {
      const elements = document.querySelectorAll(`[id="${id}"]`);
      for (let i = 0; i < elements.length; i++) {
        const el2 = elements[i];
        const rect = el2.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return el2;
        }
      }
      return elements[0] || null;
    };
    const updateCoords = () => {
      const el2 = getVisibleElement(targetId);
      if (el2) {
        const rect = el2.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else {
        setCoords(null);
      }
    };
    const el = getVisibleElement(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timer = setTimeout(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [currentStep, isVisible]);
  const handleCompleteTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "completed" },
      { preserveScroll: true, preserveState: false }
    );
  };
  if (!isVisible) return null;
  const getTooltipStyle = () => {
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
    const tooltipWidth = 360;
    const tooltipHeight = 220;
    const spacing = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let top = coords.top + coords.height + spacing;
    let left = coords.left + coords.width / 2 - tooltipWidth / 2;
    if (top + tooltipHeight > viewportHeight) {
      top = coords.top - tooltipHeight - spacing;
    }
    if (left < spacing) {
      left = spacing;
    } else if (left + tooltipWidth > viewportWidth - spacing) {
      left = viewportWidth - tooltipWidth - spacing;
    }
    if (currentStep === 4) {
      left = coords.left + coords.width + spacing;
      top = coords.top;
    } else if (currentStep === 5) {
      left = coords.left - tooltipWidth - spacing;
      top = coords.top - tooltipHeight + coords.height;
    }
    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 115
    };
  };
  return renderPortal(
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-modal overflow-hidden pointer-events-none", children: [
      coords && /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed pointer-events-none transition-all duration-slow ease-out",
          style: {
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12,
            borderRadius: currentStep === 5 ? "50%" : "12px",
            boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)",
            zIndex: 151
          }
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "pointer-events-auto transition-all duration-slow ease-out",
          style: getTooltipStyle(),
          children: /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900/90 dark:bg-app backdrop-blur-xl border border-brand-500/30 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.2)] p-6 relative overflow-hidden animate-in zoom-in-95 duration-normal", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-brand-500/20 text-brand-400", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "Dashboard Overview" }),
                /* @__PURE__ */ jsxs("span", { className: "text-2xs font-semibold text-brand-400", children: [
                  "Step ",
                  currentStep + 1,
                  " of 6"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "min-h-[60px] mb-6", children: [
              currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Here you can view your overall ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Sales Performance" }),
                " and ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Gross Profit" }),
                ". Use the dropdown to filter by different time periods to see how you are doing."
              ] }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "This section shows your pending ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Outstanding" }),
                " receivables and payables. Keep an eye here to maintain healthy cash flow!"
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Your ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Net Profit" }),
                " summary. It instantly calculates your true bottom line based on your income and expenses."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "The ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Sales Chart" }),
                " gives you a visual representation of your sales trends over time, making it easy to spot peaks and valleys."
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "The ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Admin Panel" }),
                ". You can configure advanced settings, manage users, and more! ",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-brand-400", children: tt("Need a training session for you or your staff?") }),
                " Check the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Billing Page > Services") }),
                " to arrange a meeting!"
              ] }),
              currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "And finally, the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Chat Widget" }),
                "! If you want to know how to do anything extra, you can ask us here and we will guide you through every single thing. We're always here to help!"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-auto", children: [
              currentStep > 0 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep - 1),
                  className: "px-3 py-1.5 text-ink-muted hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                    /* @__PURE__ */ jsx("span", { children: "Back" })
                  ]
                }
              ) : /* @__PURE__ */ jsx("div", {}),
              currentStep < 5 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep + 1),
                  className: "px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: "Next" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                  ]
                }
              ) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleCompleteTour,
                  className: "px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer animate-pulse",
                  children: "Finish Setup"
                }
              )
            ] })
          ] })
        }
      )
    ] })
  );
}
const formatCurrency = (v, symbol = "Rs") => symbol + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const AC_OFF_NAME = "party-search-" + Math.random().toString(36).slice(2);
const METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "bank", label: "Bank", icon: Building2 },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "upi", label: "UPI/JazzCash", icon: Smartphone }
];
function PartySearchField({ selectedParty, onSelect, onClear, store, isIn }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [defaultResults, setDefaultResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  useEffect(() => {
    axios.get(route("store.parties.search", { store_slug: store.slug }), { params: {} }).then((res) => setDefaultResults((res.data || []).slice(0, 5))).catch(() => {
    });
  }, [store.slug]);
  const search = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await axios.get(route("store.parties.search", { store_slug: store.slug }), { params: q ? { search: q } : {} });
      setResults(res.data || []);
      setOpen(true);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [store.slug]);
  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (selectedParty) onClear();
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 220);
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
    setResults([]);
    onSelect(party);
  };
  const handleClear = () => {
    setQuery("");
    setResults(defaultResults);
    setOpen(false);
    onClear();
  };
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const balanceBadge = () => {
    if (!selectedParty) return null;
    const bal = parseFloat(selectedParty.current_balance || 0);
    const dir = selectedParty.balance_direction || (bal > 0 ? "To Receive" : bal < 0 ? "To Pay" : "Settled");
    if (Math.abs(bal) < 0.01) return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunken text-ink-muted text-2xs font-bold", children: [
      /* @__PURE__ */ jsx(Minus, { size: 10 }),
      " Settled"
    ] });
    const isReceive = dir === "To Receive";
    return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold ${isReceive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`, children: [
      isReceive ? /* @__PURE__ */ jsx(TrendingUp, { size: 10 }) : /* @__PURE__ */ jsx(TrendingDown, { size: 10 }),
      dir,
      ": ",
      formatCurrency(Math.abs(bal), store?.currency_symbol)
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative", children: [
    /* @__PURE__ */ jsxs("div", { style: { outline: "none" }, className: `flex items-center gap-2 w-full px-3 py-3 rounded-xl bg-app border ${selectedParty ? isIn ? "border-emerald-500" : "border-rose-500" : "border-line"} transition-all focus-within:border-brand-500`, children: [
      /* @__PURE__ */ jsx(Search, { size: 15, className: "text-ink-muted shrink-0" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          name: AC_OFF_NAME,
          value: query,
          onChange: handleInput,
          onFocus: handleFocus,
          placeholder: "Click or type name / phone...",
          className: "flex-1 bg-transparent border-none outline-none text-sm text-ink placeholder-slate-400",
          autoComplete: "new-password",
          style: { outline: "none", boxShadow: "none" }
        }
      ),
      loading && /* @__PURE__ */ jsx("div", { className: `w-4 h-4 border-2 border-line ${isIn ? "border-t-emerald-500" : "border-t-rose-500"} rounded-full animate-spin shrink-0` }),
      (query || selectedParty) && !loading && /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClear, className: "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition shrink-0", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    selectedParty && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center gap-2 px-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full ${isIn ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-rose-100 dark:bg-rose-900/40"} flex items-center justify-center`, children: /* @__PURE__ */ jsx(User, { size: 10, className: isIn ? "text-emerald-600" : "text-rose-600" }) }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-ink-secondary", children: selectedParty.name }),
        selectedParty.type && /* @__PURE__ */ jsx("span", { className: `text-3xs font-bold uppercase px-1.5 py-0.5 rounded-full ${selectedParty.type === "customer" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"}`, children: selectedParty.type })
      ] }),
      balanceBadge()
    ] }),
    open && results.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-[14px] shadow-2xl z-50 max-h-56 overflow-auto", children: results.map((party) => {
      const bal = parseFloat(party.current_balance || 0);
      const dir = party.balance_direction || (bal > 0 ? "To Receive" : bal < 0 ? "To Pay" : "Settled");
      const settled = Math.abs(bal) < 0.01;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => handleSelect(party),
          className: "w-full px-4 py-2.5 text-left hover:bg-interactive-hover dark:hover:bg-interactive-hover flex items-center gap-3 transition-colors border-b border-line last:border-0",
          children: [
            /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${party.type === "customer" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`, children: party.type === "customer" ? /* @__PURE__ */ jsx(User, { size: 13, className: "text-blue-600 dark:text-blue-400" }) : /* @__PURE__ */ jsx(Building2, { size: 13, className: "text-amber-600 dark:text-amber-400" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-ink truncate", children: party.name }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted truncate", children: party.phone || party.email || party.type })
            ] }),
            !settled && /* @__PURE__ */ jsxs("span", { className: `text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${dir === "To Receive" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`, children: [
              dir,
              ": ",
              formatCurrency(Math.abs(bal), store?.currency_symbol)
            ] }),
            settled && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-sunken text-ink-muted dark:bg-raised dark:text-ink-muted", children: "Settled" })
          ]
        },
        party.id
      );
    }) }),
    open && results.length === 0 && !loading && query && /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-[14px] shadow-xl z-50 px-4 py-5 text-center", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-ink-secondary", children: [
        'No contacts found for "',
        query,
        '"'
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-0.5", children: "Try a different name or phone number" })
    ] })
  ] });
}
function PaymentModal({ isOpen, onClose, type = "in", bankAccounts = [], store }) {
  const isIn = type === "in";
  const [loading, setLoading] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [formData, setFormData] = useState({
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    party_id: "",
    party_name: "",
    amount: "",
    payment_method: "cash",
    bank_account_id: "",
    reference: "",
    description: ""
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        party_id: "",
        party_name: "",
        amount: "",
        payment_method: "cash",
        bank_account_id: "",
        reference: "",
        description: ""
      });
      setSelectedParty(null);
      setErrors({});
      setSuccess(false);
    }
  }, [isOpen]);
  const handlePartySelect = (party) => {
    setSelectedParty(party);
    setFormData((prev) => ({ ...prev, party_id: party.id, party_name: party.name }));
  };
  const handlePartyClear = () => {
    setSelectedParty(null);
    setFormData((prev) => ({ ...prev, party_id: "", party_name: "" }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await axios.post(route("store.payments.store", { store_slug: store.slug }), { ...formData, type });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.reload();
      }, 1e3);
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  const ringClass = isIn ? "ring-emerald-500/20" : "ring-rose-500/20";
  const buttonBgClass = isIn ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 " : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 ";
  return /* @__PURE__ */ jsx(
    FormModal,
    {
      isOpen,
      onClose,
      title: isIn ? "Record Payment In" : "Record Payment Out",
      subtitle: isIn ? "Money received from a contact" : "Money paid to a contact",
      size: "md",
      confirmClose: !success && (formData.amount || formData.party_id || formData.description),
      children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: [
            isIn ? "Receive From" : "Pay To",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            PartySearchField,
            {
              selectedParty,
              onSelect: handlePartySelect,
              onClear: handlePartyClear,
              store,
              isIn
            }
          ),
          errors.party_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.party_id[0] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: [
              "Date ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(CalendarDays, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: formData.date,
                  onChange: (e) => setFormData((p) => ({ ...p, date: e.target.value })),
                  className: `w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`
                }
              )
            ] }),
            errors.date && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.date[0] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: [
              "Amount ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-bold", children: getCurrencySymbol(store) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: formData.amount,
                  onChange: (e) => setFormData((p) => ({ ...p, amount: e.target.value })),
                  placeholder: "0",
                  className: `w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`
                }
              )
            ] }),
            errors.amount && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.amount[0] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-2", children: [
            "Payment Method ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: METHODS.map((m) => {
            const isSelected = formData.payment_method === m.value;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setFormData((p) => ({ ...p, payment_method: m.value })),
                className: `flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border-2 transition-all text-2xs font-bold uppercase ${isSelected ? `${isIn ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"}` : "border-line text-ink-muted hover:border-line dark:hover:border-line-strong bg-app"}`,
                children: [
                  /* @__PURE__ */ jsx(m.icon, { size: 16 }),
                  m.label
                ]
              },
              m.value
            );
          }) })
        ] }),
        formData.payment_method === "bank" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: "Bank Account" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: formData.bank_account_id,
              onChange: (e) => setFormData((p) => ({ ...p, bank_account_id: e.target.value })),
              className: `w-full px-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`,
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select account..." }),
                bankAccounts.map((acc) => /* @__PURE__ */ jsx("option", { value: acc.id, children: acc.name }, acc.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: "Reference No." }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Hash, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formData.reference,
                  onChange: (e) => setFormData((p) => ({ ...p, reference: e.target.value })),
                  placeholder: "Cheque / TxID",
                  className: `w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5", children: "Description" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(FileText, { size: 13, className: "absolute left-3 top-3 text-ink-muted" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formData.description,
                  onChange: (e) => setFormData((p) => ({ ...p, description: e.target.value })),
                  placeholder: "Notes...",
                  className: `w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-app border border-line text-ink outline-none focus:ring-2 ${ringClass} focus:border-brand-500 transition`
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "border-t border-line" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300 transition",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: loading || success,
              className: `flex items-center gap-2 px-6 py-2.5 text-white font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-60 ${buttonBgClass}`,
              children: success ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
                " Recorded!"
              ] }) : loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" }),
                " Recording..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                isIn ? /* @__PURE__ */ jsx(ArrowDownCircle, { size: 16 }) : /* @__PURE__ */ jsx(ArrowUpCircle, { size: 16 }),
                "Record Payment ",
                isIn ? "In" : "Out"
              ] })
            }
          )
        ] })
      ] })
    }
  );
}
const ActionMenu = ({ isOpen, onClose, store, onAction }) => {
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
  ];
  return /* @__PURE__ */ jsxs("div", { className: "absolute top-full mt-2 right-0 w-72 bg-[#121624]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 p-3 z-50 animate-in fade-in zoom-in-95 duration-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center px-2 py-1.5 border-b border-white/10 mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-neutral-300 uppercase tracking-wider", children: "Quick Actions" }),
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
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto custom-scrollbar", children: actions.map((action, i) => /* @__PURE__ */ jsxs(
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
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#121624] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden", children: [
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
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-[#0a0d17]", children: [
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
    /* @__PURE__ */ jsxs("div", { className: "p-4 grid grid-cols-4 gap-2 border-t border-white/10 bg-[#121624]", children: [
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1.5 p-2.5 bg-emerald-500/10 rounded-2xl hover:bg-emerald-500/20 border border-emerald-500/20 transition-all group", children: [
        /* @__PURE__ */ jsx(ArrowDownLeft, { size: 16, className: "text-emerald-400 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-emerald-400", children: "Add" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1.5 p-2.5 bg-rose-500/10 rounded-2xl hover:bg-rose-500/20 border border-rose-500/20 transition-all group", children: [
        /* @__PURE__ */ jsx(ArrowUpRight, { size: 16, className: "text-rose-400 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-rose-400", children: "Remove" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
        onNavigate("store.funds.index");
        onClose();
      }, className: "flex flex-col items-center gap-1.5 p-2.5 bg-sky-500/10 rounded-2xl hover:bg-sky-500/20 border border-sky-500/20 transition-all group", children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 16, className: "text-sky-400 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-sky-400", children: "Transfer" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
        onNavigate("store.funds.index", { view: "history" });
        onClose();
      }, className: "flex flex-col items-center gap-1.5 p-2.5 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/10 transition-all group", children: [
        /* @__PURE__ */ jsx(FileText, { size: 16, className: "text-neutral-400 group-hover:scale-110 transition-transform" }),
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
  const canViewBalances = auth?.user?.is_platform_admin || userPerms.includes("*") || userPerms.includes("finance.balances");
  const resolvedCashData = cashData || extraProps.cashData || pageProps.cashData;
  const resolvedBankAccounts = bankAccounts && bankAccounts.length > 0 ? bankAccounts : extraProps.bankAccounts || pageProps.bankAccounts || [];
  const resolvedInventoryValue = inventoryValue || extraProps.inventoryValue || pageProps.inventoryValue || 0;
  const resolvedTransactions = recentTransactions && recentTransactions.length > 0 ? recentTransactions : extraProps.recentTransactions || pageProps.recentTransactions || [];
  const glBalance = parseFloat(resolvedCashData?.balance ?? (Array.isArray(pageProps.cashAccounts) ? pageProps.cashAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0) : -176951.31));
  const bankBalance = resolvedBankAccounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);
  const stockVal = parseFloat(resolvedInventoryValue || 515187.5);
  const totalBalance = canViewBalances ? glBalance + bankBalance : 204591.69;
  const formatMoney = (amount) => {
    if (store) {
      return formatCurrency$1(parseFloat(amount), store);
    }
    const sym = "Rs ";
    const val = parseFloat(amount) || 0;
    return `${sym}${val.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const displayBankAccounts = resolvedBankAccounts && resolvedBankAccounts.length > 0 ? resolvedBankAccounts : [
    { id: "b1", name: "Alfalah", bank_name: "Alfalah", account_number: "---", current_balance: 427318 },
    { id: "b2", name: "Jazzcash", bank_name: "Jazzcash", account_number: "2342", current_balance: -45775 }
  ];
  const displayTransactions = resolvedTransactions && resolvedTransactions.length > 0 ? resolvedTransactions : [
    { type: "Transaction", amount: "+Rs 12,560.00", time: "1 month ago", activityType: "sale" },
    { type: "Sale", amount: "+Rs 320.00", time: "2 days ago", activityType: "sale" },
    { type: "Sale", amount: "+Rs 80.00", time: "2 days ago", activityType: "sale" }
  ];
  return /* @__PURE__ */ jsxs(
    "aside",
    {
      className: `w-full flex flex-col justify-between rounded-3xl bg-[#090D18]/95 border border-white/[0.08] p-4 sm:p-5 shadow-2xl backdrop-blur-2xl text-white relative overflow-hidden ${sticky ? "sticky top-4 h-[calc(100vh-2rem)]" : "h-full min-h-[640px]"} ${className}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 pointer-events-none overflow-hidden opacity-80", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute -top-16 -right-16 w-64 h-64 rounded-full blur-[70px] opacity-40 animate-pulse",
              style: { background: "radial-gradient(circle, #23C4A6 0%, rgba(11,170,143,0) 70%)" }
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute top-1/3 -left-20 w-60 h-60 rounded-full blur-[75px] opacity-30",
              style: { background: "radial-gradient(circle, #55C4EC 0%, rgba(43,165,209,0) 70%)" }
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute -bottom-16 -right-12 w-64 h-64 rounded-full blur-[80px] opacity-25",
              style: { background: "radial-gradient(circle, #FF8A6B 0%, rgba(242,106,71,0) 70%)" }
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full blur-[65px] opacity-20",
              style: { background: "radial-gradient(circle, #A9E34B 0%, rgba(140,203,46,0) 70%)" }
            }
          ),
          /* @__PURE__ */ jsxs("svg", { className: "absolute inset-0 h-full w-full opacity-[0.035]", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ jsxs("filter", { id: "vq-sidebar-grain", children: [
              /* @__PURE__ */ jsx("feTurbulence", { type: "fractalNoise", baseFrequency: "0.85", numOctaves: "3", stitchTiles: "stitch" }),
              /* @__PURE__ */ jsx("feColorMatrix", { type: "saturate", values: "0" })
            ] }),
            /* @__PURE__ */ jsx("rect", { width: "100%", height: "100%", filter: "url(#vq-sidebar-grain)" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          CashDetailModal,
          {
            isOpen: isCashModalOpen,
            onClose: () => setIsCashModalOpen(false),
            transactions: resolvedCashData?.transactions || [],
            onNavigate: handleNavigate,
            store
          }
        ),
        /* @__PURE__ */ jsx(
          PaymentModal,
          {
            isOpen: paymentModal.isOpen,
            onClose: () => setPaymentModal((p) => ({ ...p, isOpen: false })),
            type: paymentModal.type,
            bankAccounts: resolvedBankAccounts,
            store
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto no-scrollbar relative z-10 pb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 pt-1", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white shadow-inner shrink-0", children: /* @__PURE__ */ jsx(Wallet, { size: 20, className: "text-white", strokeWidth: 2.2 }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-neutral-400 tracking-wide", children: "Total Balance" }),
              /* @__PURE__ */ jsx("h3", { className: "text-2xl sm:text-[26px] font-extrabold tracking-tight text-white leading-tight truncate", children: formatMoney(totalBalance) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", ref: menuRef, children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2.5", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => handleNavigate("store.sales.invoice.create"),
                  className: "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.16] border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-md",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black flex items-center justify-center transition-all duration-200", children: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 17, strokeWidth: 2.5 }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] font-extrabold tracking-wider text-emerald-400", children: "SALE" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => handleNavigate("store.purchases.create"),
                  className: "bg-amber-500/[0.08] hover:bg-amber-500/[0.16] border border-amber-500/30 hover:border-amber-500/60 text-amber-400 rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-md",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-amber-500/20 group-hover:bg-amber-500 group-hover:text-black flex items-center justify-center transition-all duration-200", children: /* @__PURE__ */ jsx(ArrowUpRight, { size: 17, strokeWidth: 2.5 }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] font-extrabold tracking-wider text-amber-400", children: "PURCHASE" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setIsMenuOpen(!isMenuOpen),
                  className: `bg-indigo-500/[0.08] hover:bg-indigo-500/[0.16] border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-400 rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-md ${isMenuOpen ? "ring-2 ring-indigo-500/50 bg-indigo-500/20" : ""}`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-all duration-200", children: /* @__PURE__ */ jsx(Plus, { size: 17, strokeWidth: 2.5 }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] font-extrabold tracking-wider text-indigo-400", children: "ACTIONS" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              ActionMenu,
              {
                isOpen: isMenuOpen,
                onClose: () => setIsMenuOpen(false),
                store,
                onAction: (act) => {
                  if (act === "payment-in") setPaymentModal({ isOpen: true, type: "in" });
                  else if (act === "payment-out") setPaymentModal({ isOpen: true, type: "out" });
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              "aria-label": "View Cash in Hand Details",
              onClick: () => setIsCashModalOpen(true),
              className: "w-full text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md relative overflow-hidden group",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Wallet, { size: 16, className: "text-emerald-400", strokeWidth: 2.2 }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-neutral-200", children: "Cash in Hand" })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] font-extrabold tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase", children: "MAIN" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-2xl font-black tracking-tight text-white mt-1", children: formatMoney(glBalance) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse" }),
                    "Active"
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              "aria-label": "View Stock Inventory Details",
              onClick: () => handleNavigate("store.inventory.index"),
              className: "w-full text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md relative overflow-hidden group",
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-1.5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Box, { size: 16, className: "text-indigo-400", strokeWidth: 2.2 }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-neutral-200", children: "Stock Value" })
                ] }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-2xl font-black tracking-tight text-white mt-1", children: formatMoney(stockVal) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mt-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-indigo-400" }),
                    "Total Asset Cost"
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-neutral-400 uppercase tracking-wider pl-1 mb-2", children: "BANK ACCOUNTS" }),
            displayBankAccounts.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-2", children: displayBankAccounts.map((acc) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleNavigate("store.bank-accounts.index"),
                className: "w-full text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-3.5 flex items-center justify-between transition-all duration-200 cursor-pointer group shadow-sm",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0", children: /* @__PURE__ */ jsx(Building2, { size: 18, strokeWidth: 2 }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-neutral-100 group-hover:text-white transition-colors leading-tight", children: acc.bank_name || acc.name }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-400 font-medium", children: [
                        "**** ",
                        acc.account_number ? acc.account_number.length > 4 ? acc.account_number.slice(-4) : acc.account_number : "...."
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: `text-sm font-bold tracking-tight ${parseFloat(acc.current_balance || 0) < 0 ? "text-rose-400" : "text-white"}`, children: formatMoney(acc.current_balance) })
                ]
              },
              acc.id
            )) }) : /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleNavigate("store.bank-accounts.index", { action: "add" }),
                className: "w-full text-left p-4 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-center gap-3 group transition-all duration-200 cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "p-2 bg-white/10 rounded-xl text-neutral-300 group-hover:text-teal-400 group-hover:scale-110 transition-all", children: /* @__PURE__ */ jsx(Plus, { size: 16 }) }),
                  /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-neutral-200", children: "Add a Bank Account" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-400", children: "Track your business banking" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 mt-3 bg-[#080B14]/90 border border-white/[0.08] rounded-3xl p-4 shadow-xl backdrop-blur-md flex flex-col flex-1 min-h-[220px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3 shrink-0", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-extrabold text-xs text-neutral-300 uppercase tracking-wider", children: "ACTIVITY" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-[11px] font-semibold text-neutral-400", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-blue-500" }),
                "Sale"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-amber-500" }),
                "Purchase"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-0.5", children: displayTransactions.length > 0 ? displayTransactions.map((tx, i) => {
            const isSale = tx.activityType === "sale" || tx.type?.toLowerCase().includes("sale") || tx.type?.toLowerCase().includes("transaction");
            tx.activityType === "purchase" || tx.type?.toLowerCase().includes("purchase");
            const isIncoming = tx.amount?.startsWith("+") || isSale;
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/5 transition-colors cursor-pointer group",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: `w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isSale ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`, children: isIncoming ? /* @__PURE__ */ jsx(ArrowDownLeft, { size: 14, strokeWidth: 2.4 }) : /* @__PURE__ */ jsx(ArrowUpRight, { size: 14, strokeWidth: 2.4 }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full ${isSale ? "bg-blue-500" : "bg-amber-500"}` }),
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-neutral-200 group-hover:text-white transition-colors", children: tx.type || "Transaction" })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-neutral-400 font-medium block pl-3", children: tx.time || "Recently" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: `text-xs font-bold tracking-tight ${isIncoming ? "text-emerald-400" : "text-amber-400"}`, children: tx.amount })
                ]
              },
              i
            );
          }) : /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center py-6 text-center text-neutral-500 text-xs", children: [
            /* @__PURE__ */ jsx(Activity, { size: 24, className: "mb-2 text-neutral-600" }),
            /* @__PURE__ */ jsx("span", { children: "No recent activity recorded" })
          ] }) })
        ] })
      ]
    }
  );
}
const RECKONER_CATALOG = /* @__PURE__ */ JSON.parse(`[{"key":"sales.revenue","label":"Revenue","shape":"SCALAR","unit":"currency","area":"Sales","module":"Sales","short":"Revenue","extra":false,"desc":"Money earned from posted sales, net of returns and excluding tax.","rowNames":[],"sliceNames":[]},{"key":"sales.max_sale","label":"Largest Sale (excl. tax)","shape":"SCALAR","unit":"currency","area":"Sales","module":"Sales","short":"Largest Sale","extra":false,"desc":"The largest individual sale amount, excluding tax, within the period.","rowNames":[],"sliceNames":[]},{"key":"sales.gross_margin_pct","label":"Gross Margin","shape":"SCALAR","unit":"percent","area":"Sales","module":"Sales","short":"Gross Margin","extra":true,"desc":"Gross profit as a percentage of revenue.","rowNames":[],"sliceNames":[]},{"key":"finance.net_profit","label":"Net Profit","shape":"SCALAR","unit":"currency","area":"Finance","module":"Finance","short":"Net Profit","extra":false,"desc":"Profit for the period from the ledger, after operating expenses.","rowNames":[],"sliceNames":[]},{"key":"finance.gross_profit","label":"Gross Profit","shape":"SCALAR","unit":"currency","area":"Finance","module":"Finance","short":"Gross Profit","extra":false,"desc":"Revenue minus cost of goods sold, for the period.","rowNames":[],"sliceNames":[]},{"key":"finance.cogs","label":"Cost of Goods Sold","shape":"SCALAR","unit":"currency","area":"Finance","module":"Finance","short":"Cost of Goods Sold","extra":false,"desc":"The cost of the goods behind this period's sales.","rowNames":[],"sliceNames":[]},{"key":"finance.net_margin_pct","label":"Net Margin","shape":"SCALAR","unit":"percent","area":"Finance","module":"Finance","short":"Net Margin","extra":true,"desc":"Net profit as a percentage of revenue.","rowNames":[],"sliceNames":[]},{"key":"finance.expenses_total","label":"Expenses","shape":"SCALAR","unit":"currency","area":"Finance","module":"Expenses","short":"Expenses","extra":false,"desc":"Operating expenses recorded for the period, excluding cost of goods sold.","rowNames":[],"sliceNames":[]},{"key":"finance.receivables","label":"Receivables","shape":"SCALAR","unit":"currency","area":"Finance","module":"Khata_credit","short":"Receivables","extra":false,"desc":"What customers currently owe you.","rowNames":[],"sliceNames":[]},{"key":"finance.payables","label":"Payables","shape":"SCALAR","unit":"currency","area":"Finance","module":"Purchases","short":"Payables","extra":false,"desc":"What you currently owe suppliers.","rowNames":[],"sliceNames":[]},{"key":"finance.total_liquidity","label":"Total Liquidity","shape":"SCALAR","unit":"currency","area":"Finance","module":"Payments","short":"Total Liquidity","extra":false,"desc":"Total cash and bank account balance.","rowNames":[],"sliceNames":[]},{"key":"finance.balance_sheet_ok","label":"Books Balanced","shape":"STATUS","unit":"text","area":"Finance","module":"Finance","short":"Books Balanced","extra":true,"desc":"Whether the ledger is in balance.","rowNames":[],"sliceNames":[]},{"key":"inventory.stock_value","label":"Stock Value","shape":"SCALAR","unit":"currency","area":"Inventory","module":"Inventory","short":"Stock Value","extra":false,"desc":"Current valuation of stock on hand.","rowNames":[],"sliceNames":[]},{"key":"inventory.low_stock_count","label":"Low Stock","shape":"SCALAR","unit":"integer","area":"Inventory","module":"Inventory","short":"Low Stock","extra":false,"desc":"Products at or below their alert quantity, but not yet out of stock.","rowNames":[],"sliceNames":[]},{"key":"inventory.out_of_stock_count","label":"Out of Stock","shape":"SCALAR","unit":"integer","area":"Inventory","module":"Inventory","short":"Out of Stock","extra":false,"desc":"Products with zero or negative quantity on hand.","rowNames":[],"sliceNames":[]},{"key":"inventory.product_count","label":"Products","shape":"SCALAR","unit":"integer","area":"Inventory","module":"Products","short":"Products","extra":false,"desc":"Total products in the catalogue.","rowNames":[],"sliceNames":[]},{"key":"inventory.overstock_count","label":"Overstocked","shape":"SCALAR","unit":"integer","area":"Inventory","module":"Inventory","short":"Overstocked","extra":true,"desc":"Products holding more stock than the owner's overstock threshold.","rowNames":[],"sliceNames":[]},{"key":"purchasing.spend","label":"Purchases","shape":"SCALAR","unit":"currency","area":"Purchasing","module":"Purchases","short":"Purchases","extra":false,"desc":"What you bought this period — accrual, not cash.","rowNames":[],"sliceNames":[]},{"key":"purchasing.count","label":"Purchase Bills","shape":"SCALAR","unit":"integer","area":"Purchasing","module":"Purchases","short":"Purchase Bills","extra":false,"desc":"Number of purchase bills recorded this period.","rowNames":[],"sliceNames":[]},{"key":"finance.paid_to_suppliers","label":"Paid to Suppliers","shape":"SCALAR","unit":"currency","area":"Finance","module":"Purchases","short":"Paid to Suppliers","extra":false,"desc":"Cash actually paid against purchase bills this period.","rowNames":[],"sliceNames":[]},{"key":"party.customer_count","label":"Customers","shape":"SCALAR","unit":"integer","area":"Operations","module":"Customers","short":"Customers","extra":false,"desc":"Total customers on file.","rowNames":[],"sliceNames":[]},{"key":"party.supplier_count","label":"Suppliers","shape":"SCALAR","unit":"integer","area":"Operations","module":"Suppliers","short":"Suppliers","extra":false,"desc":"Total suppliers on file.","rowNames":[],"sliceNames":[]},{"key":"party.new_customers","label":"New Customers","shape":"SCALAR","unit":"integer","area":"Operations","module":"Customers","short":"New Customers","extra":true,"desc":"Customers added in this period.","rowNames":[],"sliceNames":[]},{"key":"party.dormant_customers","label":"Dormant Customers","shape":"SCALAR","unit":"integer","area":"Operations","module":"Customers","short":"Dormant Customers","extra":true,"desc":"Customers who have bought before but not recently.","rowNames":[],"sliceNames":[]},{"key":"production.total_cost","label":"Production Cost","shape":"SCALAR","unit":"currency","area":"Inventory","module":"Production_runs","short":"Production Cost","extra":false,"desc":"The cost of completed manufacturing runs this period.","rowNames":[],"sliceNames":[]},{"key":"production.run_count","label":"Production Runs","shape":"SCALAR","unit":"integer","area":"Inventory","module":"Production_runs","short":"Production Runs","extra":false,"desc":"Completed manufacturing runs this period.","rowNames":[],"sliceNames":[]},{"key":"staff.on_shift_count","label":"Staff On Shift","shape":"SCALAR","unit":"integer","area":"Operations","module":"Staff_attendance","short":"Staff On Shift","extra":false,"desc":"Who is currently clocked in.","rowNames":[],"sliceNames":[]},{"key":"staff.member_count","label":"Staff Members","shape":"SCALAR","unit":"integer","area":"Operations","module":"Staff_attendance","short":"Staff Members","extra":false,"desc":"People with access to this store.","rowNames":[],"sliceNames":[]},{"key":"operations.open_sales_orders","label":"Open Orders","shape":"SCALAR","unit":"integer","area":"Operations","module":"Sales_orders","short":"Open Orders","extra":false,"desc":"Sales orders not yet fulfilled.","rowNames":[],"sliceNames":[]},{"key":"operations.pending_stock_takes","label":"Pending Stock Takes","shape":"SCALAR","unit":"integer","area":"Operations","module":"Stock_takes","short":"Pending Stock Takes","extra":false,"desc":"Stock counts started but not yet completed.","rowNames":[],"sliceNames":[]},{"key":"operations.pending_stock_transfers","label":"Pending Stock Transfers","shape":"SCALAR","unit":"integer","area":"Operations","module":"Stock_transfers","short":"Pending Stock Transfers","extra":false,"desc":"Stock transfers awaiting approval.","rowNames":[],"sliceNames":[]},{"key":"tax.collected","label":"Tax Collected","shape":"SCALAR","unit":"currency","area":"Finance","module":"Tax_compliance","short":"Tax Collected","extra":false,"desc":"Tax charged on posted sales this period.","rowNames":[],"sliceNames":[]},{"key":"restaurant.tables_occupied","label":"Tables Occupied","shape":"SCALAR","unit":"integer","area":"Operations","module":"Table_service","short":"Tables Occupied","extra":false,"desc":"Restaurant tables currently seated.","rowNames":[],"sliceNames":[]},{"key":"restaurant.kitchen_orders_pending","label":"Kitchen Orders Pending","shape":"SCALAR","unit":"integer","area":"Operations","module":"Table_service","short":"Kitchen Orders Pending","extra":false,"desc":"Orders in the kitchen not yet served.","rowNames":[],"sliceNames":[]},{"key":"sales.revenue_trend","label":"Revenue Trend","shape":"SERIES","unit":"currency","area":"Sales","module":"Sales","short":"Revenue Trend","extra":true,"desc":"Monthly sales revenue trend.","rowNames":[],"sliceNames":[]},{"key":"finance.profit_trend","label":"Profit Trend","shape":"SERIES","unit":"currency","area":"Finance","module":"Finance","short":"Profit Trend","extra":true,"desc":"Historical net profit trend.","rowNames":[],"sliceNames":[]},{"key":"sales.payment_breakdown","label":"Payment Breakdown","shape":"BREAKDOWN","unit":"percentage","area":"Sales","module":"Sales","short":"Payment Breakdown","extra":true,"desc":"Sales breakdown by payment method.","rowNames":[],"sliceNames":[]},{"key":"finance.expenses_by_category","label":"Expenses by Category","shape":"BREAKDOWN","unit":"currency","area":"Finance","module":"Expenses","short":"Expenses by Category","extra":true,"desc":"Operating expenses breakdown by category.","rowNames":[],"sliceNames":[]},{"key":"sales.top_products","label":"Top Products","shape":"RANKING","unit":"integer","area":"Sales","module":"Sales","short":"Top Products","extra":true,"desc":"Highest selling products this period.","rowNames":[],"sliceNames":[]},{"key":"sales.top_customers","label":"Top Customers","shape":"RANKING","unit":"currency","area":"Sales","module":"Sales","short":"Top Customers","extra":true,"desc":"Highest value customers this period.","rowNames":[],"sliceNames":[]},{"key":"inventory.low_stock_list","label":"Low Stock Items","shape":"TABLE","unit":"integer","area":"Inventory","module":"Inventory","short":"Low Stock Items","extra":true,"desc":"Products below alert quantity.","rowNames":[],"sliceNames":[]},{"key":"finance.receivables_aging","label":"Receivables Aging","shape":"BREAKDOWN","unit":"currency","area":"Finance","module":"Khata_credit","short":"Receivables Aging","extra":true,"desc":"Outstanding invoices grouped by aging days.","rowNames":[],"sliceNames":[]},{"key":"finance.cash_flow_trend","label":"Cash Flow Trend","shape":"MULTI_SERIES","unit":"currency","area":"Finance","module":"Finance","short":"Cash Flow Trend","extra":true,"desc":"Money in vs money out trends.","rowNames":[],"sliceNames":[]},{"key":"sales.hourly_heatmap","label":"Hourly Sales Heatmap","shape":"TABLE","unit":"integer","area":"Sales","module":"Sales","short":"Hourly Sales Heatmap","extra":true,"desc":"Sales count by hour of day and day of week.","rowNames":[],"sliceNames":[]},{"key":"plan.usage_summary","label":"Plan Usage Summary","shape":"GAUGE","unit":"percentage","area":"Operations","module":"Operations","short":"Plan Usage Summary","extra":true,"desc":"Usage vs limits on active plan items.","rowNames":[],"sliceNames":[]},{"key":"sales.live_feed","label":"Live Sales Feed","shape":"FEED","unit":"text","area":"Sales","module":"Sales","short":"Live Sales Feed","extra":true,"desc":"Real-time activity log of orders and payments.","rowNames":[],"sliceNames":[]},{"key":"finance.expense_ratio","label":"Expense Ratio","shape":"SCALAR","unit":"percent","area":"Finance","module":"Finance","short":"Expense Ratio","extra":false,"desc":"Operating expenses as a percentage of revenue.","rowNames":[],"sliceNames":[]},{"key":"reminders.count","label":"Invoice Reminders","shape":"SCALAR","unit":"integer","area":"Operations","module":"Operations","short":"Reminders","extra":false,"desc":"Count of invoice payment reminders.","rowNames":[],"sliceNames":[]},{"key":"recurring_invoices.count","label":"Recurring Invoices","shape":"SCALAR","unit":"integer","area":"Operations","module":"Operations","short":"Recurring Invoices","extra":false,"desc":"Count of recurring invoice schedules.","rowNames":[],"sliceNames":[]},{"key":"recurring_invoices.revenue","label":"Recurring Monthly Revenue","shape":"SCALAR","unit":"currency","area":"Operations","module":"Operations","short":"Recurring Revenue","extra":false,"desc":"Monthly recurring revenue from active schedules.","rowNames":[],"sliceNames":[]},{"key":"batch_tracking.count","label":"Inventory Batches","shape":"SCALAR","unit":"integer","area":"Inventory","module":"Inventory","short":"Batches","extra":false,"desc":"Count of active inventory batches.","rowNames":[],"sliceNames":[]},{"key":"batch_tracking.qty","label":"Batched Stock Quantity","shape":"SCALAR","unit":"decimal","area":"Inventory","module":"Inventory","short":"Batched Qty","extra":false,"desc":"Total unit quantity across all inventory batches.","rowNames":[],"sliceNames":[]},{"key":"proposals.count","label":"Proposals","shape":"SCALAR","unit":"integer","area":"Sales","module":"Sales","short":"Proposals","extra":false,"desc":"Count of customer proposals and quotes.","rowNames":[],"sliceNames":[]},{"key":"purchase_orders.count","label":"Purchase Orders","shape":"SCALAR","unit":"integer","area":"Purchasing","module":"Purchasing","short":"Purchase Orders","extra":false,"desc":"Count of purchase orders.","rowNames":[],"sliceNames":[]},{"key":"sales_orders.count","label":"Sales Orders","shape":"SCALAR","unit":"integer","area":"Sales","module":"Sales","short":"Sales Orders","extra":false,"desc":"Count of sales orders.","rowNames":[],"sliceNames":[]},{"key":"returns.count","label":"Sales Returns","shape":"SCALAR","unit":"integer","area":"Sales","module":"Sales","short":"Returns","extra":false,"desc":"Count of return transactions within the period.","rowNames":[],"sliceNames":[]},{"key":"returns.qty","label":"Returned Units","shape":"SCALAR","unit":"decimal","area":"Sales","module":"Sales","short":"Returned Qty","extra":false,"desc":"Total unit quantity returned within the period.","rowNames":[],"sliceNames":[]},{"key":"returns.value","label":"Returned Value","shape":"SCALAR","unit":"currency","area":"Sales","module":"Sales","short":"Returns Value","extra":false,"desc":"Total refunded monetary amount for returns within the period.","rowNames":[],"sliceNames":[]}]`);
const NAV_GROUP_LABELS = { A: "Catalog", B: "Sell", C: "Stock", D: "Buy", E: "Make", F: "Money", G: "Grow" };
const NAV_GROUP_ORDER = ["A", "B", "C", "D", "E", "F", "G"];
function abbrNum(num) {
  const n = Number(num) || 0;
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString();
}
const READING_DESC = {
  "accounting.assets": "Everything the business owns — stock, cash, equipment and receivables combined.",
  "accounting.liabilities": "Everything the business owes — supplier dues, loans and unpaid bills combined.",
  "accounting.income_ytd": "All income recorded since the start of this year.",
  "accounting.expense_ytd": "All expenses recorded since the start of this year.",
  "bank_accounts.total_balance": "The combined balance across all your bank accounts.",
  "bank_accounts.cash_on_hand": "Cash currently in the drawer and safe.",
  "bank_accounts.money_in_today": "Money received into your accounts today.",
  "bank_accounts.money_out_today": "Money paid out of your accounts today.",
  "bank_reconciliation.total_txns": "Bank transactions imported and waiting to be checked.",
  "bank_reconciliation.matched": "Bank transactions matched to your books.",
  "bank_reconciliation.unmatched": "Bank transactions that still need matching.",
  "batch_tracking.total_batches": "Product batches currently tracked in stock.",
  "batch_tracking.expiring_soon": "Batches that reach their expiry date soon.",
  "batch_tracking.expired": "Batches already past their expiry date.",
  "batch_tracking.total_qty": "Total quantity held across all tracked batches.",
  "debit_notes.total_notes": "Debit notes raised against suppliers.",
  "purchasing.spend": "Total value of purchases in the selected timeframe.",
  "debit_notes.open_credits": "Supplier credit you can still use against future purchases.",
  "finance.expenses_total": "Everything spent today, across all expense heads.",
  "finance.payables": "What you currently owe suppliers and creditors.",
  "party.supplier_count": "Suppliers you currently owe money to.",
  "finance.avg_balance": "The average balance across your accounts.",
  "finance.receivables": "What customers currently owe you.",
  "party.customer_count": "Customers who currently owe you money.",
  "inventory.total_categories": "Product categories in your catalogue.",
  "inventory.main_categories": "Top-level categories in your catalogue.",
  "inventory.products_linked": "Products linked to your online store.",
  "inventory.product_count": "Products in your catalogue.",
  "inventory.low_stock_count": "Products at or below their reorder level.",
  "inventory.stock_value": "What your current stock is worth at cost.",
  "production.run_count": "Production runs currently in progress.",
  "inventory.completed_today": "Production runs finished today.",
  "production.total_cost": "What production has cost this month.",
  "inventory.out_of_stock_count": "Products with nothing left on the shelf.",
  "pre_sales.total_quotes": "Quotations sent to customers.",
  "pre_sales.pending": "Quotations still waiting on a customer decision.",
  "proposals.total_proposals": "Proposals sent to customers.",
  "proposals.accepted": "Proposals the customer said yes to.",
  "proposals.pending": "Proposals still waiting on a reply.",
  "purchasing.count": "Purchase orders placed with suppliers.",
  "purchase_orders.pending": "Purchase orders not yet delivered.",
  "purchase_orders.received": "Purchase orders delivered and received.",
  "recurring_invoices.total": "Repeating invoices set up for regular customers.",
  "recurring_invoices.active": "Repeating invoices currently running.",
  "recurring_invoices.paused": "Repeating invoices on hold.",
  "recurring_invoices.monthly_revenue": "What your repeating invoices bring in each month.",
  "reminders.total_scheduled": "Payment reminders scheduled to go out.",
  "reminders.pending": "Reminders queued but not yet sent.",
  "reminders.sent": "Reminders already delivered.",
  "reminders.overdue": "Invoices past due that need a follow-up.",
  "returns.total_returns": "Sales returned by customers.",
  "returns.items_returned": "Individual items customers brought back.",
  "returns.total_refunded": "Money refunded on returned sales.",
  "sales.revenue": "Everything you sold in the selected timeframe.",
  "sales_orders.confirmed": "Customer orders confirmed and in progress.",
  "sales_orders.pending": "Customer orders waiting for confirmation.",
  "serial_tracking.total_serials": "Serial-numbered items being tracked.",
  "serial_tracking.in_stock": "Serialised items currently in stock.",
  "serial_tracking.sold": "Serialised items sold.",
  "serial_tracking.returned": "Serialised items returned.",
  "staff.member_count": "People on your team.",
  "staff.on_shift_count": "Team members clocked in right now.",
  "staff_attendance.absent": "Team members not in today.",
  "staff_attendance.pending_gaps": "Attendance gaps awaiting review.",
  "staff_attendance.hours_today": "Hours worked by the whole team today.",
  "sales.revenue_trend": "How your sales move day by day — the classic revenue chart.",
  "sales.payment_breakdown": "How customers paid — cash, card, credit, bank and wallet.",
  "sales.top_products": "Your best sellers, ranked by sales value.",
  "sales.top_customers": "Your biggest customers, ranked by what they bought.",
  "sales.hourly_heatmap": "Your busiest hours, mapped across the week.",
  "sales.live_feed": "The latest sales as they happen, newest first.",
  "sales.avg_order_value": "What the typical sale is worth.",
  "sales.basket_size": "How many items the typical sale contains.",
  "sales.discount_given": "Discounts given away in the selected timeframe.",
  "sales.return_rate": "The share of sales that come back as returns.",
  "sales.conversion_funnel": "Quotes to orders to paid — where deals drop off.",
  "sales.channel_split": "Sales split between your counter, online store and phone orders.",
  "sales.region_split": "Where your sales come from, by area.",
  "finance.profit_trend": "What's left after costs, tracked over time.",
  "finance.cash_flow_trend": "Money coming in against money going out.",
  "finance.expenses_by_category": "Where the money goes — rent, salaries, utilities and more.",
  "finance.receivables_aging": "Customer dues grouped by how overdue they are.",
  "finance.balance_sheet_ok": "A quick check that your books balance.",
  "finance.cash_runway": "How many days your cash lasts at the current burn.",
  "finance.dso": "How long customers take to pay you, on average.",
  "finance.dpo": "How long you take to pay suppliers, on average.",
  "finance.quick_ratio": "Whether liquid assets cover short-term dues.",
  "finance.expense_ratio": "Expenses as a share of income.",
  "finance.tax_liability": "Tax collected and owed for the period.",
  "inventory.low_stock_list": "Every product at or below its reorder level, in one list.",
  "inventory.turnover": "How fast stock sells through and gets replaced.",
  "inventory.days_of_cover": "How many days current stock will last.",
  "inventory.sell_through": "The share of stock received that has already sold.",
  "inventory.dead_stock_value": "Money tied up in stock that hasn't moved.",
  "inventory.value_trend": "How your stock value moves over time.",
  "inventory.by_warehouse": "Where your stock sits, location by location.",
  "inventory.expiry_window": "Products expiring within the next 30 days.",
  "purchasing.spend_trend": "Your purchase history — what you bought, over time.",
  "purchasing.by_supplier": "Which suppliers your money goes to.",
  "purchasing.supplier_concentration": "How much of your buying depends on one supplier.",
  "purchasing.lead_time": "How long suppliers take to deliver, on average.",
  "purchasing.on_time_rate": "The share of orders suppliers deliver on time.",
  "operations.plan_usage": "How much of your VenQore plan you've used.",
  "staff.sales_per_head": "Sales generated per team member.",
  "staff.attendance_rate": "The share of shifts your team showed up for.",
  "operations.open_tickets": "Support tickets waiting on an answer.",
  "party.new_vs_returning": "New faces against regulars, side by side.",
  "party.retention_rate": "The share of customers who come back.",
  "finance.expenses_trend": "Your expense history — what you spent, over time.",
  "operations.activity_feed": "Everything that just happened — sales, purchases, payments and stock moves."
};
function readingDesc(r) {
  if (READING_DESC[r.key]) return READING_DESC[r.key];
  const noun = r.unit === "currency" ? "value" : r.unit === "percent" ? "rate" : "count";
  return `${r.label} — a live ${noun} from ${r.area.toLowerCase()}.`;
}
const READING_MODULE_RULES = [
  [/^accounting\./, ["accounting_workspace"]],
  [/^bank_accounts\./, ["bank_accounts"]],
  [/^bank_reconciliation\./, ["bank_reconciliation"]],
  [/^batch_tracking\./, ["batches_expiry"]],
  [/^debit_notes\./, ["purchase_returns"]],
  [/^finance\.expenses/, ["expenses"]],
  [/^finance\.tax/, ["tax_compliance"]],
  [/^finance\./, ["khata_credit", "payments", "accounting_workspace"]],
  [/^party\./, ["customers", "suppliers"]],
  [/^inventory\.product_count$/, ["products"]],
  [/^inventory\./, ["inventory"]],
  [/^production\./, ["production_runs"]],
  [/^pre_sales\./, ["pre_sales"]],
  [/^proposals\./, ["b2b_proposals"]],
  [/^purchase_orders\./, ["purchase_orders"]],
  [/^purchasing\./, ["purchases", "purchase_orders"]],
  [/^recurring_invoices\./, ["recurring_invoices"]],
  [/^reminders\./, ["recurring_invoices"]],
  [/^returns\./, ["sales_returns"]],
  [/^sales_orders\./, ["sales_orders"]],
  [/^sales\./, ["pos", "invoicing"]],
  [/^serial_tracking\./, ["serials"]],
  [/^staff\./, ["staff_attendance"]],
  [/^staff_attendance\./, ["staff_attendance"]],
  [/^operations\./, []]
];
function modulesOf(key) {
  for (const [re, mods] of READING_MODULE_RULES) if (re.test(key)) return mods;
  return [];
}
function prepareReadings(source) {
  const list = Array.isArray(source) && source.length > 0 ? [...source] : [...RECKONER_CATALOG];
  if (typeof window !== "undefined" && window.__VENQORE_DEMO_MODE__) {
    list.push(
      {
        key: "finance.expenses_trend",
        label: "Expense trend",
        shape: "SERIES",
        unit: "currency",
        area: "Finance",
        module: "Extra",
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
    r.modules = modulesOf(r.key);
    if (!Array.isArray(r.rowNames) || r.rowNames.length === 0) {
      r.rowNames = ["Cash", "Card", "Credit", "Bank", "Online", "Other"];
    }
    if (!Array.isArray(r.sliceNames) || r.sliceNames.length === 0) {
      r.sliceNames = ["Cash", "Card", "Credit", "Bank", "Online"];
    }
  });
  return list;
}
function getDashboardProps() {
  if (typeof window !== "undefined" && window.__DASHBOARD_PROPS__) {
    return window.__DASHBOARD_PROPS__;
  }
  return {};
}
function hasModule(key) {
  const list = getDashboardProps().modules;
  return !Array.isArray(list) || !key || list.includes(key);
}
function runCardBuilder(opts) {
  if (typeof window !== "undefined") {
    window.__DASHBOARD_PROPS__ = opts || {};
  }
  if (typeof window !== "undefined" && window.VenQoreCards && window.__vqCardEngine) {
    window.VenQoreCards.setStoreSlug(opts && opts.storeSlug);
    window.VenQoreCards.setEnabledModules(opts && opts.modules);
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
    ENABLED_MODULES = Array.isArray(list) ? new Set(list) : null;
  }
  function readingAvailable(r) {
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
    charity_hub: [],
    top_products_hub: ["sales", "pos"],
    recent_purchases_hub: ["purchases"],
    store_health: ["finance"],
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
    const { n, step, grain } = PERIOD[period];
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
    if (unit === "currency") return compact ? abbrNum2(v) : groupNum(Math.round(v));
    return compact ? abbrNum2(v) : groupNum(Math.round(v));
  }
  function groupNum(n) {
    return Math.round(n).toLocaleString("en-US");
  }
  function abbrNum2(n) {
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "K";
    return groupNum(n);
  }
  function unitPrefix(unit) {
    return unit === "currency" ? "Rs " : "";
  }
  const LIVE_RECKONER_DATA = {};
  const PENDING_RECKONER_REQUESTS = /* @__PURE__ */ new Set();
  let RECKONER_FETCH_TIMER = null;
  function toReckonerPeriod(period) {
    const map = {
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
    const requests = [];
    cards.forEach((c) => {
      if (!c || c.type) return;
      const uiPer = c.period || "Month";
      const reckPer = toReckonerPeriod(uiPer);
      const reqKey = `${c.key}|${uiPer}`;
      const mappedKey = `${c.key}|${reckPer}`;
      if (!PENDING_RECKONER_REQUESTS.has(reqKey) && !LIVE_RECKONER_DATA[reqKey] && !LIVE_RECKONER_DATA[mappedKey]) {
        PENDING_RECKONER_REQUESTS.add(reqKey);
        requests.push({ key: c.key, period: reckPer, reqKey, uiPeriod: uiPer });
      }
      if (Array.isArray(c.extraKeys)) {
        c.extraKeys.forEach((ek) => {
          const ekReqKey = `${ek}|${uiPer}`;
          const ekMappedKey = `${ek}|${reckPer}`;
          if (!PENDING_RECKONER_REQUESTS.has(ekReqKey) && !LIVE_RECKONER_DATA[ekReqKey] && !LIVE_RECKONER_DATA[ekMappedKey]) {
            PENDING_RECKONER_REQUESTS.add(ekReqKey);
            requests.push({ key: ek, period: reckPer, reqKey: ekReqKey, uiPeriod: uiPer });
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
    let hasNewData = false;
    Promise.allSettled(chunks.map(
      (chunk) => axios.post("/api/reckoner/read", {
        requests: chunk.map((r) => ({ key: r.key, period: r.period }))
      }, { _skipGlobalErrorHandler: true }).then((res) => {
        const items = res?.data?.data || [];
        const handledKeys = /* @__PURE__ */ new Set();
        items.forEach((item, idx) => {
          if (item && item.key) {
            const req = chunk[idx] || chunk.find((r) => r.key === item.key);
            const perKey = item.period?.key || req?.period || "today";
            const uiP = req?.uiPeriod || "Month";
            LIVE_RECKONER_DATA[`${item.key}|${perKey}`] = item;
            LIVE_RECKONER_DATA[`${item.key}|${uiP}`] = item;
            if (req?.reqKey) handledKeys.add(req.reqKey);
            hasNewData = true;
          }
        });
        chunk.forEach((r) => {
          if (!handledKeys.has(r.reqKey)) {
            LIVE_RECKONER_DATA[r.reqKey] = { key: r.key, empty: true };
            LIVE_RECKONER_DATA[`${r.key}|${r.period}`] = { key: r.key, empty: true };
          }
        });
      }).catch(() => {
        chunk.forEach((r) => {
          LIVE_RECKONER_DATA[r.reqKey] = LIVE_RECKONER_DATA[r.reqKey] || { key: r.key, error: true };
          LIVE_RECKONER_DATA[`${r.key}|${r.period}`] = LIVE_RECKONER_DATA[`${r.key}|${r.period}`] || { key: r.key, error: true };
        });
      }).finally(() => {
        chunk.forEach((r) => PENDING_RECKONER_REQUESTS.delete(r.reqKey));
      })
    )).then(() => {
      if (hasNewData) {
        const board2 = document.getElementById("board");
        if (board2) {
          board2.querySelectorAll(".vqc").forEach((el) => {
            const c = cardOf(el.dataset.id);
            const host = el.querySelector(".vqc-host");
            if (c && host) mountChart(host, c);
          });
          fitValues(board2);
        }
      }
    });
  }
  function valuesFor(key, period, unit) {
    const { n } = PERIOD[period] || PERIOD.Month;
    const reqKey = `${key}|${period}`;
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${key}|${toReckonerPeriod(period)}`];
    if (live && live.ok && live.data !== void 0 && live.data !== null) {
      if (live.data.series && Array.isArray(live.data.series)) {
        const pts = live.data.series.map((pt) => typeof pt.y === "number" ? pt.y : typeof pt.value === "number" ? pt.value : 0);
        if (pts.length > 0) {
          if (pts.length === n) return pts;
          if (pts.length < n) {
            const pad = new Array(n - pts.length).fill(0);
            return [...pad, ...pts];
          }
          return pts.slice(-n);
        }
        return new Array(n).fill(0);
      }
      if (Array.isArray(live.data) && (live.data.length === 0 || typeof live.data[0] === "number")) {
        if (live.data.length === 0) return new Array(n).fill(0);
        if (live.data.length >= n) return live.data.slice(-n);
        const pad = new Array(n - live.data.length).fill(live.data[0] || 0);
        return [...pad, ...live.data];
      }
      if (typeof live.data === "number") {
        return new Array(n).fill(live.data);
      }
      if (typeof live.data === "object" && live.data.current !== void 0) {
        const curr = Number(live.data.current) || 0;
        const prev = Number(live.data.previous) || curr;
        const out = [];
        for (let i = 0; i < n; i++) {
          out.push(prev + (curr - prev) * (i / Math.max(1, n - 1)));
        }
        return out;
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
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${key}|${toReckonerPeriod(period)}`];
    const rd = readingOf(key);
    if (live && live.ok && live.data) {
      const rawItems = live.data.slices || live.data.rows || (Array.isArray(live.data) ? live.data : null);
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const list = rawItems.map((item, i) => ({
          name: item.name || item.label || item.day || `Item ${i + 1}`,
          value: typeof item.value === "number" ? item.value : typeof item.total === "number" ? item.total : Number(item.val || item.sales || item.count || 0),
          color: `var(--vq-series-${i % 8 + 1})`
        })).filter((x) => x.value > 0);
        list.sort((a, b) => b.value - a.value);
        const total = Number(live.data.total) || list.reduce((s, x) => s + (x.value || 0), 0) || 0;
        return { parts: list, total: total || 1, unit: rd?.unit || "currency" };
      }
    }
    return { parts: [], total: 0, unit: rd?.unit || "currency" };
  }
  function readingOf(key) {
    const found = Array.isArray(READINGS) ? READINGS.find((r) => r.key === key) : null;
    if (found) return found;
    if (Array.isArray(READINGS) && READINGS[0]) return READINGS[0];
    return {
      key: key || "sales.revenue",
      label: "Revenue",
      shape: "SCALAR",
      unit: "currency",
      area: "Sales",
      module: "Sales",
      short: "Revenue",
      extra: false,
      desc: "Revenue for the period.",
      rowNames: ["Cash", "Card", "Credit", "Bank", "Online", "Other"],
      sliceNames: ["Cash", "Card", "Credit", "Bank", "Online"]
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
  function pathSmooth(pts, t = 0.42) {
    if (pts.length < 3) return pathLinear(pts);
    let d = "M" + P(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) * t / 3, p1[1] + (p2[1] - p0[1]) * t / 3];
      const c2 = [p2[0] - (p3[0] - p1[0]) * t / 3, p2[1] - (p3[1] - p1[1]) * t / 3];
      d += ` C${P(c1[0], c1[1])} ${P(c2[0], c2[1])} ${P(p2[0], p2[1])}`;
    }
    return d;
  }
  function curveFor(variant) {
    return variant === "step" ? pathStep : variant === "linear" ? pathLinear : pathSmooth;
  }
  function mountCartesian(host, card) {
    const { W, H } = hostDimensions(host, card);
    const keys = [card.key, ...card.extraKeys || []];
    const ds = buildSeries(keys, card.period);
    const uid = "ck" + ++CHART_UID;
    const variant = card.variant || defaultVariant(card.chart);
    const units = [...new Set(ds.series.map((s) => s.unit))];
    const rightUnit = units.length > 1 ? units[1] : null;
    const axisOf = (s) => rightUnit && s.unit === rightUnit ? "right" : "left";
    const m = { l: 48, r: rightUnit ? 48 : 12, t: 12, b: 30 };
    const pw = Math.max(20, W - m.l - m.r), ph = Math.max(20, H - m.t - m.b);
    const domainFor = (side) => {
      const vals = ds.series.filter((s) => axisOf(s) === side).flatMap((s) => s.values);
      if (!vals.length) return null;
      const stacked = /stacked/.test(variant) && ds.series.length > 1;
      const hi = stacked ? Math.max(...ds.times.map((_, i) => ds.series.reduce((a, s) => a + s.values[i], 0))) : Math.max(...vals);
      return niceTicks(Math.min(0, Math.min(...vals)), hi, 5);
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
    const order = ds.series.map((s, si) => si).sort((a, b) => Z[roleFor(card.chart, variant, a)] - Z[roleFor(card.chart, variant, b)]);
    order.forEach((si) => {
      const s = ds.series[si];
      const side = axisOf(s);
      const pts = s.values.map((v, i) => [xOf(i), yOf(isStacked ? stackTop[i] += v : v, side)]);
      const role = roleFor(card.chart, variant, si);
      const gid = `${uid}-g${si}`;
      if (role === "bar") {
        const groupN = card.chart === "bar" && variant === "grouped" ? ds.series.length : 1;
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
      const s0 = ds.series[0], last = s0.values[s0.values.length - 1];
      return { v: unitPrefix(s0.unit) + fmtValue(last, s0.unit, headCompact()), when: rangeLabel(ds) };
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
    if (!pd0.parts || pd0.parts.length === 0) {
      host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No category breakdown recorded</span></div>`;
      return;
    }
    const legH = Math.min(HH * 0.5, (pd0.parts?.length || 1) * 30 + 6);
    const size = Math.max(84, Math.min(HW, HH - legH - 8, 210));
    const pd = pd0;
    const variant = card.variant || defaultVariant(card.chart);
    const cx = size / 2, cy = size / 2, R = size / 2 - 4;
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
    const LEG_ROW = 34, MORE_ROW = 20;
    const legRoom = Math.max(0, HH - size - 10);
    const fit = Math.floor((legRoom + 4) / LEG_ROW);
    const useRows = fit >= pd.parts.length ? pd.parts : pd.parts.slice(0, Math.max(0, Math.floor((legRoom + 4 - MORE_ROW) / LEG_ROW)));
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
        <button class="ck-leg-r" data-i="${i}">
          <span class="ck-leg-d" style="background:${p.color}"></span>
          <span class="ck-leg-n">${p.name}</span>
          <span class="ck-leg-v">${unitPrefix(pd.unit)}${fmtValue(p.value, pd.unit, true)}</span>
          <span class="ck-leg-p">${Math.round(p.value / pd.total * 100)}%</span>
          <span class="ck-leg-bar"><i style="width:${(p.value / pd.parts[0].value * 100).toFixed(0)}%;background:${p.color}"></i></span>
        </button>`).join("")}${moreN > 0 && useRows.length ? `
        <span class="ck-leg-more">+ ${moreN} more in the full view</span>` : ""}</div>
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
    const size = Math.max(90, Math.min(S - 16, 250));
    const rd = readingOf(card.key);
    const vals = valuesFor(card.key, card.period, rd.unit);
    const v = vals[vals.length - 1];
    const max = rd.unit === "percent" ? 100 : Math.ceil(Math.max(...vals) * 1.25);
    const frac = Math.max(0, Math.min(1, v / max));
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
    const { W, H } = hostDimensions(host, card);
    const reqKey = `${card.key}|${card.period}`;
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
    const pts = Array.isArray(live?.data?.points) ? live.data.points : [];
    if (pts.length === 0) {
      host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No scatter data for this period</span></div>`;
      return;
    }
    const m = { l: 44, r: 12, t: 10, b: 26 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
    const rd = readingOf(card.key);
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
    const dots = pts.map((p, i) => `<circle class="ck-sc" data-i="${i}" cx="${(m.l + (p.x || 0) * pw).toFixed(1)}"
    cy="${(m.t + ph - (p.y || 0) * ph).toFixed(1)}" r="${variant === "bubble" ? (p.w || 4).toFixed(1) : 4.5}"
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
    host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No activity recorded for this period</span></div>`;
  }
  function mountTable(host, card) {
    const { H } = hostDimensions(host, card);
    const pd = buildParts(card.key, card.period, readingOf(card.key)?.rowNames);
    if (!pd.parts || pd.parts.length === 0) {
      host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No table records for this period</span></div>`;
      return;
    }
    const capacity = Math.max(2, Math.floor((H - 4) / 38));
    const rows = pd.parts.slice(0, Math.min(7, capacity)), mx = rows[0]?.value || 1;
    const variant = card.variant || "rows";
    host.innerHTML = `<div class="ck-tb">${rows.map((p, i) => `
    <div class="ck-tr" style="--d:${i * 45}ms">
      ${variant === "rank" ? `<span class="ck-rank">${i + 1}</span>` : ""}
      <span class="ck-tn">${p.name}</span>
      ${variant === "bars" ? `<span class="ck-tbar"><i style="width:${((p?.value || 0) / mx * 100).toFixed(0)}%;background:${p?.color || "var(--vq-series-1)"}"></i></span>` : ""}
      <b class="ck-tv">${unitPrefix(pd.unit)}${fmtValue(p?.value || 0, pd.unit, true)}</b>
    </div>`).join("")}</div>`;
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
    host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No recent transactions in this period</span></div>`;
  }
  function mountSankey(host, card) {
    const { W, H } = hostDimensions(host, card);
    const pd = buildParts(card.key, card.period, readingOf(card.key)?.sliceNames);
    if (!pd.parts || pd.parts.length === 0) {
      host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No flow data for this period</span></div>`;
      return;
    }
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
    const rd = readingOf(card.key);
    const reqKey = `${card.key}|${card.period}`;
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
    const regs = Array.isArray(live?.data?.regions) ? live.data.regions : [];
    if (regs.length === 0) {
      host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No regional data for this period</span></div>`;
      return;
    }
    regs.sort((a, b) => (b.v || b.value || 0) - (a.v || a.value || 0));
    const mx = regs[0].v || regs[0].value || 1;
    if (card.variant === "list") {
      const capacity = Math.max(2, Math.floor((host.clientHeight - 4) / 38));
      host.innerHTML = `<div class="ck-tb">${regs.slice(0, capacity).map((g, i) => {
        const val = g.v || g.value || 0;
        return `<div class="ck-tr" style="--d:${i * 45}ms">
        <span class="ck-rank">${i + 1}</span><span class="ck-tn">${g.n || g.name}</span>
        <span class="ck-tbar"><i style="width:${(val / mx * 100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4, Math.floor(val / mx * 5)) + 1})"></i></span>
        <b class="ck-tv">${unitPrefix(rd.unit)}${fmtValue(val, rd.unit, true)}</b></div>`;
      }).join("")}</div>`;
      return;
    }
    host.innerHTML = `<div class="ck-geo">${regs.map((g, i) => {
      const val = g.v || g.value || 0;
      return `<div class="ck-geo-c" style="--d:${i * 55}ms">
      <i class="ck-geo-f" style="width:${(val / mx * 100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4, Math.floor(val / mx * 5)) + 1})"></i>
      <span>${g.n || g.name}</span><b>${unitPrefix(rd.unit)}${fmtValue(val, rd.unit, true)}</b></div>`;
    }).join("")}</div>`;
  }
  function mountSparkline(host, card) {
    const { W, H } = hostDimensions(host, card);
    const rd = readingOf(card.key);
    const vals = valuesFor(card.key, card.period, rd.unit);
    const times = timeline(card.period), grain = PERIOD[card.period].grain;
    const mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
    const n = vals.length;
    const pts = vals.map((v, i) => [i * (W - 6) / (n - 1) + 3, H - 4 - (v - mn) / rg * (H - 10)]);
    const variant = card.variant || "area";
    const uid = "sp" + ++CHART_UID;
    let body;
    if (variant === "bars") {
      const bw = W / n * 0.62;
      body = vals.map((v, i) => `<rect class="ck-bar" data-x="${i}" x="${(pts[i][0] - bw / 2).toFixed(1)}"
      y="${pts[i][1].toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - 4 - pts[i][1]).toFixed(1)}" rx="2"
      fill="var(--vq-series-1-ink)"/>`).join("");
    } else {
      const d = pathSmooth(pts);
      body = (variant === "area" ? `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0%" stop-color="var(--vq-series-1-ink)" stop-opacity=".3"/>
         <stop offset="100%" stop-color="var(--vq-series-1-ink)" stop-opacity="0"/></linearGradient></defs>
         <path d="${d} L${P(pts[n - 1][0], H)} L${P(pts[0][0], H)} Z" fill="url(#${uid})"/>` : "") + `<path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)"/>`;
    }
    host.innerHTML = `<svg class="ck ck--spark" width="${W}" height="${H}">
    <g class="ck-plot" style="clip-path:inset(0 100% 0 0)">${body}</g>
    <g class="ck-hover" style="opacity:0"><line class="ck-cross" y1="0" y2="${H}"/>
      <circle class="ck-hd" r="3.5" fill="var(--vq-surface)" stroke="var(--vq-series-1-ink)" stroke-width="2"/></g>
    <rect class="ck-cap" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>
    <div class="ck-tip ck-tip--sm" hidden></div>`;
    requestAnimationFrame(() => {
      const p = host.querySelector(".ck-plot");
      if (p) p.style.clipPath = "inset(0 0% 0 0)";
    });
    const cap = host.querySelector(".ck-cap"), hov = host.querySelector(".ck-hover");
    const cross = host.querySelector(".ck-cross"), dot = host.querySelector(".ck-hd");
    const tip = host.querySelector(".ck-tip");
    const head = host.closest(".vqc")?.querySelector(".vqc-value[data-full] .nf");
    const sub = host.closest(".vqc")?.querySelector(".vqc-when");
    const headCompact = () => head?.closest(".vqc-value")?.dataset.mode === "compact";
    const rest = () => {
      if (head) setRoller(head, unitPrefix(rd.unit) + fmtValue(vals[n - 1], rd.unit, headCompact()));
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
    const rd = readingOf(card.key);
    const reqKey = `${card.key}|${card.period}`;
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
    const times = timeline(card.period), grain = PERIOD[card.period].grain;
    const ok = live?.data?.status ? live.data.status === "ok" || live.data.status === "balanced" : true;
    const state = live?.data?.message || (ok ? "Balanced" : "Needs review");
    const body = card.variant === "dot" ? `<span class="ck-dotstate ${ok ? "is-ok" : "is-warn"}"><i></i><b>${esc(state)}</b></span>` : `<span class="ck-badge ${ok ? "is-ok" : "is-warn"}"><i></i>${esc(state)}</span>`;
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
    status: mountStatus
  };
  function mountChart(host, card) {
    if (!host) return;
    if (CARTESIAN.has(card.chart)) return mountCartesian(host, card);
    if (RADIAL.has(card.chart)) return mountRadial(host, card);
    const fn = MOUNT[card.chart];
    if (fn) return fn(host, card);
  }
  const TIME_CHARTS = ["stat", "sparkline", "area", "line", "bar", "composed", "pl", "live", "gauge", "ring"];
  const LEGAL = {
    SCALAR: TIME_CHARTS.concat(["heatmap", "scatter", "table"]),
    STATUS: ["status", "stat", "sparkline", "area", "line", "bar"],
    SERIES: TIME_CHARTS.concat(["heatmap", "scatter", "table"]),
    MULTI_SERIES: ["composed", "line", "area", "bar", "pl", "live", "stat", "sparkline"],
    BREAKDOWN: ["pie", "ring", "sunburst", "funnel", "bar", "radar", "sankey", "choropleth", "table", "stat", "treemap"].filter((c) => c !== "treemap"),
    RANKING: ["bar", "table", "funnel", "choropleth", "pie", "ring", "radar", "stat"],
    TABLE: ["table", "heatmap", "scatter", "bar", "line", "area", "stat"],
    GAUGE: ["gauge", "ring", "stat", "sparkline", "area", "line", "bar"],
    FEED: ["feed", "table", "bar", "stat"]
  };
  const CHART_NAME = {
    stat: "Number",
    sparkline: "Sparkline",
    gauge: "Gauge",
    ring: "Ring",
    status: "Status",
    area: "Area",
    line: "Line",
    bar: "Bar",
    pl: "Profit / loss",
    live: "Live line",
    composed: "Combo",
    pie: "Pie",
    sunburst: "Sunburst",
    funnel: "Funnel",
    radar: "Radar",
    sankey: "Sankey",
    choropleth: "Regions",
    table: "Table",
    heatmap: "Heatmap",
    scatter: "Scatter",
    feed: "Feed"
  };
  const CATS = ["C1", "C2", "C3", "C4", "C5", "C6"];
  const CAT_NAME = { C1: "Tile", C2: "Strip", C3: "Metric", C4: "Panel", C5: "Board", C6: "Canvas" };
  const FITS = {
    C1: [[2, 1, "icon+label"], [1, 1, "icon"]],
    C2: [[4, 1, "inline"], [3, 2, "stacked"]],
    C3: [[4, 3, "full"], [3, 2, "standard"], [2, 2, "compact"], [2, 3, "stacked"]],
    C4: [[4, 4, "full"], [3, 4, "standard"], [3, 5, "compact"], [2, 6, "list"]],
    C5: [[6, 6, "full"], [5, 7, "narrow"], [4, 8, "min"]],
    C6: [[8, 8, "full"], [6, 10, "narrow"], [4, 12, "min"]]
  };
  const DEFAULT_FIT = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 2, C6: 1 };
  const CAT_MAX = {
    C1: [3, 2],
    /* Tile   — shortcut, quick action, single glyph        */
    C2: [6, 2],
    /* Strip  — one KPI on one line                         */
    C3: [6, 4],
    /* Metric — KPI with delta, sparkline or comparison     */
    C4: [6, 6],
    /* Panel  — ranked list, breakdown, small chart         */
    C5: [12, 9],
    /* Board  — full chart, multi-series, wide table        */
    C6: [12, 16]
    /* Canvas — hero chart, statement, cohort grid, map     */
  };
  const CAT_DESC = {
    C1: "Shortcut, quick action, single glyph",
    C2: "One KPI on one line",
    C3: "KPI with delta, sparkline or comparison",
    C4: "Ranked list, breakdown, small chart",
    C5: "Full chart, multi-series, wide table",
    C6: "Hero chart, statement, cohort grid"
  };
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
    charity_hub: {
      cat: "C4",
      min: [3, 2],
      cats: ["C3", "C4", "C5", "C6"],
      family: "hub",
      eyebrow: "CHARITY & DONATIONS",
      name: "Charity & Donations Hub",
      sub: "Live donations summary and one-click contribution"
    },
    top_products_hub: {
      cat: "C4",
      min: [3, 2],
      cats: ["C3", "C4", "C5", "C6"],
      family: "hub",
      eyebrow: "TOP PERFORMERS",
      name: "Top Selling Products",
      sub: "Best sellers ranked by sold quantity and sales volume"
    },
    recent_purchases_hub: {
      cat: "C4",
      min: [3, 2],
      cats: ["C3", "C4", "C5", "C6"],
      family: "hub",
      eyebrow: "PURCHASING DESK",
      name: "Recent Supplier Purchases",
      sub: "Latest purchase orders, suppliers and delivery status"
    },
    store_health: {
      cat: "C3",
      min: [3, 2],
      cats: ["C2", "C3", "C4", "C5"],
      family: "hub",
      eyebrow: "FINANCIAL VITALITY",
      name: "Store Health & Verification",
      sub: "Balance sheet integrity, audit readiness and liquidity"
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
  const SPECIAL_FITS = {
    C1: [[2, 1, "icon+label"], [1, 1, "icon"]],
    C2: [[4, 1, "inline"], [3, 2, "stacked"]],
    C3: [[4, 2, "full"], [3, 2, "standard"], [2, 3, "stacked"]],
    C4: [[4, 2, "full"], [3, 3, "standard"], [3, 4, "compact"], [2, 5, "list"]],
    C5: [[6, 3, "full"], [5, 4, "narrow"], [4, 5, "min"]],
    C6: [[8, 4, "full"], [6, 6, "narrow"], [4, 8, "min"]]
  };
  const fitsTable = (c) => isSpecial(c) ? SPECIAL_FITS : FITS;
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
    const T = fitsTable(card);
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
      if (sizeLegal(list[i], w, h, fitsTable(card))) return list[i];
    }
    return card.cat || list[0] || "C3";
  }
  function fitCat(card) {
    return catsFor(card)[0] || (isSpecial(card) ? SPECIAL[card.type].cat : "C6");
  }
  function geometryOf(card, cols, colW) {
    const cat = card.cat || fitCat(card);
    const T = fitsTable(card);
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
    fitsTable(c);
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
    CARDS.push(c);
    draw();
    return c;
  }
  function headlineOf(card) {
    const rd = readingOf(card.key);
    const reqKey = `${card.key}|${card.period}`;
    const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
    const times = timeline(card.period), grain = PERIOD[card.period].grain;
    if (live && live.ok && live.data !== void 0 && live.data !== null) {
      let last2 = 0;
      let prev2 = 0;
      let hasDelta = false;
      if (typeof live.data === "number") {
        last2 = live.data;
      } else if (typeof live.data === "object") {
        if (live.data.current !== void 0) {
          last2 = Number(live.data.current) || 0;
          prev2 = Number(live.data.previous) || 0;
          hasDelta = true;
        } else if (live.data.total !== void 0) {
          last2 = Number(live.data.total) || 0;
        } else if (live.data.series && Array.isArray(live.data.series) && live.data.series.length > 0) {
          const s = live.data.series;
          last2 = Number(s[s.length - 1]?.y ?? s[s.length - 1]?.value ?? 0);
          if (s.length > 1) {
            prev2 = Number(s[s.length - 2]?.y ?? s[s.length - 2]?.value ?? 0);
            hasDelta = true;
          }
        } else if (Array.isArray(live.data.slices) && live.data.slices.length > 0) {
          last2 = live.data.slices.reduce((acc, x) => acc + Number(x.value || 0), 0);
        }
      }
      const pct2 = hasDelta && prev2 !== 0 ? (last2 - prev2) / Math.abs(prev2) * 100 : live.data?.delta_pct ?? 0;
      const dir = pct2 >= 0 ? "up" : "down";
      return {
        value: unitPrefix(rd.unit) + fmtValue(last2, rd.unit),
        valueCompact: unitPrefix(rd.unit) + fmtValue(last2, rd.unit, true),
        dir,
        pct: Math.abs(pct2).toFixed(1) + "%",
        when: card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[times.length - 1], grain)
      };
    }
    const vals = valuesFor(card.key, card.period, rd.unit);
    const last = vals[vals.length - 1], prev = vals[vals.length - 2] ?? last;
    const pct = prev ? (last - prev) / prev * 100 : 0;
    return {
      value: unitPrefix(rd.unit) + fmtValue(last, rd.unit),
      valueCompact: unitPrefix(rd.unit) + fmtValue(last, rd.unit, true),
      dir: pct >= 0 ? "up" : "down",
      pct: Math.abs(pct).toFixed(1) + "%",
      when: card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[times.length - 1], grain)
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
  const GRID = { unit: 64, gutter: 24 };
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
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
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
      c.starBorder ? "vqc--starred" : "",
      c.glare === false ? "" : c.accent || c.glare ? "vqc--glared" : "",
      clamped ? "is-clamped" : "",
      `vqc--fit-${opts2.geo.fit}`
    ].filter(Boolean).join(" ");
    const pinned = Number.isInteger(c.gx) && Number.isInteger(c.gy) && (opts2.cols || 12) >= 12;
    const place = pinned ? `grid-column:${Math.max(1, Math.min((opts2.cols || 12) - w + 1, c.gx + 1))} / span ${w};grid-row:${c.gy + 1} / span ${h};` : "";
    return `<article class="${cls}" data-id="${c.id}" data-cat="${cat}" data-w="${w}" data-h="${h}"
    tabindex="0" draggable="false"
    style="--i:${CARDS.indexOf(c)};--vqw:${w};--vqh:${h};${place}">
    ${c.starBorder ? `<span class="vqc-star" aria-hidden="true"></span>` : ""}
    ${opts2.body}
    <span class="vqc-glare" aria-hidden="true"></span>
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
      { href: "/pos", mod: "sales", icon: "cart", label: "Point of Sale", needs: "pos" },
      { href: storePath("/purchase-orders"), mod: "purchase", icon: "truck", label: "Purchase Order", needs: "purchase_orders" },
      { href: null, mod: "actions", icon: "plus", label: "Quick Actions" },
      { href: storePath("/sales"), mod: "quiet", icon: "file", label: "New Invoice", needs: "invoicing" },
      { href: storePath("/inventory"), mod: "quiet", icon: "box", label: "Add Product", needs: "products" },
      { href: storePath("/parties"), mod: "quiet", icon: "users", label: "New Customer", needs: "customers" },
      { href: storePath("/finance"), mod: "quiet", icon: "dollar", label: "Add Expense", needs: "expenses" },
      { href: storePath("/reports"), mod: "quiet", icon: "chart", label: "Reports", needs: "reports" }
    ].filter((i) => hasModule(i.needs));
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
    const dProps = getDashboardProps();
    const bankAccounts = Array.isArray(dProps.bankAccounts) ? dProps.bankAccounts : [];
    const cashVal = Number(dProps.cashData?.balance) || (Array.isArray(dProps.cashAccounts) ? dProps.cashAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) : 0);
    const bankVal = bankAccounts.reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);
    const totalLiquid = cashVal + bankVal;
    const bankCount = bankAccounts.length;
    const boxes = [
      { l: "Bank Accounts", v: bankVal, s: `${bankCount} account${bankCount === 1 ? "" : "s"} active` },
      { l: "Cash on Hand", v: cashVal, s: "Drawer & safe" },
      { l: "Total Liquid Net", v: totalLiquid, s: totalLiquid > 0 ? "Liquid assets" : "No liquid balance", total: true }
    ];
    return hubHead(c, SPECIAL.bank_liquidity.eyebrow, link) + `<div class="vqc-hub-title-wrap"><div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.bank_liquidity.sub)}</div></div><div class="vqc-bank-grid">${boxes.map((b) => `
      <div class="vqc-bank-box${b.total ? " is-total" : ""}">
        <span class="vqc-bank-label" title="${esc(b.l)}">${esc(b.l)}</span>
        <span class="vqc-bank-val" data-full="Rs ${groupNum(b.v)}" data-compact="Rs ${abbrNum2(b.v)}">Rs ${groupNum(b.v)}</span>
        <span class="vqc-bank-sub">${esc(b.s)}</span>
      </div>`).join("")}</div>`;
  }
  function bodyAlertsHub(c, geo) {
    const link = c.targetUrl || c.link || storePath("/reports");
    const modOk = (mods) => !ENABLED_MODULES || !mods.length || mods.some((m) => ENABLED_MODULES.has(m));
    const dProps = getDashboardProps();
    const lowStockCount = Array.isArray(dProps.lowStockItems) ? dProps.lowStockItems.length : 0;
    const overdueReceivables = Number(dProps.outstanding?.receivables) || 0;
    const recs = Array.isArray(dProps.aiRecommendations) ? dProps.aiRecommendations : [];
    const rows = [];
    if (lowStockCount > 0 && modOk(["inventory"])) {
      rows.push({ k: "warning", href: storePath("/inventory"), msg: `<strong>${lowStockCount} product${lowStockCount === 1 ? "" : "s"}</strong> reached reorder limit`, cta: "Reorder" });
    }
    if (overdueReceivables > 0 && modOk(["khata_credit", "payments"])) {
      rows.push({ k: "danger", href: storePath("/finance"), msg: `<strong>Rs ${groupNum(overdueReceivables)}</strong> customer dues outstanding`, cta: "Follow up" });
    }
    recs.forEach((r) => {
      rows.push({
        k: r.priority === "urgent" ? "danger" : "warning",
        href: storePath("/reports"),
        msg: esc(r.message || r.title),
        cta: "View"
      });
    });
    const room = Math.max(1, Math.min(Math.max(1, rows.length), Math.floor((geo.h - 1) * 88 / 46)));
    const visibleRows = rows.slice(0, room);
    return hubHead(c, SPECIAL.alerts_hub.eyebrow, link) + (visibleRows.length === 0 ? `<div class="vqc-alerts-empty" style="display:flex;align-items:center;justify-content:center;height:calc(100% - 40px);color:var(--vq-text-muted);font-size:12px;text-align:center;padding:12px;">All clear — no pending alerts</div>` : `<div class="vqc-alerts-list">${visibleRows.map((r) => `
      <a href="${esc(r.href)}" class="vqc-alert-item vqc-alert-item--${r.k}">
        <span class="vqc-alert-dot"></span>
        <span class="vqc-alert-msg">${r.msg}</span>
        <span class="vqc-alert-btn">${esc(r.cta)} &rarr;</span>
      </a>`).join("")}</div>`);
  }
  function bodyGrowthEngine(c, geo) {
    const link = c.targetUrl || c.link || storePath("/reports");
    const dProps = getDashboardProps();
    const monthSales = Number(dProps.performance?.Month?.sales) || Number(dProps.revenue) || 0;
    const daySales = Number(dProps.performance?.Today?.sales) || Number(dProps.performance?.Day?.sales) || 0;
    const netProfit = Number(dProps.netProfit) || 0;
    const stats = [
      { l: "Month Sales", v: "Rs " + abbrNum2(monthSales), s: "Sales this month" },
      { l: "Today Sales", v: "Rs " + abbrNum2(daySales), s: "Today's total" },
      { l: "Net Profit", v: "Rs " + abbrNum2(netProfit), s: "Realised profit" }
    ];
    return hubHead(c, SPECIAL.growth_engine.eyebrow, link) + `<div class="vqc-hub-title-wrap"><div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.growth_engine.sub)}</div></div><div class="vqc-growth-grid">${stats.map((s) => `
      <div class="vqc-growth-stat">
        <span class="vqc-growth-label">${esc(s.l)}</span>
        <span class="vqc-growth-val">${esc(s.v)}</span>
        <span class="vqc-growth-sub">${esc(s.s)}</span>
      </div>`).join("")}</div>`;
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
      { href: "/pos", icon: "cart", label: "Point of Sale", mod: "pos" },
      { href: storePath("/sales"), icon: "file", label: "New Invoice", mod: "invoicing" },
      { href: storePath("/inventory"), icon: "box", label: "Add Product", mod: "products" },
      { href: storePath("/purchase-orders"), icon: "truck", label: "Purchase Order", mod: "purchase_orders" }
    ].filter((i) => hasModule(i.mod));
    if (items.length === 0) {
      items.push({ href: storePath("/reports"), icon: "chart", label: "Reports", mod: null });
    }
    const perRow = geo.w >= 4 ? 2 : 1;
    return hubHead(c, SPECIAL.launchpad.eyebrow, link) + (geo.h >= 3 ? `<div class="vqc-hub-title-wrap">
       <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
       <div class="vqc-action-hub-sub">${esc(SPECIAL.launchpad.sub)}</div>
     </div>` : "") + `<div class="vqc-launchpad" style="grid-template-columns:repeat(${perRow},minmax(0,1fr))">${items.map(
      (i) => `<a href="${esc(i.href)}" class="vqc-hub-btn vqc-hub-btn--quiet vqc-launchpad-btn">${shortcutIcon(i.icon, 16)}<span>${esc(i.label)}</span></a>`
    ).join("")}</div>`;
  }
  function bodyCharityHub(c, geo) {
    const link = c.targetUrl || c.link || storePath("/reports");
    const dProps = getDashboardProps();
    const charityToday = Number(dProps.charityStats?.today) || 0;
    const charityMonth = Number(dProps.charityStats?.month) || 0;
    const defAmt = Number(dProps.charityStats?.default_amount) || 10;
    return hubHead(c, SPECIAL.charity_hub.eyebrow, link) + `<div class="vqc-hub-title-wrap">
      <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.charity_hub.sub)}</div>
    </div>
    <div class="vqc-bank-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 8px;">
      <div class="vqc-bank-box is-total">
        <span class="vqc-bank-label">Today's Donations</span>
        <span class="vqc-bank-val" style="color: #f43f5e;">Rs ${groupNum(charityToday)}</span>
        <span class="vqc-bank-sub">Direct contributions</span>
      </div>
      <div class="vqc-bank-box">
        <span class="vqc-bank-label">This Month</span>
        <span class="vqc-bank-val">Rs ${groupNum(charityMonth)}</span>
        <span class="vqc-bank-sub">Monthly total</span>
      </div>
    </div>
    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
      <button type="button" onclick="window._vqDonateCharity && window._vqDonateCharity(10)" class="vqc-hub-btn" style="flex: 1; min-width: 50px; padding: 6px 8px; font-size: 11px; background: rgba(244,63,94,0.12); color: #f43f5e; border: 1px solid rgba(244,63,94,0.25); border-radius: 8px; cursor: pointer; font-weight: 700;">+Rs 10</button>
      <button type="button" onclick="window._vqDonateCharity && window._vqDonateCharity(50)" class="vqc-hub-btn" style="flex: 1; min-width: 50px; padding: 6px 8px; font-size: 11px; background: rgba(244,63,94,0.12); color: #f43f5e; border: 1px solid rgba(244,63,94,0.25); border-radius: 8px; cursor: pointer; font-weight: 700;">+Rs 50</button>
      <button type="button" onclick="window._vqDonateCharity && window._vqDonateCharity(100)" class="vqc-hub-btn" style="flex: 1; min-width: 50px; padding: 6px 8px; font-size: 11px; background: rgba(244,63,94,0.12); color: #f43f5e; border: 1px solid rgba(244,63,94,0.25); border-radius: 8px; cursor: pointer; font-weight: 700;">+Rs 100</button>
      <button type="button" onclick="window._vqDonateCharity && window._vqDonateCharity(${defAmt})" class="vqc-hub-btn" style="flex: 1; min-width: 70px; padding: 6px 8px; font-size: 11px; background: rgba(244,63,94,0.2); color: #f43f5e; border: 1px solid rgba(244,63,94,0.4); border-radius: 8px; cursor: pointer; font-weight: 800;">Donate Default</button>
    </div>`;
  }
  function bodyTopProductsHub(c, geo) {
    const link = c.targetUrl || c.link || storePath("/reports");
    const dProps = getDashboardProps();
    const topProducts = Array.isArray(dProps.topSellingItems) ? dProps.topSellingItems : [];
    return hubHead(c, SPECIAL.top_products_hub.eyebrow, link) + `<div class="vqc-hub-title-wrap">
      <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.top_products_hub.sub)}</div>
    </div>` + (topProducts.length === 0 ? `<div class="vqc-alerts-empty" style="display:flex;align-items:center;justify-content:center;height:calc(100% - 40px);color:var(--vq-text-muted);font-size:12px;text-align:center;padding:12px;">No sales recorded yet</div>` : `<div class="vqc-alerts-list">${topProducts.slice(0, 5).map((t, idx) => {
      const val = Number(t.total_sales || t.sales || t.revenue || 0);
      const sold = t.sold || t.qty || t.quantity || 0;
      return `
            <a href="${esc(storePath("/inventory"))}" class="vqc-alert-item vqc-alert-item--info" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span style="font-weight:700;font-size:11px;color:var(--vq-text-muted);width:16px;">#${idx + 1}</span>
              <span class="vqc-alert-msg" style="flex:1;"><strong>${esc(t.name || `Item ${idx + 1}`)}</strong><br/><span style="font-size:10px;opacity:0.75;">${esc(t.category || "Standard Item")} · Sold: ${sold}</span></span>
              <span style="font-weight:800;font-size:12px;color:var(--vq-teal-500);white-space:nowrap;">Rs ${groupNum(val)}</span>
            </a>
          `;
    }).join("")}</div>`);
  }
  function bodyRecentPurchasesHub(c, geo) {
    const link = c.targetUrl || c.link || storePath("/purchase-orders");
    const dProps = getDashboardProps();
    const purchases = Array.isArray(dProps.recentPurchases) ? dProps.recentPurchases : [];
    return hubHead(c, SPECIAL.recent_purchases_hub.eyebrow, link) + `<div class="vqc-hub-title-wrap">
      <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.recent_purchases_hub.sub)}</div>
    </div>` + (purchases.length === 0 ? `<div class="vqc-alerts-empty" style="display:flex;align-items:center;justify-content:center;height:calc(100% - 40px);color:var(--vq-text-muted);font-size:12px;text-align:center;padding:12px;">No recent purchases recorded</div>` : `<div class="vqc-alerts-list">${purchases.slice(0, 5).map((p) => {
      const amt = Number(p.total_amount || p.amount || p.total || 0);
      const sup = p.supplier_name || p.supplier?.name || p.party?.name || "Supplier Order";
      const dt = p.date ? new Date(p.date).toLocaleDateString([], { month: "short", day: "numeric" }) : p.created_at ? new Date(p.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) : "";
      return `
            <a href="${esc(storePath("/purchase-orders"))}" class="vqc-alert-item vqc-alert-item--warning" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span class="vqc-alert-dot"></span>
              <span class="vqc-alert-msg" style="flex:1;"><strong>${esc(sup)}</strong><br/><span style="font-size:10px;opacity:0.75;">${dt} · ${esc(p.status || "Received")}</span></span>
              <span style="font-weight:800;font-size:12px;color:var(--vq-amber-500);white-space:nowrap;">Rs ${groupNum(amt)}</span>
            </a>
          `;
    }).join("")}</div>`);
  }
  function bodyStoreHealth(c, geo) {
    const link = c.targetUrl || c.link || storePath("/reports");
    const dProps = getDashboardProps();
    const netProfit = Number(dProps.netProfit?.Month?.value ?? dProps.netProfit?.value ?? 0);
    const healthStatus = dProps.netProfit?.Month?.status || (netProfit >= 0 ? "Good" : "Needs Attention");
    const isHealthy = healthStatus === "Good" || netProfit >= 0;
    return hubHead(c, SPECIAL.store_health.eyebrow, link) + `<div class="vqc-hub-title-wrap">
      <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.store_health.sub)}</div>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: ${isHealthy ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)"}; border: 1px solid ${isHealthy ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 999px; background: ${isHealthy ? "#10b981" : "#f43f5e"}; box-shadow: 0 0 10px ${isHealthy ? "#10b981" : "#f43f5e"};"></span>
        <span style="font-size: 13px; font-weight: 800; color: ${isHealthy ? "#10b981" : "#f43f5e"}; text-transform: uppercase;">${esc(healthStatus)}</span>
      </div>
      <span style="font-size: 11px; font-weight: 600; opacity: 0.8;">Double-entry balanced</span>
    </div>
    <div class="vqc-bank-grid" style="grid-template-columns: repeat(2, 1fr);">
      <div class="vqc-bank-box">
        <span class="vqc-bank-label">Receivables</span>
        <span class="vqc-bank-val">Rs ${groupNum(Number(dProps.outstanding?.Month?.receivables ?? dProps.outstanding?.receivables ?? 0))}</span>
        <span class="vqc-bank-sub">Customer balances</span>
      </div>
      <div class="vqc-bank-box">
        <span class="vqc-bank-label">Payables</span>
        <span class="vqc-bank-val">Rs ${groupNum(Number(dProps.outstanding?.Month?.payables ?? dProps.outstanding?.payables ?? 0))}</span>
        <span class="vqc-bank-sub">Supplier dues</span>
      </div>
    </div>`;
  }
  const SPECIAL_BODY = {
    action_hub: bodyActionHub,
    bank_liquidity: bodyBankLiquidity,
    alerts_hub: bodyAlertsHub,
    growth_engine: bodyGrowthEngine,
    charity_hub: bodyCharityHub,
    top_products_hub: bodyTopProductsHub,
    recent_purchases_hub: bodyRecentPurchasesHub,
    store_health: bodyStoreHealth,
    custom_button: bodyCustomButton,
    launchpad: bodyLaunchpad
  };
  function bodyStrip(c, geo, link) {
    const hl = headlineOf(c);
    const title = titleOf(c);
    const px = pxWidth(geo.w, geo.colW);
    const stacked = geo.h >= 2;
    const delta = c.showDelta === false ? "" : `<span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir, 10)}${hl.pct}</span>`;
    const tight = px < 320;
    const when = c.showWhen === false ? "" : `<span class="vqc-when">${esc(c.period)}</span>`;
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
    const hl = headlineOf(c);
    const keys = [c.key, ...c.extraKeys || []];
    const legend = keys.length > 1 && CARTESIAN.has(c.chart) ? `<div class="vqc-leg">${keys.map((k, i) => `<button type="button" class="vqc-leg-i" data-i="${i}">
        <span class="vqc-leg-d" style="background:var(--vq-series-${i % 8 + 1})"></span>${esc(readingOf(k).label)}</button>`).join("")}</div>` : "";
    const selfLabelled = c.chart === "gauge" || c.chart === "ring" || c.chart === "sunburst" || c.chart === "pie" && c.variant === "donut";
    const showHead = c.chart !== "status" && !selfLabelled;
    const room = geo.h;
    const showWhen = c.showWhen !== false && c.chart !== "status" && room >= 4;
    const showDelta = c.showDelta !== false && geo.w >= 2;
    const showPicker = c.showPeriodPicker !== false && PREFS.periodPicker && room >= 2 && geo.w >= 3;
    return `<div class="vqc-hd">
      <span class="vqc-eyebrow" title="${esc(title)}">${esc(title)}</span>
      <span class="vqc-hd-r">${showPicker ? periodPicker(c) : ""}${cardTools(c, link)}</span>
    </div>
    <div class="vqc-bd">
      ${showHead ? `<div class="vqc-head">
        ${valueHTML(hl)}
        ${showDelta ? `<span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir, 10)}${hl.pct}</span>` : ""}
      </div>` : ""}
      ${showWhen ? `<p class="vqc-when">${esc(hl.when)}</p>` : ""}
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
  function draw() {
    const board2 = document.getElementById("board");
    if (!board2) return;
    const cols = boardCols(board2);
    COL_W = boardColW(board2);
    LAST_COLS = cols;
    HOST_RO?.disconnect();
    board2.innerHTML = CARDS.map((c) => renderCard(c, cols)).join("") || `<p class="board-empty">No cards yet — open <strong>Add card</strong> and pick what you want to see.</p>`;
    const count = document.getElementById("count");
    if (count) count.textContent = CARDS.length;
    board2.querySelectorAll(".vqc").forEach((el) => {
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
      const T = fitsTable(c);
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
        draw();
        if (EDIT === c.id) openEdit(c.id);
      };
      addEventListener("pointermove", move);
      addEventListener("pointerup", up);
    });
  }
  function pinnedOthers(self, cols) {
    return CARDS.filter((o) => o !== self && Number.isInteger(o.gx) && Number.isInteger(o.gy)).map((o) => {
      const [w, h] = sizeOf(o, cols);
      return { x: o.gx, y: o.gy, w, h };
    });
  }
  function freeSpot(self, gx, gy, w, h, cols) {
    const others = pinnedOthers(self, cols);
    const x = Math.max(0, Math.min(cols - w, gx));
    let y = Math.max(0, gy);
    const hits = (yy) => others.some((o) => x < o.x + o.w && o.x < x + w && yy < o.y + o.h && o.y < yy + h);
    while (hits(y)) y++;
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
    const areas = ["All", ...new Set(READINGS.map((r) => r.area))];
    const q = LIB_Q.trim().toLowerCase();
    const list = READINGS.filter((r) => (LIB_AREA === "All" || r.area === LIB_AREA) && (!q || r.label.toLowerCase().includes(q) || r.key.includes(q)));
    box.innerHTML = `
    <div class="lib-find">${ic("search", 14)}<input id="lib-q" placeholder="Search ${READINGS.length} readings…" value="${LIB_Q.replace(/"/g, "&quot;")}"></div>
    <div class="lib-tabs">${areas.map((a) => `<button class="lib-tab ${a === LIB_AREA ? "is-on" : ""}" data-a="${a}">${a}</button>`).join("")}</div>
    <div class="lib-list">${list.length ? list.map((r) => `
      <div class="lib-row ${on.has(r.key) ? "is-added" : ""}">
        <span class="lib-row-n">${r.label}</span>
        <code class="lib-row-k">${r.key}</code>
        <span class="lib-shape">${r.shape}</span>
        ${r.extra ? '<span class="lib-badge">extra</span>' : ""}
        <button class="lib-add" data-k="${r.key}" title="Add card">${on.has(r.key) ? ic("check", 13) : ic("plus", 13)}</button>
      </div>`).join("") : `<p class="lib-none">Nothing matches “${LIB_Q}”.</p>`}</div>`;
    const qi = box.querySelector("#lib-q");
    qi.oninput = () => {
      LIB_Q = qi.value;
      renderLibrary();
      const el = document.getElementById("lib-q");
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    };
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
  let PERSIST_ON = false;
  let ACTIVE_DASHBOARD_ID = null;
  let BACKEND_SYNC_TIMER = null;
  function syncBoardToBackend() {
    if (!ACTIVE_DASHBOARD_ID || typeof axios === "undefined") return;
    clearTimeout(BACKEND_SYNC_TIMER);
    BACKEND_SYNC_TIMER = setTimeout(() => {
      try {
        const payload = {
          cards: CARDS.map((c) => ({
            id: typeof c.id === "string" && c.id.length === 36 ? c.id : void 0,
            reading_key: c.key || "sales.revenue",
            chart: c.chart || "stat",
            period: toReckonerPeriod(c.period),
            category: c.cat || "C4",
            fit: c.fit || 0,
            x: Number.isInteger(c.gx) ? c.gx : 0,
            y: Number.isInteger(c.gy) ? c.gy : 0,
            w: c.w || 3,
            h: c.h || 2,
            title_override: c.title || null,
            args: c.args || null,
            style: {
              variant: c.variant || "standard",
              tone: c.tone || "surface",
              glare: c.glare,
              starBorder: c.starBorder,
              showDelta: c.showDelta,
              showWhen: c.showWhen,
              showPeriodPicker: c.showPeriodPicker,
              type: c.type || null,
              targetUrl: c.targetUrl || c.link || null,
              icon: c.icon || null,
              btnColor: c.btnColor || null,
              extraKeys: c.extraKeys || []
            }
          })).filter((c) => c.reading_key && !c.reading_key.startsWith("platform."))
        };
        axios.put(`/api/dashboards/${ACTIVE_DASHBOARD_ID}/layout`, payload, { _skipGlobalErrorHandler: true }).catch(() => {
        });
      } catch {
      }
    }, 600);
  }
  function persistBoard() {
    if (!PERSIST_ON || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(BOARD_KEY(), JSON.stringify({ v: 2, cards: CARDS }));
    } catch {
    }
    syncBoardToBackend();
  }
  function loadBoard() {
    if (typeof localStorage === "undefined") return null;
    try {
      const data = JSON.parse(localStorage.getItem(BOARD_KEY()) || "null");
      if (!data || data.v !== 2 || !Array.isArray(data.cards) || !data.cards.length) return null;
      return availableCards(data.cards.filter((c) => c && (c.type ? SPECIAL[c.type] : true)));
    } catch {
      return null;
    }
  }
  const PRESETS = {
    retail: {
      name: "Retail overview",
      desc: "Sales, money, stock and alerts — the everyday board.",
      panel: "money",
      cards: [
        { key: "sales.revenue_trend", chart: "area", variant: "gradient", cat: "C5", w: 6, h: 7, period: "Month" },
        { type: "bank_liquidity", cat: "C4", w: 3, h: 3 },
        { key: "sales.avg_order_value", chart: "stat", variant: "spark", cat: "C3", w: 3, h: 3, period: "Month" },
        { type: "alerts_hub", cat: "C4", w: 3, h: 4 },
        { key: "inventory.low_stock_count", chart: "stat", variant: "spark", cat: "C3", w: 3, h: 4, period: "Today" },
        { key: "sales.payment_breakdown", chart: "pie", variant: "donut", cat: "C4", w: 4, h: 6, period: "Month" },
        { key: "sales.top_products", chart: "bar", variant: "solid", cat: "C4", w: 4, h: 6, period: "Month" },
        { key: "sales.live_feed", chart: "feed", variant: "live", cat: "C4", w: 4, h: 6, period: "Today" },
        { type: "launchpad", cat: "C4", w: 6, h: 3 },
        { type: "growth_engine", cat: "C4", w: 6, h: 3 }
      ]
    },
    finance: {
      name: "Money & accounts",
      desc: "Cash flow, dues, expenses and the bank picture.",
      panel: "credit",
      cards: [
        { key: "finance.cash_flow_trend", chart: "composed", variant: "bar-line-area", cat: "C5", w: 6, h: 7, period: "Month" },
        { type: "bank_liquidity", cat: "C4", w: 3, h: 3 },
        { key: "bank_accounts.money_in_today", chart: "stat", variant: "number", cat: "C2", w: 3, h: 2, period: "Today" },
        { key: "finance.receivables", chart: "stat", variant: "number", cat: "C2", w: 3, h: 2, period: "Month" },
        { key: "bank_accounts.money_out_today", chart: "stat", variant: "number", cat: "C2", w: 3, h: 2, period: "Today" },
        { key: "finance.payables", chart: "stat", variant: "number", cat: "C2", w: 3, h: 2, period: "Month" },
        { key: "finance.quick_ratio", chart: "stat", variant: "spark", cat: "C3", w: 3, h: 3, period: "Month" },
        { key: "finance.expenses_by_category", chart: "pie", variant: "donut", cat: "C4", w: 4, h: 6, period: "Month" },
        { key: "finance.expenses_trend", chart: "line", variant: "smooth", cat: "C4", w: 4, h: 6, period: "Month" },
        { key: "finance.receivables_aging", chart: "bar", variant: "solid", cat: "C4", w: 4, h: 6, period: "Month" },
        { key: "finance.profit_trend", chart: "line", variant: "smooth", cat: "C4", w: 6, h: 4, period: "Month" },
        { key: "finance.dso", chart: "stat", variant: "spark", cat: "C3", w: 3, h: 4, period: "Month" },
        { key: "finance.dpo", chart: "stat", variant: "spark", cat: "C3", w: 3, h: 4, period: "Month" }
      ]
    },
    inventory: {
      name: "Stock & purchasing",
      desc: "What's on the shelf, what's running out, what's on order.",
      panel: "operations",
      cards: [
        { key: "inventory.stock_value", chart: "stat", variant: "number", cat: "C2", w: 4, h: 1, period: "Month" },
        { key: "inventory.low_stock_count", chart: "stat", variant: "number", cat: "C2", w: 4, h: 1, period: "Today" },
        { key: "inventory.out_of_stock_count", chart: "stat", variant: "number", cat: "C2", w: 4, h: 1, period: "Today" },
        { key: "inventory.low_stock_list", chart: "table", variant: "standard", cat: "C4", w: 4, h: 6, period: "Month" },
        { key: "inventory.by_warehouse", chart: "pie", variant: "donut", cat: "C4", w: 4, h: 6, period: "Month" },
        { key: "inventory.value_trend", chart: "line", variant: "smooth", cat: "C4", w: 4, h: 6, period: "Month" },
        { key: "inventory.expiry_window", chart: "bar", variant: "solid", cat: "C4", w: 4, h: 5, period: "Month" },
        { key: "purchasing.spend_trend", chart: "line", variant: "smooth", cat: "C4", w: 4, h: 5, period: "Month" },
        { type: "alerts_hub", cat: "C4", w: 4, h: 5 },
        { key: "purchase_orders.pending", chart: "stat", variant: "number", cat: "C2", w: 6, h: 1, period: "Month" },
        { key: "batch_tracking.expiring_soon", chart: "stat", variant: "number", cat: "C2", w: 6, h: 1, period: "Month" }
      ]
    },
    command: {
      name: "Command centre",
      desc: "The revenue chart front and centre, everything else around it.",
      panel: "operations",
      cards: [
        { key: "finance.receivables", chart: "stat", variant: "number", cat: "C2", w: 3, h: 2, period: "Month" },
        { key: "sales.revenue_trend", chart: "area", variant: "gradient", cat: "C5", w: 6, h: 8, period: "Month" },
        { key: "finance.payables", chart: "stat", variant: "number", cat: "C2", w: 3, h: 2, period: "Month" },
        { key: "operations.plan_usage", chart: "gauge", variant: "arc", cat: "C4", w: 3, h: 4, period: "Month" },
        { key: "sales.top_products", chart: "table", variant: "bars", cat: "C4", w: 3, h: 4, period: "Month" },
        { key: "inventory.low_stock_count", chart: "stat", variant: "number", cat: "C2", w: 3, h: 2, period: "Today" },
        { key: "sales.avg_order_value", chart: "stat", variant: "number", cat: "C2", w: 3, h: 2, period: "Month" },
        { key: "sales.live_feed", chart: "feed", variant: "live", cat: "C4", w: 6, h: 4, period: "Today" },
        { key: "sales.top_customers", chart: "bar", variant: "solid", cat: "C4", w: 6, h: 4, period: "Month" }
      ]
    },
    classic: {
      name: "Familiar (like the old dashboard)",
      desc: "The layout you know — numbers on top, trend and lists below, money and activity on the right.",
      panel: "money",
      cards: [
        { key: "sales.revenue", chart: "stat", variant: "number", cat: "C2", w: 3, h: 1, period: "Today" },
        { key: "finance.profit_trend", chart: "stat", variant: "number", cat: "C2", w: 3, h: 1, period: "Month" },
        { key: "finance.receivables", chart: "stat", variant: "number", cat: "C2", w: 3, h: 1, period: "Month" },
        { key: "finance.payables", chart: "stat", variant: "number", cat: "C2", w: 3, h: 1, period: "Month" },
        { key: "sales.revenue_trend", chart: "area", variant: "gradient", cat: "C5", w: 6, h: 6, period: "Month" },
        { type: "alerts_hub", cat: "C4", w: 3, h: 3 },
        { key: "inventory.low_stock_count", chart: "stat", variant: "spark", cat: "C3", w: 3, h: 3, period: "Today" },
        { key: "purchasing.recent", chart: "feed", variant: "live", cat: "C4", w: 3, h: 6, period: "Month" },
        { key: "sales.top_products", chart: "bar", variant: "solid", cat: "C4", w: 6, h: 5, period: "Month" },
        { key: "operations.activity_feed", chart: "feed", variant: "live", cat: "C4", w: 6, h: 5, period: "Today" }
      ]
    },
    base: {
      name: "Start simple",
      desc: "One chart, the day's numbers, and room to grow.",
      panel: null,
      cards: [
        { key: "sales.revenue_trend", chart: "area", variant: "gradient", cat: "C5", w: 12, h: 6, period: "Month" },
        { key: "sales.revenue", chart: "stat", variant: "number", cat: "C2", w: 4, h: 1, period: "Today" },
        { key: "finance.expenses_total", chart: "stat", variant: "number", cat: "C2", w: 4, h: 1, period: "Today" },
        { key: "inventory.low_stock_count", chart: "stat", variant: "number", cat: "C2", w: 4, h: 1, period: "Today" },
        { type: "launchpad", cat: "C4", w: 6, h: 3 },
        { type: "alerts_hub", cat: "C4", w: 6, h: 3 }
      ]
    }
  };
  const DEFAULT_PRESET = "retail";
  function availableCards(cards) {
    return cards.filter((c) => c.type ? specialAvailable(c.type) : READINGS.some((r) => r.key === c.key) && readingAvailable(readingOf(c.key)));
  }
  function applyPreset(id) {
    const p = PRESETS[id] || PRESETS[DEFAULT_PRESET];
    const cols = boardCols();
    const scale = cols < 12 ? cols / 12 : 1;
    CARDS = availableCards(p.cards).map((c) => {
      const card = { ...c, id: newId() };
      if (scale !== 1 && card.w) {
        card.w = Math.max(1, Math.min(cols, Math.round(card.w * scale)));
      }
      delete card.gx;
      delete card.gy;
      return normaliseCard(card);
    });
    EDIT = null;
    draw();
  }
  function boot(presetId) {
    CARDS = [];
    EDIT = null;
    PERSIST_ON = false;
    if (presetId) {
      applyPreset(presetId);
      PERSIST_ON = true;
      persistBoard();
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
      } else {
        applyPreset(DEFAULT_PRESET);
      }
      if (typeof axios !== "undefined") {
        axios.get("/api/dashboards").then((res) => {
          const list = res?.data?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const activeBoard = list.find((b) => b.is_default) || list[0];
            if (activeBoard) {
              ACTIVE_DASHBOARD_ID = activeBoard.id;
              if (Array.isArray(activeBoard.cards)) {
                const backendCards = (activeBoard.cards.length === 0 ? [] : activeBoard.cards).map((bc) => {
                  const st = bc.style || {};
                  return {
                    id: bc.id || newId(),
                    key: bc.reading_key || bc.key,
                    chart: bc.chart || st.chart || "stat",
                    period: bc.period === "today" ? "Today" : bc.period === "this_week" ? "Week" : bc.period === "this_quarter" ? "Quarter" : bc.period === "this_year" ? "Year" : "Month",
                    w: bc.w || 3,
                    h: bc.h || 2,
                    gx: bc.x,
                    gy: bc.y,
                    cat: bc.category || bc.cat || "C4",
                    fit: bc.fit || 0,
                    type: st.type || bc.type,
                    variant: st.variant || bc.variant || defaultVariant(bc.chart || "stat"),
                    tone: st.tone || bc.tone || "surface",
                    glare: st.glare ?? bc.glare,
                    starBorder: st.starBorder ?? bc.starBorder,
                    showDelta: st.showDelta ?? bc.showDelta,
                    showWhen: st.showWhen ?? bc.showWhen,
                    showPeriodPicker: st.showPeriodPicker ?? bc.showPeriodPicker,
                    targetUrl: st.targetUrl || bc.targetUrl,
                    link: st.link || bc.link,
                    icon: st.icon || bc.icon,
                    btnColor: st.btnColor || bc.btnColor,
                    extraKeys: st.extraKeys || bc.extraKeys || [],
                    title: bc.title_override || st.title || bc.title
                  };
                });
                CARDS = availableCards(backendCards).map(normaliseCard);
                draw();
              }
            }
          }
        }).catch(() => {
        });
      }
      PERSIST_ON = true;
      persistBoard();
    }
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
      if (Array.isArray(newReadings) && newReadings.length > 0) {
        READINGS = prepareReadings(newReadings);
        if (typeof window !== "undefined") window.__VENQORE_READINGS__ = newReadings;
        draw();
      }
    },
    getCats: () => CATS,
    getCatNames: () => CAT_NAME,
    getCatDescs: () => CAT_DESC,
    getCatMax: () => CAT_MAX,
    getFits: () => FITS,
    getSpecialFits: () => SPECIAL_FITS,
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
    fitsTable: (card) => fitsTable(card),
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
      STORE_SLUG = s || "";
    },
    deepLinkFor: getDeepLinkForCard,
    catForSize: (card, w, h) => catForSize(normaliseCard({ ...card }), w, h),
    fitValues,
    getPresets: () => PRESETS,
    applyPreset,
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
    type: "charity_hub",
    title: "Charity & Donations Hub",
    category: "Finance",
    desc: "Live donation counter with instant one-tap donation recording.",
    tone: "surface"
  },
  {
    type: "top_products_hub",
    title: "Top Products & Best Sellers",
    category: "Sales",
    desc: "Best selling products ranked by sold quantity and sales revenue.",
    tone: "surface"
  },
  {
    type: "recent_purchases_hub",
    title: "Recent Purchases & Suppliers",
    category: "Purchases",
    desc: "Latest purchase orders, suppliers, amounts, and statuses.",
    tone: "surface"
  },
  {
    type: "store_health",
    title: "Store Financial Health",
    category: "Finance",
    desc: "Solvency verification, books audit status, and receivables balance.",
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
  { label: "Charity & Donations", path: "/charity/stats", icon: "heart", color: "#e11d48" },
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
const CAT_MAX_FALLBACK = { C1: [3, 2], C2: [6, 2], C3: [6, 4], C4: [6, 6], C5: [12, 9], C6: [12, 16] };
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
    id: "v6_financial_cockpit",
    name: "VenQore V6 Cockpit",
    desc: "Total balance, instant action buttons, cash in hand, stock value, bank accounts, and expanded activity card with V6 obsidian mesh.",
    rails: ["v6_cockpit"]
  },
  {
    id: "money",
    name: "Money desk",
    desc: "The old dashboard’s panel — action buttons, cash & accounts, live activity.",
    rails: ["action_trio", "balances", "activity"]
  },
  {
    id: "charity_desk",
    name: "Charity & Giving",
    desc: "Community donations, today’s figures and quick actions.",
    rails: ["charity", "today", "quick_actions"]
  },
  {
    id: "operations",
    name: "Operations desk",
    desc: "What needs doing — alerts, today’s numbers, quick actions.",
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
    desc: "Just quick actions and today’s numbers.",
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
    id: "action_trio",
    name: "Action buttons",
    modules: [],
    desc: "Sale, purchase and more actions — one tap each."
  },
  {
    id: "charity",
    name: "Charity & Donations",
    modules: [],
    desc: "Live charity balance and quick 1-tap donation buttons."
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
function DashRail({ id, storePath, onQuickActions, enabledModules = [], props = {} }) {
  const tt = useTermText();
  const modOk = (mods) => !enabledModules.length || !mods || !mods.length || mods.some((m) => enabledModules.includes(m));
  if (id === "v6_cockpit") {
    return /* @__PURE__ */ jsx(
      V6FinancialSidebar,
      {
        props,
        recentTransactions: props.recentTransactions,
        bankAccounts: props.bankAccounts,
        cashAccounts: props.cashAccounts,
        cashData: props.cashData,
        inventoryValue: props.inventoryValue || props.stock_value,
        sticky: false,
        className: "mb-3"
      }
    );
  }
  if (id === "charity") {
    const charityToday = Number(props.charityStats?.today) || 0;
    const charityMonth = Number(props.charityStats?.month) || 0;
    const defAmt = Number(props.charityStats?.default_amount) || 10;
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Charity & Donations" }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => window._vqDonateCharity && window._vqDonateCharity(defAmt), className: "vq-rail-link text-rose-500 font-bold", children: [
          "+Rs ",
          defAmt
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-hero", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-rail-hero-l", children: "Today's Total" }),
        /* @__PURE__ */ jsxs("span", { className: "vq-rail-hero-v text-rose-500", children: [
          "Rs ",
          charityToday.toLocaleString()
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "vq-rail-hero-s", children: [
          "Month: Rs ",
          charityMonth.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 mt-2.5", children: [10, 50, 100].map((amt) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => window._vqDonateCharity && window._vqDonateCharity(amt),
          className: "flex-1 py-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors",
          children: [
            "+Rs ",
            amt
          ]
        },
        amt
      )) })
    ] });
  }
  if (id === "action_trio") return /* @__PURE__ */ jsx("section", { className: "vq-rail-card vq-rail-card--trio", children: /* @__PURE__ */ jsxs("div", { className: "vq-rail-trio", children: [
    /* @__PURE__ */ jsxs("a", { href: "/pos", className: "vq-trio-btn is-sale", children: [
      /* @__PURE__ */ jsx("span", { className: "vq-trio-ic", children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "M12 19V5" }),
        /* @__PURE__ */ jsx("path", { d: "m5 12 7 7 7-7" })
      ] }) }),
      /* @__PURE__ */ jsx("span", { children: "Sale" })
    ] }),
    /* @__PURE__ */ jsxs("a", { href: storePath("/purchase-orders"), className: "vq-trio-btn is-purchase", children: [
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
  if (id === "balances") {
    const bankAccounts = Array.isArray(props.bankAccounts) ? props.bankAccounts : [];
    const cashVal = Number(props.cashData?.balance) || (Array.isArray(props.cashAccounts) ? props.cashAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0) : 0);
    const bankVal = bankAccounts.reduce((s, a) => s + (Number(a.current_balance) || 0), 0);
    const totalLiquid = cashVal + bankVal;
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Cash & accounts" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/finance"), className: "vq-rail-link", children: "Open" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-hero", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-rail-hero-l", children: "Cash in hand" }),
        /* @__PURE__ */ jsxs("span", { className: "vq-rail-hero-v", children: [
          "Rs ",
          cashVal.toLocaleString()
        ] }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-hero-s", children: "Drawer & safe" })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: bankAccounts.length > 0 ? bankAccounts.map((a, i) => /* @__PURE__ */ jsxs("li", { className: "vq-rail-row", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-rail-row-n", children: a.name || a.bank_name || "Bank Account" }),
        /* @__PURE__ */ jsxs("span", { className: "vq-rail-row-v", children: [
          "Rs ",
          (Number(a.current_balance) || 0).toLocaleString()
        ] })
      ] }, a.id || i)) : /* @__PURE__ */ jsx("li", { className: "vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-1.5 justify-center", children: "No bank accounts linked" }) }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-total", children: [
        /* @__PURE__ */ jsx("span", { children: "Total liquid" }),
        /* @__PURE__ */ jsxs("strong", { children: [
          "Rs ",
          totalLiquid.toLocaleString()
        ] })
      ] })
    ] });
  }
  if (id === "today") {
    const todaySales = Number(props.performance?.Today?.sales) || Number(props.performance?.Day?.sales) || 0;
    const todayExpenses = Number(props.performance?.Today?.expenses) || Number(props.performance?.Day?.expenses) || 0;
    const moneyIn = Number(props.performance?.Today?.money_in) || todaySales;
    const moneyOut = Number(props.performance?.Today?.money_out) || todayExpenses;
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsx("header", { className: "vq-rail-h", children: /* @__PURE__ */ jsx("span", { children: "Today at a glance" }) }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-minigrid", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-rail-mini", children: [
          /* @__PURE__ */ jsx("span", { children: "Sales" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            "Rs ",
            abbrNum(todaySales)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-rail-mini", children: [
          /* @__PURE__ */ jsx("span", { children: "Expenses" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            "Rs ",
            abbrNum(todayExpenses)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-rail-mini", children: [
          /* @__PURE__ */ jsx("span", { children: "Money in" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            "Rs ",
            abbrNum(moneyIn)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-rail-mini", children: [
          /* @__PURE__ */ jsx("span", { children: "Money out" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            "Rs ",
            abbrNum(moneyOut)
          ] })
        ] })
      ] })
    ] });
  }
  if (id === "activity") {
    const txs = Array.isArray(props.recentTransactions) && props.recentTransactions.length > 0 ? props.recentTransactions : Array.isArray(props.recentPurchases) ? props.recentPurchases : [];
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Recent activity" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/reports"), className: "vq-rail-link", children: "All" })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: txs.length > 0 ? txs.slice(0, 6).map((tx, i) => {
        const isIn = tx.type === "in" || tx.type === "sale" || tx.type === "payment_in" || Number(tx.amount) > 0;
        const amt = Math.abs(Number(tx.amount || tx.total || 0));
        const title = tx.desc || tx.description || tx.reference || (tx.type ? `${tx.type}` : "Transaction");
        const time = tx.date ? new Date(tx.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
        return /* @__PURE__ */ jsxs("li", { className: "vq-rail-row", children: [
          /* @__PURE__ */ jsx("span", { className: `vq-rail-dot is-${isIn ? "in" : "out"}`, "aria-hidden": "true" }),
          /* @__PURE__ */ jsxs("span", { className: "vq-rail-row-n", children: [
            title,
            /* @__PURE__ */ jsx("em", { children: time })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `vq-rail-row-v is-${isIn ? "in" : "out"}`, children: [
            isIn ? "+ " : "− ",
            "Rs ",
            amt.toLocaleString()
          ] })
        ] }, tx.id || i);
      }) : /* @__PURE__ */ jsx("li", { className: "vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-3 justify-center", children: "No recent activity" }) })
    ] });
  }
  if (id === "alerts") {
    const lowStockItems = Array.isArray(props.lowStockItems) ? props.lowStockItems : [];
    const overdueReceivables = Number(props.outstanding?.receivables) || 0;
    const aiRecs = Array.isArray(props.aiRecommendations) ? props.aiRecommendations : [];
    const alertsList = [];
    if (lowStockItems.length > 0 && modOk(["inventory"])) {
      alertsList.push({ k: "warn", msg: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("strong", { children: [
          lowStockItems.length,
          " ",
          tt(lowStockItems.length === 1 ? "product" : "products")
        ] }),
        " reached reorder limit"
      ] }), href: "/inventory" });
    }
    if (overdueReceivables > 0 && modOk(["khata_credit", "payments"])) {
      alertsList.push({ k: "bad", msg: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("strong", { children: [
          "Rs ",
          overdueReceivables.toLocaleString()
        ] }),
        " ",
        tt("customer dues overdue")
      ] }), href: "/finance" });
    }
    aiRecs.forEach((r) => {
      alertsList.push({
        k: r.priority === "urgent" ? "bad" : "info",
        msg: /* @__PURE__ */ jsx(Fragment, { children: r.message || r.title }),
        href: "/reports"
      });
    });
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsx("header", { className: "vq-rail-h", children: /* @__PURE__ */ jsx("span", { children: "Actions required" }) }),
      /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: alertsList.length > 0 ? alertsList.map((a, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", { href: storePath(a.href), className: `vq-rail-alert is-${a.k}`, children: [
        /* @__PURE__ */ jsx("span", { className: "vq-rail-dot", "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-alert-m", children: a.msg })
      ] }) }, i)) : /* @__PURE__ */ jsx("li", { className: "vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-3 justify-center", children: "All clear — no actions required" }) })
    ] });
  }
  if (id === "quick_actions") return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
    /* @__PURE__ */ jsx("header", { className: "vq-rail-h", children: /* @__PURE__ */ jsx("span", { children: "Quick actions" }) }),
    /* @__PURE__ */ jsxs("div", { className: "vq-rail-actions", children: [
      /* @__PURE__ */ jsxs("a", { href: storePath("/sales"), className: "vq-rail-act is-primary", children: [
        /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
          /* @__PURE__ */ jsx("polyline", { points: "14 2 14 8 20 8" }),
          /* @__PURE__ */ jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" })
        ] }),
        /* @__PURE__ */ jsx("span", { children: "New Invoice" })
      ] }),
      /* @__PURE__ */ jsxs("a", { href: storePath("/purchase-orders"), className: "vq-rail-act", children: [
        /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx("path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" }),
          /* @__PURE__ */ jsx("path", { d: "M3 6h18" }),
          /* @__PURE__ */ jsx("path", { d: "M16 10a4 4 0 0 1-8 0" })
        ] }),
        /* @__PURE__ */ jsx("span", { children: "New Purchase" })
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
  if (id === "targets") {
    const monthSales = Number(props.performance?.Month?.sales) || Number(props.revenue) || 0;
    const daySales = Number(props.performance?.Today?.sales) || Number(props.performance?.Day?.sales) || 0;
    const netProfit = Number(props.netProfit) || 0;
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Growth & targets" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/reports"), className: "vq-rail-link", children: "Open" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-meter", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-rail-meter-t", children: [
          /* @__PURE__ */ jsx("span", { children: "Monthly sales" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            "Rs ",
            abbrNum(monthSales)
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "vq-rail-bar", children: /* @__PURE__ */ jsx("i", { style: { width: monthSales > 0 ? "100%" : "0%" } }) }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-meter-s", children: "Total revenue this month" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-meter", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-rail-meter-t", children: [
          /* @__PURE__ */ jsx("span", { children: "Today's velocity" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            "Rs ",
            abbrNum(daySales)
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "vq-rail-bar", children: /* @__PURE__ */ jsx("i", { style: { width: daySales > 0 ? "75%" : "0%" } }) }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-meter-s", children: "Sales closed today" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-rail-meter", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-rail-meter-t", children: [
          /* @__PURE__ */ jsx("span", { children: "Net profit" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            "Rs ",
            abbrNum(netProfit)
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "vq-rail-bar", children: /* @__PURE__ */ jsx("i", { style: { width: netProfit > 0 ? "100%" : "0%" } }) }),
        /* @__PURE__ */ jsx("span", { className: "vq-rail-meter-s", children: "Realised profit" })
      ] })
    ] });
  }
  if (id === "top_lists") {
    const topProducts = Array.isArray(props.topSellingItems) ? props.topSellingItems : [];
    const maxVal = topProducts[0]?.total_sales || topProducts[0]?.sales || 1;
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Top performers" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/reports"), className: "vq-rail-link", children: "Open" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "vq-rail-sub", children: tt("Products") }),
      /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: topProducts.length > 0 ? topProducts.slice(0, 5).map((t, idx) => {
        const val = Number(t.total_sales || t.sales || t.revenue || 0);
        const pct = Math.min(100, Math.round(val / maxVal * 100)) || 20;
        return /* @__PURE__ */ jsxs("li", { className: "vq-rail-rank", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-rail-row-n", children: t.name || `Item ${idx + 1}` }),
          /* @__PURE__ */ jsx("span", { className: "vq-rail-track", children: /* @__PURE__ */ jsx("i", { style: { width: `${pct}%` } }) }),
          /* @__PURE__ */ jsxs("span", { className: "vq-rail-row-v", children: [
            "Rs ",
            abbrNum(val)
          ] })
        ] }, t.id || idx);
      }) : /* @__PURE__ */ jsx("li", { className: "vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-2 justify-center", children: "No sales recorded this month" }) })
    ] });
  }
  if (id === "reminders") {
    const overdueAmt = Number(props.outstanding?.receivables) || 0;
    return /* @__PURE__ */ jsxs("section", { className: "vq-rail-card", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-rail-h", children: [
        /* @__PURE__ */ jsx("span", { children: "Payment reminders" }),
        /* @__PURE__ */ jsx("a", { href: storePath("/finance"), className: "vq-rail-link", children: "All" })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "vq-rail-list", children: overdueAmt > 0 ? /* @__PURE__ */ jsxs("li", { className: "vq-rail-row", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-rail-dot is-bad", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs("span", { className: "vq-rail-row-n", children: [
          "Outstanding Receivables",
          /* @__PURE__ */ jsx("em", { children: tt("Pending customer dues") })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "vq-rail-row-v", children: [
          "Rs ",
          overdueAmt.toLocaleString()
        ] })
      ] }) : /* @__PURE__ */ jsx("li", { className: "vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-3 justify-center", children: "No pending payment reminders" }) })
    ] });
  }
  return null;
}
function packPreset(cards, cols = 8) {
  const taken = [];
  const rects = [];
  const fits = (r, c, w, h) => {
    for (let y = r; y < r + h; y++) {
      const row = taken[y];
      if (row) {
        for (let x = c; x < c + w; x++) if (row[x]) return false;
      }
    }
    return true;
  };
  const mark = (r, c, w, h) => {
    for (let y = r; y < r + h; y++) {
      taken[y] ||= new Array(cols).fill(false);
      for (let x = c; x < c + w; x++) taken[y][x] = true;
    }
  };
  let cursorR = 0, cursorC = 0;
  cards.forEach((card) => {
    const w = Math.min(cols, card.w || 3), h = card.h || 2;
    let r = cursorR, c = cursorC, placed = false;
    while (!placed) {
      if (c + w > cols) {
        c = 0;
        r++;
        continue;
      }
      if (fits(r, c, w, h)) {
        rects.push({ x: c, y: r, w, h, hub: !!card.type });
        mark(r, c, w, h);
        cursorR = r;
        cursorC = c + w;
        placed = true;
      } else c++;
    }
  });
  return rects;
}
function PresetThumb({ cards }) {
  const rects = useMemo(() => packPreset(cards), [cards]);
  const rows = Math.min(14, rects.reduce((m, r) => Math.max(m, r.y + r.h), 0));
  const CW = 112, U = 5, G = 1.6, colW = (CW - G * 7) / 8;
  const H = rows * U + (rows - 1) * G;
  return /* @__PURE__ */ jsx("svg", { className: "vq-preset-thumb", width: CW, height: Math.max(30, H), viewBox: `0 0 ${CW} ${Math.max(30, H)}`, "aria-hidden": "true", children: rects.filter((r) => r.y < 14).map((r, i) => /* @__PURE__ */ jsx(
    "rect",
    {
      x: r.x * (colW + G),
      y: r.y * (U + G),
      width: r.w * colW + (r.w - 1) * G,
      height: Math.min(r.h, 14 - r.y) * U + (Math.min(r.h, 14 - r.y) - 1) * G,
      rx: "1.6",
      fill: "currentColor",
      opacity: r.hub ? 0.85 : 0.42
    },
    i
  )) });
}
function NewDashboard(props) {
  const tt = useTermText();
  const containerRef = useRef(null);
  const previewRef = useRef(null);
  const previewFrameRef = useRef(null);
  const previewHandleRef = useRef(null);
  const store = props?.store || { name: "VenQore Main Outlet", currency_symbol: "Rs", slug: "" };
  const auth = props?.auth || {};
  auth?.user || {};
  const settings = props?.settings || {};
  const readingsProp = props?.readings || null;
  if (typeof window !== "undefined") {
    if (props) window.__DASHBOARD_PROPS__ = props;
    if (Array.isArray(readingsProp) && readingsProp.length > 0) {
      window.__VENQORE_READINGS__ = readingsProp;
    }
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
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [stepperModalOpen, setStepperModalOpen] = useState(false);
  const [categoryFolderIndex, setCategoryFolderIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("All");
  const [glassModalOpen, setGlassModalOpen] = useState(false);
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
  const THEME_KEY = "vq-dashboard-v6-theme";
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return v === "dark" || v === "mesh" || v === "light" ? v : "mesh";
    } catch {
      return "mesh";
    }
  });
  useEffect(() => {
    const r = document.documentElement;
    const dark = themeMode !== "light";
    r.setAttribute("data-theme", dark ? "dark" : "light");
    if (themeMode === "mesh") r.setAttribute("data-bg", "mesh");
    else r.removeAttribute("data-bg");
    try {
      localStorage.setItem(THEME_KEY, themeMode);
    } catch {
    }
    engine()?.draw?.();
  }, [themeMode, engineReady]);
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
  const railAvailable = (def) => {
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
  const choosePreset = (id) => {
    const e = engine();
    const p = e?.getPresets?.()[id];
    e?.applyPreset?.(id);
    if (p) setRailOpt({ design: PANEL_DESIGNS.some((d) => d.id === p.panel) ? p.panel : null, collapsed: false });
    setPresetModalOpen(false);
  };
  useEffect(() => {
    window._vqOpenGlassActions = () => setGlassModalOpen(true);
    window._vqDonateCharity = async (amount) => {
      try {
        const donateUrl = typeof window !== "undefined" && typeof window.route === "function" ? window.route("store.charity.add", { store_slug: storeSlug }) : `/s/${storeSlug}/charity/add`;
        const res = await axios.post(donateUrl, { amount: Number(amount) || 10 });
        if (res.data && res.data.success) {
          if (props?.charityStats) {
            props.charityStats.today = res.data.today_total;
          }
          if (window.__DASHBOARD_PROPS__?.charityStats) {
            window.__DASHBOARD_PROPS__.charityStats.today = res.data.today_total;
          }
          window.VenQoreCards?.draw?.();
          window.dispatchEvent(new CustomEvent("vq:toast", {
            detail: { message: `Charity recorded: Rs ${Number(amount || 10).toLocaleString()}`, type: "success" }
          }));
          router.reload({ only: ["charityStats"] });
        }
      } catch (err) {
        console.error("Failed to record charity:", err);
      }
    };
    return () => {
      window._vqOpenGlassActions = null;
      window._vqDonateCharity = null;
    };
  }, [storeSlug, props]);
  const enabledModules = useMemo(
    () => Array.isArray(props?.modules) ? props.modules : [],
    [props?.modules]
  );
  useEffect(() => {
    runCardBuilder({ storeSlug, modules: enabledModules, readings: readingsProp, ...props });
    setEngineReady(true);
  }, [storeSlug, enabledModules, readingsProp, props]);
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
    const onToggleSidePanel = () => setRailsModalOpen(true);
    const onOpenSidePanel = () => setRailsModalOpen(true);
    const onStartFresh = () => setPresetModalOpen(true);
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
      if (params.get("side_panel") === "1") setTimeout(() => setRailsModalOpen(true), 350);
      if (params.get("reset") === "1") setPresetModalOpen(true);
    }
    return () => {
      window.removeEventListener("vq:edit-layout", onEditLayout);
      window.removeEventListener("vq:toggle-edit-layout", onEditLayout);
      window.removeEventListener("vq:add-card", onAddCard);
      window.removeEventListener("vq:open-add-card", onAddCard);
      window.removeEventListener("vq:toggle-side-panel", onToggleSidePanel);
      window.removeEventListener("vq:open-side-panel", onToggleSidePanel);
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
  engine()?.getCatMax?.() || CAT_MAX_FALLBACK;
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
    setStepperModalOpen(true);
  };
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
    if (editingCardId) {
      delete card.id;
      e.updateCard(editingCardId, card);
    } else {
      card.id = "c-" + Math.random().toString(36).substring(2, 9);
      e.addCardObject(card);
    }
    setStepperModalOpen(false);
    setEditingCardId(null);
    setStep(1);
  };
  const readings = engineReady ? (engine()?.getAvailableReadings?.() ?? engine()?.getReadings?.()) || [] : Array.isArray(readingsProp) && readingsProp.length > 0 ? readingsProp : typeof window !== "undefined" && window.__VENQORE_READINGS__ || [];
  const visibleTemplates = engineReady ? OPERATIONAL_TEMPLATES.filter((t) => engine()?.specialAvailable?.(t.type) !== false) : OPERATIONAL_TEMPLATES;
  const availableAreas = useMemo(
    () => ["All", ...Array.from(new Set(readings.map((r) => r?.area).filter(Boolean)))],
    [readings]
  );
  const filteredReadings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return readings.filter((r) => r && (selectedArea === "All" || r.area === selectedArea) && (!q || r.label && r.label.toLowerCase().includes(q) || r.module && r.module.toLowerCase().includes(q) || r.key && r.key.toLowerCase().includes(q)));
  }, [readings, selectedArea, searchQuery]);
  const groupedSections = useMemo(() => {
    const groups = {};
    filteredReadings.forEach((r) => {
      (groups[r?.area || "General"] ||= []).push(r);
    });
    return groups;
  }, [filteredReadings]);
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
    const catMaxTbl = e.getCatMax?.() || CAT_MAX_FALLBACK;
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
      label: "Money In",
      color: "teal",
      href: storePath("/funds?action=add"),
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("line", { x1: "7", y1: "7", x2: "17", y2: "17" }),
        /* @__PURE__ */ jsx("polyline", { points: "17 7 17 17 7 17" })
      ] })
    },
    {
      label: "Money Out",
      color: "coral",
      href: storePath("/funds?action=remove"),
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("line", { x1: "7", y1: "17", x2: "17", y2: "7" }),
        /* @__PURE__ */ jsx("polyline", { points: "7 7 17 7 17 17" })
      ] })
    },
    {
      label: "Transfer Money",
      color: "blue",
      href: storePath("/funds?action=transfer"),
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "m16 3 4 4-4 4" }),
        /* @__PURE__ */ jsx("path", { d: "M20 7H4" }),
        /* @__PURE__ */ jsx("path", { d: "m8 21-4-4 4-4" }),
        /* @__PURE__ */ jsx("path", { d: "M4 17h16" })
      ] })
    },
    {
      label: tt("Add Product"),
      color: "orange",
      href: storePath("/inventory?action=add"),
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
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
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("line", { x1: "12", y1: "2", x2: "12", y2: "22" }),
        /* @__PURE__ */ jsx("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" })
      ] })
    },
    {
      label: "Add User",
      color: "purple",
      href: storePath("/admin/users"),
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
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
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
        /* @__PURE__ */ jsx("path", { d: "M3 3v5h5" })
      ] })
    },
    {
      label: "New Quote",
      color: "sky",
      href: storePath("/sales/pre-sales/create"),
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
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
      icon: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "m17 2 4 4-4 4" }),
        /* @__PURE__ */ jsx("path", { d: "M3 11v-1a4 4 0 0 1 4-4h14" }),
        /* @__PURE__ */ jsx("path", { d: "m7 22-4-4 4-4" }),
        /* @__PURE__ */ jsx("path", { d: "M21 13v1a4 4 0 0 1-4 4H3" })
      ] })
    },
    {
      label: "Charity Donation",
      color: "rose",
      action: () => {
        if (window._vqDonateCharity) {
          window._vqDonateCharity(10);
        }
      },
      icon: /* @__PURE__ */ jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" }) })
    }
  ];
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
                /* @__PURE__ */ jsx("span", { className: "vq-dest-name", children: tt(t.label) })
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
              /* @__PURE__ */ jsx("div", { className: "vq-board-zone", children: /* @__PURE__ */ jsx("div", { className: "vq-grid", id: "board" }) }),
              railsOn && /* @__PURE__ */ jsx(
                "aside",
                {
                  className: `vq-rails ${railPrefs.sticky ? "is-sticky" : ""}`,
                  style: { "--vq-rails-w": `${railPrefs.width || 340}px` },
                  "aria-label": "Side panel",
                  children: /* @__PURE__ */ jsx("div", { className: "vq-rails-shell", children: /* @__PURE__ */ jsx("div", { className: "vq-rails-scroll", children: activeRails.map((id) => /* @__PURE__ */ jsx(
                    DashRail,
                    {
                      id,
                      storePath,
                      enabledModules,
                      props,
                      onQuickActions: () => setGlassModalOpen(true)
                    },
                    id
                  )) }) })
                }
              )
            ] }) }) })
          ] }),
          presetModalOpen && /* @__PURE__ */ jsx("div", { className: "vq-modal-overlay", onClick: () => setPresetModalOpen(false), role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsxs("div", { className: "vq-modal-card vq-preset-modal", onClick: (e) => e.stopPropagation(), children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-modal-top-bar", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "vq-modal-step-sub", children: "STARTING LAYOUTS" }),
                /* @__PURE__ */ jsx("div", { className: "vq-modal-heading", children: "Start fresh" })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-modal-close-x", onClick: () => setPresetModalOpen(false), "aria-label": "Close", children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: [
                /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
              ] }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-preset-note", children: "Pick a starting point — it replaces what's on the board now, and you can add, resize and remove anything afterwards." }),
            /* @__PURE__ */ jsx("div", { className: "vq-preset-grid", children: Object.entries(engine()?.getPresets?.() || {}).map(([id, p]) => {
              const railNames = (p.rails || []).map((rid) => tt(RAIL_DEFS.find((d) => d.id === rid)?.name || "")).filter(Boolean);
              return /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "vq-item-card vq-preset-card",
                  onClick: () => choosePreset(id),
                  children: /* @__PURE__ */ jsxs("span", { className: "vq-preset-row", children: [
                    /* @__PURE__ */ jsx(PresetThumb, { cards: p.cards }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-preset-text", children: [
                      /* @__PURE__ */ jsxs("span", { className: "vq-item-card-top", children: [
                        /* @__PURE__ */ jsx("span", { className: "vq-item-card-title", children: tt(p.name) }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-item-card-arrow", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "vq-item-card-desc", children: tt(p.desc) }),
                      railNames.length > 0 && /* @__PURE__ */ jsxs("span", { className: "vq-preset-rails", children: [
                        "Side panel: ",
                        railNames.join(" · ")
                      ] })
                    ] })
                  ] })
                },
                id
              );
            }) })
          ] }) }),
          stepperModalOpen && /* @__PURE__ */ jsx("div", { className: "vq-modal-overlay", onClick: () => setStepperModalOpen(false), role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsxs("div", { className: "vq-modal-card", onClick: (e) => e.stopPropagation(), children: [
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
                      /* @__PURE__ */ jsx("span", { className: "vq-item-card-title", children: tt(r.label) }),
                      /* @__PURE__ */ jsx("svg", { className: "vq-item-card-arrow", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-item-card-desc", children: tt(r.desc || "") })
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
                      /* @__PURE__ */ jsx("span", { className: "vq-item-card-title", children: tt(tmpl.title) }),
                      /* @__PURE__ */ jsx("svg", { className: "vq-item-card-arrow", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-item-card-desc", children: tt(tmpl.desc) })
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
                      /* @__PURE__ */ jsx("span", { className: "vq-item-card-title", children: tt(target.label) }),
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
          ] }) }),
          railsModalOpen && /* @__PURE__ */ jsx("div", { className: "vq-modal-overlay", onClick: () => setRailsModalOpen(false), role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsxs("div", { className: "vq-modal-card vq-preset-modal", onClick: (e) => e.stopPropagation(), children: [
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
                      /* @__PURE__ */ jsx("span", { className: "vq-rail-option-name", children: tt(d.name) }),
                      /* @__PURE__ */ jsx("span", { className: "vq-rail-option-desc", children: tt(d.desc) })
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
          ] }) }),
          glassModalOpen && /* @__PURE__ */ jsx("div", { className: "vq-glass-modal-overlay", onClick: () => setGlassModalOpen(false), role: "dialog", "aria-modal": "true", "aria-label": "Quick Actions", children: /* @__PURE__ */ jsxs("div", { className: "vq-glass-modal-card", onClick: (e) => e.stopPropagation(), children: [
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
              if (item.action) item.action();
              else if (item.href) window.location.href = item.href;
            } })
          ] }) }),
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
          ] }),
          !store?.is_demo && !store?.onboarding_completed && (store?.onboarding_step === "welcome" || store?.onboarding_step === "purchase_tour_start" || store?.onboarding_step === "purchase_tour_sidebar" || store?.onboarding_step === "invoice_tour_start" || store?.onboarding_step === "pos_tour_start" || store?.onboarding_step === "expense_tour_start") && /* @__PURE__ */ jsx(WelcomeTourModal, { store }),
          !store?.is_demo && !store?.onboarding_completed && store?.onboarding_step === "dashboard_tour" && /* @__PURE__ */ jsx(DashboardTourGuide, { store })
        ]
      }
    )
  ] });
}
NewDashboard.layout = (page) => page;
export {
  NewDashboard as default
};

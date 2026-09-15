import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { router, usePage, Head } from "@inertiajs/react";
import { f as formatCurrency, a as formatNumber } from "./format-B_ph0Qec.js";
import { O as OneGlanceLayout } from "./OneGlanceLayout-DVMZFL-a.js";
import { R as RightPanel, P as PremiumDropdown, C as ChartSection, T as TodaysOpportunities } from "./TodaysOpportunities-CMnJKMTq.js";
import { X, Sparkles, Rocket, ArrowRight, Box, ArrowLeft, CheckCircle2, ChevronLeft, TrendingUp, Percent, ArrowDownLeft, ArrowUpRight, Wallet, Activity, MoreHorizontal, ShieldCheck, Package } from "lucide-react";
import { createPortal } from "react-dom";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { u as usePermission } from "./usePermission-CvyvxnRG.js";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-qlixTg74.js";
import "motion/react";
import "./ThinkingOrb-CQCcf5-R.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "recharts";
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
function Dashboard({
  performance = {},
  outstanding = {},
  netProfit = {},
  salesData,
  topSellingItems = [],
  lowStockItems = [],
  recentPurchases = [],
  recentTransactions = [],
  plSummary = {},
  bankAccounts = [],
  cashAccounts = [],
  cashData = {},
  inventoryValue
}) {
  const { auth, store } = usePage().props;
  const { hasPerm, isAdmin } = usePermission();
  const canSales = hasPerm("sales", "reports");
  const canFinance = hasPerm("finance");
  const canInventory = hasPerm("inventory");
  hasPerm("reports");
  const canPurchases = hasPerm("purchases");
  const showRightPanel = isAdmin || auth?.user?.role === "manager" || auth?.user?.role === "accountant";
  const [performancePeriod, setPerformancePeriod] = useState("Today");
  const [grossProfitPeriod, setGrossProfitPeriod] = useState("Today");
  const [toReceivePeriod, setToReceivePeriod] = useState("Month");
  const [toPayPeriod, setToPayPeriod] = useState("Month");
  const [netProfitPeriod, setNetProfitPeriod] = useState("Month");
  const [purchasesPeriod, setPurchasesPeriod] = useState("Month");
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
  const [desktopSidePanelVisible, setDesktopSidePanelVisible] = useState(true);
  useEffect(() => {
    const handleTogglePanel = () => {
      setMobileRightPanelOpen((prev) => !prev);
      setDesktopSidePanelVisible((prev) => !prev);
    };
    window.addEventListener("vq:toggle-side-panel", handleTogglePanel);
    return () => window.removeEventListener("vq:toggle-side-panel", handleTogglePanel);
  }, []);
  const timeframeOptions = [
    { value: "Today", label: "Today" },
    { value: "Month", label: "Month" },
    { value: "Year", label: "Year" },
    { value: "All Time", label: "All Time" }
  ];
  const purchasesList = Array.isArray(recentPurchases) ? recentPurchases : recentPurchases[purchasesPeriod] || [];
  const totalRevVal = parseFloat(performance[performancePeriod]?.sales || 0);
  const grossProfitVal = parseFloat(performance[grossProfitPeriod]?.gross_profit || 0);
  const grossProfitRev = parseFloat(performance[grossProfitPeriod]?.sales || 0);
  const grossMarginPct = grossProfitRev > 0 ? (grossProfitVal / grossProfitRev * 100).toFixed(1) : "0.0";
  const toReceiveVal = parseFloat(outstanding[toReceivePeriod]?.receivables || 0);
  const toPayVal = parseFloat(outstanding[toPayPeriod]?.payables || 0);
  const netProfitData = netProfit[netProfitPeriod] || {};
  const netProfitVal = parseFloat(netProfitData.value || 0);
  const netProfitIncome = parseFloat(netProfitData.income || 0);
  const netProfitExpense = parseFloat(netProfitData.expense || 0);
  const healthStatus = netProfitData.status || (netProfitVal >= 0 ? "Good" : "Needs Attention");
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Dashboard", children: [
    /* @__PURE__ */ jsx(Head, { title: "Dashboard" }),
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes nudge-left {
 0%, 100% { transform: translateY(-50%) translateX(0); }
 50% { transform: translateY(-50%) translateX(-3px); }
                }
                .animate-nudge-left {
 animation: nudge-left 2.5s ease-in-out infinite;
                }
 ` }),
    showRightPanel && /* @__PURE__ */ jsxs("div", { className: "lg:hidden", children: [
      mobileRightPanelOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 z-drawer lg:hidden", onClick: () => setMobileRightPanelOpen(false) }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `
 fixed top-0 right-0 h-[100vh] z-drawer
 transition-transform duration-slow ease-in-out transform
                            ${mobileRightPanelOpen ? "translate-x-0" : "translate-x-full"}
 w-[320px] bg-surface border-l border-line p-4 flex flex-col h-full
 `,
          children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setMobileRightPanelOpen(!mobileRightPanelOpen),
                className: `absolute left-[-24px] top-1/2 -translate-y-1/2 z-modal lg:hidden w-6 h-32 flex items-center justify-center text-ink-muted hover:text-brand-500 transition-colors pointer-events-auto ${!mobileRightPanelOpen ? "animate-nudge-left" : ""}`,
                style: { filter: "drop-shadow(-4px 4px 6px rgba(0, 0, 0, 0.04))" },
                children: [
                  /* @__PURE__ */ jsxs(
                    "svg",
                    {
                      className: "absolute inset-0 w-full h-full text-white dark:text-ink pointer-events-none",
                      viewBox: "0 0 24 128",
                      fill: "currentColor",
                      xmlns: "http://www.w3.org/2000/svg",
                      children: [
                        /* @__PURE__ */ jsx(
                          "path",
                          {
                            d: "M 24 0 C 24 20, 0 35, 0 64 C 0 93, 24 108, 24 128 Z",
                            fill: "currentColor"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "path",
                          {
                            d: "M 24 0 C 24 20, 0 35, 0 64 C 0 93, 24 108, 24 128",
                            fill: "none",
                            className: "stroke-chart-grid",
                            strokeWidth: "1"
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(ChevronLeft, { size: 14, className: `relative z-10 transition-transform duration-slow ${mobileRightPanelOpen ? "rotate-180" : ""}` })
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar pr-1", children: /* @__PURE__ */ jsx(
              RightPanel,
              {
                recentTransactions,
                bankAccounts,
                cashAccounts,
                cashData,
                inventoryValue
              }
            ) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-full max-w-full py-2 px-1 sm:px-2", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-5 sm:gap-6 w-full animate-in fade-in duration-slower", children: [
      /* @__PURE__ */ jsxs("div", { className: `col-span-12 ${showRightPanel && desktopSidePanelVisible ? "xl:col-span-9" : "col-span-12"} flex flex-col gap-6 min-w-0`, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-4.5 w-full", children: [
          canSales && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-revenue",
              onClick: () => router.visit(route("store.sales.index", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0", children: /* @__PURE__ */ jsx(TrendingUp, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "Revenue" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: performancePeriod,
                      onChange: setPerformancePeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-ink tracking-tight truncate leading-tight", children: formatCurrency(totalRevVal, store) }),
                  /* @__PURE__ */ jsxs("p", { className: "text-3xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 truncate", children: [
                    "Gross: ",
                    formatCurrency(parseFloat(performance[performancePeriod]?.gross_profit || 0), store)
                  ] })
                ] })
              ]
            }
          ),
          canSales && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-profit",
              onClick: () => router.visit(route("store.reports.dashboard", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-brand-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0", children: /* @__PURE__ */ jsx(Percent, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "Gross Profit" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: grossProfitPeriod,
                      onChange: setGrossProfitPeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-ink tracking-tight truncate leading-tight", children: formatCurrency(grossProfitVal, store) }),
                  /* @__PURE__ */ jsxs("p", { className: "text-3xs text-brand-600 dark:text-brand-400 font-semibold mt-1 truncate", children: [
                    "Margin: ",
                    grossMarginPct,
                    "%"
                  ] })
                ] })
              ]
            }
          ),
          canFinance && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-receivables",
              onClick: () => router.visit(route("store.finance.receivables", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0", children: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "To Receive" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: toReceivePeriod,
                      onChange: setToReceivePeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight truncate leading-tight", children: formatCurrency(toReceiveVal, store) }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium mt-1 truncate", children: "Customer receivables" })
                ] })
              ]
            }
          ),
          canFinance && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-payables",
              onClick: () => router.visit(route("store.finance.payables", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0", children: /* @__PURE__ */ jsx(ArrowUpRight, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "To Pay" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: toPayPeriod,
                      onChange: setToPayPeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight truncate leading-tight", children: formatCurrency(toPayVal, store) }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium mt-1 truncate", children: "Supplier payables" })
                ] })
              ]
            }
          ),
          canFinance && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-netprofit",
              onClick: () => router.visit(route("store.reports.profit-loss", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-teal-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0", children: /* @__PURE__ */ jsx(Wallet, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "Net Profit" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: netProfitPeriod,
                      onChange: setNetProfitPeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-teal-600 dark:text-teal-400 tracking-tight truncate leading-tight", children: formatCurrency(netProfitVal, store) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mt-1 text-3xs text-ink-muted font-medium truncate", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-emerald-600 dark:text-emerald-400 font-semibold truncate", children: [
                      "+",
                      formatCurrency(netProfitIncome, store)
                    ] }),
                    /* @__PURE__ */ jsx("span", { children: "·" }),
                    /* @__PURE__ */ jsxs("span", { className: "text-rose-500 font-semibold truncate", children: [
                      "-",
                      formatCurrency(netProfitExpense, store)
                    ] })
                  ] })
                ] })
              ]
            }
          ),
          canFinance && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-health",
              onClick: () => router.visit(route("store.reports.dashboard", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0", children: /* @__PURE__ */ jsx(Activity, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "Store Health" })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "flex h-2 w-2 relative shrink-0", children: [
                    /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" }),
                    /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-emerald-500" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 text-2xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide", children: healthStatus }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium mt-1.5 truncate", children: "Books balanced & active" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-5 sm:gap-6 w-full min-w-0", children: [
          canSales && /* @__PURE__ */ jsx(
            "div",
            {
              id: "tour-sales-chart",
              className: `${isAdmin && store?.features?.growth_engine == 1 ? "col-span-12 xl:col-span-8" : "col-span-12"} min-h-[340px] min-w-0`,
              children: /* @__PURE__ */ jsx(ChartSection, { salesData })
            }
          ),
          isAdmin && store?.features?.growth_engine == 1 && /* @__PURE__ */ jsx("div", { id: "tour-opportunities", className: "col-span-12 xl:col-span-4 min-w-0 flex flex-col min-h-[340px]", children: /* @__PURE__ */ jsx(TodaysOpportunities, { className: "flex-1" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 w-full min-w-0", children: [
          canSales && /* @__PURE__ */ jsxs("div", { id: "tour-top-products", className: "bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-line flex flex-col min-h-[340px] group min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-ink text-sm flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-4 bg-emerald-500 rounded-full" }),
                "Top Products"
              ] }),
              /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover rounded-lg transition-colors text-ink-muted hover:text-brand-600", children: /* @__PURE__ */ jsx(MoreHorizontal, { size: 16 }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 pr-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-3xs font-bold uppercase tracking-wider text-ink-muted border-b border-line", children: [
                /* @__PURE__ */ jsx("th", { className: "pb-2.5 pl-1", children: "Product" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2.5 text-center", children: "Qty" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2.5 text-right pr-1", children: "Total" })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { children: [
                topSellingItems.map((item, i) => /* @__PURE__ */ jsxs("tr", { className: "group/row hover:bg-interactive-hover transition-colors cursor-default rounded-xl", children: [
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 pl-1 border-b border-line group-last/row:border-none", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-sunken flex items-center justify-center text-sm shadow-2xs border border-line shrink-0 group-hover/row:scale-105 transition-transform", children: item.image }),
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-secondary dark:text-ink-faint truncate", children: item.name }),
                      /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium truncate", children: item.category })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 text-xs text-center font-bold text-ink-secondary border-b border-line group-last/row:border-none", children: /* @__PURE__ */ jsx("span", { className: "bg-sunken px-2 py-0.5 rounded-md text-3xs font-semibold", children: item.sold }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 pr-1 text-xs text-right font-bold text-emerald-600 dark:text-emerald-400 border-b border-line group-last/row:border-none whitespace-nowrap", children: item.revenue })
                ] }, i)),
                topSellingItems.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "3", className: "py-8 text-center text-ink-muted text-xs", children: "No sales data recorded yet." }) })
              ] })
            ] }) })
          ] }),
          canInventory && /* @__PURE__ */ jsxs("div", { id: "tour-low-stock", className: "bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-line flex flex-col min-h-[340px] min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-ink text-sm flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-4 bg-rose-500 rounded-full" }),
                "Low Stock Alerts"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => router.visit(route("store.inventory.index", { store_slug: store?.slug })),
                  className: "text-3xs text-brand-600 dark:text-brand-400 font-bold hover:underline",
                  children: "View Inventory"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 pr-1 space-y-2.5", children: [
              lowStockItems.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2.5 bg-rose-50/70 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-secondary dark:text-ink-faint truncate", children: item.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-3xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5", children: [
                    "Stock: ",
                    formatNumber(item.stock),
                    " / Min: ",
                    formatNumber(item.alert)
                  ] })
                ] }),
                canPurchases && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => router.visit(route("store.purchases.create", { store_slug: store?.slug, product_id: item.id })),
                    className: "px-2.5 py-1 bg-surface text-3xs font-bold text-ink-secondary dark:text-ink-faint rounded-lg shadow-2xs border border-line hover:text-brand-600 dark:hover:text-brand-400 shrink-0 transition-colors",
                    children: "Order"
                  }
                )
              ] }, item.id)),
              lowStockItems.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-ink-muted py-8", children: [
                /* @__PURE__ */ jsx(ShieldCheck, { size: 28, className: "text-emerald-500 mb-1" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-ink-secondary", children: "All Stock Healthy" }),
                /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted mt-0.5", children: "No products below alert threshold" })
              ] })
            ] })
          ] }),
          canPurchases && /* @__PURE__ */ jsxs("div", { id: "tour-purchases", className: "bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-line flex flex-col min-h-[340px] min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-4 bg-amber-500 rounded-full" }),
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink text-sm", children: "Recent Purchases" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
                  PremiumDropdown,
                  {
                    options: timeframeOptions,
                    value: purchasesPeriod,
                    onChange: setPurchasesPeriod
                  }
                ) }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => router.visit(route("store.purchases.index", { store_slug: store?.slug })),
                    className: "text-3xs text-brand-600 dark:text-brand-400 font-bold hover:underline",
                    children: "View All"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 pr-1 space-y-2.5", children: [
              purchasesList.map((item) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => router.visit(route("store.purchases.show", { store_slug: store?.slug, purchase: item.id })),
                  className: "flex items-center justify-between p-2.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-800 transition-colors cursor-pointer gap-2",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-secondary dark:text-ink-faint truncate", children: item.supplier_name }),
                      /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium", children: item.date })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-amber-600 dark:text-amber-400", children: item.total_amount }),
                      /* @__PURE__ */ jsx("p", { className: "text-3xs uppercase tracking-wider font-bold text-ink-muted leading-none mt-0.5", children: item.status })
                    ] })
                  ]
                },
                item.id
              )),
              purchasesList.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-ink-muted py-8", children: [
                /* @__PURE__ */ jsx(Package, { size: 28, className: "text-ink-faint dark:text-ink-secondary mb-1" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-ink-secondary", children: "No Purchases" }),
                /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted mt-0.5", children: "No recent purchases for this period" })
              ] })
            ] })
          ] })
        ] })
      ] }),
      showRightPanel && desktopSidePanelVisible && /* @__PURE__ */ jsx("div", { id: "tour-right-panel", className: "hidden xl:block xl:col-span-3 min-w-0 self-start sticky top-0", children: /* @__PURE__ */ jsx(
        RightPanel,
        {
          recentTransactions,
          bankAccounts,
          cashAccounts,
          cashData,
          inventoryValue
        }
      ) })
    ] }) }),
    !store?.is_demo && !store?.onboarding_completed && (store?.onboarding_step === "welcome" || store?.onboarding_step === "purchase_tour_start" || store?.onboarding_step === "purchase_tour_sidebar" || store?.onboarding_step === "invoice_tour_start" || store?.onboarding_step === "pos_tour_start" || store?.onboarding_step === "expense_tour_start") && /* @__PURE__ */ jsx(WelcomeTourModal, { store }),
    !store?.is_demo && !store?.onboarding_completed && store?.onboarding_step === "dashboard_tour" && /* @__PURE__ */ jsx(DashboardTourGuide, { store })
  ] });
}
export {
  Dashboard as default
};

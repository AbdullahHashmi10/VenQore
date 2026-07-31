import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { router, usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { S as StockModuleTabs } from "./StockModuleTabs-n32iv0yk.js";
import { P as ProductModal } from "./ProductModal-ChKYFNm4.js";
import { createPortal } from "react-dom";
import { Sparkles, Minimize2, ArrowRight, ArrowLeft, Trophy, Home, Plus, ChevronDown, Package, AlertTriangle, DollarSign, Layers, Search, Upload, X, Trash2, ChevronUp, MoreVertical, Edit } from "lucide-react";
import { P as PasscodeModal } from "../ssr.js";
import "driver.js";
import "./PremiumButton-BcHxfadR.js";
import "./PremiumSelect-BdCYeyr5.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
function ProductTourGuide({ isModalOpen, store, categories = [] }) {
  const [isCategoryCreationPath, setIsCategoryCreationPath] = useState(() => categories.length === 0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(() => {
    return sessionStorage.getItem("amd_onboarding_minimized") === "true";
  });
  const toggleMinimized = (val) => {
    setIsMinimized(val);
    sessionStorage.setItem("amd_onboarding_minimized", val ? "true" : "false");
  };
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [liveMargin, setLiveMargin] = useState(null);
  const renderPortal = (content) => {
    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
  };
  useEffect(() => {
    if (isModalOpen && currentStep === 0) {
      setCurrentStep(1);
    } else if (!isModalOpen && currentStep > 0) {
      setCurrentStep(0);
    }
  }, [isModalOpen]);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const getTargetId = (step) => {
    if (isCategoryCreationPath) {
      switch (step) {
        case 0:
          return "tour-add-product";
        case 1:
          return "tour-product-name";
        case 2:
          return "tour-product-sku-gen";
        case 3:
          return "tour-product-category";
        case 4:
          return "tour-add-new-category-btn";
        case 5:
          return "tour-new-category-name";
        case 6:
          return "tour-product-cost";
        case 7:
          return "tour-product-price";
        case 8:
          return "tour-product-barcode";
        case 9:
          return "tour-tab-reservations";
        case 10:
          return "tour-tab-extra";
        case 11:
          return "tour-product-save";
        default:
          return null;
      }
    } else {
      switch (step) {
        case 0:
          return "tour-add-product";
        case 1:
          return "tour-product-name";
        case 2:
          return "tour-product-sku-gen";
        case 3:
          return "tour-product-category";
        case 4:
          return "tour-product-cost";
        case 5:
          return "tour-product-price";
        case 6:
          return "tour-product-barcode";
        case 7:
          return "tour-tab-reservations";
        case 8:
          return "tour-tab-extra";
        case 9:
          return "tour-product-save";
        default:
          return null;
      }
    }
  };
  useEffect(() => {
    if (!isCategoryCreationPath) return;
    const interval = setInterval(() => {
      const activeId = document.activeElement?.id;
      if (currentStep === 3) {
        if (document.getElementById("tour-add-new-category-btn")) {
          setCurrentStep(4);
        }
      } else if (currentStep === 4) {
        if (document.getElementById("tour-new-category-name")) {
          setCurrentStep(5);
        }
      } else if (currentStep === 5) {
        if (activeId === "tour-product-cost") {
          setCurrentStep(6);
        }
      }
    }, 150);
    return () => clearInterval(interval);
  }, [currentStep, isCategoryCreationPath]);
  useEffect(() => {
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
    const el = getVisibleElement(targetId);
    if (el && currentStep > 0) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timer = setTimeout(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    const modalContainer = document.querySelector(".overflow-y-auto");
    if (modalContainer) {
      modalContainer.addEventListener("scroll", updateCoords, true);
    }
    const interval = setInterval(updateCoords, 80);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("resize", updateCoords);
      if (modalContainer) {
        modalContainer.removeEventListener("scroll", updateCoords, true);
      }
    };
  }, [currentStep, isModalOpen, isCategoryCreationPath]);
  useEffect(() => {
    if (currentStep !== 4 && currentStep !== 5) return;
    const checkMargin = () => {
      const costEl = document.getElementById("tour-product-cost");
      const priceEl = document.getElementById("tour-product-price");
      if (costEl && priceEl) {
        const cost = parseFloat(costEl.value) || 0;
        const price = parseFloat(priceEl.value) || 0;
        if (price > 0 && cost > 0) {
          const margin = Math.round((price - cost) / price * 100);
          setLiveMargin({ cost, price, margin });
        } else {
          setLiveMargin(null);
        }
      }
    };
    const interval = setInterval(checkMargin, 150);
    return () => clearInterval(interval);
  }, [currentStep]);
  const handleMakeMore = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "inventory_tour_more" },
      { preserveScroll: true }
    );
  };
  const handleGoToDashboard = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "purchase_tour_start" },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  const handleUpdateStep = (stepValue) => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: stepValue },
      { preserveScroll: true }
    );
  };
  if (store?.is_demo || store?.onboarding_step !== "inventory_tour" && store?.onboarding_step !== "congratulations" && store?.onboarding_step !== "inventory_tour_more") return null;
  if (store?.onboarding_step === "inventory_tour_more") {
    if (isMinimized) {
      const circumference = 2 * Math.PI * 18;
      const progressOffset = circumference * (1 - 0.33);
      return /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => toggleMinimized(false),
          title: "Onboarding Active: Cataloging Mode (33% Complete). Click to expand.",
          className: "fixed bottom-24 right-6 z-[100] w-14 h-14 bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/30 rounded-full shadow-[0_10px_30px_rgba(99,102,241,0.3)] backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto hover:scale-110 active:scale-95 hover:border-indigo-400/50 transition-all duration-300 group",
          children: [
            /* @__PURE__ */ jsxs("svg", { className: "absolute w-full h-full -rotate-90", viewBox: "0 0 44 44", children: [
              /* @__PURE__ */ jsx(
                "circle",
                {
                  className: "text-slate-800 dark:text-slate-800",
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
            /* @__PURE__ */ jsx("div", { className: "relative z-10 text-indigo-400 group-hover:text-white transition-colors duration-200", children: /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "animate-pulse" }) }),
            /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 bg-indigo-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full shadow", children: "33%" })
          ]
        }
      );
    }
    return /* @__PURE__ */ jsxs("div", { className: "fixed bottom-24 right-6 z-[100] max-w-sm w-full bg-slate-900/95 dark:bg-slate-950/98 border border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.25)] p-5 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => toggleMinimized(true),
          className: "absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50",
          title: "Minimize to widget",
          children: /* @__PURE__ */ jsx(Minimize2, { size: 12 })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
        /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "Onboarding Active" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-indigo-400 font-semibold uppercase tracking-wide", children: "Cataloging Mode (33%)" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-300 leading-relaxed font-medium mb-4 pr-6", children: "You can add as many products as you like. When you are done cataloging, click below to proceed or load products in bulk." }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleGoToDashboard,
            className: "w-full py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Proceed to Buy Stock" }),
              /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleUpdateStep("completed"),
            className: "w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
            children: "Exit Tour"
          }
        )
      ] })
    ] });
  }
  if (store?.onboarding_step === "congratulations") {
    return renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Trophy, { className: "text-white w-8 h-8" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3", children: "Congratulations! 🎉" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm font-semibold mb-2", children: "You have successfully created your first product!" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-300 text-sm leading-relaxed max-w-sm mb-8", children: "Great job setting up your initial inventory catalog. What would you like to do next?" }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 w-full", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleGoToDashboard,
                  className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(Home, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Go to Dashboard" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleMakeMore,
                  className: "w-full py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { children: "Make More Products" })
                  ]
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    );
  }
  const getTooltipStyle = () => {
    if (!coords) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 151
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
        zIndex: 151
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
        zIndex: 151
      };
    } else if (spaceOnLeft > 340) {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 80,
        left: coords.left - 340,
        width: "320px",
        zIndex: 151
      };
    } else {
      return {
        position: "fixed",
        top: coords.top + coords.height + 20,
        left: coords.left + coords.width / 2 - 160,
        width: "320px",
        zIndex: 151
      };
    }
  };
  return renderPortal(
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[150] overflow-hidden pointer-events-none", children: [
      coords && /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed pointer-events-none transition-all duration-100 ease-out",
          style: {
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12,
            borderRadius: currentStep === 0 ? "8px" : "12px",
            boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)",
            zIndex: 150
          }
        }
      ),
      !coords && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/75 pointer-events-none z-[150]" }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          style: getTooltipStyle(),
          className: "bg-slate-900/95 dark:bg-slate-950/98 border border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-[115] animate-in fade-in duration-300",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: currentStep === 0 ? "Create Product" : "Product Guide" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-semibold text-indigo-400", children: [
                  "Step ",
                  currentStep + 1,
                  " of ",
                  isCategoryCreationPath ? 12 : 10
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              isCategoryCreationPath ? /* @__PURE__ */ jsxs(Fragment, { children: [
                currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Let's add your first product. Click on the highlighted ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Add Product" }),
                  " button to open the product creator form."
                ] }),
                currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Type a ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Product Name" }),
                  " here."
                ] }),
                currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Type a custom product code in the ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "SKU" }),
                  " box, or auto-generate one."
                ] }),
                currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "You don't have any categories yet! Click on the ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Category" }),
                  " selection box."
                ] }),
                currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Click ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "+ Create New Category" }),
                  " at the bottom of the dropdown list."
                ] }),
                currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Type a name for your new category (e.g. ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Beverages" }),
                  ") to create it inline."
                ] }),
                currentStep === 6 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Set your ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Cost Price" }),
                  "."
                ] }),
                currentStep === 7 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                    "Set your ",
                    /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Selling Price" }),
                    "."
                  ] }),
                  liveMargin ? /* @__PURE__ */ jsxs("div", { className: "p-2.5 rounded-xl bg-slate-800 border border-slate-700/50", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: "Live Profit Analysis" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-200 mt-0.5", children: [
                      "Margin: ",
                      /* @__PURE__ */ jsxs("span", { className: liveMargin.margin >= 30 ? "text-emerald-400" : "text-amber-400", children: [
                        liveMargin.margin,
                        "%"
                      ] })
                    ] })
                  ] }) : null
                ] }),
                currentStep === 8 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "In the ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Barcodes" }),
                  " section, you can add barcode tags if needed."
                ] }),
                currentStep === 9 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "The ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Reservations" }),
                  " tab tracks stock quantities currently held for unpaid invoices."
                ] }),
                currentStep === 10 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "The ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Extra" }),
                  " tab handles additional details like images and descriptions."
                ] }),
                currentStep === 11 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "All done! Click ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Save Changes" }),
                  " to create your product."
                ] })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Let's add your first product. Click on the highlighted ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Add Product" }),
                  " button to open the product creator form."
                ] }),
                currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Type a ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Product Name" }),
                  " here."
                ] }),
                currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Type a custom product code in the ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "SKU" }),
                  " box, or auto-generate one."
                ] }),
                currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Select a ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Category" }),
                  "."
                ] }),
                currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "Set your ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Cost Price" }),
                  "."
                ] }),
                currentStep === 5 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                    "Set your ",
                    /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Selling Price" }),
                    "."
                  ] }),
                  liveMargin ? /* @__PURE__ */ jsxs("div", { className: "p-2.5 rounded-xl bg-slate-800 border border-slate-700/50", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: "Live Profit Analysis" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-200 mt-0.5", children: [
                      "Margin: ",
                      /* @__PURE__ */ jsxs("span", { className: liveMargin.margin >= 30 ? "text-emerald-400" : "text-amber-400", children: [
                        liveMargin.margin,
                        "%"
                      ] })
                    ] })
                  ] }) : null
                ] }),
                currentStep === 6 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "In the ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Barcodes" }),
                  " section, you can add barcode tags if needed."
                ] }),
                currentStep === 7 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "The ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Reservations" }),
                  " tab tracks stock quantities currently held for unpaid invoices."
                ] }),
                currentStep === 8 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "The ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Extra" }),
                  " tab handles additional details like images and descriptions."
                ] }),
                currentStep === 9 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                  "All done! Click ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Save Changes" }),
                  " to create your product and finalize the setup tour."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
                currentStep > 0 ? /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      const reservationsStep = isCategoryCreationPath ? 9 : 7;
                      const extraStep = isCategoryCreationPath ? 10 : 8;
                      const saveStep = isCategoryCreationPath ? 11 : 9;
                      if (currentStep === reservationsStep) {
                        document.getElementById("tour-tab-details")?.click();
                      } else if (currentStep === extraStep) {
                        document.getElementById("tour-tab-reservations")?.click();
                      } else if (currentStep === saveStep) {
                        document.getElementById("tour-tab-extra")?.click();
                      }
                      setCurrentStep(currentStep - 1);
                    },
                    className: "px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                      /* @__PURE__ */ jsx("span", { children: "Back" })
                    ]
                  }
                ) : /* @__PURE__ */ jsx("div", {}),
                currentStep > 0 && currentStep < (isCategoryCreationPath ? 11 : 9) && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      const barcodeStep = isCategoryCreationPath ? 8 : 6;
                      const reservationsStep = isCategoryCreationPath ? 9 : 7;
                      const extraStep = isCategoryCreationPath ? 10 : 8;
                      if (currentStep === barcodeStep) {
                        document.getElementById("tour-tab-reservations")?.click();
                      } else if (currentStep === reservationsStep) {
                        document.getElementById("tour-tab-extra")?.click();
                      } else if (currentStep === extraStep) {
                        document.getElementById("tour-tab-details")?.click();
                      }
                      setCurrentStep(currentStep + 1);
                    },
                    className: "px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
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
    ] })
  );
}
function Inventory({ products: serverProducts, filters, stats, warehouses, categories, attributes }) {
  const { flash, store } = usePage().props;
  const [allProducts, setAllProducts] = useState(serverProducts.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(serverProducts.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  useEffect(() => {
    if (serverProducts.data && serverProducts.current_page === 1) {
      setAllProducts(serverProducts.data);
      setNextPageUrl(serverProducts.next_page_url);
    }
  }, [serverProducts]);
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, { headers: { "Accept": "application/json" } });
      const newItems = response.data.data;
      setAllProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setNextPageUrl(response.data.next_page_url);
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
  const [selectedProducts, setSelectedProducts] = useState([]);
  const params = new URLSearchParams(window.location.search);
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(params.get("category_id") || "all");
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: params.get("sort_by") || "name",
    direction: params.get("sort_dir") || "asc"
  });
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableColumns, setTableColumns] = useState([
    { key: "name", label: "Product Name", width: "25%" },
    { key: "sku", label: "SKU", width: "10%" },
    { key: "category", label: "Category", width: "15%" },
    { key: "available_stock", label: "Stock", width: "10%" },
    { key: "cost_price", label: "Cost", width: "10%" },
    { key: "price", label: "Price", width: "10%" },
    { key: "status", label: "Status", width: "10%" },
    { key: "actions", label: "Actions", width: "10%" }
  ]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeActionMenu && !e.target.closest(".action-menu-container")) {
        setActiveActionMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeActionMenu]);
  const applyFilters = (newParams) => {
    router.get(route("store.inventory.index", { store_slug: store?.slug }), {
      search: searchTerm,
      sort_by: sortConfig.key,
      sort_dir: sortConfig.direction,
      category_id: activeCategory,
      ...newParams
    }, { preserveState: true, preserveScroll: true });
  };
  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    applyFilters({ category_id: catId });
  };
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
    applyFilters({ sort_by: key, sort_dir: direction });
  };
  const handleServerSearch = (e) => {
    if (e.key === "Enter") {
      applyFilters({ search: searchTerm });
    }
  };
  const sortedProducts = allProducts;
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedProducts(sortedProducts.map((c) => c.id));
    else setSelectedProducts([]);
  };
  const handleSelectRow = (id) => {
    if (selectedProducts.includes(id)) setSelectedProducts(selectedProducts.filter((i) => i !== id));
    else setSelectedProducts([...selectedProducts, id]);
  };
  const handleDragStart = (e, index) => setDraggedColumn(index);
  const handleDragOver = (e, index) => e.preventDefault();
  const handleDrop = (e, dropIndex) => {
    if (draggedColumn === null) return;
    const newCols = [...tableColumns];
    const draggedItem = newCols[draggedColumn];
    newCols.splice(draggedColumn, 1);
    newCols.splice(dropIndex, 0, draggedItem);
    setTableColumns(newCols);
    setDraggedColumn(null);
  };
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setModalMode("create");
    setIsModalOpen(true);
  };
  const handleEditProduct = (product, e) => {
    if (e) e.stopPropagation();
    setSelectedProduct(product);
    setModalMode("edit");
    setIsModalOpen(true);
    setActiveActionMenu(null);
  };
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setModalMode("view");
    setIsModalOpen(true);
    setActiveActionMenu(null);
  };
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const handleDeleteProduct = (product) => {
    setPendingDeleteAction("single");
    setPendingDeleteId(product.id);
    setIsPasscodeModalOpen(true);
    setActiveActionMenu(null);
  };
  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    setPendingDeleteAction("bulk");
    setIsPasscodeModalOpen(true);
  };
  const executeDelete = () => {
    if (pendingDeleteAction === "single" && pendingDeleteId) {
      router.delete(route("store.inventory.destroy", { store_slug: store?.slug, id: pendingDeleteId }), {
        onSuccess: () => {
          window.dispatchEvent(new CustomEvent("amd:product-updated"));
          localStorage.setItem("amd_product_latest_change", Date.now().toString());
          const remaining = allProducts.filter((p) => p.id !== pendingDeleteId);
          setAllProducts(remaining);
          setPendingDeleteId(null);
          setPendingDeleteAction(null);
        }
      });
    } else if (pendingDeleteAction === "bulk" && selectedProducts.length > 0) {
      router.post(route("store.inventory.bulk-destroy", { store_slug: store?.slug }), { ids: selectedProducts }, {
        onSuccess: () => {
          window.dispatchEvent(new CustomEvent("amd:product-updated"));
          localStorage.setItem("amd_product_latest_change", Date.now().toString());
          setSelectedProducts([]);
          const remaining = allProducts.filter((p) => !selectedProducts.includes(p.id));
          setAllProducts(remaining);
          setPendingDeleteAction(null);
        }
      });
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Inventory Management", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Inventory" }),
    /* @__PURE__ */ jsx(
      PasscodeModal,
      {
        isOpen: isPasscodeModalOpen,
        onClose: () => {
          setIsPasscodeModalOpen(false);
          setPendingDeleteAction(null);
          setPendingDeleteId(null);
        },
        onSuccess: (code) => {
          setIsPasscodeModalOpen(false);
          executeDelete();
        },
        actionName: pendingDeleteAction === "bulk" ? `delete ${selectedProducts.length} selected products` : "delete this product"
      }
    ),
    isModalOpen && /* @__PURE__ */ jsx(
      ProductModal,
      {
        isOpen: isModalOpen,
        product: selectedProduct,
        mode: modalMode,
        warehouses,
        categories,
        attributes,
        onClose: () => {
          setSelectedProduct(null);
          setModalMode("view");
          setIsModalOpen(false);
        }
      }
    ),
    /* @__PURE__ */ jsx(ProductTourGuide, { isModalOpen, store, categories }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-y-auto md:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "products" }),
      /* @__PURE__ */ jsxs("div", { className: "flex md:hidden items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `transition-transform duration-200 ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs font-extrabold", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-indigo-600", children: [
            stats?.total_products?.toLocaleString() || 0,
            " Products"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-amber-600", children: [
            stats?.low_stock_count?.toLocaleString() || 0,
            " Low"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Package, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Products" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats?.total_products?.toLocaleString() || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Low Stock" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-amber-600", children: stats?.low_stock_count?.toLocaleString() || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between col-span-2 md:col-span-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(DollarSign, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Inventory Value" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: formatCurrency(stats?.inventory_value || 0, store) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-white dark:bg-slate-900 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar select-none",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-2 shrink-0", children: [
              /* @__PURE__ */ jsx(Layers, { size: 14, className: "text-slate-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 uppercase mr-2", children: "Categories:" })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleCategoryChange("all"),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeCategory === "all" ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`,
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
                className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${String(activeCategory) === String(cat.id) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"}`,
                children: /* @__PURE__ */ jsx("span", { children: cat.name })
              },
              cat.id
            ))
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "md:hidden flex flex-col gap-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight", children: [
            "Product ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Inventory" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowMobileSearch(!showMobileSearch),
                className: `p-2 rounded-lg transition-colors ${showMobileSearch ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
                title: "Search",
                children: /* @__PURE__ */ jsx(Search, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.admin.data", { store_slug: store?.slug }),
                className: "p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg transition-colors",
                title: "Import/Export",
                children: /* @__PURE__ */ jsx(Upload, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                id: "tour-add-product",
                onClick: handleAddProduct,
                className: "ml-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 font-bold text-xs",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  " Add"
                ]
              }
            )
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsx("div", { className: "px-3 pb-2 border-t border-slate-100 dark:border-slate-800 pt-2 animate-in slide-in-from-top duration-200", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full flex gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                autoFocus: true,
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                onKeyDown: handleServerSearch,
                placeholder: "Search products...",
                className: "w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 14 })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                applyFilters({ search: searchTerm });
                setShowMobileSearch(false);
              },
              className: "px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold",
              children: "Go"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Product ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Inventory" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1", children: "List View" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-64 relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                onKeyDown: handleServerSearch,
                placeholder: "Search products...",
                className: "w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 16 }),
            searchTerm && /* @__PURE__ */ jsx("button", { onClick: () => {
              setSearchTerm("");
              applyFilters({ search: "" });
            }, className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => applyFilters({ search: searchTerm }), className: "px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shadow-indigo-500/20", children: "Search" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: [
            /* @__PURE__ */ jsx(Link, { href: route("store.admin.data", { store_slug: store?.slug }), className: "p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(Upload, { size: 16 }) }),
            /* @__PURE__ */ jsxs("button", { id: "tour-add-product", onClick: handleAddProduct, className: "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shadow-indigo-500/20", children: [
              /* @__PURE__ */ jsx(Plus, { size: 14 }),
              " Add Product"
            ] })
          ] })
        ] })
      ] }),
      selectedProducts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm", children: [
          selectedProducts.length,
          " Selected"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("button", { onClick: handleBulkDelete, className: "px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Trash2, { size: 14 }),
            " Delete Selected"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setSelectedProducts([]), className: "p-1 hover:bg-indigo-700 rounded transition-colors", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-1 flex-col overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
            /* @__PURE__ */ jsx("th", { className: "p-4 w-10", children: /* @__PURE__ */ jsx("input", { type: "checkbox", className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-600", checked: selectedProducts.length === sortedProducts.length && sortedProducts.length > 0, onChange: handleSelectAll }) }),
            tableColumns.map((col, index) => /* @__PURE__ */ jsx(
              "th",
              {
                draggable: true,
                onDragStart: (e) => handleDragStart(e, index),
                onDragOver: (e) => handleDragOver(e),
                onDrop: (e) => handleDrop(e, index),
                onClick: () => col.key !== "actions" && handleSort(col.key),
                className: `p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${draggedColumn === index ? "opacity-50 border-2 border-dashed border-indigo-500" : ""}`,
                style: { width: col.width },
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  col.label,
                  col.key !== "actions" && sortConfig.key === col.key && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" }))
                ] })
              },
              col.key
            ))
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sortedProducts.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length + 1, className: "p-12 text-center text-slate-500", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Package, { size: 32, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300", children: "No products found" })
          ] }) }) }) : sortedProducts.map((row) => /* @__PURE__ */ jsxs("tr", { className: `hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer ${selectedProducts.includes(row.id) ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`, onClick: () => handleViewProduct(row), children: [
            /* @__PURE__ */ jsx("td", { className: "p-4 w-10", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx("input", { type: "checkbox", className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-600", checked: selectedProducts.includes(row.id), onChange: () => handleSelectRow(row.id) }) }),
            tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: (() => {
              switch (col.key) {
                case "name":
                  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700", children: row.image ? /* @__PURE__ */ jsx("img", { src: row.image, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Package, { size: 14, className: "text-indigo-600 dark:text-indigo-400" }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: row.name }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: row.unit || "pcs" })
                    ] })
                  ] });
                case "sku":
                  return row.sku || "-";
                case "category":
                  return /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-semibold", children: row.category });
                case "available_stock":
                  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                    /* @__PURE__ */ jsx("span", { className: `font-bold ${row.available_stock < (row.min_stock_alert || 5) ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`, children: row.available_stock }),
                    row.reserved_stock > 0 && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-amber-500", children: [
                      row.reserved_stock,
                      " Rsrvd"
                    ] })
                  ] });
                case "cost_price":
                  return formatCurrency(row.cost_price || 0, store);
                case "price":
                  return /* @__PURE__ */ jsx("span", { className: "font-bold", children: formatCurrency(row.price || 0, store) });
                case "status":
                  return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-[10px] font-bold border ${row.status === "In Stock" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : ""} ${row.status === "Low Stock" ? "bg-amber-50 text-amber-600 border-amber-200" : ""} ${row.status === "Out of Stock" ? "bg-red-50 text-red-600 border-red-200" : ""}`, children: row.status });
                case "actions":
                  return /* @__PURE__ */ jsxs("div", { className: "relative action-menu-container", children: [
                    /* @__PURE__ */ jsx("button", { onClick: (e) => {
                      e.stopPropagation();
                      setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                    }, className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors", children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }),
                    activeActionMenu === row.id && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 animate-in zoom-in-95 p-1", children: [
                      /* @__PURE__ */ jsxs(Link, { href: route("store.products.variants.index", { store_slug: store?.slug, product: row.id }), className: "w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                        /* @__PURE__ */ jsx(Layers, { size: 14 }),
                        " Variants"
                      ] }),
                      /* @__PURE__ */ jsxs("button", { onClick: (e) => handleEditProduct(row, e), className: "w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                        /* @__PURE__ */ jsx(Edit, { size: 14 }),
                        " Edit Details"
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
                      /* @__PURE__ */ jsxs("button", { onClick: () => {
                        setActiveActionMenu(null);
                        handleDeleteProduct(row);
                      }, className: "w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-sm text-red-600", children: [
                        /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                        " Delete"
                      ] })
                    ] })
                  ] });
                default:
                  return row[col.key];
              }
            })() }, `${row.id}-${col.key}`))
          ] }, row.id)) })
        ] }),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "p-4 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 opacity-0", children: nextPageUrl ? "Loading..." : sortedProducts.length > 0 ? "End of list" : "" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:hidden flex flex-col gap-2 pb-20", children: [
        sortedProducts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(Package, { size: 32, className: "mx-auto text-slate-400 mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: "No products found" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Try adjusting your search or add a new product." })
        ] }) : sortedProducts.map((row) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors",
            onClick: () => handleViewProduct(row),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0", children: row.image ? /* @__PURE__ */ jsx("img", { src: row.image, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Package, { size: 18, className: "text-indigo-600 dark:text-indigo-400" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-extrabold text-slate-800 dark:text-white text-sm leading-tight", children: row.name }),
                    /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400 font-semibold mt-0.5", children: [
                      row.unit || "pcs",
                      row.sku ? ` • ${row.sku}` : ""
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0 ${row.status === "In Stock" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : row.status === "Low Stock" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-red-50 text-red-600 border-red-200"}`, children: row.status })
              ] }),
              row.category && /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/50", children: row.category }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 font-bold uppercase block tracking-wider", children: "Stock" }),
                    /* @__PURE__ */ jsx("span", { className: `text-xs font-black tabular-nums ${row.available_stock < (row.min_stock_alert || 5) ? "text-red-500" : "text-slate-800 dark:text-white"}`, children: row.available_stock })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 font-bold uppercase block tracking-wider", children: "Price" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-indigo-600 dark:text-indigo-400 tabular-nums", children: formatCurrency(row.price || 0, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 font-bold uppercase block tracking-wider", children: "Cost" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-600 dark:text-slate-400 tabular-nums", children: formatCurrency(row.cost_price || 0, store) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsx("button", { onClick: (e) => handleEditProduct(row, e), className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors", title: "Edit", children: /* @__PURE__ */ jsx(Edit, { size: 16 }) }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteProduct(row), className: "p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-slate-400 hover:text-rose-600 transition-colors", title: "Delete", children: /* @__PURE__ */ jsx(Trash2, { size: 16 }) })
                ] })
              ] })
            ]
          },
          row.id
        )),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "py-4 text-center text-slate-400 text-sm", children: nextPageUrl ? "Loading more..." : "" })
      ] })
    ] })
  ] });
}
export {
  Inventory as default
};

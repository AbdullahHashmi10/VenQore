import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { router, usePage } from "@inertiajs/react";
import { Trophy, Sparkles, ArrowLeft, ArrowRight, Coins, Wallet, CheckCircle2, Printer, Trash2, TrendingUp, X, Plus } from "lucide-react";
import { s as shouldStopNegativeStock } from "./settings-DUqQ1JdE.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useAlert, f as useWorkspace } from "../ssr.js";
import { P as PrintService } from "./PrintService-L_d7O0gK.js";
import axios from "axios";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { b as availableOf, d as documentType, S as Sheet, j as Scrim, F as Field, V as VqSelect } from "./useDocumentChrome-DON8WQ-L.js";
import { u as uid, t as today, b as blankLine, M as MoneyDocument } from "./MoneyDocument-DTHxEW3W.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "react-dom/client";
import "./PrintPreview-CmXEPl-w.js";
import "qrcode.react";
import "./runtime-DwSFgQZq.js";
import "./AsyncProductCombobox-BMa0miLw.js";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "./OneGlanceLayout-D0x15wPs.js";
import "./plans-CxabWI_P.js";
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
import "./AsyncPartyCombobox-C_xHT5vA.js";
import "./ProductModal-DTGv60aX.js";
import "./PremiumButton-BUDyjGi2.js";
import "./PremiumSelect-BaeCSgsA.js";
import "./QuickPartyModal-BjRmNiLb.js";
function InvoiceTourGuide({ store }) {
  const tt = useTermText();
  const [hasCustomers, setHasCustomers] = useState(true);
  const [isCustomerCreationPath, setIsCustomerCreationPath] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const isVisible = store?.onboarding_step === "invoice_tour" || store?.onboarding_step === "invoice_congratulations";
  useEffect(() => {
    if (isVisible) {
      axios.get(route("store.parties.search", { store_slug: store?.slug }), { params: { query: "", type: "customer" } }).then((res) => {
        const list = res.data || [];
        const empty = list.length === 0;
        setHasCustomers(!empty);
        if (isCustomerCreationPath === null) {
          setIsCustomerCreationPath(empty);
        }
      }).catch((err) => console.error("Failed to search customers:", err));
    }
  }, [isVisible, store?.slug]);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const getTargetId = (step) => {
    if (isCustomerCreationPath) {
      switch (step) {
        case 0:
          return "tour-invoice-customer";
        case 1:
          return "tour-add-new-party-btn";
        case 2:
          return "tour-party-name";
        case 3:
          return "tour-party-phone";
        case 4:
          return "tour-party-address";
        case 5:
          return "tour-party-submit";
        case 6:
          return "tour-invoice-product";
        case 7:
          return "tour-invoice-paid";
        case 8:
          return "tour-invoice-complete";
        case 9:
          return "tour-new-transaction";
        default:
          return null;
      }
    } else {
      switch (step) {
        case 0:
          return "tour-invoice-customer";
        case 1:
          return "tour-invoice-product";
        case 2:
          return "tour-invoice-paid";
        case 3:
          return "tour-invoice-complete";
        case 4:
          return "tour-new-transaction";
        default:
          return null;
      }
    }
  };
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      const activeId = document.activeElement?.id;
      if (isCustomerCreationPath) {
        if (currentStep === 0) {
          if (document.getElementById("tour-add-new-party-btn")) setCurrentStep(1);
        } else if (currentStep === 1) {
          if (document.getElementById("tour-party-name")) setCurrentStep(2);
        } else if (currentStep === 2) {
          if (activeId === "tour-party-phone") setCurrentStep(3);
        } else if (currentStep === 3) {
          if (activeId === "tour-party-address") setCurrentStep(4);
        } else if (currentStep === 4) {
          if (activeId === "tour-party-submit") setCurrentStep(5);
        } else if (currentStep === 5) {
          if (!document.getElementById("tour-party-name")) setCurrentStep(6);
        } else if (currentStep === 8) {
          if (document.getElementById("tour-new-transaction")) setCurrentStep(9);
        }
      } else {
        if (currentStep === 3) {
          if (document.getElementById("tour-new-transaction")) setCurrentStep(4);
        }
      }
    }, 150);
    return () => clearInterval(interval);
  }, [currentStep, isVisible, isCustomerCreationPath]);
  useEffect(() => {
    if (!isVisible || store?.onboarding_step === "invoice_congratulations") {
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
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timer = setTimeout(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    const interval = setInterval(updateCoords, 80);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [currentStep, isVisible, store?.onboarding_step, isCustomerCreationPath]);
  const handleStartPosTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "pos_tour_start" },
      {
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  const handleStartExpenseTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "expense_tour_start" },
      {
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  const handleSkipSetup = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "completed" },
      {
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  if (!isVisible) return null;
  if (store?.onboarding_step === "invoice_congratulations") {
    const doneSteps = store?.onboarding_steps_done || [];
    const isPosDone = doneSteps.includes("pos");
    return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-drawer flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in" }),
      /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-drawer animate-in zoom-in-95 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-glow mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Trophy, { className: "text-white w-8 h-8" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-white tracking-tight mb-3", children: "Invoice Generated! 🧾🎉" }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-semibold mb-2", children: "Your B2B sale invoice has been successfully created!" }),
          /* @__PURE__ */ jsxs("p", { className: "text-neutral-300 text-sm leading-relaxed max-w-sm mb-6", children: [
            "Amazing! You've recorded a wholesale transaction and created a detailed invoice.",
            isPosDone ? " Both sales routes are complete. Let's record store expenses next to track your cash flow!" : " Let's check out our fast-speed Retail POS Register next, or proceed to record expenses!"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2.5 w-full", children: [
            !isPosDone && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleStartPosTour,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-brand text-white font-bold rounded-xl shadow-md transition-all duration-normal active:scale-[0.99] cursor-pointer text-sm",
                children: /* @__PURE__ */ jsx("span", { children: "Try POS Register" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleStartExpenseTour,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all duration-normal active:scale-[0.99] cursor-pointer text-sm",
                children: /* @__PURE__ */ jsx("span", { children: "Record Expenses" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSkipSetup,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-neutral-800 hover:bg-interactive-hover text-neutral-300 hover:text-white font-bold rounded-xl border border-neutral-700/60 transition-all duration-normal active:scale-[0.99] cursor-pointer text-xs mt-1",
                children: /* @__PURE__ */ jsx("span", { children: "Skip & Finish Setup" })
              }
            )
          ] })
        ] })
      ] }) })
    ] });
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
    coords && /* @__PURE__ */ jsx(
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
    !coords && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/75 pointer-events-none z-drawer" }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: getTooltipStyle(),
        className: "bg-neutral-900/95 dark:bg-app border border-brand-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-drawer animate-in fade-in duration-slow",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-brand-500/10 rounded-lg text-brand-400 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "B2B Invoice Tour" }),
              /* @__PURE__ */ jsxs("span", { className: "text-2xs font-semibold text-brand-400", children: [
                "Step ",
                currentStep + 1,
                " of ",
                isCustomerCreationPath ? 10 : 5
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            isCustomerCreationPath ? /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                tt("You don't have any customers yet!"),
                " Click on the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Search Party" }),
                " input."
              ] }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Now click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "+ Create New Party" }),
                " at the bottom of the dropdown."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                tt("Put in the customer's"),
                " ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Name" }),
                " inside the modal."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Put in their ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Phone Number" }),
                "."
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Put in their ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Address" }),
                "."
              ] }),
              currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Create Customer") }),
                " ",
                tt("to save the customer.")
              ] }),
              currentStep === 6 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Great! Now move toward the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Search Product") }),
                " ",
                tt("option and select the previously created product.")
              ] }),
              currentStep === 7 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Enter the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Amount Paid" }),
                " ",
                tt("by the customer (leave as 0 if on credit).")
              ] }),
              currentStep === 8 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Complete Sale" }),
                " to generate the B2B invoice."
              ] }),
              currentStep === 9 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "NEW TRANSACTION" }),
                " to continue your setup."
              ] })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Select a ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Customer") }),
                " for the invoice."
              ] }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Search and select a ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Product") }),
                " to add to the invoice list."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Enter the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Amount Paid" }),
                " ",
                tt("by the customer (leave as 0 if on credit).")
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Complete Sale" }),
                " to generate the B2B invoice and update stock!"
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "NEW TRANSACTION" }),
                " to continue your setup."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
              currentStep > 0 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep - 1),
                  className: "px-3 py-1.5 bg-neutral-800 text-ink-muted hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                    /* @__PURE__ */ jsx("span", { children: "Back" })
                  ]
                }
              ) : /* @__PURE__ */ jsx("div", {}),
              currentStep < (isCustomerCreationPath ? 9 : 4) && /* @__PURE__ */ jsxs(
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
const DOC = documentType("sales-invoice");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const LS = {
  delivery: "amd_default_delivery",
  extraLabel: "amd_default_extra_label",
  extraValue: "amd_default_extra_value",
  multi: "amd_enable_multiple_extras",
  showDelivery: "amd_show_delivery",
  showExtra: "amd_show_extra"
};
const lsRaw = (k) => {
  try {
    return localStorage.getItem(k);
  } catch (_) {
    return null;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, String(v));
  } catch (_) {
  }
};
const lsBool = (k, f) => {
  const v = lsRaw(k);
  return v === null ? f : v === "1" || v === "true";
};
const lsNum = (k, f) => {
  const n = parseFloat(lsRaw(k));
  return Number.isFinite(n) ? n : f;
};
const lsText = (k, f) => {
  const v = lsRaw(k);
  return v === null || v === "" ? f : v;
};
const lsJson = (k, f) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? f : JSON.parse(v);
  } catch (_) {
    return f;
  }
};
function CreateInvoice({ sale, aiPrefill }) {
  const { store, settings } = usePage().props;
  const { showAlert } = useAlert();
  const isEdit = !!sale?.id;
  const ws = useWorkspace();
  const money = (n) => formatCurrency(n, store || settings);
  const saveRef = useRef(null);
  const idemRef = useRef({});
  const savedIds = useRef({});
  const aiApplied = useRef(false);
  const [overpayment, setOverpayment] = useState(null);
  const [done, setDone] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [marginOpen, setMarginOpen] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);
  const applyDefaults = () => lsJson("vqdoc_sales-invoice_defaults", false);
  const [showDelivery, setShowDelivery] = useState(() => lsBool(LS.showDelivery, true));
  const [showExtra, setShowExtra] = useState(() => lsBool(LS.showExtra, true));
  const [multiExtras, setMultiExtras] = useState(() => lsBool(LS.multi, false));
  const [defDelivery, setDefDelivery] = useState(() => lsNum(LS.delivery, 0));
  const [defExtraLabel, setDefExtraLabel] = useState(() => lsText(LS.extraLabel, "Extra"));
  const [defExtraValue, setDefExtraValue] = useState(() => lsNum(LS.extraValue, 0));
  useEffect(() => {
    lsSet(LS.showDelivery, showDelivery ? "1" : "0");
  }, [showDelivery]);
  useEffect(() => {
    lsSet(LS.showExtra, showExtra ? "1" : "0");
  }, [showExtra]);
  useEffect(() => {
    lsSet(LS.multi, multiExtras ? "1" : "0");
  }, [multiExtras]);
  useEffect(() => {
    lsSet(LS.delivery, defDelivery);
  }, [defDelivery]);
  useEffect(() => {
    lsSet(LS.extraLabel, defExtraLabel);
  }, [defExtraLabel]);
  useEffect(() => {
    lsSet(LS.extraValue, defExtraValue);
  }, [defExtraValue]);
  const out = (inv) => inv ? { ...inv, party: inv.customer || null } : inv;
  const into = (p) => {
    if (!p || !("party" in p)) return p;
    const { party, ...rest } = p;
    return { ...rest, customer: party };
  };
  const list = useMemo(() => (ws.activeInvoices || []).map(out), [ws.activeInvoices]);
  const activeId = ws.currentInvoiceId;
  const drafts = useMemo(() => ({
    list,
    current: list.find((x) => x.id === activeId) || list[0],
    activeId: activeId || list[0]?.id,
    setActiveId: ws.setCurrentInvoiceId,
    patch: (p) => ws.updateInvoice(activeId || list[0]?.id, into(p)),
    add: (initial) => ws.addInvoice({
      ...into(initial || {}),
      delivery_charge: applyDefaults() && showDelivery ? num(defDelivery) : 0,
      extra_charge_value: applyDefaults() && showExtra ? num(defExtraValue) : 0,
      extra_charge_label: defExtraLabel
    }),
    close: (id) => ws.removeInvoice(id),
    replace: () => {
    },
    live: true
  }), [list, activeId, ws, showDelivery, showExtra, defDelivery, defExtraValue, defExtraLabel]);
  const current = drafts.current;
  useEffect(() => {
    if (isEdit || current) return;
    ws.addInvoice({
      tax: num(settings?.default_tax_rate),
      paymentMethod: settings?.cash_sale_default === "1" ? "cash" : "credit",
      delivery_charge: applyDefaults() && showDelivery ? num(defDelivery) : 0,
      extra_charge_value: applyDefaults() && showExtra ? num(defExtraValue) : 0,
      extra_charge_label: defExtraLabel
    });
  }, [isEdit, current]);
  const wasMulti = useRef(null);
  useEffect(() => {
    if (wasMulti.current === multiExtras) return;
    wasMulti.current = multiExtras;
    (ws.activeInvoices || []).forEach((inv) => {
      const fields = inv.extraFields || [];
      if (multiExtras) {
        if (!fields.length && num(inv.extra_charge_value) > 0) {
          ws.updateInvoice(inv.id, {
            extraFields: [{ id: uid(), label: inv.extra_charge_label || "Extra", value: num(inv.extra_charge_value) }]
          });
        }
      } else if (fields.length) {
        ws.updateInvoice(inv.id, {
          extraFields: [],
          extra_charge_value: fields.reduce((s, f) => s + num(f.value), 0),
          extra_charge_label: fields[0]?.label || inv.extra_charge_label || "Extra"
        });
      }
    });
  }, [multiExtras, ws.activeInvoices?.length]);
  const editSeed = useCallback(() => ({
    id: sale.id,
    party: sale.customer || null,
    reference: sale.reference_number || "",
    /* `posted_at`, not `date` — there is no `date` column on a sale, so
       reading one always came back empty and every re-saved invoice was
       silently re-dated to today. */
    date: (sale.posted_at || sale.created_at || "").slice(0, 10) || today(),
    dueDate: (sale.due_date || "").slice(0, 10) || "",
    terms: "net30",
    notes: sale.notes || "",
    /* The RATE, worked back from what was charged: `sales` stores the tax
       AMOUNT and the revenue it was charged on, not the percentage. Reading
       `sale.tax` here meant an invoice with Rs 180 of tax reopened showing
       a rate of 180%; reading `sale.tax_rate` meant every invoice reopened
       at 0% and asked to be re-saved without its tax. */
    tax: (() => {
      const net = num(sale.net_sales);
      const charged = num(sale.total_tax ?? sale.tax);
      return net > 0 ? Math.round(charged / net * 1e4) / 100 : 0;
    })(),
    discount: num(sale.global_discount ?? sale.discount),
    delivery_charge: num(sale.delivery_charge),
    extra_charge_value: num(sale.extra_charge_value),
    /* Several charges are stored as a JSON array in the label column, so
       reading it as a name put `[{"label":"Packing"…}]` on the screen where
       the charge's name should be. */
    ...(() => {
      const raw = sale.extra_charge_label || "";
      if (raw.trim().startsWith("[")) {
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            return {
              extraFields: arr.map((f) => ({ id: uid(), label: f.label || "Charge", value: num(f.value) })),
              extra_charge_label: ""
            };
          }
        } catch (_) {
        }
      }
      return { extra_charge_label: raw };
    })(),
    /* The column exists and is what the sale was actually settled by. */
    paymentMethod: sale.payment_method || "cash",
    amountPaid: (sale.payments || []).reduce((s, p) => s + num(p.amount), 0),
    originalPaid: (sale.payments || []).reduce((s, p) => s + num(p.amount), 0),
    originalTotal: num(sale.total),
    overpaymentAction: sale.overpayment_action || null,
    status: sale.status,
    items: (sale.items || []).map((i) => ({
      id: uid(),
      product: i.product || { id: i.product_id, name: i.name || "Item" },
      variant: i.variant_id ? { id: i.variant_id } : null,
      quantity: num(i.quantity),
      /* Carried, so the stock check knows the units this invoice already
         owns and does not refuse a change that frees some of them. */
      originalQuantity: num(i.quantity),
      freeQuantity: num(i.free_quantity),
      price: num(i.unit_price ?? i.price),
      cost: num(i.product?.cost ?? i.product?.cost_price),
      discount: num(i.discount_amount ?? i.discount),
      discountType: "fixed",
      /* The rate this LINE was charged at, which on a bill of mixed rates
         is not the bill's average. Without it a two-line invoice — one
         product taxed, one not — reopened with the average applied to
         both and showed a total that had never been charged. */
      tax_rate: i.tax_rate === null || i.tax_rate === void 0 ? null : num(i.tax_rate),
      available_stock: availableOf(i.product)
    }))
  }), [sale]);
  useEffect(() => {
    if (isEdit || aiApplied.current || !aiPrefill || !current) return;
    aiApplied.current = true;
    const lines = (aiPrefill.items || []).filter((l) => l.product).map((l) => ({
      ...blankLine(),
      product: l.product,
      quantity: num(l.quantity) || 1,
      price: num(l.price),
      cost: num(l.product?.cost ?? l.product?.cost_price),
      available_stock: availableOf(l.product)
    }));
    drafts.patch({
      party: aiPrefill.party || null,
      notes: aiPrefill.notes || "",
      paymentMethod: aiPrefill.payment_method === "credit" ? "credit" : "cash",
      ...aiPrefill.date ? { date: aiPrefill.date } : {},
      items: lines.length ? [...lines, blankLine()] : [blankLine()]
    });
    setAiNotice(`${lines.length} line${lines.length === 1 ? "" : "s"} read from the scan. Check every one before you save.`);
  }, [isEdit, aiPrefill, current]);
  const printSale = async (saleId) => {
    setPrinting(true);
    try {
      const res = await window.axios.get(route("store.sales.show", { store_slug: store?.slug, sale: saleId }), {
        headers: { Accept: "application/json" }
      });
      PrintService.quickPrint(res.data?.sale || res.data, null, settings);
    } catch (_) {
      showAlert({ title: "Could not fetch the invoice", message: "The sale is saved — open it from the list to print it.", type: "warning" });
    } finally {
      setPrinting(false);
    }
  };
  if (!isEdit && !current) {
    return /* @__PURE__ */ jsx("div", { style: { padding: "var(--d-s6, 24px)", color: "var(--vq-text-3)" }, children: "Opening a new sale…" });
  }
  const posted = isEdit ? sale?.status === "posted" : current?.status === "completed";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      MoneyDocument,
      {
        doc: DOC,
        drafts: isEdit ? void 0 : drafts,
        seed: () => ({ id: uid(), party: null, items: [blankLine()], date: today() }),
        editSeed,
        isEdit,
        locked: posted,
        lockNote: isEdit ? "This sale is posted. Its stock and its ledger entries are made, so it cannot be changed — raise a sale return or a credit note instead." : "This sale is saved. Print it, or start another one.",
        saveRef,
        closeOnSave: false,
        transport: "axios",
        saveLabel: isEdit ? "Update the sale" : "Complete the sale",
        settleDefault: (d, totals) => settings?.pos_auto_fill_cash === "1" && d.paymentMethod === "cash" ? totals.grandTotal : 0,
        chargeVisible: { delivery: showDelivery, extra: showExtra && !multiExtras },
        notice: aiNotice ? /* @__PURE__ */ jsxs("div", { className: "vqdoc-note", "data-tone": "warn", children: [
          /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "Read from a scan" }),
          /* @__PURE__ */ jsx("span", { children: aiNotice })
        ] }) : null,
        url: ({ d }) => isEdit ? route("store.sales.update", { store_slug: store?.slug, sale: d.id }) : route("store.sales.store", { store_slug: store?.slug }),
        validate: ({ d, items }) => {
          if (shouldStopNegativeStock(settings)) {
            for (const i of items.filter((x) => x.product)) {
              const going = num(i.quantity) + num(i.freeQuantity);
              const have = availableOf(i.product, i.available_stock) + num(i.originalQuantity);
              if (going > have) {
                return { items: `Only ${have} of ${i.product.name} can be sold — this line needs ${going}. Turn on "Allow overselling" in settings to go past it.` };
              }
            }
          }
          if (d.paymentMethod === "credit" && !d.party?.id) {
            return { party: "A sale on account has to be on somebody’s account — choose a customer." };
          }
          return null;
        },
        beforeSave: ({ d, totals, opts }) => {
          if (opts.addToLedger !== void 0) return true;
          const excess = num(d.amountPaid) - totals.grandTotal;
          if (excess <= 5e-3) return true;
          if (isEdit && d.overpaymentAction) {
            saveRef.current?.({ ...opts, addToLedger: d.overpaymentAction === "ledger" });
            return false;
          }
          if (isEdit && num(d.originalPaid) > num(d.originalTotal) + 1) {
            saveRef.current?.({ ...opts, addToLedger: false });
            return false;
          }
          setOverpayment({ amount: excess, name: d.party?.name || "the customer", print: !!opts.print });
          return false;
        },
        buildPayload: ({ d, opts }) => {
          if (!idemRef.current[d.id]) idemRef.current[d.id] = uid();
          return {
            customer_id: d.party?.id || null,
            payment_method: d.paymentMethod,
            notes: d.notes || null,
            reference: d.reference || null,
            date: d.date,
            due_date: d.dueDate || null,
            add_to_ledger: !!opts.addToLedger,
            payment_account_id: d.paymentAccountId || null,
            bank_account_id: d.bankReferenceId || null,
            cheque_date: d.isCheque ? d.chequeDate || null : null,
            payment_reference: d.paymentReference || null,
            source: "manual",
            ...isEdit ? {} : { idempotency_key: idemRef.current[d.id] }
          };
        },
        onSaved: (res, d, opts) => {
          localStorage.setItem("amd_product_latest_change", String(Date.now()));
          const savedId = isEdit ? d.id : res?.data?.sale_id;
          if (savedId) savedIds.current[d.id] = savedId;
          delete idemRef.current[d.id];
          if (isEdit) {
            if (opts?.print && savedId) printSale(savedId);
            else router.visit(route("store.sales.index", { store_slug: store?.slug }));
            return;
          }
          drafts.patch({ status: "completed" });
          if (opts?.print && savedId) printSale(savedId);
          if (store?.onboarding_step === "invoice_tour") {
            router.post(
              route("store.onboarding.step", { store_slug: store?.slug }),
              { step: "invoice_congratulations" },
              { preserveScroll: true }
            );
            return;
          }
          setDone({ id: savedId, total: res?.data?.total });
        },
        header: ({ d, patch, chrome, acct, setSettleMode }) => /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Field, { label: "Settlement", span: 4, children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-seg", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "data-tone": "cash",
                "aria-pressed": d.paymentMethod === "cash",
                onClick: () => setSettleMode("cash"),
                children: "Paid now"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "data-tone": "credit",
                "aria-pressed": d.paymentMethod === "credit",
                onClick: () => setSettleMode("credit"),
                children: "On account"
              }
            )
          ] }) }),
          chrome.field("account") && /* @__PURE__ */ jsx(Field, { label: "Money goes to", span: 4, children: /* @__PURE__ */ jsx(
            VqSelect,
            {
              ariaLabel: "Which account this is banked into",
              value: d.paymentAccountKey ?? acct.defaultKey ?? "",
              onChange: (v) => {
                const p = acct.resolve(v);
                if (!p) return;
                patch(p.isCheque && !d.chequeDate ? { ...p, chequeDate: today() } : p);
              },
              options: acct.options
            }
          ) }),
          d.isCheque && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Field, { label: "Cheque no.", span: 2, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "vqdoc-in",
                value: d.paymentReference || "",
                onChange: (e) => patch({ paymentReference: e.target.value })
              }
            ) }),
            /* @__PURE__ */ jsx(Field, { label: "Cheque date", span: 2, children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                className: "vqdoc-in",
                value: d.chequeDate || today(),
                onChange: (e) => patch({ chequeDate: e.target.value })
              }
            ) })
          ] }),
          chrome.field("date") && /* @__PURE__ */ jsx(Field, { label: "Date", span: 3, children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              className: "vqdoc-in",
              value: d.date || today(),
              max: isEdit ? void 0 : today(),
              onChange: (e) => patch({ date: e.target.value })
            }
          ) }),
          chrome.field("terms") && /* @__PURE__ */ jsx(Field, { label: "Payment terms", span: 3, children: /* @__PURE__ */ jsx(
            VqSelect,
            {
              ariaLabel: "Payment terms",
              value: d.terms || "net30",
              onChange: (v) => {
                const days = { immediate: 0, net7: 7, net15: 15, net30: 30, net60: 60 }[v] ?? 30;
                const base = d.date ? new Date(d.date) : /* @__PURE__ */ new Date();
                base.setDate(base.getDate() + days);
                patch({ terms: v, dueDate: base.toISOString().split("T")[0] });
              },
              options: [
                { value: "immediate", label: "Due immediately" },
                { value: "net7", label: "Within 7 days" },
                { value: "net15", label: "Within 15 days" },
                { value: "net30", label: "Within 30 days" },
                { value: "net60", label: "Within 60 days" }
              ]
            }
          ) }),
          chrome.field("due") && /* @__PURE__ */ jsx(Field, { label: "Due date", span: 3, children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              className: "vqdoc-in",
              value: d.dueDate || "",
              onChange: (e) => patch({ dueDate: e.target.value })
            }
          ) }),
          chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note on the invoice", span: 12, children: /* @__PURE__ */ jsx(
            "textarea",
            {
              className: "vqdoc-in",
              rows: 2,
              value: d.notes || "",
              placeholder: "Anything that should print on the customer's copy",
              onChange: (e) => patch({ notes: e.target.value })
            }
          ) })
        ] }),
        extraRows: ({ d, patch }) => multiExtras ? /* @__PURE__ */ jsxs(Fragment, { children: [
          (d.extraFields || []).map((f) => /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row edit", children: [
            /* @__PURE__ */ jsx("span", { className: "k", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "vqdoc-in xs",
                value: f.label,
                onChange: (e) => patch({
                  extraFields: d.extraFields.map((x) => x.id === f.id ? { ...x, label: e.target.value } : x)
                })
              }
            ) }),
            /* @__PURE__ */ jsxs("span", { className: "v", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  className: "vqdoc-cell",
                  value: f.value,
                  onFocus: (e) => e.target.select(),
                  onChange: (e) => patch({
                    extraFields: d.extraFields.map((x) => x.id === f.id ? { ...x, value: num(e.target.value) } : x)
                  })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "vqdoc-icon sm quiet danger",
                  onClick: () => patch({ extraFields: d.extraFields.filter((x) => x.id !== f.id) }),
                  children: /* @__PURE__ */ jsx(X, { size: 13 })
                }
              )
            ] })
          ] }, f.id)),
          (d.extraFields || []).length < 10 && /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
            /* @__PURE__ */ jsx("span", { className: "k", children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "vqdoc-btn xs",
                onClick: () => patch({
                  extraFields: [...d.extraFields || [], { id: uid(), label: "Charge", value: 0 }]
                }),
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 13 }),
                  " Add a charge"
                ]
              }
            ) }),
            /* @__PURE__ */ jsx("span", { className: "v" })
          ] })
        ] }) : null,
        extraTools: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "vqdoc-icon",
            title: "What this sale is making",
            onClick: () => setMarginOpen(true),
            children: /* @__PURE__ */ jsx(TrendingUp, { size: 17 })
          }
        ),
        extraActions: ({ d, totals }) => /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "vqdoc-btn",
              disabled: printing,
              title: "Save and print the customer's copy",
              onClick: () => {
                const already = isEdit ? d.id : savedIds.current[d.id];
                if (already) printSale(already);
                else saveRef.current?.({ print: true });
              },
              children: [
                /* @__PURE__ */ jsx(Printer, { size: 16 }),
                " ",
                printing ? "Printing" : posted ? "Print" : "Save & print"
              ]
            }
          ),
          !isEdit && !posted && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "vqdoc-btn danger",
              title: "Throw this bill away",
              onClick: () => drafts.close(d.id),
              children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
            }
          )
        ] }),
        settingsExtras: {
          showDeliveryCharges: showDelivery,
          setShowDeliveryCharges: setShowDelivery,
          showExtraField: showExtra,
          setShowExtraField: setShowExtra,
          enableMultipleExtras: multiExtras,
          setEnableMultipleExtras: setMultiExtras,
          defaultDelivery: defDelivery,
          setDefaultDelivery: setDefDelivery,
          defaultExtraLabel: defExtraLabel,
          setDefaultExtraLabel: setDefExtraLabel,
          defaultExtraValue: defExtraValue,
          setDefaultExtraValue: setDefExtraValue
        },
        extraSheets: ({ d, totals, items }) => /* @__PURE__ */ jsxs(Fragment, { children: [
          marginOpen && /* @__PURE__ */ jsxs(
            Sheet,
            {
              title: "What this sale is making",
              hint: "Cost is what the units actually came in at, batch by batch.",
              icon: /* @__PURE__ */ jsx(Coins, { size: 18 }),
              width: 720,
              onClose: () => setMarginOpen(false),
              children: [
                /* @__PURE__ */ jsxs("table", { className: "vqdoc-dtable", children: [
                  /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { children: "Item" }),
                    /* @__PURE__ */ jsx("th", { className: "n", children: "Qty" }),
                    /* @__PURE__ */ jsx("th", { className: "n", children: "Cost" }),
                    /* @__PURE__ */ jsx("th", { className: "n", children: "Price" }),
                    /* @__PURE__ */ jsx("th", { className: "n", children: "Profit" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { children: items.filter((i) => i.product).map((i) => {
                    const qty = num(i.quantity) + num(i.freeQuantity);
                    const rev = qty * num(i.price) - (i.discountType === "percent" ? num(i.quantity) * num(i.price) * (num(i.discount) / 100) : num(i.discount));
                    const cost = qty * num(i.cost);
                    return /* @__PURE__ */ jsxs("tr", { children: [
                      /* @__PURE__ */ jsx("td", { children: i.product.name }),
                      /* @__PURE__ */ jsx("td", { className: "n", children: qty }),
                      /* @__PURE__ */ jsx("td", { className: "n", children: money(cost) }),
                      /* @__PURE__ */ jsx("td", { className: "n", children: money(rev) }),
                      /* @__PURE__ */ jsx("td", { className: "n", children: money(rev - cost) })
                    ] }, i.id);
                  }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum", style: { marginTop: "var(--d-s4)" }, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
                    /* @__PURE__ */ jsx("span", { className: "k", children: "Cost of goods" }),
                    /* @__PURE__ */ jsx("span", { className: "v", children: money(totals.totalCost) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
                    /* @__PURE__ */ jsx("span", { className: "k", children: "Invoice total" }),
                    /* @__PURE__ */ jsx("span", { className: "v", children: money(totals.grandTotal) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vqdoc-total", children: [
                    /* @__PURE__ */ jsx("span", { className: "k", children: "Gross profit" }),
                    /* @__PURE__ */ jsxs("span", { className: "v", children: [
                      money(totals.profit),
                      " · ",
                      totals.marginPct.toFixed(1),
                      "%"
                    ] })
                  ] })
                ] })
              ]
            }
          ),
          overpayment && /* @__PURE__ */ jsx(Scrim, { onClose: () => setOverpayment(null), children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-modal", style: { width: "min(480px, 100%)" }, children: [
            /* @__PURE__ */ jsxs("header", { children: [
              /* @__PURE__ */ jsx("span", { className: "ico", children: /* @__PURE__ */ jsx(Wallet, { size: 18 }) }),
              /* @__PURE__ */ jsx("span", { className: "t", children: /* @__PURE__ */ jsxs("h3", { children: [
                money(overpayment.amount),
                " more than the bill"
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "body", style: { display: "grid", gap: "var(--d-s4)" }, children: [
              /* @__PURE__ */ jsxs("p", { style: { margin: 0, color: "var(--vq-text-2)" }, children: [
                overpayment.name,
                " has handed over more than this invoice comes to."
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "vqdoc-opt",
                  onClick: () => {
                    const o = overpayment;
                    setOverpayment(null);
                    saveRef.current?.({ print: o.print, addToLedger: false });
                  },
                  children: [
                    /* @__PURE__ */ jsx("strong", { children: "Give the change back" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      money(overpayment.amount),
                      " out of the drawer now."
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "vqdoc-opt",
                  onClick: () => {
                    const o = overpayment;
                    setOverpayment(null);
                    saveRef.current?.({ print: o.print, addToLedger: true });
                  },
                  children: [
                    /* @__PURE__ */ jsx("strong", { children: "Keep it on their account" }),
                    /* @__PURE__ */ jsx("span", { children: "Held as credit against what they buy next." })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "vqdoc-actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-btn", onClick: () => setOverpayment(null), children: "Go back" }) })
            ] })
          ] }) }),
          done && /* @__PURE__ */ jsx(Scrim, { onClose: () => setDone(null), children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-modal", style: { width: "min(440px, 100%)" }, children: [
            /* @__PURE__ */ jsxs("header", { children: [
              /* @__PURE__ */ jsx("span", { className: "ico", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }) }),
              /* @__PURE__ */ jsx("span", { className: "t", children: /* @__PURE__ */ jsx("h3", { children: "Sale completed" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "body", style: { display: "grid", gap: "var(--d-s4)" }, children: [
              /* @__PURE__ */ jsx("p", { style: { margin: 0, color: "var(--vq-text-2)" }, children: "The stock is out and the invoice is in the books." }),
              /* @__PURE__ */ jsxs("div", { className: "vqdoc-actions", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "vqdoc-btn",
                    disabled: printing,
                    onClick: () => printSale(done.id),
                    children: [
                      /* @__PURE__ */ jsx(Printer, { size: 16 }),
                      " ",
                      printing ? "Printing" : "Print receipt"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    id: "tour-new-transaction",
                    className: "vqdoc-btn pri",
                    onClick: () => {
                      const closing = d.id;
                      setDone(null);
                      drafts.close(closing);
                      if (store?.onboarding_step) router.reload({ only: ["store"] });
                    },
                    children: "Start another sale"
                  }
                )
              ] })
            ] })
          ] }) })
        ] })
      }
    ),
    /* @__PURE__ */ jsx(InvoiceTourGuide, { store })
  ] });
}
export {
  CreateInvoice as default
};

import { jsx, jsxs, Fragment as Fragment$1 } from "react/jsx-runtime";
import { usePage, router, createInertiaApp } from "@inertiajs/react";
import createServer from "@inertiajs/react/server";
import ReactDOMServer from "react-dom/server";
import React, { createContext, useState, useRef, useEffect, useContext, useCallback, Fragment } from "react";
import axios from "axios";
import { X, AlertTriangle, Info, XCircle, CheckCircle2, WifiOff, RotateCcw, MonitorX, Lock, Check, Delete, MessageSquare, Loader2, Sparkles, Send, Minimize2, Maximize2, Play } from "lucide-react";
import Dexie from "dexie";
import { createPortal } from "react-dom";
import { Transition, Dialog, TransitionChild, DialogPanel } from "@headlessui/react";
import "laravel-echo";
import "pusher-js";
async function resolvePageComponent(path, pages) {
  for (const p2 of Array.isArray(path) ? path : [path]) {
    const page = pages[p2];
    if (typeof page === "undefined") {
      continue;
    }
    return typeof page === "function" ? page() : page;
  }
  throw new Error(`Page not found: ${path}`);
}
const AttendanceContext = createContext();
const AttendanceProvider = ({ children }) => {
  const { props } = usePage();
  const auth = props.auth;
  const store = props.store || {};
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);
  const INACTIVITY_LIMIT = 60 * 60 * 1e3;
  useEffect(() => {
    if (!auth?.user || !store?.slug) {
      setIsCheckedIn(false);
      setAttendance(null);
      return;
    }
    checkIn();
    const handleActivity = () => {
      const now = Date.now();
      const diff = now - lastActivityRef.current;
      if (diff >= INACTIVITY_LIMIT) {
        logGapSilently(new Date(lastActivityRef.current), new Date(now));
      }
      lastActivityRef.current = now;
    };
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 5 * 60 * 1e3);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [auth?.user]);
  const checkIn = async (isRetry = false) => {
    if (!isRetry && !window.__attendanceFirstCheckInvoked) {
      window.__attendanceFirstCheckInvoked = true;
      await new Promise((resolve) => {
        const finishHandler = () => {
          document.removeEventListener("inertia:finish", finishHandler);
          resolve();
        };
        document.addEventListener("inertia:finish", finishHandler);
        setTimeout(resolve, 500);
      });
    }
    try {
      const response = await axios.post(
        route("store.attendance.check-in", { store_slug: store.slug }),
        {},
        { _skipGlobalErrorHandler: true }
      );
      if (response.data.success) {
        setIsCheckedIn(true);
        setAttendance(response.data.attendance);
        lastActivityRef.current = Date.now();
      }
    } catch (error) {
      if (error.response?.status === 419 && !isRetry) {
        await new Promise((r2) => setTimeout(r2, 200));
        return checkIn(true);
      }
      console.error("Check-in error handled.");
    }
  };
  const sendHeartbeat = async () => {
    try {
      await axios.post(
        route("store.attendance.heartbeat", { store_slug: store.slug }),
        {},
        { _skipGlobalErrorHandler: true }
      );
    } catch (error) {
      console.error("Heartbeat error:", error);
    }
  };
  const logGapSilently = async (start, end) => {
    try {
      await axios.post(
        route("store.attendance.log-gap", { store_slug: store.slug }),
        {
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          reason: "Silent Inactivity (>1hr)",
          description: "User was inactive for more than 1 hour."
        },
        { _skipGlobalErrorHandler: true }
      );
    } catch (error) {
      console.error("Log gap error:", error);
    }
  };
  return /* @__PURE__ */ jsx(AttendanceContext.Provider, { value: {
    isCheckedIn,
    attendance
  }, children });
};
const WorkspaceContext = createContext();
const WorkspaceProvider = ({ children, settings = {} }) => {
  const generateInvoiceNumber = (counter) => {
    const prefix = settings?.sale_prefix || "INV-";
    return `${prefix}${String(counter).padStart(6, "0")}`;
  };
  const [invoiceCounter, setInvoiceCounter] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = localStorage.getItem("amd_invoice_counter");
    return saved ? parseInt(saved, 10) : 1;
  });
  const [activeInvoices, setActiveInvoices] = useState(() => {
    if (typeof window === "undefined") return [];
    const saved = sessionStorage.getItem("amd_active_invoices_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((inv) => inv.status !== "completed");
          if (filtered.length > 0) return filtered;
        }
      } catch (e2) {
        console.error("Failed to parse active invoices", e2);
      }
    }
    const counter = parseInt((typeof window !== "undefined" ? localStorage.getItem("amd_invoice_counter") : "1") || "1", 10);
    return [{
      id: Date.now(),
      type: "invoice",
      invoiceNumber: generateInvoiceNumber(counter),
      customer: null,
      items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }],
      paymentMethod: "credit",
      paymentTerms: "net30",
      amountPaid: 0,
      discount: 0,
      globalDiscount: 0,
      globalDiscountType: "fixed",
      tax: 0,
      delivery_charge: 0,
      extra_charge_value: 0,
      extra_charge_label: "Extra",
      notes: "",
      reference: "",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      dueDate: ""
    }];
  });
  const [activePreSaleInvoices, setActivePreSaleInvoices] = useState(() => {
    if (typeof window === "undefined") return [];
    const saved = sessionStorage.getItem("amd_active_presales_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const counter = parseInt((typeof window !== "undefined" ? localStorage.getItem("amd_invoice_counter") : "1") || "1", 10);
    return [{
      id: Date.now() + 1,
      // offset to avoid collision with invoice id
      type: "presale",
      invoiceNumber: generateInvoiceNumber(counter),
      customer: null,
      items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }],
      paymentMethod: "credit",
      paymentTerms: "net30",
      amountPaid: 0,
      discount: 0,
      globalDiscount: 0,
      globalDiscountType: "fixed",
      tax: 0,
      delivery_charge: 0,
      extra_charge_value: 0,
      extra_charge_label: "Extra",
      notes: "",
      reference: "",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      dueDate: ""
    }];
  });
  const [posSessions, setPosSessions] = useState(() => {
    if (typeof window === "undefined") return [];
    const saved = sessionStorage.getItem("venqore_sessions_v2");
    return saved ? JSON.parse(saved) : [];
  });
  const [activePurchases, setActivePurchases] = useState(() => {
    if (typeof window === "undefined") return [];
    const saved = sessionStorage.getItem("amd_active_purchases_v2");
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [currentPurchaseId, setCurrentPurchaseId] = useState(activePurchases?.[0]?.id || null);
  useEffect(() => {
    sessionStorage.setItem("amd_active_purchases_v2", JSON.stringify(activePurchases));
  }, [activePurchases]);
  const addPurchase = (initialData = {}) => {
    const newId = Date.now();
    const newPurchase = {
      id: newId,
      items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }],
      supplier: null,
      paymentMethod: "credit",
      amountPaid: 0,
      discount: 0,
      tax: 0,
      delivery_charge: 0,
      extra_charge_value: 0,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      invoiceNumber: "",
      notes: "",
      ...initialData
    };
    setActivePurchases((prev) => [...prev, newPurchase]);
    setCurrentPurchaseId(newId);
    return newPurchase;
  };
  const updatePurchase = (id, data) => {
    setActivePurchases((prev) => prev.map((p2) => p2.id === id ? { ...p2, ...data } : p2));
  };
  const removePurchaseTab = (id) => {
    setActivePurchases((prev) => {
      const newArr = prev.filter((p2) => p2.id !== id);
      if (newArr.length === 0) {
        const newId = Date.now();
        const newPurchase = {
          id: newId,
          items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }],
          supplier: null,
          paymentMethod: "credit",
          amountPaid: 0,
          discount: 0,
          tax: 0,
          delivery_charge: 0,
          extra_charge_value: 0,
          date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          invoiceNumber: "",
          notes: "",
          extras: []
        };
        setCurrentPurchaseId(newId);
        return [newPurchase];
      }
      setCurrentPurchaseId((currentId) => {
        if (currentId === id) {
          return newArr[newArr.length - 1]?.id || null;
        }
        return currentId;
      });
      return newArr;
    });
  };
  const [currentInvoiceId, setCurrentInvoiceId] = useState(activeInvoices[0]?.id || null);
  const [currentPreSaleId, setCurrentPreSaleId] = useState(activePreSaleInvoices[0]?.id || null);
  const [currentPosId, setCurrentPosId] = useState(null);
  const addPreSaleInvoice = (initialData = {}) => {
    const nextCounter = invoiceCounter + 1;
    const newInvoice = {
      id: Date.now(),
      type: "presale",
      invoiceNumber: generateInvoiceNumber(nextCounter),
      customer: null,
      items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }],
      paymentMethod: "credit",
      paymentTerms: "net30",
      amountPaid: 0,
      discount: 0,
      globalDiscount: 0,
      globalDiscountType: "fixed",
      tax: 0,
      delivery_charge: 0,
      extra_charge_value: 0,
      extra_charge_label: "Extra",
      notes: "",
      reference: "",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      dueDate: "",
      ...initialData
    };
    setInvoiceCounter(nextCounter);
    setActivePreSaleInvoices((prev) => [...prev, newInvoice]);
    setCurrentPreSaleId(newInvoice.id);
  };
  const removePreSaleInvoice = (id) => {
    setActivePreSaleInvoices((prev) => {
      if (prev.length === 1) {
        const nextCounter = invoiceCounter + 1;
        const resetInvoice = {
          id: Date.now(),
          type: "presale",
          invoiceNumber: generateInvoiceNumber(nextCounter),
          customer: null,
          items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }],
          paymentMethod: "credit",
          paymentTerms: "net30",
          amountPaid: 0,
          discount: 0,
          globalDiscount: 0,
          globalDiscountType: "fixed",
          tax: 0,
          delivery_charge: 0,
          extra_charge_value: 0,
          extra_charge_label: "Extra",
          notes: "",
          reference: "",
          date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          dueDate: ""
        };
        setInvoiceCounter(nextCounter);
        setCurrentPreSaleId(resetInvoice.id);
        return [resetInvoice];
      }
      const remaining = prev.filter((inv) => inv.id !== id);
      setCurrentPreSaleId((currentId) => {
        return currentId === id ? remaining[0]?.id || null : currentId;
      });
      return remaining;
    });
  };
  const updatePreSaleInvoice = (id, data) => {
    setActivePreSaleInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, ...data } : inv));
  };
  useEffect(() => {
    try {
      const sanitizedInvoices = activeInvoices.map((invoice) => ({
        ...invoice,
        items: invoice.items?.map((item) => ({
          id: item.id,
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            price: item.product.price,
            selling_price: item.product.selling_price,
            cost: item.product.cost,
            cost_price: item.product.cost_price,
            stock_quantity: item.product.stock_quantity
          } : null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost,
          discount: item.discount,
          discountType: item.discountType,
          variant: item.variant
        })) || []
      }));
      sessionStorage.setItem("amd_active_invoices_v2", JSON.stringify(sanitizedInvoices));
    } catch (error) {
      console.error("Failed to save invoices to sessionStorage:", error);
      sessionStorage.removeItem("amd_active_invoices_v2");
    }
  }, [activeInvoices]);
  useEffect(() => {
    try {
      const sanitized = activePreSaleInvoices.map((invoice) => ({
        ...invoice,
        items: invoice.items?.map((item) => ({
          id: item.id,
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            price: item.product.price,
            selling_price: item.product.selling_price,
            cost: item.product.cost,
            cost_price: item.product.cost_price,
            stock_quantity: item.product.stock_quantity
          } : null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost,
          discount: item.discount,
          discountType: item.discountType,
          variant: item.variant
        })) || []
      }));
      sessionStorage.setItem("amd_active_presales_v2", JSON.stringify(sanitized));
    } catch (error) {
      console.error("Failed to save pre-sale invoices to sessionStorage:", error);
      sessionStorage.removeItem("amd_active_presales_v2");
    }
  }, [activePreSaleInvoices]);
  useEffect(() => {
    sessionStorage.setItem("venqore_sessions_v2", JSON.stringify(posSessions));
  }, [posSessions]);
  useEffect(() => {
    localStorage.setItem("amd_invoice_counter", invoiceCounter.toString());
  }, [invoiceCounter]);
  const addInvoice = (initialData = {}) => {
    const nextCounter = invoiceCounter + 1;
    const newInvoice = {
      id: Date.now(),
      type: "invoice",
      invoiceNumber: generateInvoiceNumber(nextCounter),
      customer: null,
      items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }],
      paymentMethod: "credit",
      paymentTerms: "net30",
      amountPaid: 0,
      discount: 0,
      globalDiscount: 0,
      globalDiscountType: "fixed",
      tax: 0,
      delivery_charge: 0,
      extra_charge_value: 0,
      extra_charge_label: "Extra",
      notes: "",
      reference: "",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      dueDate: "",
      ...initialData
    };
    setInvoiceCounter(nextCounter);
    setActiveInvoices((prev) => [...prev, newInvoice]);
    setCurrentInvoiceId(newInvoice.id);
  };
  const removeInvoice = (id) => {
    setActiveInvoices((prev) => {
      if (prev.length === 1 && posSessions.length === 0) {
        const nextCounter = invoiceCounter + 1;
        const resetInvoice = {
          id: Date.now(),
          type: "invoice",
          invoiceNumber: generateInvoiceNumber(nextCounter),
          customer: null,
          items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }],
          paymentMethod: "credit",
          paymentTerms: "net30",
          amountPaid: 0,
          discount: 0,
          globalDiscount: 0,
          globalDiscountType: "fixed",
          tax: 0,
          delivery_charge: 0,
          extra_charge_value: 0,
          extra_charge_label: "Extra",
          notes: "",
          reference: "",
          date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          dueDate: ""
        };
        setInvoiceCounter(nextCounter);
        setCurrentInvoiceId(resetInvoice.id);
        return [resetInvoice];
      }
      const newInvoices = prev.filter((inv) => inv.id !== id);
      setCurrentInvoiceId((currentId) => {
        return currentId === id ? newInvoices[0]?.id || null : currentId;
      });
      return newInvoices;
    });
  };
  const updateInvoice = (id, data) => {
    setActiveInvoices((prev) => prev.map(
      (inv) => inv.id === id ? { ...inv, ...data } : inv
    ));
  };
  const addPosSession = (data = {}) => {
    const newSession = {
      id: Date.now(),
      type: "pos",
      cart: [],
      customer: null,
      cashReceived: "",
      ...data
    };
    setPosSessions((prev) => [...prev, newSession]);
    setCurrentPosId(newSession.id);
    return newSession;
  };
  const updatePosSession = (id, data) => {
    setPosSessions((prev) => prev.map((s2) => s2.id === id ? { ...s2, ...data } : s2));
  };
  const removePosSession = (id) => {
    setPosSessions((prev) => {
      const nextSession = prev.filter((s2) => s2.id !== id);
      setCurrentPosId((currentId) => currentId === id ? null : currentId);
      return nextSession;
    });
  };
  return /* @__PURE__ */ jsx(WorkspaceContext.Provider, { value: {
    activeInvoices,
    currentInvoiceId,
    setCurrentInvoiceId,
    addInvoice,
    removeInvoice,
    updateInvoice,
    // Pre-Sale Workspace (isolated)
    activePreSaleInvoices,
    currentPreSaleId,
    setCurrentPreSaleId,
    addPreSaleInvoice,
    removePreSaleInvoice,
    updatePreSaleInvoice,
    posSessions,
    currentPosId,
    setCurrentPosId,
    addPosSession,
    updatePosSession,
    removePosSession,
    // Purchase Context
    activePurchases,
    currentPurchaseId,
    setCurrentPurchaseId,
    addPurchase,
    removePurchase: removePurchaseTab,
    updatePurchase
  }, children });
};
const useWorkspace = () => useContext(WorkspaceContext);
function FormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  loading = false,
  confirmClose = true,
  // Default to true for better UX
  errors = null
  // Support displaying validation errors
}) {
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95%] h-[95vh]"
    // Making it much larger as requested
  };
  const requestClose = useCallback(() => {
    if (confirmClose) {
      setShowExitConfirmation(true);
    } else {
      onClose();
    }
  }, [confirmClose, onClose]);
  const handleBackdropInteraction = (e2) => {
    if (e2.target === e2.currentTarget) {
      e2.preventDefault();
      e2.stopPropagation();
    }
  };
  React.useEffect(() => {
    if (isOpen) setShowExitConfirmation(false);
    const handleKeyDown = (event) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        if (isOpen) {
          event.preventDefault();
          event.stopPropagation();
          requestClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown, true);
    }
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, requestClose]);
  const errorList = [];
  if (errors && typeof errors === "object") {
    Object.entries(errors).forEach(([field, messages]) => {
      const fieldLabel = field.replace(/_/g, " ").replace(/\b\w/g, (c2) => c2.toUpperCase());
      if (Array.isArray(messages)) {
        messages.forEach((msg) => errorList.push({ field, label: fieldLabel, message: msg }));
      } else if (typeof messages === "string") {
        errorList.push({ field, label: fieldLabel, message: messages });
      }
    });
  }
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500 cursor-pointer",
        onMouseDown: handleBackdropInteraction,
        onTouchStart: handleBackdropInteraction
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-12 pointer-events-none overflow-hidden", children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: `
                        ${sizeClasses[size]} w-full pointer-events-auto
                        bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,0.8)]
                        border-4 border-white/10 dark:border-slate-800/50
                        animate-in zoom-in-95 fade-in duration-500
                        ${size === "full" ? "h-[94vh]" : "max-h-[96vh]"} 
                        flex flex-col relative overflow-hidden
                    `,
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[130px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "px-10 py-8 border-b-2 border-slate-100 dark:border-slate-800/80 shrink-0 relative z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("span", { className: "w-3 h-10 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-full" }),
                title
              ] }),
              subtitle && /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-400 dark:text-slate-500 mt-2 max-w-4xl tracking-tight leading-none", children: subtitle })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e2) => {
                  e2.preventDefault();
                  e2.stopPropagation();
                  requestClose();
                },
                className: "group p-5 rounded-[2rem] bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 dark:hover:bg-rose-600 text-slate-400 dark:text-slate-500 hover:text-white transition-all active:scale-90 shadow-inner",
                title: "Safe Close (Esc)",
                children: /* @__PURE__ */ jsx(X, { size: 32, className: "group-hover:rotate-180 transition-transform duration-700 ease-out" })
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-10 py-10 relative z-10 custom-scrollbar-premium bg-gradient-to-b from-transparent to-slate-50/20 dark:to-slate-900/10", children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-40 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("div", { className: "w-32 h-32 border-8 border-indigo-600/10 rounded-full" }),
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-32 h-32 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-600 dark:text-slate-300 tracking-[0.2em] uppercase animate-pulse", children: "Processing Block..." }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-400", children: "Please do not refresh or close." })
            ] })
          ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
            errorList.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-6 rounded-[2rem] bg-rose-500/10 border-2 border-rose-500/20 dark:bg-rose-950/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-4 duration-300", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 24, className: "shrink-0 text-rose-500" }),
                /* @__PURE__ */ jsx("h4", { className: "text-base font-black uppercase tracking-wider", children: "Please correct the following:" })
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "list-disc pl-5 space-y-1 text-sm font-bold", children: errorList.map((err, idx) => /* @__PURE__ */ jsxs("li", { className: "tracking-tight", children: [
                /* @__PURE__ */ jsx("span", { className: "capitalize", children: err.label }),
                ": ",
                err.message
              ] }, idx)) })
            ] }),
            children
          ] }) }),
          footer && /* @__PURE__ */ jsx("div", { className: "px-10 py-10 border-t-2 border-slate-100 dark:border-slate-800/80 shrink-0 relative z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.05)]", children: footer }),
          showExitConfirmation && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200", children: /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 border-2 border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 32, strokeWidth: 2.5 }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-900 dark:text-white", children: "Discard Changes?" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "You have unsaved changes. Are you sure you want to close this form? Data will be lost." }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 w-full mt-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e2) => {
                    e2.preventDefault();
                    e2.stopPropagation();
                    setShowExitConfirmation(false);
                  },
                  className: "px-4 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
                  children: "No, Stay"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e2) => {
                    e2.preventDefault();
                    e2.stopPropagation();
                    onClose();
                  },
                  className: "px-4 py-3 rounded-2xl font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/30 transition-colors",
                  children: "Yes, Discard"
                }
              )
            ] })
          ] }) }) })
        ]
      }
    ) })
  ] });
}
function FormField({ label, error, required, children, hint, className = "" }) {
  return /* @__PURE__ */ jsxs("div", { className: `space-y-2 ${className}`, children: [
    label && /* @__PURE__ */ jsxs("label", { className: "block text-sm font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider", children: [
      label,
      required && /* @__PURE__ */ jsx("span", { className: "text-rose-500 ml-1.5", children: "*" })
    ] }),
    children,
    (hint || error) && /* @__PURE__ */ jsx("div", { className: "flex items-start gap-2 pt-1 transition-all", children: error ? /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-rose-500 animate-in slide-in-from-left-2", children: error }) : /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-slate-400", children: hint }) })
  ] });
}
function FormInput({
  type = "text",
  error,
  className = "",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      className: `
                w-full px-5 py-4 rounded-2xl
                bg-slate-50 dark:bg-slate-800/30
                border-2 ${error ? "border-rose-500/50" : "border-slate-200 dark:border-slate-700/50"}
                text-slate-900 dark:text-white text-lg font-bold
                placeholder:text-slate-300 dark:placeholder:text-slate-600
                outline-none focus:ring-4 ${error ? "ring-rose-500/10 focus:border-rose-500" : "ring-indigo-500/10 focus:border-indigo-500"}
                transition-all hover:bg-white dark:hover:bg-slate-800/50
                ${className}
            `,
      ...props
    }
  );
}
function FormSelect({
  value,
  onChange,
  onCreate,
  error,
  children,
  className = "",
  placeholder = "Select an option",
  searchable = true,
  creatable = false,
  ...props
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const containerRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  const allOptions = React.Children.toArray(children).map((child) => ({
    value: child.props.value,
    label: child.props.children,
    disabled: child.props.disabled || child.props.value === ""
  })).filter((opt) => !opt.disabled);
  const filteredOptions = allOptions.filter(
    (opt) => String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedOption = allOptions.find((opt) => opt.value == value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder || "Select...";
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen, searchable]);
  const handleSelect = (val) => {
    const event = { target: { value: val, name: props.name || "" } };
    if (onChange) onChange(event);
    setIsOpen(false);
  };
  const handleCreate = () => {
    if (onCreate && searchTerm.trim()) {
      onCreate(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm("");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative", ref: containerRef, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setIsOpen(!isOpen),
        className: `
                    w-full px-5 py-4 rounded-2xl text-left flex items-center justify-between
                    bg-slate-50 dark:bg-slate-800/30 
                    border-2 ${error ? "border-rose-500/50" : "border-slate-200 dark:border-slate-700/50"}
                    text-slate-900 dark:text-white text-lg font-bold
                    outline-none focus:ring-4 ${error ? "ring-rose-500/10 focus:border-rose-500" : "ring-indigo-500/10 focus:border-indigo-500"}
                    transition-all hover:bg-white dark:hover:bg-slate-800/50
                    ${isOpen ? "ring-4 ring-indigo-500/10 border-indigo-500" : ""}
                    ${className}
                `,
        children: [
          /* @__PURE__ */ jsx("span", { className: !selectedOption ? "text-slate-400 dark:text-slate-600" : "", children: displayLabel }),
          /* @__PURE__ */ jsx("span", { className: `text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`, children: /* @__PURE__ */ jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" }) }) })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "absolute z-[100] w-full mt-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-h-[400px] overflow-hidden animate-in fade-in slide-in-from-top-4 flex flex-col", children: [
      searchable && /* @__PURE__ */ jsx("div", { className: "p-3 border-b-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxs("svg", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" }),
          /* @__PURE__ */ jsx("path", { d: "m21 21-4.3-4.3" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: searchInputRef,
            type: "text",
            value: searchTerm,
            onChange: (e2) => setSearchTerm(e2.target.value),
            placeholder: "Type to search or create...",
            className: "w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-bold outline-none focus:border-indigo-500 transition-all",
            onClick: (e2) => e2.stopPropagation()
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto custom-scrollbar-premium p-2 space-y-1", children: [
        creatable && searchTerm && !allOptions.some((o2) => o2.label.toLowerCase() === searchTerm.trim().toLowerCase()) && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: handleCreate,
            className: "w-full px-4 py-6 rounded-2xl text-left text-lg font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-4 shadow-xl border-4 border-white/20 mb-4 animate-bounce",
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                /* @__PURE__ */ jsx("path", { d: "M12 5v14" })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs uppercase opacity-70", children: "Add New Category" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  'Create "',
                  searchTerm,
                  '"'
                ] })
              ] })
            ]
          }
        ),
        filteredOptions.length > 0 ? filteredOptions.map((opt) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleSelect(opt.value),
            className: `
                                        w-full px-4 py-3.5 rounded-2xl text-left text-base font-bold transition-all flex items-center justify-between
                                        ${value == opt.value ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-2 border-emerald-100 dark:border-emerald-500/20" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:pl-6"}
                                    `,
            children: [
              opt.label,
              value == opt.value && /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-in zoom-in", children: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) }) })
            ]
          },
          opt.value
        )) : !searchTerm ? /* @__PURE__ */ jsx("div", { className: "px-4 py-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-bold uppercase tracking-widest text-xs", children: "No options available" }) }) : null,
        filteredOptions.length === 0 && searchTerm && !creatable && /* @__PURE__ */ jsx("div", { className: "px-4 py-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-bold uppercase tracking-widest text-xs", children: "No Results Found" }) })
      ] })
    ] })
  ] });
}
function FormTextarea({
  error,
  className = "",
  rows = 3,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      rows,
      className: `
                w-full px-4 py-3 rounded-2xl
                bg-slate-50 dark:bg-slate-800/50
                border ${error ? "border-red-500" : "border-slate-200 dark:border-slate-700"}
                text-slate-800 dark:text-white font-medium
                placeholder:text-slate-400
                outline-none focus:ring-2 ${error ? "ring-red-500/20" : "ring-indigo-500/20 focus:border-indigo-500"}
                transition-all resize-none hover:bg-white dark:hover:bg-slate-800
                ${className}
            `,
      ...props
    }
  );
}
function PrimaryButton({ children, loading, className = "", ...props }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      className: `
                px-6 py-2.5 rounded-xl font-semibold text-white
                bg-gradient-to-r from-indigo-600 to-indigo-700
                hover:from-indigo-700 hover:to-indigo-800
                shadow-lg shadow-indigo-500/25
                transition-all active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                ${className}
            `,
      disabled: loading,
      ...props,
      children: [
        loading && /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }),
        children
      ]
    }
  );
}
function SecondaryButton({ children, className = "", ...props }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      className: `
                px-6 py-2.5 rounded-xl font-semibold
                border border-slate-200 dark:border-slate-700
                text-slate-700 dark:text-slate-300
                hover:bg-slate-50 dark:hover:bg-slate-800
                transition-all active:scale-95
                ${className}
            `,
      ...props,
      children
    }
  );
}
const AlertContext = createContext();
const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    // info, success, warning, error
    confirmLabel: "OK",
    cancelLabel: "Cancel",
    isConfirm: false,
    onConfirm: () => {
    },
    onCancel: () => {
    }
  });
  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);
  const showAlert = useCallback(({
    title,
    message,
    type = "info",
    confirmLabel = "OK",
    onConfirm
  }) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      confirmLabel,
      isConfirm: false,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        closeAlert();
      },
      onCancel: closeAlert
    });
  }, [closeAlert]);
  React.useEffect(() => {
    const handleNetworkError = (e2) => {
      if (window.location.pathname.startsWith("/installer")) {
        return;
      }
      showAlert({
        title: "Connection Issue",
        message: e2.detail?.message || "We are experiencing connectivity issues.",
        type: "error",
        confirmLabel: "Dismiss"
      });
    };
    window.addEventListener("amd:network-error", handleNetworkError);
    return () => window.removeEventListener("amd:network-error", handleNetworkError);
  }, [showAlert]);
  const showConfirm = useCallback(({
    title,
    message,
    type = "warning",
    confirmLabel = "Yes",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel
  }) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      confirmLabel,
      cancelLabel,
      isConfirm: true,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        closeAlert();
      },
      onCancel: () => {
        if (onCancel) onCancel();
        closeAlert();
      }
    });
  }, [closeAlert]);
  const getIcon = () => {
    switch (alertState.type) {
      case "success":
        return /* @__PURE__ */ jsx(CheckCircle2, { size: 48, className: "text-emerald-500" });
      case "error":
        return /* @__PURE__ */ jsx(XCircle, { size: 48, className: "text-red-500" });
      case "warning":
        return /* @__PURE__ */ jsx(AlertTriangle, { size: 48, className: "text-amber-500" });
      default:
        return /* @__PURE__ */ jsx(Info, { size: 48, className: "text-indigo-500" });
    }
  };
  return /* @__PURE__ */ jsxs(AlertContext.Provider, { value: { showAlert, showConfirm }, children: [
    children,
    /* @__PURE__ */ jsx(
      FormModal,
      {
        isOpen: alertState.isOpen,
        onClose: alertState.onCancel,
        title: alertState.title,
        size: "sm",
        children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center p-4", children: [
          /* @__PURE__ */ jsx("div", { className: `mb-4 w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200 ${alertState.type === "success" ? "bg-emerald-100" : alertState.type === "error" ? "bg-red-100" : alertState.type === "warning" ? "bg-amber-100" : "bg-indigo-100"}`, children: getIcon() }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-300 mb-8 max-w-xs leading-relaxed", children: alertState.message }),
          /* @__PURE__ */ jsxs("div", { className: "flex w-full gap-3", children: [
            alertState.isConfirm && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: alertState.onCancel,
                className: "flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors",
                children: alertState.cancelLabel
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: alertState.onConfirm,
                className: `flex-1 py-3 font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 ${alertState.type === "error" ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : alertState.type === "warning" ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : alertState.type === "success" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"}`,
                children: alertState.confirmLabel
              }
            )
          ] })
        ] })
      }
    )
  ] });
};
const useAlert = () => useContext(AlertContext);
const db$1 = new Dexie("VenQore_Offline_DB");
db$1.version(3).stores({
  products: "id, name, sku, barcode, category_id, brand_id, unit_id",
  // Core product data
  customers: "id, name, phone, email, balance",
  // Parties (Customers/Suppliers)
  suppliers: "id, name, phone, email, balance",
  orders: "id, date, status, [status+date], customer_id",
  // Sales
  invoices: "id, invoice_number, date, customer_id, total_amount, status, [status+date]",
  inventory: "id, product_id, godown_id, quantity",
  // Stock levels
  settings: "key, value",
  // For config and DRM (last_online_verify)
  users: "id, pin_hash, role",
  // Auth
  taxes: "id, name, rate_percent",
  sales_queue: "++id, created_at, status",
  // For offline POS sync queue
  offline_invoices: "++id, invoice_number, created_at",
  // Offline history
  sync_queue: "++id, table, action, data, timestamp"
  // Generic sync queue
});
db$1.on("populate", () => {
  db$1.settings.add({ key: "last_online_verify", value: Date.now() });
});
const SyncService = {
  /**
   * Main background sync loop. Call this periodically (e.g., every 30 mins).
   */
  async runBackgroundSync() {
    if (!navigator.onLine) return;
    const storeSlug = this.getStoreSlug();
    if (!storeSlug) return;
    const serverUp = await this.isServerReachable();
    if (!serverUp) {
      console.log("[Sync] Server unreachable. Skipping sync.");
      return;
    }
    console.log("[Sync] Starting background sync...");
    try {
      await this.syncOrders();
      await this.hydrate();
      await this.pingHeartbeat();
      console.log("[Sync] Background sync complete.");
    } catch (e2) {
      if (e2.message !== "Network Error" && e2.name !== "ZiggyError") {
        console.error("[Sync] Background sync failed:", e2);
      }
    }
  },
  getStoreSlug() {
    const parts = window.location.pathname.split("/");
    const sIndex = parts.indexOf("s");
    if (sIndex !== -1 && parts[sIndex + 1]) {
      return parts[sIndex + 1];
    }
    return null;
  },
  async isServerReachable() {
    try {
      const slug = this.getStoreSlug();
      if (!slug) return false;
      await axios.get(route("store.api.check-connection", { store_slug: slug }), {
        timeout: 1e4,
        _skipGlobalErrorHandler: true
      });
      return true;
    } catch (e2) {
      console.warn("[Sync] Connection check failed:", e2.message);
      return false;
    }
  },
  /**
   * DRM / Licensing Check
   * Returns { blocked: boolean, message: string }
   *
   * Two INDEPENDENT block conditions, checked every time this runs
   * (on load, on 'online', and on manual retry — see OfflineLockScreen):
   *
   *   1. Gift Access Link / subscription expiry — the tenant's REAL
   *      expiry date (subscription_ends_at), synced down on every
   *      successful heartbeat. Checked directly against the device's own
   *      clock so it enforces immediately, online or fully offline, the
   *      moment that date passes — per explicit requirement, this does
   *      NOT wait for the existing 30-day "haven't phoned home" window.
   *   2. The pre-existing 30-day offline DRM window (unchanged below).
   *
   * Tamper resistance for #1 comes from the same principle already
   * proven by #2: the stored expiry date can only be refreshed by a
   * SUCCESSFUL server heartbeat. Setting the device clock backward can't
   * extend access — it can only make MORE of the stored data (that expiry
   * date, last_online_verify) look like it's "not reached yet," which is
   * the safe direction to fail in. Setting the clock forward can trigger
   * an early lock, but the very next successful online heartbeat corrects
   * it — same self-healing property the 30-day check already has.
   */
  async checkLicensing() {
    try {
      const expirySetting = await db$1.settings.get("subscription_ends_at");
      if (expirySetting && expirySetting.value) {
        const expiresAt = new Date(expirySetting.value).getTime();
        if (Date.now() >= expiresAt) {
          if (navigator.onLine) {
            try {
              const stillExpired = await this.pingHeartbeat();
              if (stillExpired === false) {
                return { blocked: false, message: "Verified — access renewed" };
              }
            } catch (e2) {
            }
          }
          return {
            blocked: true,
            message: "Your access period has ended. Please subscribe or contact support for a new access link — then reconnect to restore access."
          };
        }
      }
      const setting = await db$1.settings.get("last_online_verify");
      const lastCheck = setting ? setting.value : 0;
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1e3;
      const daysLeft = Math.ceil((thirtyDays - (now - lastCheck)) / (1e3 * 60 * 60 * 24));
      if (now - lastCheck > thirtyDays) {
        console.warn("[License] Offline limit exceeded. Attempting local verification...");
        try {
          await this.pingHeartbeat();
          return { blocked: false, message: "Verified locally" };
        } catch (e2) {
          return { blocked: true, message: "Local Server Check Failed. Please restart the application." };
        }
      }
      if (navigator.onLine) {
        this.pingHeartbeat().catch((e2) => console.warn("Heartbeat failed, ignoring"));
      }
      return { blocked: false, daysLeft };
    } catch (e2) {
      console.error("[License] Check failed:", e2);
      return { blocked: true, message: "System Integrity Check Failed" };
    }
  },
  /**
   * Updating the "Last Online" timestamp logic.
   * Also persists the tenant's current subscription/gift expiry date and
   * view-only status, so checkLicensing() can enforce Check 1 above even
   * while fully offline.
   *
   * Returns true if the server reports the tenant is currently view-only
   * (i.e. still expired as of this heartbeat), false otherwise. Throws if
   * the request itself fails (server unreachable).
   */
  async pingHeartbeat() {
    const slug = this.getStoreSlug();
    if (!slug) return false;
    let deviceId = localStorage.getItem("browser_device_id");
    if (!deviceId) {
      deviceId = "br_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("browser_device_id", deviceId);
    }
    const response = await axios.post(
      route("store.api.heartbeat", { store_slug: slug }),
      { device_id: deviceId },
      { _skipGlobalErrorHandler: true }
    );
    await db$1.settings.put({ key: "last_online_verify", value: Date.now() });
    const data = response?.data || {};
    if (data.subscription_ends_at) {
      await db$1.settings.put({ key: "subscription_ends_at", value: data.subscription_ends_at });
    } else {
      await db$1.settings.delete("subscription_ends_at");
    }
    console.log("[License] Heartbeat acknowledged. Timer reset.");
    return !!data.is_view_only;
  },
  /**
   * Uploads pending offline orders
   */
  async syncOrders() {
    const pendingOrders = await db$1.orders.where("status").equals("pending").toArray();
    if (pendingOrders.length === 0) return;
    const chunkSize = 50;
    for (let i2 = 0; i2 < pendingOrders.length; i2 += chunkSize) {
      const batch = pendingOrders.slice(i2, i2 + chunkSize);
      try {
        const slug = this.getStoreSlug();
        if (!slug) break;
        await axios.post(route("store.api.sync.orders.batch", { store_slug: slug }), { orders: batch }, { _skipGlobalErrorHandler: true });
        await db$1.transaction("rw", db$1.orders, async () => {
          for (const order of batch) {
            await db$1.orders.update(order.id, { status: "synced" });
          }
        });
      } catch (error) {
        console.error("[Sync] Order upload failed:", error);
        throw error;
      }
    }
  },
  /**
   * "Fetch Everything" - User Request
   * Downloads full catalog for offline supremacy.
   */
  async hydrate() {
    const resources = ["products", "customers", "suppliers", "inventory", "taxes"];
    const slug = this.getStoreSlug();
    if (!slug) return;
    for (const resource of resources) {
      try {
        const routeName = `store.api.sync.${resource}`;
        const response = await axios.get(route(routeName, { store_slug: slug }), { _skipGlobalErrorHandler: true });
        if (response.data && Array.isArray(response.data)) {
          await db$1[resource].clear();
          await db$1[resource].bulkPut(response.data);
          console.log(`[Sync] ${resource} hydrated: ${response.data.length} items.`);
        }
      } catch (e2) {
        console.warn(`[Sync] Failed to hydrate ${resource}:`, e2.message);
      }
    }
    await this.downloadStaff();
  },
  async downloadStaff() {
    try {
      const slug = this.getStoreSlug();
      if (!slug) return;
      const response = await axios.get(route("store.api.sync.users", { store_slug: slug }), { _skipGlobalErrorHandler: true });
      if (response.data && Array.isArray(response.data)) {
        await db$1.users.clear();
        await db$1.users.bulkPut(response.data);
      }
    } catch (e2) {
      console.error("[Sync] Staff download failed:", e2);
    }
  }
};
function OfflineLockScreen() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [reason, setReason] = useState("Offline limit exceeded.");
  useEffect(() => {
    checkAccess();
    const handleOnline = () => checkAccess();
    window.addEventListener("online", handleOnline);
    const expiryPoll = setInterval(checkAccess, 60 * 1e3);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(expiryPoll);
    };
  }, []);
  const checkAccess = async () => {
    const { blocked, message } = await SyncService.checkLicensing();
    setIsBlocked(blocked);
    if (message) setReason(message);
  };
  const checkConnection = () => {
    checkAccess();
    if (isBlocked) {
      const btn = document.getElementById("retry-btn");
      btn?.classList.add("animate-shake");
      setTimeout(() => btn?.classList.remove("animate-shake"), 500);
    }
  };
  if (!isBlocked) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] animate-pulse" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse", style: { animationDelay: "1s" } })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-md", children: [
      /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow", children: /* @__PURE__ */ jsx(WifiOff, { size: 40, className: "text-red-500" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-white mb-3 tracking-tight", children: "Access Suspended" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-300 mb-8 text-lg leading-relaxed", children: reason }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            id: "retry-btn",
            onClick: checkConnection,
            className: "w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3",
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { size: 20 }),
              "Retry Connection"
            ]
          }
        ),
        !showGame && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowGame(true),
            className: "w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-3",
            children: [
              /* @__PURE__ */ jsx(MonitorX, { size: 20 }),
              "I'm bored, let's play"
            ]
          }
        )
      ] }),
      showGame && /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-8 border-t border-white/10 animate-in slide-in-from-bottom-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "aspect-video bg-black rounded-xl overflow-hidden border border-white/20 relative", children: [
          /* @__PURE__ */ jsx(
            "iframe",
            {
              src: "https://chromedino.com/",
              className: "w-full h-full opacity-80",
              title: "Offline Game",
              frameBorder: "0"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-3 font-mono", children: "Connection will auto-retry in the background." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
                .animate-bounce-slow {
                    animation: bounce 3s infinite;
                }
            ` })
  ] });
}
let dialogQueue = [];
let setDialogExternal = null;
const GlobalDialogOverride = () => {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);
  useEffect(() => {
    setDialogExternal = setDialog;
    if (dialogQueue.length > 0) {
      const next = dialogQueue.shift();
      showDialogInternal(next.type, next.message, next.title, next.resolve);
    }
    return () => {
      setDialogExternal = null;
    };
  }, []);
  const closeDialog = useCallback((result) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setDialog(null);
    if (dialogQueue.length > 0) {
      const next = dialogQueue.shift();
      setTimeout(() => {
        showDialogInternal(next.type, next.message, next.title, next.resolve);
      }, 100);
    }
  }, []);
  useEffect(() => {
    if (dialog && dialog.resolve) {
      resolveRef.current = dialog.resolve;
    }
  }, [dialog]);
  const detectAlertType = (message) => {
    const msg = String(message || "").toLowerCase();
    if (msg.includes("error") || msg.includes("failed") || msg.includes("❌") || msg.includes("permanently")) {
      return "error";
    }
    if (msg.includes("success") || msg.includes("✅") || msg.includes("recorded") || msg.includes("created") || msg.includes("deleted") || msg.includes("sent")) {
      return "success";
    }
    if (msg.includes("warning") || msg.includes("sure") || msg.includes("confirm") || msg.includes("convert") || msg.includes("delete") || msg.includes("cancel") || msg.includes("discard")) {
      return "warning";
    }
    return "info";
  };
  const getIcon = (type) => {
    switch (type) {
      case "success":
        return /* @__PURE__ */ jsx(CheckCircle2, { size: 48, className: "text-emerald-500" });
      case "error":
        return /* @__PURE__ */ jsx(XCircle, { size: 48, className: "text-red-500" });
      case "warning":
        return /* @__PURE__ */ jsx(AlertTriangle, { size: 48, className: "text-amber-500" });
      default:
        return /* @__PURE__ */ jsx(Info, { size: 48, className: "text-indigo-500" });
    }
  };
  const getIconBg = (type) => {
    switch (type) {
      case "success":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      case "error":
        return "bg-red-100 dark:bg-red-900/30";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/30";
      default:
        return "bg-indigo-100 dark:bg-indigo-900/30";
    }
  };
  const getButtonClass = (type, isConfirm = false) => {
    if (isConfirm) {
      return "bg-red-500 hover:bg-red-600 shadow-red-500/20";
    }
    switch (type) {
      case "success":
        return "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20";
      case "error":
        return "bg-red-500 hover:bg-red-600 shadow-red-500/20";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20";
      default:
        return "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20";
    }
  };
  useEffect(() => {
    if (!dialog) return;
    const handleKeyDown = (e2) => {
      if (e2.key === "Escape") {
        closeDialog(dialog.type === "confirm" ? false : true);
      } else if (e2.key === "Enter") {
        closeDialog(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog, closeDialog]);
  if (!dialog) return null;
  const alertType = detectAlertType(dialog.message);
  return createPortal(
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[99999] flex items-center justify-center p-4", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150",
          onClick: () => closeDialog(dialog.type === "confirm" ? false : true)
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-200 overflow-hidden border border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center p-6 pt-8", children: [
        /* @__PURE__ */ jsx("div", { className: `mb-4 w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300 ${getIconBg(alertType)}`, children: getIcon(alertType) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-800 dark:text-white mb-2", children: dialog.title }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-300 mb-8 max-w-xs leading-relaxed text-sm", children: dialog.message }),
        /* @__PURE__ */ jsxs("div", { className: "flex w-full gap-3", children: [
          dialog.type === "confirm" && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => closeDialog(false),
              className: "flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => closeDialog(true),
              autoFocus: true,
              className: `flex-1 py-3 font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 ${getButtonClass(alertType, dialog.type === "confirm")}`,
              children: dialog.type === "confirm" ? "Yes, Continue" : "OK"
            }
          )
        ] })
      ] }) })
    ] }),
    document.body
  );
};
function showDialogInternal(type, message, title, resolve) {
  if (setDialogExternal) {
    setDialogExternal({
      type,
      message,
      title,
      resolve
    });
  }
}
if (typeof window !== "undefined") {
  const nativeAlert = window.alert;
  const nativeConfirm = window.confirm;
  window.alert = function(message) {
    return new Promise((resolve) => {
      if (setDialogExternal) {
        showDialogInternal("alert", message, "Notice", resolve);
      } else {
        dialogQueue.push({ type: "alert", message, title: "Notice", resolve });
      }
    });
  };
  window.confirm = function(message) {
    return new Promise((resolve) => {
      if (setDialogExternal) {
        showDialogInternal("confirm", message, "Confirm", resolve);
      } else {
        dialogQueue.push({ type: "confirm", message, title: "Confirm", resolve });
      }
    });
  };
  window._nativeAlert = nativeAlert;
  window._nativeConfirm = nativeConfirm;
}
function PasscodeModal({ isOpen, onClose, onSuccess, externalError, settings: propSettings }) {
  const { settings: sharedSettings } = usePage().props;
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const expectedLength = 6;
  useEffect(() => {
    if (externalError) {
      setError(true);
      setTimeout(() => setError(false), 600);
    }
  }, [externalError]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e2) => {
      const key = e2.key;
      if (/^[0-9]$/.test(key)) {
        handleNumberClick(key);
      } else if (key === "Backspace") {
        handleDelete();
      } else if (key === "Escape") {
        onClose();
      } else if (key === "Enter") {
        e2.preventDefault();
        verifyPasscode(input);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, input]);
  const handleNumberClick = (num) => {
    if (input.length < 6) {
      const newInput = input + num;
      setInput(newInput);
      if (newInput.length === expectedLength) {
        setTimeout(() => verifyPasscode(newInput), 100);
      } else {
        setError(false);
      }
    }
  };
  const handleDelete = () => {
    setInput((prev) => prev.slice(0, -1));
    setError(false);
  };
  const verifyPasscode = (code) => {
    if (code.length < expectedLength) return;
    setInput("");
    setError(false);
    onSuccess(code);
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden scale-100 animate-in zoom-in-95 duration-200", onClick: (e2) => e2.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 text-center border-b border-slate-100 dark:border-slate-800 relative", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors",
          children: /* @__PURE__ */ jsx(X, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400", children: /* @__PURE__ */ jsx(Lock, { size: 24 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Admin Access" }),
      /* @__PURE__ */ jsx("div", { className: "h-4" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "py-8 bg-slate-50 dark:bg-slate-800/50 flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "flex gap-3", children: [...Array(6)].map((_2, i2) => /* @__PURE__ */ jsx(
      "div",
      {
        className: `w-4 h-4 rounded-full transition-all duration-200 ${i2 < input.length ? "bg-indigo-600 scale-110" : "bg-slate-300 dark:bg-slate-700"} ${error ? "bg-red-500 animate-pulse" : ""}`
      },
      i2
    )) }) }),
    error && /* @__PURE__ */ jsx("p", { className: "text-center text-red-500 text-xs font-bold -mt-4 mb-4 animate-bounce", children: "Incorrect PIN" }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 grid grid-cols-3 gap-4", children: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleNumberClick(num.toString()),
          className: "h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:scale-105 transition-all active:scale-95",
          children: num
        },
        num
      )),
      /* @__PURE__ */ jsx("div", { className: "col-start-1", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => verifyPasscode(input),
          className: "w-full h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 hover:shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center",
          children: /* @__PURE__ */ jsx(Check, { size: 28 })
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "col-start-2", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleNumberClick("0"),
          className: "w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:scale-105 transition-all active:scale-95",
          children: "0"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "col-start-3", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleDelete,
          className: "w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all flex items-center justify-center active:scale-95",
          children: /* @__PURE__ */ jsx(Delete, { size: 24 })
        }
      ) })
    ] })
  ] }) });
}
const useGlobalShortcuts = () => {
  const { store } = usePage().props;
  useEffect(() => {
    if (!store?.slug) return;
    const handleKeyDown = (e2) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(e2.target.tagName);
      if (e2.shiftKey && !e2.ctrlKey && !e2.altKey && !isInput) {
        switch (e2.key.toLowerCase()) {
          case "h":
            e2.preventDefault();
            router.visit(route("store.dashboard", {
              store_slug: store.slug
            }));
            break;
          case "p":
            e2.preventDefault();
            router.visit(route("store.parties.index", {
              store_slug: store.slug
            }));
            break;
          case "i":
            e2.preventDefault();
            router.visit(route("store.inventory.index", {
              store_slug: store.slug
            }));
            break;
          case "r":
            e2.preventDefault();
            router.visit(route("store.reports.index", {
              store_slug: store.slug
            }));
            break;
          case "b":
            e2.preventDefault();
            router.visit(route("store.bank-accounts.index", { store_slug: store.slug }));
            break;
          case "c":
            e2.preventDefault();
            router.visit(route("store.funds.index", { store_slug: store.slug }));
            break;
          case "e":
            e2.preventDefault();
            router.visit(route("store.expenses.index", { store_slug: store.slug }));
            break;
          case "o":
            e2.preventDefault();
            router.visit(route("store.pre-sales.index", {
              store_slug: store.slug
            }));
            break;
          case "s":
            e2.preventDefault();
            router.visit(route("store.proposals.index", {
              store_slug: store.slug
            }));
            break;
          // case 'u': // Cheques (Not mapped yet)
          case "1":
            e2.preventDefault();
            router.visit(route("store.admin.settings", { store_slug: store.slug }));
            break;
          case "4":
            e2.preventDefault();
            router.visit(route("store.notifications.index", { store_slug: store.slug }));
            break;
          case "6":
            e2.preventDefault();
            router.visit(route("store.invoice-reminders.index", { store_slug: store.slug }));
            break;
          case "2":
            e2.preventDefault();
            router.visit(route("store.labels.index", { store_slug: store.slug }));
            break;
        }
      }
      if (e2.altKey && !e2.ctrlKey && !e2.shiftKey) {
        switch (e2.key.toLowerCase()) {
          case "s":
            e2.preventDefault();
            router.visit(route("store.sales.index", {
              store_slug: store.slug
            }));
            break;
          case "p":
            e2.preventDefault();
            router.visit(route("store.purchases.create", {
              store_slug: store.slug
            }));
            break;
          case "i":
            e2.preventDefault();
            router.visit(route("store.payments.in", { store_slug: store.slug }));
            break;
          case "o":
            e2.preventDefault();
            router.visit(route("store.payments.out", { store_slug: store.slug }));
            break;
          case "e":
            e2.preventDefault();
            router.visit(route("store.expenses.index", { store_slug: store.slug }));
            break;
          case "n":
            e2.preventDefault();
            router.visit(route("store.parties.index", {
              store_slug: store.slug
            }));
            break;
          case "a":
            e2.preventDefault();
            router.visit(route("store.inventory.index", {
              store_slug: store.slug
            }));
            break;
          case "f":
            e2.preventDefault();
            router.visit(route("store.pre-sales.create", {
              store_slug: store.slug
            }));
            break;
          case "g":
            e2.preventDefault();
            router.visit(route("store.purchase-orders.create", { store_slug: store.slug }));
            break;
          // case 'd': // Delivery Challan
          case "m":
            e2.preventDefault();
            router.visit(route("store.proposals.create", {
              store_slug: store.slug
            }));
            break;
          case "r":
            e2.preventDefault();
            router.visit(route("store.returns.create", { store_slug: store.slug }));
            break;
          // case 'l': // Purchase Return
          case "b":
            e2.preventDefault();
            router.visit(route("store.bank-accounts.index", { store_slug: store.slug }));
            break;
          case "z":
            e2.preventDefault();
            router.visit(route("store.pos", {
              store_slug: store.slug
            }));
            break;
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
};
function Modal({
  children,
  show = false,
  maxWidth = "2xl",
  closeable = true,
  onClose = () => {
  },
  zIndex = "z-50"
}) {
  const close = () => {
    if (closeable) {
      onClose();
    }
  };
  const maxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl"
  }[maxWidth];
  return /* @__PURE__ */ jsx(Transition, { show, leave: "duration-200", children: /* @__PURE__ */ jsxs(
    Dialog,
    {
      as: "div",
      id: "modal",
      className: `fixed inset-0 ${zIndex} flex transform items-center overflow-y-auto px-4 py-6 transition-all sm:px-0`,
      onClose: close,
      children: [
        /* @__PURE__ */ jsx(
          TransitionChild,
          {
            enter: "ease-out duration-300",
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            leave: "ease-in duration-200",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gray-500/75 dark:bg-gray-900/75" })
          }
        ),
        /* @__PURE__ */ jsx(
          TransitionChild,
          {
            enter: "ease-out duration-300",
            enterFrom: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
            enterTo: "opacity-100 translate-y-0 sm:scale-100",
            leave: "ease-in duration-200",
            leaveFrom: "opacity-100 translate-y-0 sm:scale-100",
            leaveTo: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
            children: /* @__PURE__ */ jsx(
              DialogPanel,
              {
                className: `mb-6 transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:mx-auto sm:w-full dark:bg-gray-800 ${maxWidthClass}`,
                children
              }
            )
          }
        )
      ]
    }
  ) });
}
function KeyboardShortcutsModal({ isOpen, onClose, mode = "global" }) {
  useEffect(() => {
    const handleKeyDown = (e2) => {
      if (e2.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  const globalShortcuts = {
    "Navigation (SHIFT + Key)": [
      { key: "H", desc: "Home / Dashboard" },
      { key: "P", desc: "Parties List" },
      { key: "I", desc: "Inventory / Items" },
      { key: "R", desc: "Reports Hub" },
      { key: "B", desc: "Bank Accounts" },
      { key: "C", desc: "Cash / Funds" },
      { key: "E", desc: "Expenses" },
      { key: "O", desc: "Sales Orders" },
      { key: "S", desc: "Estimates" },
      { key: "1", desc: "Settings" }
    ],
    "Creation & Actions (ALT + Key)": [
      { key: "S", desc: "New Sale" },
      { key: "P", desc: "New Purchase" },
      { key: "I", desc: "Payment In" },
      { key: "O", desc: "Payment Out" },
      { key: "E", desc: "Add Expense" },
      { key: "N", desc: "Add Party" },
      { key: "A", desc: "Add Item" },
      { key: "Z", desc: "Open POS Terminal" }
    ],
    "System": [
      { key: "ESC", desc: "Close Modals" }
    ]
  };
  const posShortcuts = {
    "Item Controls": [
      { key: "F1", desc: "Focus Search" },
      { key: "F2", desc: "Change Quantity" },
      { key: "F3", desc: "Item Discount" },
      { key: "F4", desc: "Remove Item" },
      { key: "F5", desc: "Change Price" }
    ],
    "Transaction": [
      { key: "F7", desc: "Override Tax" },
      { key: "F8", desc: "Add Charges" },
      { key: "F9", desc: "Bill Discount" },
      { key: "F11", desc: "Select Customer" },
      { key: "F12", desc: "Sale Remarks" }
    ],
    "System & Save": [
      { key: "Ctrl + S", desc: "Quick Save" },
      { key: "Ctrl + P", desc: "Save & Print" },
      { key: "Ctrl + N", desc: "Save & New" },
      { key: "Ctrl + T", desc: "New Tab" },
      { key: "Ctrl + W", desc: "Close Tab" },
      { key: "Ctrl + R", desc: "Reset Tab" }
    ]
  };
  const content = (mode === "pos" ? posShortcuts : globalShortcuts) || {};
  const title = mode === "pos" ? "POS Terminal Shortcuts" : "Global Application Shortcuts";
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx(Modal, { show: isOpen, onClose, maxWidth: "2xl", children: /* @__PURE__ */ jsxs("div", { className: "p-6 text-gray-900 dark:text-gray-100", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-2", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("kbd", { className: "px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm", children: "⌨" }),
        /* @__PURE__ */ jsx("span", { children: title })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300", children: "✕" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: Object.entries(content).map(([category, items]) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider", children: category }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: (Array.isArray(items) ? items : []).map((item, idx) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between items-center text-sm group hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1 transition-colors", children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100", children: item.desc }),
        /* @__PURE__ */ jsx("kbd", { className: "px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono font-bold text-gray-500 dark:text-gray-400", children: item.key })
      ] }, idx)) })
    ] }, category)) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400", children: [
      "Press ",
      /* @__PURE__ */ jsx("kbd", { className: "font-bold", children: "Esc" }),
      " to close this reference."
    ] })
  ] }) });
}
const ThemeContext = createContext();
const ThemeProvider = ({ children, settings = {} }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("amd_theme");
    if (saved) return saved === "dark";
    const defaultDark = settings.dark_mode_default;
    if (defaultDark !== void 0 && defaultDark !== null) {
      return defaultDark === "1" || defaultDark === 1 || defaultDark === true || defaultDark === "true" || defaultDark === "on";
    }
    return true;
  });
  useEffect(() => {
    const defaultDark = settings.dark_mode_default;
    if (defaultDark !== void 0 && defaultDark !== null) {
      const isDarkSetting = defaultDark === "1" || defaultDark === 1 || defaultDark === true || defaultDark === "true" || defaultDark === "on";
      const saved = localStorage.getItem("amd_theme");
      if (!saved) {
        setIsDarkMode(isDarkSetting);
      }
    }
  }, [settings.dark_mode_default]);
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("amd_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("amd_theme", "light");
    }
  }, [isDarkMode]);
  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: { isDarkMode, setIsDarkMode, toggleTheme }, children });
};
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return { isDarkMode: true, setIsDarkMode: () => {
    }, toggleTheme: () => {
    } };
  }
  return context;
};
const db = new Dexie("VenQoreChatbotDB");
db.version(1).stores({
  sessions: "session_uuid, status, visitor_name, visitor_email, updated_at",
  messages: "++id, session_uuid, sender_type, sender_name, body, created_at"
});
function ChatWidget() {
  const { store, auth } = usePage().props;
  const { url } = usePage();
  const showMobileNavBar = (() => {
    if (!auth?.user) return false;
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
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [confirmNewChat, setConfirmNewChat] = useState(false);
  const [visitorName, setVisitorName] = useState(auth?.user?.name || "Guest");
  const [visitorEmail, setVisitorEmail] = useState(auth?.user?.email || "");
  const [messageText, setMessageText] = useState("");
  const [sessionUuid, setSessionUuid] = useState(() => {
    if (!store) return null;
    return localStorage.getItem(`vq_chat_uuid_${store.id}`) || null;
  });
  const [sessionStatus, setSessionStatus] = useState("bot_active");
  const [venaContext, setVenaContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  useRef(null);
  const activeChannel = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (store) {
      const cachedUuid = localStorage.getItem(`vq_chat_uuid_${store.id}`);
      if (cachedUuid && cachedUuid !== sessionUuid) {
        setSessionUuid(cachedUuid);
      }
    }
  }, [store]);
  useEffect(() => {
    if (auth?.user) {
      setVisitorName(auth.user.name || "Guest");
      setVisitorEmail(auth.user.email || "");
    }
  }, [auth]);
  useEffect(() => {
    if (sessionUuid && store) restoreSession();
  }, [sessionUuid, store]);
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, typing, isOpen]);
  useEffect(() => {
    const onKey = (e2) => {
      if (e2.key === "Escape" && isExpanded) setIsExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isExpanded]);
  useEffect(() => {
    if ((isOpen || isExpanded) && !started && !loading && !sessionUuid && store) {
      handleStartSession();
    }
  }, [isOpen, isExpanded, started, loading, sessionUuid, store]);
  const fetchVenaContext = async () => {
    try {
      const res = await axios.get(`/api/${store.slug}/vena/context`);
      setVenaContext(res.data);
    } catch (err) {
      console.warn("Vena: Could not fetch subscription context.", err);
    }
  };
  const restoreSession = async () => {
    setLoading(true);
    try {
      const cachedMsgs = await db.messages.where("session_uuid").equals(sessionUuid).sortBy("created_at");
      if (cachedMsgs.length > 0) {
        setMessages(cachedMsgs);
        setStarted(true);
      }
      const res = await axios.post(`/api/${store.slug}/chatbot/session`, { session_uuid: sessionUuid });
      const data = res.data;
      setSessionStatus(data.status);
      setVisitorName(data.visitor_name);
      setVisitorEmail(data.visitor_email);
      if (data.messages?.length > 0) {
        setMessages(data.messages);
        setStarted(true);
        await db.transaction("rw", db.messages, async () => {
          await db.messages.where("session_uuid").equals(sessionUuid).delete();
          await db.messages.bulkAdd(data.messages.map((m2) => ({
            session_uuid: sessionUuid,
            sender_type: m2.sender_type,
            sender_name: m2.sender_name,
            body: m2.body,
            created_at: m2.created_at
          })));
        });
      }
      initializeEcho(sessionUuid);
      fetchVenaContext();
    } catch (err) {
      console.error("Failed to sync chat session:", err);
      setStarted(true);
    } finally {
      setLoading(false);
    }
  };
  const handleStartSession = async (e2) => {
    setLoading(true);
    try {
      const name = auth?.user?.name || "Guest";
      const email = auth?.user?.email || null;
      const res = await axios.post(`/api/${store?.slug}/chatbot/session`, {
        visitor_name: name,
        visitor_email: email
      });
      const data = res.data;
      setSessionUuid(data.session_uuid);
      setSessionStatus(data.status);
      localStorage.setItem(`vq_chat_uuid_${store?.id}`, data.session_uuid);
      await db.sessions.put({
        session_uuid: data.session_uuid,
        status: data.status,
        visitor_name: name,
        visitor_email: email,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      setMessages([]);
      setStarted(true);
      initializeEcho(data.session_uuid);
      fetchVenaContext();
    } catch (err) {
      console.error("Failed to start session:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleNewChat = () => {
    setConfirmNewChat(false);
    if (activeChannel.current) {
      activeChannel.current.stopListening(".MessageSent").stopListening(".TypingStarted").stopListening(".TypingStopped").stopListening(".SessionStatusChanged");
      activeChannel.current = null;
    }
    localStorage.removeItem(`vq_chat_uuid_${store.id}`);
    setSessionUuid(null);
    setMessages([]);
    setStarted(false);
    setSessionStatus("bot_active");
    setVisitorName("");
    setVisitorEmail("");
    setMessageText("");
    setTyping(false);
    setVenaContext(null);
  };
  const initializeEcho = (uuid) => {
    return;
  };
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || messageText;
    if (!text.trim() || sending) return;
    if (!textToSend) setMessageText("");
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_type: "visitor",
      sender_name: visitorName || "Guest",
      body: text,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);
    try {
      handleVisitorTyping(false);
      const res = await axios.post(`/api/${store.slug}/chatbot/session/${sessionUuid}/message`, {
        body: text,
        vena_context: venaContext || null
      });
      if (res.data.success) {
        const serverMsg = res.data.message;
        setMessages((prev) => prev.map((m2) => m2.id === tempId ? serverMsg : m2));
        await db.messages.add({
          session_uuid: sessionUuid,
          sender_type: serverMsg.sender_type,
          sender_name: serverMsg.sender_name,
          body: serverMsg.body,
          created_at: serverMsg.created_at
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        sender_type: "system",
        sender_name: "System",
        body: "We are experiencing a brief connection issue. Your message has been saved and a support team member will follow up shortly.",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };
  const handleVisitorTyping = (isTyping) => {
    if (!sessionUuid) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    axios.post(`/api/${store.slug}/chatbot/session/${sessionUuid}/typing`, { typing: isTyping });
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => handleVisitorTyping(false), 4e3);
    }
  };
  const executeAction = (actionName) => {
    const routes = {
      pos: "store.pos",
      create_invoice: "store.sales.invoice.create",
      expenses: "store.expenses.index",
      invoices: "store.sales.dashboard",
      settings: "store.settings"
    };
    if (actionName === "handoff") {
      handleSendMessage("I need to speak with a member of your support team, please.");
      return;
    }
    if (routes[actionName]) {
      setIsOpen(false);
      setIsExpanded(false);
      router.visit(route(routes[actionName], { store_slug: store.slug }));
    }
  };
  const renderMessageBody = (body) => {
    const regex = /\[([^\]]+)\]\(action:([a-zA-Z0-9_-]+)\)/g;
    let lastIndex = 0;
    const result = [];
    let match;
    while ((match = regex.exec(body)) !== null) {
      const textBefore = body.slice(lastIndex, match.index);
      if (textBefore) result.push(/* @__PURE__ */ jsx("span", { className: "whitespace-pre-wrap", children: textBefore }, lastIndex));
      result.push(
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => executeAction(match[2]),
            className: "inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mx-0.5 bg-slate-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all duration-200",
            children: [
              /* @__PURE__ */ jsx(Play, { size: 10, className: "fill-indigo-600 dark:fill-indigo-400 stroke-none" }),
              match[1]
            ]
          },
          match.index
        )
      );
      lastIndex = regex.lastIndex;
    }
    const textAfter = body.slice(lastIndex);
    if (textAfter) result.push(/* @__PURE__ */ jsx("span", { className: "whitespace-pre-wrap", children: textAfter }, lastIndex));
    return result.length > 0 ? result : body;
  };
  const renderChatBody = () => /* @__PURE__ */ jsx(Fragment$1, { children: !started ? /* @__PURE__ */ jsxs("div", { className: "flex-1 p-8 flex flex-col items-center justify-center relative z-10 text-center space-y-4", children: [
    /* @__PURE__ */ jsx(Loader2, { className: "animate-spin text-indigo-500", size: 32 }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400 font-medium", children: "Connecting to support..." })
  ] }) : (
    /* Message stream */
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar", children: [
        messages.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center p-6 space-y-2 opacity-60", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 24, className: "text-indigo-500 animate-pulse" }),
          /* @__PURE__ */ jsx("h5", { className: "text-xs font-black text-slate-700 dark:text-slate-200", children: "Start a Conversation" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 max-w-[200px]", children: "Send a message and our support team will reply instantly." })
        ] }),
        messages.map((m2, i2) => {
          const isVisitor = m2.sender_type === "visitor";
          const isBot = m2.sender_type === "bot";
          const isSystem = m2.sender_type === "system";
          if (isSystem) return null;
          return /* @__PURE__ */ jsx("div", { className: `flex ${isVisitor ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-150`, children: /* @__PURE__ */ jsxs("div", { className: `max-w-[75%] rounded-2xl px-4 py-3 text-xs shadow-sm ${isVisitor ? "bg-indigo-600 text-white rounded-tr-none font-medium" : isBot ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none leading-relaxed" : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 rounded-tl-none leading-relaxed"}`, children: [
            /* @__PURE__ */ jsx("div", { className: "text-[9px] font-black uppercase tracking-wider mb-1 opacity-70", children: isVisitor ? "You" : "Support" }),
            /* @__PURE__ */ jsx("p", { className: "whitespace-pre-line leading-relaxed", children: renderMessageBody(m2.body) })
          ] }) }, i2);
        }),
        typing && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-slate-400 font-medium py-1.5 animate-pulse", children: [
          /* @__PURE__ */ jsx(Loader2, { size: 10, className: "animate-spin text-slate-300" }),
          /* @__PURE__ */ jsx("span", { children: "Support is typing..." })
        ] }),
        /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
      ] }),
      !messages.some((m2) => m2.sender_type === "visitor") && /* @__PURE__ */ jsx("div", { className: "px-6 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 shrink-0", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: [["🛒 POS", "pos"], ["📄 Invoice", "create_invoice"], ["💸 Expenses", "expenses"]].map(([label, action]) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => executeAction(action),
          className: "p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1 shadow-sm transition-all duration-200 active:scale-95 rounded-xl",
          children: label
        },
        action
      )) }) }),
      /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shrink-0", children: /* @__PURE__ */ jsxs("form", { onSubmit: (e2) => {
        e2.preventDefault();
        handleSendMessage();
      }, className: "flex gap-2 relative items-center", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: messageText,
            onChange: (e2) => {
              setMessageText(e2.target.value);
              handleVisitorTyping(e2.target.value.length > 0);
            },
            className: "flex-1 pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white transition-all font-sans placeholder-slate-400",
            placeholder: "Type your message here...",
            disabled: sending
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: !messageText.trim() || sending,
            className: "absolute right-1.5 p-2 bg-indigo-600 hover:bg-indigo-700 active:scale-90 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:active:scale-100 flex items-center justify-center",
            children: /* @__PURE__ */ jsx(Send, { size: 14 })
          }
        )
      ] }) })
    ] })
  ) });
  const renderHeader = (closeFn) => /* @__PURE__ */ jsxs("div", { className: "px-5 py-4 bg-slate-900 text-white shrink-0 relative flex items-center justify-between border-b border-slate-800/80", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "animate-pulse" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-black tracking-tight flex items-center gap-1.5", children: [
          "Support",
          sessionStatus === "agent_active" && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5", children: "Online" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 relative z-10", children: [
      started && (confirmNewChat ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 font-medium mr-1", children: "Start over?" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleNewChat,
            className: "px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black transition-all active:scale-90",
            children: "Yes"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setConfirmNewChat(false),
            className: "px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-[10px] font-black transition-all active:scale-90",
            children: "No"
          }
        )
      ] }) : /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setConfirmNewChat(true),
          title: "Start a new chat",
          className: "w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 active:scale-90",
          children: /* @__PURE__ */ jsx(RotateCcw, { size: 13 })
        }
      )),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIsExpanded((v2) => !v2),
          title: isExpanded ? "Collapse chat" : "Expand to sidebar",
          className: "w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 active:scale-90",
          children: isExpanded ? /* @__PURE__ */ jsx(Minimize2, { size: 13 }) : /* @__PURE__ */ jsx(Maximize2, { size: 13 })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: closeFn,
          className: "w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 active:scale-90",
          children: /* @__PURE__ */ jsx(X, { size: 14 })
        }
      )
    ] })
  ] });
  if (!store) return null;
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    isExpanded && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998] transition-opacity duration-300",
        onClick: () => setIsExpanded(false)
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `fixed top-0 right-0 h-full z-[9999] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 ease-out font-sans ${isExpanded ? "translate-x-0 w-[420px]" : "translate-x-full w-[420px]"}`,
        style: { isolation: "isolate" },
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" }),
          renderHeader(() => {
            setIsExpanded(false);
            setIsOpen(false);
          }),
          renderChatBody()
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: `fixed right-6 z-[55] font-sans transition-all duration-300 ${showMobileNavBar ? "bottom-[100px] lg:bottom-6" : "bottom-6"}`, style: { isolation: "isolate" }, children: [
      isOpen && !isExpanded && /* @__PURE__ */ jsxs("div", { className: "mb-4 w-96 h-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-[50px] pointer-events-none" }),
        renderHeader(() => setIsOpen(false)),
        renderChatBody()
      ] }),
      !isExpanded && /* @__PURE__ */ jsxs(
        "button",
        {
          id: "tour-chat-widget-btn",
          onClick: () => setIsOpen((v2) => !v2),
          className: "w-14 h-14 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 hover:text-white shadow-2xl flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-300 group relative overflow-hidden",
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" }),
            /* @__PURE__ */ jsx("div", { className: "relative z-10 flex items-center justify-center", children: isOpen ? /* @__PURE__ */ jsx(X, { size: 22, className: "animate-in spin-in-90 duration-300" }) : /* @__PURE__ */ jsx(MessageSquare, { size: 22, className: "animate-in zoom-in duration-300" }) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            ` })
  ] });
}
function GlobalProviderLayout({ children }) {
  const { props } = usePage();
  const settings = props.settings || {};
  return /* @__PURE__ */ jsx(ThemeProvider, { settings, children: /* @__PURE__ */ jsx(InnerGlobalLayout, { settings, children }) });
}
function InnerGlobalLayout({ children, settings }) {
  const { props, url } = usePage();
  const [showExitModal, setShowExitModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showUpdateOverlay, setShowUpdateOverlay] = useState(false);
  const currentPath = typeof window !== "undefined" ? window.location.pathname : url || "/";
  const isInstaller = currentPath.startsWith("/installer");
  const isPublicPrefix = ["/gift/", "/blog/", "/invitation/", "/join/", "/tools/", "/tools"].some((prefix) => currentPath.startsWith(prefix));
  const isMarketing = [
    "/",
    "/features",
    "/pricing",
    "/about",
    "/contact",
    "/blog",
    "/terms",
    "/privacy",
    "/demo",
    "/demo-expired",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password"
  ].some((path) => currentPath === path || currentPath === path + "/") || isPublicPrefix;
  useGlobalShortcuts();
  useEffect(() => {
    const handleSystemUpdate = () => {
      if (!showUpdateOverlay) {
        setShowUpdateOverlay(true);
      }
    };
    window.addEventListener("amd:system-update-in-progress", handleSystemUpdate);
    return () => {
      window.removeEventListener("amd:system-update-in-progress", handleSystemUpdate);
    };
  }, [showUpdateOverlay]);
  useEffect(() => {
    if (!showUpdateOverlay) return;
    const pollInterval = setInterval(() => {
      fetch("/up", { method: "GET", cache: "no-store" }).then((res) => {
        if (res.status === 200 || res.status === 204 || res.status === 404) {
          clearInterval(pollInterval);
          window.location.reload();
        }
      }).catch(() => {
      });
    }, 3500);
    return () => clearInterval(pollInterval);
  }, [showUpdateOverlay]);
  useEffect(() => {
    if (isInstaller || isMarketing) {
      return;
    }
    SyncService.runBackgroundSync();
    const interval = setInterval(() => {
      SyncService.runBackgroundSync();
    }, 30 * 60 * 1e3);
    const handleExitRequest = () => {
      console.log("[Global] Exit Request Received");
      setShowExitModal(true);
    };
    let cleanup = () => {
    };
    if (window.amdAPI && window.amdAPI.onExitRequest) {
      cleanup = window.amdAPI.onExitRequest(handleExitRequest);
    } else {
      window.addEventListener("amd:request-exit-auth", handleExitRequest);
      cleanup = () => window.removeEventListener("amd:request-exit-auth", handleExitRequest);
    }
    window.handleAMDExit = handleExitRequest;
    return () => {
      clearInterval(interval);
      cleanup();
      if (window.handleAMDExit) delete window.handleAMDExit;
    };
  }, []);
  const handleExitSuccess = (code) => {
    console.log("[Global] Exit Authorized. Terminating...");
    if (window.amdAPI) {
      window.amdAPI.forceClose();
    } else {
      window.close();
      setShowExitModal(false);
    }
  };
  const isPosCtx = currentPath.includes("/pos");
  const showVena = (() => {
    if (isInstaller || isMarketing) return false;
    if (!props.store?.features?.live_chat_widget) return false;
    const path = currentPath;
    const blockedPatterns = [
      "/pos",
      "/create",
      "/edit",
      "/new-store",
      "/setup",
      "/purchase-orders",
      "/sales-orders",
      "/proposals",
      "/returns",
      "/debit-notes",
      "/presale",
      "/pre-sales",
      "/sales",
      "/purchases"
    ];
    if (blockedPatterns.some((p2) => path.toLowerCase().includes(p2.toLowerCase()))) return false;
    return true;
  })();
  return /* @__PURE__ */ jsx(WorkspaceProvider, { settings, children: /* @__PURE__ */ jsx(AttendanceProvider, { children: /* @__PURE__ */ jsxs(AlertProvider, { children: [
    !isInstaller && !isMarketing && /* @__PURE__ */ jsx(OfflineLockScreen, {}),
    /* @__PURE__ */ jsx(
      PasscodeModal,
      {
        isOpen: showExitModal,
        onClose: () => setShowExitModal(false),
        onSuccess: (code) => handleExitSuccess(),
        settings
      }
    ),
    /* @__PURE__ */ jsx(
      KeyboardShortcutsModal,
      {
        isOpen: showShortcuts,
        onClose: () => setShowShortcuts(false),
        mode: isPosCtx ? "pos" : "global"
      }
    ),
    children,
    showUpdateOverlay && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-6 select-none", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-center mb-8 h-24", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute w-20 h-20 rounded-full border border-indigo-500/20 bg-indigo-500/5 animate-ping opacity-60" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-16 h-16 rounded-full border border-indigo-500/30 bg-indigo-500/10 animate-pulse" }),
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 relative z-20", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 animate-spin text-white", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ jsx("path", { d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-extrabold text-slate-100 tracking-tight", children: "System Upgrade in Progress" }),
        /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-xs leading-relaxed max-w-[320px] mx-auto", children: [
          "We are currently applying a live system update to your app. To prevent any data loss, ",
          /* @__PURE__ */ jsx("strong", { className: "text-indigo-400", children: "please do not refresh, close the page, or perform any actions" }),
          " right now."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-3 border-t border-slate-800/60 max-w-[280px] mx-auto", children: /* @__PURE__ */ jsx("p", { className: "text-[11px] font-medium text-amber-400/90 bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-2 leading-relaxed", children: "⚠️ Warning: Any transactions or changes made during this brief period will not be saved." }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 pt-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" }),
          /* @__PURE__ */ jsx("span", { children: "Reconnecting to server..." })
        ] })
      ] })
    ] }) }),
    !isInstaller && !isMarketing && props.auth?.user && !currentPath.startsWith("/VenQore") && currentPath !== "/hub" && /* @__PURE__ */ jsx(
      "div",
      {
        onClick: () => setShowShortcuts(true),
        className: "hidden lg:block fixed bottom-1 left-1 z-[9999] opacity-40 hover:opacity-100 transition-opacity cursor-pointer group",
        title: "View Keyboard Shortcuts",
        children: /* @__PURE__ */ jsxs("div", { className: "bg-black/80 text-white px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 shadow-lg backdrop-blur-sm border border-white/10", children: [
          /* @__PURE__ */ jsx("span", { children: "⌨" }),
          /* @__PURE__ */ jsx("span", { className: "hidden group-hover:inline", children: "Shortcuts" })
        ] })
      }
    ),
    /* @__PURE__ */ jsx(GlobalDialogOverride, {}),
    showVena && /* @__PURE__ */ jsx(ChatWidget, {})
  ] }) }) });
}
function t(t3, e2) {
  for (var n2 = 0; n2 < e2.length; n2++) {
    var r2 = e2[n2];
    r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(t3, u(r2.key), r2);
  }
}
function e(e2, n2, r2) {
  return n2 && t(e2.prototype, n2), Object.defineProperty(e2, "prototype", { writable: false }), e2;
}
function n() {
  return n = Object.assign ? Object.assign.bind() : function(t3) {
    for (var e2 = 1; e2 < arguments.length; e2++) {
      var n2 = arguments[e2];
      for (var r2 in n2) ({}).hasOwnProperty.call(n2, r2) && (t3[r2] = n2[r2]);
    }
    return t3;
  }, n.apply(null, arguments);
}
function r(t3) {
  return r = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t4) {
    return t4.__proto__ || Object.getPrototypeOf(t4);
  }, r(t3);
}
function o() {
  try {
    var t3 = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch (t4) {
  }
  return (o = function() {
    return !!t3;
  })();
}
function i(t3, e2) {
  return i = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t4, e3) {
    return t4.__proto__ = e3, t4;
  }, i(t3, e2);
}
function u(t3) {
  var e2 = (function(t4) {
    if ("object" != typeof t4 || !t4) return t4;
    var e3 = t4[Symbol.toPrimitive];
    if (void 0 !== e3) {
      var n2 = e3.call(t4, "string");
      if ("object" != typeof n2) return n2;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return String(t4);
  })(t3);
  return "symbol" == typeof e2 ? e2 : e2 + "";
}
function f(t3) {
  var e2 = "function" == typeof Map ? /* @__PURE__ */ new Map() : void 0;
  return f = function(t4) {
    if (null === t4 || !(function(t5) {
      try {
        return -1 !== Function.toString.call(t5).indexOf("[native code]");
      } catch (e3) {
        return "function" == typeof t5;
      }
    })(t4)) return t4;
    if ("function" != typeof t4) throw new TypeError("Super expression must either be null or a function");
    if (void 0 !== e2) {
      if (e2.has(t4)) return e2.get(t4);
      e2.set(t4, n2);
    }
    function n2() {
      return (function(t5, e3, n3) {
        if (o()) return Reflect.construct.apply(null, arguments);
        var r2 = [null];
        r2.push.apply(r2, e3);
        var u2 = new (t5.bind.apply(t5, r2))();
        return n3 && i(u2, n3.prototype), u2;
      })(t4, arguments, r(this).constructor);
    }
    return n2.prototype = Object.create(t4.prototype, { constructor: { value: n2, enumerable: false, writable: true, configurable: true } }), i(n2, t4);
  }, f(t3);
}
const c = String.prototype.replace, a = /%20/g, l = { RFC1738: function(t3) {
  return c.call(t3, a, "+");
}, RFC3986: function(t3) {
  return String(t3);
} };
var s = "RFC3986";
const p = Object.prototype.hasOwnProperty, y = Array.isArray, d = (function() {
  const t3 = [];
  for (let e2 = 0; e2 < 256; ++e2) t3.push("%" + ((e2 < 16 ? "0" : "") + e2.toString(16)).toUpperCase());
  return t3;
})(), b = function t2(e2, n2, r2) {
  if (!n2) return e2;
  if ("object" != typeof n2) {
    if (y(e2)) e2.push(n2);
    else {
      if (!e2 || "object" != typeof e2) return [e2, n2];
      (r2 && (r2.plainObjects || r2.allowPrototypes) || !p.call(Object.prototype, n2)) && (e2[n2] = true);
    }
    return e2;
  }
  if (!e2 || "object" != typeof e2) return [e2].concat(n2);
  let o2 = e2;
  return y(e2) && !y(n2) && (o2 = (function(t3, e3) {
    const n3 = e3 && e3.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
    for (let e4 = 0; e4 < t3.length; ++e4) void 0 !== t3[e4] && (n3[e4] = t3[e4]);
    return n3;
  })(e2, r2)), y(e2) && y(n2) ? (n2.forEach(function(n3, o3) {
    if (p.call(e2, o3)) {
      const i2 = e2[o3];
      i2 && "object" == typeof i2 && n3 && "object" == typeof n3 ? e2[o3] = t2(i2, n3, r2) : e2.push(n3);
    } else e2[o3] = n3;
  }), e2) : Object.keys(n2).reduce(function(e3, o3) {
    const i2 = n2[o3];
    return e3[o3] = p.call(e3, o3) ? t2(e3[o3], i2, r2) : i2, e3;
  }, o2);
}, h = 1024, v = function(t3, e2) {
  return [].concat(t3, e2);
}, m = function(t3, e2) {
  if (y(t3)) {
    const n2 = [];
    for (let r2 = 0; r2 < t3.length; r2 += 1) n2.push(e2(t3[r2]));
    return n2;
  }
  return e2(t3);
}, g = Object.prototype.hasOwnProperty, w = { brackets: function(t3) {
  return t3 + "[]";
}, comma: "comma", indices: function(t3, e2) {
  return t3 + "[" + e2 + "]";
}, repeat: function(t3) {
  return t3;
} }, j = Array.isArray, E = Array.prototype.push, O = function(t3, e2) {
  E.apply(t3, j(e2) ? e2 : [e2]);
}, T = Date.prototype.toISOString, R = { addQueryPrefix: false, allowDots: false, allowEmptyArrays: false, arrayFormat: "indices", charset: "utf-8", charsetSentinel: false, delimiter: "&", encode: true, encodeDotInKeys: false, encoder: function(t3, e2, n2, r2, o2) {
  if (0 === t3.length) return t3;
  let i2 = t3;
  if ("symbol" == typeof t3 ? i2 = Symbol.prototype.toString.call(t3) : "string" != typeof t3 && (i2 = String(t3)), "iso-8859-1" === n2) return escape(i2).replace(/%u[0-9a-f]{4}/gi, function(t4) {
    return "%26%23" + parseInt(t4.slice(2), 16) + "%3B";
  });
  let u2 = "";
  for (let t4 = 0; t4 < i2.length; t4 += h) {
    const e3 = i2.length >= h ? i2.slice(t4, t4 + h) : i2, n3 = [];
    for (let t5 = 0; t5 < e3.length; ++t5) {
      let r3 = e3.charCodeAt(t5);
      45 === r3 || 46 === r3 || 95 === r3 || 126 === r3 || r3 >= 48 && r3 <= 57 || r3 >= 65 && r3 <= 90 || r3 >= 97 && r3 <= 122 || "RFC1738" === o2 && (40 === r3 || 41 === r3) ? n3[n3.length] = e3.charAt(t5) : r3 < 128 ? n3[n3.length] = d[r3] : r3 < 2048 ? n3[n3.length] = d[192 | r3 >> 6] + d[128 | 63 & r3] : r3 < 55296 || r3 >= 57344 ? n3[n3.length] = d[224 | r3 >> 12] + d[128 | r3 >> 6 & 63] + d[128 | 63 & r3] : (t5 += 1, r3 = 65536 + ((1023 & r3) << 10 | 1023 & e3.charCodeAt(t5)), n3[n3.length] = d[240 | r3 >> 18] + d[128 | r3 >> 12 & 63] + d[128 | r3 >> 6 & 63] + d[128 | 63 & r3]);
    }
    u2 += n3.join("");
  }
  return u2;
}, encodeValuesOnly: false, format: s, formatter: l[s], indices: false, serializeDate: function(t3) {
  return T.call(t3);
}, skipNulls: false, strictNullHandling: false }, k = {}, S = function(t3, e2, n2, r2, o2, i2, u2, f2, c2, a2, l2, s2, p2, y2, d2, b2, h2, v2) {
  let g2 = t3, w2 = v2, E2 = 0, T2 = false;
  for (; void 0 !== (w2 = w2.get(k)) && !T2; ) {
    const e3 = w2.get(t3);
    if (E2 += 1, void 0 !== e3) {
      if (e3 === E2) throw new RangeError("Cyclic object value");
      T2 = true;
    }
    void 0 === w2.get(k) && (E2 = 0);
  }
  if ("function" == typeof a2 ? g2 = a2(e2, g2) : g2 instanceof Date ? g2 = p2(g2) : "comma" === n2 && j(g2) && (g2 = m(g2, function(t4) {
    return t4 instanceof Date ? p2(t4) : t4;
  })), null === g2) {
    if (i2) return c2 && !b2 ? c2(e2, R.encoder, h2, "key", y2) : e2;
    g2 = "";
  }
  if ("string" == typeof (I2 = g2) || "number" == typeof I2 || "boolean" == typeof I2 || "symbol" == typeof I2 || "bigint" == typeof I2 || (function(t4) {
    return !(!t4 || "object" != typeof t4 || !(t4.constructor && t4.constructor.isBuffer && t4.constructor.isBuffer(t4)));
  })(g2)) return c2 ? [d2(b2 ? e2 : c2(e2, R.encoder, h2, "key", y2)) + "=" + d2(c2(g2, R.encoder, h2, "value", y2))] : [d2(e2) + "=" + d2(String(g2))];
  var I2;
  const A2 = [];
  if (void 0 === g2) return A2;
  let D2;
  if ("comma" === n2 && j(g2)) b2 && c2 && (g2 = m(g2, c2)), D2 = [{ value: g2.length > 0 ? g2.join(",") || null : void 0 }];
  else if (j(a2)) D2 = a2;
  else {
    const t4 = Object.keys(g2);
    D2 = l2 ? t4.sort(l2) : t4;
  }
  const $2 = f2 ? e2.replace(/\./g, "%2E") : e2, N2 = r2 && j(g2) && 1 === g2.length ? $2 + "[]" : $2;
  if (o2 && j(g2) && 0 === g2.length) return N2 + "[]";
  for (let e3 = 0; e3 < D2.length; ++e3) {
    const m2 = D2[e3], w3 = "object" == typeof m2 && void 0 !== m2.value ? m2.value : g2[m2];
    if (u2 && null === w3) continue;
    const T3 = s2 && f2 ? m2.replace(/\./g, "%2E") : m2, R2 = j(g2) ? "function" == typeof n2 ? n2(N2, T3) : N2 : N2 + (s2 ? "." + T3 : "[" + T3 + "]");
    v2.set(t3, E2);
    const I3 = /* @__PURE__ */ new WeakMap();
    I3.set(k, v2), O(A2, S(w3, R2, n2, r2, o2, i2, u2, f2, "comma" === n2 && b2 && j(g2) ? null : c2, a2, l2, s2, p2, y2, d2, b2, h2, I3));
  }
  return A2;
}, I = Object.prototype.hasOwnProperty, A = Array.isArray, D = { allowDots: false, allowEmptyArrays: false, allowPrototypes: false, allowSparse: false, arrayLimit: 20, charset: "utf-8", charsetSentinel: false, comma: false, decodeDotInKeys: false, decoder: function(t3, e2, n2) {
  const r2 = t3.replace(/\+/g, " ");
  if ("iso-8859-1" === n2) return r2.replace(/%[0-9a-f]{2}/gi, unescape);
  try {
    return decodeURIComponent(r2);
  } catch (t4) {
    return r2;
  }
}, delimiter: "&", depth: 5, duplicates: "combine", ignoreQueryPrefix: false, interpretNumericEntities: false, parameterLimit: 1e3, parseArrays: true, plainObjects: false, strictNullHandling: false }, $ = function(t3) {
  return t3.replace(/&#(\d+);/g, function(t4, e2) {
    return String.fromCharCode(parseInt(e2, 10));
  });
}, N = function(t3, e2) {
  return t3 && "string" == typeof t3 && e2.comma && t3.indexOf(",") > -1 ? t3.split(",") : t3;
}, x = function(t3, e2, n2, r2) {
  if (!t3) return;
  const o2 = n2.allowDots ? t3.replace(/\.([^.[]+)/g, "[$1]") : t3, i2 = /(\[[^[\]]*])/g;
  let u2 = n2.depth > 0 && /(\[[^[\]]*])/.exec(o2);
  const f2 = u2 ? o2.slice(0, u2.index) : o2, c2 = [];
  if (f2) {
    if (!n2.plainObjects && I.call(Object.prototype, f2) && !n2.allowPrototypes) return;
    c2.push(f2);
  }
  let a2 = 0;
  for (; n2.depth > 0 && null !== (u2 = i2.exec(o2)) && a2 < n2.depth; ) {
    if (a2 += 1, !n2.plainObjects && I.call(Object.prototype, u2[1].slice(1, -1)) && !n2.allowPrototypes) return;
    c2.push(u2[1]);
  }
  return u2 && c2.push("[" + o2.slice(u2.index) + "]"), (function(t4, e3, n3, r3) {
    let o3 = r3 ? e3 : N(e3, n3);
    for (let e4 = t4.length - 1; e4 >= 0; --e4) {
      let r4;
      const i3 = t4[e4];
      if ("[]" === i3 && n3.parseArrays) r4 = n3.allowEmptyArrays && "" === o3 ? [] : [].concat(o3);
      else {
        r4 = n3.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
        const t5 = "[" === i3.charAt(0) && "]" === i3.charAt(i3.length - 1) ? i3.slice(1, -1) : i3, e5 = n3.decodeDotInKeys ? t5.replace(/%2E/g, ".") : t5, u3 = parseInt(e5, 10);
        n3.parseArrays || "" !== e5 ? !isNaN(u3) && i3 !== e5 && String(u3) === e5 && u3 >= 0 && n3.parseArrays && u3 <= n3.arrayLimit ? (r4 = [], r4[u3] = o3) : "__proto__" !== e5 && (r4[e5] = o3) : r4 = { 0: o3 };
      }
      o3 = r4;
    }
    return o3;
  })(c2, e2, n2, r2);
};
function C(t3, e2) {
  const n2 = /* @__PURE__ */ (function(t4) {
    return D;
  })();
  if ("" === t3 || null == t3) return n2.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
  const r2 = "string" == typeof t3 ? (function(t4, e3) {
    const n3 = { __proto__: null }, r3 = (e3.ignoreQueryPrefix ? t4.replace(/^\?/, "") : t4).split(e3.delimiter, Infinity === e3.parameterLimit ? void 0 : e3.parameterLimit);
    let o3, i3 = -1, u2 = e3.charset;
    if (e3.charsetSentinel) for (o3 = 0; o3 < r3.length; ++o3) 0 === r3[o3].indexOf("utf8=") && ("utf8=%E2%9C%93" === r3[o3] ? u2 = "utf-8" : "utf8=%26%2310003%3B" === r3[o3] && (u2 = "iso-8859-1"), i3 = o3, o3 = r3.length);
    for (o3 = 0; o3 < r3.length; ++o3) {
      if (o3 === i3) continue;
      const t5 = r3[o3], f2 = t5.indexOf("]="), c2 = -1 === f2 ? t5.indexOf("=") : f2 + 1;
      let a2, l2;
      -1 === c2 ? (a2 = e3.decoder(t5, D.decoder, u2, "key"), l2 = e3.strictNullHandling ? null : "") : (a2 = e3.decoder(t5.slice(0, c2), D.decoder, u2, "key"), l2 = m(N(t5.slice(c2 + 1), e3), function(t6) {
        return e3.decoder(t6, D.decoder, u2, "value");
      })), l2 && e3.interpretNumericEntities && "iso-8859-1" === u2 && (l2 = $(l2)), t5.indexOf("[]=") > -1 && (l2 = A(l2) ? [l2] : l2);
      const s2 = I.call(n3, a2);
      s2 && "combine" === e3.duplicates ? n3[a2] = v(n3[a2], l2) : s2 && "last" !== e3.duplicates || (n3[a2] = l2);
    }
    return n3;
  })(t3, n2) : t3;
  let o2 = n2.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
  const i2 = Object.keys(r2);
  for (let e3 = 0; e3 < i2.length; ++e3) {
    const u2 = i2[e3], f2 = x(u2, r2[u2], n2, "string" == typeof t3);
    o2 = b(o2, f2, n2);
  }
  return true === n2.allowSparse ? o2 : (function(t4) {
    const e3 = [{ obj: { o: t4 }, prop: "o" }], n3 = [];
    for (let t5 = 0; t5 < e3.length; ++t5) {
      const r3 = e3[t5], o3 = r3.obj[r3.prop], i3 = Object.keys(o3);
      for (let t6 = 0; t6 < i3.length; ++t6) {
        const r4 = i3[t6], u2 = o3[r4];
        "object" == typeof u2 && null !== u2 && -1 === n3.indexOf(u2) && (e3.push({ obj: o3, prop: r4 }), n3.push(u2));
      }
    }
    return (function(t5) {
      for (; t5.length > 1; ) {
        const e4 = t5.pop(), n4 = e4.obj[e4.prop];
        if (y(n4)) {
          const t6 = [];
          for (let e5 = 0; e5 < n4.length; ++e5) void 0 !== n4[e5] && t6.push(n4[e5]);
          e4.obj[e4.prop] = t6;
        }
      }
    })(e3), t4;
  })(o2);
}
var P = /* @__PURE__ */ (function() {
  function t3(t4, e2, n3) {
    var r2, o2;
    this.name = t4, this.definition = e2, this.bindings = null != (r2 = e2.bindings) ? r2 : {}, this.wheres = null != (o2 = e2.wheres) ? o2 : {}, this.config = n3;
  }
  var n2 = t3.prototype;
  return n2.matchesUrl = function(t4) {
    var e2, n3 = this;
    if (!this.definition.methods.includes("GET")) return false;
    var r2 = this.template.replace(/[.*+$()[\]]/g, "\\$&").replace(/(\/?){([^}?]*)(\??)}/g, function(t5, e3, r3, o3) {
      var i3, u3 = "(?<" + r3 + ">" + ((null == (i3 = n3.wheres[r3]) ? void 0 : i3.replace(/(^\^)|(\$$)/g, "")) || "[^/?]+") + ")";
      return o3 ? "(" + e3 + u3 + ")?" : "" + e3 + u3;
    }).replace(/^\w+:\/\//, ""), o2 = t4.replace(/^\w+:\/\//, "").split("?"), i2 = o2[0], u2 = o2[1], f2 = null != (e2 = new RegExp("^" + r2 + "/?$").exec(i2)) ? e2 : new RegExp("^" + r2 + "/?$").exec(decodeURI(i2));
    if (f2) {
      for (var c2 in f2.groups) f2.groups[c2] = "string" == typeof f2.groups[c2] ? decodeURIComponent(f2.groups[c2]) : f2.groups[c2];
      return { params: f2.groups, query: C(u2) };
    }
    return false;
  }, n2.compile = function(t4) {
    var e2 = this;
    return this.parameterSegments.length ? this.template.replace(/{([^}?]+)(\??)}/g, function(n3, r2, o2) {
      var i2, u2;
      if (!o2 && [null, void 0].includes(t4[r2])) throw new Error("Ziggy error: '" + r2 + "' parameter is required for route '" + e2.name + "'.");
      if (e2.wheres[r2] && !new RegExp("^" + (o2 ? "(" + e2.wheres[r2] + ")?" : e2.wheres[r2]) + "$").test(null != (u2 = t4[r2]) ? u2 : "")) throw new Error("Ziggy error: '" + r2 + "' parameter '" + t4[r2] + "' does not match required format '" + e2.wheres[r2] + "' for route '" + e2.name + "'.");
      return encodeURI(null != (i2 = t4[r2]) ? i2 : "").replace(/%7C/g, "|").replace(/%25/g, "%").replace(/\$/g, "%24");
    }).replace(this.config.absolute ? /(\.[^/]+?)(\/\/)/ : /(^)(\/\/)/, "$1/").replace(/\/+$/, "") : this.template;
  }, e(t3, [{ key: "template", get: function() {
    var t4 = (this.origin + "/" + this.definition.uri).replace(/\/+$/, "");
    return "" === t4 ? "/" : t4;
  } }, { key: "origin", get: function() {
    return this.config.absolute ? this.definition.domain ? "" + this.config.url.match(/^\w+:\/\//)[0] + this.definition.domain + (this.config.port ? ":" + this.config.port : "") : this.config.url : "";
  } }, { key: "parameterSegments", get: function() {
    var t4, e2;
    return null != (t4 = null == (e2 = this.template.match(/{[^}?]+\??}/g)) ? void 0 : e2.map(function(t5) {
      return { name: t5.replace(/{|\??}/g, ""), required: !/\?}$/.test(t5) };
    })) ? t4 : [];
  } }]);
})(), Z = /* @__PURE__ */ (function(t3) {
  function r2(e2, r3, o3, i2) {
    var u3;
    if (void 0 === o3 && (o3 = true), (u3 = t3.call(this) || this).t = null != i2 ? i2 : "undefined" != typeof Ziggy ? Ziggy : null == globalThis ? void 0 : globalThis.Ziggy, !u3.t && "undefined" != typeof document && document.getElementById("ziggy-routes-json") && (globalThis.Ziggy = JSON.parse(document.getElementById("ziggy-routes-json").textContent), u3.t = globalThis.Ziggy), u3.t = n({}, u3.t, { absolute: o3 }), e2) {
      if (!u3.t.routes[e2]) throw new Error("Ziggy error: route '" + e2 + "' is not in the route list.");
      u3.i = new P(e2, u3.t.routes[e2], u3.t), u3.u = u3.l(r3);
    }
    return u3;
  }
  var o2, u2;
  u2 = t3, (o2 = r2).prototype = Object.create(u2.prototype), o2.prototype.constructor = o2, i(o2, u2);
  var f2 = r2.prototype;
  return f2.toString = function() {
    var t4 = this, e2 = Object.keys(this.u).filter(function(e3) {
      return !t4.i.parameterSegments.some(function(t5) {
        return t5.name === e3;
      });
    }).filter(function(t5) {
      return "_query" !== t5;
    }).reduce(function(e3, r3) {
      var o3;
      return n({}, e3, ((o3 = {})[r3] = t4.u[r3], o3));
    }, {});
    return this.i.compile(this.u) + (function(t5, e3) {
      let n2 = t5;
      const r3 = (function(t6) {
        if (!t6) return R;
        if (void 0 !== t6.allowEmptyArrays && "boolean" != typeof t6.allowEmptyArrays) throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
        if (void 0 !== t6.encodeDotInKeys && "boolean" != typeof t6.encodeDotInKeys) throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
        if (null != t6.encoder && "function" != typeof t6.encoder) throw new TypeError("Encoder has to be a function.");
        const e4 = t6.charset || R.charset;
        if (void 0 !== t6.charset && "utf-8" !== t6.charset && "iso-8859-1" !== t6.charset) throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
        let n3 = s;
        if (void 0 !== t6.format) {
          if (!g.call(l, t6.format)) throw new TypeError("Unknown format option provided.");
          n3 = t6.format;
        }
        const r4 = l[n3];
        let o4, i3 = R.filter;
        if (("function" == typeof t6.filter || j(t6.filter)) && (i3 = t6.filter), o4 = t6.arrayFormat in w ? t6.arrayFormat : "indices" in t6 ? t6.indices ? "indices" : "repeat" : R.arrayFormat, "commaRoundTrip" in t6 && "boolean" != typeof t6.commaRoundTrip) throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
        return { addQueryPrefix: "boolean" == typeof t6.addQueryPrefix ? t6.addQueryPrefix : R.addQueryPrefix, allowDots: void 0 === t6.allowDots ? true === t6.encodeDotInKeys || R.allowDots : !!t6.allowDots, allowEmptyArrays: "boolean" == typeof t6.allowEmptyArrays ? !!t6.allowEmptyArrays : R.allowEmptyArrays, arrayFormat: o4, charset: e4, charsetSentinel: "boolean" == typeof t6.charsetSentinel ? t6.charsetSentinel : R.charsetSentinel, commaRoundTrip: t6.commaRoundTrip, delimiter: void 0 === t6.delimiter ? R.delimiter : t6.delimiter, encode: "boolean" == typeof t6.encode ? t6.encode : R.encode, encodeDotInKeys: "boolean" == typeof t6.encodeDotInKeys ? t6.encodeDotInKeys : R.encodeDotInKeys, encoder: "function" == typeof t6.encoder ? t6.encoder : R.encoder, encodeValuesOnly: "boolean" == typeof t6.encodeValuesOnly ? t6.encodeValuesOnly : R.encodeValuesOnly, filter: i3, format: n3, formatter: r4, serializeDate: "function" == typeof t6.serializeDate ? t6.serializeDate : R.serializeDate, skipNulls: "boolean" == typeof t6.skipNulls ? t6.skipNulls : R.skipNulls, sort: "function" == typeof t6.sort ? t6.sort : null, strictNullHandling: "boolean" == typeof t6.strictNullHandling ? t6.strictNullHandling : R.strictNullHandling };
      })(e3);
      let o3, i2;
      "function" == typeof r3.filter ? (i2 = r3.filter, n2 = i2("", n2)) : j(r3.filter) && (i2 = r3.filter, o3 = i2);
      const u3 = [];
      if ("object" != typeof n2 || null === n2) return "";
      const f3 = w[r3.arrayFormat], c2 = "comma" === f3 && r3.commaRoundTrip;
      o3 || (o3 = Object.keys(n2)), r3.sort && o3.sort(r3.sort);
      const a2 = /* @__PURE__ */ new WeakMap();
      for (let t6 = 0; t6 < o3.length; ++t6) {
        const e4 = o3[t6];
        r3.skipNulls && null === n2[e4] || O(u3, S(n2[e4], e4, f3, c2, r3.allowEmptyArrays, r3.strictNullHandling, r3.skipNulls, r3.encodeDotInKeys, r3.encode ? r3.encoder : null, r3.filter, r3.sort, r3.allowDots, r3.serializeDate, r3.format, r3.formatter, r3.encodeValuesOnly, r3.charset, a2));
      }
      const p2 = u3.join(r3.delimiter);
      let y2 = true === r3.addQueryPrefix ? "?" : "";
      return r3.charsetSentinel && (y2 += "iso-8859-1" === r3.charset ? "utf8=%26%2310003%3B&" : "utf8=%E2%9C%93&"), p2.length > 0 ? y2 + p2 : "";
    })(n({}, e2, this.u._query), { addQueryPrefix: true, arrayFormat: "indices", encodeValuesOnly: true, skipNulls: true, encoder: function(t5, e3) {
      return "boolean" == typeof t5 ? Number(t5) : e3(t5);
    } });
  }, f2.p = function(t4) {
    var e2 = this;
    t4 ? this.t.absolute && t4.startsWith("/") && (t4 = this.h().host + t4) : t4 = this.v();
    var r3 = {}, o3 = Object.entries(this.t.routes).find(function(n2) {
      return r3 = new P(n2[0], n2[1], e2.t).matchesUrl(t4);
    }) || [void 0, void 0];
    return n({ name: o3[0] }, r3, { route: o3[1] });
  }, f2.v = function() {
    var t4 = this.h(), e2 = t4.pathname, n2 = t4.search;
    return (this.t.absolute ? t4.host + e2 : e2.replace(this.t.url.replace(/^\w*:\/\/[^/]+/, ""), "").replace(/^\/+/, "/")) + n2;
  }, f2.current = function(t4, e2) {
    var r3 = this.p(), o3 = r3.name, i2 = r3.params, u3 = r3.query, f3 = r3.route;
    if (!t4) return o3;
    var c2 = new RegExp("^" + t4.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$").test(o3);
    if ([null, void 0].includes(e2) || !c2) return c2;
    var a2 = new P(o3, f3, this.t);
    e2 = this.l(e2, a2);
    var l2 = n({}, i2, u3);
    if (Object.values(e2).every(function(t5) {
      return !t5;
    }) && !Object.values(l2).some(function(t5) {
      return void 0 !== t5;
    })) return true;
    var s2 = function(t5, e3) {
      return Object.entries(t5).every(function(t6) {
        var n2 = t6[0], r4 = t6[1];
        return Array.isArray(r4) && Array.isArray(e3[n2]) ? r4.every(function(t7) {
          return e3[n2].includes(t7) || e3[n2].includes(decodeURIComponent(t7));
        }) : "object" == typeof r4 && "object" == typeof e3[n2] && null !== r4 && null !== e3[n2] ? s2(r4, e3[n2]) : e3[n2] == r4 || e3[n2] == decodeURIComponent(r4);
      });
    };
    return s2(e2, l2);
  }, f2.h = function() {
    var t4, e2, n2, r3, o3, i2, u3 = "undefined" != typeof window ? window.location : {}, f3 = u3.host, c2 = u3.pathname, a2 = u3.search;
    return { host: null != (t4 = null == (e2 = this.t.location) ? void 0 : e2.host) ? t4 : void 0 === f3 ? "" : f3, pathname: null != (n2 = null == (r3 = this.t.location) ? void 0 : r3.pathname) ? n2 : void 0 === c2 ? "" : c2, search: null != (o3 = null == (i2 = this.t.location) ? void 0 : i2.search) ? o3 : void 0 === a2 ? "" : a2 };
  }, f2.has = function(t4) {
    return this.t.routes.hasOwnProperty(t4);
  }, f2.l = function(t4, e2) {
    var r3 = this;
    void 0 === t4 && (t4 = {}), void 0 === e2 && (e2 = this.i), null != t4 || (t4 = {}), t4 = ["string", "number"].includes(typeof t4) ? [t4] : t4;
    var o3 = e2.parameterSegments.filter(function(t5) {
      return !r3.t.defaults[t5.name];
    });
    if (Array.isArray(t4)) t4 = t4.reduce(function(t5, e3, r4) {
      var i3, u3;
      return n({}, t5, o3[r4] ? ((i3 = {})[o3[r4].name] = e3, i3) : "object" == typeof e3 ? e3 : ((u3 = {})[e3] = "", u3));
    }, {});
    else if (1 === o3.length && !t4[o3[0].name] && (t4.hasOwnProperty(Object.values(e2.bindings)[0]) || t4.hasOwnProperty("id"))) {
      var i2;
      (i2 = {})[o3[0].name] = t4, t4 = i2;
    }
    return n({}, this.m(e2), this.j(t4, e2));
  }, f2.m = function(t4) {
    var e2 = this;
    return t4.parameterSegments.filter(function(t5) {
      return e2.t.defaults[t5.name];
    }).reduce(function(t5, r3, o3) {
      var i2, u3 = r3.name;
      return n({}, t5, ((i2 = {})[u3] = e2.t.defaults[u3], i2));
    }, {});
  }, f2.j = function(t4, e2) {
    var r3 = e2.bindings, o3 = e2.parameterSegments;
    return Object.entries(t4).reduce(function(t5, e3) {
      var i2, u3, f3 = e3[0], c2 = e3[1];
      if (!c2 || "object" != typeof c2 || Array.isArray(c2) || !o3.some(function(t6) {
        return t6.name === f3;
      })) return n({}, t5, ((u3 = {})[f3] = c2, u3));
      if (!c2.hasOwnProperty(r3[f3])) {
        if (!c2.hasOwnProperty("id")) throw new Error("Ziggy error: object passed as '" + f3 + "' parameter is missing route model binding key '" + r3[f3] + "'.");
        r3[f3] = "id";
      }
      return n({}, t5, ((i2 = {})[f3] = c2[r3[f3]], i2));
    }, {});
  }, f2.valueOf = function() {
    return this.toString();
  }, e(r2, [{ key: "params", get: function() {
    var t4 = this.p();
    return n({}, t4.params, t4.query);
  } }, { key: "routeParams", get: function() {
    return this.p().params;
  } }, { key: "queryParams", get: function() {
    return this.p().query;
  } }]);
})(/* @__PURE__ */ f(String));
function _(t3, e2, n2, r2) {
  var o2 = new Z(t3, e2, n2, r2);
  return t3 ? o2.toString() : o2;
}
const Ziggy$1 = { "url": "https://venqore.com", "port": null, "defaults": {}, "routes": { "horizon.stats.index": { "uri": "horizon/api/stats", "methods": ["GET", "HEAD"] }, "horizon.workload.index": { "uri": "horizon/api/workload", "methods": ["GET", "HEAD"] }, "horizon.masters.index": { "uri": "horizon/api/masters", "methods": ["GET", "HEAD"] }, "horizon.monitoring.index": { "uri": "horizon/api/monitoring", "methods": ["GET", "HEAD"] }, "horizon.monitoring.store": { "uri": "horizon/api/monitoring", "methods": ["POST"] }, "horizon.monitoring-tag.paginate": { "uri": "horizon/api/monitoring/{tag}", "methods": ["GET", "HEAD"], "parameters": ["tag"] }, "horizon.monitoring-tag.destroy": { "uri": "horizon/api/monitoring/{tag}", "methods": ["DELETE"], "wheres": { "tag": ".*" }, "parameters": ["tag"] }, "horizon.jobs-metrics.index": { "uri": "horizon/api/metrics/jobs", "methods": ["GET", "HEAD"] }, "horizon.jobs-metrics.show": { "uri": "horizon/api/metrics/jobs/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.queues-metrics.index": { "uri": "horizon/api/metrics/queues", "methods": ["GET", "HEAD"] }, "horizon.queues-metrics.show": { "uri": "horizon/api/metrics/queues/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.jobs-batches.index": { "uri": "horizon/api/batches", "methods": ["GET", "HEAD"] }, "horizon.jobs-batches.show": { "uri": "horizon/api/batches/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.jobs-batches.retry": { "uri": "horizon/api/batches/retry/{id}", "methods": ["POST"], "parameters": ["id"] }, "horizon.pending-jobs.index": { "uri": "horizon/api/jobs/pending", "methods": ["GET", "HEAD"] }, "horizon.completed-jobs.index": { "uri": "horizon/api/jobs/completed", "methods": ["GET", "HEAD"] }, "horizon.silenced-jobs.index": { "uri": "horizon/api/jobs/silenced", "methods": ["GET", "HEAD"] }, "horizon.failed-jobs.index": { "uri": "horizon/api/jobs/failed", "methods": ["GET", "HEAD"] }, "horizon.failed-jobs.show": { "uri": "horizon/api/jobs/failed/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.retry-jobs.show": { "uri": "horizon/api/jobs/retry/{id}", "methods": ["POST"], "parameters": ["id"] }, "horizon.jobs.show": { "uri": "horizon/api/jobs/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.index": { "uri": "horizon/{view?}", "methods": ["GET", "HEAD"], "wheres": { "view": "(.*)" }, "parameters": ["view"] }, "sanctum.csrf-cookie": { "uri": "sanctum/csrf-cookie", "methods": ["GET", "HEAD"] }, "woo.webhook.receive": { "uri": "api/woo/webhook/{uuid}", "methods": ["POST"], "parameters": ["uuid"] }, "woo.verify": { "uri": "api/woo/verify/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "woo.handshake": { "uri": "api/woo/handshake", "methods": ["POST"] }, "marketing.features": { "uri": "features", "methods": ["GET", "HEAD"] }, "marketing.pricing": { "uri": "pricing", "methods": ["GET", "HEAD"] }, "marketing.pricing.override": { "uri": "pricing/currency-override", "methods": ["POST"] }, "marketing.about": { "uri": "about", "methods": ["GET", "HEAD"] }, "marketing.contact": { "uri": "contact", "methods": ["GET", "HEAD"] }, "marketing.contact.submit": { "uri": "contact", "methods": ["POST"] }, "marketing.vensynq": { "uri": "vensynq", "methods": ["GET", "HEAD"] }, "marketing.smartcapture": { "uri": "smartcapture", "methods": ["GET", "HEAD"] }, "marketing.newsletter": { "uri": "subscribe", "methods": ["GET", "HEAD"] }, "marketing.newsletter.submit": { "uri": "subscribe", "methods": ["POST"] }, "marketing.digital-products": { "uri": "digital-products", "methods": ["GET", "HEAD"] }, "marketing.partner-support": { "uri": "partner-support", "methods": ["GET", "HEAD"] }, "partner-support.start": { "uri": "api/partner-support/chat", "methods": ["POST"] }, "partner-support.messages": { "uri": "api/partner-support/chat/{ticket_id}", "methods": ["GET", "HEAD"], "parameters": ["ticket_id"] }, "partner-support.reply": { "uri": "api/partner-support/chat/{ticket_id}/reply", "methods": ["POST"], "parameters": ["ticket_id"] }, "barcode.generate": { "uri": "barcode/generate", "methods": ["GET", "HEAD"] }, "tools.index": { "uri": "tools", "methods": ["GET", "HEAD"] }, "tools.barcode": { "uri": "tools/barcode-generator", "methods": ["GET", "HEAD"] }, "tools.barcode.format": { "uri": "tools/barcode-generator/{format}", "methods": ["GET", "HEAD"], "wheres": { "format": "code128|code39|code93|ean-13|ean-8|upc-a|upc-e|itf-14|codabar" }, "parameters": ["format"] }, "tools.barcode.render": { "uri": "tools/barcode-generator/render", "methods": ["POST"] }, "tools.barcode.validate": { "uri": "tools/barcode-generator/validate", "methods": ["POST"] }, "tools.barcode.sheet": { "uri": "tools/barcode-generator/sheet", "methods": ["POST"] }, "tools.barcode-label": { "uri": "tools/barcode-label-generator", "methods": ["GET", "HEAD"] }, "tools.barcode-label.parse": { "uri": "tools/barcode-label-generator/parse", "methods": ["POST"] }, "tools.barcode-label.sheet": { "uri": "tools/barcode-label-generator/sheet", "methods": ["POST"] }, "tools.invoice": { "uri": "tools/invoice-generator", "methods": ["GET", "HEAD"] }, "tools.invoice.render": { "uri": "tools/invoice-generator/render", "methods": ["POST"] }, "tools.credit-note": { "uri": "tools/credit-note-generator", "methods": ["GET", "HEAD"] }, "tools.credit-note.render": { "uri": "tools/credit-note-generator/render", "methods": ["POST"] }, "tools.receipt": { "uri": "tools/receipt-generator", "methods": ["GET", "HEAD"] }, "tools.receipt.render": { "uri": "tools/receipt-generator/render", "methods": ["POST"] }, "tools.packing-slip": { "uri": "tools/packing-slip-generator", "methods": ["GET", "HEAD"] }, "tools.packing-slip.render": { "uri": "tools/packing-slip-generator/render", "methods": ["POST"] }, "tools.price-tag": { "uri": "tools/price-tag-generator", "methods": ["GET", "HEAD"] }, "tools.price-tag.sheet": { "uri": "tools/price-tag-generator/sheet", "methods": ["POST"] }, "tools.price-tag.parse": { "uri": "tools/price-tag-generator/parse", "methods": ["POST"] }, "tools.label-sheet": { "uri": "tools/label-sheet-generator", "methods": ["GET", "HEAD"] }, "tools.label-sheet.sheet": { "uri": "tools/label-sheet-generator/sheet", "methods": ["POST"] }, "tools.label-sheet.parse": { "uri": "tools/label-sheet-generator/parse", "methods": ["POST"] }, "tools.qr": { "uri": "tools/qr-code-generator", "methods": ["GET", "HEAD"] }, "tools.qr.render": { "uri": "tools/qr-code-generator/render", "methods": ["POST"] }, "tools.qr-menu": { "uri": "tools/qr-menu-generator", "methods": ["GET", "HEAD"] }, "tools.qr-menu.render": { "uri": "tools/qr-menu-generator/render", "methods": ["POST"] }, "tools.csv-cleaner": { "uri": "tools/product-csv-cleaner", "methods": ["GET", "HEAD"] }, "tools.csv-cleaner.parse": { "uri": "tools/product-csv-cleaner/parse", "methods": ["POST"] }, "tools.csv-cleaner.download": { "uri": "tools/product-csv-cleaner/download", "methods": ["POST"] }, "tools.purchase-order": { "uri": "tools/purchase-order-generator", "methods": ["GET", "HEAD"] }, "tools.purchase-order.render": { "uri": "tools/purchase-order-generator/render", "methods": ["POST"] }, "tools.quote": { "uri": "tools/quote-generator", "methods": ["GET", "HEAD"] }, "tools.quote.render": { "uri": "tools/quote-generator/render", "methods": ["POST"] }, "tools.stock-count": { "uri": "tools/stock-count-sheet", "methods": ["GET", "HEAD"] }, "tools.stock-count.render": { "uri": "tools/stock-count-sheet/render", "methods": ["POST"] }, "tools.stock-count.parse": { "uri": "tools/stock-count-sheet/parse", "methods": ["POST"] }, "tools.cash-drawer": { "uri": "tools/cash-drawer-count-sheet", "methods": ["GET", "HEAD"] }, "tools.cash-drawer.render": { "uri": "tools/cash-drawer-count-sheet/render", "methods": ["POST"] }, "tools.margin-calculator": { "uri": "tools/margin-calculator", "methods": ["GET", "HEAD"] }, "tools.inventory-health": { "uri": "tools/inventory-health", "methods": ["GET", "HEAD"] }, "tools.pos-roi": { "uri": "tools/pos-roi-calculator", "methods": ["GET", "HEAD"] }, "tools.food-cost": { "uri": "tools/food-cost-calculator", "methods": ["GET", "HEAD"] }, "tools.payment-fee": { "uri": "tools/payment-fee-calculator", "methods": ["GET", "HEAD"] }, "tools.sku-generator": { "uri": "tools/sku-generator", "methods": ["GET", "HEAD"] }, "tools.barcode-validator": { "uri": "tools/barcode-validator", "methods": ["GET", "HEAD"] }, "tools.barcode-validator.check": { "uri": "tools/barcode-validator/check", "methods": ["POST"] }, "tools.lead.store": { "uri": "tools/lead", "methods": ["POST"] }, "tools.lead.confirm": { "uri": "tools/lead/confirm/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "tools.lead.unsubscribe": { "uri": "tools/lead/unsubscribe/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "tools.lead.unsubscribe.confirm": { "uri": "tools/lead/unsubscribe/{token}", "methods": ["POST"], "parameters": ["token"] }, "tools.download": { "uri": "tools/download/{uuid}", "methods": ["GET", "HEAD"], "parameters": ["uuid"] }, "blog.index": { "uri": "blog", "methods": ["GET", "HEAD"] }, "blog.show": { "uri": "blog/{slug}", "methods": ["GET", "HEAD"], "parameters": ["slug"] }, "terms": { "uri": "terms", "methods": ["GET", "HEAD"] }, "privacy": { "uri": "privacy", "methods": ["GET", "HEAD"] }, "sitemap": { "uri": "sitemap.xml", "methods": ["GET", "HEAD"] }, "webhooks.lemon-squeezy": { "uri": "webhooks/lemon-squeezy", "methods": ["POST"] }, "demo.landing": { "uri": "demo", "methods": ["GET", "HEAD"] }, "demo.login": { "uri": "demo/login", "methods": ["GET", "POST", "HEAD"] }, "demo.logout": { "uri": "demo/logout", "methods": ["POST"] }, "vensynq.universal.callback.amazon": { "uri": "amazon/callback", "methods": ["GET", "HEAD"] }, "vensynq.universal.callback.tiktok": { "uri": "tiktok/callback", "methods": ["GET", "HEAD"] }, "vensynq.universal.callback.ebay": { "uri": "ebay/callback", "methods": ["GET", "HEAD"] }, "google.callback": { "uri": "google/callback", "methods": ["GET", "HEAD"] }, "hub": { "uri": "hub", "methods": ["GET", "HEAD"] }, "my-stores.api": { "uri": "api/my-stores", "methods": ["GET", "HEAD"] }, "staff.hub": { "uri": "staff/hub", "methods": ["GET", "HEAD"] }, "store.create-or-join": { "uri": "start", "methods": ["GET", "HEAD"] }, "store.create": { "uri": "new-store", "methods": ["GET", "HEAD"] }, "store.store": { "uri": "new-store", "methods": ["POST"] }, "store.join": { "uri": "join", "methods": ["GET", "HEAD"] }, "store.join.submit": { "uri": "join", "methods": ["POST"] }, "invite.accept": { "uri": "invite/accept", "methods": ["GET", "HEAD"] }, "invite.submit": { "uri": "invite/accept", "methods": ["POST"] }, "invite.decline": { "uri": "invite/decline", "methods": ["POST"] }, "gift.accept": { "uri": "gift/{token}", "methods": ["POST"], "parameters": ["token"] }, "invite.validate-code": { "uri": "invite/validate-code", "methods": ["POST"] }, "account.edit": { "uri": "account", "methods": ["GET", "HEAD"] }, "account.update": { "uri": "account", "methods": ["PATCH"] }, "account.passcode": { "uri": "account/passcode", "methods": ["POST"] }, "account.security-pin": { "uri": "account/security-pin", "methods": ["POST"] }, "account.destroy": { "uri": "account", "methods": ["DELETE"] }, "store.": { "uri": "s/{store_slug}", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.setup": { "uri": "s/{store_slug}/setup", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.setup.complete": { "uri": "s/{store_slug}/setup", "methods": ["POST"], "parameters": ["store_slug"] }, "store.terminal-pairing.index": { "uri": "s/{store_slug}/terminal-pairing-tokens", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.terminal-pairing.store": { "uri": "s/{store_slug}/terminal-pairing-tokens", "methods": ["POST"], "parameters": ["store_slug"] }, "store.terminal-pairing.destroy": { "uri": "s/{store_slug}/terminal-pairing-tokens/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.pos": { "uri": "s/{store_slug}/pos", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pos.search": { "uri": "s/{store_slug}/pos/products", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pos.featured": { "uri": "s/{store_slug}/pos/products/featured", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pos.categories": { "uri": "s/{store_slug}/pos/categories", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pos.barcode": { "uri": "s/{store_slug}/pos/barcode/{code}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "code"] }, "store.pos.open": { "uri": "s/{store_slug}/pos/open-session", "methods": ["POST"], "parameters": ["store_slug"] }, "store.pos.close": { "uri": "s/{store_slug}/pos/close-session", "methods": ["POST"], "parameters": ["store_slug"] }, "store.staff": { "uri": "s/{store_slug}/staff", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.staff.invite": { "uri": "s/{store_slug}/staff/invite", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing": { "uri": "s/{store_slug}/billing", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.billing.upgrade": { "uri": "s/{store_slug}/billing/upgrade", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.billing.portal": { "uri": "s/{store_slug}/billing/portal", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.billing.payment-history": { "uri": "s/{store_slug}/billing/payment-history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.backup.export": { "uri": "s/{store_slug}/backup/export", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.backup.import": { "uri": "s/{store_slug}/backup/import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.cancel-trial": { "uri": "s/{store_slug}/billing/cancel-trial", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.cancel-subscription": { "uri": "s/{store_slug}/billing/cancel-subscription", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.resume-subscription": { "uri": "s/{store_slug}/billing/resume-subscription", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.checkout-addon": { "uri": "s/{store_slug}/billing/checkout-addon", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.change-plan": { "uri": "s/{store_slug}/billing/change-plan", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.deactivate-feature": { "uri": "s/{store_slug}/billing/deactivate-feature", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.checkout-upload-service": { "uri": "s/{store_slug}/billing/checkout-upload-service", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.sync-subscription": { "uri": "s/{store_slug}/billing/sync-subscription", "methods": ["POST"], "parameters": ["store_slug"] }, "store.google.redirect": { "uri": "s/{store_slug}/google/redirect", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.google.disconnect": { "uri": "s/{store_slug}/google/disconnect", "methods": ["POST"], "parameters": ["store_slug"] }, "store.google.settings": { "uri": "s/{store_slug}/google/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.google.sync-now": { "uri": "s/{store_slug}/google/sync-now", "methods": ["POST"], "parameters": ["store_slug"] }, "store.google.backup.download": { "uri": "s/{store_slug}/google/backup/download/{fileId}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "fileId"] }, "store.google.backup.delete": { "uri": "s/{store_slug}/google/backup/delete/{fileId}", "methods": ["POST"], "parameters": ["store_slug", "fileId"] }, "store.google.backup.restore": { "uri": "s/{store_slug}/google/backup/restore/{fileId}", "methods": ["POST"], "parameters": ["store_slug", "fileId"] }, "store.settings": { "uri": "s/{store_slug}/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.settings.update": { "uri": "s/{store_slug}/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.context": { "uri": "s/{store_slug}/smart-capture/context", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.smart-capture.extract": { "uri": "s/{store_slug}/smart-capture/extract", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.confirm": { "uri": "s/{store_slug}/smart-capture/confirm", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.settings": { "uri": "s/{store_slug}/smart-capture/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.smart-capture.settings.save": { "uri": "s/{store_slug}/smart-capture/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.settings.test": { "uri": "s/{store_slug}/smart-capture/settings/test", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.settings.models": { "uri": "s/{store_slug}/smart-capture/settings/models", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.aliases": { "uri": "s/{store_slug}/smart-capture/aliases", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.smart-capture.aliases.forget": { "uri": "s/{store_slug}/smart-capture/aliases/forget", "methods": ["POST"], "parameters": ["store_slug"] }, "store.trial.expired": { "uri": "s/{store_slug}/trial-expired", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.notifications.plan.unread": { "uri": "s/{store_slug}/notifications/plan/unread", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.notifications.plan.markAllRead": { "uri": "s/{store_slug}/notifications/plan/mark-all-read", "methods": ["POST"], "parameters": ["store_slug"] }, "store.notifications.plan.read": { "uri": "s/{store_slug}/notifications/plan/{id}/read", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.admin.home": { "uri": "s/{store_slug}/admin", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.dashboard": { "uri": "s/{store_slug}/admin/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.settings": { "uri": "s/{store_slug}/admin/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.settings.update": { "uri": "s/{store_slug}/admin/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.users": { "uri": "s/{store_slug}/admin/users", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.users.update": { "uri": "s/{store_slug}/admin/users/{member}", "methods": ["PATCH"], "parameters": ["store_slug", "member"], "bindings": { "member": "id" } }, "store.admin.users.remove": { "uri": "s/{store_slug}/admin/users/{member}", "methods": ["DELETE"], "parameters": ["store_slug", "member"], "bindings": { "member": "id" } }, "store.admin.users.store": { "uri": "s/{store_slug}/admin/users", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.staff": { "uri": "s/{store_slug}/admin/staff", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.invitations.store": { "uri": "s/{store_slug}/admin/invitations", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.invitations.approve": { "uri": "s/{store_slug}/admin/invitations/{invitation}/approve", "methods": ["POST"], "parameters": ["store_slug", "invitation"], "bindings": { "invitation": "id" } }, "store.admin.invitations.decline": { "uri": "s/{store_slug}/admin/invitations/{invitation}/decline", "methods": ["POST"], "parameters": ["store_slug", "invitation"], "bindings": { "invitation": "id" } }, "store.admin.invitations.revoke": { "uri": "s/{store_slug}/admin/invitations/{invitation}/revoke", "methods": ["POST"], "parameters": ["store_slug", "invitation"], "bindings": { "invitation": "id" } }, "store.admin.invitations.resend": { "uri": "s/{store_slug}/admin/invitations/{invitation}/resend", "methods": ["POST"], "parameters": ["store_slug", "invitation"], "bindings": { "invitation": "id" } }, "store.admin.attendance": { "uri": "s/{store_slug}/admin/attendance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.logs": { "uri": "s/{store_slug}/admin/logs", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.data": { "uri": "s/{store_slug}/admin/data-management", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.data.export": { "uri": "s/{store_slug}/admin/data/export", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.import": { "uri": "s/{store_slug}/admin/data/import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.upload-mapping": { "uri": "s/{store_slug}/admin/data/upload-mapping", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.process-import": { "uri": "s/{store_slug}/admin/data/process-import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.validate-import": { "uri": "s/{store_slug}/admin/data/validate-import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.template": { "uri": "s/{store_slug}/admin/data/template", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.recycle-bin.index": { "uri": "s/{store_slug}/admin/recycle-bin", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.recycle-bin.restore": { "uri": "s/{store_slug}/admin/recycle-bin/{id}/restore", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.admin.recycle-bin.force-delete": { "uri": "s/{store_slug}/admin/recycle-bin/{id}/force-delete", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.admin.chatbot.settings": { "uri": "s/{store_slug}/admin/chatbot/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.chatbot.settings.update": { "uri": "s/{store_slug}/admin/chatbot/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.chatbot.ai.test": { "uri": "s/{store_slug}/admin/chatbot/settings/test", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.chatbot.inbox": { "uri": "s/{store_slug}/admin/chatbot/inbox", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.chatbot.sessions": { "uri": "s/{store_slug}/admin/chatbot/sessions", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.chatbot.claim": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/claim", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.reply": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/reply", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.typing.agent": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/typing", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.release": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/release", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.resolve": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/resolve", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.handoff-to-ai": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/handoff-to-ai", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.refer": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/refer", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.set-status": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/set-status", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.log-learning": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/log-learning", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.assist-suggestion": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/assist-suggestion", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.assist": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/assist", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.canned-responses": { "uri": "s/{store_slug}/admin/chatbot/canned-responses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.chatbot.destroy": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}", "methods": ["DELETE"], "parameters": ["store_slug", "uuid"] }, "store.admin.vena.tickets": { "uri": "s/{store_slug}/admin/vena-tickets", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.vena.ticket.create": { "uri": "s/{store_slug}/admin/vena-tickets/create", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.vena.ticket.show": { "uri": "s/{store_slug}/admin/vena-tickets/{ticket}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "ticket"], "bindings": { "ticket": "id" } }, "store.admin.vena.ticket.status": { "uri": "s/{store_slug}/admin/vena-tickets/{ticket}/status", "methods": ["POST"], "parameters": ["store_slug", "ticket"], "bindings": { "ticket": "id" } }, "platform.pk-verifications.submit": { "uri": "VenQore/pk-verifications/submit", "methods": ["POST"] }, "platform.dashboard": { "uri": "VenQore", "methods": ["GET", "HEAD"] }, "platform.digital-hub": { "uri": "VenQore/digital-hub", "methods": ["GET", "HEAD"] }, "platform.digital-hub.chats": { "uri": "VenQore/digital-hub/chats", "methods": ["GET", "HEAD"] }, "platform.digital-hub.chats.reply": { "uri": "VenQore/digital-hub/chats/{ticket_id}/reply", "methods": ["POST"], "parameters": ["ticket_id"] }, "platform.digital-hub.chats.status": { "uri": "VenQore/digital-hub/chats/{ticket_id}/status", "methods": ["POST"], "parameters": ["ticket_id"] }, "platform.digital-hub.products": { "uri": "VenQore/digital-hub/products", "methods": ["GET", "HEAD"] }, "platform.digital-hub.products.create": { "uri": "VenQore/digital-hub/products", "methods": ["POST"] }, "platform.digital-hub.products.update": { "uri": "VenQore/digital-hub/products/{id}/update", "methods": ["POST"], "parameters": ["id"] }, "platform.digital-hub.products.delete": { "uri": "VenQore/digital-hub/products/{id}", "methods": ["DELETE"], "parameters": ["id"] }, "platform.newsletter-hub": { "uri": "VenQore/newsletter-hub", "methods": ["GET", "HEAD"] }, "platform.newsletter-hub.subscribers": { "uri": "VenQore/newsletter-hub/subscribers", "methods": ["GET", "HEAD"] }, "platform.chatbot.settings": { "uri": "VenQore/chatbot/settings", "methods": ["GET", "HEAD"] }, "platform.chatbot.settings.update": { "uri": "VenQore/chatbot/settings", "methods": ["POST"] }, "platform.ai.test": { "uri": "VenQore/chatbot/settings/test", "methods": ["POST"] }, "platform.chatbot.inbox": { "uri": "VenQore/chatbot/inbox", "methods": ["GET", "HEAD"] }, "platform.chatbot.sessions": { "uri": "VenQore/api/chatbot/sessions", "methods": ["GET", "HEAD"] }, "platform.chatbot.claim": { "uri": "VenQore/api/chatbot/sessions/{uuid}/claim", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.reply": { "uri": "VenQore/api/chatbot/sessions/{uuid}/reply", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.typing.agent": { "uri": "VenQore/api/chatbot/sessions/{uuid}/typing", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.release": { "uri": "VenQore/api/chatbot/sessions/{uuid}/release", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.resolve": { "uri": "VenQore/api/chatbot/sessions/{uuid}/resolve", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.handoff-to-ai": { "uri": "VenQore/api/chatbot/sessions/{uuid}/handoff-to-ai", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.refer": { "uri": "VenQore/api/chatbot/sessions/{uuid}/refer", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.set-status": { "uri": "VenQore/api/chatbot/sessions/{uuid}/set-status", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.log-learning": { "uri": "VenQore/api/chatbot/sessions/{uuid}/log-learning", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.assist-suggestion": { "uri": "VenQore/api/chatbot/sessions/{uuid}/assist-suggestion", "methods": ["GET", "HEAD"], "parameters": ["uuid"] }, "platform.chatbot.assist": { "uri": "VenQore/api/chatbot/sessions/{uuid}/assist", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.canned-responses": { "uri": "VenQore/api/chatbot/canned-responses", "methods": ["GET", "HEAD"] }, "platform.chatbot.destroy": { "uri": "VenQore/api/chatbot/sessions/{uuid}", "methods": ["DELETE"], "parameters": ["uuid"] }, "platform.chatbot.autonomy-stats": { "uri": "VenQore/api/platform/vena/autonomy-stats", "methods": ["GET", "HEAD"] }, "platform.chatbot.autonomy-stats.promote": { "uri": "VenQore/api/platform/vena/autonomy-stats/promote", "methods": ["POST"] }, "platform.stores": { "uri": "VenQore/stores", "methods": ["GET", "HEAD"] }, "platform.users": { "uri": "VenQore/users", "methods": ["GET", "HEAD"] }, "platform.store.suspend": { "uri": "VenQore/stores/{tenant}/suspend", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.store.activate": { "uri": "VenQore/stores/{tenant}/activate", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.store.extend-trial": { "uri": "VenQore/stores/{tenant}/extend-trial", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.store.toggle-internal": { "uri": "VenQore/stores/{tenant}/toggle-internal", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.store.destroy": { "uri": "VenQore/stores/{tenant}/destroy", "methods": ["DELETE"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.stores.bulk-destroy": { "uri": "VenQore/stores/bulk-destroy", "methods": ["POST"] }, "platform.store.restore": { "uri": "VenQore/stores/{id}/restore", "methods": ["POST"], "parameters": ["id"] }, "platform.store.purge": { "uri": "VenQore/stores/{id}/purge", "methods": ["DELETE"], "parameters": ["id"] }, "platform.user.destroy": { "uri": "VenQore/users/{user}/destroy", "methods": ["DELETE"], "parameters": ["user"], "bindings": { "user": "id" } }, "platform.users.bulk-destroy": { "uri": "VenQore/users/bulk-destroy", "methods": ["POST"] }, "platform.user.restore": { "uri": "VenQore/users/{id}/restore", "methods": ["POST"], "parameters": ["id"] }, "platform.user.purge": { "uri": "VenQore/users/{id}/purge", "methods": ["DELETE"], "parameters": ["id"] }, "platform.appsumo.index": { "uri": "VenQore/appsumo", "methods": ["GET", "HEAD"] }, "platform.appsumo.generate": { "uri": "VenQore/appsumo/generate", "methods": ["POST"] }, "platform.appsumo.import": { "uri": "VenQore/appsumo/import", "methods": ["POST"] }, "platform.appsumo.export": { "uri": "VenQore/appsumo/export", "methods": ["GET", "HEAD"] }, "platform.appsumo.purge": { "uri": "VenQore/appsumo/purge", "methods": ["DELETE"] }, "platform.tickets": { "uri": "VenQore/tickets", "methods": ["GET", "HEAD"] }, "platform.ticket.show": { "uri": "VenQore/tickets/{ticket}", "methods": ["GET", "HEAD"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.ticket.reply": { "uri": "VenQore/tickets/{ticket}/reply", "methods": ["POST"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.ticket.status": { "uri": "VenQore/tickets/{ticket}/status", "methods": ["POST"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.vena.tickets": { "uri": "VenQore/vena-tickets", "methods": ["GET", "HEAD"] }, "platform.vena.ticket.show": { "uri": "VenQore/vena-tickets/{ticket}", "methods": ["GET", "HEAD"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.vena.ticket.status": { "uri": "VenQore/vena-tickets/{ticket}/status", "methods": ["POST"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.webhooks": { "uri": "VenQore/webhooks", "methods": ["GET", "HEAD"] }, "platform.store.feature-flag": { "uri": "VenQore/stores/{tenant}/feature-flag", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.health.check": { "uri": "VenQore/health/check", "methods": ["GET", "HEAD"] }, "platform.health.errors": { "uri": "VenQore/health/errors", "methods": ["GET", "HEAD"] }, "platform.health.errors.resolve-all": { "uri": "VenQore/health/errors/resolve-all", "methods": ["POST"] }, "platform.health.errors.detect-fixes": { "uri": "VenQore/health/errors/detect-fixes", "methods": ["POST"] }, "platform.health.errors.resolve": { "uri": "VenQore/health/errors/{error}/resolve", "methods": ["POST"], "parameters": ["error"], "bindings": { "error": "id" } }, "platform.health.contacts": { "uri": "VenQore/health/contacts", "methods": ["GET", "HEAD"] }, "platform.health.contacts.read": { "uri": "VenQore/health/contacts/{contact}/read", "methods": ["POST"], "parameters": ["contact"], "bindings": { "contact": "id" } }, "platform.jobs.metrics": { "uri": "VenQore/jobs/metrics", "methods": ["GET", "HEAD"] }, "platform.jobs.retry": { "uri": "VenQore/jobs/failed/{id}/retry", "methods": ["POST"], "parameters": ["id"] }, "platform.jobs.delete-failed": { "uri": "VenQore/jobs/failed/{id}", "methods": ["DELETE"], "parameters": ["id"] }, "platform.jobs.flush-failed": { "uri": "VenQore/jobs/failed/flush", "methods": ["POST"] }, "platform.impersonate.start": { "uri": "VenQore/impersonate/{user}", "methods": ["POST"], "parameters": ["user"], "bindings": { "user": "id" } }, "platform.impersonate.end": { "uri": "VenQore/impersonate/end", "methods": ["POST"] }, "platform.set-passcode": { "uri": "VenQore/security/set-passcode", "methods": ["POST"] }, "platform.clear-passcode": { "uri": "VenQore/security/clear-passcode", "methods": ["POST"] }, "platform.change-password": { "uri": "VenQore/security/change-password", "methods": ["POST"] }, "platform.set-action-passcode": { "uri": "VenQore/security/set-action-passcode", "methods": ["POST"] }, "platform.clear-action-passcode": { "uri": "VenQore/security/clear-action-passcode", "methods": ["POST"] }, "platform.vensynq.toggle": { "uri": "VenQore/vensynq/toggle", "methods": ["POST"] }, "platform.settings.save": { "uri": "VenQore/settings/save", "methods": ["POST"] }, "platform.partners.store": { "uri": "VenQore/partners", "methods": ["POST"] }, "platform.partners.destroy": { "uri": "VenQore/partners/{partner}", "methods": ["DELETE"], "parameters": ["partner"] }, "platform.drawings.store": { "uri": "VenQore/drawings", "methods": ["POST"] }, "platform.drawings.clear-history": { "uri": "VenQore/drawings/clear-history", "methods": ["POST"] }, "platform.plans.index": { "uri": "VenQore/plans", "methods": ["GET", "HEAD"] }, "platform.plans.store": { "uri": "VenQore/plans", "methods": ["POST"] }, "platform.plans.bulk-update": { "uri": "VenQore/plans/bulk-update", "methods": ["PUT"] }, "platform.plans.update": { "uri": "VenQore/plans/{plan}", "methods": ["PUT"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.plans.duplicate": { "uri": "VenQore/plans/{plan}/duplicate", "methods": ["POST"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.plans.destroy": { "uri": "VenQore/plans/{plan}", "methods": ["DELETE"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.plans.archive": { "uri": "VenQore/plans/{plan}/archive", "methods": ["POST"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.plans.unarchive": { "uri": "VenQore/plans/{plan}/unarchive", "methods": ["POST"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.platforms.index": { "uri": "VenQore/platforms", "methods": ["GET", "HEAD"] }, "platform.platforms.store": { "uri": "VenQore/platforms", "methods": ["POST"] }, "platform.platforms.update": { "uri": "VenQore/platforms/{platform}", "methods": ["PUT"], "parameters": ["platform"], "bindings": { "platform": "id" } }, "platform.coupons.index": { "uri": "VenQore/coupons", "methods": ["GET", "HEAD"] }, "platform.coupons.store": { "uri": "VenQore/coupons", "methods": ["POST"] }, "platform.coupons.update": { "uri": "VenQore/coupons/{coupon}", "methods": ["PUT"], "parameters": ["coupon"], "bindings": { "coupon": "id" } }, "platform.access-grants.index": { "uri": "VenQore/access-grants", "methods": ["GET", "HEAD"] }, "platform.access-grants.store": { "uri": "VenQore/access-grants", "methods": ["POST"] }, "platform.access-grants.revoke": { "uri": "VenQore/access-grants/{grant}/revoke", "methods": ["POST"], "parameters": ["grant"], "bindings": { "grant": "id" } }, "platform.access-grants.unrevoke": { "uri": "VenQore/access-grants/{grant}/unrevoke", "methods": ["POST"], "parameters": ["grant"], "bindings": { "grant": "id" } }, "platform.access-grants.destroy": { "uri": "VenQore/access-grants/{grant}", "methods": ["DELETE"], "parameters": ["grant"], "bindings": { "grant": "id" } }, "platform.tenants.overrides": { "uri": "VenQore/tenant-overrides", "methods": ["GET", "HEAD"] }, "platform.tenants.overrides.show": { "uri": "VenQore/tenant-overrides/{tenant}", "methods": ["GET", "HEAD"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.tenants.overrides.update": { "uri": "VenQore/tenant-overrides/{tenant}", "methods": ["PATCH"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.tenants.overrides.apply": { "uri": "VenQore/tenant-overrides/{tenant}", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.tenants.overrides.remove": { "uri": "VenQore/tenant-overrides/{tenant}/{override}", "methods": ["DELETE"], "parameters": ["tenant", "override"], "bindings": { "tenant": "id", "override": "id" } }, "platform.pk-verifications.approve": { "uri": "VenQore/pk-verifications/{verification}/approve", "methods": ["POST"], "parameters": ["verification"] }, "platform.pk-verifications.reject": { "uri": "VenQore/pk-verifications/{verification}/reject", "methods": ["POST"], "parameters": ["verification"] }, "platform.pk-verifications.download": { "uri": "VenQore/pk-verifications/{verification}/download/{side}", "methods": ["GET", "HEAD"], "parameters": ["verification", "side"] }, "platform.admin.migration.analyze": { "uri": "VenQore/admin/migration/analyze", "methods": ["POST"] }, "platform.demo-store.status": { "uri": "VenQore/demo-store/status", "methods": ["GET", "HEAD"] }, "platform.demo-store.reset": { "uri": "VenQore/demo-store/reset", "methods": ["POST"] }, "platform.demo-store.deploy": { "uri": "VenQore/demo-store/deploy", "methods": ["POST"] }, "platform.demo-store.deploy.status": { "uri": "VenQore/demo-store/deploy/status/{jobId}", "methods": ["GET", "HEAD"], "parameters": ["jobId"] }, "platform.demo-store.deploy.cleanup": { "uri": "VenQore/demo-store/deploy/cleanup/{jobId}", "methods": ["DELETE"], "parameters": ["jobId"] }, "platform.demo-store.tests.run": { "uri": "VenQore/demo-store/tests/run", "methods": ["POST"] }, "platform.demo-store.tests.status": { "uri": "VenQore/demo-store/tests/status/{jobId}", "methods": ["GET", "HEAD"], "parameters": ["jobId"] }, "platform.demo-store.tests.cleanup": { "uri": "VenQore/demo-store/tests/cleanup/{jobId}", "methods": ["DELETE"], "parameters": ["jobId"] }, "platform.smoke-tests.run": { "uri": "VenQore/smoke-tests/run", "methods": ["POST"] }, "platform.smoke-tests.status": { "uri": "VenQore/smoke-tests/{job_id}", "methods": ["GET", "HEAD"], "parameters": ["job_id"] }, "platform.smoke-tests.cleanup": { "uri": "VenQore/smoke-tests/{job_id}", "methods": ["DELETE"], "parameters": ["job_id"] }, "welcome": { "uri": "/", "methods": ["GET", "HEAD"] }, "welcome-splash": { "uri": "welcome-splash", "methods": ["GET", "HEAD"] }, "gift.show": { "uri": "gift/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "redeem": { "uri": "redeem", "methods": ["GET", "HEAD"] }, "redeem.submit": { "uri": "redeem", "methods": ["POST"] }, "what-is-included": { "uri": "what-is-included", "methods": ["GET", "HEAD"] }, "refund-policy": { "uri": "refund-policy", "methods": ["GET", "HEAD"] }, "health": { "uri": "health", "methods": ["GET", "HEAD"] }, "storage.local": { "uri": "storage/{path}", "methods": ["GET", "HEAD"], "wheres": { "path": ".*" }, "parameters": ["path"] }, "installer.index": { "uri": "installer", "methods": ["GET", "HEAD"] }, "csrf.refresh": { "uri": "refresh-csrf", "methods": ["GET", "HEAD"] }, "updater.index": { "uri": "updater", "methods": ["GET", "HEAD"] }, "dashboard": { "uri": "dashboard", "methods": ["GET", "HEAD"] }, "api.report-error": { "uri": "api/report-error", "methods": ["POST"] }, "store.inventory.search": { "uri": "s/{store_slug}/inventory/search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.customers.search": { "uri": "s/{store_slug}/customers-search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.categories": { "uri": "s/{store_slug}/api/pos/categories", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.parked": { "uri": "s/{store_slug}/sales/parked", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.recall": { "uri": "s/{store_slug}/sales/parked/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.sales.parked.delete": { "uri": "s/{store_slug}/sales/parked/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.sales.park": { "uri": "s/{store_slug}/sales/park", "methods": ["POST"], "parameters": ["store_slug"] }, "store.dashboard": { "uri": "s/{store_slug}/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.onboarding.step": { "uri": "s/{store_slug}/onboarding/step", "methods": ["POST"], "parameters": ["store_slug"] }, "store.home": { "uri": "s/{store_slug}/home", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.dashboard-v1": { "uri": "s/{store_slug}/dashboard-v1", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.inventory.dashboard": { "uri": "s/{store_slug}/inventory", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.inventory.index": { "uri": "s/{store_slug}/inventory/list", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.inventory.stats": { "uri": "s/{store_slug}/inventory/{id}/stats", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.inventory.store": { "uri": "s/{store_slug}/inventory", "methods": ["POST"], "parameters": ["store_slug"] }, "store.inventory.bulk-destroy": { "uri": "s/{store_slug}/inventory/bulk-destroy", "methods": ["POST"], "parameters": ["store_slug"] }, "store.inventory.check-dependencies": { "uri": "s/{store_slug}/inventory/check-dependencies", "methods": ["POST"], "parameters": ["store_slug"] }, "store.inventory.reservations": { "uri": "s/{store_slug}/inventory/{id}/reservations", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.inventory.history": { "uri": "s/{store_slug}/inventory/{id}/history", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.inventory.update": { "uri": "s/{store_slug}/inventory/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.inventory.destroy": { "uri": "s/{store_slug}/inventory/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.stock-operations": { "uri": "s/{store_slug}/stock-operations", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-operations.transfer": { "uri": "s/{store_slug}/stock-operations/transfer", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-operations.adjust": { "uri": "s/{store_slug}/stock-operations/adjust", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-operations.audit": { "uri": "s/{store_slug}/stock-operations/audit", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-operations.warehouse.store": { "uri": "s/{store_slug}/stock-operations/warehouse", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-operations.warehouse.update": { "uri": "s/{store_slug}/stock-operations/warehouse/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.activity-log.index": { "uri": "s/{store_slug}/activity-log", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.users": { "uri": "s/{store_slug}/api/sync/users", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.products": { "uri": "s/{store_slug}/api/sync/products", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.customers": { "uri": "s/{store_slug}/api/sync/customers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.suppliers": { "uri": "s/{store_slug}/api/sync/suppliers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.inventory": { "uri": "s/{store_slug}/api/sync/inventory", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.taxes": { "uri": "s/{store_slug}/api/sync/taxes", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.orders.batch": { "uri": "s/{store_slug}/api/sync/orders/batch", "methods": ["POST"], "parameters": ["store_slug"] }, "store.api.heartbeat": { "uri": "s/{store_slug}/api/heartbeat", "methods": ["POST"], "parameters": ["store_slug"] }, "store.api.check-connection": { "uri": "s/{store_slug}/api/check-connection", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.suppliers.index": { "uri": "s/{store_slug}/suppliers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.suppliers.store": { "uri": "s/{store_slug}/suppliers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.suppliers.update": { "uri": "s/{store_slug}/suppliers/{supplier}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "supplier"], "bindings": { "supplier": "id" } }, "store.suppliers.destroy": { "uri": "s/{store_slug}/suppliers/{supplier}", "methods": ["DELETE"], "parameters": ["store_slug", "supplier"], "bindings": { "supplier": "id" } }, "store.purchase-orders.index": { "uri": "s/{store_slug}/purchase-orders", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.purchase-orders.create": { "uri": "s/{store_slug}/purchase-orders/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.purchase-orders.store": { "uri": "s/{store_slug}/purchase-orders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.purchase-orders.show": { "uri": "s/{store_slug}/purchase-orders/{purchase_order}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase_order"] }, "store.purchase-orders.edit": { "uri": "s/{store_slug}/purchase-orders/{purchase_order}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase_order"] }, "store.purchase-orders.update": { "uri": "s/{store_slug}/purchase-orders/{purchase_order}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "purchase_order"] }, "store.purchase-orders.destroy": { "uri": "s/{store_slug}/purchase-orders/{purchase_order}", "methods": ["DELETE"], "parameters": ["store_slug", "purchase_order"] }, "store.purchase-orders.receive": { "uri": "s/{store_slug}/purchase-orders/{purchaseOrder}/receive", "methods": ["POST"], "parameters": ["store_slug", "purchaseOrder"], "bindings": { "purchaseOrder": "id" } }, "store.purchase-orders.print": { "uri": "s/{store_slug}/purchase-orders/{purchaseOrder}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchaseOrder"], "bindings": { "purchaseOrder": "id" } }, "store.proposals.index": { "uri": "s/{store_slug}/proposals", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.proposals.create": { "uri": "s/{store_slug}/proposals/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.proposals.store": { "uri": "s/{store_slug}/proposals", "methods": ["POST"], "parameters": ["store_slug"] }, "store.proposals.show": { "uri": "s/{store_slug}/proposals/{proposal}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.edit": { "uri": "s/{store_slug}/proposals/{proposal}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.update": { "uri": "s/{store_slug}/proposals/{proposal}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "proposal"] }, "store.proposals.destroy": { "uri": "s/{store_slug}/proposals/{proposal}", "methods": ["DELETE"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.convert": { "uri": "s/{store_slug}/proposals/{proposal}/convert", "methods": ["POST"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.convert-to-sale": { "uri": "s/{store_slug}/proposals/{proposal}/convert-to-sale", "methods": ["POST"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.convert-to-presale": { "uri": "s/{store_slug}/proposals/{proposal}/convert-to-presale", "methods": ["POST"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.print": { "uri": "s/{store_slug}/proposals/{proposal}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.sales-orders.index": { "uri": "s/{store_slug}/sales-orders", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales-orders.create": { "uri": "s/{store_slug}/sales-orders/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales-orders.store": { "uri": "s/{store_slug}/sales-orders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales-orders.show": { "uri": "s/{store_slug}/sales-orders/{order}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.sales-orders.update": { "uri": "s/{store_slug}/sales-orders/{order}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.sales-orders.destroy": { "uri": "s/{store_slug}/sales-orders/{order}", "methods": ["DELETE"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.sales-orders.convert": { "uri": "s/{store_slug}/sales-orders/{salesOrder}/convert", "methods": ["POST"], "parameters": ["store_slug", "salesOrder"], "bindings": { "salesOrder": "id" } }, "store.sales-orders.export": { "uri": "s/{store_slug}/sales-orders/export/excel", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales-orders.print": { "uri": "s/{store_slug}/sales-orders/{salesOrder}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "salesOrder"], "bindings": { "salesOrder": "id" } }, "store.sales-orders.cancel": { "uri": "s/{store_slug}/sales-orders/{salesOrder}/cancel", "methods": ["POST"], "parameters": ["store_slug", "salesOrder"], "bindings": { "salesOrder": "id" } }, "store.labels.index": { "uri": "s/{store_slug}/labels", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.labels.print": { "uri": "s/{store_slug}/labels/print", "methods": ["POST"], "parameters": ["store_slug"] }, "store.reports.index": { "uri": "s/{store_slug}/reports", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.daily-sales": { "uri": "s/{store_slug}/reports/daily-sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sales": { "uri": "s/{store_slug}/reports/sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.purchases": { "uri": "s/{store_slug}/reports/purchases", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.day-book": { "uri": "s/{store_slug}/reports/day-book", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.profit-loss": { "uri": "s/{store_slug}/reports/profit-loss", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.party-statement": { "uri": "s/{store_slug}/reports/party-statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.transactions": { "uri": "s/{store_slug}/reports/transactions", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.expenses": { "uri": "s/{store_slug}/reports/expenses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.account-ledger": { "uri": "s/{store_slug}/reports/account-ledger", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.tax": { "uri": "s/{store_slug}/reports/tax", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.bank-statement": { "uri": "s/{store_slug}/reports/bank-statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.stock-valuation": { "uri": "s/{store_slug}/reports/stock-valuation", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.low-stock": { "uri": "s/{store_slug}/reports/low-stock", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.movement-history": { "uri": "s/{store_slug}/reports/movement-history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.expiry": { "uri": "s/{store_slug}/reports/expiry", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.balance-sheet": { "uri": "s/{store_slug}/reports/balance-sheet", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.all-parties": { "uri": "s/{store_slug}/reports/all-parties", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.trial-balance": { "uri": "s/{store_slug}/reports/trial-balance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-wise-profit": { "uri": "s/{store_slug}/reports/item-wise-profit", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.party-wise-profit-loss": { "uri": "s/{store_slug}/reports/party-wise-profit-loss", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.discount": { "uri": "s/{store_slug}/reports/discount", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.cash-flow": { "uri": "s/{store_slug}/reports/cash-flow", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-aging": { "uri": "s/{store_slug}/reports/sale-aging", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-orders": { "uri": "s/{store_slug}/reports/sale-orders", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.bill-wise-profit": { "uri": "s/{store_slug}/reports/bill-wise-profit", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.expense-by-category": { "uri": "s/{store_slug}/reports/expense-by-category", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.expense-by-item": { "uri": "s/{store_slug}/reports/expense-by-item", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.stock-summary-by-category": { "uri": "s/{store_slug}/reports/stock-summary-by-category", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-detail": { "uri": "s/{store_slug}/reports/item-detail", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.loan-statement": { "uri": "s/{store_slug}/reports/loan-statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.tax-rate": { "uri": "s/{store_slug}/reports/tax-rate", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-purchase-by-party": { "uri": "s/{store_slug}/reports/sale-purchase-by-party", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-report-by-party": { "uri": "s/{store_slug}/reports/item-report-by-party", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.party-report-by-item": { "uri": "s/{store_slug}/reports/party-report-by-item", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-purchase-by-item-category": { "uri": "s/{store_slug}/reports/sale-purchase-by-item-category", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-category-wise-profit-loss": { "uri": "s/{store_slug}/reports/item-category-wise-profit-loss", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-wise-discount": { "uri": "s/{store_slug}/reports/item-wise-discount", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-order-items": { "uri": "s/{store_slug}/reports/sale-order-items", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.stock-aging": { "uri": "s/{store_slug}/reports/stock-aging", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-purchase-by-party-group": { "uri": "s/{store_slug}/reports/sale-purchase-by-party-group", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.analytics": { "uri": "s/{store_slug}/reports/analytics", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.point-in-time-inventory": { "uri": "s/{store_slug}/reports/point-in-time-inventory", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.point-in-time-inventory.details": { "uri": "s/{store_slug}/reports/point-in-time-inventory/details", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.customer-insights": { "uri": "s/{store_slug}/reports/customer-insights", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.customer-insights.details": { "uri": "s/{store_slug}/reports/customer-insights/details", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.supplier-insights": { "uri": "s/{store_slug}/reports/supplier-insights", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.supplier-insights.details": { "uri": "s/{store_slug}/reports/supplier-insights/details", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse": { "uri": "s/{store_slug}/reports/owner-daily-pulse", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse.verify": { "uri": "s/{store_slug}/reports/owner-daily-pulse/verify", "methods": ["POST"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse.setup": { "uri": "s/{store_slug}/reports/owner-daily-pulse/setup", "methods": ["POST"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse.lock": { "uri": "s/{store_slug}/reports/owner-daily-pulse/lock", "methods": ["POST"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse.note": { "uri": "s/{store_slug}/reports/owner-daily-pulse/note", "methods": ["POST"], "parameters": ["store_slug"] }, "store.cookbook.index": { "uri": "s/{store_slug}/cookbook", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.cookbook.create": { "uri": "s/{store_slug}/cookbook/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.cookbook.store": { "uri": "s/{store_slug}/cookbook", "methods": ["POST"], "parameters": ["store_slug"] }, "store.cookbook.edit": { "uri": "s/{store_slug}/cookbook/{id}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.cookbook.update": { "uri": "s/{store_slug}/cookbook/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.cookbook.destroy": { "uri": "s/{store_slug}/cookbook/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.cookbook.simulate": { "uri": "s/{store_slug}/cookbook/simulate", "methods": ["POST"], "parameters": ["store_slug"] }, "store.growth-engine.index": { "uri": "s/{store_slug}/growth-engine", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.growth-engine.refresh": { "uri": "s/{store_slug}/growth-engine/refresh", "methods": ["POST"], "parameters": ["store_slug"] }, "store.growth-engine.dashboard": { "uri": "s/{store_slug}/growth-engine/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.growth-engine.whatsapp": { "uri": "s/{store_slug}/growth-engine/whatsapp/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.growth-engine.dismiss": { "uri": "s/{store_slug}/growth-engine/dismiss/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.growth-engine.mark-read": { "uri": "s/{store_slug}/growth-engine/mark-read/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.growth-engine.settings": { "uri": "s/{store_slug}/growth-engine/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.growth-engine.update-settings": { "uri": "s/{store_slug}/growth-engine/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.global.search": { "uri": "s/{store_slug}/global-search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.ai.query": { "uri": "s/{store_slug}/ai/query", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.ai.test": { "uri": "s/{store_slug}/ai/test-connection", "methods": ["POST"], "parameters": ["store_slug"] }, "store.ai.recommendations": { "uri": "s/{store_slug}/ai/recommendations", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.ai.smart-reorder": { "uri": "s/{store_slug}/ai/smart-reorder", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.ai.cash-flow-forecast": { "uri": "s/{store_slug}/ai/cash-flow-forecast", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.products.variants.index": { "uri": "s/{store_slug}/products/{product}/variants", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "product"], "bindings": { "product": "id" } }, "store.products.variants.store": { "uri": "s/{store_slug}/products/{product}/variants", "methods": ["POST"], "parameters": ["store_slug", "product"], "bindings": { "product": "id" } }, "store.variants.update": { "uri": "s/{store_slug}/variants/{variant}", "methods": ["PUT"], "parameters": ["store_slug", "variant"], "bindings": { "variant": "id" } }, "store.variants.destroy": { "uri": "s/{store_slug}/variants/{variant}", "methods": ["DELETE"], "parameters": ["store_slug", "variant"], "bindings": { "variant": "id" } }, "store.attributes.index": { "uri": "s/{store_slug}/attributes", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.attributes.store": { "uri": "s/{store_slug}/attributes", "methods": ["POST"], "parameters": ["store_slug"] }, "store.attributes.update": { "uri": "s/{store_slug}/attributes/{attribute}", "methods": ["PUT"], "parameters": ["store_slug", "attribute"], "bindings": { "attribute": "id" } }, "store.attributes.destroy": { "uri": "s/{store_slug}/attributes/{attribute}", "methods": ["DELETE"], "parameters": ["store_slug", "attribute"], "bindings": { "attribute": "id" } }, "store.categories.index": { "uri": "s/{store_slug}/inventory/categories", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.categories.store": { "uri": "s/{store_slug}/categories", "methods": ["POST"], "parameters": ["store_slug"] }, "store.categories.update": { "uri": "s/{store_slug}/categories/{category}", "methods": ["PUT"], "parameters": ["store_slug", "category"] }, "store.categories.destroy": { "uri": "s/{store_slug}/categories/{category}", "methods": ["DELETE"], "parameters": ["store_slug", "category"] }, "store.inventory.stock-levels": { "uri": "s/{store_slug}/inventory/stock-levels", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.bank-accounts.index": { "uri": "s/{store_slug}/bank-accounts", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.bank-accounts.store": { "uri": "s/{store_slug}/bank-accounts", "methods": ["POST"], "parameters": ["store_slug"] }, "store.bank-accounts.update": { "uri": "s/{store_slug}/bank-accounts/{bankAccount}", "methods": ["PUT"], "parameters": ["store_slug", "bankAccount"] }, "store.bank-accounts.destroy": { "uri": "s/{store_slug}/bank-accounts/{bankAccount}", "methods": ["DELETE"], "parameters": ["store_slug", "bankAccount"] }, "store.bank-accounts.transactions": { "uri": "s/{store_slug}/bank-accounts/{bankAccount}/transactions", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "bankAccount"] }, "store.parties.index": { "uri": "s/{store_slug}/parties", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.parties.store": { "uri": "s/{store_slug}/parties", "methods": ["POST"], "parameters": ["store_slug"] }, "store.parties.update": { "uri": "s/{store_slug}/parties/{party}", "methods": ["PUT"], "parameters": ["store_slug", "party"] }, "store.parties.destroy": { "uri": "s/{store_slug}/parties/{party}", "methods": ["DELETE"], "parameters": ["store_slug", "party"] }, "store.parties.bulk-destroy": { "uri": "s/{store_slug}/parties", "methods": ["DELETE"], "parameters": ["store_slug"] }, "store.parties.ledgers": { "uri": "s/{store_slug}/parties/ledgers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.parties.ledger": { "uri": "s/{store_slug}/parties/{party}/ledger", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "party"] }, "store.parties.show": { "uri": "s/{store_slug}/parties/{party}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "party"] }, "store.expenses.index": { "uri": "s/{store_slug}/expenses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.expenses.store": { "uri": "s/{store_slug}/expenses", "methods": ["POST"], "parameters": ["store_slug"] }, "store.expenses.category.store": { "uri": "s/{store_slug}/expenses/category", "methods": ["POST"], "parameters": ["store_slug"] }, "store.expenses.update": { "uri": "s/{store_slug}/expenses/{expense}", "methods": ["PUT"], "parameters": ["store_slug", "expense"] }, "store.expenses.destroy": { "uri": "s/{store_slug}/expenses/{expense}", "methods": ["DELETE"], "parameters": ["store_slug", "expense"] }, "store.vensynq.index": { "uri": "s/{store_slug}/vensynq", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.vensynq.channels.store": { "uri": "s/{store_slug}/vensynq/channels", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.channels.update": { "uri": "s/{store_slug}/vensynq/channels/{channel}", "methods": ["PATCH"], "parameters": ["store_slug", "channel"], "bindings": { "channel": "id" } }, "store.vensynq.channels.destroy": { "uri": "s/{store_slug}/vensynq/channels/{channel}", "methods": ["DELETE"], "parameters": ["store_slug", "channel"], "bindings": { "channel": "id" } }, "store.vensynq.preview": { "uri": "s/{store_slug}/vensynq/preview", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.process": { "uri": "s/{store_slug}/vensynq/process", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.sync-tracking": { "uri": "s/{store_slug}/vensynq/sync-tracking", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.jit.approve": { "uri": "s/{store_slug}/vensynq/jit-drafts/{purchase}/approve", "methods": ["PATCH"], "parameters": ["store_slug", "purchase"], "bindings": { "purchase": "id" } }, "store.vensynq.settings": { "uri": "s/{store_slug}/vensynq/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.vensynq.connect": { "uri": "s/{store_slug}/vensynq/connect/{platform}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "platform"] }, "store.vensynq.callback": { "uri": "s/{store_slug}/vensynq/callback/{platform}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "platform"] }, "store.vensynq.channels.disconnect": { "uri": "s/{store_slug}/vensynq/channels/{channel}/disconnect", "methods": ["DELETE"], "parameters": ["store_slug", "channel"], "bindings": { "channel": "id" } }, "store.vensynq.sync-orders": { "uri": "s/{store_slug}/vensynq/sync-orders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.payments.index": { "uri": "s/{store_slug}/payments", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payments.in": { "uri": "s/{store_slug}/payments/in", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payments.out": { "uri": "s/{store_slug}/payments/out", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payments.store": { "uri": "s/{store_slug}/payments", "methods": ["POST"], "parameters": ["store_slug"] }, "store.payments.show": { "uri": "s/{store_slug}/payments/{payment}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "payment"] }, "store.purchases.index": { "uri": "s/{store_slug}/purchases", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.purchases.create": { "uri": "s/{store_slug}/purchases/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.purchases.store": { "uri": "s/{store_slug}/purchases", "methods": ["POST"], "parameters": ["store_slug"] }, "store.purchases.show": { "uri": "s/{store_slug}/purchases/{purchase}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.purchases.edit": { "uri": "s/{store_slug}/purchases/{purchase}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.purchases.update": { "uri": "s/{store_slug}/purchases/{purchase}", "methods": ["PUT"], "parameters": ["store_slug", "purchase"] }, "store.purchases.destroy": { "uri": "s/{store_slug}/purchases/{purchase}", "methods": ["DELETE"], "parameters": ["store_slug", "purchase"] }, "store.purchases.receive": { "uri": "s/{store_slug}/purchases/{purchase}/receive", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.transactions.index": { "uri": "s/{store_slug}/transactions", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.inventory.stock": { "uri": "s/{store_slug}/inventory/stock", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pre-sales.index": { "uri": "s/{store_slug}/sales/pre-sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pre-sales.create": { "uri": "s/{store_slug}/sales/pre-sales/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pre-sales.store": { "uri": "s/{store_slug}/sales/pre-sales", "methods": ["POST"], "parameters": ["store_slug"] }, "store.pre-sales.export": { "uri": "s/{store_slug}/sales/pre-sales/export/excel", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.orders.show": { "uri": "s/{store_slug}/sales/orders/{order}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.sales.orders.update": { "uri": "s/{store_slug}/sales/orders/{order}", "methods": ["PUT"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.pre-sales.convert": { "uri": "s/{store_slug}/sales/pre-sales/{salesOrder}/convert", "methods": ["POST"], "parameters": ["store_slug", "salesOrder"], "bindings": { "salesOrder": "id" } }, "store.pre-sales.destroy": { "uri": "s/{store_slug}/sales/pre-sales/{order}", "methods": ["DELETE"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.production.index": { "uri": "s/{store_slug}/inventory/production", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.production.create": { "uri": "s/{store_slug}/inventory/production/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.production.store": { "uri": "s/{store_slug}/inventory/production", "methods": ["POST"], "parameters": ["store_slug"] }, "store.production.show": { "uri": "s/{store_slug}/inventory/production/{run}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "run"] }, "store.production.complete": { "uri": "s/{store_slug}/inventory/production/{run}/complete", "methods": ["POST"], "parameters": ["store_slug", "run"] }, "store.parked-sales.index": { "uri": "s/{store_slug}/sales/parked-items", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.parked-sales.destroy": { "uri": "s/{store_slug}/sales/parked-items/{sale}", "methods": ["DELETE"], "parameters": ["store_slug", "sale"] }, "store.purchases.receive.store": { "uri": "s/{store_slug}/purchases/{purchase}/receive", "methods": ["POST"], "parameters": ["store_slug", "purchase"] }, "store.customers.index": { "uri": "s/{store_slug}/customers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.customers.create": { "uri": "s/{store_slug}/customers/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.customers.store": { "uri": "s/{store_slug}/customers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.customers.update": { "uri": "s/{store_slug}/customers/{customer}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "customer"], "bindings": { "customer": "id" } }, "store.customers.destroy": { "uri": "s/{store_slug}/customers/{customer}", "methods": ["DELETE"], "parameters": ["store_slug", "customer"], "bindings": { "customer": "id" } }, "store.suppliers.search": { "uri": "s/{store_slug}/suppliers-search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.parties.search": { "uri": "s/{store_slug}/parties-search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.dashboard": { "uri": "s/{store_slug}/sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.index": { "uri": "s/{store_slug}/sales/list", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.export": { "uri": "s/{store_slug}/sales/export", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.store": { "uri": "s/{store_slug}/sales", "methods": ["POST"], "parameters": ["store_slug"] }, "store.attendance.status": { "uri": "s/{store_slug}/attendance/status", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.attendance.check-in": { "uri": "s/{store_slug}/attendance/check-in", "methods": ["POST"], "parameters": ["store_slug"] }, "store.attendance.heartbeat": { "uri": "s/{store_slug}/attendance/heartbeat", "methods": ["POST"], "parameters": ["store_slug"] }, "store.attendance.check-out": { "uri": "s/{store_slug}/attendance/check-out", "methods": ["POST"], "parameters": ["store_slug"] }, "store.attendance.log-gap": { "uri": "s/{store_slug}/attendance/log-gap", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.print": { "uri": "s/{store_slug}/sales/{sale}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "sale"] }, "store.sales.lookup": { "uri": "s/{store_slug}/sales/lookup", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.bulk-destroy": { "uri": "s/{store_slug}/sales/bulk-destroy", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.get-items": { "uri": "s/{store_slug}/sales/get-items", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.show": { "uri": "s/{store_slug}/sales/{sale}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "sale"] }, "store.sales.edit": { "uri": "s/{store_slug}/sales/{sale}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "sale"], "bindings": { "sale": "id" } }, "store.sales.update": { "uri": "s/{store_slug}/sales/{sale}", "methods": ["PUT"], "parameters": ["store_slug", "sale"], "bindings": { "sale": "id" } }, "store.sales.cancel": { "uri": "s/{store_slug}/sales/{sale}/cancel", "methods": ["POST"], "parameters": ["store_slug", "sale"], "bindings": { "sale": "id" } }, "store.pos.return.store": { "uri": "s/{store_slug}/pos/return", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.return": { "uri": "s/{store_slug}/sales/{sale}/return", "methods": ["POST"], "parameters": ["store_slug", "sale"] }, "store.sales.destroy": { "uri": "s/{store_slug}/sales/{sale}", "methods": ["DELETE"], "parameters": ["store_slug", "sale"], "bindings": { "sale": "id" } }, "store.sales.invoice.create": { "uri": "s/{store_slug}/sales/invoice/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.master": { "uri": "s/{store_slug}/sales/master", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.presales.create": { "uri": "s/{store_slug}/sales/presale/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.manufacturing.rules": { "uri": "s/{store_slug}/manufacturing/rules", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.categories.general": { "uri": "s/{store_slug}/api/categories", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.warehouses": { "uri": "s/{store_slug}/api/warehouses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.finance": { "uri": "s/{store_slug}/finance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.finance.receivables": { "uri": "s/{store_slug}/finance/receivables", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.finance.payables": { "uri": "s/{store_slug}/finance/payables", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.funds.index": { "uri": "s/{store_slug}/funds", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.funds.add": { "uri": "s/{store_slug}/funds/add", "methods": ["POST"], "parameters": ["store_slug"] }, "store.funds.remove": { "uri": "s/{store_slug}/funds/remove", "methods": ["POST"], "parameters": ["store_slug"] }, "store.funds.transfer": { "uri": "s/{store_slug}/funds/transfer", "methods": ["POST"], "parameters": ["store_slug"] }, "store.funds.adjust": { "uri": "s/{store_slug}/funds/adjust", "methods": ["POST"], "parameters": ["store_slug"] }, "store.funds.history.ledger": { "uri": "s/{store_slug}/funds/cash-history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.funds.cash-history": { "uri": "s/{store_slug}/funds/api/history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.custom-charges": { "uri": "s/{store_slug}/api/custom-charges", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.bank-accounts": { "uri": "s/{store_slug}/api/bank-accounts", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.settings.charges.store": { "uri": "s/{store_slug}/settings/charges", "methods": ["POST"], "parameters": ["store_slug"] }, "store.settings.charges.update": { "uri": "s/{store_slug}/settings/charges/{charge}", "methods": ["PUT"], "parameters": ["store_slug", "charge"], "bindings": { "charge": "id" } }, "store.settings.charges.delete": { "uri": "s/{store_slug}/settings/charges/{charge}", "methods": ["DELETE"], "parameters": ["store_slug", "charge"], "bindings": { "charge": "id" } }, "store.charity.stats": { "uri": "s/{store_slug}/charity/stats", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.charity.add": { "uri": "s/{store_slug}/charity/add", "methods": ["POST"], "parameters": ["store_slug"] }, "store.charity.update-default": { "uri": "s/{store_slug}/charity/update-default", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.send-email": { "uri": "s/{store_slug}/sales/{id}/send-email", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.sales.send-whatsapp": { "uri": "s/{store_slug}/sales/{id}/send-whatsapp", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.accounting.dashboard": { "uri": "s/{store_slug}/accounting", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.accounting.index": { "uri": "s/{store_slug}/accounting/chart", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.accounting.pnl": { "uri": "s/{store_slug}/accounting/p-and-l", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.accounting.balance-sheet": { "uri": "s/{store_slug}/accounting/balance-sheet", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.accounting.accounts.api": { "uri": "s/{store_slug}/accounting/api/accounts", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.dashboard": { "uri": "s/{store_slug}/reports/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.panel": { "uri": "s/{store_slug}/admin-panel", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.data": { "uri": "s/{store_slug}/admin-panel/data-management", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.data.export": { "uri": "s/{store_slug}/admin-panel/data/export", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.import": { "uri": "s/{store_slug}/admin-panel/data/import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.upload-mapping": { "uri": "s/{store_slug}/admin-panel/data/upload-mapping", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.process-import": { "uri": "s/{store_slug}/admin-panel/data/process-import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.validate-import": { "uri": "s/{store_slug}/admin-panel/data/validate-import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.template": { "uri": "s/{store_slug}/admin-panel/data/template", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.backups.index": { "uri": "s/{store_slug}/admin-panel/backups", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.backups.store": { "uri": "s/{store_slug}/admin-panel/backups", "methods": ["POST"], "parameters": ["store_slug"] }, "store.backups.restore": { "uri": "s/{store_slug}/admin-panel/backups/restore", "methods": ["POST"], "parameters": ["store_slug"] }, "store.backups.import": { "uri": "s/{store_slug}/admin-panel/backups/import-data", "methods": ["POST"], "parameters": ["store_slug"] }, "store.backups.progress": { "uri": "s/{store_slug}/admin-panel/backups/progress", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.backups.download": { "uri": "s/{store_slug}/admin-panel/backups/{filename}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "filename"] }, "store.backups.delete": { "uri": "s/{store_slug}/admin-panel/backups/{filename}", "methods": ["DELETE"], "parameters": ["store_slug", "filename"] }, "store.backups.email": { "uri": "s/{store_slug}/admin-panel/backups/{filename}/email", "methods": ["POST"], "parameters": ["store_slug", "filename"] }, "store.legacy.admin.dashboard": { "uri": "s/{store_slug}/admin-panel/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.migration.index": { "uri": "s/{store_slug}/admin-panel/migration", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.migration.analyze": { "uri": "s/{store_slug}/admin-panel/migration/analyze", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.migration.execute": { "uri": "s/{store_slug}/admin-panel/migration/execute", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.users": { "uri": "s/{store_slug}/admin-panel/users", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.users.store": { "uri": "s/{store_slug}/admin-panel/users", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.users.update": { "uri": "s/{store_slug}/admin-panel/users/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.legacy.admin.users.destroy": { "uri": "s/{store_slug}/admin-panel/users/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.legacy.admin.settings": { "uri": "s/{store_slug}/admin-panel/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.settings.update": { "uri": "s/{store_slug}/admin-panel/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.logs": { "uri": "s/{store_slug}/admin-panel/logs", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.database": { "uri": "s/{store_slug}/admin-panel/database", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.staff": { "uri": "s/{store_slug}/admin-panel/staff", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.staff-attendance.index": { "uri": "s/{store_slug}/staff-attendance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.terminal-activities.screenshot": { "uri": "s/{store_slug}/terminal-activities/screenshot/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.staff-attendance.show": { "uri": "s/{store_slug}/staff-attendance/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.staff-attendance.approve-gap": { "uri": "s/{store_slug}/staff-attendance/approve-gap/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.staff-attendance.reject-gap": { "uri": "s/{store_slug}/staff-attendance/reject-gap/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.loyalty.info": { "uri": "s/{store_slug}/api/loyalty/{partyId}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "partyId"] }, "store.loyalty.award": { "uri": "s/{store_slug}/api/loyalty/award", "methods": ["POST"], "parameters": ["store_slug"] }, "store.loyalty.redeem": { "uri": "s/{store_slug}/api/loyalty/redeem", "methods": ["POST"], "parameters": ["store_slug"] }, "store.gift-cards.create": { "uri": "s/{store_slug}/api/gift-cards", "methods": ["POST"], "parameters": ["store_slug"] }, "store.gift-cards.check": { "uri": "s/{store_slug}/api/gift-cards/{code}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "code"] }, "store.gift-cards.use": { "uri": "s/{store_slug}/api/gift-cards/use", "methods": ["POST"], "parameters": ["store_slug"] }, "store.store-credit.add": { "uri": "s/{store_slug}/api/store-credit/add", "methods": ["POST"], "parameters": ["store_slug"] }, "store.store-credit.use": { "uri": "s/{store_slug}/api/store-credit/use", "methods": ["POST"], "parameters": ["store_slug"] }, "store.notifications.index": { "uri": "s/{store_slug}/notifications", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.notifications.mark-all-read": { "uri": "s/{store_slug}/notifications/mark-all-read", "methods": ["POST"], "parameters": ["store_slug"] }, "store.notifications.mark-read": { "uri": "s/{store_slug}/notifications/{id}/mark-read", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.notifications.destroy": { "uri": "s/{store_slug}/notifications/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.profile.edit": { "uri": "s/{store_slug}/profile", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.profile.update": { "uri": "s/{store_slug}/profile", "methods": ["PATCH"], "parameters": ["store_slug"] }, "store.profile.destroy": { "uri": "s/{store_slug}/profile", "methods": ["DELETE"], "parameters": ["store_slug"] }, "store.profile.passcode": { "uri": "s/{store_slug}/profile/passcode", "methods": ["POST"], "parameters": ["store_slug"] }, "store.profile.security-pin": { "uri": "s/{store_slug}/profile/security-pin", "methods": ["POST"], "parameters": ["store_slug"] }, "store.profile.verify-security-pin": { "uri": "s/{store_slug}/profile/verify-security-pin", "methods": ["POST"], "parameters": ["store_slug"] }, "store.profile.verify-elevated-pin": { "uri": "s/{store_slug}/profile/verify-elevated-pin", "methods": ["POST"], "parameters": ["store_slug"] }, "store.profile.store-members": { "uri": "s/{store_slug}/profile/store-members", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.returns-history.index": { "uri": "s/{store_slug}/returns-history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.returns.create": { "uri": "s/{store_slug}/returns/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.returns.store": { "uri": "s/{store_slug}/returns", "methods": ["POST"], "parameters": ["store_slug"] }, "store.returns-history.show": { "uri": "s/{store_slug}/returns-history/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.recurring-invoices.index": { "uri": "s/{store_slug}/recurring-invoices", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.recurring-invoices.create": { "uri": "s/{store_slug}/recurring-invoices/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.recurring-invoices.store": { "uri": "s/{store_slug}/recurring-invoices", "methods": ["POST"], "parameters": ["store_slug"] }, "store.recurring-invoices.edit": { "uri": "s/{store_slug}/recurring-invoices/{id}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.recurring-invoices.update": { "uri": "s/{store_slug}/recurring-invoices/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.recurring-invoices.toggle": { "uri": "s/{store_slug}/recurring-invoices/{id}/toggle", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.recurring-invoices.destroy": { "uri": "s/{store_slug}/recurring-invoices/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.stock-transfers.index": { "uri": "s/{store_slug}/stock-transfers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-transfers.create": { "uri": "s/{store_slug}/stock-transfers/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-transfers.store": { "uri": "s/{store_slug}/stock-transfers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-transfers.show": { "uri": "s/{store_slug}/stock-transfers/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.stock-transfers.edit": { "uri": "s/{store_slug}/stock-transfers/{id}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.stock-takes.index": { "uri": "s/{store_slug}/stock-audit", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-takes.create": { "uri": "s/{store_slug}/stock-audit/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-takes.store": { "uri": "s/{store_slug}/stock-audit", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-takes.show": { "uri": "s/{store_slug}/stock-audit/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.batches.index": { "uri": "s/{store_slug}/batches", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.batches.show": { "uri": "s/{store_slug}/batches/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.serials.index": { "uri": "s/{store_slug}/serials", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.serials.show": { "uri": "s/{store_slug}/serials/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.debit-notes.index": { "uri": "s/{store_slug}/debit-notes", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.debit-notes.create": { "uri": "s/{store_slug}/debit-notes/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.debit-notes.store": { "uri": "s/{store_slug}/debit-notes", "methods": ["POST"], "parameters": ["store_slug"] }, "store.debit-notes.show": { "uri": "s/{store_slug}/debit-notes/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.bank-reconciliation.index": { "uri": "s/{store_slug}/bank-reconciliation", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.bank-reconciliation.import": { "uri": "s/{store_slug}/bank-reconciliation/import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.invoice-reminders.index": { "uri": "s/{store_slug}/invoice-reminders", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.invoice-reminders.create": { "uri": "s/{store_slug}/invoice-reminders/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.invoice-reminders.store": { "uri": "s/{store_slug}/invoice-reminders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.invoice-reminders.send": { "uri": "s/{store_slug}/invoice-reminders/{id}/send", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.staff.attendance.index": { "uri": "s/{store_slug}/staff/attendance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.staff.attendance.show": { "uri": "s/{store_slug}/staff/attendance/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.staff.attendance.approve-gap": { "uri": "s/{store_slug}/staff/attendance/gap/{id}/approve", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.staff.attendance.reject-gap": { "uri": "s/{store_slug}/staff/attendance/gap/{id}/reject", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.marketing-campaigns.index": { "uri": "s/{store_slug}/marketing/campaigns", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.marketing-campaigns.create": { "uri": "s/{store_slug}/marketing/campaigns/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.marketing-campaigns.store": { "uri": "s/{store_slug}/marketing/campaigns", "methods": ["POST"], "parameters": ["store_slug"] }, "store.online-store.index": { "uri": "s/{store_slug}/online-store-manager", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.online-store.update": { "uri": "s/{store_slug}/online-store-manager", "methods": ["POST"], "parameters": ["store_slug"] }, "store.woocommerce.index": { "uri": "s/{store_slug}/woocommerce-sync", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.woo.plugin.download": { "uri": "s/{store_slug}/woo/connections/{connection}/download", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.index": { "uri": "s/{store_slug}/woo/connections", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.woo.connections.store": { "uri": "s/{store_slug}/woo/connections", "methods": ["POST"], "parameters": ["store_slug"] }, "store.woo.connections.setup": { "uri": "s/{store_slug}/woo/connections/{connection}/setup", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.status-json": { "uri": "s/{store_slug}/woo/connections/{connection}/status", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.settings": { "uri": "s/{store_slug}/woo/connections/{connection}/settings", "methods": ["PUT"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.destroy": { "uri": "s/{store_slug}/woo/connections/{connection}", "methods": ["DELETE"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.sync": { "uri": "s/{store_slug}/woo/connections/{connection}/sync", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.approve": { "uri": "s/{store_slug}/woo/connections/{connection}/approve", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.push": { "uri": "s/{store_slug}/woo/connections/{connection}/push", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.pull": { "uri": "s/{store_slug}/woo/connections/{connection}/pull", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.scan": { "uri": "s/{store_slug}/woo/connections/{connection}/scan", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.resolve": { "uri": "s/{store_slug}/woo/connections/{connection}/resolve", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.ignore": { "uri": "s/{store_slug}/woo/connections/{connection}/ignore", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.logs": { "uri": "s/{store_slug}/woo/connections/{connection}/logs", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.e-invoicing.index": { "uri": "s/{store_slug}/e-invoicing", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.e-invoicing.generate": { "uri": "s/{store_slug}/e-invoicing/generate", "methods": ["POST"], "parameters": ["store_slug"] }, "store.e-invoicing.waybill": { "uri": "s/{store_slug}/e-invoicing/waybill", "methods": ["POST"], "parameters": ["store_slug"] }, "store.system.reset": { "uri": "s/{store_slug}/api/system/reset", "methods": ["POST"], "parameters": ["store_slug"] }, "store.system.delete-entity": { "uri": "s/{store_slug}/api/system/reset/{entity}", "methods": ["POST"], "parameters": ["store_slug", "entity"] }, "store.finance.accounts": { "uri": "s/{store_slug}/finance/accounts", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.finance.journal": { "uri": "s/{store_slug}/finance/journal", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payment-in.create": { "uri": "s/{store_slug}/payments/in/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payment-out.create": { "uri": "s/{store_slug}/payments/out/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pre-sales.print": { "uri": "s/{store_slug}/sales/pre-sales/{order}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "order"] }, "store.debit-notes.print": { "uri": "s/{store_slug}/debit-notes/{id}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.debit-notes.update": { "uri": "s/{store_slug}/debit-notes/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.purchases.print": { "uri": "s/{store_slug}/purchases/{purchase}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.sales.create": { "uri": "s/{store_slug}/sales/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.production.edit": { "uri": "s/{store_slug}/inventory/production/{run}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "run"] }, "store.reports.discount-report": { "uri": "s/{store_slug}/reports/discount-report", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.inventory-valuation": { "uri": "s/{store_slug}/reports/inventory-valuation", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "api.plan.usage": { "uri": "api/plan/usage", "methods": ["GET", "HEAD"] }, "superadmin.dashboard": { "uri": "superadmin/dashboard", "methods": ["GET", "HEAD"] }, "superadmin.tenants": { "uri": "superadmin/tenants", "methods": ["GET", "HEAD"] }, "superadmin.tenants.suspend": { "uri": "superadmin/tenants/{tenant}/suspend", "methods": ["POST"], "parameters": ["tenant"] }, "superadmin.tenants.reactivate": { "uri": "superadmin/tenants/{tenant}/reactivate", "methods": ["POST"], "parameters": ["tenant"] }, "superadmin.tenants.upgrade": { "uri": "superadmin/tenants/{tenant}/upgrade", "methods": ["POST"], "parameters": ["tenant"] }, "store.v3.products.index": { "uri": "s/{store_slug}/v3/products", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.products.create": { "uri": "s/{store_slug}/v3/products/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.products.store": { "uri": "s/{store_slug}/v3/products", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.products.edit": { "uri": "s/{store_slug}/v3/products/{product}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "product"] }, "store.v3.products.update": { "uri": "s/{store_slug}/v3/products/{product}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "product"] }, "store.v3.products.destroy": { "uri": "s/{store_slug}/v3/products/{product}", "methods": ["DELETE"], "parameters": ["store_slug", "product"] }, "store.v3.warehouses.index": { "uri": "s/{store_slug}/v3/warehouses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.warehouses.create": { "uri": "s/{store_slug}/v3/warehouses/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.warehouses.store": { "uri": "s/{store_slug}/v3/warehouses", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.warehouses.edit": { "uri": "s/{store_slug}/v3/warehouses/{warehouse}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "warehouse"] }, "store.v3.warehouses.update": { "uri": "s/{store_slug}/v3/warehouses/{warehouse}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "warehouse"] }, "store.v3.warehouses.destroy": { "uri": "s/{store_slug}/v3/warehouses/{warehouse}", "methods": ["DELETE"], "parameters": ["store_slug", "warehouse"] }, "store.v3.purchases.index": { "uri": "s/{store_slug}/v3/purchases", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.purchases.create": { "uri": "s/{store_slug}/v3/purchases/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.purchases.store": { "uri": "s/{store_slug}/v3/purchases", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.purchases.show": { "uri": "s/{store_slug}/v3/purchases/{purchase}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.v3.purchases.return.create": { "uri": "s/{store_slug}/v3/purchases/{purchaseId}/return", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchaseId"] }, "store.v3.purchases.return.store": { "uri": "s/{store_slug}/v3/purchases/{purchaseId}/return", "methods": ["POST"], "parameters": ["store_slug", "purchaseId"] }, "store.v3.supplier-payments.store": { "uri": "s/{store_slug}/v3/supplier-payments", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.opening-balances.store": { "uri": "s/{store_slug}/v3/opening-balances", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.opening-balances.status": { "uri": "s/{store_slug}/v3/opening-balances/status", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.supplier-advances.store": { "uri": "s/{store_slug}/v3/supplier-advances", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.stock-adjustments.store": { "uri": "s/{store_slug}/v3/stock-adjustments", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.stock-transfers.store": { "uri": "s/{store_slug}/v3/stock-transfers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.suppliers.statement": { "uri": "s/{store_slug}/v3/suppliers/{supplierId}/statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "supplierId"] }, "store.v3.parties.store": { "uri": "s/{store_slug}/v3/parties", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.parties.update": { "uri": "s/{store_slug}/v3/parties/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.v3.parties.destroy": { "uri": "s/{store_slug}/v3/parties/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.v3.sales.store": { "uri": "s/{store_slug}/v3/sales", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.sales.pdf": { "uri": "s/{store_slug}/v3/sales/{saleId}/pdf", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "saleId"] }, "store.v3.sales.return.store": { "uri": "s/{store_slug}/v3/sales/{saleId}/return", "methods": ["POST"], "parameters": ["store_slug", "saleId"] }, "store.v3.customer-payments.store": { "uri": "s/{store_slug}/v3/customer-payments", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.customer-payments.bounce": { "uri": "s/{store_slug}/v3/customer-payments/{journalEntryId}/bounce", "methods": ["POST"], "parameters": ["store_slug", "journalEntryId"] }, "store.v3.sales.write-off": { "uri": "s/{store_slug}/v3/sales/{saleId}/write-off", "methods": ["POST"], "parameters": ["store_slug", "saleId"] }, "store.v3.customer-advances.store": { "uri": "s/{store_slug}/v3/customer-advances", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.sales-orders.store": { "uri": "s/{store_slug}/v3/sales-orders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.sales-orders.cancel": { "uri": "s/{store_slug}/v3/sales-orders/{id}/cancel", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.sales-orders.convert": { "uri": "s/{store_slug}/v3/sales-orders/{id}/convert", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.quotations.store": { "uri": "s/{store_slug}/v3/quotations", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.quotations.convert-to-order": { "uri": "s/{store_slug}/v3/quotations/{id}/convert-to-order", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.customers.statement": { "uri": "s/{store_slug}/v3/customers/{customerId}/statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "customerId"] }, "store.v3.products.uom.index": { "uri": "s/{store_slug}/v3/products/{productId}/uom", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "productId"] }, "store.v3.products.uom.store": { "uri": "s/{store_slug}/v3/products/{productId}/uom", "methods": ["POST"], "parameters": ["store_slug", "productId"] }, "store.v3.products.uom.destroy": { "uri": "s/{store_slug}/v3/products/{productId}/uom/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "productId", "id"] }, "store.v3.products.tiers.index": { "uri": "s/{store_slug}/v3/products/{productId}/tiers", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "productId"] }, "store.v3.products.tiers.store": { "uri": "s/{store_slug}/v3/products/{productId}/tiers", "methods": ["POST"], "parameters": ["store_slug", "productId"] }, "store.v3.products.tiers.destroy": { "uri": "s/{store_slug}/v3/products/{productId}/tiers/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "productId", "id"] }, "store.v3.boms.store": { "uri": "s/{store_slug}/v3/boms", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.boms.update": { "uri": "s/{store_slug}/v3/boms/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.v3.boms.destroy": { "uri": "s/{store_slug}/v3/boms/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.v3.production-runs.store": { "uri": "s/{store_slug}/v3/production-runs", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.production-runs.complete": { "uri": "s/{store_slug}/v3/production-runs/{id}/complete", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.production-runs.reverse": { "uri": "s/{store_slug}/v3/production-runs/{id}/reverse", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.disassembly.store": { "uri": "s/{store_slug}/v3/disassembly", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.employees.store": { "uri": "s/{store_slug}/v3/employees", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.employees.update": { "uri": "s/{store_slug}/v3/employees/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.v3.payroll.accrue": { "uri": "s/{store_slug}/v3/payroll/accrue", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.payroll.pay": { "uri": "s/{store_slug}/v3/payroll/pay", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.employee-settlements.store": { "uri": "s/{store_slug}/v3/employee-settlements", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.cash-shortages.store": { "uri": "s/{store_slug}/v3/cash-shortages", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.disaster-claims.store": { "uri": "s/{store_slug}/v3/disaster-claims", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.disaster-claims.recover": { "uri": "s/{store_slug}/v3/disaster-claims/{id}/recover", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.assets.store": { "uri": "s/{store_slug}/v3/assets", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.depreciation.store": { "uri": "s/{store_slug}/v3/depreciation", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.loans.drawdown": { "uri": "s/{store_slug}/v3/loans/drawdown", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.loans.repay": { "uri": "s/{store_slug}/v3/loans/repay", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.expenses.store": { "uri": "s/{store_slug}/v3/expenses", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.funds.store": { "uri": "s/{store_slug}/v3/funds", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.bank-transfers.store": { "uri": "s/{store_slug}/v3/bank-transfers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.donations.store": { "uri": "s/{store_slug}/v3/donations", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.users.role.update": { "uri": "s/{store_slug}/v3/users/{id}/role", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.v3.settings.discount-limits": { "uri": "s/{store_slug}/v3/settings/discount-limits", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.fiscal-year.close": { "uri": "s/{store_slug}/v3/fiscal-year/close", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.reports.trial-balance": { "uri": "s/{store_slug}/v3/reports/trial-balance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.profit-loss": { "uri": "s/{store_slug}/v3/reports/profit-loss", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.balance-sheet": { "uri": "s/{store_slug}/v3/reports/balance-sheet", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.cash-flow": { "uri": "s/{store_slug}/v3/reports/cash-flow", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.aged-receivables": { "uri": "s/{store_slug}/v3/reports/aged-receivables", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.aged-payables": { "uri": "s/{store_slug}/v3/reports/aged-payables", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.sales": { "uri": "s/{store_slug}/v3/reports/sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.purchases": { "uri": "s/{store_slug}/v3/reports/purchases", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.inventory-valuation": { "uri": "s/{store_slug}/v3/reports/inventory-valuation", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.cogs": { "uri": "s/{store_slug}/v3/reports/cogs", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.gross-profit": { "uri": "s/{store_slug}/v3/reports/gross-profit", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.tax": { "uri": "s/{store_slug}/v3/reports/tax", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.party-ledger": { "uri": "s/{store_slug}/v3/reports/party-ledger/{partyId}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "partyId"] }, "store.v3.reports.inventory-movement": { "uri": "s/{store_slug}/v3/reports/inventory-movement", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.reports.export": { "uri": "s/{store_slug}/v3/reports/export", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.dashboard": { "uri": "s/{store_slug}/v3/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "auth.google": { "uri": "auth/google", "methods": ["GET", "HEAD"] }, "register": { "uri": "register", "methods": ["GET", "HEAD"] }, "login": { "uri": "login", "methods": ["GET", "HEAD"] }, "login.passcode": { "uri": "login/passcode", "methods": ["POST"] }, "login.pin": { "uri": "login/pin", "methods": ["POST"] }, "password.request": { "uri": "forgot-password", "methods": ["GET", "HEAD"] }, "password.email": { "uri": "forgot-password", "methods": ["POST"] }, "password.reset": { "uri": "reset-password/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "password.store": { "uri": "reset-password", "methods": ["POST"] }, "verification.notice": { "uri": "verify-email", "methods": ["GET", "HEAD"] }, "verification.verify": { "uri": "verify-email/{id}/{hash}", "methods": ["GET", "HEAD"], "parameters": ["id", "hash"] }, "verification.send": { "uri": "email/verification-notification", "methods": ["POST"] }, "password.confirm": { "uri": "confirm-password", "methods": ["GET", "HEAD"] }, "password.update": { "uri": "password", "methods": ["PUT"] }, "logout": { "uri": "logout", "methods": ["POST"] }, "platform.login": { "uri": "VenQore-login", "methods": ["GET", "HEAD"] }, "platform.login.store": { "uri": "VenQore-login", "methods": ["POST"] }, "platform.login.pin": { "uri": "VenQore-login/pin", "methods": ["POST"] }, "staff.login": { "uri": "staff-login", "methods": ["GET", "HEAD"] }, "staff.login.store": { "uri": "staff-login", "methods": ["POST"] }, "error.page": { "uri": "error/{code}", "methods": ["GET", "HEAD"], "parameters": ["code"] }, "storage.local.upload": { "uri": "storage/{path}", "methods": ["PUT"], "wheres": { "path": ".*" }, "parameters": ["path"] } } };
if (typeof window !== "undefined" && typeof window.Ziggy !== "undefined") {
  Object.assign(Ziggy$1.routes, window.Ziggy.routes);
}
const appName = "VenQore POS";
createServer(
  (page) => createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => {
      const businessName = page.props?.store?.name || page.props?.settings?.business_name || appName;
      return title ? `${title} - ${businessName}` : businessName;
    },
    resolve: (name) => resolvePageComponent(
      `./Pages/${name}.jsx`,
      /* @__PURE__ */ Object.assign({ "./Pages/Accounting/BalanceSheet.jsx": () => import("./assets/BalanceSheet-Bz53av4O.js"), "./Pages/Accounting/ChartOfAccounts.jsx": () => import("./assets/ChartOfAccounts-DD_v-ryR.js"), "./Pages/Accounting/Dashboard.jsx": () => import("./assets/Dashboard-GCsvDzDa.js"), "./Pages/Accounting/ProfitLoss.jsx": () => import("./assets/ProfitLoss-BpwLpNmQ.js"), "./Pages/ActivityLog.jsx": () => import("./assets/ActivityLog-avERvDcD.js"), "./Pages/Admin/AgentInbox.jsx": () => import("./assets/AgentInbox-D2OLgwp7.js"), "./Pages/Admin/Backups.jsx": () => import("./assets/Backups-C4X6vUXc.js"), "./Pages/Admin/Dashboard.jsx": () => import("./assets/Dashboard-B1rOmuVi.js"), "./Pages/Admin/DataManagement.jsx": () => import("./assets/DataManagement-D0JHAV6G.js"), "./Pages/Admin/DataMapping.jsx": () => import("./assets/DataMapping-B06iFn6Q.js"), "./Pages/Admin/Database.jsx": () => import("./assets/Database-DesHOH7-.js"), "./Pages/Admin/ExecutiveDashboard.jsx": () => import("./assets/ExecutiveDashboard-DSQAeeOE.js"), "./Pages/Admin/Logs.jsx": () => import("./assets/Logs-3RLCeIls.js"), "./Pages/Admin/Migration.jsx": () => import("./assets/Migration-B7G_4WLl.js"), "./Pages/Admin/Settings.jsx": () => import("./assets/Settings-B6juG7KE.js"), "./Pages/Admin/Users.jsx": () => import("./assets/Users-BqURWDTc.js"), "./Pages/Admin/VenaTicketDetail.jsx": () => import("./assets/VenaTicketDetail-BGT0HLPE.js"), "./Pages/Admin/VenaTickets.jsx": () => import("./assets/VenaTickets-qClNIbgP.js"), "./Pages/Auth/AcceptInvite.jsx": () => import("./assets/AcceptInvite-n7L7UpE0.js"), "./Pages/Auth/ConfirmPassword.jsx": () => import("./assets/ConfirmPassword-BDi6Tc1N.js"), "./Pages/Auth/ForgotPassword.jsx": () => import("./assets/ForgotPassword-BB5avwvK.js"), "./Pages/Auth/Login.jsx": () => import("./assets/Login-XzTn0h2j.js"), "./Pages/Auth/Register.jsx": () => import("./assets/Register-BAjTjpqr.js"), "./Pages/Auth/ResetPassword.jsx": () => import("./assets/ResetPassword-CQqUabB_.js"), "./Pages/Auth/StaffLogin.jsx": () => import("./assets/StaffLogin-6c8A1Q1x.js"), "./Pages/Auth/TwoFactorSetup.jsx": () => import("./assets/TwoFactorSetup-Dun8ojwr.js"), "./Pages/Auth/TwoFactorVerify.jsx": () => import("./assets/TwoFactorVerify-XtRdsieB.js"), "./Pages/Auth/VerifyEmail.jsx": () => import("./assets/VerifyEmail-DxmKjDIm.js"), "./Pages/BankAccounts/BankAccountsList.jsx": () => import("./assets/BankAccountsList-DKc6hXPp.js"), "./Pages/BankAccounts/Transactions.jsx": () => import("./assets/Transactions-DDpNU3Eb.js"), "./Pages/BankReconciliation/BankReconciliation.jsx": () => import("./assets/BankReconciliation-DVl2CLyj.js"), "./Pages/BatchTracking/BatchTracking.jsx": () => import("./assets/BatchTracking-BpnYbi1d.js"), "./Pages/Billing/Index.jsx": () => import("./assets/Index-HJDVURta.js"), "./Pages/Cookbook/Create.jsx": () => import("./assets/Create-BAmtil_6.js"), "./Pages/Cookbook/RecipesList.jsx": () => import("./assets/RecipesList-D4N-rWeP.js"), "./Pages/Dashboard.jsx": () => import("./assets/Dashboard-D_X4KqBj.js"), "./Pages/Dashboards/AccountantDashboard.jsx": () => import("./assets/AccountantDashboard-CV8my2dP.js"), "./Pages/Dashboards/CashierDashboard.jsx": () => import("./assets/CashierDashboard-CeAUI2h_.js"), "./Pages/Dashboards/PurchasingDashboard.jsx": () => import("./assets/PurchasingDashboard-CgnUte2K.js"), "./Pages/Dashboards/ViewerDashboard.jsx": () => import("./assets/ViewerDashboard-qCmu2zr0.js"), "./Pages/DebitNotes/Create.jsx": () => import("./assets/Create-DIHxIuNR.js"), "./Pages/DebitNotes/DebitNotes.jsx": () => import("./assets/DebitNotes-BrQ92AlO.js"), "./Pages/Demo/Landing.jsx": () => import("./assets/Landing-DqYJWTqx.js"), "./Pages/DemoExpired.jsx": () => import("./assets/DemoExpired-CqTxVXrq.js"), "./Pages/EInvoicing/EInvoicing.jsx": () => import("./assets/EInvoicing-RdCyI0LB.js"), "./Pages/Error.jsx": () => import("./assets/Error-D_OGOBR4.js"), "./Pages/Errors/StoreSuspended.jsx": () => import("./assets/StoreSuspended-DiIchkmb.js"), "./Pages/Errors/TrialExpired.jsx": () => import("./assets/TrialExpired-oiYo0FVk.js"), "./Pages/Expenses/ExpensesList.jsx": () => import("./assets/ExpensesList-CK_OHVM5.js"), "./Pages/Finance/FinanceDashboard.jsx": () => import("./assets/FinanceDashboard-dtux7tFi.js"), "./Pages/Finance/Payables.jsx": () => import("./assets/Payables-DFB69Bws.js"), "./Pages/Finance/Receivables.jsx": () => import("./assets/Receivables-CioQUcky.js"), "./Pages/Funds/CashHistory.jsx": () => import("./assets/CashHistory-DMhoFGC4.js"), "./Pages/Funds/FundManagement.jsx": () => import("./assets/FundManagement-Dd9rejaz.js"), "./Pages/Gift/Invalid.jsx": () => import("./assets/Invalid-DejMmPIV.js"), "./Pages/Gift/Show.jsx": () => import("./assets/Show-Bwwh2NAQ.js"), "./Pages/GrowthEngine/GrowthDashboard.jsx": () => import("./assets/GrowthDashboard-CcIz7NC3.js"), "./Pages/Home.jsx": () => import("./assets/Home-B-_vhcxz.js"), "./Pages/Hub/Index.jsx": () => import("./assets/Index-DJ-OWkXc.js"), "./Pages/Installer/Index.jsx": () => import("./assets/Index-CylAOt_n.js"), "./Pages/Inventory/Attributes/AttributesList.jsx": () => import("./assets/AttributesList-R86NdA7q.js"), "./Pages/Inventory/Categories.jsx": () => import("./assets/Categories-DSYnKIJK.js"), "./Pages/Inventory/Dashboard.jsx": () => import("./assets/Dashboard-S0f1i5HC.js"), "./Pages/Inventory/InventoryList.jsx": () => import("./assets/InventoryList-Dd0ZEl_7.js"), "./Pages/Inventory/Production/Create.jsx": () => import("./assets/Create-DANkcTBQ.js"), "./Pages/Inventory/Production/ProductionRuns.jsx": () => import("./assets/ProductionRuns-CyClpAZV.js"), "./Pages/Inventory/StockLevels.jsx": () => import("./assets/StockLevels-CpPz-g8g.js"), "./Pages/Inventory/Variants/VariantsList.jsx": () => import("./assets/VariantsList-IoCwnYNu.js"), "./Pages/Invite/Accept.jsx": () => import("./assets/Accept-CLzPJAFV.js"), "./Pages/Invite/Invalid.jsx": () => import("./assets/Invalid-D1As10eU.js"), "./Pages/Labels/LabelPrinter.jsx": () => import("./assets/LabelPrinter-W4rdbZMX.js"), "./Pages/LandingPage.jsx": () => import("./assets/LandingPage-g7ElV_FK.js"), "./Pages/Manufacturing/Rules.jsx": () => import("./assets/Rules-DcBJKF6r.js"), "./Pages/Marketing/About.jsx": () => import("./assets/About-DyrEgbNp.js"), "./Pages/Marketing/Blog/Index.jsx": () => import("./assets/Index-DamvbsT3.js"), "./Pages/Marketing/Blog/Show.jsx": () => import("./assets/Show-D0Tgh9AL.js"), "./Pages/Marketing/Campaigns.jsx": () => import("./assets/Campaigns-B-dZhWCn.js"), "./Pages/Marketing/Contact.jsx": () => import("./assets/Contact-DiqKQb-J.js"), "./Pages/Marketing/DigitalProducts.jsx": () => import("./assets/DigitalProducts-2tQhZSQD.js"), "./Pages/Marketing/Features.jsx": () => import("./assets/Features-D52hwpDc.js"), "./Pages/Marketing/Newsletter.jsx": () => import("./assets/Newsletter-CrEPFtOE.js"), "./Pages/Marketing/PartnerSupport.jsx": () => import("./assets/PartnerSupport-C5tpDafO.js"), "./Pages/Marketing/Pricing.jsx": () => import("./assets/Pricing-DroftiUZ.js"), "./Pages/Marketing/Shared/MarketingLayout.jsx": () => import("./assets/MarketingLayout-CMiC1Bik.js"), "./Pages/Marketing/SmartCapture.jsx": () => import("./assets/SmartCapture-CH04fx27.js"), "./Pages/Marketing/Tools/Barcode.jsx": () => import("./assets/Barcode-B6t-Qeii.js"), "./Pages/Marketing/Tools/BarcodeLabelSheet.jsx": () => import("./assets/BarcodeLabelSheet-D8zJyGkB.js"), "./Pages/Marketing/Tools/BarcodeValidator.jsx": () => import("./assets/BarcodeValidator-ClUGnUa8.js"), "./Pages/Marketing/Tools/CashDrawer.jsx": () => import("./assets/CashDrawer-REu2XWYT.js"), "./Pages/Marketing/Tools/CashDrawerCountSheet.jsx": () => import("./assets/CashDrawerCountSheet-DK-julVn.js"), "./Pages/Marketing/Tools/CreditNote.jsx": () => import("./assets/CreditNote-CFDnccOi.js"), "./Pages/Marketing/Tools/FoodCostCalculator.jsx": () => import("./assets/FoodCostCalculator-ChYG4HEw.js"), "./Pages/Marketing/Tools/Index.jsx": () => import("./assets/Index-CvvxWkjo.js"), "./Pages/Marketing/Tools/InventoryHealth.jsx": () => import("./assets/InventoryHealth-DzbkJCsB.js"), "./Pages/Marketing/Tools/Invoice.jsx": () => import("./assets/Invoice-C4DHtrkk.js"), "./Pages/Marketing/Tools/LabelSheet.jsx": () => import("./assets/LabelSheet-_5N3ueg6.js"), "./Pages/Marketing/Tools/LeadConfirm.jsx": () => import("./assets/LeadConfirm-k0waXdee.js"), "./Pages/Marketing/Tools/LeadUnsubscribe.jsx": () => import("./assets/LeadUnsubscribe-CtOTOXnd.js"), "./Pages/Marketing/Tools/MarginCalculator.jsx": () => import("./assets/MarginCalculator-DFjM65OD.js"), "./Pages/Marketing/Tools/PackingSlip.jsx": () => import("./assets/PackingSlip-ClJiqjIa.js"), "./Pages/Marketing/Tools/PaymentFeeCalculator.jsx": () => import("./assets/PaymentFeeCalculator-BVML338Y.js"), "./Pages/Marketing/Tools/PosRoiCalculator.jsx": () => import("./assets/PosRoiCalculator-BXtwzexI.js"), "./Pages/Marketing/Tools/PriceTag.jsx": () => import("./assets/PriceTag-BFrlBeEt.js"), "./Pages/Marketing/Tools/ProductCsvCleaner.jsx": () => import("./assets/ProductCsvCleaner-C8pf9yxW.js"), "./Pages/Marketing/Tools/PurchaseOrder.jsx": () => import("./assets/PurchaseOrder-DHgB_Rnu.js"), "./Pages/Marketing/Tools/QrCode.jsx": () => import("./assets/QrCode-8z-_btz0.js"), "./Pages/Marketing/Tools/QrMenu.jsx": () => import("./assets/QrMenu-sZgEP6Ux.js"), "./Pages/Marketing/Tools/QrMenuPublic.jsx": () => import("./assets/QrMenuPublic-BX6jkpil.js"), "./Pages/Marketing/Tools/Quote.jsx": () => import("./assets/Quote-0EJNhpiL.js"), "./Pages/Marketing/Tools/Receipt.jsx": () => import("./assets/Receipt-DJWZhIFm.js"), "./Pages/Marketing/Tools/Shared/EditableText.jsx": () => import("./assets/EditableText-nKR5JR6h.js"), "./Pages/Marketing/Tools/Shared/EmailGate.jsx": () => import("./assets/EmailGate-BDlzlLhb.js"), "./Pages/Marketing/Tools/Shared/HousePromo.jsx": () => import("./assets/HousePromo-CAVKWeBy.js"), "./Pages/Marketing/Tools/Shared/Select.jsx": () => import("./assets/Select-BFX9Hz_h.js"), "./Pages/Marketing/Tools/Shared/ToolShell.jsx": () => import("./assets/ToolShell-BDFk9CqZ.js"), "./Pages/Marketing/Tools/Shared/ToolsSidebar.jsx": () => import("./assets/ToolsSidebar-BvvbAU_Q.js"), "./Pages/Marketing/Tools/SkuGenerator.jsx": () => import("./assets/SkuGenerator-DKATXuDq.js"), "./Pages/Marketing/Tools/StockCountSheet.jsx": () => import("./assets/StockCountSheet-B2PwW-Qu.js"), "./Pages/Marketing/VenSynQ.jsx": () => import("./assets/VenSynQ-yTqgr7wi.js"), "./Pages/Notifications/NotificationCenter.jsx": () => import("./assets/NotificationCenter-Bq6VrCJe.js"), "./Pages/OnlineStore/OnlineStore.jsx": () => import("./assets/OnlineStore-DPs9PBLt.js"), "./Pages/Parties/Ledger.jsx": () => import("./assets/Ledger-Dii9uToV.js"), "./Pages/Parties/PartiesList.jsx": () => import("./assets/PartiesList-DmGbGwhl.js"), "./Pages/Payments/In.jsx": () => import("./assets/In-D2lrzleA.js"), "./Pages/Payments/Out.jsx": () => import("./assets/Out-BbzmXByL.js"), "./Pages/Payments/PaymentsList.jsx": () => import("./assets/PaymentsList-Br_Ph2UB.js"), "./Pages/Platform/Overview.jsx": () => import("./assets/Overview-Oou0ea1N.js"), "./Pages/Platform/Views.jsx": () => import("./assets/Views-Bpyd5sQL.js"), "./Pages/PlatformOwner/Login.jsx": () => import("./assets/Login-DCF6eLif.js"), "./Pages/Pos.jsx": () => import("./assets/Pos-HQ5VNDJ5.js"), "./Pages/PreSales/BestPreSales.jsx": () => import("./assets/BestPreSales-CUQUXVVE.js"), "./Pages/PrivacyPolicy.jsx": () => import("./assets/PrivacyPolicy-GmbpCsc8.js"), "./Pages/Profile/Edit.jsx": () => import("./assets/Edit-DOqwMq-g.js"), "./Pages/Proposals/Create.jsx": () => import("./assets/Create-DcracrZT.js"), "./Pages/Proposals/ProposalsList.jsx": () => import("./assets/ProposalsList-VbDTqbrm.js"), "./Pages/Proposals/Show.jsx": () => import("./assets/Show-WkJHPZFz.js"), "./Pages/PurchaseOrders/Create.jsx": () => import("./assets/Create-ObGQwmV1.js"), "./Pages/PurchaseOrders/PurchaseOrdersList.jsx": () => import("./assets/PurchaseOrdersList-CfN804Kj.js"), "./Pages/PurchaseOrders/Show.jsx": () => import("./assets/Show-BhJnlUkg.js"), "./Pages/Purchases/Create.jsx": () => import("./assets/Create-Bcrghx4I.js"), "./Pages/Purchases/PurchasesList.jsx": () => import("./assets/PurchasesList-BT-wLbKA.js"), "./Pages/Purchases/Receive.jsx": () => import("./assets/Receive-CaVkZI2T.js"), "./Pages/Purchases/Show.jsx": () => import("./assets/Show-B4cnRfeP.js"), "./Pages/RecurringInvoices/Create.jsx": () => import("./assets/Create-D7jYPRJw.js"), "./Pages/RecurringInvoices/Edit.jsx": () => import("./assets/Edit-CBwKJfBh.js"), "./Pages/RecurringInvoices/RecurringInvoices.jsx": () => import("./assets/RecurringInvoices-HV_Y8Ehx.js"), "./Pages/RecycleBin.jsx": () => import("./assets/RecycleBin-Bf6ysLTT.js"), "./Pages/Redeem.jsx": () => import("./assets/Redeem-CzTESss9.js"), "./Pages/RedeemSuccess.jsx": () => import("./assets/RedeemSuccess-BVQoyJWK.js"), "./Pages/RefundPolicy.jsx": () => import("./assets/RefundPolicy-CpuKKHIo.js"), "./Pages/Reminders/Create.jsx": () => import("./assets/Create-CeNI3zCI.js"), "./Pages/Reminders/InvoiceReminders.jsx": () => import("./assets/InvoiceReminders-CbYC47HG.js"), "./Pages/Reports/AccountLedger.jsx": () => import("./assets/AccountLedger-CBeLWWNK.js"), "./Pages/Reports/AllParties.jsx": () => import("./assets/AllParties-C8CxaiLE.js"), "./Pages/Reports/BankStatement.jsx": () => import("./assets/BankStatement-C2HpgXX9.js"), "./Pages/Reports/BillWiseProfit.jsx": () => import("./assets/BillWiseProfit-Btsll5fX.js"), "./Pages/Reports/CashFlow.jsx": () => import("./assets/CashFlow-DlyCuC9o.js"), "./Pages/Reports/CategoryProfitability.jsx": () => import("./assets/CategoryProfitability-lfv5Rafl.js"), "./Pages/Reports/Components/ReportPage.jsx": () => import("./assets/ReportPage-CIfs9UJy.js"), "./Pages/Reports/CustomerInsights.jsx": () => import("./assets/CustomerInsights-CnuV5V-E.js"), "./Pages/Reports/Dashboard.jsx": () => import("./assets/Dashboard-Cb3zBvgC.js"), "./Pages/Reports/DayBook.jsx": () => import("./assets/DayBook-D1IQnBYV.js"), "./Pages/Reports/DiscountReport.jsx": () => import("./assets/DiscountReport-D8tnMVJ7.js"), "./Pages/Reports/ExpenseByCategory.jsx": () => import("./assets/ExpenseByCategory-LDrPfnfd.js"), "./Pages/Reports/ExpenseByItem.jsx": () => import("./assets/ExpenseByItem-Ca_-8keA.js"), "./Pages/Reports/Expenses.jsx": () => import("./assets/Expenses-DIj-WmdX.js"), "./Pages/Reports/ExpiryReport.jsx": () => import("./assets/ExpiryReport-iTs5m5Qd.js"), "./Pages/Reports/GenericReport.jsx": () => import("./assets/GenericReport-CBSZw3vP.js"), "./Pages/Reports/GraphAnalytics.jsx": () => import("./assets/GraphAnalytics-dqgllW5w.js"), "./Pages/Reports/ItemCategoryWiseProfitLoss.jsx": () => import("./assets/ItemCategoryWiseProfitLoss-DnyOxVeT.js"), "./Pages/Reports/ItemDetail.jsx": () => import("./assets/ItemDetail-CGr99ayY.js"), "./Pages/Reports/ItemReportByParty.jsx": () => import("./assets/ItemReportByParty-Dz6xnq-V.js"), "./Pages/Reports/ItemWiseDiscount.jsx": () => import("./assets/ItemWiseDiscount-CLZvkIq0.js"), "./Pages/Reports/ItemWiseProfit.jsx": () => import("./assets/ItemWiseProfit-Dgb6iesq.js"), "./Pages/Reports/LoanStatement.jsx": () => import("./assets/LoanStatement-Bsq3hN0V.js"), "./Pages/Reports/LowStock.jsx": () => import("./assets/LowStock-BQ1b2nyh.js"), "./Pages/Reports/MovementHistory.jsx": () => import("./assets/MovementHistory-CDZXTxNc.js"), "./Pages/Reports/OwnersDailyPulse.jsx": () => import("./assets/OwnersDailyPulse-DEODgJu2.js"), "./Pages/Reports/PartyReportByItem.jsx": () => import("./assets/PartyReportByItem-C6C_Qiva.js"), "./Pages/Reports/PartyStatement.jsx": () => import("./assets/PartyStatement-Di0KWVQv.js"), "./Pages/Reports/PartyWiseProfitLoss.jsx": () => import("./assets/PartyWiseProfitLoss-DCI5qvnn.js"), "./Pages/Reports/PointInTimeInventory.jsx": () => import("./assets/PointInTimeInventory-DE0dTM93.js"), "./Pages/Reports/ProfitLoss.jsx": () => import("./assets/ProfitLoss-BqUwzxeI.js"), "./Pages/Reports/Purchases.jsx": () => import("./assets/Purchases-DGZmStL3.js"), "./Pages/Reports/ReportsHub.jsx": () => import("./assets/ReportsHub-DSIReXf_.js"), "./Pages/Reports/SaleAging.jsx": () => import("./assets/SaleAging-fW6zvOkT.js"), "./Pages/Reports/SaleOrderItems.jsx": () => import("./assets/SaleOrderItems-oCEJRX1V.js"), "./Pages/Reports/SaleOrders.jsx": () => import("./assets/SaleOrders-DlKv3TTt.js"), "./Pages/Reports/SalePurchaseByItemCategory.jsx": () => import("./assets/SalePurchaseByItemCategory-B2WTZXF7.js"), "./Pages/Reports/SalePurchaseByParty.jsx": () => import("./assets/SalePurchaseByParty-iwisc5Nc.js"), "./Pages/Reports/SalePurchaseByPartyGroup.jsx": () => import("./assets/SalePurchaseByPartyGroup-CwkDC-gA.js"), "./Pages/Reports/Sales.jsx": () => import("./assets/Sales-BB3fqpjj.js"), "./Pages/Reports/StockAging.jsx": () => import("./assets/StockAging-DX_uychk.js"), "./Pages/Reports/StockSummaryByCategory.jsx": () => import("./assets/StockSummaryByCategory-DSHU45Xm.js"), "./Pages/Reports/StockValuation.jsx": () => import("./assets/StockValuation-BbALq3dE.js"), "./Pages/Reports/SupplierInsights.jsx": () => import("./assets/SupplierInsights-DTqx0qZ2.js"), "./Pages/Reports/Tax.jsx": () => import("./assets/Tax-bCEWCIv3.js"), "./Pages/Reports/TaxRateReport.jsx": () => import("./assets/TaxRateReport-VF8rOzqF.js"), "./Pages/Reports/Transactions.jsx": () => import("./assets/Transactions-YNQHEcxb.js"), "./Pages/Reports/TrialBalance.jsx": () => import("./assets/TrialBalance-DC39gFL1.js"), "./Pages/Returns/Create.jsx": () => import("./assets/Create-Bj7V8JPA.js"), "./Pages/Returns/ReturnsHistory.jsx": () => import("./assets/ReturnsHistory-D2W4ve1H.js"), "./Pages/Sales/Analytics.jsx": () => import("./assets/Analytics-C-4DVklV.js"), "./Pages/Sales/CreateInvoice.jsx": () => import("./assets/CreateInvoice-PS_GGpqe.js"), "./Pages/Sales/CreatePreSale.jsx": () => import("./assets/CreatePreSale-_WYhLSYh.js"), "./Pages/Sales/Customers/CustomersList.jsx": () => import("./assets/CustomersList-D4Lf84mW.js"), "./Pages/Sales/Dashboard.jsx": () => import("./assets/Dashboard-a92aKP48.js"), "./Pages/Sales/MasterSales.jsx": () => import("./assets/MasterSales-DhYaizVB.js"), "./Pages/Sales/Orders/SalesOrdersList.jsx": () => import("./assets/SalesOrdersList-CifJO7i-.js"), "./Pages/Sales/ParkedSales.jsx": () => import("./assets/ParkedSales-COywWHKB.js"), "./Pages/Sales/SalesHistory.jsx": () => import("./assets/SalesHistory-Y3xIl6O3.js"), "./Pages/Sales/Show.jsx": () => import("./assets/Show-DFH2-thx.js"), "./Pages/SalesOrders/CreatePreSale.jsx": () => import("./assets/CreatePreSale-22MtSa92.js"), "./Pages/SalesOrders/PreSales.jsx": () => import("./assets/PreSales-Dwm0HkU-.js"), "./Pages/SerialTracking/SerialTracking.jsx": () => import("./assets/SerialTracking-WdH9LKt2.js"), "./Pages/Settings/ChatbotSettings.jsx": () => import("./assets/ChatbotSettings-DPyP0fXH.js"), "./Pages/Settings/SettingsPanel.jsx": () => import("./assets/SettingsPanel-CFGz2C7m.js"), "./Pages/SetupWizard.jsx": () => import("./assets/SetupWizard-DD3erZf2.js"), "./Pages/Staff/Hub.jsx": () => import("./assets/Hub-Rrbai2Oi.js"), "./Pages/StaffAttendance/Show.jsx": () => import("./assets/Show-GyhkisCf.js"), "./Pages/StaffAttendance/StaffAttendance.jsx": () => import("./assets/StaffAttendance-MZo7cDyS.js"), "./Pages/StockOperations.jsx": () => import("./assets/StockOperations-DluDYd7C.js"), "./Pages/StockTake/Create.jsx": () => import("./assets/Create-jnfyk4A5.js"), "./Pages/StockTake/Show.jsx": () => import("./assets/Show-D0lft6XA.js"), "./Pages/StockTake/StockTake.jsx": () => import("./assets/StockTake-BrkY7v4b.js"), "./Pages/StockTransfers/Create.jsx": () => import("./assets/Create-DMHJDCXF.js"), "./Pages/StockTransfers/Show.jsx": () => import("./assets/Show-B2uq-O1W.js"), "./Pages/StockTransfers/StockTransfers.jsx": () => import("./assets/StockTransfers-BloJw3qj.js"), "./Pages/Store/Create.jsx": () => import("./assets/Create-CWI7Czw8.js"), "./Pages/Store/CreateOrJoin.jsx": () => import("./assets/CreateOrJoin-CYNCeVJF.js"), "./Pages/Store/Join.jsx": () => import("./assets/Join-DM0R2z-T.js"), "./Pages/Store/SelectPlan.jsx": () => import("./assets/SelectPlan-BS6ZzZXz.js"), "./Pages/Store/Staff/Index.jsx": () => import("./assets/Index-Dadmjh-E.js"), "./Pages/SuperAdmin/AccessGrants/Index.jsx": () => import("./assets/Index-Dft2m5s1.js"), "./Pages/SuperAdmin/AppSumo/Index.jsx": () => import("./assets/Index-D3p3gLQ1.js"), "./Pages/SuperAdmin/Coupons/Index.jsx": () => import("./assets/Index-Cn56jFol.js"), "./Pages/SuperAdmin/Dashboard.jsx": () => import("./assets/Dashboard-BkFZodtZ.js"), "./Pages/SuperAdmin/DigitalHub/Index.jsx": () => import("./assets/Index-D96JNlmd.js"), "./Pages/SuperAdmin/Health/Contacts.jsx": () => import("./assets/Contacts-CddRLEDG.js"), "./Pages/SuperAdmin/Health/Errors.jsx": () => import("./assets/Errors-BnZ9n4-d.js"), "./Pages/SuperAdmin/NewsletterHub/Index.jsx": () => import("./assets/Index-B1aIa13u.js"), "./Pages/SuperAdmin/Plans/Index.jsx": () => import("./assets/Index-D3qPNIyL.js"), "./Pages/SuperAdmin/Platforms/Index.jsx": () => import("./assets/Index-DrNuiVLz.js"), "./Pages/SuperAdmin/Stores.jsx": () => import("./assets/Stores-CSIo7gKL.js"), "./Pages/SuperAdmin/Tenants/OverrideDetail.jsx": () => import("./assets/OverrideDetail-BU9VlpEI.js"), "./Pages/SuperAdmin/Tenants/Overrides.jsx": () => import("./assets/Overrides-D03Oid9O.js"), "./Pages/SuperAdmin/Users.jsx": () => import("./assets/Users-Chwe9LBt.js"), "./Pages/Suppliers/SuppliersList.jsx": () => import("./assets/SuppliersList-Dt3SnYGR.js"), "./Pages/TermsOfService.jsx": () => import("./assets/TermsOfService-BdX9DpQ9.js"), "./Pages/Transactions/TransactionsList.jsx": () => import("./assets/TransactionsList-DU3absDW.js"), "./Pages/Updater/Index.jsx": () => import("./assets/Index-Bkkkgybm.js"), "./Pages/V3/Products/Create.jsx": () => import("./assets/Create-DEYIvBfd.js"), "./Pages/V3/Products/Edit.jsx": () => import("./assets/Edit-DzGHn0pC.js"), "./Pages/V3/Products/Index.jsx": () => import("./assets/Index-CqHu87qR.js"), "./Pages/V3/Products/PriceTiers.jsx": () => import("./assets/PriceTiers-DIFqO3L9.js"), "./Pages/V3/Products/UomConversions.jsx": () => import("./assets/UomConversions-Cl6KoSlP.js"), "./Pages/V3/Purchases/Create.jsx": () => import("./assets/Create-CG5YW_67.js"), "./Pages/V3/Purchases/Index.jsx": () => import("./assets/Index-DrJwrW_3.js"), "./Pages/V3/Purchases/Return.jsx": () => import("./assets/Return-t-kzRJdm.js"), "./Pages/V3/Purchases/Show.jsx": () => import("./assets/Show-CeZfZFMJ.js"), "./Pages/V3/Warehouses/Create.jsx": () => import("./assets/Create-BjeEqVI0.js"), "./Pages/V3/Warehouses/Edit.jsx": () => import("./assets/Edit-DuLlpDeI.js"), "./Pages/V3/Warehouses/Index.jsx": () => import("./assets/Index-B7UCsXK2.js"), "./Pages/VenSynQ/Dashboard.jsx": () => import("./assets/Dashboard-ClbA9MVt.js"), "./Pages/VenSynQ/Settings.jsx": () => import("./assets/Settings-DlkPlopN.js"), "./Pages/Welcome.jsx": () => import("./assets/Welcome-B2UwTGr1.js"), "./Pages/WhatIsIncluded.jsx": () => import("./assets/WhatIsIncluded-BRatoZ0X.js"), "./Pages/WooCommerce/ConnectionSetup.jsx": () => import("./assets/ConnectionSetup-CcBq2pfu.js"), "./Pages/WooCommerce/Connections.jsx": () => import("./assets/Connections-XrIwBWI-.js"), "./Pages/WooCommerce/SyncPage.jsx": () => import("./assets/SyncPage-CswDwO7s.js"), "./Pages/WooCommerce/WooCommerce.jsx": () => import("./assets/WooCommerce-BLowfFyA.js") })
    ).then((module) => {
      const pageComponent = module.default;
      const originalLayout = pageComponent.layout;
      pageComponent.layout = (pageNode) => {
        const layoutElement = originalLayout ? typeof originalLayout === "function" && originalLayout.length > 0 ? originalLayout(pageNode) : React.createElement(originalLayout, {}, pageNode) : pageNode;
        return /* @__PURE__ */ jsx(GlobalProviderLayout, { children: layoutElement });
      };
      return module;
    }),
    setup: ({ App, props }) => {
      const ziggy = props.initialPage.props.ziggy || Ziggy$1;
      if (ziggy) {
        global.route = (name, params, absolute) => _(name, params, absolute, {
          ...ziggy,
          location: new URL(ziggy.location || Ziggy$1.url)
        });
      }
      return /* @__PURE__ */ jsx(App, { ...props });
    }
  })
);
export {
  FormModal as F,
  Modal as M,
  PasscodeModal as P,
  SecondaryButton as S,
  FormField as a,
  FormInput as b,
  FormSelect as c,
  FormTextarea as d,
  PrimaryButton as e,
  useWorkspace as f,
  useTheme as g,
  db$1 as h,
  useAlert as u
};

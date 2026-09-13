import { jsx, jsxs, Fragment as Fragment$1 } from "react/jsx-runtime";
import { usePage, router, createInertiaApp } from "@inertiajs/react";
import createServer from "@inertiajs/react/server";
import ReactDOMServer from "react-dom/server";
import React, { createContext, useState, useRef, useEffect, useContext, useCallback, Fragment, useMemo } from "react";
import axios from "axios";
import { X, AlertTriangle, Info, XCircle, CheckCircle2, WifiOff, RotateCcw, MonitorX, Lock, Check, Delete } from "lucide-react";
import Dexie from "dexie";
import { createPortal } from "react-dom";
import { Transition, Dialog, TransitionChild, DialogPanel } from "@headlessui/react";
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
            stock_quantity: item.product.stock_quantity,
            /* Without the rate, a product with its own tax silently
               fell back to the document's rate on the next reload. */
            tax_rate: item.product.tax_rate,
            reserved_quantity: item.product.reserved_quantity,
            available_stock: item.product.available_stock,
            unit: item.product.unit,
            base_unit: item.product.base_unit
          } : null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost,
          discount: item.discount,
          discountType: item.discountType,
          variant: item.variant,
          /* Kept, because dropping them was not free: a bill with free
             goods reloaded without them and re-priced at full, and an
             edit lost the units the document already owned — which is
             exactly what the stock check allows for. */
          freeQuantity: item.freeQuantity,
          available_stock: item.available_stock,
          originalQuantity: item.originalQuantity
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
            stock_quantity: item.product.stock_quantity,
            /* Without the rate, a product with its own tax silently
               fell back to the document's rate on the next reload. */
            tax_rate: item.product.tax_rate,
            reserved_quantity: item.product.reserved_quantity,
            available_stock: item.product.available_stock,
            unit: item.product.unit,
            base_unit: item.product.base_unit
          } : null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost,
          discount: item.discount,
          discountType: item.discountType,
          variant: item.variant,
          /* Kept, because dropping them was not free: a bill with free
             goods reloaded without them and re-priced at full, and an
             edit lost the units the document already owned — which is
             exactly what the stock check allows for. */
          freeQuantity: item.freeQuantity,
          available_stock: item.available_stock,
          originalQuantity: item.originalQuantity
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
        className: "fixed inset-0 z-drawer bg-neutral-950/90 backdrop-blur-2xl animate-in fade-in duration-slower cursor-pointer",
        onMouseDown: handleBackdropInteraction,
        onTouchStart: handleBackdropInteraction
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-drawer flex items-center justify-center p-4 md:p-12 pointer-events-none overflow-hidden", children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: `
                        ${sizeClasses[size]} w-full pointer-events-auto
                        bg-surface rounded-2xl shadow-[0_0_150px_rgba(0,0,0,0.8)]
                        border-4 border-white/10 dark:border-line
                        animate-in zoom-in-95 fade-in duration-slower
                        ${size === "full" ? "h-[94vh]" : "max-h-[96vh]"} 
                        flex flex-col relative overflow-hidden
`,
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[130px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "px-10 py-8 border-b-2 border-line shrink-0 relative z-10 bg-white/70 dark:bg-app backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-4xl font-bold text-ink tracking-tighter flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("span", { className: "w-3 h-10 bg-gradient-to-b from-brand-500 to-brand-700 rounded-full" }),
                title
              ] }),
              subtitle && /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink-muted mt-2 max-w-4xl tracking-tight leading-none", children: subtitle })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e2) => {
                  e2.preventDefault();
                  e2.stopPropagation();
                  requestClose();
                },
                className: "group p-5 rounded-xl bg-sunken hover:bg-rose-600 dark:hover:bg-rose-600 text-ink-muted hover:text-white transition-all active:scale-90 shadow-inner",
                title: "Safe Close (Esc)",
                children: /* @__PURE__ */ jsx(X, { size: 32, className: "group-hover:rotate-180 transition-transform duration-slower ease-out" })
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-10 py-10 relative z-10 custom-scrollbar-premium bg-gradient-to-b from-transparent to-neutral-50/20 dark:to-neutral-900/10", children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-40 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("div", { className: "w-32 h-32 border-8 border-brand-600/10 rounded-full" }),
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-32 h-32 border-8 border-brand-600 border-t-transparent rounded-full animate-spin" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink-secondary tracking-[0.2em] uppercase animate-pulse", children: "Processing Block..." }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink-muted", children: "Please do not refresh or close." })
            ] })
          ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
            errorList.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-6 rounded-xl bg-rose-500/10 border-2 border-rose-500/20 dark:bg-rose-950/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-4 duration-slow", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 24, className: "shrink-0 text-rose-500" }),
                /* @__PURE__ */ jsx("h4", { className: "text-base font-bold uppercase tracking-wider", children: "Please correct the following:" })
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "list-disc pl-5 space-y-1 text-sm font-bold", children: errorList.map((err, idx) => /* @__PURE__ */ jsxs("li", { className: "tracking-tight", children: [
                /* @__PURE__ */ jsx("span", { className: "capitalize", children: err.label }),
                ": ",
                err.message
              ] }, idx)) })
            ] }),
            children
          ] }) }),
          footer && /* @__PURE__ */ jsx("div", { className: "px-10 py-10 border-t-2 border-line shrink-0 relative z-10 bg-sunken/95 dark:bg-app backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.05)]", children: footer }),
          showExitConfirmation && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-modal bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-normal", children: /* @__PURE__ */ jsx("div", { className: "bg-surface w-full max-w-sm rounded-2xl shadow-2xl p-6 border-2 border-line animate-in zoom-in-95 duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 32, strokeWidth: 2.5 }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink", children: "Discard Changes?" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink-muted", children: "You have unsaved changes. Are you sure you want to close this form? Data will be lost." }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 w-full mt-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e2) => {
                    e2.preventDefault();
                    e2.stopPropagation();
                    setShowExitConfirmation(false);
                  },
                  className: "px-4 py-3 rounded-2xl font-bold bg-sunken text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
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
                  className: "px-4 py-3 rounded-2xl font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-lg transition-colors",
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
    label && /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold uppercase text-ink-muted tracking-wider", children: [
      label,
      required && /* @__PURE__ */ jsx("span", { className: "text-rose-500 ml-1.5", children: "*" })
    ] }),
    children,
    (hint || error) && /* @__PURE__ */ jsx("div", { className: "flex items-start gap-2 pt-1 transition-all", children: error ? /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-rose-500 animate-in slide-in-from-left-2", children: error }) : /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-ink-muted", children: hint }) })
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
                bg-app
                border-2 ${error ? "border-rose-500/50" : "border-line"}
                text-ink text-lg font-bold
                placeholder:text-ink-faint dark:placeholder:text-ink-secondary
                outline-none focus:ring-4 ${error ? "ring-rose-500/10 focus:border-rose-500" : "ring-brand-500/10 focus:border-brand-500"}
                transition-all hover:bg-white dark:hover:bg-interactive-hover
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
                    bg-app 
                    border-2 ${error ? "border-rose-500/50" : "border-line"}
                    text-ink text-lg font-bold
                    outline-none focus:ring-4 ${error ? "ring-rose-500/10 focus:border-rose-500" : "ring-brand-500/10 focus:border-brand-500"}
                    transition-all hover:bg-white dark:hover:bg-interactive-hover
                    ${isOpen ? "ring-4 ring-brand-500/10 border-brand-500" : ""}
                    ${className}
`,
        children: [
          /* @__PURE__ */ jsx("span", { className: !selectedOption ? "text-ink-muted" : "", children: displayLabel }),
          /* @__PURE__ */ jsx("span", { className: `text-ink-muted transition-transform duration-slow ${isOpen ? "rotate-180" : ""}`, children: /* @__PURE__ */ jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" }) }) })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "absolute z-drawer w-full mt-3 bg-surface border-2 border-line rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-h-[400px] overflow-hidden animate-in fade-in slide-in-from-top-4 flex flex-col", children: [
      searchable && /* @__PURE__ */ jsx("div", { className: "p-3 border-b-2 border-line bg-sunken/50 dark:bg-app", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxs("svg", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: [
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
            className: "w-full pl-11 pr-4 py-3 rounded-[10px] bg-surface border-2 border-line text-base font-bold outline-none focus:border-brand-500 transition-all",
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
            className: "w-full px-4 py-6 rounded-2xl text-left text-lg font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all flex items-center gap-4 shadow-xl border-4 border-white/20 mb-4 animate-bounce",
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
                                        ${value == opt.value ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-2 border-emerald-100 dark:border-emerald-500/20" : "text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover hover:pl-6"}
`,
            children: [
              opt.label,
              value == opt.value && /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-in zoom-in", children: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) }) })
            ]
          },
          opt.value
        )) : !searchTerm ? /* @__PURE__ */ jsx("div", { className: "px-4 py-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-ink-muted font-bold uppercase tracking-widest text-xs", children: "No options available" }) }) : null,
        filteredOptions.length === 0 && searchTerm && !creatable && /* @__PURE__ */ jsx("div", { className: "px-4 py-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-ink-muted font-bold uppercase tracking-widest text-xs", children: "No Results Found" }) })
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
                bg-app
                border ${error ? "border-red-500" : "border-line"}
                text-ink font-medium
                placeholder:text-ink-muted
                outline-none focus:ring-2 ${error ? "ring-red-500/20" : "ring-brand-500/20 focus:border-brand-500"}
                transition-all resize-none hover:bg-white dark:hover:bg-interactive-hover
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
                bg-gradient-to-r from-brand-600 to-brand-700
                hover:from-brand-700 hover:to-brand-800
                shadow-lg 
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
                border border-line
                text-ink-secondary
                hover:bg-interactive-hover dark:hover:bg-interactive-hover
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
        return /* @__PURE__ */ jsx(Info, { size: 48, className: "text-brand-500" });
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
          /* @__PURE__ */ jsx("div", { className: `mb-4 w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-normal ${alertState.type === "success" ? "bg-emerald-100" : alertState.type === "error" ? "bg-red-100" : alertState.type === "warning" ? "bg-amber-100" : "bg-brand-100"}`, children: getIcon() }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-secondary mb-8 max-w-xs leading-relaxed", children: alertState.message }),
          /* @__PURE__ */ jsxs("div", { className: "flex w-full gap-3", children: [
            alertState.isConfirm && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: alertState.onCancel,
                className: "flex-1 py-3 bg-sunken text-ink-secondary dark:text-ink font-bold rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
                children: alertState.cancelLabel
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: alertState.onConfirm,
                className: `flex-1 py-3 font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 ${alertState.type === "error" ? "bg-red-500 hover:bg-red-600 " : alertState.type === "warning" ? "bg-amber-500 hover:bg-amber-600 " : alertState.type === "success" ? "bg-emerald-500 hover:bg-emerald-600 " : "bg-brand-600 hover:bg-brand-700 "}`,
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
const db = new Dexie("VenQore_Offline_DB");
db.version(3).stores({
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
db.on("populate", () => {
  db.settings.add({ key: "last_online_verify", value: Date.now() });
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
      const expirySetting = await db.settings.get("subscription_ends_at");
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
      const setting = await db.settings.get("last_online_verify");
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
    await db.settings.put({ key: "last_online_verify", value: Date.now() });
    const data = response?.data || {};
    if (data.subscription_ends_at) {
      await db.settings.put({ key: "subscription_ends_at", value: data.subscription_ends_at });
    } else {
      await db.settings.delete("subscription_ends_at");
    }
    console.log("[License] Heartbeat acknowledged. Timer reset.");
    return !!data.is_view_only;
  },
  /**
   * Uploads pending offline orders
   */
  async syncOrders() {
    const pendingOrders = await db.orders.where("status").equals("pending").toArray();
    if (pendingOrders.length === 0) return;
    const chunkSize = 50;
    for (let i2 = 0; i2 < pendingOrders.length; i2 += chunkSize) {
      const batch = pendingOrders.slice(i2, i2 + chunkSize);
      try {
        const slug = this.getStoreSlug();
        if (!slug) break;
        await axios.post(route("store.api.sync.orders.batch", { store_slug: slug }), { orders: batch }, { _skipGlobalErrorHandler: true });
        await db.transaction("rw", db.orders, async () => {
          for (const order of batch) {
            await db.orders.update(order.id, { status: "synced" });
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
          await db[resource].clear();
          await db[resource].bulkPut(response.data);
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
        await db.users.clear();
        await db.users.bulkPut(response.data);
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
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-command bg-neutral-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-slow", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] animate-pulse" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] animate-pulse", style: { animationDelay: "1s" } })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md", children: [
      /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow", children: /* @__PURE__ */ jsx(WifiOff, { size: 40, className: "text-red-500" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-white mb-3 tracking-tight", children: "Access Suspended" }),
      /* @__PURE__ */ jsx("p", { className: "text-neutral-300 mb-8 text-lg leading-relaxed", children: reason }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            id: "retry-btn",
            onClick: checkConnection,
            className: "w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-3",
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
            className: "w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 font-bold rounded-xl transition-all flex items-center justify-center gap-3",
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
        /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-3 font-mono", children: "Connection will auto-retry in the background." })
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
        return /* @__PURE__ */ jsx(Info, { size: 48, className: "text-brand-500" });
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
        return "bg-brand-100 dark:bg-brand-900/30";
    }
  };
  const getButtonClass = (type, isConfirm = false) => {
    if (isConfirm) {
      return "bg-red-500 hover:bg-red-600 ";
    }
    switch (type) {
      case "success":
        return "bg-emerald-500 hover:bg-emerald-600 ";
      case "error":
        return "bg-red-500 hover:bg-red-600 ";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 ";
      default:
        return "bg-brand-600 hover:bg-brand-700 ";
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
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-command flex items-center justify-center p-4", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-fast",
          onClick: () => closeDialog(dialog.type === "confirm" ? false : true)
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "relative bg-surface rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-normal overflow-hidden border border-line", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center p-6 pt-8", children: [
        /* @__PURE__ */ jsx("div", { className: `mb-4 w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-slow ${getIconBg(alertType)}`, children: getIcon(alertType) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink mb-2", children: dialog.title }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-secondary mb-8 max-w-xs leading-relaxed text-sm", children: dialog.message }),
        /* @__PURE__ */ jsxs("div", { className: "flex w-full gap-3", children: [
          dialog.type === "confirm" && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => closeDialog(false),
              className: "flex-1 py-3 bg-sunken text-ink-secondary dark:text-ink font-bold rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all active:scale-95",
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
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-command flex items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-xs rounded-2xl shadow-2xl border border-line overflow-hidden scale-100 animate-in zoom-in-95 duration-normal", onClick: (e2) => e2.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 text-center border-b border-line relative", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "absolute right-4 top-4 text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors",
          children: /* @__PURE__ */ jsx(X, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(Lock, { size: 24 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Admin Access" }),
      /* @__PURE__ */ jsx("div", { className: "h-4" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "py-8 bg-app flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "flex gap-3", children: [...Array(6)].map((_2, i2) => /* @__PURE__ */ jsx(
      "div",
      {
        className: `w-4 h-4 rounded-full transition-all duration-normal ${i2 < input.length ? "bg-brand-600 scale-110" : "bg-sunken"} ${error ? "bg-red-500 animate-pulse" : ""}`
      },
      i2
    )) }) }),
    error && /* @__PURE__ */ jsx("p", { className: "text-center text-red-500 text-xs font-bold -mt-4 mb-4 animate-bounce", children: "Incorrect PIN" }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 grid grid-cols-3 gap-4", children: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleNumberClick(num.toString()),
          className: "h-14 rounded-2xl bg-sunken text-xl font-bold text-ink-secondary dark:text-ink hover:bg-white dark:hover:bg-interactive-hover hover:shadow-lg transition-all active:scale-95",
          children: num
        },
        num
      )),
      /* @__PURE__ */ jsx("div", { className: "col-start-1", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => verifyPasscode(input),
          className: "w-full h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-800/30 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center",
          children: /* @__PURE__ */ jsx(Check, { size: 28 })
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "col-start-2", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleNumberClick("0"),
          className: "w-full h-14 rounded-2xl bg-sunken text-xl font-bold text-ink-secondary dark:text-ink hover:bg-white dark:hover:bg-interactive-hover hover:shadow-lg transition-all active:scale-95",
          children: "0"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "col-start-3", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleDelete,
          className: "w-full h-14 rounded-2xl bg-sunken text-ink-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all flex items-center justify-center active:scale-95",
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
  return /* @__PURE__ */ jsx(Transition, { show, leave: "duration-normal", children: /* @__PURE__ */ jsxs(
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
            enter: "ease-out duration-slow",
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            leave: "ease-in duration-normal",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-neutral-500/75 dark:bg-app" })
          }
        ),
        /* @__PURE__ */ jsx(
          TransitionChild,
          {
            enter: "ease-out duration-slow",
            enterFrom: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
            enterTo: "opacity-100 translate-y-0 sm:scale-100",
            leave: "ease-in duration-normal",
            leaveFrom: "opacity-100 translate-y-0 sm:scale-100",
            leaveTo: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
            children: /* @__PURE__ */ jsx(
              DialogPanel,
              {
                className: `mb-6 transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:mx-auto sm:w-full dark:bg-surface ${maxWidthClass}`,
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
  return /* @__PURE__ */ jsx(Modal, { show: isOpen, onClose, maxWidth: "2xl", children: /* @__PURE__ */ jsxs("div", { className: "p-6 text-ink dark:text-ink", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6 border-b border-line dark:border-line pb-2", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("kbd", { className: "px-2 py-1 bg-overlay dark:bg-raised rounded text-sm", children: "⌨" }),
        /* @__PURE__ */ jsx("span", { children: title })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-ink-muted hover:text-ink dark:hover:text-neutral-300", children: "✕" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: Object.entries(content).map(([category, items]) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider", children: category }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: (Array.isArray(items) ? items : []).map((item, idx) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between items-center text-sm group hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded px-1 transition-colors", children: [
        /* @__PURE__ */ jsx("span", { className: "text-ink-secondary dark:text-ink-secondary group-hover:text-ink dark:group-hover:text-neutral-100", children: item.desc }),
        /* @__PURE__ */ jsx("kbd", { className: "px-2 py-0.5 bg-overlay dark:bg-surface border border-line dark:border-line rounded text-xs font-mono font-bold text-ink-muted dark:text-ink-secondary", children: item.key })
      ] }, idx)) })
    ] }, category)) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-4 border-t border-line dark:border-line text-center text-xs text-ink-muted", children: [
      "Press ",
      /* @__PURE__ */ jsx("kbd", { className: "font-bold", children: "Esc" }),
      " to close this reference."
    ] })
  ] }) });
}
const ThemeContext = createContext();
const STORAGE_KEY = "amd_theme";
const isExceptionPath = (pathname = "") => {
  const prefixes = ["/tools", "/blog", "/docs", "/documentation"];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};
const readSavedTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e2) {
    return null;
  }
};
const readTenantDefault = (settings) => {
  const defaultDark = settings?.dark_mode_default;
  if (defaultDark === void 0 || defaultDark === null) return null;
  return defaultDark === "1" || defaultDark === 1 || defaultDark === true || defaultDark === "true" || defaultDark === "on";
};
const resolveTheme = (settings, pathname) => {
  const saved = readSavedTheme();
  if (saved) return saved === "dark";
  const tenantDefault = readTenantDefault(settings);
  if (tenantDefault !== null) return tenantDefault;
  if (isExceptionPath(pathname)) {
    return false;
  }
  return false;
};
const ThemeProvider = ({ children, settings = {}, managed = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    return resolveTheme(settings, window.location.pathname);
  });
  const persist = useCallback((dark) => {
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch (e2) {
    }
  }, []);
  const lastToggleRef = useRef(0);
  const toggleTheme = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleRef.current < 150) return;
    lastToggleRef.current = now;
    setIsDarkMode((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, [persist]);
  const setThemeExplicitly = useCallback((dark) => {
    const next = typeof dark === "function" ? dark(isDarkMode) : dark;
    persist(next);
    setIsDarkMode(next);
  }, [isDarkMode, persist]);
  useEffect(() => {
    const apply = () => {
      setIsDarkMode(resolveTheme(settings, window.location.pathname));
    };
    const stop = router.on("navigate", apply);
    return () => {
      if (typeof stop === "function") stop();
    };
  }, [settings]);
  useEffect(() => {
    const tenantDefault = readTenantDefault(settings);
    if (tenantDefault === null) return;
    if (readSavedTheme()) return;
    setIsDarkMode(tenantDefault);
  }, [settings.dark_mode_default]);
  useEffect(() => {
    if (managed) return;
    document.documentElement.classList.toggle("dark", isDarkMode);
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
    document.documentElement.setAttribute("data-vq-theme", isDarkMode ? "dark" : "light");
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: { isDark: isDarkMode } }));
  }, [isDarkMode, managed]);
  useEffect(() => {
    const handleGlobalThemeToggle = (e2) => {
      const toggleBtn = e2.target.closest("[data-theme-toggle]");
      if (toggleBtn) {
        e2.preventDefault();
        toggleTheme();
      }
    };
    document.addEventListener("click", handleGlobalThemeToggle);
    return () => document.removeEventListener("click", handleGlobalThemeToggle);
  }, [toggleTheme]);
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: { isDarkMode, setIsDarkMode: setThemeExplicitly, toggleTheme }, children });
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
const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
function parseHex(hex) {
  const m2 = HEX_RE.exec(String(hex).trim());
  if (!m2) throw new Error(`[theme] Not a valid hex colour: ${hex}`);
  let body = m2[1];
  if (body.length === 3) body = body.split("").map((c2) => c2 + c2).join("");
  return {
    r: parseInt(body.slice(0, 2), 16),
    g: parseInt(body.slice(2, 4), 16),
    b: parseInt(body.slice(4, 6), 16),
    a: body.length === 8 ? parseInt(body.slice(6, 8), 16) / 255 : 1
  };
}
function toRgb(input) {
  if (input && typeof input === "object" && "r" in input) return input;
  const s2 = String(input).trim();
  if (s2.startsWith("#") || HEX_RE.test(s2)) return parseHex(s2);
  const parts = s2.split(/[\s,]+/).filter(Boolean).map(Number);
  if (parts.length >= 3 && parts.every((n2) => Number.isFinite(n2))) {
    return { r: parts[0], g: parts[1], b: parts[2], a: 1 };
  }
  throw new Error(`[theme] Cannot interpret colour: ${input}`);
}
const clamp255 = (n2) => Math.max(0, Math.min(255, Math.round(n2)));
function toTriplet(input) {
  const { r: r2, g: g2, b: b2 } = toRgb(input);
  return `${clamp255(r2)} ${clamp255(g2)} ${clamp255(b2)}`;
}
function toHex(input) {
  const { r: r2, g: g2, b: b2 } = toRgb(input);
  const h2 = (n2) => clamp255(n2).toString(16).padStart(2, "0");
  return `#${h2(r2)}${h2(g2)}${h2(b2)}`;
}
function rgbToHsl(input) {
  const { r: R2, g: G, b: B2 } = toRgb(input);
  const r2 = R2 / 255;
  const g2 = G / 255;
  const b2 = B2 / 255;
  const max = Math.max(r2, g2, b2);
  const min = Math.min(r2, g2, b2);
  const l2 = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l2 * 100 };
  const d2 = max - min;
  const s2 = l2 > 0.5 ? d2 / (2 - max - min) : d2 / (max + min);
  let h2;
  if (max === r2) h2 = (g2 - b2) / d2 + (g2 < b2 ? 6 : 0);
  else if (max === g2) h2 = (b2 - r2) / d2 + 2;
  else h2 = (r2 - g2) / d2 + 4;
  return { h: h2 * 60, s: s2 * 100, l: l2 * 100 };
}
function hslToRgb({ h: h2, s: s2, l: l2 }) {
  const H = (h2 % 360 + 360) % 360 / 360;
  const S2 = Math.max(0, Math.min(100, s2)) / 100;
  const L = Math.max(0, Math.min(100, l2)) / 100;
  if (S2 === 0) {
    const v2 = L * 255;
    return { r: v2, g: v2, b: v2, a: 1 };
  }
  const q2 = L < 0.5 ? L * (1 + S2) : L + S2 - L * S2;
  const p2 = 2 * L - q2;
  const channel = (t3) => {
    let T2 = t3;
    if (T2 < 0) T2 += 1;
    if (T2 > 1) T2 -= 1;
    if (T2 < 1 / 6) return p2 + (q2 - p2) * 6 * T2;
    if (T2 < 1 / 2) return q2;
    if (T2 < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - T2) * 6;
    return p2;
  };
  return {
    r: channel(H + 1 / 3) * 255,
    g: channel(H) * 255,
    b: channel(H - 1 / 3) * 255,
    a: 1
  };
}
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LIGHTNESS_CURVE = {
  50: 97,
  100: 94,
  200: 86,
  300: 77,
  400: 66,
  500: 56,
  600: 48,
  700: 40,
  800: 32,
  900: 25,
  950: 15
};
const SATURATION_CURVE = {
  50: 0.55,
  100: 0.62,
  200: 0.72,
  300: 0.82,
  400: 0.93,
  500: 1,
  600: 1,
  700: 0.96,
  800: 0.9,
  900: 0.84,
  950: 0.78
};
function ramp(base, { anchor = 500, overrides = {}, hueShift = 0, chroma = 1 } = {}) {
  const hsl = rgbToHsl(base);
  const anchorSat = hsl.s / (SATURATION_CURVE[anchor] ?? 1);
  const out = {};
  for (const shade of SHADES) {
    if (overrides[shade] != null) {
      out[shade] = toTriplet(overrides[shade]);
      continue;
    }
    const drift = hueShift * ((shade - anchor) / 450);
    out[shade] = toTriplet(
      hslToRgb({
        h: hsl.h + drift,
        s: Math.min(100, anchorSat * (SATURATION_CURVE[shade] ?? 1) * chroma),
        l: LIGHTNESS_CURVE[shade]
      })
    );
  }
  return out;
}
function literalRamp(stops, label = "ramp") {
  const out = {};
  for (const shade of SHADES) {
    if (stops[shade] == null) {
      throw new Error(`[theme] ${label} is missing the ${shade} stop.`);
    }
    out[shade] = toTriplet(stops[shade]);
  }
  return out;
}
const CONTROLLED_PALETTES = [
  "slate",
  // 24,452 — the entire UI chrome
  "gray",
  //    319
  "zinc",
  //     38
  "indigo",
  //  6,306 — de facto brand colour
  "violet",
  //    347
  "purple",
  //    899
  "fuchsia",
  //      3
  "blue",
  //    830
  "sky",
  //     59
  "cyan",
  //     77
  "teal",
  //    104
  "emerald",
  //  3,452 — money in, positive deltas
  "green",
  //     90
  "lime",
  //      0 — reserved
  "yellow",
  //     60
  "amber",
  //  1,757 — warnings, pending states
  "orange",
  //    396
  "red",
  //  2,122 — money out, destructive
  "rose",
  //    798
  "pink",
  //     49
  "stone",
  //      0 — reserved for warm-neutral themes
  "neutral",
  //      0 — reserved for warm-neutral themes
  "void"
  //    287 — VenQore-specific: the deep backgrounds that used to be
  //          written as arbitrary values (`bg-[#05030f]`) on auth,
  //          marketing and platform-shell screens. Not a Tailwind
  //          family; introduced by this engine so those screens are
  //          themeable rather than hardcoded.
];
const REQUIRED_ROLES = [
  "neutral",
  // page chrome, text, borders
  "brand",
  // primary actions, active nav, focus rings
  "accent",
  // secondary brand, decorative gradients
  "info",
  // neutral informational states
  "success",
  // completed, paid, stock in
  "warning",
  // pending, low stock, needs attention
  "danger",
  // destructive, overdue, stock out
  "highlight"
  // promotional, "new", callouts
];
const VAR_PREFIX = "--vq";
const safeKey = (key) => String(key).replace(/\./g, "_");
const cssVar = {
  /** `--vq-ramp-brand-600` — where a ramp's actual value lives. */
  ramp: (name, shade) => `${VAR_PREFIX}-ramp-${safeKey(name)}-${safeKey(shade)}`,
  /** `--vq-indigo-600` — what Tailwind reads; points at a ramp variable. */
  palette: (name, shade) => `${VAR_PREFIX}-${safeKey(name)}-${safeKey(shade)}`,
  /**
   * `--vq-tw-teal-600` — the same thing, out of the way.
   *
   * Used for the handful of families whose plain name is already spoken for
   * by an authored V6 token holding a RESOLVED COLOUR rather than a channel
   * triplet. Both can't live at `--vq-teal-600`: whichever loads last wins,
   * and if that's the triplet then every `var()` reading it as a colour is
   * dropped by the browser without a word. See theme/build/v6-owned.js.
   */
  paletteAliased: (name, shade) => `${VAR_PREFIX}-tw-${safeKey(name)}-${safeKey(shade)}`,
  /** `--vq-bg-surface` */
  semantic: (key) => `${VAR_PREFIX}-${safeKey(key)}`,
  /** `--vq-font-sans` */
  font: (key) => `${VAR_PREFIX}-font-${safeKey(key)}`,
  /** `--vq-text-base` */
  size: (key) => `${VAR_PREFIX}-text-${safeKey(key)}`,
  weight: (key) => `${VAR_PREFIX}-weight-${safeKey(key)}`,
  leading: (key) => `${VAR_PREFIX}-leading-${safeKey(key)}`,
  tracking: (key) => `${VAR_PREFIX}-tracking-${safeKey(key)}`,
  radius: (key) => `${VAR_PREFIX}-radius-${safeKey(key)}`,
  shadow: (key) => `${VAR_PREFIX}-shadow-${safeKey(key)}`,
  /** `--vq-space-1_5` — see safeKey above for why this is not `1.5`. */
  space: (key) => `${VAR_PREFIX}-space-${safeKey(key)}`,
  control: (key) => `${VAR_PREFIX}-control-${safeKey(key)}`,
  layout: (key) => `${VAR_PREFIX}-layout-${safeKey(key)}`,
  duration: (key) => `${VAR_PREFIX}-duration-${safeKey(key)}`,
  easing: (key) => `${VAR_PREFIX}-ease-${safeKey(key)}`,
  gradient: (key) => `${VAR_PREFIX}-gradient-${safeKey(key)}`
};
const DEFAULT_APPEARANCE = {
  // Must match ACTIVE_THEME / DEFAULT_THEME_ID in ./active.js and
  // Appearance::defaults() in PHP. It read 'minimal' — a theme that has never
  // been selectable — so every user without a saved preference was served an
  // attribute matching no emitted block.
  theme: "venqore-v6",
  // Light, not 'system'. Following the operating system meant a customer on a
  // dark laptop met a dark ERP before they had any idea it could be either.
  mode: "light",
  primary: null,
  accent: null,
  font: "theme",
  density: "comfortable",
  radius: "default",
  experience: "classic"
};
const prefersDark = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
function resolveDarkMode(mode) {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return prefersDark();
}
function rampOverrides(role, hex) {
  if (!hex) return {};
  const stops = ramp(hex);
  const out = {};
  for (const shade of SHADES) {
    out[cssVar.ramp(role, shade)] = stops[shade];
  }
  return out;
}
function buildOverrides(appearance = {}) {
  const overrides = {
    ...rampOverrides("brand", appearance.primary),
    ...rampOverrides("accent", appearance.accent)
  };
  if (appearance.primary) {
    overrides[cssVar.semantic("focus-ring")] = ramp(appearance.primary)[500];
  }
  return overrides;
}
function applyAppearance(appearance = {}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const settings = { ...DEFAULT_APPEARANCE, ...appearance };
  root.setAttribute("data-vq-theme", settings.theme);
  root.setAttribute("data-vq-density", settings.density);
  root.setAttribute("data-vq-radius", settings.radius);
  if (settings.font && settings.font !== "theme") {
    root.setAttribute("data-vq-font", settings.font);
  } else {
    root.removeAttribute("data-vq-font");
  }
  root.classList.toggle("dark", resolveDarkMode(settings.mode));
  const overrides = buildOverrides(settings);
  for (const property of Array.from(root.style)) {
    if (property.startsWith("--vq-") && !(property in overrides)) {
      root.style.removeProperty(property);
    }
  }
  for (const [property, value] of Object.entries(overrides)) {
    root.style.setProperty(property, value);
  }
}
function appearanceFromPage(pageProps) {
  return { ...DEFAULT_APPEARANCE, ...pageProps?.appearance || {} };
}
const AppearanceContext = createContext(null);
function AppearanceProvider({ children }) {
  const { props } = usePage();
  const active = Boolean(props.auth?.user && props.store);
  const serverAppearance = useMemo(() => appearanceFromPage(props), [props.appearance]);
  const [appearance, setAppearance] = useState(serverAppearance);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setAppearance(serverAppearance);
  }, [serverAppearance]);
  useEffect(() => {
    if (!active) return;
    applyAppearance(appearance);
  }, [appearance, active]);
  useEffect(() => {
    if (!active) return;
    if (appearance.mode !== "system") return;
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => applyAppearance(appearance);
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [appearance, active]);
  const update = useCallback((changes, { persist = true, scope = "store" } = {}) => {
    const next = { ...appearance, ...changes };
    setAppearance(next);
    applyAppearance(next);
    if (!persist) return;
    const storeSlug = props.store?.slug;
    if (!storeSlug) return;
    setSaving(true);
    router.post(
      route("store.appearance.update", { store_slug: storeSlug }),
      {
        // Only the dials this app still exposes. Font, density and
        // radius were withdrawn and dropped from the controller's
        // validation rules; continuing to send them meant this payload
        // and the server disagreed about the shape of a save.
        theme: next.theme,
        mode: next.mode,
        primary: next.primary,
        accent: next.accent,
        scope
      },
      {
        preserveScroll: true,
        preserveState: true,
        // The response re-shares `appearance`, which re-seeds this
        // provider from the server. That is the confirmation step: the
        // optimistic value has already painted, and if the save was
        // rejected the server's answer quietly replaces it.
        onFinish: () => setSaving(false)
      }
    );
  }, [appearance, props.store?.slug]);
  const value = useMemo(() => ({
    appearance,
    update,
    saving,
    isDark: resolveDarkMode(appearance.mode),
    experience: appearance.experience || DEFAULT_APPEARANCE.experience
  }), [appearance, update, saving]);
  return /* @__PURE__ */ jsx(AppearanceContext.Provider, { value, children });
}
function useAppearance() {
  return useContext(AppearanceContext) ?? {
    appearance: DEFAULT_APPEARANCE,
    update: () => {
    },
    saving: false,
    isDark: resolveDarkMode(DEFAULT_APPEARANCE.mode),
    experience: DEFAULT_APPEARANCE.experience
  };
}
function GlobalProviderLayout({ children }) {
  const { props } = usePage();
  const settings = props.settings || {};
  const appearanceManaged = Boolean(props.auth?.user && props.store);
  return /* @__PURE__ */ jsx(ThemeProvider, { settings, managed: appearanceManaged, children: /* @__PURE__ */ jsx(AppearanceProvider, { children: /* @__PURE__ */ jsx(InnerGlobalLayout, { settings, children }) }) });
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
        if (res.status === 200 || res.status === 204) {
          clearInterval(pollInterval);
          setShowUpdateOverlay(false);
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
  (() => {
    if (isInstaller || isMarketing) return false;
    if (!props.store?.features?.live_chat_widget) return false;
    const path = currentPath;
    const blockedPatterns = [
      "/pos",
      "/create",
      "/edit",
      "/new-store",
      "/build-workspace",
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
    showUpdateOverlay && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-command bg-neutral-950/80 backdrop-blur-2xl flex items-center justify-center p-6 select-none", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full bg-neutral-900/90 border border-neutral-800/80 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-center mb-8 h-24", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute w-20 h-20 rounded-full border border-brand-500/20 bg-brand-500/5 animate-ping opacity-60" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-16 h-16 rounded-full border border-brand-500/30 bg-brand-500/10 animate-pulse" }),
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-gradient-brand text-white flex items-center justify-center shadow-lg relative z-20", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 animate-spin text-white", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ jsx("path", { d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-neutral-100 tracking-tight", children: "System Upgrade in Progress" }),
        /* @__PURE__ */ jsxs("p", { className: "text-ink-muted text-xs leading-relaxed max-w-[320px] mx-auto", children: [
          "We are currently applying a live system update to your app. To prevent any data loss, ",
          /* @__PURE__ */ jsx("strong", { className: "text-brand-400", children: "please do not refresh, close the page, or perform any actions" }),
          " right now."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-3 border-t border-neutral-800/60 max-w-[280px] mx-auto", children: /* @__PURE__ */ jsx("p", { className: "text-1xs font-medium text-amber-400/90 bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-2 leading-relaxed", children: "⚠️ Warning: Any transactions or changes made during this brief period will not be saved." }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-xs font-semibold text-ink-muted pt-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" }),
          /* @__PURE__ */ jsx("span", { children: "Reconnecting to server..." })
        ] })
      ] })
    ] }) }),
    !isInstaller && !isMarketing && props.auth?.user && !currentPath.startsWith("/VenQore") && currentPath !== "/hub" && /* @__PURE__ */ jsx(
      "div",
      {
        onClick: () => setShowShortcuts(true),
        className: "hidden lg:block fixed bottom-1 left-1 z-command opacity-40 hover:opacity-100 transition-opacity cursor-pointer group",
        title: "View Keyboard Shortcuts",
        children: /* @__PURE__ */ jsxs("div", { className: "bg-black/80 text-white px-2 py-1 rounded text-2xs font-mono flex items-center gap-1 shadow-lg backdrop-blur-sm border border-white/10", children: [
          /* @__PURE__ */ jsx("span", { children: "⌨" }),
          /* @__PURE__ */ jsx("span", { className: "hidden group-hover:inline", children: "Shortcuts" })
        ] })
      }
    ),
    /* @__PURE__ */ jsx(GlobalDialogOverride, {})
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
const p = Object.prototype.hasOwnProperty, y = Array.isArray, d = /* @__PURE__ */ new WeakMap();
var b = function(t3, e2) {
  return d.set(t3, e2), t3;
};
function v(t3) {
  return d.has(t3);
}
var h = function(t3) {
  return d.get(t3);
}, m = function(t3, e2) {
  d.set(t3, e2);
};
const g = (function() {
  const t3 = [];
  for (let e2 = 0; e2 < 256; ++e2) t3.push("%" + ((e2 < 16 ? "0" : "") + e2.toString(16)).toUpperCase());
  return t3;
})(), w = function(t3, e2) {
  const n2 = e2 && e2.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
  for (let e3 = 0; e3 < t3.length; ++e3) void 0 !== t3[e3] && (n2[e3] = t3[e3]);
  return n2;
}, j = function t2(e2, n2, r2) {
  if (!n2) return e2;
  if ("object" != typeof n2) {
    if (y(e2)) e2.push(n2);
    else {
      if (!e2 || "object" != typeof e2) return [e2, n2];
      if (v(e2)) {
        var o2 = h(e2) + 1;
        e2[o2] = n2, m(e2, o2);
      } else (r2 && (r2.plainObjects || r2.allowPrototypes) || !p.call(Object.prototype, n2)) && (e2[n2] = true);
    }
    return e2;
  }
  if (!e2 || "object" != typeof e2) {
    if (v(n2)) {
      for (var i2 = Object.keys(n2), u2 = r2 && r2.plainObjects ? { __proto__: null, 0: e2 } : { 0: e2 }, f2 = 0; f2 < i2.length; f2++) u2[parseInt(i2[f2], 10) + 1] = n2[i2[f2]];
      return b(u2, h(n2) + 1);
    }
    return [e2].concat(n2);
  }
  let c2 = e2;
  return y(e2) && !y(n2) && (c2 = w(e2, r2)), y(e2) && y(n2) ? (n2.forEach(function(n3, o3) {
    if (p.call(e2, o3)) {
      const i3 = e2[o3];
      i3 && "object" == typeof i3 && n3 && "object" == typeof n3 ? e2[o3] = t2(i3, n3, r2) : e2.push(n3);
    } else e2[o3] = n3;
  }), e2) : Object.keys(n2).reduce(function(e3, o3) {
    const i3 = n2[o3];
    return e3[o3] = p.call(e3, o3) ? t2(e3[o3], i3, r2) : i3, e3;
  }, c2);
}, O = 1024, E = function(t3, e2, n2, r2) {
  if (v(t3)) {
    var o2 = h(t3) + 1;
    return t3[o2] = e2, m(t3, o2), t3;
  }
  var i2 = [].concat(t3, e2);
  return i2.length > n2 ? b(w(i2, { plainObjects: r2 }), i2.length - 1) : i2;
}, T = function(t3, e2) {
  if (y(t3)) {
    const n2 = [];
    for (let r2 = 0; r2 < t3.length; r2 += 1) n2.push(e2(t3[r2]));
    return n2;
  }
  return e2(t3);
}, R = Object.prototype.hasOwnProperty, k = { brackets: function(t3) {
  return t3 + "[]";
}, comma: "comma", indices: function(t3, e2) {
  return t3 + "[" + e2 + "]";
}, repeat: function(t3) {
  return t3;
} }, S = Array.isArray, I = Array.prototype.push, A = function(t3, e2) {
  I.apply(t3, S(e2) ? e2 : [e2]);
}, D = Date.prototype.toISOString, $ = { addQueryPrefix: false, allowDots: false, allowEmptyArrays: false, arrayFormat: "indices", charset: "utf-8", charsetSentinel: false, delimiter: "&", encode: true, encodeDotInKeys: false, encoder: function(t3, e2, n2, r2, o2) {
  if (0 === t3.length) return t3;
  let i2 = t3;
  if ("symbol" == typeof t3 ? i2 = Symbol.prototype.toString.call(t3) : "string" != typeof t3 && (i2 = String(t3)), "iso-8859-1" === n2) return escape(i2).replace(/%u[0-9a-f]{4}/gi, function(t4) {
    return "%26%23" + parseInt(t4.slice(2), 16) + "%3B";
  });
  let u2 = "";
  for (let t4 = 0; t4 < i2.length; t4 += O) {
    const e3 = i2.length >= O ? i2.slice(t4, t4 + O) : i2, n3 = [];
    for (let t5 = 0; t5 < e3.length; ++t5) {
      let r3 = e3.charCodeAt(t5);
      45 === r3 || 46 === r3 || 95 === r3 || 126 === r3 || r3 >= 48 && r3 <= 57 || r3 >= 65 && r3 <= 90 || r3 >= 97 && r3 <= 122 || "RFC1738" === o2 && (40 === r3 || 41 === r3) ? n3[n3.length] = e3.charAt(t5) : r3 < 128 ? n3[n3.length] = g[r3] : r3 < 2048 ? n3[n3.length] = g[192 | r3 >> 6] + g[128 | 63 & r3] : r3 < 55296 || r3 >= 57344 ? n3[n3.length] = g[224 | r3 >> 12] + g[128 | r3 >> 6 & 63] + g[128 | 63 & r3] : (t5 += 1, r3 = 65536 + ((1023 & r3) << 10 | 1023 & e3.charCodeAt(t5)), n3[n3.length] = g[240 | r3 >> 18] + g[128 | r3 >> 12 & 63] + g[128 | r3 >> 6 & 63] + g[128 | 63 & r3]);
    }
    u2 += n3.join("");
  }
  return u2;
}, encodeValuesOnly: false, format: s, formatter: l[s], indices: false, serializeDate: function(t3) {
  return D.call(t3);
}, skipNulls: false, strictNullHandling: false }, N = {}, _ = function(t3, e2, n2, r2, o2, i2, u2, f2, c2, a2, l2, s2, p2, y2, d2, b2, v2, h2) {
  let m2 = t3, g2 = h2, w2 = 0, j2 = false;
  for (; void 0 !== (g2 = g2.get(N)) && !j2; ) {
    const e3 = g2.get(t3);
    if (w2 += 1, void 0 !== e3) {
      if (e3 === w2) throw new RangeError("Cyclic object value");
      j2 = true;
    }
    void 0 === g2.get(N) && (w2 = 0);
  }
  if ("function" == typeof a2 ? m2 = a2(e2, m2) : m2 instanceof Date ? m2 = p2(m2) : "comma" === n2 && S(m2) && (m2 = T(m2, function(t4) {
    return t4 instanceof Date ? p2(t4) : t4;
  })), null === m2) {
    if (i2) return c2 && !b2 ? c2(e2, $.encoder, v2, "key", y2) : e2;
    m2 = "";
  }
  if ("string" == typeof (O2 = m2) || "number" == typeof O2 || "boolean" == typeof O2 || "symbol" == typeof O2 || "bigint" == typeof O2 || (function(t4) {
    return !(!t4 || "object" != typeof t4 || !(t4.constructor && t4.constructor.isBuffer && t4.constructor.isBuffer(t4)));
  })(m2)) return c2 ? [d2(b2 ? e2 : c2(e2, $.encoder, v2, "key", y2)) + "=" + d2(c2(m2, $.encoder, v2, "value", y2))] : [d2(e2) + "=" + d2(String(m2))];
  var O2;
  const E2 = [];
  if (void 0 === m2) return E2;
  let R2;
  if ("comma" === n2 && S(m2)) b2 && c2 && (m2 = T(m2, c2)), R2 = [{ value: m2.length > 0 ? m2.join(",") || null : void 0 }];
  else if (S(a2)) R2 = a2;
  else {
    const t4 = Object.keys(m2);
    R2 = l2 ? t4.sort(l2) : t4;
  }
  const k2 = f2 ? e2.replace(/\./g, "%2E") : e2, I2 = r2 && S(m2) && 1 === m2.length ? k2 + "[]" : k2;
  if (o2 && S(m2) && 0 === m2.length) return I2 + "[]";
  for (let e3 = 0; e3 < R2.length; ++e3) {
    const g3 = R2[e3], j3 = "object" == typeof g3 && void 0 !== g3.value ? g3.value : m2[g3];
    if (u2 && null === j3) continue;
    const O3 = s2 && f2 ? g3.replace(/\./g, "%2E") : g3, T2 = S(m2) ? "function" == typeof n2 ? n2(I2, O3) : I2 : I2 + (s2 ? "." + O3 : "[" + O3 + "]");
    h2.set(t3, w2);
    const k3 = /* @__PURE__ */ new WeakMap();
    k3.set(N, h2), A(E2, _(j3, T2, n2, r2, o2, i2, u2, f2, "comma" === n2 && b2 && S(m2) ? null : c2, a2, l2, s2, p2, y2, d2, b2, v2, k3));
  }
  return E2;
}, x = Object.prototype.hasOwnProperty, C = Array.isArray, P = { allowDots: false, allowEmptyArrays: false, allowPrototypes: false, allowSparse: false, arrayLimit: 20, charset: "utf-8", charsetSentinel: false, comma: false, decodeDotInKeys: false, decoder: function(t3, e2, n2) {
  const r2 = t3.replace(/\+/g, " ");
  if ("iso-8859-1" === n2) return r2.replace(/%[0-9a-f]{2}/gi, unescape);
  try {
    return decodeURIComponent(r2);
  } catch (t4) {
    return r2;
  }
}, delimiter: "&", depth: 5, duplicates: "combine", ignoreQueryPrefix: false, interpretNumericEntities: false, parameterLimit: 1e3, parseArrays: true, plainObjects: false, strictNullHandling: false }, Z = function(t3) {
  return t3.replace(/&#(\d+);/g, function(t4, e2) {
    return String.fromCharCode(parseInt(e2, 10));
  });
}, F = function(t3, e2) {
  return t3 && "string" == typeof t3 && e2.comma && t3.indexOf(",") > -1 ? t3.split(",") : t3;
}, U = function(t3, e2, n2, r2) {
  if (!t3) return;
  const o2 = n2.allowDots ? t3.replace(/\.([^.[]+)/g, "[$1]") : t3, i2 = /(\[[^[\]]*])/g;
  let u2 = n2.depth > 0 && /(\[[^[\]]*])/.exec(o2);
  const f2 = u2 ? o2.slice(0, u2.index) : o2, c2 = [];
  if (f2) {
    if (!n2.plainObjects && x.call(Object.prototype, f2) && !n2.allowPrototypes) return;
    c2.push(f2);
  }
  let a2 = 0;
  for (; n2.depth > 0 && null !== (u2 = i2.exec(o2)) && a2 < n2.depth; ) {
    if (a2 += 1, !n2.plainObjects && x.call(Object.prototype, u2[1].slice(1, -1)) && !n2.allowPrototypes) return;
    c2.push(u2[1]);
  }
  return u2 && c2.push("[" + o2.slice(u2.index) + "]"), (function(t4, e3, n3, r3) {
    let o3 = r3 ? e3 : F(e3, n3);
    for (let e4 = t4.length - 1; e4 >= 0; --e4) {
      let r4;
      const i3 = t4[e4];
      if ("[]" === i3 && n3.parseArrays) r4 = v(o3) ? o3 : n3.allowEmptyArrays && ("" === o3 || n3.strictNullHandling && null === o3) ? [] : E([], o3, n3.arrayLimit, n3.plainObjects);
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
function q(t3, e2) {
  const n2 = /* @__PURE__ */ (function(t4) {
    return P;
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
      -1 === c2 ? (a2 = e3.decoder(t5, P.decoder, u2, "key"), l2 = e3.strictNullHandling ? null : "") : (a2 = e3.decoder(t5.slice(0, c2), P.decoder, u2, "key"), l2 = T(F(t5.slice(c2 + 1), e3), function(t6) {
        return e3.decoder(t6, P.decoder, u2, "value");
      })), l2 && e3.interpretNumericEntities && "iso-8859-1" === u2 && (l2 = Z(l2)), t5.indexOf("[]=") > -1 && (l2 = C(l2) ? [l2] : l2);
      const s2 = x.call(n3, a2);
      s2 && "combine" === e3.duplicates ? n3[a2] = E(n3[a2], l2, e3.arrayLimit, e3.plainObjects) : s2 && "last" !== e3.duplicates || (n3[a2] = l2);
    }
    return n3;
  })(t3, n2) : t3;
  let o2 = n2.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
  const i2 = Object.keys(r2);
  for (let e3 = 0; e3 < i2.length; ++e3) {
    const u2 = i2[e3], f2 = U(u2, r2[u2], n2, "string" == typeof t3);
    o2 = j(o2, f2, n2);
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
var K = /* @__PURE__ */ (function() {
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
      return { params: f2.groups, query: q(u2) };
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
})(), z = /* @__PURE__ */ (function(t3) {
  function r2(e2, r3, o3, i2) {
    var u3;
    if (void 0 === o3 && (o3 = true), (u3 = t3.call(this) || this).t = null != i2 ? i2 : "undefined" != typeof Ziggy ? Ziggy : null == globalThis ? void 0 : globalThis.Ziggy, !u3.t && "undefined" != typeof document && document.getElementById("ziggy-routes-json") && (globalThis.Ziggy = JSON.parse(document.getElementById("ziggy-routes-json").textContent), u3.t = globalThis.Ziggy), u3.t = n({}, u3.t, { absolute: o3 }), e2) {
      if (!u3.t.routes[e2]) throw new Error("Ziggy error: route '" + e2 + "' is not in the route list.");
      u3.i = new K(e2, u3.t.routes[e2], u3.t), u3.u = u3.l(r3);
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
        if (!t6) return $;
        if (void 0 !== t6.allowEmptyArrays && "boolean" != typeof t6.allowEmptyArrays) throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
        if (void 0 !== t6.encodeDotInKeys && "boolean" != typeof t6.encodeDotInKeys) throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
        if (null != t6.encoder && "function" != typeof t6.encoder) throw new TypeError("Encoder has to be a function.");
        const e4 = t6.charset || $.charset;
        if (void 0 !== t6.charset && "utf-8" !== t6.charset && "iso-8859-1" !== t6.charset) throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
        let n3 = s;
        if (void 0 !== t6.format) {
          if (!R.call(l, t6.format)) throw new TypeError("Unknown format option provided.");
          n3 = t6.format;
        }
        const r4 = l[n3];
        let o4, i3 = $.filter;
        if (("function" == typeof t6.filter || S(t6.filter)) && (i3 = t6.filter), o4 = t6.arrayFormat in k ? t6.arrayFormat : "indices" in t6 ? t6.indices ? "indices" : "repeat" : $.arrayFormat, "commaRoundTrip" in t6 && "boolean" != typeof t6.commaRoundTrip) throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
        return { addQueryPrefix: "boolean" == typeof t6.addQueryPrefix ? t6.addQueryPrefix : $.addQueryPrefix, allowDots: void 0 === t6.allowDots ? true === t6.encodeDotInKeys || $.allowDots : !!t6.allowDots, allowEmptyArrays: "boolean" == typeof t6.allowEmptyArrays ? !!t6.allowEmptyArrays : $.allowEmptyArrays, arrayFormat: o4, charset: e4, charsetSentinel: "boolean" == typeof t6.charsetSentinel ? t6.charsetSentinel : $.charsetSentinel, commaRoundTrip: t6.commaRoundTrip, delimiter: void 0 === t6.delimiter ? $.delimiter : t6.delimiter, encode: "boolean" == typeof t6.encode ? t6.encode : $.encode, encodeDotInKeys: "boolean" == typeof t6.encodeDotInKeys ? t6.encodeDotInKeys : $.encodeDotInKeys, encoder: "function" == typeof t6.encoder ? t6.encoder : $.encoder, encodeValuesOnly: "boolean" == typeof t6.encodeValuesOnly ? t6.encodeValuesOnly : $.encodeValuesOnly, filter: i3, format: n3, formatter: r4, serializeDate: "function" == typeof t6.serializeDate ? t6.serializeDate : $.serializeDate, skipNulls: "boolean" == typeof t6.skipNulls ? t6.skipNulls : $.skipNulls, sort: "function" == typeof t6.sort ? t6.sort : null, strictNullHandling: "boolean" == typeof t6.strictNullHandling ? t6.strictNullHandling : $.strictNullHandling };
      })(e3);
      let o3, i2;
      "function" == typeof r3.filter ? (i2 = r3.filter, n2 = i2("", n2)) : S(r3.filter) && (i2 = r3.filter, o3 = i2);
      const u3 = [];
      if ("object" != typeof n2 || null === n2) return "";
      const f3 = k[r3.arrayFormat], c2 = "comma" === f3 && r3.commaRoundTrip;
      o3 || (o3 = Object.keys(n2)), r3.sort && o3.sort(r3.sort);
      const a2 = /* @__PURE__ */ new WeakMap();
      for (let t6 = 0; t6 < o3.length; ++t6) {
        const e4 = o3[t6];
        r3.skipNulls && null === n2[e4] || A(u3, _(n2[e4], e4, f3, c2, r3.allowEmptyArrays, r3.strictNullHandling, r3.skipNulls, r3.encodeDotInKeys, r3.encode ? r3.encoder : null, r3.filter, r3.sort, r3.allowDots, r3.serializeDate, r3.format, r3.formatter, r3.encodeValuesOnly, r3.charset, a2));
      }
      const p2 = u3.join(r3.delimiter);
      let y2 = true === r3.addQueryPrefix ? "?" : "";
      return r3.charsetSentinel && (y2 += "iso-8859-1" === r3.charset ? "utf8=%26%2310003%3B&" : "utf8=%E2%9C%93&"), p2.length > 0 ? y2 + p2 : "";
    })(n({}, e2, this.u._query), { addQueryPrefix: true, arrayFormat: "indices", encodeValuesOnly: true, skipNulls: true, encoder: function(t5, e3) {
      return "boolean" == typeof t5 ? Number(t5) : e3(t5);
    } });
  }, f2.p = function(t4) {
    var e2 = this;
    t4 ? this.t.absolute && t4.startsWith("/") && (t4 = this.v().host + t4) : t4 = this.h();
    var r3 = {}, o3 = Object.entries(this.t.routes).find(function(n2) {
      return r3 = new K(n2[0], n2[1], e2.t).matchesUrl(t4);
    }) || [void 0, void 0];
    return n({ name: o3[0] }, r3, { route: o3[1] });
  }, f2.h = function() {
    var t4 = this.v(), e2 = t4.pathname, n2 = t4.search;
    return (this.t.absolute ? t4.host + e2 : e2.replace(this.t.url.replace(/^\w*:\/\/[^/]+/, ""), "").replace(/^\/+/, "/")) + n2;
  }, f2.current = function(t4, e2) {
    var r3 = this.p(), o3 = r3.name, i2 = r3.params, u3 = r3.query, f3 = r3.route;
    if (!t4) return o3;
    var c2 = new RegExp("^" + t4.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$").test(o3);
    if ([null, void 0].includes(e2) || !c2) return c2;
    var a2 = new K(o3, f3, this.t);
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
  }, f2.v = function() {
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
    else if (1 === o3.length && !t4.hasOwnProperty(o3[0].name) && (t4.hasOwnProperty(Object.values(e2.bindings)[0]) || t4.hasOwnProperty("id"))) {
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
      var a2 = c2.hasOwnProperty(r3[f3]) ? r3[f3] : c2.hasOwnProperty("id") ? "id" : void 0;
      if (void 0 === a2) throw new Error("Ziggy error: object passed as '" + f3 + "' parameter is missing route model binding key '" + r3[f3] + "'.");
      return n({}, t5, ((i2 = {})[f3] = c2[a2], i2));
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
function B(t3, e2, n2, r2) {
  var o2 = new z(t3, e2, n2, r2);
  return t3 ? o2.toString() : o2;
}
const Ziggy$1 = { "url": "https://venqore.com", "port": null, "defaults": {}, "routes": { "horizon.stats.index": { "uri": "horizon/api/stats", "methods": ["GET", "HEAD"] }, "horizon.workload.index": { "uri": "horizon/api/workload", "methods": ["GET", "HEAD"] }, "horizon.masters.index": { "uri": "horizon/api/masters", "methods": ["GET", "HEAD"] }, "horizon.monitoring.index": { "uri": "horizon/api/monitoring", "methods": ["GET", "HEAD"] }, "horizon.monitoring.store": { "uri": "horizon/api/monitoring", "methods": ["POST"] }, "horizon.monitoring-tag.paginate": { "uri": "horizon/api/monitoring/{tag}", "methods": ["GET", "HEAD"], "parameters": ["tag"] }, "horizon.monitoring-tag.destroy": { "uri": "horizon/api/monitoring/{tag}", "methods": ["DELETE"], "wheres": { "tag": ".*" }, "parameters": ["tag"] }, "horizon.jobs-metrics.index": { "uri": "horizon/api/metrics/jobs", "methods": ["GET", "HEAD"] }, "horizon.jobs-metrics.show": { "uri": "horizon/api/metrics/jobs/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.queues-metrics.index": { "uri": "horizon/api/metrics/queues", "methods": ["GET", "HEAD"] }, "horizon.queues-metrics.show": { "uri": "horizon/api/metrics/queues/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.jobs-batches.index": { "uri": "horizon/api/batches", "methods": ["GET", "HEAD"] }, "horizon.jobs-batches.show": { "uri": "horizon/api/batches/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.jobs-batches.retry": { "uri": "horizon/api/batches/retry/{id}", "methods": ["POST"], "parameters": ["id"] }, "horizon.pending-jobs.index": { "uri": "horizon/api/jobs/pending", "methods": ["GET", "HEAD"] }, "horizon.completed-jobs.index": { "uri": "horizon/api/jobs/completed", "methods": ["GET", "HEAD"] }, "horizon.silenced-jobs.index": { "uri": "horizon/api/jobs/silenced", "methods": ["GET", "HEAD"] }, "horizon.failed-jobs.index": { "uri": "horizon/api/jobs/failed", "methods": ["GET", "HEAD"] }, "horizon.failed-jobs.show": { "uri": "horizon/api/jobs/failed/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.retry-jobs.show": { "uri": "horizon/api/jobs/retry/{id}", "methods": ["POST"], "parameters": ["id"] }, "horizon.jobs.show": { "uri": "horizon/api/jobs/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "horizon.index": { "uri": "horizon/{view?}", "methods": ["GET", "HEAD"], "wheres": { "view": "(.*)" }, "parameters": ["view"] }, "sanctum.csrf-cookie": { "uri": "sanctum/csrf-cookie", "methods": ["GET", "HEAD"] }, "api.sync.users": { "uri": "api/sync/users", "methods": ["GET", "HEAD"] }, "api.sync.products": { "uri": "api/sync/products", "methods": ["GET", "HEAD"] }, "api.sync.customers": { "uri": "api/sync/customers", "methods": ["GET", "HEAD"] }, "api.sync.suppliers": { "uri": "api/sync/suppliers", "methods": ["GET", "HEAD"] }, "api.sync.inventory": { "uri": "api/sync/inventory", "methods": ["GET", "HEAD"] }, "api.sync.taxes": { "uri": "api/sync/taxes", "methods": ["GET", "HEAD"] }, "api.sync.orders.batch": { "uri": "api/sync/orders/batch", "methods": ["POST"] }, "api.work-orders.index": { "uri": "api/work-orders", "methods": ["GET", "HEAD"] }, "api.work-orders.store": { "uri": "api/work-orders", "methods": ["POST"] }, "api.work-orders.show": { "uri": "api/work-orders/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "api.work-orders.update": { "uri": "api/work-orders/{id}", "methods": ["PUT"], "parameters": ["id"] }, "api.work-orders.assign": { "uri": "api/work-orders/{id}/assign", "methods": ["POST"], "parameters": ["id"] }, "api.work-orders.convert-invoice": { "uri": "api/work-orders/{id}/convert-invoice", "methods": ["POST"], "parameters": ["id"] }, "webhooks.lemon-squeezy": { "uri": "api/webhooks/lemon-squeezy", "methods": ["POST"] }, "api.pos.search": { "uri": "api/pos/search", "methods": ["GET", "HEAD"] }, "api.pos.featured": { "uri": "api/pos/featured", "methods": ["GET", "HEAD"] }, "api.pos.categories": { "uri": "api/pos/categories", "methods": ["GET", "HEAD"] }, "api.pos.barcode": { "uri": "api/pos/barcode/{code}", "methods": ["GET", "HEAD"], "parameters": ["code"] }, "api.pos.modifiers": { "uri": "api/pos/modifiers", "methods": ["GET", "HEAD"] }, "woo.webhook.receive": { "uri": "api/woo/webhook/{uuid}", "methods": ["POST"], "parameters": ["uuid"] }, "woo.verify": { "uri": "api/woo/verify/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "woo.handshake": { "uri": "api/woo/handshake", "methods": ["POST"] }, "marketing.features": { "uri": "features", "methods": ["GET", "HEAD"] }, "marketing.features.show": { "uri": "features/{slug}", "methods": ["GET", "HEAD"], "parameters": ["slug"] }, "marketing.roadmap": { "uri": "roadmap", "methods": ["GET", "HEAD"] }, "marketing.solutions.index": { "uri": "solutions", "methods": ["GET", "HEAD"] }, "marketing.solutions.show": { "uri": "solutions/{slug}", "methods": ["GET", "HEAD"], "parameters": ["slug"] }, "marketing.compare.index": { "uri": "compare", "methods": ["GET", "HEAD"] }, "marketing.compare.show": { "uri": "compare/{slug}", "methods": ["GET", "HEAD"], "parameters": ["slug"] }, "marketing.pricing": { "uri": "pricing", "methods": ["GET", "HEAD"] }, "marketing.pricing.override": { "uri": "pricing/currency-override", "methods": ["POST"] }, "marketing.about": { "uri": "about", "methods": ["GET", "HEAD"] }, "marketing.contact": { "uri": "contact", "methods": ["GET", "HEAD"] }, "marketing.contact.submit": { "uri": "contact", "methods": ["POST"] }, "marketing.vensynq": { "uri": "vensynq", "methods": ["GET", "HEAD"] }, "marketing.smartcapture": { "uri": "smartcapture", "methods": ["GET", "HEAD"] }, "marketing.documents": { "uri": "documents", "methods": ["GET", "HEAD"] }, "marketing.reckoner": { "uri": "reckoner", "methods": ["GET", "HEAD"] }, "marketing.ledger": { "uri": "ledger", "methods": ["GET", "HEAD"] }, "marketing.blueprint": { "uri": "blueprint", "methods": ["GET", "HEAD"] }, "marketing.security": { "uri": "security", "methods": ["GET", "HEAD"] }, "marketing.onboarding": { "uri": "onboarding", "methods": ["GET", "HEAD"] }, "marketing.dashboard-preview": { "uri": "dashboard-preview", "methods": ["GET", "HEAD"] }, "marketing.pos": { "uri": "pos", "methods": ["GET", "HEAD"] }, "marketing.newsletter": { "uri": "subscribe", "methods": ["GET", "HEAD"] }, "marketing.newsletter.submit": { "uri": "subscribe", "methods": ["POST"] }, "marketing.newsletter.confirm": { "uri": "subscribe/confirm/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "marketing.newsletter.unsubscribe": { "uri": "subscribe/unsubscribe/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "marketing.newsletter.unsubscribe.confirm": { "uri": "subscribe/unsubscribe/{token}", "methods": ["POST"], "parameters": ["token"] }, "marketing.digital-products": { "uri": "digital-products", "methods": ["GET", "HEAD"] }, "marketing.partner-support": { "uri": "partner-support", "methods": ["GET", "HEAD"] }, "partner-support.start": { "uri": "api/partner-support/chat", "methods": ["POST"] }, "partner-support.messages": { "uri": "api/partner-support/chat/{ticket_id}", "methods": ["GET", "HEAD"], "parameters": ["ticket_id"] }, "partner-support.reply": { "uri": "api/partner-support/chat/{ticket_id}/reply", "methods": ["POST"], "parameters": ["ticket_id"] }, "marketing.docs.index": { "uri": "docs", "methods": ["GET", "HEAD"] }, "marketing.docs.show": { "uri": "docs/{slug}", "methods": ["GET", "HEAD"], "parameters": ["slug"] }, "public.next-dashboard": { "uri": "next-dashboard", "methods": ["GET", "HEAD"] }, "new-dashboard": { "uri": "new-dashboard", "methods": ["GET", "HEAD"] }, "barcode.generate": { "uri": "barcode/generate", "methods": ["GET", "HEAD"] }, "tools.index": { "uri": "tools", "methods": ["GET", "HEAD"] }, "tools.barcode": { "uri": "tools/barcode-generator", "methods": ["GET", "HEAD"] }, "tools.barcode.format": { "uri": "tools/barcode-generator/{format}", "methods": ["GET", "HEAD"], "wheres": { "format": "code128|code39|code93|ean-13|ean-8|upc-a|upc-e|itf-14|codabar" }, "parameters": ["format"] }, "tools.barcode.render": { "uri": "tools/barcode-generator/render", "methods": ["POST"] }, "tools.barcode.validate": { "uri": "tools/barcode-generator/validate", "methods": ["POST"] }, "tools.barcode.sheet": { "uri": "tools/barcode-generator/sheet", "methods": ["POST"] }, "tools.smart-capture": { "uri": "tools/smart-capture", "methods": ["GET", "HEAD"] }, "tools.smart-capture.submit": { "uri": "tools/smart-capture", "methods": ["POST"] }, "tools.invoice": { "uri": "tools/invoice-generator", "methods": ["GET", "HEAD"] }, "tools.invoice.render": { "uri": "tools/invoice-generator/render", "methods": ["POST"] }, "tools.credit-note": { "uri": "tools/credit-note-generator", "methods": ["GET", "HEAD"] }, "tools.credit-note.render": { "uri": "tools/credit-note-generator/render", "methods": ["POST"] }, "tools.receipt": { "uri": "tools/receipt-generator", "methods": ["GET", "HEAD"] }, "tools.receipt.render": { "uri": "tools/receipt-generator/render", "methods": ["POST"] }, "tools.packing-slip": { "uri": "tools/packing-slip-generator", "methods": ["GET", "HEAD"] }, "tools.packing-slip.render": { "uri": "tools/packing-slip-generator/render", "methods": ["POST"] }, "tools.price-tag": { "uri": "tools/price-tag-generator", "methods": ["GET", "HEAD"] }, "tools.price-tag.sheet": { "uri": "tools/price-tag-generator/sheet", "methods": ["POST"] }, "tools.price-tag.parse": { "uri": "tools/price-tag-generator/parse", "methods": ["POST"] }, "tools.label-sheet": { "uri": "tools/label-sheet-generator", "methods": ["GET", "HEAD"] }, "tools.label-sheet.sheet": { "uri": "tools/label-sheet-generator/sheet", "methods": ["POST"] }, "tools.label-sheet.parse": { "uri": "tools/label-sheet-generator/parse", "methods": ["POST"] }, "tools.qr": { "uri": "tools/qr-code-generator", "methods": ["GET", "HEAD"] }, "tools.qr.render": { "uri": "tools/qr-code-generator/render", "methods": ["POST"] }, "tools.qr-menu": { "uri": "tools/qr-menu-generator", "methods": ["GET", "HEAD"] }, "tools.qr-menu.render": { "uri": "tools/qr-menu-generator/render", "methods": ["POST"] }, "tools.csv-cleaner": { "uri": "tools/product-csv-cleaner", "methods": ["GET", "HEAD"] }, "tools.csv-cleaner.parse": { "uri": "tools/product-csv-cleaner/parse", "methods": ["POST"] }, "tools.csv-cleaner.download": { "uri": "tools/product-csv-cleaner/download", "methods": ["POST"] }, "tools.purchase-order": { "uri": "tools/purchase-order-generator", "methods": ["GET", "HEAD"] }, "tools.purchase-order.render": { "uri": "tools/purchase-order-generator/render", "methods": ["POST"] }, "tools.quote": { "uri": "tools/quote-generator", "methods": ["GET", "HEAD"] }, "tools.quote.render": { "uri": "tools/quote-generator/render", "methods": ["POST"] }, "tools.stock-count": { "uri": "tools/stock-count-sheet", "methods": ["GET", "HEAD"] }, "tools.stock-count.render": { "uri": "tools/stock-count-sheet/render", "methods": ["POST"] }, "tools.stock-count.parse": { "uri": "tools/stock-count-sheet/parse", "methods": ["POST"] }, "tools.cash-drawer": { "uri": "tools/cash-drawer-count-sheet", "methods": ["GET", "HEAD"] }, "tools.cash-drawer.render": { "uri": "tools/cash-drawer-count-sheet/render", "methods": ["POST"] }, "tools.margin-calculator": { "uri": "tools/margin-calculator", "methods": ["GET", "HEAD"] }, "tools.inventory-health": { "uri": "tools/inventory-health", "methods": ["GET", "HEAD"] }, "tools.pos-roi": { "uri": "tools/pos-roi-calculator", "methods": ["GET", "HEAD"] }, "tools.food-cost": { "uri": "tools/food-cost-calculator", "methods": ["GET", "HEAD"] }, "tools.payment-fee": { "uri": "tools/payment-fee-calculator", "methods": ["GET", "HEAD"] }, "tools.sku-generator": { "uri": "tools/sku-generator", "methods": ["GET", "HEAD"] }, "tools.barcode-validator": { "uri": "tools/barcode-validator", "methods": ["GET", "HEAD"] }, "tools.barcode-validator.check": { "uri": "tools/barcode-validator/check", "methods": ["POST"] }, "tools.barcode-label": { "uri": "tools/barcode-label", "methods": ["GET", "HEAD"] }, "tools.barcode-label.parse": { "uri": "tools/barcode-label/parse", "methods": ["POST"] }, "tools.barcode-label.sheet": { "uri": "tools/barcode-label/sheet", "methods": ["POST"] }, "tools.lead.store": { "uri": "tools/lead", "methods": ["POST"] }, "tools.lead.confirm": { "uri": "tools/lead/confirm/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "tools.lead.unsubscribe": { "uri": "tools/lead/unsubscribe/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "tools.lead.unsubscribe.confirm": { "uri": "tools/lead/unsubscribe/{token}", "methods": ["POST"], "parameters": ["token"] }, "tools.download": { "uri": "tools/download/{uuid}", "methods": ["GET", "HEAD"], "parameters": ["uuid"] }, "public.invoice-scanner": { "uri": "tools/invoice-scanner", "methods": ["GET", "HEAD"] }, "public.invoice-scanner.submit": { "uri": "tools/invoice-scanner", "methods": ["POST"] }, "blog.index": { "uri": "blog", "methods": ["GET", "HEAD"] }, "blog.show": { "uri": "blog/{slug}", "methods": ["GET", "HEAD"], "parameters": ["slug"] }, "terms": { "uri": "terms", "methods": ["GET", "HEAD"] }, "privacy": { "uri": "privacy", "methods": ["GET", "HEAD"] }, "refund-policy": { "uri": "refund-policy", "methods": ["GET", "HEAD"] }, "help.index": { "uri": "help", "methods": ["GET", "HEAD"] }, "help.show": { "uri": "help/articles/{slug}", "methods": ["GET", "HEAD"], "parameters": ["slug"] }, "known-issues.show": { "uri": "known-issues", "methods": ["GET", "HEAD"] }, "marketing.partners": { "uri": "partners", "methods": ["GET", "HEAD"] }, "marketing.partners.store": { "uri": "partners-submit", "methods": ["POST"] }, "sitemap": { "uri": "sitemap.xml", "methods": ["GET", "HEAD"] }, "sitemap.sub": { "uri": "sitemap-{type}.xml", "methods": ["GET", "HEAD"], "wheres": { "type": "pages|blog|compare|solutions|tools" }, "parameters": ["type"] }, "demo.landing": { "uri": "demo", "methods": ["GET", "HEAD"] }, "demo.login": { "uri": "demo/login", "methods": ["GET", "POST", "HEAD"] }, "demo.logout": { "uri": "demo/logout", "methods": ["POST"] }, "vensynq.universal.callback.amazon": { "uri": "amazon/callback", "methods": ["GET", "HEAD"] }, "vensynq.universal.callback.tiktok": { "uri": "tiktok/callback", "methods": ["GET", "HEAD"] }, "vensynq.universal.callback.ebay": { "uri": "ebay/callback", "methods": ["GET", "HEAD"] }, "vensynq.universal.callback.woocommerce": { "uri": "woocommerce/callback", "methods": ["GET", "HEAD"] }, "google.callback": { "uri": "google/callback", "methods": ["GET", "HEAD"] }, "hub": { "uri": "hub", "methods": ["GET", "HEAD"] }, "my-stores.api": { "uri": "api/my-stores", "methods": ["GET", "HEAD"] }, "staff.hub": { "uri": "staff/hub", "methods": ["GET", "HEAD"] }, "store.create-or-join": { "uri": "start", "methods": ["GET", "HEAD"] }, "store.create": { "uri": "new-store", "methods": ["GET", "HEAD"] }, "store.store": { "uri": "new-store", "methods": ["POST"] }, "redeem": { "uri": "redeem", "methods": ["GET", "HEAD"] }, "redeem.submit": { "uri": "redeem", "methods": ["POST"] }, "store.join": { "uri": "join", "methods": ["GET", "HEAD"] }, "store.join.submit": { "uri": "join", "methods": ["POST"] }, "invite.accept": { "uri": "invite/accept", "methods": ["GET", "HEAD"] }, "invite.submit": { "uri": "invite/accept", "methods": ["POST"] }, "invite.decline": { "uri": "invite/decline", "methods": ["POST"] }, "gift.accept": { "uri": "gift/{token}", "methods": ["POST"], "parameters": ["token"] }, "invite.validate-code": { "uri": "invite/validate-code", "methods": ["POST"] }, "account.edit": { "uri": "account", "methods": ["GET", "HEAD"] }, "account.update": { "uri": "account", "methods": ["PATCH"] }, "account.passcode": { "uri": "account/passcode", "methods": ["POST"] }, "account.security-pin": { "uri": "account/security-pin", "methods": ["POST"] }, "account.destroy": { "uri": "account", "methods": ["DELETE"] }, "global.notifications.summary": { "uri": "api/notifications/summary", "methods": ["GET", "HEAD"] }, "store.root": { "uri": "s/{store_slug}", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.setup": { "uri": "s/{store_slug}/setup", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.setup.complete": { "uri": "s/{store_slug}/setup", "methods": ["POST"], "parameters": ["store_slug"] }, "store.terminal-pairing.index": { "uri": "s/{store_slug}/terminal-pairing-tokens", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.terminal-pairing.store": { "uri": "s/{store_slug}/terminal-pairing-tokens", "methods": ["POST"], "parameters": ["store_slug"] }, "store.terminal-pairing.destroy": { "uri": "s/{store_slug}/terminal-pairing-tokens/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.terminals.index": { "uri": "s/{store_slug}/terminals", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.terminals.revoke": { "uri": "s/{store_slug}/terminals/{id}/revoke", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.pos.search": { "uri": "s/{store_slug}/pos/products", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pos.featured": { "uri": "s/{store_slug}/pos/products/featured", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pos.categories": { "uri": "s/{store_slug}/pos/categories", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pos.barcode": { "uri": "s/{store_slug}/pos/barcode/{code}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "code"] }, "store.pos.recent-sales": { "uri": "s/{store_slug}/pos/recent-sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pos.modifiers": { "uri": "s/{store_slug}/pos/modifiers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.staff": { "uri": "s/{store_slug}/staff", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.staff.invite": { "uri": "s/{store_slug}/staff/invite", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing": { "uri": "s/{store_slug}/billing", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.billing.upgrade": { "uri": "s/{store_slug}/billing/upgrade", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.billing.portal": { "uri": "s/{store_slug}/billing/portal", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.billing.payment-history": { "uri": "s/{store_slug}/billing/payment-history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.backup.export": { "uri": "s/{store_slug}/backup/export", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.backup.import": { "uri": "s/{store_slug}/backup/import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.cancel-trial": { "uri": "s/{store_slug}/billing/cancel-trial", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.cancel-subscription": { "uri": "s/{store_slug}/billing/cancel-subscription", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.resume-subscription": { "uri": "s/{store_slug}/billing/resume-subscription", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.checkout-addon": { "uri": "s/{store_slug}/billing/checkout-addon", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.change-plan": { "uri": "s/{store_slug}/billing/change-plan", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.deactivate-feature": { "uri": "s/{store_slug}/billing/deactivate-feature", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.checkout-upload-service": { "uri": "s/{store_slug}/billing/checkout-upload-service", "methods": ["POST"], "parameters": ["store_slug"] }, "store.billing.sync-subscription": { "uri": "s/{store_slug}/billing/sync-subscription", "methods": ["POST"], "parameters": ["store_slug"] }, "store.google.redirect": { "uri": "s/{store_slug}/google/redirect", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.google.disconnect": { "uri": "s/{store_slug}/google/disconnect", "methods": ["POST"], "parameters": ["store_slug"] }, "store.google.settings": { "uri": "s/{store_slug}/google/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.google.sync-now": { "uri": "s/{store_slug}/google/sync-now", "methods": ["POST"], "parameters": ["store_slug"] }, "store.google.backup.download": { "uri": "s/{store_slug}/google/backup/download/{fileId}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "fileId"] }, "store.google.backup.delete": { "uri": "s/{store_slug}/google/backup/delete/{fileId}", "methods": ["POST"], "parameters": ["store_slug", "fileId"] }, "store.google.backup.restore": { "uri": "s/{store_slug}/google/backup/restore/{fileId}", "methods": ["POST"], "parameters": ["store_slug", "fileId"] }, "store.settings": { "uri": "s/{store_slug}/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.settings.update": { "uri": "s/{store_slug}/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.context": { "uri": "s/{store_slug}/smart-capture/context", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.smart-capture.extract": { "uri": "s/{store_slug}/smart-capture/extract", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.bulk-extract": { "uri": "s/{store_slug}/smart-capture/bulk-extract", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.job-status": { "uri": "s/{store_slug}/smart-capture/status/{job_id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "job_id"] }, "store.smart-capture.confirm": { "uri": "s/{store_slug}/smart-capture/confirm", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.settings": { "uri": "s/{store_slug}/smart-capture/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.smart-capture.settings.save": { "uri": "s/{store_slug}/smart-capture/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.settings.test": { "uri": "s/{store_slug}/smart-capture/settings/test", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.settings.models": { "uri": "s/{store_slug}/smart-capture/settings/models", "methods": ["POST"], "parameters": ["store_slug"] }, "store.smart-capture.aliases": { "uri": "s/{store_slug}/smart-capture/aliases", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.smart-capture.aliases.forget": { "uri": "s/{store_slug}/smart-capture/aliases/forget", "methods": ["POST"], "parameters": ["store_slug"] }, "store.restaurant.dashboard": { "uri": "s/{store_slug}/restaurant/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.restaurant.kitchen": { "uri": "s/{store_slug}/restaurant/kitchen", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.restaurant.kitchen.state": { "uri": "s/{store_slug}/restaurant/kitchen/state", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.restaurant.table.status": { "uri": "s/{store_slug}/restaurant/table/{id}/status", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.api.occupancies": { "uri": "s/{store_slug}/api/occupancies", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.occupancies.occupy": { "uri": "s/{store_slug}/api/occupancies/occupy", "methods": ["POST"], "parameters": ["store_slug"] }, "store.api.occupancies.release": { "uri": "s/{store_slug}/api/occupancies/release", "methods": ["POST"], "parameters": ["store_slug"] }, "store.restaurant.order.status": { "uri": "s/{store_slug}/restaurant/order/{id}/status", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.restaurant.order.bump": { "uri": "s/{store_slug}/restaurant/order/{id}/bump", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.restaurant.order.recall": { "uri": "s/{store_slug}/restaurant/order/{id}/recall", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.trial.expired": { "uri": "s/{store_slug}/trial-expired", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.notifications.plan.unread": { "uri": "s/{store_slug}/notifications/plan/unread", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.notifications.plan.markAllRead": { "uri": "s/{store_slug}/notifications/plan/mark-all-read", "methods": ["POST"], "parameters": ["store_slug"] }, "store.notifications.plan.read": { "uri": "s/{store_slug}/notifications/plan/{id}/read", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.devices.index": { "uri": "s/{store_slug}/api/devices", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.devices.deactivate": { "uri": "s/{store_slug}/api/devices/{id}/deactivate", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.session.eviction-status": { "uri": "s/{store_slug}/api/session/eviction-status", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.home": { "uri": "s/{store_slug}/admin", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.dashboard": { "uri": "s/{store_slug}/admin/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.settings": { "uri": "s/{store_slug}/admin/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.settings.update": { "uri": "s/{store_slug}/admin/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.users": { "uri": "s/{store_slug}/admin/users", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.users.update": { "uri": "s/{store_slug}/admin/users/{member}", "methods": ["PATCH"], "parameters": ["store_slug", "member"], "bindings": { "member": "id" } }, "store.admin.users.remove": { "uri": "s/{store_slug}/admin/users/{member}", "methods": ["DELETE"], "parameters": ["store_slug", "member"], "bindings": { "member": "id" } }, "store.admin.users.store": { "uri": "s/{store_slug}/admin/users", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.staff": { "uri": "s/{store_slug}/admin/staff", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.invitations.store": { "uri": "s/{store_slug}/admin/invitations", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.invitations.approve": { "uri": "s/{store_slug}/admin/invitations/{invitation}/approve", "methods": ["POST"], "parameters": ["store_slug", "invitation"], "bindings": { "invitation": "id" } }, "store.admin.invitations.decline": { "uri": "s/{store_slug}/admin/invitations/{invitation}/decline", "methods": ["POST"], "parameters": ["store_slug", "invitation"], "bindings": { "invitation": "id" } }, "store.admin.invitations.revoke": { "uri": "s/{store_slug}/admin/invitations/{invitation}/revoke", "methods": ["POST"], "parameters": ["store_slug", "invitation"], "bindings": { "invitation": "id" } }, "store.admin.invitations.resend": { "uri": "s/{store_slug}/admin/invitations/{invitation}/resend", "methods": ["POST"], "parameters": ["store_slug", "invitation"], "bindings": { "invitation": "id" } }, "store.admin.attendance": { "uri": "s/{store_slug}/admin/attendance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.logs": { "uri": "s/{store_slug}/admin/logs", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.data": { "uri": "s/{store_slug}/admin/data-management", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.data.export": { "uri": "s/{store_slug}/admin/data/export", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.import": { "uri": "s/{store_slug}/admin/data/import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.upload-mapping": { "uri": "s/{store_slug}/admin/data/upload-mapping", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.process-import": { "uri": "s/{store_slug}/admin/data/process-import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.validate-import": { "uri": "s/{store_slug}/admin/data/validate-import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.data.template": { "uri": "s/{store_slug}/admin/data/template", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.recycle-bin.index": { "uri": "s/{store_slug}/admin/recycle-bin", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.recycle-bin.restore": { "uri": "s/{store_slug}/admin/recycle-bin/{id}/restore", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.admin.recycle-bin.force-delete": { "uri": "s/{store_slug}/admin/recycle-bin/{id}/force-delete", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.admin.chatbot.settings": { "uri": "s/{store_slug}/admin/chatbot/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.chatbot.settings.update": { "uri": "s/{store_slug}/admin/chatbot/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.chatbot.ai.test": { "uri": "s/{store_slug}/admin/chatbot/settings/test", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.chatbot.inbox": { "uri": "s/{store_slug}/admin/chatbot/inbox", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.chatbot.sessions": { "uri": "s/{store_slug}/admin/chatbot/sessions", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.chatbot.claim": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/claim", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.reply": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/reply", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.typing.agent": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/typing", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.release": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/release", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.resolve": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/resolve", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.handoff-to-ai": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/handoff-to-ai", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.refer": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/refer", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.set-status": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/set-status", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.log-learning": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/log-learning", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.assist-suggestion": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/assist-suggestion", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.assist": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}/assist", "methods": ["POST"], "parameters": ["store_slug", "uuid"] }, "store.admin.chatbot.canned-responses": { "uri": "s/{store_slug}/admin/chatbot/canned-responses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.chatbot.destroy": { "uri": "s/{store_slug}/admin/chatbot/sessions/{uuid}", "methods": ["DELETE"], "parameters": ["store_slug", "uuid"] }, "store.admin.vena.tickets": { "uri": "s/{store_slug}/admin/vena-tickets", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.admin.vena.ticket.create": { "uri": "s/{store_slug}/admin/vena-tickets/create", "methods": ["POST"], "parameters": ["store_slug"] }, "store.admin.vena.ticket.show": { "uri": "s/{store_slug}/admin/vena-tickets/{ticket}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "ticket"], "bindings": { "ticket": "id" } }, "store.admin.vena.ticket.status": { "uri": "s/{store_slug}/admin/vena-tickets/{ticket}/status", "methods": ["POST"], "parameters": ["store_slug", "ticket"], "bindings": { "ticket": "id" } }, "platform.pk-verifications.submit": { "uri": "VenQore/pk-verifications/submit", "methods": ["POST"] }, "platform.dashboard": { "uri": "VenQore", "methods": ["GET", "HEAD"] }, "platform.digital-hub": { "uri": "VenQore/digital-hub", "methods": ["GET", "HEAD"] }, "platform.digital-hub.chats": { "uri": "VenQore/digital-hub/chats", "methods": ["GET", "HEAD"] }, "platform.digital-hub.chats.reply": { "uri": "VenQore/digital-hub/chats/{ticket_id}/reply", "methods": ["POST"], "parameters": ["ticket_id"] }, "platform.digital-hub.chats.status": { "uri": "VenQore/digital-hub/chats/{ticket_id}/status", "methods": ["POST"], "parameters": ["ticket_id"] }, "platform.digital-hub.products": { "uri": "VenQore/digital-hub/products", "methods": ["GET", "HEAD"] }, "platform.digital-hub.products.create": { "uri": "VenQore/digital-hub/products", "methods": ["POST"] }, "platform.digital-hub.products.update": { "uri": "VenQore/digital-hub/products/{id}/update", "methods": ["POST"], "parameters": ["id"] }, "platform.digital-hub.products.delete": { "uri": "VenQore/digital-hub/products/{id}", "methods": ["DELETE"], "parameters": ["id"] }, "platform.newsletter-hub": { "uri": "VenQore/newsletter-hub", "methods": ["GET", "HEAD"] }, "platform.newsletter-hub.subscribers": { "uri": "VenQore/newsletter-hub/subscribers", "methods": ["GET", "HEAD"] }, "platform.chatbot.settings": { "uri": "VenQore/chatbot/settings", "methods": ["GET", "HEAD"] }, "platform.chatbot.settings.update": { "uri": "VenQore/chatbot/settings", "methods": ["POST"] }, "platform.ai.test": { "uri": "VenQore/chatbot/settings/test", "methods": ["POST"] }, "platform.chatbot.inbox": { "uri": "VenQore/chatbot/inbox", "methods": ["GET", "HEAD"] }, "platform.chatbot.sessions": { "uri": "VenQore/api/chatbot/sessions", "methods": ["GET", "HEAD"] }, "platform.chatbot.claim": { "uri": "VenQore/api/chatbot/sessions/{uuid}/claim", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.reply": { "uri": "VenQore/api/chatbot/sessions/{uuid}/reply", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.typing.agent": { "uri": "VenQore/api/chatbot/sessions/{uuid}/typing", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.release": { "uri": "VenQore/api/chatbot/sessions/{uuid}/release", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.resolve": { "uri": "VenQore/api/chatbot/sessions/{uuid}/resolve", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.handoff-to-ai": { "uri": "VenQore/api/chatbot/sessions/{uuid}/handoff-to-ai", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.refer": { "uri": "VenQore/api/chatbot/sessions/{uuid}/refer", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.set-status": { "uri": "VenQore/api/chatbot/sessions/{uuid}/set-status", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.log-learning": { "uri": "VenQore/api/chatbot/sessions/{uuid}/log-learning", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.assist-suggestion": { "uri": "VenQore/api/chatbot/sessions/{uuid}/assist-suggestion", "methods": ["GET", "HEAD"], "parameters": ["uuid"] }, "platform.chatbot.assist": { "uri": "VenQore/api/chatbot/sessions/{uuid}/assist", "methods": ["POST"], "parameters": ["uuid"] }, "platform.chatbot.canned-responses": { "uri": "VenQore/api/chatbot/canned-responses", "methods": ["GET", "HEAD"] }, "platform.chatbot.destroy": { "uri": "VenQore/api/chatbot/sessions/{uuid}", "methods": ["DELETE"], "parameters": ["uuid"] }, "platform.chatbot.autonomy-stats": { "uri": "VenQore/api/platform/vena/autonomy-stats", "methods": ["GET", "HEAD"] }, "platform.chatbot.autonomy-stats.promote": { "uri": "VenQore/api/platform/vena/autonomy-stats/promote", "methods": ["POST"] }, "platform.stores": { "uri": "VenQore/stores", "methods": ["GET", "HEAD"] }, "platform.users": { "uri": "VenQore/users", "methods": ["GET", "HEAD"] }, "platform.store.suspend": { "uri": "VenQore/stores/{tenant}/suspend", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.store.activate": { "uri": "VenQore/stores/{tenant}/activate", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.store.extend-trial": { "uri": "VenQore/stores/{tenant}/extend-trial", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.store.toggle-internal": { "uri": "VenQore/stores/{tenant}/toggle-internal", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.store.destroy": { "uri": "VenQore/stores/{tenant}/destroy", "methods": ["DELETE"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.stores.bulk-destroy": { "uri": "VenQore/stores/bulk-destroy", "methods": ["POST"] }, "platform.store.restore": { "uri": "VenQore/stores/{id}/restore", "methods": ["POST"], "parameters": ["id"] }, "platform.store.purge": { "uri": "VenQore/stores/{id}/purge", "methods": ["DELETE"], "parameters": ["id"] }, "platform.user.destroy": { "uri": "VenQore/users/{user}/destroy", "methods": ["DELETE"], "parameters": ["user"], "bindings": { "user": "id" } }, "platform.users.bulk-destroy": { "uri": "VenQore/users/bulk-destroy", "methods": ["POST"] }, "platform.user.restore": { "uri": "VenQore/users/{id}/restore", "methods": ["POST"], "parameters": ["id"] }, "platform.user.purge": { "uri": "VenQore/users/{id}/purge", "methods": ["DELETE"], "parameters": ["id"] }, "platform.appsumo.index": { "uri": "VenQore/appsumo", "methods": ["GET", "HEAD"] }, "platform.appsumo.generate": { "uri": "VenQore/appsumo/generate", "methods": ["POST"] }, "platform.appsumo.import": { "uri": "VenQore/appsumo/import", "methods": ["POST"] }, "platform.appsumo.export": { "uri": "VenQore/appsumo/export", "methods": ["GET", "HEAD"] }, "platform.appsumo.purge": { "uri": "VenQore/appsumo/purge", "methods": ["DELETE"] }, "platform.tickets": { "uri": "VenQore/tickets", "methods": ["GET", "HEAD"] }, "platform.ticket.show": { "uri": "VenQore/tickets/{ticket}", "methods": ["GET", "HEAD"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.ticket.reply": { "uri": "VenQore/tickets/{ticket}/reply", "methods": ["POST"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.ticket.status": { "uri": "VenQore/tickets/{ticket}/status", "methods": ["POST"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.vena.tickets": { "uri": "VenQore/vena-tickets", "methods": ["GET", "HEAD"] }, "platform.vena.ticket.show": { "uri": "VenQore/vena-tickets/{ticket}", "methods": ["GET", "HEAD"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.vena.ticket.status": { "uri": "VenQore/vena-tickets/{ticket}/status", "methods": ["POST"], "parameters": ["ticket"], "bindings": { "ticket": "id" } }, "platform.webhooks": { "uri": "VenQore/webhooks", "methods": ["GET", "HEAD"] }, "platform.store.feature-flag": { "uri": "VenQore/stores/{tenant}/feature-flag", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.health.check": { "uri": "VenQore/health/check", "methods": ["GET", "HEAD"] }, "platform.health.errors": { "uri": "VenQore/health/errors", "methods": ["GET", "HEAD"] }, "platform.health.errors.resolve-all": { "uri": "VenQore/health/errors/resolve-all", "methods": ["POST"] }, "platform.health.errors.detect-fixes": { "uri": "VenQore/health/errors/detect-fixes", "methods": ["POST"] }, "platform.health.errors.resolve": { "uri": "VenQore/health/errors/{error}/resolve", "methods": ["POST"], "parameters": ["error"], "bindings": { "error": "id" } }, "platform.health.contacts": { "uri": "VenQore/health/contacts", "methods": ["GET", "HEAD"] }, "platform.health.contacts.read": { "uri": "VenQore/health/contacts/{contact}/read", "methods": ["POST"], "parameters": ["contact"], "bindings": { "contact": "id" } }, "platform.jobs.metrics": { "uri": "VenQore/jobs/metrics", "methods": ["GET", "HEAD"] }, "platform.jobs.retry": { "uri": "VenQore/jobs/failed/{id}/retry", "methods": ["POST"], "parameters": ["id"] }, "platform.jobs.delete-failed": { "uri": "VenQore/jobs/failed/{id}", "methods": ["DELETE"], "parameters": ["id"] }, "platform.jobs.flush-failed": { "uri": "VenQore/jobs/failed/flush", "methods": ["POST"] }, "platform.impersonate.start": { "uri": "VenQore/impersonate/{user}", "methods": ["POST"], "parameters": ["user"], "bindings": { "user": "id" } }, "platform.impersonate.end": { "uri": "VenQore/impersonate/end", "methods": ["POST"] }, "platform.set-passcode": { "uri": "VenQore/security/set-passcode", "methods": ["POST"] }, "platform.clear-passcode": { "uri": "VenQore/security/clear-passcode", "methods": ["POST"] }, "platform.change-password": { "uri": "VenQore/security/change-password", "methods": ["POST"] }, "platform.set-action-passcode": { "uri": "VenQore/security/set-action-passcode", "methods": ["POST"] }, "platform.clear-action-passcode": { "uri": "VenQore/security/clear-action-passcode", "methods": ["POST"] }, "platform.vensynq.toggle": { "uri": "VenQore/vensynq/toggle", "methods": ["POST"] }, "platform.settings.save": { "uri": "VenQore/settings/save", "methods": ["POST"] }, "platform.partners.store": { "uri": "VenQore/partners", "methods": ["POST"] }, "platform.partners.destroy": { "uri": "VenQore/partners/{partner}", "methods": ["DELETE"], "parameters": ["partner"] }, "platform.drawings.store": { "uri": "VenQore/drawings", "methods": ["POST"] }, "platform.drawings.clear-history": { "uri": "VenQore/drawings/clear-history", "methods": ["POST"] }, "platform.plans.index": { "uri": "VenQore/plans", "methods": ["GET", "HEAD"] }, "platform.plans.store": { "uri": "VenQore/plans", "methods": ["POST"] }, "platform.plans.bulk-update": { "uri": "VenQore/plans/bulk-update", "methods": ["PUT"] }, "platform.plans.update": { "uri": "VenQore/plans/{plan}", "methods": ["PUT"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.plans.duplicate": { "uri": "VenQore/plans/{plan}/duplicate", "methods": ["POST"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.plans.destroy": { "uri": "VenQore/plans/{plan}", "methods": ["DELETE"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.plans.archive": { "uri": "VenQore/plans/{plan}/archive", "methods": ["POST"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.plans.unarchive": { "uri": "VenQore/plans/{plan}/unarchive", "methods": ["POST"], "parameters": ["plan"], "bindings": { "plan": "id" } }, "platform.platforms.index": { "uri": "VenQore/platforms", "methods": ["GET", "HEAD"] }, "platform.platforms.store": { "uri": "VenQore/platforms", "methods": ["POST"] }, "platform.platforms.update": { "uri": "VenQore/platforms/{platform}", "methods": ["PUT"], "parameters": ["platform"], "bindings": { "platform": "id" } }, "platform.blog-posts.index": { "uri": "VenQore/blog-posts", "methods": ["GET", "HEAD"] }, "platform.blog-posts.store": { "uri": "VenQore/blog-posts", "methods": ["POST"] }, "platform.blog-posts.update": { "uri": "VenQore/blog-posts/{blogPost}", "methods": ["PUT"], "parameters": ["blogPost"], "bindings": { "blogPost": "id" } }, "platform.blog-posts.destroy": { "uri": "VenQore/blog-posts/{blogPost}", "methods": ["DELETE"], "parameters": ["blogPost"], "bindings": { "blogPost": "id" } }, "platform.coupons.index": { "uri": "VenQore/coupons", "methods": ["GET", "HEAD"] }, "platform.coupons.store": { "uri": "VenQore/coupons", "methods": ["POST"] }, "platform.coupons.update": { "uri": "VenQore/coupons/{coupon}", "methods": ["PUT"], "parameters": ["coupon"], "bindings": { "coupon": "id" } }, "platform.access-grants.index": { "uri": "VenQore/access-grants", "methods": ["GET", "HEAD"] }, "platform.access-grants.store": { "uri": "VenQore/access-grants", "methods": ["POST"] }, "platform.access-grants.revoke": { "uri": "VenQore/access-grants/{grant}/revoke", "methods": ["POST"], "parameters": ["grant"], "bindings": { "grant": "id" } }, "platform.access-grants.unrevoke": { "uri": "VenQore/access-grants/{grant}/unrevoke", "methods": ["POST"], "parameters": ["grant"], "bindings": { "grant": "id" } }, "platform.access-grants.destroy": { "uri": "VenQore/access-grants/{grant}", "methods": ["DELETE"], "parameters": ["grant"], "bindings": { "grant": "id" } }, "platform.tenants.overrides": { "uri": "VenQore/tenant-overrides", "methods": ["GET", "HEAD"] }, "platform.tenants.overrides.show": { "uri": "VenQore/tenant-overrides/{tenant}", "methods": ["GET", "HEAD"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.tenants.overrides.update": { "uri": "VenQore/tenant-overrides/{tenant}", "methods": ["PATCH"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.tenants.overrides.apply": { "uri": "VenQore/tenant-overrides/{tenant}", "methods": ["POST"], "parameters": ["tenant"], "bindings": { "tenant": "id" } }, "platform.tenants.overrides.remove": { "uri": "VenQore/tenant-overrides/{tenant}/{override}", "methods": ["DELETE"], "parameters": ["tenant", "override"], "bindings": { "tenant": "id", "override": "id" } }, "platform.pk-verifications.approve": { "uri": "VenQore/pk-verifications/{verification}/approve", "methods": ["POST"], "parameters": ["verification"] }, "platform.pk-verifications.reject": { "uri": "VenQore/pk-verifications/{verification}/reject", "methods": ["POST"], "parameters": ["verification"] }, "platform.pk-verifications.download": { "uri": "VenQore/pk-verifications/{verification}/download/{side}", "methods": ["GET", "HEAD"], "parameters": ["verification", "side"] }, "platform.admin.migration.analyze": { "uri": "VenQore/admin/migration/analyze", "methods": ["POST"] }, "platform.demo-store.status": { "uri": "VenQore/demo-store/status", "methods": ["GET", "HEAD"] }, "platform.demo-store.reset": { "uri": "VenQore/demo-store/reset", "methods": ["POST"] }, "platform.demo-store.deploy": { "uri": "VenQore/demo-store/deploy", "methods": ["POST"] }, "platform.demo-store.deploy.status": { "uri": "VenQore/demo-store/deploy/status/{jobId}", "methods": ["GET", "HEAD"], "parameters": ["jobId"] }, "platform.demo-store.deploy.cleanup": { "uri": "VenQore/demo-store/deploy/cleanup/{jobId}", "methods": ["DELETE"], "parameters": ["jobId"] }, "platform.demo-store.tests.run": { "uri": "VenQore/demo-store/tests/run", "methods": ["POST"] }, "platform.demo-store.tests.status": { "uri": "VenQore/demo-store/tests/status/{jobId}", "methods": ["GET", "HEAD"], "parameters": ["jobId"] }, "platform.demo-store.tests.cleanup": { "uri": "VenQore/demo-store/tests/cleanup/{jobId}", "methods": ["DELETE"], "parameters": ["jobId"] }, "platform.smoke-tests.run": { "uri": "VenQore/smoke-tests/run", "methods": ["POST"] }, "platform.smoke-tests.status": { "uri": "VenQore/smoke-tests/{job_id}", "methods": ["GET", "HEAD"], "parameters": ["job_id"] }, "platform.smoke-tests.cleanup": { "uri": "VenQore/smoke-tests/{job_id}", "methods": ["DELETE"], "parameters": ["job_id"] }, "welcome": { "uri": "/", "methods": ["GET", "HEAD"] }, "welcome-splash": { "uri": "welcome-splash", "methods": ["GET", "HEAD"] }, "workspace.build": { "uri": "build-workspace", "methods": ["GET", "HEAD"] }, "workspace.analyze": { "uri": "workspace/analyze", "methods": ["POST"] }, "workspace.converse.start": { "uri": "workspace/converse/start", "methods": ["POST"] }, "workspace.converse.step": { "uri": "workspace/converse/step", "methods": ["POST"] }, "workspace.converse.deepen": { "uri": "workspace/converse/deepen", "methods": ["POST"] }, "workspace.converse.reset": { "uri": "workspace/converse/reset", "methods": ["POST"] }, "workspace.prepare-google": { "uri": "workspace/prepare-google", "methods": ["POST"] }, "workspace.provision": { "uri": "workspace/provision", "methods": ["POST"] }, "workspace.demand": { "uri": "workspace/demand-log", "methods": ["POST"] }, "gift.show": { "uri": "gift/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "what-is-included": { "uri": "what-is-included", "methods": ["GET", "HEAD"] }, "health": { "uri": "health", "methods": ["GET", "HEAD"] }, "installer.index": { "uri": "installer", "methods": ["GET", "HEAD"] }, "csrf.refresh": { "uri": "refresh-csrf", "methods": ["GET", "HEAD"] }, "updater.index": { "uri": "updater", "methods": ["GET", "HEAD"] }, "dashboard": { "uri": "dashboard", "methods": ["GET", "HEAD"] }, "api.report-error": { "uri": "api/report-error", "methods": ["POST"] }, "store.inventory.search": { "uri": "s/{store_slug}/inventory/search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.customers.search": { "uri": "s/{store_slug}/customers-search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.categories": { "uri": "s/{store_slug}/api/pos/categories", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.parked": { "uri": "s/{store_slug}/sales/parked", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.recall": { "uri": "s/{store_slug}/sales/parked/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.sales.parked.delete": { "uri": "s/{store_slug}/sales/parked/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.sales.park": { "uri": "s/{store_slug}/sales/park", "methods": ["POST"], "parameters": ["store_slug"] }, "store.new-dashboard": { "uri": "s/{store_slug}/new-dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.new-dashboard.legacy": { "uri": "s/{store_slug}/new-dashbaord", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.dashboard": { "uri": "s/{store_slug}/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.onboarding.step.legacy": { "uri": "s/{store_slug}/onboarding/step", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.onboarding.step": { "uri": "s/{store_slug}/onboarding/step", "methods": ["POST"], "parameters": ["store_slug"] }, "store.onboarding.v2": { "uri": "s/{store_slug}/onboarding/v2", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.onboarding.v2.ai-discovery": { "uri": "s/{store_slug}/onboarding/v2/ai-discovery", "methods": ["POST"], "parameters": ["store_slug"] }, "store.onboarding.v2.apply-preset": { "uri": "s/{store_slug}/onboarding/v2/apply-preset", "methods": ["POST"], "parameters": ["store_slug"] }, "store.onboarding.v2.complete": { "uri": "s/{store_slug}/onboarding/v2/complete", "methods": ["POST"], "parameters": ["store_slug"] }, "store.builder": { "uri": "s/{store_slug}/builder", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.builder.preview": { "uri": "s/{store_slug}/builder/preview", "methods": ["POST"], "parameters": ["store_slug"] }, "store.builder.data-at-stake": { "uri": "s/{store_slug}/builder/data-at-stake/{module}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "module"] }, "store.builder.apply": { "uri": "s/{store_slug}/builder/apply", "methods": ["POST"], "parameters": ["store_slug"] }, "store.builder.modify": { "uri": "s/{store_slug}/builder/modify", "methods": ["POST"], "parameters": ["store_slug"] }, "store.home": { "uri": "s/{store_slug}/home", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.dashboard-v1": { "uri": "s/{store_slug}/dashboard-v1", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.overview": { "uri": "s/{store_slug}/overview", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.workspace": { "uri": "s/{store_slug}/workspace", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.next-dashboard": { "uri": "s/{store_slug}/next-dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.workspace.layout.save": { "uri": "s/{store_slug}/workspace/layout", "methods": ["POST"], "parameters": ["store_slug"] }, "store.workspace.layout.reset": { "uri": "s/{store_slug}/workspace/layout/reset", "methods": ["POST"], "parameters": ["store_slug"] }, "store.workspace.data": { "uri": "s/{store_slug}/workspace/data", "methods": ["POST"], "parameters": ["store_slug"] }, "store.appearance": { "uri": "s/{store_slug}/appearance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.appearance.update": { "uri": "s/{store_slug}/appearance", "methods": ["POST"], "parameters": ["store_slug"] }, "store.appearance.experience": { "uri": "s/{store_slug}/appearance/experience", "methods": ["POST"], "parameters": ["store_slug"] }, "store.appearance.store-default": { "uri": "s/{store_slug}/appearance/store-default", "methods": ["POST"], "parameters": ["store_slug"] }, "store.pos": { "uri": "s/{store_slug}/pos", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.tables.index": { "uri": "s/{store_slug}/tables", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.tables.state": { "uri": "s/{store_slug}/tables/state", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.tables.open": { "uri": "s/{store_slug}/tables/open", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.order": { "uri": "s/{store_slug}/tables/order", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.send": { "uri": "s/{store_slug}/tables/send", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.transfer": { "uri": "s/{store_slug}/tables/transfer", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.merge": { "uri": "s/{store_slug}/tables/merge", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.close": { "uri": "s/{store_slug}/tables/close", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.status": { "uri": "s/{store_slug}/tables/status", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.split": { "uri": "s/{store_slug}/tables/split", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.split.cancel": { "uri": "s/{store_slug}/tables/split/cancel", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.settled": { "uri": "s/{store_slug}/tables/settled", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.service-mode": { "uri": "s/{store_slug}/tables/service-mode", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.service-charge": { "uri": "s/{store_slug}/tables/service-charge", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.lane.open": { "uri": "s/{store_slug}/tables/lane/open", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.check": { "uri": "s/{store_slug}/tables/check", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.plan": { "uri": "s/{store_slug}/tables/plan", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.tables.plan.zone.add": { "uri": "s/{store_slug}/tables/plan/zone/add", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.plan.zone.rename": { "uri": "s/{store_slug}/tables/plan/zone/rename", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.plan.zone.remove": { "uri": "s/{store_slug}/tables/plan/zone/remove", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.plan.tables.bulk": { "uri": "s/{store_slug}/tables/plan/tables/bulk", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.plan.table.add": { "uri": "s/{store_slug}/tables/plan/table", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.plan.table.update": { "uri": "s/{store_slug}/tables/plan/table/update", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.plan.table.remove": { "uri": "s/{store_slug}/tables/plan/table/remove", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.plan.reorder": { "uri": "s/{store_slug}/tables/plan/reorder", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tables.plan.lanes": { "uri": "s/{store_slug}/tables/plan/lanes", "methods": ["POST"], "parameters": ["store_slug"] }, "store.new-pos": { "uri": "s/{store_slug}/new-pos", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.new-invoice": { "uri": "s/{store_slug}/new-invoice", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.inventory.dashboard": { "uri": "s/{store_slug}/inventory", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.inventory.index": { "uri": "s/{store_slug}/inventory/list", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.inventory.stats": { "uri": "s/{store_slug}/inventory/{id}/stats", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.inventory.store": { "uri": "s/{store_slug}/inventory", "methods": ["POST"], "parameters": ["store_slug"] }, "store.inventory.bulk-destroy": { "uri": "s/{store_slug}/inventory/bulk-destroy", "methods": ["POST"], "parameters": ["store_slug"] }, "store.inventory.check-dependencies": { "uri": "s/{store_slug}/inventory/check-dependencies", "methods": ["POST"], "parameters": ["store_slug"] }, "store.inventory.reservations": { "uri": "s/{store_slug}/inventory/{id}/reservations", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.inventory.history": { "uri": "s/{store_slug}/inventory/{id}/history", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.production.store": { "uri": "s/{store_slug}/inventory/production", "methods": ["POST"], "parameters": ["store_slug"] }, "store.inventory.update": { "uri": "s/{store_slug}/inventory/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.inventory.destroy": { "uri": "s/{store_slug}/inventory/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.stock-operations": { "uri": "s/{store_slug}/stock-operations", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-operations.transfer": { "uri": "s/{store_slug}/stock-operations/transfer", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-operations.adjust": { "uri": "s/{store_slug}/stock-operations/adjust", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-operations.audit": { "uri": "s/{store_slug}/stock-operations/audit", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-operations.warehouse.store": { "uri": "s/{store_slug}/stock-operations/warehouse", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-operations.warehouse.update": { "uri": "s/{store_slug}/stock-operations/warehouse/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.activity-log.index": { "uri": "s/{store_slug}/activity-log", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.users": { "uri": "s/{store_slug}/api/sync/users", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.products": { "uri": "s/{store_slug}/api/sync/products", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.customers": { "uri": "s/{store_slug}/api/sync/customers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.suppliers": { "uri": "s/{store_slug}/api/sync/suppliers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.inventory": { "uri": "s/{store_slug}/api/sync/inventory", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.taxes": { "uri": "s/{store_slug}/api/sync/taxes", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sync.orders.batch": { "uri": "s/{store_slug}/api/sync/orders/batch", "methods": ["POST"], "parameters": ["store_slug"] }, "store.api.heartbeat": { "uri": "s/{store_slug}/api/heartbeat", "methods": ["POST"], "parameters": ["store_slug"] }, "store.api.check-connection": { "uri": "s/{store_slug}/api/check-connection", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.suppliers.index": { "uri": "s/{store_slug}/suppliers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.suppliers.store": { "uri": "s/{store_slug}/suppliers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.suppliers.update": { "uri": "s/{store_slug}/suppliers/{supplier}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "supplier"], "bindings": { "supplier": "id" } }, "store.suppliers.destroy": { "uri": "s/{store_slug}/suppliers/{supplier}", "methods": ["DELETE"], "parameters": ["store_slug", "supplier"], "bindings": { "supplier": "id" } }, "store.purchase-orders.create": { "uri": "s/{store_slug}/purchase-orders/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.purchase-orders.store": { "uri": "s/{store_slug}/purchase-orders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.purchase-orders.index": { "uri": "s/{store_slug}/purchase-orders", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.purchase-orders.show": { "uri": "s/{store_slug}/purchase-orders/{purchase_order}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase_order"] }, "store.purchase-orders.edit": { "uri": "s/{store_slug}/purchase-orders/{purchase_order}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase_order"] }, "store.purchase-orders.update": { "uri": "s/{store_slug}/purchase-orders/{purchase_order}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "purchase_order"] }, "store.purchase-orders.destroy": { "uri": "s/{store_slug}/purchase-orders/{purchase_order}", "methods": ["DELETE"], "parameters": ["store_slug", "purchase_order"] }, "store.purchase-orders.receive": { "uri": "s/{store_slug}/purchase-orders/{purchaseOrder}/receive", "methods": ["POST"], "parameters": ["store_slug", "purchaseOrder"], "bindings": { "purchaseOrder": "id" } }, "store.purchase-orders.print": { "uri": "s/{store_slug}/purchase-orders/{purchaseOrder}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchaseOrder"], "bindings": { "purchaseOrder": "id" } }, "store.proposals.index": { "uri": "s/{store_slug}/proposals", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.proposals.create": { "uri": "s/{store_slug}/proposals/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.proposals.store": { "uri": "s/{store_slug}/proposals", "methods": ["POST"], "parameters": ["store_slug"] }, "store.proposals.show": { "uri": "s/{store_slug}/proposals/{proposal}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.edit": { "uri": "s/{store_slug}/proposals/{proposal}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.update": { "uri": "s/{store_slug}/proposals/{proposal}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "proposal"] }, "store.proposals.destroy": { "uri": "s/{store_slug}/proposals/{proposal}", "methods": ["DELETE"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.convert": { "uri": "s/{store_slug}/proposals/{proposal}/convert", "methods": ["POST"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.convert-to-sale": { "uri": "s/{store_slug}/proposals/{proposal}/convert-to-sale", "methods": ["POST"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.convert-to-presale": { "uri": "s/{store_slug}/proposals/{proposal}/convert-to-presale", "methods": ["POST"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.proposals.print": { "uri": "s/{store_slug}/proposals/{proposal}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "proposal"], "bindings": { "proposal": "id" } }, "store.sales-orders.index": { "uri": "s/{store_slug}/sales-orders", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales-orders.create": { "uri": "s/{store_slug}/sales-orders/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales-orders.store": { "uri": "s/{store_slug}/sales-orders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales-orders.show": { "uri": "s/{store_slug}/sales-orders/{order}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.sales-orders.update": { "uri": "s/{store_slug}/sales-orders/{order}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.sales-orders.destroy": { "uri": "s/{store_slug}/sales-orders/{order}", "methods": ["DELETE"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.sales-orders.convert": { "uri": "s/{store_slug}/sales-orders/{salesOrder}/convert", "methods": ["POST"], "parameters": ["store_slug", "salesOrder"], "bindings": { "salesOrder": "id" } }, "store.sales-orders.export": { "uri": "s/{store_slug}/sales-orders/export/excel", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales-orders.print": { "uri": "s/{store_slug}/sales-orders/{salesOrder}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "salesOrder"], "bindings": { "salesOrder": "id" } }, "store.sales-orders.cancel": { "uri": "s/{store_slug}/sales-orders/{salesOrder}/cancel", "methods": ["POST"], "parameters": ["store_slug", "salesOrder"], "bindings": { "salesOrder": "id" } }, "store.service-jobs.index": { "uri": "s/{store_slug}/service-jobs", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.services.catalogue": { "uri": "s/{store_slug}/services/catalogue", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.service-jobs.calendar": { "uri": "s/{store_slug}/service-jobs/calendar", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.service-jobs.create": { "uri": "s/{store_slug}/service-jobs/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.service-jobs.store": { "uri": "s/{store_slug}/service-jobs", "methods": ["POST"], "parameters": ["store_slug"] }, "store.service-jobs.quick-book": { "uri": "s/{store_slug}/service-jobs/quick-book", "methods": ["POST"], "parameters": ["store_slug"] }, "store.service-jobs.show": { "uri": "s/{store_slug}/service-jobs/{serviceJob}", "methods": ["GET", "HEAD"], "wheres": { "serviceJob": "[0-9]+" }, "parameters": ["store_slug", "serviceJob"] }, "store.service-jobs.status": { "uri": "s/{store_slug}/service-jobs/{serviceJob}/status", "methods": ["POST"], "wheres": { "serviceJob": "[0-9]+" }, "parameters": ["store_slug", "serviceJob"] }, "store.service-jobs.assign": { "uri": "s/{store_slug}/service-jobs/{serviceJob}/assign", "methods": ["POST"], "wheres": { "serviceJob": "[0-9]+" }, "parameters": ["store_slug", "serviceJob"] }, "store.service-jobs.unassign": { "uri": "s/{store_slug}/service-jobs/{serviceJob}/assign/{employeeId}", "methods": ["DELETE"], "wheres": { "serviceJob": "[0-9]+" }, "parameters": ["store_slug", "serviceJob", "employeeId"] }, "store.service-jobs.update-schedule": { "uri": "s/{store_slug}/service-jobs/{serviceJob}/schedule", "methods": ["POST"], "wheres": { "serviceJob": "[0-9]+" }, "parameters": ["store_slug", "serviceJob"] }, "store.service-jobs.checkout-tool": { "uri": "s/{store_slug}/service-jobs/{serviceJob}/checkout-tool", "methods": ["POST"], "wheres": { "serviceJob": "[0-9]+" }, "parameters": ["store_slug", "serviceJob"] }, "store.service-jobs.return-tool": { "uri": "s/{store_slug}/service-jobs/{serviceJob}/return-tool/{toolId}", "methods": ["POST"], "wheres": { "serviceJob": "[0-9]+" }, "parameters": ["store_slug", "serviceJob", "toolId"] }, "store.service-jobs.convert-invoice": { "uri": "s/{store_slug}/service-jobs/{serviceJob}/convert-invoice", "methods": ["POST"], "wheres": { "serviceJob": "[0-9]+" }, "parameters": ["store_slug", "serviceJob"] }, "store.tools.index": { "uri": "s/{store_slug}/tools", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.tools.store": { "uri": "s/{store_slug}/tools", "methods": ["POST"], "parameters": ["store_slug"] }, "store.tools.update": { "uri": "s/{store_slug}/tools/{tool}", "methods": ["PUT"], "parameters": ["store_slug", "tool"], "bindings": { "tool": "id" } }, "store.tools.maintenance": { "uri": "s/{store_slug}/tools/{tool}/maintenance", "methods": ["POST"], "parameters": ["store_slug", "tool"], "bindings": { "tool": "id" } }, "store.tools.checkout": { "uri": "s/{store_slug}/tools/{tool}/checkout", "methods": ["POST"], "parameters": ["store_slug", "tool"], "bindings": { "tool": "id" } }, "store.tools.checkin": { "uri": "s/{store_slug}/tools/{tool}/checkin", "methods": ["POST"], "parameters": ["store_slug", "tool"], "bindings": { "tool": "id" } }, "store.tools.destroy": { "uri": "s/{store_slug}/tools/{tool}", "methods": ["DELETE"], "parameters": ["store_slug", "tool"], "bindings": { "tool": "id" } }, "store.labels.index": { "uri": "s/{store_slug}/labels", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.labels.print": { "uri": "s/{store_slug}/labels/print", "methods": ["POST"], "parameters": ["store_slug"] }, "store.reports.index": { "uri": "s/{store_slug}/reports", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.dashboard": { "uri": "s/{store_slug}/reports/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.daily-sales": { "uri": "s/{store_slug}/reports/daily-sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sales": { "uri": "s/{store_slug}/reports/sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.purchases": { "uri": "s/{store_slug}/reports/purchases", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.purchase-returns": { "uri": "s/{store_slug}/reports/purchase-returns", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.day-book": { "uri": "s/{store_slug}/reports/day-book", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.profit-loss": { "uri": "s/{store_slug}/reports/profit-loss", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.party-statement": { "uri": "s/{store_slug}/reports/party-statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.transactions": { "uri": "s/{store_slug}/reports/transactions", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.expenses": { "uri": "s/{store_slug}/reports/expenses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.account-ledger": { "uri": "s/{store_slug}/reports/account-ledger", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.tax": { "uri": "s/{store_slug}/reports/tax", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.bank-statement": { "uri": "s/{store_slug}/reports/bank-statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.stock-valuation": { "uri": "s/{store_slug}/reports/stock-valuation", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.low-stock": { "uri": "s/{store_slug}/reports/low-stock", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.movement-history": { "uri": "s/{store_slug}/reports/movement-history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.expiry": { "uri": "s/{store_slug}/reports/expiry", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.balance-sheet": { "uri": "s/{store_slug}/reports/balance-sheet", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.all-parties": { "uri": "s/{store_slug}/reports/all-parties", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.trial-balance": { "uri": "s/{store_slug}/reports/trial-balance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-wise-profit": { "uri": "s/{store_slug}/reports/item-wise-profit", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.party-wise-profit-loss": { "uri": "s/{store_slug}/reports/party-wise-profit-loss", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.discount": { "uri": "s/{store_slug}/reports/discount", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.cash-flow": { "uri": "s/{store_slug}/reports/cash-flow", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-aging": { "uri": "s/{store_slug}/reports/sale-aging", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-orders": { "uri": "s/{store_slug}/reports/sale-orders", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.bill-wise-profit": { "uri": "s/{store_slug}/reports/bill-wise-profit", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.expense-by-category": { "uri": "s/{store_slug}/reports/expense-by-category", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.expense-by-item": { "uri": "s/{store_slug}/reports/expense-by-item", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.stock-summary-by-category": { "uri": "s/{store_slug}/reports/stock-summary-by-category", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-detail": { "uri": "s/{store_slug}/reports/item-detail", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.loan-statement": { "uri": "s/{store_slug}/reports/loan-statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.tax-rate": { "uri": "s/{store_slug}/reports/tax-rate", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-purchase-by-party": { "uri": "s/{store_slug}/reports/sale-purchase-by-party", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-report-by-party": { "uri": "s/{store_slug}/reports/item-report-by-party", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.party-report-by-item": { "uri": "s/{store_slug}/reports/party-report-by-item", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-purchase-by-item-category": { "uri": "s/{store_slug}/reports/sale-purchase-by-item-category", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-category-wise-profit-loss": { "uri": "s/{store_slug}/reports/item-category-wise-profit-loss", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.item-wise-discount": { "uri": "s/{store_slug}/reports/item-wise-discount", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-order-items": { "uri": "s/{store_slug}/reports/sale-order-items", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.stock-aging": { "uri": "s/{store_slug}/reports/stock-aging", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.sale-purchase-by-party-group": { "uri": "s/{store_slug}/reports/sale-purchase-by-party-group", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.analytics": { "uri": "s/{store_slug}/reports/analytics", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.refund-reasons": { "uri": "s/{store_slug}/reports/refund-reasons", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.point-in-time-inventory": { "uri": "s/{store_slug}/reports/point-in-time-inventory", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.point-in-time-inventory.details": { "uri": "s/{store_slug}/reports/point-in-time-inventory/details", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.customer-insights": { "uri": "s/{store_slug}/reports/customer-insights", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.customer-insights.details": { "uri": "s/{store_slug}/reports/customer-insights/details", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.supplier-insights": { "uri": "s/{store_slug}/reports/supplier-insights", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.supplier-insights.details": { "uri": "s/{store_slug}/reports/supplier-insights/details", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.aged-receivables": { "uri": "s/{store_slug}/reports/aged-receivables", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.aged-payables": { "uri": "s/{store_slug}/reports/aged-payables", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.inventory-valuation": { "uri": "s/{store_slug}/reports/inventory-valuation", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.cogs": { "uri": "s/{store_slug}/reports/cogs", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.gross-profit": { "uri": "s/{store_slug}/reports/gross-profit", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.party-ledger": { "uri": "s/{store_slug}/reports/party-ledger/{partyId}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "partyId"] }, "store.reports.inventory-movement": { "uri": "s/{store_slug}/reports/inventory-movement", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.export": { "uri": "s/{store_slug}/reports/export", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse": { "uri": "s/{store_slug}/reports/owner-daily-pulse", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse.verify": { "uri": "s/{store_slug}/reports/owner-daily-pulse/verify", "methods": ["POST"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse.setup": { "uri": "s/{store_slug}/reports/owner-daily-pulse/setup", "methods": ["POST"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse.lock": { "uri": "s/{store_slug}/reports/owner-daily-pulse/lock", "methods": ["POST"], "parameters": ["store_slug"] }, "store.reports.owner-daily-pulse.note": { "uri": "s/{store_slug}/reports/owner-daily-pulse/note", "methods": ["POST"], "parameters": ["store_slug"] }, "store.cookbook.index": { "uri": "s/{store_slug}/cookbook", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.cookbook.create": { "uri": "s/{store_slug}/cookbook/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.cookbook.store": { "uri": "s/{store_slug}/cookbook", "methods": ["POST"], "parameters": ["store_slug"] }, "store.cookbook.edit": { "uri": "s/{store_slug}/cookbook/{id}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.cookbook.update": { "uri": "s/{store_slug}/cookbook/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.cookbook.destroy": { "uri": "s/{store_slug}/cookbook/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.cookbook.simulate": { "uri": "s/{store_slug}/cookbook/simulate", "methods": ["POST"], "parameters": ["store_slug"] }, "store.growth-engine.index": { "uri": "s/{store_slug}/growth-engine", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.growth-engine.refresh": { "uri": "s/{store_slug}/growth-engine/refresh", "methods": ["POST"], "parameters": ["store_slug"] }, "store.growth-engine.dashboard": { "uri": "s/{store_slug}/growth-engine/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.growth-engine.whatsapp": { "uri": "s/{store_slug}/growth-engine/whatsapp/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.growth-engine.dismiss": { "uri": "s/{store_slug}/growth-engine/dismiss/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.growth-engine.mark-read": { "uri": "s/{store_slug}/growth-engine/mark-read/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.growth-engine.show": { "uri": "s/{store_slug}/growth-engine/signal/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.growth-engine.act": { "uri": "s/{store_slug}/growth-engine/act/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.growth-engine.snooze": { "uri": "s/{store_slug}/growth-engine/snooze/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.growth-engine.scorecard": { "uri": "s/{store_slug}/growth-engine/scorecard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.growth-engine.unmute": { "uri": "s/{store_slug}/growth-engine/unmute", "methods": ["POST"], "parameters": ["store_slug"] }, "store.growth-engine.settings": { "uri": "s/{store_slug}/growth-engine/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.growth-engine.update-settings": { "uri": "s/{store_slug}/growth-engine/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.global.search": { "uri": "s/{store_slug}/global-search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.ai.query": { "uri": "s/{store_slug}/ai/query", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.ai.test": { "uri": "s/{store_slug}/ai/test-connection", "methods": ["POST"], "parameters": ["store_slug"] }, "store.ai.recommendations": { "uri": "s/{store_slug}/ai/recommendations", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.ai.smart-reorder": { "uri": "s/{store_slug}/ai/smart-reorder", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.ai.cash-flow-forecast": { "uri": "s/{store_slug}/ai/cash-flow-forecast", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.products.variants.index": { "uri": "s/{store_slug}/products/{product}/variants", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "product"], "bindings": { "product": "id" } }, "store.products.variants.store": { "uri": "s/{store_slug}/products/{product}/variants", "methods": ["POST"], "parameters": ["store_slug", "product"], "bindings": { "product": "id" } }, "store.variants.update": { "uri": "s/{store_slug}/variants/{variant}", "methods": ["PUT"], "parameters": ["store_slug", "variant"], "bindings": { "variant": "id" } }, "store.variants.destroy": { "uri": "s/{store_slug}/variants/{variant}", "methods": ["DELETE"], "parameters": ["store_slug", "variant"], "bindings": { "variant": "id" } }, "store.attributes.index": { "uri": "s/{store_slug}/attributes", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.attributes.store": { "uri": "s/{store_slug}/attributes", "methods": ["POST"], "parameters": ["store_slug"] }, "store.attributes.update": { "uri": "s/{store_slug}/attributes/{attribute}", "methods": ["PUT"], "parameters": ["store_slug", "attribute"], "bindings": { "attribute": "id" } }, "store.attributes.destroy": { "uri": "s/{store_slug}/attributes/{attribute}", "methods": ["DELETE"], "parameters": ["store_slug", "attribute"], "bindings": { "attribute": "id" } }, "store.categories.index": { "uri": "s/{store_slug}/inventory/categories", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.categories.store": { "uri": "s/{store_slug}/categories", "methods": ["POST"], "parameters": ["store_slug"] }, "store.categories.update": { "uri": "s/{store_slug}/categories/{category}", "methods": ["PUT"], "parameters": ["store_slug", "category"] }, "store.categories.destroy": { "uri": "s/{store_slug}/categories/{category}", "methods": ["DELETE"], "parameters": ["store_slug", "category"] }, "store.inventory.stock-levels": { "uri": "s/{store_slug}/inventory/stock-levels", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.bank-accounts.index": { "uri": "s/{store_slug}/bank-accounts", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.bank-accounts.store": { "uri": "s/{store_slug}/bank-accounts", "methods": ["POST"], "parameters": ["store_slug"] }, "store.bank-accounts.update": { "uri": "s/{store_slug}/bank-accounts/{bankAccount}", "methods": ["PUT"], "parameters": ["store_slug", "bankAccount"] }, "store.bank-accounts.destroy": { "uri": "s/{store_slug}/bank-accounts/{bankAccount}", "methods": ["DELETE"], "parameters": ["store_slug", "bankAccount"] }, "store.bank-accounts.transactions": { "uri": "s/{store_slug}/bank-accounts/{bankAccount}/transactions", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "bankAccount"] }, "store.parties.index": { "uri": "s/{store_slug}/parties", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.parties.store": { "uri": "s/{store_slug}/parties", "methods": ["POST"], "parameters": ["store_slug"] }, "store.parties.update": { "uri": "s/{store_slug}/parties/{party}", "methods": ["PUT"], "parameters": ["store_slug", "party"] }, "store.parties.destroy": { "uri": "s/{store_slug}/parties/{party}", "methods": ["DELETE"], "parameters": ["store_slug", "party"] }, "store.parties.bulk-destroy": { "uri": "s/{store_slug}/parties", "methods": ["DELETE"], "parameters": ["store_slug"] }, "store.parties.ledgers": { "uri": "s/{store_slug}/parties/ledgers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.parties.ledger": { "uri": "s/{store_slug}/parties/{party}/ledger", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "party"] }, "store.parties.show": { "uri": "s/{store_slug}/parties/{party}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "party"] }, "store.expenses.index": { "uri": "s/{store_slug}/expenses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.expenses.create": { "uri": "s/{store_slug}/expenses/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.expenses.store": { "uri": "s/{store_slug}/expenses", "methods": ["POST"], "parameters": ["store_slug"] }, "store.expenses.category.store": { "uri": "s/{store_slug}/expenses/category", "methods": ["POST"], "parameters": ["store_slug"] }, "store.expenses.update": { "uri": "s/{store_slug}/expenses/{expense}", "methods": ["PUT"], "parameters": ["store_slug", "expense"] }, "store.expenses.destroy": { "uri": "s/{store_slug}/expenses/{expense}", "methods": ["DELETE"], "parameters": ["store_slug", "expense"] }, "store.vensynq.index": { "uri": "s/{store_slug}/vensynq", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.vensynq.channels.store": { "uri": "s/{store_slug}/vensynq/channels", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.channels.update": { "uri": "s/{store_slug}/vensynq/channels/{channel}", "methods": ["PATCH"], "parameters": ["store_slug", "channel"], "bindings": { "channel": "id" } }, "store.vensynq.channels.destroy": { "uri": "s/{store_slug}/vensynq/channels/{channel}", "methods": ["DELETE"], "parameters": ["store_slug", "channel"], "bindings": { "channel": "id" } }, "store.vensynq.preview": { "uri": "s/{store_slug}/vensynq/preview", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.process": { "uri": "s/{store_slug}/vensynq/process", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.sync-tracking": { "uri": "s/{store_slug}/vensynq/sync-tracking", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.jit.approve": { "uri": "s/{store_slug}/vensynq/jit-drafts/{purchase}/approve", "methods": ["PATCH"], "parameters": ["store_slug", "purchase"], "bindings": { "purchase": "id" } }, "store.vensynq.settings": { "uri": "s/{store_slug}/vensynq/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.vensynq.connect": { "uri": "s/{store_slug}/vensynq/connect/{platform}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "platform"] }, "store.vensynq.callback": { "uri": "s/{store_slug}/vensynq/callback/{platform}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "platform"] }, "store.vensynq.channels.disconnect": { "uri": "s/{store_slug}/vensynq/channels/{channel}/disconnect", "methods": ["DELETE"], "parameters": ["store_slug", "channel"], "bindings": { "channel": "id" } }, "store.vensynq.sync-orders": { "uri": "s/{store_slug}/vensynq/sync-orders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.amazon.test": { "uri": "s/{store_slug}/vensynq/amazon/test-credentials", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.amazon.store": { "uri": "s/{store_slug}/vensynq/amazon/credentials", "methods": ["POST"], "parameters": ["store_slug"] }, "store.vensynq.health": { "uri": "s/{store_slug}/vensynq/health", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.vensynq.channels.test": { "uri": "s/{store_slug}/vensynq/channels/{channel}/test", "methods": ["POST"], "parameters": ["store_slug", "channel"], "bindings": { "channel": "id" } }, "store.vensynq.channels.retry": { "uri": "s/{store_slug}/vensynq/channels/{channel}/retry", "methods": ["POST"], "parameters": ["store_slug", "channel"], "bindings": { "channel": "id" } }, "store.vensynq.money-pipeline": { "uri": "s/{store_slug}/vensynq/money-pipeline", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.vensynq.payouts": { "uri": "s/{store_slug}/vensynq/payouts", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.vensynq.payouts.confirm": { "uri": "s/{store_slug}/vensynq/payouts/{payout}/confirm", "methods": ["POST"], "parameters": ["store_slug", "payout"], "bindings": { "payout": "id" } }, "store.vensynq.clearing.toggle": { "uri": "s/{store_slug}/vensynq/clearing/toggle", "methods": ["POST"], "parameters": ["store_slug"] }, "store.products.ai-descriptions.generate": { "uri": "s/{store_slug}/products/ai-descriptions/generate", "methods": ["POST"], "parameters": ["store_slug"] }, "store.products.ai-descriptions.apply": { "uri": "s/{store_slug}/products/ai-descriptions/apply", "methods": ["POST"], "parameters": ["store_slug"] }, "store.listing-images.process": { "uri": "s/{store_slug}/listing-images/process", "methods": ["POST"], "parameters": ["store_slug"] }, "store.payments.index": { "uri": "s/{store_slug}/payments", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payments.in": { "uri": "s/{store_slug}/payments/in", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payments.out": { "uri": "s/{store_slug}/payments/out", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payments.store": { "uri": "s/{store_slug}/payments", "methods": ["POST"], "parameters": ["store_slug"] }, "store.payments.show": { "uri": "s/{store_slug}/payments/{payment}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "payment"] }, "store.purchases.index": { "uri": "s/{store_slug}/purchases", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.purchases.create": { "uri": "s/{store_slug}/purchases/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.purchases.store": { "uri": "s/{store_slug}/purchases", "methods": ["POST"], "parameters": ["store_slug"] }, "store.purchases.show": { "uri": "s/{store_slug}/purchases/{purchase}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.purchases.edit": { "uri": "s/{store_slug}/purchases/{purchase}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.purchases.update": { "uri": "s/{store_slug}/purchases/{purchase}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "purchase"] }, "store.purchases.destroy": { "uri": "s/{store_slug}/purchases/{purchase}", "methods": ["DELETE"], "parameters": ["store_slug", "purchase"] }, "store.purchases.receive": { "uri": "s/{store_slug}/purchases/{purchase}/receive", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.transactions.index": { "uri": "s/{store_slug}/transactions", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.inventory.stock": { "uri": "s/{store_slug}/inventory/stock", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pre-sales.index": { "uri": "s/{store_slug}/sales/pre-sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pre-sales.create": { "uri": "s/{store_slug}/sales/pre-sales/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pre-sales.store": { "uri": "s/{store_slug}/sales/pre-sales", "methods": ["POST"], "parameters": ["store_slug"] }, "store.pre-sales.export": { "uri": "s/{store_slug}/sales/pre-sales/export/excel", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.orders.show": { "uri": "s/{store_slug}/sales/orders/{order}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.sales.orders.update": { "uri": "s/{store_slug}/sales/orders/{order}", "methods": ["PUT"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.pre-sales.convert": { "uri": "s/{store_slug}/sales/pre-sales/{salesOrder}/convert", "methods": ["POST"], "parameters": ["store_slug", "salesOrder"], "bindings": { "salesOrder": "id" } }, "store.pre-sales.destroy": { "uri": "s/{store_slug}/sales/pre-sales/{order}", "methods": ["DELETE"], "parameters": ["store_slug", "order"], "bindings": { "order": "id" } }, "store.production.index": { "uri": "s/{store_slug}/inventory/production", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.production.create": { "uri": "s/{store_slug}/inventory/production/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.production.boms": { "uri": "s/{store_slug}/inventory/production/boms", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.production.show": { "uri": "s/{store_slug}/inventory/production/{run}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "run"] }, "store.production.complete": { "uri": "s/{store_slug}/inventory/production/{run}/complete", "methods": ["POST"], "parameters": ["store_slug", "run"] }, "store.funds.index": { "uri": "s/{store_slug}/funds", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.funds.add": { "uri": "s/{store_slug}/funds/add", "methods": ["POST"], "parameters": ["store_slug"] }, "store.funds.remove": { "uri": "s/{store_slug}/funds/remove", "methods": ["POST"], "parameters": ["store_slug"] }, "store.funds.transfer": { "uri": "s/{store_slug}/funds/transfer", "methods": ["POST"], "parameters": ["store_slug"] }, "store.funds.adjust": { "uri": "s/{store_slug}/funds/adjust", "methods": ["POST"], "parameters": ["store_slug"] }, "store.accounting.dashboard": { "uri": "s/{store_slug}/accounting", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.accounting.index": { "uri": "s/{store_slug}/accounting/chart", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.accounting.pnl": { "uri": "s/{store_slug}/accounting/p-and-l", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.accounting.balance-sheet": { "uri": "s/{store_slug}/accounting/balance-sheet", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.accounting.accounts.api": { "uri": "s/{store_slug}/accounting/api/accounts", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.recurring-invoices.index": { "uri": "s/{store_slug}/recurring-invoices", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.recurring-invoices.create": { "uri": "s/{store_slug}/recurring-invoices/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.recurring-invoices.store": { "uri": "s/{store_slug}/recurring-invoices", "methods": ["POST"], "parameters": ["store_slug"] }, "store.recurring-invoices.edit": { "uri": "s/{store_slug}/recurring-invoices/{id}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.recurring-invoices.update": { "uri": "s/{store_slug}/recurring-invoices/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.recurring-invoices.toggle": { "uri": "s/{store_slug}/recurring-invoices/{id}/toggle", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.recurring-invoices.destroy": { "uri": "s/{store_slug}/recurring-invoices/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.stock-transfers.index": { "uri": "s/{store_slug}/stock-transfers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-transfers.create": { "uri": "s/{store_slug}/stock-transfers/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-transfers.store": { "uri": "s/{store_slug}/stock-transfers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-transfers.show": { "uri": "s/{store_slug}/stock-transfers/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.debit-notes.index": { "uri": "s/{store_slug}/debit-notes", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.debit-notes.create": { "uri": "s/{store_slug}/debit-notes/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.debit-notes.store": { "uri": "s/{store_slug}/debit-notes", "methods": ["POST"], "parameters": ["store_slug"] }, "store.debit-notes.show": { "uri": "s/{store_slug}/debit-notes/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.debit-notes.refund": { "uri": "s/{store_slug}/debit-notes/{id}/refund", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.bank-reconciliation.index": { "uri": "s/{store_slug}/bank-reconciliation", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.bank-reconciliation.import": { "uri": "s/{store_slug}/bank-reconciliation/import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.invoice-reminders.index": { "uri": "s/{store_slug}/invoice-reminders", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.invoice-reminders.create": { "uri": "s/{store_slug}/invoice-reminders/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.invoice-reminders.store": { "uri": "s/{store_slug}/invoice-reminders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.invoice-reminders.send": { "uri": "s/{store_slug}/invoice-reminders/{id}/send", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.marketing-campaigns.index": { "uri": "s/{store_slug}/marketing/campaigns", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.marketing-campaigns.create": { "uri": "s/{store_slug}/marketing/campaigns/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.marketing-campaigns.store": { "uri": "s/{store_slug}/marketing/campaigns", "methods": ["POST"], "parameters": ["store_slug"] }, "store.woocommerce.index": { "uri": "s/{store_slug}/woocommerce-sync", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.woo.plugin.download": { "uri": "s/{store_slug}/woo/connections/{connection}/download", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.index": { "uri": "s/{store_slug}/woo/connections", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.woo.connections.store": { "uri": "s/{store_slug}/woo/connections", "methods": ["POST"], "parameters": ["store_slug"] }, "store.woo.connections.setup": { "uri": "s/{store_slug}/woo/connections/{connection}/setup", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.status-json": { "uri": "s/{store_slug}/woo/connections/{connection}/status", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.settings": { "uri": "s/{store_slug}/woo/connections/{connection}/settings", "methods": ["PUT"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.destroy": { "uri": "s/{store_slug}/woo/connections/{connection}", "methods": ["DELETE"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.sync": { "uri": "s/{store_slug}/woo/connections/{connection}/sync", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.approve": { "uri": "s/{store_slug}/woo/connections/{connection}/approve", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.push": { "uri": "s/{store_slug}/woo/connections/{connection}/push", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.pull": { "uri": "s/{store_slug}/woo/connections/{connection}/pull", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.scan": { "uri": "s/{store_slug}/woo/connections/{connection}/scan", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.resolve": { "uri": "s/{store_slug}/woo/connections/{connection}/resolve", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.ignore": { "uri": "s/{store_slug}/woo/connections/{connection}/ignore", "methods": ["POST"], "parameters": ["store_slug", "connection"] }, "store.woo.connections.logs": { "uri": "s/{store_slug}/woo/connections/{connection}/logs", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "connection"] }, "store.e-invoicing.index": { "uri": "s/{store_slug}/e-invoicing", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.e-invoicing.generate": { "uri": "s/{store_slug}/e-invoicing/generate", "methods": ["POST"], "parameters": ["store_slug"] }, "store.e-invoicing.waybill": { "uri": "s/{store_slug}/e-invoicing/waybill", "methods": ["POST"], "parameters": ["store_slug"] }, "store.parked-sales.index": { "uri": "s/{store_slug}/sales/parked-items", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.parked-sales.destroy": { "uri": "s/{store_slug}/sales/parked-items/{sale}", "methods": ["DELETE"], "parameters": ["store_slug", "sale"] }, "store.purchases.receive.store": { "uri": "s/{store_slug}/purchases/{purchase}/receive", "methods": ["POST"], "parameters": ["store_slug", "purchase"] }, "store.customers.index": { "uri": "s/{store_slug}/customers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.customers.create": { "uri": "s/{store_slug}/customers/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.customers.store": { "uri": "s/{store_slug}/customers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.customers.update": { "uri": "s/{store_slug}/customers/{customer}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "customer"], "bindings": { "customer": "id" } }, "store.customers.destroy": { "uri": "s/{store_slug}/customers/{customer}", "methods": ["DELETE"], "parameters": ["store_slug", "customer"], "bindings": { "customer": "id" } }, "store.suppliers.search": { "uri": "s/{store_slug}/suppliers-search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.parties.search": { "uri": "s/{store_slug}/parties-search", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.dashboard": { "uri": "s/{store_slug}/sales", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.index": { "uri": "s/{store_slug}/sales/list", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.export": { "uri": "s/{store_slug}/sales/export", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.store": { "uri": "s/{store_slug}/sales", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.approvers": { "uri": "s/{store_slug}/sales/approvers", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.attendance.status": { "uri": "s/{store_slug}/attendance/status", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.attendance.check-in": { "uri": "s/{store_slug}/attendance/check-in", "methods": ["POST"], "parameters": ["store_slug"] }, "store.attendance.heartbeat": { "uri": "s/{store_slug}/attendance/heartbeat", "methods": ["POST"], "parameters": ["store_slug"] }, "store.attendance.check-out": { "uri": "s/{store_slug}/attendance/check-out", "methods": ["POST"], "parameters": ["store_slug"] }, "store.attendance.log-gap": { "uri": "s/{store_slug}/attendance/log-gap", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.print": { "uri": "s/{store_slug}/sales/{sale}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "sale"] }, "store.sales.lookup": { "uri": "s/{store_slug}/sales/lookup", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.bulk-destroy": { "uri": "s/{store_slug}/sales/bulk-destroy", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.show": { "uri": "s/{store_slug}/sales/{sale}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "sale"] }, "store.sales.edit": { "uri": "s/{store_slug}/sales/{sale}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "sale"], "bindings": { "sale": "id" } }, "store.sales.update": { "uri": "s/{store_slug}/sales/{sale}", "methods": ["PUT"], "parameters": ["store_slug", "sale"], "bindings": { "sale": "id" } }, "store.sales.cancel": { "uri": "s/{store_slug}/sales/{sale}/cancel", "methods": ["POST"], "parameters": ["store_slug", "sale"], "bindings": { "sale": "id" } }, "store.pos.return.store": { "uri": "s/{store_slug}/pos/return", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.return": { "uri": "s/{store_slug}/sales/{sale}/return", "methods": ["POST"], "parameters": ["store_slug", "sale"] }, "store.sales.destroy": { "uri": "s/{store_slug}/sales/{sale}", "methods": ["DELETE"], "parameters": ["store_slug", "sale"], "bindings": { "sale": "id" } }, "store.sales.invoice.create": { "uri": "s/{store_slug}/sales/invoice/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.sales.master": { "uri": "s/{store_slug}/sales/master", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.presales.create": { "uri": "s/{store_slug}/sales/presale/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.manufacturing.rules": { "uri": "s/{store_slug}/manufacturing/rules", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.manufacturing-rules.index": { "uri": "s/{store_slug}/api/manufacturing-rules", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.manufacturing-rules.store": { "uri": "s/{store_slug}/api/manufacturing-rules", "methods": ["POST"], "parameters": ["store_slug"] }, "store.api.manufacturing-rules.update": { "uri": "s/{store_slug}/api/manufacturing-rules/{id}", "methods": ["PATCH"], "parameters": ["store_slug", "id"] }, "store.api.manufacturing-rules.destroy": { "uri": "s/{store_slug}/api/manufacturing-rules/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.api.manufacturing-rules.simulate": { "uri": "s/{store_slug}/api/manufacturing-rules/{id}/simulate", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.api.categories.general": { "uri": "s/{store_slug}/api/categories", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.warehouses": { "uri": "s/{store_slug}/api/warehouses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.finance": { "uri": "s/{store_slug}/finance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.finance.receivables": { "uri": "s/{store_slug}/finance/receivables", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.finance.payables": { "uri": "s/{store_slug}/finance/payables", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.funds.history.ledger": { "uri": "s/{store_slug}/funds/cash-history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.funds.cash-history": { "uri": "s/{store_slug}/funds/api/history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.custom-charges": { "uri": "s/{store_slug}/api/custom-charges", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.bank-accounts": { "uri": "s/{store_slug}/api/bank-accounts", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.party-balance": { "uri": "s/{store_slug}/api/parties/{party}/balance", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "party"] }, "store.api.purchases.for-party": { "uri": "s/{store_slug}/api/parties/{party}/purchases", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "party"] }, "store.api.sales.returnable": { "uri": "s/{store_slug}/api/sales/returnable", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.api.sales.returnable.show": { "uri": "s/{store_slug}/api/sales/{sale}/returnable", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "sale"] }, "store.settings.charges.store": { "uri": "s/{store_slug}/settings/charges", "methods": ["POST"], "parameters": ["store_slug"] }, "store.settings.charges.update": { "uri": "s/{store_slug}/settings/charges/{charge}", "methods": ["PUT"], "parameters": ["store_slug", "charge"], "bindings": { "charge": "id" } }, "store.settings.charges.delete": { "uri": "s/{store_slug}/settings/charges/{charge}", "methods": ["DELETE"], "parameters": ["store_slug", "charge"], "bindings": { "charge": "id" } }, "store.settings.data-privacy.update": { "uri": "s/{store_slug}/settings/data-privacy", "methods": ["POST"], "parameters": ["store_slug"] }, "store.charity.stats": { "uri": "s/{store_slug}/charity/stats", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.charity.add": { "uri": "s/{store_slug}/charity/add", "methods": ["POST"], "parameters": ["store_slug"] }, "store.charity.update-default": { "uri": "s/{store_slug}/charity/update-default", "methods": ["POST"], "parameters": ["store_slug"] }, "store.sales.send-email": { "uri": "s/{store_slug}/sales/{id}/send-email", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.sales.send-whatsapp": { "uri": "s/{store_slug}/sales/{id}/send-whatsapp", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.admin.panel": { "uri": "s/{store_slug}/admin-panel", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.data": { "uri": "s/{store_slug}/admin-panel/data-management", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.data.export": { "uri": "s/{store_slug}/admin-panel/data/export", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.import": { "uri": "s/{store_slug}/admin-panel/data/import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.upload-mapping.redirect": { "uri": "s/{store_slug}/admin-panel/data/upload-mapping", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.data.upload-mapping": { "uri": "s/{store_slug}/admin-panel/data/upload-mapping", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.process-import.redirect": { "uri": "s/{store_slug}/admin-panel/data/process-import", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.data.process-import": { "uri": "s/{store_slug}/admin-panel/data/process-import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.validate-import": { "uri": "s/{store_slug}/admin-panel/data/validate-import", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.data.template": { "uri": "s/{store_slug}/admin-panel/data/template", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.backups.index": { "uri": "s/{store_slug}/admin-panel/backups", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.backups.store": { "uri": "s/{store_slug}/admin-panel/backups", "methods": ["POST"], "parameters": ["store_slug"] }, "store.backups.restore": { "uri": "s/{store_slug}/admin-panel/backups/restore", "methods": ["POST"], "parameters": ["store_slug"] }, "store.backups.import": { "uri": "s/{store_slug}/admin-panel/backups/import-data", "methods": ["POST"], "parameters": ["store_slug"] }, "store.backups.progress": { "uri": "s/{store_slug}/admin-panel/backups/progress", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.dashboard": { "uri": "s/{store_slug}/admin-panel/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.migration.index": { "uri": "s/{store_slug}/admin-panel/migration", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.migration.analyze": { "uri": "s/{store_slug}/admin-panel/migration/analyze", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.migration.execute": { "uri": "s/{store_slug}/admin-panel/migration/execute", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.users": { "uri": "s/{store_slug}/admin-panel/users", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.users.store": { "uri": "s/{store_slug}/admin-panel/users", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.users.update": { "uri": "s/{store_slug}/admin-panel/users/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.legacy.admin.users.destroy": { "uri": "s/{store_slug}/admin-panel/users/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.legacy.admin.settings": { "uri": "s/{store_slug}/admin-panel/settings", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.settings.update": { "uri": "s/{store_slug}/admin-panel/settings", "methods": ["POST"], "parameters": ["store_slug"] }, "store.legacy.admin.logs": { "uri": "s/{store_slug}/admin-panel/logs", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.database": { "uri": "s/{store_slug}/admin-panel/database", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.legacy.admin.staff": { "uri": "s/{store_slug}/admin-panel/staff", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.staff-attendance.index": { "uri": "s/{store_slug}/staff-attendance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.terminal-activities.screenshot": { "uri": "s/{store_slug}/terminal-activities/screenshot/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.staff-attendance.show": { "uri": "s/{store_slug}/staff-attendance/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.staff-attendance.approve-gap": { "uri": "s/{store_slug}/staff-attendance/approve-gap/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.staff-attendance.reject-gap": { "uri": "s/{store_slug}/staff-attendance/reject-gap/{id}", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.loyalty.info": { "uri": "s/{store_slug}/api/loyalty/{partyId}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "partyId"] }, "store.loyalty.award": { "uri": "s/{store_slug}/api/loyalty/award", "methods": ["POST"], "parameters": ["store_slug"] }, "store.loyalty.redeem": { "uri": "s/{store_slug}/api/loyalty/redeem", "methods": ["POST"], "parameters": ["store_slug"] }, "store.gift-cards.create": { "uri": "s/{store_slug}/api/gift-cards", "methods": ["POST"], "parameters": ["store_slug"] }, "store.gift-cards.check": { "uri": "s/{store_slug}/api/gift-cards/{code}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "code"] }, "store.gift-cards.use": { "uri": "s/{store_slug}/api/gift-cards/use", "methods": ["POST"], "parameters": ["store_slug"] }, "store.store-credit.add": { "uri": "s/{store_slug}/api/store-credit/add", "methods": ["POST"], "parameters": ["store_slug"] }, "store.store-credit.use": { "uri": "s/{store_slug}/api/store-credit/use", "methods": ["POST"], "parameters": ["store_slug"] }, "store.notifications.summary": { "uri": "s/{store_slug}/api/notifications/summary", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.notifications.index": { "uri": "s/{store_slug}/notifications", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.notifications.mark-all-read": { "uri": "s/{store_slug}/notifications/mark-all-read", "methods": ["POST"], "parameters": ["store_slug"] }, "store.notifications.mark-read": { "uri": "s/{store_slug}/notifications/{id}/mark-read", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.notifications.destroy": { "uri": "s/{store_slug}/notifications/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.profile.edit": { "uri": "s/{store_slug}/profile", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.profile.update": { "uri": "s/{store_slug}/profile", "methods": ["PATCH"], "parameters": ["store_slug"] }, "store.profile.destroy": { "uri": "s/{store_slug}/profile", "methods": ["DELETE"], "parameters": ["store_slug"] }, "store.profile.passcode": { "uri": "s/{store_slug}/profile/passcode", "methods": ["POST"], "parameters": ["store_slug"] }, "store.profile.security-pin": { "uri": "s/{store_slug}/profile/security-pin", "methods": ["POST"], "parameters": ["store_slug"] }, "store.profile.verify-security-pin": { "uri": "s/{store_slug}/profile/verify-security-pin", "methods": ["POST"], "parameters": ["store_slug"] }, "store.profile.verify-elevated-pin": { "uri": "s/{store_slug}/profile/verify-elevated-pin", "methods": ["POST"], "parameters": ["store_slug"] }, "store.profile.store-members": { "uri": "s/{store_slug}/profile/store-members", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.returns-history.index": { "uri": "s/{store_slug}/returns-history", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.returns.create": { "uri": "s/{store_slug}/returns/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.returns.store": { "uri": "s/{store_slug}/returns", "methods": ["POST"], "parameters": ["store_slug"] }, "store.returns-history.show": { "uri": "s/{store_slug}/returns-history/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.stock-transfers.edit": { "uri": "s/{store_slug}/stock-transfers/{id}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.stock-takes.index": { "uri": "s/{store_slug}/stock-audit", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-takes.create": { "uri": "s/{store_slug}/stock-audit/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.stock-takes.store": { "uri": "s/{store_slug}/stock-audit", "methods": ["POST"], "parameters": ["store_slug"] }, "store.stock-takes.show": { "uri": "s/{store_slug}/stock-audit/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.batches.index": { "uri": "s/{store_slug}/batches", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.batches.show": { "uri": "s/{store_slug}/batches/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.serials.index": { "uri": "s/{store_slug}/serials", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.serials.show": { "uri": "s/{store_slug}/serials/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.staff.attendance.index": { "uri": "s/{store_slug}/staff/attendance", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.staff.attendance.show": { "uri": "s/{store_slug}/staff/attendance/{id}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.staff.attendance.approve-gap": { "uri": "s/{store_slug}/staff/attendance/gap/{id}/approve", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.staff.attendance.reject-gap": { "uri": "s/{store_slug}/staff/attendance/gap/{id}/reject", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.online-store.index": { "uri": "s/{store_slug}/online-store-manager", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.online-store.update": { "uri": "s/{store_slug}/online-store-manager", "methods": ["POST"], "parameters": ["store_slug"] }, "store.system.reset": { "uri": "s/{store_slug}/api/system/reset", "methods": ["POST"], "parameters": ["store_slug"] }, "store.system.delete-entity": { "uri": "s/{store_slug}/api/system/reset/{entity}", "methods": ["POST"], "parameters": ["store_slug", "entity"] }, "store.finance.accounts": { "uri": "s/{store_slug}/finance/accounts", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.finance.journal": { "uri": "s/{store_slug}/finance/journal", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payment-in.create": { "uri": "s/{store_slug}/payments/in/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.payment-out.create": { "uri": "s/{store_slug}/payments/out/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.pre-sales.print": { "uri": "s/{store_slug}/sales/pre-sales/{order}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "order"] }, "store.debit-notes.print": { "uri": "s/{store_slug}/debit-notes/{id}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "id"] }, "store.debit-notes.update": { "uri": "s/{store_slug}/debit-notes/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.purchases.print": { "uri": "s/{store_slug}/purchases/{purchase}/print", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.sales.create": { "uri": "s/{store_slug}/sales/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.production.edit": { "uri": "s/{store_slug}/inventory/production/{run}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "run"] }, "store.reports.discount-report": { "uri": "s/{store_slug}/reports/discount-report", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "api.plan.usage": { "uri": "api/plan/usage", "methods": ["GET", "HEAD"] }, "api.reckoner.catalogue": { "uri": "api/reckoner/catalogue", "methods": ["GET", "HEAD"] }, "api.reckoner.read": { "uri": "api/reckoner/read", "methods": ["POST"] }, "api.dashboards.index": { "uri": "api/dashboards", "methods": ["GET", "HEAD"] }, "api.dashboards.store": { "uri": "api/dashboards", "methods": ["POST"] }, "api.dashboards.show": { "uri": "api/dashboards/{id}", "methods": ["GET", "HEAD"], "parameters": ["id"] }, "api.dashboards.update": { "uri": "api/dashboards/{id}", "methods": ["PUT"], "parameters": ["id"] }, "api.dashboards.destroy": { "uri": "api/dashboards/{id}", "methods": ["DELETE"], "parameters": ["id"] }, "api.dashboards.layout": { "uri": "api/dashboards/{id}/layout", "methods": ["PUT"], "parameters": ["id"] }, "api.dashboards.cards.add": { "uri": "api/dashboards/{id}/cards", "methods": ["POST"], "parameters": ["id"] }, "api.dashboards.cards.update": { "uri": "api/dashboards/{id}/cards/{cardId}", "methods": ["PATCH"], "parameters": ["id", "cardId"] }, "api.dashboards.cards.remove": { "uri": "api/dashboards/{id}/cards/{cardId}", "methods": ["DELETE"], "parameters": ["id", "cardId"] }, "api.dashboards.reset": { "uri": "api/dashboards/{id}/reset", "methods": ["POST"], "parameters": ["id"] }, "api.dashboards.publish": { "uri": "api/dashboards/{id}/publish", "methods": ["POST"], "parameters": ["id"] }, "superadmin.dashboard": { "uri": "superadmin/dashboard", "methods": ["GET", "HEAD"] }, "superadmin.tenants": { "uri": "superadmin/tenants", "methods": ["GET", "HEAD"] }, "superadmin.tenants.suspend": { "uri": "superadmin/tenants/{tenant}/suspend", "methods": ["POST"], "parameters": ["tenant"] }, "superadmin.tenants.reactivate": { "uri": "superadmin/tenants/{tenant}/reactivate", "methods": ["POST"], "parameters": ["tenant"] }, "superadmin.tenants.upgrade": { "uri": "superadmin/tenants/{tenant}/upgrade", "methods": ["POST"], "parameters": ["tenant"] }, "store.v3.products.index": { "uri": "s/{store_slug}/v3/products", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.products.create": { "uri": "s/{store_slug}/v3/products/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.products.store": { "uri": "s/{store_slug}/v3/products", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.products.edit": { "uri": "s/{store_slug}/v3/products/{product}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "product"] }, "store.v3.products.update": { "uri": "s/{store_slug}/v3/products/{product}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "product"] }, "store.v3.products.destroy": { "uri": "s/{store_slug}/v3/products/{product}", "methods": ["DELETE"], "parameters": ["store_slug", "product"] }, "store.v3.warehouses.index": { "uri": "s/{store_slug}/v3/warehouses", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.warehouses.create": { "uri": "s/{store_slug}/v3/warehouses/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.warehouses.store": { "uri": "s/{store_slug}/v3/warehouses", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.warehouses.edit": { "uri": "s/{store_slug}/v3/warehouses/{warehouse}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "warehouse"] }, "store.v3.warehouses.update": { "uri": "s/{store_slug}/v3/warehouses/{warehouse}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "warehouse"] }, "store.v3.warehouses.destroy": { "uri": "s/{store_slug}/v3/warehouses/{warehouse}", "methods": ["DELETE"], "parameters": ["store_slug", "warehouse"] }, "store.v3.purchases.receive": { "uri": "s/{store_slug}/v3/purchases/{purchase}/receive", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.v3.purchases.receive.store": { "uri": "s/{store_slug}/v3/purchases/{purchase}/receive", "methods": ["POST"], "parameters": ["store_slug", "purchase"] }, "store.v3.purchases.index": { "uri": "s/{store_slug}/v3/purchases", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.purchases.create": { "uri": "s/{store_slug}/v3/purchases/create", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.purchases.store": { "uri": "s/{store_slug}/v3/purchases", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.purchases.show": { "uri": "s/{store_slug}/v3/purchases/{purchase}", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.v3.purchases.edit": { "uri": "s/{store_slug}/v3/purchases/{purchase}/edit", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchase"] }, "store.v3.purchases.update": { "uri": "s/{store_slug}/v3/purchases/{purchase}", "methods": ["PUT", "PATCH"], "parameters": ["store_slug", "purchase"] }, "store.v3.purchases.destroy": { "uri": "s/{store_slug}/v3/purchases/{purchase}", "methods": ["DELETE"], "parameters": ["store_slug", "purchase"] }, "store.v3.purchases.return.create": { "uri": "s/{store_slug}/v3/purchases/{purchaseId}/return", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "purchaseId"] }, "store.v3.purchases.return.store": { "uri": "s/{store_slug}/v3/purchases/{purchaseId}/return", "methods": ["POST"], "parameters": ["store_slug", "purchaseId"] }, "store.v3.supplier-payments.store": { "uri": "s/{store_slug}/v3/supplier-payments", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.opening-balances.store": { "uri": "s/{store_slug}/v3/opening-balances", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.opening-balances.status": { "uri": "s/{store_slug}/v3/opening-balances/status", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "store.v3.supplier-advances.store": { "uri": "s/{store_slug}/v3/supplier-advances", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.stock-adjustments.store": { "uri": "s/{store_slug}/v3/stock-adjustments", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.stock-transfers.store": { "uri": "s/{store_slug}/v3/stock-transfers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.suppliers.statement": { "uri": "s/{store_slug}/v3/suppliers/{supplierId}/statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "supplierId"] }, "store.v3.parties.store": { "uri": "s/{store_slug}/v3/parties", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.parties.update": { "uri": "s/{store_slug}/v3/parties/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.v3.parties.destroy": { "uri": "s/{store_slug}/v3/parties/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.v3.sales.store": { "uri": "s/{store_slug}/v3/sales", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.sales.pdf": { "uri": "s/{store_slug}/v3/sales/{saleId}/pdf", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "saleId"] }, "store.v3.sales.return.store": { "uri": "s/{store_slug}/v3/sales/{saleId}/return", "methods": ["POST"], "parameters": ["store_slug", "saleId"] }, "store.v3.customer-payments.store": { "uri": "s/{store_slug}/v3/customer-payments", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.customer-payments.bounce": { "uri": "s/{store_slug}/v3/customer-payments/{journalEntryId}/bounce", "methods": ["POST"], "parameters": ["store_slug", "journalEntryId"] }, "store.v3.sales.write-off": { "uri": "s/{store_slug}/v3/sales/{saleId}/write-off", "methods": ["POST"], "parameters": ["store_slug", "saleId"] }, "store.v3.customer-advances.store": { "uri": "s/{store_slug}/v3/customer-advances", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.sales-orders.store": { "uri": "s/{store_slug}/v3/sales-orders", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.sales-orders.cancel": { "uri": "s/{store_slug}/v3/sales-orders/{id}/cancel", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.sales-orders.convert": { "uri": "s/{store_slug}/v3/sales-orders/{id}/convert", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.quotations.store": { "uri": "s/{store_slug}/v3/quotations", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.quotations.convert-to-order": { "uri": "s/{store_slug}/v3/quotations/{id}/convert-to-order", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.customers.statement": { "uri": "s/{store_slug}/v3/customers/{customerId}/statement", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "customerId"] }, "store.v3.products.uom.index": { "uri": "s/{store_slug}/v3/products/{productId}/uom", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "productId"] }, "store.v3.products.uom.store": { "uri": "s/{store_slug}/v3/products/{productId}/uom", "methods": ["POST"], "parameters": ["store_slug", "productId"] }, "store.v3.products.uom.destroy": { "uri": "s/{store_slug}/v3/products/{productId}/uom/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "productId", "id"] }, "store.v3.products.tiers.index": { "uri": "s/{store_slug}/v3/products/{productId}/tiers", "methods": ["GET", "HEAD"], "parameters": ["store_slug", "productId"] }, "store.v3.products.tiers.store": { "uri": "s/{store_slug}/v3/products/{productId}/tiers", "methods": ["POST"], "parameters": ["store_slug", "productId"] }, "store.v3.products.tiers.destroy": { "uri": "s/{store_slug}/v3/products/{productId}/tiers/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "productId", "id"] }, "store.v3.boms.store": { "uri": "s/{store_slug}/v3/boms", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.boms.update": { "uri": "s/{store_slug}/v3/boms/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.v3.boms.destroy": { "uri": "s/{store_slug}/v3/boms/{id}", "methods": ["DELETE"], "parameters": ["store_slug", "id"] }, "store.v3.production-runs.store": { "uri": "s/{store_slug}/v3/production-runs", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.production-runs.complete": { "uri": "s/{store_slug}/v3/production-runs/{id}/complete", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.production-runs.reverse": { "uri": "s/{store_slug}/v3/production-runs/{id}/reverse", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.disassembly.store": { "uri": "s/{store_slug}/v3/disassembly", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.employees.store": { "uri": "s/{store_slug}/v3/employees", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.employees.update": { "uri": "s/{store_slug}/v3/employees/{id}", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.v3.payroll.accrue": { "uri": "s/{store_slug}/v3/payroll/accrue", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.payroll.pay": { "uri": "s/{store_slug}/v3/payroll/pay", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.employee-settlements.store": { "uri": "s/{store_slug}/v3/employee-settlements", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.cash-shortages.store": { "uri": "s/{store_slug}/v3/cash-shortages", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.disaster-claims.store": { "uri": "s/{store_slug}/v3/disaster-claims", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.disaster-claims.recover": { "uri": "s/{store_slug}/v3/disaster-claims/{id}/recover", "methods": ["POST"], "parameters": ["store_slug", "id"] }, "store.v3.assets.store": { "uri": "s/{store_slug}/v3/assets", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.depreciation.store": { "uri": "s/{store_slug}/v3/depreciation", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.loans.drawdown": { "uri": "s/{store_slug}/v3/loans/drawdown", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.loans.repay": { "uri": "s/{store_slug}/v3/loans/repay", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.expenses.store": { "uri": "s/{store_slug}/v3/expenses", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.funds.store": { "uri": "s/{store_slug}/v3/funds", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.bank-transfers.store": { "uri": "s/{store_slug}/v3/bank-transfers", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.donations.store": { "uri": "s/{store_slug}/v3/donations", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.users.role.update": { "uri": "s/{store_slug}/v3/users/{id}/role", "methods": ["PUT"], "parameters": ["store_slug", "id"] }, "store.v3.settings.discount-limits": { "uri": "s/{store_slug}/v3/settings/discount-limits", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.fiscal-year.close": { "uri": "s/{store_slug}/v3/fiscal-year/close", "methods": ["POST"], "parameters": ["store_slug"] }, "store.v3.dashboard": { "uri": "s/{store_slug}/v3/dashboard", "methods": ["GET", "HEAD"], "parameters": ["store_slug"] }, "auth.google": { "uri": "auth/google", "methods": ["GET", "HEAD"] }, "otp.show": { "uri": "verify-code", "methods": ["GET", "HEAD"] }, "otp.verify": { "uri": "verify-code", "methods": ["POST"] }, "otp.resend": { "uri": "verify-code/resend", "methods": ["POST"] }, "otp.cancel": { "uri": "verify-code/cancel", "methods": ["POST"] }, "login": { "uri": "login", "methods": ["GET", "HEAD"] }, "login.passcode": { "uri": "login/passcode", "methods": ["POST"] }, "login.pin": { "uri": "login/pin", "methods": ["POST"] }, "password.request": { "uri": "forgot-password", "methods": ["GET", "HEAD"] }, "password.email": { "uri": "forgot-password", "methods": ["POST"] }, "password.reset": { "uri": "reset-password/{token}", "methods": ["GET", "HEAD"], "parameters": ["token"] }, "password.store": { "uri": "reset-password", "methods": ["POST"] }, "register": { "uri": "register", "methods": ["GET", "HEAD"] }, "verification.notice": { "uri": "verify-email", "methods": ["GET", "HEAD"] }, "verification.verify": { "uri": "verify-email/{id}/{hash}", "methods": ["GET", "HEAD"], "parameters": ["id", "hash"] }, "verification.send": { "uri": "email/verification-notification", "methods": ["POST"] }, "password.confirm": { "uri": "confirm-password", "methods": ["GET", "HEAD"] }, "password.update": { "uri": "password", "methods": ["PUT"] }, "2fa.setup": { "uri": "2fa/setup", "methods": ["GET", "HEAD"] }, "2fa.confirm": { "uri": "2fa/confirm", "methods": ["POST"] }, "2fa.recovery": { "uri": "2fa/recovery-codes", "methods": ["GET", "HEAD"] }, "2fa.verify": { "uri": "2fa/verify", "methods": ["GET", "HEAD"] }, "2fa.post-verify": { "uri": "2fa/verify", "methods": ["POST"] }, "logout": { "uri": "logout", "methods": ["POST"] }, "platform.login": { "uri": "VenQore-login", "methods": ["GET", "HEAD"] }, "platform.login.store": { "uri": "VenQore-login", "methods": ["POST"] }, "platform.login.pin": { "uri": "VenQore-login/pin", "methods": ["POST"] }, "staff.login": { "uri": "staff-login", "methods": ["GET", "HEAD"] }, "staff.login.store": { "uri": "staff-login", "methods": ["POST"] }, "error.page": { "uri": "error/{code}", "methods": ["GET", "HEAD"], "parameters": ["code"] } } };
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
      /* @__PURE__ */ Object.assign({ "./Pages/Accounting/BalanceSheet.jsx": () => import("./assets/BalanceSheet-DqwkFMZD.js"), "./Pages/Accounting/ChartOfAccounts.jsx": () => import("./assets/ChartOfAccounts-C5rfw2GU.js"), "./Pages/Accounting/Dashboard.jsx": () => import("./assets/Dashboard-gZdvQjhN.js"), "./Pages/Accounting/ProfitLoss.jsx": () => import("./assets/ProfitLoss-BLWx3Dge.js"), "./Pages/Admin/AgentInbox.jsx": () => import("./assets/AgentInbox-Qicj6OcI.js"), "./Pages/Admin/Backups.jsx": () => import("./assets/Backups-DIjZmGSl.js"), "./Pages/Admin/DataManagement.jsx": () => import("./assets/DataManagement-DKiiUy60.js"), "./Pages/Admin/DataMapping.jsx": () => import("./assets/DataMapping-BwryFJGw.js"), "./Pages/Admin/Database.jsx": () => import("./assets/Database-Bn6AkUcW.js"), "./Pages/Admin/ExecutiveDashboard.jsx": () => import("./assets/ExecutiveDashboard-P5OFqvQy.js"), "./Pages/Admin/Logs.jsx": () => import("./assets/Logs-CuP5KXim.js"), "./Pages/Admin/Migration.jsx": () => import("./assets/Migration-BrKMoeYf.js"), "./Pages/Admin/Settings.jsx": () => import("./assets/Settings-B_frXWUc.js"), "./Pages/Admin/Users.jsx": () => import("./assets/Users-BGgMrpvk.js"), "./Pages/Admin/VenaTicketDetail.jsx": () => import("./assets/VenaTicketDetail-Cg-P8CLm.js"), "./Pages/Admin/VenaTickets.jsx": () => import("./assets/VenaTickets-BzoiX1Ry.js"), "./Pages/Auth/AcceptInvite.jsx": () => import("./assets/AcceptInvite-CSBrPlAR.js"), "./Pages/Auth/ConfirmPassword.jsx": () => import("./assets/ConfirmPassword-BoMUBYZj.js"), "./Pages/Auth/ForgotPassword.jsx": () => import("./assets/ForgotPassword-CjT3-kZd.js"), "./Pages/Auth/Login.jsx": () => import("./assets/Login-Bz6FQzis.js"), "./Pages/Auth/Register.jsx": () => import("./assets/Register-CARiiCb6.js"), "./Pages/Auth/ResetPassword.jsx": () => import("./assets/ResetPassword-COUhxlcv.js"), "./Pages/Auth/StaffLogin.jsx": () => import("./assets/StaffLogin-D5-wTDoz.js"), "./Pages/Auth/TwoFactorSetup.jsx": () => import("./assets/TwoFactorSetup-DBQV1q7n.js"), "./Pages/Auth/TwoFactorVerify.jsx": () => import("./assets/TwoFactorVerify-D39XUemQ.js"), "./Pages/Auth/VerifyCode.jsx": () => import("./assets/VerifyCode-B6YInqTm.js"), "./Pages/Auth/VerifyEmail.jsx": () => import("./assets/VerifyEmail-Dn9_aqex.js"), "./Pages/BankAccounts/BankAccountsList.jsx": () => import("./assets/BankAccountsList-VjE1aJym.js"), "./Pages/BankAccounts/Transactions.jsx": () => import("./assets/Transactions-CDxkpnte.js"), "./Pages/BankReconciliation/BankReconciliation.jsx": () => import("./assets/BankReconciliation-Bgkojkyl.js"), "./Pages/BatchTracking/BatchTracking.jsx": () => import("./assets/BatchTracking--G2Ws4_B.js"), "./Pages/Billing/Index.jsx": () => import("./assets/Index-U4Y2IUow.js"), "./Pages/Builder/Index.jsx": () => import("./assets/Index-9kiDpKGa.js"), "./Pages/Cookbook/Create.jsx": () => import("./assets/Create-C9WHkWzn.js"), "./Pages/Cookbook/RecipesList.jsx": () => import("./assets/RecipesList-C75RBUYf.js"), "./Pages/Dashboards/AccountantDashboard.jsx": () => import("./assets/AccountantDashboard-DDJz4Wbf.js"), "./Pages/Dashboards/CashierDashboard.jsx": () => import("./assets/CashierDashboard-CnwOlOao.js"), "./Pages/Dashboards/PurchasingDashboard.jsx": () => import("./assets/PurchasingDashboard-ClEEph2E.js"), "./Pages/Dashboards/ViewerDashboard.jsx": () => import("./assets/ViewerDashboard-DI2csxPz.js"), "./Pages/DebitNotes/Create.jsx": () => import("./assets/Create-JkQeprVF.js"), "./Pages/DebitNotes/DebitNotes.jsx": () => import("./assets/DebitNotes-De4f1vnM.js"), "./Pages/DebitNotes/Show.jsx": () => import("./assets/Show-DxZMSWm4.js"), "./Pages/Demo/Landing.jsx": () => import("./assets/Landing-CIUvUJTe.js"), "./Pages/EInvoicing/EInvoicing.jsx": () => import("./assets/EInvoicing-Esy7XxWl.js"), "./Pages/Error.jsx": () => import("./assets/Error-DNjOlORS.js"), "./Pages/Errors/StoreSuspended.jsx": () => import("./assets/StoreSuspended-CmGLWnXn.js"), "./Pages/Errors/TrialExpired.jsx": () => import("./assets/TrialExpired-CgcBTiLr.js"), "./Pages/Expenses/Create.jsx": () => import("./assets/Create-DpfBfKQl.js"), "./Pages/Expenses/ExpensesList.jsx": () => import("./assets/ExpensesList-CNAyck9h.js"), "./Pages/Finance/FinanceDashboard.jsx": () => import("./assets/FinanceDashboard-biURkcyX.js"), "./Pages/Finance/Payables.jsx": () => import("./assets/Payables-CAF-S1Ku.js"), "./Pages/Finance/Receivables.jsx": () => import("./assets/Receivables-DRnmhaSd.js"), "./Pages/Funds/CashHistory.jsx": () => import("./assets/CashHistory-BYiEbxal.js"), "./Pages/Funds/FundManagement.jsx": () => import("./assets/FundManagement-Cl8Kgz-s.js"), "./Pages/Gift/Invalid.jsx": () => import("./assets/Invalid-pwYBxb5y.js"), "./Pages/Gift/Show.jsx": () => import("./assets/Show-BJqiNeMc.js"), "./Pages/GrowthEngine/GrowthDashboard.jsx": () => import("./assets/GrowthDashboard-Bx6vVQgr.js"), "./Pages/GrowthEngine/Settings.jsx": () => import("./assets/Settings-CxUhfIN0.js"), "./Pages/Help/Index.jsx": () => import("./assets/Index-DsebAHdB.js"), "./Pages/Help/Show.jsx": () => import("./assets/Show-D2Q4JeHK.js"), "./Pages/Home.jsx": () => import("./assets/Home-CxdaWNJ7.js"), "./Pages/Hub/Index.jsx": () => import("./assets/Index-I4ovLjAz.js"), "./Pages/Installer/Index.jsx": () => import("./assets/Index-Bikc3e9q.js"), "./Pages/Inventory/Attributes/AttributesList.jsx": () => import("./assets/AttributesList-Dv0gbQgW.js"), "./Pages/Inventory/Categories.jsx": () => import("./assets/Categories-_-wsTT9z.js"), "./Pages/Inventory/Dashboard.jsx": () => import("./assets/Dashboard-BepLn3vU.js"), "./Pages/Inventory/InventoryList.jsx": () => import("./assets/InventoryList-Bod2Ek0n.js"), "./Pages/Inventory/Production/Create.jsx": () => import("./assets/Create-DjQX21QD.js"), "./Pages/Inventory/Production/ProductionRuns.jsx": () => import("./assets/ProductionRuns-PLTpfXLQ.js"), "./Pages/Inventory/Production/Show.jsx": () => import("./assets/Show-BhTl1EkR.js"), "./Pages/Inventory/StockLevels.jsx": () => import("./assets/StockLevels-Z5ThGnCE.js"), "./Pages/Inventory/Variants/VariantsList.jsx": () => import("./assets/VariantsList-0jxTFVrj.js"), "./Pages/Invite/Accept.jsx": () => import("./assets/Accept-DxQX3lfT.js"), "./Pages/Invite/Invalid.jsx": () => import("./assets/Invalid-DAmFLJqr.js"), "./Pages/Labels/LabelPrinter.jsx": () => import("./assets/LabelPrinter-Bhh57F0N.js"), "./Pages/LandingPage.jsx": () => import("./assets/LandingPage-B3OgGiUp.js"), "./Pages/Manufacturing/Rules.jsx": () => import("./assets/Rules-DwN38lJt.js"), "./Pages/Marketing/About.jsx": () => import("./assets/About-CujfWjBK.js"), "./Pages/Marketing/Blog/Index.jsx": () => import("./assets/Index-CdNRzNMC.js"), "./Pages/Marketing/Blog/Show.jsx": () => import("./assets/Show-J6TSjam9.js"), "./Pages/Marketing/Blueprint.jsx": () => import("./assets/Blueprint-Dl8QbZMl.js"), "./Pages/Marketing/Campaigns.jsx": () => import("./assets/Campaigns-BPDMcpeQ.js"), "./Pages/Marketing/Compare/Index.jsx": () => import("./assets/Index-B6kpncJQ.js"), "./Pages/Marketing/Compare/Show.jsx": () => import("./assets/Show-D5wYnZNb.js"), "./Pages/Marketing/Contact.jsx": () => import("./assets/Contact-CB-ZKWi9.js"), "./Pages/Marketing/DashboardPreview.jsx": () => import("./assets/DashboardPreview-CuviPk_h.js"), "./Pages/Marketing/DigitalProducts.jsx": () => import("./assets/DigitalProducts-BlaAJMP9.js"), "./Pages/Marketing/Docs/Show.jsx": () => import("./assets/Show-BrsLcGn4.js"), "./Pages/Marketing/Documents.jsx": () => import("./assets/Documents-CSsVB_D2.js"), "./Pages/Marketing/Features.jsx": () => import("./assets/Features-CWX7ZLWz.js"), "./Pages/Marketing/Features/Show.jsx": () => import("./assets/Show-vEHb-kTW.js"), "./Pages/Marketing/KnownIssues.jsx": () => import("./assets/KnownIssues-3I3J8iOT.js"), "./Pages/Marketing/Ledger.jsx": () => import("./assets/Ledger-NAkVmQ7a.js"), "./Pages/Marketing/Newsletter.jsx": () => import("./assets/Newsletter-CkMSBkBM.js"), "./Pages/Marketing/NewsletterConfirm.jsx": () => import("./assets/NewsletterConfirm-_xDn_2qU.js"), "./Pages/Marketing/NewsletterUnsubscribe.jsx": () => import("./assets/NewsletterUnsubscribe-Dni7tXaL.js"), "./Pages/Marketing/Onboarding.jsx": () => import("./assets/Onboarding-cARAmwWf.js"), "./Pages/Marketing/PartnerSupport.jsx": () => import("./assets/PartnerSupport-wio4uRIA.js"), "./Pages/Marketing/Partners.jsx": () => import("./assets/Partners-DrgF7PSq.js"), "./Pages/Marketing/PosShowcase.jsx": () => import("./assets/PosShowcase-DoUC2-aw.js"), "./Pages/Marketing/Pricing.jsx": () => import("./assets/Pricing-D0Xyn1VK.js"), "./Pages/Marketing/Reckoner.jsx": () => import("./assets/Reckoner-DfJMR_Nv.js"), "./Pages/Marketing/Roadmap.jsx": () => import("./assets/Roadmap-BGDuP-O9.js"), "./Pages/Marketing/Security.jsx": () => import("./assets/Security-DFn8pjZw.js"), "./Pages/Marketing/Shared/FeatureDemos.jsx": () => import("./assets/FeatureDemos-CARWNhF9.js"), "./Pages/Marketing/Shared/MarketingLayout.jsx": () => import("./assets/MarketingLayout-cwTDSbNB.js"), "./Pages/Marketing/SmartCapture.jsx": () => import("./assets/SmartCapture-6AggLuvE.js"), "./Pages/Marketing/Solutions/Index.jsx": () => import("./assets/Index-yEZ3joXQ.js"), "./Pages/Marketing/Solutions/Show.jsx": () => import("./assets/Show-BLjf968s.js"), "./Pages/Marketing/Tools/Barcode.jsx": () => import("./assets/Barcode-CpdyFsgg.js"), "./Pages/Marketing/Tools/BarcodeLabelSheet.jsx": () => import("./assets/BarcodeLabelSheet-BAt40iV8.js"), "./Pages/Marketing/Tools/BarcodeValidator.jsx": () => import("./assets/BarcodeValidator-NYlg-ce_.js"), "./Pages/Marketing/Tools/CashDrawer.jsx": () => import("./assets/CashDrawer-BxZRxjKN.js"), "./Pages/Marketing/Tools/CashDrawerCountSheet.jsx": () => import("./assets/CashDrawerCountSheet-DMZ-H2TO.js"), "./Pages/Marketing/Tools/CreditNote.jsx": () => import("./assets/CreditNote-Y2HvgcuW.js"), "./Pages/Marketing/Tools/FoodCostCalculator.jsx": () => import("./assets/FoodCostCalculator-B8uWbixr.js"), "./Pages/Marketing/Tools/Index.jsx": () => import("./assets/Index-CnUxIpSR.js"), "./Pages/Marketing/Tools/InventoryHealth.jsx": () => import("./assets/InventoryHealth-vE8kpm3y.js"), "./Pages/Marketing/Tools/Invoice.jsx": () => import("./assets/Invoice-Dqmha5Af.js"), "./Pages/Marketing/Tools/LabelSheet.jsx": () => import("./assets/LabelSheet-DicxwEvc.js"), "./Pages/Marketing/Tools/LeadConfirm.jsx": () => import("./assets/LeadConfirm-DPQpvSDJ.js"), "./Pages/Marketing/Tools/LeadUnsubscribe.jsx": () => import("./assets/LeadUnsubscribe-oSs_S9Ib.js"), "./Pages/Marketing/Tools/MarginCalculator.jsx": () => import("./assets/MarginCalculator-DxkIREJL.js"), "./Pages/Marketing/Tools/PackingSlip.jsx": () => import("./assets/PackingSlip-BrI9kSO6.js"), "./Pages/Marketing/Tools/PaymentFeeCalculator.jsx": () => import("./assets/PaymentFeeCalculator-7LsO1d5D.js"), "./Pages/Marketing/Tools/PosRoiCalculator.jsx": () => import("./assets/PosRoiCalculator-CaI9AkLu.js"), "./Pages/Marketing/Tools/PriceTag.jsx": () => import("./assets/PriceTag-C2frwS_T.js"), "./Pages/Marketing/Tools/ProductCsvCleaner.jsx": () => import("./assets/ProductCsvCleaner-Cmm55DGX.js"), "./Pages/Marketing/Tools/PurchaseOrder.jsx": () => import("./assets/PurchaseOrder-D_SU9f__.js"), "./Pages/Marketing/Tools/QrCode.jsx": () => import("./assets/QrCode-BLVqA5df.js"), "./Pages/Marketing/Tools/QrMenu.jsx": () => import("./assets/QrMenu-CVmjEugj.js"), "./Pages/Marketing/Tools/QrMenuPublic.jsx": () => import("./assets/QrMenuPublic-DGlkSBuS.js"), "./Pages/Marketing/Tools/Quote.jsx": () => import("./assets/Quote-DtYYm2PU.js"), "./Pages/Marketing/Tools/Receipt.jsx": () => import("./assets/Receipt-BhBrU4z3.js"), "./Pages/Marketing/Tools/Shared/EditableText.jsx": () => import("./assets/EditableText-CAR9rgbH.js"), "./Pages/Marketing/Tools/Shared/EmailGate.jsx": () => import("./assets/EmailGate-BsTy97if.js"), "./Pages/Marketing/Tools/Shared/HousePromo.jsx": () => import("./assets/HousePromo-DidRidkH.js"), "./Pages/Marketing/Tools/Shared/Select.jsx": () => import("./assets/Select-BvHKwZfu.js"), "./Pages/Marketing/Tools/Shared/SmartCaptureNudge.jsx": () => import("./assets/SmartCaptureNudge-VrUccUol.js"), "./Pages/Marketing/Tools/Shared/ToolShell.jsx": () => import("./assets/ToolShell-zAP3LLHC.js"), "./Pages/Marketing/Tools/Shared/ToolsSidebar.jsx": () => import("./assets/ToolsSidebar-UoByrcvz.js"), "./Pages/Marketing/Tools/SkuGenerator.jsx": () => import("./assets/SkuGenerator-BA1MbXJf.js"), "./Pages/Marketing/Tools/SmartCapture.jsx": () => import("./assets/SmartCapture-BMg-0Pzo.js"), "./Pages/Marketing/Tools/StockCountSheet.jsx": () => import("./assets/StockCountSheet-BIyeeIzZ.js"), "./Pages/Marketing/VenSynQ.jsx": () => import("./assets/VenSynQ-mguveOUw.js"), "./Pages/NewDashboard.jsx": () => import("./assets/NewDashboard-nNuKrJd3.js"), "./Pages/NewInvoice.jsx": () => import("./assets/NewInvoice-B0AiEHtF.js"), "./Pages/NewPos.jsx": () => import("./assets/NewPos-C2isG5xJ.js"), "./Pages/Next/Dashboard.jsx": () => import("./assets/Dashboard-DBroK4wo.js"), "./Pages/Notifications/NotificationCenter.jsx": () => import("./assets/NotificationCenter-zqXsqEst.js"), "./Pages/Onboarding/Components/HistoryUnlockedModal.jsx": () => import("./assets/HistoryUnlockedModal-0KHHDlE2.js"), "./Pages/Onboarding/Wizard.jsx": () => import("./assets/Wizard-TQzJpnoH.js"), "./Pages/OnlineStore/OnlineStore.jsx": () => import("./assets/OnlineStore-GPVag0St.js"), "./Pages/Parties/Ledger.jsx": () => import("./assets/Ledger-BygNTOxD.js"), "./Pages/Parties/PartiesList.jsx": () => import("./assets/PartiesList-DfRTQhcC.js"), "./Pages/Payments/In.jsx": () => import("./assets/In-CvLEejcU.js"), "./Pages/Payments/Out.jsx": () => import("./assets/Out-CnTxAYY9.js"), "./Pages/Payments/PaymentsList.jsx": () => import("./assets/PaymentsList-BhhzpgX0.js"), "./Pages/Payments/Show.jsx": () => import("./assets/Show-8YfDHBWh.js"), "./Pages/Platform/BlogPosts/Index.jsx": () => import("./assets/Index-B3JEZ0AX.js"), "./Pages/Platform/Overview.jsx": () => import("./assets/Overview-DCJANJ_M.js"), "./Pages/Platform/Views.jsx": () => import("./assets/Views-CqG5WmkK.js"), "./Pages/PlatformOwner/Login.jsx": () => import("./assets/Login-qMnnjgib.js"), "./Pages/Pos.jsx": () => import("./assets/Pos-CoS6KSDw.js"), "./Pages/PrivacyPolicy.jsx": () => import("./assets/PrivacyPolicy-DTTi9phd.js"), "./Pages/Profile/Edit.jsx": () => import("./assets/Edit-ByBrouzc.js"), "./Pages/Proposals/Create.jsx": () => import("./assets/Create-jbsIkovN.js"), "./Pages/Proposals/ProposalsList.jsx": () => import("./assets/ProposalsList-B2QY7qUF.js"), "./Pages/Proposals/Show.jsx": () => import("./assets/Show-C3wV26CM.js"), "./Pages/PurchaseOrders/Create.jsx": () => import("./assets/Create-WU5ACqnR.js"), "./Pages/PurchaseOrders/PurchaseOrdersList.jsx": () => import("./assets/PurchaseOrdersList-CQ4GppDw.js"), "./Pages/PurchaseOrders/Show.jsx": () => import("./assets/Show-BQz4Fiut.js"), "./Pages/Purchases/PurchasesList.jsx": () => import("./assets/PurchasesList-txdYjFrW.js"), "./Pages/RecurringInvoices/Create.jsx": () => import("./assets/Create-Bxdvn2H7.js"), "./Pages/RecurringInvoices/Edit.jsx": () => import("./assets/Edit-BtVrhRt4.js"), "./Pages/RecurringInvoices/RecurringForm.jsx": () => import("./assets/RecurringForm-Cj0-Rc6v.js"), "./Pages/RecurringInvoices/RecurringInvoices.jsx": () => import("./assets/RecurringInvoices-Dod2mAxu.js"), "./Pages/RecycleBin.jsx": () => import("./assets/RecycleBin-Cv3wA55t.js"), "./Pages/Redeem.jsx": () => import("./assets/Redeem-vwDzd5uy.js"), "./Pages/RefundPolicy.jsx": () => import("./assets/RefundPolicy-BqY9TuyK.js"), "./Pages/Reminders/Create.jsx": () => import("./assets/Create-CpcQyVeI.js"), "./Pages/Reminders/InvoiceReminders.jsx": () => import("./assets/InvoiceReminders-C7J8n88Q.js"), "./Pages/Reports/AccountLedger.jsx": () => import("./assets/AccountLedger-C9lMT8g5.js"), "./Pages/Reports/AllParties.jsx": () => import("./assets/AllParties-CTdI9kZS.js"), "./Pages/Reports/BankStatement.jsx": () => import("./assets/BankStatement-Dbm8Bfjg.js"), "./Pages/Reports/BillWiseProfit.jsx": () => import("./assets/BillWiseProfit-DJmzme2u.js"), "./Pages/Reports/CashFlow.jsx": () => import("./assets/CashFlow-DY2YFqEy.js"), "./Pages/Reports/CategoryProfitability.jsx": () => import("./assets/CategoryProfitability-C5gxpabv.js"), "./Pages/Reports/Components/ReportPage.jsx": () => import("./assets/ReportPage-2DW3nAtZ.js"), "./Pages/Reports/CustomerInsights.jsx": () => import("./assets/CustomerInsights-CW8zj_Fx.js"), "./Pages/Reports/DayBook.jsx": () => import("./assets/DayBook-xwkuGJPl.js"), "./Pages/Reports/DiscountReport.jsx": () => import("./assets/DiscountReport-hm-HiJbu.js"), "./Pages/Reports/ExpenseByCategory.jsx": () => import("./assets/ExpenseByCategory-C0a2jE5Q.js"), "./Pages/Reports/ExpenseByItem.jsx": () => import("./assets/ExpenseByItem-BBWZmOxY.js"), "./Pages/Reports/Expenses.jsx": () => import("./assets/Expenses-DVPHAvI9.js"), "./Pages/Reports/ExpiryReport.jsx": () => import("./assets/ExpiryReport-Uskb8QOb.js"), "./Pages/Reports/GenericReport.jsx": () => import("./assets/GenericReport-CDZw7hkZ.js"), "./Pages/Reports/GraphAnalytics.jsx": () => import("./assets/GraphAnalytics-ujUSi_Y8.js"), "./Pages/Reports/ItemCategoryWiseProfitLoss.jsx": () => import("./assets/ItemCategoryWiseProfitLoss-DhyEjD5l.js"), "./Pages/Reports/ItemDetail.jsx": () => import("./assets/ItemDetail-CZ2IugFv.js"), "./Pages/Reports/ItemReportByParty.jsx": () => import("./assets/ItemReportByParty-drchgBr2.js"), "./Pages/Reports/ItemWiseDiscount.jsx": () => import("./assets/ItemWiseDiscount-DmrOmxk2.js"), "./Pages/Reports/ItemWiseProfit.jsx": () => import("./assets/ItemWiseProfit-8zsilzYl.js"), "./Pages/Reports/LoanStatement.jsx": () => import("./assets/LoanStatement-Ar06FdAp.js"), "./Pages/Reports/LowStock.jsx": () => import("./assets/LowStock-CXJK4HuX.js"), "./Pages/Reports/MovementHistory.jsx": () => import("./assets/MovementHistory-Cb3mv-Uh.js"), "./Pages/Reports/OwnersDailyPulse.jsx": () => import("./assets/OwnersDailyPulse-CHqKyNV6.js"), "./Pages/Reports/PartyReportByItem.jsx": () => import("./assets/PartyReportByItem-Cso0Gt8d.js"), "./Pages/Reports/PartyStatement.jsx": () => import("./assets/PartyStatement-DZ7kh9-F.js"), "./Pages/Reports/PartyWiseProfitLoss.jsx": () => import("./assets/PartyWiseProfitLoss-DN3cQJlj.js"), "./Pages/Reports/PointInTimeInventory.jsx": () => import("./assets/PointInTimeInventory-C46viJoJ.js"), "./Pages/Reports/ProfitLoss.jsx": () => import("./assets/ProfitLoss-DJB9Gws9.js"), "./Pages/Reports/PurchaseReturns.jsx": () => import("./assets/PurchaseReturns-NPeV7D2J.js"), "./Pages/Reports/Purchases.jsx": () => import("./assets/Purchases-lWTdM5gI.js"), "./Pages/Reports/RefundReasons.jsx": () => import("./assets/RefundReasons-qPUbmMNk.js"), "./Pages/Reports/ReportsHub.jsx": () => import("./assets/ReportsHub-9EYpjbeY.js"), "./Pages/Reports/SaleAging.jsx": () => import("./assets/SaleAging-D17l4pdD.js"), "./Pages/Reports/SaleOrderItems.jsx": () => import("./assets/SaleOrderItems-CiQC6SRR.js"), "./Pages/Reports/SaleOrders.jsx": () => import("./assets/SaleOrders-Bzeqw5Mn.js"), "./Pages/Reports/SalePurchaseByItemCategory.jsx": () => import("./assets/SalePurchaseByItemCategory-CvI3jfeo.js"), "./Pages/Reports/SalePurchaseByParty.jsx": () => import("./assets/SalePurchaseByParty-D1YPmJz7.js"), "./Pages/Reports/SalePurchaseByPartyGroup.jsx": () => import("./assets/SalePurchaseByPartyGroup-ww5IHNK1.js"), "./Pages/Reports/Sales.jsx": () => import("./assets/Sales-Oj4EzRjo.js"), "./Pages/Reports/StockAging.jsx": () => import("./assets/StockAging-DLW2zlFy.js"), "./Pages/Reports/StockSummaryByCategory.jsx": () => import("./assets/StockSummaryByCategory-C8VQ-2R2.js"), "./Pages/Reports/StockValuation.jsx": () => import("./assets/StockValuation-CiR1-JU3.js"), "./Pages/Reports/SupplierInsights.jsx": () => import("./assets/SupplierInsights-DDXSKCSn.js"), "./Pages/Reports/Tax.jsx": () => import("./assets/Tax-TrvQ8KVs.js"), "./Pages/Reports/TaxRateReport.jsx": () => import("./assets/TaxRateReport-Dc9jH2RN.js"), "./Pages/Reports/Transactions.jsx": () => import("./assets/Transactions-BiBKYKpQ.js"), "./Pages/Reports/TrialBalance.jsx": () => import("./assets/TrialBalance-De2bjesm.js"), "./Pages/Restaurant/Dashboard.jsx": () => import("./assets/Dashboard-yVuZnsug.js"), "./Pages/Restaurant/Kitchen.jsx": () => import("./assets/Kitchen-DXw60CeR.js"), "./Pages/Returns/Create.jsx": () => import("./assets/Create-DY__GSEi.js"), "./Pages/Returns/ReturnsHistory.jsx": () => import("./assets/ReturnsHistory-D_Pp944K.js"), "./Pages/Returns/Show.jsx": () => import("./assets/Show-DPALxywH.js"), "./Pages/Sales/Analytics.jsx": () => import("./assets/Analytics-B2yBaKM-.js"), "./Pages/Sales/CreateInvoice.jsx": () => import("./assets/CreateInvoice-B-EfXKiW.js"), "./Pages/Sales/CreatePreSale.jsx": () => import("./assets/CreatePreSale-C06ZHuw1.js"), "./Pages/Sales/Customers/CustomersList.jsx": () => import("./assets/CustomersList-ctvDRTgY.js"), "./Pages/Sales/Dashboard.jsx": () => import("./assets/Dashboard-BL_aZRDR.js"), "./Pages/Sales/MasterSales.jsx": () => import("./assets/MasterSales-BSHNAO6p.js"), "./Pages/Sales/ParkedSales.jsx": () => import("./assets/ParkedSales-DmUnGFi0.js"), "./Pages/Sales/SalesHistory.jsx": () => import("./assets/SalesHistory-BpXPDE0N.js"), "./Pages/Sales/Show.jsx": () => import("./assets/Show-B74bXhep.js"), "./Pages/SalesOrders/CreatePreSale.jsx": () => import("./assets/CreatePreSale-BKGQgwWh.js"), "./Pages/SalesOrders/PreSales.jsx": () => import("./assets/PreSales-SweKeYFc.js"), "./Pages/SerialTracking/SerialTracking.jsx": () => import("./assets/SerialTracking-Cm17_5hr.js"), "./Pages/SerialTracking/Show.jsx": () => import("./assets/Show-B5-iyAE3.js"), "./Pages/Services/CreateServiceJob.jsx": () => import("./assets/CreateServiceJob-fykGzNjI.js"), "./Pages/Services/ServiceCalendar.jsx": () => import("./assets/ServiceCalendar-ecWgdxFL.js"), "./Pages/Services/ServiceJobDetail.jsx": () => import("./assets/ServiceJobDetail-BQEIZ634.js"), "./Pages/Services/ServiceJobs.jsx": () => import("./assets/ServiceJobs-D9wEta-U.js"), "./Pages/Services/ServiceNavTabs.jsx": () => import("./assets/ServiceNavTabs-C0mnPWx8.js"), "./Pages/Services/Tools.jsx": () => import("./assets/Tools-5q6txIUu.js"), "./Pages/Settings/Appearance.jsx": () => import("./assets/Appearance-vNrIl2WK.js"), "./Pages/Settings/ChatbotSettings.jsx": () => import("./assets/ChatbotSettings-DwZrKENj.js"), "./Pages/Settings/SettingsPanel.jsx": () => import("./assets/SettingsPanel-CtCB-Ztr.js"), "./Pages/SetupWizard.jsx": () => import("./assets/SetupWizard-CnbiApSG.js"), "./Pages/Staff/Hub.jsx": () => import("./assets/Hub-Cl_9PI29.js"), "./Pages/StaffAttendance/Show.jsx": () => import("./assets/Show-CQj2Y0Pn.js"), "./Pages/StaffAttendance/StaffAttendance.jsx": () => import("./assets/StaffAttendance-D5ak-QST.js"), "./Pages/StockOperations.jsx": () => import("./assets/StockOperations-Dtzppk7H.js"), "./Pages/StockTake/Create.jsx": () => import("./assets/Create-DQ7nJZ1F.js"), "./Pages/StockTake/Show.jsx": () => import("./assets/Show-DtCfdVAb.js"), "./Pages/StockTake/StockTake.jsx": () => import("./assets/StockTake-6roMwoeg.js"), "./Pages/StockTransfers/Create.jsx": () => import("./assets/Create-Bylhof2l.js"), "./Pages/StockTransfers/Show.jsx": () => import("./assets/Show-By-itCId.js"), "./Pages/StockTransfers/StockTransfers.jsx": () => import("./assets/StockTransfers-B0klK6as.js"), "./Pages/Store/CreateOrJoin.jsx": () => import("./assets/CreateOrJoin-k27ITkSk.js"), "./Pages/Store/Join.jsx": () => import("./assets/Join-DL3UTFCl.js"), "./Pages/Store/Staff/Index.jsx": () => import("./assets/Index-DBA4yehd.js"), "./Pages/SuperAdmin/AccessGrants/Index.jsx": () => import("./assets/Index-MUC-Q3zC.js"), "./Pages/SuperAdmin/AppSumo/Index.jsx": () => import("./assets/Index-DGqesv5T.js"), "./Pages/SuperAdmin/Coupons/Index.jsx": () => import("./assets/Index-DEoeOSX5.js"), "./Pages/SuperAdmin/Dashboard.jsx": () => import("./assets/Dashboard-CLHeEcrM.js"), "./Pages/SuperAdmin/DigitalHub/Index.jsx": () => import("./assets/Index-BUdLC5_f.js"), "./Pages/SuperAdmin/Health/Contacts.jsx": () => import("./assets/Contacts-BCHUxNQn.js"), "./Pages/SuperAdmin/Health/Errors.jsx": () => import("./assets/Errors-B8lCoiUl.js"), "./Pages/SuperAdmin/NewsletterHub/Index.jsx": () => import("./assets/Index-B4gp2Q_k.js"), "./Pages/SuperAdmin/Plans/Index.jsx": () => import("./assets/Index-5kBiiEfE.js"), "./Pages/SuperAdmin/Platforms/Index.jsx": () => import("./assets/Index-DMd2N02G.js"), "./Pages/SuperAdmin/Stores.jsx": () => import("./assets/Stores-C8vn2WLY.js"), "./Pages/SuperAdmin/Tenants/OverrideDetail.jsx": () => import("./assets/OverrideDetail-RzSAId9B.js"), "./Pages/SuperAdmin/Tenants/Overrides.jsx": () => import("./assets/Overrides-DSTujXSJ.js"), "./Pages/SuperAdmin/Users.jsx": () => import("./assets/Users-DUBAgoKs.js"), "./Pages/Suppliers/SuppliersList.jsx": () => import("./assets/SuppliersList-DhTmjV22.js"), "./Pages/TableService/FloorBuilder.jsx": () => import("./assets/FloorBuilder-Da2K5brG.js"), "./Pages/TermsOfService.jsx": () => import("./assets/TermsOfService-DXH7SG6q.js"), "./Pages/Transactions/TransactionsList.jsx": () => import("./assets/TransactionsList-Cj1aK0uW.js"), "./Pages/Updater/Index.jsx": () => import("./assets/Index-DHcflhN-.js"), "./Pages/V3/Products/Create.jsx": () => import("./assets/Create-C8A3QWxd.js"), "./Pages/V3/Products/Edit.jsx": () => import("./assets/Edit-CsatcJM8.js"), "./Pages/V3/Products/Index.jsx": () => import("./assets/Index-Bqm2bfhI.js"), "./Pages/V3/Products/PriceTiers.jsx": () => import("./assets/PriceTiers-cscVpgLL.js"), "./Pages/V3/Products/UomConversions.jsx": () => import("./assets/UomConversions-BUrB0blx.js"), "./Pages/V3/Purchases/Create.jsx": () => import("./assets/Create-C2VZhWjc.js"), "./Pages/V3/Purchases/Edit.jsx": () => import("./assets/Edit-CFEOMzXQ.js"), "./Pages/V3/Purchases/PurchaseForm.jsx": () => import("./assets/PurchaseForm-BLXo9PS0.js"), "./Pages/V3/Purchases/Receive.jsx": () => import("./assets/Receive-qp4A7BP4.js"), "./Pages/V3/Purchases/Return.jsx": () => import("./assets/Return-BfR_pOA1.js"), "./Pages/V3/Purchases/Show.jsx": () => import("./assets/Show-C868zjeh.js"), "./Pages/V3/Warehouses/Create.jsx": () => import("./assets/Create-CRLauPFD.js"), "./Pages/V3/Warehouses/Edit.jsx": () => import("./assets/Edit-DFHm8cks.js"), "./Pages/V3/Warehouses/Index.jsx": () => import("./assets/Index-COauViNc.js"), "./Pages/VenSynQ/Components/AmazonSetupWizard.jsx": () => import("./assets/AmazonSetupWizard-B7Prq2Nk.js"), "./Pages/VenSynQ/Components/MoneyPipeline.jsx": () => import("./assets/MoneyPipeline-CKynBDg7.js"), "./Pages/VenSynQ/Components/SyncHealthPanel.jsx": () => import("./assets/SyncHealthPanel-DPKax49H.js"), "./Pages/VenSynQ/Dashboard.jsx": () => import("./assets/Dashboard-CHbzYkmF.js"), "./Pages/VenSynQ/Payouts.jsx": () => import("./assets/Payouts-DkmmtH0D.js"), "./Pages/VenSynQ/Settings.jsx": () => import("./assets/Settings-DFJt7W9U.js"), "./Pages/Welcome.jsx": () => import("./assets/Welcome-B7imBE_c.js"), "./Pages/WhatIsIncluded.jsx": () => import("./assets/WhatIsIncluded-B3hTAjn1.js"), "./Pages/WooCommerce/ConnectionSetup.jsx": () => import("./assets/ConnectionSetup-CZM2YxFl.js"), "./Pages/WooCommerce/Connections.jsx": () => import("./assets/Connections-CSS26c6j.js"), "./Pages/WooCommerce/SyncPage.jsx": () => import("./assets/SyncPage-CZJ6V-SG.js"), "./Pages/WooCommerce/WooCommerce.jsx": () => import("./assets/WooCommerce-BmSehB96.js"), "./Pages/Workspace/BuildWorkspace.jsx": () => import("./assets/BuildWorkspace-CK0maKFx.js"), "./Pages/Workspace/Dashboard.jsx": () => import("./assets/Dashboard-Cf8Y117V.js"), "./Pages/Workspace/Overview.jsx": () => import("./assets/Overview-BW_tbBfV.js") })
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
        global.route = (name, params, absolute) => B(name, params, absolute, {
          ...ziggy,
          location: new URL(ziggy.location || Ziggy$1.url)
        });
      }
      return /* @__PURE__ */ jsx(App, { ...props });
    }
  })
);
export {
  CONTROLLED_PALETTES as C,
  FormModal as F,
  Modal as M,
  PasscodeModal as P,
  REQUIRED_ROLES as R,
  SecondaryButton as S,
  FormField as a,
  FormInput as b,
  FormSelect as c,
  FormTextarea as d,
  PrimaryButton as e,
  useWorkspace as f,
  useTheme as g,
  useAppearance as h,
  SHADES as i,
  db as j,
  literalRamp as l,
  parseHex as p,
  ramp as r,
  toHex as t,
  useAlert as u
};

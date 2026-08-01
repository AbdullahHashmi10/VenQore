import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { f as formatCurrency, a as formatNumber, g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { O as OneGlanceLayout, T as Toast } from "./OneGlanceLayout-KMWHwZqK.js";
import { Info, AlertTriangle, XCircle, CheckCircle, Banknote, Smartphone, CreditCard, X, Plus, Trash2, Printer, Trophy, Sparkles, ArrowLeft, ArrowRight, Pause, Wifi, WifiOff, Clock, PackagePlus, ScanBarcode, Search, ChevronLeft, ChevronRight, Archive, Package, ShoppingCart, MinusCircle, PlusCircle, Receipt, User, AlertCircle, Check, RefreshCcw, Database } from "lucide-react";
import axios from "axios";
import { h as db$1, M as Modal, f as useWorkspace, F as FormModal } from "../ssr.js";
import { P as PrintService } from "./PrintService-B05R75aO.js";
import { r as roundTotal, s as shouldStopNegativeStock, g as getProductPrice } from "./settings-DUqQ1JdE.js";
import { C as ConfirmModal } from "./ConfirmModal-DmA0ajk4.js";
import { Q as QuickPartyModal } from "./QuickPartyModal-fEhN51o-.js";
import { P as ProductModal } from "./ProductModal-ChKYFNm4.js";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-C-Y4x1DU.js";
import { A as AsyncPartyCombobox } from "./AsyncPartyCombobox-ByeG86uG.js";
import "driver.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "react-dom/client";
import "./PrintPreview--U6vwnpl.js";
import "./PremiumButton-BcHxfadR.js";
import "./PremiumSelect-BdCYeyr5.js";
import "use-debounce";
import "./SmartCombobox-D6m7UWTk.js";
const db = db$1;
const isOnline = () => navigator.onLine;
const useOfflineSync = () => {
  const { store } = usePage().props;
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncErrors, setSyncErrors] = useState({});
  const checkPending = async () => {
    const count = await db.sales_queue.where("status").equals("pending").count();
    setPendingCount(count);
  };
  const syncPendingSales = async () => {
    if (!isOnline() || isSyncing) return;
    const pendingSales = await db.sales_queue.where("status").equals("pending").toArray();
    if (pendingSales.length === 0) {
      await checkPending();
      return;
    }
    setIsSyncing(true);
    let syncedCount = 0;
    const newErrors = {};
    for (const sale of pendingSales) {
      try {
        await axios.post(route("store.sales.store", {
          store_slug: store.slug
        }), sale.data);
        await db.sales_queue.update(sale.id, { status: "synced", synced_at: /* @__PURE__ */ new Date() });
        syncedCount++;
      } catch (error) {
        console.error("Sync failed for sale:", sale.id, error);
        const serverMessage = error?.response?.data?.message || error?.response?.data?.error || (error?.response?.status ? `Server error ${error.response.status}` : null) || error?.message || "Unknown error";
        newErrors[sale.id] = serverMessage;
        const currentAttempts = sale.attempt_count || 0;
        await db.sales_queue.update(sale.id, {
          attempt_count: currentAttempts + 1,
          last_error: serverMessage,
          last_attempt_at: /* @__PURE__ */ new Date()
        });
      }
    }
    setSyncErrors((prev) => ({ ...prev, ...newErrors }));
    setIsSyncing(false);
    setLastSyncTime(/* @__PURE__ */ new Date());
    checkPending();
    return syncedCount;
  };
  useEffect(() => {
    checkPending();
    const handleOnline = () => syncPendingSales();
    window.addEventListener("online", handleOnline);
    const interval = setInterval(() => {
      if (isOnline()) syncPendingSales();
    }, 6e4);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);
  const saveOfflineSale = async (saleData) => {
    try {
      await db.sales_queue.add({
        data: saleData,
        created_at: /* @__PURE__ */ new Date(),
        status: "pending"
      });
      await checkPending();
      if (isOnline()) {
        syncPendingSales();
      }
      return true;
    } catch (error) {
      console.error("Failed to save offline sale:", error);
      return false;
    }
  };
  const getPendingSales = async () => {
    return await db.sales_queue.where("status").equals("pending").toArray();
  };
  const deletePendingSale = async (id) => {
    await db.sales_queue.delete(id);
    await checkPending();
  };
  return {
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncErrors,
    checkPending,
    saveOfflineSale,
    syncPendingSales,
    getPendingSales,
    deletePendingSale
  };
};
function AlertModal({ show, onClose, type = "error", title, message, actionLabel = "Okay", onAction }) {
  const icons = {
    success: /* @__PURE__ */ jsx(CheckCircle, { className: "text-emerald-500 w-12 h-12" }),
    error: /* @__PURE__ */ jsx(XCircle, { className: "text-red-500 w-12 h-12" }),
    warning: /* @__PURE__ */ jsx(AlertTriangle, { className: "text-amber-500 w-12 h-12" }),
    info: /* @__PURE__ */ jsx(Info, { className: "text-blue-500 w-12 h-12" })
  };
  const handleAction = () => {
    if (onAction) onAction();
    onClose();
  };
  const isSaleCompleted = title === "Sale Completed!";
  return /* @__PURE__ */ jsx(Modal, { show, onClose, maxWidth: "sm", children: /* @__PURE__ */ jsxs("div", { className: `p-8 text-center rounded-2xl transition-all duration-300 ${isSaleCompleted ? "bg-slate-900 text-white" : ""}`, children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-5", children: /* @__PURE__ */ jsx("div", { className: `p-4 rounded-full bg-opacity-10 ${type === "error" ? "bg-red-500" : type === "success" ? "bg-emerald-500" : type === "warning" ? "bg-amber-500" : "bg-blue-500"}`, children: icons[type] }) }),
    /* @__PURE__ */ jsx("h2", { className: `text-2xl font-black mb-4 tracking-tight ${isSaleCompleted ? "text-white" : "text-slate-800 dark:text-white"}`, children: title }),
    typeof message === "string" ? /* @__PURE__ */ jsx("p", { className: `mb-6 whitespace-pre-line text-sm leading-relaxed ${isSaleCompleted ? "text-slate-300 font-medium" : "text-slate-500 dark:text-slate-400"}`, children: message }) : /* @__PURE__ */ jsx("div", { className: "mb-6", children: message }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleAction,
        className: `w-full py-4 rounded-xl font-extrabold text-white shadow-lg active:scale-[0.98] transition-all text-base ${isSaleCompleted ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : type === "error" ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" : type === "success" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30" : type === "warning" ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30" : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/30"}`,
        children: actionLabel
      }
    )
  ] }) });
}
function InputModal({ show, onClose, title, message, placeholder, initialValue = "", onSubmit, submitLabel = "Submit", zIndex = "z-50" }) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (show) setValue(initialValue);
  }, [show, initialValue]);
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(value);
    onClose();
  };
  return /* @__PURE__ */ jsx(Modal, { show, onClose, maxWidth: "sm", zIndex, children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-800 dark:text-white mb-2", children: title }),
    message && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mb-4", children: message }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        value,
        onChange: (e) => setValue(e.target.value),
        placeholder,
        className: "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500 mb-6 text-slate-800 dark:text-white",
        autoFocus: true
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "flex-1 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all",
          children: submitLabel
        }
      )
    ] })
  ] }) });
}
const PaymentModal = ({ isOpen, onClose, totalAmount, onComplete, currency = "PKR", bankAccounts = [], customer = null, defaultPrintReceipt = true }) => {
  if (!isOpen) return null;
  const [payments, setPayments] = useState([
    {
      method: "cash",
      amount: "",
      account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
    },
    {
      method: "bank",
      amount: "",
      account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
    }
  ]);
  const [notes, setNotes] = useState("");
  const [printReceipt, setPrintReceipt] = useState(defaultPrintReceipt);
  const [activeMethodDropdownIndex, setActiveMethodDropdownIndex] = useState(null);
  const [activeAccountDropdownIndex, setActiveAccountDropdownIndex] = useState(null);
  useEffect(() => {
    if (isOpen) {
      setPayments([
        {
          method: "cash",
          amount: "",
          account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
        },
        {
          method: "bank",
          amount: "",
          account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
        }
      ]);
      setNotes("");
      setPrintReceipt(defaultPrintReceipt);
    }
  }, [isOpen, totalAmount, defaultPrintReceipt]);
  const paymentMethods = [
    { id: "cash", name: "Cash", icon: Banknote, color: "bg-emerald-500" },
    { id: "bank", name: "Bank Transfer", icon: Smartphone, color: "bg-indigo-500" },
    { id: "card", name: "Card", icon: CreditCard, color: "bg-blue-500" },
    { id: "upi", name: "UPI / QR", icon: Smartphone, color: "bg-purple-500" },
    { id: "credit", name: "Credit (Udhaar)", icon: CheckCircle, color: "bg-amber-500" }
  ].filter((m) => m.id !== "credit" || customer !== null);
  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const balance = totalPaid - totalAmount;
  const isCreditSale = payments.some((p) => p.method === "credit");
  const addPaymentMethod = () => {
    const remaining = Math.max(0, totalAmount - totalPaid);
    setPayments([...payments, {
      method: "cash",
      amount: remaining > 0 ? remaining : "",
      account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
    }]);
  };
  const removePaymentMethod = (index) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments.length ? newPayments : [{
      method: "cash",
      amount: "",
      account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
    }]);
  };
  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };
  const handleComplete = () => {
    if (totalPaid < totalAmount && !isCreditSale) {
      alert("Total payment must equal or exceed the bill amount. Add a 'Credit' payment line for the balance.");
      return;
    }
    onComplete({
      payments: payments.map((p) => ({ ...p, amount: parseFloat(p.amount) || 0 })),
      totalPaid,
      change: balance > 0 ? balance : 0,
      notes,
      printReceipt
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-800 dark:text-white", children: "Complete Sale" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Select payment methods and finalize" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20, className: "text-slate-500" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/30", children: [
        /* @__PURE__ */ jsx("span", { className: "text-lg font-medium text-indigo-900 dark:text-indigo-300", children: "Total Payable" }),
        /* @__PURE__ */ jsx("span", { className: "text-4xl font-black text-indigo-600 dark:text-indigo-400", children: formatCurrency(totalAmount) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider", children: "Payment Methods" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: addPaymentMethod,
              className: "text-xs flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 transition-colors",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14 }),
                " Split Payment"
              ]
            }
          )
        ] }),
        payments.map((payment, index) => /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-start animate-in slide-in-from-left-2 duration-200", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setActiveMethodDropdownIndex(activeMethodDropdownIndex === index ? null : index),
                className: "w-full h-12 pl-10 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: paymentMethods.find((m) => m.id === payment.method)?.name || "Method" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-[10px]", children: "▼" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", children: (() => {
              const Icon = paymentMethods.find((m) => m.id === payment.method)?.icon || Banknote;
              return /* @__PURE__ */ jsx(Icon, { size: 18 });
            })() }),
            activeMethodDropdownIndex === index && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[80] animate-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto", children: paymentMethods.map((method) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  updatePayment(index, "method", method.id);
                  setActiveMethodDropdownIndex(null);
                },
                className: `w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-105 dark:hover:bg-slate-700/60 transition-colors ${payment.method === method.id ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "text-slate-700 dark:text-slate-300"}`,
                children: method.name
              },
              method.id
            )) })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-[1.5]", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm", children: usePage().props.store?.currency_symbol || "Rs" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: payment.amount,
                  onChange: (e) => updatePayment(index, "amount", e.target.value),
                  placeholder: "0.00",
                  className: "w-full h-12 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 font-bold text-lg text-right text-slate-800 dark:text-white",
                  autoFocus: index === payments.length - 1,
                  onFocus: (e) => e.target.select()
                }
              )
            ] }),
            ["bank", "card", "online", "upi"].includes(payment.method) && bankAccounts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 animate-in slide-in-from-top-1 duration-200 relative", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setActiveAccountDropdownIndex(activeAccountDropdownIndex === index ? null : index),
                  className: "w-full bg-slate-100 dark:bg-slate-700 rounded-lg py-1.5 px-3 text-[10px] font-bold text-slate-650 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500/50 outline-none flex items-center justify-between cursor-pointer transition-all",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: bankAccounts.find((acc) => String(acc.id) === String(payment.account_id))?.name || bankAccounts[0]?.name || "Select Account" }),
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-[8px] ml-1", children: "▼" })
                  ]
                }
              ),
              activeAccountDropdownIndex === index && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-0.5 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[85] animate-in slide-in-from-top-1 duration-150 max-h-32 overflow-y-auto", children: bankAccounts.map((acc) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    updatePayment(index, "account_id", acc.id);
                    setActiveAccountDropdownIndex(null);
                  },
                  className: `w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-slate-105 dark:hover:bg-slate-750 transition-colors ${String(payment.account_id) === String(acc.id) ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "text-slate-700 dark:text-slate-300"}`,
                  children: acc.name
                },
                acc.id
              )) })
            ] })
          ] }),
          payments.length > 1 && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => removePaymentMethod(index),
              className: "h-12 w-12 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors",
              children: /* @__PURE__ */ jsx(Trash2, { size: 18 })
            }
          )
        ] }, index))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium uppercase", children: "Total Paid" }),
          /* @__PURE__ */ jsx("div", { className: `text-xl font-bold ${totalPaid < totalAmount ? "text-amber-500" : "text-emerald-600"}`, children: formatCurrency(totalPaid) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium uppercase", children: "Change Due" }),
          /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-slate-800 dark:text-white", children: formatCurrency(balance > 0 ? balance : 0) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block", children: "Sale Notes" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: notes,
            onChange: (e) => setNotes(e.target.value),
            placeholder: "Add notes for this sale...",
            className: "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 text-sm min-h-[80px] resize-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 cursor-pointer", onClick: () => setPrintReceipt(!printReceipt), children: [
        /* @__PURE__ */ jsx("div", { className: `w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${printReceipt ? "bg-indigo-600 border-indigo-600" : "border-slate-300 dark:border-slate-600"}`, children: printReceipt && /* @__PURE__ */ jsx(CheckCircle, { size: 16, className: "text-white" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-slate-700 dark:text-slate-300 select-none flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Printer, { size: 16 }),
          " Print Receipt automatically"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50", children: /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: handleComplete,
        disabled: totalPaid < totalAmount && !isCreditSale,
        className: `
                            w-full h-14 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                            ${totalPaid < totalAmount && !isCreditSale ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-500/30 active:scale-[0.98]"}
                        `,
        children: [
          /* @__PURE__ */ jsx("span", { children: "Complete Sale" }),
          /* @__PURE__ */ jsx("span", { className: "px-3 py-1.5 rounded-lg text-base font-black bg-white/25 border border-white/20", children: formatCurrency(totalPaid > totalAmount ? totalAmount : totalPaid) })
        ]
      }
    ) })
  ] }) });
};
function PosTourGuide({ store }) {
  const [hasCustomers, setHasCustomers] = useState(true);
  const [isCustomerCreationPath, setIsCustomerCreationPath] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const isVisible = store?.onboarding_step === "pos_tour" || store?.onboarding_step === "pos_congratulations";
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
          return "tour-pos-customer";
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
          return "tour-pos-product";
        case 7:
          return "tour-pos-paid";
        case 8:
          return "tour-pos-checkout";
        default:
          return null;
      }
    } else {
      switch (step) {
        case 0:
          return "tour-pos-customer";
        case 1:
          return "tour-pos-product";
        case 2:
          return "tour-pos-paid";
        case 3:
          return "tour-pos-checkout";
        default:
          return null;
      }
    }
  };
  useEffect(() => {
    if (!isVisible || !isCustomerCreationPath) return;
    const interval = setInterval(() => {
      const activeId = document.activeElement?.id;
      if (currentStep === 0) {
        if (document.getElementById("tour-add-new-party-btn")) {
          setCurrentStep(1);
        }
      } else if (currentStep === 1) {
        if (document.getElementById("tour-party-name")) {
          setCurrentStep(2);
        }
      } else if (currentStep === 2) {
        if (activeId === "tour-party-phone") {
          setCurrentStep(3);
        }
      } else if (currentStep === 3) {
        if (activeId === "tour-party-address") {
          setCurrentStep(4);
        }
      } else if (currentStep === 4) {
        if (activeId === "tour-party-submit") {
          setCurrentStep(5);
        }
      } else if (currentStep === 5) {
        if (!document.getElementById("tour-party-name")) {
          setCurrentStep(6);
        }
      }
    }, 150);
    return () => clearInterval(interval);
  }, [currentStep, isVisible, isCustomerCreationPath]);
  useEffect(() => {
    if (!isVisible || store?.onboarding_step === "pos_congratulations") {
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
  const handleStartInvoiceTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "invoice_tour_start" },
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
  if (store?.onboarding_step === "pos_congratulations") {
    const doneSteps = store?.onboarding_steps_done || [];
    const isInvoiceDone = doneSteps.includes("invoice");
    return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" }),
      /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-[101] animate-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Trophy, { className: "text-white w-8 h-8" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3", children: "POS Checkout Completed! 🛒🎉" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm font-semibold mb-2", children: "Your retail sale transaction is completed successfully!" }),
          /* @__PURE__ */ jsxs("p", { className: "text-slate-300 text-sm leading-relaxed max-w-sm mb-6", children: [
            "Outstanding! You've checked out a sale on the cashier terminal.",
            isInvoiceDone ? " Both sales routes are complete. Let's record store expenses next to track your cash flow!" : " Let's check out our detailed B2B Invoice creation next, or proceed to record expenses!"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2.5 w-full", children: [
            !isInvoiceDone && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleStartInvoiceTour,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm",
                children: /* @__PURE__ */ jsx("span", { children: "Try B2B Invoice" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleStartExpenseTour,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm",
                children: /* @__PURE__ */ jsx("span", { children: "Record Expenses" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSkipSetup,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs mt-1",
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
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[105] overflow-hidden pointer-events-none", children: [
    coords && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed pointer-events-none transition-all duration-100 ease-out",
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
    !coords && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/75 pointer-events-none z-[90]" }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: getTooltipStyle(),
        className: "bg-slate-900/95 dark:bg-slate-950/98 border border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-[115] animate-in fade-in duration-300",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "POS Checkout Tour" }),
              /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-semibold text-indigo-400", children: [
                "Step ",
                currentStep + 1,
                " of ",
                isCustomerCreationPath ? 9 : 4
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            isCustomerCreationPath ? /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: "You don't have any customers yet! Click on the Customer block." }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Now click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "+ Add New Customer" }),
                " in the search dropdown."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Put in the customer's ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Name" }),
                " inside the modal."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Put in their ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Phone Number" }),
                "."
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Put in their ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Address" }),
                "."
              ] }),
              currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Create Customer" }),
                " to save the customer."
              ] }),
              currentStep === 6 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Great! Now move toward the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Search Product" }),
                " option and select the previously created product."
              ] }),
              currentStep === 7 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Enter the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Amount Tendered" }),
                " (cash received from customer)."
              ] }),
              currentStep === 8 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Checkout" }),
                " to record the transaction."
              ] })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "First, select a ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Customer" }),
                " for the POS transaction (default/walk-in customer is pre-selected)."
              ] }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Search and select a ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Product" }),
                " to add to the shopping cart."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Enter the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Amount Tendered" }),
                " (cash received from customer)."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Checkout" }),
                " or Submit Payment to record the transaction and generate the receipt!"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
              currentStep > 0 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep - 1),
                  className: "px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                    /* @__PURE__ */ jsx("span", { children: "Back" })
                  ]
                }
              ) : /* @__PURE__ */ jsx("div", {}),
              currentStep < (isCustomerCreationPath ? 8 : 3) && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep + 1),
                  className: "px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
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
const POSInterface = ({ settings, recalledSale, bankAccounts = [], warehouses = [] }) => {
  const { auth, store } = usePage().props;
  const userRole = auth.user?.role;
  const userPerms = auth.user?.permissions || [];
  const hasDiscountPerm = userRole === "owner" || userRole === "admin" || userRole === "manager" || userPerms.some((p) => p === "pos.discounts" || p.startsWith("pos.discounts."));
  const posReturnMode = settings?.pos_return_mode || "reference";
  settings?.pos_return_window ? parseInt(settings.pos_return_window) : null;
  settings?.pos_return_window_behavior || "warn";
  const {
    posSessions,
    currentPosId,
    setCurrentPosId,
    addPosSession,
    updatePosSession,
    removePosSession
  } = useWorkspace();
  const [toasts, setToasts] = useState([]);
  const [alertState, setAlertState] = useState({ show: false, title: "", message: "", type: "info" });
  const [confirmState, setConfirmState] = useState({ show: false, title: "", message: "", onConfirm: () => {
  } });
  const [inputState, setInputState] = useState({ show: false, title: "", placeholder: "", onSubmit: () => {
  } });
  const [activeMobileTab, setActiveMobileTab] = useState("catalog");
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const showAlert = (title, message, type = "error") => setAlertState({ show: true, title, message, type });
  const showConfirm = (title, message, onConfirm, isDangerous = false) => setConfirmState({ show: true, title, message, onConfirm, isDangerous });
  const showInput = (title, placeholder, onSubmit) => setInputState({ show: true, title, placeholder, onSubmit });
  const categoryScrollRef = useRef(null);
  const handleCategoryWheel = (e) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollLeft += e.deltaY;
    }
  };
  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const offset = direction === "left" ? -180 : 180;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };
  const [sales, setSales] = useState(() => {
    return posSessions.length > 0 ? posSessions : [{ id: Date.now(), type: "pos", cart: [], cashReceived: "", searchTerm: "", customer: null, discountType: "fixed", discountValue: 0 }];
  });
  const [activeSaleId, setActiveSaleId] = useState(() => {
    return currentPosId || sales[0].id;
  });
  const activeSale = sales.find((s) => s.id === activeSaleId) || sales[0];
  const updateActiveSale = (updates) => {
    setSales((prev) => prev.map(
      (sale) => sale.id === activeSaleId ? { ...sale, ...updates } : sale
    ));
    updatePosSession(activeSaleId, updates);
  };
  useEffect(() => {
    if (recalledSale) {
      const mappedCart = recalledSale.items.map((item) => {
        const itemDiscount = parseFloat(item.discount_amount || item.discount || 0);
        const unitPrice = parseFloat(item.unit_price || 0);
        return {
          cartItemId: `${item.product_id}-${item.product_variant_id || ""}`,
          id: item.product_id,
          variant_id: item.product_variant_id,
          name: item.product.name + (item.product_variant ? ` (${item.product_variant.sku})` : ""),
          price: unitPrice - itemDiscount,
          // Net price
          original_price: unitPrice,
          // Gross price
          discount: itemDiscount,
          // Row discount
          qty: parseFloat(item.quantity),
          freeQuantity: parseFloat(item.free_quantity || 0),
          stock: 9999,
          image: item.product.image_path,
          category: item.product.category?.name || "General"
        };
      });
      const saleSession = {
        id: `RECALL-${recalledSale.id}`,
        type: "pos",
        cart: mappedCart,
        cashReceived: "",
        searchTerm: "",
        customer: recalledSale.customer ? {
          id: recalledSale.customer.id,
          name: recalledSale.customer.name,
          phone: recalledSale.customer.phone
        } : null,
        discountValue: parseFloat(recalledSale.global_discount || 0),
        discountType: "fixed",
        is_recall: true,
        // Flag to indicate editing
        original_sale_id: recalledSale.id
      };
      addPosSession(saleSession);
      addToast(`Recalled Sale #${recalledSale.reference_number}`, "info");
    }
  }, [recalledSale]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [lastAddedItemId, setLastAddedItemId] = useState(null);
  const [showOverpaymentModal, setShowOverpaymentModal] = useState(false);
  const [overpaymentDetails, setOverpaymentDetails] = useState({ amount: 0, customerName: "" });
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [showQuickPartyModal, setShowQuickPartyModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQueryForProduct, setSearchQueryForProduct] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(() => {
    const def = warehouses.find((w) => w.is_default) || warehouses[0];
    return def?.id || null;
  });
  const [parkedSales, setParkedSales] = useState([]);
  const [parkedDropdownOpen, setParkedDropdownOpen] = useState(false);
  const [parkingBill, setParkingBill] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [initialCustomers, setInitialCustomers] = useState([]);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(bankAccounts.length > 0 ? bankAccounts[0].id : null);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const [taxDropdownOpen, setTaxDropdownOpen] = useState(false);
  const [bankAccountDropdownOpen, setBankAccountDropdownOpen] = useState(false);
  const [showQuickAccountModal, setShowQuickAccountModal] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [printOnComplete, setPrintOnComplete] = useState(() => {
    const saved = localStorage.getItem("pos_print_on_complete");
    return saved ? JSON.parse(saved) : true;
  });
  const [seniorMode, setSeniorMode] = useState(() => {
    const sessionOverride = sessionStorage.getItem("pos_senior_mode");
    if (sessionOverride !== null) {
      return JSON.parse(sessionOverride);
    }
    return settings?.senior_mode === "1" || settings?.senior_mode === true;
  });
  const [returnMode, setReturnMode] = useState(false);
  const [returnSaleRef, setReturnSaleRef] = useState("");
  const [returnSaleId, setReturnSaleId] = useState(null);
  const [returnSaleLoading, setReturnSaleLoading] = useState(false);
  const [returnProcessing, setReturnProcessing] = useState(false);
  const [showFreeQty, setShowFreeQty] = useState(false);
  const [itemDiscountModal, setItemDiscountModal] = useState({ show: false, item: null, discType: "fixed", discValue: "" });
  const [converterModal, setConverterModal] = useState({ show: false, item: null, mode: "price", price: "", qty: "", total: "" });
  const [globalDiscountModal, setGlobalDiscountModal] = useState({ show: false, type: "fixed", value: "" });
  const [discountPresets, setDiscountPresets] = useState(() => {
    const saved = localStorage.getItem("pos_discount_presets");
    return saved ? JSON.parse(saved) : [5, 7, 10];
  });
  const openItemDiscountModal = (item) => {
    const currentOriginal = item.original_price || item.price;
    setItemDiscountModal({ show: true, item, discType: "fixed", discValue: item.discount > 0 ? String(item.discount) : "", originalPrice: currentOriginal });
  };
  useEffect(() => {
    const handleSync = () => {
      router.reload({
        only: ["products", "categories"],
        preserveState: true,
        preserveScroll: true
      });
      refreshCartItems();
    };
    window.addEventListener("amd:product-updated", handleSync);
    window.addEventListener("storage", (e) => {
      if (e.key === "amd_product_latest_change") handleSync();
    });
    return () => {
      window.removeEventListener("amd:product-updated", handleSync);
    };
  }, [activeSale?.cart]);
  const refreshCartItems = async () => {
    if (!activeSale?.cart?.length) return;
    const productsToRefresh = activeSale.cart.map((i) => i.id);
    try {
      const response = await axios.get(route("store.inventory.search", { store_slug: store?.slug }), {
        params: { ids: productsToRefresh }
      });
      const latestProducts = response.data || [];
      const newCart = activeSale.cart.map((item) => {
        const latest = latestProducts.find((p) => p.id === item.id);
        if (latest) {
          const shouldUpdatePrice = !activeSale.is_recall;
          const newPrice = shouldUpdatePrice ? parseFloat(latest.price || latest.selling_price || 0) : item.original_price || item.price;
          return {
            ...item,
            price: shouldUpdatePrice && item.discount > 0 ? newPrice - item.discount : shouldUpdatePrice ? newPrice : item.price,
            original_price: shouldUpdatePrice ? newPrice : item.original_price || item.price,
            stock: parseFloat(latest.stock_quantity || latest.stock || 0)
          };
        }
        return item;
      });
      updateActiveSale({ cart: newCart });
    } catch (error) {
      console.error("Failed to refresh cart items", error);
    }
  };
  const applyItemDiscount = () => {
    const { item, discType, discValue, originalPrice } = itemDiscountModal;
    const val = parseFloat(discValue);
    if (isNaN(val) || val < 0) {
      addToast("Enter a valid discount", "error");
      return;
    }
    const discountAmount = discType === "percentage" ? originalPrice * val / 100 : val;
    if (discountAmount > originalPrice) {
      addToast("Discount cannot exceed item price", "error");
      return;
    }
    const newCart = activeSale.cart.map(
      (i) => i.cartItemId === item.cartItemId ? { ...i, price: originalPrice - discountAmount, discount: discountAmount, original_price: originalPrice } : i
    );
    updateActiveSale({ cart: newCart });
    setItemDiscountModal({ show: false, item: null, discType: "fixed", discValue: "" });
    addToast(`Discount of ${discType === "percentage" ? val + "%" : formatCurrency(val, store || settings)} applied`, "success");
  };
  const openConverterModal = (item) => {
    const price = item.original_price || item.price;
    setConverterModal({ show: true, item, mode: "price", price: String(price), qty: String(item.qty), total: String(price * item.qty) });
  };
  const handleConverterChange = (field, rawValue) => {
    setConverterModal((prev) => {
      const val = parseFloat(rawValue) || 0;
      let next = { ...prev, [field]: rawValue };
      if (field === "total") {
        if (prev.mode === "price") {
          const qty = parseFloat(prev.qty) || 1;
          next.price = qty > 0 ? String(+(val / qty).toFixed(4)) : prev.price;
        } else {
          const price = parseFloat(prev.price) || 0;
          next.qty = price > 0 ? String(+(val / price).toFixed(4)) : prev.qty;
        }
      } else if (field === "price") {
        const qty = parseFloat(prev.qty) || 1;
        next.total = String(+(val * qty).toFixed(2));
      } else if (field === "qty") {
        const price = parseFloat(prev.price) || 0;
        next.total = String(+(val * price).toFixed(2));
      }
      return next;
    });
  };
  const applyConverter = () => {
    const { item, price, qty } = converterModal;
    const newPrice = parseFloat(price);
    const newQty = parseFloat(qty);
    if (isNaN(newPrice) || newPrice < 0 || isNaN(newQty) || newQty <= 0) {
      addToast("Invalid values", "error");
      return;
    }
    const allowNegative = !shouldStopNegativeStock(settings);
    if (newQty > item.stock && !item.has_manufacturing_rule && !allowNegative) {
      addToast("Not enough stock!", "error");
      return;
    }
    const newCart = activeSale.cart.map(
      (i) => i.cartItemId === item.cartItemId ? { ...i, price: newPrice, original_price: newPrice, qty: newQty, discount: 0 } : i
    );
    updateActiveSale({ cart: newCart });
    setConverterModal({ show: false, item: null, mode: "price", price: "", qty: "", total: "" });
    addToast("Item updated", "success");
  };
  const [isOnline2, setIsOnline] = useState(navigator.onLine);
  const [offlineSales, setOfflineSales] = useState([]);
  const [showSyncHub, setShowSyncHub] = useState(false);
  const {
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncErrors,
    checkPending,
    saveOfflineSale,
    syncPendingSales,
    getPendingSales,
    deletePendingSale
  } = useOfflineSync();
  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    const handleCsrfMismatch = () => {
      addToast("Security token refreshed. Please try saving again.", "warning");
    };
    window.addEventListener("amd:csrf-mismatch", handleCsrfMismatch);
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
      window.removeEventListener("amd:csrf-mismatch", handleCsrfMismatch);
    };
  }, []);
  const handleRecallOfflineSale = async (offlineSale) => {
    try {
      const newId = Math.max(...sales.map((s) => s.id), 1e3) + 1;
      setSales((prev) => [...prev, {
        id: newId,
        cart: offlineSale.data.cart || [],
        cashReceived: "",
        searchTerm: "",
        customer: offlineSale.data.party_id ? { id: offlineSale.data.party_id, name: offlineSale.data.customer_name || "Walk-in" } : null,
        isFromOffline: true
      }]);
      setActiveSaleId(newId);
      await deletePendingSale(offlineSale.id);
      setOfflineSales((prev) => prev.filter((s) => s.id !== offlineSale.id));
      setShowSyncHub(false);
      addToast("Offline sale loaded back to cart", "success");
    } catch (error) {
      console.error("Error recalling offline sale:", error);
      addToast("Failed to recall offline sale", "error");
    }
  };
  const loadOfflineSales = async () => {
    const sales2 = await getPendingSales();
    setOfflineSales(sales2);
    await checkPending();
  };
  const searchInputRef = useRef(null);
  const parkedDropdownRef = useRef(null);
  useRef(null);
  const cartListRef = useRef(null);
  const cashReceivedInputRef = useRef(null);
  useEffect(() => {
    sales.forEach((sale) => {
      const existing = posSessions.find((s) => s.id === sale.id);
      if (existing) {
        updatePosSession(sale.id, sale);
      }
    });
  }, [sales]);
  useEffect(() => {
    if (currentPosId && currentPosId !== activeSaleId) {
      setActiveSaleId(currentPosId);
    }
  }, [currentPosId]);
  useEffect(() => {
    localStorage.setItem("pos_print_on_complete", JSON.stringify(printOnComplete));
  }, [printOnComplete]);
  useEffect(() => {
    sessionStorage.setItem("pos_senior_mode", JSON.stringify(seniorMode));
    if (seniorMode) {
      document.documentElement.style.fontSize = "125%";
    } else {
      document.documentElement.style.fontSize = "100%";
    }
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [seniorMode]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchTerm.length >= 2) {
        searchCustomers(customerSearchTerm);
      } else {
        setCustomerResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchTerm]);
  useEffect(() => {
    const savedCart = localStorage.getItem("pos_cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          if (activeSale && activeSale.cart && activeSale.cart.length === 0) {
            updateActiveSale({ cart: parsedCart });
            addToast("🛒 Cart Rescue activated! Previous items restored.", "success");
          }
        }
      } catch (e) {
        console.error("Cart Rescue parse failed", e);
      }
    }
  }, []);
  useEffect(() => {
    if (activeSale && activeSale.cart) {
      if (activeSale.cart.length > 0) {
        localStorage.setItem("pos_cart", JSON.stringify(activeSale.cart));
      } else {
        localStorage.setItem("pos_cart", JSON.stringify(activeSale.cart));
      }
    }
  }, [activeSale?.cart]);
  const createNewSale = () => {
    const newSession = addPosSession({ discountType: "fixed", discountValue: 0 });
    setSales((prev) => [...prev, newSession]);
    setActiveSaleId(newSession.id);
  };
  const closeSale = async (e, id) => {
    e.stopPropagation();
    if (sales.length === 1) {
      const s = sales.find((s2) => s2.id === id);
      if (s && s.cart.length > 0) {
        const confirmed = await window.confirm("Closing this last tab will discard current items and exit. Continue?");
        if (!confirmed) return;
      }
      removePosSession(id);
      router.visit(route("store.dashboard", { store_slug: store?.slug }));
      return;
    }
    const newSales = sales.filter((s) => s.id !== id);
    setSales(newSales);
    removePosSession(id);
    if (activeSaleId === id) {
      setActiveSaleId(newSales[newSales.length - 1].id);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeSale.searchTerm.length >= 2) {
        performSearch(activeSale.searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [activeSale.searchTerm]);
  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      if (isOnline2) {
        const response = await axios.get(route("store.pos.search", { store_slug: store?.slug }), { params: { q: query } });
        setSearchResults(response.data.data || response.data || []);
      } else {
        const lowerQuery = query.toLowerCase();
        const results = await db.products.filter(
          (p) => p.name && p.name.toLowerCase().includes(lowerQuery) || p.sku && p.sku.toLowerCase().includes(lowerQuery) || p.barcode && p.barcode.includes(query)
        ).limit(50).toArray();
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search error:", error);
      try {
        const lowerQuery = query.toLowerCase();
        const results = await db.products.filter(
          (p) => p.name && p.name.toLowerCase().includes(lowerQuery) || p.sku && p.sku.toLowerCase().includes(lowerQuery) || p.barcode && p.barcode.includes(query)
        ).limit(50).toArray();
        setSearchResults(results);
      } catch (localError) {
        console.error("Local search failed:", localError);
      }
    } finally {
      setIsSearching(false);
    }
  };
  const handleProductSelect = (product) => {
    if ((product.available_stock ?? product.stock_quantity ?? 0) <= 0 && !product.has_manufacturing_rule) {
      if (!window.confirm(`Warning: ${product.reserved_quantity || 0} units are reserved for pre-orders. Available: ${product.available_stock || 0}. Selling this will put reservations into backorder. Continue?`)) {
        updateActiveSale({ searchTerm: "" });
        setSearchResults([]);
        if (searchInputRef.current) searchInputRef.current.focus();
        return;
      }
    }
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForVariant(product);
      setVariantModalOpen(true);
    } else {
      addToCart(product);
    }
    updateActiveSale({ searchTerm: "" });
    setSearchResults([]);
    if (searchInputRef.current) searchInputRef.current.focus();
  };
  const addToCart = (product, variant = null) => {
    const currentCart = activeSale.cart;
    const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}`;
    const existing = currentCart.find((item) => item.cartItemId === cartItemId);
    let newCart;
    const price = variant ? getProductPrice(variant, 1, settings) : getProductPrice(product, 1, settings);
    const name = variant ? `${product.name} (${variant.sku})` : product.name;
    const stock = variant ? variant.stock_quantity : product.stock_quantity;
    if (existing) {
      const newQty = existing.qty + 1;
      const canAutoManufacture = product.has_manufacturing_rule === true;
      if (newQty > stock && !canAutoManufacture) {
        const allowNegative = !shouldStopNegativeStock(settings);
        if (!allowNegative) {
          showAlert(
            "Not Enough Stock",
            `Cannot add more "${name}" — available stock is ${stock} unit(s). Negative stocking is currently disabled. To allow selling beyond available stock, enable "Allow Negative Stock" in Settings.`,
            "warning"
          );
          return;
        } else {
          addToast(`Warning: ${name} stock will be negative!`, "warning");
        }
      } else if (newQty > stock && canAutoManufacture) {
        addToast(`🏭 ${name} will be auto-manufactured`, "info");
      }
      newCart = currentCart.map((item) => item.cartItemId === cartItemId ? { ...item, qty: newQty } : item);
    } else {
      const canAutoManufacture = product.has_manufacturing_rule === true;
      if (stock < 1 && !canAutoManufacture) {
        const allowNegative = !shouldStopNegativeStock(settings);
        if (!allowNegative) {
          showAlert(
            "Out of Stock",
            `"${name}" has no remaining stock. Negative stocking is currently disabled. To allow selling beyond available stock, enable "Allow Negative Stock" in Settings.`,
            "warning"
          );
          return;
        } else {
          addToast(`Warning: ${name} stock is out (Qty: ${stock})!`, "warning");
        }
      } else if (stock < 1 && canAutoManufacture) {
        addToast(`🏭 ${name} will be auto-manufactured from ingredients`, "info");
      }
      newCart = [...currentCart, {
        cartItemId,
        id: product.id,
        variant_id: variant ? variant.id : null,
        name,
        price,
        original_price: price,
        discount: 0,
        qty: 1,
        freeQuantity: 0,
        stock,
        has_manufacturing_rule: product.has_manufacturing_rule || false,
        // Store for updateQty checks
        image: product.image_url || product.image_path || null,
        // Robust image path mapping
        category: product.category?.name || "General",
        wholesale_price: product.wholesale_price,
        wholesale_min_quantity: product.wholesale_min_quantity
      }];
    }
    updateActiveSale({ cart: newCart });
    setLastAddedItemId(cartItemId);
    setVariantModalOpen(false);
    setSelectedProductForVariant(null);
  };
  const handleSearchInputKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    const val = activeSale.searchTerm.trim();
    if (!val) return;
    if (val.length >= 4 && !/\s/.test(val)) {
      setIsSearching(true);
      try {
        if (isOnline2) {
          const response = await axios.get(route("store.pos.barcode", { store_slug: store?.slug, code: val }));
          if (response.data.found) {
            const product = response.data.product;
            const variantId = response.data.variant_id;
            if (variantId && product.variants) {
              const variant = product.variants.find((v) => v.id === variantId);
              addToCart(product, variant);
            } else {
              handleProductSelect(product);
            }
            updateActiveSale({ searchTerm: "" });
            setIsSearching(false);
            return;
          }
        } else {
          const exactMatch = await db.products.filter((p) => p.sku === val || p.barcode === val).first();
          if (exactMatch) {
            handleProductSelect(exactMatch);
            updateActiveSale({ searchTerm: "" });
            setIsSearching(false);
            return;
          }
        }
      } catch (err) {
        console.error("Barcode exact match lookup failed, falling back to general search:", err);
      } finally {
        setIsSearching(false);
      }
    }
    setIsSearching(true);
    try {
      let results = [];
      if (isOnline2) {
        const response = await axios.get(route("store.inventory.search", { store_slug: store?.slug }), { params: { query: val } });
        results = response.data;
      } else {
        results = await db.products.filter((p) => p.sku === val || p.barcode === val).toArray();
      }
      const exactMatch = results.find((p) => p.sku === val || p.barcode === val);
      if (exactMatch) {
        handleProductSelect(exactMatch);
      } else if (results.length === 1) {
        handleProductSelect(results[0]);
      } else {
        if (results.length > 0) {
          setSearchResults(results);
        } else {
          addToast("No product found", "warning");
        }
      }
    } catch (error) {
      console.error(error);
      try {
        const results = await db.products.filter((p) => p.sku === val || p.barcode === val).toArray();
        const exactMatch = results.find((p) => p.sku === val || p.barcode === val);
        if (exactMatch) {
          handleProductSelect(exactMatch);
        } else if (results.length === 1) {
          handleProductSelect(results[0]);
        } else {
          addToast("No product found (offline)", "warning");
        }
      } catch (err) {
        console.error("Local scan lookup failed:", err);
      }
    } finally {
      setIsSearching(false);
    }
  };
  const removeFromCart = (cartItemId) => {
    const newCart = activeSale.cart.filter((item) => item.cartItemId !== cartItemId);
    updateActiveSale({ cart: newCart });
  };
  const updateQty = (cartItemId, delta) => {
    const newCart = activeSale.cart.map((item) => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.qty + delta);
        const canAutoManufacture = item.has_manufacturing_rule === true;
        if (newQty > item.stock && !canAutoManufacture) {
          const allowNegative = !shouldStopNegativeStock(settings);
          if (!allowNegative) {
            showAlert(
              "Not Enough Stock",
              `Cannot increase "${item.name}" quantity — only ${item.stock} unit(s) in stock. Negative stocking is currently disabled. To allow selling beyond available stock, enable "Allow Negative Stock" in Settings.`,
              "warning"
            );
            return item;
          } else {
            if (delta > 0) {
              addToast(`Warning: Selling ${item.name} beyond stock!`, "warning");
            }
          }
        }
        const newPrice = getProductPrice(item, newQty, settings);
        return { ...item, qty: newQty, price: newPrice };
      }
      return item;
    });
    updateActiveSale({ cart: newCart });
  };
  const updateFreeQty = (cartItemId, delta) => {
    const newCart = activeSale.cart.map((item) => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(0, (item.freeQuantity || 0) + delta);
        return { ...item, freeQuantity: newQty };
      }
      return item;
    });
    updateActiveSale({ cart: newCart });
  };
  const parsedTaxRates = (() => {
    try {
      return settings?.tax_rates ? typeof settings.tax_rates === "string" ? JSON.parse(settings.tax_rates) : settings.tax_rates : [
        { id: 1, name: "GST 18%", rate: 18, type: "percentage" },
        { id: 2, name: "VAT 5%", rate: 5, type: "percentage" }
      ];
    } catch (e) {
      return [];
    }
  })();
  const taxRate = activeSale.taxRate !== void 0 ? activeSale.taxRate : parseFloat(settings?.default_tax_rate || 0);
  const subtotal = activeSale.cart.reduce((acc, item) => acc + (item.key_price || item.price) * (item.qty + (item.freeQuantity || 0)), 0);
  const freeItemDiscounts = activeSale.cart.reduce((acc, item) => acc + (item.freeQuantity || 0) * (item.key_price || item.price), 0);
  const itemDiscounts = activeSale.cart.reduce((acc, item) => acc + (item.discount || 0), 0);
  let globalDiscount = 0;
  if (activeSale.discountType === "percentage") {
    globalDiscount = subtotal * (activeSale.discountValue || 0) / 100;
  } else {
    globalDiscount = parseFloat(activeSale.discountValue !== void 0 ? activeSale.discountValue : activeSale.discount || 0);
  }
  const totalDiscounts = freeItemDiscounts + itemDiscounts + globalDiscount;
  const taxableAmount = Math.max(0, subtotal - totalDiscounts);
  const taxAmount = taxableAmount * taxRate / 100;
  const rawCartTotal = taxableAmount + taxAmount;
  const cartTotal = roundTotal(rawCartTotal, settings);
  const changeDue = activeSale.cashReceived ? parseFloat(activeSale.cashReceived) - cartTotal : 0;
  const handleCheckoutClick = () => {
    if (activeSale.cart.length === 0) return;
    const rawTendered = activeSale.cashReceived;
    if (!rawTendered || parseFloat(rawTendered) <= 0) {
      addToast("Please enter the Amount Tendered first", "warning");
      if (cashReceivedInputRef.current) {
        cashReceivedInputRef.current.focus();
        cashReceivedInputRef.current.select();
        const container = document.getElementById("tour-pos-paid");
        if (container) {
          container.classList.add("animate-shake", "ring-2", "ring-rose-500");
          setTimeout(() => {
            container.classList.remove("animate-shake", "ring-2", "ring-rose-500");
          }, 500);
        }
      }
      return;
    }
    const tendered = parseFloat(rawTendered);
    const paymentData = {
      totalPaid: tendered,
      change: Math.max(0, tendered - cartTotal),
      payments: [{
        method: paymentMethod || "cash",
        amount: tendered,
        account_id: ["bank", "card", "online"].includes(paymentMethod) ? selectedBankAccountId : null
      }],
      notes: "",
      printReceipt: printOnComplete
    };
    handlePaymentComplete(paymentData);
  };
  const handleTenderedKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const rawTendered = activeSale.cashReceived;
      if (!rawTendered || parseFloat(rawTendered) <= 0) {
        updateActiveSale({ cashReceived: cartTotal });
        setTimeout(() => {
          handleCheckoutClick();
        }, 50);
      } else {
        handleCheckoutClick();
      }
    }
  };
  const handlePaymentComplete = (paymentData) => {
    setPaymentModalOpen(false);
    const paid = paymentData.totalPaid;
    const total = cartTotal;
    const excess = paid - total;
    if (excess > 0 && activeSale.customer && activeSale.customer.id) {
      setOverpaymentDetails({ amount: excess, customerName: activeSale.customer.name });
      setPendingPaymentData(paymentData);
      setShowOverpaymentModal(true);
      return;
    }
    processCheckout(paymentData, false);
  };
  const processCheckout = async (paymentData, addToLedger = false) => {
    setProcessingPayment(true);
    let remainingInvoiceTotal = cartTotal;
    const adjustedPayments = (paymentData.payments || []).map((p) => {
      const isCash = p.method === "cash";
      const originalAmount = parseFloat(p.amount) || 0;
      if (isCash) {
        const cashPortion = Math.min(originalAmount, remainingInvoiceTotal);
        remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - cashPortion);
        return { ...p, amount: cashPortion };
      } else {
        remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - originalAmount);
        return p;
      }
    });
    const payload = {
      items: activeSale.cart.map((item) => ({
        product_id: item.id,
        variant_id: item.variant_id,
        quantity: item.qty,
        free_quantity: item.freeQuantity || 0,
        price: item.original_price || item.price,
        discount: item.discount || 0,
        discount_type: item.discountType || "fixed"
      })),
      customer_id: activeSale.customer?.id || null,
      payment_method: "split",
      warehouse_id: selectedWarehouseId,
      payments: adjustedPayments,
      amount_paid: cartTotal,
      // Always count cartTotal as net paid internally
      tax: taxAmount,
      tax_rate: taxRate,
      discount: globalDiscount,
      notes: paymentData.notes,
      add_to_ledger: addToLedger,
      source: "pos",
      is_dropship: false
    };
    try {
      let responseData;
      if (isOnline2) {
        const response = await axios.post(route("store.sales.store", { store_slug: store?.slug }), payload);
        responseData = response.data;
      } else {
        throw new Error("Offline");
      }
      if (responseData.success) {
        finalizeSale(responseData, paymentData);
      }
    } catch (error) {
      console.log("Online checkout failed, trying offline...", error);
      const offlineSaved = await saveOfflineSale(payload);
      if (offlineSaved) {
        const offlineResponse = {
          success: true,
          reference: "OFFLINE-" + Date.now(),
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          is_offline: true
        };
        finalizeSale(offlineResponse, paymentData);
      } else {
        showAlert("Checkout Failed", "Could not save sale offline. Please check device storage.", "error");
      }
    } finally {
      setProcessingPayment(false);
      setShowOverpaymentModal(false);
    }
  };
  const finalizeSale = (data, paymentData) => {
    setLastSale({
      ...data,
      cart: activeSale.cart,
      total: cartTotal,
      cash: paymentData.totalPaid,
      change: paymentData.change
    });
    localStorage.removeItem("pos_cart");
    updateActiveSale({ cart: [], cashReceived: "", searchTerm: "", customer: null });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("amd:refresh-products"));
    }, 1e3);
    if (paymentData.printReceipt) {
      const saleForPrint = {
        ...data,
        items: activeSale.cart,
        total: cartTotal,
        amount_paid: paymentData.totalPaid,
        change: paymentData.change,
        customer: activeSale.customer,
        tax: taxAmount
      };
      const printType = settings?.default_print_type || "thermal";
      setTimeout(() => PrintService.quickPrint(saleForPrint, printType, settings), 500);
    }
    if (data.is_offline) {
      "Reference: " + data.reference + "\n\n⚠️ Saved Offline. Will sync when online.";
      addToast("Sale saved offline", "warning");
    } else {
      const totalItemsCount = activeSale.cart.reduce((acc, item) => acc + (item.qty + (item.freeQuantity || 0)), 0);
      const messageElement = /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5 py-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-950 p-6 rounded-2xl border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-slate-400 uppercase block tracking-widest mb-2", children: "Amount Paid" }),
          /* @__PURE__ */ jsx("span", { className: "text-5xl font-black text-emerald-450 dark:text-emerald-400 block animate-pulse whitespace-nowrap", children: formatCurrency(paymentData.totalPaid, store || settings) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-slate-400 uppercase block tracking-wider mb-1.5", children: "Change Due" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-indigo-400 block whitespace-nowrap", children: formatCurrency(paymentData.change, store || settings) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 text-center", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-slate-400 uppercase block tracking-wider mb-1.5", children: "Total Items" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-white block", children: totalItemsCount })
          ] })
        ] }),
        data.manufacturing_notifications && data.manufacturing_notifications.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-left bg-amber-500/15 p-3 rounded-xl border border-amber-500/30 text-xs text-amber-400", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold block mb-1", children: "📦 Auto-Manufacturing:" }),
          data.manufacturing_notifications.join("\n")
        ] })
      ] });
      if (store?.onboarding_step === "pos_tour") {
        router.post(
          route("store.onboarding.step", { store_slug: store?.slug }),
          { step: "pos_congratulations" },
          { preserveScroll: true }
        );
      } else {
        showAlert("Sale Completed!", messageElement, "success");
        const handleEnterDismiss = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setAlertState((prev) => {
              if (prev.show && prev.title === "Sale Completed!") {
                return { ...prev, show: false };
              }
              return prev;
            });
            document.removeEventListener("keydown", handleEnterDismiss);
            if (searchInputRef.current) searchInputRef.current.focus();
          }
        };
        document.addEventListener("keydown", handleEnterDismiss);
        setTimeout(() => {
          setAlertState((prev) => {
            if (prev.show && prev.title === "Sale Completed!") {
              return { ...prev, show: false };
            }
            return prev;
          });
          document.removeEventListener("keydown", handleEnterDismiss);
          if (searchInputRef.current) searchInputRef.current.focus();
        }, 3e4);
      }
    }
  };
  const searchCustomers = async (query) => {
    try {
      if (isOnline2) {
        const response = await axios.get(route("store.customers.search", { store_slug: store?.slug }), {
          params: { search: query }
        });
        setCustomerResults(response.data || []);
      } else {
        throw new Error("Offline");
      }
    } catch (error) {
      console.error("Customer search error, falling back locally:", error);
      try {
        const lowerQuery = query.toLowerCase();
        const localCustomers = await db.customers.filter(
          (c) => c.name && c.name.toLowerCase().includes(lowerQuery) || c.phone && c.phone.includes(query)
        ).toArray();
        setCustomerResults(localCustomers);
      } catch (localError) {
        console.error("Local customer search failed:", localError);
        setCustomerResults([]);
      }
    }
  };
  const selectCustomer = (customer) => {
    let updates = { customer };
    if (customer.default_discount && parseFloat(customer.default_discount) > 0) {
      updates.discountType = "percentage";
      updates.discountValue = parseFloat(customer.default_discount);
      addToast(`Applied ${customer.default_discount}% Customer Discount`, "success");
    } else {
      updates.discountType = "fixed";
      updates.discountValue = 0;
    }
    updateActiveSale(updates);
    setCustomerSearchTerm("");
    setCustomerResults([]);
    setCustomerDropdownOpen(false);
  };
  useEffect(() => {
    const loadInitialCustomers = async () => {
      try {
        if (isOnline2) {
          const response = await axios.get(route("store.customers.search", { store_slug: store?.slug }), { params: { search: "" } });
          setInitialCustomers((response.data || []).slice(0, 50));
        } else {
          throw new Error("Offline");
        }
      } catch (error) {
        console.error("Failed to load initial customers, falling back locally:", error);
        try {
          const localCustomers = await db.customers.limit(50).toArray();
          setInitialCustomers(localCustomers);
        } catch (localError) {
          console.error("Local initial customers load failed:", localError);
        }
      }
    };
    loadInitialCustomers();
  }, [isOnline2]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      ["INPUT", "TEXTAREA"].includes(e.target.tagName);
      e.target === searchInputRef.current;
      if (e.key === "F1") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "F11") {
        e.preventDefault();
        setCustomerDropdownOpen(true);
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        createNewSale();
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        closeSale(e, activeSaleId);
        return;
      }
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        const currentIndex = sales.findIndex((s) => s.id === activeSaleId);
        let nextIndex;
        if (e.shiftKey) {
          nextIndex = (currentIndex - 1 + sales.length) % sales.length;
        } else {
          nextIndex = (currentIndex + 1) % sales.length;
        }
        setActiveSaleId(sales[nextIndex].id);
        return;
      }
      const targetItem = activeSale.cart.find((i) => i.cartItemId === lastAddedItemId) || activeSale.cart[activeSale.cart.length - 1];
      if (targetItem) {
        if (e.key === "F2") {
          e.preventDefault();
          showInput(`Qty: ${targetItem.name}`, "Enter new quantity", (val) => {
            const qty = parseFloat(val);
            if (!isNaN(qty) && qty > 0) {
              const newCart = activeSale.cart.map(
                (i) => i.cartItemId === targetItem.cartItemId ? { ...i, qty } : i
              );
              updateActiveSale({ cart: newCart });
              addToast(`Quantity updated to ${qty}`, "success");
            }
          });
        }
        if (e.key === "F3") {
          e.preventDefault();
          const currentOriginal = targetItem.original_price || targetItem.price;
          showInput(`Discount: ${targetItem.name}`, `Enter discount amount (Max: ${currentOriginal})`, (val) => {
            const discountAmount = parseFloat(val);
            if (!isNaN(discountAmount) && discountAmount >= 0 && discountAmount <= currentOriginal) {
              const newCart = activeSale.cart.map(
                (i) => i.cartItemId === targetItem.cartItemId ? {
                  ...i,
                  price: currentOriginal - discountAmount,
                  discount: discountAmount,
                  original_price: currentOriginal
                } : i
              );
              updateActiveSale({ cart: newCart });
            }
          });
        }
        if (e.key === "F4") {
          e.preventDefault();
          removeFromCart(targetItem.cartItemId);
          addToast(`Removed ${targetItem.name}`, "info");
        }
        if (e.key === "F5") {
          e.preventDefault();
          showInput(`Price: ${targetItem.name}`, "Enter new unit price", (val) => {
            const newPrice = parseFloat(val);
            if (!isNaN(newPrice) && newPrice >= 0) {
              const newCart = activeSale.cart.map(
                (i) => i.cartItemId === targetItem.cartItemId ? { ...i, price: newPrice, original_price: newPrice, discount: 0 } : i
              );
              updateActiveSale({ cart: newCart });
            }
          });
        }
        if (e.key === "F6") {
          e.preventDefault();
          addToast("Change Unit feature coming soon!", "info");
        }
      }
      if (e.key === "F7") {
        e.preventDefault();
        showInput("Override Tax (%)", "Enter tax percentage", (val) => {
          const rate = parseFloat(val);
          if (!isNaN(rate)) {
            updateActiveSale({ taxRate: rate });
            addToast(`Tax rate set to ${rate}%`, "success");
          }
        });
      }
      if (e.key === "F8") {
        e.preventDefault();
        showInput("Additional Charges", "Enter charge amount", (val) => {
          const charge = parseFloat(val);
          if (!isNaN(charge)) {
            updateActiveSale({ additionalCharges: charge });
            addToast(`Additional charge of ${formatCurrency(charge, store || settings)} added`, "success");
          }
        });
      }
      if (e.key === "F9") {
        e.preventDefault();
        showInput("Apply Bill Discount", "Enter discount amount", (val) => {
          const disc = parseFloat(val);
          if (!isNaN(disc)) {
            updateActiveSale({ discount: disc });
            addToast(`Bill discount of ${formatCurrency(disc, store || settings)} applied`, "success");
          }
        });
      }
      if (e.key === "F10") {
        e.preventDefault();
        addToast("Loyalty points system not configured.", "warning");
      }
      if (e.key === "F12") {
        e.preventDefault();
        showInput("Sale Remarks", "Enter internal notes for this sale", (val) => {
          updateActiveSale({ remarks: val });
        });
      }
      if (e.ctrlKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        showConfirm("Reset Tab", "This will clear all items and customer data. Continue?", () => {
          updateActiveSale({ cart: [], customer: null, discount: 0, remarks: "", additionalCharges: 0, taxRate: null });
          addToast("Tab reset successfully.", "info");
        }, true);
      }
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        showAlert("Bill Breakup", `
                    Subtotal: ${formatCurrency(subtotal, store || settings)}
                    Discount: ${formatCurrency(totalDiscounts, store || settings)}
                    Taxable: ${formatCurrency(taxableAmount, store || settings)}
                    Tax: ${formatCurrency(taxAmount, store || settings)}
                    --------------------
                    Total: ${formatCurrency(cartTotal, store || settings)}
                `, "info");
      }
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          const paymentData = {
            totalPaid: cartTotal,
            change: 0,
            payments: [{ method: paymentMethod || "cash", amount: cartTotal }],
            notes: activeSale.remarks || "",
            printReceipt: false
          };
          processCheckout(paymentData, false);
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          const paymentData = {
            totalPaid: cartTotal,
            change: 0,
            payments: [{ method: paymentMethod || "cash", amount: cartTotal }],
            notes: activeSale.remarks || "",
            printReceipt: true
          };
          processCheckout(paymentData, false);
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          const paymentData = {
            totalPaid: cartTotal,
            change: 0,
            payments: [{ method: paymentMethod || "cash", amount: cartTotal }],
            notes: activeSale.remarks || "",
            printReceipt: printOnComplete
          };
          processCheckout(paymentData, false).then(() => createNewSale());
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setShowQuickPartyModal(true);
      }
      if (e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      }
      if (e.ctrlKey && e.key === "1") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          setLastAddedItemId(activeSale.cart[0].cartItemId);
          addToast(`Selected ${activeSale.cart[0].name}`, "info");
        }
      }
      if (e.ctrlKey && e.key === "9") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          const lastIdx = activeSale.cart.length - 1;
          setLastAddedItemId(activeSale.cart[lastIdx].cartItemId);
          addToast(`Selected ${activeSale.cart[lastIdx].name}`, "info");
        }
      }
      if (e.key === "Escape") {
        if (activeSale.searchTerm) {
          updateActiveSale({ searchTerm: "" });
        } else {
          setSearchResults([]);
          setCustomerDropdownOpen(false);
          setParkedDropdownOpen(false);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeSale, sales, lastSale, lastAddedItemId, paymentMethod]);
  const loadParkedSales = async () => {
    try {
      const response = await axios.get(route("store.sales.parked", { store_slug: store?.slug }));
      setParkedSales(response.data.parked_sales || []);
    } catch (error) {
      console.error("Error loading parked sales:", error);
    }
  };
  const handleParkBill = async () => {
    if (activeSale.cart.length === 0) {
      showAlert("Empty Cart", "Cart is empty! Nothing to park.", "warning");
      return;
    }
    const processPark = async (customerName) => {
      setParkingBill(true);
      try {
        const response = await axios.post(route("store.sales.park", { store_slug: store?.slug }), {
          cart_data: activeSale.cart,
          customer_name: customerName || "Walk-in Customer"
        });
        if (response.data.success) {
          closeSale({ stopPropagation: () => {
          } }, activeSaleId);
          await loadParkedSales();
          addToast("Bill parked successfully!", "success");
        }
      } catch (error) {
        console.error("Error parking bill:", error);
        addToast("Failed to park bill: " + (error.response?.data?.message || error.message), "error");
      } finally {
        setParkingBill(false);
      }
    };
    showInput("Park Bill", "Enter customer name (optional):", processPark);
  };
  const handleRecallSale = async (parkedSaleId) => {
    try {
      const response = await axios.get(route("store.sales.recall", { store_slug: store?.slug, id: parkedSaleId }));
      if (response.data.success) {
        const parkedData = response.data.parked_sale;
        const newId = Math.max(...sales.map((s) => s.id), 1e3) + 1;
        setSales((prev) => [...prev, {
          id: newId,
          cart: parkedData.cart_data,
          cashReceived: "",
          searchTerm: "",
          customer: parkedData.customer_name ? { name: parkedData.customer_name } : null,
          parkedSaleId: parkedData.id
          // Track which parked sale this is
        }]);
        setActiveSaleId(newId);
        setParkedDropdownOpen(false);
        addToast(`Loaded parked sale for ${parkedData.customer_name}`, "success");
      }
    } catch (error) {
      if (error.response?.status === 410) {
        showAlert("Expired", "This parked sale has expired!", "error");
        loadParkedSales();
      } else {
        console.error("Error recalling sale:", error);
        addToast("Failed to recall sale: " + (error.response?.data?.message || error.message), "error");
      }
    }
  };
  const handleDeleteParked = async (parkedSaleId, e) => {
    e.stopPropagation();
    showConfirm("Delete Parked Sale", "Are you sure you want to delete this parked sale?", async () => {
      try {
        await axios.delete(route("store.sales.parked.delete", { store_slug: store?.slug, id: parkedSaleId }));
        await loadParkedSales();
        addToast("Parked sale deleted", "success");
      } catch (error) {
        console.error("Error deleting parked sale:", error);
        addToast("Failed to delete: " + (error.response?.data?.message || error.message), "error");
      }
    }, true);
  };
  const loadCategories = async () => {
    try {
      if (isOnline2) {
        const response = await axios.get(route("store.pos.categories", { store_slug: store?.slug }));
        setCategories(response.data.data || response.data || []);
      } else {
        throw new Error("Offline");
      }
    } catch (error) {
      console.error("Error loading categories, extracting locally:", error);
      try {
        const localProducts = await db.products.toArray();
        const categoriesMap = {};
        localProducts.forEach((p) => {
          if (p.category) {
            const catId = p.category.id || p.category_id;
            const catName = p.category.name || p.category_name || "General";
            categoriesMap[catId] = {
              id: catId,
              name: catName,
              products_count: (categoriesMap[catId]?.products_count || 0) + 1,
              product_count: (categoriesMap[catId]?.product_count || 0) + 1
            };
          }
        });
        const sorted = Object.values(categoriesMap).sort((a, b) => {
          if (a.name === "Phones") return -1;
          if (b.name === "Phones") return 1;
          return a.name.localeCompare(b.name);
        });
        setCategories(sorted);
      } catch (localError) {
        console.error("Failed to load local categories:", localError);
        setCategories([]);
      }
    }
  };
  const fetchCategoryProducts = async (catId) => {
    setIsLoadingProducts(true);
    try {
      if (isOnline2) {
        let response;
        if (catId) {
          response = await axios.get(route("store.pos.search", { store_slug: store?.slug }), {
            params: { category_id: catId, q: "" }
          });
        } else {
          response = await axios.get(route("store.pos.featured", { store_slug: store?.slug }));
        }
        const productsArray = Array.isArray(response.data) ? response.data : response.data && Array.isArray(response.data.data) ? response.data.data : [];
        setCategoryProducts(productsArray);
      } else {
        throw new Error("Offline");
      }
    } catch (error) {
      console.error("Error loading category products, falling back locally:", error);
      try {
        let localProducts = [];
        if (catId) {
          localProducts = await db.products.filter((p) => p.category_id === catId || p.category && p.category.id === catId).toArray();
        } else {
          localProducts = await db.products.limit(50).toArray();
        }
        setCategoryProducts(localProducts);
      } catch (localError) {
        console.error("Failed to load local products:", localError);
        setCategoryProducts([]);
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };
  const lookupSaleForReturn = async () => {
    if (!returnSaleRef.trim()) return;
    setReturnSaleLoading(true);
    try {
      const response = await axios.get(route("store.sales.lookup", { store_slug: store?.slug }), {
        params: { ref: returnSaleRef.trim() },
        headers: { "Accept": "application/json" }
      });
      const sale = response.data;
      if (!sale || !sale.id) {
        addToast(`Sale "${returnSaleRef}" not found.`, "error");
        setReturnSaleId(null);
        return;
      }
      if (!sale.items || sale.items.length === 0) {
        addToast("Sale found but has no items.", "error");
        setReturnSaleId(null);
        return;
      }
      setReturnSaleId(sale.id);
      const mappedCart = sale.items.map((item) => ({
        cartItemId: Date.now() + Math.random(),
        id: item.product_id,
        sale_item_id: item.id,
        name: item.product?.name || "Unknown Product",
        price: parseFloat(item.unit_price),
        qty: parseFloat(item.quantity),
        freeQuantity: parseFloat(item.free_quantity || 0),
        unit: item.product?.unit || "pcs",
        tax_rate: parseFloat(item.tax_rate || 0),
        discount: parseFloat(item.discount || 0),
        original_price: parseFloat(item.unit_price)
      }));
      updateActiveSale({ cart: mappedCart, customer: sale.customer || null });
      addToast(`Sale #${returnSaleRef} loaded for return`, "info");
    } catch (err) {
      console.error("Return lookup error:", err?.response?.status, err?.response?.data, err?.message);
      addToast("Error looking up sale: " + (err?.response?.data?.message || err?.message || "Unknown error"), "error");
      setReturnSaleId(null);
    } finally {
      setReturnSaleLoading(false);
    }
  };
  useEffect(() => {
    fetchCategoryProducts(selectedCategory);
  }, [selectedCategory, isOnline2]);
  useEffect(() => {
    const handleRefresh = () => {
      fetchCategoryProducts(selectedCategory);
    };
    window.addEventListener("amd:refresh-products", handleRefresh);
    return () => window.removeEventListener("amd:refresh-products", handleRefresh);
  }, [selectedCategory]);
  useEffect(() => {
    loadParkedSales();
    loadCategories();
  }, []);
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable);
      if (!isInputFocused && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const searchInput = document.querySelector("#tour-pos-product input");
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);
  useEffect(() => {
    if (cartListRef.current) {
      cartListRef.current.scrollTo({
        top: cartListRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [activeSale.cart.length]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (parkedDropdownRef.current && !parkedDropdownRef.current.contains(event.target)) {
        setParkedDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const getTimeRemaining = (expiresAt) => {
    const now = /* @__PURE__ */ new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    if (diffMs <= 0) return "Expired";
    const hours = Math.floor(diffMs / (1e3 * 60 * 60));
    const minutes = Math.floor(diffMs % (1e3 * 60 * 60) / (1e3 * 60));
    return `${hours}h ${minutes}m`;
  };
  useEffect(() => {
    const isEnabled = settings?.pos_auto_fill_cash === "1" || settings?.pos_auto_fill_cash === true || settings?.pos_auto_fill_cash === 1;
    if (isEnabled && paymentMethod === "cash" && activeSale.cart.length > 0) {
      updateActiveSale({ cashReceived: cartTotal });
    }
  }, [cartTotal, paymentMethod, settings?.pos_auto_fill_cash]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "h-full w-full flex flex-col pl-3 pr-0 pb-0 pt-3 animate-in fade-in zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsxs("div", { className: "h-10 flex items-end gap-1 shrink-0 px-2 select-none", children: [
        sales.map((sale) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => setActiveSaleId(sale.id),
            className: `
                            group relative min-w-[160px] max-w-[240px] h-9 px-4 rounded-t-xl flex items-center justify-between cursor-pointer transition-all duration-200
                            ${activeSaleId === sale.id ? "bg-white dark:bg-slate-900 text-indigo-600 font-bold shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10 h-10 pb-1" : "bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 mb-1"}
                        `,
            children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs truncate flex-1", children: [
                "Sale #",
                sale.id
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => closeSale(e, sale.id),
                  className: `ml-1 flex items-center justify-center w-5 h-5 rounded-md transition-all ${activeSaleId === sale.id ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 opacity-100" : "opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"}`,
                  children: /* @__PURE__ */ jsx(X, { size: 10, strokeWidth: 3 })
                }
              ),
              activeSaleId === sale.id && /* @__PURE__ */ jsx("div", { className: "absolute -bottom-1 left-0 right-0 h-2 bg-white dark:bg-slate-900 z-20" })
            ]
          },
          sale.id
        )),
        /* @__PURE__ */ jsx("button", { onClick: createNewSale, className: "h-8 w-8 mb-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors", children: /* @__PURE__ */ jsx(Plus, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { className: "ml-auto mr-2 relative flex items-center gap-2", ref: parkedDropdownRef, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSeniorMode(!seniorMode),
              className: `h-8 px-3 rounded-full flex items-center gap-1.5 transition-all text-xs font-bold border ${seniorMode ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 border-transparent"}`,
              title: "Toggle Senior Mode for larger text",
              children: [
                /* @__PURE__ */ jsxs("span", { className: "relative flex h-2 w-2", children: [
                  seniorMode && /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" }),
                  /* @__PURE__ */ jsx("span", { className: `relative inline-flex rounded-full h-2 w-2 ${seniorMode ? "bg-indigo-500" : "bg-slate-400"}` })
                ] }),
                /* @__PURE__ */ jsx("span", { children: "Senior Mode" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                const entering = !returnMode;
                setReturnMode(entering);
                setReturnSaleRef("");
                setReturnSaleId(null);
                if (entering && posReturnMode !== "open") {
                  updateActiveSale({ cart: [], customer: null });
                }
              },
              className: `h-8 px-3 rounded-full flex items-center gap-1.5 transition-all text-xs font-bold border ${returnMode ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 border-transparent"}`,
              title: "Toggle Return Mode",
              children: [
                /* @__PURE__ */ jsxs("span", { className: "relative flex h-2 w-2", children: [
                  returnMode && /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" }),
                  /* @__PURE__ */ jsx("span", { className: `relative inline-flex rounded-full h-2 w-2 ${returnMode ? "bg-red-500" : "bg-slate-400"}` })
                ] }),
                /* @__PURE__ */ jsx("span", { children: "Return Mode" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                setParkedDropdownOpen(!parkedDropdownOpen);
                if (!parkedDropdownOpen) loadParkedSales();
              },
              className: "h-8 px-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center gap-2 transition-colors text-xs font-bold",
              children: [
                /* @__PURE__ */ jsx(Pause, { size: 14 }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Parked (",
                  parkedSales.length,
                  ")"
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isOnline2 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`, children: [
            isOnline2 ? /* @__PURE__ */ jsx(Wifi, { size: 14 }) : /* @__PURE__ */ jsx(WifiOff, { size: 14 }),
            /* @__PURE__ */ jsx("span", { children: isOnline2 ? "Online" : "Offline" })
          ] }),
          pendingCount > 0 && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                setShowSyncHub(true);
                loadOfflineSales();
              },
              className: "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-bounce hover:bg-amber-200 transition-colors",
              children: [
                /* @__PURE__ */ jsx(Clock, { size: 14 }),
                /* @__PURE__ */ jsxs("span", { children: [
                  pendingCount,
                  " Offline Sales"
                ] })
              ]
            }
          ),
          parkedDropdownOpen && /* @__PURE__ */ jsxs("div", { className: "absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white text-sm", children: "Parked Sales" }) }),
            parkedSales.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-slate-400 text-xs", children: "No parked sales found." }) : /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-y-auto", children: parkedSales.map((parked) => /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => handleRecallSale(parked.id),
                className: "p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: parked.customer_name || "Walk-in Customer" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                        parked.items_count,
                        " ",
                        parked.items_count === 1 ? "item" : "items",
                        " · ",
                        formatCurrency(parked.total || 0, store || settings)
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: (e) => handleDeleteParked(parked.id, e),
                        className: "p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-600 transition-colors",
                        children: /* @__PURE__ */ jsx(X, { size: 14 })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
                    /* @__PURE__ */ jsx(Clock, { size: 12, className: "text-amber-500" }),
                    /* @__PURE__ */ jsx("span", { className: `font-medium ${getTimeRemaining(parked.expires_at).includes("Expired") ? "text-red-500" : "text-amber-600 dark:text-amber-400"}`, children: getTimeRemaining(parked.expires_at).includes("Expired") ? "Expired" : `Expires in ${getTimeRemaining(parked.expires_at)}` })
                  ] })
                ]
              },
              parked.id
            )) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0", children: [["catalog", "Catalog"], ["cart", "Cart"], ["checkout", "Pay"]].map(([tab, label]) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveMobileTab(tab),
          className: `flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors
                            ${activeMobileTab === tab ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 dark:text-slate-400"}`,
          children: label
        },
        tab
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex gap-0 min-h-0 bg-slate-50 dark:bg-slate-950 rounded-t-3xl rounded-b-none shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden z-0 relative", children: [
        /* @__PURE__ */ jsxs("div", { className: `w-full lg:w-[40%] flex flex-col min-w-0 relative ${activeMobileTab !== "catalog" ? "hidden lg:flex" : ""}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "h-14 px-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 relative z-20", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setSearchQueryForProduct(activeSale.searchTerm);
                  setShowProductModal(true);
                },
                className: "w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-colors shrink-0",
                title: "Quick Add Product",
                children: /* @__PURE__ */ jsx(PackagePlus, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsxs("div", { id: "tour-pos-product", className: "flex-1 relative", children: [
              /* @__PURE__ */ jsx(
                AsyncProductCombobox,
                {
                  defaultOptions: categoryProducts,
                  value: activeSale.searchTerm,
                  onQueryChange: (val) => updateActiveSale({ searchTerm: val }),
                  onSelect: (product) => handleProductSelect(product),
                  placeholder: "Scan Barcode or Search Item...",
                  onKeyDown: handleSearchInputKeyDown,
                  inputClassName: "pl-9 pr-9 h-9 text-sm font-bold",
                  onCreateNew: () => {
                    setSearchQueryForProduct(activeSale.searchTerm);
                    setShowProductModal(true);
                  },
                  hideCostAndMargin: true,
                  hideSearchIcon: true
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10", children: /* @__PURE__ */ jsx(ScanBarcode, { size: 16 }) }),
              /* @__PURE__ */ jsx("div", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10", children: /* @__PURE__ */ jsx(Search, { size: 16 }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2 gap-2 select-none shrink-0 relative", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => scrollCategories("left"),
                  className: "w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm",
                  children: /* @__PURE__ */ jsx(ChevronLeft, { size: 14 })
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  ref: categoryScrollRef,
                  onWheel: handleCategoryWheel,
                  className: "flex-1 flex gap-2 overflow-x-auto scrollbar-none scroll-smooth px-1",
                  style: { msOverflowStyle: "none", scrollbarWidth: "none" },
                  children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setSelectedCategory(null),
                        className: `px-3 py-1.5 rounded-full text-[11px] font-black transition-all shrink-0 border ${selectedCategory === null ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"}`,
                        children: "All"
                      }
                    ),
                    categories.filter((cat) => cat.products_count > 0 || cat.product_count > 0).map((cat) => /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => setSelectedCategory(cat.id),
                        className: `px-3 py-1.5 rounded-full text-[11px] font-black transition-all shrink-0 border flex items-center gap-1.5 ${selectedCategory === cat.id ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"}`,
                        children: [
                          /* @__PURE__ */ jsx("span", { children: cat.name }),
                          /* @__PURE__ */ jsx("span", { className: `text-[9px] px-1 py-0.2 rounded-full shrink-0 ${selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`, children: cat.products_count ?? cat.product_count ?? 0 })
                        ]
                      },
                      cat.id
                    ))
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => scrollCategories("right"),
                  className: "w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm",
                  children: /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar", children: isLoadingProducts ? /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-slate-400 gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-sm", children: "Loading products..." })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              selectedCategory && categoryProducts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-20 text-center", children: [
                /* @__PURE__ */ jsx(Archive, { className: "mx-auto text-slate-300 mb-4", size: 48 }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 font-bold", children: "No products in this category" })
              ] }) : Array.isArray(categoryProducts) && categoryProducts.map((product) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    if (returnMode && posReturnMode !== "open") {
                      addToast("In Return Mode, use the reference number to load items.", "error");
                      return;
                    }
                    handleProductSelect(product);
                  },
                  className: "w-full bg-white dark:bg-slate-800 rounded-2xl border-2 border-transparent hover:border-indigo-500 transition-all shadow-sm hover:shadow-md text-left flex items-center justify-between p-3 gap-3 active:scale-98 relative overflow-hidden",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0", children: product.image_url || product.image_path ? /* @__PURE__ */ jsx("img", { src: product.image_url || product.image_path, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Package, { className: "text-slate-400", size: 20 }) }),
                      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                        /* @__PURE__ */ jsx("h4", { className: "font-black text-slate-800 dark:text-white leading-snug break-words text-lg", children: product.name }),
                        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5", children: product.category?.name || product.category_name || "General" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0 flex items-center gap-4", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("span", { className: "text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5 leading-none", children: "Stock" }),
                        /* @__PURE__ */ jsx("span", { className: `text-xs font-bold leading-none ${product.stock_quantity > 0 ? "text-emerald-500" : "text-red-500"}`, children: formatNumber(product.stock_quantity || 0, 0) })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "min-w-[75px]", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5 leading-none", children: "Price" }),
                        /* @__PURE__ */ jsx("span", { className: "font-black text-sky-500 dark:text-sky-400 block leading-none text-lg", children: formatCurrency(product.price || product.selling_price || 0, store || settings) })
                      ] })
                    ] }),
                    product.variants && product.variants.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute top-1.5 right-1.5 flex gap-1", children: /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" }) })
                  ]
                },
                product.id
              )),
              !selectedCategory && categoryProducts.length === 0 && /* @__PURE__ */ jsxs("div", { className: "py-20 flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50", children: [
                /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-[2.5rem] bg-slate-200 dark:bg-slate-800 flex items-center justify-center", children: /* @__PURE__ */ jsx(Search, { size: 32 }) }),
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-black text-lg text-slate-600 dark:text-white", children: "Start Selling" }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Select a category or browse all items" })
                ] })
              ] })
            ] }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `w-full lg:w-[40%] shrink-0 flex flex-col bg-slate-50 dark:bg-slate-950 border-l border-slate-100 dark:border-slate-800 ${activeMobileTab !== "cart" ? "hidden lg:flex" : ""}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "h-14 px-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(ShoppingCart, { size: 18, className: "text-indigo-600" }),
                "CURRENT ORDER"
              ] }),
              hasDiscountPerm && /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer select-none", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: showFreeQty,
                      onChange: (e) => setShowFreeQty(e.target.checked),
                      className: "sr-only"
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: `w-8 h-4 rounded-full transition-colors ${showFreeQty ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}` }),
                  /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showFreeQty ? "translate-x-4" : ""}` })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500 dark:text-slate-400", children: "FREE QTY" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: `px-2 py-0.5 rounded-lg font-black text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400`, children: [
              activeSale.cart.length,
              " ITEMS • ",
              activeSale.cart.reduce((sum, item) => sum + item.qty + (item.freeQuantity || 0), 0),
              " QTY"
            ] })
          ] }),
          returnMode && /* @__PURE__ */ jsxs("div", { className: "mx-3 mb-2 mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-red-500 mb-2 uppercase tracking-wider", children: "⚠ Return Mode Active" }),
            posReturnMode === "open" ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-400 mb-2", children: "Add items to return. Optionally enter a reference number to link to the original sale." }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: returnSaleRef,
                    onChange: (e) => setReturnSaleRef(e.target.value),
                    onKeyDown: (e) => e.key === "Enter" && returnSaleRef.trim() && lookupSaleForReturn(),
                    placeholder: "Reference number (optional)...",
                    className: "flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 outline-none focus:border-red-400"
                  }
                ),
                returnSaleRef.trim() && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: lookupSaleForReturn,
                    disabled: returnSaleLoading,
                    className: "px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50",
                    children: returnSaleLoading ? "..." : "Load"
                  }
                )
              ] })
            ] }) : posReturnMode === "customer_or_reference" ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-400 mb-2", children: "Search by customer or enter a reference number." }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: returnSaleRef,
                    onChange: (e) => setReturnSaleRef(e.target.value),
                    onKeyDown: (e) => e.key === "Enter" && lookupSaleForReturn(),
                    placeholder: "Reference number or customer name/phone...",
                    className: "flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 outline-none focus:border-red-400"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: lookupSaleForReturn,
                    disabled: returnSaleLoading,
                    className: `px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 ${!returnSaleRef.trim() ? "animate-pulse" : ""}`,
                    children: returnSaleLoading ? "..." : "Load"
                  }
                )
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-400 mb-2", children: "Enter the original sale reference number to load items for return." }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: returnSaleRef,
                    onChange: (e) => setReturnSaleRef(e.target.value),
                    onKeyDown: (e) => e.key === "Enter" && lookupSaleForReturn(),
                    placeholder: "Enter sale reference number...",
                    className: "flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 outline-none focus:border-red-400"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: lookupSaleForReturn,
                    disabled: returnSaleLoading,
                    className: `px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 ${!returnSaleRef.trim() ? "animate-pulse" : ""}`,
                    children: returnSaleLoading ? "..." : "Load"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { ref: cartListRef, className: "flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2", children: [
            activeSale.cart.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 px-3 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between gap-3 text-xs relative group overflow-hidden", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center shrink-0", children: index + 1 }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("h4", { className: "font-black text-slate-900 dark:text-white text-sm leading-snug break-words", children: item.name }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 font-bold uppercase tracking-wider", children: item.category }),
                    item.qty > item.stock && /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-black text-red-500 bg-red-100 dark:bg-red-900/30 px-1 py-0.5 rounded animate-pulse", children: [
                      "⚠️ Over Stock (",
                      item.stock,
                      ")"
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end", children: [
                  hasDiscountPerm ? /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => openItemDiscountModal(item),
                      className: "text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex flex-col items-end min-w-[55px] leading-tight",
                      children: item.discount > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx("span", { className: "line-through text-[9px] text-slate-400 opacity-70", children: formatCurrency(item.original_price, store || settings) }),
                        /* @__PURE__ */ jsx("span", { children: formatCurrency(item.price, store || settings) })
                      ] }) : formatCurrency(item.price, store || settings)
                    }
                  ) : /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-slate-900 dark:text-white", children: formatCurrency(item.price, store || settings) }),
                  item.discount > 0 && /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5", children: [
                    "Disc: -",
                    formatCurrency(item.discount, store || settings)
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => openConverterModal(item),
                    title: "Edit Price / Qty / Total",
                    className: "text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all",
                    children: "⇄"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-100 dark:border-slate-800", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => updateQty(item.cartItemId, -1),
                      className: "w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-all active:scale-90",
                      children: /* @__PURE__ */ jsx(MinusCircle, { size: 15 })
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "w-7 text-center font-black text-xs text-slate-900 dark:text-white", children: item.qty }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => updateQty(item.cartItemId, 1),
                      className: "w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-all active:scale-90",
                      children: /* @__PURE__ */ jsx(PlusCircle, { size: 15 })
                    }
                  )
                ] }),
                hasDiscountPerm && showFreeQty && /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-emerald-50 dark:bg-emerald-900/20 p-0.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => updateFreeQty(item.cartItemId, -1),
                      className: "w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 text-emerald-600 dark:text-emerald-400 transition-all active:scale-90",
                      children: /* @__PURE__ */ jsx(MinusCircle, { size: 15 })
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center w-7 leading-none", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-black text-xs text-emerald-700 dark:text-emerald-400", children: item.freeQuantity || 0 }),
                    /* @__PURE__ */ jsx("span", { className: "text-[7px] font-bold text-emerald-500 uppercase", children: "FREE" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => updateFreeQty(item.cartItemId, 1),
                      className: "w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 text-emerald-600 dark:text-emerald-400 transition-all active:scale-90",
                      children: /* @__PURE__ */ jsx(PlusCircle, { size: 15 })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right min-w-[75px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[8px] font-black text-slate-400 uppercase tracking-wider block leading-none mb-0.5", children: "Line Total" }),
                  /* @__PURE__ */ jsx("span", { className: "font-black text-slate-900 dark:text-white text-sm block leading-none", children: formatCurrency(item.price * item.qty, store || settings) }),
                  (settings?.show_margin_percentage === "1" || settings?.show_margin_percentage === true) && item.cost_price > 0 && /* @__PURE__ */ jsxs("span", { className: "text-[8px] font-bold text-emerald-600 dark:text-emerald-400 block leading-none mt-0.5", children: [
                    "Margin: ",
                    Math.round((item.price - item.cost_price) / item.price * 100),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => removeFromCart(item.cartItemId),
                    className: "text-slate-400 hover:text-red-500 transition-colors p-1",
                    children: /* @__PURE__ */ jsx(Trash2, { size: 15 })
                  }
                )
              ] })
            ] }, item.cartItemId)),
            activeSale.cart.length === 0 && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-slate-400 opacity-40 py-20", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { size: 64, strokeWidth: 1, className: "mb-4" }),
              /* @__PURE__ */ jsx("p", { className: "font-black text-lg", children: "Your cart is empty" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Start adding products to create a sale" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `w-full lg:w-[20%] shrink-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col shadow-2xl relative overflow-hidden border-l border-slate-200 dark:border-slate-800 ${activeMobileTab !== "checkout" ? "hidden lg:flex" : ""}`, children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "h-14 px-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("h2", { className: "font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase", children: [
              /* @__PURE__ */ jsx(Receipt, { size: 18, className: "text-emerald-600 dark:text-emerald-400" }),
              " Payment Details"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-lg font-black text-[10px] bg-slate-200 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50", children: [
              "#",
              activeSale.id
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar", children: [
            /* @__PURE__ */ jsx("div", { id: "tour-pos-customer", className: "relative z-[60]", children: customerDropdownOpen ? /* @__PURE__ */ jsxs("div", { className: "animate-in slide-in-from-top-2 duration-200", children: [
              /* @__PURE__ */ jsx(
                AsyncPartyCombobox,
                {
                  defaultOptions: initialCustomers,
                  selectedItem: activeSale.customer,
                  onSelect: (customer) => {
                    selectCustomer(customer);
                    setCustomerDropdownOpen(false);
                  },
                  className: "h-full",
                  inputClassName: "bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-emerald-500/50 h-14 shadow-sm",
                  placeholder: "Search Customer (Name, Phone)...",
                  onQueryChange: (val) => setCustomerSearchTerm(val),
                  onCreateNew: () => setShowQuickPartyModal(true),
                  addNewLabel: "Add New Customer",
                  type: "customer",
                  onEdit: (customer) => {
                    setEditingCustomer(customer);
                    setShowQuickPartyModal(true);
                  }
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setCustomerDropdownOpen(false),
                  className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white",
                  children: /* @__PURE__ */ jsx(X, { size: 16 })
                }
              )
            ] }) : /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setCustomerDropdownOpen(true),
                className: "w-full bg-white dark:bg-white/5 p-4 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5 shadow-sm flex items-center justify-between group",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(User, { size: 20 }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase font-black text-slate-500 block mb-0.5", children: "Customer / Party" }),
                      /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-900 dark:text-white", children: activeSale.customer?.name || "Walk-in Customer" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(Search, { size: 18, className: "text-slate-500 group-hover:text-indigo-500 transition-colors" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              hasDiscountPerm && /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    setGlobalDiscountModal({
                      show: true,
                      type: activeSale.discountType || "fixed",
                      value: activeSale.discountValue ? String(activeSale.discountValue) : ""
                    });
                  },
                  className: "w-full bg-white dark:bg-white/5 p-3 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5 shadow-sm h-16 flex flex-col justify-center",
                  children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[9px] uppercase font-bold text-slate-500 block mb-0.5", children: "Discount" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-500 flex items-center justify-center text-[10px] font-bold", children: "%" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-900 dark:text-white truncate", children: activeSale.discountType === "percentage" ? `${activeSale.discountValue}% (${formatCurrency(globalDiscount, store || settings)})` : `${formatCurrency(globalDiscount, store || settings)}` })
                    ] })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxs("div", { className: "group relative h-full", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setPaymentDropdownOpen(!paymentDropdownOpen),
                    className: "w-full bg-white dark:bg-white/5 p-3 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5 shadow-sm h-16 flex flex-col justify-center",
                    children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[9px] uppercase font-bold text-slate-500 block mb-0.5", children: "Method" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsx(CreditCard, { size: 14, className: "text-indigo-600 dark:text-indigo-400 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase truncate", children: paymentMethod })
                      ] })
                    ]
                  }
                ),
                paymentDropdownOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-full right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[75] animate-in slide-in-from-top-2 duration-200", children: ["cash", "credit", "bank", "card", "online"].map((method) => {
                  if (method === "credit" && !activeSale.customer) return null;
                  return /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        setPaymentMethod(method);
                        setPaymentDropdownOpen(false);
                      },
                      className: `w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-105 dark:hover:bg-slate-700/60 transition-colors uppercase ${paymentMethod === method ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "text-slate-700 dark:text-slate-300"}`,
                      children: method
                    },
                    method
                  );
                }) })
              ] }) })
            ] }),
            ["bank", "card", "online"].includes(paymentMethod) && (bankAccounts.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2 px-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase font-black text-slate-500 block", children: "Deposit To Account" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setShowQuickAccountModal(true),
                    className: "text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors",
                    children: "+ Add New"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setBankAccountDropdownOpen(!bankAccountDropdownOpen),
                    className: "w-full bg-slate-800/50 border border-white/5 rounded-xl py-2.5 px-3 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none flex items-center justify-between cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxs("span", { children: [
                        bankAccounts.find((acc) => String(acc.id) === String(selectedBankAccountId))?.name || "Select Account",
                        bankAccounts.find((acc) => String(acc.id) === String(selectedBankAccountId))?.code ? ` (${bankAccounts.find((acc) => String(acc.id) === String(selectedBankAccountId))?.code})` : ""
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-bold ml-1", children: "▼" })
                    ]
                  }
                ),
                bankAccountDropdownOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[75] animate-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto", children: bankAccounts.map((acc) => /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setSelectedBankAccountId(acc.id);
                      setBankAccountDropdownOpen(false);
                    },
                    className: `w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-105 dark:hover:bg-slate-700/60 transition-colors ${String(selectedBankAccountId) === String(acc.id) ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "text-slate-700 dark:text-slate-300"}`,
                    children: [
                      acc.name,
                      " ",
                      acc.code ? `(${acc.code})` : ""
                    ]
                  },
                  acc.id
                )) })
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 animate-in shake duration-300", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                /* @__PURE__ */ jsx(AlertCircle, { size: 14, className: "text-rose-500" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-black text-rose-500", children: "No Bank Accounts Found" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 mb-3 leading-tight", children: "You need at least one bank/online account to receive digital payments." }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setShowQuickAccountModal(true),
                  className: "w-full bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 14 }),
                    /* @__PURE__ */ jsx("span", { children: "Create Bank Account" })
                  ]
                }
              )
            ] })),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 bg-slate-100 dark:bg-white/5 p-3 rounded-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-500 dark:text-slate-400 text-xs", children: [
                /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
                /* @__PURE__ */ jsx("span", { className: "text-slate-900 dark:text-white", children: formatCurrency(subtotal, store || settings) })
              ] }),
              totalDiscounts > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "Discount",
                  activeSale.discountType === "percentage" && ` (${activeSale.discountValue}%)`
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "-",
                  formatCurrency(totalDiscounts, store || settings)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs", children: [
                /* @__PURE__ */ jsx("span", { children: "Tax" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setTaxDropdownOpen(!taxDropdownOpen),
                        className: "bg-transparent hover:bg-slate-200 dark:hover:bg-white/10 px-2 py-1 rounded-lg text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors",
                        children: [
                          /* @__PURE__ */ jsx("span", { children: taxRate === 0 ? "None (0%)" : parsedTaxRates.find((t) => parseFloat(t.rate) === parseFloat(taxRate))?.name + ` (${taxRate}%)` || `${taxRate}%` }),
                          /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-[10px]", children: "▼" })
                        ]
                      }
                    ),
                    taxDropdownOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 bottom-full mb-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[75] animate-in slide-in-from-bottom-2 duration-200", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            updateActiveSale({ taxRate: 0 });
                            setTaxDropdownOpen(false);
                          },
                          className: `w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-105 dark:hover:bg-slate-700/60 transition-colors ${taxRate === 0 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "text-slate-700 dark:text-slate-300"}`,
                          children: "None (0%)"
                        }
                      ),
                      parsedTaxRates.map((tax) => /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            updateActiveSale({ taxRate: parseFloat(tax.rate) || 0 });
                            setTaxDropdownOpen(false);
                          },
                          className: `w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-105 dark:hover:bg-slate-700/60 transition-colors ${parseFloat(taxRate) === parseFloat(tax.rate) ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "text-slate-700 dark:text-slate-300"}`,
                          children: [
                            tax.name,
                            " (",
                            tax.rate,
                            "%)"
                          ]
                        },
                        tax.id
                      ))
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-900 dark:text-white font-bold", children: formatCurrency(taxAmount, store || settings) })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-200 dark:bg-white/10 my-1" }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-emerald-600 dark:text-emerald-400 text-2xl", children: [
                /* @__PURE__ */ jsx("span", { children: "Total" }),
                /* @__PURE__ */ jsx("span", { children: formatCurrency(cartTotal, store || settings) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxs("div", { id: "tour-pos-paid", className: "bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm transition-all", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5", children: returnMode ? "AMOUNT TO REFUND" : "Amount Tendered" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setPaymentModalOpen(true),
                      className: "text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider",
                      title: "Open multi-method split payment options",
                      children: "+ Split Payment"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold", children: paymentMethod.toUpperCase() })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-500 font-bold text-lg", children: getCurrencySymbol(store || settings) }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    ref: cashReceivedInputRef,
                    type: "number",
                    value: activeSale.cashReceived,
                    onChange: (e) => updateActiveSale({ cashReceived: e.target.value }),
                    onKeyDown: handleTenderedKeyDown,
                    placeholder: "0.00",
                    className: "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 pl-8 pr-4 text-2xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all no-spinner shadow-inner",
                    disabled: activeSale.cart.length === 0
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => updateActiveSale({ cashReceived: cartTotal }),
                    className: "absolute right-2 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-600 dark:text-slate-300 px-2 py-1 rounded transition-colors border border-slate-200 dark:border-slate-600 font-bold",
                    children: "Exact"
                  }
                )
              ] })
            ] }) }),
            !returnMode && /* @__PURE__ */ jsx("div", { className: `p-4 rounded-xl border transition-colors ${changeDue >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("span", { className: `text-xs font-bold uppercase ${changeDue >= 0 ? "text-emerald-650 dark:text-emerald-400" : "text-red-650 dark:text-red-400"}`, children: changeDue >= 0 ? "Change Due" : "Shortage" }),
              /* @__PURE__ */ jsx("span", { className: `text-2xl font-black ${changeDue >= 0 ? "text-emerald-650 dark:text-emerald-400" : "text-red-650 dark:text-red-400"}`, children: formatCurrency(Math.abs(changeDue), store || settings) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-100/50 dark:bg-black/20 backdrop-blur-sm space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Auto-print on complete" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setPrintOnComplete(!printOnComplete),
                  className: `relative w-12 h-6 rounded-full transition-colors ${printOnComplete ? "bg-emerald-500" : "bg-slate-600"}`,
                  children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 ${printOnComplete ? "right-1" : "left-1"} w-4 h-4 bg-white rounded-full transition-all` })
                }
              )
            ] }),
            returnMode ? /* @__PURE__ */ jsx(
              "button",
              {
                onClick: async () => {
                  if (activeSale.cart.length === 0) {
                    addToast("No items in cart", "error");
                    return;
                  }
                  setReturnProcessing(true);
                  try {
                    if (posReturnMode === "open") {
                      const response = await axios.post(route("store.pos.return.store", { store_slug: store?.slug }), {
                        items: activeSale.cart.map((i) => ({
                          product_id: i.id,
                          quantity: i.qty,
                          price: i.price
                        })),
                        refund_method: "cash",
                        reason: "POS Open Return"
                      });
                      addToast(`Return processed — Ref: ${response.data.reference}`, "success");
                      setReturnMode(false);
                      updateActiveSale({ cart: [], customer: null });
                    } else {
                      if (!returnSaleId) {
                        addToast("Please load a sale using the reference number first", "error");
                        setReturnProcessing(false);
                        return;
                      }
                      await axios.post(route("store.sales.return", { store_slug: store?.slug, sale: returnSaleId }), {
                        refund_method: "cash",
                        refund_source: "cash_drawer",
                        reason: "POS return",
                        items: activeSale.cart.map((i) => ({ id: i.sale_item_id || i.id, quantity: i.qty }))
                      });
                      addToast("Return processed successfully", "success");
                      setReturnMode(false);
                      setReturnSaleId(null);
                      setReturnSaleRef("");
                      updateActiveSale({ cart: [], customer: null });
                    }
                  } catch (err) {
                    addToast(err.response?.data?.message || "Return failed", "error");
                  } finally {
                    setReturnProcessing(false);
                  }
                },
                disabled: returnProcessing || activeSale.cart.length === 0,
                className: "w-full py-4 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all text-sm uppercase tracking-wider",
                children: returnProcessing ? "Processing..." : "↩ Complete Return"
              }
            ) : /* @__PURE__ */ jsx(
              "button",
              {
                id: "tour-pos-checkout",
                onClick: handleCheckoutClick,
                disabled: processingPayment || activeSale.cart.length === 0,
                className: `w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all ${processingPayment ? "opacity-50 cursor-not-allowed" : ""}`,
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2.5 w-full", children: [
                  printOnComplete ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Printer, { size: 20 }),
                    " ",
                    /* @__PURE__ */ jsx("span", { children: processingPayment ? "Processing..." : "Complete & Print" })
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Check, { size: 20 }),
                    " ",
                    /* @__PURE__ */ jsx("span", { children: processingPayment ? "Processing..." : "Complete Sale" })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-lg text-sm font-black bg-white/20 border border-white/10 shrink-0 ml-1.5", children: formatCurrency(cartTotal, store || settings) })
                ] })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
              !returnMode && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleParkBill,
                  disabled: parkingBill || activeSale.cart.length === 0,
                  className: `flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all ${parkingBill ? "opacity-50 cursor-not-allowed" : ""}`,
                  children: [
                    /* @__PURE__ */ jsx(Pause, { size: 18 }),
                    " ",
                    parkingBill ? "Parking..." : "Hold"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => updateActiveSale({ cart: [], cashReceived: "" }),
                  className: "flex-1 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all",
                  children: [
                    /* @__PURE__ */ jsx(X, { size: 18 }),
                    " Cancel"
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 dark:bg-slate-950 border-t border-slate-800 flex items-center justify-between px-6 py-1.5 text-[11px] font-bold text-slate-400 shadow-lg shrink-0 z-10 select-none", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "F1" }),
          /* @__PURE__ */ jsx("span", { children: "Search" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-4 bg-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "F2" }),
          /* @__PURE__ */ jsx("span", { children: "Qty" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-4 bg-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "F3" }),
          /* @__PURE__ */ jsx("span", { children: "Item Disc" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-4 bg-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "F4" }),
          /* @__PURE__ */ jsx("span", { children: "Remove" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-4 bg-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "F5" }),
          /* @__PURE__ */ jsx("span", { children: "Price" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-4 bg-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "F11" }),
          /* @__PURE__ */ jsx("span", { children: "Customer" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-4 bg-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "F12" }),
          /* @__PURE__ */ jsx("span", { children: "Remarks" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-4 bg-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "^S" }),
          /* @__PURE__ */ jsx("span", { children: "Save" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-4 bg-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "^P" }),
          /* @__PURE__ */ jsx("span", { children: "Print" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-4 bg-slate-800" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700", children: "Alt+Z" }),
          /* @__PURE__ */ jsx("span", { children: "Fullscr" })
        ] })
      ] }),
      variantModalOpen && selectedProductForVariant && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: "Select Variant" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setVariantModalOpen(false), children: /* @__PURE__ */ jsx(X, { size: 20 }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 max-h-96 overflow-y-auto", children: selectedProductForVariant.variants.map((variant) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => addToCart(selectedProductForVariant, variant),
            className: "p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-700 mb-2 flex justify-between items-center",
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold", children: variant.sku }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: variant.attributes ? JSON.stringify(variant.attributes) : "Variant" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-indigo-600", children: formatCurrency(variant.price, store || settings) }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                  "Stock: ",
                  variant.stock_quantity
                ] })
              ] })
            ]
          },
          variant.id
        )) })
      ] }) }),
      /* @__PURE__ */ jsx(Toast, { toasts, removeToast: (id) => setToasts((prev) => prev.filter((t) => t.id !== id)) }),
      /* @__PURE__ */ jsx(
        AlertModal,
        {
          show: alertState.show,
          onClose: () => setAlertState((prev) => ({ ...prev, show: false })),
          title: alertState.title,
          message: alertState.message,
          type: alertState.type
        }
      ),
      /* @__PURE__ */ jsx(
        ConfirmModal,
        {
          show: confirmState.show,
          onClose: () => setConfirmState((prev) => ({ ...prev, show: false })),
          title: confirmState.title,
          message: confirmState.message,
          onConfirm: confirmState.onConfirm,
          isDangerous: confirmState.isDangerous
        }
      ),
      /* @__PURE__ */ jsx(
        InputModal,
        {
          show: inputState.show,
          onClose: () => setInputState((prev) => ({ ...prev, show: false })),
          title: inputState.title,
          placeholder: inputState.placeholder,
          onSubmit: inputState.onSubmit,
          zIndex: "z-[150]"
        }
      ),
      /* @__PURE__ */ jsx(
        PaymentModal,
        {
          isOpen: paymentModalOpen,
          onClose: () => setPaymentModalOpen(false),
          totalAmount: cartTotal,
          onComplete: handlePaymentComplete,
          currency: store?.currency_code || settings?.currency || "PKR",
          bankAccounts,
          customer: activeSale.customer,
          defaultPrintReceipt: printOnComplete
        }
      ),
      globalDiscountModal.show && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden text-white", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-white/5 flex justify-between items-center bg-white/5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-base font-black uppercase tracking-tight", children: [
              "Apply ",
              /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: "Discount" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400", children: "Select type and discount value" })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setGlobalDiscountModal({ show: false, type: "fixed", value: "" }), className: "p-1.5 hover:bg-white/10 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(X, { size: 18, className: "text-slate-500 hover:text-white" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-5 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-800 p-1 rounded-xl", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setGlobalDiscountModal((prev) => ({ ...prev, type: "fixed" })),
                className: `flex-1 py-2 text-xs font-bold rounded-lg transition-all ${globalDiscountModal.type === "fixed" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`,
                children: [
                  "Fixed Amount (",
                  getCurrencySymbol(store || settings),
                  ")"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setGlobalDiscountModal((prev) => ({ ...prev, type: "percentage" })),
                className: `flex-1 py-2 text-xs font-bold rounded-lg transition-all ${globalDiscountModal.type === "percentage" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`,
                children: "Percentage (%)"
              }
            )
          ] }),
          globalDiscountModal.type === "percentage" && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center", children: /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase font-bold text-slate-500 block", children: "Presets (Hold to Edit)" }) }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: discountPresets.map((val, idx) => {
              let holdTimer = null;
              const startHold = () => {
                holdTimer = setTimeout(() => {
                  showInput(`Edit Preset #${idx + 1}`, `Enter new percentage value (current: ${val}%)`, (newVal) => {
                    const parsed = parseFloat(newVal);
                    if (!isNaN(parsed)) {
                      const newPresets = [...discountPresets];
                      newPresets[idx] = parsed;
                      setDiscountPresets(newPresets);
                      localStorage.setItem("pos_discount_presets", JSON.stringify(newPresets));
                      addToast(`Preset #${idx + 1} updated to ${parsed}%`, "success");
                    }
                  });
                  holdTimer = null;
                }, 500);
              };
              const endHold = () => {
                if (holdTimer) {
                  clearTimeout(holdTimer);
                  setGlobalDiscountModal((prev) => ({ ...prev, value: String(val) }));
                }
              };
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onMouseDown: startHold,
                  onMouseUp: endHold,
                  onTouchStart: startHold,
                  onTouchEnd: endHold,
                  className: `py-2 text-xs font-bold rounded-lg border transition-all ${parseFloat(globalDiscountModal.value) === val ? "bg-emerald-600/20 border-emerald-500 text-emerald-400" : "bg-slate-800/50 border-white/5 text-slate-350 hover:bg-slate-800"}`,
                  children: [
                    val,
                    "%"
                  ]
                },
                idx
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase font-bold text-slate-500 block mb-1.5", children: globalDiscountModal.type === "percentage" ? "Discount Percentage (%)" : `Discount Value (${getCurrencySymbol(store || settings)})` }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: globalDiscountModal.value,
                onChange: (e) => setGlobalDiscountModal((prev) => ({ ...prev, value: e.target.value })),
                placeholder: "0.00",
                className: "w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-lg font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-5 bg-white/5 border-t border-white/5 flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                updateActiveSale({ discountType: "fixed", discountValue: 0 });
                setGlobalDiscountModal({ show: false, type: "fixed", value: "" });
                addToast("Discount cleared", "info");
              },
              className: "flex-1 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all",
              children: "Clear"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                const parsedVal = parseFloat(globalDiscountModal.value) || 0;
                updateActiveSale({ discountType: globalDiscountModal.type, discountValue: parsedVal });
                setGlobalDiscountModal({ show: false, type: "fixed", value: "" });
                addToast("Discount applied successfully", "success");
              },
              className: "flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-950/50",
              children: "Apply"
            }
          )
        ] })
      ] }) }),
      showQuickAccountModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-white/5 flex justify-between items-center bg-white/5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-black text-white uppercase tracking-tight", children: [
              "Create ",
              /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "Bank Account" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Add a ledger to receive digital payments" })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setShowQuickAccountModal(false), className: "p-2 hover:bg-white/10 rounded-xl transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20, className: "text-slate-500" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase font-bold text-slate-500 block mb-1.5", children: "Account Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "quick-acc-name",
                type: "text",
                placeholder: "e.g. Meezan Bank, HBL Shop",
                className: "w-full bg-slate-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none",
                autoFocus: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase font-bold text-slate-500 block mb-1.5", children: "Type" }),
              /* @__PURE__ */ jsxs("select", { id: "quick-acc-type", className: "w-full bg-slate-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none", children: [
                /* @__PURE__ */ jsx("option", { value: "checking", children: "Checking" }),
                /* @__PURE__ */ jsx("option", { value: "savings", children: "Savings" }),
                /* @__PURE__ */ jsx("option", { value: "cash", children: "Branch Cash" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase font-bold text-slate-500 block mb-1.5", children: "Bank Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "quick-acc-bank",
                  type: "text",
                  placeholder: "Optional",
                  className: "w-full bg-slate-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 bg-white/5 border-t border-white/5 flex gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowQuickAccountModal(false),
              className: "flex-1 py-3 rounded-xl font-bold text-xs text-slate-400 hover:bg-white/5 transition-colors",
              children: "CANCEL"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: async () => {
                setCreatingAccount(true);
                const name = document.getElementById("quick-acc-name").value;
                const type = document.getElementById("quick-acc-type").value;
                const bank = document.getElementById("quick-acc-bank").value;
                if (!name) {
                  addToast("Account name is required", "error");
                  setCreatingAccount(false);
                  return;
                }
                try {
                  await axios.post(route("store.bank-accounts.store", { store_slug: store?.slug }), {
                    name,
                    account_type: type,
                    bank_name: bank,
                    opening_balance: 0
                  });
                  addToast("Account created successfully!", "success");
                  setShowQuickAccountModal(false);
                  router.reload({ only: ["bankAccounts"] });
                } catch (e) {
                  addToast("Failed to create account", "error");
                } finally {
                  setCreatingAccount(false);
                }
              },
              disabled: creatingAccount,
              className: "flex-[2] py-3 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2",
              children: creatingAccount ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(RefreshCcw, { size: 14, className: "animate-spin" }),
                /* @__PURE__ */ jsx("span", { children: "CREATING..." })
              ] }) : /* @__PURE__ */ jsx("span", { children: "CREATE ACCOUNT" })
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(
        QuickPartyModal,
        {
          isOpen: showQuickPartyModal,
          onClose: () => {
            setShowQuickPartyModal(false);
            setEditingCustomer(null);
          },
          editingParty: editingCustomer,
          onSuccess: (newCustomer) => {
            updateActiveSale({ customer: newCustomer });
            setShowQuickPartyModal(false);
            setEditingCustomer(null);
            addToast(`Customer ${newCustomer.name} ${editingCustomer ? "updated" : "created"}!`, "success");
          }
        }
      ),
      /* @__PURE__ */ jsx(
        ProductModal,
        {
          isOpen: showProductModal,
          onClose: () => setShowProductModal(false),
          initialName: searchQueryForProduct,
          onSuccess: (newProduct) => {
            addToCart(newProduct);
            setShowProductModal(false);
            addToast(`Product ${newProduct.name} added!`, "success");
          }
        }
      ),
      /* @__PURE__ */ jsx(
        FormModal,
        {
          isOpen: showOverpaymentModal,
          onClose: () => setShowOverpaymentModal(false),
          title: "Overpayment Detected",
          size: "sm",
          children: /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-800 dark:text-white mb-1", children: "Use Excess Amount" }),
              /* @__PURE__ */ jsx("div", { className: "text-3xl font-black text-emerald-500 my-2", children: formatCurrency(overpaymentDetails.amount, store || settings) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Customer paid extra. Choose action:" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => processCheckout(pendingPaymentData, false),
                  className: "w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2",
                  children: "Return Change"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => processCheckout(pendingPaymentData, true),
                  className: "w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2",
                  children: "Add to Ledger"
                }
              )
            ] })
          ] })
        }
      ),
      itemDiscountModal.show && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-800 dark:text-white", children: "Apply Item Discount" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1 truncate", children: itemDiscountModal.item?.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setItemDiscountModal((p) => ({ ...p, discType: "fixed" })),
              className: `flex-1 py-2 rounded-lg text-sm font-bold transition-all ${itemDiscountModal.discType === "fixed" ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`,
              children: [
                getCurrencySymbol(store || settings),
                " Fixed"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setItemDiscountModal((p) => ({ ...p, discType: "percentage" })),
              className: `flex-1 py-2 rounded-lg text-sm font-bold transition-all ${itemDiscountModal.discType === "percentage" ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`,
              children: "% Percent"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              type: "number",
              min: "0",
              max: itemDiscountModal.discType === "percentage" ? 100 : itemDiscountModal.originalPrice,
              value: itemDiscountModal.discValue,
              onChange: (e) => setItemDiscountModal((p) => ({ ...p, discValue: e.target.value })),
              onKeyDown: (e) => e.key === "Enter" && applyItemDiscount(),
              placeholder: itemDiscountModal.discType === "percentage" ? "Enter % (e.g. 10)" : `Max: ${formatCurrency(itemDiscountModal.originalPrice, store || settings)}`,
              className: "w-full px-4 py-3 pr-12 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-indigo-400 outline-none"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm", children: itemDiscountModal.discType === "percentage" ? "%" : getCurrencySymbol(store || settings) })
        ] }),
        itemDiscountModal.discValue && !isNaN(parseFloat(itemDiscountModal.discValue)) && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-sm flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "Discounted price" }),
          /* @__PURE__ */ jsx("span", { className: "font-black text-indigo-600 dark:text-indigo-400", children: formatCurrency(
            itemDiscountModal.originalPrice - (itemDiscountModal.discType === "percentage" ? itemDiscountModal.originalPrice * parseFloat(itemDiscountModal.discValue) / 100 : parseFloat(itemDiscountModal.discValue)),
            store || settings
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setItemDiscountModal({ show: false, item: null, discType: "fixed", discValue: "" }),
              className: "flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: applyItemDiscount,
              className: "flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30",
              children: "Apply"
            }
          )
        ] })
      ] }) }),
      converterModal.show && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-800 dark:text-white", children: "Edit Item Values" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1 truncate", children: converterModal.item?.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-2", children: "When Total changes, recalculate:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setConverterModal((p) => ({ ...p, mode: "price" })),
                className: `flex-1 py-2 rounded-lg text-sm font-bold transition-all ${converterModal.mode === "price" ? "bg-white dark:bg-slate-600 shadow text-amber-600 dark:text-amber-400" : "text-slate-500"}`,
                children: [
                  getCurrencySymbol(store || settings),
                  " Price"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setConverterModal((p) => ({ ...p, mode: "qty" })),
                className: `flex-1 py-2 rounded-lg text-sm font-bold transition-all ${converterModal.mode === "qty" ? "bg-white dark:bg-slate-600 shadow text-amber-600 dark:text-amber-400" : "text-slate-500"}`,
                children: "# Qty"
              }
            )
          ] })
        ] }),
        [
          { label: "Unit Price", field: "price", icon: getCurrencySymbol(store || settings), color: "indigo" },
          { label: "Quantity", field: "qty", icon: "#", color: "emerald" },
          { label: "Total", field: "total", icon: getCurrencySymbol(store || settings), color: "amber" }
        ].map(({ label, field, icon, color }) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-400 uppercase block mb-1", children: label }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("span", { className: `absolute left-3 top-1/2 -translate-y-1/2 font-black text-sm text-${color}-500`, children: icon }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                value: converterModal[field],
                onChange: (e) => handleConverterChange(field, e.target.value),
                onKeyDown: (e) => e.key === "Enter" && applyConverter(),
                className: `w-full pl-8 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-${color}-400 outline-none`
              }
            )
          ] })
        ] }, field)),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setConverterModal({ show: false, item: null, mode: "price", price: "", qty: "", total: "" }),
              className: "flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: applyConverter,
              className: "flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30",
              children: "Apply"
            }
          )
        ] })
      ] }) })
    ] }),
    showSyncHub && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 text-lg", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30", children: /* @__PURE__ */ jsx(Database, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-slate-800 dark:text-white leading-tight", children: "Sync Hub" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-400 font-medium font-mono uppercase tracking-widest", children: [
              pendingCount,
              " Pending Sales"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowSyncHub(false), className: "w-10 h-10 rounded-full hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors", children: /* @__PURE__ */ jsx(X, { size: 24 }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 max-h-[60vh] overflow-y-auto custom-scrollbar", children: [
        !isOnline2 && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0", children: /* @__PURE__ */ jsx(WifiOff, { size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-red-800 dark:text-red-300", children: "Working Offline" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600/80 dark:text-red-400/80", children: "You are currently offline. Sales will be safely stored here until your connection returns." })
          ] })
        ] }),
        offlineSales.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-12 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 mx-auto mb-4", children: /* @__PURE__ */ jsx(Check, { size: 40 }) }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-bold", children: "All sales are synced!" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: offlineSales.map((sale) => /* @__PURE__ */ jsx("div", { className: "p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-900/40 bg-slate-50/50 dark:bg-slate-900/30 transition-all group", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 tracking-tighter", children: "OFFLINE" }),
              /* @__PURE__ */ jsx("span", { className: "font-black text-slate-800 dark:text-white", children: sale.data.customer_name || "Walk-in Customer" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-xs font-bold text-slate-500", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(ShoppingCart, { size: 14, className: "text-indigo-400" }),
                " ",
                sale.data.cart?.length || 0,
                " Items"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400", children: [
                /* @__PURE__ */ jsx(CreditCard, { size: 14 }),
                " ",
                formatCurrency(sale.data.total_amount || 0, store || settings)
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-slate-400", children: [
                /* @__PURE__ */ jsx(Clock, { size: 14 }),
                " ",
                new Date(sale.created_at).toLocaleTimeString()
              ] }),
              sale.attempt_count > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-amber-500", children: [
                "⚠ ",
                sale.attempt_count,
                " attempt",
                sale.attempt_count !== 1 ? "s" : ""
              ] })
            ] }),
            syncErrors[sale.id] && /* @__PURE__ */ jsx("div", { className: "mt-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-red-600 dark:text-red-400", children: [
              "⚠ Sync Error: ",
              syncErrors[sale.id]
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleRecallOfflineSale(sale),
                className: "h-9 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs font-bold transition-all shadow-sm",
                children: "Recall to Cart"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  showConfirm("Delete Offline Sale", "This will permanently erase this sale from local storage. Are you sure?", async () => {
                    await deletePendingSale(sale.id);
                    setOfflineSales((prev) => prev.filter((s) => s.id !== sale.id));
                  }, true);
                },
                className: "w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 transition-all shadow-sm",
                children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
              }
            )
          ] })
        ] }) }, sale.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 font-bold", children: lastSyncTime ? `Last checked: ${lastSyncTime.toLocaleTimeString()}` : "Syncing enabled" }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => syncPendingSales(),
            disabled: isSyncing || !isOnline2,
            className: `px-6 h-12 rounded-2xl flex items-center gap-2 font-black transition-all ${isSyncing || !isOnline2 ? "bg-slate-200 text-slate-400 dark:bg-slate-800 cursor-not-allowed" : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0"}`,
            children: [
              /* @__PURE__ */ jsx(RefreshCcw, { size: 18, className: isSyncing ? "animate-spin" : "" }),
              /* @__PURE__ */ jsx("span", { children: isSyncing ? "SYNCING..." : "FORCE SYNC NOW" })
            ]
          }
        ) })
      ] })
    ] }) })
  ] });
};
function Pos({ settings, bankAccounts, recalledSale }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Point of Sale", activeMenu: "Dashboard", defaultCollapsed: true, hideHeader: true, noPadding: true, children: [
    /* @__PURE__ */ jsx(Head, { title: "POS" }),
    /* @__PURE__ */ jsx(POSInterface, { settings, recalledSale, bankAccounts }),
    /* @__PURE__ */ jsx(PosTourGuide, { store })
  ] });
}
export {
  Pos as default
};

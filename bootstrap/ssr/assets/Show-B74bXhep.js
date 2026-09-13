import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { ArrowLeft, Mail, Phone, RotateCcw, MapPin, X, Banknote, Wallet, CreditCard, Check } from "lucide-react";
import axios from "axios";
import { S as SellModuleTabs } from "./SellModuleTabs-C_2BbRa0.js";
import { u as useAlert } from "../ssr.js";
import { P as PrintButton } from "./PrintButton-DBeq4QSv.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
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
import "./PrintService-L_d7O0gK.js";
import "react-dom/client";
import "./PrintPreview-CmXEPl-w.js";
import "qrcode.react";
function SalesShow({ sale, bankAccounts = [] }) {
  const tt = useTermText();
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [refundSource, setRefundSource] = useState("cash_drawer");
  const [selectedBankAccount, setSelectedBankAccount] = useState("");
  const { showAlert } = useAlert();
  const { store } = usePage().props;
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("action") === "return") {
      if (sale.status === "returned") {
        showAlert({
          title: "Already Returned",
          message: "This sale has already been returned.",
          type: "warning"
        });
      } else {
        setIsReturnModalOpen(true);
      }
    }
  }, []);
  const { data, setData, post, processing, errors, reset } = useForm({
    items: sale.items.map((item) => ({
      id: item.id,
      quantity: 0,
      max_quantity: item.quantity,
      name: item.product?.name || "Unknown Product",
      price: item.unit_price
    })),
    refund_method: "cash",
    refund_source: "cash_drawer",
    bank_account_id: null
  });
  const handleReturnSubmit = (e) => {
    e.preventDefault();
    const itemsToReturn = data.items.filter((item) => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      showAlert({
        title: "No Items Selected",
        message: "Please select at least one item to return.",
        type: "warning"
      });
      return;
    }
    post(route("store.sales.return", { store_slug: store?.slug, sale: sale.id }), {
      data: {
        items: itemsToReturn,
        refund_method: refundMethod,
        refund_source: refundSource,
        bank_account_id: refundSource === "bank_account" ? selectedBankAccount : null
      },
      onSuccess: () => {
        setIsReturnModalOpen(false);
        reset();
      },
      onError: (errors2) => {
        showAlert({
          title: "Return Failed",
          message: errors2.error || "Something went wrong",
          type: "error"
        });
      }
    });
  };
  const handleSendEmail = async () => {
    const email = prompt(tt("Enter customer email:"), sale.customer?.email || "");
    if (!email) return;
    try {
      const response = await axios.post(route("store.sales.send-email", { store_slug: store?.slug, id: sale.id }), { email });
      if (response.data.success) {
        showAlert({ title: "Success", message: "Email sent successfully!", type: "success" });
      }
    } catch (error) {
      showAlert({ title: "Failed", message: "Failed to send email: " + (error.response?.data?.message || error.message), type: "error" });
    }
  };
  const handleSendWhatsApp = async () => {
    const phone = prompt(tt("Enter customer phone number:"), sale.customer?.phone || "");
    if (!phone) return;
    try {
      const response = await axios.post(route("store.sales.send-whatsapp", { store_slug: store?.slug, id: sale.id }), { phone });
      if (response.data.success) {
        showAlert({ title: "Success", message: "WhatsApp message queued!", type: "success" });
        if (response.data.mock_url) window.open(response.data.mock_url, "_blank");
      }
    } catch (error) {
      showAlert({ title: "Failed", message: "Failed to send WhatsApp: " + (error.response?.data?.message || error.message), type: "error" });
    }
  };
  const updateReturnQty = (index, qty) => {
    const newItems = [...data.items];
    const validQty = Math.max(0, Math.min(qty, newItems[index].max_quantity));
    newItems[index].quantity = validQty;
    setData("items", newItems);
  };
  const refundTotal = data.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const hasRegisteredCustomer = sale.customer && sale.customer.id;
  const refundSourceOptions = [
    { value: "cash_drawer", label: "Cash Drawer", icon: Banknote, color: "emerald" },
    { value: "bank_account", label: "Bank Transfer", icon: CreditCard, color: "blue" },
    { value: "online", label: "Online / Card", icon: Wallet, color: "purple" }
  ];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Invoice #${sale.reference_number}`, activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: `Invoice #${sale.reference_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "orders" }),
      /* @__PURE__ */ jsxs("div", { className: "pb-8", children: [
        /* @__PURE__ */ jsx("style", { children: `
                        @media print {
                            @page { margin: 0; }
                            body { -webkit-print-color-adjust: exact; }
                            nav, aside, header, .no-print { display: none !important; }
                            main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                            .print-container { padding: 40px !important; box-shadow: none !important; border: none !important; }
                        }
` }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6 no-print", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.sales.index", { store_slug: store?.slug }),
                className: "flex items-center gap-2 text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors",
                children: [
                  /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }),
                  " Back to Sales"
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
              sale.status === "completed" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleSendEmail,
                    className: "flex items-center gap-2 bg-surface text-ink-secondary dark:text-ink border border-line px-4 py-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all active:scale-95 font-medium",
                    title: "Send via Email",
                    children: /* @__PURE__ */ jsx(Mail, { size: 20 })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleSendWhatsApp,
                    className: "flex items-center gap-2 bg-surface text-emerald-600 dark:text-emerald-400 border border-line px-4 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-95 font-medium",
                    title: "Send via WhatsApp",
                    children: /* @__PURE__ */ jsx(Phone, { size: 20 })
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setIsReturnModalOpen(true),
                    className: "flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-4 py-2 rounded-xl transition-all active:scale-95 font-medium",
                    children: [
                      /* @__PURE__ */ jsx(RotateCcw, { size: 20 }),
                      " Return Items"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                PrintButton,
                {
                  sale,
                  label: "Print Invoice"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-lg border border-line p-8 print-container", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-12", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-2xl", children: "A" }),
                  /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-ink", children: "VENQORE" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm text-ink-muted space-y-1", children: [
                  /* @__PURE__ */ jsx("p", { children: "123 Business Street" }),
                  /* @__PURE__ */ jsx("p", { children: "City, Country 12345" }),
                  /* @__PURE__ */ jsx("p", { children: "Phone: +1 234 567 890" }),
                  /* @__PURE__ */ jsx("p", { children: "Email: info@venqorepos.com" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-ink mb-2", children: "INVOICE" }),
                /* @__PURE__ */ jsxs("p", { className: "text-ink-muted font-medium", children: [
                  "#",
                  sale.reference_number
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-1 text-sm", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-ink-muted", children: [
                    "Date: ",
                    /* @__PURE__ */ jsx("span", { className: "text-ink font-medium", children: new Date(sale.created_at).toLocaleDateString() })
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-ink-muted", children: [
                    "Status: ",
                    /* @__PURE__ */ jsx("span", { className: "uppercase font-bold text-emerald-600", children: sale.payment_status })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-b border-line py-8 mb-8 grid grid-cols-2 gap-8", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-3", children: "Bill To" }),
                sale.customer ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-lg", children: sale.customer.name }),
                  sale.customer.email && /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Mail, { size: 14 }),
                    " ",
                    sale.customer.email
                  ] }),
                  sale.customer.phone && /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Phone, { size: 14 }),
                    " ",
                    sale.customer.phone
                  ] }),
                  sale.customer.address && /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(MapPin, { size: 14 }),
                    " ",
                    sale.customer.address
                  ] })
                ] }) : /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-lg", children: tt("Walk-in Customer") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-3", children: "Payment Details" }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
                  "Method: ",
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-ink capitalize", children: sale.payment_method })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
                  "Cashier: ",
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-ink", children: sale.user?.name })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
                /* @__PURE__ */ jsx("th", { className: "py-3", children: "Item Description" }),
                /* @__PURE__ */ jsx("th", { className: "py-3 text-center", children: "Qty" }),
                /* @__PURE__ */ jsx("th", { className: "py-3 text-right", children: "Unit Price" }),
                /* @__PURE__ */ jsx("th", { className: "py-3 text-right", children: "Amount" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: sale.items.map((item, index) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsxs("td", { className: "py-4", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: item.product.name }),
                  item.variant && /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
                    "Variant: ",
                    item.variant.sku
                  ] })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-center text-ink-secondary", children: item.quantity }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-right text-ink-secondary", children: formatCurrency(item.unit_price, store) }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-right font-medium text-ink", children: formatCurrency(item.subtotal, store) })
              ] }, index)) })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs("div", { className: "w-64 space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted text-sm", children: [
                /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-ink", children: formatCurrency(sale.subtotal, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted text-sm", children: [
                /* @__PURE__ */ jsx("span", { children: "Tax" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-ink", children: formatCurrency(sale.tax, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted text-sm", children: [
                /* @__PURE__ */ jsx("span", { children: "Discount" }),
                /* @__PURE__ */ jsxs("span", { className: "font-medium text-ink", children: [
                  "- ",
                  formatCurrency(sale.discount, store)
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "h-px bg-sunken my-2" }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xl font-bold text-brand-600 dark:text-brand-400", children: [
                /* @__PURE__ */ jsx("span", { children: "Total" }),
                /* @__PURE__ */ jsx("span", { children: formatCurrency(sale.total, store) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-12 pt-8 border-t border-line text-center text-ink-muted text-sm", children: [
              /* @__PURE__ */ jsx("p", { children: "Thank you for your business!" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs font-medium text-ink-muted", children: [
                "Powered by",
                "",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://venqore.com?utm_source=invoice_footer",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-brand-500 hover:text-brand-400 font-bold underline transition-colors",
                    children: "VenQore"
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }),
    isReturnModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-normal", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-line bg-gradient-to-r from-red-500 to-rose-600", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-white/20 rounded-xl", children: /* @__PURE__ */ jsx(RotateCcw, { size: 24 }) }),
            "Process Return"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setIsReturnModalOpen(false), className: "text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
        ] }),
        sale.customer && /* @__PURE__ */ jsxs("p", { className: "text-white/80 mt-2 text-sm", children: [
          tt("Customer"),
          ": ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: sale.customer.name })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleReturnSubmit, className: "p-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-3", children: "Select Items to Return" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto pr-2", children: data.items.map((item, index) => /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between p-4 rounded-xl border transition-all ${item.quantity > 0 ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-app border-line"}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: item.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
                "Purchased: ",
                item.max_quantity,
                " × ",
                formatCurrency(item.price, store)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => updateReturnQty(index, item.max_quantity),
                  className: "text-xs px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors font-bold",
                  children: "Return All"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "0",
                  max: item.max_quantity,
                  value: item.quantity,
                  onChange: (e) => updateReturnQty(index, parseFloat(e.target.value) || 0),
                  className: "w-16 px-2 py-2 rounded-lg border border-line dark:border-line bg-sunken text-center font-bold focus:ring-2 ring-red-500/30 outline-none"
                }
              )
            ] })
          ] }, item.id)) })
        ] }),
        refundTotal > 0 && hasRegisteredCustomer && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-3", children: "Where should the refund go?" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setRefundMethod("cash"),
                className: `p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${refundMethod === "cash" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-line hover:border-line"}`,
                children: [
                  /* @__PURE__ */ jsx(Banknote, { size: 28, className: refundMethod === "cash" ? "text-emerald-600" : "text-ink-muted" }),
                  /* @__PURE__ */ jsx("span", { className: `font-bold text-sm ${refundMethod === "cash" ? "text-emerald-600" : "text-ink-secondary"}`, children: "Cash Refund" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: "Pay customer now" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setRefundMethod("ledger"),
                className: `p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${refundMethod === "ledger" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-line hover:border-line"}`,
                children: [
                  /* @__PURE__ */ jsx(Wallet, { size: 28, className: refundMethod === "ledger" ? "text-blue-600" : "text-ink-muted" }),
                  /* @__PURE__ */ jsx("span", { className: `font-bold text-sm ${refundMethod === "ledger" ? "text-blue-600" : "text-ink-secondary"}`, children: "Credit to Khata" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: "Add to balance" })
                ]
              }
            )
          ] })
        ] }),
        refundTotal > 0 && refundMethod === "cash" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-3", children: "Refund From" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: refundSourceOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = refundSource === option.value;
            const colorClasses = {
              emerald: isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "",
              blue: isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "",
              purple: isSelected ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600" : ""
            };
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setRefundSource(option.value),
                className: `p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${isSelected ? colorClasses[option.color] : "border-line hover:border-line text-ink-muted"}`,
                children: [
                  /* @__PURE__ */ jsx(Icon, { size: 22 }),
                  /* @__PURE__ */ jsx("span", { className: `font-bold text-xs ${isSelected ? "" : "text-ink-secondary"}`, children: option.label })
                ]
              },
              option.value
            );
          }) }),
          refundSource === "bank_account" && bankAccounts.length > 0 && /* @__PURE__ */ jsxs(
            "select",
            {
              value: selectedBankAccount,
              onChange: (e) => setSelectedBankAccount(e.target.value),
              className: "mt-3 w-full p-3 rounded-xl border border-line bg-surface text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select Bank Account" }),
                bankAccounts.map((acc) => /* @__PURE__ */ jsx("option", { value: acc.id, children: acc.name }, acc.id))
              ]
            }
          )
        ] }),
        refundTotal > 0 && !hasRegisteredCustomer && /* @__PURE__ */ jsx("div", { className: "p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-amber-700 dark:text-amber-400 font-medium", children: [
          /* @__PURE__ */ jsxs("strong", { children: [
            tt("Walk-in Customer"),
            ":"
          ] }),
          " Refund will be given as cash only."
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-4 border-t border-line", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Total Refund" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-red-600", children: formatCurrency(refundTotal, store) }),
            refundTotal > 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: refundMethod === "ledger" ? /* @__PURE__ */ jsxs("span", { children: [
              "→ Credit to ",
              /* @__PURE__ */ jsx("span", { className: "font-bold text-blue-600", children: "Khata" })
            ] }) : /* @__PURE__ */ jsxs("span", { children: [
              "→ From ",
              /* @__PURE__ */ jsx("span", { className: "font-bold uppercase", children: refundSource.replace("_", " ") })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsReturnModalOpen(false),
                className: "px-5 py-3 text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl transition-colors font-medium",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processing || refundTotal === 0,
                className: "px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }),
                  "Processing..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Check, { size: 18 }),
                  "Confirm Return"
                ] })
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  SalesShow as default
};

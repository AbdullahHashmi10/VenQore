import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { ArrowLeft, FileText, User, DollarSign, MessageSquare, Mail, Clock, Info } from "lucide-react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function Create({ invoices = [] }) {
  const { store, settings } = usePage().props;
  const { data, setData, post, processing, errors } = useForm({
    invoice_id: "",
    scheduled_at: "",
    type: "whatsapp"
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  useEffect(() => {
    if (data.invoice_id) {
      const invoice = invoices.find((inv) => inv.id === data.invoice_id);
      setSelectedInvoice(invoice || null);
    } else {
      setSelectedInvoice(null);
    }
  }, [data.invoice_id, invoices]);
  const getMessagePreview = () => {
    if (!selectedInvoice) {
      return "Please select an invoice to preview the reminder message.";
    }
    const customerName = selectedInvoice.party?.name || "Customer";
    const reference = selectedInvoice.reference_number || "Invoice";
    const balanceDue = parseFloat(selectedInvoice.invoice_total ?? selectedInvoice.total ?? 0);
    return `Hi ${customerName}, hope you're doing well. Just a friendly reminder about your outstanding balance of ${formatCurrency(balanceDue, store || settings)} for invoice #${reference}. Please let us know if you have any questions or when we can expect payment. Thank you!`;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("store.invoice-reminders.store", { store_slug: store.slug }));
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Schedule Reminder", activeMenu: "Sales", children: [
    /* @__PURE__ */ jsx(Head, { title: "Schedule Reminder" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.invoice-reminders.index", { store_slug: store.slug }),
            className: "p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all",
            children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: "Schedule Payment Reminder" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Set up automated notifications for your unpaid invoices" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: [
              "Select Unpaid/Partial Invoice ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: data.invoice_id,
                  onChange: (e) => setData("invoice_id", e.target.value),
                  className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-orange-500/20 outline-none font-medium appearance-none",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Choose an Invoice --" }),
                    invoices.map((invoice) => /* @__PURE__ */ jsxs("option", { value: invoice.id, children: [
                      invoice.reference_number,
                      " - ",
                      invoice.party?.name || "Unknown",
                      " (",
                      formatCurrency(parseFloat(invoice.invoice_total ?? invoice.total ?? 0), store || settings),
                      ")"
                    ] }, invoice.id))
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400", children: /* @__PURE__ */ jsx(FileText, { size: 18 }) })
            ] }),
            errors.invoice_id && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs font-medium", children: errors.invoice_id })
          ] }),
          selectedInvoice && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 block", children: "Customer" }),
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mt-0.5", children: [
                /* @__PURE__ */ jsx(User, { size: 14, className: "text-slate-400" }),
                selectedInvoice.party?.name || "Unknown"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 block", children: "Amount Due" }),
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-0.5", children: [
                /* @__PURE__ */ jsx(DollarSign, { size: 14 }),
                formatCurrency(parseFloat(selectedInvoice.invoice_total ?? selectedInvoice.total ?? 0), store || settings)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: [
              "Scheduled For ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "datetime-local",
                value: data.scheduled_at,
                onChange: (e) => setData("scheduled_at", e.target.value),
                min: new Date(Date.now() + 6e4).toISOString().slice(0, 16),
                className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-orange-500/20 outline-none font-medium text-slate-800 dark:text-white"
              }
            ) }),
            errors.scheduled_at && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs font-medium", children: errors.scheduled_at })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: [
              "Delivery Channel ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setData("type", "whatsapp"),
                  className: `p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${data.type === "whatsapp" ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 font-bold" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`,
                  children: [
                    /* @__PURE__ */ jsx(MessageSquare, { size: 24 }),
                    /* @__PURE__ */ jsx("span", { children: "WhatsApp" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setData("type", "email"),
                  className: `p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${data.type === "email" ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 font-bold" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`,
                  children: [
                    /* @__PURE__ */ jsx(Mail, { size: 24 }),
                    /* @__PURE__ */ jsx("span", { children: "Email" })
                  ]
                }
              )
            ] }),
            errors.type && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs font-medium", children: errors.type })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-bold shadow-lg shadow-orange-500/20 disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Clock, { size: 18 }),
                processing ? "Scheduling..." : "Schedule Reminder"
              ]
            }
          ) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-5 space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsx(Info, { size: 18, className: "text-slate-400" }),
            "Reminder Preview"
          ] }),
          data.type === "whatsapp" ? (
            /* WhatsApp Mock */
            /* @__PURE__ */ jsxs("div", { className: "bg-[#efeae2] dark:bg-[#0b141a] rounded-xl p-4 min-h-[220px] flex flex-col justify-between border border-emerald-100 dark:border-emerald-950/30", children: [
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxs("div", { className: "inline-block bg-white dark:bg-[#1f2c34] text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none p-3.5 text-sm shadow-sm max-w-[85%] whitespace-pre-wrap leading-relaxed relative", children: [
                getMessagePreview(),
                /* @__PURE__ */ jsx("span", { className: "block text-[10px] text-slate-400 text-right mt-1.5", children: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "text-center text-xs text-slate-400 mt-4 italic", children: "Simulated WhatsApp delivery" })
            ] })
          ) : (
            /* Email Mock */
            /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-950 rounded-xl p-4 min-h-[220px] flex flex-col justify-between border border-slate-200 dark:border-slate-800", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-100 dark:border-slate-800 pb-2 text-xs text-slate-400 space-y-1", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold", children: "From:" }),
                    " system@venqore.com"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold", children: "To:" }),
                    " ",
                    selectedInvoice?.party?.email || "customer@email.com"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Subject:" }),
                    " Friendly Payment Reminder: Invoice #",
                    selectedInvoice?.reference_number || "----"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed", children: getMessagePreview() })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-center text-xs text-slate-400 mt-4 italic", children: "Simulated Email delivery" })
            ] })
          )
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Create as default
};

import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Clock } from "lucide-react";
import { P as PrintButton } from "./PrintButton-Dgsai7Fu.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./PrintService-CHQ9qBZV.js";
import "react-dom";
import "react-dom/client";
import "./format-B_ph0Qec.js";
import "./PrintPreview-u3rEkqC1.js";
function Show({ purchase }) {
  const {
    store
  } = usePage().props;
  if (!purchase) return null;
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    received: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Purchase ${purchase.invoice_number}`, activeMenu: "Purchase", children: [
    /* @__PURE__ */ jsx(Head, { title: `Purchase ${purchase.invoice_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between no-print", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.purchases.index", {
                store_slug: store.slug
              }),
              className: "p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors",
              children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "text-slate-500" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: [
              "Purchase Bill #",
              purchase.invoice_number
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
              "Created on ",
              new Date(purchase.created_at).toLocaleDateString()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsx(
          PrintButton,
          {
            sale: purchase,
            label: "Print",
            variant: "secondary"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden print:shadow-none print:border-none", children: [
        /* @__PURE__ */ jsx("div", { className: "p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-slate-800 dark:text-white mb-1", children: "PURCHASE BILL" }),
            /* @__PURE__ */ jsxs("p", { className: "text-slate-500 font-medium", children: [
              "#",
              purchase.invoice_number
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 flex gap-2", children: /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[purchase.status] || "bg-slate-100"}`, children: purchase.status }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-400 uppercase mb-1", children: "Amount Due" }),
            /* @__PURE__ */ jsx("p", { className: "text-4xl font-black text-slate-800 dark:text-white", children: (Number(purchase.total_amount) - Number(purchase.paid_amount || 0)).toLocaleString("en-US", { style: "currency", currency: "USD" }) }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 mt-1", children: [
              "Total: ",
              Number(purchase.total_amount).toLocaleString("en-US", { style: "currency", currency: "USD" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase mb-4", children: "Supplier Details" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Building2, { size: 20, className: "text-indigo-500" }),
                purchase.party?.name || "Unknown Supplier"
              ] }),
              purchase.party?.email && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300", children: [
                /* @__PURE__ */ jsx(Mail, { size: 16, className: "text-slate-400" }),
                purchase.party.email
              ] }),
              purchase.party?.phone && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300", children: [
                /* @__PURE__ */ jsx(Phone, { size: 16, className: "text-slate-400" }),
                purchase.party.phone
              ] }),
              purchase.party?.address && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300", children: [
                /* @__PURE__ */ jsx(MapPin, { size: 16, className: "text-slate-400 mt-0.5" }),
                purchase.party.address
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Date Issued" }),
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Calendar, { size: 16, className: "text-indigo-500" }),
                new Date(purchase.date || purchase.created_at).toLocaleDateString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Reference" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: purchase.reference || "-" })
            ] }),
            purchase.due_date && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Due Date" }),
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-rose-500" }),
                new Date(purchase.due_date).toLocaleDateString()
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsx("thead", { className: "text-xs font-bold text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "pb-4 pl-2", children: "Description" }),
            /* @__PURE__ */ jsx("th", { className: "pb-4 text-right", children: "Qty" }),
            /* @__PURE__ */ jsx("th", { className: "pb-4 text-right", children: "Unit Price" }),
            /* @__PURE__ */ jsx("th", { className: "pb-4 text-right pr-2", children: "Total" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: purchase.items?.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { className: "py-4 pl-2", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white truncate max-w-md", children: item.product?.name || item.name || "Item" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: item.product?.code })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-4 text-right font-medium text-slate-600 dark:text-slate-300", children: item.quantity }),
            /* @__PURE__ */ jsx("td", { className: "py-4 text-right font-medium text-slate-600 dark:text-slate-300", children: Number(item.unit_price).toLocaleString("en-US", { style: "currency", currency: "USD" }) }),
            /* @__PURE__ */ jsx("td", { className: "py-4 text-right font-bold text-slate-800 dark:text-white pr-2", children: Number(item.total).toLocaleString("en-US", { style: "currency", currency: "USD" }) })
          ] }, item.id)) }),
          /* @__PURE__ */ jsxs("tfoot", { className: "border-t border-slate-200 dark:border-slate-700", children: [
            /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { colSpan: "3", className: "pt-6 text-right font-bold text-slate-500 uppercase text-xs", children: "Subtotal" }),
              /* @__PURE__ */ jsx("td", { className: "pt-6 text-right font-bold text-slate-800 dark:text-white pr-2", children: (Number(purchase.total_amount) - Number(purchase.tax) + Number(purchase.discount)).toLocaleString("en-US", { style: "currency", currency: "USD" }) })
            ] }),
            Number(purchase.discount) > 0 && /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { colSpan: "3", className: "pt-2 text-right font-bold text-emerald-500 uppercase text-xs", children: "Discount" }),
              /* @__PURE__ */ jsxs("td", { className: "pt-2 text-right font-bold text-emerald-500 pr-2", children: [
                "- ",
                Number(purchase.discount).toLocaleString("en-US", { style: "currency", currency: "USD" })
              ] })
            ] }),
            Number(purchase.tax) > 0 && /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { colSpan: "3", className: "pt-2 text-right font-bold text-slate-500 uppercase text-xs", children: "Tax" }),
              /* @__PURE__ */ jsx("td", { className: "pt-2 text-right font-bold text-slate-800 dark:text-white pr-2", children: Number(purchase.tax).toLocaleString("en-US", { style: "currency", currency: "USD" }) })
            ] }),
            /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { colSpan: "3", className: "pt-4 text-right font-black text-slate-800 dark:text-white text-lg", children: "Total" }),
              /* @__PURE__ */ jsx("td", { className: "pt-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-lg pr-2", children: Number(purchase.total_amount).toLocaleString("en-US", { style: "currency", currency: "USD" }) })
            ] }),
            /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { colSpan: "3", className: "pt-2 text-right font-bold text-slate-500 text-sm", children: "Amount Paid" }),
              /* @__PURE__ */ jsx("td", { className: "pt-2 text-right font-bold text-slate-600 dark:text-slate-300 text-sm pr-2", children: Number(purchase.paid_amount || 0).toLocaleString("en-US", { style: "currency", currency: "USD" }) })
            ] })
          ] })
        ] }) }),
        purchase.notes && /* @__PURE__ */ jsxs("div", { className: "p-8 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase mb-2", children: "Notes & Terms" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 italic", children: purchase.notes })
        ] })
      ] })
    ] })
  ] });
}
export {
  Show as default
};

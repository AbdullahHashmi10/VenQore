import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-C3Zz64cZ.js";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import "react-dom";
import "./plans-Dp89V3MJ.js";
import "./runtime-zM7XrUga.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-B_UmKR56.js";
import "./terms-BnWz3Igl.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function PostDatedCheques({ outgoing = [], incoming = [] }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug;
  const [activeTab, setActiveTab] = useState("all");
  const totalOutgoing = outgoing.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
  const totalIncoming = incoming.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Post-Dated Cheques", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Post-Dated Cheques" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "cheque-books", className: "!mb-0" }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-1.5 rounded-xl border border-line shadow-sm flex items-center gap-2 overflow-x-auto shrink-0", children: [
        /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted shrink-0", children: "Reports:" }),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.banking.reports.outgoing-cheques", { store_slug: storeSlug }),
            className: "px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0",
            children: "Outgoing Register"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.banking.reports.incoming-cheques", { store_slug: storeSlug }),
            className: "px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0",
            children: "Incoming Register"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.banking.reports.cheque-utilization", { store_slug: storeSlug }),
            className: "px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0",
            children: "Chequebook Utilization"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.banking.reports.post-dated-cheques", { store_slug: storeSlug }),
            className: "px-3 py-1 text-xs font-bold rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shrink-0",
            children: "Post-Dated Cheques"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-2xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(ArrowUpRight, { size: 14 }),
              " Outgoing PDCs (Vendor Obligations)"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink mt-0.5", children: formatCurrency(totalOutgoing) })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-ink-muted", children: [
            outgoing.length,
            " cheques"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-2xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(ArrowDownLeft, { size: 14 }),
              " Incoming PDCs (Customer Receivables)"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink mt-0.5", children: formatCurrency(totalIncoming) })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-ink-muted", children: [
            incoming.length,
            " cheques"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-neutral-200 dark:border-neutral-700", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("all"),
            className: `py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === "all" ? "border-brand-600 text-brand-600" : "border-transparent text-neutral-500 hover:text-neutral-700"}`,
            children: [
              "All Upcoming (",
              outgoing.length + incoming.length,
              ")"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("outgoing"),
            className: `py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === "outgoing" ? "border-brand-600 text-brand-600" : "border-transparent text-neutral-500 hover:text-neutral-700"}`,
            children: [
              "Outgoing (",
              outgoing.length,
              ")"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("incoming"),
            className: `py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === "incoming" ? "border-brand-600 text-brand-600" : "border-transparent text-neutral-500 hover:text-neutral-700"}`,
            children: [
              "Incoming (",
              incoming.length,
              ")"
            ]
          }
        )
      ] }),
      (activeTab === "all" || activeTab === "outgoing") && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(ArrowUpRight, { className: "w-4 h-4 text-blue-600" }),
          " Outgoing Post-Dated Cheques"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm text-neutral-600 dark:text-neutral-300", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-700", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Cheque Number" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Bank Account" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Payee" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Maturity Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right", children: "Amount" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: outgoing.length > 0 ? outgoing.map((o) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-neutral-50", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 font-mono font-bold text-neutral-900 dark:text-neutral-100", children: o.display_serial_number }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 text-xs", children: o.bank_account?.name }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 font-semibold text-neutral-900 dark:text-neutral-100", children: o.party?.name || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 font-mono text-xs text-blue-600 font-bold", children: o.cheque_date }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100", children: formatCurrency(o.amount) })
          ] }, o.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "px-6 py-4 text-center text-neutral-400", children: "No outgoing post-dated cheques" }) }) })
        ] }) })
      ] }),
      (activeTab === "all" || activeTab === "incoming") && /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(ArrowDownLeft, { className: "w-4 h-4 text-emerald-600" }),
          " Incoming Post-Dated Cheques"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm text-neutral-600 dark:text-neutral-300", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-700", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Cheque Number" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Drawer Bank" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Customer" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Maturity Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right", children: "Amount" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: incoming.length > 0 ? incoming.map((i) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-neutral-50", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-3.5 font-mono font-bold text-neutral-900 dark:text-neutral-100", children: [
              "#",
              i.cheque_number
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 text-xs", children: i.bank_name }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 font-semibold text-neutral-900 dark:text-neutral-100", children: i.party?.name || "Walk-in" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 font-mono text-xs text-emerald-600 font-bold", children: i.cheque_date }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100", children: formatCurrency(i.amount) })
          ] }, i.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "px-6 py-4 text-center text-neutral-400", children: "No incoming post-dated cheques" }) }) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  PostDatedCheques as default
};

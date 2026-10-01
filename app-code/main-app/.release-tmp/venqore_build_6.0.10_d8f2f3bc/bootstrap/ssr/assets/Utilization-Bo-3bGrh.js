import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-C3Zz64cZ.js";
import "react-dom";
import "lucide-react";
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
function ChequeUtilization({ books = [] }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug;
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Chequebook Utilization", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Chequebook Utilization" }),
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
            className: "px-3 py-1 text-xs font-bold rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shrink-0",
            children: "Chequebook Utilization"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.banking.reports.post-dated-cheques", { store_slug: storeSlug }),
            className: "px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0",
            children: "Post-Dated Cheques"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm text-neutral-600 dark:text-neutral-300", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Bank Account & Range" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-center", children: "Total" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-center text-emerald-600", children: "Available" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-center text-blue-600", children: "Issued" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-center text-purple-600", children: "Cleared" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-center text-red-600", children: "Bounced" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-center text-neutral-500", children: "Void / Stopped" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Utilization Rate" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: books && books.length > 0 ? books.map((b) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors", children: [
          /* @__PURE__ */ jsxs("td", { className: "px-6 py-4", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-neutral-900 dark:text-neutral-100", children: b.bank_account?.name }),
            /* @__PURE__ */ jsxs("p", { className: "font-mono text-xs text-neutral-500", children: [
              b.series_prefix ? `${b.series_prefix}-` : "",
              String(b.start_number).padStart(b.padding_zeros || 6, "0"),
              " ... ",
              String(b.end_number).padStart(b.padding_zeros || 6, "0")
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center font-bold text-neutral-900 dark:text-neutral-100", children: b.total_leaves_count }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center font-semibold text-emerald-600", children: b.available_leaves_count }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center font-semibold text-blue-600", children: b.issued_leaves_count }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center font-semibold text-purple-600", children: b.cleared_leaves_count }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center font-semibold text-red-600", children: b.bounced_leaves_count }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center font-semibold text-neutral-500", children: (b.void_leaves_count || 0) + (b.stopped_leaves_count || 0) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "w-40", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-semibold mb-1 text-neutral-700 dark:text-neutral-300", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                b.used_leaves_count,
                " / ",
                b.total_leaves_count
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                b.utilization_percentage,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-full bg-neutral-200 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: `h-full rounded-full transition-all ${b.utilization_percentage >= 90 ? "bg-amber-500" : "bg-brand-600"}`,
                style: { width: `${b.utilization_percentage}%` }
              }
            ) })
          ] }) })
        ] }, b.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "8", className: "px-6 py-8 text-center text-neutral-400", children: "No chequebooks registered yet." }) }) })
      ] }) }) })
    ] })
  ] });
}
export {
  ChequeUtilization as default
};

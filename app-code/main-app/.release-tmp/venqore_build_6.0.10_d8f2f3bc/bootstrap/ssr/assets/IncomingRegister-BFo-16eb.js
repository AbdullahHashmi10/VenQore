import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-C3Zz64cZ.js";
import { P as PremiumSelect } from "./PremiumSelect-CyM9VGV1.js";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
import { ArrowLeft, Search } from "lucide-react";
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
function IncomingRegister({ cheques, bankAccounts = [], parties = [], filters = {} }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug;
  const [search, setSearch] = useState(filters.search || "");
  const [selectedBank, setSelectedBank] = useState(filters.deposit_bank_account_id || "");
  const [selectedStatus, setSelectedStatus] = useState(filters.status || "");
  const [selectedParty, setSelectedParty] = useState(filters.party_id || "");
  const [fromDate, setFromDate] = useState(filters.from_date || "");
  const [toDate, setToDate] = useState(filters.to_date || "");
  const handleFilterChange = (newFilters) => {
    router.get(route("store.banking.reports.incoming-cheques", { store_slug: storeSlug }), {
      search: newFilters.search !== void 0 ? newFilters.search : search,
      deposit_bank_account_id: newFilters.deposit_bank_account_id !== void 0 ? newFilters.deposit_bank_account_id : selectedBank,
      status: newFilters.status !== void 0 ? newFilters.status : selectedStatus,
      party_id: newFilters.party_id !== void 0 ? newFilters.party_id : selectedParty,
      from_date: newFilters.from_date !== void 0 ? newFilters.from_date : fromDate,
      to_date: newFilters.to_date !== void 0 ? newFilters.to_date : toDate
    }, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Incoming Cheque Register", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Incoming Cheque Register" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "received-cheques", className: "!mb-0" }),
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
            className: "px-3 py-1 text-xs font-bold rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shrink-0",
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
            className: "px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0",
            children: "Post-Dated Cheques"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.banking.received-cheques.index", { store_slug: storeSlug }),
              className: "p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors",
              children: /* @__PURE__ */ jsx(ArrowLeft, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("h1", { className: "text-base font-bold text-ink uppercase tracking-tight", children: [
            "Incoming ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Register" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-40 sm:w-56", children: [
            /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search cheque #, bank...",
                value: search,
                onChange: (e) => {
                  setSearch(e.target.value);
                  handleFilterChange({ search: e.target.value });
                },
                className: "w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-app border-none rounded-lg focus:ring-1 focus:ring-brand-500 text-ink-secondary dark:text-ink"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              value: selectedStatus,
              onChange: (val) => {
                setSelectedStatus(val);
                handleFilterChange({ status: val });
              },
              options: [
                { value: "", label: "All Statuses" },
                { value: "received", label: "In Hand" },
                { value: "deposited", label: "Deposited" },
                { value: "cleared", label: "Cleared" },
                { value: "bounced", label: "Bounced" },
                { value: "returned", label: "Returned" }
              ],
              placeholder: "All Statuses",
              inputClassName: "!rounded-full !py-2 !px-4 !bg-neutral-50 dark:!bg-neutral-900/50 !border-neutral-200 dark:!border-neutral-700 text-xs sm:text-sm font-medium",
              className: "w-full"
            }
          ) }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              value: selectedParty,
              onChange: (val) => {
                setSelectedParty(val);
                handleFilterChange({ party_id: val });
              },
              options: [
                { value: "", label: "All Customers" },
                ...parties.map((p) => ({
                  value: String(p.id),
                  label: p.name
                }))
              ],
              placeholder: "All Customers",
              inputClassName: "!rounded-full !py-2 !px-4 !bg-neutral-50 dark:!bg-neutral-900/50 !border-neutral-200 dark:!border-neutral-700 text-xs sm:text-sm font-medium",
              className: "w-full"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: fromDate,
                onChange: (e) => {
                  setFromDate(e.target.value);
                  handleFilterChange({ from_date: e.target.value });
                },
                className: "w-full py-1.5 px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs",
                placeholder: "From"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-neutral-400", children: "-" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: toDate,
                onChange: (e) => {
                  setToDate(e.target.value);
                  handleFilterChange({ to_date: e.target.value });
                },
                className: "w-full py-1.5 px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs",
                placeholder: "To"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm text-neutral-600 dark:text-neutral-300", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Cheque Number" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Drawer Bank" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Customer" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Cheque Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Amount" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Deposit Bank / Date" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: cheques.data && cheques.data.length > 0 ? cheques.data.map((c) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100", children: [
              "#",
              c.cheque_number
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 text-xs", children: [
              c.bank_name,
              " ",
              c.branch ? `(${c.branch})` : ""
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100", children: c.party?.name || "Walk-in Customer" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs font-mono", children: c.cheque_date }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100", children: formatCurrency(c.amount) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${c.status === "cleared" ? "bg-purple-100 text-purple-800" : c.status === "deposited" ? "bg-blue-100 text-blue-800" : c.status === "received" ? "bg-amber-100 text-amber-800" : c.status === "bounced" ? "bg-red-100 text-red-800" : "bg-neutral-100 text-neutral-800"}`, children: c.status }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs text-neutral-500", children: c.deposit_bank_account?.name ? `${c.deposit_bank_account.name} • ${c.deposit_date}` : "In Hand" })
          ] }, c.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "7", className: "px-6 py-8 text-center text-neutral-400", children: "No incoming cheques found for the selected criteria." }) }) })
        ] }) }) })
      ] })
    ] })
  ] });
}
export {
  IncomingRegister as default
};

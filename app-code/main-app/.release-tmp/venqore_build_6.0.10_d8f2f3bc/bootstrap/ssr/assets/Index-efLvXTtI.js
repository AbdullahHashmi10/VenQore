import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-C3Zz64cZ.js";
import { P as PremiumSelect } from "./PremiumSelect-CyM9VGV1.js";
import { BookOpen, CheckCircle2, FileText, Clock, Search, Plus, Building2, Ban, XCircle } from "lucide-react";
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
function ChequeBooksIndex({ chequeBooks, bankAccounts, filters = {} }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug;
  const [search, setSearch] = useState(filters.search || "");
  const [selectedBank, setSelectedBank] = useState(filters.bank_account_id || "");
  const [selectedStatus, setSelectedStatus] = useState(filters.status || "");
  const handleFilterChange = (newFilters) => {
    router.get(route("store.banking.cheque-books.index", { store_slug: storeSlug }), {
      search: newFilters.search !== void 0 ? newFilters.search : search,
      bank_account_id: newFilters.bank_account_id !== void 0 ? newFilters.bank_account_id : selectedBank,
      status: newFilters.status !== void 0 ? newFilters.status : selectedStatus
    }, { preserveState: true, replace: true });
  };
  const handleCloseBook = (id) => {
    if (confirm("Are you sure you want to close this chequebook? No more leaves can be issued from a closed book.")) {
      router.post(route("store.banking.cheque-books.close", { store_slug: storeSlug, id }));
    }
  };
  const handleDeleteBook = (id) => {
    if (confirm("Are you sure you want to delete this chequebook? All unused leaves will be deleted.")) {
      router.delete(route("store.banking.cheque-books.destroy", { store_slug: storeSlug, id }));
    }
  };
  const booksList = chequeBooks.data || [];
  const totalBooks = chequeBooks.total || booksList.length || 0;
  const activeBooks = booksList.filter((b) => b.status === "active").length;
  const availableLeaves = booksList.reduce((acc, b) => acc + (b.available_leaves_count || 0), 0);
  const issuedLeaves = booksList.reduce((acc, b) => acc + (b.issued_leaves_count || 0), 0);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Chequebooks Management", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Chequebooks Management" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "cheque-books", className: "!mb-0" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(BookOpen, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Books" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: totalBooks })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Active Books" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-emerald-600", children: activeBooks })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(FileText, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Available Leaves" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-blue-600", children: availableLeaves })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Issued Leaves" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-purple-600", children: issuedLeaves })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            "Cheque",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "books" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-ink-muted", children: [
            totalBooks,
            " Books"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-48 sm:w-64", children: [
            /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search series, bank...",
                value: search,
                onChange: (e) => {
                  setSearch(e.target.value);
                  handleFilterChange({ search: e.target.value });
                },
                className: "w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-app border-none rounded-lg focus:ring-1 focus:ring-brand-500 text-ink-secondary dark:text-ink"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              value: selectedBank,
              onChange: (val) => {
                setSelectedBank(val);
                handleFilterChange({ bank_account_id: val });
              },
              options: [
                { value: "", label: "All Bank Accounts" },
                ...bankAccounts.map((b) => ({
                  value: String(b.id),
                  label: `${b.name} (${b.bank_name})`
                }))
              ],
              placeholder: "All Bank Accounts",
              inputClassName: "!py-1.5 !px-3 !bg-app !border-none text-xs font-bold",
              className: "w-auto"
            }
          ),
          /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              value: selectedStatus,
              onChange: (val) => {
                setSelectedStatus(val);
                handleFilterChange({ status: val });
              },
              options: [
                { value: "", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "exhausted", label: "Exhausted" },
                { value: "closed", label: "Closed" }
              ],
              placeholder: "All Statuses",
              inputClassName: "!py-1.5 !px-3 !bg-app !border-none text-xs font-bold",
              className: "w-auto"
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.banking.reports.outgoing-cheques", { store_slug: storeSlug }),
              className: "px-3 py-1.5 bg-app hover:bg-interactive-hover text-ink rounded-lg text-xs font-bold flex items-center gap-1.5 border border-line shadow-xs transition-colors",
              children: [
                /* @__PURE__ */ jsx(FileText, { size: 14, className: "text-ink-muted" }),
                /* @__PURE__ */ jsx("span", { children: "Registers" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.banking.cheque-books.create", { store_slug: storeSlug }),
              className: "px-3 py-1.5 bg-brand-600 hover:bg-brand-700 !text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm",
              style: { color: "#ffffff" },
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14, className: "text-white shrink-0" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: "Register Chequebook" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line sticky top-0 z-10", children: [
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Bank Account" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Cheque Range" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Leaf Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Utilization" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: chequeBooks.data && chequeBooks.data.length > 0 ? chequeBooks.data.map((book) => {
          const total = book.total_leaves_count || book.total_leaves || 0;
          const avail = book.available_leaves_count || 0;
          const issued = book.issued_leaves_count || 0;
          const cleared = book.cleared_leaves_count || 0;
          const used = total - avail;
          const pct = total > 0 ? Math.round(used / total * 100) : 0;
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors group", children: [
            /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 shrink-0", children: /* @__PURE__ */ jsx(Building2, { size: 18 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-sm", children: book.bank_account?.name || "Bank Account" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
                  book.bank_account?.bank_name,
                  " ",
                  book.bank_account?.account_number ? `#${book.bank_account.account_number}` : ""
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
              /* @__PURE__ */ jsxs("p", { className: "font-mono text-xs font-bold text-ink", children: [
                book.first_leaf_number,
                " — ",
                book.last_leaf_number
              ] }),
              book.series_prefix && /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted", children: [
                "Prefix: ",
                book.series_prefix
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
              /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", children: [
                avail,
                " Avail"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", children: [
                issued,
                " Issued"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-md font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400", children: [
                cleared,
                " Cleared"
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-36", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-2xs font-bold text-ink mb-1", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  used,
                  " / ",
                  total,
                  " Leaves"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  pct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full bg-sunken h-2 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: `h-full rounded-full transition-all ${pct >= 90 ? "bg-amber-500" : "bg-brand-600"}`,
                  style: { width: `${pct}%` }
                }
              ) })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider ${book.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : book.status === "exhausted" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`, children: book.status }) }),
            /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: route("store.banking.cheque-books.show", { store_slug: storeSlug, id: book.id }),
                  className: "px-3 py-1 bg-app hover:bg-interactive-hover text-ink text-xs font-bold rounded-lg border border-line transition-colors",
                  children: "View Leaves"
                }
              ),
              book.status === "active" && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleCloseBook(book.id),
                  className: "p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 rounded-lg transition-colors",
                  title: "Close Book",
                  children: /* @__PURE__ */ jsx(Ban, { size: 16 })
                }
              ),
              used === 0 && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDeleteBook(book.id),
                  className: "p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 rounded-lg transition-colors",
                  title: "Delete Chequebook",
                  children: /* @__PURE__ */ jsx(XCircle, { size: 16 })
                }
              )
            ] }) })
          ] }, book.id);
        }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12 text-center text-ink-muted", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center", children: [
          /* @__PURE__ */ jsx(BookOpen, { size: 40, className: "mb-2 opacity-40 text-ink-muted" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: "No chequebooks found" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Get started by registering a new bank chequebook." }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.banking.cheque-books.create", { store_slug: storeSlug }),
              className: "mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 !text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-sm",
              style: { color: "#ffffff" },
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14, className: "text-white shrink-0" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: "Register First Chequebook" })
              ]
            }
          )
        ] }) }) }) })
      ] }) })
    ] })
  ] });
}
export {
  ChequeBooksIndex as default
};

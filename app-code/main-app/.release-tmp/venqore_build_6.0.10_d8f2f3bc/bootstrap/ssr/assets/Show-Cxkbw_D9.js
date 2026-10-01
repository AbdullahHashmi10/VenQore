import { jsxs, jsx, Fragment } from "react/jsx-runtime";
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
function ChequeBookShow({ chequeBook, leaves, filters = {} }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug;
  const [search, setSearch] = useState(filters.search || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "");
  const [modalAction, setModalAction] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [actionDate, setActionDate] = useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const handleFilterChange = (newFilters) => {
    router.get(route("store.banking.cheque-books.show", { store_slug: storeSlug, id: chequeBook.id }), {
      search: newFilters.search !== void 0 ? newFilters.search : search,
      status: newFilters.status !== void 0 ? newFilters.status : statusFilter
    }, { preserveState: true, replace: true });
  };
  const handleActionSubmit = (e) => {
    e.preventDefault();
    if (!modalAction) return;
    setSubmitting(true);
    const { type, leaf } = modalAction;
    let url = "";
    let payload = {};
    if (type === "void") {
      url = route("store.banking.cheque-leaves.void", { store_slug: storeSlug, id: leaf.id });
      payload = { reason: actionReason };
    } else if (type === "stop") {
      url = route("store.banking.cheque-leaves.stop", { store_slug: storeSlug, id: leaf.id });
      payload = { reason: actionReason };
    } else if (type === "clear") {
      url = route("store.banking.cheque-leaves.clear", { store_slug: storeSlug, id: leaf.id });
      payload = { clear_date: actionDate };
    } else if (type === "bounce") {
      url = route("store.banking.cheque-leaves.bounce", { store_slug: storeSlug, id: leaf.id });
      payload = { reason: actionReason, bounce_date: actionDate };
    }
    router.post(url, payload, {
      onSuccess: () => {
        setModalAction(null);
        setActionReason("");
      },
      onFinish: () => setSubmitting(false)
    });
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
      case "reserved":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
      case "issued":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
      case "cleared":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300";
      case "bounced":
        return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
      case "stopped":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300";
      case "void":
        return "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300";
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Chequebook ${chequeBook.series_prefix ? chequeBook.series_prefix + "-" : ""}${chequeBook.start_number}`, activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: `Chequebook ${chequeBook.series_prefix ? chequeBook.series_prefix + "-" : ""}${chequeBook.start_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "cheque-books", className: "!mb-0" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Total Leaves" }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink mt-0.5", children: chequeBook.total_leaves_count || chequeBook.total_leaves })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-wider text-emerald-600", children: "Available" }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-emerald-600 mt-0.5", children: chequeBook.available_leaves_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-wider text-amber-600", children: "Reserved" }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-amber-600 mt-0.5", children: chequeBook.reserved_leaves_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-wider text-blue-600", children: "Issued" }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-blue-600 mt-0.5", children: chequeBook.issued_leaves_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-wider text-purple-600", children: "Cleared" }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-purple-600 mt-0.5", children: chequeBook.cleared_leaves_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-wider text-rose-600", children: "Bounced" }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-rose-600 mt-0.5", children: chequeBook.bounced_leaves_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: "Void / Stop" }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink-muted mt-0.5", children: (chequeBook.void_leaves_count || 0) + (chequeBook.stopped_leaves_count || 0) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.banking.cheque-books.index", { store_slug: storeSlug }),
              className: "p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors",
              children: /* @__PURE__ */ jsx(ArrowLeft, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h1", { className: "text-base font-bold text-ink uppercase tracking-tight", children: [
            "Book: ",
            /* @__PURE__ */ jsxs("span", { className: "text-brand-600", children: [
              chequeBook.series_prefix ? `${chequeBook.series_prefix}-` : "",
              String(chequeBook.start_number).padStart(chequeBook.padding_zeros || 6, "0"),
              " ... ",
              String(chequeBook.end_number).padStart(chequeBook.padding_zeros || 6, "0")
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-48 sm:w-64", children: [
            /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search leaf #, payee...",
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
              value: statusFilter,
              onChange: (val) => {
                setStatusFilter(val);
                handleFilterChange({ status: val });
              },
              options: [
                { value: "", label: "All Leaf Statuses" },
                { value: "available", label: "Available" },
                { value: "reserved", label: "Reserved" },
                { value: "issued", label: "Issued" },
                { value: "cleared", label: "Cleared" },
                { value: "bounced", label: "Bounced" },
                { value: "stopped", label: "Stopped" },
                { value: "void", label: "Void" }
              ],
              placeholder: "All Leaf Statuses",
              inputClassName: "!py-1.5 !px-3 !bg-app !border-none text-xs font-bold",
              className: "w-auto"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm text-neutral-600 dark:text-neutral-300", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Cheque Number" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Payee / Party" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Amount" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Cheque Date" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Notes / Reason" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: leaves.data && leaves.data.length > 0 ? leaves.data.map((leaf) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100", children: leaf.display_serial_number }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadge(leaf.status)}`, children: leaf.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: leaf.party?.name || leaf.payment?.party?.name || /* @__PURE__ */ jsx("span", { className: "text-neutral-400 italic", children: "—" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100", children: leaf.amount ? formatCurrency(leaf.amount) : "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs", children: leaf.cheque_date || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs text-neutral-500 max-w-xs truncate", children: leaf.status_reason || (leaf.reserved_by_approval_document_id ? /* @__PURE__ */ jsxs("span", { className: "text-amber-600 font-medium", children: [
            "Pending Approval #",
            leaf.reserved_by_approval_document_id
          ] }) : "—") }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
            leaf.status === "available" && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setModalAction({ type: "void", leaf }),
                className: "px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors",
                children: "Void Leaf"
              }
            ),
            leaf.status === "issued" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setModalAction({ type: "clear", leaf }),
                  className: "px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded transition-colors",
                  children: "Clear"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setModalAction({ type: "bounce", leaf }),
                  className: "px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded transition-colors",
                  children: "Bounce"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setModalAction({ type: "stop", leaf }),
                  className: "px-2.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded transition-colors",
                  children: "Stop"
                }
              )
            ] })
          ] }) })
        ] }, leaf.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "7", className: "px-6 py-8 text-center text-neutral-400", children: "No cheque leaves match current filter." }) }) })
      ] }) }) }),
      modalAction && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 max-w-md w-full shadow-xl space-y-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 dark:text-neutral-100 capitalize", children: [
          modalAction.type === "void" && `Void Cheque Leaf (${modalAction.leaf.display_serial_number})`,
          modalAction.type === "stop" && `Stop Payment on Cheque (${modalAction.leaf.display_serial_number})`,
          modalAction.type === "clear" && `Mark Cheque as Cleared (${modalAction.leaf.display_serial_number})`,
          modalAction.type === "bounce" && `Record Cheque Bounce (${modalAction.leaf.display_serial_number})`
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleActionSubmit, className: "space-y-4", children: [
          (modalAction.type === "clear" || modalAction.type === "bounce") && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1", children: [
              "Date ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: actionDate,
                onChange: (e) => setActionDate(e.target.value),
                className: "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm",
                required: true
              }
            )
          ] }),
          (modalAction.type === "void" || modalAction.type === "stop" || modalAction.type === "bounce") && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1", children: [
              "Reason / Notes ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: modalAction.type === "void" ? "e.g. Printed incorrectly / damaged leaf" : modalAction.type === "stop" ? "e.g. Lost in transit / disputed transaction" : "e.g. Insufficient bank funds",
                value: actionReason,
                onChange: (e) => setActionReason(e.target.value),
                className: "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setModalAction(null),
                className: "px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 rounded-lg",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: submitting,
                className: `px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm ${modalAction.type === "clear" ? "bg-emerald-600 hover:bg-emerald-700" : modalAction.type === "bounce" ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"}`,
                children: submitting ? "Processing..." : "Confirm"
              }
            )
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  ChequeBookShow as default
};

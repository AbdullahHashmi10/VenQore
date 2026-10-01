import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, useForm, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-C3Zz64cZ.js";
import { P as PremiumSelect } from "./PremiumSelect-CyM9VGV1.js";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
import { Clock, Building2, CheckCircle2, AlertTriangle, Search, FileText, Plus, ArrowUpRight, RotateCcw, X } from "lucide-react";
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
function ReceivedChequesIndex({
  receivedCheques,
  bankAccounts = [],
  parties = [],
  stats = {},
  filters = {}
}) {
  const { store } = usePage().props;
  const storeSlug = store?.slug;
  const [search, setSearch] = useState(filters.search || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "");
  const [partyFilter, setPartyFilter] = useState(filters.party_id || "");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [depositModal, setDepositModal] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [actionDate, setActionDate] = useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [depositBankId, setDepositBankId] = useState(bankAccounts.length === 1 ? bankAccounts[0].id : "");
  const [submitting, setSubmitting] = useState(false);
  const { data: createData, setData: setCreateData, post: postCreate, processing: createProcessing, reset: resetCreate, errors: createErrors } = useForm({
    cheque_number: "",
    amount: "",
    party_id: "",
    bank_name: "",
    branch: "",
    cheque_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    notes: ""
  });
  const handleFilterChange = (newFilters) => {
    router.get(route("store.banking.received-cheques.index", { store_slug: storeSlug }), {
      search: newFilters.search !== void 0 ? newFilters.search : search,
      status: newFilters.status !== void 0 ? newFilters.status : statusFilter,
      party_id: newFilters.party_id !== void 0 ? newFilters.party_id : partyFilter
    }, { preserveState: true, replace: true });
  };
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    postCreate(route("store.banking.received-cheques.store", { store_slug: storeSlug }), {
      onSuccess: () => {
        setIsCreateOpen(false);
        resetCreate();
      }
    });
  };
  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!depositModal || !depositBankId) return;
    setSubmitting(true);
    router.post(route("store.banking.received-cheques.deposit", { store_slug: storeSlug, id: depositModal.id }), {
      bank_account_id: depositBankId,
      deposit_date: actionDate
    }, {
      onSuccess: () => setDepositModal(null),
      onFinish: () => setSubmitting(false)
    });
  };
  const handleActionSubmit = (e) => {
    e.preventDefault();
    if (!actionModal) return;
    setSubmitting(true);
    const { type, cheque } = actionModal;
    let url = "";
    let payload = {};
    if (type === "clear") {
      url = route("store.banking.received-cheques.clear", { store_slug: storeSlug, id: cheque.id });
      payload = { clear_date: actionDate };
    } else if (type === "bounce") {
      url = route("store.banking.received-cheques.bounce", { store_slug: storeSlug, id: cheque.id });
      payload = { reason: actionReason, bounce_date: actionDate };
    } else if (type === "return") {
      url = route("store.banking.received-cheques.return", { store_slug: storeSlug, id: cheque.id });
      payload = { reason: actionReason };
    }
    router.post(url, payload, {
      onSuccess: () => {
        setActionModal(null);
        setActionReason("");
      },
      onFinish: () => setSubmitting(false)
    });
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "received":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
      case "deposited":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
      case "cleared":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
      case "bounced":
        return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
      case "returned":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300";
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Received Customer Cheques", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Received Customer Cheques" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "received-cheques", className: "!mb-0" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "In Hand" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-amber-600", children: formatCurrency(stats.total_received || 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(Building2, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Deposited" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-blue-600", children: formatCurrency(stats.total_deposited || 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Cleared" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-emerald-600", children: formatCurrency(stats.total_cleared || 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Bounced" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-rose-600", children: formatCurrency(stats.total_bounced || 0) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            "Received ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Cheques" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-ink-muted", children: [
            receivedCheques.data?.length || 0,
            " Cheques"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-48 sm:w-64", children: [
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
          /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              value: statusFilter,
              onChange: (val) => {
                setStatusFilter(val);
                handleFilterChange({ status: val });
              },
              options: [
                { value: "", label: "All Statuses" },
                { value: "received", label: "In Hand (Received)" },
                { value: "deposited", label: "Deposited" },
                { value: "cleared", label: "Cleared" },
                { value: "bounced", label: "Bounced" },
                { value: "returned", label: "Returned" }
              ],
              placeholder: "All Statuses",
              inputClassName: "!py-1.5 !px-3 !bg-app !border-none text-xs font-bold",
              className: "w-auto"
            }
          ),
          /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              value: partyFilter,
              onChange: (val) => {
                setPartyFilter(val);
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
              inputClassName: "!py-1.5 !px-3 !bg-app !border-none text-xs font-bold",
              className: "w-auto"
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.banking.reports.incoming-cheques", { store_slug: storeSlug }),
              className: "px-3 py-1.5 bg-app hover:bg-interactive-hover text-ink rounded-lg text-xs font-bold flex items-center gap-1.5 border border-line shadow-xs transition-colors",
              children: [
                /* @__PURE__ */ jsx(FileText, { size: 14, className: "text-ink-muted" }),
                /* @__PURE__ */ jsx("span", { children: "Incoming Register" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setIsCreateOpen(true),
              className: "px-3 py-1.5 bg-brand-600 hover:bg-brand-700 !text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm",
              style: { color: "#ffffff" },
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14, className: "text-white shrink-0" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: "Record Cheque" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm text-neutral-600 dark:text-neutral-300", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Cheque Details" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Customer" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Amount" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Deposit Account" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Dates" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200 dark:divide-neutral-700", children: receivedCheques.data && receivedCheques.data.length > 0 ? receivedCheques.data.map((cheque) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors", children: [
          /* @__PURE__ */ jsxs("td", { className: "px-6 py-4", children: [
            /* @__PURE__ */ jsxs("p", { className: "font-mono font-bold text-neutral-900 dark:text-neutral-100", children: [
              "#",
              cheque.cheque_number
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-500", children: [
              cheque.bank_name,
              " ",
              cheque.branch ? `(${cheque.branch})` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-neutral-900 dark:text-neutral-100", children: cheque.party?.name || "Walk-in Customer" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100", children: formatCurrency(cheque.amount) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadge(cheque.status)}`, children: cheque.status === "received" ? "In Hand" : cheque.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs", children: cheque.deposit_bank_account?.name || /* @__PURE__ */ jsx("span", { className: "text-neutral-400 italic", children: "Not deposited yet" }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 text-xs space-y-0.5 text-neutral-500", children: [
            /* @__PURE__ */ jsxs("p", { children: [
              "Cheque: ",
              /* @__PURE__ */ jsx("span", { className: "font-mono text-neutral-700 dark:text-neutral-300", children: cheque.cheque_date })
            ] }),
            cheque.deposit_date && /* @__PURE__ */ jsxs("p", { children: [
              "Deposit: ",
              cheque.deposit_date
            ] }),
            cheque.clear_date && /* @__PURE__ */ jsxs("p", { children: [
              "Clear: ",
              cheque.clear_date
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
            cheque.status === "received" && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setDepositModal(cheque),
                className: "inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition-colors",
                children: [
                  /* @__PURE__ */ jsx(ArrowUpRight, { className: "w-3.5 h-3.5" }),
                  "Deposit"
                ]
              }
            ),
            cheque.status === "deposited" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setActionModal({ type: "clear", cheque }),
                  className: "px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded transition-colors",
                  children: "Clear"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setActionModal({ type: "bounce", cheque }),
                  className: "px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded transition-colors",
                  children: "Bounce"
                }
              )
            ] }),
            cheque.status === "bounced" && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setActionModal({ type: "return", cheque }),
                className: "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-400 hover:bg-orange-50 rounded transition-colors",
                children: [
                  /* @__PURE__ */ jsx(RotateCcw, { className: "w-3 h-3" }),
                  "Return"
                ]
              }
            )
          ] }) })
        ] }, cheque.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "7", className: "px-6 py-8 text-center text-neutral-400", children: "No received cheques match current filter." }) }) })
      ] }) }) }),
      isCreateOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 max-w-lg w-full shadow-xl space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-neutral-900 dark:text-neutral-100", children: "Record Received Customer Cheque" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsCreateOpen(false),
              className: "p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700",
              children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5 text-neutral-400" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleCreateSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold mb-1", children: [
                "Cheque Number ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: createData.cheque_number,
                  onChange: (e) => setCreateData("cheque_number", e.target.value),
                  className: "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm font-mono",
                  required: true
                }
              ),
              createErrors.cheque_number && /* @__PURE__ */ jsx("p", { className: "text-2xs text-red-500 mt-1", children: createErrors.cheque_number })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold mb-1", children: [
                "Amount ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  min: "0.01",
                  value: createData.amount,
                  onChange: (e) => setCreateData("amount", e.target.value),
                  className: "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm font-mono",
                  required: true
                }
              ),
              createErrors.amount && /* @__PURE__ */ jsx("p", { className: "text-2xs text-red-500 mt-1", children: createErrors.amount })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold mb-1", children: [
                "Drawer Bank ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "e.g. HBL, Meezan",
                  value: createData.bank_name,
                  onChange: (e) => setCreateData("bank_name", e.target.value),
                  className: "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold mb-1", children: [
                "Cheque Date ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: createData.cheque_date,
                  onChange: (e) => setCreateData("cheque_date", e.target.value),
                  className: "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold mb-1", children: "Customer / Party" }),
              /* @__PURE__ */ jsx(
                PremiumSelect,
                {
                  value: createData.party_id,
                  onChange: (val) => setCreateData("party_id", val),
                  options: [
                    { value: "", label: "-- Walk-in / General Customer --" },
                    ...parties.map((p) => ({
                      value: String(p.id),
                      label: p.name
                    }))
                  ],
                  placeholder: "-- Walk-in / General Customer --",
                  className: "w-full"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold mb-1", children: "Branch / Notes" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "e.g. Main Branch, Gulberg",
                  value: createData.notes,
                  onChange: (e) => setCreateData("notes", e.target.value),
                  className: "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsCreateOpen(false),
                className: "px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 rounded-lg",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: createProcessing,
                className: "px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm",
                children: createProcessing ? "Recording..." : "Record Cheque"
              }
            )
          ] })
        ] })
      ] }) }),
      depositModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 max-w-md w-full shadow-xl space-y-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 dark:text-neutral-100", children: [
          "Deposit Cheque #",
          depositModal.cheque_number
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-500", children: [
          "Amount: ",
          /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-neutral-800 dark:text-neutral-200", children: formatCurrency(depositModal.amount) })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleDepositSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold mb-1", children: [
              "Company Bank Account ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              PremiumSelect,
              {
                value: depositBankId,
                onChange: (val) => setDepositBankId(val),
                options: [
                  { value: "", label: "-- Select Bank Account --" },
                  ...bankAccounts.map((b) => ({
                    value: String(b.id),
                    label: `${b.name} (${b.bank_name})`
                  }))
                ],
                placeholder: "-- Select Bank Account --",
                className: "w-full"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold mb-1", children: [
              "Deposit Date ",
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
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setDepositModal(null),
                className: "px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 rounded-lg",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: submitting || !depositBankId,
                className: "px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm",
                children: submitting ? "Depositing..." : "Confirm Deposit"
              }
            )
          ] })
        ] })
      ] }) }),
      actionModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 max-w-md w-full shadow-xl space-y-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 dark:text-neutral-100 capitalize", children: [
          actionModal.type === "clear" && `Mark Cheque #${actionModal.cheque.cheque_number} as Cleared`,
          actionModal.type === "bounce" && `Record Bounce for Cheque #${actionModal.cheque.cheque_number}`,
          actionModal.type === "return" && `Return Cheque #${actionModal.cheque.cheque_number} to Customer`
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleActionSubmit, className: "space-y-4", children: [
          (actionModal.type === "clear" || actionModal.type === "bounce") && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold mb-1", children: [
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
          (actionModal.type === "bounce" || actionModal.type === "return") && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold mb-1", children: [
              "Reason / Notes ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: actionModal.type === "bounce" ? "e.g. Insufficient funds / signature mismatch" : "e.g. Returned after bounce settlement",
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
                onClick: () => setActionModal(null),
                className: "px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 rounded-lg",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: submitting,
                className: `px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm ${actionModal.type === "clear" ? "bg-emerald-600 hover:bg-emerald-700" : actionModal.type === "bounce" ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"}`,
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
  ReceivedChequesIndex as default
};

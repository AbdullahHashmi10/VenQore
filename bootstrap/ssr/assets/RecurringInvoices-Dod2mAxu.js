import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { g as getCurrencySymbol } from "./format-131Nyq79.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { ChevronDown, Repeat, Play, Pause, DollarSign, Search, Plus, Printer, Users, Calendar, Edit, Trash2 } from "lucide-react";
import { u as useAlert } from "../ssr.js";
import { S as SellModuleTabs } from "./SellModuleTabs-C_2BbRa0.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "axios";
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
function RecurringInvoicesIndex({ recurringInvoices = [] }) {
  const tt = useTermText();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const { showConfirm, showAlert } = useAlert();
  const { store } = usePage().props;
  const filteredInvoices = useMemo(() => {
    return recurringInvoices.filter((item) => {
      const matchesSearch = !searchTerm || item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recurringInvoices, searchTerm, statusFilter]);
  const stats = useMemo(() => {
    return {
      total: recurringInvoices.length,
      active: recurringInvoices.filter((i) => i.status === "active").length,
      paused: recurringInvoices.filter((i) => i.status === "paused").length,
      monthlyRevenue: recurringInvoices.filter((i) => i.status === "active").reduce((sum, i) => sum + parseFloat(i.amount || 0), 0)
    };
  }, [recurringInvoices]);
  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      completed: "bg-neutral-100 text-ink-secondary dark:bg-app dark:text-ink-muted"
    };
    return styles[status] || styles.active;
  };
  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly"
    };
    return labels[frequency] || frequency;
  };
  const handleToggleStatus = (invoice) => {
    const newStatus = invoice.status === "active" ? "paused" : "active";
    showConfirm({
      title: `${newStatus === "active" ? "Resume" : "Pause"} Recurring Invoice?`,
      message: `This will ${newStatus === "active" ? "resume" : "pause"} automatic invoice generation.`,
      type: "warning",
      confirmLabel: "Yes, Continue",
      onConfirm: () => {
        router.post(route("store.recurring-invoices.toggle", invoice.id));
      }
    });
  };
  const handleDelete = (invoice) => {
    showConfirm({
      title: "Delete Recurring Invoice?",
      message: "This will stop all future invoices. Existing invoices will remain.",
      type: "danger",
      confirmLabel: "Yes, Delete",
      onConfirm: () => {
        router.delete(route("store.recurring-invoices.destroy", invoice.id));
      }
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Recurring Invoices", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Recurring Invoices" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-app p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "recurring" }),
      /* @__PURE__ */ jsxs("div", { className: "flex md:hidden items-center justify-between bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase text-left shrink-0 mr-2",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `transition-transform duration-normal ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1 items-end text-xs font-bold text-ink-secondary", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-brand-600 dark:text-brand-400", children: [
            "Total: ",
            stats.total
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-neutral-300 dark:text-ink-secondary", children: "|" }),
          /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
            "Active: ",
            stats.active
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(Repeat, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: stats.total })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(Play, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Active" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-emerald-600", children: stats.active })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Pause, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Paused" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-amber-600", children: stats.paused })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(DollarSign, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Monthly Revenue" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-brand-600", children: (stats.monthlyRevenue < 0 ? "-" : "") + getCurrencySymbol() + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(stats.monthlyRevenue) || 0) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            "Recurring ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Invoices" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("active"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "active" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Active"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("paused"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "paused" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Paused"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-64 relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: tt("Search by title or customer..."),
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none text-ink"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none", size: 16 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-l border-line pl-2", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.recurring-invoices.create", { store_slug: store.slug }),
                className: "p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold hidden sm:inline", children: "New Recurring" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("button", { className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-bold text-ink uppercase tracking-tight", children: "Recurring Invoices" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileSearch ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                title: "Search",
                children: /* @__PURE__ */ jsx(Search, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileFilters(!showMobileFilters);
                  if (showMobileSearch) setShowMobileSearch(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileFilters ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                title: "Filters",
                children: /* @__PURE__ */ jsx(ChevronDown, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.recurring-invoices.create", { store_slug: store.slug }),
                className: "p-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors",
                title: "New Recurring",
                children: /* @__PURE__ */ jsx(Plus, { size: 16 })
              }
            )
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsxs("div", { className: "w-full relative mt-1 border-t border-line pt-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: tt("Search by title or customer..."),
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none text-ink"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-[65%] -translate-y-1/2 text-ink-muted pointer-events-none", size: 14 })
        ] }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "w-full mt-1 border-t border-line pt-2 flex flex-col gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("active"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "active" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "Active"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("paused"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "paused" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "Paused"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto md:rounded-xl md:border md:border-line md:dark:border-line md:shadow-sm bg-transparent md:bg-white md:dark:bg-app", children: [
        /* @__PURE__ */ jsxs("table", { className: "hidden md:table w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted font-bold uppercase text-2xs tracking-widest sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Title" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: tt("Customer") }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right", children: "Amount" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Frequency" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Next Invoice" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Generated" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: filteredInvoices.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: "8", className: "px-6 py-12 text-center", children: [
            /* @__PURE__ */ jsx(Repeat, { size: 48, className: "mx-auto text-ink-muted mb-4" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-secondary font-bold", children: "No recurring invoices found" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mt-1", children: "Create one to automate your billing" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.recurring-invoices.create", { store_slug: store.slug }),
                className: "mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium shadow-md",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  "Create Recurring Invoice"
                ]
              }
            )
          ] }) }) : filteredInvoices.map((invoice) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: invoice.title || `Recurring #${invoice.id}` }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Users, { size: 14, className: "text-brand-600 dark:text-brand-400" }) }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-ink-secondary", children: invoice.customer?.name || "Unknown" })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: (parseFloat(invoice.amount || 0) < 0 ? "-" : "") + getCurrencySymbol() + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(parseFloat(invoice.amount || 0)) || 0) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-lg text-xs font-bold", children: getFrequencyLabel(invoice.frequency) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-secondary", children: [
              /* @__PURE__ */ jsx(Calendar, { size: 14 }),
              invoice.next_invoice_date ? new Date(invoice.next_invoice_date).toLocaleDateString() : "-"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: invoice.invoices_generated || 0 }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(invoice.status)}`, children: invoice.status || "active" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleToggleStatus(invoice),
                  className: `p-2 rounded-lg transition-all ${invoice.status === "active" ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`,
                  title: invoice.status === "active" ? "Pause" : "Resume",
                  children: invoice.status === "active" ? /* @__PURE__ */ jsx(Pause, { size: 18 }) : /* @__PURE__ */ jsx(Play, { size: 18 })
                }
              ),
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: route("store.recurring-invoices.edit", invoice.id),
                  className: "p-2 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all",
                  children: /* @__PURE__ */ jsx(Edit, { size: 18 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDelete(invoice),
                  className: "p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 18 })
                }
              )
            ] }) })
          ] }, invoice.id)) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: filteredInvoices.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl p-8 text-center border border-line", children: [
          /* @__PURE__ */ jsx(Repeat, { size: 32, className: "mx-auto text-ink-muted mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink-secondary", children: "No recurring invoices found" })
        ] }) : filteredInvoices.map((invoice) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "bg-surface p-4 rounded-xl border border-line shadow-sm flex flex-col gap-3 transition-transform",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-ink", children: invoice.title || `Recurring #${invoice.id}` }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-2xs text-ink-muted mt-0.5", children: [
                    /* @__PURE__ */ jsx(Calendar, { size: 10 }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Next: ",
                      invoice.next_invoice_date ? new Date(invoice.next_invoice_date).toLocaleDateString() : "-"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${getStatusBadge(invoice.status)}`, children: invoice.status || "active" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-b border-line py-2.5", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: tt("Customer") }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink mt-0.5", children: invoice.customer?.name || "Unknown" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "Amount" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-brand-600 dark:text-brand-400 mt-0.5", children: (parseFloat(invoice.amount || 0) < 0 ? "-" : "") + getCurrencySymbol() + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(parseFloat(invoice.amount || 0)) || 0) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-ink-muted text-1xs", children: [
                  "Freq: ",
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-ink-secondary", children: getFrequencyLabel(invoice.frequency) }),
                  " • Gen: ",
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-ink-secondary", children: invoice.invoices_generated || 0 })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleToggleStatus(invoice),
                      className: `p-1.5 rounded-lg border transition-colors ${invoice.status === "active" ? "text-amber-600 border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10" : "text-emerald-600 border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10"}`,
                      title: invoice.status === "active" ? "Pause" : "Resume",
                      children: invoice.status === "active" ? /* @__PURE__ */ jsx(Pause, { size: 14 }) : /* @__PURE__ */ jsx(Play, { size: 14 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: route("store.recurring-invoices.edit", invoice.id),
                      className: "p-1.5 text-ink-muted bg-app border border-line rounded-lg hover:text-brand-600 transition-colors",
                      children: /* @__PURE__ */ jsx(Edit, { size: 14 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDelete(invoice),
                      className: "p-1.5 text-ink-muted bg-app border border-line rounded-lg hover:text-red-600 transition-colors",
                      children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                    }
                  )
                ] })
              ] })
            ]
          },
          invoice.id
        )) })
      ] })
    ] })
  ] });
}
export {
  RecurringInvoicesIndex as default
};

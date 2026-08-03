import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { ChevronDown, Repeat, Play, Pause, DollarSign, Search, Plus, Printer, Users, Calendar, Edit, Trash2 } from "lucide-react";
import { u as useAlert } from "../ssr.js";
import { S as SellModuleTabs } from "./SellModuleTabs-_fjGjxMs.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "laravel-echo";
import "pusher-js";
function RecurringInvoicesIndex({ recurringInvoices = [] }) {
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
      completed: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400"
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
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-slate-50 dark:bg-slate-950 p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "recurring" }),
      /* @__PURE__ */ jsxs("div", { className: "flex md:hidden items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase text-left shrink-0 mr-2",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `transition-transform duration-200 ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1 items-end text-xs font-extrabold text-slate-700 dark:text-slate-300", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-indigo-600 dark:text-indigo-400", children: [
            "Total: ",
            stats.total
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
          /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
            "Active: ",
            stats.active
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Repeat, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats.total })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(Play, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Active" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: stats.active })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Pause, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Paused" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-amber-600", children: stats.paused })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg", children: /* @__PURE__ */ jsx(DollarSign, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Monthly Revenue" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-purple-600", children: (stats.monthlyRevenue < 0 ? "-" : "") + getCurrencySymbol() + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(stats.monthlyRevenue) || 0) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Recurring ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Invoices" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("active"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "active" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Active"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("paused"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "paused" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
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
                placeholder: "Search by title or customer...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-slate-800 dark:text-white"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 16 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-2", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.recurring-invoices.create", { store_slug: store.slug }),
                className: "p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold hidden sm:inline", children: "New Recurring" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("button", { className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight", children: "Recurring Invoices" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileSearch ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
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
                className: `p-2 rounded-lg transition-colors ${showMobileFilters ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                title: "Filters",
                children: /* @__PURE__ */ jsx(ChevronDown, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.recurring-invoices.create", { store_slug: store.slug }),
                className: "p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors",
                title: "New Recurring",
                children: /* @__PURE__ */ jsx(Plus, { size: 16 })
              }
            )
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsxs("div", { className: "w-full relative mt-1 border-t border-slate-100 dark:border-slate-800 pt-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search by title or customer...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-slate-800 dark:text-white"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-[65%] -translate-y-1/2 text-slate-400 pointer-events-none", size: 14 })
        ] }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "w-full mt-1 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("active"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "active" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Active"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("paused"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "paused" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Paused"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto md:rounded-xl md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm bg-transparent md:bg-white md:dark:bg-slate-900", children: [
        /* @__PURE__ */ jsxs("table", { className: "hidden md:table w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-2xs tracking-widest sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-200 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Title" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Customer" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right", children: "Amount" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Frequency" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Next Invoice" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Generated" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filteredInvoices.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: "8", className: "px-6 py-12 text-center", children: [
            /* @__PURE__ */ jsx(Repeat, { size: 48, className: "mx-auto text-slate-400 dark:text-slate-600 mb-4" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-300 font-bold", children: "No recurring invoices found" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm mt-1", children: "Create one to automate your billing" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.recurring-invoices.create", { store_slug: store.slug }),
                className: "mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-md",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  "Create Recurring Invoice"
                ]
              }
            )
          ] }) }) : filteredInvoices.map((invoice) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: invoice.title || `Recurring #${invoice.id}` }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Users, { size: 14, className: "text-purple-600 dark:text-purple-400" }) }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-700 dark:text-slate-300", children: invoice.customer?.name || "Unknown" })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: (parseFloat(invoice.amount || 0) < 0 ? "-" : "") + getCurrencySymbol() + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(parseFloat(invoice.amount || 0)) || 0) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-bold", children: getFrequencyLabel(invoice.frequency) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-600 dark:text-slate-400", children: [
              /* @__PURE__ */ jsx(Calendar, { size: 14 }),
              invoice.next_invoice_date ? new Date(invoice.next_invoice_date).toLocaleDateString() : "-"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: invoice.invoices_generated || 0 }) }),
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
                  className: "p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all",
                  children: /* @__PURE__ */ jsx(Edit, { size: 18 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDelete(invoice),
                  className: "p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 18 })
                }
              )
            ] }) })
          ] }, invoice.id)) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: filteredInvoices.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(Repeat, { size: 32, className: "mx-auto text-slate-400 mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-350", children: "No recurring invoices found" })
        ] }) : filteredInvoices.map((invoice) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 transition-transform",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-slate-800 dark:text-white", children: invoice.title || `Recurring #${invoice.id}` }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-2xs text-slate-400 mt-0.5", children: [
                    /* @__PURE__ */ jsx(Calendar, { size: 10 }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Next: ",
                      invoice.next_invoice_date ? new Date(invoice.next_invoice_date).toLocaleDateString() : "-"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-2xs font-black uppercase ${getStatusBadge(invoice.status)}`, children: invoice.status || "active" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-b border-slate-100 dark:border-slate-800/60 py-2.5", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-500 uppercase tracking-wider", children: "Customer" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-black text-slate-800 dark:text-white mt-0.5", children: invoice.customer?.name || "Unknown" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-500 uppercase tracking-wider", children: "Amount" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5", children: (parseFloat(invoice.amount || 0) < 0 ? "-" : "") + getCurrencySymbol() + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(parseFloat(invoice.amount || 0)) || 0) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-slate-500 text-1xs", children: [
                  "Freq: ",
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-350", children: getFrequencyLabel(invoice.frequency) }),
                  " • Gen: ",
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-350", children: invoice.invoices_generated || 0 })
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
                      className: "p-1.5 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg hover:text-indigo-600 transition-colors",
                      children: /* @__PURE__ */ jsx(Edit, { size: 14 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDelete(invoice),
                      className: "p-1.5 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg hover:text-red-600 transition-colors",
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

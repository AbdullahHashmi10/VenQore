import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { P as Pagination } from "./Pagination-s9WRz22Z.js";
import { useDebounce } from "use-debounce";
import { ChevronDown, Bell, Clock, CheckCircle, Search, Plus, Printer, FileText, User, Calendar, Mail, MessageSquare, Send } from "lucide-react";
import { u as useAlert } from "../ssr.js";
import { S as SellModuleTabs } from "./SellModuleTabs-tFeLhiIQ.js";
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
function InvoiceReminders({ reminders = { data: [], links: [] }, stats = {}, filters = {} }) {
  const {
    store
  } = usePage().props;
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "all");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const { showConfirm, showAlert } = useAlert();
  useEffect(() => {
    if (debouncedSearch !== (filters.search || "")) {
      router.get(route("store.invoice-reminders.index", { store_slug: store.slug }), {
        search: debouncedSearch,
        status: statusFilter === "all" ? null : statusFilter
      }, {
        preserveState: true,
        preserveScroll: true,
        replace: true
      });
    }
  }, [debouncedSearch]);
  const handleStatusChange = (status) => {
    setStatusFilter(status);
    router.get(route("store.invoice-reminders.index", { store_slug: store.slug }), {
      search: searchTerm,
      status: status === "all" ? null : status
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true
    });
  };
  const getStatusBadge = (status) => {
    const styles = {
      sent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400"
    };
    return styles[status] || styles.pending;
  };
  const handleSendNow = (reminder) => {
    showConfirm({
      title: "Send Reminder Now?",
      message: `This will immediately send the reminder to ${reminder.customer?.name}.`,
      type: "info",
      confirmLabel: "Send Now",
      onConfirm: () => {
        router.post(route("store.invoice-reminders.send", reminder.id), {}, {
          onSuccess: () => showAlert({ title: "Sent", message: "Reminder sent successfully", type: "success" })
        });
      }
    });
  };
  const reminderList = reminders.data || [];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Invoice Reminders", activeMenu: "Sales", children: [
    /* @__PURE__ */ jsx(Head, { title: "Invoice Reminders" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-slate-50 dark:bg-slate-950 p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "reminders" }),
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
            stats.total || 0
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
          /* @__PURE__ */ jsxs("span", { className: "text-amber-600", children: [
            "Pending: ",
            stats.pending || 0
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Bell, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Scheduled" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats.total || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Pending" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-amber-600", children: stats.pending || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Sent" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: stats.sent || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Overdue" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-red-600", children: stats.overdue || 0 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Invoice ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Reminders" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("pending"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "pending" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("sent"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "sent" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Sent"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-64 relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search by invoice or customer...",
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
                href: route("store.invoice-reminders.create", { store_slug: store.slug }),
                className: "p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold hidden sm:inline", children: "New Reminder" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("button", { className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight", children: "Invoice Reminders" }),
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
                href: route("store.invoice-reminders.create", { store_slug: store.slug }),
                className: "p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors",
                title: "New Reminder",
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
              placeholder: "Search by invoice or customer...",
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
              onClick: () => handleStatusChange("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("pending"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "pending" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("sent"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "sent" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Sent"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto md:rounded-xl md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm bg-transparent md:bg-white md:dark:bg-slate-900 flex flex-col justify-between", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-2xs tracking-widest sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-200 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left", children: "Invoice" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left", children: "Customer" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left", children: "Scheduled For" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Type" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-center", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: reminderList.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: "6", className: "px-6 py-12 text-center", children: [
            /* @__PURE__ */ jsx(Bell, { size: 48, className: "mx-auto text-slate-300 dark:text-slate-600 mb-4" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 font-medium", children: "No scheduled reminders found" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Schedule a reminder to notify customers" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.invoice-reminders.create", { store_slug: store.slug }),
                className: "mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  "New Reminder"
                ]
              }
            )
          ] }) }) : reminderList.map((reminder) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(FileText, { size: 16, className: "text-slate-400" }),
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: route("store.sales.show", [store.slug, reminder.invoice_id]),
                  className: "font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400",
                  children: reminder.invoice?.reference_number || "Unknown Invoice"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(User, { size: 14, className: "text-slate-400" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-800 dark:text-white", children: reminder.customer?.name || "Unknown" })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-slate-600 dark:text-slate-400", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calendar, { size: 14 }),
              new Date(reminder.scheduled_at).toLocaleDateString()
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400", children: [
              reminder.type === "email" ? /* @__PURE__ */ jsx(Mail, { size: 14 }) : /* @__PURE__ */ jsx(MessageSquare, { size: 14 }),
              /* @__PURE__ */ jsx("span", { className: "capitalize", children: reminder.type })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(reminder.status)}`, children: reminder.status || "pending" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: reminder.status === "pending" && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleSendNow(reminder),
                className: "p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all",
                title: "Send Now",
                children: /* @__PURE__ */ jsx(Send, { size: 18 })
              }
            ) })
          ] }, reminder.id)) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: reminderList.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(Bell, { size: 32, className: "mx-auto text-slate-400 mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-350", children: "No scheduled reminders found" })
        ] }) : reminderList.map((reminder) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 transition-transform",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx(FileText, { size: 14, className: "text-slate-400" }),
                    /* @__PURE__ */ jsx(
                      Link,
                      {
                        href: route("store.sales.show", [store.slug, reminder.invoice_id]),
                        className: "font-bold text-sm text-indigo-600 dark:text-indigo-400 hover:underline",
                        children: reminder.invoice?.reference_number || "Unknown Invoice"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-2xs text-slate-400 mt-1", children: [
                    /* @__PURE__ */ jsx(Calendar, { size: 10 }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Sched: ",
                      new Date(reminder.scheduled_at).toLocaleDateString()
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-2xs font-black uppercase ${getStatusBadge(reminder.status)}`, children: reminder.status || "pending" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-b border-slate-100 dark:border-slate-800/60 py-2.5", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-500 uppercase tracking-wider", children: "Customer" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-0.5", children: [
                    /* @__PURE__ */ jsx(User, { size: 12, className: "text-slate-400" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-800 dark:text-white", children: reminder.customer?.name || "Unknown" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-500 uppercase tracking-wider", children: "Type" }),
                  /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-2xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5", children: [
                    reminder.type === "email" ? /* @__PURE__ */ jsx(Mail, { size: 10 }) : /* @__PURE__ */ jsx(MessageSquare, { size: 10 }),
                    /* @__PURE__ */ jsx("span", { className: "capitalize", children: reminder.type })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs", children: [
                /* @__PURE__ */ jsx("div", {}),
                /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: reminder.status === "pending" && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleSendNow(reminder),
                    className: "px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold transition-all shadow-md flex items-center gap-1 text-1xs",
                    children: [
                      /* @__PURE__ */ jsx(Send, { size: 12 }),
                      /* @__PURE__ */ jsx("span", { children: "Send Now" })
                    ]
                  }
                ) })
              ] })
            ]
          },
          reminder.id
        )) }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsx(Pagination, { links: reminders.links }) })
      ] })
    ] })
  ] });
}
export {
  InvoiceReminders as default
};

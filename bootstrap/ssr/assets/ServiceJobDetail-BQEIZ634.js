import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { ArrowLeft, Receipt, CheckCircle2, Clock, User, Calendar, MapPin, Wrench, Plus, RotateCcw, DollarSign, ExternalLink, FileText, AlertCircle, TrendingUp, X } from "lucide-react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const STATUS_META = {
  draft: { label: "Draft", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  on_hold: { label: "On Hold", className: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" },
  awaiting_parts: { label: "Awaiting Parts", className: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  invoiced: { label: "Invoiced", className: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" }
};
const NEXT_STATUS = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "on_hold", "cancelled"],
  in_progress: ["on_hold", "awaiting_parts", "completed", "cancelled"],
  on_hold: ["scheduled", "in_progress", "cancelled"],
  awaiting_parts: ["in_progress", "cancelled"],
  completed: ["invoiced"],
  invoiced: [],
  cancelled: []
};
function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, className: "bg-sunken text-ink-secondary" };
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold ${meta.className}`, children: meta.label });
}
const EVENT_ICON = {
  created: FileText,
  status_changed: Clock,
  technician_assigned: User,
  technician_unassigned: User,
  invoiced: Receipt
};
function ServiceJobDetail({ job, employees = [], tools = [] }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "");
  const [busy, setBusy] = useState(false);
  const tt = useTermText();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_id: "", role: "primary" });
  const [isCheckoutToolModalOpen, setIsCheckoutToolModalOpen] = useState(false);
  const [checkoutToolForm, setCheckoutToolForm] = useState({ tool_id: "", quantity: 1 });
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_for: job.scheduled_for || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    scheduled_start_at: job.scheduled_start_at || "",
    scheduled_end_at: job.scheduled_end_at || ""
  });
  const changeStatus = (status) => {
    if (busy) return;
    setBusy(true);
    router.post(
      route("store.service-jobs.status", { store_slug: storeSlug, serviceJob: job.id }),
      { status },
      { preserveScroll: true, onFinish: () => setBusy(false) }
    );
  };
  const convertInvoice = () => {
    if (busy) return;
    setBusy(true);
    router.post(
      route("store.service-jobs.convert-invoice", { store_slug: storeSlug, serviceJob: job.id }),
      {},
      { preserveScroll: true, onFinish: () => setBusy(false) }
    );
  };
  const handleAssign = (e) => {
    e.preventDefault();
    router.post(
      route("store.service-jobs.assign", { store_slug: storeSlug, serviceJob: job.id }),
      assignForm,
      {
        preserveScroll: true,
        onSuccess: () => setIsAssignModalOpen(false)
      }
    );
  };
  const handleUnassign = (employeeId) => {
    if (!confirm(tt("Are you sure you want to unassign this technician?"))) return;
    router.delete(
      route("store.service-jobs.unassign", { store_slug: storeSlug, serviceJob: job.id, employeeId }),
      { preserveScroll: true }
    );
  };
  const handleCheckoutTool = (e) => {
    e.preventDefault();
    router.post(
      route("store.service-jobs.checkout-tool", { store_slug: storeSlug, serviceJob: job.id }),
      checkoutToolForm,
      {
        preserveScroll: true,
        onSuccess: () => setIsCheckoutToolModalOpen(false)
      }
    );
  };
  const handleReturnTool = (toolId) => {
    router.post(
      route("store.service-jobs.return-tool", { store_slug: storeSlug, serviceJob: job.id, toolId }),
      {},
      { preserveScroll: true }
    );
  };
  const handleUpdateSchedule = (e) => {
    e.preventDefault();
    router.post(
      route("store.service-jobs.update-schedule", { store_slug: storeSlug, serviceJob: job.id }),
      scheduleForm,
      {
        preserveScroll: true,
        onSuccess: () => setIsScheduleModalOpen(false)
      }
    );
  };
  const lines = job.lines || [];
  const revenueTotal = lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unit_price), 0) || Number(job.estimated_total) || 0;
  const expenses = job.expenses || [];
  const expensesTotal = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const netMargin = revenueTotal - expensesTotal;
  const marginPercentage = revenueTotal > 0 ? (netMargin / revenueTotal * 100).toFixed(1) : 0;
  const nextOptions = NEXT_STATUS[job.status] || [];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: job.number, activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: `${job.number} — ${job.title}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 py-6 sm:px-6", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("store.service-jobs.index", { store_slug: storeSlug }),
          className: "inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
            tt("Back to Work Orders")
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight text-ink", children: job.number }),
            /* @__PURE__ */ jsx(StatusBadge, { status: job.status }),
            /* @__PURE__ */ jsxs("span", { className: "rounded-md border border-line bg-app px-2 py-0.5 text-2xs font-semibold uppercase text-ink-muted", children: [
              job.priority || "Normal",
              " Priority"
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-secondary", children: job.title })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          job.status === "completed" && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: convertInvoice,
              disabled: busy || lines.length === 0,
              className: "inline-flex h-10 items-center gap-2 rounded-lg bg-accent-fill px-4 text-sm font-semibold text-accent-on shadow-glow transition-colors hover:bg-accent-fill-hover disabled:opacity-60",
              children: [
                /* @__PURE__ */ jsx(Receipt, { size: 16 }),
                "Convert to Invoice"
              ]
            }
          ),
          job.status === "invoiced" && job.invoice && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-secondary", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 16, className: "text-emerald-500" }),
            "Invoiced as ",
            job.invoice.invoice_number
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-6 lg:col-span-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-ink", children: tt("Job & Customer Details") }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setIsScheduleModalOpen(true),
                  className: "text-xs font-semibold text-accent-text hover:underline flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Clock, { size: 13 }),
                    " Reschedule"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("dl", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-line bg-app p-3", children: [
                /* @__PURE__ */ jsxs("dt", { className: "flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: [
                  /* @__PURE__ */ jsx(User, { size: 12 }),
                  " ",
                  tt("Customer")
                ] }),
                /* @__PURE__ */ jsx("dd", { className: "mt-1 font-semibold text-ink", children: job.party?.name || "Walk-in" }),
                job.party?.phone && /* @__PURE__ */ jsx("dd", { className: "text-xs text-ink-muted mt-0.5", children: job.party.phone })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-line bg-app p-3", children: [
                /* @__PURE__ */ jsxs("dt", { className: "flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: [
                  /* @__PURE__ */ jsx(Calendar, { size: 12 }),
                  " Scheduled Date & Time"
                ] }),
                /* @__PURE__ */ jsx("dd", { className: "mt-1 font-semibold text-ink", children: job.scheduled_start_at ? new Date(job.scheduled_start_at).toLocaleString() : job.scheduled_for || "Not set" })
              ] }),
              job.site_address && /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 rounded-lg border border-line bg-app p-3", children: [
                /* @__PURE__ */ jsxs("dt", { className: "flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: [
                  /* @__PURE__ */ jsx(MapPin, { size: 12 }),
                  " Site Location Address"
                ] }),
                /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-ink", children: job.site_address })
              ] }),
              job.description && /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 rounded-lg border border-line bg-app p-3", children: [
                /* @__PURE__ */ jsx("dt", { className: "text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Description / Notes" }),
                /* @__PURE__ */ jsx("dd", { className: "mt-1 text-xs leading-relaxed text-ink-secondary", children: job.description })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-ink mb-3", children: tt("Billable Scope & Services") }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: [
                /* @__PURE__ */ jsx("th", { className: "py-2.5 pr-3", children: tt("Item / Service") }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 pr-3 text-right", children: "Qty" }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 pr-3 text-right", children: "Unit Rate" }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 pl-3 text-right", children: "Total" })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-line", children: [
                lines.map((line) => /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsxs("td", { className: "py-3 pr-3 text-ink", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-medium", children: line.description }),
                    /* @__PURE__ */ jsx("span", { className: "text-3xs uppercase tracking-wider text-ink-muted", children: line.kind })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 pr-3 text-right text-ink-secondary", children: line.quantity }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 pr-3 text-right text-ink-secondary font-mono", children: formatCurrency(line.unit_price) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 pl-3 text-right font-semibold text-ink font-mono", children: formatCurrency(Number(line.quantity) * Number(line.unit_price)) })
                ] }, line.id)),
                lines.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-6 text-center text-xs text-ink-muted", children: "No specific billable line items entered." }) })
              ] }),
              lines.length > 0 && /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "border-t border-line bg-sunken/20", children: [
                /* @__PURE__ */ jsx("td", { colSpan: 3, className: "py-3 pr-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted", children: "Total Billable Value" }),
                /* @__PURE__ */ jsx("td", { className: "py-3 pl-3 text-right text-sm font-bold text-ink font-mono", children: formatCurrency(revenueTotal) })
              ] }) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold text-ink flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Wrench, { size: 16, className: "text-accent-text" }),
                  "Field Tools & Equipment Custody"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: tt("Tools checked out for this job assignment.") })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setIsCheckoutToolModalOpen(true),
                  className: "inline-flex items-center gap-1.5 rounded-lg border border-line bg-app px-2.5 py-1.5 text-xs font-semibold text-accent-text hover:bg-sunken",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 13 }),
                    "Check Out Tool"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              (job.tools || []).map((jt) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-app p-3",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-ink-muted border border-line", children: /* @__PURE__ */ jsx(Wrench, { size: 15 }) }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-ink", children: jt.tool?.name || `Tool #${jt.tool_id}` }),
                        /* @__PURE__ */ jsxs("p", { className: "text-3xs text-ink-muted", children: [
                          "Taken: ",
                          new Date(jt.taken_at).toLocaleString(),
                          jt.quantity > 1 ? ` &bull; Qty: ${jt.quantity}` : ""
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("div", { children: jt.returned_at ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { size: 12 }),
                      " Returned"
                    ] }) : /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleReturnTool(jt.tool_id),
                        className: "inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-2xs font-semibold text-ink hover:bg-emerald-50 hover:text-emerald-700 transition-colors",
                        children: [
                          /* @__PURE__ */ jsx(RotateCcw, { size: 12 }),
                          "Mark Returned"
                        ]
                      }
                    ) })
                  ]
                },
                jt.id
              )),
              (!job.tools || job.tools.length === 0) && /* @__PURE__ */ jsx("p", { className: "py-4 text-center text-xs text-ink-muted", children: tt("No tools checked out for this job yet.") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold text-ink flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(DollarSign, { size: 16, className: "text-rose-500" }),
                  tt("Direct Job Expenses & Materials")
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: tt("Cost of goods, fuel, parts, and vendor expenses linked to this job.") })
              ] }),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.expenses.index", { store_slug: storeSlug }) + `?service_job_id=${job.id}`,
                  className: "inline-flex items-center gap-1 text-xs font-semibold text-accent-text hover:underline",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: "Expenses Module" }),
                    /* @__PURE__ */ jsx(ExternalLink, { size: 12 })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              expenses.map((exp) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-center justify-between rounded-lg border border-line bg-app p-3 text-xs",
                  children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold text-ink", children: exp.description || exp.expense_category?.name || "Expense" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted", children: [
                        exp.expense_date,
                        " • ",
                        exp.expense_category?.name || "General"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "font-mono font-bold text-rose-600 dark:text-rose-400", children: [
                      "-",
                      formatCurrency(exp.amount)
                    ] })
                  ]
                },
                exp.id
              )),
              expenses.length === 0 && /* @__PURE__ */ jsx("p", { className: "py-4 text-center text-xs text-ink-muted", children: tt("No direct expenses linked to this job.") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-ink mb-3", children: tt("Job Audit Log & History") }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: (job.events || []).map((event) => {
              const Icon = EVENT_ICON[event.type] || AlertCircle;
              return /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-muted", children: /* @__PURE__ */ jsx(Icon, { size: 12 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-ink font-medium", children: event.body }),
                  /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-3xs text-ink-muted", children: [
                    event.user?.name ? `${event.user.name} · ` : "",
                    new Date(event.created_at).toLocaleString()
                  ] })
                ] })
              ] }, event.id);
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold text-ink flex items-center gap-2 mb-3", children: [
              /* @__PURE__ */ jsx(TrendingUp, { size: 16, className: "text-accent-text" }),
              tt("Job Financials & Margin")
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "text-ink-secondary", children: "Estimated / Billable Value" }),
                /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold text-ink", children: formatCurrency(revenueTotal) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "text-ink-secondary", children: "Direct Expenses Incurred" }),
                /* @__PURE__ */ jsxs("span", { className: "font-mono font-semibold text-rose-600 dark:text-rose-400", children: [
                  "-",
                  formatCurrency(expensesTotal)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "border-t border-line pt-2.5 flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink", children: tt("Net Job Margin") }),
                  /* @__PURE__ */ jsxs("p", { className: "text-3xs text-ink-muted", children: [
                    marginPercentage,
                    "% profit margin"
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `font-mono text-base font-black ${netMargin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`,
                    children: formatCurrency(netMargin)
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-ink mb-3", children: "Status Lifecycle" }),
            nextOptions.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
              tt("Job"),
              " is ",
              STATUS_META[job.status]?.label.toLowerCase() || job.status,
              ". ",
              tt("No forward transitions.")
            ] }) : /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: nextOptions.map((status) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => changeStatus(status),
                disabled: busy,
                className: "h-10 rounded-lg border border-line bg-app px-3.5 text-left text-xs font-semibold text-ink hover:bg-sunken hover:border-accent transition-colors disabled:opacity-50",
                children: [
                  "Mark as → ",
                  STATUS_META[status]?.label || status
                ]
              },
              status
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold text-ink flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(User, { size: 16, className: "text-accent-text" }),
                tt("Assigned Staff")
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setIsAssignModalOpen(true),
                  className: "text-xs font-semibold text-accent-text hover:underline",
                  children: "+ Assign"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              (job.assignments || []).map((a) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-center justify-between rounded-lg border border-line bg-app p-2.5 text-xs",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("div", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-accent-quiet text-3xs font-bold text-accent-text", children: a.employee?.name?.charAt(0) || "E" }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "font-semibold text-ink", children: a.employee?.name || tt("Staff") }),
                        /* @__PURE__ */ jsx("span", { className: "text-3xs uppercase tracking-wider text-ink-muted", children: a.role || "Primary" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleUnassign(a.employee_id),
                        className: "p-1 text-ink-muted hover:text-rose-600 transition-colors",
                        title: "Unassign",
                        children: /* @__PURE__ */ jsx(X, { size: 14 })
                      }
                    )
                  ]
                },
                a.id
              )),
              (!job.assignments || job.assignments.length === 0) && /* @__PURE__ */ jsx("p", { className: "py-2 text-center text-xs text-ink-muted", children: tt("No technician assigned yet.") })
            ] })
          ] })
        ] })
      ] })
    ] }),
    isAssignModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl animate-in fade-in zoom-in-95", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-ink mb-3", children: tt("Assign Technician to Job") }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleAssign, className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-2xs font-semibold uppercase text-ink-muted", children: tt("Technician") }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              required: true,
              value: assignForm.employee_id,
              onChange: (e) => setAssignForm({ ...assignForm, employee_id: e.target.value }),
              className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select an employee..." }),
                employees.map((emp) => /* @__PURE__ */ jsx("option", { value: emp.id, children: emp.name }, emp.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-2xs font-semibold uppercase text-ink-muted", children: "Role" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: assignForm.role,
              onChange: (e) => setAssignForm({ ...assignForm, role: e.target.value }),
              className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink",
              children: [
                /* @__PURE__ */ jsx("option", { value: "primary", children: "Primary Lead" }),
                /* @__PURE__ */ jsx("option", { value: "assistant", children: "Assistant" }),
                /* @__PURE__ */ jsx("option", { value: "specialist", children: "Specialist" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsAssignModalOpen(false),
              className: "rounded-lg border border-line px-3 py-1.5 text-xs text-ink-secondary",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "rounded-lg bg-accent-fill px-4 py-1.5 text-xs font-semibold text-accent-on shadow-glow",
              children: "Assign"
            }
          )
        ] })
      ] })
    ] }) }),
    isCheckoutToolModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl animate-in fade-in zoom-in-95", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-ink mb-3", children: tt("Check Out Tool for Job") }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCheckoutTool, className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-2xs font-semibold uppercase text-ink-muted", children: "Select Tool" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              required: true,
              value: checkoutToolForm.tool_id,
              onChange: (e) => setCheckoutToolForm({ ...checkoutToolForm, tool_id: e.target.value }),
              className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select equipment..." }),
                tools.map((t) => /* @__PURE__ */ jsxs("option", { value: t.id, children: [
                  t.name,
                  " (",
                  t.status,
                  ")"
                ] }, t.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-2xs font-semibold uppercase text-ink-muted", children: "Quantity" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: "1",
              value: checkoutToolForm.quantity,
              onChange: (e) => setCheckoutToolForm({ ...checkoutToolForm, quantity: e.target.value }),
              className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsCheckoutToolModalOpen(false),
              className: "rounded-lg border border-line px-3 py-1.5 text-xs text-ink-secondary",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "rounded-lg bg-accent-fill px-4 py-1.5 text-xs font-semibold text-accent-on shadow-glow",
              children: "Check Out"
            }
          )
        ] })
      ] })
    ] }) }),
    isScheduleModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl animate-in fade-in zoom-in-95", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-ink mb-3", children: tt("Update Job Schedule") }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleUpdateSchedule, className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-2xs font-semibold uppercase text-ink-muted", children: "Scheduled Date" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: scheduleForm.scheduled_for,
              onChange: (e) => setScheduleForm({ ...scheduleForm, scheduled_for: e.target.value }),
              className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-2xs font-semibold uppercase text-ink-muted", children: "Start Date & Time" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "datetime-local",
              value: scheduleForm.scheduled_start_at ? scheduleForm.scheduled_start_at.substring(0, 16) : "",
              onChange: (e) => setScheduleForm({ ...scheduleForm, scheduled_start_at: e.target.value }),
              className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsScheduleModalOpen(false),
              className: "rounded-lg border border-line px-3 py-1.5 text-xs text-ink-secondary",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "rounded-lg bg-accent-fill px-4 py-1.5 text-xs font-semibold text-accent-on shadow-glow",
              children: "Save Schedule"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  ServiceJobDetail as default
};

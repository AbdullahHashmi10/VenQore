import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import ServiceNavTabs from "./ServiceNavTabs-C0mnPWx8.js";
import { Plus, Search, User, Calendar, Wrench } from "lucide-react";
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
  scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  on_hold: { label: "On Hold", className: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
  awaiting_parts: { label: "Awaiting Parts", className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  invoiced: { label: "Invoiced", className: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" }
};
function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, className: "bg-sunken text-ink-secondary" };
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold ${meta.className}`, children: meta.label });
}
function ServiceJobs({ jobs, filters = {}, stats = {} }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "");
  const [search, setSearch] = useState(filters.search || "");
  const tt = useTermText();
  const runSearch = (e) => {
    if (e.key !== "Enter") return;
    router.get(route("store.service-jobs.index", { store_slug: storeSlug }), { search, status: filters.status }, {
      preserveState: true,
      preserveScroll: true
    });
  };
  const setStatusFilter = (status) => {
    router.get(route("store.service-jobs.index", { store_slug: storeSlug }), { search, status }, {
      preserveState: true,
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: tt("Service Jobs"), activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: tt("Service Jobs") }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-6 sm:px-6", children: [
      /* @__PURE__ */ jsx(ServiceNavTabs, { active: "jobs" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight text-ink", children: tt("Work Orders & Service Jobs") }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-secondary", children: tt("Track client work orders, technician dispatches, and billing status.") })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.service-jobs.create", { store_slug: storeSlug }),
            className: "inline-flex h-10 items-center gap-2 rounded-lg bg-accent-fill px-4 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-fast ease-standard hover:bg-accent-fill-hover",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 16 }),
              tt("New Work Order")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-4 shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: tt("Active Work Orders") }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-ink", children: stats.open ?? 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-4 shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Completed" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: stats.completed ?? 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-4 shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Invoiced & Settled" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-accent-text", children: stats.invoiced ?? 0 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
          /* @__PURE__ */ jsx(Search, { size: 15, className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              onKeyDown: runSearch,
              placeholder: tt("Search by job #, service title, customer name or phone..."),
              className: "h-10 w-full rounded-lg border border-line bg-app pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
            }
          )
        ] }),
        ["", "scheduled", "in_progress", "completed", "invoiced"].map((s) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setStatusFilter(s),
            className: `h-10 rounded-lg border px-3 text-xs font-semibold transition-colors duration-fast ease-standard ${(filters.status || "") === s ? "border-accent bg-accent-quiet text-accent-text" : "border-line bg-surface text-ink-secondary hover:bg-sunken"}`,
            children: s === "" ? "All Statuses" : STATUS_META[s]?.label || s
          },
          s || "all"
        ))
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 overflow-x-auto rounded-xl border border-line bg-surface shadow-sm", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line bg-sunken/40 text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: tt("Job / Order") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: tt("Customer") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Assigned Tech" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Schedule" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Est. Value" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-line", children: [
          (jobs.data || []).map((job) => {
            const tech = job.assignments?.[0]?.employee?.name;
            return /* @__PURE__ */ jsxs("tr", { className: "transition-colors duration-fast ease-standard hover:bg-sunken/40", children: [
              /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5", children: [
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    href: route("store.service-jobs.show", { store_slug: storeSlug, serviceJob: job.id }),
                    className: "font-semibold text-ink hover:text-accent-text",
                    children: job.number
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-ink-muted", children: job.title })
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5 text-ink-secondary", children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-ink", children: job.party?.name || "Walk-in" }),
                job.party?.phone && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: job.party.phone })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5 text-ink-secondary", children: tech ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 text-xs font-medium text-ink", children: [
                /* @__PURE__ */ jsx(User, { size: 13, className: "text-accent-text" }),
                tech
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted italic", children: "Unassigned" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5", children: /* @__PURE__ */ jsx(StatusBadge, { status: job.status }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5 text-ink-secondary", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
                /* @__PURE__ */ jsx(Calendar, { size: 13, className: "text-ink-muted" }),
                /* @__PURE__ */ jsx("span", { children: job.scheduled_start_at ? new Date(job.scheduled_start_at).toLocaleDateString() : job.scheduled_for || "—" })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5 text-right font-mono font-medium text-ink", children: job.estimated_total ? formatCurrency(job.estimated_total) : "—" })
            ] }, job.id);
          }),
          (jobs.data || []).length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 6, className: "px-4 py-12 text-center", children: [
            /* @__PURE__ */ jsx(Wrench, { size: 26, className: "mx-auto text-ink-muted/50 mb-2" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-ink", children: tt("No service work orders found") }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-secondary", children: tt("Create a new work order or book via the Dispatch Calendar.") }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.service-jobs.create", { store_slug: storeSlug }),
                className: "mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-text hover:underline",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  " ",
                  tt("Create Work Order")
                ]
              }
            )
          ] }) })
        ] })
      ] }) }),
      jobs.links && jobs.links.length > 3 && /* @__PURE__ */ jsx("div", { className: "mt-4 flex flex-wrap items-center gap-1.5", children: jobs.links.map((link, i) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          disabled: !link.url,
          onClick: () => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true }),
          className: `h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition-colors duration-fast ease-standard ${link.active ? "bg-accent-fill text-accent-on" : "text-ink-secondary hover:bg-sunken disabled:opacity-40 border border-line"}`,
          dangerouslySetInnerHTML: { __html: link.label }
        },
        i
      )) })
    ] })
  ] });
}
export {
  ServiceJobs as default
};

import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { usePage, Link, Head, router } from "@inertiajs/react";
import { Package, UserPlus, Wallet, ShoppingCart, Plus, AlertTriangle, ArrowUpRight, ArrowDownRight, GripVertical, ChevronUp, ChevronDown, X, Search, RotateCcw, Check, Settings2, LayoutGrid } from "lucide-react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { f as formatCurrency, b as formatNumber } from "./format-131Nyq79.js";
import { r as role } from "./runtime-DwSFgQZq.js";
import "react-dom";
import "./plans-CxabWI_P.js";
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
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function usePermission() {
  const { auth } = usePage().props;
  const userPerms = auth?.user?.permissions || [];
  const role2 = auth?.user?.role;
  const isAdmin = role2 === "platform_admin" || role2 === "admin" || role2 === "owner" || Boolean(auth?.user?.is_platform_admin);
  const hasPerm = (...keys) => {
    if (isAdmin) return true;
    return keys.some((k) => userPerms.some((p) => p === k || p.startsWith(k + ".")));
  };
  return {
    hasPerm,
    isAdmin,
    role: role2,
    permissions: userPerms
  };
}
function Metric({ value, caption, delta, deltaLabel }) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = hasDelta && delta >= 0;
  return /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col justify-center", children: [
    /* @__PURE__ */ jsx("p", { className: "font-numeric text-3xl font-semibold tabular-nums tracking-tight text-ink", children: value }),
    (caption || hasDelta) && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1", children: [
      hasDelta && /* @__PURE__ */ jsxs(
        "span",
        {
          className: [
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-2xs font-semibold",
            positive ? "bg-success-500/12 text-success-600" : "bg-danger-500/12 text-danger-600"
          ].join(" "),
          children: [
            positive ? /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-3 w-3", "aria-hidden": "true" }) : /* @__PURE__ */ jsx(ArrowDownRight, { className: "h-3 w-3", "aria-hidden": "true" }),
            Math.abs(delta),
            "%"
          ]
        }
      ),
      (deltaLabel || caption) && /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: deltaLabel || caption })
    ] })
  ] });
}
function Empty({ children }) {
  return /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center px-2 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children }) });
}
function Rows({ items, renderItem, empty }) {
  if (!items?.length) return /* @__PURE__ */ jsx(Empty, { children: empty });
  return /* @__PURE__ */ jsx("ul", { className: "-mx-1 h-full space-y-1 overflow-y-auto overscroll-contain px-1", children: items.map((item, index) => /* @__PURE__ */ jsx("li", { children: renderItem(item) }, item.id ?? item.name ?? index)) });
}
function RowLine({ label, sublabel, value, tone = "ink" }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-interactive-hover", children: [
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "truncate text-sm text-ink", children: label }),
      sublabel && /* @__PURE__ */ jsx("p", { className: "truncate text-2xs text-ink-muted", children: sublabel })
    ] }),
    /* @__PURE__ */ jsx(
      "p",
      {
        className: [
          "shrink-0 font-numeric text-sm font-medium tabular-nums",
          tone === "danger" ? "text-danger-600" : "text-ink-secondary"
        ].join(" "),
        children: value
      }
    )
  ] });
}
const money = (value) => formatCurrency(value ?? 0);
const renderers = {
  revenue_today: ({ data }) => /* @__PURE__ */ jsx(
    Metric,
    {
      value: money(data.value),
      delta: data.change_pct,
      deltaLabel: data.label
    }
  ),
  net_profit: ({ data }) => /* @__PURE__ */ jsx(Metric, { value: money(data.value), caption: data.label }),
  expenses: ({ data }) => /* @__PURE__ */ jsx(
    Metric,
    {
      value: money(data.value),
      delta: typeof data.change_pct === "number" ? -data.change_pct : null,
      deltaLabel: data.label
    }
  ),
  cash_position: ({ data }) => /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col justify-center", children: [
    /* @__PURE__ */ jsx(Metric, { value: money(data.value) }),
    /* @__PURE__ */ jsxs("dl", { className: "mt-3 grid grid-cols-2 gap-2 text-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-sunken px-2 py-1.5", children: [
        /* @__PURE__ */ jsx("dt", { className: "text-ink-muted", children: "Cash" }),
        /* @__PURE__ */ jsx("dd", { className: "font-numeric tabular-nums text-ink", children: money(data.cash) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-sunken px-2 py-1.5", children: [
        /* @__PURE__ */ jsx("dt", { className: "text-ink-muted", children: "Bank" }),
        /* @__PURE__ */ jsx("dd", { className: "font-numeric tabular-nums text-ink", children: money(data.bank) })
      ] })
    ] })
  ] }),
  receivables: ({ data }) => /* @__PURE__ */ jsx(Metric, { value: money(data.value), caption: "Owed to you" }),
  payables: ({ data }) => /* @__PURE__ */ jsx(Metric, { value: money(data.value), caption: "You owe" }),
  inventory_value: ({ data }) => /* @__PURE__ */ jsx(Metric, { value: money(data.value), caption: "Stock on hand" }),
  customer_count: ({ data }) => /* @__PURE__ */ jsx(
    Metric,
    {
      value: formatNumber(data.value ?? 0),
      caption: `${formatNumber(data.new_this_month ?? 0)} ${data.label}`
    }
  ),
  open_orders: ({ data }) => /* @__PURE__ */ jsx(Metric, { value: formatNumber(data.value ?? 0), caption: data.label }),
  production_output: ({ data }) => /* @__PURE__ */ jsx(Metric, { value: formatNumber(data.value ?? 0), caption: data.label }),
  sales_summary: ({ data }) => /* @__PURE__ */ jsx("div", { className: "grid h-full grid-cols-3 items-center gap-2", children: ["today", "month", "year"].map((period) => /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
    /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase tracking-wide text-ink-muted", children: period }),
    /* @__PURE__ */ jsx("p", { className: "truncate font-numeric text-base font-semibold tabular-nums text-ink", children: money(data[period]?.revenue) }),
    /* @__PURE__ */ jsxs("p", { className: "truncate text-2xs text-ink-muted", children: [
      money(data[period]?.gross_profit),
      " profit"
    ] })
  ] }, period)) }),
  /**
   * The one chart.
   *
   * Colours come from `role` in theme/runtime rather than from classes,
   * because Recharts passes `stroke` and `fill` straight through as SVG
   * presentation attributes, where `var()` is not valid. This is the documented
   * escape hatch and the only place in this file that needs it.
   */
  revenue_trend: ({ data }) => {
    if (!data.series?.length) return /* @__PURE__ */ jsx(Empty, { children: "No revenue recorded yet." });
    return /* @__PURE__ */ jsx("div", { className: "h-full min-h-0 w-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: data.series, margin: { top: 6, right: 4, left: -22, bottom: 0 }, children: [
      /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "vqRevenueFill", x1: "0", y1: "0", x2: "0", y2: "1", children: [
        /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: role.brand[500], stopOpacity: 0.28 }),
        /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: role.brand[500], stopOpacity: 0 })
      ] }) }),
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: role.neutral[300], strokeOpacity: 0.35, vertical: false }),
      /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: { fontSize: 11, fill: role.neutral[500] }, tickLine: false, axisLine: false }),
      /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 11, fill: role.neutral[500] }, tickLine: false, axisLine: false, width: 54 }),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          formatter: (value) => money(value),
          contentStyle: {
            borderRadius: 12,
            border: `1px solid ${role.neutral[300]}`,
            fontSize: 12
          }
        }
      ),
      /* @__PURE__ */ jsx(
        Area,
        {
          type: "monotone",
          dataKey: "revenue",
          stroke: role.brand[500],
          strokeWidth: 2,
          fill: "url(#vqRevenueFill)"
        }
      ),
      /* @__PURE__ */ jsx(
        Area,
        {
          type: "monotone",
          dataKey: "profit",
          stroke: role.success[500],
          strokeWidth: 2,
          fill: "none"
        }
      )
    ] }) }) });
  },
  low_stock: ({ data }) => /* @__PURE__ */ jsx(
    Rows,
    {
      items: data.rows,
      empty: "Everything is above its alert level.",
      renderItem: (item) => /* @__PURE__ */ jsx(
        RowLine,
        {
          label: item.name,
          sublabel: item.sku,
          value: `${formatNumber(item.quantity)} / ${formatNumber(item.threshold)}`,
          tone: "danger"
        }
      )
    }
  ),
  top_products: ({ data }) => /* @__PURE__ */ jsx(
    Rows,
    {
      items: data.rows,
      empty: "No sales this month yet.",
      renderItem: (item) => /* @__PURE__ */ jsx(
        RowLine,
        {
          label: item.name,
          sublabel: `${formatNumber(item.quantity)} sold`,
          value: money(item.value)
        }
      )
    }
  ),
  top_customers: ({ data }) => /* @__PURE__ */ jsx(
    Rows,
    {
      items: data.rows,
      empty: "No customer sales this month yet.",
      renderItem: (item) => /* @__PURE__ */ jsx(RowLine, { label: item.name, value: money(item.value) })
    }
  ),
  recent_purchases: ({ data }) => /* @__PURE__ */ jsx(
    Rows,
    {
      items: data.rows,
      empty: "No purchases recorded yet.",
      renderItem: (item) => /* @__PURE__ */ jsx(RowLine, { label: item.reference, sublabel: item.date, value: money(item.value) })
    }
  ),
  active_staff: ({ data }) => /* @__PURE__ */ jsx(
    Rows,
    {
      items: data.rows,
      empty: "Nobody is clocked in.",
      renderItem: (item) => /* @__PURE__ */ jsx(
        RowLine,
        {
          label: item.name,
          value: item.since ? new Date(item.since).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"
        }
      )
    }
  ),
  ai_insights: ({ data }) => /* @__PURE__ */ jsx(
    Rows,
    {
      items: data.rows,
      empty: "No new insights right now.",
      renderItem: (item) => /* @__PURE__ */ jsx(RowLine, { label: item.title, sublabel: item.priority, value: "" })
    }
  ),
  needs_attention: ({ data }) => {
    if (!data.items?.length) {
      return /* @__PURE__ */ jsx(Empty, { children: "Nothing needs you right now." });
    }
    return /* @__PURE__ */ jsx("ul", { className: "h-full space-y-2 overflow-y-auto overscroll-contain", children: data.items.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2.5", children: [
      /* @__PURE__ */ jsx("span", { className: "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-warning-500/12 text-warning-600", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3.5 w-3.5", "aria-hidden": "true" }) }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-secondary", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: item.amount !== void 0 ? money(item.amount) : formatNumber(item.count ?? 0) }),
        "",
        item.label
      ] })
    ] }, item.kind)) });
  },
  /**
   * Quick actions.
   *
   * The server sends the candidate actions and the permission each one needs;
   * the client filters with the same `usePermission` hook the rest of the app
   * uses. Showing a button that leads to a 403 is worse than showing nothing.
   */
  quick_actions: ({ data }) => {
    const { hasPerm } = usePermission();
    const { props } = usePage();
    const storeSlug = props.store?.slug;
    const icons = {
      sale: ShoppingCart,
      expense: Wallet,
      customer: UserPlus,
      product: Package
    };
    const routes = {
      sale: "store.pos",
      expense: "store.expenses.index",
      customer: "store.parties.index",
      product: "store.inventory.index"
    };
    const actions = (data.actions || []).filter((action) => {
      const [group] = action.permission.split(".");
      return hasPerm(action.permission) || hasPerm(group);
    });
    if (!actions.length) return /* @__PURE__ */ jsx(Empty, { children: "No quick actions available." });
    const href = (key) => {
      try {
        return route(routes[key], { store_slug: storeSlug });
      } catch {
        return null;
      }
    };
    return /* @__PURE__ */ jsx("div", { className: "grid h-full grid-cols-2 content-center gap-2 sm:grid-cols-4", children: actions.map((action) => {
      const Icon = icons[action.key] || Plus;
      const target = href(action.key);
      if (!target) return null;
      return /* @__PURE__ */ jsxs(
        Link,
        {
          href: target,
          className: "flex min-h-control-lg flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-app px-2 py-3 text-center transition-colors hover:bg-interactive-hover",
          children: [
            /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-brand-500", "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-medium leading-tight text-ink", children: action.label })
          ]
        },
        action.key
      );
    }) });
  }
};
function WidgetBody({ id, state }) {
  if (!state) {
    return /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col justify-center gap-2", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsx("div", { className: "h-7 w-2/3 animate-pulse rounded-lg bg-sunken" }),
      /* @__PURE__ */ jsx("div", { className: "h-3 w-1/3 animate-pulse rounded bg-sunken" })
    ] });
  }
  if (!state.ok) {
    return /* @__PURE__ */ jsx(Empty, { children: state.error || "This card could not be loaded." });
  }
  const Renderer = renderers[id];
  if (!Renderer) {
    return /* @__PURE__ */ jsx(Empty, { children: "Nothing to show yet." });
  }
  return /* @__PURE__ */ jsx(Renderer, { data: state.data || {} });
}
const SIZE_LABELS = {
  small: "S",
  medium: "M",
  large: "L",
  full: "Full"
};
function WidgetCard({
  widget,
  state,
  editing,
  onRemove,
  onResize,
  // Mobile reordering. On a phone there is no grid to drag within, so position
  // is changed with buttons — a real control rather than a drag target too
  // small to hit reliably.
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) {
  const sizes = widget.sizes || [];
  return /* @__PURE__ */ jsxs(
    "article",
    {
      className: [
        "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-surface transition-shadow",
        editing ? "border-dashed border-brand-500/60 shadow-sm" : "border-line"
      ].join(" "),
      children: [
        /* @__PURE__ */ jsxs("header", { className: "flex shrink-0 items-center gap-2 px-4 pt-3.5", children: [
          editing && /* @__PURE__ */ jsx(
            "span",
            {
              className: "vq-drag-handle hidden cursor-grab touch-none text-ink-faint hover:text-ink-muted active:cursor-grabbing lg:block",
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsx(GripVertical, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsx("h3", { className: "min-w-0 flex-1 truncate text-2xs font-semibold uppercase tracking-wide text-ink-muted", children: widget.title }),
          editing && /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onMoveUp,
                disabled: !canMoveUp,
                "aria-label": `Move ${widget.title} up`,
                className: "flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-interactive-hover disabled:opacity-30 lg:hidden",
                children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4", "aria-hidden": "true" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onMoveDown,
                disabled: !canMoveDown,
                "aria-label": `Move ${widget.title} down`,
                className: "flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-interactive-hover disabled:opacity-30 lg:hidden",
                children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4", "aria-hidden": "true" })
              }
            ),
            sizes.length > 1 && /* @__PURE__ */ jsx("div", { className: "hidden items-center gap-0.5 rounded-lg bg-sunken p-0.5 lg:flex", children: sizes.map((size) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => onResize(size),
                "aria-pressed": widget.size === size,
                "aria-label": `Set ${widget.title} to ${size}`,
                className: [
                  "rounded px-1.5 py-0.5 text-2xs font-semibold transition-colors",
                  widget.size === size ? "bg-surface text-ink shadow-xs" : "text-ink-muted hover:text-ink"
                ].join(" "),
                children: SIZE_LABELS[size] || size
              },
              size
            )) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onRemove,
                "aria-label": `Remove ${widget.title}`,
                className: "flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-danger-500/10 hover:text-danger-600",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4", "aria-hidden": "true" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 px-4 pb-4 pt-2", children: /* @__PURE__ */ jsx(WidgetBody, { id: widget.id, state }) })
      ]
    }
  );
}
function WidgetLibrary({ open, catalog, activeIds, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const addable = catalog.filter((widget) => {
      if (activeIds.includes(widget.id)) return false;
      if (!needle) return true;
      return widget.title.toLowerCase().includes(needle) || widget.description.toLowerCase().includes(needle) || widget.category.toLowerCase().includes(needle);
    });
    return addable.reduce((accumulator, widget) => {
      (accumulator[widget.category] ||= []).push(widget);
      return accumulator;
    }, {});
  }, [catalog, activeIds, query]);
  if (!open) return null;
  const categories = Object.keys(groups);
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex", role: "dialog", "aria-modal": "true", "aria-label": "Add a card", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: onClose,
        "aria-label": "Close",
        className: "absolute inset-0 bg-scrim/50 backdrop-blur-[2px]"
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: [
          "relative ml-auto flex w-full flex-col bg-surface shadow-xl",
          // Phone: a sheet anchored to the bottom, capped so the page
          // behind stays visible — a full-screen takeover loses the
          // context of what you are adding to.
          "mt-auto max-h-[85vh] rounded-t-2xl",
          // Desktop: a proper side drawer.
          "sm:mt-0 sm:h-full sm:max-h-none sm:w-[26rem] sm:rounded-none sm:rounded-l-2xl"
        ].join(" "),
        children: [
          /* @__PURE__ */ jsxs("header", { className: "shrink-0 border-b border-line px-5 pb-3 pt-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-ink", children: "Add a card" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  "aria-label": "Close",
                  className: "flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-interactive-hover",
                  children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4", "aria-hidden": "true" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative mt-3", children: [
              /* @__PURE__ */ jsx(
                Search,
                {
                  className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "search",
                  value: query,
                  onChange: (event) => setQuery(event.target.value),
                  placeholder: "Search cards",
                  "aria-label": "Search cards",
                  className: "min-h-control-md w-full rounded-xl border border-line bg-app pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-0"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4", children: [
            categories.length === 0 && /* @__PURE__ */ jsx("p", { className: "py-10 text-center text-sm text-ink-muted", children: query ? "No cards match that search." : "Every card available to you is already on your dashboard." }),
            categories.map((category) => /* @__PURE__ */ jsxs("section", { className: "mb-6 last:mb-0", children: [
              /* @__PURE__ */ jsx("h3", { className: "mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-muted", children: category }),
              /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: groups[category].map((widget) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => onAdd(widget.id),
                  className: "flex w-full items-start gap-3 rounded-xl border border-line bg-app p-3 text-left transition-colors hover:bg-interactive-hover",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/12 text-brand-500", children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4", "aria-hidden": "true" }) }),
                    /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsx("span", { className: "block truncate text-sm font-medium text-ink", children: widget.title }),
                      /* @__PURE__ */ jsx("span", { className: "mt-0.5 block text-xs leading-snug text-ink-muted", children: widget.description })
                    ] })
                  ]
                }
              ) }, widget.id)) })
            ] }, category))
          ] })
        ]
      }
    )
  ] });
}
const ROW_HEIGHT = 84;
const MARGIN = [16, 16];
const BREAKPOINTS = { lg: 1024, md: 768, sm: 0 };
const COLUMNS = { lg: 12, md: 6, sm: 1 };
let ResponsiveGrid = null;
const byPosition = (a, b) => a.y - b.y || a.x - b.x;
function greeting(date = /* @__PURE__ */ new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
function WorkspaceDashboard({ catalog, sizePresets, layout: initialLayout, greetingName }) {
  const { props } = usePage();
  const storeSlug = props.store?.slug;
  const [layout, setLayout] = useState(initialLayout || []);
  const [editing, setEditing] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [widgetState, setWidgetState] = useState({});
  const [gridReady, setGridReady] = useState(Boolean(ResponsiveGrid));
  const catalogById = useMemo(
    () => Object.fromEntries(catalog.map((widget) => [widget.id, widget])),
    [catalog]
  );
  const ordered = useMemo(() => [...layout].sort(byPosition), [layout]);
  const activeIds = useMemo(() => layout.map((item) => item.widget), [layout]);
  useEffect(() => {
    if (ResponsiveGrid || typeof window === "undefined") return;
    if (window.innerWidth < BREAKPOINTS.lg) return;
    let cancelled = false;
    import("react-grid-layout").then(({ Responsive, WidthProvider }) => {
      if (cancelled) return;
      ResponsiveGrid = WidthProvider(Responsive);
      setGridReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const inFlight = useRef(/* @__PURE__ */ new Set());
  const fetchWidgets = useCallback((ids) => {
    const wanted = ids.filter((id) => !inFlight.current.has(id));
    if (!wanted.length || !storeSlug) return;
    wanted.forEach((id) => inFlight.current.add(id));
    fetch(route("store.workspace.data", { store_slug: storeSlug }), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || ""
      },
      body: JSON.stringify({ widgets: wanted })
    }).then((response) => response.ok ? response.json() : Promise.reject(response)).then((payload) => {
      setWidgetState((previous) => ({ ...previous, ...payload.widgets }));
    }).catch(() => {
      setWidgetState((previous) => ({
        ...previous,
        ...Object.fromEntries(wanted.map((id) => [id, { ok: false, error: "Could not load. Check your connection." }]))
      }));
    }).finally(() => {
      wanted.forEach((id) => inFlight.current.delete(id));
    });
  }, [storeSlug]);
  useEffect(() => {
    const missing = activeIds.filter((id) => !(id in widgetState));
    if (missing.length) fetchWidgets(missing);
  }, [activeIds, widgetState, fetchWidgets]);
  const saveTimer = useRef(null);
  const [saved, setSaved] = useState(false);
  const persist = useCallback((next, { immediate = false } = {}) => {
    if (!storeSlug) return;
    clearTimeout(saveTimer.current);
    const send = () => {
      fetch(route("store.workspace.layout.save", { store_slug: storeSlug }), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || ""
        },
        body: JSON.stringify({ layout: next })
      }).then((response) => response.ok ? response.json() : Promise.reject(response)).then((payload) => {
        if (Array.isArray(payload.layout)) setLayout(payload.layout);
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      }).catch(() => {
      });
    };
    if (immediate) send();
    else saveTimer.current = setTimeout(send, 700);
  }, [storeSlug]);
  useEffect(() => () => clearTimeout(saveTimer.current), []);
  const applyLayout = useCallback((next) => {
    setLayout(next);
    persist(next);
  }, [persist]);
  const addWidget = (id) => {
    const widget = catalogById[id];
    if (!widget || activeIds.includes(id)) return;
    const size = widget.default_size;
    const preset = sizePresets[size] || sizePresets.small;
    const bottom = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    applyLayout([...layout, { widget: id, x: 0, y: bottom, w: preset.w, h: preset.h, size }]);
    setLibraryOpen(false);
  };
  const removeWidget = (id) => applyLayout(layout.filter((item) => item.widget !== id));
  const resizeWidget = (id, size) => {
    const preset = sizePresets[size];
    if (!preset) return;
    applyLayout(layout.map((item) => item.widget === id ? { ...item, w: preset.w, h: preset.h, size } : item));
  };
  const moveWidget = (id, direction) => {
    const sorted = [...layout].sort(byPosition);
    const index = sorted.findIndex((item) => item.widget === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    applyLayout(layout.map((item) => {
      if (item.widget === a.widget) return { ...item, x: b.x, y: b.y };
      if (item.widget === b.widget) return { ...item, x: a.x, y: a.y };
      return item;
    }));
  };
  const finishEditing = () => {
    setEditing(false);
    persist(layout, { immediate: true });
  };
  const resetLayout = () => {
    if (!storeSlug) return;
    if (!window.confirm("Reset your dashboard to the default arrangement? Your cards will be replaced.")) return;
    router.post(
      route("store.workspace.layout.reset", { store_slug: storeSlug }),
      {},
      {
        preserveScroll: true,
        onSuccess: () => router.reload({ only: ["layout"] })
      }
    );
  };
  const gridLayouts = useMemo(() => ({
    lg: layout.map((item) => ({
      i: item.widget,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      // Below these, content clips rather than reflows. Enforced here as
      // well as by the size presets, because a drag-resize can otherwise
      // reach sizes no preset offers.
      minW: 3,
      minH: 2
    }))
  }), [layout]);
  const onGridChange = (next) => {
    if (!editing) return;
    const positions = Object.fromEntries(next.map((item) => [item.i, item]));
    const merged = layout.map((item) => {
      const position = positions[item.widget];
      return position ? { ...item, x: position.x, y: position.y, w: position.w, h: position.h } : item;
    });
    const changed = merged.some((item, index) => item.x !== layout[index].x || item.y !== layout[index].y);
    if (changed) applyLayout(merged);
  };
  const useGrid = gridReady && ResponsiveGrid;
  const cardProps = (item, index, total) => ({
    widget: { ...catalogById[item.widget], id: item.widget, size: item.size },
    state: widgetState[item.widget],
    editing,
    onRemove: () => removeWidget(item.widget),
    onResize: (size) => resizeWidget(item.widget, size),
    onMoveUp: () => moveWidget(item.widget, -1),
    onMoveDown: () => moveWidget(item.widget, 1),
    canMoveUp: index > 0,
    canMoveDown: index < total - 1
  });
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Dashboard", title: "Dashboard", noPadding: true, children: [
    /* @__PURE__ */ jsx(Head, { title: "Dashboard" }),
    /* @__PURE__ */ jsx("style", { children: `
                .vq-workspace .react-grid-item.react-grid-placeholder {
                    background: rgb(var(--vq-ramp-brand-500) / 0.16);
                    border: 1px dashed rgb(var(--vq-ramp-brand-500) / 0.5);
                    border-radius: var(--vq-radius-2xl);
                    opacity: 1;
                }
                .vq-workspace .react-resizable-handle {
                    opacity: 0;
                    transition: opacity var(--vq-duration-fast) var(--vq-ease-standard);
                }
                .vq-workspace.is-editing .react-resizable-handle { opacity: 0.55; }
                .vq-workspace.is-editing .react-grid-item:hover .react-resizable-handle { opacity: 1; }
` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-page px-4 py-5 sm:px-6 lg:py-7", children: [
      /* @__PURE__ */ jsxs("header", { className: "mb-5 flex flex-wrap items-end justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("h1", { className: "truncate text-xl font-semibold text-ink sm:text-2xl", children: [
            greeting(),
            greetingName ? `, ${greetingName.split(" ")[0]}` : ""
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-sm text-ink-muted", children: [
            props.store?.name,
            " ·",
            (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-2", children: [
          editing && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setLibraryOpen(true),
                className: "inline-flex min-h-control-md items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-medium text-ink-inverted transition-colors hover:bg-brand-700",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4", "aria-hidden": "true" }),
                  "Add card"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: resetLayout,
                "aria-label": "Reset to default layout",
                className: "inline-flex min-h-control-md items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-interactive-hover",
                children: [
                  /* @__PURE__ */ jsx(RotateCcw, { className: "h-4 w-4", "aria-hidden": "true" }),
                  /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Reset" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: editing ? finishEditing : () => setEditing(true),
              className: [
                "inline-flex min-h-control-md items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors",
                editing ? "bg-success-600 text-ink-inverted hover:bg-success-700" : "border border-line text-ink-secondary hover:bg-interactive-hover"
              ].join(" "),
              children: editing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Check, { className: "h-4 w-4", "aria-hidden": "true" }),
                "Done"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Settings2, { className: "h-4 w-4", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Edit dashboard" }),
                /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Edit" })
              ] })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mb-3 h-4 text-xs text-success-600", "aria-live": "polite", children: saved ? "Layout saved" : "" }),
      ordered.length === 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center", children: [
        /* @__PURE__ */ jsx(LayoutGrid, { className: "mx-auto h-7 w-7 text-ink-faint", "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 text-base font-semibold text-ink", children: "Your dashboard is empty" }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-1 max-w-sm text-sm text-ink-muted", children: "Add the cards that matter to your business. You can rearrange or remove them at any time." }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              setEditing(true);
              setLibraryOpen(true);
            },
            className: "mt-5 inline-flex min-h-control-md items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-medium text-ink-inverted hover:bg-brand-700",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4", "aria-hidden": "true" }),
              "Add your first card"
            ]
          }
        )
      ] }),
      ordered.length > 0 && /* @__PURE__ */ jsx("div", { className: `vq-workspace lg:hidden ${editing ? "is-editing" : ""}`, children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: ordered.map((item, index) => /* @__PURE__ */ jsx(
        "div",
        {
          style: { minHeight: item.h >= 4 ? 320 : 168 },
          children: /* @__PURE__ */ jsx(WidgetCard, { ...cardProps(item, index, ordered.length) })
        },
        item.widget
      )) }) }),
      ordered.length > 0 && /* @__PURE__ */ jsx("div", { className: `vq-workspace hidden lg:block ${editing ? "is-editing" : ""}`, children: useGrid ? /* @__PURE__ */ jsx(
        ResponsiveGrid,
        {
          className: "-mx-2",
          layouts: gridLayouts,
          breakpoints: BREAKPOINTS,
          cols: COLUMNS,
          rowHeight: ROW_HEIGHT,
          margin: MARGIN,
          containerPadding: [8, 0],
          isDraggable: editing,
          isResizable: editing,
          draggableHandle: ".vq-drag-handle",
          compactType: "vertical",
          preventCollision: false,
          onDragStop: onGridChange,
          onResizeStop: onGridChange,
          children: ordered.map((item, index) => /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(WidgetCard, { ...cardProps(item, index, ordered.length) }) }, item.widget))
        }
      ) : (
        // Shown for the moment before the grid module resolves.
        // Same cards, same order, so nothing jumps when it swaps.
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-12 gap-4", children: ordered.map((item, index) => /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              gridColumn: `span ${item.w} / span ${item.w}`,
              minHeight: item.h * ROW_HEIGHT + (item.h - 1) * MARGIN[1]
            },
            children: /* @__PURE__ */ jsx(WidgetCard, { ...cardProps(item, index, ordered.length) })
          },
          item.widget
        )) })
      ) })
    ] }),
    /* @__PURE__ */ jsx(
      WidgetLibrary,
      {
        open: libraryOpen,
        catalog,
        activeIds,
        onAdd: addWidget,
        onClose: () => setLibraryOpen(false)
      }
    )
  ] });
}
export {
  WorkspaceDashboard as default
};
